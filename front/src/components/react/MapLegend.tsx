import type { ReactElement } from "react";

interface Props {
  onClose: () => void;
}

export default function MapLegend({ onClose }: Props): ReactElement {
  return (
    <div className="absolute top-24 right-4 z-20 bg-surface-container-lowest/95 backdrop-blur-md text-on-surface p-4 rounded-xl shadow-2xl border border-outline-variant/40 text-label-sm font-label-sm w-72">
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/40 mb-2.5">
        <span className="font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[16px]">layers</span>
          Estados de Predios
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-on-surface-variant hover:text-on-surface"
          aria-label="Cerrar leyenda"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="w-4 h-4 rounded bg-primary-fixed/30 border-2 border-primary shrink-0"></span>
          <div>
            <div className="font-semibold text-on-surface">Aprobada (Exportación OK)</div>
            <div className="text-[10px] text-on-surface-variant">Sin deforestación en histórico</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-4 h-4 rounded bg-error/30 border-2 border-error shrink-0"></span>
          <div>
            <div className="font-semibold text-on-surface">Bloqueada (Deforestación)</div>
            <div className="text-[10px] text-on-surface-variant">Pérdida de bosque detectada</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-4 h-4 rounded bg-amber-500/30 border-2 border-amber-600 shrink-0"></span>
          <div>
            <div className="font-semibold text-on-surface">En Revisión</div>
            <div className="text-[10px] text-on-surface-variant">Análisis multitemporal en curso</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-4 h-4 rounded border-2 border-dashed border-error bg-error/20 shrink-0"></span>
          <div>
            <div className="font-semibold text-error">Subdivisión Bloqueada</div>
            <div className="text-[10px] text-on-surface-variant">Intento de fragmentar predio sancionado</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-4 h-4 rounded border-2 border-orange-500 bg-orange-500/20 shrink-0"></span>
          <div>
            <div className="font-semibold text-orange-700">Problemas Geométricos</div>
            <div className="text-[10px] text-on-surface-variant">Auto-intersección / traslape catastral</div>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-2.5 border-t border-outline-variant/40 text-[10px] text-on-surface-variant flex items-center justify-between">
        <span>Pasa el cursor: <strong>Coordenadas WGS84</strong></span>
        <span>Clic: <strong>Detalles</strong></span>
      </div>
    </div>
  );
}
