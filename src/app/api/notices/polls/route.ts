import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PollRow = {
  id: number;
  notice_id: number;
  question: string | null;
  multiple: boolean;
  anonymous: boolean;
  allow_change: boolean;
  deadline: string | null;
};

type OptionRow = {
  id: number;
  poll_id: number;
  label: string;
  position: number;
};

type VoteRow = {
  option_id: number;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const noticeId = Number(url.searchParams.get("noticeId"));
  if (!Number.isFinite(noticeId) || noticeId <= 0) {
    return NextResponse.json(
      { ok: false, error: "NOTICE_ID_REQUIRED" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: poll, error: pollErr } = await supabase
    .from("notice_polls")
    .select(
      "id, notice_id, question, multiple, anonymous, allow_change, deadline"
    )
    .eq("notice_id", noticeId)
    .maybeSingle();

  if (pollErr) {
    return NextResponse.json(
      { ok: false, error: pollErr.message },
      { status: 500 }
    );
  }

  if (!poll) {
    return NextResponse.json({ ok: true, poll: null });
  }

  const pollRow = poll as unknown as PollRow;

  const [{ data: options, error: optErr }, { data: votes, error: votesErr }] =
    await Promise.all([
      supabase
        .from("notice_poll_options")
        .select("id, poll_id, label, position")
        .eq("poll_id", pollRow.id)
        .order("position", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("notice_poll_votes")
        .select("option_id")
        .eq("poll_id", pollRow.id),
    ]);

  if (optErr) {
    return NextResponse.json(
      { ok: false, error: optErr.message },
      { status: 500 }
    );
  }
  if (votesErr) {
    return NextResponse.json(
      { ok: false, error: votesErr.message },
      { status: 500 }
    );
  }

  const optionRows = (options as unknown as OptionRow[]) ?? [];
  const counts: Record<number, number> = {};
  for (const v of ((votes as unknown as VoteRow[]) ?? [])) {
    counts[v.option_id] = (counts[v.option_id] ?? 0) + 1;
  }

  const auth = await getAuth();
  let myVotes: number[] = [];
  if (auth.authenticated && auth.principal?.id) {
    const userId = String(auth.principal.id);
    const { data: mine, error: mineErr } = await supabase
      .from("notice_poll_votes")
      .select("option_id")
      .eq("poll_id", pollRow.id)
      .eq("user_id", userId);
    if (!mineErr) {
      myVotes = (
        ((mine as unknown as VoteRow[]) ?? []).map((r) => r.option_id) ?? []
      ).filter((n) => Number.isFinite(n));
    }
  }

  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);

  const deadlineTs = pollRow.deadline ? Date.parse(pollRow.deadline) : null;
  const closedByDeadline =
    deadlineTs != null && Number.isFinite(deadlineTs) && Date.now() > deadlineTs;

  return NextResponse.json({
    ok: true,
    poll: {
      id: pollRow.id,
      noticeId: pollRow.notice_id,
      question: pollRow.question,
      multiple: !!pollRow.multiple,
      anonymous: !!pollRow.anonymous,
      allowChange: !!pollRow.allow_change,
      deadline: pollRow.deadline,
      closed: closedByDeadline,
      totalVotes,
      options: optionRows.map((o) => ({
        id: o.id,
        label: o.label,
        count: counts[o.id] ?? 0,
      })),
      myVotes,
    },
  });
}

