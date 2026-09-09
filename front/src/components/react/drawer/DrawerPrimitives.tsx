import type { ReactElement } from "react";

interface SectionIconProps {
  name: string;
  gradient: string;
  tone?: "dark" | "light";
}

export function SectionIcon({ name, gradient, tone = "dark" }: SectionIconProps): ReactElement {
  const iconColor = tone === "dark" ? "text-on-primary" : "text-on-surface";
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} ring-1 ring-inset ring-white/10`}>
      <span className={`material-symbols-outlined text-[14px] ${iconColor}`}>{name}</span>
    </span>
  );
}

interface FieldProps {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "default" | "primary";
}

export function Field({ label, value, mono = false, tone = "default" }: FieldProps): ReactElement {
  const valueClass =
    tone === "primary" ? "text-primary" : "text-on-surface";
  return (
    <div>
      <span className="text-on-surface-variant block text-[10px] uppercase tracking-wider">{label}</span>
      <span className={`font-semibold ${valueClass} ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

interface YearImageProps {
  label: string;
  src: string | undefined;
  tone: "initial" | "final";
}

export function YearImage({ label, src, tone }: YearImageProps): ReactElement {
  const borderClass = tone === "initial" ? "border-surface/10" : "border-tertiary/30";
  const labelClass = tone === "initial" ? "text-inverse-on-surface/70" : "text-tertiary";
  return (
    <div className="space-y-1">
      <div className={`text-[10px] font-mono ${labelClass}`}>
        {label} · {tone === "initial" ? "Inicial" : "Final"}
      </div>
      <div
        className={`h-24 overflow-hidden rounded-xl border ${borderClass} bg-gradient-to-br from-black/60 to-black/30 shadow-inner`}
      >
        {src ? (
          <img src={src} alt={`Imagen satelital ${label}`} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[10px] text-inverse-on-surface/40">
            Sin imagen
          </div>
        )}
      </div>
    </div>
  );
}
