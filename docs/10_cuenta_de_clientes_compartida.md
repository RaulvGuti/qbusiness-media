# Cuenta compartida de clientes

Este documento explica la cuenta de **cliente** compartida por el equipo, para qué sirve,
cómo se creó y qué riesgos implica. La contraseña **no se guarda en el repositorio**.

## 1. Qué es

- Correo: `equipo@qbusinessmedia.gt`
- Nombre visible: `Equipo QBusiness Media`
- Tipo: **cliente** (`auth.users` + fila en `clientes`).
- No tiene fila en `administradores`, así que **no** tiene rol `admin_principal` ni
  `secretaria` y **no** puede entrar al panel `/admin`.

Sirve para que varias personas del equipo usen las funciones de cliente del sitio (por
ejemplo reservar el estudio o dejar reseñas) sin crear una cuenta por persona.

## 2. Cómo se creó

1. La cuenta se dio de alta en Supabase Auth con `email_confirm: true` usando la Admin API
   (`service_role`) desde un script temporal que **no** se versionó.
2. El trigger `handle_new_user` (`000013_trigger_auth_nuevo_cliente.sql`) creó
   automáticamente la fila correspondiente en `clientes`.
3. Se verificó que **no** exista una fila en `administradores` para ese usuario.
4. Se probó el inicio de sesión con la clave pública (`anon`) y se cerró la sesión.

No se agregó una migración porque una migración no debe contener contraseñas y la cuenta
vive en `auth.users`, no en una tabla del esquema público.

## 3. Cómo entrar

- Ir a `/login`.
- Usar `equipo@qbusinessmedia.gt` y la contraseña compartida por el responsable.
- La cuenta entra como cliente y no puede abrir `/admin`.

## 4. Riesgos

- **Sin trazabilidad individual:** las acciones quedan a nombre de una sola cuenta, así que
  no se puede saber qué persona hizo cada cosa.
- **Acceso compartido:** cualquiera con la contraseña ve el historial y los datos de esa
  cuenta.
- **Rotación manual:** si alguien sale del equipo hay que cambiar la contraseña.

Para trabajo interno del panel se recomienda una cuenta por persona desde
`/admin/perfil` (ver [`07_roles_y_permisos.md`](./07_roles_y_permisos.md)).

## 5. Cómo rotar o desactivar la cuenta

1. Entrar a Supabase Dashboard → **Authentication** → **Users**.
2. Buscar `equipo@qbusinessmedia.gt`.
3. Para rotar: restablecer la contraseña y comunicarla solo al equipo.
4. Para desactivar: eliminar la cuenta. La fila de `clientes` se borra en cascada por la
   llave foránea de `000012`.

También se puede hacer con la Admin API (`auth.admin.updateUserById` o
`auth.admin.deleteUser`), siempre fuera del repositorio y sin guardar la clave.

## 6. Verificación rápida

Con una sesión de cliente:

```sql
select c.id, c.correo, c.nombre_completo
from public.clientes c
where c.correo = 'equipo@qbusinessmedia.gt';

select a.id
from public.administradores a
join public.clientes c on c.id = a.id
where c.correo = 'equipo@qbusinessmedia.gt';
```

El primer `select` debe devolver una fila y el segundo **ninguna**.
