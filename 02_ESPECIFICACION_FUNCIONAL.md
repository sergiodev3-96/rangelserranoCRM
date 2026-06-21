# 02 — Especificación Funcional por Módulo

> Comportamiento esperado de cada pantalla. El prototipo HTML (`rangel_serrano_crm.html`) es la referencia visual; este documento añade la lógica de negocio y de datos que el HTML estático no contiene.

## 1. Layout general

- Sidebar fijo a la izquierda (colapsable en móvil) con: logo, botón "New Simulation", navegación (Leads, Tareas, Simulaciones, Pedidos Finalizados), y en la parte inferior Settings/Support. **Añadir** un enlace "Usuarios" visible solo para Admin (gestión de comerciales).
- Header superior con buscador global y notificaciones. El buscador en el MVP puede limitarse a buscar por nombre de lead (Postgres `ilike`); búsqueda global multi-entidad queda fuera del MVP salvo que se priorice en Fase posterior.
- Todas las vistas son rutas reales de Next.js (no SPA de un solo archivo como el prototipo): `/leads`, `/leads/[id]`, `/tareas`, `/simulaciones`, `/pedidos`.

## 2. Módulo: Leads (`/leads`)

### Datos
Tabla paginada/infinita de la tabla `leads`, con join a `profiles` para mostrar el nombre del comercial asignado.

### Comportamiento
- Columnas: Nombre, Campaña/Fuente, Fecha de registro, Estado (badge de color según mapeo del prototipo), Último contacto (derivado del último `lead_events`), **Asignado a** (nueva columna, no estaba en el HTML — necesaria ahora que hay multi-usuario).
- Filtro por estado y por "sin asignar" (solo relevante/visible para Admin).
- Comercial ve todos los leads pero los que no son suyos se muestran con estilo visualmente atenuado o un badge "no editable"; el click sigue llevando al detalle (modo solo lectura si no es el propietario).
- Leads sin asignar (`assigned_to IS NULL`) se agrupan visualmente arriba de la tabla, solo para Admin, con acción rápida "Asignar a..." (dropdown de comerciales activos).
- Click en una fila → navega a `/leads/[id]`.
- Botón flotante "+" → modal/formulario de creación manual de lead (campos: nombre, teléfono, email opcional, fuente, interés, comercial asignado si es Admin / auto-asignado a sí mismo si es Comercial).

### Validación (Zod)
- `full_name`: requerido, mínimo 3 caracteres.
- `phone`: formato español opcional pero recomendado (no bloquear creación si falta, es un CRM de captación rápida).

## 3. Módulo: Lead Detail (`/leads/[id]`)

### Datos
- Cabecera: datos del lead + badge de estado + acciones (Editar, Convertir a Cliente).
- Columna izquierda: tarjetas de contacto rápido (llamar, WhatsApp), bloque de detalles de campaña, selector rápido de estado.
- Columna derecha: timeline de `lead_events` (notas + cambios de estado, orden cronológico inverso) y panel de `tasks` filtradas por `lead_id`.

### Comportamiento
- **Selector rápido de estado**: al hacer click en un botón de estado, se actualiza `leads.status` y se inserta automáticamente un `lead_events` con `event_type = 'status_change'` y metadata `{ from_status, to_status }`. Esto reemplaza el botón estático del prototipo por una Server Action real.
- **Añadir nota**: el input de "Escribe una nota rápida..." inserta un `lead_events` con `event_type = 'note'`. El timeline se revalida (Next.js `revalidatePath` o realtime subscription).
- **Enviar WhatsApp**: el modal de plantillas, al pulsar una plantilla y confirmar envío, llama a la interfaz `lib/whatsapp/provider.ts`. En el MVP (mock provider) esto: (1) inserta el registro en `whatsapp_messages` con `status = 'simulated'`, (2) crea un `lead_events` de tipo `whatsapp_sent` para que quede en el timeline, (3) muestra confirmación visual. Cuando se integre el proveedor real, solo cambia la implementación de `provider.ts`, no el resto del flujo.
- **Nueva tarea**: el modal crea un registro en `tasks` con `lead_id` = lead actual.
- **Convertir a Cliente**: cambia `status` a un estado terminal (a definir con cliente si es `'pedido'` o un nuevo estado `'cliente'`) y puede disparar la creación de un borrador en `orders` (a decidir en Fase 3).
- **Permisos**: si el usuario es Comercial y `assigned_to !== auth.uid()`, todos los controles de edición (notas, estado, tareas, WhatsApp) se muestran deshabilitados o se ocultan; el detalle es visible en modo solo lectura. Si es Admin, todo habilitado siempre.

## 4. Módulo: Tareas (`/tareas`)

### Datos
Tablero Kanban con 4 columnas fijas: Pendiente, En proceso, Revisión, Completada (mapean a `tasks.status`).

