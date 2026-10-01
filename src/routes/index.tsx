import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { QrCode, swimmerUrl } from "@/components/QrCode";
import { deleteSwimmer, latestPayment, subscriptionState, useDB } from "@/lib/store";
import { formatDate, formatMoney, statusLabels } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — NEXA Sport فرع السباحة" },
      {
        name: "description",
        content: "تسيير سباحي أكاديمية NEXA Sport بعين أزال: التسجيل، الاشتراكات، المدفوعات والوثائق.",
      },
      { property: "og:title", content: "لوحة التحكم — NEXA Sport فرع السباحة" },
      {
        property: "og:description",
        content: "إحصائيات السباحين، حالة الاشتراكات، وطباعة الوصولات وسندات الالتزام.",
      },
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: string }) {
  const tones: Record<string, string> = {
    default: "text-primary",
    success: "text-success",
    danger: "text-destructive",
    cyan: "text-secondary",
  };
  return (
    <div className="glass-panel p-5">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-3xl font-extrabold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function Dashboard() {
  const db = useDB();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [gender, setGender] = useState("all");
  const [status, setStatus] = useState("all");

  const rows = useMemo(
    () =>
      db.swimmers.map((s) => ({
        swimmer: s,
        payment: latestPayment(db, s.id),
        sub: subscriptionState(db, s.id),
      })),
    [db],
  );

  const filtered = rows.filter(({ swimmer, payment, sub }) => {
    const text = `${swimmer.nameAr} ${swimmer.nameFr} ${swimmer.fatherPhone}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (gender !== "all" && swimmer.gender !== gender) return false;
    if (status === "active" && !sub.active) return false;
    if (status === "expired" && sub.active) return false;
    if (["paid", "unpaid", "late"].includes(status) && payment?.status !== status) return false;
    return true;
  });

  const activeCount = rows.filter((r) => r.sub.active).length;
  const expired = rows.filter((r) => !r.sub.active);
  const income = db.payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const data = filtered.map(({ swimmer, payment, sub }) => ({
      "الاسم بالعربية": swimmer.nameAr, "الاسم بالفرنسية": swimmer.nameFr,
      "تاريخ الميلاد": swimmer.birthDate, "مكان الميلاد": swimmer.birthPlace,
      "الجنس": swimmer.gender === "male" ? "ذكر" : "أنثى", "فصيلة الدم": swimmer.bloodType,
      "اسم الولي": swimmer.fatherName, "هاتف الولي": swimmer.fatherPhone,
      "حالة الاشتراك": sub.active ? "نشط" : "منتهي", "تاريخ الانتهاء": sub.expiresAt ?? "",
      "آخر مبلغ": payment?.amount ?? "", "حالة الدفع": payment ? statusLabels[payment.status] : "لا يوجد",
    }));
    const sheet = XLSX.utils.json_to_sheet(data); sheet["!cols"] = [{ wch: 24 }, { wch: 24 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 14 }, { wch: 14 }];
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "السباحون"); XLSX.writeFile(book, `NEXA-Swimmers-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("تم تصدير قائمة السباحين");
  }

  return (
    <SiteLayout>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="عدد السباحين" value={String(db.swimmers.length)} />
        <Stat label="اشتراكات نشطة" value={String(activeCount)} tone="success" />
        <Stat label="اشتراكات منتهية" value={String(expired.length)} tone="danger" />
        <Stat label="إجمالي المداخيل" value={formatMoney(income)} tone="cyan" />
      </div>

      {expired.length > 0 && (
        <div className="mt-6 rounded-xl border-2 border-destructive/40 bg-destructive/10 p-4 text-white">
          <p className="font-bold">تنبيه: {expired.length} سباح بحاجة لتجديد الاشتراك</p>
          <p className="mt-1 text-sm text-white/85">
            {expired
              .slice(0, 6)
              .map((r) => r.swimmer.nameAr)
              .join(" · ")}
            {expired.length > 6 ? " …" : ""}
          </p>
        </div>
      )}

      <div className="mt-6 glass-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold text-primary">قائمة السباحين</h2>
          <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={exportExcel}><Download /> تصدير Excel</Button><Link
            to="/swimmers/new"
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground hover:opacity-90"
          >
            + تسجيل سباح جديد
          </Link></div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث بالاسم أو رقم الهاتف…"
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">الجنس: الكل</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">الحالة: الكل</option>
            <option value="active">اشتراك نشط</option>
            <option value="expired">اشتراك منتهي</option>
            <option value="paid">مدفوع</option>
            <option value="unpaid">غير مدفوع</option>
            <option value="late">متأخر</option>
          </select>
        </div>

        {db.swimmers.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            لا يوجد سباحون بعد. ابدأ بتسجيل أول سباح.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="p-2">السباح</th>
                  <th className="p-2">الولي / الهاتف</th>
                  <th className="p-2">الاشتراك</th>
                  <th className="p-2">الدفع</th>
                  <th className="p-2">QR</th>
                  <th className="p-2">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ swimmer, payment, sub }) => (
                  <tr key={swimmer.id} className="border-b border-border/60 align-middle">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {swimmer.photo ? (
                          <img
                            src={swimmer.photo}
                            alt={swimmer.nameAr}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs">
                            NX
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-primary">{swimmer.nameAr}</p>
                          <p dir="ltr" className="text-xs text-muted-foreground">
                            {swimmer.nameFr}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <p>{swimmer.fatherName}</p>
                      <p dir="ltr" className="text-xs text-muted-foreground">
                        {swimmer.fatherPhone}
                      </p>
                    </td>
                    <td className="p-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          sub.active
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {sub.active ? "نشط" : "منتهي"}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        ينتهي: {formatDate(sub.expiresAt)}
                      </p>
                    </td>
                    <td className="p-2">
                      {payment ? (
                        <>
                          <p className="font-semibold">{formatMoney(payment.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {statusLabels[payment.status]}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">لا يوجد دفع</span>
                      )}
                    </td>
                    <td className="p-2">
                      <QrCode value={swimmerUrl(swimmer.id)} size={48} />
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1 text-xs font-semibold">
                        <Link
                          to="/swimmers/$id"
                          params={{ id: swimmer.id }}
                          className="rounded bg-primary px-2 py-1 text-primary-foreground"
                        >
                          البطاقة
                        </Link>
                        <Link
                          to="/swimmers/$id/edit"
                          params={{ id: swimmer.id }}
                          className="rounded bg-accent px-2 py-1 text-accent-foreground"
                        >
                          تعديل
                        </Link>
                        <Link
                          to="/print/$type/$id"
                          params={{ type: "receipt", id: swimmer.id }}
                          className="rounded bg-secondary px-2 py-1 text-secondary-foreground"
                        >
                          الوصل
                        </Link>
                        <Link
                          to="/print/$type/$id"
                          params={{ type: "contract", id: swimmer.id }}
                          className="rounded bg-secondary/80 px-2 py-1 text-secondary-foreground"
                        >
                          السند
                        </Link>
                        <button
                          onClick={async () => {
                            if (!window.confirm(`حذف السباح ${swimmer.nameAr}؟`)) return;
                            await deleteSwimmer(swimmer.id);
                            toast.success("تم حذف السباح");
                            navigate({ to: "/" });
                          }}
                          className="rounded bg-destructive px-2 py-1 text-destructive-foreground"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">لا نتائج مطابقة.</p>
            )}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
