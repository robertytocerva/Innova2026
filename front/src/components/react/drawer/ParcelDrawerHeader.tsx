import type { ReactElement } from "react";
import type { ParcelFeature } from "../../../types/mapa";
import { type StatusStyle } from "./drawer-styles";

interface Props {
  feature: ParcelFeature;
  status: StatusStyle;
  onClose: () => void;
}

export default function ParcelDrawerHeader({ feature, status, onClose }: Props): ReactElement {
  const p = feature.properties;
  return (
    <div className="relative p-5 bg-gradient-to-br from-primary via-primary-container to-inverse-surface text-surface">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,212,90,0.15),transparent_60%)] pointer-events-none"></div>
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface/15 backdrop-blur-sm px-2.5 py-1 font-mono text-sm font-bold text-surface ring-1 ring-surface/20">
              <span className="material-symbols-outlined text-[14px] text-tertiary">tag</span>
              {p.id}
            </span>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${status.badgeClass}`}>
              {status.text}
            </span>
          </div>
          <p className="text-label-sm font-label-sm text-on-primary/80 mt-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">place</span>
            {p.municipio} · Michoacán
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-on-primary/70 hover:text-surface hover:bg-surface/15 transition-colors"
          aria-label="Cerrar panel"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
    </div>
  );
}
