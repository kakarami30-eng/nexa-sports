import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMounted } from "@/lib/useMounted";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { Field, inputClass } from "@/components/FormField";
import { updateSwimmer, useDB, type Gender } from "@/lib/store";
import { bloodTypes, fileToDataUrl } from "@/lib/format";

export const Route = createFileRoute("/swimmers/$id/edit")({
  head: () => ({
    meta: [
      { title: "تعديل معلومات السباح — NEXA Sport" },
      { name: "description", content: "تعديل بيانات السباح المسجل في فرع السباحة NEXA Sport." },
      { property: "og:title", content: "تعديل معلومات السباح — NEXA Sport" },
      { property: "og:description", content: "تحديث الاسم، الصورة، ومعلومات الولي." },
    ],
  }),
  component: EditSwimmer,
});

function EditSwimmer() {
  const { id } = Route.useParams();
  const db = useDB();
  const navigate = useNavigate();
  const swimmer = db.swimmers.find((s) => s.id === id);
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await updateSwimmer(id, {
      nameAr: String(f.get("nameAr") || "").trim(),
      nameFr: String(f.get("nameFr") || "").trim(),
      birthDate: String(f.get("birthDate") || ""),
      birthPlace: String(f.get("birthPlace") || "").trim(),
      gender: String(f.get("gender") || "male") as Gender,
      bloodType: String(f.get("bloodType") || ""),
      fatherName: String(f.get("fatherName") || "").trim(),
      fatherPhone: String(f.get("fatherPhone") || "").trim(),
      ...(photo !== undefined ? { photo } : {}),
    });
    toast.success("تم تحديث المعلومات");
    navigate({ to: "/swimmers/$id", params: { id } });
  }

  const current = photo !== undefined ? photo : swimmer.photo;

  return (
    <SiteLayout>
      <form onSubmit={onSubmit} className="glass-panel space-y-5 p-6">
        <h1 className="font-display text-2xl font-extrabold text-primary">تعديل معلومات السباح</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="الاسم واللقب بالعربية">
            <input name="nameAr" defaultValue={swimmer.nameAr} required className={inputClass} />
          </Field>
          <Field label="Nom et Prénom en Français">
            <input name="nameFr" defaultValue={swimmer.nameFr} dir="ltr" required className={inputClass} />
          </Field>
          <Field label="تاريخ الميلاد">
            <input name="birthDate" type="date" defaultValue={swimmer.birthDate} required className={inputClass} />
          </Field>
          <Field label="مكان الازدياد">
            <input name="birthPlace" defaultValue={swimmer.birthPlace} required className={inputClass} />
          </Field>
          <Field label="الجنس">
            <select name="gender" defaultValue={swimmer.gender} className={inputClass}>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </Field>
          <Field label="زمرة الدم">
            <select name="bloodType" defaultValue={swimmer.bloodType} className={inputClass}>
              {bloodTypes.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label="اسم الأب (الولي)">
            <input name="fatherName" defaultValue={swimmer.fatherName} required className={inputClass} />
          </Field>
          <Field label="رقم هاتف الأب">
            <input
              name="fatherPhone"
              defaultValue={swimmer.fatherPhone}
              dir="ltr"
              required
              pattern="[0-9+ ]{8,20}"
              className={inputClass}
            />
          </Field>
          <Field label="تغيير صورة السباح">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setPhoto(await fileToDataUrl(file));
              }}
              className={inputClass}
            />
          </Field>
        </div>

        {current && (
          <img src={current} alt="" className="h-28 w-28 rounded-xl border border-border object-cover" />
        )}

        <div className="flex gap-2">
          <button
            disabled={!mounted}
            className="rounded-lg bg-secondary px-5 py-2 font-bold text-secondary-foreground disabled:opacity-60"
          >
            حفظ التعديلات
          </button>
          <Link
            to="/swimmers/$id"
            params={{ id }}
            className="rounded-lg border border-input px-5 py-2 font-bold text-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </SiteLayout>
  );
}
