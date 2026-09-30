import React, { useState } from 'react';
import { UserRole } from './types';
import {
  mockPlantas,
  mockCentrosCosto,
  mockEmpleados,
  mockEquipos,
  mockArticulos,
  mockClientes,
  mockPedidos,
  mockViajes,
  mockProduccion,
  mockProbetas,
  mockOrdenesMantenimiento,
  mockFacturas
} from './mockData';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { MastersView } from './components/MastersView';
import { PersonnelView } from './components/PersonnelView';
import { FleetView } from './components/FleetView';
import { StockAggregatesView } from './components/StockAggregatesView';
import { SalesOrdersView } from './components/SalesOrdersView';
import { LogisticsDispatchView } from './components/LogisticsDispatchView';
import { ProductionBatchView } from './components/ProductionBatchView';
import { LaboratoryView } from './components/LaboratoryView';
import { FinanceView } from './components/FinanceView';
import { CostsProfitabilityView } from './components/CostsProfitabilityView';
import { ClientPortalView } from './components/ClientPortalView';
import { AuditView } from './components/AuditView';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [selectedPlantaId, setSelectedPlantaId] = useState<string>('planta-1');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      <Navbar
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        plantas={mockPlantas}
        selectedPlantaId={selectedPlantaId}
        setSelectedPlantaId={setSelectedPlantaId}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-6 overflow-y-auto bg-slate-950">
          {activeTab === 'dashboard' && (
            <DashboardView
              pedidos={mockPedidos}
              viajes={mockViajes}
              probetas={mockProbetas}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'masters' && (
            <MastersView
              plantas={mockPlantas}
              centrosCosto={mockCentrosCosto}
              empleados={mockEmpleados}
              equipos={mockEquipos}
              clientes={mockClientes}
            />
          )}
          {activeTab === 'personnel' && <PersonnelView empleados={mockEmpleados} />}
          {activeTab === 'fleet' && <FleetView equipos={mockEquipos} ordenesMantenimiento={mockOrdenesMantenimiento} />}
          {activeTab === 'stock' && <StockAggregatesView articulos={mockArticulos} />}
          {activeTab === 'sales' && <SalesOrdersView pedidos={mockPedidos} />}
          {activeTab === 'logistics' && <LogisticsDispatchView viajes={mockViajes} equipos={mockEquipos} />}
          {activeTab === 'production' && <ProductionBatchView produccion={mockProduccion} />}
          {activeTab === 'lab' && <LaboratoryView probetas={mockProbetas} />}
          {activeTab === 'finance' && <FinanceView facturas={mockFacturas} clientes={mockClientes} />}
          {activeTab === 'costs' && <CostsProfitabilityView />}
          {activeTab === 'portal' && <ClientPortalView pedidos={mockPedidos} facturas={mockFacturas} />}
          {activeTab === 'audit' && <AuditView />}
        </main>
      </div>
    </div>
  );
}
