"use client";

import { useEffect, useState } from "react";

import { apiPath } from "@/lib/api-path";
import { uiText } from "@/modules/i18n/copy";

interface StatuteLink {
  title: string;
  url: string;
  jurisdiction: "cn" | "vn";
}

interface BriefState {
  questionsStatus: string;
  questions: string[] | null;
  briefText: string | null;
  confirmedAt: string | null;
  statuteStatus: string;
  statuteLinks: StatuteLink[] | null;
  statuteNote: string | null;
}

// REQ-BRIEF-01/02: the coordinator-only brief block. Questions appear when
// the agent has prepared them; the brief is written only on confirm, and it
// is never posted to the case chat or emailed.
export function BriefPanel({ caseId, lang }: { caseId: string; lang: string }) {
  const [brief, setBrief] = useState<BriefState | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [needAnswer, setNeedAnswer] = useState(false);
  const [selectedLinks, setSelectedLinks] = useState<number[]>([]);
  const [remark, setRemark] = useState("");
  const [confirmingStatute, setConfirmingStatute] = useState(false);
  const [needSelection, setNeedSelection] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(apiPath(`/api/cases/${caseId}/brief`))
        .then(async (res) => {
          if (cancelled || !res.ok) return;
          const data = (await res.json()) as { brief: BriefState };
          setBrief(data.brief);
          setAnswers((prev) =>
            data.brief.questions && prev.length !== data.brief.questions.length
              ? data.brief.questions.map(() => "")
              : prev,
          );
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [caseId]);

  async function confirm() {
    if (saving) return;
    setSaving(true);
    setNeedAnswer(false);
    try {
      const res = await fetch(apiPath(`/api/cases/${caseId}/brief`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.status === 400) {
        setNeedAnswer(true);
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { brief: BriefState };
        setBrief(data.brief);
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmStatute() {
    if (confirmingStatute) return;
    setConfirmingStatute(true);
    setNeedSelection(false);
    try {
      const res = await fetch(apiPath(`/api/cases/${caseId}/statute`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selected: selectedLinks, remark: remark || undefined }),
      });
      if (res.status === 400) {
        setNeedSelection(true);
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { statuteNote: string };
        setBrief((prev) => (prev ? { ...prev, statuteNote: data.statuteNote } : prev));
      }
    } finally {
      setConfirmingStatute(false);
    }
  }

  if (!brief) return null;

  return (
    <section className="mt-8" data-testid="brief-panel">
      <h2 className="mb-2 font-medium">{uiText(lang, "briefTitle")}</h2>
      {brief.briefText ? (
        <div className="rounded border p-3">
          <p className="mb-1 text-sm opacity-60">{uiText(lang, "briefSaved")}</p>
          <p className="whitespace-pre-wrap text-sm" data-testid="brief-text">
            {brief.briefText}
          </p>
        </div>
      ) : brief.questionsStatus === "ready" && brief.questions ? (
        <div className="rounded border p-3">
          <p className="mb-2 text-sm">{uiText(lang, "briefLead")}</p>
          {brief.questions.map((question, i) => (
            <label key={i} className="mb-2 block text-sm">
              {i + 1}. {question}
              <input
                type="text"
                className="mt-1 block w-full border px-2 py-1"
                data-testid={`brief-answer-${i}`}
                value={answers[i] ?? ""}
                onChange={(event) =>
                  setAnswers((prev) => prev.map((a, j) => (j === i ? event.target.value : a)))
                }
              />
            </label>
          ))}
          {needAnswer ? (
            <p className="mb-2 text-sm opacity-60">{uiText(lang, "briefNeedAnswer")}</p>
          ) : null}
          <button
            type="button"
            className="border px-3 py-1 text-sm disabled:opacity-50"
            data-testid="brief-confirm"
            disabled={saving}
            onClick={() => void confirm()}
          >
            {uiText(lang, "briefConfirm")}
          </button>
        </div>
      ) : brief.questionsStatus === "failed" ? (
        <p className="text-sm opacity-60">{uiText(lang, "briefFailed")}</p>
      ) : brief.questionsStatus !== "none" ? (
        <p className="text-sm opacity-60">{uiText(lang, "briefWorking")}</p>
      ) : null}
      {brief.statuteNote ? (
        <div className="mt-3 rounded border p-3" data-testid="statute-note">
          <p className="mb-1 text-sm opacity-60">{uiText(lang, "statuteNoteTitle")}</p>
          <p className="whitespace-pre-wrap text-sm">{brief.statuteNote}</p>
        </div>
      ) : brief.statuteStatus === "ready" && brief.statuteLinks ? (
        <div className="mt-3 rounded border p-3" data-testid="statute-links">
          <p className="mb-2 text-sm">{uiText(lang, "statuteLinksLabel")}</p>
          {brief.statuteLinks.map((link, i) => (
            <label key={i} className="mb-1 block text-sm">
              <input
                type="checkbox"
                className="mr-1"
                data-testid={`statute-link-${i}`}
                checked={selectedLinks.includes(i)}
                onChange={(event) =>
                  setSelectedLinks((prev) =>
                    event.target.checked ? [...prev, i] : prev.filter((j) => j !== i),
                  )
                }
              />
              {link.title} —{" "}
              <a className="underline" href={link.url} target="_blank" rel="noreferrer">
                {link.url}
              </a>
            </label>
          ))}
          <input
            type="text"
            className="mt-1 block w-full border px-2 py-1 text-sm"
            placeholder={uiText(lang, "statuteRemarkPlaceholder")}
            data-testid="statute-remark"
            value={remark}
            onChange={(event) => setRemark(event.target.value)}
          />
          {needSelection ? (
            <p className="mt-1 text-sm opacity-60">{uiText(lang, "statuteNeedSelection")}</p>
          ) : null}
          <button
            type="button"
            className="mt-2 border px-3 py-1 text-sm disabled:opacity-50"
            data-testid="statute-confirm"
            disabled={confirmingStatute}
            onClick={() => void confirmStatute()}
          >
            {uiText(lang, "statuteConfirm")}
          </button>
        </div>
      ) : null}
    </section>
  );
}
