-- ==========================================
-- Migración: configuracion_textos_sitio
-- Requiere: 000016, 000034 y 000038.
--
-- 1) Amplía los grupos permitidos de configuracion_sitio con 'general' y
--    'sobre'. El grupo 'general' concentra los textos del hero, header y
--    footer; 'sobre' los del modal "Sobre QBusiness Media".
-- 2) Deja valores iniciales editables para todo el contenido que antes estaba
--    escrito en los componentes públicos. Se reutilizan las claves que ya
--    existían (contacto/correo, contacto/whatsapp, redes/*, ubicacion/direccion
--    y menu/whatsapp_cta) para no duplicar datos.
-- 3) No se tocan las políticas RLS: la lectura sigue siendo pública y la
--    escritura exclusiva del administrador principal (000038).
-- ==========================================

alter table public.configuracion_sitio
    drop constraint if exists configuracion_sitio_grupo_check;

alter table public.configuracion_sitio
    add constraint configuracion_sitio_grupo_check
    check (grupo in (
        'menu', 'modulos', 'formularios', 'contacto', 'redes',
        'ubicacion', 'estudio', 'general', 'sobre'
    ));

insert into public.configuracion_sitio as c (grupo, clave, valor) values
    -- Hero y marca
    ('general', 'hero_subtitulo',
     'Videos que hacen que tu marca se vea del tamaño que es. Soluciones audiovisuales profesionales, fotografía comercial, podcasts y locación de estudio en Quetzaltenango bajo la dirección de {director}.'),
    ('general', 'director_nombre', 'Luis Gonzales'),
    ('general', 'slogan', 'Tu historia, nuestra estrategia.'),
    ('general', 'descripcion_footer',
     'Somos una agencia de medios y creatividad dedicada a contar historias que impactan. Quetzaltenango, Guatemala.'),
    ('menu', 'whatsapp_cta',
     'Hola QBusiness Media, quisiera cotizar un servicio audiovisual'),

    -- Botones del header
    ('general', 'header_cta_whatsapp', 'Cotizar WhatsApp'),
    ('general', 'header_sobre', 'Sobre Qbusiness MEDIA'),

    -- Métricas del hero
    ('general', 'hero_stat_1_numero', '+150'),
    ('general', 'hero_stat_1_label', 'Proyectos Realizados'),
    ('general', 'hero_stat_2_numero', '100%'),
    ('general', 'hero_stat_2_label', 'Clientes Satisfechos'),
    ('general', 'hero_stat_3_numero', '4K Cinema'),
    ('general', 'hero_stat_3_label', 'Estándar de Calidad'),

    -- Listas del footer
    ('general', 'footer_servicios',
     E'Producción Audiovisual 4K\nContenido Vertical 9:16\nFotografía Comercial de Producto\nProducción de Podcasts Broadcast\nRenta de Locación y Ciclorama\nCobertura de Eventos con Drone'),
    ('general', 'footer_navegacion',
     E'Inicio | /\nPortafolio Multimedia | /portafolio\nBackstage & Producción | /backstage\nReseñas de Clientes | /resenas\nRenta de Estudio | /renta\nApoyo Social | /apoyo'),

    -- Modal Sobre QBusiness Media
    ('sobre', 'sobre_nosotros_titulo', 'Sobre QBusiness Media'),
    ('sobre', 'sobre_nosotros_parrafo_1',
     'Fundada en Quetzaltenango bajo la visión directiva de {director}, QBusiness Media se ha consolidado como una de las agencias de producción audiovisual y estrategia digital con mayor crecimiento y rigor técnico en el occidente de Guatemala.'),
    ('sobre', 'sobre_nosotros_parrafo_2',
     'Nuestro lema "{slogan}" resume el compromiso de convertir las metas de comunicación de marcas corporativas, pymes e instituciones en piezas audiovisuales memorables con calidad cinematográfica.'),
    ('sobre', 'stat_1_numero', '+8 Años'),
    ('sobre', 'stat_1_label', 'Trayectoria'),
    ('sobre', 'stat_2_numero', 'Top 1'),
    ('sobre', 'stat_2_label', 'Estudio en Xela'),
    ('sobre', 'stat_3_numero', '4K / Cinema'),
    ('sobre', 'stat_3_label', 'Equipo Pro'),

    -- Contacto, redes y ubicación (rellena los null de 000034)
    ('contacto', 'correo', 'contacto@qbusinessmedia.gt'),
    ('contacto', 'whatsapp', '+502 5944 8587'),
    ('redes', 'instagram', 'https://instagram.com/qbusinessmedia'),
    ('redes', 'youtube', 'https://youtube.com/@qbusinessmedia'),
    ('redes', 'tiktok', 'https://tiktok.com/@qbusinessmedia'),
    ('ubicacion', 'direccion', 'Zona 3, Quetzaltenango, Guatemala'),
    ('ubicacion', 'link_google_maps',
     'https://www.google.com/maps/search/?api=1&query=Zona+3%2C+Quetzaltenango%2C+Guatemala')
on conflict (grupo, clave) do update
    set valor = coalesce(c.valor, excluded.valor);
