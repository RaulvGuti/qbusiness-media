-- ==========================================
-- Migración: eliminar_usuarios
-- `usuarios` ya no la referencia nadie (portafolio, leads, solicitudes y
-- reservas se reasignaron en 000014 y 000015). Se elimina sin CASCADE a
-- propósito: si quedara alguna dependencia, falla en vez de borrarla.
--
-- Antes de aplicarla, revisa los NOTICE de 000012: lo que no se copió a
-- administradores/clientes se pierde con este DROP.
-- ==========================================

drop table usuarios;
