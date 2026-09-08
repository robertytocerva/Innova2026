import { SATELLITE_HERO_IMG, SATELLITE_HERO_ALT, MAP_TEASER_IMG, MAP_TEASER_ALT, BRAND_LOGO } from "../constants/assets";
import type {
  Metric,
  LulcBar,
  Alert,
  IndexCard as IndexCardData,
  Pipeline,
  UseCase,
  FooterProps,
  NavProps,
} from "../types/landing";

export const heroData = {
  badge: { icon: "satellite_alt", label: "Observatorio LULC en Tiempo Real" },
  headline: "Monitoreo satelital inteligente del cambio y degradación de suelos en",
  headlineHighlight: "tiempo real",
  paragraph:
    "Detección precisa de transiciones de cobertura terrestre, deforestación, expansión urbana y regeneración vegetal con datos continuos de Copernicus Sentinel y Landsat 8/9 integrados a modelos de aprendizaje profundo.",
  primaryCta: { label: "Explorar Mapa de Zonas", href: "#mapa-interactivo", dataPath: "mapa-interactivo" },
  secondaryCta: { label: "Generar Reporte de Impacto", href: "#generador-de-reportes", dataPath: "generador-de-reportes" },
  complianceItems: [
    { icon: "verified", text: "Conforme a Directrices IPCC Tier 3" },
    { icon: "update", text: "Ciclo orbital cada 5 días" },
  ],
  imageUrl: SATELLITE_HERO_IMG,
  imageAlt: SATELLITE_HERO_ALT,
  imageBadge: "NDVI Compositivo 2024-Q3",
  imageGsd: "10m / px GSD",
  pin: {
    title: "Anomalía de Cobertura",
    detail: "-42.3 ha deforestadas",
    icon: "warning",
    iconTone: "text-error",
  },
  metaTitle: "Cuenca Amazónica Sur",
  metaTitleLabel: "Bioma Activo",
  metaReliabilityLabel: "Confiabilidad",
  metaReliabilityValue: "99.1%",
  telemetry: {
    band: "Banda B8/B4/B3",
    bandIcon: "sensors",
    cloud: "< 2.1%",
    status: "Sincronizado",
  },
};

export const metricsData: Metric[] = [
  {
    label: "Superficie Activa",
    value: "3.4M",
    description: "Hectáreas Monitoreadas en Sudamérica y Centroamérica",
    icon: "public",
    iconBg: "bg-secondary-fixed",
    iconFg: "text-on-secondary-fixed",
    trendIcon: "trending_up",
    trendText: "+240k ha incorporadas este mes",
    trendTone: "text-primary",
  },
  {
    label: "Certeza Algorítmica",
    value: "98.2%",
    description: "Precisión Clasificación LULC validada en campo",
    icon: "verified",
    iconBg: "bg-secondary-fixed",
    iconFg: "text-on-secondary-fixed",
    valueTone: "text-primary",
    trendText: "Matriz de Confusión 12 clases",
    trendTone: "text-on-surface-variant",
  },
  {
    label: "Vigilancia Continua",
    value: "+120",
    description: "Regiones Críticas bajo alerta de deforestación inmediata",
    icon: "radar",
    iconBg: "bg-error-container",
    iconFg: "text-on-error-container",
    trendTone: "text-error",
    showPulse: true,
    trendText: "18 alertas rojas activas hoy",
  },
  {
    label: "Resolución Óptica",
    value: "10m",
    description: "Resolución Satelital nativa por píxel en bandas VNIR",
    icon: "grid_view",
    iconBg: "bg-surface-container",
    iconFg: "text-primary",
    trendText: "Remuestreo super-resolución a 2.5m",
    trendTone: "text-on-surface-variant",
  },
];

