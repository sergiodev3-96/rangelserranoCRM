# 03 — Plan de Fases de Implementación

> El agente debe seguir este orden. No avanzar de fase sin que la anterior compile, despliegue y sea verificable manualmente.

## Fase 0 — Setup de proyecto

- Crear proyecto Next.js 15 (`create-next-app`, TypeScript, App Router, Tailwind).
- Migrar el `tailwind.config` del prototipo HTML a `tailwind.config.ts` (colores, fontFamily, spacing, fontSize tal cual están en el HTML).
- Crear proyecto en Supabase. Activar Auth por email/password.
- Conectar repositorio a Vercel. Confirmar que un deploy "Hello World" funciona antes de tocar lógica de negocio.
- Crear `.env.example` documentando todas las variables necesarias desde el principio (aunque algunas se rellenen después): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o `sb_publishable_xxx`), `SUPABASE_SERVICE_ROLE_KEY` (o `sb_secret_xxx`), `TIKTOK_WEBHOOK_SECRET`, y placeholders para WhatsApp (`WHATSAPP_PROVIDER`, etc.).

**Entregable verificable**: app desplegada en Vercel, accesible por URL pública, sin funcionalidad de negocio aún.

## Fase 1 — Auth + esquema base + roles

- Implementar `utils/supabase/client.ts`, `server.ts`, `middleware.ts` según patrón `@supabase/ssr`.
- Migraciones de `profiles` con trigger de creación automática al signup, y RLS básico.
- Pantalla de login funcional.
- Crear (vía seed o manualmente en el dashboard) un primer usuario Admin real para poder operar el sistema.
- Implementar la función Postgres `is_admin()` reutilizable.

**Entregable verificable**: login funcional en producción; un Admin puede entrar y ver una pantalla vacía protegida; un usuario no autenticado es redirigido a `/login`.

## Fase 2 — Leads (núcleo del CRM)

- Migración de tabla `leads` + `lead_events` con RLS completo según `01_ESQUEMA_BASE_DATOS.md`.
- Vista `/leads`: tabla con datos reales, filtros básicos, creación manual de lead.
- Vista `/leads/[id]`: detalle completo, timeline de eventos, selector de estado funcional, notas.
- Verificación manual de RLS: crear un segundo usuario Comercial de prueba y confirmar que no puede editar leads ajenos (ni desde la UI ni intentando un `UPDATE` directo vía API REST de Supabase con su JWT).

**Entregable verificable**: Admin y Comercial pueden trabajar con leads reales en producción; las restricciones de edición por rol están probadas, no solo asumidas.

## Fase 3 — Tareas + Simulaciones

- Migración de `tasks` y `simulations`.
- Vista `/tareas`: Kanban con drag&drop conectado a Server Actions.
- Vista `/simulaciones`: calculadora funcional en cliente (lógica pura en `lib/finance/`) + persistencia opcional vinculada a lead.
- Integrar bloque de tareas e historial de simulaciones dentro de Lead Detail.

**Entregable verificable**: flujo completo lead → tarea → simulación → todo visible desde el detalle del lead.

## Fase 4 — Pedidos Finalizados + WhatsApp (mock) + Webhook TikTok

- Migración de `orders`, `whatsapp_messages`, `webhook_logs`.
- Vista `/pedidos` con datos reales.
- Implementar `lib/whatsapp/provider.ts` con mock provider funcional end-to-end (UI de plantillas → registro en BD → timeline del lead).
- Implementar endpoint `app/api/webhooks/tiktok-leads/route.ts`, con validación de firma/secreto y registro en `webhook_logs` siempre, exitoso o no.
- Flujo "lead sin asignar" visible y asignable por Admin desde `/leads`.

**Entregable verificable**: un POST de prueba (simulado con `curl`/Postman) al webhook crea un lead sin asignar que un Admin puede ver y asignar desde la UI.

## Fase 5 — Administración de usuarios

- Vista `/admin/usuarios` (solo Admin): listado, invitación, cambio de rol, activar/desactivar.
- Probar que un usuario desactivado no puede iniciar sesión.

**Entregable verificable**: Admin puede invitar a un nuevo comercial real y este puede loguearse y empezar a trabajar.

## Fase 6 — Pulido, WhatsApp real (cuando el cliente decida proveedor) y exportaciones

- Sustituir el mock provider de WhatsApp por la implementación real (Meta Cloud API o Twilio, según decisión final del cliente) sin tocar el resto del flujo.
- Exportación CSV de Pedidos Finalizados.
- Revisión de accesibilidad y responsive en móvil (uso real en calle por comerciales).
- Revisión general de rendimiento (paginación de leads si el volumen crece, índices, etc.).

**Entregable verificable**: sistema en producción usado de forma real por el equipo, con WhatsApp real conectado.

## Notas sobre el orden

- Las fases 2 y 3 son las que más valor aportan de forma inmediata; priorízalas si hay restricciones de tiempo.
- El webhook (Fase 4) puede adelantarse si el cliente ya tiene campañas de TikTok activas generando leads reales que se están perdiendo por no tener el sistema listo — evaluar con el cliente si conviene adelantar solo esa pieza.
- No introducir Realtime de Supabase hasta que el resto del flujo esté estable; es una mejora de experiencia (ver cambios de otros comerciales sin recargar) pero no es bloqueante para el MVP funcional.
