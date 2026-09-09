import { useEffect, useMemo, type ReactElement } from "react";
import { calculateVedaForestal, getParcelFireRecords } from "../../lib/nasaFirms";
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

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 transition-opacity duration-300 ease-out ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-inverse-surface/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="parcel-modal-title"
        className={`relative w-full max-w-md max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col bg-gradient-to-b from-surface-container-lowest to-surface-container-low text-on-surface rounded-3xl shadow-[-12px_0_60px_-15px_rgba(0,0,0,0.5)] border border-outline-variant/40 backdrop-blur-xl transition-all duration-300 ease-out ${
          open ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
      }`}
      >
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
