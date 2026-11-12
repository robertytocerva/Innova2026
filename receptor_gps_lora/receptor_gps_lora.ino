/*
 * RECEPTOR (maestra): ESP32 + GPS NEO-6M + LoRa SX1278 (Ra-02) 433 MHz
 *
 * Recibe coordenadas de varios nodos y agrega la posicion GPS de la maestra
 * como el primer vertice del poligono.
 *
 * Librerías (Gestor de librerías de Arduino IDE):
 *   - "LoRa" por Sandeep Mistry
 *   - "TinyGPSPlus" por Mikal Hart
 *
 * Conexiones SX1278 / Ra-02  ->  ESP32 (alimentar SOLO a 3.3 V)
 *   3.3V  -> 3V3
 *   GND   -> GND
 *   SCK   -> GPIO18
 *   MISO  -> GPIO19
 *   MOSI  -> GPIO23
 *   NSS   -> GPIO5
 *   RST   -> GPIO14
 *   DIO0  -> GPIO26
 *
 * Conexiones GPS NEO-6M  ->  ESP32
 *   VCC   -> 3V3 (o 5V si tu módulo GY-NEO6MV2 lo permite)
 *   GND   -> GND
 *   TX    -> GPIO16 (RX2 del ESP32)
 *   RX    -> GPIO17 (TX2 del ESP32)
 *
 * Paquete recibido (CSV):
 *   ID,orden,fix,lat,lon
 *
 * Salida serial (115200): DATA:{"poligonoId":"P1","vertices":[...]}
 * Cada vertice fisico incluye status active, no_fix u offline; las coordenadas
 * son null hasta que el dispositivo haya obtenido un fix valido.
 * Orden 1 es la maestra; cada emisor usa un orden unico entre 2 y 17.
 */

#include <SPI.h>
#include <LoRa.h>
#include <TinyGPSPlus.h>
#include <string.h>

// ---------- Pines LoRa ----------
#define LORA_SCK   18
#define LORA_MISO  19
#define LORA_MOSI  23
#define LORA_SS     5
#define LORA_RST   14
#define LORA_DIO0  26

// ---------- Pines GPS ----------
#define GPS_RX_PIN 16   // ESP32 RX2  <- TX del GPS
#define GPS_TX_PIN 17   // ESP32 TX2  -> RX del GPS
#define GPS_BAUD   9600

// ---------- Parámetros LoRa (IGUALES que en el emisor) ----------
#define LORA_FREQ        433E6
#define LORA_SF          9
#define LORA_BW          125E3
#define LORA_CR          5
#define LORA_SYNC_WORD   0xF3

// ---------- Configuracion ----------
const char* POLYGON_ID = "P1";
const char* MASTER_ID = "MAESTRA";
const uint8_t MASTER_ORDER = 1;
constexpr uint8_t MAX_REMOTE_NODES = 16;
const unsigned long MAX_NODE_AGE_MS = 25000;
const unsigned long GPS_UART_OFFLINE_MS = 5000;
const unsigned long DATA_OUTPUT_INTERVAL_MS = 2000;
const unsigned long GPS_UART_TIMEOUT_MS = 5000;
const unsigned long GPS_NMEA_TIMEOUT_MS = 15000;
const unsigned long GPS_FIX_TIMEOUT_MS = 180000;  // margen para un arranque GPS en frio
const unsigned long LORA_RF_TIMEOUT_MS = 30000;

TinyGPSPlus    gps;
HardwareSerial gpsSerial(2);
bool loraDisponible = false;
bool gpsUartConfirmado = false;
bool gpsNmeaConfirmado = false;
bool gpsFixConfirmado = false;
bool gpsAvisoSinDatos = false;
bool gpsAvisoSinNmea = false;
bool gpsAvisoSinFix = false;
bool loraRfConfirmado = false;
bool loraAvisoSinPaquetes = false;
unsigned long inicioValidacionMs = 0;
unsigned long ultimoDatoGpsMs = 0;
unsigned long ultimoSnapshotMs = 0;

struct NodoRemoto {
  bool usado;
  bool tienePosicion;
  bool fixValido;
  char id[12];
  uint8_t orden;
  double lat;
  double lon;
  unsigned long ultimaRecepcionMs;
};

NodoRemoto nodosRemotos[MAX_REMOTE_NODES] = {};

bool miFixValido() {
  if (!gps.location.isValid() || gps.location.age() >= 3000) return false;
  const double lat = gps.location.lat();
  const double lon = gps.location.lng();
  return lat >= -90.0 && lat <= 90.0 && lon >= -180.0 && lon <= 180.0;
}

