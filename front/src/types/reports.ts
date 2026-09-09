export type Verdict = "cumple" | "no cumple" | "requiere revision";

export interface HuertaGeometry {
  type: "Polygon";
  coordinates: [number, number][][];
}

export interface Huerta {
  id: string;
  reference_code?: string;
  name: string;
  crop_type: "avocado" | "berries" | "other";
  municipality?: string;
  area_ha?: number;
  geometry?: HuertaGeometry;
}

export interface ComparisonResult {
  id: string;
  parcel_id: string;
  forest_loss_pct: number | null;
  forest_baseline_year: number;
  forest_cutoff_date: string;
  forest_status: string;
  fire_detected: boolean | null;
  fire_count: number;
  fire_last_date: string | null;
  fire_status: string;
  anp_overlap: boolean | null;
  anp_overlap_pct: number | null;
  anp_status: string;
  queried_at: string;
  sources: Array<{ provider?: string; status?: string }>;
}

export interface Expediente {
  id: string;
  folio: string;
  parcel_id: string;
  comparison_result_id: string;
  verdict: Verdict;
  boundary_flag: boolean;
  reasons: string[];
  status: "draft" | "approved" | "generated";
  approved_by?: string;
  approver_role?: string;
  approved_at?: string;
  pdf_sha256?: string;
  generated_at?: string;
  issued_at?: string;
  created_at: string;
  reference_code?: string;
  name?: string;
  crop_type?: string;
  municipality?: string;
  area_ha?: number;
  audit_from_year?: number;
  audit_to_year?: number;
  audit_confidence?: number;
}

export interface PublicVerification {
  valid: boolean;
  folio: string;
  issuedAt?: string;
  verdict: Verdict;
  boundaryFlag: boolean;
  huerta: {
    referenceCode?: string;
    name: string;
    municipality?: string;
    areaHa?: number;
  };
  approvedBy?: string;
  approverRole?: string;
  approvedAt?: string;
  pdfSha256?: string;
}
