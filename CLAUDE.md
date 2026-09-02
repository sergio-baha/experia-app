# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Experia by CEINFES — Codebase Guide

> **Experia** is a web platform for teacher training in Experience-Centered Design (DCE). Teachers progress through interactive lessons, challenges, and final deliverables, supervised by instructors.

**Production:** https://experia-app.pages.dev  
**Version:** v15 (July 2026) — multi-course + 4 immersive themes + **Modo Aula en Vivo** (quiz sincrónico tipo Kahoot) + **análisis de ítems** (dificultad/discriminación/distractores)

---

## Quick Start

```bash
npm install
cp .env.example .env          # Add VITE_SUPABASE_* vars
npm run dev                    # http://localhost:5173
npm run build                  # Production build
git push                       # Auto-deploys to Cloudflare
```

### Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server on :5173 |
| `npm run build` | Production build → dist/ |
| `npm run preview` | Preview locally |

---

## Stack Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.3.1 |
| Build | Vite | 5.4.10 |
| Hosting | Cloudflare Pages | — |
| Backend | Supabase (PostgreSQL) | Pro |
| Auth | Supabase Auth (JWT) | — |
| Data imports | XLSX | 0.18.5 |
| Avatares | @dicebear/core + @dicebear/styles | 10.x |

**Not used:** TypeScript, CSS frameworks (Tailwind), Redux, react-router, testing frameworks

---

## Architecture

**Frontend (React SPA):**
- Hash-based routing (`#/page/nodeId`)
- Custom reactive store (XS) — no Redux/Zustand
- Inline styles + CSS variables (dark mode + accent colors)
- Lazy-loaded pages per role (student/instructor/admin)

**Backend (Supabase):**
- PostgreSQL database with RLS (Row Level Security)
- JWT auth via Supabase Auth
- Realtime subscriptions to route_configs
- Edge Functions (Deno) for admin tasks

**Hosting (Cloudflare Pages):**
- Static SPA hosting
- Auto-deploys on git push
- Global CDN

---

## State Management (`src/store/store.jsx`)

**Custom store (80 lines)** — lightweight, reactive:

```javascript
const XS = createExpStore({
  isLoggedIn, user, page, nodeId,
  xp, completed, badges, notifications,
  selectedArea, accounts, submissions,
  routeConfigs, courses, courseModules
});

const useStore = (sel) => { /* React hook */ };
```

**Key actions:**
- `useStore(sel)` — Subscribe to state
- `nav(page, nodeId)` — Navigate
- `completeNode(id)` — Complete module, award XP
- `selectArea(areaId)` — Choose area
- `doLogout()` — Sign out

**Educational data (in code):**
- `AREAS` — 5 learning areas (lectura, ciudadanas, ingles, matematicas, ciencias)
- `SHARED_MODULES` — Common modules (Intro, Empathy) for all students
- `AREA_CONTENT` — Area-specific modules 3 & 4, match pairs, simulations
- `BADGES` — 9 achievement types
- `LEVELS` — XP progression (0 → 3500+)

---

## Routing (Hash-Based)

**No react-router.** Pure hash routing with manual state sync:

- URL pattern: `#/page/nodeId` (e.g., `#/lesson/mod1`)
- Synced via `hashchange` event listener
- Deep links work; browser back/forward work
- Pages lazy-loaded per role

**Main pages:**
- `landing` — Signup/login
- `login` — Auth form
- `map` — Learning map (students)
- `lesson` — Content viewer
- `challenge` — Interactive retos
- `grid` — Final deliverables
- `profile` — User settings
- `admin-*` — Admin pages (users, courses, schools, analytics, cohorts)
- `instructor-*` — Instructor pages (dashboard, stats, route editor)

---

## Components (`src/components/`)

**Main components:**
- `Sidebar` — Role-based navigation
- `Header` — User info, theme toggle, notifications
- `ui.jsx` — Reusable library:
  - Btn (7 variants), Modal, ProgressRing/Bar
  - 19 SVG icons
  - NotifManager (toasts), Charts

**Design system:**
- CSS variables: colors, spacing, shadows, fonts (DM Sans)
- Dark mode: `[data-theme="dark"]`
- Accent options: `[data-accent="azul"|"esmeralda"]`
- Animations, gradients, glassmorphism

---

## Database (Supabase)

**Core tables:**

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (extends auth.users) |
| `institutions` | Schools |
| `cohorts` | Teacher cohorts |
| `progress` | XP tracking (legacy) |
| `course_progress` | XP per course enrollment |
| `submissions` | Final deliverables |
| `challenge_attempts` | Challenge answers |
| `messages` | Instructor feedback |
| `route_configs` | Custom learning routes |
| `courses` | Course definitions |
| `course_modules` | Modules per course |
| `course_enrollments` | Student ↔ course matrícula (drives course switcher + `enrolledCourseId`) |
| `user_courses` | Per-user course access grant (strict gate, migration 0018) |
| `institution_courses` | Course enabled per institution |
| `live_sessions` | Live quiz session state (phase, current question, **snapshot SIN respuestas**) — migration 0022 |
| `live_session_keys` | Respuestas correctas + explicación de la sesión (SOLO el host las lee) |
| `live_participants` | Quien se unió por PIN (nombre, apellido, correo, salón) + puntaje/racha |
| `live_answers` | Respuestas enviadas (1 por participante/pregunta) |
| `presence_gates` | Código presencial vigente por módulo (`course_modules.requires_presence_code`) — SOLO el host lo lee |
| `presence_unlocks` | Qué estudiante desbloqueó qué módulo con el código presencial (permanente) — migration 0039 |

**Security:**
- RLS (Row Level Security) per role
- Helper functions: `is_admin()`, `is_instructor()`
- Students: read/write own data only
- Instructors: read students in institution
- Admins: full access

**Active/inactive access control** (migration 0017):
- `profiles.is_active` and `institutions.is_active` (both default `true`).
- A non-admin is blocked if their profile **or** their institution is inactive. Admins are never blocked.
- Enforced frontend-side via `getAccessBlockReason()` at login (`login.jsx`, shows message) and session restore (`main.jsx`, silent sign-out). Toggled from AdminUsers / AdminSchools. ⚠️ Currently logged-in users are blocked on next session, not kicked live.

**Course access — THREE tables that must stay in sync** (migration 0018):
A student seeing/entering a course depends on three separate tables. Mismatches between them are a recurring source of "el curso no aparece" bugs:
- `user_courses` (**strict gate**) — drives *"Elige tu curso"* (`CourseSelection.jsx`). A course only shows if there's a row here with `is_active=true` for that user. Managed from AdminUsers.
- `course_enrollments` (**matrícula**) — drives the multi-course switcher in `map.jsx` (`allEnrollments`) and `enrolledCourseId` (via `loadStudentSession`). Also gates `CourseSelection` vs `map` in `app.jsx`.
- `course_progress` — XP/completed/badges per enrollment.

⚠️ **Access and enrollment must go together.** The store keeps them synced per action: `enrollInCourse`, `setUserCourseAccess`/`Bulk`, and `autoEnrollInstitutionStudents` all upsert *both* `user_courses` **and** `course_enrollments` (+ empty `course_progress`, never resetting existing). `switchCourse` creates a missing enrollment on the fly. The map switcher shows the **union** of enrollments + active access (`switchableCourseIds`) so a lagging table self-heals. Granting access never resets progress; revoking access removes nothing.
- ⚠️ Creating a course (seed or AdminCourses) grants **no** access — assign it per institution (Admin → Cursos, runs `autoEnroll`) or per user (AdminUsers) afterwards, or it appears to nobody.

**Course expiry per institution** (migration 0030): `institution_courses.expires_at` (nullable, `null` = indefinido). Set from AdminCourses when enabling a course for an institution (or edited later by clicking the institution pill). On expiry the course is fully revoked for that institution — **not** the soft "leave existing access alone" behavior of a manual disable: `sync_my_institution_courses()` (called on every student login via `loadStudentSession`) deactivates the expired `institution_courses` row **and** flips `user_courses.is_active=false` for that student/course. Same caveat as the `is_active` gate above: a currently-logged-in student isn't kicked live, only blocked on their next session.

**Realtime:**
- Subscribed to `route_configs` changes

---

## Session & Data Flow

**On app launch** (`src/main.jsx`):
1. Restore Supabase auth session
2. Load profiles, institutions, cohorts
3. Load role-specific data (submissions, etc.)
4. Load course_modules if courses enabled
5. Determine landing page (area/course selection guards)
6. Subscribe to route_configs realtime
7. Support deep links via hash
8. Render App with XS store hydrated
9. Timeout: 20 seconds max

**Idle auto-logout** (`src/lib/idleTimeout.js`): logs out after **30 min of inactivity** (`IDLE_LIMIT_MS`). Tracks last activity (mouse/keyboard/scroll/touch/click) in `localStorage` (`experia:last-activity`). `App` starts `startIdleWatch(doLogout)` while logged in; `restoreSession` (`main.jsx`) checks `isSessionExpired()` and refuses to restore a stale session on browser reopen; `doLogout` clears the marker.

---

## Key Patterns

### 1. Component Memoization

```javascript
const Sidebar = React.memo(({ mobileOpen }) => {
  const page = useStore(s => s.page);  // Re-render only if page changes
  // ...
});
```

Narrow selectors prevent unnecessary re-renders.

### 2. Responsive Design

```javascript
const isMobile = useMobile(768);  // Custom hook
```

Sidebar + header on desktop; mobile overlay on phone.

### 3. Inline Styles (No CSS Classes)

