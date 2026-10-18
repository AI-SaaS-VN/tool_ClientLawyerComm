"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { apiPath } from "@/lib/api-path";
import { machineTag, statusText, uiText } from "@/modules/i18n/copy";
import { formatRecordTime } from "@/modules/i18n/record-time";

interface TranslationView {
  targetLang: string;
  state: "same_language" | "none" | "waiting" | "ready" | "failed" | "needs_review";
  text: string | null;
  version: number | null;
}

interface MessageItem {
  id: string;
  authorDisplayName: string;
  sourceLang: string;
  sourceText: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  translation: TranslationView | null;
}

type ReadingMode = "auto" | "manual";

// crypto.randomUUID() exists only in secure contexts. This test host is HTTP
// on an IP address, where that call throws and the send click appears to do
// nothing. getRandomValues is available there.
function newIdempotencyKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

interface ReviewView {
  text: string;
  keyFieldCheck: string | null;
  version: number;
}

export function MessagesPanel({
  caseId,
  lang,
  coordinator = false,
}: {
  caseId: string;
  lang: string;
  coordinator?: boolean;
}) {
  const [mode, setMode] = useState<ReadingMode>("auto");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState(false);
  const [sending, setSending] = useState(false);
  const [reviewByMessage, setReviewByMessage] = useState<Record<string, ReviewView>>({});
  const [releasing, setReleasing] = useState<string | null>(null);
  const sendingRef = useRef(false);
  // Hydration gate: server-rendered controls have no handlers yet.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    let cancelled = false;
    fetch(apiPath(`/api/cases/${caseId}/messages?mode=${mode}`))
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setError(true);
          return;
        }
        setMessages(((await res.json()) as { messages: MessageItem[] }).messages);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId, mode, refreshKey]);

  // REQ-MSG-05: live push — a published message (or a review release) bumps
  // the refresh; history itself always comes from the HTTP list. Events that
  // fall into an SSE reconnect gap are lost (the stream never replays), so a
  // slow interval refetches the authoritative list as a backstop.
  useEffect(() => {
    const source = new EventSource(apiPath(`/api/cases/${caseId}/stream`));
    source.addEventListener("message", () => setRefreshKey((key) => key + 1));
    const backstop = setInterval(() => setRefreshKey((key) => key + 1), 10_000);
    return () => {
      source.close();
      clearInterval(backstop);
    };
  }, [caseId]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setSendError(false);
    try {
      const res = await fetch(apiPath(`/api/cases/${caseId}/messages`), {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": newIdempotencyKey() },
        body: JSON.stringify({ sourceText: text }),
      });
      if (!res.ok) {
        setSendError(true);
        return;
      }
      setDraft("");
      setRefreshKey((key) => key + 1);
    } catch {
      setSendError(true);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  async function translate(messageId: string) {
    const res = await fetch(apiPath(`/api/messages/${messageId}/translate`), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    if (res.ok) setRefreshKey((key) => key + 1);
  }

  async function reviewFlagged(message: MessageItem) {
    const targetLang = message.translation?.targetLang;
    if (!targetLang) return;
    const res = await fetch(
      `/api/messages/${message.id}/translate/review?targetLang=${encodeURIComponent(targetLang)}`,
    );
    if (!res.ok) return;
    const data = (await res.json()) as { review: ReviewView };
    setReviewByMessage((prev) => ({ ...prev, [message.id]: data.review }));
  }

  async function release(message: MessageItem) {
    const targetLang = message.translation?.targetLang;
    if (!targetLang || releasing) return;
    setReleasing(message.id);
    try {
      const res = await fetch(apiPath(`/api/messages/${message.id}/translate/release`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetLang }),
      });
      if (res.ok) {
        setReviewByMessage((prev) => {
          const next = { ...prev };
          delete next[message.id];
          return next;
        });
        setRefreshKey((key) => key + 1);
      }
    } finally {
      setReleasing(null);
    }
  }

  function switchMode(next: ReadingMode) {
    // REQ-TR-02: switching modes is a pure reading preference; it touches no
    // publish permissions.
    setMode(next);
  }

  function body(message: MessageItem) {
    const translation = message.translation;
    if (!translation) {
      return (
        <>
          <p className="text-sm">{message.sourceText}</p>
          <p className="text-xs opacity-60">{statusText(lang, message.status)}</p>
        </>
      );
    }
    if (mode === "manual") {
      return (
        <>
          <p className="text-sm">{message.sourceText}</p>
          {translation.state === "ready" ? (
            <p className="mt-1 text-sm opacity-80" data-testid="translation-text">
              {translation.text} <span className="text-xs">{machineTag(lang, translation.version)}</span>
            </p>
          ) : (
            <button
              className="mt-1 rounded border px-2 py-0.5 text-xs"
              data-testid="translate-button"
              disabled={!mounted}
              onClick={() => void translate(message.id)}
            >
              {uiText(lang, "translate")}
            </button>
          )}
        </>
      );
    }
    switch (translation.state) {
      case "same_language":
        return <p className="text-sm">{message.sourceText}</p>;
      case "ready":
        return (
          <p className="text-sm" data-testid="translation-text">
            {translation.text} <span className="text-xs opacity-60">{machineTag(lang, translation.version)}</span>
          </p>
        );
      case "failed":
        return (
          <p className="text-sm">
            <span className="opacity-60">{uiText(lang, "translateFailed")}</span>{" "}
            <button
              className="rounded border px-2 py-0.5 text-xs"
              data-testid="translate-button"
              disabled={!mounted}
              onClick={() => void translate(message.id)}
            >
              {uiText(lang, "retry")}
            </button>
          </p>
        );
      case "needs_review": {
        const review = reviewByMessage[message.id];
        return (
          <div>
            <p className="text-sm opacity-60">{uiText(lang, "translationPending")}</p>
            {coordinator ? (
              review ? (
                <div className="mt-1 rounded border p-2" data-testid="translation-review">
                  <p className="text-xs opacity-60">{uiText(lang, "translationReviewTitle")}</p>
                  <p className="mt-1 text-sm" data-testid="review-text">
                    {review.text}
                  </p>
                  {review.keyFieldCheck ? (
                    <p className="mt-1 text-xs opacity-60">
                      {uiText(lang, "translationMismatch")}: {review.keyFieldCheck}
                    </p>
                  ) : null}
                  <button
                    className="mt-1 rounded border px-2 py-0.5 text-xs disabled:opacity-50"
                    data-testid="release-button"
                    disabled={!mounted || releasing === message.id}
                    onClick={() => void release(message)}
                  >
                    {uiText(lang, "translationRelease")}
                  </button>
                </div>
              ) : (
                <button
                  className="mt-1 rounded border px-2 py-0.5 text-xs"
                  data-testid="review-button"
                  disabled={!mounted}
                  onClick={() => void reviewFlagged(message)}
                >
                  {uiText(lang, "translationReview")}
                </button>
              )
            ) : null}
          </div>
        );
      }
      default:
        return <p className="text-sm opacity-60">{uiText(lang, "translating")}</p>;
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-2 flex items-center gap-3">
        <h2 className="font-medium">{uiText(lang, "messages")}</h2>
        <div className="flex gap-1 text-xs">
          <button
            className={`rounded border px-2 py-0.5 ${mode === "auto" ? "font-semibold" : "opacity-60"}`}
            data-testid="mode-auto"
            disabled={!mounted}
            onClick={() => switchMode("auto")}
          >
            {uiText(lang, "modeAuto")}
          </button>
          <button
            className={`rounded border px-2 py-0.5 ${mode === "manual" ? "font-semibold" : "opacity-60"}`}
            data-testid="mode-manual"
            disabled={!mounted}
            onClick={() => switchMode("manual")}
          >
            {uiText(lang, "modeManual")}
          </button>
        </div>
      </div>
      {error ? <p className="text-sm opacity-60">{uiText(lang, "loadFailed")}</p> : null}
      <ul className="flex flex-col gap-3" data-testid="message-list">
        {messages.map((message) => (
          <li key={message.id} className="rounded border p-3" data-testid="message-item">
            <p className="mb-1 text-xs opacity-60">
              {message.authorDisplayName} · {message.sourceLang} ·{" "}
              <time dateTime={message.publishedAt ?? message.createdAt} data-testid="message-time">
                {formatRecordTime(
                  message.status === "published" && message.publishedAt
                    ? message.publishedAt
                    : message.createdAt,
                )}
              </time>
            </p>
            {body(message)}
          </li>
        ))}
      </ul>
      <form onSubmit={send} className="mt-4 flex flex-col gap-2">
        <textarea
          required
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={uiText(lang, "messagePlaceholder")}
          className="border px-3 py-2 text-sm"
          data-testid="message-input"
        />
        <button
          type="submit"
          className="self-start border px-3 py-1 text-sm disabled:opacity-50"
          data-testid="message-send"
          disabled={!mounted || sending}
        >
          {sending ? uiText(lang, "sending") : uiText(lang, "send")}
        </button>
        {sendError ? (
          <p className="text-sm opacity-60">{uiText(lang, "sendFailed")}</p>
        ) : null}
      </form>
    </section>
  );
}
