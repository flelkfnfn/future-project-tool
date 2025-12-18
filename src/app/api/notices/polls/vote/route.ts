import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PollRow = {
  id: number;
  notice_id: number;
  multiple: boolean;
  allow_change: boolean;
  deadline: string | null;
};

type OptionRow = { id: number };

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth.authenticated || !auth.principal?.id) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const noticeId = Number((body as any)?.noticeId);
  const optionIdsRaw = (body as any)?.optionIds;
  const optionIds = Array.isArray(optionIdsRaw)
    ? optionIdsRaw
        .map((n: any) => Number(n))
        .filter((n: number) => Number.isFinite(n))
    : [];

  if (!Number.isFinite(noticeId) || noticeId <= 0) {
    return NextResponse.json(
      { ok: false, error: "NOTICE_ID_REQUIRED" },
      { status: 400 }
    );
  }
  if (optionIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "OPTION_REQUIRED" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: poll, error: pollErr } = await supabase
    .from("notice_polls")
    .select("id, notice_id, multiple, allow_change, deadline")
    .eq("notice_id", noticeId)
    .maybeSingle();

  if (pollErr) {
    return NextResponse.json({ ok: false, error: pollErr.message }, { status: 500 });
  }
  if (!poll) {
    return NextResponse.json({ ok: false, error: "POLL_NOT_FOUND" }, { status: 404 });
  }

  const pollRow = poll as unknown as PollRow;

  const deadlineTs = pollRow.deadline ? Date.parse(pollRow.deadline) : null;
  const closedByDeadline =
    deadlineTs != null && Number.isFinite(deadlineTs) && Date.now() > deadlineTs;
  if (closedByDeadline) {
    return NextResponse.json({ ok: false, error: "POLL_CLOSED" }, { status: 400 });
  }

  const { data: allowedOptions, error: optErr } = await supabase
    .from("notice_poll_options")
    .select("id")
    .eq("poll_id", pollRow.id);
  if (optErr) {
    return NextResponse.json({ ok: false, error: optErr.message }, { status: 500 });
  }
  const allowed = new Set(
    ((allowedOptions as unknown as OptionRow[]) ?? []).map((o) => o.id)
  );
  const validOptionIds = Array.from(new Set(optionIds)).filter((id) =>
    allowed.has(id)
  );
  if (validOptionIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "INVALID_OPTION" },
      { status: 400 }
    );
  }
  if (!pollRow.multiple && validOptionIds.length !== 1) {
    return NextResponse.json(
      { ok: false, error: "SINGLE_CHOICE_ONLY" },
      { status: 400 }
    );
  }

  const userId = String(auth.principal.id);

  const { data: existing, error: existingErr } = await supabase
    .from("notice_poll_votes")
    .select("id")
    .eq("poll_id", pollRow.id)
    .eq("user_id", userId)
    .limit(1);

  if (existingErr) {
    return NextResponse.json(
      { ok: false, error: existingErr.message },
      { status: 500 }
    );
  }

  const hasVoted = Array.isArray(existing) && existing.length > 0;
  if (hasVoted && !pollRow.allow_change) {
    return NextResponse.json(
      { ok: false, error: "ALREADY_VOTED" },
      { status: 400 }
    );
  }

  if (hasVoted) {
    const { error: delErr } = await supabase
      .from("notice_poll_votes")
      .delete()
      .eq("poll_id", pollRow.id)
      .eq("user_id", userId);
    if (delErr) {
      return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
    }
  }

  const rows = validOptionIds.map((optionId) => ({
    poll_id: pollRow.id,
    option_id: optionId,
    user_id: userId,
  }));

  const { error: insErr } = await supabase.from("notice_poll_votes").insert(rows);
  if (insErr) {
    return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

