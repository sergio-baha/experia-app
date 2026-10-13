// Prueba 0081 (llenar los "Pendiente" de las rutas base) sobre PGlite: copia
// el contenido lleno de la copia por colegio a la ruta base y a las demás
// copias de la misma familia, cruzando por título; no toca rondas, módulos
// editados a mano ni otras familias, y es idempotente.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, '..', '..', 'supabase', 'migrations', '0081_llenar_pendientes_rutas_base.sql');
const read = (p) => fs.readFileSync(p, 'utf8');
let fallos = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const bad = (m) => { fallos++; console.log(`  FALLO ${m}`); };
const esperar = (n, real, esp) => String(real) === String(esp) ? ok(`${n} = ${real}`) : bad(`${n}: esperado ${esp}, obtenido ${real}`);

const db = await PGlite.create({ extensions: { pgcrypto } });
await db.exec(read(path.join(HERE, 'prelude-curso.sql')));
await db.exec(`
  alter table public.courses add column parent_course_id uuid references public.courses(id);
  alter table public.courses add column draft_modules jsonb;
  create role authenticated;`);
const q = async (sql, p) => (await db.query(sql, p)).rows;
const U = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const PEND = (t) => JSON.stringify([{ type: 'intro', title: t }, { type: 'callout', title: 'Pendiente', text: 'Por definir' }]);
const LLENO = (t, bank) => JSON.stringify([{ type: 'intro', title: t }, { type: 'activity', title: 'Actividad', bank, activityId: bank === 'fisicas' ? 'fis-01' : 'rom-01' }]);
const mod = async (course, order, title, content, type = 'lesson') =>
  q(`insert into public.course_modules (course_id, title, "order", content, type) values ($1,$2,$3,$4::jsonb,$5)`, [course, title, order, content, type]);

// Matemáticas: base con "Pendiente"; la copia "mi versión" ya llena (con
// otro "order", como tras la renumeración de 0070); otro colegio sin llenar.
await q(`insert into public.courses (id, name, parent_course_id) values ($1,'Sala de Escape - Matematicas',null),($2,'Sala de Escape — mi versión',$1),($3,'Sala de Escape — Colegio X',$1)`, [U(1), U(2), U(3)]);
for (const c of [U(1), U(3)]) {
  await mod(c, 1, 'Encender la sala', PEND('Encender la sala'));
  await mod(c, 5, 'Recarga de energía', PEND('Recarga de energía'));
  await mod(c, 7, 'Cierre', PEND('Cierre'));                       // nadie lo tiene lleno
}
await mod(U(2), 1, 'Encender la sala', LLENO('Encender la sala', 'ambas'));
await mod(U(2), 6, 'Recarga de energía', LLENO('Recarga de energía', 'fisicas'));
await mod(U(2), 7, 'Cierre', PEND('Cierre'));
// Ronda tipo reto con "Pendiente" en su content: no se toca.
await mod(U(1), 4, 'Primera ronda', PEND('Primera ronda'), 'challenge');
await mod(U(2), 4, 'Primera ronda', LLENO('Primera ronda', 'ambas'));
// El Colegio X editó a mano su pausa activa: sin "Pendiente", no se toca.
await q(`update public.course_modules set content = '[{"type":"text","title":"Mi pausa"}]' where course_id = $1 and "order" = 5`, [U(3)]);
// Otra familia (Lenguaje) con el mismo título: no debe servir de fuente.
await q(`insert into public.courses (id, name, parent_course_id) values ($1,'Detectives',null)`, [U(9)]);
await mod(U(9), 1, 'Encender la sala', PEND('Encender la sala'));
await q(`update public.courses set draft_modules = $2::jsonb where id = $1`, [U(1), JSON.stringify([{ title: 'Pendiente' }])]);

console.log('\n=== 0081 ===');
let est;
try { est = (await db.exec(read(MIG))).at(-1).rows; ok('0081 aplica'); }
catch (e) { bad(`0081 falló: ${e.message}`); process.exit(1); }
est.forEach(r => console.log(`       ${r.estado.padEnd(19)} ${r.curso.padEnd(30)} ${r.modulo.padEnd(24)} ${r.detalle}`));
const cuenta = (rows, e) => rows.filter(r => r.estado === e).length;
esperar('módulos llenados (base: 1 y 5; Colegio X: 1)', cuenta(est, 'LLENADO'), 3);
esperar('sin fuente (Cierre ×3, Lenguaje)', cuenta(est, 'SIN FUENTE'), 4);
esperar('borrador con "Pendiente" avisado', cuenta(est, 'BORRADOR PENDIENTE'), 1);

const content = async (c, o) => (await q(`select content from public.course_modules where course_id=$1 and "order"=$2`, [c, o]))[0].content;
esperar('base · apertura con banco de actividades', (await content(U(1), 1)).some(s => s.type === 'activity' && s.bank === 'ambas'), true);
esperar('base · pausa activa con banco de físicas', (await content(U(1), 5)).some(s => s.type === 'activity' && s.bank === 'fisicas'), true);
esperar('base · ronda (reto) sin tocar', (await content(U(1), 4)).some(s => s.title === 'Pendiente'), true);
esperar('Colegio X · pausa editada a mano sin tocar', (await content(U(3), 5))[0].title, 'Mi pausa');
esperar('otra familia sin tocar', (await content(U(9), 1)).some(s => s.title === 'Pendiente'), true);

console.log('\n=== IDEMPOTENCIA ===');
const est2 = (await db.exec(read(MIG))).at(-1).rows;
esperar('segunda corrida: nada nuevo', cuenta(est2, 'LLENADO'), 0);

console.log(`\n=== RESULTADO: ${fallos === 0 ? 'TODO OK' : fallos + ' FALLO(S)'} ===`);
process.exit(fallos === 0 ? 0 : 1);
