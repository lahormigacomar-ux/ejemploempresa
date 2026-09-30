import React from 'react';
import { Receipt, DollarSign, ShieldCheck } from 'lucide-react';
import { Factura, Cliente } from '../types';

interface FinanceViewProps {
  facturas: Factura[];
  clientes: Cliente[];
}

export const FinanceView: React.FC<FinanceViewProps> = ({ facturas, clientes }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Facturación Electrónica (ARCA), Cuenta Corriente & Tesorería</h2>
          <p className="text-xs text-slate-400">Emisión de facturas vinculadas a remitos, gestión de cobranzas y control de créditos de clientes</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> WebService ARCA Homologado
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" /> Facturas Emitidas Recientes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Nro Factura</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Vencimiento</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3">IVA (21%)</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {facturas.map((fac) => (
                  <tr key={fac.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-amber-400">{fac.nroFactura}</td>
                    <td className="p-3">{fac.fecha}</td>
                    <td className="p-3">{fac.vencimiento}</td>
                    <td className="p-3">${fac.subtotal.toLocaleString()}</td>
                    <td className="p-3">${fac.iva.toLocaleString()}</td>
                    <td className="p-3 font-bold text-white">${fac.total.toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {fac.estado.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" /> Cuentas Corrientes & Créditos
          </h3>
          <div className="space-y-3">
            {clientes.map((cli) => (
              <div key={cli.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                <div className="font-bold text-white">{cli.razonSocial}</div>
                <div className="mt-2 flex justify-between">
                  <span className="text-slate-400">Saldo Deudor:</span>
                  <span className="font-bold text-amber-400">${cli.saldoActual.toLocaleString()}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-slate-400">Límite Crédito:</span>
                  <span className="text-emerald-400">${cli.limiteCredito.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
