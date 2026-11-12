#!/usr/bin/env python3
"""Puente local entre el puerto serie de la ESP32 y el frontend Astro."""

from __future__ import annotations

import argparse
import json
import math
import os
import threading
import time
from collections import deque
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

import serial
from serial.tools import list_ports


DEFAULT_ORIGINS = {
    "http://localhost:4321",
    "http://127.0.0.1:4321",
}
LOG_LIMIT = 100
DEFAULT_INGEST_URL = "http://127.0.0.1:3000/api/v1/sensor-points/ingest"


def timestamp() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def normalize_telemetry(line: str) -> dict[str, Any] | None:
    """Convierte una linea DATA:{...} en el objeto de vertices esperado."""
    if not line.startswith("DATA:"):
        return None

    payload = json.loads(line[len("DATA:") :])
    if not isinstance(payload, dict):
        raise ValueError("El JSON DATA debe ser un objeto")

    polygon_id = payload.get("poligonoId")
    vertices = payload.get("vertices")
    if not isinstance(polygon_id, str) or not polygon_id or len(polygon_id) > 80 or not isinstance(vertices, list):
        raise ValueError("Se esperaban poligonoId y vertices")

    clean_vertices: list[dict[str, Any]] = []
    for index, vertex in enumerate(vertices):
        if not isinstance(vertex, dict):
            raise ValueError(f"El vertice {index} no es un objeto")

        node_id = vertex.get("id")
        order = vertex.get("orden")
        # Las versiones anteriores del receptor solo enviaban id/orden/lat/lon.
        source_type = vertex.get("sourceType", "physical")
        status = vertex.get("status")
        lat = vertex.get("lat")
        lon = vertex.get("lon")
        if not isinstance(node_id, str) or not node_id or len(node_id) > 64:
            raise ValueError(f"El vertice {index} no tiene id valido")
        if isinstance(order, bool) or not isinstance(order, int) or not 1 <= order <= 255:
            raise ValueError(f"El vertice {index} no tiene orden valido")
        if not isinstance(source_type, str) or source_type not in {"physical", "digital"}:
            raise ValueError(f"Tipo de punto invalido en el vertice {index}")
        if (lat is None) != (lon is None):
            raise ValueError(f"lat y lon deben ser ambos nulos o numericos en el vertice {index}")
        latitude: float | None = None
        longitude: float | None = None
        if lat is not None and lon is not None:
            if isinstance(lat, bool) or not isinstance(lat, (int, float)):
                raise ValueError(f"El vertice {index} no tiene latitud numerica")
            if isinstance(lon, bool) or not isinstance(lon, (int, float)):
                raise ValueError(f"El vertice {index} no tiene longitud numerica")
            latitude = float(lat)
            longitude = float(lon)
            if not math.isfinite(latitude) or not -90 <= latitude <= 90:
                raise ValueError(f"Latitud fuera de rango en el vertice {index}")
            if not math.isfinite(longitude) or not -180 <= longitude <= 180:
                raise ValueError(f"Longitud fuera de rango en el vertice {index}")

        # El formato anterior solo emitia vertices con fix y coordenadas.
        if status is None and latitude is not None and longitude is not None:
            status = "active"
        if not isinstance(status, str) or status not in {"active", "no_fix", "offline"}:
            raise ValueError(f"Estado invalido en el vertice {index}")
        if status == "active" and (latitude is None or longitude is None):
            raise ValueError(f"El vertice activo {index} necesita coordenadas")

        clean_vertices.append(
            {
                "id": node_id,
                "orden": order,
                "sourceType": source_type,
                "status": status,
                "lat": latitude,
                "lon": longitude,
            }
        )

    clean_vertices.sort(key=lambda item: item["orden"])
    return {"poligonoId": polygon_id, "vertices": clean_vertices}


