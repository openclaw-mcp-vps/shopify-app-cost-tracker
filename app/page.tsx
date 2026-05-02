import { CheckCircle2, DollarSign, Layers3, ShieldCheck, Store, TrendingDown } from "lucide-react";

const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

const faq = [
  {
    q: "How does data collection work?",
    a: "You connect each Shopify store through OAuth, then the tracker reads app installation and subscription billing data from the Shopify Admin API." 
  },
  {
    q: "Can I monitor multiple client stores in one account?",
    a: "Yes. Agency owners can connect each client store and compare spend across the full portfolio from one dashboard."
  },
  {
    q: "How does the paywall unlock after payment?",
    a: "Stripe redirects customers back with a Checkout Session ID. The app verifies that session server-side, then sets a secure cookie for dashboard access."
  },
  {
    q: "What kind of savings do agencies usually find?",
    a: "Most teams identify 15-30% reducible app spend in the first month by removing overlapping tools and renegotiating top subscriptions."
  }
];

export default function HomePage() {
  return (
    <main>
      <header className="border-b border-[#21262d] bg-[#0d1117]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-[#1f6feb] p-2 text-white">
              <DollarSign size={16} />
            </div>
            <span className="text-sm font-semibold tracking-wide text-[#e6edf3]">Shopify App Cost Tracker</span>
          </div>
          <a
            href="/dashboard"
            className="rounded-md border border-[#30363d] px-4 py-2 text-sm font-medium text-[#c9d1d9] transition hover:border-[#58a6ff] hover:text-[#58a6ff]"
          >
            Open Dashboard
          </a>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-16 pt-14 md:grid-cols-2 md:items-center">
        <div>
          <p className="inline-flex rounded-full border border-[#30363d] bg-[#161b22] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#58a6ff]">
            Built for E-commerce Agencies
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-[#f0f6fc] md:text-5xl">
            Track Shopify app subscription costs across every store you manage.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[#8b949e]">
            Most stores accumulate 10-20 paid apps. Over time, duplicate functionality and silent price increases can drain $200-500 every month. This tracker gives you a clear cost map and optimization plan.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={paymentLink}
              className="rounded-md bg-[#2ea043] px-5 py-3 text-sm font-semibold text-[#f0fff4] transition hover:bg-[#3fb950]"
            >
              Start for $19/mo
            </a>
            <a
              href="/checkout/success"
              className="rounded-md border border-[#30363d] px-5 py-3 text-sm font-semibold text-[#c9d1d9] transition hover:border-[#58a6ff] hover:text-[#58a6ff]"
            >
              Unlock After Purchase
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6">
          <h2 className="text-lg font-semibold text-[#f0f6fc]">What the tracker surfaces in minutes</h2>
          <ul className="mt-4 space-y-3 text-sm text-[#c9d1d9]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 text-[#3fb950]" size={16} />
              Live monthly app spend across all connected stores
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 text-[#3fb950]" size={16} />
              Price-change detection from historical sync snapshots
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 text-[#3fb950]" size={16} />
              Duplicate functionality alerts by app category
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 text-[#3fb950]" size={16} />
              Savings recommendations ranked by impact
            </li>
          </ul>
        </div>
      </section>

      <section className="border-y border-[#21262d] bg-[#0f141b]">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-14 md:grid-cols-3">
          <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
            <Store className="text-[#58a6ff]" size={20} />
            <h3 className="mt-3 text-lg font-semibold text-[#f0f6fc]">Problem: Store Sprawl</h3>
            <p className="mt-2 text-sm text-[#8b949e]">
              Agency owners lose visibility when each client store has its own app stack, billing cycle, and hidden upsells.
            </p>
          </div>
          <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
            <Layers3 className="text-[#58a6ff]" size={20} />
            <h3 className="mt-3 text-lg font-semibold text-[#f0f6fc]">Problem: Duplicate Tools</h3>
            <p className="mt-2 text-sm text-[#8b949e]">
              It is common to pay for multiple apps solving the same job, especially after team changes or migrations.
            </p>
          </div>
          <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
            <TrendingDown className="text-[#58a6ff]" size={20} />
            <h3 className="mt-3 text-lg font-semibold text-[#f0f6fc]">Problem: Margin Erosion</h3>
            <p className="mt-2 text-sm text-[#8b949e]">
              App subscriptions quietly expand over time and eat into client profitability unless someone audits them monthly.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-semibold text-[#f0f6fc]">Solution: One operating system for app cost control</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-[#30363d] bg-[#161b22] p-6">
            <h3 className="text-lg font-semibold text-[#e6edf3]">Automated cost inventory</h3>
            <p className="mt-2 text-sm text-[#8b949e]">
              Connect stores via Shopify OAuth and sync app subscriptions into a normalized monthly cost model in USD.
            </p>
          </article>
          <article className="rounded-xl border border-[#30363d] bg-[#161b22] p-6">
            <h3 className="text-lg font-semibold text-[#e6edf3]">Actionable optimization feed</h3>
            <p className="mt-2 text-sm text-[#8b949e]">
              The dashboard flags price hikes, duplicate categories, and high-spend outliers with estimated savings.
            </p>
          </article>
          <article className="rounded-xl border border-[#30363d] bg-[#161b22] p-6">
            <h3 className="text-lg font-semibold text-[#e6edf3]">Paywall-ready access control</h3>
            <p className="mt-2 text-sm text-[#8b949e]">
              Stripe Checkout verification sets secure cookies, so only paying users can access the tool and synced store data.
            </p>
          </article>
          <article className="rounded-xl border border-[#30363d] bg-[#161b22] p-6">
            <h3 className="text-lg font-semibold text-[#e6edf3]">Production deployment path</h3>
            <p className="mt-2 text-sm text-[#8b949e]">
              Runs on Next.js App Router with Postgres via direct SQL, no ORM codegen pitfalls in serverless deploys.
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-[#21262d] bg-[#0f141b]">
        <div className="mx-auto w-full max-w-4xl px-6 py-16 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#30363d] bg-[#161b22] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#58a6ff]">
            <ShieldCheck size={14} /> Pricing
          </p>
          <h2 className="mt-5 text-3xl font-semibold text-[#f0f6fc]">Flat pricing, immediate savings focus</h2>
          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#30363d] bg-[#161b22] p-8 text-left">
            <p className="text-sm text-[#8b949e]">Plan</p>
            <p className="mt-1 text-3xl font-semibold text-[#f0f6fc]">$19<span className="text-base text-[#8b949e]">/month</span></p>
            <ul className="mt-6 space-y-3 text-sm text-[#c9d1d9]">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 text-[#3fb950]" size={16} />Unlimited connected Shopify stores</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 text-[#3fb950]" size={16} />App subscription sync + spend dashboard</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 text-[#3fb950]" size={16} />Price-change and duplication alerts</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 text-[#3fb950]" size={16} />Optimization recommendations with savings estimates</li>
            </ul>
            <a
              href={paymentLink}
              className="mt-7 inline-flex rounded-md bg-[#2ea043] px-5 py-3 text-sm font-semibold text-[#f0fff4] transition hover:bg-[#3fb950]"
            >
              Buy Access
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 py-16">
        <h2 className="text-3xl font-semibold text-[#f0f6fc]">FAQ</h2>
        <div className="mt-8 space-y-4">
          {faq.map((item) => (
            <article key={item.q} className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
              <h3 className="text-base font-semibold text-[#e6edf3]">{item.q}</h3>
              <p className="mt-2 text-sm text-[#8b949e]">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
