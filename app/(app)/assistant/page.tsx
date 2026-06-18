import { requireMember } from "@/lib/auth";
import AssistantChat from "@/components/assistant/AssistantChat";

export const metadata = { title: "BES AI" };

export default async function AssistantPage() {
  const profile = await requireMember();
  const firstName = profile?.full_name?.split(" ")[0] ?? null;

  return (
    <div>
      <div className="mb-4">
        <h1
          className="text-2xl font-black text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          BES AI
        </h1>
        <p className="text-sm text-gray-500">
          Your private business coach — trained on every classroom and the whole member network.
        </p>
      </div>
      <AssistantChat firstName={firstName} />
    </div>
  );
}
