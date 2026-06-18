import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import AddEvent from "@/components/events/AddEvent";
import EventRsvp from "@/components/events/EventRsvp";
import EventDeleteButton from "@/components/events/EventDeleteButton";

export const metadata = { title: "Events | BES" };

type Rsvp = { event_id: string; user_id: string; status: string };

function fmt(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-US", { day: "numeric" }),
    mon: d.toLocaleDateString("en-US", { month: "short" }),
    full: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

export default async function EventsPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  const { data: events } = await supabase
    .from("events")
    .select("id, title, description, location, starts_at, ends_at")
    .gte("starts_at", new Date(Date.now() - 3 * 3600 * 1000).toISOString())
    .order("starts_at");

  const ids = (events ?? []).map((e) => e.id);
  const { data: rsvps } = ids.length
    ? await supabase.from("event_rsvps").select("event_id, user_id, status").in("event_id", ids)
    : { data: [] as Rsvp[] };

  const going: Record<string, number> = {};
  const mine: Record<string, string> = {};
  for (const r of (rsvps ?? []) as Rsvp[]) {
    if (r.status === "going") going[r.event_id] = (going[r.event_id] || 0) + 1;
    if (r.user_id === profile?.id) mine[r.event_id] = r.status;
  }

  return (
    <div>
      <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
        Events
      </h1>
      <p className="text-gray-500 text-sm mb-6">Live calls, workshops, and challenge kickoffs.</p>

      {isAdmin && <AddEvent />}

      {(events ?? []).length === 0 ? (
        <div className="rounded-xl bg-dark-card border border-dark-border p-10 text-center">
          <p className="text-gray-400">No upcoming events yet. 📅</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(events ?? []).map((e) => {
            const d = fmt(e.starts_at);
            return (
              <div key={e.id} className="rounded-xl bg-dark-card border border-dark-border p-5 flex gap-5">
                <div className="flex-shrink-0 w-14 text-center">
                  <div className="text-xs uppercase text-gold font-semibold">{d.mon}</div>
                  <div className="text-2xl font-black text-white">{d.day}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-white">{e.title}</h3>
                    {isAdmin && <EventDeleteButton id={e.id} />}
                  </div>
                  <p className="text-sm text-gold">
                    {d.full} · {d.time}
                  </p>
                  {e.location && <p className="text-sm text-gray-400 mt-0.5">📍 {e.location}</p>}
                  {e.description && <p className="text-gray-300 text-sm mt-2">{e.description}</p>}
                  <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
                    <EventRsvp eventId={e.id} myStatus={mine[e.id] ?? null} />
                    <span className="text-xs text-gray-500">{going[e.id] || 0} going</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
