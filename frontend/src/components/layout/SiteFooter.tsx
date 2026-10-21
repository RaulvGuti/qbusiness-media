import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function SiteFooter() {
  return (
    <footer className="border-t border-qbIndigoHover bg-qbIndigo text-[#ECE7DE] mt-16 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-1">
            <Image
              src="/logo-header.png"
              alt="QBusiness Media Logo"
              width={600}
              height={186}
              className="h-16 sm:h-20 w-auto object-contain"
            />
            <p className="text-xs text-[#ECE7DE]/80 leading-relaxed">
              Somos una agencia de medios y creatividad dedicada a contar historias que impactan.
              Quetzaltenango, Guatemala.
            </p>
            <div className="text-xs text-qbTerracotta font-semibold">
              &quot;Tu historia, nuestra estrategia.&quot;
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Navegación</h4>
            <ul className="space-y-2 text-xs text-[#ECE7DE]/75">
              <li>
                <Link className="hover:text-qbTerracotta transition" href="/">
                  Inicio
                </Link>
              </li>
              <li>
                <Link className="hover:text-qbTerracotta transition" href="/portafolio">
                  Portafolio Multimedia
                </Link>
              </li>
              <li>
                <Link className="hover:text-qbTerracotta transition" href="/backstage">
                  Backstage &amp; Producción
                </Link>
              </li>
              <li>
                <Link className="hover:text-qbTerracotta transition" href="/resenas">
                  Reseñas de Clientes
                </Link>
              </li>
              <li>
                <Link className="hover:text-qbTerracotta transition" href="/renta">
                  Renta de Estudio
                </Link>
              </li>
              <li>
                <Link className="hover:text-qbTerracotta transition" href="/apoyo">
                  Apoyo Social
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Servicios</h4>
            <ul className="space-y-2 text-xs text-[#ECE7DE]/75">
              <li>Producción Audiovisual 4K</li>
              <li>Contenido Vertical 9:16</li>
              <li>Fotografía Comercial de Producto</li>
              <li>Producción de Podcasts Broadcast</li>
              <li>Renta de Locación y Ciclorama</li>
              <li>Cobertura de Eventos con Drone</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Contacto Directo</h4>
            <ul className="space-y-2.5 text-xs text-[#ECE7DE]/75">
              <li className="flex items-center">
                <Icon name="location-dot" className="text-qbTerracotta mr-2" /> Quetzaltenango, Guatemala
              </li>
              <li className="flex items-center">
                <Icon name="whatsapp" className="text-qbSage mr-2" /> +502 5344 8587
              </li>
              <li className="flex items-center">
                <Icon name="envelope" className="text-qbTerracotta mr-2" /> contacto@qbusinessmedia.gt
              </li>
              <li className="flex items-center">
                <Icon name="clock" className="text-qbSage mr-2" /> Lunes a Sábado: 8:00 - 18:00
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#ECE7DE]/60">
          <p>© 2026 QBusiness Media. Todos los derechos reservados. Dirección General: Luis Gonzales.</p>
          <div className="flex space-x-4 text-base">
            <a target="_blank" className="hover:text-qbTerracotta transition" href="https://instagram.com">
              <Icon name="instagram" />
            </a>{" "}
            <a target="_blank" className="hover:text-qbSage transition" href="https://wa.me/50253448587">
              <Icon name="whatsapp" />
            </a>{" "}
            <a target="_blank" className="hover:text-qbTerracotta transition" href="https://youtube.com">
              <Icon name="youtube" />
            </a>{" "}
            <a target="_blank" className="hover:text-white transition" href="https://tiktok.com">
              <Icon name="tiktok" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
