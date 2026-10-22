// Prueba 0083 (puntaje con el tiempo por pregunta del profesor) sobre PGlite:
// con 120 s en el snapshot de la sesión y 60 s en la llave, responder en el
// segundo 60 debe dar 75 % del puntaje base (antes daba el mínimo, 50 %).
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, '..', '..', 'supabase', 'migrations', '0083_live_tiempo_por_pregunta.sql');
let fallos = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const bad = (m) => { fallos++; console.log(`  FALLO ${m}`); };
const esperar = (n, real, esp) => String(real) === String(esp) ? ok(`${n} = ${real}`) : bad(`${n}: esperado ${esp}, obtenido ${real}`);

const db = await PGlite.create();
await db.exec(`
  create role anon; create role authenticated;
  create table public.live_sessions (id uuid primary key, phase text, current_index int, question_started_at timestamptz,
    time_limit_s int, questions jsonb);
  create table public.live_session_keys (session_id uuid primary key, answer_key jsonb);
  create table public.live_participants (id uuid primary key, session_id uuid, claim_token uuid, score int default 0,
    streak int default 0, last_seen timestamptz);
  create table public.live_answers (id serial primary key, session_id uuid, participant_id uuid, question_index int,
    answer_index int, is_correct boolean, response_ms int, points int);
  insert into public.live_sessions values ('11111111-1111-1111-1111-111111111111', 'question', 0, now() - interval '60 seconds', 120,
    '[{"time_limit_s":120},{"time_limit_s":120}]');
  insert into public.live_session_keys values ('11111111-1111-1111-1111-111111111111',
    '[{"correct":1,"points":1000,"time_limit_s":60},{"correct":0,"points":1000,"time_limit_s":60}]');
  insert into public.live_participants (id, session_id) values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111');`);

try { await db.exec(fs.readFileSync(MIG, 'utf8')); ok('0083 aplica'); } catch (e) { bad('0083 falló: ' + e.message); process.exit(1); }
try { await db.exec(fs.readFileSync(MIG, 'utf8')); ok('0083 es idempotente'); } catch (e) { bad('segunda corrida: ' + e.message); }

const S = '11111111-1111-1111-1111-111111111111';
const r = (await db.query(`select public.submit_live_answer('${S}', '22222222-2222-2222-2222-222222222222', 0, 1) as r`)).rows[0].r;
(r.points >= 745 && r.points <= 750) ? ok(`acierto en el s 60 de 120 = ${r.points} (≈750)`) : bad(`acierto en el s 60: esperado ≈750, obtenido ${r.points}`);
// Snapshot viejo sin time_limit_s → cae a la llave (60 s): puntaje mínimo.
await db.exec(`update public.live_sessions set questions = '[{},{}]'`);
const r2 = (await db.query(`select public.submit_live_answer('${S}', '33333333-3333-3333-3333-333333333333', 0, 1) as r`)).rows[0].r;
esperar('sin tiempo en el snapshot usa la llave', r2.points, 500);
console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo OK');
process.exit(fallos ? 1 : 0);
