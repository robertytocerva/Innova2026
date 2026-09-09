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
  const minYear = 2018;
  const maxYear = 2026;
  const progress = ((local - minYear) / (maxYear - minYear)) * 100;

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
<<<<<<< HEAD
    <div className="absolute bottom-4 left-4 right-4 z-[1000] mx-auto max-w-2xl rounded-3xl border border-tertiary/30 bg-gradient-to-br from-primary-container/95 via-inverse-surface/95 to-inverse-surface/95 px-5 py-4 text-surface shadow-2xl backdrop-blur-xl ring-1 ring-tertiary/10 md:left-1/2 md:right-auto md:w-[92%] md:-translate-x-1/2">
=======
    <div className="absolute bottom-4 left-4 right-4 z-[1000] mx-auto max-w-2xl rounded-2xl border border-secondary-fixed/40 bg-inverse-surface/95 px-4 py-3 text-surface shadow-2xl backdrop-blur-md md:left-1/2 md:right-auto md:w-[92%] md:-translate-x-1/2">
>>>>>>> 79d7fc8 (creacion de polingonos manuales para el mapa)
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-tertiary/30 to-secondary-fixed/20 ring-1 ring-tertiary/40">
            <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-tertiary opacity-60"></span>
            <span className="material-symbols-outlined text-tertiary text-[16px]">history</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-inverse-on-surface/90 leading-none">Serie Histórica</span>
            <span className="text-[11px] font-mono font-medium text-inverse-on-surface/60 leading-none mt-0.5">Satelital Esri Wayback</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-tertiary/40 bg-gradient-to-r from-tertiary/20 via-secondary-fixed/15 to-tertiary/20 px-3 py-1.5 shadow-inner">
          <span className="material-symbols-outlined text-tertiary text-[14px]">calendar_today</span>
          <span className="font-mono text-sm font-bold text-tertiary">{currentYear}</span>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-3">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-inverse-on-surface/70">
          Año inicial
          <select
            value={comparisonYear}
            onChange={handleStartYear}
            className="mt-1 w-full rounded-lg border border-surface/15 bg-gradient-to-br from-surface/10 to-surface/5 px-2.5 py-1.5 font-mono text-[11px] text-surface outline-none transition-colors focus:border-tertiary focus:ring-1 focus:ring-tertiary/40"
          >
            {years.map((y) => (
              <option key={y} value={y} selected={y === SATELLITE_HISTORY_START}>{y}</option>
            ))}
          </select>
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-inverse-on-surface/70">
          Año final
          <span className="mt-1 block rounded-lg border border-tertiary/40 bg-gradient-to-br from-tertiary/20 to-secondary-fixed/10 px-2.5 py-1.5 font-mono text-[11px] font-bold text-tertiary shadow-inner">{local}</span>
        </label>
      </div>

      <div className="relative mt-3.5">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/60 via-tertiary/40 to-secondary-fixed/60 shadow-inner"></div>
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-tertiary to-secondary-fixed shadow-[0_0_10px_rgba(200,212,90,0.5)]"
          style={{ width: `${progress}%` }}
        ></div>
        <input
          type="range"
          min={minYear}
          max={maxYear}
          step={1}
          value={local}
          onChange={handleSlider}
          className="relative h-5 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-tertiary [&::-webkit-slider-thumb]:to-secondary-fixed [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(200,212,90,0.6)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-tertiary"
          aria-label="Año final de la serie satelital"
        />
      </div>

      <div className="mt-1.5 flex justify-between font-mono text-[9px] text-inverse-on-surface/50">
        <span>2018 base</span>
        <span>2022 seguimiento</span>
        <span>2026 actual</span>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-inverse-on-surface/70">
        Comparativa activa: <strong className="text-tertiary">{comparisonYear}</strong> vs <strong className="text-tertiary">{currentYear}</strong> · incendios NASA FIRMS 2012–{new Date().getFullYear()}
      </p>
    </div>
  );
}
