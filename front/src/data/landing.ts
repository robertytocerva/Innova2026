import { SATELLITE_HERO_IMG, SATELLITE_HERO_ALT, MAP_TEASER_IMG, MAP_TEASER_ALT } from "../constants/assets";
import type {
  Metric,
  LulcBar,
  Alert,
  IndexCard as IndexCardData,
  Pipeline,
  UseCase,
  FooterProps,
  NavProps,
  ExpedientesProps,
} from "../types/landing";

export const heroData = {
  badge: { icon: "verified_user", label: "Plataforma de Auditoría Ambiental · Cero Deforestación" },
  headline: "Auditoría satelital del cambio de uso de suelo en el cinturón aguacatero y berries de",
  headlineHighlight: "Michoacán",
  paragraph:
    "Confrontamos los polígonos de huertas registradas de aguacate y berries (Uruapan, Zamora, Los Reyes y la Meseta Purépecha) contra la serie histórica de cobertura forestal Landsat/Sentinel para automatizar la emisión de expedientes de cumplimiento ambiental, en apego al Decreto estatal de Cero Deforestación.",
  primaryCta: { label: "Auditar Mi Predio", href: "#expedientes", dataPath: "expedientes", icon: "verified_user" },
  secondaryCta: { label: "Explorar Mapa de Zonas", href: "/mapa-interactivo", dataPath: "mapa-interactivo" },
  complianceItems: [
    { icon: "verified", text: "Conforme al Decreto de Certificación de Cero Deforestación" },
    { icon: "update", text: "Series históricas Landsat 8/9 + Sentinel-2" },
  ],
  imageUrl: SATELLITE_HERO_IMG,
  imageAlt: SATELLITE_HERO_ALT,
  imageBadge: "NDVI Compositivo 2024-Q3 · Meseta Purépecha",
  imageGsd: "10m / px GSD",
  pin: {
    title: "Cambio de Cobertura Detectado",
    detail: "-38.7 ha deforestadas sobre huerta registrada",
    icon: "warning",
    iconTone: "text-error",
  },
  metaTitle: "Cuenca del Cupatitzio",
  metaTitleLabel: "Cuenca Activa",
  metaReliabilityLabel: "Confiabilidad",
  metaReliabilityValue: "99.1%",
  telemetry: {
    band: "Banda B08/B04/B03",
    bandIcon: "sensors",
    cloud: "< 3.4%",
    status: "Sincronizado",
  },
};

export const metricsData: Metric[] = [
  {
    label: "Superficie Auditada",
    value: "1.9M",
    description: "Hectáreas de huertas registradas en Michoacán",
    icon: "public",
    iconBg: "bg-secondary-fixed",
    iconFg: "text-on-secondary-fixed",
    trendIcon: "trending_up",
    trendText: "+12k ha incorporadas este mes",
    trendTone: "text-secondary",
  },
  {
    label: "Conformidad Cero Deforestación",
    value: "91.4%",
    description: "Predios conformes tras confronta contra serie 2015–2025",
    icon: "verified",
    iconBg: "bg-secondary-fixed",
    iconFg: "text-on-secondary-fixed",
    valueTone: "text-secondary",
    trendText: "1,240 expedientes emitidos",
    trendTone: "text-on-surface-variant",
  },
  {
    label: "Alertas de Cambio de Uso",
    value: "+38",
    description: "Núcleos con sospecha de conversión ilegal en Uruapan–Zamora",
    icon: "radar",
    iconBg: "bg-error-container",
    iconFg: "text-on-error-container",
    trendTone: "text-error",
    showPulse: true,
    trendText: "12 alertas críticas activas hoy",
  },
  {
    label: "Resolución Óptica",
    value: "10m",
    description: "Resolución Sentinel-2 para la serie histórica por huerta",
    icon: "grid_view",
    iconBg: "bg-surface-container",
    iconFg: "text-secondary",
    trendText: "Serie mínima de 10 años por predio",
    trendTone: "text-on-surface-variant",
  },
];

