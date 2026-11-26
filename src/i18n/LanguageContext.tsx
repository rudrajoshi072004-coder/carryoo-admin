import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { ADMIN_LOCALES, adminLabel, type AdminLocale, type AdminNavKey } from "./catalog";

const STORAGE_KEY = "carryoo.admin.language";

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{?\s*(\w+)\s*\}?\}/g, (match, name: string) => {
    const value = vars[name];
    return value == null ? match : String(value);
  });
}

function readSaved(): AdminLocale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "hi" || raw === "mr" || raw === "gu" || raw === "en") return raw;
    const nav = (navigator.language || "en").toLowerCase();
    if (nav.startsWith("hi")) return "hi";
    if (nav.startsWith("mr")) return "mr";
    if (nav.startsWith("gu")) return "gu";
  } catch {
    // English fallback.
  }
  return "en";
}

type Ctx = {
  locale: AdminLocale;
  setLocale: (code: AdminLocale) => void;
  t: (key: string | AdminNavKey, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AdminLocale>("en");

  useEffect(() => {
    setLocaleState(readSaved());
  }, []);

  const setLocale = (code: AdminLocale) => {
    localStorage.setItem(STORAGE_KEY, code);
    setLocaleState(code);
  };

  const value = useMemo<Ctx>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => interpolate(adminLabel(locale, key), vars),
    }),
    [locale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useAdminLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useAdminLanguage must be used within AdminLanguageProvider");
  return ctx;
}

export { ADMIN_LOCALES };
