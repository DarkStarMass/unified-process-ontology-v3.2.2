import { createFileRoute } from "@tanstack/react-router";
import { UpoConsole } from "@/components/upo/console";
import { LocaleProvider } from "@/lib/i18n/locale";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <LocaleProvider>
      <UpoConsole />
    </LocaleProvider>
  );
}