export const lulcData = {
  kicker: "Dinámicas Geoespaciales 2015 - 2025",
  title: "Pérdida Forestal vs Expansión de Aguacate y Berries",
  description:
    "Comportamiento de una década de la cobertura terrestre en la Meseta Purépecha y el corredor Uruapan–Zamora–Los Reyes, derivado de clasificaciones espectrales multisensor.",
  periodLabel: "Periodo de comparación:",
  periodValue: "2015 vs 2025 (YTD)",
  bars: [
    {
      label: "Bosque Templado (Pino-Encino)",
      swatch: "bg-secondary",
      delta: "-6.8% (-52,400 ha)",
      deltaTone: "text-error",
      width: "58%",
      note: "Afectación en laderas de Uruapan y Meseta Purépecha",
    },
    {
      label: "Huertas de Aguacate",
      swatch: "bg-tertiary",
      delta: "+5.9% (+38,100 ha)",
      deltaTone: "text-amber-700",
      width: "28%",
      note: "Expansión sobre cobertura forestal en cinturón aguacatero",
    },
    {
      label: "Berries y Agricultura de Riego",
      swatch: "bg-cyan-700",
      delta: "+2.1% (+12,900 ha)",
      deltaTone: "text-cyan-800",
      width: "14%",
      note: "Crecimiento acelerado en Zamora y Los Reyes",
    },
    {
      label: "Cuerpos de Agua y Cuencas",
      swatch: "bg-blue-600",
      delta: "-0.4% (-3,100 ha)",
      deltaTone: "text-secondary",
      width: "8%",
      note: "Alteración de cuencas hidrográficas y escurrimientos",
    },
  ] satisfies LulcBar[],
  alertsTitle: "Alertas Tempranas de Conversión",
  alertsRadarLabel: "Radar GLAD/RADD",
  alertsDescription:
    "Eventos anómalos de pérdida de biomasa detectados en los últimos 7 días con verificación de reflectancia infrarroja.",
  alerts: [
    {
      severity: "critical",
      location: "San Juan Nuevo - Lote 7",
      title: "Conversión de bosque a huerto detectada",
      area: "22.4 ha",
      confidence: "97.6%",
      timestamp: "Hace 3h",
    },
    {
      severity: "moderate",
      location: "Colindancia Zona de Los Duendes",
      title: "Fragmentación de dosel por caminos de acceso",
      area: "8.9 ha",
      confidence: "91.3%",
      timestamp: "Hace 11h",
    },
    {
      severity: "watching",
      location: "Ribera del Río Duero, Zamora",
      title: "Estrés hídrico en huertos maduros",
      area: "15.4 ha",
      confidence: "86.2%",
      timestamp: "Ayer",
    },
  ] satisfies Alert[],
  alertsCtaLabel: "Abrir Gestor de Alertas Satelitales",
  methodology: "Metodología de Corrección Topográfica: C-Correction / SRTM DEM 30m",
  matrixLinkLabel: "Ver matriz completa →",
  matrixLinkHref: "#expedientes",
  matrixLinkDataPath: "expedientes",
};

