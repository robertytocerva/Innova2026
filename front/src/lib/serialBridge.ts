export interface SerialVertex {
  id: string;
  orden: number;
  sourceType: "physical" | "digital";
  status: "active" | "no_fix" | "offline";
  lat: number | null;
  lon: number | null;
}

export interface SerialPositionData {
  poligonoId: string;
  vertices: SerialVertex[];
}

export interface SerialBridgeSnapshot {
  bridgeOnline: boolean;
  serialConnected: boolean;
  port: string | null;
  baudRate: number;
  latest: SerialPositionData | null;
  lastDataAt: string | null;
  logs: string[];
  error: string | null;
  parseError: string | null;
  ingestEnabled: boolean;
  ingestError: string | null;
  lastIngestAt: string | null;
}

const BRIDGE_URL = (
  import.meta.env.PUBLIC_SERIAL_BRIDGE_URL ?? "http://127.0.0.1:8765"
).replace(/\/+$/, "");
const POLL_INTERVAL_MS = 1000;
const REQUEST_TIMEOUT_MS = 2500;

const EMPTY_SNAPSHOT: SerialBridgeSnapshot = {
  bridgeOnline: false,
  serialConnected: false,
  port: null,
  baudRate: 115200,
  latest: null,
  lastDataAt: null,
  logs: [],
  error: "Esperando el puente Python local",
  parseError: null,
  ingestEnabled: false,
  ingestError: null,
  lastIngestAt: null,
};

let currentSnapshot = EMPTY_SNAPSHOT;
let currentSnapshotJson = JSON.stringify(EMPTY_SNAPSHOT);
const subscribers = new Set<() => void>();

declare global {
  interface Window {
    __INNOVA_SERIAL_STATE__?: SerialBridgeSnapshot;
  }
}

export function getSerialBridgeSnapshot(): SerialBridgeSnapshot {
  return currentSnapshot;
}

export function subscribeSerialBridge(listener: () => void): () => void {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function publishSnapshot(snapshot: SerialBridgeSnapshot): void {
  const serialized = JSON.stringify(snapshot);
  if (serialized === currentSnapshotJson) return;

  currentSnapshot = snapshot;
  currentSnapshotJson = serialized;

  if (typeof window !== "undefined") {
    window.__INNOVA_SERIAL_STATE__ = snapshot;
    window.dispatchEvent(
      new CustomEvent<SerialBridgeSnapshot>("innova:serial-update", { detail: snapshot }),
    );
  }

  subscribers.forEach((listener) => listener());
}

export function connectSerialBridge(): () => void {
  let stopped = false;
  let pollTimer: number | undefined;
  let activeRequest: AbortController | undefined;

  if (typeof window !== "undefined") {
    window.__INNOVA_SERIAL_STATE__ = currentSnapshot;
  }

  const poll = async (): Promise<void> => {
    activeRequest = new AbortController();
    const requestTimer = window.setTimeout(
      () => activeRequest?.abort(),
      REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(`${BRIDGE_URL}/api/latest`, {
        cache: "no-store",
        signal: activeRequest.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const snapshot = (await response.json()) as SerialBridgeSnapshot;
      publishSnapshot(snapshot);
    } catch (error) {
      const previous = currentSnapshot;
      const message = error instanceof Error ? error.message : "Error desconocido";
      publishSnapshot({
        ...previous,
        bridgeOnline: false,
        serialConnected: false,
        error: `No se pudo consultar el puente Python: ${message}`,
      });
    } finally {
      window.clearTimeout(requestTimer);
      activeRequest = undefined;
      if (!stopped) pollTimer = window.setTimeout(poll, POLL_INTERVAL_MS);
    }
  };

  void poll();

  return () => {
    stopped = true;
    if (pollTimer !== undefined) window.clearTimeout(pollTimer);
    activeRequest?.abort();
  };
}
