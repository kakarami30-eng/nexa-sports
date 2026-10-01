import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/nexa-club-logo.png";
import { QrCode, swimmerUrl } from "@/components/QrCode";
import { latestPayment, useDB } from "@/lib/store";
import {
  ACADEMY,
  durationLabels,
  formatDate,
  formatMoney,
  methodLabels,
  moneyInWords,
  statusLabels,
} from "@/lib/format";

export const Route = createFileRoute("/print/$type/$id")({
  head: () => ({
    meta: [
      { title: "وثائق الطباعة — NEXA Sport" },
      { name: "description", content: "وصل دفع الاشتراك وسند الضمان والالتزام لفرع السباحة." },
      { property: "og:title", content: "وثائق الطباعة — NEXA Sport" },
      { property: "og:description", content: "طباعة وصل الدفع أو سند الضمان والالتزام بصيغة PDF." },
    ],
  }),
  component: PrintDoc,
});

function Header({ title }: { title: string }) {
  return (
    <div className="flex items-start justify-between border-b-2 border-[#0A3D62] pb-3">
      <div className="flex items-center gap-3">
        <img src={logo} alt="NEXA Sport" className="h-16 w-16" />
        <div>
          <p className="font-display text-xl font-extrabold">NEXA Sport — {ACADEMY.branch}</p>
          <p className="text-xs">{ACADEMY.address}</p>
          <p dir="ltr" className="text-xs">
            {ACADEMY.phone}
          </p>
        </div>
      </div>
      <p className="rounded bg-[#0A3D62] px-3 py-1 text-sm font-bold text-white">{title}</p>
    </div>
  );
}

function Signatures({ left, right }: { left: string; right: string }) {
  return (
    <div className="mt-10 flex justify-between text-sm">
      <div className="text-center">
        <p className="font-bold">{right}</p>
        <div className="mt-12 w-40 border-t border-dashed border-[#0A3D62]" />
      </div>
      <div className="text-center">
        <p className="font-bold">{left}</p>
        <div className="mt-6 flex h-16 w-28 items-center justify-center rounded-full border-2 border-dashed border-[#00A8FF] text-[10px] text-[#00A8FF]">
          مكان الختم
        </div>
      </div>
    </div>
  );
}

