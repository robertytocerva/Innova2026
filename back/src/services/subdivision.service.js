/**
 * Regla de Negocio: Anti-Subdivisión Fraudulenta (backend)
 *
 * Port de front/src/lib/subdivisionBlocker.ts.
 * Si una parcela registra eventos de deforestación en su historial, cualquier
 * intento de subdivisión catastral queda BLOQUEADO de forma inmutable.
 * Impide que un predio con sanción fraccione para vender o exportar solo la
 * porción "limpia" (art. 15días Decreto de Cero Deforestación / EUDR / SEMARNAT).
 */

/**
 * Evalúa si una parcela puede subdividirse.
 * @param {object} props  - Propiedades del predio (mismo shape de la tabla parcels
 *                          o del GeoJSON frontal: id, deforestacionDetectada,
 *                          historialDeforestacion, propietario, municipio).
 * @returns {{ allowed: boolean, reason: string, detalles: object|null }}
 */
export function canSubdivide(props) {
  if (!props || !props.id) {
    return { allowed: false, reason: "Predio o geometría no identificada.", detalles: null };
  }

  const historial = props.historialDeforestacion || [];
  const tieneDeforestacion =
    props.deforestacionDetectada === true ||
    props.deforestacion_detectada === true ||
    (Array.isArray(historial) && historial.length > 0);

  if (tieneDeforestacion) {
    const totalHa = historial.reduce((sum, ev) => sum + (ev.areaHa || ev.area_ha || 0), 0);
    return {
      allowed: false,
      reason: `BLOQUEO REGULATORIO ANTI-EVASIÓN: El predio ${props.id} cuenta con ${historial.length} evento(s) registrado(s) de deforestación (${totalHa} ha afectadas). El sistema bloquea toda subdivisión para impedir el lavado o exportación de fracciones "limpias".`,
      detalles: {
        id: props.id,
        eventosDeforestacion: historial.length,
        areaAfectadaHa: totalHa,
        propietario: props.propietario || props.name || null,
        municipio: props.municipio || props.municipality || null,
        historial
      }
    };
  }

  return {
    allowed: true,
    reason: "Predio libre de historial de deforestación. Cumple requisitos preliminares para trámites parcelarios.",
    detalles: { id: props.id }
  };
}
