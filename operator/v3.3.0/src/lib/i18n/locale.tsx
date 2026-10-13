import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { HTML_LANG, isLocale, messages, type Locale, type Messages } from "./messages";

const KEY = "upo-locale";

type LocaleApi = {
  locale: Locale;
  t: Messages;
  setLocale: (next: Locale) => void;
};

const Ctx = createContext<LocaleApi | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("de");

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (isLocale(stored)) {
      setLocaleState(stored);
      return;
    }
    const nav = navigator.language?.slice(0, 2).toLowerCase();
    if (isLocale(nav)) setLocaleState(nav);
  }, []);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  const api = useMemo<LocaleApi>(
    () => ({
      locale,
      t: messages[locale],
      setLocale: (next) => {
        setLocaleState(next);
        localStorage.setItem(KEY, next);
      },
    }),
    [locale],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocale outside LocaleProvider");
  return ctx;
}
