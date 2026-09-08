import { state } from "./state";
import { michoacanParcels } from "../../data/michoacanParcels";
import { canSubdivide } from "../../lib/subdivisionBlocker";
import { validatePolygon } from "../../lib/geometryValidator";
import { calculateVedaForestal, getParcelFireRecords } from "../../lib/nasaFirms";
import { auditParcelYears } from "../../lib/localImageAudit";
import { getParcelTimeSeriesUrls, SATELLITE_HISTORY_START } from "../../lib/satelliteHistory";
import type { ParcelFeature } from "../../types/mapa";

export function initParcelDrawer(): void {
  const drawer = document.getElementById("parcelDrawer");
  if (!drawer) return;

  document.getElementById("btnCloseDrawer")?.addEventListener("click", () => {
    drawer.classList.add("translate-x-full");
  });
  document.getElementById("btnTestSubdivision")?.addEventListener("click", testSubdivision);
  document.getElementById("btnRunAudit")?.addEventListener("click", runImageAudit);
}

export function openParcelDetail(feature: ParcelFeature): void {
  state.selectedFeature = feature;
  const p = feature.properties;
  state.activeTimeSeries = getParcelTimeSeriesUrls(feature);
  updateDrawerComparison();

  const setText = (id: string, val: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText("drawerParcelId", p.id);
  setText("drawerMunicipio", `Municipio: ${p.municipio} · Michoacán`);
  setText("drawerPropietario", p.propietario);
  setText("drawerSuperficie", `${p.superficieHa} ha`);
  setText("drawerCultivo", p.cultivo);
  setText("drawerNdvi", String(p.ndviPromedio ?? "0.82"));
  setText("drawerFecha", p.fechaAlta || "2023-01-01");
  setText("drawerConfianza", `${p.confianzaIA}%`);

  populateFiresSection(feature);
  populateStatusBadge(feature);
  populateDeforestationList(feature);
  populateGeometrySection(feature);

  const alertBox = document.getElementById("subdivisionAlertBox");
  if (alertBox) {
    alertBox.className = "hidden";
    alertBox.innerHTML = "";
  }

  document.getElementById("auditResultBox")?.classList.add("hidden");
  document.getElementById("auditAlertBox")?.classList.add("hidden");
  document.getElementById("auditLoading")?.classList.add("hidden");

  document.getElementById("parcelDrawer")?.classList.remove("translate-x-full");
}

export function updateDrawerComparison(): void {
  const fromLabel = document.getElementById("drawerFromYearLabel");
  const toLabel = document.getElementById("drawerToYearLabel");
  const fromImage = document.getElementById("drawerFromYearImage") as HTMLImageElement | null;
  const toImage = document.getElementById("drawerToYearImage") as HTMLImageElement | null;
  const notice = document.getElementById("drawerComparisonNotice");
  const auditButton = document.getElementById("btnRunAudit") as HTMLButtonElement | null;
  const hasSatelliteComparison = state.comparisonStartYear >= SATELLITE_HISTORY_START && state.currentMapYear >= SATELLITE_HISTORY_START;
  const fromUrl = state.activeTimeSeries?.series[state.comparisonStartYear];
  const toUrl = state.activeTimeSeries?.series[state.currentMapYear];

  if (fromLabel) fromLabel.textContent = `${state.comparisonStartYear} · Imagen inicial`;
  if (toLabel) toLabel.textContent = `${state.currentMapYear} · Imagen final`;
  if (fromImage) {
    fromImage.src = hasSatelliteComparison && fromUrl ? fromUrl : "";
    fromImage.alt = hasSatelliteComparison ? `Imagen satelital ${state.comparisonStartYear}` : "Sin imagen satelital disponible";
  }
  if (toImage) {
    toImage.src = hasSatelliteComparison && toUrl ? toUrl : "";
    toImage.alt = hasSatelliteComparison ? `Imagen satelital ${state.currentMapYear}` : "Sin imagen satelital disponible";
  }
  if (notice) notice.textContent = `Se compararán ${state.comparisonStartYear} y ${state.currentMapYear}. Los incendios FIRMS se consultan desde 2012.`;
  if (auditButton) auditButton.disabled = !state.selectedFeature || !hasSatelliteComparison || state.comparisonStartYear >= state.currentMapYear;
}

function populateFiresSection(feature: ParcelFeature): void {
  const fireRecords = getParcelFireRecords(feature);
  const vedaInfo = calculateVedaForestal(fireRecords);
  const fireCount = document.getElementById("drawerFireCount");
  const vedaBanner = document.getElementById("drawerVedaBanner");
  const vedaText = document.getElementById("drawerVedaText");
  const fireList = document.getElementById("drawerFireList");

  if (fireCount) fireCount.textContent = `${fireRecords.length} evento${fireRecords.length === 1 ? "" : "s"}`;
  if (vedaBanner) vedaBanner.classList.toggle("hidden", !vedaInfo.vedaActiva);
  if (vedaText) {
    vedaText.textContent = vedaInfo.vedaActiva
      ? `El último incendio detectado por NASA FIRMS fue en ${vedaInfo.anoIncendio}. El predio queda restringido hasta ${vedaInfo.anoFinVeda} (${vedaInfo.anosRestantes} años restantes).`
      : vedaInfo.dictamenLegal;
  }

  if (fireList) {
    fireList.innerHTML =
      fireRecords.length === 0
        ? `<div class="p-2.5 rounded-lg bg-primary-fixed/20 border border-primary-fixed/40 text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-base">verified</span>
            <span>Sin focos de calor registrados por NASA FIRMS entre 2012 y 2026.</span>
          </div>`
        : fireRecords
            .map(
              (fire) => `
            <article class="p-2.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-950 space-y-1">
              <div class="flex items-center justify-between gap-2 font-bold">
                <span class="flex items-center gap-1 text-orange-800">
                  <span class="material-symbols-outlined text-xs">whatshot</span>
                  ${fire.fecha} (${fire.hora})
                </span>
                <span class="font-mono text-[10px] bg-orange-200/80 px-1.5 py-0.5 rounded text-orange-900">${fire.frpMegawatts} MW</span>
              </div>
              <div class="text-[11px] text-orange-900"><strong>${fire.sensor}:</strong> ${fire.tipoIncendio}</div>
              <div class="text-[10px] text-orange-700 italic">${fire.indiciosDolo} · ${fire.distanciaCentroideMetros} m del centroide</div>
            </article>
          `
            )
            .join("");
  }
}

function populateStatusBadge(feature: ParcelFeature): void {
  const p = feature.properties;
  const fireRecords = getParcelFireRecords(feature);
  const vedaInfo = calculateVedaForestal(fireRecords);
  const badge = document.getElementById("drawerStatusBadge");
  if (!badge) return;

  if (p.exportacion === "bloqueada" || p.deforestacionDetectada || vedaInfo.vedaActiva) {
    badge.className = "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-error/20 text-error border border-error/40";
    badge.textContent = "BLOQUEADA";
  } else if (p.exportacion === "aprobada") {
    badge.className = "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/20 text-on-primary-container border border-primary/40";
    badge.textContent = "APROBADA";
  } else {
    badge.className = "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 border border-amber-600/40";
    badge.textContent = "EN REVISIÓN";
  }
}

function populateDeforestationList(feature: ParcelFeature): void {
  const p = feature.properties;
  const defList = document.getElementById("drawerDeforestationList");
  if (!defList) return;
  defList.innerHTML = "";
  if (p.historialDeforestacion && p.historialDeforestacion.length > 0) {
    p.historialDeforestacion.forEach((ev) => {
      defList.innerHTML += `
        <div class="p-2.5 rounded-lg bg-error-container/40 border border-error/40 text-error">
          <div class="flex items-center justify-between font-bold text-label-sm font-label-sm">
            <span>⚠️ ${ev.tipo}</span>
            <span class="font-mono text-[10px] text-error">${ev.fecha}</span>
          </div>
          <div class="text-[11px] mt-1">
            Área talada: <strong>${ev.areaHa} ha</strong> · Sensor: <strong>${ev.fuente}</strong>
          </div>
        </div>
      `;
    });
  } else {
    defList.innerHTML = `
      <div class="p-2.5 rounded-lg bg-primary-fixed/20 border border-primary-fixed/40 text-on-surface flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-base">verified</span>
        <span>Sin eventos de deforestación registrados desde 2018.</span>
      </div>
    `;
  }
}

function populateGeometrySection(feature: ParcelFeature): void {
  const geoIssues = document.getElementById("drawerGeometryIssues");
  const validation = validatePolygon(feature, michoacanParcels);
  const geometryScore = document.getElementById("drawerGeometryScore");
  if (geometryScore) geometryScore.textContent = `${validation.score}/100`;
  if (!geoIssues) return;
  geoIssues.innerHTML = "";
  const issues = validation.issues.length > 0 ? validation.issues : feature.properties.geometryIssues;
  if (issues && issues.length > 0) {
    issues.forEach((iss) => {
      geoIssues.innerHTML += `
        <div class="p-2 rounded bg-orange-50 border border-orange-200 text-orange-950 flex items-start gap-1.5">
          <span class="material-symbols-outlined text-orange-600 text-sm mt-0.5">warning</span>
          <div>
            <span class="font-semibold capitalize">${iss.tipo.replace("_", " ")}:</span>
            ${iss.descripcion}
          </div>
        </div>
      `;
    });
  } else {
    geoIssues.innerHTML = `
      <div class="p-2 rounded bg-surface-container border border-outline-variant/40 text-on-surface flex items-center gap-1.5">
        <span class="material-symbols-outlined text-primary text-sm">check_circle</span>
        <span>Topología y cierre vectorial correctos (100/100).</span>
      </div>
    `;
  }
}

function testSubdivision(): void {
  if (!state.selectedFeature) return;
  const res = canSubdivide(state.selectedFeature);
  const alertBox = document.getElementById("subdivisionAlertBox");
  if (!alertBox) return;
  alertBox.classList.remove("hidden");

  if (!res.allowed) {
    alertBox.className = "p-3 rounded-lg border bg-error-container/40 border-error text-error space-y-1";
    alertBox.innerHTML = `
      <div class="font-bold flex items-center gap-1 text-error">
        <span class="material-symbols-outlined text-base">block</span>
        SUBDIVISIÓN DENEGADA POR LEY FORESTAL
      </div>
      <p class="text-[11px] leading-tight">${res.reason}</p>
      <div class="mt-2 text-[10px] font-mono bg-error/10 p-1.5 rounded">
        Dictamen: El predio no puede ser fraccionado para eludir restricciones fitosanitarias de exportación (EUDR/SENASICA).
      </div>
    `;
  } else {
    alertBox.className = "p-3 rounded-lg border bg-primary-container/30 border-primary text-on-surface space-y-1";
    alertBox.innerHTML = `
      <div class="font-bold flex items-center gap-1 text-primary">
        <span class="material-symbols-outlined text-base">check_circle</span>
        SUBDIVISIÓN PERMITIDA
      </div>
      <p class="text-[11px] leading-tight">${res.reason}</p>
    `;
  }
}

async function runImageAudit(): Promise<void> {
  const button = document.getElementById("btnRunAudit") as HTMLButtonElement | null;
  const loading = document.getElementById("auditLoading");
  const alertBox = document.getElementById("auditAlertBox");
  const resultBox = document.getElementById("auditResultBox");
  if (
    !state.selectedFeature ||
    state.comparisonStartYear < SATELLITE_HISTORY_START ||
    state.currentMapYear < SATELLITE_HISTORY_START ||
    state.comparisonStartYear >= state.currentMapYear
  )
    return;

  button?.setAttribute("disabled", "true");
  loading?.classList.remove("hidden");
  alertBox?.classList.add("hidden");
  resultBox?.classList.add("hidden");

  try {
    const result = await auditParcelYears(state.selectedFeature, state.comparisonStartYear, state.currentMapYear);
    const data = result.data;
    const title = document.getElementById("auditVerdictTitle");
    const confidence = document.getElementById("auditConfidenceBadge");
    const summary = document.getElementById("auditComparisonSummary");
    const timeline = document.getElementById("auditTimelineList");
    const explanation = document.getElementById("auditExplanation");
    const legal = document.getElementById("auditConclusionLegal");

    if (title) title.textContent = data.cambio_detectado ? "CAMBIO DE COBERTURA DETECTADO" : "COBERTURA SIN CAMBIO CRÍTICO";
    if (confidence) confidence.textContent = `${data.nivel_certeza}% certeza`;
    if (summary) summary.textContent = `${data.comparativa.ano_inicial} vs ${data.comparativa.ano_final}: ${data.comparativa.resumen}`;
    if (timeline)
      timeline.innerHTML = data.cronologia_pericial.map((item) => `<div><strong>${item.ano}:</strong> ${item.estado}</div>`).join("");
    if (explanation) explanation.textContent = data.dictamen_pericial_completo;
    if (legal) legal.textContent = data.conclusion_legal;
    resultBox?.classList.remove("hidden");

    if (data.cambio_detectado || data.veda_art97_activa) {
      state.selectedFeature.properties.deforestacionDetectada = true;
      state.selectedFeature.properties.exportacion = "bloqueada";
      state.selectedFeature.properties.subdivisionBloqueada = true;
      document.dispatchEvent(new CustomEvent("map:reset-styles"));
    }
  } catch (error) {
    if (alertBox) {
      alertBox.textContent = error instanceof Error ? error.message : "No fue posible ejecutar la auditoría satelital local.";
      alertBox.classList.remove("hidden");
    }
  } finally {
    loading?.classList.add("hidden");
    if (button) {
      button.removeAttribute("disabled");
      updateDrawerComparison();
    }
  }
}
