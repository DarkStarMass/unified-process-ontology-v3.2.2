import { ENDONYM, HTML_LANG, LOCALES } from "@/lib/i18n/messages";
import { useLocale } from "@/lib/i18n/locale";

export function LanguageSwitch() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div role="group" aria-label={t.language} className="flex max-w-full flex-wrap justify-end gap-1">
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            lang={HTML_LANG[code]}
            aria-pressed={active}
            onClick={() => setLocale(code)}
            className={
              "inline-flex min-h-11 flex-col items-center justify-center whitespace-nowrap rounded-sm px-2.5 py-1 leading-none " +
              (active
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground")
            }
          >
            <span className="font-mono text-[10px] tracking-wide">{code.toUpperCase()}</span>
            <span className="text-xs">{ENDONYM[code]}</span>
          </button>
        );
      })}
    </div>
  );
}
