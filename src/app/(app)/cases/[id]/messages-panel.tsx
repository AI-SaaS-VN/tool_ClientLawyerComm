"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

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

export function MessagesPanel({ caseId }: { caseId: string }) {
  const [mode, setMode] = useState<ReadingMode>("auto");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState(false);
  // Hydration gate: server-rendered controls have no handlers yet.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/cases/${caseId}/messages?mode=${mode}`)
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
    const source = new EventSource(`/api/cases/${caseId}/stream`);
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
    if (!text) return;
    setSendError(false);
    try {
      const res = await fetch(`/api/cases/${caseId}/messages`, {
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
    }
  }

  async function translate(messageId: string) {
    const res = await fetch(`/api/messages/${messageId}/translate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    if (res.ok) setRefreshKey((key) => key + 1);
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
          <p className="text-xs opacity-60">{message.status}</p>
        </>
      );
    }
    if (mode === "manual") {
      return (
        <>
          <p className="text-sm">{message.sourceText}</p>
          {translation.state === "ready" ? (
            <p className="mt-1 text-sm opacity-80" data-testid="translation-text">
              {translation.text} <span className="text-xs">(机翻 v{translation.version})</span>
            </p>
          ) : (
            <button
              className="mt-1 rounded border px-2 py-0.5 text-xs"
              data-testid="translate-button"
              disabled={!mounted}
              onClick={() => void translate(message.id)}
            >
              翻译 / Dịch
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
            {translation.text} <span className="text-xs opacity-60">(机翻 v{translation.version})</span>
          </p>
        );
      case "failed":
        return (
          <p className="text-sm">
            <span className="opacity-60">翻译失败 / Dịch thất bại</span>{" "}
            <button
              className="rounded border px-2 py-0.5 text-xs"
              data-testid="translate-button"
              disabled={!mounted}
              onClick={() => void translate(message.id)}
            >
              重试 / Thử lại
            </button>
          </p>
        );
      case "needs_review":
        return <p className="text-sm opacity-60">译文待人工校核 / Bản dịch chờ kiểm tra thủ công</p>;
      default:
        return <p className="text-sm opacity-60">翻译中… / Đang dịch…</p>;
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-2 flex items-center gap-3">
        <h2 className="font-medium">消息 / Tin nhắn</h2>
        <div className="flex gap-1 text-xs">
          <button
            className={`rounded border px-2 py-0.5 ${mode === "auto" ? "font-semibold" : "opacity-60"}`}
            data-testid="mode-auto"
            disabled={!mounted}
            onClick={() => switchMode("auto")}
          >
            自动翻译 / Tự động
          </button>
          <button
            className={`rounded border px-2 py-0.5 ${mode === "manual" ? "font-semibold" : "opacity-60"}`}
            data-testid="mode-manual"
            disabled={!mounted}
            onClick={() => switchMode("manual")}
          >
            原文·手动 / Thủ công
          </button>
        </div>
      </div>
      {error ? <p className="text-sm opacity-60">加载失败 / Tải thất bại</p> : null}
      <ul className="flex flex-col gap-3" data-testid="message-list">
        {messages.map((message) => (
          <li key={message.id} className="rounded border p-3" data-testid="message-item">
            <p className="mb-1 text-xs opacity-60">
              {message.authorDisplayName} · {message.sourceLang}
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
          placeholder="输入消息… / Nhập tin nhắn…"
          className="border px-3 py-2 text-sm"
          data-testid="message-input"
        />
        <button type="submit" className="self-start border px-3 py-1 text-sm" data-testid="message-send" disabled={!mounted}>
          发送 / Gửi
        </button>
        {sendError ? (
          <p className="text-sm opacity-60">发送失败，请重试。 / Gửi thất bại, thử lại.</p>
        ) : null}
      </form>
    </section>
  );
}
