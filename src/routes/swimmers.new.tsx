import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { Field, inputClass } from "@/components/FormField";
import {
  addMonths,
  createPayment,
  createSwimmer,
  type Gender,
  type PaymentMethod,
  type PaymentStatus,
  type SubscriptionDuration,
} from "@/lib/store";
import { bloodTypes, durationLabels, fileToDataUrl, methodLabels, statusLabels } from "@/lib/format";
import { useMounted } from "@/lib/useMounted";

export const Route = createFileRoute("/swimmers/new")({
  head: () => ({
    meta: [
      { title: "تسجيل سباح جديد — NEXA Sport" },
      {
        name: "description",
        content: "استمارة تسجيل سباح جديد في فرع السباحة لأكاديمية NEXA Sport بعين أزال.",
      },
      { property: "og:title", content: "تسجيل سباح جديد — NEXA Sport" },
      { property: "og:description", content: "تسجيل السباح مع الاشتراك، الدفع وإنشاء رمز QR خاص." },
    ],
  }),
  component: NewSwimmer,
});

const today = () => new Date().toISOString().slice(0, 10);

function NewSwimmer() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [paidAt, setPaidAt] = useState(today());
  const [duration, setDuration] = useState<SubscriptionDuration>("1");
  const [withPayment, setWithPayment] = useState(true);
  const [saving, setSaving] = useState(false);
  const mounted = useMounted();

  const expiresAt = addMonths(paidAt, Number(duration));

  async function onPhoto(file: File | undefined, set: (v: string | null) => void) {
    if (!file) return;
    try {
      set(await fileToDataUrl(file));
    } catch {
      toast.error("تعذر قراءة الصورة");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const swimmer = await createSwimmer({
        nameAr: String(f.get("nameAr") || "").trim(),
        nameFr: String(f.get("nameFr") || "").trim(),
        birthDate: String(f.get("birthDate") || ""),
        birthPlace: String(f.get("birthPlace") || "").trim(),
        gender: String(f.get("gender") || "male") as Gender,
        bloodType: String(f.get("bloodType") || ""),
        fatherName: String(f.get("fatherName") || "").trim(),
        fatherPhone: String(f.get("fatherPhone") || "").trim(),
        photo,
      });

      if (withPayment) {
        await createPayment({
          swimmerId: swimmer.id,
          amount: Number(f.get("amount") || 0),
          paidAt,
          durationMonths: duration,
          method: String(f.get("method") || "cash") as PaymentMethod,
          status: String(f.get("status") || "paid") as PaymentStatus,
          receiptImage,
        });
      }

      toast.success("تم تسجيل السباح بنجاح");
      navigate({ to: "/swimmers/$id", params: { id: swimmer.id } });
    } catch {
      toast.error("تعذر حفظ التسجيل. تأكد من تسجيل الدخول وحاول مجددا");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SiteLayout>
      <form onSubmit={onSubmit} className="space-y-6">
        <section className="glass-panel p-6">
          <h1 className="font-display text-2xl font-extrabold text-primary">استمارة تسجيل سباح</h1>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="الاسم واللقب بالعربية">
              <input name="nameAr" required maxLength={80} className={inputClass} />
            </Field>
            <Field label="Nom et Prénom en Français">
              <input name="nameFr" required maxLength={80} dir="ltr" className={inputClass} />
            </Field>
            <Field label="تاريخ الميلاد">
              <input name="birthDate" type="date" required className={inputClass} />
            </Field>
            <Field label="مكان الازدياد">
              <input name="birthPlace" required maxLength={80} className={inputClass} />
            </Field>
            <Field label="الجنس">
              <select name="gender" className={inputClass} defaultValue="male">
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </Field>
            <Field label="زمرة الدم">
              <select name="bloodType" className={inputClass} defaultValue="O+">
                {bloodTypes.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="اسم الأب (الولي)">
              <input name="fatherName" required maxLength={80} className={inputClass} />
            </Field>
            <Field label="رقم هاتف الأب">
              <input
                name="fatherPhone"
                required
                dir="ltr"
                maxLength={20}
                pattern="[0-9+ ]{8,20}"
                className={inputClass}
              />
            </Field>
            <Field label="صورة السباح" hint="سيتم تصغير الصورة تلقائيا">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPhoto(e.target.files?.[0], setPhoto)}
                className={inputClass}
              />
            </Field>
            <Field label="تاريخ التسجيل">
              <input value={today()} readOnly className={`${inputClass} bg-muted`} />
            </Field>
          </div>
          {photo && (
            <img
              src={photo}
              alt="معاينة"
              className="mt-4 h-28 w-28 rounded-xl border border-border object-cover"
            />
          )}
        </section>

        <section className="glass-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-extrabold text-primary">
              الاشتراك والدفع
            </h2>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={withPayment}
                onChange={(e) => setWithPayment(e.target.checked)}
              />
              تسجيل دفعة الآن
            </label>
          </div>

          {withPayment && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="مبلغ الدفع (دج)">
                <input
                  name="amount"
                  type="number"
                  min={0}
                  step={50}
                  defaultValue={2500}
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="تاريخ دفع الاشتراك">
                <input
                  name="paidAt"
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
                <select name="method" className={inputClass} defaultValue="cash">
                  {(Object.keys(methodLabels) as PaymentMethod[]).map((k) => (
                    <option key={k} value={k}>
                      {methodLabels[k]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="حالة الدفع">
                <select name="status" className={inputClass} defaultValue="paid">
                  {(Object.keys(statusLabels) as PaymentStatus[]).map((k) => (
                    <option key={k} value={k}>
                      {statusLabels[k]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="تاريخ انتهاء الاشتراك (تلقائي)">
                <input value={expiresAt} readOnly className={`${inputClass} bg-muted`} />
              </Field>
              <Field label="صورة وصل الدفع (اختياري)">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPhoto(e.target.files?.[0], setReceiptImage)}
                  className={inputClass}
                />
              </Field>
            </div>
          )}
        </section>

        <button
          type="submit"
          disabled={saving || !mounted}
          className="w-full rounded-xl bg-secondary py-3 font-display text-lg font-extrabold text-secondary-foreground hover:opacity-90 disabled:opacity-60"
        >
          حفظ التسجيل وإنشاء رمز QR
        </button>
      </form>
    </SiteLayout>
  );
}