export const lulcData = {
  kicker: "Dinámicas Geoespaciales 2023 - 2024",
  title: "Transiciones y Pérdidas de Cobertura Vegetal",
  description:
    "Comportamiento interanual derivado de clasificaciones espectrales multisensor con segmentación semántica de series de tiempo.",
  periodLabel: "Periodo de comparación:",
  periodValue: "2023 vs 2024 (YTD)",
  bars: [
    {
      label: "Bosque Nativo y Dosel Denso",
      swatch: "bg-primary",
      delta: "-2.4% (-81,600 ha)",
      deltaTone: "text-error",
      width: "58%",
      note: "Pérdida focalizada en amortiguamientos agroindustriales",
    },
    {
      label: "Suelo Agrícola y Pasturas",
      swatch: "bg-amber-600",
      delta: "+4.1% (+139,400 ha)",
      deltaTone: "text-amber-700",
      width: "28%",
      note: "Conversión rápida de sabanas y matorrales",
    },
    {
      label: "Suelo Urbano e Infraestructura",
      swatch: "bg-blue-600",
      delta: "+1.8% (+61,200 ha)",
      deltaTone: "text-blue-800",
      width: "14%",
      note: "Expansión periurbana en corredores logísticos",
    },
    {
      label: "Humedales y Cuerpos de Agua",
      swatch: "bg-cyan-600",
      delta: "Estable (0.0%)",
      deltaTone: "text-primary",
      width: "8%",
      note: "Eficacia de regímenes RAMSAR en zonas núcleo",
    },
  ] satisfies LulcBar[],
  alertsTitle: "Alertas Tempranas de Degradación",
  alertsRadarLabel: "Radar GLAD/RADD",
  alertsDescription:
    "Eventos anómalos de pérdida de biomasa detectados en los últimos 7 días con verificación de reflectancia infrarroja.",
  alerts: [
    {
      severity: "critical",
      location: "Sector Guaviare - Lote 14",
      title: "Deforestación por tala rasa detectada",
      area: "184.2 ha",
      confidence: "98.4%",
      timestamp: "Hace 4h",
    },
    {
      severity: "moderate",
      location: "Reserva Chocó Biogeográfico",
      title: "Fragmentación de dosel por caminos ilegales",
      area: "32.6 ha",
      confidence: "89.1%",
      timestamp: "Hace 14h",
    },
    {
      severity: "watching",
      location: "Delta del Río Magdalena",
      title: "Estrés hídrico en manglar periférico",
      area: "51.0 ha",
      confidence: "84.7%",
      timestamp: "Ayer",
    },
  ] satisfies Alert[],
  alertsCtaLabel: "Abrir Gestor de Alertas Satelitales",
  methodology: "Metodología de Corrección Topográfica: C-Correction / SRTM DEM 30m",
  matrixLinkLabel: "Ver matriz completa →",
  matrixLinkHref: "#generador-de-reportes",
  matrixLinkDataPath: "generador-de-reportes",
};

