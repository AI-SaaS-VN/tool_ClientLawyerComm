"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

interface FileItem {
  id: string;
  uploaderDisplayName: string;
  status: string;
  originalName: string;
  sizeBytes: number;
  createdAt: string;
}

// The API returns the raw SPEC 8.1 status; the panel renders the bilingual
// label, mirroring how the messages panel shows send status.
const STATUS_LABELS: Record<string, string> = {
  uploaded: "处理中 / Đang xử lý",
  scanning: "处理中 / Đang xử lý",
  pending_review: "待审核 / Chờ duyệt",
  approved: "处理中 / Đang xử lý",
  published: "已发布 / Đã phát hành",
  returned: "已退回 / Đã trả lại",
  rejected: "被拒绝 / Bị từ chối",
  check_failed: "检查失败 / Kiểm tra thất bại",
};

export function FilesPanel({ caseId }: { caseId: string }) {
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
      <h2 className="mb-2 font-medium">附件 / Tệp đính kèm</h2>
      {error ? <p className="text-sm opacity-60">加载失败 / Tải thất bại</p> : null}
      <ul className="flex flex-col gap-2" data-testid="file-list">
        {files.map((file) => (
          <li key={file.id} className="rounded border p-3 text-sm" data-testid="file-item">
            <span className="font-medium">{file.originalName}</span>
            <span className="ml-2 opacity-60">
              {STATUS_LABELS[file.status] ?? file.status} · {file.uploaderDisplayName} ·{" "}
              {new Date(file.createdAt).toLocaleString()}
            </span>
            {file.status === "published" ? (
              <a
                className="ml-3 underline"
                data-testid="file-download"
                href={`/api/files/${file.id}/download`}
              >
                下载 / Tải xuống
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
          选择文件 / Chọn tệp
        </label>
        {selected ? <span className="text-sm">{selected.name}</span> : null}
        <button
          type="button"
          className="border px-3 py-1 text-sm disabled:opacity-50"
          data-testid="file-upload"
          disabled={!mounted || uploading || !selected}
          onClick={() => void upload()}
        >
          {uploading ? "上传中… / Đang tải lên…" : "上传 / Tải lên"}
        </button>
      </div>
      {uploadError ? (
        <p className="mt-2 text-sm opacity-60">上传失败，请重试。 / Tải lên thất bại, thử lại.</p>
      ) : null}
    </section>
  );
}
