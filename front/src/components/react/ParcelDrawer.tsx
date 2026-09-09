import { useMemo, type ReactElement } from "react";
import { getParcelFireRecords } from "../../lib/nasaFirms";
import { calculateVedaForestal } from "../../lib/nasaFirms";
import type { ParcelFeature } from "../../types/mapa";
import { DEFAULT_STATUS_STYLE, resolveStatusKey, type StatusStyle } from "./drawer/drawer-styles";
import ParcelDrawerHeader from "./drawer/ParcelDrawerHeader";
import ParcelFicha from "./drawer/ParcelFicha";
import ParcelHistorial from "./drawer/ParcelHistorial";
import ParcelComparativa from "./drawer/ParcelComparativa";
import ParcelFirms from "./drawer/ParcelFirms";
import ParcelGeometry from "./drawer/ParcelGeometry";

interface Props {
  feature: ParcelFeature | null;
  open: boolean;
  onClose: () => void;
  onSelectParcel: (f: ParcelFeature) => void;
  currentYear: number;
  comparisonYear: number;
  onParcelBlocked?: () => void;
}

export default function ParcelDrawer({ feature, open, onClose, currentYear, comparisonYear, onParcelBlocked }: Props): ReactElement {
  const vedaInfo = useMemo(
    () => (feature ? calculateVedaForestal(getParcelFireRecords(feature)) : null),
    [feature],
  );

  const statusKey = feature
    ? resolveStatusKey({
        exportacion: feature.properties.exportacion,
        deforestacionDetectada: feature.properties.deforestacionDetectada,
        vedaActiva: vedaInfo?.vedaActiva ?? false,
      })
    : "en_revision";

  const status: StatusStyle = DEFAULT_STATUS_STYLE;

  const containerClass = `absolute top-0 right-0 h-full w-96 max-w-full bg-gradient-to-b from-surface-container-lowest to-surface-container-low text-on-surface shadow-[-8px_0_30px_-5px_rgba(0,0,0,0.3)] z-[1000] transition-transform duration-300 flex flex-col border-l border-outline-variant/40 ${
    open ? "translate-x-0" : "translate-x-full"
  }`;

  return (
    <div className={containerClass} aria-hidden={!open}>
      <ParcelDrawerHeader
        feature={feature ?? PLACEHOLDER_FEATURE}
        status={status}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-label-sm font-label-sm">
        {feature && (
          <>
            <ParcelFicha feature={feature} status={status} />
            <ParcelHistorial feature={feature} />
            <ParcelComparativa
              key={feature.properties.id}
              feature={feature}
              currentYear={currentYear}
              comparisonYear={comparisonYear}
              statusKey={statusKey}
              onParcelBlocked={onParcelBlocked}
            />
            <ParcelFirms key={`firms-${feature.properties.id}`} feature={feature} />
            <ParcelGeometry key={`geometry-${feature.properties.id}`} feature={feature} />
          </>
        )}
      </div>
    </div>
  );
}

const PLACEHOLDER_FEATURE: ParcelFeature = {
  type: "Feature",
  id: "MCH-000",
  geometry: { type: "Polygon", coordinates: [[]] },
  properties: {
    id: "MCH-000",
    propietario: "",
    municipio: "",
    superficieHa: 0,
    cultivo: "",
    fechaAlta: "",
    exportacion: "aprobada",
    deforestacionDetectada: false,
    historialDeforestacion: [],
    geometryIssues: [],
    subdivisionBloqueada: false,
    parentId: null,
    ndviPromedio: 0,
    ultimaRevision: "",
    confianzaIA: 0,
  },
};
