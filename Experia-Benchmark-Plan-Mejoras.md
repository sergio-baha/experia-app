# Experia · Benchmark competitivo y plan de implementación de mejoras

> Fecha: junio 2026 · Basado en análisis de Duolingo, Khan Academy, Platzi, Crehana, UBITS, SC Training (EdApp), 360Learning, TalentLMS y Moodle, contrastado con el estado actual del código de Experia.

---

## 1. Posicionamiento de Experia

Experia es una plataforma de formación docente gamificada (XP, niveles, insignias, mapa de ruta, retos interactivos, entregas con rúbrica, certificados) con 3 roles (estudiante/instructor/admin), multi-institución y cohortes, sobre React + Vite + Supabase.

**Fortalezas actuales frente al mercado** (no perderlas):
- Mapa de ruta visual e interactivo — pocos LMS lo tienen; es el diferenciador visual de Experia.
- Retos interactivos propios (drag & drop, mapa de empatía, quiz) en vez de solo video + quiz.
- Editor de rutas para el instructor con actualización en tiempo real (Supabase Realtime).
- Calificación con rúbrica estructurada y devolución de entregas.
- 

---

## 2. Benchmark por plataforma

| Plataforma | Qué hace mejor que Experia | Mecánica concreta |
|---|---|---|
| **Duolingo** | Hábito diario y retención | Rachas (streaks) con aversión a la pérdida (+60% retención), ligas/leaderboards semanales (+40% engagement), meta diaria de XP, recordatorios push. Usuarios con racha de 7 días son 3.6x más propensos a continuar. |
| **Khan Academy** | Maestría y progreso granular | Puntos de energía por actividad, badges de "maestría" por competencia (no solo por completar), racha discreta con recordatorios suaves. |
| **Platzi** | Certificación y rutas | Certificado digital al completar curso Y ruta, certificado físico/perfil profesional, escuelas → rutas → cursos, perfil público compartible. |
| **Crehana** | Microlearning | Clases de 1–12 min, progreso por micro-sesión; sensación de avance constante. |
| **UBITS** | Medición de impacto (B2B) | Rutas personalizadas por competencia + dashboards de impacto para la organización (clave para vender a colegios/secretarías). |
| **SC Training (EdApp)** | Retención de conocimiento | Repetición espaciada (algoritmo SM-2, "Brain Boost"): quizzes de repaso automáticos sobre contenido ya visto; mobile-first; push notifications; >80% de tasa de finalización en microlearning. |
| **360Learning** | Aprendizaje colaborativo | Comentarios/discusión por lección, co-creación entre pares, reacciones; comunidad dentro del curso. |
| **TalentLMS / Moodle** | Operación del LMS | Reportes exportables, notificaciones por email automatizadas, learning paths con prerrequisitos, SCORM (no aplica a Experia). |

---

## 3. Análisis de brechas (gap analysis)

