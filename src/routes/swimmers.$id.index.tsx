import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMounted } from "@/lib/useMounted";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { QrCode, swimmerUrl } from "@/components/QrCode";
import { Field, inputClass } from "@/components/FormField";
import logo from "@/assets/nexa-club-logo.png";
import {
  addMonths,
  createPayment,
  deletePayment,
  subscriptionState,
  useDB,
  type PaymentMethod,
  type PaymentStatus,
  type SubscriptionDuration,
} from "@/lib/store";
import {
  ACADEMY,
  age,
  durationLabels,
  fileToDataUrl,
  formatDate,
  formatMoney,
  methodLabels,
  statusLabels,
} from "@/lib/format";

export const Route = createFileRoute("/swimmers/$id/")({
  head: () => ({
    meta: [
      { title: "بطاقة السباح — NEXA Sport" },
      { name: "description", content: "بطاقة السباح مع رمز QR، حالة الاشتراك وسجل المدفوعات." },
      { property: "og:title", content: "بطاقة السباح — NEXA Sport" },
      { property: "og:description", content: "معلومات السباح، اشتراكه، ومدفوعاته في فرع السباحة." },
    ],
  }),
  component: SwimmerCard,
});

const today = () => new Date().toISOString().slice(0, 10);

function SwimmerCard() {
  const { id } = Route.useParams();
  const db = useDB();
  const swimmer = db.swimmers.find((s) => s.id === id);
  const sub = subscriptionState(db, id);
  const payments = db.payments
    .filter((p) => p.swimmerId === id)
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  const [paidAt, setPaidAt] = useState(today());
  const [duration, setDuration] = useState<SubscriptionDuration>("1");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const mounted = useMounted();

  if (!swimmer) {
    return (
      <SiteLayout>
        <div className="glass-panel p-8 text-center">
          <p className="font-bold text-primary">السباح غير موجود.</p>
          <Link to="/" className="mt-3 inline-block text-secondary underline">
            رجوع للقائمة
          </Link>
        </div>
      </SiteLayout>
    );
  }

  async function addPaymentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await createPayment({
      swimmerId: id,
      amount: Number(f.get("amount") || 0),
      paidAt,
      durationMonths: duration,
      method: String(f.get("method")) as PaymentMethod,
      status: String(f.get("status")) as PaymentStatus,
      receiptImage,
    });
    setReceiptImage(null);
    toast.success("تمت إضافة الدفعة");
  }

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* بطاقة السباح */}
        <div className="glass-panel overflow-hidden">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="font-display font-extrabold">NEXA Sport</p>
              <p className="text-xs text-white/80">{ACADEMY.branch}</p>
            </div>
            <img src={logo} alt="" className="h-10 w-10 rounded bg-white/90 p-0.5" />
          </div>
          <div className="p-5 text-center">
            {swimmer.photo ? (
              <img
                src={swimmer.photo}
                alt={swimmer.nameAr}
                className="mx-auto h-28 w-28 rounded-full border-4 border-secondary object-cover"
              />
            ) : (
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-muted font-bold">
                NEXA
              </div>
            )}
            <h1 className="mt-3 font-display text-xl font-extrabold text-primary">
              {swimmer.nameAr}
            </h1>
            <p dir="ltr" className="text-sm text-muted-foreground">
              {swimmer.nameFr}
            </p>
            <span
              className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                sub.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              }`}
            >
              {sub.active ? "اشتراك نشط" : "اشتراك منتهي"} · ينتهي {formatDate(sub.expiresAt)}
            </span>

            <dl className="mt-4 space-y-1 text-right text-sm">
              <Row k="تاريخ الميلاد" v={`${formatDate(swimmer.birthDate)} (${age(swimmer.birthDate)} سنة)`} />
              <Row k="مكان الازدياد" v={swimmer.birthPlace} />
              <Row k="الجنس" v={swimmer.gender === "male" ? "ذكر" : "أنثى"} />
              <Row k="زمرة الدم" v={`\u200E${swimmer.bloodType}`} />
              <Row k="الولي" v={swimmer.fatherName} />
              <Row k="هاتف الولي" v={swimmer.fatherPhone} />
              <Row k="تاريخ التسجيل" v={formatDate(swimmer.createdAt)} />
            </dl>

            <div className="mt-4 flex flex-col items-center gap-2">
              <QrCode value={swimmerUrl(swimmer.id)} size={140} />
              <p className="text-xs text-muted-foreground">امسح الرمز لعرض حالة الاشتراك</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel flex flex-wrap gap-2 p-4 no-print">
            <Link
              to="/print/$type/$id"
              params={{ type: "receipt", id: swimmer.id }}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground"
            >
              طباعة وصل الدفع
            </Link>
            <Link
              to="/print/$type/$id"
              params={{ type: "contract", id: swimmer.id }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              طباعة سند الضمان
            </Link>
            <Link
              to="/swimmers/$id/edit"
              params={{ id: swimmer.id }}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground"
            >
              تعديل المعلومات
            </Link>
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-input px-4 py-2 text-sm font-bold text-primary"
            >
              طباعة البطاقة
            </button>
          </div>

          <div className="glass-panel p-5">
            <h2 className="font-display text-lg font-extrabold text-primary">إضافة دفعة جديدة</h2>
            <form onSubmit={addPaymentSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="المبلغ (دج)">
                <input name="amount" type="number" min={0} step={50} defaultValue={2500} required className={inputClass} />
              </Field>
              <Field label="تاريخ الدفع">
                <input
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="مدة الاشتراك">
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as SubscriptionDuration)}
                  className={inputClass}
                >
                  {(Object.keys(durationLabels) as SubscriptionDuration[]).map((k) => (
                    <option key={k} value={k}>
                      {durationLabels[k]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="طريقة الدفع">
                <select name="method" defaultValue="cash" className={inputClass}>
                  {(Object.keys(methodLabels) as PaymentMethod[]).map((k) => (
                    <option key={k} value={k}>
                      {methodLabels[k]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="حالة الدفع">
                <select name="status" defaultValue="paid" className={inputClass}>
                  {(Object.keys(statusLabels) as PaymentStatus[]).map((k) => (
                    <option key={k} value={k}>
                      {statusLabels[k]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="تاريخ الانتهاء (تلقائي)">
                <input value={addMonths(paidAt, Number(duration))} readOnly className={`${inputClass} bg-muted`} />
              </Field>
              <Field label="صورة الوصل (اختياري)">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) setReceiptImage(await fileToDataUrl(file));
                  }}
                  className={inputClass}
                />
              </Field>
              <div className="flex items-end">
                <button
                  disabled={!mounted}
                  className="w-full rounded-lg bg-secondary py-2 font-bold text-secondary-foreground disabled:opacity-60"
                >
                  إضافة الدفعة
                </button>
              </div>
            </form>
          </div>

          <div className="glass-panel p-5">
            <h2 className="font-display text-lg font-extrabold text-primary">سجل المدفوعات</h2>
            {payments.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">لا توجد مدفوعات مسجلة.</p>
            ) : (
              <table className="mt-3 w-full text-right text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="p-2">رقم الوصل</th>
                    <th className="p-2">المبلغ</th>
                    <th className="p-2">التاريخ</th>
                    <th className="p-2">المدة</th>
                    <th className="p-2">الطريقة</th>
                    <th className="p-2">الحالة</th>
                    <th className="p-2">الانتهاء</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border/60">
                      <td className="p-2 font-mono">#{p.receiptNumber}</td>
                      <td className="p-2 font-semibold">{formatMoney(p.amount)}</td>
                      <td className="p-2">{formatDate(p.paidAt)}</td>
                      <td className="p-2">{durationLabels[p.durationMonths]}</td>
                      <td className="p-2">{methodLabels[p.method]}</td>
                      <td className="p-2">{statusLabels[p.status]}</td>
                      <td className="p-2">{formatDate(p.expiresAt)}</td>
                      <td className="p-2">
                        <button
                          onClick={() => {
                            void deletePayment(p.id);
                            toast.success("تم حذف الدفعة");
                          }}
                          className="text-xs font-bold text-destructive"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-dashed border-border py-1">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
