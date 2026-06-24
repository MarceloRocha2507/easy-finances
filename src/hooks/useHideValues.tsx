import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface HideValuesContextType {
  hideValues: boolean;
  toggleHideValues: () => void;
}

const HideValuesContext = createContext<HideValuesContextType | undefined>(undefined);

const STORAGE_KEY = "fina:hide-values";

// Module-level flag read by formatCurrency for global masking without prop drilling
export let __hideValuesFlag = false;

export function HideValuesProvider({ children }: { children: ReactNode }) {
  const [hideValues, setHideValues] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const initial = window.localStorage.getItem(STORAGE_KEY) === "1";
    __hideValuesFlag = initial;
    return initial;
  });

  // Sincroniza o flag módulo-level ANTES do render dos filhos
  __hideValuesFlag = hideValues;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, hideValues ? "1" : "0");
  }, [hideValues]);

  const toggleHideValues = useCallback(() => setHideValues((v) => !v), []);

  return (
    <HideValuesContext.Provider value={{ hideValues, toggleHideValues }}>
      {children}
    </HideValuesContext.Provider>
  );
}

export function useHideValues() {
  const ctx = useContext(HideValuesContext);
  if (!ctx) throw new Error("useHideValues must be used within HideValuesProvider");
  return ctx;
}