| # | Brecha en Experia | Evidencia de mercado | Impacto | Esfuerzo |
|---|---|---|---|---|
| G1 | **Sin rachas ni meta diaria/semanal** — el XP existe pero no genera hábito de regreso | Duolingo, Khan | 🔴 Alto | Bajo |
| G2 | **Sin leaderboard de cohorte** — la cohorte existe en BD pero no se usa socialmente | Duolingo (ligas) | 🔴 Alto | Bajo |
| G3 | **Notificaciones solo in-app (campana)** — si el docente no entra, nada lo trae de vuelta | EdApp, TalentLMS | 🔴 Alto | Medio |
| G4 | **Certificado solo imprimible** — sin PDF descargable, sin URL de verificación, sin compartir en LinkedIn | Platzi | 🟠 Medio-alto | Medio |
| G5 | **Sin repaso / repetición espaciada** — el contenido completado nunca se vuelve a tocar | EdApp (SM-2) | 🟠 Medio-alto | Medio |
| G6 | **Sin onboarding** — el primer login cae directo al mapa sin tour ni checklist | Estándar SaaS | 🟠 Medio | Bajo |
| G7 | **Sin discusión/comunidad** — el docente aprende solo; no hay comentarios por módulo | 360Learning | 🟡 Medio | Medio |
| G8 | **Sin URLs navegables** (store propio sin router) — no se puede compartir un enlace a un curso/lección, no hay back del navegador | Todas | 🟡 Medio | Medio |
| G9 | **No instalable / sin push** — no es PWA; en móvil vive en una pestaña | EdApp (mobile-first) | 🟡 Medio | Medio |
| G10 | **Analítica de instructor básica** — sin alertas de estudiantes en riesgo ni funnel de finalización | UBITS, TalentLMS | 🟡 Medio | Medio |
| G11 | **Sin IA** — ni asistente de retroalimentación para el instructor ni generación de quizzes | Tendencia 2026 transversal | 🟢 Estratégico | Alto |
| G12 | **Badges solo por completar** — no hay badges de maestría, constancia o comunidad | Khan Academy | 🟢 Bajo | Bajo |

---

## 4. Plan de implementación

### FASE A — Quick wins de engagement (1–2 semanas)
*Objetivo: crear el bucle de hábito. Todo se apoya en datos que ya existen (`xp`, `completed`, `challenge_attempts`, `cohorts`).*

**A1. Rachas (streaks)** — G1
- Nueva tabla `activity_log (user_id, activity_date)` con upsert diario al completar cualquier acción (lección, reto, login con actividad).
- Cálculo de racha actual y mejor racha en `loadStudentSession`.
- UI: llama 🔥 con contador en el Header (junto al nivel), estado "en riesgo" si no hay actividad hoy; badge `constante-7` y `constante-30`.

**A2. Meta semanal de XP** — G1
- Campo `weekly_goal` en `profiles` (default 300 XP). Anillo de progreso (`ProgressRing` ya existe) en el mapa: "Esta semana: 180/300 XP".
- Celebración con `Confetti` (ya existe) al cumplirla.

**A3. Leaderboard de cohorte** — G2
- Vista Supabase `cohort_leaderboard` (suma de XP semanal por `cohort_id`, top 10 + posición propia).
- Nueva sección en el mapa o en Perfil: tabla con avatar, nombre, XP semanal. Reset semanal = solo filtrar por `created_at` de la semana (sin jobs).
- Privacidad: mostrar solo nombre de pila + inicial; opt-out en perfil.

**A4. Onboarding de primer ingreso** — G6
- Flag `onboarded` en `profiles`. Modal de bienvenida en 3 pasos (Modal ya existe) + checklist "Primeros pasos" (completa tu perfil, termina el módulo 1, gana tu primer reto) con XP bonus.

**A5. Badges de maestría y constancia** — G12
- Ampliar el diccionario `BADGES`: `perfeccionista` (reto al primer intento con 100%), `constante-7/30` (rachas), `madrugador` (actividad antes de 7am), `companero` (primer comentario cuando exista G7).

### FASE B — Retención y valor del certificado (3–4 semanas)

**B1. Notificaciones por email** — G3
- Supabase Edge Function + Resend (o SMTP institucional): correo cuando el instructor devuelve/aprueba una entrega (hoy solo campana), recordatorio de racha en riesgo (cron diario), y resumen semanal de progreso al estudiante e instructor.
- Tabla `email_preferences` para opt-out granular.

**B2. Certificado 2.0** — G4
- Generación PDF client-side (la librería `jspdf` o impresión a PDF mejorada) + registro `certificates (id, user_id, course_id, issued_at, uuid_verificacion)`.
- Página pública `/#/cert/<uuid>` de verificación (clave para credibilidad institucional).
- Botón "Compartir en LinkedIn" (URL de añadir certificación de LinkedIn, sin API).

