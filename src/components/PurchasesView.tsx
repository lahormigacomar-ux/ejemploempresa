import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Building2,
  FileText,
  Truck,
  Receipt,
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  PackageCheck,
  Ban,
  Clock,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import {
  Proveedor,
  SolicitudCompra,
  CotizacionProveedor,
  OrdenCompra,
  RecepcionCompra,
  FacturaProveedor,
  PrioridadSolicitud,
  TipoItemCompra,
  TipoComprobanteProveedor
} from '../types';
import { supplierRepository } from '../repositories/supplierRepository';
import { purchaseRequestRepository } from '../repositories/purchaseRequestRepository';
import { purchaseQuotationRepository } from '../repositories/purchaseQuotationRepository';
import { purchaseOrderRepository } from '../repositories/purchaseOrderRepository';
import { purchaseReceiptRepository } from '../repositories/purchaseReceiptRepository';
import { supplierInvoiceRepository } from '../repositories/supplierInvoiceRepository';
import { employeeRepository } from '../repositories/employeeRepository';
import { supplierService } from '../services/supplierService';
import { purchaseRequestService } from '../services/purchaseRequestService';
import { purchaseQuotationService } from '../services/purchaseQuotationService';
import { purchaseOrderService } from '../services/purchaseOrderService';
import { purchaseReceiptService } from '../services/purchaseReceiptService';
import { supplierInvoiceService } from '../services/supplierInvoiceService';
import { purchaseMatchingService } from '../services/purchaseMatchingService';

