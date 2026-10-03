"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { statusText, uiText } from "@/modules/i18n/copy";
import { formatRecordTime } from "@/modules/i18n/record-time";

interface FileItem {
  id: string;
  uploaderDisplayName: string;
  status: string;
  originalName: string;
  sizeBytes: number;
  createdAt: string;
}

export function FilesPanel({ caseId, lang }: { caseId: string; lang: string }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  // Hydration gate: server-rendered controls have no handlers yet.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/cases/${caseId}/files`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setError(true);
          return;
        }
        setFiles(((await res.json()) as { files: FileItem[] }).files);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId, refreshKey]);

  // No SSE event exists for file publishes, so a slow interval refetches the
  // authoritative list — a coordinator's approval surfaces without a reload.
  useEffect(() => {
    const backstop = setInterval(() => setRefreshKey((key) => key + 1), 10_000);
    return () => clearInterval(backstop);
  }, [caseId]);

  async function upload() {
    if (!selected || uploadingRef.current) return;
    uploadingRef.current = true;
    setUploading(true);
    setUploadError(false);
    try {
      const form = new FormData();
      form.append("file", selected);
      const res = await fetch(`/api/cases/${caseId}/files`, { method: "POST", body: form });
      if (!res.ok) {
        setUploadError(true);
        return;
      }
      setSelected(null);
      if (inputRef.current) inputRef.current.value = "";
      setRefreshKey((key) => key + 1);
    } catch {
      setUploadError(true);
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="mb-2 font-medium">{uiText(lang, "files")}</h2>
      {error ? <p className="text-sm opacity-60">{uiText(lang, "loadFailed")}</p> : null}
      <ul className="flex flex-col gap-2" data-testid="file-list">
        {files.map((file) => (
          <li key={file.id} className="rounded border p-3 text-sm" data-testid="file-item">
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
                href={`/api/files/${file.id}/download`}
              >
                {uiText(lang, "download")}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          id={`file-input-${caseId}`}
          ref={inputRef}
          type="file"
          className="sr-only"
          data-testid="file-input"
          onChange={(event) => setSelected(event.target.files?.[0] ?? null)}
        />
        <label
          htmlFor={`file-input-${caseId}`}
          className="cursor-pointer border px-3 py-1 text-sm"
        >
          {uiText(lang, "chooseFile")}
        </label>
        {selected ? <span className="text-sm">{selected.name}</span> : null}
        <button
          type="button"
          className="border px-3 py-1 text-sm disabled:opacity-50"
          data-testid="file-upload"
          disabled={!mounted || uploading || !selected}
          onClick={() => void upload()}
        >
          {uploading ? uiText(lang, "uploading") : uiText(lang, "upload")}
        </button>
      </div>
      {uploadError ? (
        <p className="mt-2 text-sm opacity-60">{uiText(lang, "uploadFailed")}</p>
      ) : null}
    </section>
  );
}
