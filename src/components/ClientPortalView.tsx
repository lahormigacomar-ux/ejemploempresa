import React from 'react';
import { Globe, Truck, CheckCircle, Receipt, FlaskConical } from 'lucide-react';
import { Pedido, Factura } from '../types';

interface ClientPortalViewProps {
  pedidos: Pedido[];
  facturas: Factura[];
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({ pedidos, facturas }) => {
  const clientePedidos = pedidos.filter(p => p.clienteId === 'cli-1');
  const clienteFacturas = facturas.filter(f => f.clienteId === 'cli-1');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-amber-950/40 border border-amber-500/30 rounded-xl p-6 text-white shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded-full">PORTAL EXCLUSIVO CLIENTES</span>
          <h2 className="text-2xl font-extrabold mt-2">Constructora Austral S.A.</h2>
          <p className="text-xs text-slate-300 mt-1">Acceso en tiempo real a sus obras, seguimiento de mixers en ruta, remitos y certificados de laboratorio.</p>
        </div>
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-right">
          <span className="text-xs text-slate-400">Cuenta Corriente Disponible:</span>
          <div className="text-xl font-bold text-emerald-400">$32,600,000</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Orders & Live Tracking */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400" /> Pedidos Activos & Seguimiento en Ruta
          </h3>
          <div className="space-y-3">
            {clientePedidos.map((p) => (
              <div key={p.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-amber-400 font-bold">{p.codigo}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {p.estado.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  <div><strong>Obra:</strong> {p.obraId}</div>
                  <div><strong>Producto:</strong> {p.productoId} ({p.cantidadM3} m³)</div>
                  <div><strong>Programado:</strong> {p.fechaProgramada} a las {p.horario} hs</div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Mixer en camino (ETA 14 min)
                  </span>
                  <span className="underline cursor-pointer text-amber-400">Ver Mapa GPS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoices & Lab Reports */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" /> Facturas & Certificados de Calidad
          </h3>
          <div className="space-y-3">
            {clienteFacturas.map((fac) => (
              <div key={fac.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
                <div>
                  <div className="font-mono font-bold text-white">{fac.nroFactura}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Vencimiento: {fac.vencimiento}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-400">${fac.total.toLocaleString()}</div>
                  <span className="text-[10px] text-emerald-400">Descargar PDF</span>
                </div>
              </div>
            ))}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-purple-400" /> Certificado Probetas 28 Días (H30)
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">Muestra MUE-2026-981 (Resistencia: 27.4 MPa)</div>
              </div>
              <span className="text-xs text-amber-400 underline cursor-pointer">Descargar PDF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
