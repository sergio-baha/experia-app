-- Contenido COMPLETO de los 5 módulos con un "Pendiente", para redactar el
-- reemplazo con el contexto real de cada uno (no solo el aviso suelto).
select "order", title, subtitle, description, content
  from public.course_modules
 where course_id = '88136e1a-4564-45bd-b514-0ad6690b182c'
   and "order" in (1, 3, 5, 7, 8)
 order by "order";
