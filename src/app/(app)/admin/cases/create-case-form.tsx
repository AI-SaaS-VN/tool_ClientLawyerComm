"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { roleText, uiText } from "@/modules/i18n/copy";

interface ParticipantRow {
  email: string;
  role: string;
  displayName: string;
}

const EMPTY_ROW: ParticipantRow = { email: "", role: "client", displayName: "" };

// REQ-ADM-02: the create-case form. Every mutation sends the current TOTP
// code in the x-totp-code header, as every admin API is MFA-guarded.
export function CreateCaseForm({ lang }: { lang: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [clientOrgName, setClientOrgName] = useState("");
  const [rows, setRows] = useState<ParticipantRow[]>([
    { ...EMPTY_ROW, role: "client" },
    { ...EMPTY_ROW, role: "lawyer" },
    { ...EMPTY_ROW, role: "coordinator" },
  ]);
  const [totp, setTotp] = useState("");
  const [state, setState] = useState<"idle" | "working" | "done" | "failed">("idle");

  function setRow(index: number, patch: Partial<ParticipantRow>) {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  async function submit() {
    if (state === "working") return;
    setState("working");
    try {
      const res = await fetch("/api/admin/cases", {
        method: "POST",
        headers: { "content-type": "application/json", "x-totp-code": totp },
        body: JSON.stringify({
          title,
          clientOrgName,
          participants: rows
            .filter((row) => row.email.trim() !== "")
            .map((row) => ({
              email: row.email.trim(),
              role: row.role,
              displayName: row.displayName.trim() || undefined,
            })),
        }),
      });
      if (!res.ok) {
        setState("failed");
        return;
      }
      setState("done");
      setTitle("");
      setClientOrgName("");
      setRows([
        { ...EMPTY_ROW, role: "client" },
        { ...EMPTY_ROW, role: "lawyer" },
        { ...EMPTY_ROW, role: "coordinator" },
      ]);
      router.refresh();
    } catch {
      setState("failed");
    }
  }

  return (
    <section className="rounded border p-4" data-testid="admin-create-case">
      <h2 className="mb-2 font-medium">{uiText(lang, "adminCreateCase")}</h2>
      <input
        type="text"
        className="mb-2 block w-full border px-2 py-1 text-sm"
        placeholder={uiText(lang, "adminCaseTitleLabel")}
        data-testid="admin-case-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <input
        type="text"
        className="mb-2 block w-full border px-2 py-1 text-sm"
        placeholder={uiText(lang, "adminClientOrg")}
        data-testid="admin-client-org"
        value={clientOrgName}
        onChange={(event) => setClientOrgName(event.target.value)}
      />
      <p className="mb-1 text-sm opacity-60">{uiText(lang, "adminParticipantsLabel")}</p>
      {rows.map((row, index) => (
        <div key={index} className="mb-1 flex gap-2" data-testid="admin-participant-row">
          <input
            type="text"
            className="block w-full border px-2 py-1 text-sm"
            placeholder={uiText(lang, "adminEmail")}
            value={row.email}
            onChange={(event) => setRow(index, { email: event.target.value })}
          />
          <select
            className="border px-2 py-1 text-sm"
            aria-label={uiText(lang, "adminRoleLabel")}
            value={row.role}
            onChange={(event) => setRow(index, { role: event.target.value })}
          >
            {(["client", "lawyer", "coordinator"] as const).map((role) => (
              <option key={role} value={role}>
                {roleText(lang, role)}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="block w-full border px-2 py-1 text-sm"
            placeholder={uiText(lang, "adminDisplayName")}
            value={row.displayName}
            onChange={(event) => setRow(index, { displayName: event.target.value })}
          />
        </div>
      ))}
      <button
        type="button"
        className="mb-3 border px-3 py-1 text-sm"
        data-testid="admin-add-row"
        onClick={() => setRows((current) => [...current, { ...EMPTY_ROW }])}
      >
        {uiText(lang, "adminAddRow")}
      </button>
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
          data-testid="admin-create-submit"
          disabled={state === "working"}
          onClick={() => void submit()}
        >
          {state === "working" ? uiText(lang, "adminWorking") : uiText(lang, "adminSubmit")}
        </button>
      </div>
      {state === "done" ? <p className="mt-2 text-sm">{uiText(lang, "adminDone")}</p> : null}
      {state === "failed" ? (
        <p className="mt-2 text-sm" data-testid="admin-create-failed">
          {uiText(lang, "adminFailed")}
        </p>
      ) : null}
    </section>
  );
}
