import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { crearEnlaceWhatsApp } from "@/lib/config-sitio";
import type { ConfiguracionSitio } from "@/types/config";

interface SiteFooterProps {
  config: ConfiguracionSitio;
}

export function SiteFooter({ config }: SiteFooterProps) {
  const anio = new Date().getFullYear();
  const whatsapp = crearEnlaceWhatsApp(
    config.contactoWhatsappNumero,
    config.mensajeWhatsapp,
  );

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
              {config.descripcionFooter}
            </p>
            {config.slogan && (
              <div className="text-xs text-qbTerracotta font-semibold">
                &quot;{config.slogan}&quot;
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Navegación</h4>
            <ul className="space-y-2 text-xs text-[#ECE7DE]/75">
              {config.footerNavegacion.map((enlace) => (
                <li key={`${enlace.texto}-${enlace.href}`}>
                  {enlace.href.startsWith("http") ? (
                    <a
                      className="hover:text-qbTerracotta transition"
                      href={enlace.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {enlace.texto}
                    </a>
                  ) : (
                    <Link
                      className="hover:text-qbTerracotta transition"
                      href={enlace.href}
                    >
                      {enlace.texto}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Servicios</h4>
            <ul className="space-y-2 text-xs text-[#ECE7DE]/75">
              {config.footerServicios.map((servicio) => (
                <li key={servicio}>{servicio}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Contacto Directo</h4>
            <ul className="space-y-2.5 text-xs text-[#ECE7DE]/75">
              <li className="flex items-center">
                <Icon name="location-dot" className="text-qbTerracotta mr-2" />
                {config.linkGoogleMaps ? (
                  <a
                    className="hover:text-qbTerracotta transition"
                    href={config.linkGoogleMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {config.ubicacionDireccion}
                  </a>
                ) : (
                  config.ubicacionDireccion
                )}
              </li>
              <li className="flex items-center">
                <Icon name="whatsapp" className="text-qbSage mr-2" />
                <a
                  className="hover:text-qbSage transition"
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {config.contactoWhatsappNumero}
                </a>
              </li>
              <li className="flex items-center">
                <Icon name="envelope" className="text-qbTerracotta mr-2" />
                <a
                  className="hover:text-qbTerracotta transition"
                  href={`mailto:${config.contactoEmail}`}
                >
                  {config.contactoEmail}
                </a>
              </li>
              {config.horaApertura && config.horaCierre && (
                <li className="flex items-center">
                  <Icon name="clock" className="text-qbSage mr-2" /> Lunes a Sábado:{" "}
                  {config.horaApertura} - {config.horaCierre}
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#ECE7DE]/60">
          <p>
            © {anio} QBusiness Media. Todos los derechos reservados. Dirección
            General: {config.directorNombre}.
          </p>
          <div className="flex space-x-4 text-base">
            {config.linkInstagram && (
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-qbTerracotta transition"
                href={config.linkInstagram}
                aria-label="Instagram"
              >
                <Icon name="instagram" />
              </a>
            )}
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-qbSage transition"
              href={whatsapp}
              aria-label="WhatsApp"
            >
              <Icon name="whatsapp" />
            </a>
            {config.linkYoutube && (
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-qbTerracotta transition"
                href={config.linkYoutube}
                aria-label="YouTube"
              >
                <Icon name="youtube" />
              </a>
            )}
            {config.linkTiktok && (
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
                href={config.linkTiktok}
                aria-label="TikTok"
              >
                <Icon name="tiktok" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
