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

export interface NasaFireRecord {
  id: string;
  parcelId: string;
  municipio: string;
  fecha: string;
  hora: string;
  lat: number;
  lon: number;
  sensor: string;
  frpMegawatts: number;
  confianza: "alta" | "nominal" | "baja";
  tipoIncendio: string;
  indiciosDolo: string;
  distanciaCentroideMetros?: number;
}

export interface VedaForestalResult {
  vedaActiva: boolean;
  anosRestantes: number;
  anoIncendio: number | null;
  anoFinVeda: number | null;
  totalIncendios: number;
  dictamenLegal: string;
}

export interface AuditData {
  cambio_detectado: boolean;
  ano_deforestacion_estimado: number | null;
  incendio_registrado: boolean;
  ano_incendio: number | null;
  veda_art97_activa: boolean;
  ano_fin_veda_art97: number | null;
  nivel_certeza: number;
  comparativa: {
    ano_inicial: number;
    ano_final: number;
    resumen: string;
    perdidaVerdePct?: number;
    pixelesAnalizados?: number;
  };
  cronologia_pericial: Array<{ ano: number; estado: string }>;
  dictamen_pericial_completo: string;
  conclusion_legal: string;
}

export interface AuditResponse {
  data: AuditData;
  fireRecords: NasaFireRecord[];
  timestamp: string;
  method?: string;
  modelUsed?: string;
}

export type GeminiAuditData = AuditData;
export type GeminiAuditResponse = AuditResponse;

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

export interface DrawingPoint {
  lat: number;
  lng: number;
}

export type DrawingStatus = "idle" | "drawing" | "preview" | "saving";

export interface DrawingState {
  status: DrawingStatus;
  points: DrawingPoint[];
}
