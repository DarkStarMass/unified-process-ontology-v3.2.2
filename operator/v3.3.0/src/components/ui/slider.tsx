import * as Slider from "@radix-ui/react-slider";

type FieldSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
  /** Absolute value drawn as a tick on the track. */
  mark?: number;
};

export function FieldSlider({ label, value, min, max, step, display, onChange, mark }: FieldSliderProps) {
  const span = max - min;
  const markPct =
    mark === undefined || !(span > 0) ? null : Math.min(100, Math.max(0, ((mark - min) / span) * 100));
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-sm tabular-nums text-muted">{display}</span>
      </span>
      <Slider.Root
        className="relative flex h-11 touch-none items-center select-none"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([next]) => {
          if (next !== undefined) onChange(next);
        }}
      >
        <Slider.Track className="relative h-1.5 grow rounded-full bg-input">
          <Slider.Range className="absolute h-full rounded-full bg-primary" />
          {markPct !== null ? (
            <span
              data-crit={mark}
              className="pointer-events-none absolute top-1/2 z-10 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger"
              style={{ left: `${markPct}%` }}
            />
          ) : null}
        </Slider.Track>
        <Slider.Thumb
          aria-label={label}
          className="block size-5 rounded-full border border-border bg-foreground"
        />
      </Slider.Root>
    </label>
  );
}
