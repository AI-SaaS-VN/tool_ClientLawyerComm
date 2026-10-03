"use client";

import { useState, useSyncExternalStore } from "react";

import { uiText } from "@/modules/i18n/copy";
import { formatRecordTime } from "@/modules/i18n/record-time";

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

export function ReviewQueue({
  initialTasks,
  lang,
}: {
  initialTasks: ReviewTaskItem[];
  lang: string;
}) {
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
      const reason = window.prompt(uiText(lang, "reviewPromptReason")) ?? "";
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
        {uiText(lang, "reviewEmpty")}
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {tasks.map((task) => (
        <li key={task.id} className="border px-4 py-3" data-testid="review-task">
          <div className="text-sm">
            {task.caseTitle} · {task.targetType} · {task.submitterDisplayName} ·{" "}
            <time dateTime={task.createdAt}>{formatRecordTime(task.createdAt)}</time>
          </div>
          <div className="mt-1 text-sm">
            {uiText(lang, "reviewReason")}: {task.reason}
          </div>
          {task.sourceText && <p className="mt-2 border-l-2 pl-3 text-sm">{task.sourceText}</p>}
          {task.selfReleaseRequired && (
            <p className="mt-2 text-sm font-medium">
              {uiText(lang, "reviewSole")}
            </p>
          )}
          {task.alertIssue && (
            <p className="mt-2 text-sm font-medium">
              {uiText(lang, "reviewAlertIssue")}
            </p>
          )}
          <div className="mt-3 flex gap-2 text-sm">
            <button
              className="border px-3 py-1"
              data-testid="review-approve"
              disabled={!mounted}
              onClick={() => decide(task.id, "approve", task.selfReleaseRequired)}
            >
              {uiText(lang, "approve")}
            </button>
            <button className="border px-3 py-1" disabled={!mounted} onClick={() => decide(task.id, "return")}>
              {uiText(lang, "returnAction")}
            </button>
            <button className="border px-3 py-1" disabled={!mounted} onClick={() => decide(task.id, "reject")}>
              {uiText(lang, "reject")}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