export const spectralData = {
  kicker: "Fundamento Radiométrico",
  title: "Capas Multiespectrales para la Confronta de Cobertura",
  description:
    "TerraVision procesa reflectancias de superficie calibradas (Level-2A) para aislar firmas biofísicas diferenciales y erradicar falsos positivos en la detección de conversión de bosque nativo a huerto.",
  indices: [
    {
      icon: "eco",
      iconBg: "bg-secondary-fixed",
      iconFg: "text-on-secondary-fixed",
      category: "ÍNDICE VEGETATIVO",
      categoryTone: "text-secondary",
      bandCombo: "NIR / Red",
      title: "NDVI (Normalized Difference Vegetation Index)",
      description:
        "Cuantifica el vigor fotosintético y permite diferenciar dosel de pino-encino de huertos jóvenes mediante el contraste entre absorción de clorofila e infrarrojo cercano.",
      formula: "(B08 - B04) / (B08 + B04)",
      range: "Rango de Detección: 0.1 a 0.85",
      resolution: "Activo 10m",
    },
    {
      icon: "agriculture",
      iconBg: "bg-surface-container-high",
      iconFg: "text-secondary",
      category: "ESTRUCTURA AGRÍCOLA",
      categoryTone: "text-on-surface-variant",
      bandCombo: "SWIR / NIR",
      title: "NADI (Normalized Agriculture Density Index)",
      description:
        "Identifica la densidad de marcos de huertas uniformes de aguacate y berries, distinguiendo la firma mineral artificial de la vegetación nativa circundante.",
      formula: "(B11 - B08) / (B11 + B08)",
      range: "Segregación de Huertos: 96.8%",
      resolution: "Activo 20m",
    },
    {
      icon: "water_drop",
      iconBg: "bg-surface-container-high",
      iconFg: "text-on-surface",
      category: "ESTRÉS HÍDRICO & CUENCAS",
      categoryTone: "text-cyan-700",
      bandCombo: "Green / NIR",
      title: "NDWI (Normalized Difference Water Index)",
      description:
        "Delimita cuerpos superficiales de agua de las cuencas del Cupatitzio y el Duero, y monitorea la turgencia foliar de huertos para alertar presión sobre el recurso hídrico.",
      formula: "(B03 - B08) / (B03 + B08)",
      range: "Mapeo Hidrológico Dinámico",
      resolution: "Activo 10m",
    },
  ] satisfies IndexCardData[],
  pipeline: {
    kicker: "Flujo de Auditoría & Machine Learning",
    title: "Del Polígono del Predio al Expediente Automatizado",
    description:
      "Desde la captura orbital bruta hasta la inferencia semántica en tensores georeferenciados en menos de 40 minutos por predio.",
    phases: [
      { phase: "FASE 01", title: "Ingesta L1C", description: "Descarga directa ESA/USGS" },
      { phase: "FASE 02", title: "Sen2Cor L2A", description: "Corrección atmosférica BOA" },
      { phase: "FASE 03", title: "U-Net Segmenter", description: "Clasificación 12 clases LULC" },
      { phase: "FASE 04", title: "Confronta & Expediente", description: "Dictamen Cero Deforestación" },
    ],
  } satisfies Pipeline,
};

export const useCasesData = {
  kicker: "Impacto Operativo de la Auditoría",
  title: "Casos de Uso del Cinturón Agroexportador",
  description:
    "La plataforma provee la verdad de terreno verificable que necesitan las instituciones y los productores para certificar que un huerto respeta la cobertura forestal original y las leyes ambientales locales.",
  cases: [
    {
      colSpan: "wide",
      icon: "verified_user",
      iconBg: "bg-secondary",
      iconFg: "text-on-secondary",
      kicker: "Certificación Cero Deforestación",
      title: "Expedientes de Cumplimiento Automatizados",
      description:
        "Confronta el polígono de la huerta contra la serie histórica de cobertura forestal original y emite el expediente de cumplimiento automático ante el Decreto estatal, con trazabilidad geoespacial completa para fiscalización institucional.",
      metrics: [
        { label: "Respuesta", value: "< 48 Horas", valueTone: "text-secondary" },
        { label: "Área Mínima", value: "0.05 ha" },
        { label: "Registro", value: "Padrón + KML/SHP" },
      ],
    },
    {
      colSpan: "narrow",
      icon: "water_drop",
      iconBg: "bg-secondary-container",
      iconFg: "text-on-secondary-container",
      kicker: "Conservación de Cuencas",
      title: "Protección de Cuencas Hidrográficas",
      description:
        "Supervisa el escurrimiento y los acuíferos de Uruapan, Zamora y Los Reyes ante la expansión de huertas en laderas y zonas núcleo de captación.",
      footerNote: "Alteración de cuencas: -0.4%",
    },
    {
      colSpan: "narrow-2",
      icon: "agriculture",
      iconBg: "bg-surface-container",
      iconFg: "text-secondary",
      kicker: "Padrón Catastral",
      kickerTone: "text-on-surface-variant",
      title: "Huertas Registradas en Visibilidad Total",
      description:
        "Cada huerta de aguacate y berries del padrón oficial cuenta con su serie de cobertura 2015–2025 confrontada y actualizada continuamente.",
      footerNote: "Registros catastrales multi-capa",
      tags: ["Padrón Oficial", "KML/SHP", "Serie 2015–2025"],
    },
    {
      colSpan: "wide-2",
      icon: "nest_eco_leaf",
      iconBg: "bg-primary-container",
      iconFg: "text-on-primary-container",
      kicker: "Restauración Compensatoria",
      kickerTone: "text-secondary",
      title: "Seguimiento de Medidas de Compensación",
      description:
        "Mide el crecimiento foliar y la revegetación en predios obligados a compensar, comprobando la recuperación de dosel a lo largo de series temporales de 10 años sin muestreo destructivo.",
      tags: ["Tasa de Supervivencia Foliar", "Índice EVI Mejorado", "Mapas de Conectividad"],
    },
  ] satisfies UseCase[],
};

