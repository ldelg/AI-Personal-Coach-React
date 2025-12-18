import { useEffect, useState } from "react";

export default function useIsWide(breakpoint = 550) {
  const isClient = typeof window !== "undefined";
  const [isWide, setIsWide] = useState<boolean>(
    isClient ? window.innerWidth > breakpoint : true
  );

  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth > breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isWide;
}
