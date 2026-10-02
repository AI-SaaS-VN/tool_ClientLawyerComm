type CaseSubscriber = { send(chunk: string): void };

const caseSubscribers = new Map<string, Set<CaseSubscriber>>();

// In-process fan-out; the monolith runs a single Node process. T11 will add
// forced disconnect of a revoked member's live subscriptions.
export function subscribeCase(caseId: string, subscriber: CaseSubscriber): () => void {
  let set = caseSubscribers.get(caseId);
  if (!set) {
    set = new Set();
    caseSubscribers.set(caseId, set);
  }
  set.add(subscriber);
  return () => {
    set.delete(subscriber);
    if (set.size === 0) caseSubscribers.delete(caseId);
  };
}

export function publishToCase(caseId: string, event: string, data: string): void {
  const set = caseSubscribers.get(caseId);
  if (!set) return;
  const chunk = `event: ${event}\ndata: ${data}\n\n`;
  for (const subscriber of set) subscriber.send(chunk);
}
