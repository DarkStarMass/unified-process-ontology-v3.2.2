import * as Switch from "@radix-ui/react-switch";

export function FieldSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-11 items-center justify-between gap-3 text-sm font-medium">
      <span>{label}</span>
      <Switch.Root
        checked={checked}
        onCheckedChange={onChange}
        className="relative h-7 w-12 shrink-0 rounded-full border border-border bg-input data-[state=checked]:bg-primary"
      >
        <Switch.Thumb className="block size-5 translate-x-1 rounded-full bg-foreground transition-transform duration-150 data-[state=checked]:translate-x-6 data-[state=checked]:bg-primary-foreground" />
      </Switch.Root>
    </label>
  );
}
