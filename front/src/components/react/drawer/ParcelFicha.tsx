import type { ReactElement } from "react";
import type { ParcelFeature } from "../../../types/mapa";
import { type StatusStyle } from "./drawer-styles";
import { Field, SectionIcon } from "./DrawerPrimitives";

interface Props {
  feature: ParcelFeature;
  status: StatusStyle;
}

export default function ParcelFicha({ feature, status }: Props): ReactElement {
  const p = feature.properties;
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        <SectionIcon name="badge" gradient={status.sheetIconGradient} />
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface">Ficha del Predio</h3>
      </div>
      <div className="grid grid-cols-2 gap-2.5 bg-gradient-to-br from-surface-container-low to-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/30 shadow-sm">
        <Field label="Propietario" value={p.propietario} />
        <Field label="Superficie" value={`${p.superficieHa} ha`} />
        <Field label="Cultivo" value={p.cultivo} />
        <Field label="NDVI Promedio" value={String(p.ndviPromedio ?? "0.82")} mono tone="primary" />
        <Field label="Fecha de Alta" value={p.fechaAlta || "2023-01-01"} />
        <Field label="Confianza IA" value={`${p.confianzaIA}%`} mono />
      </div>
    </section>
  );
}
