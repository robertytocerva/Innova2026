import { useState, type ReactElement } from "react";
import { SATELLITE_HISTORY_START } from "../../lib/satelliteHistory";

interface Props {
  currentYear: number;
  comparisonYear: number;
  onCurrentYearChange: (year: number) => void;
  onComparisonYearChange: (year: number) => void;
}

export default function TimeSlider({ currentYear, comparisonYear, onCurrentYearChange, onComparisonYearChange }: Props): ReactElement {
  const [local, setLocal] = useState(currentYear);
  const years = Array.from({ length: 9 }, (_, i) => 2018 + i);

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const y = Number(e.target.value);
    setLocal(y);
    onCurrentYearChange(y);
  };

  const handleStartYear = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const y = Number(e.target.value);
    if (y > currentYear) {
      onComparisonYearChange(currentYear);
    } else {
      onComparisonYearChange(y);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 z-[1000] mx-auto max-w-2xl rounded-2xl border border-secondary-fixed/40 bg-inverse-surface/95 px-4 py-3 text-surface shadow-2xl backdrop-blur-md md:left-1/2 md:right-auto md:w-[92%] md:-translate-x-1/2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary-fixed text-[16px]">history</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-inverse-on-surface">Serie Histórica Satelital</span>
        </div>
        <span className="rounded border border-secondary-fixed/40 bg-black/30 px-2 py-0.5 font-mono text-sm font-bold text-secondary-fixed">{currentYear}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="text-[10px] text-inverse-on-surface/70">
          Año inicial
          <select
            value={comparisonYear}
            onChange={handleStartYear}
            className="mt-1 w-full rounded-lg border border-surface/15 bg-surface/10 px-2 py-1.5 font-mono text-[11px] text-surface outline-none focus:border-secondary-fixed"
          >
            {years.map((y) => (
              <option key={y} value={y} selected={y === SATELLITE_HISTORY_START}>{y}</option>
            ))}
          </select>
        </label>
        <label className="text-[10px] text-inverse-on-surface/70">
          Año final satelital
          <span className="mt-1 block rounded-lg border border-secondary-fixed/40 bg-secondary-fixed/10 px-2 py-1.5 font-mono text-[11px] text-secondary-fixed">{local}</span>
        </label>
      </div>
      <input
        type="range"
        min={SATELLITE_HISTORY_START}
        max={2026}
        step={1}
        value={local}
        onChange={handleSlider}
        className="mt-2 h-1.5 w-full cursor-pointer accent-secondary-fixed"
        aria-label="Año final de la serie satelital"
      />
      <div className="mt-1 flex justify-between font-mono text-[9px] text-inverse-on-surface/60">
        <span>2018 base</span><span>2022 seguimiento</span><span>2026 actual</span>
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-secondary-fixed">
        Comparativa activa: {comparisonYear} vs {currentYear} + incendios NASA FIRMS 2012–{new Date().getFullYear()}.
      </p>
    </div>
  );
}
