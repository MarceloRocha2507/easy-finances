import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Lazy initializer: calcula o valor correto ANTES do primeiro render
  // evitando o flash de layout (desktop → mobile) que ocorria quando o
  // estado começava como `undefined` e só era corrigido no useEffect.
  const [isMobile, setIsMobile] = React.useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
