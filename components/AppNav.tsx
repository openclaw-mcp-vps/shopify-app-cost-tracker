import Link from "next/link";

export function AppNav() {
  return (
    <header className="border-b border-[#21262d] bg-[#0d1117]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-sm font-semibold tracking-wide text-[#e6edf3]">
          Shopify App Cost Tracker
        </Link>
        <nav className="flex items-center gap-2 text-sm text-[#8b949e]">
          <Link href="/dashboard" className="rounded px-3 py-2 transition hover:bg-[#161b22] hover:text-[#e6edf3]">
            Dashboard
          </Link>
          <Link href="/stores" className="rounded px-3 py-2 transition hover:bg-[#161b22] hover:text-[#e6edf3]">
            Stores
          </Link>
          <Link href="/apps" className="rounded px-3 py-2 transition hover:bg-[#161b22] hover:text-[#e6edf3]">
            Apps
          </Link>
        </nav>
      </div>
    </header>
  );
}
