export type ExportStatus = "aprobada" | "bloqueada" | "en_revision";

export interface HistorialDeforestacion {
  tipo: string;
  fecha: string;
  areaHa: number;
  fuente: string;
}

export interface GeometryIssue {
  tipo: string;
  descripcion: string;
  severidad: "alta" | "media" | "baja";
  autoReparable: boolean;
}

export interface ParcelProperties {
  id: string;
  propietario: string;
  municipio: string;
  superficieHa: number;
  cultivo: string;
  fechaAlta: string;
  exportacion: ExportStatus;
  deforestacionDetectada: boolean;
  historialDeforestacion: HistorialDeforestacion[];
  geometryIssues: GeometryIssue[];
  subdivisionBloqueada: boolean;
  parentId: string | null;
  ndviPromedio: number;
  ultimaRevision: string;
  confianzaIA: number;
}

export interface ParcelGeometry {
  type: "Polygon";
  coordinates: [number, number][][];
}

export interface ParcelFeature {
  type: "Feature";
  id: string;
  geometry: ParcelGeometry;
  properties: ParcelProperties;
}

export interface ParcelFeatureCollection {
  type: "FeatureCollection";
  features: ParcelFeature[];
}

export type AlertTipo = "critico" | "moderado" | "en_observacion";

export interface AlertaMichoacan {
  id: string;
  tipo: AlertTipo;
  municipio: string;
  sector: string;
  titulo: string;
  descripcion: string;
  areaHa: number;
  confianza: number;
  fecha: string;
  tiempoRelativo: string;
  coordenadas: { lat: number; lng: number };
  fuente: string;
  parcelaRelacionada: string | null;
}

export interface GeometryValidationResult {
  isValid: boolean;
  score: number;
  issues: GeometryIssue[];
}

export interface SubdivisionResult {
  allowed: boolean;
  reason: string | null;
  detalles: {
    id: string;
    eventosDeforestacion?: number;
    areaAfectadaHa?: number;
    propietario?: string;
    municipio?: string;
    historial?: HistorialDeforestacion[];
  } | null;
}