function PrintDoc() {
  const { type, id } = Route.useParams();
  const db = useDB();
  const swimmer = db.swimmers.find((s) => s.id === id);
  const payment = latestPayment(db, id);

  if (!swimmer) {
    return (
      <div className="mx-auto max-w-2xl p-10 text-center">
        <p className="font-bold">السباح غير موجود.</p>
        <Link to="/" className="mt-3 inline-block underline">
          رجوع
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-[#00A8FF] px-5 py-2 font-bold text-white"
        >
          طباعة / حفظ PDF
        </button>
        <Link
          to="/swimmers/$id"
          params={{ id }}
          className="rounded-lg border border-[#0A3D62] px-5 py-2 font-bold text-[#0A3D62]"
        >
          رجوع للبطاقة
        </Link>
        <Link
          to="/print/$type/$id"
          params={{ type: type === "receipt" ? "contract" : "receipt", id }}
          className="rounded-lg bg-[#0A3D62] px-5 py-2 font-bold text-white"
        >
          {type === "receipt" ? "سند الضمان" : "وصل الدفع"}
        </Link>
      </div>

      {type === "contract" ? (
        <div className="print-area doc-sheet">
          <Header title="سند ضمان والتزام" />
          <p className="mt-4 text-center font-display text-lg font-extrabold">
            سند ضمان والتزام — Contrat d'engagement
          </p>

          <div className="mt-5 space-y-2 text-sm leading-7">
            <p>
              إنه في يوم <strong>{formatDate(new Date().toISOString())}</strong> تم الاتفاق بين رئيس
              فرع السباحة لأكاديمية <strong>NEXA Sport</strong> الكائن مقره بـ {ACADEMY.address}،
              وبين السيد(ة) <strong>{swimmer.fatherName}</strong> ولي السباح(ة){" "}
              <strong>{swimmer.nameAr}</strong> ({swimmer.nameFr}) المولود(ة) بتاريخ{" "}
              {formatDate(swimmer.birthDate)} بـ {swimmer.birthPlace}، على ما يلي:
            </p>
            <ol className="list-decimal space-y-1 pe-6">
              <li>يلتزم الولي باحترام القوانين الداخلية للمسبح وتوقيت الحصص المحددة من الإدارة.</li>
              <li>
                يلتزم الولي بتسديد مبلغ الاشتراك في أجله المحدد، وأن الاشتراك غير قابل للاسترجاع.
              </li>
              <li>
                يصرح الولي بأن ابنه(ــتها) في حالة صحية تسمح بممارسة السباحة ويتحمل مسؤولية أي مرض
                مزمن لم يُعلم به الإدارة (زمرة الدم: {`\u200E${swimmer.bloodType}`}).
              </li>
              <li>
                الأكاديمية غير مسؤولة عن أي حادث يقع خارج أوقات الحصص أو نتيجة عدم احترام تعليمات
                المدرب ومنقذ السباحة.
              </li>
              <li>الأكاديمية غير مسؤولة عن الأشياء الثمينة المفقودة داخل المسبح.</li>
              <li>يسمح الولي / لا يسمح باستعمال صور السباح في النشاطات الإعلامية للأكاديمية.</li>
              <li>كل إخلال بالنظام الداخلي يعرض السباح للإقصاء دون استرجاع مبلغ الاشتراك.</li>
            </ol>
            <p className="pt-2">
              وعليه تم تحرير هذا السند للعمل به عند اللزوم، ويسري من تاريخ التوقيع.
            </p>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <Signatures left="إمضاء رئيس الفرع" right="إمضاء الولي" />
            <QrCode value={swimmerUrl(swimmer.id)} size={90} />
          </div>
        </div>
      ) : (
        <div className="print-area doc-sheet">
          <Header title="وصل دفع الاشتراك" />

          {!payment ? (
            <p className="mt-6 text-center text-sm">
              لا توجد دفعة مسجلة لهذا السباح. أضف دفعة من بطاقة السباح أولا.
            </p>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-between text-sm">
                <p>
                  رقم الوصل: <strong className="font-mono">#{payment.receiptNumber}</strong>
                </p>
                <p>
                  تاريخ الدفع: <strong>{formatDate(payment.paidAt)}</strong>
                </p>
              </div>

              <table className="mt-5 w-full border border-[#0A3D62] text-right text-sm">
                <tbody>
                  <tr className="border-b border-[#0A3D62]/40">
                    <th className="w-44 bg-[#0A3D62]/10 p-2">اسم السباح</th>
                    <td className="p-2 font-bold">
                      {swimmer.nameAr} <span dir="ltr">({swimmer.nameFr})</span>
                    </td>
                  </tr>
                  <tr className="border-b border-[#0A3D62]/40">
                    <th className="bg-[#0A3D62]/10 p-2">الولي</th>
                    <td className="p-2">
                      {swimmer.fatherName} — <span dir="ltr">{swimmer.fatherPhone}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-[#0A3D62]/40">
                    <th className="bg-[#0A3D62]/10 p-2">المبلغ بالأرقام</th>
                    <td className="p-2 font-display text-lg font-extrabold">
                      {formatMoney(payment.amount)}
                    </td>
                  </tr>
                  <tr className="border-b border-[#0A3D62]/40">
                    <th className="bg-[#0A3D62]/10 p-2">المبلغ بالحروف</th>
                    <td className="p-2">{moneyInWords(payment.amount)}</td>
                  </tr>
                  <tr className="border-b border-[#0A3D62]/40">
                    <th className="bg-[#0A3D62]/10 p-2">مدة الاشتراك</th>
                    <td className="p-2">
                      {durationLabels[payment.durationMonths]} — من {formatDate(payment.paidAt)} إلى{" "}
                      {formatDate(payment.expiresAt)}
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-[#0A3D62]/10 p-2">طريقة وحالة الدفع</th>
                    <td className="p-2">
                      {methodLabels[payment.method]} — {statusLabels[payment.status]}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-4 flex items-end justify-between">
                <Signatures left="إمضاء الرئيس" right="إمضاء الولي" />
                <div className="text-center">
                  <QrCode value={swimmerUrl(swimmer.id)} size={100} />
                  <p className="mt-1 text-[10px]">تحقق من الاشتراك</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
