"use client";

import { useState, useSyncExternalStore } from "react";

export default function InvitePage() {
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"start" | "otp">("start");
  const [message, setMessage] = useState("");
  // Hydration gate: server-rendered controls have no handlers yet.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  async function requestOtp(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, inviteCode }),
    });
    if (res.ok) {
      setStep("otp");
      setMessage("A verification code was sent to your email.");
    } else {
      setMessage("The invitation code is invalid, expired, or already used.");
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code: otp, inviteCode }),
    });
    const body = (await res.json().catch(() => ({}))) as { inviteAccepted?: boolean };
    if (res.ok) {
      setMessage(
        body.inviteAccepted === false
          ? "Signed in, but the invitation could not be accepted."
          : "Invitation accepted.",
      );
    } else {
      setMessage("Invalid or expired code.");
    }
  }

  async function acceptWhileLoggedIn() {
    setMessage("");
    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: inviteCode }),
    });
    setMessage(res.ok ? "Invitation accepted." : "Could not accept this invitation.");
  }

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="mb-4 text-xl font-semibold">Accept an invitation</h1>
      {step === "start" ? (
        <form onSubmit={requestOtp} className="flex flex-col gap-3">
          <input
            required
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Invitation code"
            data-testid="invite-code"
            className="border px-3 py-2"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your own email"
            data-testid="invite-email"
            className="border px-3 py-2"
          />
          <button type="submit" className="border px-3 py-2" data-testid="invite-send-otp" disabled={!mounted}>
            Send verification code
          </button>
          <button type="button" onClick={acceptWhileLoggedIn} className="border px-3 py-2" data-testid="invite-accept-direct" disabled={!mounted}>
            I am signed in — accept directly
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="flex flex-col gap-3">
          <input
            inputMode="numeric"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit code"
            data-testid="invite-otp"
            className="border px-3 py-2"
          />
          <button type="submit" className="border px-3 py-2" data-testid="invite-verify" disabled={!mounted}>
            Verify and join
          </button>
        </form>
      )}
      {message && <p className="mt-4 text-sm" data-testid="invite-message">{message}</p>}
    </main>
  );
}
