-- ============================================================
-- Crear 9 estudiantes de la profesora andrea.albornoz2@ceinfes.com
--
-- "Estudiante de la profesora" = mismo colegio (las policies del instructor
-- ven a los estudiantes por institución). El script:
--   1. Usa el colegio "Ceinfes" (ya creado) y lo agrega a los colegios de la
--      profesora si aún no lo tiene (instructor_institutions).
--   2. Crea las cuentas (contraseña 12345678, correo ya confirmado) en ese
--      colegio. El trigger handle_new_user crea el perfil como 'student'.
--   3. Les da los cursos activos del colegio: user_courses + course_enrollments
--      + course_progress vacío (igual que autoEnrollInstitutionStudents).
-- Idempotente: los correos que ya existen no se recrean.
-- Correr TODO en el SQL Editor de Supabase.
-- ============================================================
begin;

do $$
declare
  v_teacher uuid;
  v_inst    uuid;
  v_n       int;
  r         record;
  v_id      uuid;
begin
  select id, institution_id into v_teacher, v_inst
    from public.profiles where lower(email) = 'andrea.albornoz2@ceinfes.com';
  if v_teacher is null then
    raise exception 'No existe la profesora andrea.albornoz2@ceinfes.com';
  end if;

  -- Colegio fijo: Ceinfes (ya creado)
  select count(*) into v_n from public.institutions where name ilike '%ceinfes%';
  if v_n = 0 then
    raise exception 'No se encontró el colegio Ceinfes';
  elsif v_n > 1 then
    raise exception 'Hay % colegios con "Ceinfes" en el nombre: %', v_n,
      (select string_agg(name, ' | ') from public.institutions where name ilike '%ceinfes%');
  end if;
  select id into v_inst from public.institutions where name ilike '%ceinfes%';
  raise notice 'Colegio: % (%)', (select name from public.institutions where id = v_inst), v_inst;

  -- La profesora ve a sus estudiantes por colegio: asegurar que Ceinfes esté entre los suyos
  insert into public.instructor_institutions (instructor_id, institution_id)
  values (v_teacher, v_inst)
  on conflict (instructor_id, institution_id) do nothing;

  for r in select * from (values
    ('sebastian.puentes@ceinfes.com',  'Sebastian Puentes'),
    ('edicson.castaneda@ceinfes.com',  'Edicson Castaneda'),
    ('yeimy.bustos@ceinfes.com',       'Yeimy Bustos'),
    ('fernando.bogota@ceinfes.com',    'Fernando Bogota'),
    ('adriana.vargas@ceinfes.com',     'Adriana Vargas'),
    ('oscar.lesmes@ceinfes.com',       'Oscar Lesmes'),
    ('maria.munoz@ceinfes.com',        'Maria Munoz'),
    ('andrea.buitrago@ceinfes.com',    'Andrea Buitrago'),
    ('natalia.fuentes@ceinfes.com',    'Natalia Fuentes')
  ) as t(email, nombre) loop
    if exists (select 1 from auth.users where lower(email) = r.email) then
      raise notice 'Ya existía: %', r.email;
      continue;
    end if;
    v_id := gen_random_uuid();
    -- Tokens en '' (no NULL): GoTrue falla al iniciar sesión si están en NULL.
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', r.email,
            extensions.crypt('12345678', extensions.gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('name', r.nombre, 'role', 'student', 'institution_id', v_inst::text),
            now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text,
            jsonb_build_object('sub', v_id::text, 'email', r.email, 'email_verified', true),
            'email', now(), now(), now());
    raise notice 'Creado: %', r.email;
  end loop;

  -- Acceso a los cursos activos (y no vencidos) del colegio
  create temp table _nuevos on commit drop as
    select p.id from public.profiles p
     where lower(p.email) in (
       'sebastian.puentes@ceinfes.com','edicson.castaneda@ceinfes.com','yeimy.bustos@ceinfes.com',
       'fernando.bogota@ceinfes.com','adriana.vargas@ceinfes.com','oscar.lesmes@ceinfes.com',
       'maria.munoz@ceinfes.com','andrea.buitrago@ceinfes.com','natalia.fuentes@ceinfes.com');
  create temp table _cursos on commit drop as
    select ic.course_id from public.institution_courses ic
     where ic.institution_id = v_inst and ic.is_active
       and (ic.expires_at is null or ic.expires_at > now());

  insert into public.user_courses (user_id, course_id, is_active)
  select n.id, c.course_id, true from _nuevos n cross join _cursos c
  on conflict (user_id, course_id) do update set is_active = true;

  insert into public.course_enrollments (student_id, course_id, institution_id)
  select n.id, c.course_id, v_inst from _nuevos n cross join _cursos c
  on conflict (student_id, course_id) do nothing;

  insert into public.course_progress (user_id, course_id, xp, completed, badges)
  select n.id, c.course_id, 0, '{}', '{}' from _nuevos n cross join _cursos c
  on conflict (user_id, course_id) do nothing;

  raise notice 'Estudiantes: %, cursos asignados a cada uno: %',
    (select count(*) from _nuevos), (select count(*) from _cursos);
end $$;

commit;

-- Verificación
select p.email, p.name, p.role, i.name as colegio,
       (select string_agg(c.name, ', ') from public.user_courses uc
          join public.courses c on c.id = uc.course_id
         where uc.user_id = p.id and uc.is_active) as cursos
  from public.profiles p
  left join public.institutions i on i.id = p.institution_id
 where lower(p.email) like any (array['sebastian.puentes@%','edicson.castaneda@%','yeimy.bustos@%',
       'fernando.bogota@%','adriana.vargas@%','oscar.lesmes@%','maria.munoz@%',
       'andrea.buitrago@%','natalia.fuentes@%'])
 order by p.email;
