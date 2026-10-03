"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [otp, setOtp] = useState("");
  const [admin, setAdmin] = useState(false);
  const [adminStep, setAdminStep] = useState<"email" | "code">("email");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  async function enterCase(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setPending(true);
    try {
      const res = await fetch("/api/invites/activate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code: inviteCode }),
      });
      if (!res.ok) {
        setMessage("这个邮箱不能使用该邀请码。 / Email này không dùng được mã mời này.");
        return;
      }
      const { caseId } = (await res.json()) as { caseId: string };
      router.push(`/cases/${caseId}`);
      router.refresh();
    } catch {
      setMessage("暂时无法进入，请再试一次。 / Chưa vào được, hãy thử lại.");
    } finally {
      setPending(false);
    }
  }

  async function requestOtp(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setAdminStep("code");
      setMessage("If the address is registered, a code has been sent.");
    } else {
      setMessage("Could not send a code right now. Please try again later.");
    }
  }

  async function verifyAdmin(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code: otp }),
    });
    if (!res.ok) {
      setMessage("Invalid or expired code.");
      return;
    }
    window.location.assign("/cases");
  }

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="mb-4 text-xl font-semibold">进入案件 / Vào vụ án</h1>
      <p className="mb-4 text-sm">
        输入收到邀请的邮箱，以及邮件中的邀请码。
        <br />
        Nhập email nhận thư mời và mã mời trong thư.
      </p>
      <form onSubmit={enterCase} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱 / Email"
          data-testid="login-email"
          className="border px-3 py-2"
        />
        <input
          required
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="邀请码 / Mã mời"
          data-testid="login-invite-code"
          className="border px-3 py-2"
          autoCapitalize="characters"
        />
        <button
          type="submit"
          className="border px-3 py-2"
          data-testid="login-enter"
          disabled={!mounted || pending}
        >
          {pending ? "进入中…" : "进入案件 / Vào vụ án"}
        </button>
      </form>

      <button
        type="button"
        className="mt-6 text-sm underline"
        data-testid="login-admin"
        onClick={() => setAdmin((open) => !open)}
      >
        管理员登录 / Administrator
      </button>
      {admin && adminStep === "email" && (
        <form onSubmit={requestOtp} className="mt-3 flex flex-col gap-3">
          <button
            type="submit"
            className="border px-3 py-2"
            data-testid="login-send-code"
            disabled={!mounted}
          >
            Send code
          </button>
        </form>
      )}
      {admin && adminStep === "code" && (
        <form onSubmit={verifyAdmin} className="mt-3 flex flex-col gap-3">
          <input
            inputMode="numeric"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit code"
            data-testid="login-code"
            className="border px-3 py-2"
          />
          <button
            type="submit"
            className="border px-3 py-2"
            data-testid="login-verify"
            disabled={!mounted}
          >
            Verify
          </button>
        </form>
      )}
      {message && (
        <p className="mt-4 text-sm" data-testid="login-message">
          {message}
        </p>
      )}
    </main>
  );
}
