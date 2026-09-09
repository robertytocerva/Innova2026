import type { ReactElement } from "react";

interface Props {
  onClose: () => void;
}

export default function MapLegend({ onClose }: Props): ReactElement {
  return (
    <div className="absolute top-24 right-4 z-[1000] bg-gradient-to-br from-surface-container-lowest/98 to-surface-container/95 backdrop-blur-xl text-on-surface p-4 rounded-2xl shadow-2xl border border-outline-variant/40 w-72 ring-1 ring-primary/10">
      <div className="relative flex items-center justify-between pb-3 mb-3">
        <span className="font-bold uppercase tracking-[0.15em] text-[11px] text-on-surface flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-tertiary/20 ring-1 ring-primary/30">
            <span className="material-symbols-outlined text-primary text-[16px]">layers</span>
          </span>
          Estados de Predios
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
          aria-label="Cerrar leyenda"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-primary/5">
          <span className="h-5 w-5 shrink-0 rounded-md bg-gradient-to-br from-primary to-primary-container border-2 border-primary shadow-sm"></span>
          <div className="flex-1">
            <div className="font-semibold text-on-surface text-[12px]">Aprobada</div>
            <div className="text-[10px] text-on-surface-variant">Sin deforestación en histórico</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-error/5">
          <span className="h-5 w-5 shrink-0 rounded-md bg-gradient-to-br from-error/40 to-error/20 border-2 border-error shadow-sm"></span>
          <div className="flex-1">
            <div className="font-semibold text-on-surface text-[12px]">Bloqueada</div>
            <div className="text-[10px] text-on-surface-variant">Pérdida de bosque detectada</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-amber-500/5">
          <span className="h-5 w-5 shrink-0 rounded-md bg-gradient-to-br from-amber-500/40 to-amber-600/20 border-2 border-amber-600 shadow-sm"></span>
          <div className="flex-1">
            <div className="font-semibold text-on-surface text-[12px]">En Revisión</div>
            <div className="text-[10px] text-on-surface-variant">Análisis multitemporal en curso</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-error/5">
          <span className="h-5 w-5 shrink-0 rounded-md border-2 border-dashed border-error bg-error/20"></span>
          <div className="flex-1">
            <div className="font-semibold text-error text-[12px]">Subdivisión Bloqueada</div>
            <div className="text-[10px] text-on-surface-variant">Intento de fragmentar predio sancionado</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-orange-500/5">
          <span className="h-5 w-5 shrink-0 rounded-md border-2 border-orange-500 bg-orange-500/20"></span>
          <div className="flex-1">
            <div className="font-semibold text-orange-700 text-[12px]">Problemas Geométricos</div>
            <div className="text-[10px] text-on-surface-variant">Auto-intersección / traslape catastral</div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-outline-variant/30 text-[10px] text-on-surface-variant flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">mouse</span>
          Hover: <strong className="text-on-surface">Coordenadas</strong>
        </span>
        <span className="flex items-center gap-1">
          Clic: <strong className="text-on-surface">Detalles</strong>
          <span className="material-symbols-outlined text-[12px]">ads_click</span>
        </span>
      </div>
    </div>
  );
}
