import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import logo from "@/assets/nexa-club-logo.png";
import { AppBackground } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { ACADEMY, formatDate } from "@/lib/format";

/** Public mini page opened by scanning a swimmer's QR code. */
export const Route = createFileRoute("/swimmer")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "بطاقة السباح الرقمية — NEXA Sport" },
      { name: "description", content: "عرض سريع لحالة اشتراك السباح في فرع السباحة NEXA Sport." },
      { property: "og:title", content: "بطاقة السباح الرقمية — NEXA Sport" },
      { property: "og:description", content: "امسح رمز QR لعرض صورة السباح وحالة اشتراكه." },
    ],
  }),
  component: PublicSwimmer,
});

function PublicSwimmer() {
  const { id } = Route.useSearch();
  const [loading, setLoading] = useState(true);
  const [swimmer, setSwimmer] = useState<{ id: string; name_ar: string; name_fr: string; photo: string | null; subscription_status: string; expires_at: string | null } | null>(null);
  useEffect(() => {
    if (!id) { setLoading(false); return; }
    void supabase.from("swimmer_public_cards").select("id,name_ar,name_fr,photo,subscription_status,expires_at").eq("id", id).maybeSingle().then(({ data }) => { setSwimmer(data); setLoading(false); });
  }, [id]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <AppBackground />
      <div className="glass-panel w-full max-w-sm overflow-hidden">
        <div className="flex items-center gap-3 bg-primary px-5 py-4 text-primary-foreground">
          <img src={logo} alt="NEXA Sport" className="h-11 w-11 rounded bg-white/90 p-0.5" />
          <div>
            <p className="font-display font-extrabold">NEXA Sport</p>
            <p className="text-xs text-white/80">
              {ACADEMY.branch} · {ACADEMY.address}
            </p>
          </div>
        </div>

        {loading ? <div className="p-8 text-center text-sm text-muted-foreground">جاري تحميل البطاقة…</div> : !swimmer ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            لم يتم العثور على بطاقة هذا السباح.
          </div>
        ) : (
          <div className="p-6 text-center">
            {swimmer.photo ? (
              <img
                src={swimmer.photo}
                alt={swimmer.name_ar}
                className="mx-auto h-32 w-32 rounded-full border-4 border-secondary object-cover"
              />
            ) : (
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-muted font-bold">
                NEXA
              </div>
            )}
            <h1 className="mt-4 font-display text-2xl font-extrabold text-primary">
              {swimmer.name_ar}
            </h1>
            <p dir="ltr" className="text-sm text-muted-foreground">
              {swimmer.name_fr}
            </p>

            <div
              className={`mt-5 rounded-xl px-4 py-3 font-display text-lg font-extrabold ${
                swimmer.subscription_status === "active"
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {swimmer.subscription_status === "active" ? "الاشتراك نشط" : "الاشتراك منتهي"}
            </div>
            <p className="mt-3 text-sm">
              تاريخ انتهاء الاشتراك:{" "}
              <span className="font-bold text-primary">{formatDate(swimmer.expires_at)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
