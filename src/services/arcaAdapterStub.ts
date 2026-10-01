/**
 * ADAPTADOR ARCA / LIBRO DE SUELDOS DIGITAL (RG AFIP 3781) - STUB EXPLÍCITO
 * 
 * Estado: PENDIENTE_IMPLEMENTACION
 * Nota arquitectónica:
 * La lógica salarial y de liquidación del ERP opera de forma 100% desacoplada.
 * Este adaptador se conectará con los servicios de ARCA (F.931 y Libro de Sueldos Digital)
 * una vez que se homologuen los certificados fiscales en el ambiente de producción.
 */

export interface ARCAExportConceptMapping {
  codigoInternoERP: string;
  codigoConceptoAFIP: string;
  tipoConceptoAFIP: '1' | '2' | '3'; // 1: Remun, 2: No Remun, 3: Retención
  descripcionAFIP: string;
}

export const ARCA_CONCEPT_MAPPINGS: ARCAExportConceptMapping[] = [
  { codigoInternoERP: '1001', codigoConceptoAFIP: '110000', tipoConceptoAFIP: '1', descripcionAFIP: 'Sueldo Básico' },
  { codigoInternoERP: '1005', codigoConceptoAFIP: '120000', tipoConceptoAFIP: '1', descripcionAFIP: 'Antigüedad' },
  { codigoInternoERP: '1020', codigoConceptoAFIP: '130000', tipoConceptoAFIP: '1', descripcionAFIP: 'Horas Extras 50%' },
  { codigoInternoERP: '2001', codigoConceptoAFIP: '210000', tipoConceptoAFIP: '2', descripcionAFIP: 'Viáticos No Remunerativos' },
  { codigoInternoERP: '3001', codigoConceptoAFIP: '810000', tipoConceptoAFIP: '3', descripcionAFIP: 'Jubilación Ley 24.241' },
  { codigoInternoERP: '3002', codigoConceptoAFIP: '810001', tipoConceptoAFIP: '3', descripcionAFIP: 'Ley 19.032 - INSSJP' },
  { codigoInternoERP: '3003', codigoConceptoAFIP: '810002', tipoConceptoAFIP: '3', descripcionAFIP: 'Obra Social' },
  { codigoInternoERP: '3010', codigoConceptoAFIP: '820000', tipoConceptoAFIP: '3', descripcionAFIP: 'Cuota Sindical Gremial' }
];

export interface ARCAExportResult {
  periodo: string;
  estado: 'PENDIENTE_IMPLEMENTACION' | 'HOMOLOGADO_STUB';
  mensaje: string;
  conceptosMapeados: number;
}

export function exportarLibroSueldosDigitalStub(periodo: string): ARCAExportResult {
  return {
    periodo,
    estado: 'PENDIENTE_IMPLEMENTACION',
    mensaje: 'Estructura de conceptos mapeada para RG AFIP 3781. Conexión y generación de archivo TXT en desarrollo para fase fiscal.',
    conceptosMapeados: ARCA_CONCEPT_MAPPINGS.length
  };
}
