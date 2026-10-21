"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import shared from "../panel.module.css";
import {
  cambiarEstadoPagoReservaAdminAction,
  cambiarEstadoReservaAdminAction,
  crearBloqueoCalendarioAdminAction,
  eliminarBloqueoCalendarioAdminAction,
} from "@/server/services/reservas/admin";
import type {
  EstadoPagoReserva,
  EstadoReserva,
  FechaBloqueada,
  ReservaEstudio,
} from "@/types/estudio";

interface Props {
  reservasIniciales: ReservaEstudio[];
  fechasIniciales: FechaBloqueada[];
}

const ESTADOS: { clave: EstadoReserva; texto: string }[] = [
  { clave: "pendiente", texto: "Pendiente" },
  { clave: "confirmada", texto: "Confirmada" },
  { clave: "completada", texto: "Completada" },
  { clave: "cancelada", texto: "Cancelada" },
];

const ESTADOS_PAGO: { clave: EstadoPagoReserva; texto: string }[] = [
  { clave: "pendiente", texto: "Pago pendiente" },
  { clave: "comprobante_subido", texto: "Comprobante subido" },
  { clave: "pagado", texto: "Pagado" },
  { clave: "rechazado", texto: "Comprobante rechazado" },
];

const fmtFechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-GT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export function ReservasPanel({ reservasIniciales, fechasIniciales }: Props) {
  const toast = useToast();
  const [tab, setTab] = useState<"reservas" | "bloqueos">("reservas");
  const [reservas, setReservas] = useState(reservasIniciales);
  const [fechas, setFechas] = useState(fechasIniciales);

  const [form, setForm] = useState({
    desde: "",
    hasta: "",
    horaDesde: "",
    horaHasta: "",
    motivo: "",
  });

  const cambiarEstado = async (id: string, estado: EstadoReserva) => {
    try {
      await cambiarEstadoReservaAdminAction(id, estado);
      setReservas((prev) => prev.map((r) => (r.id === id ? { ...r, estado } : r)));
      toast(`Reserva ${estado}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo actualizar el estado");
    }
  };

  const cambiarPago = async (id: string, estadoPago: EstadoPagoReserva) => {
    try {
      await cambiarEstadoPagoReservaAdminAction(id, estadoPago);
      setReservas((prev) => prev.map((r) => (r.id === id ? { ...r, estadoPago } : r)));
      toast("Estado de pago actualizado");
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo actualizar el estado de pago");
    }
  };

  const crearBloqueo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.desde || !form.hasta) return toast("Indica las fechas desde y hasta");
    try {
      const nueva = await crearBloqueoCalendarioAdminAction({
        desde: form.desde,
        hasta: form.hasta,
        horaDesde: form.horaDesde || null,
        horaHasta: form.horaHasta || null,
        motivo: form.motivo || null,
      });
      setFechas((prev) => [...prev, nueva]);
      setForm({ desde: "", hasta: "", horaDesde: "", horaHasta: "", motivo: "" });
      toast("Fecha bloqueada creada");
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo crear el bloqueo");
    }
  };

  const borrarBloqueo = async (id: string) => {
    try {
      await eliminarBloqueoCalendarioAdminAction(id);
      setFechas((prev) => prev.filter((f) => f.id !== id));
      toast("Bloqueo eliminado");
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo eliminar el bloqueo");
    }
  };

  return (
    <>
      <div className={shared.toolbar}>
        <div className={shared.chips}>
          <button
            type="button"
            className={`${shared.chip} ${tab === "reservas" ? shared.on : ""}`}
            onClick={() => setTab("reservas")}
          >
            Reservas <small>{reservas.length}</small>
          </button>
          <button
            type="button"
            className={`${shared.chip} ${tab === "bloqueos" ? shared.on : ""}`}
            onClick={() => setTab("bloqueos")}
          >
            Fechas bloqueadas <small>{fechas.length}</small>
          </button>
        </div>
      </div>

      {tab === "reservas" && (
        <section className={shared.card}>
          <h2 className={shared.cardTitle}>Solicitudes de renta</h2>
          {reservas.length === 0 && (
            <p className={shared.empty}>Aún no hay reservas.</p>
          )}
          <ul style={{ display: "grid", gap: 12, listStyle: "none", padding: 0, margin: 0 }}>
            {reservas.map((r) => (
              <li
                key={r.id}
                style={{
                  border: "1px solid rgba(0,0,0,.08)",
                  borderRadius: 14,
                  padding: 16,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <b>{r.nombre}</b>{" "}
                    <span style={{ fontSize: 12, opacity: 0.6 }}>
                      {fmtFechaHora(r.fechaHoraInicio)} → {fmtFechaHora(r.fechaHoraFin)}
                    </span>
                  </div>
                  <b>
                    {r.totalCalculado !== null ? `Q${r.totalCalculado.toFixed(2)}` : "—"}
                  </b>
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  {r.correo}
                  {r.telefono ? ` · ${r.telefono}` : ""}
                </div>
                {r.notasCliente && (
                  <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>{r.notasCliente}</p>
                )}
                <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                  <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
                    <span style={{ fontWeight: 700, textTransform: "uppercase", opacity: 0.6 }}>Estado</span>
                    <select
                      value={r.estado}
                      onChange={(e) => cambiarEstado(r.id, e.target.value as EstadoReserva)}
                      style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)" }}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e.clave} value={e.clave}>
                          {e.texto}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
                    <span style={{ fontWeight: 700, textTransform: "uppercase", opacity: 0.6 }}>Estado de pago</span>
                    <select
                      value={r.estadoPago}
                      onChange={(e) => cambiarPago(r.id, e.target.value as EstadoPagoReserva)}
                      style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)" }}
                    >
                      {ESTADOS_PAGO.map((e) => (
                        <option key={e.clave} value={e.clave}>
                          {e.texto}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "bloqueos" && (
        <>
          <section className={shared.card}>
            <h2 className={shared.cardTitle}>Bloquear fechas del calendario</h2>
            <form onSubmit={crearBloqueo} style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, textTransform: "uppercase", opacity: 0.6 }}>Desde *</span>
                  <input
                    type="date"
                    required
                    value={form.desde}
                    onChange={(e) => setForm((f) => ({ ...f, desde: e.target.value }))}
                    style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)" }}
                  />
                </label>
                <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, textTransform: "uppercase", opacity: 0.6 }}>Hasta *</span>
                  <input
                    type="date"
                    required
                    value={form.hasta}
                    onChange={(e) => setForm((f) => ({ ...f, hasta: e.target.value }))}
                    style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)" }}
                  />
                </label>
                <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, textTransform: "uppercase", opacity: 0.6 }}>Hora desde (opcional)</span>
                  <input
                    type="time"
                    value={form.horaDesde}
                    onChange={(e) => setForm((f) => ({ ...f, horaDesde: e.target.value }))}
                    style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)" }}
                  />
                </label>
                <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, textTransform: "uppercase", opacity: 0.6 }}>Hora hasta (opcional)</span>
                  <input
                    type="time"
                    value={form.horaHasta}
                    onChange={(e) => setForm((f) => ({ ...f, horaHasta: e.target.value }))}
                    style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)" }}
                  />
                </label>
              </div>
              <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
                <span style={{ fontWeight: 700, textTransform: "uppercase", opacity: 0.6 }}>Motivo</span>
                <input
                  type="text"
                  placeholder="Ej. Mantenimiento, evento privado…"
                  value={form.motivo}
                  onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
                  style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)" }}
                />
              </label>
              <div>
                <button type="submit" className={`${shared.btn} ${shared.btnPrimary}`}>
                  Bloquear
                </button>
              </div>
            </form>
          </section>

          <section className={shared.card}>
            <h2 className={shared.cardTitle}>Bloqueos actuales</h2>
            {fechas.length === 0 && (
              <p className={shared.empty}>No hay fechas bloqueadas.</p>
            )}
            <ul style={{ display: "grid", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
              {fechas.map((f) => (
                <li
                  key={f.id}
                  style={{
                    border: "1px solid rgba(0,0,0,.08)",
                    borderRadius: 12,
                    padding: 12,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 13 }}>
                    <b>
                      {fmtFecha(f.desde)} → {fmtFecha(f.hasta)}
                    </b>
                    {f.horaDesde && f.horaHasta && (
                      <span style={{ opacity: 0.7 }}>
                        {" "}
                        · {f.horaDesde}–{f.horaHasta}
                      </span>
                    )}
                    {f.motivo && <div style={{ opacity: 0.7 }}>{f.motivo}</div>}
                  </div>
                  <button
                    type="button"
                    className={`${shared.btn} ${shared.ghost} ${shared.danger} ${shared.sm}`}
                    onClick={() => borrarBloqueo(f.id)}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
