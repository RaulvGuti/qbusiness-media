## Descripción

<!-- Explica qué resuelve o añade este PR y por qué -->

## Cambios realizados

- 

## Issues relacionados

Closes #

## Tipo de cambio

- [ ] Feature (nueva funcionalidad)
- [ ] Fix (corrección de error)
- [ ] Security (cierra una vulnerabilidad o exposición de datos)
- [ ] Refactor (sin cambio funcional ni de comportamiento)
- [ ] Perf (optimización y rendimiento)
- [ ] Docs (documentación técnica o de usuario)
- [ ] Chore (dependencias, Prisma, Supabase o configuración de CI/CD)

## Cómo probar localmente (Windows / Node)

1. Ejecutar migraciones o cliente si hubo cambios en Prisma: `npx prisma generate`
2. Levantar el proyecto: `npm run dev`
3. Probar el flujo:

## Checklist de calidad

- [ ] Las comprobaciones locales pasan (`npm run build`)
- [ ] No se dejaron `console.log` residuales con datos sensibles
- [ ] Se documentaron nuevas variables en `.env.example` si aplica
- [ ] No se subieron archivos prohibidos (`.env`, `.env.local`, llaves privadas)

## Checklist de seguridad (Server Actions / APIs)

- [ ] Toda mutación o consulta a la base de datos corre del lado del servidor
- [ ] No se exponen llaves de servicio (`SUPABASE_SERVICE_ROLE_KEY` o credenciales directas de Postgres) al bundle del cliente
- [ ] Las consultas usan Prisma u operaciones parametrizadas, sin concatenaciones crudas
- [ ] Se validaron los tipos de entrada mediante esquemas o tipado estricto

## Notas de despliegue o base de datos

<!-- Si agregaste campos a schema.prisma, ejecutaste npx prisma db push o requieres variables nuevas -->