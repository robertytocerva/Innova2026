export type StatusKey = "aprobada" | "bloqueada" | "en_revision";

export interface StatusStyle {
  badgeClass: string;
  text: string;
  iconGradient: string;
  sheetIconGradient: string;
}

export const STATUS_STYLES: Record<StatusKey, StatusStyle> = {
  aprobada: {
    badgeClass: "bg-primary/20 text-primary border border-primary/40",
    text: "APROBADA",
    iconGradient: "from-primary/40 to-primary/10",
    sheetIconGradient: "from-primary/40 to-primary/10",
  },
  bloqueada: {
    badgeClass: "bg-error/20 text-error border border-error/40",
    text: "BLOQUEADA",
    iconGradient: "from-error/40 to-error/10",
    sheetIconGradient: "from-error/40 to-error/10",
  },
  en_revision: {
    badgeClass: "bg-amber-500/20 text-amber-700 border border-amber-600/40",
    text: "EN REVISIÓN",
    iconGradient: "from-amber-500/40 to-amber-600/10",
    sheetIconGradient: "from-amber-500/40 to-amber-600/10",
  },
};

export const DEFAULT_STATUS_STYLE: StatusStyle = STATUS_STYLES.en_revision;

export function resolveStatusKey(args: {
  exportacion: string;
  deforestacionDetectada?: boolean;
  vedaActiva: boolean;
}): StatusKey {
  if (args.exportacion === "bloqueada" || args.deforestacionDetectada || args.vedaActiva) {
    return "bloqueada";
  }
  if (args.exportacion === "aprobada" || args.exportacion === "en_revision") {
    return args.exportacion;
  }
  return "en_revision";
}
