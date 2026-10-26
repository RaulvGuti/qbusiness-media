"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import shared from "../panel.module.css";
import {
  actualizarEstadoLead,
} from "@/server/repositories/leads";
import {
  actualizarEstadoSolicitud,
} from "@/server/repositories/solicitudes";
import type { EstadoLead, LeadContacto } from "@/types/leads";
import type { EstadoSolicitudApoyo, SolicitudApoyoSocial } from "@/types/social";

interface Props {
  leadsIniciales: LeadContacto[];
  solicitudesIniciales: SolicitudApoyoSocial[];
}

const ESTADOS_LEAD: { clave: EstadoLead; texto: string }[] = [
  { clave: "nuevo", texto: "Nuevo" },
  { clave: "contactado", texto: "Contactado" },
  { clave: "cerrado", texto: "Cerrado" },
];

const ESTADOS_SOLICITUD: { clave: EstadoSolicitudApoyo; texto: string }[] = [
  { clave: "nueva", texto: "Nueva" },
  { clave: "en_revision", texto: "En revisión" },
  { clave: "aprobada", texto: "Aprobada" },
  { clave: "rechazada", texto: "Rechazada" },
];

// SUPABASE (al conectar): sustituir por el id del admin autenticado
// (administradores.id = auth.users.id) obtenido en sesión.
const ADMIN_ID = "admin-0001";

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function Chip({ texto, tono }: { texto: string; tono: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: tono,
        color: "#fff",
        textTransform: "capitalize",
      }}
    >
      {texto}
    </span>
  );
}

const TONO_LEAD: Record<EstadoLead, string> = {
  nuevo: "#c96f4a",
  contactado: "#8f9a6e",
  cerrado: "#8a8a8a",
};

const TONO_SOLICITUD: Record<EstadoSolicitudApoyo, string> = {
  nueva: "#c96f4a",
  en_revision: "#b08a3e",
  aprobada: "#8f9a6e",
  rechazada: "#8a8a8a",
};

export function ContactosPanel({ leadsIniciales, solicitudesIniciales }: Props) {
  const toast = useToast();
  const [tab, setTab] = useState<"leads" | "apoyo">("leads");
  const [leads, setLeads] = useState(leadsIniciales);
  const [solicitudes, setSolicitudes] = useState(solicitudesIniciales);

  const cambiarLead = async (id: string, estado: EstadoLead) => {
    // SUPABASE (admin): UPDATE leads_contacto SET estado, gestionado_por_id.
    await actualizarEstadoLead(id, estado, ADMIN_ID);
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, estado, gestionadoPorId: ADMIN_ID } : l)),
    );
    toast("Estado del lead actualizado");
  };

  const cambiarSolicitud = async (id: string, estado: EstadoSolicitudApoyo) => {
    // SUPABASE (admin): UPDATE solicitudes_apoyo_social SET estado, gestionado_por_id.
    await actualizarEstadoSolicitud(id, estado, ADMIN_ID);
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado, gestionadoPorId: ADMIN_ID } : s)),
    );
    toast("Estado de la solicitud actualizado");
  };

  return (
    <>
      <div className={shared.toolbar}>
        <div className={shared.chips}>
          <button
            type="button"
            className={`${shared.chip} ${tab === "leads" ? shared.on : ""}`}
            onClick={() => setTab("leads")}
          >
            Formulario de contacto <small>{leads.length}</small>
          </button>
          <button
            type="button"
            className={`${shared.chip} ${tab === "apoyo" ? shared.on : ""}`}
            onClick={() => setTab("apoyo")}
          >
            Apoyo social <small>{solicitudes.length}</small>
          </button>
        </div>
      </div>

      {tab === "leads" && (
        <section className={shared.card}>
          <h2 className={shared.cardTitle}>Mensajes recibidos</h2>
          {leads.length === 0 && (
            <p className={shared.empty}>Aún no hay mensajes.</p>
          )}
          <ul style={{ display: "grid", gap: 12, listStyle: "none", padding: 0, margin: 0 }}>
            {leads.map((l) => (
              <li
                key={l.id}
                style={{
                  border: "1px solid rgba(0,0,0,.08)",
                  borderRadius: 14,
                  padding: 16,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <b>{l.nombre}</b>{" "}
                    <Chip texto={l.estado} tono={TONO_LEAD[l.estado]} />
                  </div>
                  <time style={{ fontSize: 12, opacity: 0.6 }}>{fecha(l.creadoEn)}</time>
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  {l.correo}
                  {l.telefono ? ` · ${l.telefono}` : ""}
                </div>
                {l.mensaje && <p style={{ fontSize: 13, margin: 0 }}>{l.mensaje}</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ESTADOS_LEAD.filter((e) => e.clave !== l.estado).map((e) => (
                    <button
                      key={e.clave}
                      type="button"
                      className={`${shared.btn} ${shared.sm} ${e.clave === "contactado" ? shared.btnPrimary : shared.ghost}`}
                      onClick={() => cambiarLead(l.id, e.clave)}
                    >
                      Marcar {e.texto.toLowerCase()}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "apoyo" && (
        <section className={shared.card}>
          <h2 className={shared.cardTitle}>Solicitudes de apoyo social</h2>
          {solicitudes.length === 0 && (
            <p className={shared.empty}>Aún no hay solicitudes.</p>
          )}
          <ul style={{ display: "grid", gap: 12, listStyle: "none", padding: 0, margin: 0 }}>
            {solicitudes.map((s) => (
              <li
                key={s.id}
                style={{
                  border: "1px solid rgba(0,0,0,.08)",
                  borderRadius: 14,
                  padding: 16,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <b>{s.nombreEntidad}</b>{" "}
                    {s.tipoOrganizacion && (
                      <span style={{ fontSize: 11, opacity: 0.6 }}>({s.tipoOrganizacion})</span>
                    )}{" "}
                    <Chip texto={s.estado} tono={TONO_SOLICITUD[s.estado]} />
                  </div>
                  <time style={{ fontSize: 12, opacity: 0.6 }}>{fecha(s.creadoEn)}</time>
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  {s.personaContacto} · {s.correo}
                  {s.telefono ? ` · ${s.telefono}` : ""}
                </div>
                {s.descripcionProyecto && (
                  <p style={{ fontSize: 13, margin: 0 }}>{s.descripcionProyecto}</p>
                )}
                {s.fechaTentativa && (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Fecha tentativa: {fecha(s.fechaTentativa)}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ESTADOS_SOLICITUD.filter((e) => e.clave !== s.estado).map((e) => (
                    <button
                      key={e.clave}
                      type="button"
                      className={`${shared.btn} ${shared.sm} ${e.clave === "aprobada" ? shared.btnPrimary : shared.ghost}`}
                      onClick={() => cambiarSolicitud(s.id, e.clave)}
                    >
                      {e.texto}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
