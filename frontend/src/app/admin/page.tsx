'use client';

import React, { useMemo, useState } from 'react';
import LeadsTable from '@/components/admin/LeadsTable';
import ReservasTable from '@/components/admin/ReservasTable';
import ReviewsModerationTable from '@/components/admin/ReviewsModerationTable';
import type { LeadContacto, ResenaCliente } from '@/types/leads';
import type { ReservaEstudio } from '@/types/estudio';

const leadsMock: LeadContacto[] = [
  {
    id: 'l1',
    nombre: 'Juan Pérez',
    email: 'juan@empresa.com',
    telefono: '+502 5555 1111',
    empresa: 'Empresa XYZ',
    tipoServicio: 'video-corporativo',
    presupuesto: 'Q8,000 - Q10,000',
    mensaje: 'Necesitamos video para lanzamiento de producto.',
    origen: 'contactanos',
    estado: 'nuevo',
    fechaCreacion: '2025-10-15',
  },
  {
    id: 'l2',
    nombre: 'Laura Torres',
    email: 'laura@startup.com',
    telefono: '+502 4444 2222',
    empresa: 'Startup GT',
    tipoServicio: 'reels',
    presupuesto: 'Q2,500',
    mensaje: 'Contenido mensual para redes sociales.',
    origen: 'landing',
    estado: 'cotizado',
    fechaCreacion: '2025-10-12',
  },
];

const reservasMock: ReservaEstudio[] = [
  {
    id: 'rsv1',
    nombreCliente: 'Carlos Méndez',
    email: 'carlos@agencia.com',
    telefono: '+502 3333 4444',
    fecha: '2025-10-20',
    horaInicio: '09:00',
    horaFin: '13:00',
    horasTotales: 4,
    servicios: [],
    equipos: [],
    subtotalServicios: 0,
    subtotalEquipos: 0,
    total: 1200,
    estado: 'pendiente',
    notas: 'Grabación de podcast',
  },
  {
    id: 'rsv2',
    nombreCliente: 'María Ruiz',
    email: 'maria@marca.com',
    telefono: '+502 2222 5555',
    fecha: '2025-10-18',
    horaInicio: '14:00',
    horaFin: '18:00',
    horasTotales: 4,
    servicios: [],
    equipos: [],
    subtotalServicios: 250,
    subtotalEquipos: 350,
    total: 1600,
    estado: 'confirmada',
  },
];

const resenasIniciales: ResenaCliente[] = [
  {
    id: 'rev1',
    nombreCliente: 'María González',
    empresa: 'Agencia Creativa',
    cargo: 'Directora de Marketing',
    calificacion: 5,
    testimonio:
      'Excelente trabajo, muy profesional y cumplieron con todos los plazos. El resultado superó nuestras expectativas.',
    proyectoRelacionado: 'Video Corporativo',
    estado: 'publicada',
    fechaCreacion: '2025-09-10',
    fechaPublicacion: '2025-09-12',
  },
  {
    id: 'rev2',
    nombreCliente: 'Pedro Martínez',
    calificacion: 4,
    testimonio: 'Buen resultado, comunicación fluida durante todo el proceso.',
    estado: 'borrador',
    fechaCreacion: '2025-09-20',
  },
  {
    id: 'rev3',
    nombreCliente: 'Lucía Fernández',
    empresa: 'ONG Ambiental',
    cargo: 'Coordinadora',
    calificacion: 5,
    testimonio: 'Muy comprometidos con la causa. Excelente calidad.',
    estado: 'borrador',
    fechaCreacion: '2025-10-05',
  },
];

type TabAdmin = 'leads' | 'reservas' | 'resenas';

export default function AdminPage() {
  const [tab, setTab] = useState<TabAdmin>('leads');
  const [resenas, setResenas] = useState<ResenaCliente[]>(resenasIniciales);

  const stats = useMemo(() => {
    return {
      totalLeads: leadsMock.length,
      leadsNuevos: leadsMock.filter((l) => l.estado === 'nuevo').length,
      reservasPendientes: reservasMock.filter((r) => r.estado === 'pendiente').length,
      reservasConfirmadas: reservasMock.filter((r) => r.estado === 'confirmada').length,
      resenasBorrador: resenas.filter((r) => r.estado === 'borrador').length,
      resenasPublicadas: resenas.filter((r) => r.estado === 'publicada').length,
      solicitudesPendientes: 0,
    };
  }, [resenas]);

  // Acciones de moderación de reseñas (3 estados/acciones solicitadas)
  const handleGuardarBorrador = (id: string) => {
    setResenas((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              estado: 'borrador',
              fechaPublicacion: undefined,
            }
          : r
      )
    );
  };

  const handlePublicar = (id: string) => {
    setResenas((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              estado: 'publicada',
              fechaPublicacion: new Date().toISOString().split('T')[0],
            }
          : r
      )
    );
  };

  const handleEliminar = (id: string) => {
    setResenas((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              estado: 'eliminada',
              fechaPublicacion: undefined,
            }
          : r
      )
    );
  };

  const tabs: Array<{ id: TabAdmin; label: string; icon: string }> = [
    { id: 'leads', label: 'Leads', icon: 'fas fa-inbox' },
    { id: 'reservas', label: 'Reservas', icon: 'fas fa-calendar-check' },
    { id: 'resenas', label: 'Reseñas', icon: 'fas fa-star' },
  ];

  return (
    <main className="min-h-screen bg-qbChalk">
      <section className="py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-qbInk">
                Panel de Administración
              </h1>
              <p className="text-qbMuted">
                Gestión interna de leads, reservas y reseñas.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Leads totales', value: stats.totalLeads, color: 'text-qbInk' },
              { label: 'Leads nuevos', value: stats.leadsNuevos, color: 'text-qbTerracotta' },
              { label: 'Reservas pendientes', value: stats.reservasPendientes, color: 'text-amber-600' },
              { label: 'Reservas confirmadas', value: stats.reservasConfirmadas, color: 'text-qbSage' },
              { label: 'Reseñas borrador', value: stats.resenasBorrador, color: 'text-amber-600' },
              { label: 'Reseñas publicadas', value: stats.resenasPublicadas, color: 'text-qbSage' },
              { label: 'Solicitudes apoyo (pend.)', value: stats.solicitudesPendientes, color: 'text-qbMuted' },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white border border-qbBorder rounded-2xl shadow-sm p-5 space-y-1"
              >
                <p className="text-xs font-semibold text-qbMuted uppercase tracking-wider">
                  {s.label}
                </p>
                <p className={`text-2xl sm:text-3xl font-extrabold ${s.color}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white border border-qbBorder rounded-2xl shadow-sm">
            <div className="border-b border-qbBorder px-4 sm:px-6">
              <nav className="flex flex-wrap gap-2">
                {tabs.map((t) => {
                  const activo = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      type="button"
                      className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition ${
                        activo
                          ? 'border-qbTerracotta text-qbTerracotta'
                          : 'border-transparent text-qbMuted hover:text-qbInk'
                      }`}
                    >
                      <i className={t.icon} aria-hidden />
                      {t.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {tab === 'leads' && <LeadsTable leads={leadsMock} />}
              {tab === 'reservas' && <ReservasTable reservas={reservasMock} />}
              {tab === 'resenas' && (
                <ReviewsModerationTable
                  resenas={resenas}
                  onGuardarBorrador={handleGuardarBorrador}
                  onPublicar={handlePublicar}
                  onEliminar={handleEliminar}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}