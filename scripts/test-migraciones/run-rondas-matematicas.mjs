// Prueba 0080 (Matemáticas cambia de banco de preguntas) sobre PGlite: parte
// de rondas cargadas por 0075 con el banco anterior y comprueba que 0080
// reemplaza solo las que siguen con preguntas de ese banco, recorre la familia
// completa, respeta las preguntas propias del tutor y es idempotente.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIGS = path.resolve(HERE, '..', '..', 'supabase', 'migrations');
const read = (p) => fs.readFileSync(p, 'utf8');
let fallos = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const bad = (m) => { fallos++; console.log(`  FALLO ${m}`); };
const esperar = (n, real, esp) => String(real) === String(esp) ? ok(`${n} = ${real}`) : bad(`${n}: esperado ${esp}, obtenido ${real}`);

const db = await PGlite.create({ extensions: { pgcrypto } });
await db.exec(read(path.join(HERE, 'prelude-curso.sql')));
await db.exec(`
  alter table public.courses add column parent_course_id uuid references public.courses(id);
  alter table public.courses add column institution_id uuid;
  alter table public.courses add column draft_modules jsonb;
  create role authenticated;`);
const q = async (sql, p) => (await db.query(sql, p)).rows;
const U = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const PEND = JSON.stringify([{ type: 'intro', title: 'Pendiente', text: 'x' }, { type: 'callout', title: 'Frase de apertura', text: '¡A escapar!' }]);
const curso = async (id, name, parent) => {
  await q(`insert into public.courses (id, name, parent_course_id) values ($1,$2,$3)`, [id, name, parent]);
  for (let o = 1; o <= 7; o++) await q(`insert into public.course_modules (course_id, title, "order", content) values ($1,$2,$3,$4::jsonb)`,
    [id, `Módulo ${o}`, o, [4, 6].includes(o) ? PEND : '[]']);
};
const MATE_FORK = '88136e1a-4564-45bd-b514-0ad6690b182c';
await curso(U(1), 'Sala de Escape - Matematicas', null);
await curso(MATE_FORK, 'Sala de Escape — Colegio A', U(1));
await curso(U(2), 'Sala de Escape — Colegio B', U(1));
await curso(U(3), 'Detectives', null);                         // otra asignatura: no se toca
await curso('d4aa2014-aa49-46d1-8ac3-7e5842fc8dc1', 'Detectives — mi versión', U(3));

// Estado de partida: 0075 tal como se aplicó (banco anterior, ids "mat-NN").
await db.exec(read(path.join(MIGS, '0075_rondas_banco_preguntas.sql')));
const ronda = async (course, order) => (await q(`select * from public.course_modules where course_id=$1 and "order"=$2`, [course, order]))[0];
// Copia de copia (0075 no llegaba a ellas): el fork copia los módulos tal cual.
await curso(U(4), 'Sala de Escape — Colegio A, sede 2', MATE_FORK);
for (const o of [4, 6]) {
  await q(`update public.course_modules d set type = s.type, challenge_type = s.challenge_type, challenge_data = s.challenge_data
             from public.course_modules s where s.course_id = $1 and s."order" = $3 and d.course_id = $2 and d."order" = $3`, [MATE_FORK, U(4), o]);
}
esperar('partida: la ronda tiene el banco anterior', (await ronda(U(1), 4)).challenge_data.questions.every(x => /^mat-\d\d$/.test(x.id)), true);

// El Colegio A eligió OTRAS preguntas del banco anterior para su ronda final
// (siguen siendo "mat-NN": deben reemplazarse).
const a6 = await ronda(MATE_FORK, 6);
await q(`update public.course_modules set challenge_data = jsonb_set(challenge_data, '{questions}', $2::jsonb) where id = $1`,
  [a6.id, JSON.stringify(a6.challenge_data.questions.slice(0, 3))]);
// El Colegio B agregó una pregunta propia a su ronda final: no se toca.
const b6 = await ronda(U(2), 6);
await q(`update public.course_modules set challenge_data = jsonb_set(challenge_data, '{questions}', $2::jsonb) where id = $1`,
  [b6.id, JSON.stringify([...b6.challenge_data.questions, { id: 'q_1a2b3c4d', question: 'Mía', options: ['a', 'b'], correct: 0 }])]);
// El Colegio B tiene un borrador sin publicar: debe avisarse.
await q(`update public.courses set draft_modules = '[]'::jsonb where id = $1`, [U(2)]);
const lenguajeAntes = JSON.stringify(await q(`select challenge_data from public.course_modules where course_id in ($1,$2) order by id`, [U(3), 'd4aa2014-aa49-46d1-8ac3-7e5842fc8dc1']));
const titulosAntes = JSON.stringify(await q(`select id, title, content from public.course_modules where "order" in (4,6) order by id`));

