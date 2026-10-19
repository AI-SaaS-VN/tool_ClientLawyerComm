"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { apiPath } from "@/lib/api-path";
import { machineTag, roleText, statusText, uiText } from "@/modules/i18n/copy";
import { formatRecordTime } from "@/modules/i18n/record-time";

import { FileCard, type FileItem } from "./files-panel";

interface TranslationView {
  targetLang: string;
  state: "same_language" | "none" | "waiting" | "ready" | "failed" | "needs_review";
  text: string | null;
  version: number | null;
}

interface MessageItem {
  id: string;
  authorDisplayName: string;
  authorRole: string;
  sourceLang: string;
  sourceText: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  translation: TranslationView | null;
  files?: FileItem[];
  file: FileItem | null;
  citedFile: { id: string; originalName: string } | null;
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
  const [selected, setSelected] = useState<File | null>(null);
  const [citedId, setCitedId] = useState("");
  const [uploadError, setUploadError] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ messageId: string; file: File } | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [caseFiles, setCaseFiles] = useState<FileItem[]>([]);
  const sendingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    let cancelled = false;
    fetch(apiPath(`/api/cases/${caseId}/files`))
      .then(async (res) => {
        if (cancelled || !res.ok) return;
        setCaseFiles(((await res.json()) as { files: FileItem[] }).files);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [caseId, refreshKey]);

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

  async function uploadOnto(messageId: string, file: File): Promise<boolean> {
    const form = new FormData();
    form.set("file", file);
    form.set("messageId", messageId);
    const res = await fetch(apiPath(`/api/cases/${caseId}/files`), { method: "POST", body: form });
    return res.ok;
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setSendError(false);
    setUploadError(false);
    try {
      if (pendingFile) {
        const ok = await uploadOnto(pendingFile.messageId, pendingFile.file);
        if (!ok) {
          setUploadError(true);
          return;
        }
        setPendingFile(null);
        setSelected(null);
        if (inputRef.current) inputRef.current.value = "";
        setRefreshKey((key) => key + 1);
        return;
      }
      const text = draft.trim();
      if (!text) return;
      const body: { sourceText: string; citedFileId?: string } = { sourceText: text };
      if (!selected && citedId) body.citedFileId = citedId;
      const res = await fetch(apiPath(`/api/cases/${caseId}/messages`), {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": newIdempotencyKey() },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setSendError(true);
        return;
      }
      const created = (await res.json()) as { message: { id: string } };
      if (selected) {
        const ok = await uploadOnto(created.message.id, selected);
        if (!ok) {
          setPendingFile({ messageId: created.message.id, file: selected });
          setUploadError(true);
          setDraft("");
          setCitedId("");
          setRefreshKey((key) => key + 1);
          return;
        }
      }
      setDraft("");
      setSelected(null);
      setCitedId("");
      if (inputRef.current) inputRef.current.value = "";
      setRefreshKey((key) => key + 1);
    } catch {
      setSendError(true);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function focusCited(fileId: string) {
    setHighlightedId(fileId);
    document.getElementById(`file-card-${fileId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
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
              {message.authorDisplayName} · {roleText(lang, message.authorRole)} ·{" "}
              <time dateTime={message.publishedAt ?? message.createdAt} data-testid="message-time">
                {formatRecordTime(
                  message.status === "published" && message.publishedAt
                    ? message.publishedAt
                    : message.createdAt,
                )}
              </time>
            </p>
            {body(message)}
            {(message.files ?? (message.file ? [message.file] : [])).map((file) => (
              <FileCard key={file.id} file={file} lang={lang} highlighted={highlightedId === file.id} />
            ))}
            {message.citedFile ? (
              <button
                type="button"
                className="mt-2 rounded border px-2 py-0.5 text-xs"
                data-testid="cite-chip"
                onClick={() => focusCited(message.citedFile!.id)}
              >
                {uiText(lang, "citeFile")}：{message.citedFile.originalName}
              </button>
            ) : null}
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
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={`file-input-${caseId}`}
            ref={inputRef}
            type="file"
            className="sr-only"
            data-testid="file-input"
            disabled={!mounted || Boolean(citedId)}
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              setSelected(next);
              if (next) setCitedId("");
            }}
          />
          <label
            htmlFor={`file-input-${caseId}`}
            className={`cursor-pointer border px-3 py-1 text-sm ${citedId ? "pointer-events-none opacity-50" : ""}`}
          >
            {uiText(lang, "chooseFile")}
          </label>
          <span className="text-sm opacity-60">{selected ? selected.name : uiText(lang, "noFileChosen")}</span>
          {caseFiles.length > 0 ? (
            <select
              className="border px-2 py-1 text-sm"
              data-testid="cite-file"
              value={citedId}
              disabled={!mounted || Boolean(selected) || sending}
              onChange={(event) => {
                const next = event.target.value;
                setCitedId(next);
                if (next) {
                  setSelected(null);
                  if (inputRef.current) inputRef.current.value = "";
                }
              }}
            >
              <option value="">{uiText(lang, "citeNone")}</option>
              {caseFiles.map((file) => (
                <option key={file.id} value={file.id}>
                  {uiText(lang, "citeFile")}：{file.originalName}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="submit"
            className="border px-3 py-1 text-sm disabled:opacity-50"
            data-testid="message-send"
            disabled={!mounted || sending}
          >
            {sending ? uiText(lang, "sending") : uiText(lang, "send")}
          </button>
        </div>
        {sendError ? (
          <p className="text-sm opacity-60">{uiText(lang, "sendFailed")}</p>
        ) : null}
        {uploadError ? (
          <p className="text-sm opacity-60" data-testid="file-attach-error">
            {uiText(lang, "uploadFailed")}
          </p>
        ) : null}
      </form>
    </section>
  );
}
