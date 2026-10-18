"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { apiPath } from "@/lib/api-path";
import { statusText, uiText } from "@/modules/i18n/copy";
import { formatRecordTime } from "@/modules/i18n/record-time";

export interface FileItem {
  id: string;
  uploaderDisplayName: string;
  status: string;
  originalName: string;
  mime: string;
  sizeBytes: number;
  createdAt: string;
  messageId?: string | null;
  attachmentState?: "none" | "pending" | "ready" | "unavailable";
}

interface BilingualJob {
  id: string;
  status: string;
  error: string | null;
  outputFileId: string | null;
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function FileCard({
  file,
  lang,
  highlighted = false,
}: {
  file: FileItem;
  lang: string;
  highlighted?: boolean;
}) {
  const [job, setJob] = useState<BilingualJob | null>(null);
  const [requesting, setRequesting] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (file.mime !== DOCX_MIME) return;
    let cancelled = false;
    const load = () => {
      fetch(apiPath(`/api/files/${file.id}/bilingual`))
        .then(async (res) => {
          if (cancelled || !res.ok) return;
          const data = (await res.json()) as { job: BilingualJob | null };
          setJob(data.job);
        })
        .catch(() => {});
    };
    load();
    const backstop = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(backstop);
    };
  }, [file.id, file.mime]);

  async function requestBilingual() {
    if (requesting) return;
    setRequesting(true);
    try {
      const res = await fetch(apiPath(`/api/files/${file.id}/bilingual`), { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as { job: BilingualJob };
        setJob(data.job);
      }
    } finally {
      setRequesting(false);
    }
  }

  function bilingualStateText(current: BilingualJob): string {
    switch (current.status) {
      case "queued":
      case "processing":
        return uiText(lang, "bilingualWorking");
      case "done":
        return uiText(lang, "bilingualDone");
      case "rejected_unsupported":
        return uiText(lang, "bilingualRejectedUnsupported");
      case "rejected_too_long":
        return uiText(lang, "bilingualRejectedTooLong");
      case "rejected_lang":
        return uiText(lang, "bilingualRejectedLang");
      default:
        return uiText(lang, "bilingualFailed");
    }
  }

  return (
    <div
      id={`file-card-${file.id}`}
      className={`mt-2 rounded border p-3 text-sm ${highlighted ? "outline outline-2" : ""}`}
      data-testid="file-item"
    >
      <span className="font-medium">{file.originalName}</span>
      <span className="ml-2 opacity-60">
        {statusText(lang, file.status)} · {file.uploaderDisplayName} ·{" "}
        <time dateTime={file.createdAt} data-testid="file-time">
          {formatRecordTime(file.createdAt)}
        </time>
      </span>
      {file.status === "published" ? (
        <a
          className="ml-3 underline"
          data-testid="file-download"
          href={apiPath(`/api/files/${file.id}/download`)}
        >
          {uiText(lang, "download")}
        </a>
      ) : null}
      {file.status === "published" && file.attachmentState === "ready" ? (
        <a
          className="ml-3 underline"
          data-testid="attachment-translation-link"
          href={apiPath(`/files/${file.id}/translation`)}
        >
          {uiText(lang, "openAttachmentTranslation")}
        </a>
      ) : null}
      {file.status === "published" && file.attachmentState === "pending" ? (
        <span className="ml-3 opacity-60" data-testid="attachment-preparing">
          {uiText(lang, "attachmentPreparing")}
        </span>
      ) : null}
      {file.status === "published" && file.attachmentState === "unavailable" ? (
        <span className="ml-3 opacity-60" data-testid="attachment-unavailable">
          {uiText(lang, "attachmentNoText")}
        </span>
      ) : null}
      {file.mime === DOCX_MIME ? (
        <span className="ml-3" data-testid="bilingual-block">
          {job ? (
            <span className="opacity-60" data-testid="bilingual-status">
              {bilingualStateText(job)}
            </span>
          ) : (
            <button
              type="button"
              className="underline disabled:opacity-50"
              title={uiText(lang, "bilingualDisclaimer")}
              data-testid="bilingual-button"
              disabled={!mounted || requesting}
              onClick={() => void requestBilingual()}
            >
              {uiText(lang, "bilingualButton")}
            </button>
          )}
        </span>
      ) : null}
    </div>
  );
}

export function FilesPanel({ caseId, lang }: { caseId: string; lang: string }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(apiPath(`/api/cases/${caseId}/files`))
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setError(true);
          setLoaded(true);
          return;
        }
        setFiles(((await res.json()) as { files: FileItem[] }).files);
        setError(false);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [caseId, refreshKey]);

  useEffect(() => {
    const backstop = setInterval(() => setRefreshKey((key) => key + 1), 10_000);
    return () => clearInterval(backstop);
  }, [caseId]);

  const prior = files.filter((file) => !file.messageId);
  if (!loaded || (prior.length === 0 && !error)) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-2 font-medium">{uiText(lang, "priorFiles")}</h2>
      {prior.some((f) => f.mime === DOCX_MIME) ? (
        <p className="mb-2 text-xs opacity-60">{uiText(lang, "bilingualDisclaimer")}</p>
      ) : null}
      {error ? <p className="text-sm opacity-60">{uiText(lang, "loadFailed")}</p> : null}
      <ul className="flex flex-col gap-2" data-testid="prior-file-list">
        {prior.map((file) => (
          <li key={file.id}>
            <FileCard file={file} lang={lang} />
          </li>
        ))}
      </ul>
    </section>
  );
}
