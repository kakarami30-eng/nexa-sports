import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import logo from "@/assets/nexa-club-logo.png";
import poolBg from "@/assets/olympic-pool-bg.jpg";
import { ACADEMY } from "@/lib/format";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "لوحة التحكم" },
  { to: "/swimmers/new", label: "تسجيل سباح" },
  { to: "/finance", label: "المالية" },
] as const;

export function AppBackground() {
  return (
    <>
      <div className="app-backdrop" style={{ backgroundImage: `url(${poolBg})` }} aria-hidden />
      <div className="app-overlay" aria-hidden />
    </>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen">
      <AppBackground />

      <header className="no-print px-4 pt-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-2xl glass-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="NEXA Sport"
              width={56}
              height={56}
              className="h-16 w-16 object-contain"
            />
            <div>
              <p className="font-display text-xl font-extrabold leading-tight">
                NEXA Sport — {ACADEMY.branch}
              </p>
              <p className="text-xs text-white/80">{ACADEMY.address}</p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/20"
                activeOptions={{ exact: item.to === "/" }}
                inactiveProps={{ style: { color: "rgba(255,255,255,0.85)" } }}
                activeProps={{
                  className: "bg-white hover:bg-white",
                  style: { color: "var(--primary)" },
                }}
              >
                {item.label}
              </Link>
            ))}
            <Button type="button" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground" onClick={() => { void navigate({ to: "/auth" }); }}>خروج</Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

      <footer className="no-print pb-8 text-center text-xs text-white/70">
        NEXA Sport · {ACADEMY.address} · {ACADEMY.phone}
      </footer>
    </div>
  );
}