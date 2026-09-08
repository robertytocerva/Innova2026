const HISTORICAL_FIRE_ARCHIVE = [
  { id: "FIRMS-2015-MCH-001", parcelId: "MCH-007", municipio: "Tancítaro", fecha: "2015-04-18", hora: "19:35 UTC", lat: 19.3412, lon: -102.3485, sensor: "VIIRS S-NPP (375m)", frpMegawatts: 38.4, confianza: "alta", tipoIncendio: "Incendio forestal de copa (Pino-Encino)", indiciosDolo: "Foco inicial en lindero con brecha de acceso" },
  { id: "FIRMS-2019-MCH-002", parcelId: "MCH-007", municipio: "Tancítaro", fecha: "2019-05-03", hora: "02:14 UTC (Nocturno)", lat: 19.3435, lon: -102.3462, sensor: "VIIRS S-NPP (375m)", frpMegawatts: 72.8, confianza: "alta", tipoIncendio: "Quema intencional de sotobosque y desmonte", indiciosDolo: "Fuegos múltiples simultáneos antes de temporada de lluvias" },
  { id: "FIRMS-2021-MCH-003", parcelId: "MCH-007", municipio: "Tancítaro", fecha: "2021-03-29", hora: "18:50 UTC", lat: 19.3401, lon: -102.344, sensor: "VIIRS NOAA-20 (375m)", frpMegawatts: 45.1, confianza: "alta", tipoIncendio: "Quema de residuos y despalme para huerta", indiciosDolo: "Apertura posterior de cepas para aguacate" },
  { id: "FIRMS-2014-MCH-004", parcelId: "MCH-008", municipio: "Peribán", fecha: "2014-05-11", hora: "19:10 UTC", lat: 19.5255, lon: -102.4251, sensor: "VIIRS S-NPP (375m)", frpMegawatts: 29.3, confianza: "nominal", tipoIncendio: "Incendio superficial en ladera", indiciosDolo: "Quema inducida en zona de amortiguamiento" },
  { id: "FIRMS-2020-MCH-005", parcelId: "MCH-008", municipio: "Peribán", fecha: "2020-04-22", hora: "20:05 UTC", lat: 19.5262, lon: -102.424, sensor: "VIIRS S-NPP (375m)", frpMegawatts: 58.7, confianza: "alta", tipoIncendio: "Incendio severo de transición agrícola", indiciosDolo: "Sustitución inmediata por olla de agua y plantación" },
  { id: "FIRMS-2017-MCH-006", parcelId: "MCH-009", municipio: "Los Reyes", fecha: "2017-04-09", hora: "18:40 UTC", lat: 19.5855, lon: -102.468, sensor: "VIIRS S-NPP (375m)", frpMegawatts: 34.2, confianza: "alta", tipoIncendio: "Quema agrícola descontrolada hacia masa forestal", indiciosDolo: "Avance sistemático sobre bosque de encino" },
  { id: "FIRMS-2022-MCH-007", parcelId: "MCH-009", municipio: "Los Reyes", fecha: "2022-05-14", hora: "01:55 UTC (Nocturno)", lat: 19.5862, lon: -102.4671, sensor: "VIIRS NOAA-20 (375m)", frpMegawatts: 63, confianza: "alta", tipoIncendio: "Incendio provocado para eliminación de tocones", indiciosDolo: "Trazo de terrazas registrado al mes siguiente" },
  { id: "FIRMS-2016-MCH-008", parcelId: "MCH-010", municipio: "Uruapan", fecha: "2016-04-26", hora: "19:22 UTC", lat: 19.431, lon: -102.052, sensor: "VIIRS S-NPP (375m)", frpMegawatts: 85, confianza: "alta", tipoIncendio: "Incendio periurbano de alta severidad", indiciosDolo: "Presión inmobiliaria y cambio de suelo agrícola" },
  { id: "FIRMS-2013-MCH-009", parcelId: "MCH-005", municipio: "Nuevo Parangaricutiro", fecha: "2013-03-15", hora: "17:15 UTC", lat: 19.418, lon: -102.131, sensor: "MODIS Aqua (1km)", frpMegawatts: 18.2, confianza: "nominal", tipoIncendio: "Quema agrícola prescrita perimetral", indiciosDolo: "Sin afectación de dosel forestal" },
];

const earthRadiusMeters = 6371000;

const distanceMeters = (lat1, lon1, lat2, lon2) => {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getHistoricalFireRecords = (parcel) => {
  const coordinates = parcel?.geometry?.coordinates?.[0] || [];
  const centroid = coordinates.reduce((result, [lon, lat]) => ({ lat: result.lat + lat, lon: result.lon + lon }), { lat: 0, lon: 0 });
  const count = coordinates.length || 1;
  const lat = centroid.lat / count;
  const lon = centroid.lon / count;
  const parcelId = parcel?.properties?.id;
  const parentId = parcel?.properties?.parentId;

  return HISTORICAL_FIRE_ARCHIVE
    .flatMap((fire) => {
      const distance = distanceMeters(lat, lon, fire.lat, fire.lon);
      const matchesId = fire.parcelId === parcelId || fire.parcelId === parentId;
      if (!matchesId && distance > 1200) return [];
      return [{ ...fire, distanciaCentroideMetros: Math.round(distance) }];
    })
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
};

export const calculateHistoricalVeda = (fireRecords) => {
  if (fireRecords.length === 0) return { vedaActiva: false, anoIncendio: null, anoFinVeda: null, anosRestantes: 0 };
  const anoIncendio = Math.max(...fireRecords.map((fire) => Number(fire.fecha.slice(0, 4))));
  const anoFinVeda = anoIncendio + 20;
  const anosRestantes = Math.max(0, anoFinVeda - new Date().getFullYear());
  return { vedaActiva: anosRestantes > 0, anoIncendio, anoFinVeda, anosRestantes };
};
