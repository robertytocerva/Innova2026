/*
 * EMISOR: ESP32 + GPS NEO-6M + LoRa SX1278 (Ra-02) 433 MHz
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
 * Paquete minimo enviado por LoRa (CSV):
 *   ID,orden,fix,lat,lon
 *
 * La maestra usa orden 1. Configure cada emisor con un ID unico y
 * un orden unico entre 2 y 17 antes de cargar el sketch.
 */

#include <SPI.h>
#include <LoRa.h>
#include <TinyGPSPlus.h>

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

// ---------- Parámetros LoRa (deben ser IGUALES en el receptor) ----------
#define LORA_FREQ        433E6
#define LORA_SF          9        // 7..12 (más alto = más alcance, más lento)
#define LORA_BW          125E3
#define LORA_CR          5        // 4/5
#define LORA_SYNC_WORD   0xF3
#define LORA_TX_POWER    17       // dBm (2..20)

// ---------- Configuración ----------
const char*          NODE_ID      = "TX01";
const uint8_t        NODE_ORDER   = 2;       // 2..17; orden 1 reservado a la maestra
const unsigned long  INTERVALO_MS = 10000;   // intervalo entre transmisiones
const unsigned long  SLOT_NODO_MS = 500;     // separacion inicial por orden
const unsigned long  GPS_UART_TIMEOUT_MS = 5000;
const unsigned long  GPS_NMEA_TIMEOUT_MS = 15000;
const unsigned long  GPS_FIX_TIMEOUT_MS = 180000;  // margen para un arranque GPS en frio

TinyGPSPlus   gps;
HardwareSerial gpsSerial(2);

unsigned long siguienteEnvioMs = 0;
unsigned long inicioValidacionMs = 0;
bool loraDisponible = false;
bool gpsUartConfirmado = false;
bool gpsNmeaConfirmado = false;
bool gpsFixConfirmado = false;
bool gpsAvisoSinDatos = false;
bool gpsAvisoSinNmea = false;
bool gpsAvisoSinFix = false;

void validarGps() {
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
    Serial.printf("[CHECK] GPS_FIX_OK: lat=%.6f lon=%.6f\n",
                  gps.location.lat(), gps.location.lng());
    gpsFixConfirmado = true;
  } else if (!fixActual && gpsFixConfirmado) {
    Serial.println("[CHECK] GPS_FIX_PERDIDO: esperando recuperar senal GPS");
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
}

bool enviarPaquete() {
  if (!loraDisponible) return false;

  char payload[64];
  bool fixValido = gps.location.isValid() && gps.location.age() < 3000;
  double lat = fixValido ? gps.location.lat() : 0.0;
  double lon = fixValido ? gps.location.lng() : 0.0;

  // ID,orden,fix,lat,lon
  snprintf(payload, sizeof(payload), "%s,%u,%u,%.6f,%.6f",
           NODE_ID,
           (unsigned)NODE_ORDER,
           fixValido ? 1u : 0u,
           lat,
           lon);

  if (LoRa.beginPacket() == 0) {
    Serial.println("[TX] ERROR:BEGIN_PACKET");
    return false;
  }
  LoRa.print(payload);
  const bool transmitido = LoRa.endPacket() == 1;
  Serial.printf("[TX] %s %s\n", transmitido ? "OK" : "ERROR", payload);
  return transmitido;
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("[CHECK] Inicio de validacion GPS y LoRa");

  // GPS (buffer ampliado para no perder datos mientras LoRa transmite)
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
    LoRa.setTxPower(LORA_TX_POWER);
    LoRa.enableCrc();
    Serial.println("[CHECK] LORA_MODULO_OK: radio detectada; se validara cada transmision");
  }

  const unsigned long retrasoInicial =
      NODE_ORDER > 2 ? (unsigned long)(NODE_ORDER - 2) * SLOT_NODO_MS : 0;
  inicioValidacionMs = millis();
  siguienteEnvioMs = millis() + retrasoInicial;
}

void loop() {
  // Alimentar el parser NMEA continuamente
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  validarGps();

  if (loraDisponible && (int32_t)(millis() - siguienteEnvioMs) >= 0) {
    enviarPaquete();
    siguienteEnvioMs += INTERVALO_MS;
    while ((int32_t)(millis() - siguienteEnvioMs) >= 0) {
      siguienteEnvioMs += INTERVALO_MS;
    }
  }
}
