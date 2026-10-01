import type { PaymentMethod, PaymentStatus, SubscriptionDuration } from "./store";

export const ACADEMY = {
  name: "NEXA Sport",
  branch: "فرع السباحة",
  address: "عين أزال - سطيف - الجزائر",
  phone: "0X XX XX XX XX",
};

export const durationLabels: Record<SubscriptionDuration, string> = {
  "1": "شهر",
  "3": "3 أشهر",
  "12": "سنة",
};

export const methodLabels: Record<PaymentMethod, string> = {
  cash: "نقدا",
  ccp: "CCP",
  baridi: "بريدي موب",
};

export const statusLabels: Record<PaymentStatus, string> = {
  paid: "مدفوع",
  unpaid: "غير مدفوع",
  late: "متأخر",
};

export const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function formatMoney(amount: number) {
  return `${new Intl.NumberFormat("fr-DZ").format(amount)} دج`;
}

export function age(birthDate: string) {
  if (!birthDate) return "—";
  const d = new Date(birthDate);
  const diff = Date.now() - d.getTime();
  return String(Math.floor(diff / (365.25 * 86400000)));
}

const ones = [
  "",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
  "عشرة",
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
];
const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const hundreds = [
  "",
  "مائة",
  "مائتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
];

function below1000(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(hundreds[h]!);
  if (rest) {
    if (rest < 20) parts.push(ones[rest]!);
    else {
      const u = rest % 10;
      const t = Math.floor(rest / 10);
      parts.push(u ? `${ones[u]} و${tens[t]}` : tens[t]!);
    }
  }
  return parts.join(" و");
}

/** Amount in Arabic words, e.g. 2500 -> "ألفان وخمسمائة دينار جزائري". */
export function moneyInWords(amount: number): string {
  const n = Math.floor(Math.abs(amount));
  if (n === 0) return "صفر دينار جزائري";

  const groups: string[] = [];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;

  if (millions) {
    if (millions === 1) groups.push("مليون");
    else if (millions === 2) groups.push("مليونان");
    else groups.push(`${below1000(millions)} مليون`);
  }
  if (thousands) {
    if (thousands === 1) groups.push("ألف");
    else if (thousands === 2) groups.push("ألفان");
    else if (thousands < 11) groups.push(`${below1000(thousands)} آلاف`);
    else groups.push(`${below1000(thousands)} ألف`);
  }
  if (rest) groups.push(below1000(rest));

  return `${groups.join(" و")} دينار جزائري`;
}

/** Downscale an image file to a compact data URL suitable for local storage. */
export function fileToDataUrl(file: File, maxSize = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-error"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("image-error"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas-error"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