export const spectralData = {
  kicker: "Fundamento Radiométrico",
  title: "Capas Multiespectrales & Clasificación Algorítmica",
  description:
    "TerraSuelo procesa reflectancias de superficie calibradas (Level-2A) para aislar firmas biofísicas diferenciales y erradicar falsos positivos en el cálculo de biomasa.",
  indices: [
    {
      icon: "eco",
      iconBg: "bg-secondary-fixed",
      iconFg: "text-on-secondary-fixed",
      category: "ÍNDICE VEGETATIVO",
      categoryTone: "text-primary",
      bandCombo: "NIR / Red",
      title: "NDVI (Normalized Difference Vegetation Index)",
      description:
        "Cuantifica el vigor fotosintético mediante el contraste entre la absorción de clorofila en el canal rojo y la reflectancia celular en el infrarrojo cercano.",
      formula: "(B08 - B04) / (B08 + B04)",
      range: "Rango de Detección: 0.1 a 0.85",
      resolution: "Activo 10m",
    },
    {
      icon: "apartment",
      iconBg: "bg-surface-container",
      iconFg: "text-primary",
      category: "SUPERFICIE CONSTRUIDA",
      categoryTone: "text-on-surface-variant",
      bandCombo: "SWIR / NIR",
      title: "NDBI (Normalized Difference Built-up Index)",
      description:
        "Identifica núcleos urbanos, carreteras pavimentadas y suelo sellado distinguiendo firmas minerales artificiales de la vegetación circundante.",
      formula: "(B11 - B08) / (B11 + B08)",
      range: "Segregación Asfáltica: 96.8%",
      resolution: "Activo 20m",
    },
    {
      icon: "water_drop",
      iconBg: "bg-surface-container-high",
      iconFg: "text-on-surface",
      category: "ESTRÉS HÍDRICO & HUMEDALES",
      categoryTone: "text-cyan-700",
      bandCombo: "Green / NIR",
      title: "NDWI (Normalized Difference Water Index)",
      description:
        "Delimita cuerpos superficiales de agua y monitorea la turgencia foliar en canopias forestales para predecir vulnerabilidad a incendios forestales.",
      formula: "(B03 - B08) / (B03 + B08)",
      range: "Mapeo Hidrológico Dinámico",
      resolution: "Activo 10m",
    },
  ] satisfies IndexCardData[],
  pipeline: {
    kicker: "Flujo de Ingesta & Machine Learning",
    title: "Arquitectura de Procesamiento Cloud-Native",
    description:
      "Desde la captura orbital bruta hasta la inferencia semántica en tensores georeferenciados en menos de 40 minutos.",
    phases: [
      { phase: "FASE 01", title: "Ingesta L1C", description: "Descarga directa ESA/USGS" },
      { phase: "FASE 02", title: "Sen2Cor L2A", description: "Corrección atmosférica BOA" },
      { phase: "FASE 03", title: "U-Net Segmenter", description: "Clasificación 12 clases LULC" },
      { phase: "FASE 04", title: "Validación Vectorial", description: "GeoJSON, COG & Alertas" },
    ],
  } satisfies Pipeline,
};

export const useCasesData = {
  kicker: "Impacto Operativo Multidisciplinario",
  title: "Casos de Uso Científico & Gubernamental",
  description:
    "Nuestra plataforma provee la verdad de terreno verificable necesaria para fiscalización ambiental, mercados climáticos regulados y ordenamiento territorial.",
  cases: [
    {
      colSpan: "wide",
      icon: "park",
      iconBg: "bg-primary",
      iconFg: "text-on-primary",
      kicker: "Conservación Forestal",
      title: "Auditoría y Blindaje de Áreas Protegidas",
      description:
        "Detección milimétrica de incursiones de tala ilegal antes de que se consoliden en pérdida masiva de cobertura. Integración con patrullas de guardaparques mediante coordenadas geodésicas directas enviadas al dispositivo satelital de campo.",
      metrics: [
        { label: "Respuesta", value: "< 48 Horas", valueTone: "text-primary" },
        { label: "Área Mínima", value: "0.05 ha" },
        { label: "Polígonos", value: "Auto-Shp" },
      ],
    },
    {
      colSpan: "narrow",
      icon: "co2",
      iconBg: "bg-secondary-container",
      iconFg: "text-on-secondary-container",
      kicker: "Mercados de Carbono",
      title: "Certificación REDD+ & MRV",
      description:
        "Validación independiente de líneas base históricas de deforestación para certificar créditos de carbono bajo estándares Verra (VCS) y Gold Standard sin sesgos declarativos.",
      footerNote: "Cálculo de Biomasa Aérea (AGB): Incertidumbre ±6.2%",
    },
    {
      colSpan: "narrow-2",
      icon: "location_city",
      iconBg: "bg-surface-container",
      iconFg: "text-on-surface",
      kicker: "Planificación Urbana",
      kickerTone: "text-on-surface-variant",
      title: "Monitoreo de Isla de Calor & Suelo",
      description:
        "Control de la expansión informal de manchas metropolitanas sobre cinturones agrícolas de preservación y estimación de superficies impermeabilizadas.",
      footerNote: "Compatible con catastros municipales multi-capa",
      tags: ["t1"],
    },
    {
      colSpan: "wide-2",
      icon: "nest_eco_leaf",
      iconBg: "bg-tertiary-fixed",
      iconFg: "text-on-tertiary-fixed",
      kicker: "Mitigación Climática",
      kickerTone: "text-tertiary",
      title: "Seguimiento de Restauración Ecológica Activa",
      description:
        "Medición del crecimiento foliar y revegetación en cuencas hidrográficas degradadas. Comprueba fehacientemente el éxito de proyectos de reforestación a lo largo de series temporales de 10 años sin requerir muestreo destructivo.",
      tags: ["Tasa de Supervivencia Foliar", "Índice EVI Mejorado", "Mapas de Conectividad"],
    },
  ] satisfies UseCase[],
};

