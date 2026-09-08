import type { ReactElement } from "react";

interface Props {
  onToggleLegend: () => void;
}

export default function MapControls({ onToggleLegend }: Props): ReactElement {
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-space-xs">
      <button
        type="button"
        onClick={onToggleLegend}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-lowest/95 hover:bg-surface-container backdrop-blur-md text-on-surface text-label-sm font-label-sm font-semibold border border-outline-variant/40 shadow-lg transition-all"
        aria-label="Alternar leyenda"
      >
        <span className="material-symbols-outlined text-primary text-[18px]">info</span>
        <span>Leyenda</span>
      </button>
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm font-bold border border-secondary-fixed-dim/40 shadow-lg">
        <span className="material-symbols-outlined text-[18px]">satellite_alt</span>
        <span>Vista Satélite</span>
      </div>
    </div>
  );
}
