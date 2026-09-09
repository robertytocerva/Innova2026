import { useState, useCallback, type ReactElement } from "react";
import { createParcel, type CreateParcelPayload } from "../../lib/apiClient";
import { checkClosure, checkSelfIntersection, checkMinimumArea } from "../../lib/geometryValidator";
import type { DrawingPoint, DrawingState } from "../../types/mapa";

interface Props {
  drawingState: DrawingState;
  onDrawingStateChange: (state: DrawingState) => void;
  onAddPoint: (point: DrawingPoint) => void;
  onRemoveLastPoint: () => void;
  onClearPoints: () => void;
  onClosePolygon: () => void;
  onParcelCreated: () => void;
}

export default function PolygonDrawer({
  drawingState,
  onDrawingStateChange,
  onRemoveLastPoint,
  onClearPoints,
  onClosePolygon,
  onParcelCreated,
}: Props): ReactElement {
  const [name, setName] = useState("");
  const [propietario, setPropietario] = useState("");
  const [cropType, setCropType] = useState<"avocado" | "berries" | "other">("avocado");
  const [municipality, setMunicipality] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { status, points } = drawingState;
  const isActive = status !== "idle";
  const hasEnoughPoints = points.length >= 3;
  const isPreview = status === "preview";

  const validatePolygon = useCallback((): string | null => {
    if (points.length < 3) return "Se necesitan al menos 3 puntos.";

    const closedPoints = [...points, points[0]];
    const coords: [number, number][][] = [closedPoints.map((p) => [p.lng, p.lat])];

    if (!checkClosure(coords)) return "El polígono no está cerrado correctamente.";

    const feature = {
      type: "Feature" as const,
      id: "temp",
      geometry: { type: "Polygon" as const, coordinates: coords },
      properties: { id: "temp" },
    };

    if (checkSelfIntersection(feature as any)) return "El polígono tiene auto-intersecciones.";

    if (!checkMinimumArea(feature as any)) return "El área mínima es 0.01 ha.";

    return null;
  }, [points]);

  const handleClosePolygon = useCallback(() => {
    const err = validatePolygon();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onClosePolygon();
  }, [validatePolygon, onClosePolygon]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    const err = validatePolygon();
    if (err) {
      setError(err);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const closedPoints = [...points, points[0]];
      const payload: CreateParcelPayload = {
        name: name.trim(),
        cropType,
        municipality: municipality.trim() || undefined,
        geometry: {
          type: "Polygon",
          coordinates: [closedPoints.map((p) => [p.lng, p.lat])],
        },
        metadata: {
          propietario: propietario.trim() || undefined,
        },
      };

      await createParcel(payload);

      setName("");
      setPropietario("");
      setCropType("avocado");
      setMunicipality("");
      onClearPoints();
      onDrawingStateChange({ status: "idle", points: [] });
      onParcelCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar la parcela.");
    } finally {
      setSaving(false);
    }
  }, [points, name, cropType, municipality, validatePolygon, onClearPoints, onDrawingStateChange, onParcelCreated]);

  const handleCancel = useCallback(() => {
    onClearPoints();
    onDrawingStateChange({ status: "idle", points: [] });
    setError(null);
    setName("");
    setPropietario("");
    setMunicipality("");
  }, [onClearPoints, onDrawingStateChange]);

  const handleUndo = useCallback(() => {
    setError(null);
    onRemoveLastPoint();
  }, [onRemoveLastPoint]);

  if (!isActive) return <></>;

  return (
    <div className="absolute top-4 left-4 z-[1000] w-80 max-w-[calc(100vw-2rem)] bg-surface-container-lowest text-on-surface rounded-xl shadow-2xl border border-outline-variant/40 flex flex-col overflow-hidden">
      <div className="px-4 py-3 bg-inverse-surface text-surface flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">draw</span>
          <span className="font-bold text-sm">
            {isPreview ? "Confirmar Polígono" : "Dibujar Polígono"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="p-1 rounded-lg hover:bg-inverse-surface/40 transition-colors"
          aria-label="Cancelar dibujo"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="px-4 py-3 space-y-3 text-xs">
        <div className="flex items-center justify-between bg-surface-container-low rounded-lg px-3 py-2 border border-outline-variant/40">
          <span className="text-on-surface-variant">Puntos colocados:</span>
          <span className="font-mono font-bold text-primary">{points.length}</span>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-error/10 border border-error/40 text-error text-xs flex items-start gap-2">
            <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
            <span>{error}</span>
          </div>
        )}

        {!isPreview ? (
          <>
            <p className="text-on-surface-variant leading-relaxed">
              Haz clic en el mapa para colocar puntos. Necesitas al menos 3 puntos para formar un polígono.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={points.length === 0}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-outline-variant/40"
              >
                <span className="material-symbols-outlined text-[16px]">undo</span>
                Deshacer
              </button>
              <button
                type="button"
                onClick={handleClosePolygon}
                disabled={!hasEnoughPoints}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-on-primary font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">polyline</span>
                Cerrar
              </button>
            </div>

            {points.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-outline-variant/40 rounded-lg">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-surface-container-low">
                      <th className="px-2 py-1 text-left text-on-surface-variant font-semibold">Pto</th>
                      <th className="px-2 py-1 text-left text-on-surface-variant font-semibold">Latitud</th>
                      <th className="px-2 py-1 text-left text-on-surface-variant font-semibold">Longitud</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((pt, i) => (
                      <tr key={i} className="border-t border-outline-variant/20">
                        <td className="px-2 py-0.5 font-mono text-primary">P{i + 1}</td>
                        <td className="px-2 py-0.5 font-mono">{pt.lat.toFixed(6)}</td>
                        <td className="px-2 py-0.5 font-mono">{pt.lng.toFixed(6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-on-surface-variant leading-relaxed">
              Polígono cerrado con {points.length} vértices. Completa los datos para guardar.
            </p>

            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Parcela Norte"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Propietario
                </label>
                <input
                  type="text"
                  value={propietario}
                  onChange={(e) => setPropietario(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Tipo de Cultivo
                </label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value as typeof cropType)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="avocado">Aguacate</option>
                  <option value="berries">Bayas</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Municipio
                </label>
                <input
                  type="text"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  placeholder="Ej: Uruapan"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-medium transition-colors border border-outline-variant/40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-on-primary font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">save</span>
                )}
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
