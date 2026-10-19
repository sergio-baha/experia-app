-- ============================================================
-- Cuentas de PRUEBA para la profesora andrea.albornoz2@ceinfes.com
--
-- andrea.buitrago@ceinfes.com y adriana.vargas@ceinfes.com ya son cuentas
-- reales (Escandinavo / sin colegio, cursando DCE), así que NO se tocan.
-- En su lugar se crean dos copias con otro correo, en el colegio Ceinfes:
--   andrea.buitrago2@ceinfes.com
--   adriana.vargas2@ceinfes.com
-- Contraseña 12345678, correo confirmado, cursos activos de Ceinfes.
-- Idempotente: si el correo ya existe, no se recrea.
-- Correr TODO en el SQL Editor de Supabase.
-- ============================================================
begin;

do $$
declare
  v_inst uuid;
  v_n    int;
  r      record;
  v_id   uuid;
begin
  select count(*) into v_n from public.institutions where name ilike '%ceinfes%';
  if v_n <> 1 then
    raise exception 'Se esperaba 1 colegio Ceinfes y hay %', v_n;
  end if;
  select id into v_inst from public.institutions where name ilike '%ceinfes%';

  for r in select * from (values
    ('andrea.buitrago2@ceinfes.com', 'Andrea Buitrago (prueba)'),
    ('adriana.vargas2@ceinfes.com',  'Adriana Vargas (prueba)')
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

  create temp table _nuevos on commit drop as
    select id from public.profiles
     where lower(email) in ('andrea.buitrago2@ceinfes.com', 'adriana.vargas2@ceinfes.com');
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
end $$;

commit;

-- Verificación
select p.email, p.name, p.role, i.name as colegio,
       (select string_agg(c.name, ', ') from public.user_courses uc
          join public.courses c on c.id = uc.course_id
         where uc.user_id = p.id and uc.is_active) as cursos
  from public.profiles p
  left join public.institutions i on i.id = p.institution_id
 where lower(p.email) in ('andrea.buitrago2@ceinfes.com', 'adriana.vargas2@ceinfes.com');
