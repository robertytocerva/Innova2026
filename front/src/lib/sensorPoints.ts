import { API_BASE_URL } from "./apiClient";

export type SensorPointStatus = "active" | "no_fix" | "offline";
export type PointSourceType = "physical" | "digital";

export interface SensorPoint {
  id: string;
  polygonId: string;
  deviceId: string;
  order: number;
  sourceType: PointSourceType;
  status: SensorPointStatus;
  lat: number | null;
  lon: number | null;
  lastSeenAt: string | null;
  lastFixAt: string | null;
  updatedAt: string;
}

interface SensorPointsResponse {
  success: boolean;
  data: SensorPoint[];
}

export async function fetchSensorPoints(polygonId?: string): Promise<SensorPoint[]> {
  const query = polygonId ? `?polygonId=${encodeURIComponent(polygonId)}` : "";
  const response = await fetch(`${API_BASE_URL}/sensor-points${query}`, { cache: "no-store" });

  let result: SensorPointsResponse;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Respuesta invalida de sensor-points (HTTP ${response.status})`);
  }

  if (!response.ok || !result.success) {
    throw new Error(`No se pudieron obtener los puntos fisicos (HTTP ${response.status})`);
  }

  return result.data;
}