All styling via inline objects + CSS variables:
- Style isolation (no class conflicts)
- Theme switching via data attributes
- Dynamic colors at runtime

### 4. Module Completion

```
User completes challenge
  ↓
completeNode(id) → XS updates xp, completed[], badges[]
  ↓
Write to Supabase (progress or course_progress)
  ↓
Show XP popup + badge toast
  ↓
Next module unlocks (dependencies checked)
```

### 5. Challenge Types

`challenge_type` value (exact string, **no hyphens**) → component in `challenges.jsx`. Unknown values fall back to `designlab`.

| `challenge_type` | Mechanic | `challenge_data` shape |
|------------------|----------|------------------------|
| `dragdrop` | Reorder phrases | `{ dragItems: ["str", ...] }` (array of strings in correct order) |
| `empathy` | Sort cards into 4 quadrants | `{ empathyCards: [{id,text,correct}] }`, `correct ∈ piensa\|siente\|dice\|hace` |
| `simulation` | Multi-step decision tree | ⚠️ ignored — always renders the built-in generic `SIM_TREE` (store doesn't forward sim data) |
| `matching` | Connect concepts ↔ definitions | `{ matchPairs: [{id,concept,def}] }` |
| `quiz` | Multiple-choice questions | `{ questions: [{question,questionAfter?,options,correct, weight?, image?,imageHeight?,imagePosition?,optionImages?,explanation?,explanationImage?,timeLimit?,points?,difficulty?}], passage?, passingScore?, maxAttempts?, passMessage?, failMessage? }` |
| `truefalse` | Mark statements true/false | `{ statements: [{id,text,answer:bool}] }` |
| `fillblank` | Fill blanks from a word bank | `{ blanks: [{id,before,answer,after}] }` |
| `designlab` | Open-ended final (rubric) | n/a (rubric in `content`) |

**Adding a challenge type** (e.g. `truefalse`) touches: `challenges.jsx` (render component + dispatcher map), `store.jsx` (`dbModToAppMod` forward + `publishRouteToCourse` ×2), `route-editor/constants.js` (`CHALLENGE_TYPES` + `CTYPE_EMOJI`), `route-editor/EditorContents.jsx` (author UI) + `ChallengeEditorModal.jsx` (register), `route-editor/RoutePreviewModal.jsx` (preview), `games.jsx` (icon/label).

**Lesson `content`** is an array of sections rendered by `lesson.jsx`. Supported `type`s: `intro`, `text`, `quote`, `steps`, `reveal`, `image`, `callout`, `concepts`, `compare`, `video`, `embed`, `checklist`, `download`, `pdf`. There is **no** `heading` type. `steps`/`reveal`/`concepts` items use `t`/`d` keys; images use `url`.

**Módulos multipágina (`pagebreak`, ago 2026).** Un módulo tipo lección puede pedirle al estudiante llegar a la última pantalla antes de poder completarlo. Se implementa como un tipo de sección más, `{type:'pagebreak'}`, insertado entre las secciones normales de `content` — **no** es un nuevo esquema, así que viaja solo por todos los caminos que ya mueven `content` (store, RPCs, forks). `splitContentPages` (`lesson.jsx`) parte `content` por esos marcadores; sin ninguno devuelve **un solo grupo** con todo, así que la inmensa mayoría de las lecciones (sin saltos) no cambia de comportamiento.
- **Autoría:** botón "➗ Salto de página" en `CustomModuleModal.jsx`, junto a los tipos de sección normales pero fuera de `SECTION_TYPES` (no tiene campos propios, es un divisor). Se reordena/elimina igual que cualquier sección.
- **`LessonBody` acepta `page` (opcional).** Sin él (previews en `RoutePreviewModal`, `GuidedClassView`, `LiveHost`) renderiza TODO el contenido de corrido, filtrando los `pagebreak` — el instructor sigue viendo la lección completa de un vistazo. Con `page` (solo lo pasa `LessonView`) pinta únicamente esa página; el hero y la caja de tarea van solo en la página 0, los "Recursos adicionales del instructor" solo en la última.
- **Gate de completar:** en `LessonView`, si `content` tiene ≥1 salto, el criterio de scroll (85% desplazado) se desactiva por completo y se reemplaza por "estar en la última página" — no hace falta volver a hacer scroll dentro de ella. El botón "Completar lección" solo aparece en la última página; antes, el estudiante navega con "Anterior"/"Siguiente" (navegación libre, sin restricción de solo-avanzar) y un indicador "Página X de Y". Sin saltos, el módulo se comporta exactamente igual que siempre (gate por scroll).

**Tamaño de imágenes y visor de PDF (ago 2026).** `image` y `pdf` aceptan `width` y `height` opcionales (número = px; también `'80%'`, `'40rem'` — los normaliza `cssSize` en `lesson.jsx`). Se editan en `CustomModuleModal` (`SizeFields`), que es el editor de contenido de TODOS los módulos tipo lección, no solo los personalizados.
- ⚠️ **Vacíos = comportamiento histórico**: la imagen va a ancho completo con `objectFit:'cover'` y `maxHeight` 420 px, o sea **recortada**. Solo al escribir un alto se pasa a `contain` (imagen completa, sin recorte). Es deliberado: cambiar el default le habría cambiado el aspecto a todas las lecciones ya publicadas.
- `pdf` ≠ `download`: el primero se **lee incrustado** (`<object>`, alto 720 px por defecto), el segundo se **baja**. Es la alternativa a subir un documento largo como una imagen gigante. Botón **⛶ Ampliar** → overlay a pantalla completa (Escape para cerrar, `zIndex 6000` para quedar **sobre** los modales de `ui.jsx` (5000) y funcionar dentro de la vista previa del editor).
- **`allowDownload`** (por sección, `undefined`/ausente = permitido, para no cambiar los PDF ya publicados): en `false` se ocultan "Abrir en pestaña nueva"/descarga y el visor carga con `#toolbar=0&navpanes=0`.
  - ⚠️ **NO es un control de seguridad y no debe presentarse como tal.** El bucket `attachments` es público: quien tenga la URL baja el archivo, y `#toolbar=0` solo lo respetan bien Chrome/Edge. Es un freno para el uso normal. Para material realmente confidencial habría que servirlo con URLs firmadas de corta vida (bucket privado + `createSignedUrl`), que hoy no existe en el proyecto.
  - ⚠️ En **móvil** no se puede sostener la restricción: el PDF no se incrusta, así que la única forma de leerlo es abrirlo en el visor del teléfono (que ofrece compartir/guardar). Ahí se muestra el botón con la nota de material restringido.
- ⚠️ **En móvil el PDF no se incrusta**: iOS Safari y varios Android dejan el marco en blanco o solo pintan la primera página. `PdfSection` detecta `useMobile()` y ahí muestra una tarjeta con el botón "Abrir el PDF". No "arreglarlo" forzando el `<object>` en móvil.
- Nada de esto toca el esquema: viaja dentro de `content` (jsonb). La vista previa del editor lo hereda porque reusa `LessonBody`.

**Quiz `passage` + per-question fields** (lectura crítica y similares): a `quiz` reto can carry an optional `challenge_data.passage` (texto/imágenes mostrados **encima** de las preguntas) and each question accepts optional fields:
- `passage`: `{ intro, title, paragraphs:[str], source, images:[{url,caption,width,height}], imagesLayout:'row'|'column' }`. Rendered by `QuizPassage` in `challenges.jsx` con `objectFit:contain` (no recorta); `width`/`height` aceptan número (px) o string CSS.
- Por pregunta: `image`+`imageHeight`+`imagePosition` (imagen del enunciado; `imagePosition ∈ before|between|after` — helper `QuestionImage` en `challenges.jsx`, default `before`). `before`=arriba de la pregunta, `after`=bajo las opciones, `between`=**en medio del texto del enunciado**: parte la pregunta en `question` (antes de la imagen) + `questionAfter` (después). `optionImages` (array alineado por índice con `options`: imagen por opción para preguntas visuales — helper `OptionContent`; una opción es válida con texto **o** imagen), `explanation`+`explanationImage` (se muestran tras responder y en el repaso), `timeLimit`/`points`/`difficulty` (metadatos que alimentan el **Modo Aula en Vivo**). El cuadro del enunciado en el editor es un `textarea` ampliable (preguntas largas con párrafos). ⚠️ El **Modo Aula en Vivo** (`LiveQuestionView.jsx` + snapshot SQL de `create_live_session`) aún NO renderiza `optionImages`/`imagePosition`/`questionAfter` (solo `image` arriba) — quedaría pendiente si se quiere allá.
- Se autoran en `route-editor/QuizCreatorModal.jsx` (sección "texto/imágenes de apoyo" + "⚙️ Opciones avanzadas" por pregunta, con reordenar/duplicar). El store reenvía `passage` y el array `questions` completo, así que campos nuevos por pregunta viajan solos.
- **Subida de imágenes in-app:** componente reutilizable `ImageUploader` (`ui.jsx`) → sube a Supabase Storage bucket `attachments` (carpeta `passage-images`) y devuelve la URL pública vía `onUploaded(url)`. El bucket `attachments` debe ser **público**.
- **Texto enriquecido ligero (enunciado + opciones):** el texto de pregunta/`questionAfter`/opciones respeta espacios y saltos de línea y soporta markup mínimo — `**negrilla**` y `{{#e8732c|color}}` (hex 3–8 díg.). Sin librerías: `parseRich`/`RichText` (render, `whiteSpace:pre-wrap`) y `RichInput` (editor con mini-barra B + colores que envuelve la selección) viven en `ui.jsx`. El markup se guarda como texto plano dentro de `challenge_data`, así que viaja solo y es retrocompatible. Aplicado en `QuizCreatorModal.jsx` (autoría) y `challenges.jsx` (`QuizChallenge`/`PollChallenge`, enunciado + opciones + repaso + mensaje de acierto/error). ⚠️ Igual que las imágenes por opción, el **Modo Aula en Vivo** aún NO interpreta el markup.

### 6. Content as Code (No CMS)

All lesson text, images, match pairs, simulations live in `store.jsx`. Change content → commit + push → auto-deploy. Version control built-in.

### 7. Immersive Course Themes

A course can have an immersive visual theme via the `courses.theme` column. Active themes:

| `theme` | Course | Character |
|---------|--------|-----------|
| `detective` | Lenguaje | Vera Clío |
| `escape-room` | Matemáticas | — |
| `lab` | Ciencias Naturales | — |
| `time-travel` | Ciencias Sociales | Prof. Kronos |

- **Activation:** `getActiveCourseTheme()` reads `theme` of the enrolled course. `<CourseAmbient>` (in `app.jsx`) subscribes **once** to the active theme and lazy-loads the matching `*Ambient.jsx` overlay (each is a separate chunk — only downloaded when its course is active). Themed end-of-module celebration in `ThemeCelebration.jsx`.
- **Adding a theme:** add the `theme` value to `AdminCourses.jsx` (`THEME_HINTS` + `<option>`), build a `*Ambient.jsx`, register it in `CourseAmbient.jsx`, add a branch in `ThemeCelebration.jsx`, and a character entry in `src/lib/characters.jsx`.
- **Characters (reactive):** `src/lib/characters.jsx` is the single registry (theme → character: avatar SVG, ilustración `art`, `side`/`flip`, paleta `ui` + `fx`, `lines` por contexto). `CharacterFloat` (lazy-loaded via `CourseAmbient`) renders the active theme's character and reacts to events fired with `reactCharacter(context)` — contexts: `idle`, `lessonIntro`, `correct`, `wrong`, `moduleComplete`, `routeComplete`. Triggered from `lesson.jsx` (intro/complete) and `recordAttempt` in `store.jsx` (correct/wrong by score). Missing lines fall back to `idle`; missing character/art = nothing renders.
- **Tutor de cuerpo entero (jul 2026):** cada tema tiene una ilustración en `public/tutores/*.png` (1920×1080, figura a la izquierda, resto transparente). **No se recortan los archivos**: `characters.jsx` guarda el recuadro útil en fracciones (`art.body` para la figura, `art.head` para la insignia) y `cropStyle()`/`cropAspect()` lo encuadran por CSS. ⚠️ **Posición fija: los cuatro tutores entran por la DERECHA** (`side:'right'`, `flip:true` para que gesticulen hacia el centro) y el avatar del estudiante por la **izquierda** — el estudiante siempre sabe dónde mirar. En reposo solo se ve una insignia circular con la cara; cuando hay algo que decir el tutor irrumpe, habla con máquina de escribir y se retira solo (5–12 s según el largo de la frase; clic en la figura = se va antes; clic en la insignia = vuelve). Efectos en `styles.css` (prefijo `.xch-*`): estelas de velocidad, destello de silueta, aura, anillos de impacto, partículas y un barrido de luz — la silueta y el barrido se recortan con `mask-image` de la propia ilustración, así los efectos se pegan al personaje y no a un rectángulo. `fx.entrance` da el toque por tema: `flash` (detective), `spark` (escape-room), `scan` (lab), `warp` (time-travel). Respeta `prefers-reduced-motion` y va en `z-index:150` (bajo modales y toasts).
- **Seeds:** course content lives in `supabase/migrations/0013`–`0016`. These are **run manually** in the Supabase SQL Editor (git push deploys only the frontend; migrations are never automatic). Canonical correct template: `0013`. They must match the real `course_modules` schema (id uuid auto, `"order"`, `is_enabled`, `area_id`, `challenge_type`, `challenge_data`) and the content shapes in §5.

### 8. Modo Aula en Vivo (quiz sincrónico tipo Kahoot)

Capa **sincrónica** sobre los cursos existentes: el profesor lanza un quiz en vivo y la pantalla de cada estudiante queda **encadenada a su ritmo** (no puede adelantarse). Pensado para el aula. Backend en `0022_live_classroom.sql` (ejecutar manual en SQL Editor).

- **Ingreso del estudiante:** página **pública** `#/live` (sin login, ver routing abajo) → PIN + registro ligero (nombre, apellido, correo, salón) en `live_participants`. El profe lanza desde el sidebar instructor → "Aula en Vivo" (page `live-host`, también en switch admin).
- **Flujo por pregunta (lo dicta el profe):** `lobby → question → reveal → explanation → leaderboard → podium`. El estado vive en `live_sessions`; estudiantes y host se suscriben por realtime (`subscribeSession`/`subscribeParticipants` en `lib/liveClient.js`) + red de seguridad por poll cada 7s y en `visibilitychange`.
- **Anti-trampa:** la respuesta correcta NO está en lo que leen los estudiantes. `live_sessions.questions` es un snapshot **sin `correct`**; las respuestas/explicación viven en `live_session_keys` (solo el host la lee por RLS). Toda escritura de estudiante pasa por RPCs **SECURITY DEFINER**: `join_live_session`, `submit_live_answer` (calcula el puntaje **en el servidor**: `base*(1-0.5*tiempo/límite)`, racha). Control del profe: `create_live_session` (arma snapshot+keys), `live_set_phase`, `live_goto`, `live_end`. El "revelado" lo dispara el host (copia correct+explicación a `live_sessions.current_reveal`).
- **Routing público:** `PUBLIC_PAGES=['cert','live']` en `store.jsx` permite el deep link sin sesión (3 puntos gated del hash routing + un bootstrap inicial); `app.jsx` renderiza `live` **antes** del gate de login (igual que `cert`).
- **Pulido:** `lib/sound.js` (beeps; el acierto/error suena en `reveal`, no al enviar, para no adelantar el resultado), QR del PIN (api.qrserver.com), `Podium` animado + `Confetti`, botón de silencio (`experia:live-muted`).
- **Origen del contenido:** reúsa los retos `quiz` del curso (incluye `timeLimit`/`points`/`difficulty`/`explanation` por pregunta, §5). El host snapshotea las `questions` del módulo elegido.
- ⚠️ **Sesiones que nunca terminaban (jul 2026, `0047`).** Una sesión solo pasaba a `status='ended'` con el botón "Finalizar clase en vivo", que **solo aparecía al llegar al último módulo**; "Salir del panel" no cerraba nada. Si el profesor abandonaba a mitad, la fila quedaba activa para siempre y —como el banner del estudiante busca cualquier sesión del curso con `status <> 'ended'`— **todos los estudiantes seguían viendo la invitación indefinidamente**. Arreglado en tres capas: botón de finalizar disponible en todo momento + aviso al salir sin finalizar (`LiveHost.jsx`); el banner ignora sesiones de más de `GUIDED_MAX_AGE_HOURS` (8 h, `liveClient.js`); y `create_live_session` cierra las anteriores del mismo curso (0047, que además limpia las colgadas de una vez). Al tocar esta zona, no reintroducir un camino que deje sesiones abiertas.
- **Personajes en la clase guiada:** `GuidedClassView` se renderiza **fuera del shell** (app.jsx retorna antes de `<CourseAmbient/>`), así que monta el tutor a mano con `WithTutor` si el curso tiene tema. `LiveQuestionView` dispara `reactCharacter('correct'|'wrong')` en el revelado y `'liveEnd'` en el podio (guión propio por tema, conversación con el avatar). En la página pública del PIN no hay curso activo y `reactCharacter` no hace nada.

### 9. Avatar del estudiante (cursos temáticos)

Cada persona arma **su propio personaje** para los cursos con tema inmersivo. Backend: `0046_avatar_config.sql` (aditiva; correr manual en SQL Editor).

- **Dónde vive:** `profiles.avatar_config` (jsonb) — NO en la matrícula ni en `course_progress`. Por eso el avatar es **el mismo en todos los cursos** de esa persona. Se mapea a `user.avatarConfig` en `main.jsx` y `login.jsx` (ambos hacen `select('*')`, así que la columna llega sola). Si la migración no está aplicada queda `null` y toda la función desaparece sin errores.
- **El kit** (`src/lib/avatarKit.jsx`) es la fuente única. El arte viene de **DiceBear**, estilo **«Big Smile»** (*Custom Avatar* de Ashley Seo). Motor `@dicebear/core` (MIT) + definición `@dicebear/styles/big-smile.json`. **Todo se genera en el cliente**: no hay llamada de red ni servicio externo.
  - ⚠️ **El arte es CC BY 4.0: el crédito es OBLIGATORIO** donde se muestren los avatares. Vive en la constante `AVATAR_CREDIT` y se pinta al pie del estudio. Si algún día se cambia de estilo, revisar la licencia del nuevo en https://www.dicebear.com/licenses/ (varios son CC0 y no exigen nada; otros sí).
  - Los catálogos (`HAIRS` 13, `EYES` 8, `MOUTHS` 8, `ACCESSORIES` 8) y las paletas (`SKIN_COLORS`, `HAIR_COLORS`, 8 cada una) se **derivan de la propia definición** del estilo: al actualizar DiceBear, las variantes nuevas aparecen solas en el editor (solo hay que ponerles nombre en `LABELS`). Los `FRAMES` sí son curados a mano.
  - `avatarDataUri(cfg, expression)` genera el SVG y lo devuelve como data-URI, con **caché en memoria** (400 entradas): el editor pinta decenas de miniaturas y las repide en cada cambio. Se renderiza con `<img src=dataUri>` y no inline, para que React solo difunda un string y no haya choque de ids entre SVGs.
  - `normalizeAvatar` valida contra los catálogos: cualquier id desconocido (config vieja, JSON manipulado) cae al default y el avatar guardado nunca puede romper el render.
  - ⚠️ El encuadre (`FRAMING = { scale: .74, translateX: 2, translateY: -3 }`) encoge y recentra la cabeza para que quepa entera en el círculo del marco — en Big Smile llena el lienzo y va descentrada. **Al cambiar de estilo hay que recalibrarlo** (probar también los peinados altos: `froBun`, `bunHair`, `mohawk`).
- **Cuerpo y rangos (`src/lib/avatarBody.jsx`):** ningún estilo de DiceBear trae armaduras ni progresión, así que **el cuerpo es arte nuestro** (SVG plano, para casar con Big Smile) y la cabeza se incrusta encima como `<image>` con el data-URI del kit (modo `'full'`, sin el recorte circular del retrato).
  - `RANKS` (en `avatarKit.jsx`, para que `avatarBody` pueda importarlo sin ciclo) define 5 rangos: Aprendiz → Explorador → Especialista → Maestro → Leyenda, cada uno con su metal, aro, aura y emblema. `rankFromLevel(level)` agrupa de a dos los 9 niveles de `LEVELS`.
  - **Se lee de dos formas según el tamaño**, misma configuración: en pequeño (insignia 44px, conversación 96px) el rango va en el **marco** del retrato (`<Avatar rank>`: metal del aro, aura, emblema); en grande (perfil, celebración) va la **armadura** del cuerpo entero (`<AvatarBody rank>`). Un cuerpo entero a 44 px sería ilegible.
  - ⚠️ Lienzo del cuerpo 200×280 con referencias fijas: cabeza en x 38..162 / y 0..124 (la barbilla del estilo cae ~y 108), hombros en y 122, cintura y 212. Al agregar piezas o cambiar de estilo de cabeza hay que recalibrar esos números o el cuello queda desproporcionado.
  - El disparador es el **nivel del curso activo** (`calcLevel(xp)`), así que el rango cambia al cambiar de curso — es deliberado: es "tu rango en este curso". El avatar en sí (cara, pelo, color) sí es el mismo en todos.
  - **Marca CEINFES (`CeinfesMark`):** emblema naranja (`#EC671A`, Naranja Evolución del brandbook) en el pecho izquierdo, **en la misma posición en los 5 rangos** (`x 76, y 152, size 15`) para que la marca se reconozca sin importar el nivel. Cambia solo el acabado según el material: `finish="cloth"` (parche cosido, rangos 1–2) y `finish="metal"` (chapa remachada con el aro del metal del rango, 3–5). ⚠️ El logo es un **wordmark** y a 15 px sería una mancha, así que el emblema lleva una **flecha ascendente geométrica** — se compararon el flick literal del logo y tres variantes a 96/40/22/14 px y es la única que sigue leyéndose al tamaño real. No sustituirla por un trazado fiel del logo sin volver a comprobarlo a 14 px.
- **Expresiones:** `idle | happy | sad | wow`, en `EXPRESSION_PATCH`. Big Smile trae ojos y bocas con nombre semántico (`cheery`, `sad`, `starstruck`, `openSad`, `kawaii`…), así que las expresiones se leen con claridad. Esa constante es la única palanca para ajustarlas.
- **Peso:** el chunk `AvatarStudio` pesa ~250 KB (51 KB gzip) por la definición del estilo. Va **lazy** y está excluido del precaché del service worker (`globIgnores` en `vite.config.js`), igual que las ilustraciones de los tutores: solo lo descarga quien entra a la pestaña.
- **Descartado (jul 2026):** avatares 3D tipo Meta. Ready Player Me —la única opción gratuita con ese look— cerró el 31 de enero de 2026; los reemplazos (Avatar SDK) son comerciales, basados en selfie y exigen tratar datos biométricos. Ninguna librería JS libre produce avatares realistas.
- **Dónde se edita:** pestaña "Mi avatar" en `profile.jsx` → `AvatarStudio.jsx` (lazy). La pestaña **solo existe** si `selectHasThemedCourse` (estudiante con acceso activo a un curso con `theme`); sin eso el perfil se renderiza exactamente como antes — por eso el curso de DCE en producción no se ve afectado.
- ⚠️ `selectThemedCourses` devuelve un array nuevo en cada llamada: **no pasarlo a `useStore`** (con `useSyncExternalStore` una referencia nueva por lectura hace bucle infinito). Para UI, derivarlo con `useMemo` desde `courses`/`userCourses`, o usar `selectHasThemedCourse`, que devuelve booleano.
- **No reemplaza la foto de perfil:** `profiles.avatar` (Storage, `updateAvatar`) sigue siendo la foto institucional; el avatar es el personaje del curso. Conviven.
- **Conversación tutor ↔ avatar:** `CharacterFloat` (`CharacterBubble.jsx`). El avatar del estudiante entra por el lado OPUESTO al tutor —cuerpo entero con su armadura— **siempre que el tutor esté en escena**, tenga o no guión: en **conversación** se turnan la palabra (el globo del que escucha se apaga) y en **monólogo** acompaña en silencio, reaccionando solo con la expresión (`listeningExp`, derivada del `mood`). Antes solo salía en los momentos con guión y por eso casi nunca se veía — el 90% de las apariciones del tutor son monólogos. Los guiones viven en `characters.jsx` → `dialogues` por tema (`getDialogue(theme, ctx, nombre)` resuelve `{nombre}`), con `exp` opcional por turno para la expresión del avatar.
  - **Un contexto se juega como conversación con solo tener guión** en `dialogues`; agregar un momento nuevo es escribir el guión y disparar `reactCharacter('<ctx>')`. Un contexto puede tener **varias versiones** —`[[…],[…]]`— y `getDialogue` elige una al azar, para que los frecuentes no suenen siempre igual.
  - Momentos actuales y de dónde salen: `welcome` y `comeback` (≥3 días sin entrar) los detecta el propio componente con `localStorage` (`experia:char-welcome:<id>`, `experia:char-visit:<id>`); `rankUp` compara el rango contra `experia:char-rank:<id>`; `milestone` (cada 3 módulos) y `struggle` (dos fallos seguidos) usan contadores internos; `perfect` (100% en un reto) sale de `recordAttempt`; `badge` de `completeNode` (que ahora **devuelve `{ badge }`** para que quien lo llama elija la reacción); `avatarCreated` de `AvatarStudio` al primer guardado; `liveStart`/`liveEnd` de `LiveQuestionView`; `routeComplete` de lesson/challenges.
  - ⚠️ Prioridad al completar un nodo: `routeComplete` > `badge` > `moduleComplete`. En retos NO se dispara `moduleComplete`, para no pisar la reacción de desempeño que `recordAttempt` acaba de lanzar.
  - **Sin avatar creado → nada de esto ocurre**: el tutor invita una vez a crearlo con un botón que lleva a `#/profile/avatar` (deep link nuevo: `profile.jsx` lee `nodeId === 'avatar'` para abrir la pestaña).
  - ⚠️ El `--xch-ratio` del tutor sale del recorte de su ilustración; la figura del estudiante **pisa esa variable** con `0.714` (lienzo 200×280 de `avatarBody`). Si se pasa `vars` sin sobrescribirla, el avatar se dibuja pequeño y descolgado.
  - **Tamaños** (`--xch-h` en `styles.css`): tutor `clamp(300px, 64vh, 580px)`, avatar `clamp(240px, 50vh, 450px)`. El avatar va deliberadamente **más bajo**: es de cabeza grande (chibi) y a igual altura su cabeza duplica a la del tutor y desequilibra la escena.
- **En la Clase en Vivo Guiada:** `LiveQuestionView` acepta una prop opcional `avatar` que **solo pasa `GuidedClassView`** (ahí el estudiante tiene sesión). Aparece en el lobby, al enviar la respuesta, en el revelado —con expresión `happy`/`sad` según el resultado— y en el podio (`wow` si quedó en el top 3). Se carga con `React.lazy` desde `components/LiveAvatar.jsx`.
  - ⚠️ La página **pública del PIN** (`LivePlay.jsx`, `#/live`) **no pasa la prop y no debe hacerlo**: sus participantes son anónimos (`live_participants`, sin `profiles`), así que no hay avatar de dónde sacarlo. Gracias a eso su chunk sigue pesando ~4 KB y nunca descarga el kit. Para darles avatar habría que dejar de ser anónima o guardar la config en `live_participants` (columna nueva + RPC `join_live_session`).
- **Fuera del perfil:** `AvatarChip` (`components/AvatarChip.jsx`) muestra el avatar con su rango en la cabecera y lleva a la pestaña de edición. `Header.jsx` lo carga con `React.lazy` y solo lo monta si hay tema activo **y** avatar creado — así el kit nunca entra al bundle principal.
- ⚠️ **Precaché:** los chunks del avatar (`avatarKit-*`, `avatarBody-*`, `AvatarStudio-*`, `AvatarChip-*`) están excluidos en `vite.config.js` → `globIgnores`. Si Vite renombra o divide esos chunks hay que actualizar la lista, o el precaché del service worker crece ~250 KB para todos los usuarios.

### 10. Código presencial (bloquear un paso hasta activarlo en clase)

Candado **opcional por nodo** (aplica a cualquier `course_modules.type`, no es un `challenge_type` nuevo): marca `requires_presence_code = true` y el estudiante no puede ver el contenido de ese módulo/reto hasta ingresar un código corto que el instructor genera y dice en voz alta en clase. Pensado para asegurar que esa parte puntual de la ruta se resuelva estando físicamente presente. Backend en `0039_presence_gate.sql` + `0040_gate_module_content_server_side.sql` (ejecutar ambas, en orden, manual en SQL Editor).

- **Marcar el nodo:** en el editor de ruta (`InstructorRouteEditor.jsx`), cada fila de módulo tiene un botón-candado que alterna `requiresPresenceCode`; con el candado activo y el módulo ya publicado aparece un botón "🔑 Código" que abre un modal para generarlo.
- **Generar el código (profe, en clase):** `generatePresenceCode(moduleId)` → RPC `generate_presence_code`, solo instructor/admin. Desactiva el código anterior de ese módulo e inserta uno nuevo de 6 dígitos en `presence_gates` — **sin vencimiento** (0042; antes expiraba a 3h, `expires_at` ahora es NULL). Mismo patrón anti-trampa que Modo Aula en Vivo (§8): el código en texto plano solo se devuelve al host, `presence_gates` no tiene policy de select pública.
- **Canjearlo (estudiante):** el gate (`PresenceGate` en `ui.jsx`, insertado al inicio de `LessonView`/`ChallengeView`) llama `redeemPresenceCode(moduleId, code)` → RPC `redeem_presence_code` (SECURITY DEFINER), que valida el código en el servidor y, si coincide, hace upsert idempotente en `presence_unlocks`. Una vez desbloqueado queda desbloqueado (se carga en `unlockedPresenceModules` vía `loadStudentSession`, igual que `completed`/`badges`).
- **La entrega final (Grid / cargar documentos) también respeta el código:** `Grid.jsx` inserta el mismo `PresenceGate` sobre el módulo `final_delivery` cuando este tiene `requiresPresenceCode` (antes solo se gateaba por el taller `requires_workshop`). Si la entrega usa código, el código **reemplaza** la lógica del taller (`workshopEnabled = finalUsesCode || …`). También aplica el bloqueo por gate anterior (`isBlockedByPresence`).
- **`final_delivery` es un paso más de la cadena (jul 2026):** antes `nodeStatus` exigía **TODOS** los módulos completos para la entrega (`others.every(done)`) y la cadena secuencial **saltaba** el final_delivery (usaba `others`), así que un módulo después de la entrega no la exigía. Ahora `nodeStatus` usa una única cadena sobre la lista COMPLETA: cada módulo pide sus `req` explícitos o, por defecto, el **módulo anterior en el orden** (incluida la entrega) — así **la entrega bloquea el módulo siguiente** como cualquier paso. `Grid.jsx` calcula `routeComplete` (habilitar el cargue) solo sobre los módulos **antes** de la entrega (`modsBeforeFinal`).
- **La entrega se completa al APROBARLA (no al enviarla), y NO genera certificado (jul 2026):** enviar la entrega NO la marca completa — el módulo siguiente queda bloqueado hasta que el instructor **apruebe** la entrega. La finalización se hace en la sesión del ESTUDIANTE: un `useEffect` en `map.jsx` detecta una submission con `status==='approved'` del propio usuario y llama `completeNode(finalMod.id)` (completeNode escribe en el `course_progress` del estudiante; el instructor no puede escribirlo). Idempotente. ⚠️ Sin realtime en submissions: el estudiante ve el desbloqueo tras recargar. El diploma **ya no se emite en el Grid**: el bloque `status==='approved'` solo muestra confirmación (antes `CertificatePage` → `issueCertificate`). El certificado lo emite **solo** el nodo `certificate` → `CourseCertificatePage` al 100% (`maybeIssueCourseCertificate`). `CertificatePage` en Grid.jsx quedó como código muerto.
- **Bloquea "de ahí en adelante" (no solo el nodo puntual):** `nodeStatus` (store.jsx) recibe `unlockedPresenceModules` y usa el helper `isBlockedByPresence` — si algún módulo ANTERIOR en el orden exige código y el estudiante no lo desbloqueó (ni completó, que implica haberlo desbloqueado), TODOS los nodos posteriores quedan `locked` en el mapa. El módulo gateado NO se bloquea a sí mismo (debe abrirse para ingresar el código). Cierra el hueco de cuando los módulos no forman cadena estricta de requisitos (p. ej. todos dependen solo del primero) y el gateado se saltaba. Callers de `nodeStatus` que pasan el nuevo arg: `map.jsx` (×2) y `games.jsx`. Además, `LessonView`/`ChallengeView` llaman `isBlockedByPresence` para cerrar el acceso por **enlace directo** a un nodo posterior (muestran "Paso bloqueado → Volver al mapa"). Solo frontend, sin migración.
- **El contenido en sí también se oculta en el servidor (0040), no solo en la UI:** los tres puntos donde el estudiante carga `course_modules` (`loadStudentSession.js`, `switchCourse`, `loadCourseModules`) usan la RPC `get_course_modules_for_student` en vez de `select('*')` plano — esa RPC vacía `content`/`challenge_data` de cualquier módulo gateado que el usuario no tenga en `presence_unlocks`, así que el candado no se puede saltar leyendo la respuesta de red en DevTools. `redeemPresenceCode` vuelve a llamar la RPC tras un canje exitoso para traer el contenido real. El editor de instructor sigue leyendo `course_modules` directo (necesita el contenido completo siempre).

### 11. Análisis de ítems (analítica de pruebas)

Le devuelve al instructor evidencia sobre **sus propias pruebas** — que es el contenido del
curso de DCE aplicado a la plataforma misma. Backend: `0048_analytics_capture.sql` (captura,
ya corrida) + `0049_analytics_rpcs.sql` (agregación). Plan completo y decisiones en
`Experia-Plan-Analitica.md`.

- **Captura (0048).** `challenge_attempts` gana `course_id`/`module_id`/`attempt_no`, y un
  trigger `assign_challenge_attempt_no` asigna el número de intento en el servidor.
  `recordAttempt` ya **no descarta el segundo intento**. `quiz_attempt_answers` guarda una
  fila por pregunta **con la opción elegida** (`recordQuizAttemptAnswers`) — eso es lo que
  habilita el análisis de distractores. `quiz_attempts` sigue siendo solo el agregado.
- **Id estable por pregunta.** `QuizCreatorModal` asigna `id: q_<8 hex>` a cada pregunta y lo
  conserva al editar el texto; los quizzes viejos lo reciben al abrirlos en el editor. Sin
  eso, corregir una tilde partía el histórico del ítem en dos.
- **Agregación (0049).** Cinco RPC `security definer` que exigen instructor/admin y acotan la
  muestra con `analytics_visible_students()` (institución, mismo criterio que 0029):
  `analytics_module_answers`, `item_analysis`, `analytics_course_modules`,
  `analytics_raw_answers`. Métricas: dificultad `p`, discriminación `D` (cuartil alto −
  cuartil bajo), punto-biserial corregida y distractores con cuántos del cuartil alto los
  eligieron.
- ⚠️ **Todo se calcula sobre el PRIMER intento.** Mezclar reintentos infla la dificultad y
  destruye la discriminación (quien repite ya vio la respuesta). La evolución 1→2 va aparte
  en `retry_recovery`. Si se toca esta zona, no "arreglar" eso promediando todos los intentos.
- ⚠️ **Bajo 10 estudiantes, `D` y `r_pb` vuelven `NULL`** y la UI dice "muestra insuficiente".
  Nunca convertirlos en `0`: un cero se lee como hallazgo.
- ⚠️ En las RPC, las columnas de `RETURNS TABLE` son parámetros OUT visibles dentro del
  cuerpo: toda referencia a `student_id`/`item_id`/`correct`… va **calificada** o la función
  falla por ambigüedad.
- **Pantalla:** `InstructorItemAnalysis.jsx` (page `instructor-items`, sidebar de instructor y
  admin). Selector colegio → curso → reto; la lista de cursos incluye los **forks por
  colegio**, porque los intentos de esos estudiantes caen en los `module_id` del fork. Exporta
  a xlsx (análisis y respuestas crudas) con `await import('xlsx')`.
- **Legado.** Si un módulo aún no tiene filas en `quiz_attempt_answers`, `item_analysis` cae a
  `challenge_attempts.questions`: da dificultad y discriminación, no distractores. Nunca mezcla
  los dos orígenes, para no contar dos veces el mismo intento. `challenge_attempts.area` quedó
  **obsoleta** para segmentar (se conserva por los datos históricos): la analítica va por curso.
- ⚠️ `InstructorStats.jsx` **no** se migró: sigue calculando en el navegador sobre las 300
  filas de toda la plataforma que trae `sessionData.js`, y agrupa las preguntas por su texto.
  Sus números son una muestra arbitraria, no el total.

### 12. Acta de cierre (`closing_record`)

Tipo de módulo nuevo (`course_modules.type = 'closing_record'`) para el cierre del curso con
un grupo: el tutor confirma la asistencia contra un listado, agrega observaciones y genera el
acta en PDF. Backend: `0050_closing_record.sql` (ejecutar manual en SQL Editor).

> **Recordatorio de dominio:** esto es formación docente — el "estudiante" de la plataforma
> **es un docente** en formación, y el instructor es su tutor. Por eso el acta de cierre es un
> documento que también le pertenece al estudiante, no solo un trámite del tutor.

- **Quién hace qué:** el **admin** carga el listado, el **tutor** diligencia y cierra el acta,
  el **docente-estudiante** la ve y la descarga. Es el único módulo con esa división.
- ⚠️ **El nodo aparece en la ruta del estudiante y se completa cuando el tutor CIERRA el acta**
  (`status='final'`), con el mismo patrón que la entrega aprobada: un `useEffect` en `map.jsx`
  llama `completeNode` en la sesión del estudiante (el instructor no puede escribir en su
  `course_progress`). **Si el tutor nunca la cierra, el nodo siguiente y el certificado del
  grupo quedan bloqueados** — es el comportamiento pedido, pero es la primera causa a revisar
  si aparece un grupo trabado al final de la ruta. Sin realtime: el estudiante lo ve al recargar.
- **El estudiante solo ve actas CERRADAS**, y en modo lectura: la policy
  `closing_records_student_read` (0050) exige `status='final'` y matrícula en el curso (o en su
  curso padre, porque el acta suele vivir en el fork del colegio). Un borrador a medio
  diligenciar no sale de manos del tutor. Ve el acta **completa** del grupo — es un documento
  institucional que todos firman.
- **"Grupo" = curso + colegio.** Tanto el listado (`course_roster`) como el acta
  (`closing_records`) llevan `institution_id`; el mismo curso en dos colegios tiene dos actas.
  Índice único `(module_id, coalesce(institution_id, …))`.
- **Listado — lo carga el ADMIN**, no el tutor: Admin → Cursos → menú de la fila → "Listado de
  asistentes (acta)". Excel con columna `Nombre` obligatoria (+ `Documento`, `Correo`); acepta
  `Nombres`/`Apellidos` por separado. Guardar **reemplaza** el listado de ese curso/colegio.
  No son necesariamente usuarios de la plataforma — por eso es una tabla propia y no las
  matrículas.
- **Diligenciar — el TUTOR**: editor de ruta → botón `📋 Diligenciar` en la fila del módulo
  (`page 'closing-record'`, `nodeId` = id del módulo). Requiere que la ruta esté **publicada**
  (el módulo necesita su UUID real). La misma página sirve al estudiante en modo lectura
  (`isStudent` en `ClosingRecord.jsx`); él no carga `course_roster` — no tiene permiso ni lo
  necesita, porque el acta guarda su propia copia de los asistentes.
- `closing_records.entries` es un **snapshot** del listado al diligenciar: recargar el Excel
  después no altera un acta ya diligenciada.
- **Cerrar el acta** (`status='final'`) la congela: el trigger `guard_finalized_closing_record`
  rechaza cualquier update posterior salvo de un admin.
- **PDF por `window.print()`** + `@media print`, igual que los certificados (`CertPage`,
  `CourseCertificatePage`). No hay librería de PDF en el proyecto y no hacía falta agregarla.
  Solo `#acta-print` queda visible al imprimir.
- `loadCourseRoster` resuelve el **fork**: si el curso es la copia del colegio, cae al listado
  cargado sobre el curso padre. Sin eso, un acta en un fork no encontraría nunca su listado.

### 13. Modo clon (piloto TEMPORAL — estudiante clon / tutor clon)

Piloto de dos funcionalidades que después **migran a otra plataforma**: el docente
marca la **asistencia de sus alumnos de colegio** y captura la **tabla de
efectividad** de la sesión. Backend: `0051_clone_role.sql` (correr manual en SQL
Editor). Toda la zona está pensada para **borrarse de una pieza** cuando el piloto
termine.

- ⚠️ **NO es un rol de base de datos.** El enum `user_role` no se tocó: en Postgres
  un valor de enum **no se puede eliminar nunca**, y agregarlo obligaría a revisar
  `is_instructor()`, `is_admin()` y todas las policies que comparan
  `role='student'/'instructor'` (user_courses, live_*, presence_*, closing_records,
  submissions…). El "rol clon" es una **variante de interfaz**:
  `profiles.ui_variant = 'clone'`. Los permisos siguen siendo los de
  student/instructor; lo único que cambia es lo que pinta el frontend. Desmontarlo
  = borrar la columna y las cuatro tablas.
- **Quién ve qué:** el **tutor clon** (instructor) suma "Grupos y listados"
  (`clone-groups`) a su menú normal. El **estudiante clon** (docente) ve un menú
  propio: *Mi ruta de formación* (su `map` tal cual, sin cambios), *Marcar
  asistencia* (`clone-attendance`), *Tabla de efectividad* (`clone-effectiveness`)
  y *Perfil*. Se asigna desde AdminUsers → menú de la fila → "Activar modo clon".
- **"Grupo" = los alumnos de colegio de UN docente.** El tutor crea el grupo, le
  asigna un docente (`clone_groups.teacher_id`) y le carga el listado por Excel
  (`clone_group_students`). El docente **no edita** el listado: solo marca
  asistencia sobre él. Los alumnos **no son usuarios de la plataforma** — misma
  razón por la que `course_roster` es tabla propia (§12).
- ⚠️ **No confundir con el acta de cierre (§12).** Aquel listado lo carga el
  **admin** y es la lista de los **docentes** del grupo de formación; este lo carga
  el **tutor** y es la lista de los **alumnos de colegio** del docente. Son tablas
  distintas a propósito.
- **Asistencia:** una acta por grupo y fecha (índice único). `entries` es un
  **snapshot** del listado al diligenciar: recargar el Excel después no altera un
  acta ya hecha. Cerrarla (`status='final'`) la congela vía trigger. El PDF sale por
  `window.print()` + `@media print`, igual que los certificados y §12.
- **Tabla de efectividad:** dos momentos por sesión (*Exploro mis competencias* /
  *Desarrollo mis competencias*), cada uno con su total de estudiantes y sus
  preguntas (letra correcta + conteos A/B/C/D). Captura por formulario **o** por
  importación de Excel (plantilla descargable); exporta a xlsx e imprime informe.
  - **Unidad trabajada** (`clone_effectiveness.unit_label` + `unit`, 0054):
    botones con las unidades del plan del grupo (§ tablero de unidades). El
    informe impreso lleva un bloque con la unidad y **sus datos** (ejes
    articuladores, cobertura/prioridad/nivel, indicaciones del tutor); el xlsx
    lleva unidad, ejes y nivel en su encabezado. Sin plan cargado cae a un campo
    de texto: el docente no puede quedar bloqueado por algo que depende de su
    tutor.
  - ⚠️ **Ambas columnas son un SNAPSHOT**, no una referencia: `unit_label` guarda
    el texto (no un índice ni un id) y `unit` una copia de los datos de esa
    unidad. `clone_unit_plans.units` es un jsonb que el tutor reemplaza entero al
    recargar el plan — un índice apuntaría a otra unidad tras un reordenamiento, y
    releer los datos al imprimir haría que un informe cerrado mostrara unos ejes
    distintos de los que se trabajaron. Mismo criterio que `entries` en las actas.
- **Informe final descargable (ago 2026).** Lo que imprime `CloneEffectiveness`
  (`#clone-print`, botón "🖨️ Descargar informe final") ya no es solo la tabla:
  es un documento de cuatro bloques — **asistencia · tabla de efectividad ·
  recomendaciones · tareas**. El xlsx (`⬇ Exportar Excel`) lleva lo mismo en
  hojas aparte. No hay tabla nueva en la BD ni migración: el informe se arma en
  el navegador con lo que ya está guardado.
  - **Asistencia:** se trae del acta de `clone_attendance`, no se vuelve a
    capturar. Se resuelve en este orden: la vinculada (`attendance_id`) → la del
    mismo `session_date` → la más reciente. El informe siempre imprime **la
    fecha del acta**, para que no se confunda con la de la sesión. ⚠️ Al guardar,
    `attendance_id` se vincula a **esa misma** acta (antes era siempre la más
    reciente, que podía ser de otro día).
  - **Recomendaciones = preguntas por DEBAJO de la efectividad de la sesión;
    tareas = las que quedaron por encima** (un empate exacto cuenta como tarea).
    El segundo módulo se titula **"¿Qué evalúa?"** en el documento y en el xlsx
    (la hoja va como `Qué evalúa`: Excel no admite `?` en el nombre); en el
    código y en la rejilla la columna sigue siendo `tarea` / `t`.
    ⚠️ El umbral es la efectividad de la **sesión**, no la del momento: las dos
    listas tienen que medirse con la misma vara. Las preguntas con
    `aplicada:false` no entran en ninguna de las dos.
  - **El texto de cada ficha sale de la rejilla académica**
    (`src/lib/rejillaTareas.json`), generada del Excel *Tareas y
    recomendaciones* con `node scripts/build-rejilla.mjs` (la copia fuente del
    libro se versiona en `scripts/data/`). El cruce es por
    **unidad + momento + número de pregunta**, y la lógica pura vive en
    `src/lib/tareasRecomendaciones.js`. Cada ficha imprime, además del texto,
    su **componente**, su categoría y su dificultad. El **eje articulador de la
    rejilla se quitó del informe** (agosto 2026) por pedido del piloto: sigue
    en los datos (`it.eje`), solo no se pinta. No confundirlo con los *ejes
    articuladores de la unidad*, que vienen del plan del tutor y sí salen en el
    recuadro de la unidad.
    ⚠️ Los textos largos y repetidos (recomendación, eje, componente) van
    **deduplicados** en el JSON: las filas apuntan por índice a los arrays
    `recomendaciones` / `ejes` / `componentes`. Al agregar una columna de ese
    tipo, seguir el mismo patrón. Un `0` suelto en una celda de la rejilla es
    una casilla sin diligenciar, no un valor: el script lo guarda vacío.
  - ⚠️ **La unidad se cruza por NÚMERO, no por texto**: el título del plan es
    libre ("Unidad 3. Estequiometría") y nunca coincide letra a letra con el de
    la rejilla ("UNIDAD 3"). Si el tutor no numeró el título, se cae a la
    **posición** de la unidad en el plan. Sin unidad elegida el informe se
    imprime igual, con las preguntas clasificadas y un aviso de que faltan los
    textos — el docente nunca queda bloqueado.
  - La rejilla trae también el momento **`aplico`**, que hoy no existe en la
    tabla de efectividad (solo hay dos momentos): queda en los datos por si el
    piloto lo agrega. Una pregunta que la rejilla no tiene (el docente agregó
    una 16 donde el libro llega a 15) **sí se lista**, con la ficha vacía.
  - **Peso:** el JSON (~60 KB) va en su propio chunk por `import()` dinámico y
    está excluido del precaché (`globIgnores` en `vite.config.js`), igual que
    los chunks del avatar.
  - **Marca CEINFES en el documento.** Logo, filete tricolor, título y fichas de
    contexto los pone `PrintDocHeader`; cada bloque lleva su color de marca con
    `PrintSection` (1 asistencia = Azul Pensamiento · 2 efectividad = Morado
    Formación · 3 recomendaciones = Naranja Evolución · 4 tareas = Verde
    Transformación) y el pie es `PrintDocFooter` — los tres en `cloneShared.jsx`,
    reutilizables por los otros documentos del piloto.
    - ⚠️ **Los colores del documento son hex LITERALES (`BRAND`), no variables
      CSS.** `--purple` cambia con `data-accent` y toda la paleta cambia en modo
      oscuro; un informe impreso no puede depender de eso. Por la misma razón el
      logo va sin la clase `logo-img` (que lo invierte a blanco en modo oscuro).
    - ⚠️ **`print-color-adjust: exact` en `PRINT_CSS` es obligatorio**: sin él
      los navegadores descartan fondos y filetes y el informe sale en gris.
- ⚠️ **Todo el cálculo vive en `src/lib/effectiveness.js`** (funciones puras, sin
  React ni Supabase). Las páginas solo capturan y pintan — **no reimplementar
  fórmulas en la UI**. `clone_effectiveness.sections` = lo capturado;
  `summary` = lo calculado con `buildSummary()`, recomputado en **cada** guardado:
  es una foto para reportes/exportación, nunca la fuente de verdad.
  Reglas que suelen malinterpretarse:
  - **VALOR es dificultad, no desempeño**: 3 = pocos acertaron, 1 = casi todos.
    No confundirlo con el P.E.P.
  - Una pregunta con `aplicada:false` se **excluye por completo** del promedio —
    nunca cuenta como cero (bajaría la efectividad artificialmente).
  - Si la suma de los 4 conteos ≠ total de estudiantes, es **error de captura**: se
    señala en rojo, no se corrige solo.
  - La efectividad de la sesión promedia **solo los momentos aplicados**; con uno
    solo se reporta ese. Sin ninguno, `reportable=false` y no deja guardar.
- **Guards:** las páginas del piloto están en `CLONE_PAGES` (store) y `app.jsx` las
  **exceptúa de los guards de curso/área** — viven al lado de la ruta de formación,
  no dentro de ella. Sin eso, un docente clon sin matrícula resuelta quedaría
  atrapado en la selección de curso.
- **Tablero del plan de unidades (`clone_dashboard`, 0052).** Tipo de módulo nuevo
  para el **último paso** de la ruta del producto sustituto: el docente ve, de solo
  lectura, en qué **orden** debe trabajar las unidades del **libro físico** con sus
  alumnos y los **ejes articuladores** de cada una. Lo carga el **tutor**.
  - ⚠️ **El plan cuelga del GRUPO (`clone_unit_plans.group_id`, único), no del
    módulo ni del curso.** Cada docente lleva su propio ritmo con el libro, que es
    justo lo que `clone_groups` modela. El módulo de la ruta es solo la puerta: si
    el docente tiene varios grupos, elige cuál mirar. Por eso el mismo módulo
    publicado una sola vez sirve a todos los docentes con planes distintos.
  - **Dónde se carga:** tutor → "Grupos y listados" → `📚 N unidades` en la fila del
    grupo (`UnitPlanModal` en `CloneGroups.jsx`). Filas a mano (subir/bajar, el
    **orden del array ES el orden**) o Excel (`Unidad`, `Cobertura`, `Prioridad`,
    `Nivel`, `Ejes` separados por coma, `Notas`) con plantilla descargable. Los ejes
    son **texto libre**, no un catálogo cerrado — no hay un listado oficial estable
    al que amarrarlos.
  - **Cobertura / prioridad / nivel** por unidad son opcionales y hoy son **solo
    texto** bajo cada unidad — ya no alimentan ninguna gráfica (la alimentaban
    hasta 0053). ⚠️ Se guardan **en porcentaje** (27.6 = 27,6 %), pero Excel
    entrega las celdas con formato de porcentaje como **fracción** — `parsePct`
    (`cloneShared.jsx`) normaliza ambas formas y un número ≤ 1 se asume fracción.
    `level` es texto del Excel, **no** se deriva del puntaje.
  - **Gráfica de ejes transversales (`clone_unit_plans.chart`, 0053).**
    Parametrizable por el tutor y **sin cálculo**: cada barra es `{label, value,
    color}` — texto libre, valor y color — capturada a mano en el modal (no viene
    del Excel). Sin barras, no se dibuja nada. Escala **0–100 literal** (barra
    llena = 100), elegida sobre "relativo al máximo" para poder comparar dos
    grupos o dos planes mirando la misma barra. El valor se muestra **sin `%`**:
    el tutor puede estar cargando un puntaje y no una proporción.
  - ⚠️ **`color` se guarda como SLOT 1..8, nunca como hex.** El hex real sale de
    `--viz-N` (`styles.css`), que tiene su propio paso para modo oscuro. Guardar
    el hex congelaría el color claro en modo oscuro y obligaría a reescribir los
    planes al recalibrar la paleta.
  - **Dos tipos de eje, dos contadores.** Las tarjetas del tablero cuentan por
    separado *ejes transversales* (barras de la gráfica) y *ejes articuladores*
    (los de cada unidad), y cada una aparece solo si hay de ese tipo. ⚠️ No
    volver a una sola tarjeta "Ejes": contaba los articuladores y marcaba **0**
    en planes que sí tenían transversales, justo al lado de la gráfica que los
    mostraba.
  - **Gráfica y orden de trabajo van lado a lado** (`twoCols`) cuando hay ambos y
    la pantalla es ancha; la gráfica queda `sticky` para cruzarla con la lista sin
    devolverse. En móvil se apilan: bajo ~380 px por columna los nombres de ejes
    y los títulos de unidad se parten.
  - ⚠️ **La paleta `--viz-1..8` está validada como CONJUNTO** (banda de
    luminosidad, croma, separación para daltonismo y contraste) contra las dos
    superficies de la app. La peor pareja adyacente queda en ΔE 9.1 (protanopía),
    legal **solo** porque cada barra lleva siempre su nombre y su valor en texto.
    Si se toca un color hay que revalidar el conjunto, y **no** convertir esos
    rótulos en leyenda ni en tooltip.
  - **Dónde se ve:** `CloneUnitDashboard.jsx` (page `clone-dashboard`, `nodeId` = id
    del módulo). Se agrega a la ruta desde el editor (botón "Agregar Plan de
    Unidades del libro"); el botón `📚 Cargar plan` de esa fila solo lleva a
    "Grupos y listados", porque el contenido no vive en el módulo.
  - ⚠️ **El nodo se completa al ABRIRLO**, haya plan o no — deliberadamente
    distinto del acta de cierre (§12). Si dependiera de que el tutor ya lo hubiera
    cargado, un tutor despistado dejaría trabados el nodo siguiente y el
    certificado; el docente ve un estado vacío ("tu tutor aún no publicó el plan")
    y sigue su ruta.
  - `clone-dashboard` **NO va en `CLONE_PAGES`**: a diferencia de asistencia y
    efectividad, este sí vive dentro de la ruta y debe pasar por los guards de curso.
- **Peso:** las cuatro páginas y `cloneShared.jsx` van lazy, así que una cuenta
  normal nunca descarga esos chunks.

---

## File Structure

```
src/
├── main.jsx                 # Bootstrap, session restore
├── app.jsx                  # Shell: sidebar, header, routing
├── styles.css               # Design system
├── store/store.jsx          # Reactive store + modules
├── lib/
│   ├── effectiveness.js     # Motor PURO de la Tabla de Efectividad (P.E.P., VALOR, efectividad de sesión)
│   ├── tareasRecomendaciones.js # PURO: reparte las preguntas en recomendaciones (bajo el umbral) y tareas (sobre él)
│   ├── rejillaTareas.json   # Rejilla académica GENERADA (scripts/build-rejilla.mjs) — no editar a mano
│   ├── avatarKit.jsx        # Avatar del estudiante: catálogos DiceBear + <Avatar/> (retrato) + RANKS
│   ├── avatarBody.jsx       # Cuerpo entero + armadura por rango (arte propio)
│   ├── supabaseClient.js    # Supabase init
│   ├── loadStudentSession.js # Load XP, badges
│   ├── idleTimeout.js       # Idle auto-logout (30 min)
│   ├── theme.js             # Dark/light + accents
│   ├── liveClient.js        # Modo Aula en Vivo: RPCs + suscripciones realtime
│   └── sound.js             # Beeps Web Audio (sin archivos) + mute para el modo en vivo
├── components/
│   ├── ui.jsx               # Reusable components
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   ├── Onboarding.jsx
│   ├── AvatarChip.jsx       # Avatar + rango en la cabecera (lazy, solo con tema activo)
│   ├── CourseAmbient.jsx    # Gate: lazy-loads the active course's theme overlay
│   ├── DetectiveAmbient.jsx, EscapeRoomAmbient.jsx, LabAmbient.jsx, TimeTravelAmbient.jsx
│   ├── ThemeCelebration.jsx, CharacterBubble.jsx  # Themed celebration + companion
│   └── ErrorBoundary.jsx
└── pages/
    ├── landing.jsx, login.jsx
    ├── map.jsx, lesson.jsx, challenges.jsx
    ├── Grid.jsx, profile.jsx
    ├── InstructorItemAnalysis.jsx # Análisis de ítems: dificultad, discriminación, distractores
    ├── ClosingRecord.jsx       # Acta de cierre: asistencia + observaciones → PDF (solo tutor/admin)
    ├── CloneAttendance.jsx     # PILOTO clon: el docente marca asistencia de SUS alumnos → acta
    ├── CloneEffectiveness.jsx  # PILOTO clon: tabla de efectividad (formulario + Excel) → informe
    ├── CloneGroups.jsx         # PILOTO clon (tutor): grupos por docente + listado de alumnos + plan de unidades
    ├── CloneUnitDashboard.jsx  # PILOTO clon: tablero de solo lectura con el orden de unidades del libro + ejes
    ├── LivePlay.jsx            # Modo Aula en Vivo — estudiante (página PÚBLICA #/live, sin login)
    ├── LiveHost.jsx            # Modo Aula en Vivo — profesor (page 'live-host': lanzador + panel)
    ├── AvatarStudio.jsx        # Pestaña "Mi avatar" del perfil (solo con curso temático)
    ├── AdminUsers.jsx, AdminCourses.jsx, etc.
    └── InstructorStudentView.jsx, forum.jsx, etc.

supabase/
├── migrations/          # Database schema (run manually in Supabase SQL Editor)
│   ├── 0001_init.sql
│   ├── 0007_multi_course.sql
│   ├── 0011_course_modules_area.sql   # adds area_id + allows type 'final_delivery'
│   ├── 0012_course_theme.sql          # adds courses.theme + character_line
│   ├── 0013–0016_seed_*.sql           # themed course seeds (detective/escape/lab/time-travel)
│   ├── 0017_active_users_institutions.sql  # is_active gate
│   ├── 0018_user_course_access.sql    # user_courses (strict per-user access)
│   ├── 0019_admin_manage_course_progress.sql
│   ├── 0020_seed_ecosistema_ia_course.sql  # 8-module video MOOC, sequential unlock
│   ├── 0021_seed_lectura_critica_llanto.sql # seed quiz con passage (texto+imágenes) — reemplazar URLs PLACEHOLDER
│   ├── 0022_live_classroom.sql             # Modo Aula en Vivo: tablas live_* + RLS + RPCs (scoring server-side)
│   ├── 0039_presence_gate.sql              # Código presencial: presence_gates/presence_unlocks + RPCs
│   ├── 0040_gate_module_content_server_side.sql # RPC get_course_modules_for_student: oculta content/challenge_data en el servidor
│   ├── 0041_cross_institution_fork_clone.sql # RLS: instructor multi-colegio puede leer forks de sus otros colegios para clonarlos
│   ├── 0042_presence_code_no_expiry.sql # Código presencial sin vencimiento (expires_at NULL)
│   ├── 0043_certificate_hours.sql # Intensidad horaria del certificado (courses.certificate_hours + certificates.hours)
│   ├── 0044_module_availability_window.sql # Ventana de disponibilidad de la entrega (course_modules.available_from/until + RPC)
│   ├── 0045_quiz_attempts.sql # Intentos + puntaje mínimo en quiz (quiz_attempts + RPCs record/reset)
│   ├── 0046_avatar_config.sql # Avatar del estudiante (profiles.avatar_config, jsonb)
│   ├── 0047_live_session_cleanup.sql # Clases en vivo colgadas: cierra las viejas + create_live_session cierra la anterior del curso
│   ├── 0048_analytics_capture.sql # Analítica: todos los intentos + respuestas por ítem (quiz_attempt_answers)
│   ├── 0049_analytics_rpcs.sql # Analítica: item_analysis + agregación por curso/módulo (server-side)
│   ├── 0050_closing_record.sql # Acta de cierre: tipo de módulo closing_record + course_roster + closing_records
│   ├── 0051_clone_role.sql # PILOTO TEMPORAL modo clon: profiles.ui_variant + clone_groups/_students/_attendance/_effectiveness
│   ├── 0052_clone_unit_plan.sql # PILOTO clon: tipo de módulo clone_dashboard + clone_unit_plans (orden de unidades + ejes por grupo)
│   ├── 0053_clone_plan_chart.sql # PILOTO clon: clone_unit_plans.chart (gráfica de ejes transversales parametrizable)
│   └── 0054_clone_effectiveness_unit.sql # PILOTO clon: clone_effectiveness.unit_label (unidad del libro trabajada)
└── functions/           # Edge Functions
    ├── bulk-create-users/
    └── send-reminders/
```

---

## Student Learning Path

```
1. Landing / Login
2. Onboarding (optional)
3. Area Selection (or Course Selection)
4. Learning Map - Interactive node graph
   ├── Module 1: Intro to DCE (shared)
   ├── Challenge 1: Drag-drop phases
   ├── Module 2: Empathy (shared)
   ├── Challenge 2: Empathy map
   ├── Module 3: Area-specific lesson
   ├── Challenge 3: Simulation
   ├── Module 4: Area-specific evaluation
   ├── Challenge 4: Matching concepts
   └── Final: Design Lab (5-question rubric)
5. Grid - Upload 2 Word documents
6. Instructor review & grading
7. Approved - Certificate + master badge
```

**Duration:** 20-30 hours per area  
**XP:** 100-300 per module; 9 levels (0 → 3500+)

---

## Customization

### Add New Learning Area

1. Edit `src/store/store.jsx`
2. Add to `AREAS`: `{ id: 'newarea', name: '...', icon: '...', color: '#...' }`
3. Add to `AREA_CONTENT[newarea]`: `m3: {...}, m4: {...}, simContext: '...', matchPairs: [...]`
4. Modules auto-generate; commit + push

### Change Lesson Content

1. Open `src/store/store.jsx`
2. Find module in `SHARED_MODULES` or `AREA_CONTENT[area].m3`
3. Edit `content: [...]` array
4. Commit + push

### Add Challenge Type

1. Define in `store.jsx` (e.g., `ctype: 'quiz'`)
2. Render in `src/pages/challenges.jsx`
3. Call `recordAttempt()`
4. Commit + push

---

## Environment & Deployment

**Frontend (`.env`):**
```
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Deployment:**
1. `git push` to main
2. Cloudflare Pages auto-builds (`npm run build`)
3. Publishes to CDN (~2 minutes)

**Local:** `npm run dev` (http://localhost:5173)

---

## Performance

- **Code splitting:** Pages lazy-loaded per role
- **Chunk vendors:** React, Supabase, XLSX in separate chunks
- **Memoization:** React.memo on large components
- **Narrow selectors:** useStore picks only needed state
- **CSS variables:** No runtime recalculation
- **Debounced resize:** Mobile detection (80ms debounce)

---

## Testing

**No test framework.** Manual testing:
- Dev: `npm run dev` + DevTools
- Dark mode: Click moon icon in header
- Supabase: Check SQL Editor + API usage
- Network: Verify RLS (403 = permission denied)
- Load: `node scripts/stress-test.js 50`

---

## Known Issues

1. **Hash routing:** URLs use `#/page/nodeId` (not pathname)
2. **RLS policies:** Check Supabase if students can't read data
3. **Realtime:** `route_configs` + `live_sessions`/`live_participants` (Modo Aula en Vivo) subscribed; other tables need refresh
4. **XP migrations:** Still migrating to course_progress table
5. **Content changes:** Require `git push` (no hot reload)
6. **Migraciones sin aplicar:** `0058` (bucket `corpus-normativo`) y `0059` (regla de conteos en `clone_effectiveness`) están escritas y probadas, pero **no se han corrido en el SQL Editor**
7. **CLI de Supabase inoperante:** sin `supabase/config.toml`, `db diff --linked` y `db push` fallan. Las migraciones se corren a mano; probarlas antes con `scripts/test-migraciones/`

---

## Resources

- **README.md** — Setup, content editing, load testing
- **Experia-Technical-Reference.md** — DB schema, API
- **Experia-Runbook-Despliegue-v12.md** — Deployment
- **Experia-Agente-Planes-Estudio.md** — ⏸️ Agente IA de planes de estudio: EN PAUSA. Estado, pendientes y punto de retome
- **Experia-Especificaciones-Visuales.md** — Design system: tokens, temas, componentes, accesibilidad
- **Supabase:** https://supabase.com/docs
- **React:** https://react.dev
- **Vite:** https://vitejs.dev

---

## Maintenance

- **Author:** Sergio Bahamon (sergiobaha05@gmail.com)
- **Version:** v15 (stable, multi-course)
- **Roadmap:** ⏸️ retomar el agente de planes de estudio (ver `Experia-Agente-Planes-Estudio.md`), migrar `InstructorStats`/`AdminAnalytics` a las RPC de 0049, informe posterior de clases en vivo (Fase 5 de `Experia-Plan-Analitica.md`), retención de datos, Sentry

