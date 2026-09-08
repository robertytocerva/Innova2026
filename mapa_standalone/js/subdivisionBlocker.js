/**
 * Módulo de Reglas de Negocio: Anti-Subdivisión Fraudulenta
 * Vigilancia Satelital Michoacán - TerraSuelo / Guardián Forestal
 * 
 * REGLA CRÍTICA:
 * Si una huerta o predio tiene historial de deforestación (tala rasa, fuego, aclareo ilegal),
 * el sistema BLOQUEA de forma inmutable cualquier intento de subdivisión catastral.
 * Lo que importa ante la ley (EUDR, SEMARNAT, PROFEPA) es la historia completa del predio,
 * no la parcela recién fraccionada.
 */

/**
 * Verifica si una parcela tiene permitido subdividirse
 * @param {object} parcelFeature - Feature GeoJSON con sus properties
 * @returns {{ allowed: boolean, reason: string|null, detalles: object|null }}
 */
export function canSubdivide(parcelFeature) {
  if (!parcelFeature || !parcelFeature.properties) {
    return { allowed: false, reason: 'Predio o geometría no identificada.', detalles: null };
  }

  const props = parcelFeature.properties;
  const historial = props.historialDeforestacion || [];
  const tieneDeforestacion = props.deforestacionDetectada || (Array.isArray(historial) && historial.length > 0);

  if (tieneDeforestacion) {
    const totalHa = historial.reduce((sum, ev) => sum + (ev.areaHa || 0), 0);
    return {
      allowed: false,
      reason: `BLOQUEO REGULATORIO ANTI-EVASIÓN: El predio ${props.id} cuenta con ${historial.length} evento(s) registrado(s) de deforestación (${totalHa} ha afectadas). El sistema bloquea toda subdivisión para impedir el lavado o exportación de fracciones "limpias".`,
      detalles: {
        id: props.id,
        eventosDeforestacion: historial.length,
        areaAfectadaHa: totalHa,
        propietario: props.propietario,
        municipio: props.municipio,
        historial
      }
    };
  }

  return {
    allowed: true,
    reason: 'Predio libre de historial de deforestación. Cumple requisitos preliminares para trámites parcelarios.',
    detalles: { id: props.id }
  };
}

// Soporte para entornos sin módulos ES (navegador directo)
if (typeof window !== 'undefined') {
  window.SubdivisionBlocker = { canSubdivide };
}
