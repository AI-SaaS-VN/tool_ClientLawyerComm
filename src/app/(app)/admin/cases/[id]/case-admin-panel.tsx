"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { memberStatusText, roleText, uiText } from "@/modules/i18n/copy";

export interface AdminRosterRow {
  userId: string | null;
  displayName: string | null;
  email: string | null;
  role: string;
  status: string;
}

// REQ-ADM-01/03: the per-case console panel renders the roster (with a revoke
// button on each active member) and the add-participant form. Every call
// carries the current TOTP code in the x-totp-code header.
export function CaseAdminPanel({
  caseId,
  lang,
  members,
}: {
  caseId: string;
  lang: string;
  members: AdminRosterRow[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("client");
  const [displayName, setDisplayName] = useState("");
  const [totp, setTotp] = useState("");
  const [state, setState] = useState<"idle" | "working" | "done" | "failed">("idle");

  async function call(path: string, method: string, body?: unknown): Promise<boolean> {
    try {
      const res = await fetch(path, {
        method,
        headers: { "content-type": "application/json", "x-totp-code": totp },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function addParticipant() {
    if (state === "working") return;
    setState("working");
    const ok = await call(`/api/admin/cases/${caseId}/invites`, "POST", {
      email: email.trim(),
      role,
      displayName: displayName.trim() || undefined,
    });
    if (!ok) {
      setState("failed");
      return;
    }
    setState("done");
    setEmail("");
    setDisplayName("");
    router.refresh();
  }

  async function revoke(userId: string) {
    if (state === "working") return;
    setState("working");
    const ok = await call(`/api/admin/cases/${caseId}/members/${userId}`, "DELETE");
    setState(ok ? "idle" : "failed");
    if (ok) router.refresh();
  }

  return (
    <div data-testid="admin-case-panel">
      <ul className="mb-4 flex flex-col gap-1" data-testid="admin-case-roster">
        {members.map((member, index) => (
          <li key={member.userId ?? `pending-${index}`} className="flex items-center gap-2 text-sm">
            <span>
              {(member.displayName ?? member.email) ?? ""} — {roleText(lang, member.role)} —{" "}
              {memberStatusText(lang, member.status)}
              {member.status === "pending" && member.displayName && member.email
                ? ` (${member.email})`
                : ""}
            </span>
            {member.status === "active" && member.userId ? (
              <button
                type="button"
                className="border px-2 py-0.5 text-xs disabled:opacity-50"
                data-testid={`admin-revoke-${member.userId}`}
                disabled={state === "working"}
                onClick={() => void revoke(member.userId!)}
              >
                {uiText(lang, "adminRevoke")}
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      <h2 className="mb-2 font-medium">{uiText(lang, "adminAddParticipant")}</h2>
      <div className="mb-2 flex gap-2">
        <input
          type="text"
          className="block w-full border px-2 py-1 text-sm"
          placeholder={uiText(lang, "adminEmail")}
          data-testid="admin-invite-email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <select
          className="border px-2 py-1 text-sm"
          aria-label={uiText(lang, "adminRoleLabel")}
          data-testid="admin-invite-role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          {(["client", "lawyer", "coordinator"] as const).map((r) => (
            <option key={r} value={r}>
              {roleText(lang, r)}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="block w-full border px-2 py-1 text-sm"
          placeholder={uiText(lang, "adminDisplayName")}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="block border px-2 py-1 text-sm"
          placeholder={uiText(lang, "adminTotpCode")}
          data-testid="admin-totp"
          value={totp}
          onChange={(event) => setTotp(event.target.value)}
        />
        <button
          type="button"
          className="border px-3 py-1 text-sm disabled:opacity-50"
          data-testid="admin-invite-submit"
          disabled={state === "working"}
          onClick={() => void addParticipant()}
        >
          {state === "working" ? uiText(lang, "adminWorking") : uiText(lang, "adminSubmit")}
        </button>
      </div>
      {state === "done" ? <p className="mt-2 text-sm">{uiText(lang, "adminDone")}</p> : null}
      {state === "failed" ? (
        <p className="mt-2 text-sm" data-testid="admin-panel-failed">
          {uiText(lang, "adminFailed")}
        </p>
      ) : null}
    </div>
  );
}
