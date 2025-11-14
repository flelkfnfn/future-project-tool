import MarketingLanding from "@/components/home/MarketingLanding";
import DashboardHome, {
  type DashboardData,
  type UpcomingDeadline,
} from "@/components/home/DashboardHome";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAuth } from "@/lib/auth/session";
import {
  HOME_VARIANT_COOKIE,
  parseHomeVariant,
} from "@/lib/home-variant";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";

type CalendarEventRow = {
  id: number;
  title: string;
  description?: string | null;
  event_date: string;
};

type NoticeRow = {
  id: number;
  title: string;
  content: string;
};

type ProjectLinkRow = {
  id: number;
  url: string;
  title: string;
  project_id: number;
};

type ProjectRow = {
  id: number;
  name: string;
  description?: string | null;
  project_links?: ProjectLinkRow[] | null;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  noStore();
  const auth = await getAuth();
  const jar = await cookies();
  const preferredVariant = parseHomeVariant(
    jar.get(HOME_VARIANT_COOKIE)?.value
  );

  if (!auth.authenticated || !auth.principal) {
    return <MarketingLanding />;
  }

  if (preferredVariant === "classic") {
    return <MarketingLanding />;
  }

  let userName = "사용자";
  if (auth.principal.source === "local") {
    userName = auth.principal.username;
  } else {
    userName = auth.principal.email ?? userName;
    try {
      const supabase = await createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      userName =
        (session?.user.user_metadata?.full_name as string | undefined) ||
        auth.principal.email ||
        userName;
    } catch {
      /* ignore name fetch errors */
    }
  }

  const dashboardData = await getDashboardData();

  return <DashboardHome userName={userName} {...dashboardData} />;
}

async function getDashboardData(): Promise<DashboardData> {
  const supabase = createServiceClient() as SupabaseClient<Database>;
  const nowISO = new Date().toISOString();

  const [deadlinesRes, noticesRes, projectsRes] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("id, title, description, event_date")
      .gte("event_date", nowISO)
      .order("event_date", { ascending: true })
      .limit(4),
    supabase
      .from("notices")
      .select("id, title, content")
      .order("id", { ascending: false })
      .limit(4),
    supabase
      .from("projects")
      .select("id, name, description, project_links (id, url, title, project_id)")
      .order("id", { ascending: false })
      .limit(4),
  ]);

  const deadlines = mapDeadlines(deadlinesRes);
  const notices = noticesRes.error ? [] : (noticesRes.data as NoticeRow[]) ?? [];
  const projects = mapProjects(projectsRes);

  return { deadlines, notices, projects };
}

function mapDeadlines(response: {
  data: CalendarEventRow[] | null;
  error: unknown;
}): UpcomingDeadline[] {
  if (response.error || !response.data) return [];
  return response.data.map((event) => {
    const eventDate = new Date(event.event_date);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      daysRemaining,
    };
  });
}

function mapProjects(response: {
  data: ProjectRow[] | null;
  error: unknown;
}): DashboardData["projects"] {
  if (response.error || !response.data) return [];

  return response.data.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    project_links: (project.project_links ?? []).map((link) => ({
      id: link.id,
      title: link.title,
      url: link.url,
    })),
  }));
}
