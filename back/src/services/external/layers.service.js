export const getAvailableLayers = () => [
  { id: "sentinel-2-truecolor", name: "Sentinel-2 Color Real", provider: "Copernicus", type: "raster" },
  { id: "sentinel-2-falsecolor", name: "Sentinel-2 Falso Color", provider: "Copernicus", type: "raster" },
  { id: "sentinel-2-ndvi", name: "Indice NDVI", provider: "Copernicus", type: "raster" },
  { id: "sentinel-2-ndwi", name: "Indice NDWI (Agua)", provider: "Copernicus", type: "raster" },
  { id: "inegi-land-cover", name: "Uso de suelo y vegetacion", provider: "INEGI", type: "wms", url: "https://gaia.inegi.org.mx/NLB/tunnel/wms/wms61?" },
  { id: "conabio-protected-areas", name: "Areas naturales protegidas", provider: "CONABIO", type: "geoportal", url: "https://geoportal.conabio.gob.mx/" },
  { id: "hydrography", name: "Cuencas y red hidrografica", provider: "INEGI SIATL", type: "reference", url: "https://antares.inegi.org.mx/analisis/red_hidro/SIATL/" },
  { id: "firms-active-fires", name: "Incendios activos", provider: "NASA FIRMS", type: "api" }
];
