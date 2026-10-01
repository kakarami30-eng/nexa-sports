import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function swimmerUrl(id: string) {
  // اذا رانا في localhost نستعملو رابط الانترنت
  // من بعد ما نطلعوه في Vercel بدّل الرابط هذا
  const PROD_URL = "https://nexa-sports.vercel.app"; // هذا نبدلوه بعد ما نطلعوه
  
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // اذا localhost، استعمل رابط الانترنت
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return `${PROD_URL}/swimmer?id=${id}`;
    }
    return `${origin}/swimmer?id=${id}`;
  }
  return `${PROD_URL}/swimmer?id=${id}`;
}

export function QrCode({
  value,
  size = 128,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#0A3D62", light: "#FFFFFF" },
    })
      .then((url) => {
        if (alive) setSrc(url);
      })
      .catch(() => setSrc(null));
    return () => {
      alive = false;
    };
  }, [value, size]);

  if (!src) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, background: "#fff", borderRadius: 8 }}
      />
    );
  }

  return (
    <img
      src={src}
      alt="QR Code"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}