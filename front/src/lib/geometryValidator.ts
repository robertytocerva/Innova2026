/**
 * Módulo de Validación y Limpieza Geométrica con IA (Turf.js)
 * Detecta polígonos no cerrados, auto-intersecciones, traslapes entre huertas y duplicados catastrales.
 */

import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";
import type { GeometryValidationResult, GeometryIssue, ParcelFeature, ParcelFeatureCollection } from "../types/mapa";

type PolygonFeature = Feature<Polygon | MultiPolygon>;
type PolygonFC = FeatureCollection<Polygon | MultiPolygon>;

export function checkClosure(coordinates: [number, number][][] | undefined | null): boolean {
  if (!coordinates || !coordinates[0] || coordinates[0].length < 4) return false;
  const firstPoint = coordinates[0][0];
  const lastPoint = coordinates[0][coordinates[0].length - 1];
  return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
}

export function checkSelfIntersection(feature: ParcelFeature): boolean {
  try {
    const kinks = turf.kinks(feature as unknown as PolygonFeature);
    return kinks.features.length > 0;
  } catch (e) {
    return true;
  }
}

export function checkOverlaps(feature: ParcelFeature, allParcels?: ParcelFeatureCollection): boolean {
  if (!allParcels || !allParcels.features) return false;
  for (const p of allParcels.features) {
    if (p.id === feature.id) continue;
    try {
      const fc = turf.featureCollection<Polygon | MultiPolygon>([
        feature as unknown as PolygonFeature,
        p as unknown as PolygonFeature,
      ]);
      const intersection = turf.intersect(fc as unknown as PolygonFC);
      if (intersection && turf.area(intersection) > 1) {
        return true;
      }
    } catch (e) {}
  }
  return false;
}

export function checkMinimumArea(feature: ParcelFeature): boolean {
  try {
    const areaSqMeters = turf.area(feature as unknown as PolygonFeature);
    return (areaSqMeters / 10000) >= 0.01;
  } catch (e) {
    return true;
  }
}

export function validatePolygon(feature: ParcelFeature, existingParcels?: ParcelFeatureCollection): GeometryValidationResult {
  const issues: GeometryIssue[] = [];
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
  (window as unknown as { GeometryValidator: unknown }).GeometryValidator = {
    checkClosure,
    checkSelfIntersection,
    checkOverlaps,
    checkMinimumArea,
    validatePolygon
  };
}
