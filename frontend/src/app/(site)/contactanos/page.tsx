import { Icon } from "@/components/ui/Icon";
import ContactForm from '@/components/leads/ContactForm';
import QuoteForm from '@/components/leads/QuoteForm';
import MapEmbed from '@/components/leads/MapEmbed';

export default function ContactanosPage() {
  return (
    <section className="page-stack">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-qbBorder pb-6">
        <div>
          <span className="text-xs font-bold text-qbTerracotta uppercase tracking-widest">Contacto</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-qbInk mt-1">Hablemos de tu Proyecto</h2>
          <p className="text-sm text-qbMuted">Cuéntanos qué necesitas y te ayudamos con una propuesta a tu medida.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <ContactForm />
          <MapEmbed />
        </div>
        <div className="space-y-6">
          <QuoteForm />
          <div className="bg-qbChalk border border-qbBorder rounded-3xl p-6 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-qbInk uppercase tracking-wider">Información de contacto</h3>
            <div className="space-y-2 text-sm text-qbMuted">
              <p className="flex items-center gap-2">
                <Icon name="envelope" />
                <span>hola@qbusinessmedia.com</span>
              </p>
              <p className="flex items-center gap-2">
                <Icon name="whatsapp" />
                <span>+502 5944 8587</span>
              </p>
              <p className="flex items-center gap-2">
                <Icon name="location-dot" />
                <span>Quetzaltenango, Guatemala</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}