export const mapTeaserData = {
  badge: "VISOR CARTOGRÁFICO · MICHOACÁN",
  badgeIcon: "travel_explore",
  title: "Inspecciona cualquier huerta registrada con resolución de 10 m",
  paragraph:
    "Carga el polígono de tu predio o navega la serie 2015–2025 en Uruapan, Zamora y Los Reyes. Aplica filtros espectrales dinámicos, traza polígonos de interés (AOI) y exporta GeoTIFFs listos para QGIS o ArcGIS.",
  primaryCta: { label: "Abrir Visor Geoespacial", href: "/mapa-interactivo", dataPath: "mapa-interactivo" },
  secondaryCta: { label: "Descargar Informe Anual LULC 2025", href: "#expedientes", dataPath: "expedientes" },
  formats: "Soporta formatos WMS, WFS, GeoJSON, Shapefile y COG Cloud Optimized GeoTIFF",
  imageUrl: MAP_TEASER_IMG,
  imageAlt: MAP_TEASER_ALT,
};

export const fastActionsData = {
  icon: "query_stats",
  title: "Sube el polígono de tu huerta y recibe su expediente de cumplimiento",
  description: "KML o SHP: se confronta contra la serie histórica de cobertura forestal y se emite el dictamen Cero Deforestación al instante.",
  cta: { label: "Generar Expediente", href: "#expedientes", dataPath: "expedientes" },
};

