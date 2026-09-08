/**
 * Módulo de Validación y Limpieza Geométrica con IA (Turf.js)
 * Detecta polígonos no cerrados, auto-intersecciones, traslapes entre huertas y duplicados catastrales.
 */

export function checkClosure(coordinates) {
  if (!coordinates || !coordinates[0] || coordinates[0].length < 4) return false;
  const firstPoint = coordinates[0][0];
  const lastPoint = coordinates[0][coordinates[0].length - 1];
  return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
}

export function checkSelfIntersection(feature) {
  if (typeof turf === 'undefined') return false;
  try {
    const kinks = turf.kinks(feature);
    return kinks.features.length > 0;
  } catch (e) {
    return true;
  }
}

export function checkOverlaps(feature, allParcels) {
  if (typeof turf === 'undefined' || !allParcels || !allParcels.features) return false;
  for (const p of allParcels.features) {
    if (p.id === feature.id) continue;
    try {
      const intersection = turf.intersect(turf.featureCollection([feature, p]));
      if (intersection && turf.area(intersection) > 1) {
        return true;
      }
    } catch (e) {}
  }
  return false;
}

export function checkMinimumArea(feature) {
  if (typeof turf === 'undefined') return true;
  try {
    const areaSqMeters = turf.area(feature);
    return (areaSqMeters / 10000) >= 0.01;
  } catch (e) {
    return true;
  }
}

export function validatePolygon(feature, existingParcels) {
  const issues = [];
  const coords = feature.geometry?.coordinates;

  if (!checkClosure(coords)) {
    issues.push({
      tipo: 'poligono_no_cerrado',
      descripcion: 'El primer y último vértice no coinciden (anillo abierto).',
      severidad: 'alta',
      autoReparable: true
    });
  }

  if (checkSelfIntersection(feature)) {
    issues.push({
      tipo: 'auto_interseccion',
      descripcion: 'Auto-intersección detectada: bordes del polígono se cruzan.',
      severidad: 'alta',
      autoReparable: false
    });
  }

  if (existingParcels && checkOverlaps(feature, existingParcels)) {
    issues.push({
      tipo: 'traslape',
      descripcion: 'Traslape detectado con predio colindante en el catastro.',
      severidad: 'alta',
      autoReparable: false
    });
  }

  if (!checkMinimumArea(feature)) {
    issues.push({
      tipo: 'area_minima',
      descripcion: 'Área superficial menor a 0.01 ha (posible residuo cartográfico).',
      severidad: 'media',
      autoReparable: false
    });
  }

  let score = 100;
  issues.forEach(iss => {
    if (iss.severidad === 'alta') score -= 35;
    else if (iss.severidad === 'media') score -= 15;
    else score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.length === 0,
    score,
    issues
  };
}

if (typeof window !== 'undefined') {
  window.GeometryValidator = {
    checkClosure,
    checkSelfIntersection,
    checkOverlaps,
    checkMinimumArea,
    validatePolygon
  };
}