console.log('\n=== 0080 ===');
const MIG = path.join(MIGS, '0080_rondas_matematicas_nuevo_banco.sql');
let est;
try { est = (await db.exec(read(MIG))).at(-1).rows; ok('0080 aplica'); }
catch (e) { bad(`0080 falló: ${e.message}`); process.exit(1); }
est.forEach(r => console.log(`       ${r.estado.padEnd(20)} ${r.curso.padEnd(32)} ${r.detalle}`));
const cuenta = (rows, e) => rows.filter(r => r.estado === e).length;
esperar('rondas reemplazadas (4 cursos × 2 − 1 con pregunta propia)', cuenta(est, 'REEMPLAZADA'), 7);
esperar('ronda con pregunta propia del tutor, sin tocar', cuenta(est, 'NO TOCADO'), 1);
esperar('borrador sin publicar avisado', cuenta(est, 'BORRADOR PENDIENTE'), 1);

const r4 = await ronda(U(1), 4);
esperar('primera ronda: 10 preguntas del banco nuevo', r4.challenge_data.questions.length === 10 && r4.challenge_data.questions.every(x => x.id.startsWith('mate-')), true);
esperar('primera ronda: arranca en mate-01', r4.challenge_data.questions[0].id, 'mate-01');
esperar('se conserva la marca de ronda', `${r4.challenge_data.bank}/${r4.challenge_data.bankRound}/${r4.challenge_data.passingScore}`, 'matematicas/1/0');
esperar('ronda elegida a mano del banco anterior → reemplazada', (await ronda(MATE_FORK, 6)).challenge_data.questions.length, 10);
esperar('copia de copia → reemplazada', (await ronda(U(4), 4)).challenge_data.questions[0].id, 'mate-01');
const b6d = await ronda(U(2), 6);
esperar('ronda con pregunta propia → intacta', b6d.challenge_data.questions.some(x => x.id === 'q_1a2b3c4d') && b6d.challenge_data.questions.some(x => x.id.startsWith('mat-')), true);
esperar('título, orden y guía del bloque intactos', JSON.stringify(await q(`select id, title, content from public.course_modules where "order" in (4,6) order by id`)) === titulosAntes, true);
esperar('otra asignatura intacta', JSON.stringify(await q(`select challenge_data from public.course_modules where course_id in ($1,$2) order by id`, [U(3), 'd4aa2014-aa49-46d1-8ac3-7e5842fc8dc1'])) === lenguajeAntes, true);

const mp = r4.challenge_data.questions.find(x => x.id === 'mate-04');
esperar('información compartida (4–6) viaja con la pregunta', mp.passage?.title, 'Capacitación en informática básica');

console.log('\n=== IDEMPOTENCIA ===');
const est2 = (await db.exec(read(MIG))).at(-1).rows;
esperar('segunda corrida: nada nuevo', cuenta(est2, 'REEMPLAZADA'), 0);
esperar('segunda corrida: ya aplicadas', cuenta(est2, 'YA APLICADA'), 7);

console.log('\n=== CLASE EN VIVO ===');
const snap = (await q(`select public._snapshot_module_questions($1, 20) s`, [r4.id]))[0].s;
esperar('lleva la pista', snap.snapshot.every(x => x.hint), true);
esperar('lleva el texto de apoyo de la 4–6', snap.snapshot.filter(x => x.passage).length, 3);
esperar('NO lleva la respuesta', snap.snapshot.some(x => 'correct' in x), false);
const r6 = await ronda(U(1), 6);
const snap6 = (await q(`select public._snapshot_module_questions($1, 20) s`, [r6.id]))[0].s;
const g = snap6.snapshot[r6.challenge_data.questions.findIndex(x => x.id === 'mate-12')];
esperar('opciones con imagen (mate-12) llegan al estudiante', g.optionImages?.length === 4 && g.optionImages.every(u => u.startsWith('/preguntas/')), true);
esperar('preguntas sin imágenes de opción no llevan el campo', snap6.snapshot.filter(x => 'optionImages' in x).length, 1);
esperar('la respuesta queda en las claves', snap.keys.every(k => Number.isInteger(k.correct)), true);

console.log(`\n=== RESULTADO: ${fallos === 0 ? 'TODO OK' : fallos + ' FALLO(S)'} ===`);
process.exit(fallos === 0 ? 0 : 1);
