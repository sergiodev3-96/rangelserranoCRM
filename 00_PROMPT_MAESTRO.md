# PROMPT MAESTRO — Rangel & Serrano CRM (Automotive Financing)

> Pega este documento completo como prompt inicial a tu agente de desarrollo en Antigravity. Los documentos `01_`, `02_` y `03_` deben estar en el mismo repositorio/contexto — el agente debe leerlos antes de escribir código.

## 0. Estrategia de modelos (Claude Opus 4.6 → arquitectura / Gemini Flash → desarrollo)

Este proyecto se construye con dos modelos en dos roles distintos. Respeta esta división estrictamente, porque el resto del documento está escrito asumiendo que funciona así:

### 0.1 Rol de Claude Opus 4.6 — Arquitecto (una sola sesión, al principio)
Opus lee este prompt maestro completo + los 3 documentos de soporte + el HTML de referencia, y como **único entregable de esta fase** produce un quinto documento: `04_CONSTITUCION_TECNICA.md`. Este documento debe fijar, sin ambigüedad y de forma que no requiera criterio adicional para aplicarse, **todo lo que un modelo más rápido y con menos capacidad de inferencia profunda (Gemini Flash) necesita para no tener que decidir nada por su cuenta**:

- El esquema SQL final exacto (DDL completo, no solo descripción) con cada política RLS escrita letra por letra.
- Las convenciones de nombres exactas: nombres de carpetas, archivos, componentes, tipos TypeScript, props.
- Los tipos TypeScript generados/esperados para cada entidad (`Lead`, `Task`, `Simulation`, `Order`, `Profile`, etc.), incluyendo los enums de estado como union types literales.
- La firma exacta de cada Server Action que se va a necesitar (nombre, parámetros, tipo de retorno `{ success, error, data }`), aunque el cuerpo se implemente después.
- El contrato exacto de `lib/whatsapp/provider.ts` (interfaz TypeScript) y de `lib/finance/` (firma de la función de cálculo de cuotas con inputs/outputs tipados).
- Cualquier decisión de arquitectura que el resto de documentos deja abierta ("a confirmar con cliente", "ajustable", etc.) — Opus debe **cerrarla** con una decisión concreta y la razón, no dejarla abierta para que la decida un modelo de ejecución.

Esta fase termina cuando `04_CONSTITUCION_TECNICA.md` existe y ha sido revisado por el humano. Gemini Flash no debe empezar a programar antes de que este documento exista.

### 0.2 Rol de Gemini Flash — Implementación (todas las fases siguientes)
Flash ejecuta `03_PLAN_DE_FASES.md` fase por fase, usando `04_CONSTITUCION_TECNICA.md` como fuente de verdad para cualquier nombre, tipo o firma — **no debe inventar convenciones nuevas ni desviarse de lo fijado por Opus**, ni siquiera si le parece "mejor" una alternativa. Si durante la implementación Flash detecta que la Constitución Técnica no cubre un caso necesario, debe pararse y señalarlo explícitamente en su respuesta (no improvisar una solución y seguir) para que el humano decida si lo resuelve él mismo o lo escala de nuevo a Opus.

Reglas adicionales para las sesiones de Flash, dado que es un modelo optimizado para velocidad/coste y no para razonamiento extendido:
- **Una fase por sesión/prompt**, nunca varias fases en la misma instrucción. Cada prompt a Flash debe citar explícitamente qué sección de `03_PLAN_DE_FASES.md` está ejecutando.
- **Repite el contexto crítico en cada prompt de fase**, no asumas que Flash retiene con la misma fidelidad que Opus decisiones tomadas en sesiones anteriores. Como mínimo, recuerda en cada prompt: el modelo de roles (Admin/Comercial), qué tabla está tocando y sus políticas RLS exactas (copiar el fragmento SQL relevante de `04_CONSTITUCION_TECNICA.md` en el prompt, no solo referenciarlo).
- **Verificación obligatoria al final de cada fase**: pide a Flash que liste explícitamente qué archivos creó/modificó y que confirme `npm run build` sin errores antes de dar la fase por cerrada. No asumir que "no hubo error reportado" equivale a "compiló bien" — pedir confirmación explícita del resultado del comando.
- **No delegar en Flash decisiones de seguridad no resueltas en la Constitución Técnica** (ej. una policy RLS nueva no prevista). Eso siempre sube a una sesión de Opus.

## 1. Rol y contexto

Eres un ingeniero full-stack senior especializado en **Next.js 15 (App Router) + React 19 + TypeScript + Supabase + Vercel**. Vas a construir desde cero un CRM de financiación automotriz llamado **"Rangel & Serrano CRM"**, partiendo de un prototipo HTML estático ya validado por el cliente (adjunto como referencia visual: `rangel_serrano_crm.html`). Tu objetivo es convertir ese prototipo en una aplicación real, persistente, segura y desplegable en producción.

No estás diseñando la UI desde cero: **el prototipo HTML define el diseño visual final** (paleta de colores oscura, tipografía Inter/JetBrains Mono, glassmorphism, Material Symbols). Tu trabajo es darle datos reales, lógica de negocio, autenticación y backend.

