import { fileURLToPath } from "node:url";
import * as admin from "./admin.mjs";
import * as clients from "./clients.mjs";
import * as supabaseHelper from "./supabase.mjs";

/**
 * Punto de entrada unificado de `scripts/reservas`.
 *
 * Expone los dos módulos complementarios:
 *   - `clients`: consumo del catálogo, horarios ocupados, solicitud de reserva,
 *     cancelación por parte del cliente y subida de comprobante de pago.
 *   - `admin`: panel de control de reservas, validación de pagos, fechas
 *     bloqueadas y configuración de tarifas/horarios del estudio.
 */
export { admin, clients, supabaseHelper };

/**
 * Diagnóstico rápido desde consola:
 *   cd frontend && node ../scripts/reservas/index.mjs
 *
 * Regla AGENTS.md §4.5: nunca imprime datos personales de clientes
 * (nombres, teléfonos ni correos) en la consola; solo conteos e identificadores.
 */
async function diagnosticarModuloReservas() {
  console.log("\n=== Diagnóstico de scripts/reservas (clients <-> admin) ===");

  if (!supabaseHelper.tieneCredencialesSupabase()) {
    console.log(
      "  --   frontend/.env.local aún tiene valores de ejemplo o no está configurado.",
    );
    console.log(
      "  OK   Estructura de módulos cargada correctamente:",
    );
    console.log(`       clients: ${Object.keys(clients).join(", ")}`);
    console.log(`       admin:   ${Object.keys(admin).join(", ")}`);
    return;
  }

  const supabase = supabaseHelper.crearClienteSupabase();
  const hoy = new Date().toISOString().slice(0, 10);

  const [catalogo, ocupados] = await Promise.all([
    clients.obtenerCatalogoParaCliente(supabase),
    clients.obtenerHorariosOcupados({ desde: hoy, hasta: hoy }, supabase),
  ]);

  console.log("  OK   Conexión con Supabase verificada desde módulo clients:");
  console.log(`       Servicios activos: ${catalogo.servicios.length}`);
  console.log(`       Equipos activos:   ${catalogo.equipos.length}`);
  console.log(
    `       Tarifa por hora:   ${
      catalogo.configuracion.tarifaHora !== null
        ? `Q${catalogo.configuracion.tarifaHora.toFixed(2)}`
        : "sin configurar"
    }`,
  );
  console.log(
    `       Horario atención:  ${catalogo.configuracion.horaApertura} - ${catalogo.configuracion.horaCierre}`,
  );
  console.log(`       Bloques ocupados hoy (${hoy}): ${ocupados.length}`);
}

const esEjecucionDirecta =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (esEjecucionDirecta) {
  diagnosticarModuloReservas().catch((err) => {
    console.error("  !!   Error al verificar scripts/reservas:", err.message);
    process.exitCode = 1;
  });
}
