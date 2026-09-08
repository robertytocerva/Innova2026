# Visor y Mapa Satelital de Michoacán (Paquete Independiente)

Este directorio contiene **todo lo necesario** para ejecutar y desplegar el mapa interactivo de polígonos de la franja aguacatera de Michoacán (Tancítaro, Uruapan, Peribán, Los Reyes, Nuevo Parangaricutiro, Salvador Escalante) de forma 100% independiente, sin requerir Node.js ni pasos de compilación.

---

## 🚀 Cómo Ejecutarlo Inmediatamente

Tienes dos formas directas de usarlo:

### Opción 1: Abrir directamente en el navegador
1. Haz doble clic en el archivo `index.html`.
2. Se abrirá en tu navegador (Chrome, Edge, Firefox) con el mapa Leaflet, los polígonos, el tooltips con coordenadas y todas las funciones activas.

### Opción 2: Con cualquier servidor local
Si prefieres servirlo mediante HTTP:
```bash
# Con Python
python -m http.server 8080

# O con npx
npx serve .
```
Luego abre `http://localhost:8080` en tu navegador.

---

## 📁 Estructura del Paquete

```
mapa_standalone/
├── index.html                   # Aplicación web completa lista para usar
├── README.md                    # Esta guía de uso y documentación
├── data/
│   ├── michoacanParcels.geojson # Polígonos simulados en formato GeoJSON estándar (WGS 84)
│   ├── michoacanParcels.js      # Módulo JS con los polígonos y metadatos
│   ├── alertasMichoacan.json    # Alertas satelitales en formato JSON
│   └── alertasMichoacan.js      # Módulo JS con las alertas
└── js/
    ├── geometryValidator.js     # Motor de validación geométrica con Turf.js
    └── subdivisionBlocker.js    # Regla de negocio: Anti-Subdivisión fraudulenta
```

---

## 🥑 Funcionalidades Incluidas

1. **Tooltip con Coordenadas Reales**:
   - Al pasar el cursor sobre cualquier polígono, se muestra el `ID`, `Municipio` y una tabla completa con cada uno de los vértices (`P1, P2, P3...`) indicando **Latitud** y **Longitud** en formato WGS 84 (`19.XXXXXX°N, -102.XXXXXX°W`).
2. **Capas Cartográficas**:
   - Botón para alternar entre **Mapa Vectorial** (OpenStreetMap) y **Vista Satelital de Alta Resolución** (Esri World Imagery).
3. **Ficha y Auditoría del Predio (Drawer lateral)**:
   - Al hacer clic en cualquier polígono, se abre el panel lateral con la ficha del propietario, superficie (ha), cultivo, índice NDVI satelital y nivel de confianza.
   - Historial detallado de eventos de deforestación detectados por Sentinel-2 / Landsat-9.
   - Diagnóstico topológico de la geometría (detección de traslapes o auto-intersecciones).
4. **Regla de Negocio Anti-Subdivisión (Simulador)**:
   - Botón *"Simular Intento de Subdivisión"*: si el predio seleccionado tiene historial de deforestación, el sistema **bloquea la subdivisión de forma inmutable**, explicando la norma que impide fragmentar huertas castigadas para exportar fracciones "limpias".
5. **Asistente IA Forestal**:
   - Chatbot flotante en la esquina inferior derecha para hacer consultas sobre predios específicos, alertas activas y reglas de exportación.

---

## 🗺️ Compatibilidad con GIS

El archivo `data/michoacanParcels.geojson` puede importarse directamente en:
- **QGIS** (Capa > Añadir Capa > Añadir Capa Vectorial)
- **ArcGIS Pro**
- **Google Earth Pro**
- **Mapbox / Kepler.gl**
