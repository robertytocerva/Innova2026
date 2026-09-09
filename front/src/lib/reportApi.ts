import type { ComparisonResult, Expediente, Huerta, PublicVerification, ReportFinding, ReportSource } from "../types/reports";

export interface ReportDecision {
  verdict: string;
  boundaryFlag: boolean;
  reasons: string[];
  findings: ReportFinding[];
  regulatoryNotice?: string;
  normativeSources?: ReportSource[];
}

const API_BASE_URL = import.meta.env.PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message ?? payload?.message ?? `Error de API (${response.status})`);
  return payload.data as T;
}

export async function listHuertas(): Promise<Huerta[]> {
  const result = await request<{ data: Huerta[] } | Huerta[]>("/huertas");
  return Array.isArray(result) ? result : result.data;
}

export async function listExpedientes(): Promise<Expediente[]> {
  return request<Expediente[]>("/expedientes");
}

export async function confrontHuerta(id: string): Promise<{ comparison: ComparisonResult; expediente: Expediente; decision: ReportDecision }> {
  return request(`/huertas/${id}/comparaciones`, { method: "POST", body: JSON.stringify({}) });
}

export async function createAuditReport(referenceCode: string, feature: unknown, fromYear: number, toYear: number, audit: unknown): Promise<{ comparison: ComparisonResult; expediente: Expediente; decision: ReportDecision }> {
  return request(`/huertas/reference/${encodeURIComponent(referenceCode)}/auditoria-reporte`, {
    method: "POST",
    body: JSON.stringify({ feature, fromYear, toYear, audit }),
  });
}

export async function approveExpediente(folio: string, approvedBy: string, role: string): Promise<Expediente> {
  return request(`/expedientes/${encodeURIComponent(folio)}/aprobar`, {
    method: "POST",
    body: JSON.stringify({ approvedBy, role }),
  });
}

export async function generatePdf(folio: string): Promise<Expediente & { downloadUrl: string }> {
  return request(`/expedientes/${encodeURIComponent(folio)}/generar-pdf`, { method: "POST" });
}

export function pdfUrl(folio: string) {
  return `${API_BASE_URL}/expedientes/${encodeURIComponent(folio)}/pdf`;
}

export async function verifyFolio(folio: string): Promise<PublicVerification> {
  return request(`/public/verificacion/${encodeURIComponent(folio)}`);
}

export async function deleteExpediente(folio: string): Promise<{ id: string; folio: string }> {
  return request(`/expedientes/${encodeURIComponent(folio)}`, { method: "DELETE" });
}
