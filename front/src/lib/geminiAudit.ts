import type { GeminiAuditResponse, ParcelFeature } from "../types/mapa";

const API_BASE_URL = import.meta.env.PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export async function auditParcelYears(
  parcel: ParcelFeature,
  fromYear: number,
  toYear: number,
): Promise<GeminiAuditResponse> {
  const response = await fetch(`${API_BASE_URL}/audits/gemini`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parcel, fromYear, toYear }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? payload?.message ?? `Error de auditoría (${response.status})`);
  }

  return payload.data as GeminiAuditResponse;
}
