// Prueba 0082 (biblioteca de versiones de ruta) sobre PGlite: columnas,
// forma de una plantilla (curso base y sin colegio) y RLS — el tutor crea,
// edita y borra SUS plantillas y sus módulos, pero no las de otro tutor.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, '..', '..', 'supabase', 'migrations', '0082_versiones_de_ruta.sql');
const read = (p) => fs.readFileSync(p, 'utf8');
let fallos = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const bad = (m) => { fallos++; console.log(`  FALLO ${m}`); };
const esperar = (n, real, esp) => String(real) === String(esp) ? ok(`${n} = ${real}`) : bad(`${n}: esperado ${esp}, obtenido ${real}`);

const db = await PGlite.create({ extensions: { pgcrypto } });
await db.exec(read(path.join(HERE, 'prelude.sql')));
await db.exec(read(path.join(HERE, 'prelude-curso.sql')));
await db.exec(`
  alter table public.courses add column parent_course_id uuid references public.courses(id);
  alter table public.courses add column institution_id uuid;
  alter table public.courses add column owner_id uuid;
  alter table public.courses enable row level security;
  alter table public.course_modules enable row level security;
  grant all on public.courses, public.course_modules to authenticated;`);

const A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; // tutor A
const B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'; // tutor B
const BASE = '00000000-0000-0000-0000-000000000001';
await db.exec(`
  insert into public.profiles (id, role) values ('${A}', 'instructor'), ('${B}', 'instructor');
  insert into public.courses (id, name) values ('${BASE}', 'Sala de Escape - Matematicas');`);

console.log('\n=== APLICACIÓN ===');
try { const r = (await db.exec(read(MIG))).at(-1).rows[0]; ok(`0082 aplica (${r.estado})`); }
catch (e) { bad(`0082 falló: ${e.message}`); process.exit(1); }
try { await db.exec(read(MIG)); ok('0082 es idempotente'); } catch (e) { bad(`segunda corrida falló: ${e.message}`); }

// Plantilla de B creada como superusuario (para probar que A no la toca).
const TPL_B = '00000000-0000-0000-0000-0000000000b1';
await db.exec(`insert into public.courses (id, name, is_template, parent_course_id, owner_id) values ('${TPL_B}', 'Plantilla de B', true, '${BASE}', '${B}')`);

console.log('\n=== FORMA DE UNA PLANTILLA ===');
let falla = null;
try { await db.exec(`insert into public.courses (name, is_template, parent_course_id, institution_id) values ('x', true, '${BASE}', gen_random_uuid())`); }
catch (e) { falla = e.message; }
esperar('plantilla con colegio → rechazada', !!falla, true);
falla = null;
try { await db.exec(`insert into public.courses (name, is_template) values ('x', true)`); } catch (e) { falla = e.message; }
esperar('plantilla sin curso base → rechazada', !!falla, true);

async function como(uid, fn) {
  await db.exec('begin');
  await db.exec('set local role authenticated');
  await db.exec(`set local request.jwt.claims = '{"sub":"${uid}","role":"authenticated"}'`);
  try { return await fn(); } finally { await db.exec('rollback'); }
}
// Cada intento en su savepoint: un error no aborta la transacción de la prueba.
const intenta = async (sql) => {
  await db.exec('savepoint t')
  try { await db.exec(sql); await db.exec('release savepoint t'); return 'ok' }
  catch (e) { await db.exec('rollback to savepoint t'); return 'error' }
};

console.log('\n=== RLS ===');
await como(A, async () => {
  esperar('A crea su plantilla', await intenta(`insert into public.courses (id, name, is_template, parent_course_id, owner_id)
    values ('00000000-0000-0000-0000-0000000000a1', 'Mía', true, '${BASE}', '${A}')`), 'ok');
  esperar('A agrega módulos a su plantilla', await intenta(`insert into public.course_modules (course_id, title)
    values ('00000000-0000-0000-0000-0000000000a1', 'Módulo 1')`), 'ok');
  esperar('A edita la nota de su plantilla',
    (await db.query(`update public.courses set version_note = 'jornada única' where id = '00000000-0000-0000-0000-0000000000a1' returning id`)).rows.length, 1);
  esperar('A NO crea una plantilla a nombre de B', await intenta(`insert into public.courses (name, is_template, parent_course_id, owner_id)
    values ('Falsa', true, '${BASE}', '${B}')`), 'error');
  esperar('A NO edita la plantilla de B',
    (await db.query(`update public.courses set version_note = 'x' where id = '${TPL_B}' returning id`)).rows.length, 0);
  esperar('A NO agrega módulos a la plantilla de B', await intenta(`insert into public.course_modules (course_id, title) values ('${TPL_B}', 'x')`), 'error');
  esperar('A NO borra la plantilla de B',
    (await db.query(`delete from public.courses where id = '${TPL_B}' returning id`)).rows.length, 0);
  esperar('A NO convierte el curso base en plantilla',
    (await db.query(`update public.courses set is_template = true where id = '${BASE}' returning id`)).rows.length, 0);
  esperar('A borra su plantilla',
    (await db.query(`delete from public.courses where id = '00000000-0000-0000-0000-0000000000a1' returning id`)).rows.length, 1);
});

console.log(`\n=== RESULTADO: ${fallos === 0 ? 'TODO OK' : fallos + ' FALLO(S)'} ===`);
process.exit(fallos === 0 ? 0 : 1);