NodoRemoto* buscarNodo(const char* id) {
  NodoRemoto* espacioLibre = nullptr;
  for (uint8_t i = 0; i < MAX_REMOTE_NODES; i++) {
    if (nodosRemotos[i].usado && strcmp(nodosRemotos[i].id, id) == 0) {
      return &nodosRemotos[i];
    }
    if (!nodosRemotos[i].usado && espacioLibre == nullptr) {
      espacioLibre = &nodosRemotos[i];
    }
  }
  return espacioLibre;
}

bool coordenadasValidas(double lat, double lon) {
  return lat >= -90.0 && lat <= 90.0 && lon >= -180.0 && lon <= 180.0;
}

void validarDispositivos() {
  const unsigned long transcurrido = millis() - inicioValidacionMs;
  const uint32_t caracteresGps = gps.charsProcessed();
  const uint32_t sentenciasGps = gps.passedChecksum();

  if (caracteresGps > 0 && !gpsUartConfirmado) {
    Serial.println("[CHECK] GPS_UART_OK: llegan datos del modulo GPS");
    gpsUartConfirmado = true;
  }
  if (transcurrido >= GPS_UART_TIMEOUT_MS && caracteresGps == 0 && !gpsAvisoSinDatos) {
    Serial.println("[CHECK] GPS_SIN_DATOS: revisar alimentacion, GND y TX del GPS a GPIO16");
    gpsAvisoSinDatos = true;
  }

  if (sentenciasGps > 0 && !gpsNmeaConfirmado) {
    Serial.println("[CHECK] GPS_NMEA_OK: sentencias GPS validas");
    gpsNmeaConfirmado = true;
  }
  if (transcurrido >= GPS_NMEA_TIMEOUT_MS && caracteresGps > 0 &&
      sentenciasGps == 0 && !gpsAvisoSinNmea) {
    Serial.printf("[CHECK] GPS_DATOS_INVALIDOS: revisar baud %u y TX/RX\n",
                  (unsigned)GPS_BAUD);
    gpsAvisoSinNmea = true;
  }

  const bool fixActual = gps.location.isValid() && gps.location.age() < 3000;
  if (fixActual && !gpsFixConfirmado) {
    Serial.println("[CHECK] GPS_FIX_OK: GPS y recepcion de satelites operativos");
    gpsFixConfirmado = true;
    gpsAvisoSinFix = false;
  } else if (!fixActual && gpsFixConfirmado) {
    Serial.println("[CHECK] GPS_FIX_PERDIDO: esperando recuperar señal GPS");
    gpsFixConfirmado = false;
  }

  if (transcurrido >= GPS_FIX_TIMEOUT_MS && gpsNmeaConfirmado && !fixActual &&
      !gpsAvisoSinFix) {
    const unsigned sats = gps.satellites.isValid()
        ? (unsigned)gps.satellites.value()
        : 0u;
    Serial.printf("[CHECK] GPS_SIN_FIX: sats=%u; revisar antena GPS y cielo abierto\n", sats);
    gpsAvisoSinFix = true;
  }

  if (loraDisponible && !loraRfConfirmado && transcurrido >= LORA_RF_TIMEOUT_MS &&
      !loraAvisoSinPaquetes) {
    Serial.println("[CHECK] LORA_SIN_PAQUETES: antena RF no confirmada; revisar emisor, antenas y parametros LoRa");
    loraAvisoSinPaquetes = true;
  }
}

bool procesarMensaje(const String &msg) {
  char id[12] = {};
  int orden = 0;
  int fix = 0;
  double lat = 0.0;
  double lon = 0.0;

  int campos = sscanf(msg.c_str(), "%11[^,],%d,%d,%lf,%lf",
                      id, &orden, &fix, &lat, &lon);
  if (campos != 5 || orden < 2 || orden > MAX_REMOTE_NODES + 1 ||
      (fix != 0 && fix != 1)) {
    return false;
  }

  NodoRemoto* nodo = buscarNodo(id);
  if (nodo == nullptr) return false;

  // Cada orden identifica un vertice; evita asignar el mismo orden a dos nodos.
  for (uint8_t i = 0; i < MAX_REMOTE_NODES; i++) {
    if (nodosRemotos[i].usado && &nodosRemotos[i] != nodo &&
        nodosRemotos[i].orden == orden) {
      return false;
    }
  }

  nodo->usado = true;
  strncpy(nodo->id, id, sizeof(nodo->id) - 1);
  nodo->id[sizeof(nodo->id) - 1] = '\0';
  nodo->orden = (uint8_t)orden;
  nodo->fixValido = fix == 1 && coordenadasValidas(lat, lon);
  if (nodo->fixValido) {
    nodo->tienePosicion = true;
    nodo->lat = lat;
    nodo->lon = lon;
  }
  nodo->ultimaRecepcionMs = millis();
  return true;
}

