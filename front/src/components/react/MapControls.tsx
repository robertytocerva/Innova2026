import type { ReactElement } from "react";

interface Props {
  onToggleLegend: () => void;
}

export default function MapControls({ onToggleLegend }: Props): ReactElement {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2.5">
      <button
        type="button"
        onClick={onToggleLegend}
        className="group flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-br from-surface-container-lowest/95 to-surface-container/90 hover:from-surface-container-lowest hover:to-primary/10 backdrop-blur-xl text-on-surface text-label-sm font-label-sm font-semibold border border-outline-variant/40 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
        aria-label="Alternar leyenda"
      >
        <span className="material-symbols-outlined text-primary text-[18px] transition-transform group-hover:scale-110">info</span>
        <span>Leyenda</span>
      </button>
      <div className="relative flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-secondary-fixed via-tertiary to-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm font-bold border border-secondary-fixed-dim/40 shadow-lg">
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-surface shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse"></span>
        <span className="material-symbols-outlined text-[18px]">satellite_alt</span>
        <span>Vista Satélite</span>
      </div>
    </div>
  );
}
