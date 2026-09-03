-- Deshabilita TEMPORALMENTE el candado "requires_live_to_start" (0063) en
-- el curso base y el fork de Sala de Escape - Matemáticas, sin borrar la
-- columna ni el RPC — la ruta vuelve a comportarse como cualquier otra
-- mientras esto esté en false.
--
-- Para reactivarlo más adelante: correr lo mismo cambiando "false" por "true".
--
-- EJECUTAR en Supabase SQL Editor. No requiere que 0063 ya se haya corrido
-- (si la columna no existe todavía, este UPDATE simplemente no encuentra
-- nada que hacer una vez se cree, y el candado nace ya desactivado).

UPDATE public.courses
   SET requires_live_to_start = false
 WHERE id IN (
   '2bb289f1-45c6-47c3-a8fb-55b38f2e2e9b', -- Sala de Escape - Matematicas (base)
   '88136e1a-4564-45bd-b514-0ad6690b182c'  -- Sala de Escape - Matematicas — mi versión (fork)
 )
RETURNING id, name, requires_live_to_start;