export const expedientesData: ExpedientesProps = {
  kicker: "Núcleo de la Plataforma",
  title: "Expedientes Automatizados de Cumplimiento Ambiental",
  description:
    "El polígono de la huerta se confronta pixel a pixel contra la cobertura forestal original y las leyes ambientales locales. El sistema emite el dictamen con trazabilidad completa.",
  normTag: "Conforme al Decreto de Certificación de Cero Deforestación",
  steps: [
    { title: "Registra el Polígono", description: "Sube el KML/SHP de tu huerta o selecciónala del padrón catastral oficial." },
    { title: "Confronta la Serie 2015–2025", description: "Comparación contra la serie histórica de cobertura forestal Landsat/Sentinel." },
    { title: "Detecta Cambio de Uso", description: "Clasificación U-Net de 12 clases con indicadores de conversión ilegal." },
    { title: "Emite el Expediente", description: "Dictamen automático Cero Deforestación con trazabilidad geoespacial." },
  ],
  items: [
    {
      id: "EX-2026-0142",
      cif: "CIF-19-0771",
      owner: "Ejido San Juan Nuevo",
      locality: "Uruapan · Meseta Purépecha",
      crop: "Aguacate Hass",
      areaHa: "184.3 ha",
      status: "Conforme",
      statusTone: "bg-secondary text-on-secondary",
      ringTone: "ring-secondary",
      series: [
        { year: "2015", coverage: 96, tone: "bg-secondary" },
        { year: "2018", coverage: 95, tone: "bg-secondary" },
        { year: "2021", coverage: 94, tone: "bg-secondary" },
        { year: "2025", coverage: 93, tone: "bg-secondary" },
      ],
      verdict: "Cobertura forestal original preservada (+93% de dosel)",
      verdictNote: "Sin conversión ilegal detectada en el periodo de análisis. Expediente válido.",
      issuedAt: "Emitido hace 6 h",
    },
    {
      id: "EX-2026-0158",
      cif: "CIF-21-0334",
      owner: "Predios Los Tamarindos",
      locality: "Zamora · Valle",
      crop: "Berries (fresa / zarzamora)",
      areaHa: "76.9 ha",
      status: "No Conforme",
      statusTone: "bg-error-container text-on-error-container",
      ringTone: "ring-error",
      series: [
        { year: "2015", coverage: 89, tone: "bg-secondary" },
        { year: "2019", coverage: 71, tone: "bg-amber-500" },
        { year: "2022", coverage: 41, tone: "bg-amber-500" },
        { year: "2025", coverage: 12, tone: "bg-error" },
      ],
      verdict: "Pérdida del 77% del dosel original (89% → 12%)",
      verdictNote: "Cambio de uso de suelo no autorizado sobre bosque ripario; remisión a autoridad competente.",
      issuedAt: "Emitido hace 2 h",
    },
  ],
  cta: { label: "Generar Expediente de Mi Predio", href: "#generador-de-reportes", dataPath: "generador-de-reportes" },
};

export const statusMarqueeData = {
  liveLabel: "SENTINEL-2B EN ÓRBITA SOBRE MICHOACÁN",
  scanInfo: "Último barrido multiespectral: hace 8 min",
  coords: "Lat: 19°25′ N / Lon: 102°03′ W · Uruapan",
  calibration: { label: "Calibración Radiométrica", value: "Óptima (TOA L2A)" },
  kappa: { label: "Índice Kappa Global", value: "0.937" },
};

export const navData: NavProps = {
  logo: "/logoBlanco.png",
  brandName: "TerraVision",
  links: [
    { label: "Inicio", href: "/", dataPath: "inicio" },
    { label: "Mapa Interactivo", href: "/mapa-interactivo", dataPath: "mapa-interactivo" },
    { label: "Casos de Uso", href: "/casos-de-uso", dataPath: "casos-de-uso" },
    { label: "Reportes", href: "/reportes", dataPath: "reportes" },
    { label: "Monitoreo", href: "/monitoreo", dataPath: "monitoreo" },
  ],
  ctaLabel: "Abrir Visor",
  ctaHref: "/mapa-interactivo",
  ctaDataPath: "mapa-interactivo",
};

export const footerData: FooterProps = {
  brand: {
    name: "TerraVision",
    tagline:
      "Plataforma de auditoría ambiental del cinturón aguacatero y berries de Michoacán: confronta polígonos de huertas contra series históricas de cobertura forestal y emite expedientes de cumplimiento Cero Deforestación.",
    logo: "/logoVerde.png",
  },
  columns: [
    {
      title: "Plataforma",
      links: [
        { label: "Visión Regional", href: "#", dataPath: "inicio" },
        { label: "Auditoría de Predios", href: "#expedientes", dataPath: "expedientes" },
        { label: "Visualizador Geoespacial", href: "/mapa-interactivo", dataPath: "mapa-interactivo" },
      ],
    },
    {
      title: "Normativa & Datos",
      links: [
        { label: "Decreto de Cero Deforestación", muted: true },
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
  legal: "© 2026 TerraVision Consortium · Uruapan, Michoacán. Todos los derechos reservados.",
};