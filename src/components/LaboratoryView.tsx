import React from 'react';
import { FlaskConical, CheckCircle, AlertCircle } from 'lucide-react';
import { ProbetaLab } from '../types';

interface LaboratoryViewProps {
  probetas: ProbetaLab[];
}

export const LaboratoryView: React.FC<LaboratoryViewProps> = ({ probetas }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Laboratorio de Control de Calidad & Probetas</h2>
          <p className="text-xs text-slate-400">Seguimiento de roturas a 7, 14 y 28 días, curvas de resistencia y certificados automáticos para clientes</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition shadow-md flex items-center gap-2">
          + Registrar Nueva Muestra
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-amber-400" /> Registro de Probetas & Ensayos de Compresión
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-3">Código Muestra</th>
                <th className="p-3">Fecha Moldeo</th>
                <th className="p-3">Edad Destino</th>
                <th className="p-3">Rotura Prevista</th>
                <th className="p-3">Resistencia Esperada</th>
                <th className="p-3">Resistencia Real</th>
                <th className="p-3">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {probetas.map((prob) => (
                <tr key={prob.id} className="hover:bg-slate-800/50">
                  <td className="p-3 font-mono font-bold text-amber-400">{prob.codigoMuestra}</td>
                  <td className="p-3">{prob.fechaMoldeo}</td>
                  <td className="p-3 font-semibold text-white">{prob.edadDiasDestino} Días</td>
                  <td className="p-3">{prob.fechaRoturaPrevista}</td>
                  <td className="p-3">{prob.resistenciaEsperadaMpa} MPa</td>
                  <td className="p-3 font-bold text-emerald-400">{prob.resistenciaRealMpa ? `${prob.resistenciaRealMpa} MPa` : 'Pendiente'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                      prob.estado === 'pendiente' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {prob.estado === 'rota' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {prob.resultado.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
