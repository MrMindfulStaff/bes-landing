import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = { title: "Join free | The Black Entrepreneurship Society" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Join the Society"
      subtitle="Free to join. Real tools, real founders, real momentum."
    >
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </AuthShell>
  );
}
