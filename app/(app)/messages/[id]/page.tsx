import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { markConversationRead } from "@/lib/actions";
import Avatar from "@/components/app/Avatar";
import MessageComposer from "@/components/messages/MessageComposer";
import RealtimeMessages from "@/components/messages/RealtimeMessages";

export const metadata = { title: "Conversation | BES" };

type Profile = { id: string; full_name: string | null; avatar_url: string | null };

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getProfile();
  if (!me) return null;
  const supabase = await createClient();

  const { data: parts } = await supabase
    .from("conversation_participants")
    .select("user_id, profile:profiles!conversation_participants_user_id_fkey(id, full_name, avatar_url)")
    .eq("conversation_id", id);

  if (!parts || !parts.some((p) => p.user_id === me.id)) notFound();
  const otherRaw = parts.find((p) => p.user_id !== me.id)?.profile as Profile | Profile[] | undefined;
  const other: Profile | null = (Array.isArray(otherRaw) ? otherRaw[0] : otherRaw) ?? null;

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", id)
    .order("created_at");

  await markConversationRead(id);

  return (
    <div className="max-w-2xl">
      <RealtimeMessages conversationId={id} />

      <Link href="/messages" className="text-sm text-gray-500 hover:text-gold">
        ← Messages
      </Link>

      <Link
        href={other ? `/members/${other.id}` : "#"}
        className="flex items-center gap-3 mt-2 mb-4 pb-4 border-b border-dark-border"
      >
        <Avatar url={other?.avatar_url} name={other?.full_name} size={40} />
        <span className="font-bold text-white">{other?.full_name || "Member"}</span>
      </Link>

      <div className="space-y-3 min-h-[40vh]">
        {(messages ?? []).length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-10">
            Say hi to {other?.full_name || "them"} 👋
          </p>
        ) : (
          (messages ?? []).map((m) => {
            const mine = m.sender_id === me.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    mine ? "gold-bg-gradient text-black" : "bg-dark-card border border-dark-border text-gray-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <MessageComposer conversationId={id} />
    </div>
  );
}
