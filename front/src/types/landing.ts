export interface MarqueeItem {
  label: string;
  value: string;
  strong?: boolean;
}

export interface NavLink {
  label: string;
  href: string;
  dataPath?: string;
}

export interface NavProps {
  logo: string;
  brandName: string;
  links: NavLink[];
  ctaLabel: string;
  ctaHref: string;
  ctaDataPath?: string;
}

export interface CtaLink {
  label: string;
  href: string;
  dataPath?: string;
  icon?: string;
}

export interface ComplianceItem {
  icon: string;
  text: string;
}

export interface SensorPin {
  title: string;
  detail: string;
  icon: string;
  iconTone: string;
}

export interface TelemetryMeta {
  band: string;
  bandIcon: string;
  cloud: string;
  status: string;
}

export interface Metric {
  label: string;
  value: string;
  description: string;
  icon: string;
  iconBg: string;
  iconFg: string;
  valueTone?: string;
  trendIcon?: string;
  trendText?: string;
  trendTone?: string;
  showPulse?: boolean;
}

export interface LulcBar {
  label: string;
  swatch: string;
  delta: string;
  deltaTone: string;
  width: string;
  note: string;
}

export type AlertSeverity = "critical" | "moderate" | "watching";

export interface Alert {
  severity: AlertSeverity;
  location: string;
  title: string;
  area: string;
  confidence: string;
  timestamp: string;
}

export interface IndexCard {
  icon: string;
  iconBg: string;
  iconFg: string;
  category: string;
  categoryTone: string;
  bandCombo: string;
  title: string;
  description: string;
  formula: string;
  range: string;
  resolution: string;
  activeIcon?: string;
}

export interface PipelinePhase {
  phase: string;
  title: string;
  description: string;
}

export interface Pipeline {
  kicker: string;
  title: string;
  description: string;
  phases: PipelinePhase[];
}

export interface UseCaseMetric {
  label: string;
  value: string;
  valueTone?: string;
}

export type UseCaseColSpan = "wide" | "narrow" | "narrow-2" | "wide-2";

export interface UseCase {
  colSpan: UseCaseColSpan;
  icon: string;
  iconBg: string;
  iconFg: string;
  kicker: string;
  kickerTone?: string;
  title: string;
  description: string;
  metrics?: UseCaseMetric[];
  footerNote?: string;
  footerTone?: string;
  tags?: string[];
}

export interface FooterLinkItem {
  label: string;
  href?: string;
  dataPath?: string;
  muted?: boolean;
}

export interface FooterColumn {
  title: string;
  links: FooterLinkItem[];
}

export interface FooterBrand {
  name: string;
  tagline: string;
  logo: string;
}

export interface FooterProps {
  brand: FooterBrand;
  columns: FooterColumn[];
  legal: string;
}

export interface ExpedienteStep {
  title: string;
  description: string;
}

export interface ExpedienteTimelinePoint {
  year: string;
  coverage: number;
  tone: string;
}

export interface Expediente {
  id: string;
  cif: string;
  owner: string;
  locality: string;
  crop: string;
  areaHa: string;
  status: string;
  statusTone: string;
  ringTone: string;
  series: ExpedienteTimelinePoint[];
  verdict: string;
  verdictNote: string;
  issuedAt: string;
}

export interface ExpedientesProps {
  kicker: string;
  title: string;
  description: string;
  normTag: string;
  steps: ExpedienteStep[];
  items: Expediente[];
  cta: CtaLink;
}
