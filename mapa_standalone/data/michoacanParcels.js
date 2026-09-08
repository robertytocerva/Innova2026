export const michoacanParcels = {
  type: 'FeatureCollection',
  features: [
    // 6 'clean' parcels
    {
      type: 'Feature',
      id: 'MCH-001',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-102.0628, 19.4208],
          [-102.0618, 19.4208],
          [-102.0618, 19.4198],
          [-102.0628, 19.4198],
          [-102.0628, 19.4208]
        ]]
      },
      properties: {
        id: 'MCH-001',
        propietario: 'Juan Pérez López',
        municipio: 'Uruapan',
        superficieHa: 10.5,
        cultivo: 'Aguacate Hass',
        fechaAlta: '2023-05-15',
        exportacion: 'aprobada',
        deforestacionDetectada: false,
        historialDeforestacion: [],
        geometryIssues: [],
        subdivisionBloqueada: false,
        parentId: null,
        ndviPromedio: 0.85,
        ultimaRevision: '2026-08-15',
        confianzaIA: 98.2
      }
    },
    {
      type: 'Feature',
      id: 'MCH-002',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-102.3639, 19.3367],
          [-102.3609, 19.3367],
          [-102.3609, 19.3337],
          [-102.3639, 19.3337],
          [-102.3639, 19.3367]
        ]]
      },
      properties: {
        id: 'MCH-002',
        propietario: 'María González',
        municipio: 'Tancítaro',
        superficieHa: 45.0,
        cultivo: 'Aguacate Hass',
        fechaAlta: '2021-11-10',
        exportacion: 'aprobada',
        deforestacionDetectada: false,
        historialDeforestacion: [],
        geometryIssues: [],
        subdivisionBloqueada: false,
        parentId: null,
        ndviPromedio: 0.90,
        ultimaRevision: '2026-08-20',
        confianzaIA: 99.1
      }
    },
    {
      type: 'Feature',
      id: 'MCH-003',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-102.4167, 19.5167],
          [-102.4147, 19.5177],
          [-102.4137, 19.5147],
          [-102.4167, 19.5137],
          [-102.4167, 19.5167]
        ]]
      },
      properties: {
        id: 'MCH-003',
        propietario: 'Hacienda El Paricutín S.A.',
        municipio: 'Peribán',
        superficieHa: 22.3,
        cultivo: 'Aguacate Hass',
        fechaAlta: '2020-02-14',
        exportacion: 'aprobada',
        deforestacionDetectada: false,
        historialDeforestacion: [],
        geometryIssues: [],
        subdivisionBloqueada: false,
        parentId: null,
        ndviPromedio: 0.82,
        ultimaRevision: '2026-07-30',
        confianzaIA: 96.5
      }
    },
    {
      type: 'Feature',
      id: 'MCH-004',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-102.4833, 19.5933],
          [-102.4813, 19.5933],
          [-102.4813, 19.5913],
          [-102.4843, 19.5913],
          [-102.4833, 19.5933]
        ]]
      },
      properties: {
        id: 'MCH-004',
        propietario: 'Carlos Ruiz',
        municipio: 'Los Reyes',
        superficieHa: 15.0,
        cultivo: 'Aguacate Hass',
        fechaAlta: '2019-09-05',
        exportacion: 'aprobada',
        deforestacionDetectada: false,
        historialDeforestacion: [],
        geometryIssues: [],
        subdivisionBloqueada: false,
        parentId: null,
        ndviPromedio: 0.79,
        ultimaRevision: '2026-08-05',
        confianzaIA: 97.0
      }
    },
    {
      type: 'Feature',
      id: 'MCH-005',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-102.1333, 19.4167],
          [-102.1313, 19.4187],
          [-102.1293, 19.4167],
          [-102.1313, 19.4147],
          [-102.1333, 19.4167]
        ]]
      },
      properties: {
        id: 'MCH-005',
        propietario: 'Roberto Gómez',
        municipio: 'Nuevo Parangaricutiro',
        superficieHa: 18.5,
        cultivo: 'Aguacate + Bosque mixto',
        fechaAlta: '2022-01-20',
        exportacion: 'aprobada',
        deforestacionDetectada: false,
        historialDeforestacion: [],
        geometryIssues: [],
        subdivisionBloqueada: false,
        parentId: null,
        ndviPromedio: 0.88,
        ultimaRevision: '2026-08-10',
        confianzaIA: 94.5
      }
    },
    {
      type: 'Feature',
      id: 'MCH-006',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-101.7667, 19.4000],
          [-101.7647, 19.4000],
          [-101.7647, 19.3980],
          [-101.7667, 19.3980],
          [-101.7667, 19.4000]
        ]]
      },
      properties: {
        id: 'MCH-006',
        propietario: 'Laura Sánchez',
        municipio: 'Salvador Escalante',
        superficieHa: 12.0,
        cultivo: 'Aguacate Hass',
        fechaAlta: '2024-03-12',
        exportacion: 'aprobada',
        deforestacionDetectada: false,
        historialDeforestacion: [],
        geometryIssues: [],
        subdivisionBloqueada: false,
        parentId: null,
        ndviPromedio: 0.81,
        ultimaRevision: '2026-08-25',
        confianzaIA: 95.8
      }
    },

    // 3 parcels with deforestation alerts
    {
      type: 'Feature',
      id: 'MCH-007',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-102.3539, 19.3467],
          [-102.3439, 19.3467],
          [-102.3439, 19.3367],
          [-102.3539, 19.3367],
          [-102.3539, 19.3467]
        ]]
      },
      properties: {
        id: 'MCH-007',
        propietario: 'Agrícola San Juan',
        municipio: 'Tancítaro',
        superficieHa: 80.0,
        cultivo: 'Aguacate Hass',
        fechaAlta: '2025-01-10',
        exportacion: 'bloqueada',
        deforestacionDetectada: true,
        historialDeforestacion: [
          { fecha: '2024-11-15', areaHa: 25.0, tipo: 'Tala rasa', fuente: 'Sentinel-2' }
        ],
        geometryIssues: [],
        subdivisionBloqueada: false,
        parentId: null,
        ndviPromedio: 0.45,
        ultimaRevision: '2026-09-01',
        confianzaIA: 99.5
      }
    },
    {
      type: 'Feature',
      id: 'MCH-008',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-102.4267, 19.5267],
          [-102.4247, 19.5287],
          [-102.4227, 19.5267],
          [-102.4247, 19.5247],
          [-102.4267, 19.5267]
        ]]
      },
      properties: {
        id: 'MCH-008',
        propietario: 'José Ramírez',
        municipio: 'Peribán',
        superficieHa: 30.0,
        cultivo: 'Aguacate Hass',
        fechaAlta: '2023-08-20',
        exportacion: 'bloqueada',
        deforestacionDetectada: true,
        historialDeforestacion: [
          { fecha: '2025-04-10', areaHa: 12.5, tipo: 'Deforestación gradual', fuente: 'Landsat-9' }
        ],
        geometryIssues: [],
        subdivisionBloqueada: false,
        parentId: null,
        ndviPromedio: 0.55,
        ultimaRevision: '2026-08-28',
        confianzaIA: 92.3
      }
    },
    {
      type: 'Feature',
      id: 'MCH-009',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-102.0728, 19.4308],
          [-102.0708, 19.4308],
          [-102.0708, 19.4288],
          [-102.0728, 19.4288],
          [-102.0728, 19.4308]
        ]]
      },
      properties: {
        id: 'MCH-009',
        propietario: 'Empacadora del Sur',
        municipio: 'Uruapan',
        superficieHa: 20.0,
        cultivo: 'Aguacate Hass',
        fechaAlta: '2022-12-05',
        exportacion: 'bloqueada',
        deforestacionDetectada: true,
        historialDeforestacion: [
          { fecha: '2023-10-22', areaHa: 8.0, tipo: 'Tala rasa', fuente: 'Sentinel-2' },
          { fecha: '2024-02-18', areaHa: 5.0, tipo: 'Deforestación gradual', fuente: 'GLAD/RADD' }
        ],
        geometryIssues: [],
        subdivisionBloqueada: false,
        parentId: null,
        ndviPromedio: 0.60,
        ultimaRevision: '2026-09-02',
        confianzaIA: 97.8
      }
    },

    // 2 parcels with dirty geometry issues
    {
      type: 'Feature',
      id: 'MCH-010',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-102.4933, 19.6033],
          [-102.4903, 19.6003],
          [-102.4933, 19.5983],
          [-102.4903, 19.6033], // Self-intersecting pattern
          [-102.4933, 19.6033]
        ]]
      },
      properties: {
        id: 'MCH-010',
        propietario: 'Pedro Martínez',
        municipio: 'Los Reyes',
        superficieHa: 18.2,
        cultivo: 'Aguacate Hass',
        fechaAlta: '2024-06-15',
        exportacion: 'en_revision',
        deforestacionDetectada: false,
        historialDeforestacion: [],
        geometryIssues: [
          { tipo: 'auto_interseccion', descripcion: 'El polígono se cruza a sí mismo en los vértices 2 y 4.', severidad: 'alta' }
        ],
        subdivisionBloqueada: false,
        parentId: null,
        ndviPromedio: 0.75,
        ultimaRevision: '2026-09-05',
        confianzaIA: 85.0
      }
    },
    {
      type: 'Feature',
      id: 'MCH-011',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-102.1433, 19.4267],
          [-102.1423, 19.4267],
          [-102.1433, 19.4257],
          [-102.1423, 19.4247],
          [-102.1433, 19.4267]
        ]]
      },
      properties: {
        id: 'MCH-011',
        propietario: 'Familia Vargas',
        municipio: 'Nuevo Parangaricutiro',
        superficieHa: 5.5,
        cultivo: 'Aguacate + Bosque mixto',
        fechaAlta: '2025-02-28',
        exportacion: 'en_revision',
        deforestacionDetectada: false,
        historialDeforestacion: [],
        geometryIssues: [
          { tipo: 'area_minima', descripcion: 'La forma es demasiado irregular y podría ser un error de digitalización.', severidad: 'media' },
          { tipo: 'traslape', descripcion: 'Traslape detectado con parcela colindante MCH-005', severidad: 'alta' }
        ],
        subdivisionBloqueada: false,
        parentId: null,
        ndviPromedio: 0.80,
        ultimaRevision: '2026-09-06',
        confianzaIA: 88.5
      }
    },

    // 2 parcels where subdivision was attempted and BLOCKED
    {
      type: 'Feature',
      id: 'MCH-012',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-102.3539, 19.3467],
          [-102.3489, 19.3467],
          [-102.3489, 19.3417],
          [-102.3539, 19.3417],
          [-102.3539, 19.3467]
        ]]
      },
      properties: {
        id: 'MCH-012',
        propietario: 'Agrícola San Juan (Subdivisión A)',
        municipio: 'Tancítaro',
        superficieHa: 40.0,
        cultivo: 'Aguacate Hass',
        fechaAlta: '2026-01-15',
        exportacion: 'bloqueada',
        deforestacionDetectada: true,
        historialDeforestacion: [
          { fecha: '2024-11-15', areaHa: 12.5, tipo: 'Tala rasa', fuente: 'Sentinel-2' }
        ],
        geometryIssues: [],
        subdivisionBloqueada: true,
        parentId: 'MCH-007',
        ndviPromedio: 0.46,
        ultimaRevision: '2026-09-07',
        confianzaIA: 99.1
      }
    },
    {
      type: 'Feature',
      id: 'MCH-013',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-102.0728, 19.4308],
          [-102.0718, 19.4308],
          [-102.0718, 19.4298],
          [-102.0728, 19.4298],
          [-102.0728, 19.4308]
        ]]
      },
      properties: {
        id: 'MCH-013',
        propietario: 'Empacadora del Sur (Fracción 1)',
        municipio: 'Uruapan',
        superficieHa: 10.0,
        cultivo: 'Aguacate Hass',
        fechaAlta: '2026-03-20',
        exportacion: 'bloqueada',
        deforestacionDetectada: true,
        historialDeforestacion: [
          { fecha: '2023-10-22', areaHa: 8.0, tipo: 'Tala rasa', fuente: 'Sentinel-2' }
        ],
        geometryIssues: [],
        subdivisionBloqueada: true,
        parentId: 'MCH-009',
        ndviPromedio: 0.61,
        ultimaRevision: '2026-09-07',
        confianzaIA: 98.4
      }
    },

    // 2 parcels currently under review
    {
      type: 'Feature',
      id: 'MCH-014',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-101.7767, 19.4100],
          [-101.7747, 19.4100],
          [-101.7747, 19.4080],
          [-101.7767, 19.4080],
          [-101.7767, 19.4100]
        ]]
      },
      properties: {
        id: 'MCH-014',
        propietario: 'Finca Los Pinos',
        municipio: 'Salvador Escalante',
        superficieHa: 25.4,
        cultivo: 'Aguacate Hass',
        fechaAlta: '2025-11-05',
        exportacion: 'en_revision',
        deforestacionDetectada: false,
        historialDeforestacion: [],
        geometryIssues: [],
        subdivisionBloqueada: false,
        parentId: null,
        ndviPromedio: 0.72,
        ultimaRevision: '2026-09-08',
        confianzaIA: 60.5
      }
    },
    {
      type: 'Feature',
      id: 'MCH-015',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-102.4367, 19.5367],
          [-102.4347, 19.5387],
          [-102.4327, 19.5367],
          [-102.4347, 19.5347],
          [-102.4367, 19.5367]
        ]]
      },
      properties: {
        id: 'MCH-015',
        propietario: 'Huerta La Esperanza',
        municipio: 'Peribán',
        superficieHa: 14.8,
        cultivo: 'Aguacate + Bosque mixto',
        fechaAlta: '2024-09-12',
        exportacion: 'en_revision',
        deforestacionDetectada: false,
        historialDeforestacion: [],
        geometryIssues: [],
        subdivisionBloqueada: false,
        parentId: null,
        ndviPromedio: 0.68,
        ultimaRevision: '2026-09-08',
        confianzaIA: 55.2
      }
    }
  ]
};

export const municipios = ['Uruapan', 'Tancítaro', 'Peribán', 'Los Reyes', 'Nuevo Parangaricutiro', 'Salvador Escalante'];
export const estadosExportacion = ['aprobada', 'bloqueada', 'en_revision'];