void imprimirVertice(const char* id, uint8_t orden, const char* status,
                     bool tienePosicion, double lat, double lon) {
  Serial.printf("{\"id\":\"%s\",\"orden\":%u,\"sourceType\":\"physical\",\"status\":\"%s\",\"lat\":",
                id, (unsigned)orden, status);
  if (tienePosicion) Serial.printf("%.6f", lat);
  else Serial.print("null");
  Serial.print(",\"lon\":");
  if (tienePosicion) Serial.printf("%.6f", lon);
  else Serial.print("null");
  Serial.print('}');
}

void imprimirPosicionesJson() {
  const unsigned long ahora = millis();
  bool separador = false;

  Serial.print("DATA:{\"poligonoId\":\"");
  Serial.print(POLYGON_ID);
  Serial.print("\",\"vertices\":[");

  const bool masterHasPosition = gps.location.isValid() &&
      coordenadasValidas(gps.location.lat(), gps.location.lng());
  const bool masterFix = masterHasPosition && miFixValido();
  const bool masterUartOnline = ultimoDatoGpsMs > 0 &&
      ahora - ultimoDatoGpsMs <= GPS_UART_OFFLINE_MS;
  const char* masterStatus = masterFix ? "active" : (masterUartOnline ? "no_fix" : "offline");
  const double masterLat = masterHasPosition ? gps.location.lat() : 0.0;
  const double masterLon = masterHasPosition ? gps.location.lng() : 0.0;
  imprimirVertice(MASTER_ID, MASTER_ORDER, masterStatus, masterHasPosition,
                  masterLat, masterLon);
  separador = true;

  // Incluir todos los nodos conocidos, incluso si no tienen fix o estan fuera de linea.
  for (uint8_t orden = 2; orden <= MAX_REMOTE_NODES + 1; orden++) {
    for (uint8_t i = 0; i < MAX_REMOTE_NODES; i++) {
      const NodoRemoto& nodo = nodosRemotos[i];
      if (!nodo.usado || nodo.orden != orden) continue;

      const bool nodoOffline = ahora - nodo.ultimaRecepcionMs > MAX_NODE_AGE_MS;
      const char* nodoStatus = nodoOffline ? "offline" : (nodo.fixValido ? "active" : "no_fix");
      if (separador) Serial.print(',');
      imprimirVertice(nodo.id, nodo.orden, nodoStatus, nodo.tienePosicion,
                      nodo.lat, nodo.lon);
      separador = true;
    }
  }

  Serial.println("]}");
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("[CHECK] Inicio de validacion GPS y LoRa");

  // GPS (buffer ampliado para no perder datos mientras se procesa LoRa)
  gpsSerial.setRxBufferSize(1024);
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  // LoRa
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  loraDisponible = LoRa.begin(LORA_FREQ);
  if (!loraDisponible) {
    Serial.println("[CHECK] LORA_MODULO_ERROR: revisar alimentacion, SPI y pines");
  } else {
    LoRa.setSpreadingFactor(LORA_SF);
    LoRa.setSignalBandwidth(LORA_BW);
    LoRa.setCodingRate4(LORA_CR);
    LoRa.setSyncWord(LORA_SYNC_WORD);
    LoRa.enableCrc();
    Serial.println("[CHECK] LORA_MODULO_OK: radio detectada; antena RF pendiente de recibir un paquete");
  }

  inicioValidacionMs = millis();
}

void loop() {
  // 1) Alimentar el parser NMEA del GPS propio
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
    ultimoDatoGpsMs = millis();
  }

  validarDispositivos();

  // Publicar el estado de la maestra aunque no haya paquetes de nodos remotos.
  if (gps.location.isUpdated()) {
    imprimirPosicionesJson();
    ultimoSnapshotMs = millis();
  }

  // 2) Recibir y guardar la ultima posicion de cada nodo
  int tam = loraDisponible ? LoRa.parsePacket() : 0;
  if (tam > 0) {
    if (!loraRfConfirmado) {
      Serial.println("[CHECK] LORA_RF_OK: paquete recibido, enlace de radio operativo");
      loraRfConfirmado = true;
    }
    String msg;
    msg.reserve(tam);
    while (LoRa.available()) {
      msg += (char)LoRa.read();
    }
    if (procesarMensaje(msg)) {
      imprimirPosicionesJson();
      ultimoSnapshotMs = millis();
    }
  }

  // Actualizar estados offline aun cuando no llegue un paquete LoRa.
  if (millis() - ultimoSnapshotMs >= DATA_OUTPUT_INTERVAL_MS) {
    imprimirPosicionesJson();
    ultimoSnapshotMs = millis();
  }
}