### Comportamiento
- Drag & drop entre columnas actualiza `tasks.status` (Server Action on drop; UI optimista con rollback si falla).
- Cada tarjeta muestra: prioridad (badge color), título, lead asociado (si tiene), fecha límite.
- Comercial solo puede mover/editar/eliminar tareas propias (`assigned_to = auth.uid()`); puede ver las de otros comerciales en modo lectura si se decide mantener visibilidad compartida (confirmar con cliente; si se prefiere privacidad total de tareas por comercial, ajustar la policy de `SELECT` en `01_ESQUEMA_BASE_DATOS.md` §5).
- Vista alternativa "List" (toggle ya presente en el prototipo) — puede implementarse en una fase posterior; el toggle puede quedar visualmente presente pero deshabilitado en el MVP si no da tiempo.
- Tareas vencidas (`due_date < today` y `status != 'completada'`) se resaltan visualmente (igual que el prototipo: borde rojo, texto "Vence hoy"/badge de vencidas).

## 5. Módulo: Simulaciones (`/simulaciones`)

### Datos
Formulario de parámetros (precio vehículo, entrada, entidad financiera con su TIN) + cálculo de cuotas para varios plazos fijos (60/72/84/96/108/120 meses, igual que el prototipo).

### Lógica de cálculo (debe vivir en `lib/finance/`, pura y testeable)
- Fórmula de amortización francesa estándar: `PMT = P × (r/n) / [1 - (1 + r/n)^(-n×t)]`.
- A partir del TIN introducido, calcular el TAE aproximado (puede usarse una aproximación simple +0.3% como en el prototipo para el MVP, documentando que es una aproximación, no el cálculo legal exacto de TAE que exige incluir comisiones — anotar esto como deuda técnica conocida).
- Capital financiado = precio vehículo − entrada.

### Comportamiento
- **Modo libre**: el usuario cambia parámetros y ve resultados al instante (cálculo en cliente, sin tocar base de datos) — útil para simular delante de un cliente sin necesidad de crear nada en BD.
- **Guardar simulación**: botón explícito (no presente en el HTML original, añadir a la UI real) que persiste el resultado en `simulations`. Si se guarda desde el contexto de un Lead Detail, `lead_id` se rellena automáticamente y `is_draft = false`. Si se guarda sin contexto de lead, queda con `lead_id = NULL` y solo visible para su creador.
- Historial de simulaciones guardadas de un lead se muestra en su Lead Detail (nuevo bloque, no presente en el HTML — a añadir en Fase 3).

## 6. Módulo: Pedidos Finalizados (`/pedidos`)

### Datos
Tabla de `orders` con filtro por estado (Aprobado/Denegado/En revisión).

### Comportamiento
- Solo lectura para Comercial salvo sobre sus propios pedidos cerrados (edición limitada, ej. corregir un dato antes de cerrarlo definitivamente).
- Exportar a CSV: el botón existe en el prototipo deshabilitado ("opacity-50 cursor-not-allowed"); implementarlo de verdad en el MVP es deseable pero no bloqueante — puede quedar para Fase 4.
- Un pedido se crea normalmente desde el flujo de "Convertir a Cliente" de un Lead, no manualmente desde esta vista (mantener esta vista como histórico, no como formulario de alta libre, salvo que el cliente pida lo contrario).

## 7. Módulo: Administración de Usuarios (`/admin/usuarios`) — solo Admin

No existía en el prototipo HTML pero es obligatorio para que el sistema de roles funcione:

- Listado de `profiles` con su rol y estado activo/inactivo.
- Invitar nuevo usuario (Supabase Auth `inviteUserByEmail` desde una Edge Function o Server Action con `service_role`, nunca desde el cliente).
- Cambiar rol de un usuario (Admin ↔ Comercial).
- Desactivar usuario (`active = false`) — un usuario inactivo no puede iniciar sesión (verificar en middleware tras `active = false`, o usar `auth.users.banned_until` de Supabase si se prefiere ese mecanismo nativo en vez de un campo propio).

## 8. Webhook de leads — comportamiento detallado

1. TikTok Lead Ads envía un POST a `app/api/webhooks/tiktok-leads/route.ts`.
2. El endpoint valida la autenticidad de la petición (verificar mecanismo vigente de TikTok — puede ser un token compartido en query param o cabecera, **comprobar documentación actual de TikTok Lead Ads antes de implementar, no asumir**).
3. Se inserta siempre un registro en `webhook_logs` con el payload crudo, **incluso si falla el parseo** (para no perder ningún lead por un cambio de formato no previsto).
4. Si el parseo tiene éxito, se crea el `lead` con `assigned_to = NULL`, `source = 'tiktok_lead_ads'`, `raw_webhook_payload` = payload original.
5. (Opcional Fase 4) Disparar una notificación in-app o email a los Admin avisando de un lead nuevo sin asignar.

## 9. Plantillas de WhatsApp (contenido inicial)

Migrar tal cual las 4 plantillas ya redactadas en el prototipo (Contacto Inicial, Seguimiento Financiación, Cita Confirmada, Operación Rechazada) a una tabla `whatsapp_templates` (opcional) o a un archivo de configuración `lib/whatsapp/templates.ts` si no se requiere edición desde la UI en el MVP. Si el cliente quiere poder editar las plantillas sin tocar código, crear la tabla; si no, archivo de configuración es más simple y suficiente para el MVP.
