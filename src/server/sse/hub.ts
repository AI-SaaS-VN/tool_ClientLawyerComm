type CaseSubscriber = { userId: string; send(chunk: string): void; close(): void };

const caseSubscribers = new Map<string, Set<CaseSubscriber>>();

// In-process fan-out; the monolith runs a single Node process. Each
// subscriber carries its user id so a revocation can force-close that
// member's live connections (REQ-PM-08).
export function subscribeCase(
  caseId: string,
  userId: string,
  subscriber: Omit<CaseSubscriber, "userId">,
): () => void {
  let set = caseSubscribers.get(caseId);
  if (!set) {
    set = new Set();
    caseSubscribers.set(caseId, set);
  }
  const entry: CaseSubscriber = { userId, ...subscriber };
  set.add(entry);
  return () => {
    set.delete(entry);
    if (set.size === 0) caseSubscribers.delete(caseId);
  };
}

export function publishToCase(caseId: string, event: string, data: string): void {
  const set = caseSubscribers.get(caseId);
  if (!set) return;
  const chunk = `event: ${event}\ndata: ${data}\n\n`;
  for (const subscriber of set) subscriber.send(chunk);
}

// REQ-PM-08: called after the revocation transaction commits, so a revoked
// member's existing streams end immediately instead of lingering until the
// next client reconnect.
export function disconnectCaseUser(caseId: string, userId: string): void {
  const set = caseSubscribers.get(caseId);
  if (!set) return;
  for (const subscriber of [...set]) {
    if (subscriber.userId !== userId) continue;
    set.delete(subscriber);
    subscriber.close();
  }
  if (set.size === 0) caseSubscribers.delete(caseId);
}
