const API_BASE = "https://innova2026.onrender.com/api/v1";

export interface CreateParcelPayload {
  name: string;
  cropType: "avocado" | "berries" | "other";
  municipality?: string;
  state?: string;
  geometry: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
  metadata?: Record<string, unknown>;
}

export interface ApiParcel {
  id: string;
  name: string;
  crop_type: string;
  municipality: string;
  state: string;
  area_ha: number;
  geometry: unknown;
  geojson: { type: "Polygon"; coordinates: [number, number][][] } | null;
  metadata: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function createParcel(payload: CreateParcelPayload): Promise<ApiParcel> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/parcels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (networkErr) {
    throw new Error(`No se pudo conectar con el backend (${API_BASE}). Verifica que esté corriendo.`);
  }

  let json: ApiResponse<ApiParcel>;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Respuesta inválida del servidor (HTTP ${res.status}).`);
  }

  if (!res.ok || !json.success) {
    const msg = (json as any)?.error || (json as any)?.message || `HTTP ${res.status}`;
    throw new Error(`Error al crear parcela: ${msg}`);
  }

  return json.data;
}

export async function fetchParcels(limit = 50, offset = 0): Promise<{ data: ApiParcel[]; total: number }> {
  const res = await fetch(`${API_BASE}/parcels?limit=${limit}&offset=${offset}`);
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(`Error al obtener parcelas: ${res.status}`);
  }

  return { data: json.data as ApiParcel[], total: json.meta?.total ?? (json.data as ApiParcel[]).length };
}