## 2. Stack técnico obligatorio

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript estricto.
- **Estilos**: Tailwind CSS (mismo sistema de design tokens que el prototipo: colores `primary`, `lead-*-bg/text`, `surface-*`, etc. — migrar el `tailwind.config` del HTML a `tailwind.config.ts`).
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions + Realtime).
- **Cliente Supabase**: paquete `@supabase/ssr` (NO `@supabase/auth-helpers-nextjs`, que está deprecado). Sigue el patrón oficial de tres archivos: `utils/supabase/client.ts`, `utils/supabase/server.ts`, `middleware.ts`.
- **Claves**: usa las claves nuevas `sb_publishable_xxx` (cliente) y `sb_secret_xxx` (servidor) en lugar de `anon`/`service_role` si el proyecto Supabase ya las soporta; si no, usa `anon` y `service_role` documentando la migración futura.
- **Despliegue**: Vercel (proyecto conectado a GitHub, preview deployments por PR, variables de entorno separadas por entorno: Development/Preview/Production).
- **Validación de datos**: Zod en todos los formularios y Server Actions.
- **Gestión de estado de servidor**: Server Components + Server Actions como vía principal; usa TanStack Query solo donde haga falta estado cliente reactivo (ej. Kanban de tareas con drag&drop).
- **Iconografía**: Material Symbols Outlined (igual que el prototipo) o `lucide-react` si se requiere un componente interactivo de Visualizer/artifact — pero en la app real usa Material Symbols vía `next/font` o CDN, igual que el HTML original.

## 3. Documentos de referencia obligatorios

Antes de generar una sola línea de código, lee y respeta:

- `01_ESQUEMA_BASE_DATOS.md` — esquema completo de Supabase, tablas, relaciones, políticas RLS (descripción funcional, no el DDL final).
- `02_ESPECIFICACION_FUNCIONAL.md` — comportamiento detallado de cada módulo (Leads, Tareas, Simulaciones, Pedidos Finalizados, Lead Detail).
- `03_PLAN_DE_FASES.md` — orden de implementación. Sigue las fases en orden; no implementes la Fase 3 sin que la Fase 1 y 2 estén funcionales y desplegadas en Vercel.
- `04_CONSTITUCION_TECNICA.md` — **generado por Opus en la Fase 0, no existe todavía**. Una vez exista, es la fuente de verdad por encima de los tres documentos anteriores en caso de cualquier conflicto de detalle (nombres, tipos, DDL exacto).

## 4. Alcance funcional (resumen — detalle completo en `02_`)

La app tiene 4 vistas principales + 1 vista de detalle, navegables desde un sidebar fijo:

1. **Leads** — listado/tabla de prospectos con estado, fuente, fecha de registro. Click en una fila → vista de detalle.
2. **Lead Detail** — perfil completo del lead: datos de contacto, timeline de notas/eventos, gestión de tareas asociadas, selector rápido de estado, envío de plantillas de WhatsApp.
3. **Tareas** — tablero Kanban (Pendiente / En proceso / Revisión / Completada) con tarjetas vinculadas a leads.
4. **Simulaciones** — calculadora financiera de cuotas (capital, TIN/TAE, plazo) con comparativa de varios plazos; puede usarse de forma libre o guardarse vinculada a un lead.
5. **Pedidos Finalizados** — archivo histórico de operaciones cerradas (aprobadas/denegadas/en revisión).

## 5. Roles y permisos (obligatorio, ver detalle de RLS en `01_`)

- **Admin**: acceso total. Gestiona usuarios (invitar, asignar rol, desactivar). Ve y edita todos los leads, tareas, simulaciones y pedidos. Asigna manualmente los leads entrantes sin asignar (los que llegan por webhook).
- **Comercial**: ve **todos** los leads (visibilidad compartida del pipeline), pero solo puede **editar/mover/cerrar** los leads, tareas y simulaciones que tiene asignados a sí mismo (`assigned_to = auth.uid()`).
- Todo control de acceso a nivel de fila debe implementarse con **RLS en Postgres**, no solo con checks en el frontend. La UI puede ocultar botones de edición para comerciales en leads ajenos, pero la policy de Postgres es la barrera real.

## 6. Integraciones externas

### 6.1 Webhook de leads — TikTok Lead Ads
- Implementa un **Route Handler** (`app/api/webhooks/tiktok-leads/route.ts`) que reciba el payload de TikTok Lead Ads.
- Valida la firma/secreto del webhook según la documentación oficial de TikTok Lead Ads (busca la spec vigente, puede haber cambiado — no asumas un formato fijo sin verificarlo).
- Cada lead recibido se inserta en la tabla `leads` con `assigned_to = NULL` y `source = 'tiktok_lead_ads'`.
- Los leads sin asignar deben aparecer destacados/agrupados en la vista de Leads, visibles solo para Admin con acción de "Asignar a...".
- Diseña el endpoint de forma genérica (un parser de payload por fuente) para poder añadir Meta Lead Ads u otras fuentes en el futuro sin rehacer el endpoint.

