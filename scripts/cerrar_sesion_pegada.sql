-- [1] Diagnóstico: sesiones de "Sala de Escape - Matemáticas" (base + fork)
-- que quedaron activas (status <> 'ended') — la causa de que a Andrea le
-- siga apareciendo el aviso de clase en vivo sin que nadie la haya cerrado.
select id, course_id, status, phase, created_at, ended_at
  from public.live_sessions
 where course_id in (
   '2bb289f1-45c6-47c3-a8fb-55b38f2e2e9b', -- base
   '88136e1a-4564-45bd-b514-0ad6690b182c'  -- fork "— mi versión"
 )
 order by created_at desc;

-- [2] Cierra TODAS las sesiones de esos dos cursos que sigan sin terminar.
-- Es seguro: replica exactamente lo que hace el botón "Finalizar clase en
-- vivo" (deja status='ended'), solo que a mano y sin importar si el profe
-- ya cerró el panel. En cuanto corras esto, a Andrea (y a cualquier otro
-- estudiante) debería dejar de aparecerle el aviso/candado en su próxima
-- carga de la página.
update public.live_sessions
   set status = 'ended', phase = 'podium', ended_at = now()
 where course_id in (
   '2bb289f1-45c6-47c3-a8fb-55b38f2e2e9b',
   '88136e1a-4564-45bd-b514-0ad6690b182c'
 )
   and status <> 'ended'
returning id, course_id, status, ended_at;
