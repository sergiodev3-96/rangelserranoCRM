# 01 — Esquema de Base de Datos (Supabase / Postgres)

> Este documento define el esquema completo. El agente debe generarlo como migraciones SQL en `supabase/migrations/`, una migración por entidad o grupo lógico, nunca como un único archivo monolítico.

## 1. Convenciones generales

- Todas las tablas usan `id uuid primary key default gen_random_uuid()`.
- Todas las tablas tienen `created_at timestamptz not null default now()` y `updated_at timestamptz not null default now()` (con trigger `set_updated_at`).
- **RLS habilitado en TODAS las tablas sin excepción**, incluso si en el MVP la policy es permisiva — nunca dejar una tabla sin RLS.
- Los nombres de tabla y columna en `snake_case`, en español para entidades de negocio (`leads`, `tareas` → en inglés técnico estándar `tasks` para evitar conflictos de keywords, ver detalle abajo) — se usa inglés para nombres de tabla por convención de Supabase/Postgres, y español solo en los valores de campos tipo enum visibles al usuario.

## 2. Tabla `profiles`

Extiende `auth.users` (patrón estándar de Supabase: no se puede añadir columnas directamente a `auth.users`).

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | = `auth.users.id` (FK) |
| full_name | text | |
| email | text | sincronizado desde `auth.users` vía trigger |
| role | text | `'admin'` \| `'comercial'` — check constraint |
| phone | text | nullable |
| avatar_url | text | nullable |
| active | boolean | default true. Admin puede desactivar usuarios sin borrarlos |

**Trigger**: al crear un registro en `auth.users` (signup), crear automáticamente su `profiles` con `role = 'comercial'` por defecto (el Admin lo asciende manualmente después, o se crea directamente como admin desde el dashboard/seed).

**RLS**:
- `SELECT`: cualquier usuario autenticado puede ver todos los perfiles (necesario para mostrar nombres de comerciales asignados).
- `UPDATE`: un usuario puede actualizar su propio perfil (campos no sensibles); solo Admin puede cambiar `role` o `active` de otros.

## 3. Tabla `leads`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| full_name | text | not null |
| phone | text | |
| email | text | nullable |
| status | text | enum-check: `'no_responde'`, `'cliente_potencial'`, `'cuarentena'`, `'realizando_pedido'`, `'pedido'`, `'asnef'`, `'esperando_docs'`, `'rechazado'` |
| source | text | `'tiktok_lead_ads'`, `'meta_lead_ads'`, `'manual'`, `'referral'`, `'organic_web'`, `'newsletter'`, etc. |
| campaign_name | text | nullable — texto libre, ej. "Promo Otoño" |
| vehicle_interest | text | nullable — texto libre o FK futura a catálogo de vehículos |
| assigned_to | uuid | FK → `profiles.id`, **nullable** (NULL = sin asignar, solo posible vía webhook) |
| raw_webhook_payload | jsonb | nullable — guarda el payload original si vino de un webhook, para debugging/auditoría |
| created_at / updated_at | timestamptz | |

**Índices**: `assigned_to`, `status`, `created_at desc`.

**RLS**:
- `SELECT`: todo usuario autenticado ve todos los leads (visibilidad compartida del pipeline, según decisión de negocio).
- `INSERT`: Admin y Comercial pueden crear leads manualmente. El Service Role (webhook) también inserta, pero vía `service_role` key en el Route Handler (bypassa RLS de forma controlada, nunca expuesto al cliente).
- `UPDATE`: Admin puede actualizar cualquier lead. Comercial solo puede actualizar leads donde `assigned_to = auth.uid()`. **Caso especial**: un lead con `assigned_to IS NULL` solo puede ser asignado por Admin (policy explícita que comprueba `role = 'admin'` desde `profiles`).
- `DELETE`: solo Admin (o deshabilitado completamente, usar soft-delete con columna `archived boolean` si se prefiere no permitir borrado físico).

```sql
-- Ejemplo de policy de UPDATE (ilustrativo, ajustar a sintaxis final)
create policy "comercial puede editar sus leads asignados"
on leads for update
using (
  assigned_to = auth.uid()
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
```

## 4. Tabla `lead_events`

Timeline de notas y cambios de estado (lo que en el prototipo se ve como "Notas & Seguimiento").

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| lead_id | uuid | FK → `leads.id`, on delete cascade |
| author_id | uuid | FK → `profiles.id` |
| event_type | text | `'note'`, `'status_change'`, `'whatsapp_sent'`, `'call_logged'` |
| content | text | texto de la nota, o descripción autogenerada del evento |
| metadata | jsonb | ej. `{ "from_status": "...", "to_status": "..." }` |
| created_at | timestamptz | |

**RLS**: mismo criterio que `leads` — visibilidad total, edición restringida a Admin o al comercial asignado al lead padre (vía subquery a `leads.assigned_to`).

