import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = { title: "Log in | The Black Entrepreneurship Society" };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to the Society.">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
