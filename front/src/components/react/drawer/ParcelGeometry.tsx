import { useMemo, type ReactElement } from "react";
import { michoacanParcels } from "../../../data/michoacanParcels";
import { validatePolygon } from "../../../lib/geometryValidator";
import type { ParcelFeature } from "../../../types/mapa";
import { SectionIcon } from "./DrawerPrimitives";

interface Props {
  feature: ParcelFeature;
}

export default function ParcelGeometry({ feature }: Props): ReactElement {
  const validation = useMemo(() => validatePolygon(feature, michoacanParcels), [feature]);
  const issues = validation.issues.length > 0 ? validation.issues : feature.properties.geometryIssues;
  const hasIssues = issues.length > 0;

  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        <SectionIcon name="polyline" gradient="from-tertiary/40 to-secondary-fixed/10" />
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface">Validación Geométrica</h3>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-surface-container-low to-surface-container px-3 py-2.5 text-[10px]">
        <span className="text-on-surface-variant">Score topológico</span>
        <strong className="font-mono text-base font-bold bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">
          {validation.score}/100
        </strong>
      </div>

      {hasIssues ? (
        <div className="space-y-1.5">
          {issues.map((iss, i) => (
            <div
              key={i}
              className="p-2.5 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-200/70 flex items-start gap-2"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-200/80 mt-0.5">
                <span className="material-symbols-outlined text-orange-600 text-[14px]">warning</span>
              </span>
              <div>
                <span className="font-semibold capitalize text-orange-900">{iss.tipo.replace("_", " ")}:</span> {iss.descripcion}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-tertiary/10 border border-primary/30 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
          </span>
          <span className="text-on-surface">Topología y cierre vectorial correctos.</span>
        </div>
      )}
    </section>
  );
}