## 5. Tabla `tasks`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| title | text | not null |
| description | text | nullable |
| lead_id | uuid | FK → `leads.id`, nullable (puede haber tareas sin lead asociado) |
| assigned_to | uuid | FK → `profiles.id` |
| status | text | `'pendiente'`, `'en_proceso'`, `'revision'`, `'completada'` |
| priority | text | `'baja'`, `'media'`, `'alta'` |
| due_date | date | nullable |
| due_time | time | nullable |
| completed_at | timestamptz | nullable |

**Índices**: `assigned_to`, `status`, `lead_id`.

**RLS**: igual patrón que `leads` (Admin todo, Comercial solo lo asignado a sí mismo para editar; lectura compartida para visibilidad del equipo — a confirmar con cliente si las tareas también deben ser visibles entre comerciales o son privadas; **por defecto en este esquema se asume visibilidad compartida, igual que leads**, ajustable con una sola policy si el cliente prefiere privacidad total de tareas).

## 6. Tabla `simulations`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| lead_id | uuid | FK → `leads.id`, **nullable** (simulación "libre" sin lead asociado) |
| created_by | uuid | FK → `profiles.id` |
| vehicle_price | numeric(10,2) | |
| down_payment | numeric(10,2) | |
| financed_capital | numeric(10,2) | calculado, guardado para histórico aunque cambie la fórmula en el futuro |
| entity_name | text | ej. "Santander Consumer" |
| tin_rate | numeric(5,2) | TIN en % |
| tae_rate | numeric(5,2) | TAE en % |
| term_months | integer | plazo elegido/comparado |
| monthly_payment | numeric(10,2) | |
| total_interest | numeric(10,2) | |
| total_payable | numeric(10,2) | |
| is_draft | boolean | default true. true = calculadora libre sin guardar formalmente; false = simulación formal asociada a un lead |

**RLS**: si `lead_id` no es NULL, hereda el criterio de `leads` (Admin todo, Comercial solo si es su lead). Si `lead_id` es NULL (simulación libre), solo el propio `created_by` puede verla/editarla (o Admin).

## 7. Tabla `orders` (Pedidos Finalizados)

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| lead_id | uuid | FK → `leads.id` |
| simulation_id | uuid | FK → `simulations.id`, nullable |
| client_name | text | denormalizado para histórico aunque el lead cambie de nombre |
| vehicle | text | |
| price | numeric(10,2) | |
| bank_entity | text | |
| monthly_payment | numeric(10,2) | |
| status | text | `'aprobado'`, `'denegado'`, `'en_revision'` |
| closed_at | date | |
| closed_by | uuid | FK → `profiles.id` |

**RLS**: lectura compartida (histórico visible para todo el equipo); escritura solo Admin o el comercial que cerró el lead origen.

## 8. Tabla `whatsapp_messages`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| lead_id | uuid | FK → `leads.id` |
| sent_by | uuid | FK → `profiles.id` |
| template_name | text | `'contacto_inicial'`, `'seguimiento_financiacion'`, `'cita_confirmada'`, `'operacion_rechazada'`, `'custom'` |
| message_body | text | |
| provider | text | `'mock'`, `'meta_cloud_api'`, `'twilio'` |
| provider_message_id | text | nullable — id devuelto por el proveedor real cuando se integre |
| status | text | `'sent'`, `'failed'`, `'simulated'` |
| created_at | timestamptz | |

**RLS**: igual patrón que `lead_events`.

## 9. Tabla `webhook_logs`

Auditoría de todo lo que llega por webhooks externos (TikTok, futuros).

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| source | text | `'tiktok_lead_ads'`, etc. |
| payload | jsonb | payload completo recibido |
| processed | boolean | |
| lead_id | uuid | FK → `leads.id`, nullable (si el procesado creó un lead) |
| error | text | nullable — si falló el parseo/validación |
| created_at | timestamptz | |

**RLS**: solo Admin puede leer (es información de diagnóstico técnico, no de negocio). Inserción solo vía `service_role` desde el Route Handler.

## 10. Resumen de relaciones

```
profiles 1───* leads (assigned_to)
leads    1───* lead_events
leads    1───* tasks
leads    1───* simulations
leads    1───* orders
leads    1───* whatsapp_messages
simulations 1───0..1 orders
profiles 1───* tasks (assigned_to)
profiles 1───* simulations (created_by)
```

## 11. Notas de implementación para el agente

- Genera cada tabla en su propia migración numerada (`0001_profiles.sql`, `0002_leads.sql`, ...) para poder revertir/auditar cambios fácilmente.
- Escribe las policies de RLS en la misma migración que crea la tabla, nunca como paso separado "para después".
- Añade los índices al final de cada migración, no en una migración aparte.
- Considera crear una función Postgres `is_admin()` reutilizable (`security definer`) para no repetir el subquery `exists (select 1 from profiles where id = auth.uid() and role = 'admin')` en cada policy.
