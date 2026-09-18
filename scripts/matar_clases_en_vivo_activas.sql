-- [1] Diagnóstico: TODAS las sesiones en vivo activas ahora mismo, en
-- cualquier curso (no solo Matemáticas) — para ver qué se va a cerrar antes
-- de tocar nada.
select ls.id, ls.course_id, c.name as curso, ls.status, ls.phase, ls.created_at
  from public.live_sessions ls
  left join public.courses c on c.id = ls.course_id
 where ls.status <> 'ended'
 order by ls.created_at desc;

-- [2] Cierra TODAS las sesiones activas de golpe (en cualquier curso). Es
-- seguro: hace exactamente lo mismo que el botón "Finalizar clase en vivo"
-- del panel del profesor (deja status='ended'), solo que a mano.
update public.live_sessions
   set status = 'ended', phase = 'podium', ended_at = now()
 where status <> 'ended'
returning id, course_id, status, ended_at;
