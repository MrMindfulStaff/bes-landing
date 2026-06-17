import AuthShell from "@/components/auth/AuthShell";
import ResetForm from "@/components/auth/ResetForm";

export const metadata = { title: "Set new password | BES" };

export default function ResetPage() {
  return (
    <AuthShell title="Choose a new password" subtitle="Almost there.">
      <ResetForm />
    </AuthShell>
  );
}
