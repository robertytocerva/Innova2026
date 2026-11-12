# Puente serial ESP32

Este servicio local lee el puerto USB de la ESP32 maestra a 115200 baudios, publica el estado en `http://127.0.0.1:8765/api/latest` y envia las posiciones al backend para guardarlas en PostGIS.

## Instalacion y uso en Windows

1. Cierra el Monitor Serial de Arduino: el puerto COM solo puede estar abierto por un proceso a la vez.
2. Desde la raiz del proyecto, crea el entorno e instala la dependencia:

   ```powershell
   cd serial_bridge
   py -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

3. Lista los puertos para identificar el COM de la maestra:

   ```powershell
   .\.venv\Scripts\python.exe serial_bridge.py --list-ports
   ```

   Sustituye `COM5` por el puerto que aparezca en tu equipo. Si solo hay un puerto serie, se puede omitir `--port`.

4. En `back/.env`, configura `DATABASE_URL` y un `SENSOR_INGEST_TOKEN` aleatorio de al menos 32 caracteres. Inicia el backend en su propia terminal:

   ```powershell
   cd back
   npm run dev
   ```

5. Desde `serial_bridge/`, inicia el puente en otra terminal con el mismo token:

   ```powershell
   $env:SENSOR_INGEST_TOKEN = "<el mismo secreto configurado en back/.env>"
   $env:SENSOR_INGEST_URL = "http://127.0.0.1:3000/api/v1/sensor-points/ingest"
   .\.venv\Scripts\python.exe serial_bridge.py --port COM5
   ```

   Para usar el backend de Render, cambia `SENSOR_INGEST_URL` a `https://innova2026.onrender.com/api/v1/sensor-points/ingest` y configura el mismo token en Render. No pongas el token en el frontend.

6. En otra terminal, desde `front/`, inicia Astro en segundo plano y abre `/mapa-interactivo`:

   ```powershell
   $env:PUBLIC_API_URL = "http://127.0.0.1:3000/api/v1"
   npx astro dev --background
   ```

   Si usas el backend de Render, omite `PUBLIC_API_URL` o configúralo con la URL desplegada.

La pagina consulta el puente cada segundo. Desde la consola del navegador puedes inspeccionar el ultimo estado con:

```js
window.__INNOVA_SERIAL_STATE__
```

El estado incluye `latest.vertices`, las lineas `[CHECK]`/`DATA:`, `serialConnected` e `ingestEnabled`/`ingestError`. La pagina consulta la base de datos para dibujar los puntos, asi que una lectura local no se muestra como guardada si la ingesta falla. El servicio solo escucha en `127.0.0.1`; no lo expongas directamente a Internet.