class TelemetryStore:
    def __init__(self, baud_rate: int) -> None:
        self._lock = threading.Lock()
        self._baud_rate = baud_rate
        self._serial_connected = False
        self._port: str | None = None
        self._latest: dict[str, Any] | None = None
        self._last_data_at: str | None = None
        self._error: str | None = "Esperando conexion con la ESP32"
        self._parse_error: str | None = None
        self._ingest_enabled = False
        self._ingest_error: str | None = None
        self._last_ingest_at: str | None = None
        self._logs: deque[str] = deque(maxlen=LOG_LIMIT)

    def set_serial_state(self, connected: bool, port: str | None, error: str | None) -> None:
        with self._lock:
            self._serial_connected = connected
            self._port = port
            self._error = error

    def set_ingest_state(self, enabled: bool, error: str | None = None, last_ingest_at: str | None = None) -> None:
        with self._lock:
            self._ingest_enabled = enabled
            self._ingest_error = error
            if last_ingest_at is not None:
                self._last_ingest_at = last_ingest_at

    def accept_line(self, line: str) -> dict[str, Any] | None:
        with self._lock:
            self._logs.append(line)

        try:
            telemetry = normalize_telemetry(line)
        except (json.JSONDecodeError, ValueError) as exc:
            with self._lock:
                self._parse_error = str(exc)
            return None

        if telemetry is not None:
            with self._lock:
                self._latest = telemetry
                self._last_data_at = timestamp()
                self._parse_error = None
        return telemetry

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return {
                "bridgeOnline": True,
                "serialConnected": self._serial_connected,
                "port": self._port,
                "baudRate": self._baud_rate,
                "latest": self._latest,
                "lastDataAt": self._last_data_at,
                "logs": list(self._logs),
                "error": self._error,
                "parseError": self._parse_error,
                "ingestEnabled": self._ingest_enabled,
                "ingestError": self._ingest_error,
                "lastIngestAt": self._last_ingest_at,
            }


def choose_serial_port(requested_port: str | None) -> str:
    if requested_port:
        return requested_port

    ports = list(list_ports.comports())
    if len(ports) == 1:
        return ports[0].device
    if not ports:
        raise RuntimeError("No se detectaron puertos serie; conecta la ESP32 o indica --port COMx")

    available = ", ".join(f"{port.device} ({port.description})" for port in ports)
    raise RuntimeError(f"Hay varios puertos serie ({available}); indica cual usar con --port COMx")


