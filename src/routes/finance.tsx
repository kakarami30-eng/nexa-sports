import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { Field, inputClass } from "@/components/FormField";
import { createExpense, deleteExpense, useDB } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { formatDate, formatMoney, methodLabels, statusLabels } from "@/lib/format";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "لوحة المالية — NEXA Sport فرع السباحة" },
      {
        name: "description",
        content: "المداخيل، المصاريف، صافي الربح والرسم البياني الشهري لفرع السباحة NEXA Sport.",
      },
      { property: "og:title", content: "لوحة المالية — NEXA Sport فرع السباحة" },
      { property: "og:description", content: "تتبع المداخيل والمصاريف وصافي الربح شهريا وسنويا." },
    ],
  }),
  component: Finance,
});

function Finance() {
  const db = useDB();
  const [q, setQ] = useState("");
  const mounted = useMounted();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const year = String(now.getFullYear());

  const paid = db.payments.filter((p) => p.status === "paid");
  const incomeMonth = paid.filter((p) => p.paidAt.startsWith(month)).reduce((s, p) => s + p.amount, 0);
  const incomeYear = paid.filter((p) => p.paidAt.startsWith(year)).reduce((s, p) => s + p.amount, 0);
  const expensesYear = db.expenses
    .filter((e) => e.date.startsWith(year))
    .reduce((s, e) => s + e.amount, 0);
  const net = incomeYear - expensesYear;

  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
    const labels = [
      "جانفي",
      "فيفري",
      "مارس",
      "أفريل",
      "ماي",
      "جوان",
      "جويلية",
      "أوت",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];
    return months.map((m, i) => ({
      name: labels[i]!,
      income: paid.filter((p) => p.paidAt.startsWith(m)).reduce((s, p) => s + p.amount, 0),
      expense: db.expenses.filter((e) => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0),
    }));
  }, [db.expenses, paid, year]);

  const swimmerName = (id: string) => db.swimmers.find((s) => s.id === id)?.nameAr ?? "—";

  const filteredPayments = db.payments
    .filter((p) => {
      const text = `${swimmerName(p.swimmerId)} ${p.receiptNumber} ${p.amount}`.toLowerCase();
      return !q || text.includes(q.toLowerCase());
    })
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  async function addExpenseSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await createExpense({
      date,
      reason: String(f.get("reason") || "").trim(),
      amount: Number(f.get("amount") || 0),
      note: String(f.get("note") || "").trim(),
    });
    e.currentTarget.reset();
    toast.success("تم إضافة المصروف");
  }

  return (
    <SiteLayout>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "مداخيل هذا الشهر", value: formatMoney(incomeMonth), tone: "text-secondary" },
          { label: "مداخيل هذه السنة", value: formatMoney(incomeYear), tone: "text-primary" },
          { label: "مصاريف هذه السنة", value: formatMoney(expensesYear), tone: "text-destructive" },
          {
            label: "صافي الربح",
            value: formatMoney(net),
            tone: net >= 0 ? "text-success" : "text-destructive",
          },
        ].map((s) => (
          <div key={s.label} className="glass-panel p-5">
            <p className="text-sm font-semibold text-muted-foreground">{s.label}</p>
            <p className={`mt-2 font-display text-2xl font-extrabold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 glass-panel p-5">
        <h2 className="font-display text-xl font-extrabold text-primary">
          تطور المداخيل والمصاريف ({year})
        </h2>
        <div className="mt-4 h-72 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatMoney(v)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                name="المداخيل"
                stroke="var(--chart-1)"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="المصاريف"
                stroke="var(--chart-5)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 h-56 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatMoney(v)} />
              <Bar dataKey="income" name="المداخيل" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass-panel p-5">
          <h2 className="font-display text-lg font-extrabold text-primary">إضافة مصروف</h2>
          <form onSubmit={addExpenseSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="التاريخ">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="المبلغ (دج)">
              <input name="amount" type="number" min={0} step={50} required className={inputClass} />
            </Field>
            <Field label="السبب">
              <input name="reason" required maxLength={100} className={inputClass} />
            </Field>
            <Field label="ملاحظة">
              <input name="note" maxLength={200} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <button
                disabled={!mounted}
                className="w-full rounded-lg bg-destructive py-2 font-bold text-destructive-foreground disabled:opacity-60"
              >
                إضافة المصروف
              </button>
            </div>
          </form>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="p-2">التاريخ</th>
                  <th className="p-2">السبب</th>
                  <th className="p-2">المبلغ</th>
                  <th className="p-2">ملاحظة</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {db.expenses.map((e) => (
                  <tr key={e.id} className="border-b border-border/60">
                    <td className="p-2">{formatDate(e.date)}</td>
                    <td className="p-2 font-semibold">{e.reason}</td>
                    <td className="p-2">{formatMoney(e.amount)}</td>
                    <td className="p-2 text-xs text-muted-foreground">{e.note || "—"}</td>
                    <td className="p-2">
                      <button
                        onClick={() => {
                          void deleteExpense(e.id);
                          toast.success("تم حذف المصروف");
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
            {db.expenses.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">لا مصاريف مسجلة.</p>
            )}
          </div>
        </div>

        <div className="glass-panel p-5">
          <h2 className="font-display text-lg font-extrabold text-primary">كل عمليات الدفع</h2>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث باسم السباح أو رقم الوصل…"
            className={`mt-3 ${inputClass}`}
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="p-2">الوصل</th>
                  <th className="p-2">السباح</th>
                  <th className="p-2">المبلغ</th>
                  <th className="p-2">التاريخ</th>
                  <th className="p-2">الطريقة</th>
                  <th className="p-2">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="border-b border-border/60">
                    <td className="p-2 font-mono">#{p.receiptNumber}</td>
                    <td className="p-2 font-semibold">{swimmerName(p.swimmerId)}</td>
                    <td className="p-2">{formatMoney(p.amount)}</td>
                    <td className="p-2">{formatDate(p.paidAt)}</td>
                    <td className="p-2">{methodLabels[p.method]}</td>
                    <td className="p-2">{statusLabels[p.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPayments.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">لا عمليات دفع.</p>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
