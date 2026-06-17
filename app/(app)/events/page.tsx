import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Events | BES" };

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, description, location, starts_at")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(50);

  return (
    <div>
      <h1
        className="text-2xl font-black mb-1"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Events
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Live calls, workshops, and challenge kickoffs.
      </p>

      {(events ?? []).length === 0 ? (
        <div className="rounded-xl bg-dark-card border border-dark-border p-10 text-center">
          <p className="text-gray-400">No upcoming events yet. Stay tuned. 📅</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(events ?? []).map((e) => (
            <div key={e.id} className="rounded-xl bg-dark-card border border-dark-border p-5">
              <p className="text-gold text-sm font-semibold">
                {new Date(e.starts_at).toLocaleString()}
              </p>
              <h3 className="font-bold text-white mt-1">{e.title}</h3>
              {e.description && (
                <p className="text-gray-400 text-sm mt-1">{e.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