### 6.2 WhatsApp Business API
- La integración debe quedar **desacoplada detrás de una interfaz** (`lib/whatsapp/provider.ts`) con una implementación concreta intercambiable: el cliente aún no ha decidido entre **Meta Cloud API** o **Twilio**.
- Implementa primero un **mock provider** que registra el envío en la tabla `whatsapp_messages` sin llamar a ninguna API externa, permitiendo que el resto de la app (UI de plantillas, historial de envíos) funcione end-to-end desde el día 1.
- Deja documentado en el código (comentarios + `02_ESPECIFICACION_FUNCIONAL.md`) qué variables de entorno necesitará cada proveedor real cuando se decida.

## 7. Requisitos no funcionales

- **TypeScript estricto** (`strict: true`), sin `any` salvo justificación explícita en comentario.
- **Accesibilidad básica**: roles ARIA en modales, foco gestionado al abrir/cerrar modal, contraste ya validado por la paleta del prototipo.
- **Responsive**: el sidebar colapsa en móvil igual que en el prototipo (`hidden md:flex`); prioriza que Leads y Lead Detail funcionen bien en móvil ya que los comerciales lo usarán en calle.
- **Manejo de errores**: toda Server Action devuelve `{ success, error }` tipado; los formularios muestran el error de validación de Zod de forma legible.
- **Auditoría mínima**: cada cambio de estado de un lead debe registrar un evento en la tabla `lead_events` (ya reflejado en el timeline del prototipo "Notas & Seguimiento").
- **Sin datos de prueba hardcodeados en producción**: usa seed scripts (`supabase/seed.sql`) solo para entorno de desarrollo.

## 8. Estructura de proyecto esperada

```
/app
  /(auth)/login
  /(dashboard)/leads
  /(dashboard)/leads/[id]
  /(dashboard)/tareas
  /(dashboard)/simulaciones
  /(dashboard)/pedidos
  /(dashboard)/admin/usuarios        (solo Admin)
  /api/webhooks/tiktok-leads
/components
  /ui            (componentes atómicos reutilizables)
  /leads
  /tareas
  /simulaciones
  /pedidos
/lib
  /supabase      (client.ts, server.ts)
  /whatsapp      (provider.ts + mock-provider.ts)
  /validations   (esquemas Zod)
  /finance       (lógica de cálculo de cuotas — pura, testeable, sin dependencias de UI)
/supabase
  /migrations
  seed.sql
middleware.ts
```

## 9. Criterios de aceptación de la entrega

- `npm run build` pasa sin errores ni warnings de tipos.
- Las políticas RLS de Supabase están en migraciones versionadas (`supabase/migrations/`), nunca aplicadas solo a mano desde el dashboard.
- Login con Supabase Auth funcional (email/password como mínimo; OAuth opcional/futuro).
- Un usuario Comercial no puede, ni desde la UI ni vía API directa, modificar un lead que no es suyo (pruébalo intentando un `UPDATE` vía REST con el JWT de un comercial sobre un lead ajeno — debe fallar por RLS).
- Deploy funcional en Vercel con variables de entorno documentadas en `.env.example`.
- El diseño visual final coincide con el prototipo HTML de referencia (misma paleta, tipografía, layout).

## 10. Checkpoints de verificación entre fases (especialmente importantes con Flash como ejecutor)

Al cerrar cada fase de `03_PLAN_DE_FASES.md`, exige explícitamente:

1. Listado de archivos creados/modificados en esa fase.
2. Confirmación textual de que `npm run build` se ejecutó y su resultado exacto (no "debería funcionar").
3. Si la fase tocó RLS: el fragmento SQL exacto de la policy nueva o modificada, citado en la respuesta, para poder revisarlo sin entrar al dashboard de Supabase.
4. Cualquier desviación respecto a `04_CONSTITUCION_TECNICA.md` señalada de forma explícita y justificada — nunca silenciosa.

Si alguno de estos 4 puntos falta en la respuesta de Flash, no se da la fase por cerrada y se le repite la petición de verificación antes de avanzar.

## 11. Instrucción final para el agente

**Para la sesión con Claude Opus 4.6 (Fase 0 — arquitectura)**: tu único entregable es `04_CONSTITUCION_TECNICA.md`. No escribas código de aplicación todavía. Cierra toda ambigüedad que encuentres en los documentos `01_`, `02_` y `03_` tomando tú la decisión final y razonándola brevemente. El objetivo es que Gemini Flash pueda ejecutar después sin tener que interpretar ni decidir nada de arquitectura por sí mismo.

**Para las sesiones con Gemini Flash (Fases 1 en adelante)**: antes de escribir código en cada fase, resume en 5-10 líneas qué vas a implementar según `03_PLAN_DE_FASES.md` y qué partes de `04_CONSTITUCION_TECNICA.md` vas a aplicar literalmente. Implementa, y cierra la fase con el checkpoint de verificación de la sección 10. Si encuentras un caso no cubierto por la Constitución Técnica, detente y señálalo en vez de improvisar una solución propia.
