import { redirect } from "next/navigation";

// El panel unificado vive en /admin/(panel). Esta ruta suelta redirige
// para no romper enlaces antiguos.
export default function AdminPage() {
  redirect("/admin/dashboard");
}