**B3. Modo repaso (repetición espaciada simple)** — G5
- Sin SM-2 completo al inicio: cola de repaso con intervalos fijos (1, 3, 7, 21 días) sobre preguntas de quizzes ya completados. Tabla `review_queue (user_id, module_id, due_date, interval)`.
- Tarjeta "Repaso del día" en el mapa: 3–5 preguntas, +XP reducido. Es el feature con mayor evidencia de impacto en retención de conocimiento (>80% finalización en EdApp).

**B4. Rutas con URLs (hash routing ligero)** — G8
- Sin reescribir el store: sincronizar `page`/`nodeId` con `location.hash` (`#/curso/x/leccion/y`) en `nav()` + listener de `hashchange`. Habilita: back del navegador, deep links compartibles, y analytics por página.

### FASE C — Comunidad y datos (1–2 meses)

**C1. Comentarios por módulo** — G7
- Tabla `comments (module_id, user_id, body, parent_id)` + Realtime. Hilo simple al pie de cada lección, moderable por el instructor. XP por primera participación.

**C2. Panel "estudiantes en riesgo"** — G10
- Query: estudiantes sin actividad en 7/14 días o con reto fallido 3+ veces. Tarjeta de alertas en el dashboard del instructor con acción "enviar recordatorio" (usa B1).
- Funnel de finalización por módulo (dónde se atascan) en AdminAnalytics.

**C3. PWA instalable** — G9
- `manifest.json` + service worker con `vite-plugin-pwa` (cache de shell, no de datos). Prompt de instalación en móvil. Prepara el terreno para Web Push (G3 nivel 2).

### FASE D — Estratégico con IA (trimestre)

**D1. Asistente de retroalimentación para el instructor** — G11
- Edge Function que llama a la API de Claude: dado el texto de la entrega + rúbrica, sugiere borrador de feedback por criterio. El instructor edita y aprueba (human-in-the-loop).

**D2. Generador de quizzes para el editor de rutas** — G11
- En el editor de módulos custom: "Generar 5 preguntas desde este contenido" → revisión del instructor → guardar.

**D3. Tutor IA para el estudiante** (evaluar después de D1/D2)
- Chat contextual dentro de la lección que solo responde sobre el contenido del módulo.

---

## 5. Priorización (impacto vs esfuerzo)

```
Impacto
  Alto   │ A1 Rachas      B1 Email
         │ A3 Leaderboard B3 Repaso
         │ A2 Meta semanal      D1 IA feedback
  Medio  │ A4 Onboarding  B2 Certificado2.0   C2 En-riesgo
         │ A5 Badges      B4 URLs             C1 Comentarios
  Bajo   │                C3 PWA              D3 Tutor IA
         └────────────────────────────────────────────
           Bajo            Medio               Alto     Esfuerzo
```

**Orden recomendado de ejecución**: A1 → A3 → A2 → A4 → A5 → B1 → B4 → B2 → B3 → C2 → C1 → C3 → D1 → D2.

## 6. Métricas para validar cada mejora

| Mejora | Métrica | Línea base a medir antes |
|---|---|---|
| Rachas + meta | DAU/WAU, % usuarios con racha ≥7 | Frecuencia de login actual |
| Leaderboard | Sesiones/semana por cohorte | XP semanal promedio |
| Email | Tasa de retorno tras notificación | % entregas revisadas que el estudiante ve en <48h |
| Repaso | Retención de quiz a 30 días | Score en reintentos actuales |
| Certificado 2.0 | Certificados compartidos/verificados | — |
| En-riesgo | % estudiantes inactivos recuperados | % abandono por cohorte |

---

*Fuentes del benchmark: análisis de gamificación de Duolingo/Khan Academy (Prodwrks, StriveCloud, Trophy.so, Yu-kai Chou), documentación de SC Training/EdApp (spaced repetition, microlearning), comparativas LMS 2026 (Software Advice, Capterra, D2L, Calibr), y sitios oficiales de Platzi, Crehana y UBITS.*
