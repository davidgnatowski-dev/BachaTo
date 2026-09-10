import { Header } from "@/components/Header";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function ConfirmPasswordResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Ustaw nowe hasło</h1>
        <p className="mt-1 text-sm text-muted">Link jest ważny 30 minut i można go użyć tylko raz.</p>
      </div>

      <ResetPasswordForm token={token} />
    </div>
  );
}
