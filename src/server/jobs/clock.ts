// Injectable clock so the worker's retry/escalation timing is driven by a
// simulated clock in tests (PLAN T07: first send ≤30s, 1/5/15-minute backoff,
// 30-minute/2-hour escalation — all asserted against elapsed clock time).
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};
