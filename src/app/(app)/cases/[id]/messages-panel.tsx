"use client";

import { useEffect, useState } from "react";

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

export function MessagesPanel({ caseId }: { caseId: string }) {
  const [mode, setMode] = useState<ReadingMode>("auto");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
            <p className="mt-1 text-sm opacity-80">
              {translation.text} <span className="text-xs">(机翻 v{translation.version})</span>
            </p>
          ) : (
            <button
              className="mt-1 rounded border px-2 py-0.5 text-xs"
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
          <p className="text-sm">
            {translation.text} <span className="text-xs opacity-60">(机翻 v{translation.version})</span>
          </p>
        );
      case "failed":
        return (
          <p className="text-sm">
            <span className="opacity-60">翻译失败 / Dịch thất bại</span>{" "}
            <button
              className="rounded border px-2 py-0.5 text-xs"
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
            onClick={() => switchMode("auto")}
          >
            自动翻译 / Tự động
          </button>
          <button
            className={`rounded border px-2 py-0.5 ${mode === "manual" ? "font-semibold" : "opacity-60"}`}
            onClick={() => switchMode("manual")}
          >
            原文·手动 / Thủ công
          </button>
        </div>
      </div>
      {error ? <p className="text-sm opacity-60">加载失败 / Tải thất bại</p> : null}
      <ul className="flex flex-col gap-3">
        {messages.map((message) => (
          <li key={message.id} className="rounded border p-3">
            <p className="mb-1 text-xs opacity-60">
              {message.authorDisplayName} · {message.sourceLang}
            </p>
            {body(message)}
          </li>
        ))}
      </ul>
    </section>
  );
}
