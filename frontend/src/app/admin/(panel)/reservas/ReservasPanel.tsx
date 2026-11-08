"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  CAMPO,
  CAMPO_FECHA,
  CAMPO_SELECT,
} from "@/lib/estilos-formulario";
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
import styles from "./reservas.module.css";

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

const CLASE_ESTADO: Record<EstadoReserva, string> = {
  pendiente: styles.estadoPendiente,
  confirmada: styles.estadoConfirmada,
  completada: styles.estadoCompletada,
  cancelada: styles.estadoCancelada,
};

const textoEstado = (estado: EstadoReserva) =>
  ESTADOS.find((e) => e.clave === estado)?.texto ?? estado;

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
          <ul className={styles.list}>
            {reservas.map((r) => (
              <li key={r.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <div className={styles.itemTitle}>
                    <b>{r.nombre}</b>{" "}
                    <span className={styles.fecha}>
                      {fmtFechaHora(r.fechaHoraInicio)} → {fmtFechaHora(r.fechaHoraFin)}
                    </span>
                  </div>
                  <div className={styles.itemMeta}>
                    <span className={`${styles.badge} ${CLASE_ESTADO[r.estado]}`}>
                      {textoEstado(r.estado)}
                    </span>
                    <b className={styles.total}>
                      {r.totalCalculado !== null ? `Q${r.totalCalculado.toFixed(2)}` : "—"}
                    </b>
                  </div>
                </div>
                <div className={styles.contacto}>
                  {r.correo}
                  {r.telefono ? ` · ${r.telefono}` : ""}
                </div>
                {r.notasCliente && (
                  <p className={styles.notas}>{r.notasCliente}</p>
                )}
                <div className={styles.grid}>
                  <label className={styles.field}>
                    <span className={styles.label}>Estado</span>
                    <select
                      value={r.estado}
                      aria-label={`Estado de la reserva de ${r.nombre}`}
                      onChange={(e) => cambiarEstado(r.id, e.target.value as EstadoReserva)}
                      className={CAMPO_SELECT}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e.clave} value={e.clave}>
                          {e.texto}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Estado de pago</span>
                    <select
                      value={r.estadoPago}
                      aria-label={`Estado de pago de la reserva de ${r.nombre}`}
                      onChange={(e) => cambiarPago(r.id, e.target.value as EstadoPagoReserva)}
                      className={CAMPO_SELECT}
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
            <form onSubmit={crearBloqueo} className={styles.form}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span className={styles.label}>Desde *</span>
                  <input
                    type="date"
                    required
                    className={CAMPO_FECHA}
                    value={form.desde}
                    onChange={(e) => setForm((f) => ({ ...f, desde: e.target.value }))}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Hasta *</span>
                  <input
                    type="date"
                    required
                    className={CAMPO_FECHA}
                    value={form.hasta}
                    onChange={(e) => setForm((f) => ({ ...f, hasta: e.target.value }))}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Hora desde (opcional)</span>
                  <input
                    type="time"
                    className={CAMPO_FECHA}
                    value={form.horaDesde}
                    onChange={(e) => setForm((f) => ({ ...f, horaDesde: e.target.value }))}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Hora hasta (opcional)</span>
                  <input
                    type="time"
                    className={CAMPO_FECHA}
                    value={form.horaHasta}
                    onChange={(e) => setForm((f) => ({ ...f, horaHasta: e.target.value }))}
                  />
                </label>
              </div>
              <label className={styles.field}>
                <span className={styles.label}>Motivo</span>
                <input
                  type="text"
                  className={CAMPO}
                  placeholder="Ej. Mantenimiento, evento privado…"
                  value={form.motivo}
                  onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
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
            <ul className={styles.list}>
              {fechas.map((f) => (
                <li key={f.id} className={styles.bloqueoItem}>
                  <div className={styles.bloqueoInfo}>
                    <b>
                      {fmtFecha(f.desde)} → {fmtFecha(f.hasta)}
                    </b>
                    {f.horaDesde && f.horaHasta && (
                      <span className={styles.bloqueoMeta}>
                        {" "}
                        · {f.horaDesde}–{f.horaHasta}
                      </span>
                    )}
                    {f.motivo && (
                      <div className={styles.bloqueoMeta}>{f.motivo}</div>
                    )}
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