export const PurchasesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'requests' | 'quotations' | 'orders' | 'receipts' | 'invoices' | 'suppliers'
  >('orders');

  const [suppliers, setSuppliers] = useState<Proveedor[]>([]);
  const [requests, setRequests] = useState<SolicitudCompra[]>([]);
  const [quotations, setQuotations] = useState<CotizacionProveedor[]>([]);
  const [orders, setOrders] = useState<OrdenCompra[]>([]);
  const [receipts, setReceipts] = useState<RecepcionCompra[]>([]);
  const [invoices, setInvoices] = useState<FacturaProveedor[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');

  // Modales
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [matchingResult, setMatchingResult] = useState<any>(null);

  // Form Solicitud
  const [reqSector, setReqSector] = useState('PLANTA_HORMIGON');
  const [reqSolicitante, setReqSolicitante] = useState('emp-1');
  const [reqPrioridad, setReqPrioridad] = useState<PrioridadSolicitud>('NORMAL');
  const [reqMotivo, setReqMotivo] = useState('');
  const [reqItemDesc, setReqItemDesc] = useState('');
  const [reqItemCant, setReqItemCant] = useState<number>(1);
  const [reqItemUnidad, setReqItemUnidad] = useState('UNIDAD');
  const [reqError, setReqError] = useState<string | null>(null);

  // Form Orden de Compra
  const [ordProveedorId, setOrdProveedorId] = useState('');
  const [ordSolicitudId, setOrdSolicitudId] = useState('');
  const [ordItemDesc, setOrdItemDesc] = useState('');
  const [ordItemCant, setOrdItemCant] = useState<number>(1);
  const [ordItemPrecio, setOrdItemPrecio] = useState<number>(10000);
  const [ordError, setOrdError] = useState<string | null>(null);

  // Form Recepción
  const [recOrdenId, setRecOrdenId] = useState('');
  const [recRemito, setRecRemito] = useState('');
  const [recCant, setRecCant] = useState<number>(1);
  const [recError, setRecError] = useState<string | null>(null);

  // Form Factura
  const [facProveedorId, setFacProveedorId] = useState('');
  const [facTipo, setFacTipo] = useState<TipoComprobanteProveedor>('FACTURA_A');
  const [facPV, setFacPV] = useState<number>(1);
  const [facNum, setFacNum] = useState<number>(1001);
  const [facNeto, setFacNeto] = useState<number>(100000);
  const [facIva, setFacIva] = useState<number>(21000);
  const [facTotal, setFacTotal] = useState<number>(121000);
  const [facOrdenId, setFacOrdenId] = useState('');
  const [facError, setFacError] = useState<string | null>(null);

  const loadData = async () => {
    const [allSuppliers, allRequests, allQuotations, allOrders, allReceipts, allInvoices, allEmployees] =
      await Promise.all([
        supplierRepository.getAll(),
        purchaseRequestRepository.getAll(),
        purchaseQuotationRepository.getAll(),
        purchaseOrderRepository.getAll(),
        purchaseReceiptRepository.getAll(),
        supplierInvoiceRepository.getAll(),
        employeeRepository.getAll()
      ]);

    setSuppliers(allSuppliers);
    setRequests(allRequests);
    setQuotations(allQuotations);
    setOrders(allOrders);
    setReceipts(allReceipts);
    setInvoices(allInvoices);
    setEmployees(allEmployees);

    if (allSuppliers.length > 0) {
      setOrdProveedorId(allSuppliers[0].id);
      setFacProveedorId(allSuppliers[0].id);
    }
    if (allOrders.length > 0) {
      setRecOrdenId(allOrders[0].id);
      setFacOrdenId(allOrders[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // KPIs
  const solPendientes = requests.filter(r => r.estado === 'PENDIENTE_APROBACION').length;
  const ocEnCurso = orders.filter(o => o.estado === 'EMITIDA' || o.estado === 'PARCIALMENTE_RECIBIDA').length;
  const totalComprasMonto = orders.reduce((sum, o) => sum + (o.estado !== 'CANCELADA' ? o.total : 0), 0);
  const recepcionesConfirmadas = receipts.filter(r => r.estado === 'CONFIRMADA').length;
  const facturasRegistradas = invoices.filter(f => f.estado === 'REGISTRADA').length;

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError(null);
    try {
      await purchaseRequestService.createRequest({
        solicitanteEmpleadoId: reqSolicitante,
        sector: reqSector,
        prioridad: reqPrioridad,
        motivo: reqMotivo,
        items: [
          {
            tipo: 'ARTICULO',
            descripcion: reqItemDesc,
            cantidad: Number(reqItemCant),
            unidadMedida: reqItemUnidad
          }
        ]
      });
      setShowRequestModal(false);
      setReqMotivo('');
      setReqItemDesc('');
      await loadData();
    } catch (err: any) {
      setReqError(err.message || 'Error al crear solicitud');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrdError(null);
    try {
      await purchaseOrderService.createOrder({
        proveedorId: ordProveedorId,
        solicitudCompraId: ordSolicitudId || undefined,
        items: [
          {
            descripcion: ordItemDesc,
            cantidad: Number(ordItemCant),
            unidadMedida: 'UNIDAD',
            precioUnitario: Number(ordItemPrecio)
          }
        ]
      });
      setShowOrderModal(false);
      setOrdItemDesc('');
      await loadData();
    } catch (err: any) {
      setOrdError(err.message || 'Error al emitir orden de compra');
    }
  };

  const handleConfirmReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecError(null);
    try {
      const ord = orders.find(o => o.id === recOrdenId);
      if (!ord || ord.items.length === 0) throw new Error('Orden no válida');

      await purchaseReceiptService.confirmReceipt({
        ordenCompraId: recOrdenId,
        numeroRemitoProveedor: recRemito || undefined,
        recibidoPorEmpleadoId: 'emp-1',
        items: [
          {
            ordenCompraItemId: ord.items[0].id,
            cantidadRecibida: Number(recCant),
            cantidadAceptada: Number(recCant),
            cantidadRechazada: 0
          }
        ]
      });
      setShowReceiptModal(false);
      setRecRemito('');
      await loadData();
    } catch (err: any) {
      setRecError(err.message || 'Error al confirmar recepción');
    }
  };

  const handleRegisterInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacError(null);
    try {
      await supplierInvoiceService.registerInvoice({
        proveedorId: facProveedorId,
        tipoComprobante: facTipo,
        puntoVenta: Number(facPV),
        numeroComprobante: Number(facNum),
        fechaEmision: new Date().toISOString().split('T')[0],
        fechaVencimiento: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        subtotalNetoGravado: Number(facNeto),
        iva21: Number(facIva),
        totalComprobante: Number(facTotal),
        ordenCompraId: facOrdenId || undefined
      });
      setShowInvoiceModal(false);
      await loadData();
    } catch (err: any) {
      setFacError(err.message || 'Error al registrar factura');
    }
  };

  const handleRunMatching = async (ordenId: string) => {
    const res = await purchaseMatchingService.evaluateMatching({ ordenCompraId: ordenId });
    setMatchingResult(res);
    setShowMatchingModal(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <ShoppingCart className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                MÓDULO 5 — COMPRAS, PROVEEDORES & RECEPCIÓN
              </h1>
              <p className="text-xs text-slate-400">
                Circuito de adquisiciones: Requisiciones, Cotizaciones, Órdenes de Compra, Remitos y 3-Way Matching
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Nueva Solicitud</span>
          </button>
          <button
            onClick={() => setShowOrderModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir OC</span>
          </button>
          <button
            onClick={() => setShowReceiptModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
          >
            <Truck className="w-4 h-4" />
            <span>Recibir Mercadería</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Operativos */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Solicitudes Pendientes</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-lg font-bold ${solPendientes > 0 ? 'text-amber-400' : 'text-white'}`}>
              {solPendientes}
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Requieren aprobación</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Órdenes en Curso</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-cyan-400">{ocEnCurso}</span>
            <ShoppingCart className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Pendientes / Parciales</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Monto Compras</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-emerald-400">${totalComprasMonto.toLocaleString()}</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Acumulado comprometido</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Recepciones Mes</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">{recepcionesConfirmadas}</span>
            <PackageCheck className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Remitos ingresados</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Facturas Proveedor</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">{facturasRegistradas}</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Comprobantes fiscales</span>
        </div>
      </div>

      {/* Tabs de Navegación del Módulo */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'orders'
              ? 'border-amber-500 text-amber-400 font-semibold bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Órdenes de Compra ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'requests'
              ? 'border-amber-500 text-amber-400 font-semibold bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Solicitudes ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quotations')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'quotations'
              ? 'border-amber-500 text-amber-400 font-semibold bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Cotizaciones ({quotations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'receipts'
              ? 'border-amber-500 text-amber-400 font-semibold bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Recepciones ({receipts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'invoices'
              ? 'border-amber-500 text-amber-400 font-semibold bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Facturas Proveedor ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'suppliers'
              ? 'border-amber-500 text-amber-400 font-semibold bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Proveedores ({suppliers.length})</span>
        </button>
      </div>

      {/* TAB 1: ÓRDENES DE COMPRA */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-3.5 py-3">Número / Fecha</th>
                  <th className="px-3.5 py-3">Proveedor</th>
                  <th className="px-3.5 py-3">Items / Descripción</th>
                  <th className="px-3.5 py-3 text-right">Monto Total</th>
                  <th className="px-3.5 py-3 text-center">Progreso Recepción</th>
                  <th className="px-3.5 py-3 text-center">Estado</th>
                  <th className="px-3.5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {orders.map(o => {
                  const totalCant = o.items.reduce((s, it) => s + it.cantidad, 0);
                  const totalRec = o.items.reduce((s, it) => s + it.cantidadRecibida, 0);
                  const pct = totalCant > 0 ? Math.round((totalRec / totalCant) * 100) : 0;

                  return (
                    <tr key={o.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-3.5 py-2.5">
                        <div className="font-semibold text-white">{o.numero}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(o.fechaEmision).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-3.5 py-2.5">
                        <div className="font-semibold text-amber-400">{o.proveedorNombreSnapshot}</div>
                        <div className="text-[10px] text-slate-400">CUIT: {o.proveedorCuitSnapshot}</div>
                      </td>

                      <td className="px-3.5 py-2.5">
                        <div className="truncate max-w-[280px] font-medium text-slate-200">
                          {o.items[0]?.descripcionSnapshot}
                          {o.items.length > 1 && ` (+${o.items.length - 1} items)`}
                        </div>
                        <div className="text-[10px] text-slate-500">{o.condicionPago}</div>
                      </td>

                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-400">
                        ${o.total.toLocaleString()}
                      </td>

                      <td className="px-3.5 py-2.5 text-center">
                        <div className="text-[11px] font-semibold text-white">
                          {totalRec} / {totalCant} ({pct}%)
                        </div>
                        <div className="w-24 bg-slate-950 h-1.5 rounded-full mx-auto mt-1 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full ${pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-slate-700'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            o.estado === 'RECIBIDA'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : o.estado === 'PARCIALMENTE_RECIBIDA'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : o.estado === 'EMITIDA'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {o.estado}
                        </span>
                      </td>

                      <td className="px-3.5 py-2.5 text-right space-x-1">
                        <button
                          onClick={() => handleRunMatching(o.id)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] border border-slate-700"
                        >
                          3-Way Match
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SOLICITUDES DE COMPRA */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-3.5 py-3">Número / Fecha</th>
                  <th className="px-3.5 py-3">Sector / Solicitante</th>
                  <th className="px-3.5 py-3">Motivo / Requerimiento</th>
                  <th className="px-3.5 py-3">Items Solicitados</th>
                  <th className="px-3.5 py-3 text-center">Prioridad</th>
                  <th className="px-3.5 py-3 text-center">Estado</th>
                  <th className="px-3.5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {requests.map(r => {
                  const emp = employees.find(e => e.id === r.solicitanteEmpleadoId);

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-3.5 py-2.5">
                        <div className="font-semibold text-white">{r.numero}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(r.fechaSolicitud).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-3.5 py-2.5">
                        <div className="font-semibold text-cyan-400">{r.sector}</div>
                        <div className="text-[10px] text-slate-400">{emp ? `${emp.apellido}, ${emp.nombre}` : r.solicitanteEmpleadoId}</div>
                      </td>

                      <td className="px-3.5 py-2.5">
                        <div className="font-medium text-slate-200">{r.motivo}</div>
                      </td>

                      <td className="px-3.5 py-2.5">
                        {r.items.map(it => (
                          <div key={it.id} className="text-[11px] text-slate-300">
                            • {it.cantidad} {it.unidadMedida} - {it.descripcionSnapshot}
                          </div>
                        ))}
                      </td>

                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.prioridad === 'URGENTE' || r.prioridad === 'CRITICA'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : r.prioridad === 'ALTA'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {r.prioridad}
                        </span>
                      </td>

                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.estado === 'APROBADA' || r.estado === 'ORDENADA'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : r.estado === 'PENDIENTE_APROBACION'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {r.estado}
                        </span>
                      </td>

                      <td className="px-3.5 py-2.5 text-right">
                        {r.estado === 'PENDIENTE_APROBACION' && (
                          <button
                            onClick={async () => {
                              await purchaseRequestService.approveRequest(r.id, 'emp-1', 'Aprobación directa');
                              await loadData();
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold"
                          >
                            Aprobar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PROVEEDORES */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-3.5 py-3">Código / Razón Social</th>
                  <th className="px-3.5 py-3">CUIT / Doc</th>
                  <th className="px-3.5 py-3">Condición IVA & Pago</th>
                  <th className="px-3.5 py-3">Rubros / Categorías</th>
                  <th className="px-3.5 py-3">Contacto</th>
                  <th className="px-3.5 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {suppliers.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-3.5 py-2.5">
                      <div className="font-semibold text-white">{p.razonSocial}</div>
                      <div className="text-[10px] text-amber-400 font-mono">{p.codigo}</div>
                    </td>

                    <td className="px-3.5 py-2.5 font-mono text-slate-300">
                      {p.numeroDocumento}
                    </td>

                    <td className="px-3.5 py-2.5">
                      <div className="text-slate-200">{p.condicionIVA}</div>
                      <div className="text-[10px] text-slate-400">{p.condicionPagoDefault} ({p.diasPagoDefault} días)</div>
                    </td>

                    <td className="px-3.5 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {p.categoriasProveidas.map((c, i) => (
                          <span key={i} className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] text-slate-300">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-3.5 py-2.5">
                      <div className="text-slate-200">{p.contactoPrincipalNombre || 'S/D'}</div>
                      <div className="text-[10px] text-slate-400">{p.telefono}</div>
                    </td>

                    <td className="px-3.5 py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RECEPCIONES */}
      {activeTab === 'receipts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-3.5 py-3">Número / Fecha</th>
                <th className="px-3.5 py-3">Orden de Compra</th>
                <th className="px-3.5 py-3">Proveedor</th>
                <th className="px-3.5 py-3">Remito Proveedor</th>
                <th className="px-3.5 py-3">Items Recibidos</th>
                <th className="px-3.5 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {receipts.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/30">
                  <td className="px-3.5 py-2.5">
                    <div className="font-semibold text-white">{r.numero}</div>
                    <div className="text-[10px] text-slate-400">{new Date(r.fechaHora).toLocaleDateString()}</div>
                  </td>
                  <td className="px-3.5 py-2.5 font-bold text-amber-400">{r.ordenCompraId}</td>
                  <td className="px-3.5 py-2.5">{r.proveedorNombreSnapshot}</td>
                  <td className="px-3.5 py-2.5 font-mono text-cyan-300">{r.numeroRemitoProveedor || 'S/N'}</td>
                  <td className="px-3.5 py-2.5">
                    {r.items.map(it => (
                      <div key={it.id}>
                        {it.cantidadAceptada} {it.unidadMedida} - {it.descripcionSnapshot}
                      </div>
                    ))}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                      {r.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: FACTURAS */}
      {activeTab === 'invoices' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-3.5 py-3">Tipo / Comprobante</th>
                <th className="px-3.5 py-3">Proveedor</th>
                <th className="px-3.5 py-3">Fecha Emisión</th>
                <th className="px-3.5 py-3 text-right">Neto Gravado</th>
                <th className="px-3.5 py-3 text-right">IVA & Impuestos</th>
                <th className="px-3.5 py-3 text-right">Total Factura</th>
                <th className="px-3.5 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {invoices.map(f => (
                <tr key={f.id} className="hover:bg-slate-800/30">
                  <td className="px-3.5 py-2.5">
                    <div className="font-semibold text-white">{f.tipoComprobante}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">
                      {f.puntoVenta.toString().padStart(4, '0')}-{f.numeroComprobante.toString().padStart(8, '0')}
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 font-medium text-slate-200">{f.proveedorNombreSnapshot}</td>
                  <td className="px-3.5 py-2.5 text-slate-400">{f.fechaEmision}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono">${f.subtotalNetoGravado.toLocaleString()}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono">${f.totalIva.toLocaleString()}</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-emerald-400 font-mono">
                    ${f.totalComprobante.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                      {f.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: COTIZACIONES */}
      {activeTab === 'quotations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-3.5 py-3">Cotización</th>
                <th className="px-3.5 py-3">Proveedor</th>
                <th className="px-3.5 py-3">Vigencia Hasta</th>
                <th className="px-3.5 py-3">Plazo Entrega</th>
                <th className="px-3.5 py-3 text-right">Monto Total</th>
                <th className="px-3.5 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {quotations.map(q => (
                <tr key={q.id} className="hover:bg-slate-800/30">
                  <td className="px-3.5 py-2.5 font-bold text-white">{q.numero}</td>
                  <td className="px-3.5 py-2.5 text-amber-400 font-semibold">{q.proveedorNombreSnapshot}</td>
                  <td className="px-3.5 py-2.5 text-slate-400">{q.fechaVencimiento}</td>
                  <td className="px-3.5 py-2.5">{q.plazoEntregaDias} días</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-emerald-400">${q.total.toLocaleString()}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        q.estado === 'SELECCIONADA'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {q.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL SOLICITUD */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base">Crear Solicitud de Compra</h3>
            {reqError && <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded">{reqError}</div>}
            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Sector Solicitante *</label>
                  <select value={reqSector} onChange={e => setReqSector(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200">
                    <option value="PLANTA_HORMIGON">Planta de Hormigón</option>
                    <option value="TALLER">Taller Mecánico</option>
                    <option value="CANTERA">Cantera y Áridos</option>
                    <option value="ADMINISTRACION">Administración</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Prioridad *</label>
                  <select value={reqPrioridad} onChange={e => setReqPrioridad(e.target.value as PrioridadSolicitud)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200">
                    <option value="BAJA">Baja</option>
                    <option value="NORMAL">Normal</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Motivo de Compra *</label>
                <input required type="text" value={reqMotivo} onChange={e => setReqMotivo(e.target.value)} placeholder="ej: Insumos de laboratorio..." className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200" />
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">Descripción del Item *</label>
                  <input required type="text" value={reqItemDesc} onChange={e => setReqItemDesc(e.target.value)} placeholder="ej: Desmoldante para probetas 20L" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cantidad *</label>
                  <input required type="number" min="1" value={reqItemCant} onChange={e => setReqItemCant(parseFloat(e.target.value) || 1)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-bold" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowRequestModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded">Crear Solicitud</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ORDEN DE COMPRA */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base">Emitir Orden de Compra</h3>
            {ordError && <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded">{ordError}</div>}
            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Proveedor *</label>
                <select value={ordProveedorId} onChange={e => setOrdProveedorId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200">
                  {suppliers.map(p => (
                    <option key={p.id} value={p.id}>{p.razonSocial} ({p.codigo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Descripción del Item *</label>
                <input required type="text" value={ordItemDesc} onChange={e => setOrdItemDesc(e.target.value)} placeholder="ej: Cemento Portland CP40..." className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Cantidad *</label>
                  <input required type="number" min="1" value={ordItemCant} onChange={e => setOrdItemCant(parseFloat(e.target.value) || 1)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-bold" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Precio Unitario ($) *</label>
                  <input required type="number" min="1" value={ordItemPrecio} onChange={e => setOrdItemPrecio(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono font-bold" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowOrderModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded">Emitir OC</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3-WAY MATCHING */}
      {showMatchingModal && matchingResult && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>Conciliación 3-Way Matching</span>
            </h3>

            <div className={`p-3 rounded border text-xs ${
              matchingResult.estadoMatching === 'OK'
                ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/30 border-amber-800 text-amber-300'
            }`}>
              <div className="font-bold text-sm">Estado: {matchingResult.estadoMatching}</div>
              <ul className="mt-2 space-y-1 list-disc pl-4 text-[11px]">
                {matchingResult.detalles.map((d: string, idx: number) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-slate-800 pt-3">
              <div className="bg-slate-950 p-2 rounded">
                <span className="text-slate-400 text-[10px]">Ordenado</span>
                <div className="font-bold text-white mt-1">{matchingResult.cantidadOrdenada} un</div>
                <div className="text-emerald-400 font-mono text-[11px]">${matchingResult.montoOrdenado.toLocaleString()}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded">
                <span className="text-slate-400 text-[10px]">Recibido</span>
                <div className="font-bold text-cyan-400 mt-1">{matchingResult.cantidadRecibida} un</div>
              </div>
              <div className="bg-slate-950 p-2 rounded">
                <span className="text-slate-400 text-[10px]">Facturado</span>
                <div className="font-bold text-white mt-1">{matchingResult.cantidadFacturada} un</div>
                <div className="text-emerald-400 font-mono text-[11px]">${matchingResult.montoFacturado.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button onClick={() => setShowMatchingModal(false)} className="px-4 py-2 bg-slate-800 text-slate-200 rounded text-xs font-bold">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
