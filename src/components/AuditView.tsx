import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export const AuditView: React.FC = () => {
  const auditLogs = [
    { id: 1, fecha: '2026-10-01 10:15', usuario: 'marcos.diaz (Operador)', accion: 'MODIFICACION_FORMULA', detalle: 'Actualización dosificación aditivo lote H30' },
    { id: 2, fecha: '2026-10-01 09:40', usuario: 'ana.martinez (Laboratorio)', accion: 'CARGA_RESULTADO_PROBETA', detalle: 'Ingreso rotura 28 días muestra MUE-2026-981 (27.4 MPa)' },
    { id: 3, fecha: '2026-10-01 08:20', usuario: 'carlos.gomez (Dispatcher)', accion: 'APROBACION_CREDITO', detalle: 'Excepción de crédito autorizada para cliente Constructora Austral' },
    { id: 4, fecha: '2026-09-30 18:00', usuario: 'roberto.sanchez (Taller)', accion: 'CIERRE_OT', detalle: 'Cierre OT-101 equipo MIX-12' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Auditoría de Operaciones Críticas & Trazabilidad</h2>
          <p className="text-xs text-slate-400">Registro inalterable de acciones de usuarios, modificaciones de precios, costos, stock y anulaciones</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" /> Historial de Eventos del Sistema
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Usuario / Rol</th>
                <th className="p-3">Acción del Sistema</th>
                <th className="p-3">Detalle de la Operación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50">
                  <td className="p-3 font-mono text-slate-400">{log.fecha}</td>
                  <td className="p-3 font-medium text-white">{log.usuario}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {log.accion}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{log.detalle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
