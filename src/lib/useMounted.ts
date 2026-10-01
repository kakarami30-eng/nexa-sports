import { useEffect, useState } from "react";

/** True once the page is interactive in the browser (after hydration). */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