class IngestWorker:
    def __init__(self, url: str, token: str, store: TelemetryStore, min_interval: float = 10.0) -> None:
        self._url = url
        self._token = token
        self._store = store
        self._min_interval = min_interval
        self._stop_event = threading.Event()
        self._pending_event = threading.Event()
        self._lock = threading.Lock()
        self._latest_payload: dict[str, Any] | None = None
        self._thread = threading.Thread(target=self._run, daemon=True, name="sensor-api-ingest")

    def start(self) -> None:
        self._store.set_ingest_state(True)
        self._thread.start()

    def submit(self, payload: dict[str, Any]) -> None:
        with self._lock:
            self._latest_payload = payload
        self._pending_event.set()

    def stop(self) -> None:
        self._stop_event.set()
        self._pending_event.set()
        self._thread.join(timeout=3)

    def _post(self, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        request = Request(
            self._url,
            data=body,
            headers={
                "Authorization": f"Bearer {self._token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST",
        )
        with urlopen(request, timeout=10) as response:
            if response.status < 200 or response.status >= 300:
                raise RuntimeError(f"Backend respondio HTTP {response.status}")
            response.read()

    @staticmethod
    def _signature(payload: dict[str, Any]) -> str:
        vertices = []
        for point in payload["vertices"]:
            vertices.append(
                {
                    "id": point["id"],
                    "orden": point["orden"],
                    "sourceType": point["sourceType"],
                    "status": point["status"],
                    "lat": round(point["lat"], 5) if point["lat"] is not None else None,
                    "lon": round(point["lon"], 5) if point["lon"] is not None else None,
                }
            )
        return json.dumps(
            {"poligonoId": payload["poligonoId"], "vertices": vertices},
            sort_keys=True,
            separators=(",", ":"),
        )

    def _run(self) -> None:
        last_sent_at = 0.0
        last_signature: str | None = None
        heartbeat_seconds = 30.0
        while not self._stop_event.is_set():
            if not self._pending_event.wait(timeout=1):
                continue

            wait_for = self._min_interval - (time.monotonic() - last_sent_at)
            if last_sent_at and wait_for > 0:
                self._stop_event.wait(wait_for)
                if self._stop_event.is_set():
                    break

            self._pending_event.clear()
            with self._lock:
                payload = self._latest_payload
            if payload is None:
                continue

            signature = self._signature(payload)
            if signature == last_signature and time.monotonic() - last_sent_at < heartbeat_seconds:
                continue

            try:
                self._post(payload)
                last_sent_at = time.monotonic()
                last_signature = signature
                self._store.set_ingest_state(True, last_ingest_at=timestamp())
            except Exception as exc:
                message = str(exc)
                print(f"[INGEST] {message}", flush=True)
                last_sent_at = time.monotonic()
                self._store.set_ingest_state(True, error=message)
                self._stop_event.wait(2)
                self._pending_event.set()


def serial_reader(
    stop_event: threading.Event,
    store: TelemetryStore,
    requested_port: str | None,
    baud_rate: int,
    ingest_worker: IngestWorker | None,
) -> None:
    last_error: str | None = None
    while not stop_event.is_set():
        port: str | None = requested_port
        try:
            port = choose_serial_port(requested_port)
            with serial.Serial(port=port, baudrate=baud_rate, timeout=1) as connection:
                store.set_serial_state(True, port, None)
                last_error = None
                while not stop_event.is_set():
                    raw_line = connection.readline()
                    if not raw_line:
                        continue
                    line = raw_line.decode("utf-8", errors="replace").strip()
                    if line:
                        telemetry = store.accept_line(line)
                        if telemetry is not None and ingest_worker is not None:
                            ingest_worker.submit(telemetry)
        except Exception as exc:  # Reintenta si se desconecta o el puerto esta ocupado.
            message = str(exc)
            store.set_serial_state(False, port, message)
            if message != last_error:
                print(f"[SERIAL] {message}", flush=True)
                last_error = message
            stop_event.wait(2)


def make_handler(
    store: TelemetryStore,
    allowed_origins: set[str],
) -> type[BaseHTTPRequestHandler]:
    class RequestHandler(BaseHTTPRequestHandler):
        def log_message(self, _format: str, *_args: Any) -> None:
            return

        def _origin_allowed(self) -> bool:
            origin = self.headers.get("Origin")
            return origin is None or origin in allowed_origins

        def _add_cors_headers(self) -> None:
            origin = self.headers.get("Origin")
            if origin in allowed_origins:
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            if self.headers.get("Access-Control-Request-Private-Network") == "true":
                self.send_header("Access-Control-Allow-Private-Network", "true")

        def _send_json(self, status: int, data: dict[str, Any]) -> None:
            body = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self._add_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_OPTIONS(self) -> None:
            if not self._origin_allowed():
                self.send_error(403, "Origin not allowed")
                return
            self.send_response(204)
            self._add_cors_headers()
            self.send_header("Content-Length", "0")
            self.end_headers()

        def do_GET(self) -> None:
            if not self._origin_allowed():
                self._send_json(403, {"error": "Origen no permitido"})
                return

            path = urlsplit(self.path).path
            if path == "/health":
                self._send_json(200, {"ok": True})
            elif path == "/api/latest":
                self._send_json(200, store.snapshot())
            else:
                self._send_json(404, {"error": "Ruta no encontrada"})

    return RequestHandler


def main() -> None:
    parser = argparse.ArgumentParser(description="Puente serie local para la ESP32 maestra")
    parser.add_argument("--port", dest="serial_port", default=os.getenv("ESP32_PORT"))
    parser.add_argument("--baud", type=int, default=115200)
    parser.add_argument("--http-port", type=int, default=8765)
    parser.add_argument(
        "--ingest-url",
        default=os.getenv("SENSOR_INGEST_URL", DEFAULT_INGEST_URL),
        help="URL POST de ingesta del backend",
    )
    parser.add_argument(
        "--allow-origin",
        action="append",
        dest="allowed_origins",
        help="Origen web permitido; se puede repetir",
    )
    parser.add_argument("--list-ports", action="store_true", help="Lista puertos serie y termina")
    args = parser.parse_args()

    if args.list_ports:
        ports = list(list_ports.comports())
        if not ports:
            print("No se detectaron puertos serie")
        for port in ports:
            print(f"{port.device}: {port.description}")
        return

    origins = set(args.allowed_origins or DEFAULT_ORIGINS)
    store = TelemetryStore(args.baud)
    stop_event = threading.Event()
    ingest_token = os.getenv("SENSOR_INGEST_TOKEN")
    ingest_worker = None
    if ingest_token:
        ingest_worker = IngestWorker(args.ingest_url, ingest_token, store)
        ingest_worker.start()
        print(f"[INGEST] Envio habilitado a {args.ingest_url}")
    else:
        store.set_ingest_state(False, "SENSOR_INGEST_TOKEN no configurado; los datos no se guardaran en la base de datos")
        print("[INGEST] SENSOR_INGEST_TOKEN no configurado; solo estara disponible la lectura local")

    reader = threading.Thread(
        target=serial_reader,
        args=(stop_event, store, args.serial_port, args.baud, ingest_worker),
        daemon=True,
        name="esp32-serial-reader",
    )
    reader.start()

    handler = make_handler(store, origins)
    server = ThreadingHTTPServer(("127.0.0.1", args.http_port), handler)
    server.daemon_threads = True
    print(f"[HTTP] Puente disponible en http://127.0.0.1:{args.http_port}/api/latest")
    print("[HTTP] Origenes web permitidos: " + ", ".join(sorted(origins)))

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[HTTP] Cerrando puente...")
    finally:
        stop_event.set()
        server.server_close()
        reader.join(timeout=2)
        if ingest_worker is not None:
            ingest_worker.stop()


if __name__ == "__main__":
    main()