export const mapTeaserData = {
  badge: "VISOR CARTOGRÁFICO EN VIVO",
  badgeIcon: "travel_explore",
  title: "Inspecciona cualquier coordenada territorial con resolución de 10 metros",
  paragraph:
    "Navega por capas históricas desde el año 2018 hasta la actualidad. Aplica filtros espectrales dinámicos, traza polígonos de interés (AOI) y exporta GeoTIFFs listos para QGIS o ArcGIS.",
  primaryCta: { label: "Abrir Visor Geoespacial", href: "#mapa-interactivo", dataPath: "mapa-interactivo" },
  secondaryCta: { label: "Descargar Informe Anual LULC 2024", href: "#generador-de-reportes", dataPath: "generador-de-reportes" },
  formats: "Soporta formatos WMS, WFS, GeoJSON, Shapefile y COG Cloud Optimized GeoTIFF",
  imageUrl: MAP_TEASER_IMG,
  imageAlt: MAP_TEASER_ALT,
};

export const fastActionsData = {
  icon: "query_stats",
  title: "¿Necesitas delimitar un predio o área de conservación?",
  description: "Genera diagnósticos de deforestación y serie temporal multiespectral en segundos subiendo tu archivo KML o SHP.",
  cta: { label: "Analizar Polígono", href: "#generador-de-reportes", dataPath: "generador-de-reportes" },
};

export const statusMarqueeData = {
  liveLabel: "COPERNICUS SENTINEL-2B EN ÓRBITA",
  scanInfo: "Último barrido multiespectral: hace 18 min",
  coords: "Lat: -03°44'28\" / Lon: -62°21'10\"",
  calibration: { label: "Calibración Radiométrica", value: "Óptima (TOA L2A)" },
  kappa: { label: "Índice Kappa Global", value: "0.941" },
};

export const navData: NavProps = {
  logo: BRAND_LOGO,
  brandName: "TerraSuelo",
  links: [
    { label: "Inicio", href: "#inicio", dataPath: "inicio" },
    { label: "Mapa Interactivo", href: "#mapa-interactivo", dataPath: "mapa-interactivo" },
    { label: "Casos de Uso", href: "#casos-de-uso", dataPath: "casos-de-uso" },
    { label: "Reportes", href: "#generador-de-reportes", dataPath: "generador-de-reportes" },
    { label: "Monitoreo", href: "#monitoreo", dataPath: "monitoreo" },
  ],
  ctaLabel: "Acceder a la plataforma",
  ctaHref: "#mapa-interactivo",
  ctaDataPath: "mapa-interactivo",
};

export const footerData: FooterProps = {
  brand: {
    name: "TerraSuelo",
    tagline:
      "Infraestructura científica de observación terrestre para el monitoreo dinámico del uso de suelo, balance de biomasa y resiliencia forestal.",
    logo: BRAND_LOGO,
  },
  columns: [
    {
      title: "Plataforma",
      links: [
        { label: "Visión Global", href: "#", dataPath: "inicio" },
        { label: "Visualizador Geoespacial", href: "#", dataPath: "mapa-interactivo" },
        { label: "Polígonos & Reportes", href: "#", dataPath: "generador-de-reportes" },
      ],
    },
    {
      title: "Satélites & Datos",
      links: [
        { label: "ESA Copernicus Sentinel-2", muted: true },
        { label: "USGS Landsat 8/9 OLI", muted: true },
      ],
    },
    {
      title: "Recursos",
      links: [
        { label: "Documentación API", href: "#" },
        { label: "Centro de Conocimiento", href: "#" },
      ],
    },
  ],
  legal: "© 2026 TerraSuelo Consortium. Todos los derechos reservados.",
};
