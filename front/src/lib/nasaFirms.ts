import { nasaFirmsHistoricalArchive } from "../data/nasaFirms";
import type { NasaFireRecord, ParcelFeature, VedaForestalResult } from "../types/mapa";

const EARTH_RADIUS_METERS = 6_371_000;

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCentroid(parcel: ParcelFeature) {
  const coordinates = parcel.geometry?.coordinates?.[0] ?? [];
  const totals = coordinates.reduce(
    (result, [lon, lat]) => ({ lat: result.lat + lat, lon: result.lon + lon }),
    { lat: 0, lon: 0 },
  );
  const count = coordinates.length || 1;
  return { lat: totals.lat / count, lon: totals.lon / count };
}

export function getParcelFireRecords(parcel: ParcelFeature | null): NasaFireRecord[] {
  if (!parcel) return [];

  const parcelId = parcel.properties.id;
  const parentId = parcel.properties.parentId;
  const centroid = getCentroid(parcel);

  return nasaFirmsHistoricalArchive
    .flatMap((fire) => {
      const distance = distanceMeters(centroid.lat, centroid.lon, fire.lat, fire.lon);
      const matchesId = fire.parcelId === parcelId || fire.parcelId === parentId;
      if (!matchesId && distance > 1200) return [];
      return [{ ...fire, distanciaCentroideMetros: Math.round(distance) }];
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export function calculateVedaForestal(fireEvents: NasaFireRecord[]): VedaForestalResult {
  if (fireEvents.length === 0) {
    return {
      vedaActiva: false,
      anosRestantes: 0,
      anoIncendio: null,
      anoFinVeda: null,
      totalIncendios: 0,
      dictamenLegal: "Sin registros de incendios forestales NASA FIRMS entre 2012 y 2026.",
    };
  }

  const anoIncendio = Math.max(...fireEvents.map((event) => Number(event.fecha.slice(0, 4))));
  const anoFinVeda = anoIncendio + 20;
  const anosRestantes = Math.max(0, anoFinVeda - new Date().getFullYear());

  return {
    vedaActiva: anosRestantes > 0,
    anosRestantes,
    anoIncendio,
    anoFinVeda,
    totalIncendios: fireEvents.length,
    dictamenLegal:
      anosRestantes > 0
        ? `Veda forestal vigente por incendio registrado en ${anoIncendio}. El cambio de uso de suelo queda restringido hasta ${anoFinVeda}.`
        : `Veda forestal concluida. El último incendio registrado fue en ${anoIncendio} y venció en ${anoFinVeda}.`,
  };
}
