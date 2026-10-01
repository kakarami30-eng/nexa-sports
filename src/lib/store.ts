import { useEffect, useState } from "react";

export type Gender = "male" | "female";
export type SubscriptionDuration = "1" | "3" | "12";
export type PaymentMethod = "cash" | "ccp" | "baridi";
export type PaymentStatus = "paid" | "unpaid" | "late";
export type Swimmer = { id: string; nameAr: string; nameFr: string; birthDate: string; birthPlace: string; gender: Gender; bloodType: string; fatherName: string; fatherPhone: string; photo: string | null; createdAt: string };
export type Payment = { id: string; receiptNumber: number; swimmerId: string; amount: number; paidAt: string; durationMonths: SubscriptionDuration; method: PaymentMethod; receiptImage: string | null; status: PaymentStatus; expiresAt: string };
export type Expense = { id: string; date: string; reason: string; amount: number; note: string };
export type DB = { swimmers: Swimmer[]; payments: Payment[]; expenses: Expense[]; receiptCounter: number; loading?: boolean };

const LS_KEY = "nexa-sport-swimming-v1";
const empty: DB = { swimmers: [], payments: [], expenses: [], receiptCounter: 1000, loading: false };
let cache: DB = empty;
const listeners = new Set<() => void>();

function load(): DB {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {...empty, loading: false };
    const parsed = JSON.parse(raw) as DB;
    return { swimmers: parsed.swimmers || [], payments: parsed.payments || [], expenses: parsed.expenses || [], receiptCounter: parsed.receiptCounter || 1000, loading: false };
  } catch { return {...empty, loading: false }; }
}

function save() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

async function refresh() {
  cache = load();
  listeners.forEach((l) => l());
}

export async function migrateLocalRecords() { return; }

export function useDB() {
  const [db, setDb] = useState(cache);
  useEffect(() => {
    cache = load();
    setDb({...cache });
    const sync = () => setDb({...cache });
    listeners.add(sync);
    return () => { listeners.delete(sync); };
  }, []);
  return db;
}

export function addMonths(dateISO: string, months: number) {
  const d = new Date(dateISO); const day = d.getDate(); d.setMonth(d.getMonth() + months); if (d.getDate() < day) d.setDate(0); return d.toISOString().slice(0, 10);
}

export async function createSwimmer(input: Omit<Swimmer, "id" | "createdAt">) {
  const newSwimmer: Swimmer = { id: crypto.randomUUID(), createdAt: new Date().toISOString().slice(0,10),...input };
  cache.swimmers = [newSwimmer,...cache.swimmers];
  save(); return newSwimmer;
}
export async function updateSwimmer(id: string, patch: Partial<Swimmer>) {
  cache.swimmers = cache.swimmers.map(s => s.id === id? {...s,...patch } : s);
  save();
}
export async function deleteSwimmer(id: string) {
  cache.swimmers = cache.swimmers.filter(s => s.id!== id);
  cache.payments = cache.payments.filter(p => p.swimmerId!== id);
  save();
}
export async function createPayment(input: Omit<Payment, "id" | "receiptNumber" | "expiresAt"> & { expiresAt?: string }) {
  cache.receiptCounter += 1;
  const newPayment: Payment = { id: crypto.randomUUID(), receiptNumber: cache.receiptCounter, expiresAt: input.expiresAt || addMonths(input.paidAt, Number(input.durationMonths)),...input } as Payment;
  cache.payments = [newPayment,...cache.payments];
  save(); return newPayment;
}
export async function updatePayment(id: string, patch: Partial<Payment>) {
  cache.payments = cache.payments.map(p => p.id === id? {...p,...patch } : p);
  save();
}
export async function deletePayment(id: string) { cache.payments = cache.payments.filter(p => p.id!== id); save(); }
export async function createExpense(input: Omit<Expense, "id">) {
  const newExp = { id: crypto.randomUUID(),...input };
  cache.expenses = [newExp,...cache.expenses];
  save();
}
export async function deleteExpense(id: string) { cache.expenses = cache.expenses.filter(e => e.id!== id); save(); }
export function latestPayment(db: DB, swimmerId: string) { return db.payments.filter((p) => p.swimmerId === swimmerId).sort((a, b) => b.paidAt.localeCompare(a.paidAt))[0]; }
export type SubscriptionState = { active: boolean; expiresAt: string | null; status: PaymentStatus | "none"; daysLeft: number | null };
export function subscriptionState(db: DB, swimmerId: string): SubscriptionState { const p = latestPayment(db, swimmerId); if (!p) return { active: false, expiresAt: null, status: "none", daysLeft: null }; const today = new Date().toISOString().slice(0, 10); const active = p.status === "paid" && p.expiresAt >= today; return { active, expiresAt: p.expiresAt, status: p.status, daysLeft: Math.ceil((new Date(p.expiresAt).getTime() - new Date(today).getTime()) / 86400000) }; }