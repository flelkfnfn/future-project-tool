"use client";

import { useEffect, useMemo, useState } from "react";
import MotionAwareSpinner from "@/components/ui/MotionAwareSpinner";
import { toast } from "sonner";

type PollOption = { id: number; label: string; count: number };

type PollData = {
  id: number;
  noticeId: number;
  question: string | null;
  multiple: boolean;
  anonymous: boolean;
  allowChange: boolean;
  deadline: string | null;
  closed: boolean;
  totalVotes: number;
  options: PollOption[];
  myVotes: number[];
};

type PollResponse =
  | { ok: true; poll: PollData | null }
  | { ok: false; error: string };

export default function NoticePoll({ noticeId }: { noticeId: number }) {
  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState<PollData | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notices/polls?noticeId=${noticeId}`, {
        cache: "no-store",
        credentials: "include",
      });
      const j = (await res.json()) as PollResponse;
      if (j.ok) {
        setPoll(j.poll);
        setSelected(j.poll?.myVotes ?? []);
      } else {
        setPoll(null);
      }
    } catch {
      setPoll(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noticeId]);

  const total = poll?.totalVotes ?? 0;

  const canVote = useMemo(() => {
    if (!poll) return false;
    if (poll.closed) return false;
    if (!poll.allowChange && (poll.myVotes?.length ?? 0) > 0) return false;
    return true;
  }, [poll]);

  const toggleChoice = (optionId: number) => {
    if (!poll) return;
    if (!canVote) return;
    if (!poll.multiple) {
      setSelected([optionId]);
      return;
    }
    setSelected((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  const submitVote = async () => {
    if (!poll) return;
    if (!canVote) return;
    if (selected.length === 0) {
      toast.error("Select at least 1 option.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/notices/polls/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noticeId: poll.noticeId, optionIds: selected }),
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || j.ok !== true) {
        toast.error(j?.error ? String(j.error) : "VOTE_FAILED");
        return;
      }
      toast.success("Saved.");
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <MotionAwareSpinner className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent" />
        <span>Loading poll…</span>
      </div>
    );
  }

  if (!poll) return null;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="font-semibold text-gray-900 dark:text-gray-100">
          {poll.question?.trim() ? poll.question : "Poll"}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {poll.multiple ? "Multiple" : "Single"}
          {poll.deadline ? ` · closes ${new Date(poll.deadline).toLocaleString()}` : ""}
          {poll.closed ? " · closed" : ""}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {poll.options.map((opt) => {
          const checked = selected.includes(opt.id);
          const pct = total > 0 ? Math.round((opt.count / total) * 100) : 0;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleChoice(opt.id)}
              disabled={!canVote}
              className={`w-full text-left rounded-md border px-3 py-2 transition ${
                checked
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-200 bg-white dark:bg-gray-900/40 dark:border-gray-700"
              } ${canVote ? "hover:border-blue-300" : "opacity-80 cursor-not-allowed"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-4 w-4 border ${
                        poll.multiple ? "rounded-sm" : "rounded-full"
                      } ${checked ? "bg-blue-600 border-blue-600" : "border-gray-400"}`}
                      aria-hidden
                    />
                    <span className="font-medium text-gray-900 dark:text-gray-100 break-words">
                      {opt.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  <span>{opt.count}</span>
                  <span>({pct}%)</span>
                </div>
              </div>
              <div className="mt-2 h-2 w-full rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={submitVote}
          disabled={!canVote || submitting}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? (
            <MotionAwareSpinner className="h-4 w-4 rounded-full border-2 border-white/80 border-t-transparent" />
          ) : null}
          {poll.myVotes.length > 0 ? (poll.allowChange ? "Update vote" : "Voted") : "Vote"}
        </button>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Total: {poll.totalVotes}
          {poll.anonymous ? " · anonymous" : ""}
        </div>
      </div>
    </div>
  );
}

