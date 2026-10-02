"use client";

import { useState, useSyncExternalStore } from "react";

interface ReviewTaskItem {
  id: string;
  caseTitle: string;
  targetType: string;
  reason: string;
  submitterDisplayName: string;
  sourceText: string | null;
  selfReleaseRequired: boolean;
  alertIssue: boolean;
  createdAt: string;
}

export function ReviewQueue({ initialTasks }: { initialTasks: ReviewTaskItem[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  // Hydration gate: server-rendered controls have no handlers yet.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  async function decide(taskId: string, action: "approve" | "return" | "reject", selfRelease = false) {
    const body: Record<string, unknown> = {};
    if (action !== "approve") {
      const reason = window.prompt("原因 / Lý do") ?? "";
      if (!reason.trim()) return;
      body.reason = reason;
    }
    if (selfRelease) body.selfRelease = true;
    const res = await fetch(`/api/review/tasks/${taskId}/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) setTasks((current) => current.filter((task) => task.id !== taskId));
  }

  if (tasks.length === 0) {
    return (
      <p className="text-sm" data-testid="review-empty">
        没有待审核内容。 / Không có nội dung chờ duyệt.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {tasks.map((task) => (
        <li key={task.id} className="border px-4 py-3" data-testid="review-task">
          <div className="text-sm">
            {task.caseTitle} · {task.targetType} · {task.submitterDisplayName} ·{" "}
            {new Date(task.createdAt).toLocaleString()}
          </div>
          <div className="mt-1 text-sm">拦截原因 / Lý do chặn: {task.reason}</div>
          {task.sourceText && <p className="mt-2 border-l-2 pl-3 text-sm">{task.sourceText}</p>}
          {task.selfReleaseRequired && (
            <p className="mt-2 text-sm font-medium">
              您是本案唯一审核人：确认放行需要明确自我放行。 / Bạn là ngưởi duyệt duy nhất: cần xác
              nhận tự phát hành.
            </p>
          )}
          {task.alertIssue && (
            <p className="mt-2 text-sm font-medium">
              提醒发送异常，请后台核查。 / Gửi nhắc nhở gặp sự cố, cần kiểm tra.
            </p>
          )}
          <div className="mt-3 flex gap-2 text-sm">
            <button
              className="border px-3 py-1"
              data-testid="review-approve"
              disabled={!mounted}
              onClick={() => decide(task.id, "approve", task.selfReleaseRequired)}
            >
              批准 / Duyệt
            </button>
            <button className="border px-3 py-1" disabled={!mounted} onClick={() => decide(task.id, "return")}>
              退回 / Trả lại
            </button>
            <button className="border px-3 py-1" disabled={!mounted} onClick={() => decide(task.id, "reject")}>
              拒绝 / Từ chối
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
