"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [message, setMessage] = useState("");

  async function requestOtp(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setStep("code");
      setMessage("If the address is registered, a code has been sent.");
    } else {
      setMessage("Could not send a code right now. Please try again later.");
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    setMessage(res.ok ? "Signed in." : "Invalid or expired code.");
  }

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
      {step === "email" ? (
        <form onSubmit={requestOtp} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="border px-3 py-2"
          />
          <button type="submit" className="border px-3 py-2">
            Send code
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="flex flex-col gap-3">
          <input
            inputMode="numeric"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            className="border px-3 py-2"
          />
          <button type="submit" className="border px-3 py-2">
            Verify
          </button>
        </form>
      )}
      {message && <p className="mt-4 text-sm">{message}</p>}
    </main>
  );
}
