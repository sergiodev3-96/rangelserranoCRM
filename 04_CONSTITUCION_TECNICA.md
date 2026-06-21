# 04 — Constitución Técnica (Fuente de Verdad)

> **Generado por**: Claude Opus 4.6 (Arquitecto) — Fase 0
> **Fecha**: 2026-06-21
> **Propósito**: Este documento es la referencia autoritativa para Gemini Flash durante la implementación. En caso de conflicto con `01_`, `02_` o `03_`, este documento prevalece. Flash no debe inventar convenciones ni tomar decisiones de arquitectura — todo está fijado aquí.

---

## Índice

1. [Decisiones de Arquitectura Cerradas](#1-decisiones-de-arquitectura-cerradas)
2. [Convenciones de Nombres](#2-convenciones-de-nombres)
3. [Variables de Entorno](#3-variables-de-entorno)
4. [DDL Completo (Migraciones SQL)](#4-ddl-completo-migraciones-sql)
5. [Tipos TypeScript](#5-tipos-typescript)
6. [Esquemas de Validación Zod](#6-esquemas-de-validación-zod)
7. [Firmas de Server Actions](#7-firmas-de-server-actions)
8. [Contrato WhatsApp Provider](#8-contrato-whatsapp-provider)
9. [Contrato Finance Library](#9-contrato-finance-library)
10. [Estructura de Archivos Detallada](#10-estructura-de-archivos-detallada)
11. [Plan de Migraciones](#11-plan-de-migraciones)

---

## 1. Decisiones de Arquitectura Cerradas

Cada decisión aquí cierra una ambigüedad que los documentos `01_`–`03_` dejaban abierta.

### 1.1 Visibilidad de tareas entre comerciales
**Decisión**: Visibilidad compartida (SELECT para todos los autenticados). Los comerciales pueden ver todas las tareas del equipo pero solo editar/mover las propias.
**Razón**: Coherencia con el modelo de leads (visibilidad compartida del pipeline). Permite a un comercial saber qué tareas tiene su compañero sobre un lead compartido. Una sola policy de UPDATE restringe la edición.

### 1.2 Borrado de leads: ¿físico o soft-delete?
**Decisión**: Soft-delete con columna `archived boolean default false`. No se permite `DELETE` físico sobre la tabla `leads` por ningún rol. Los leads archivados se filtran por defecto en las queries (`WHERE archived = false`), pero Admin puede verlos activando un filtro explícito.
**Razón**: En un CRM de financiación, perder un lead con historial de eventos y simulaciones es inaceptable para auditoría.

### 1.3 Estado para "Convertir a Cliente"
**Decisión**: Se usa el estado existente `'pedido'` como estado terminal que indica "lead convertido en cliente / pedido realizado". **No se añade un nuevo estado `'cliente'`**.
**Razón**: El prototipo HTML ya usa "Pedido" como el estado final positivo. Añadir un estado extra rompería la consistencia visual y el mapeo de badges.

### 1.4 "Convertir a Cliente" y tabla `orders`
**Decisión**: Al pulsar "Convert to Client" desde Lead Detail, se ejecuta la siguiente secuencia atómica (Server Action):
1. `leads.status` → `'pedido'`
2. Se crea un registro en `lead_events` con `event_type = 'status_change'`
3. Se crea un borrador en `orders` con `status = 'en_revision'`, `closed_at = NULL`, enlazando `lead_id` y `simulation_id` (la más reciente del lead, si existe, o NULL)
4. Los campos `client_name`, `vehicle`, `price` se copian/desnormalizan desde el lead y la simulación asociada

El Admin o el comercial asignado puede después cambiar `orders.status` a `'aprobado'` o `'denegado'` desde la vista `/pedidos`, rellenando `closed_at` en ese momento.

### 1.5 Aproximación de TAE
**Decisión**: TAE = TIN + 0.30 puntos porcentuales (constante aditiva, no multiplicativa). Ejemplo: TIN 6.49% → TAE ≈ 6.79%.
**Razón**: Es la aproximación usada en el prototipo. Se documenta como deuda técnica con un comentario `// DEUDA_TECNICA: La TAE legal requiere incluir comisiones de apertura, seguros y otros costes. Esta aproximación es solo orientativa.` en `lib/finance/calculator.ts`.

### 1.6 Almacenamiento de plantillas WhatsApp
**Decisión**: Archivo de configuración `lib/whatsapp/templates.ts` con un array tipado. **No se crea tabla en BD** en el MVP.
**Razón**: El cliente no necesita editar plantillas desde la UI en el MVP. Un archivo de código es más simple de mantener y desplegar. Si en el futuro se necesita edición dinámica, se migra a tabla.

### 1.7 Mecanismo de desactivación de usuarios
**Decisión**: Campo propio `profiles.active` + verificación en middleware de Next.js. **No usar** `auth.users.banned_until` de Supabase.
**Razón**: `banned_until` no permite distinguir entre "baneado temporalmente" y "desactivado permanentemente", y requiere acceso con `service_role` para consultarlo. Verificar `profiles.active` en el middleware es más simple, controlable y auditable.

### 1.8 Paginación de leads
**Decisión**: Paginación basada en cursor (offset/limit) del lado servidor con 20 leads por página. No infinite scroll en el MVP.
**Razón**: Más predecible para el usuario y más simple de implementar con Server Components. El equipo del cliente es pequeño (~5 comerciales), el volumen esperado es < 1000 leads/mes.

### 1.9 Toggle Board/List en Tareas
**Decisión**: El toggle está presente visualmente pero la vista "List" queda deshabilitada en el MVP (`opacity-50 cursor-not-allowed`). Solo funciona la vista Board (Kanban).
**Razón**: Implementar dos vistas duplica el trabajo. El Kanban es la vista prioritaria según `02_`.

### 1.10 Buscador global
**Decisión**: En el MVP, el buscador solo busca leads por nombre (`full_name ILIKE '%query%'`). Búsqueda multi-entidad queda fuera del MVP.
**Razón**: Explícitamente indicado en `02_` §1.

### 1.11 Realtime de Supabase
**Decisión**: **No se usa Realtime en ninguna fase del MVP** (Fases 1–5). Se usa `revalidatePath` de Next.js para refrescar datos tras mutaciones.
**Razón**: Explícitamente indicado en `03_` notas finales. Realtime es mejora de UX post-MVP.

### 1.12 Drag & drop en Kanban
**Decisión**: Usar la librería `@hello-pangea/dnd` (fork mantenido de `react-beautiful-dnd`, compatible con React 19).
**Razón**: Es la librería de drag & drop más madura para Kanban, con soporte de React 19 confirmado en su repositorio. TanStack Query **no es necesario** para este caso — el Kanban usa optimistic updates con Server Actions y `useOptimistic` de React 19.

---

## 2. Convenciones de Nombres

### 2.1 Archivos y Carpetas

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componente React | `PascalCase.tsx` | `LeadTable.tsx`, `KanbanColumn.tsx` |
| Page / Layout (App Router) | `page.tsx`, `layout.tsx` | `app/(dashboard)/leads/page.tsx` |
| Server Action | `kebab-case.ts` en carpeta `actions/` | `lib/actions/leads.ts` |
| Utilidad/Lib | `kebab-case.ts` | `lib/finance/calculator.ts` |
| Tipo/Interface | `kebab-case.ts` en carpeta `types/` | `types/leads.ts` |
| Esquema Zod | `kebab-case.ts` en carpeta `lib/validations/` | `lib/validations/leads.ts` |
| Migración SQL | `NNNN_nombre_descriptivo.sql` | `0001_profiles.sql` |
| Componente UI genérico | `PascalCase.tsx` en `components/ui/` | `components/ui/Badge.tsx` |
| Componente de dominio | `PascalCase.tsx` en `components/{dominio}/` | `components/leads/LeadStatusBadge.tsx` |

### 2.2 Componentes React

```
Componente         → Nombre archivo            → Export
─────────────────────────────────────────────────────────
LeadTable          → components/leads/LeadTable.tsx        → export default
LeadStatusBadge    → components/leads/LeadStatusBadge.tsx  → export default
LeadDetailHeader   → components/leads/LeadDetailHeader.tsx → export default
LeadTimeline       → components/leads/LeadTimeline.tsx     → export default
LeadNoteInput      → components/leads/LeadNoteInput.tsx    → export default
LeadStatusSelector → components/leads/LeadStatusSelector.tsx → export default
LeadAssignDropdown → components/leads/LeadAssignDropdown.tsx → export default
LeadCreateModal    → components/leads/LeadCreateModal.tsx  → export default

KanbanBoard        → components/tareas/KanbanBoard.tsx     → export default
KanbanColumn       → components/tareas/KanbanColumn.tsx    → export default
TaskCard           → components/tareas/TaskCard.tsx         → export default
TaskCreateModal    → components/tareas/TaskCreateModal.tsx  → export default

SimulationForm     → components/simulaciones/SimulationForm.tsx     → export default
AmortizationGrid   → components/simulaciones/AmortizationGrid.tsx   → export default
AmortizationCard   → components/simulaciones/AmortizationCard.tsx   → export default
SimulationSummary  → components/simulaciones/SimulationSummary.tsx  → export default

OrderTable         → components/pedidos/OrderTable.tsx      → export default
OrderStatusBadge   → components/pedidos/OrderStatusBadge.tsx → export default

UserTable          → components/admin/UserTable.tsx          → export default
UserInviteModal    → components/admin/UserInviteModal.tsx    → export default

WhatsAppModal      → components/leads/WhatsAppModal.tsx      → export default
Sidebar            → components/ui/Sidebar.tsx               → export default
Header             → components/ui/Header.tsx                → export default
Badge              → components/ui/Badge.tsx                 → export default
Modal              → components/ui/Modal.tsx                 → export default
SearchInput        → components/ui/SearchInput.tsx           → export default
Pagination         → components/ui/Pagination.tsx            → export default
```

### 2.3 Tipos TypeScript
- Tipos de entidad: `PascalCase`, singular (`Lead`, `Task`, `Simulation`)
- Enums como union types: `LeadStatus`, `TaskStatus`, `TaskPriority`, etc.
- Props de componentes: `{NombreComponente}Props` (e.g. `LeadTableProps`)
- Tipo de respuesta de Server Actions: `ActionResult<T>` genérico

### 2.4 Tablas SQL
Todas en `snake_case`, en inglés: `profiles`, `leads`, `lead_events`, `tasks`, `simulations`, `orders`, `whatsapp_messages`, `webhook_logs`.

### 2.5 Políticas RLS
Formato: `"{tabla}_{operacion}_{descripcion}"` en inglés, snake_case entre comillas.
Ejemplo: `"leads_update_own_or_admin"`, `"tasks_select_authenticated"`.

---

## 3. Variables de Entorno

```env
# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...           # anon key (o sb_publishable_xxx si disponible)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...                # service_role (o sb_secret_xxx si disponible)

# === Webhooks ===
TIKTOK_WEBHOOK_VERIFY_TOKEN=token-secreto-compartido   # Token para validar requests de TikTok Lead Ads

# === WhatsApp (placeholders — no necesarios hasta Fase 6) ===
WHATSAPP_PROVIDER=mock                                  # 'mock' | 'meta_cloud_api' | 'twilio'
# Si meta_cloud_api:
# WHATSAPP_META_ACCESS_TOKEN=
# WHATSAPP_META_PHONE_NUMBER_ID=
# WHATSAPP_META_BUSINESS_ACCOUNT_ID=
# Si twilio:
# WHATSAPP_TWILIO_ACCOUNT_SID=
# WHATSAPP_TWILIO_AUTH_TOKEN=
# WHATSAPP_TWILIO_FROM_NUMBER=

# === App ===
NEXT_PUBLIC_APP_URL=https://crm.rangelyserrano.com      # URL base de la app desplegada
```

---

## 4. DDL Completo (Migraciones SQL)

### 4.0 Migración `0000_helpers.sql` — Funciones reutilizables

```sql
-- Función reutilizable para verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Trigger genérico para actualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### 4.1 Migración `0001_profiles.sql`

```sql
CREATE TABLE public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text NOT NULL,
  email      text NOT NULL,
  role       text NOT NULL DEFAULT 'comercial'
             CHECK (role IN ('admin', 'comercial')),
  phone      text,
  avatar_url text,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger: updated_at
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: auto-crear perfil al signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Índices
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_active ON public.profiles(active);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND active = (SELECT p.active FROM public.profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

### 4.2 Migración `0002_leads.sql`

```sql
CREATE TABLE public.leads (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name            text NOT NULL,
  phone                text,
  email                text,
  status               text NOT NULL DEFAULT 'cliente_potencial'
                       CHECK (status IN (
                         'no_responde', 'cliente_potencial', 'cuarentena',
                         'realizando_pedido', 'pedido', 'asnef',
                         'esperando_docs', 'rechazado'
                       )),
  source               text NOT NULL DEFAULT 'manual'
                       CHECK (source IN (
                         'tiktok_lead_ads', 'meta_lead_ads', 'manual',
                         'referral', 'organic_web', 'newsletter'
                       )),
  campaign_name        text,
  vehicle_interest     text,
  assigned_to          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  archived             boolean NOT NULL DEFAULT false,
  raw_webhook_payload  jsonb,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Trigger: updated_at
CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_archived ON public.leads(archived);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_select_authenticated"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "leads_insert_authenticated"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Un comercial solo puede editar leads asignados a sí mismo.
-- Un lead con assigned_to IS NULL no coincide con auth.uid(), así que
-- un comercial no puede tocar leads sin asignar (solo Admin puede).
-- La Server Action de assignLead valida adicionalmente que solo Admin
-- puede cambiar assigned_to.
CREATE POLICY "leads_update_own_or_admin"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR public.is_admin()
  );

-- No se permite DELETE físico (soft-delete con archived)
-- No se crea policy de DELETE
```

### 4.3 Migración `0003_lead_events.sql`

```sql
CREATE TABLE public.lead_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES public.profiles(id),
  event_type text NOT NULL
             CHECK (event_type IN ('note', 'status_change', 'whatsapp_sent', 'call_logged')),
  content    text,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_lead_events_lead_id ON public.lead_events(lead_id);
CREATE INDEX idx_lead_events_created_at ON public.lead_events(created_at DESC);

-- RLS
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_events_select_authenticated"
  ON public.lead_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "lead_events_insert_own_lead_or_admin"
  ON public.lead_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE id = lead_id AND assigned_to = auth.uid()
    )
  );

-- No UPDATE/DELETE en eventos (son inmutables una vez creados)
```

### 4.4 Migración `0004_tasks.sql`

```sql
CREATE TABLE public.tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text,
  lead_id      uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  assigned_to  uuid NOT NULL REFERENCES public.profiles(id),
  status       text NOT NULL DEFAULT 'pendiente'
               CHECK (status IN ('pendiente', 'en_proceso', 'revision', 'completada')),
  priority     text NOT NULL DEFAULT 'media'
               CHECK (priority IN ('baja', 'media', 'alta')),
  due_date     date,
  due_time     time,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Trigger: updated_at
CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_lead_id ON public.tasks(lead_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_authenticated"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tasks_insert_authenticated"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    assigned_to = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "tasks_update_own_or_admin"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "tasks_delete_own_or_admin"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR public.is_admin()
  );
```

### 4.5 Migración `0005_simulations.sql`

```sql
CREATE TABLE public.simulations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_by       uuid NOT NULL REFERENCES public.profiles(id),
  vehicle_price    numeric(10,2) NOT NULL,
  down_payment     numeric(10,2) NOT NULL,
  financed_capital numeric(10,2) NOT NULL,
  entity_name      text NOT NULL,
  tin_rate         numeric(5,2) NOT NULL,
  tae_rate         numeric(5,2) NOT NULL,
  term_months      integer NOT NULL,
  monthly_payment  numeric(10,2) NOT NULL,
  total_interest   numeric(10,2) NOT NULL,
  total_payable    numeric(10,2) NOT NULL,
  is_draft         boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Trigger: updated_at
CREATE TRIGGER simulations_set_updated_at
  BEFORE UPDATE ON public.simulations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX idx_simulations_lead_id ON public.simulations(lead_id);
CREATE INDEX idx_simulations_created_by ON public.simulations(created_by);

-- RLS
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- Si tiene lead_id: visibilidad como leads (todos ven). Si no tiene: solo el creador o admin.
CREATE POLICY "simulations_select_own_or_linked_or_admin"
  ON public.simulations FOR SELECT
  TO authenticated
  USING (
    lead_id IS NOT NULL        -- Simulación vinculada a lead → visible para todos
    OR created_by = auth.uid() -- Simulación libre → solo visible para el creador
    OR public.is_admin()
  );

CREATE POLICY "simulations_insert_authenticated"
  ON public.simulations FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY "simulations_update_own_or_admin"
  ON public.simulations FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "simulations_delete_own_or_admin"
  ON public.simulations FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_admin()
  );
```

### 4.6 Migración `0006_orders.sql`

```sql
CREATE TABLE public.orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,
  simulation_id   uuid REFERENCES public.simulations(id) ON DELETE SET NULL,
  client_name     text NOT NULL,
  vehicle         text,
  price           numeric(10,2),
  bank_entity     text,
  monthly_payment numeric(10,2),
  status          text NOT NULL DEFAULT 'en_revision'
                  CHECK (status IN ('aprobado', 'denegado', 'en_revision')),
  closed_at       date,
  closed_by       uuid REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger: updated_at
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX idx_orders_lead_id ON public.orders(lead_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_closed_by ON public.orders(closed_by);

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_authenticated"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "orders_insert_admin_or_lead_owner"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE id = lead_id AND assigned_to = auth.uid()
    )
  );

CREATE POLICY "orders_update_admin_or_closer"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR closed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE id = lead_id AND assigned_to = auth.uid()
    )
  );
```

### 4.7 Migración `0007_whatsapp_messages.sql`

```sql
CREATE TABLE public.whatsapp_messages (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sent_by             uuid NOT NULL REFERENCES public.profiles(id),
  template_name       text NOT NULL
                      CHECK (template_name IN (
                        'contacto_inicial', 'seguimiento_financiacion',
                        'cita_confirmada', 'operacion_rechazada', 'custom'
                      )),
  message_body        text NOT NULL,
  provider            text NOT NULL DEFAULT 'mock'
                      CHECK (provider IN ('mock', 'meta_cloud_api', 'twilio')),
  provider_message_id text,
  status              text NOT NULL DEFAULT 'simulated'
                      CHECK (status IN ('sent', 'failed', 'simulated')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_whatsapp_messages_lead_id ON public.whatsapp_messages(lead_id);

-- RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_messages_select_authenticated"
  ON public.whatsapp_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "whatsapp_messages_insert_own_lead_or_admin"
  ON public.whatsapp_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE id = lead_id AND assigned_to = auth.uid()
    )
  );
```

### 4.8 Migración `0008_webhook_logs.sql`

```sql
CREATE TABLE public.webhook_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source     text NOT NULL,
  payload    jsonb NOT NULL,
  processed  boolean NOT NULL DEFAULT false,
  lead_id    uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  error      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_webhook_logs_source ON public.webhook_logs(source);
CREATE INDEX idx_webhook_logs_processed ON public.webhook_logs(processed);

-- RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Solo Admin puede leer
CREATE POLICY "webhook_logs_select_admin"
  ON public.webhook_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Inserción solo vía service_role (no hay policy de INSERT para authenticated,
-- el Route Handler usa createClient con SUPABASE_SERVICE_ROLE_KEY)
```

---

## 5. Tipos TypeScript

Todos los tipos se definen en archivos dentro de `types/`. Cada archivo agrupa tipos por entidad.

### `types/database.ts` — Tipos base y genéricos

```typescript
// Tipo genérico para respuestas de Server Actions
export type ActionResult<T = void> = {
  success: true;
  data: T;
  error: null;
} | {
  success: false;
  data: null;
  error: string;
};
```

### `types/profiles.ts`

```typescript
export type UserRole = 'admin' | 'comercial';

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

// Para selects y dropdowns de asignación
export type ProfileSummary = Pick<Profile, 'id' | 'full_name' | 'email' | 'role' | 'active'>;
```

### `types/leads.ts`

```typescript
export type LeadStatus =
  | 'no_responde'
  | 'cliente_potencial'
  | 'cuarentena'
  | 'realizando_pedido'
  | 'pedido'
  | 'asnef'
  | 'esperando_docs'
  | 'rechazado';

export type LeadSource =
  | 'tiktok_lead_ads'
  | 'meta_lead_ads'
  | 'manual'
  | 'referral'
  | 'organic_web'
  | 'newsletter';

export type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: LeadStatus;
  source: LeadSource;
  campaign_name: string | null;
  vehicle_interest: string | null;
  assigned_to: string | null;
  archived: boolean;
  raw_webhook_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

// Tipo enriquecido con join a profiles (para la tabla de leads)
export type LeadWithAssignee = Lead & {
  assignee: Pick<Profile, 'id' | 'full_name'> | null;
};

// Mapeo de estados a clases CSS del prototipo
export const LEAD_STATUS_CONFIG: Record<LeadStatus, {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}> = {
  no_responde: {
    label: 'No responde',
    bgClass: 'bg-lead-no-reply-bg',
    textClass: 'text-lead-no-reply-text',
    borderClass: 'border-lead-no-reply-text/20',
    dotClass: 'bg-lead-no-reply-text',
  },
  cliente_potencial: {
    label: 'Cliente potencial',
    bgClass: 'bg-lead-potential-bg',
    textClass: 'text-lead-potential-text',
    borderClass: 'border-lead-potential-text/20',
    dotClass: 'bg-lead-potential-text',
  },
  cuarentena: {
    label: 'Cuarentena',
    bgClass: 'bg-lead-quarantine-bg',
    textClass: 'text-lead-quarantine-text',
    borderClass: 'border-lead-quarantine-text/20',
    dotClass: 'bg-lead-quarantine-text',
  },
  realizando_pedido: {
    label: 'Realizando pedido',
    bgClass: 'bg-lead-ordering-bg',
    textClass: 'text-lead-ordering-text',
    borderClass: 'border-lead-ordering-text/20',
    dotClass: 'bg-lead-ordering-text',
  },
  pedido: {
    label: 'Pedido',
    bgClass: 'bg-lead-ordered-bg',
    textClass: 'text-lead-ordered-text',
    borderClass: 'border-lead-ordered-text/20',
    dotClass: 'bg-lead-ordered-text',
  },
  asnef: {
    label: 'Asnef',
    bgClass: 'bg-lead-asnef-bg',
    textClass: 'text-lead-asnef-text',
    borderClass: 'border-lead-asnef-text/20',
    dotClass: 'bg-lead-asnef-text',
  },
  esperando_docs: {
    label: 'Esperando docs',
    bgClass: 'bg-lead-waiting-bg',
    textClass: 'text-lead-waiting-text',
    borderClass: 'border-lead-waiting-text/20',
    dotClass: 'bg-lead-waiting-text',
  },
  rechazado: {
    label: 'Rechazado',
    bgClass: 'bg-lead-rejected-bg',
    textClass: 'text-lead-rejected-text',
    borderClass: 'border-lead-rejected-text/20',
    dotClass: 'bg-lead-rejected-text',
  },
} as const;
```

### `types/lead-events.ts`

```typescript
import type { LeadStatus } from './leads';
import type { Profile } from './profiles';

export type LeadEventType = 'note' | 'status_change' | 'whatsapp_sent' | 'call_logged';

export type StatusChangeMetadata = {
  from_status: LeadStatus;
  to_status: LeadStatus;
};

export type LeadEvent = {
  id: string;
  lead_id: string;
  author_id: string;
  event_type: LeadEventType;
  content: string | null;
  metadata: StatusChangeMetadata | Record<string, unknown> | null;
  created_at: string;
};

// Con join a profiles para mostrar nombre del autor
export type LeadEventWithAuthor = LeadEvent & {
  author: Pick<Profile, 'id' | 'full_name'>;
};
```

### `types/tasks.ts`

```typescript
import type { Lead } from './leads';

export type TaskStatus = 'pendiente' | 'en_proceso' | 'revision' | 'completada';
export type TaskPriority = 'baja' | 'media' | 'alta';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  lead_id: string | null;
  assigned_to: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;      // ISO date string 'YYYY-MM-DD'
  due_time: string | null;      // 'HH:MM:SS'
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

// Enriquecido con nombre del lead
export type TaskWithLead = Task & {
  lead: Pick<Lead, 'id' | 'full_name'> | null;
};

// Mapeo de prioridades a clases CSS
export const TASK_PRIORITY_CONFIG: Record<TaskPriority, {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  alta: {
    label: 'Alta',
    bgClass: 'bg-error-container/20',
    textClass: 'text-danger',
    borderClass: 'border-danger/20',
  },
  media: {
    label: 'Media',
    bgClass: 'bg-warning/10',
    textClass: 'text-warning',
    borderClass: 'border-warning/20',
  },
  baja: {
    label: 'Baja',
    bgClass: 'bg-surface-container-highest',
    textClass: 'text-text-secondary',
    borderClass: 'border-border-strong',
  },
} as const;

// Mapeo de columnas Kanban a estados
export const KANBAN_COLUMNS: Array<{
  status: TaskStatus;
  title: string;
  dotClass: string;
}> = [
  { status: 'pendiente', title: 'Pendiente', dotClass: 'bg-text-secondary' },
  { status: 'en_proceso', title: 'En proceso', dotClass: 'bg-info shadow-[0_0_8px_rgba(96,165,250,0.6)]' },
  { status: 'revision', title: 'Revisión', dotClass: 'bg-lead-waiting-text shadow-[0_0_8px_rgba(192,132,252,0.6)]' },
  { status: 'completada', title: 'Completada', dotClass: 'bg-success' },
];
```

### `types/simulations.ts`

```typescript
export type Simulation = {
  id: string;
  lead_id: string | null;
  created_by: string;
  vehicle_price: number;
  down_payment: number;
  financed_capital: number;
  entity_name: string;
  tin_rate: number;
  tae_rate: number;
  term_months: number;
  monthly_payment: number;
  total_interest: number;
  total_payable: number;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
};
```

### `types/orders.ts`

```typescript
export type OrderStatus = 'aprobado' | 'denegado' | 'en_revision';

export type Order = {
  id: string;
  lead_id: string;
  simulation_id: string | null;
  client_name: string;
  vehicle: string | null;
  price: number | null;
  bank_entity: string | null;
  monthly_payment: number | null;
  status: OrderStatus;
  closed_at: string | null;     // ISO date string
  closed_by: string | null;
  created_at: string;
  updated_at: string;
};

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  aprobado: {
    label: 'Aprobado',
    bgClass: 'bg-lead-ordered-bg',
    textClass: 'text-lead-ordered-text',
    borderClass: 'border-lead-ordered-text/20',
  },
  denegado: {
    label: 'Denegado',
    bgClass: 'bg-lead-rejected-bg',
    textClass: 'text-lead-rejected-text',
    borderClass: 'border-lead-rejected-text/20',
  },
  en_revision: {
    label: 'En revisión',
    bgClass: 'bg-lead-waiting-bg',
    textClass: 'text-lead-waiting-text',
    borderClass: 'border-lead-waiting-text/20',
  },
} as const;
```

### `types/whatsapp.ts`

```typescript
export type WhatsAppTemplateName =
  | 'contacto_inicial'
  | 'seguimiento_financiacion'
  | 'cita_confirmada'
  | 'operacion_rechazada'
  | 'custom';

export type WhatsAppProvider = 'mock' | 'meta_cloud_api' | 'twilio';

export type WhatsAppMessageStatus = 'sent' | 'failed' | 'simulated';

export type WhatsAppMessage = {
  id: string;
  lead_id: string;
  sent_by: string;
  template_name: WhatsAppTemplateName;
  message_body: string;
  provider: WhatsAppProvider;
  provider_message_id: string | null;
  status: WhatsAppMessageStatus;
  created_at: string;
};

export type WhatsAppTemplate = {
  name: WhatsAppTemplateName;
  label: string;
  labelColor: string;  // Tailwind color class for the label
  body: string;        // Template con placeholders: {nombre}, {vehiculo}
};
```

---

## 6. Esquemas de Validación Zod

### `lib/validations/leads.ts`

```typescript
import { z } from 'zod';

export const createLeadSchema = z.object({
  full_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  phone: z.string().optional().default(''),
  email: z.string().email('Email no válido').optional().or(z.literal('')),
  source: z.enum([
    'tiktok_lead_ads', 'meta_lead_ads', 'manual',
    'referral', 'organic_web', 'newsletter',
  ]).default('manual'),
  campaign_name: z.string().optional().default(''),
  vehicle_interest: z.string().optional().default(''),
  assigned_to: z.string().uuid().optional().nullable(),
});

export const updateLeadStatusSchema = z.object({
  lead_id: z.string().uuid(),
  status: z.enum([
    'no_responde', 'cliente_potencial', 'cuarentena',
    'realizando_pedido', 'pedido', 'asnef',
    'esperando_docs', 'rechazado',
  ]),
});

export const assignLeadSchema = z.object({
  lead_id: z.string().uuid(),
  assigned_to: z.string().uuid(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
```

### `lib/validations/tasks.ts`

```typescript
import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional().default(''),
  lead_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid(),
  priority: z.enum(['baja', 'media', 'alta']).default('media'),
  due_date: z.string().optional().nullable(),  // 'YYYY-MM-DD'
  due_time: z.string().optional().nullable(),  // 'HH:MM'
});

export const updateTaskStatusSchema = z.object({
  task_id: z.string().uuid(),
  status: z.enum(['pendiente', 'en_proceso', 'revision', 'completada']),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
```

### `lib/validations/simulations.ts`

```typescript
import { z } from 'zod';

export const createSimulationSchema = z.object({
  lead_id: z.string().uuid().optional().nullable(),
  vehicle_price: z.number().positive('El precio debe ser positivo'),
  down_payment: z.number().min(0, 'La entrada no puede ser negativa'),
  entity_name: z.string().min(1, 'Selecciona una entidad financiera'),
  tin_rate: z.number().positive('El TIN debe ser positivo'),
  term_months: z.number().int().positive(),
}).refine(
  (data) => data.down_payment < data.vehicle_price,
  { message: 'La entrada debe ser menor que el precio del vehículo', path: ['down_payment'] }
);

export type CreateSimulationInput = z.infer<typeof createSimulationSchema>;
```

### `lib/validations/orders.ts`

```typescript
import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  order_id: z.string().uuid(),
  status: z.enum(['aprobado', 'denegado', 'en_revision']),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
```

### `lib/validations/whatsapp.ts`

```typescript
import { z } from 'zod';

export const sendWhatsAppSchema = z.object({
  lead_id: z.string().uuid(),
  template_name: z.enum([
    'contacto_inicial', 'seguimiento_financiacion',
    'cita_confirmada', 'operacion_rechazada', 'custom',
  ]),
  message_body: z.string().min(1, 'El mensaje no puede estar vacío'),
});

export type SendWhatsAppInput = z.infer<typeof sendWhatsAppSchema>;
```

### `lib/validations/users.ts`

```typescript
import { z } from 'zod';

export const inviteUserSchema = z.object({
  email: z.string().email('Email no válido'),
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['admin', 'comercial']).default('comercial'),
});

export const updateUserRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['admin', 'comercial']),
});

export const toggleUserActiveSchema = z.object({
  user_id: z.string().uuid(),
  active: z.boolean(),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type ToggleUserActiveInput = z.infer<typeof toggleUserActiveSchema>;
```

### `lib/validations/notes.ts`

```typescript
import { z } from 'zod';

export const createNoteSchema = z.object({
  lead_id: z.string().uuid(),
  content: z.string().min(1, 'La nota no puede estar vacía'),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
```

---

## 7. Firmas de Server Actions

Todas las Server Actions viven en `lib/actions/`. Cada archivo agrupa las acciones por dominio. Cada acción es una `async function` marcada con `'use server'` al inicio del archivo.

### `lib/actions/leads.ts`

```typescript
'use server';

import type { ActionResult } from '@/types/database';
import type { Lead, LeadWithAssignee } from '@/types/leads';
import type { CreateLeadInput, UpdateLeadStatusInput, AssignLeadInput } from '@/lib/validations/leads';

// Obtener leads paginados con filtros
export async function getLeads(params: {
  page?: number;           // default 1
  pageSize?: number;       // default 20
  status?: string | null;
  unassignedOnly?: boolean;
  search?: string;
}): Promise<ActionResult<{ leads: LeadWithAssignee[]; total: number }>>

// Obtener un lead por ID con datos enriquecidos
export async function getLeadById(
  leadId: string
): Promise<ActionResult<LeadWithAssignee>>

// Crear un lead manualmente
export async function createLead(
  input: CreateLeadInput
): Promise<ActionResult<Lead>>

// Actualizar estado de un lead (crea evento automáticamente)
export async function updateLeadStatus(
  input: UpdateLeadStatusInput
): Promise<ActionResult<Lead>>

// Asignar un lead sin asignar (solo Admin)
export async function assignLead(
  input: AssignLeadInput
): Promise<ActionResult<Lead>>

// Archivar un lead (soft-delete, solo Admin)
export async function archiveLead(
  leadId: string
): Promise<ActionResult<void>>

// Convertir lead a cliente (crea order, cambia status a 'pedido')
export async function convertLeadToClient(
  leadId: string
): Promise<ActionResult<{ lead: Lead; order: import('@/types/orders').Order }>>
```

### `lib/actions/lead-events.ts`

```typescript
'use server';

import type { ActionResult } from '@/types/database';
import type { LeadEventWithAuthor } from '@/types/lead-events';
import type { CreateNoteInput } from '@/lib/validations/notes';

// Obtener eventos de un lead (timeline)
export async function getLeadEvents(
  leadId: string
): Promise<ActionResult<LeadEventWithAuthor[]>>

// Crear una nota en un lead
export async function createNote(
  input: CreateNoteInput
): Promise<ActionResult<LeadEventWithAuthor>>
```

### `lib/actions/tasks.ts`

```typescript
'use server';

import type { ActionResult } from '@/types/database';
import type { Task, TaskWithLead } from '@/types/tasks';
import type { CreateTaskInput, UpdateTaskStatusInput } from '@/lib/validations/tasks';

// Obtener todas las tareas (para Kanban)
export async function getTasks(): Promise<ActionResult<TaskWithLead[]>>

// Obtener tareas de un lead específico
export async function getTasksByLeadId(
  leadId: string
): Promise<ActionResult<TaskWithLead[]>>

// Crear tarea
export async function createTask(
  input: CreateTaskInput
): Promise<ActionResult<Task>>

// Actualizar estado de tarea (drag & drop Kanban)
export async function updateTaskStatus(
  input: UpdateTaskStatusInput
): Promise<ActionResult<Task>>

// Eliminar tarea
export async function deleteTask(
  taskId: string
): Promise<ActionResult<void>>
```

### `lib/actions/simulations.ts`

```typescript
'use server';

import type { ActionResult } from '@/types/database';
import type { Simulation } from '@/types/simulations';
import type { CreateSimulationInput } from '@/lib/validations/simulations';

// Guardar simulación (desde modo libre o desde Lead Detail)
export async function saveSimulation(
  input: CreateSimulationInput
): Promise<ActionResult<Simulation>>

// Obtener simulaciones de un lead
export async function getSimulationsByLeadId(
  leadId: string
): Promise<ActionResult<Simulation[]>>

// Obtener simulaciones propias (modo libre)
export async function getMySimulations(): Promise<ActionResult<Simulation[]>>
```

### `lib/actions/orders.ts`

```typescript
'use server';

import type { ActionResult } from '@/types/database';
import type { Order } from '@/types/orders';
import type { UpdateOrderStatusInput } from '@/lib/validations/orders';

// Obtener pedidos con filtro por estado
export async function getOrders(params: {
  status?: string | null;
}): Promise<ActionResult<Order[]>>

// Actualizar estado de pedido
export async function updateOrderStatus(
  input: UpdateOrderStatusInput
): Promise<ActionResult<Order>>

// Exportar pedidos a CSV
export async function exportOrdersCSV(): Promise<ActionResult<string>>
// Retorna el contenido CSV como string; el componente cliente lo descarga como archivo
```

### `lib/actions/whatsapp.ts`

```typescript
'use server';

import type { ActionResult } from '@/types/database';
import type { WhatsAppMessage } from '@/types/whatsapp';
import type { SendWhatsAppInput } from '@/lib/validations/whatsapp';

// Enviar mensaje WhatsApp (usa el provider configurado)
export async function sendWhatsAppMessage(
  input: SendWhatsAppInput
): Promise<ActionResult<WhatsAppMessage>>
```

### `lib/actions/users.ts`

```typescript
'use server';

import type { ActionResult } from '@/types/database';
import type { Profile, ProfileSummary } from '@/types/profiles';
import type { InviteUserInput, UpdateUserRoleInput, ToggleUserActiveInput } from '@/lib/validations/users';

// Listar todos los usuarios (solo Admin)
export async function getUsers(): Promise<ActionResult<Profile[]>>

// Invitar nuevo usuario por email (solo Admin)
export async function inviteUser(
  input: InviteUserInput
): Promise<ActionResult<Profile>>

// Cambiar rol de un usuario (solo Admin)
export async function updateUserRole(
  input: UpdateUserRoleInput
): Promise<ActionResult<Profile>>

// Activar/desactivar usuario (solo Admin)
export async function toggleUserActive(
  input: ToggleUserActiveInput
): Promise<ActionResult<Profile>>

// Obtener comerciales activos (para dropdowns de asignación)
export async function getActiveComerciales(): Promise<ActionResult<ProfileSummary[]>>
```

### `lib/actions/auth.ts`

```typescript
'use server';

import type { ActionResult } from '@/types/database';
import type { Profile } from '@/types/profiles';

// Login con email y password
export async function login(
  email: string,
  password: string
): Promise<ActionResult<void>>

// Logout
export async function logout(): Promise<ActionResult<void>>

// Obtener perfil del usuario actual
export async function getCurrentProfile(): Promise<ActionResult<Profile>>
```

---

## 8. Contrato WhatsApp Provider

### `lib/whatsapp/provider.ts` — Interfaz

```typescript
import type { WhatsAppMessageStatus } from '@/types/whatsapp';

export type SendMessageParams = {
  to: string;                  // Número de teléfono del destinatario
  templateName: string;        // Nombre de la plantilla
  messageBody: string;         // Cuerpo del mensaje ya interpolado
};

export type SendMessageResult = {
  status: WhatsAppMessageStatus;
  providerMessageId: string | null;
  error: string | null;
};

export interface WhatsAppProviderInterface {
  sendMessage(params: SendMessageParams): Promise<SendMessageResult>;
}
```

### `lib/whatsapp/mock-provider.ts` — Implementación mock

```typescript
import type { WhatsAppProviderInterface, SendMessageParams, SendMessageResult } from './provider';

export class MockWhatsAppProvider implements WhatsAppProviderInterface {
  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    // Simula un envío exitoso sin llamar a ninguna API externa
    console.log(`[MockWhatsApp] Enviando a ${params.to}: ${params.messageBody}`);
    return {
      status: 'simulated',
      providerMessageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      error: null,
    };
  }
}
```

### `lib/whatsapp/factory.ts` — Factory para resolver el provider

```typescript
import type { WhatsAppProviderInterface } from './provider';
import { MockWhatsAppProvider } from './mock-provider';

export function createWhatsAppProvider(): WhatsAppProviderInterface {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';

  switch (provider) {
    case 'mock':
      return new MockWhatsAppProvider();
    case 'meta_cloud_api':
      // TODO: Implementar MetaCloudApiProvider cuando el cliente decida
      // Necesitará: WHATSAPP_META_ACCESS_TOKEN, WHATSAPP_META_PHONE_NUMBER_ID
      throw new Error('Meta Cloud API provider not yet implemented');
    case 'twilio':
      // TODO: Implementar TwilioProvider cuando el cliente decida
      // Necesitará: WHATSAPP_TWILIO_ACCOUNT_SID, WHATSAPP_TWILIO_AUTH_TOKEN, WHATSAPP_TWILIO_FROM_NUMBER
      throw new Error('Twilio provider not yet implemented');
    default:
      throw new Error(`Unknown WhatsApp provider: ${provider}`);
  }
}
```

### `lib/whatsapp/templates.ts` — Plantillas estáticas

```typescript
import type { WhatsAppTemplate } from '@/types/whatsapp';

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    name: 'contacto_inicial',
    label: 'Contacto Inicial',
    labelColor: 'text-success',
    body: 'Hola {nombre}, le contactamos desde HOMA - Rangel & Serrano por su interés en el {vehiculo}. ¿Podemos hablar 5 minutos?',
  },
  {
    name: 'seguimiento_financiacion',
    label: 'Seguimiento Financiación',
    labelColor: 'text-warning',
    body: '¿Sigue interesado en financiar su próximo vehículo? Tenemos una oferta especial para el {vehiculo} que le puede interesar.',
  },
  {
    name: 'cita_confirmada',
    label: 'Cita Confirmada',
    labelColor: 'text-primary',
    body: 'Confirmamos su cita para mañana a las 11:30h en nuestra exposición de Calle Mayor. ¡Le esperamos!',
  },
  {
    name: 'operacion_rechazada',
    label: 'Operación Rechazada',
    labelColor: 'text-error',
    body: 'Sentimos comunicarle que por el momento no podemos avanzar con la financiación solicitada. Quedamos a su disposición.',
  },
];

// Interpola placeholders en el cuerpo de la plantilla
export function interpolateTemplate(
  body: string,
  variables: Record<string, string>
): string {
  return body.replace(/\{(\w+)\}/g, (_, key) => variables[key] || `{${key}}`);
}
```

---

## 9. Contrato Finance Library

### `lib/finance/calculator.ts`

```typescript
// DEUDA_TECNICA: La TAE legal requiere incluir comisiones de apertura, seguros y otros costes.
// Esta aproximación (TIN + 0.30pp) es solo orientativa y no cumple el estándar legal de cálculo de TAE.

export type CalculationInput = {
  vehiclePrice: number;      // Precio total del vehículo en euros
  downPayment: number;       // Entrada / pago inicial en euros
  tinRate: number;            // Tasa de Interés Nominal anual en % (e.g. 6.49)
  termMonths: number;         // Plazo en meses (e.g. 84)
};

export type CalculationResult = {
  financedCapital: number;   // vehiclePrice - downPayment
  taeRate: number;            // TIN + 0.30 (aproximación)
  monthlyPayment: number;    // Cuota mensual (fórmula francesa)
  totalInterest: number;     // Total intereses pagados
  totalPayable: number;      // financedCapital + totalInterest
};

/**
 * Calcula la cuota mensual usando la fórmula de amortización francesa.
 * PMT = P × (r/n) / [1 - (1 + r/n)^(-n×t)]
 * Donde:
 *   P = principal (capital financiado)
 *   r = tasa de interés anual (TIN) como decimal
 *   n = número de pagos por año (12 para mensual)
 *   t = número de años
 */
export function calculateMonthlyPayment(input: CalculationInput): CalculationResult {
  const financedCapital = input.vehiclePrice - input.downPayment;
  const taeRate = input.tinRate + 0.30; // Aproximación

  const monthlyRate = input.tinRate / 100 / 12; // r/n
  const numPayments = input.termMonths;          // n*t

  let monthlyPayment: number;

  if (monthlyRate === 0) {
    monthlyPayment = financedCapital / numPayments;
  } else {
    monthlyPayment =
      financedCapital *
      (monthlyRate / (1 - Math.pow(1 + monthlyRate, -numPayments)));
  }

  const totalPayable = monthlyPayment * numPayments;
  const totalInterest = totalPayable - financedCapital;

  return {
    financedCapital: round2(financedCapital),
    taeRate: round2(taeRate),
    monthlyPayment: round2(monthlyPayment),
    totalInterest: round2(totalInterest),
    totalPayable: round2(totalPayable),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Plazos fijos que muestra la UI de comparativa (del prototipo)
export const COMPARISON_TERMS = [60, 72, 84, 96, 108, 120] as const;

// Plazo "recomendado" (highlighted en el prototipo como "Optimal Mix")
export const RECOMMENDED_TERM = 84;

export type AmortizationComparison = {
  termMonths: number;
  termYears: number;
  result: CalculationResult;
  isRecommended: boolean;
};

/**
 * Genera la tabla comparativa de amortización para todos los plazos fijos.
 */
export function generateAmortizationComparison(
  vehiclePrice: number,
  downPayment: number,
  tinRate: number
): AmortizationComparison[] {
  return COMPARISON_TERMS.map((termMonths) => ({
    termMonths,
    termYears: termMonths / 12,
    result: calculateMonthlyPayment({ vehiclePrice, downPayment, tinRate, termMonths }),
    isRecommended: termMonths === RECOMMENDED_TERM,
  }));
}
```

---

## 10. Estructura de Archivos Detallada

```
05_RANGEL_SERRANO_CRM/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← Layout con Sidebar + Header
│   │   ├── leads/
│   │   │   ├── page.tsx            ← /leads
│   │   │   └── [id]/
│   │   │       └── page.tsx        ← /leads/[id]
│   │   ├── tareas/
│   │   │   └── page.tsx            ← /tareas
│   │   ├── simulaciones/
│   │   │   └── page.tsx            ← /simulaciones
│   │   ├── pedidos/
│   │   │   └── page.tsx            ← /pedidos
│   │   └── admin/
│   │       └── usuarios/
│   │           └── page.tsx        ← /admin/usuarios (Admin only)
│   ├── api/
│   │   └── webhooks/
│   │       └── tiktok-leads/
│   │           └── route.ts
│   ├── layout.tsx                  ← Root layout (fonts, metadata)
│   ├── page.tsx                    ← Redirect to /leads
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── SearchInput.tsx
│   │   └── Pagination.tsx
│   ├── leads/
│   │   ├── LeadTable.tsx
│   │   ├── LeadStatusBadge.tsx
│   │   ├── LeadDetailHeader.tsx
│   │   ├── LeadTimeline.tsx
│   │   ├── LeadNoteInput.tsx
│   │   ├── LeadStatusSelector.tsx
│   │   ├── LeadAssignDropdown.tsx
│   │   ├── LeadCreateModal.tsx
│   │   └── WhatsAppModal.tsx
│   ├── tareas/
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── TaskCard.tsx
│   │   └── TaskCreateModal.tsx
│   ├── simulaciones/
│   │   ├── SimulationForm.tsx
│   │   ├── AmortizationGrid.tsx
│   │   ├── AmortizationCard.tsx
│   │   └── SimulationSummary.tsx
│   ├── pedidos/
│   │   ├── OrderTable.tsx
│   │   └── OrderStatusBadge.tsx
│   └── admin/
│       ├── UserTable.tsx
│       └── UserInviteModal.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               ← createBrowserClient (@supabase/ssr)
│   │   └── server.ts               ← createServerClient (@supabase/ssr)
│   ├── whatsapp/
│   │   ├── provider.ts             ← WhatsAppProviderInterface
│   │   ├── mock-provider.ts
│   │   ├── factory.ts
│   │   └── templates.ts
│   ├── finance/
│   │   └── calculator.ts
│   ├── validations/
│   │   ├── leads.ts
│   │   ├── tasks.ts
│   │   ├── simulations.ts
│   │   ├── orders.ts
│   │   ├── whatsapp.ts
│   │   ├── users.ts
│   │   └── notes.ts
│   └── actions/
│       ├── leads.ts
│       ├── lead-events.ts
│       ├── tasks.ts
│       ├── simulations.ts
│       ├── orders.ts
│       ├── whatsapp.ts
│       ├── users.ts
│       └── auth.ts
├── types/
│   ├── database.ts
│   ├── profiles.ts
│   ├── leads.ts
│   ├── lead-events.ts
│   ├── tasks.ts
│   ├── simulations.ts
│   ├── orders.ts
│   └── whatsapp.ts
├── supabase/
│   ├── migrations/
│   │   ├── 0000_helpers.sql
│   │   ├── 0001_profiles.sql
│   │   ├── 0002_leads.sql
│   │   ├── 0003_lead_events.sql
│   │   ├── 0004_tasks.sql
│   │   ├── 0005_simulations.sql
│   │   ├── 0006_orders.sql
│   │   ├── 0007_whatsapp_messages.sql
│   │   └── 0008_webhook_logs.sql
│   └── seed.sql
├── middleware.ts                    ← Auth + active check + route protection
├── tailwind.config.ts              ← Migrado del prototipo HTML
├── .env.example
├── .env.local                      ← Git-ignored
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 11. Plan de Migraciones

| Archivo | Fase | Contenido |
|---|---|---|
| `0000_helpers.sql` | 1 | `is_admin()`, `set_updated_at()` |
| `0001_profiles.sql` | 1 | Tabla, trigger signup, RLS |
| `0002_leads.sql` | 2 | Tabla, RLS, índices |
| `0003_lead_events.sql` | 2 | Tabla, RLS, índices |
| `0004_tasks.sql` | 3 | Tabla, RLS, índices |
| `0005_simulations.sql` | 3 | Tabla, RLS, índices |
| `0006_orders.sql` | 4 | Tabla, RLS, índices |
| `0007_whatsapp_messages.sql` | 4 | Tabla, RLS, índices |
| `0008_webhook_logs.sql` | 4 | Tabla, RLS (admin-only) |

### Reglas para Flash al ejecutar migraciones:
1. Copiar el DDL **exactamente** como está en la sección 4 de este documento.
2. No modificar nombres de tablas, columnas ni policies.
3. No añadir columnas no previstas sin señalarlo explícitamente como desviación.
4. Ejecutar cada migración en el orden indicado (las FKs dependen de tablas previas).

---

## Apéndice A: Middleware de Next.js

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rutas públicas
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login');
  const isWebhookRoute = request.nextUrl.pathname.startsWith('/api/webhooks');

  // Webhooks no requieren autenticación de usuario (usan service_role internamente)
  if (isWebhookRoute) {
    return supabaseResponse;
  }

  // Si no está autenticado y no está en login, redirigir a login
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Si está autenticado y está en login, redirigir a leads
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/leads';
    return NextResponse.redirect(url);
  }

  // Verificar que el usuario está activo
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('active, role')
      .eq('id', user.id)
      .single();

    if (profile && !profile.active) {
      // Usuario desactivado: cerrar sesión y redirigir a login
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'account_disabled');
      return NextResponse.redirect(url);
    }

    // Rutas de Admin: verificar rol
    if (request.nextUrl.pathname.startsWith('/admin') && profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/leads';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Excluir archivos estáticos y Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

## Apéndice B: Configuración Tailwind

El `tailwind.config.ts` debe migrar **exactamente** los tokens del prototipo HTML (sección `<script id="tailwind-config">`). La configuración completa de colores, fontFamily, fontSize, spacing y borderRadius del prototipo está en las líneas 13-79 del archivo `rangel_serrano_crm.html`.

**Reglas de migración para Flash:**
1. Copiar todos los colores del objeto `colors` del HTML tal cual.
2. Copiar `fontFamily`, `fontSize`, `spacing`, `borderRadius` tal cual.
3. Añadir `darkMode: "class"` en la config raíz.
4. Configurar `content` para que incluya `./app/**/*.{ts,tsx}`, `./components/**/*.{ts,tsx}`, `./lib/**/*.{ts,tsx}`.
5. Las fuentes (Inter, Hanken Grotesk, JetBrains Mono) se cargan vía `next/font/google` en el root layout, no vía CDN `<link>`.
6. Material Symbols se carga vía `<link>` en el root layout head (CDN de Google Fonts), igual que en el prototipo. No hay paquete npm oficial para Material Symbols con la misma calidad que el CDN.

---

## Apéndice C: Webhook TikTok Lead Ads

### Estructura del Route Handler

```typescript
// app/api/webhooks/tiktok-leads/route.ts

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Usa service_role para bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // 1. Registrar el payload crudo SIEMPRE (incluso si falla después)
  // 2. Validar autenticidad (verificar TIKTOK_WEBHOOK_VERIFY_TOKEN)
  // 3. Parsear el payload según el formato de TikTok Lead Ads
  // 4. Insertar lead con assigned_to = NULL, source = 'tiktok_lead_ads'
  // 5. Actualizar webhook_logs con processed = true y lead_id
  // 6. Retornar 200 OK (TikTok espera 2xx para confirmar recepción)
}

// TikTok Lead Ads puede enviar un GET de verificación (challenge)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const verifyToken = searchParams.get('verify_token');
  const challenge = searchParams.get('challenge');

  if (verifyToken === process.env.TIKTOK_WEBHOOK_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}
```

**Nota para Flash**: La documentación de TikTok Lead Ads puede haber cambiado. Antes de implementar, verificar en https://business-api.tiktok.com/portal/docs la especificación vigente del webhook. El esqueleto de arriba es la estructura esperada, pero los nombres de campos del payload pueden variar.

### Parser genérico para extensibilidad futura

```typescript
// lib/webhooks/parsers.ts

export type ParsedWebhookLead = {
  full_name: string;
  phone: string | null;
  email: string | null;
  source: 'tiktok_lead_ads' | 'meta_lead_ads';
  campaign_name: string | null;
  vehicle_interest: string | null;
  raw_payload: Record<string, unknown>;
};

export function parseTikTokLeadPayload(payload: unknown): ParsedWebhookLead {
  // Implementar según la spec vigente de TikTok
  // Fallback: extraer los campos que se puedan, dejar el resto null
}

export function parseMetaLeadPayload(payload: unknown): ParsedWebhookLead {
  // Placeholder para implementación futura
  throw new Error('Meta Lead Ads parser not yet implemented');
}
```

---

> **FIN DE LA CONSTITUCIÓN TÉCNICA**
>
> Este documento cierra todas las ambigüedades detectadas en `01_`, `02_` y `03_`. Gemini Flash debe usarlo como fuente de verdad para nombres, tipos, firmas y DDL. Si durante la implementación Flash encuentra un caso no cubierto aquí, debe detenerse y señalarlo explícitamente.
