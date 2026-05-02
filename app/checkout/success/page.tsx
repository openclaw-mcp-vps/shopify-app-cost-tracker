import { ArrowRight, CheckCircle2 } from "lucide-react";

const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function CheckoutSuccessPage(props: CheckoutSuccessPageProps) {
  const searchParams = await props.searchParams;
  const sessionId = searchParams.session_id;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-14">
      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-8">
        <div className="inline-flex rounded-full bg-[#0d1117] p-2 text-[#3fb950]">
          <CheckCircle2 size={20} />
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-[#f0f6fc]">Complete access setup</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#8b949e]">
          If Stripe redirected you with a checkout session ID, click below to verify payment and unlock the dashboard.
        </p>

        {sessionId ? (
          <a
            href={`/api/checkout?session_id=${encodeURIComponent(sessionId)}`}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#2ea043] px-5 py-3 text-sm font-semibold text-[#f0fff4] transition hover:bg-[#3fb950]"
          >
            Verify Purchase & Unlock
            <ArrowRight size={16} />
          </a>
        ) : (
          <p className="mt-6 rounded-md border border-[#30363d] bg-[#0d1117] px-4 py-3 text-sm text-[#ff7b72]">
            Missing session_id. Set your Stripe Payment Link success URL to include
            <code className="mx-1 rounded bg-[#161b22] px-1 py-0.5 text-[#e6edf3]">?session_id={"{CHECKOUT_SESSION_ID}"}</code>
            and try checkout again.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={paymentLink}
            className="rounded-md border border-[#30363d] px-4 py-2 text-sm font-medium text-[#c9d1d9] transition hover:border-[#58a6ff] hover:text-[#58a6ff]"
          >
            Open Checkout
          </a>
          <a
            href="/api/checkout?demo=1"
            className="rounded-md border border-[#30363d] px-4 py-2 text-sm font-medium text-[#8b949e] transition hover:text-[#c9d1d9]"
          >
            Dev Unlock (local)
          </a>
        </div>
      </div>
    </main>
  );
}
