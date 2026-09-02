-- 0061: Reemplaza la ruta de los 4 cursos temáticos por el guion estándar
-- de Aula en Vivo (7 bloques, 2h10, tiempos fijos) — mismo orden y duración
-- en las 4 rutas; solo cambian los títulos y la frase de apertura según el
-- tema del curso. Reemplaza TODOS los módulos existentes del curso (incluida
-- cualquier entrega final que tuviera) — quedan como módulos de lección
-- normales, editables desde el Editor de Ruta como cualquier otro.
-- Ejecutar en Supabase SQL Editor. Repite el mismo bloque por cada tema; si
-- un curso con ese tema no existe (o no está activo), lo salta con un aviso
-- en vez de fallar toda la migración. Solo toca el curso BASE de cada tema
-- (parent_course_id IS NULL) — los forks por colegio quedan con su ruta
-- anterior; para llevarles este mismo reemplazo, el tutor de ese colegio usa
-- "Importar ruta de otro colegio" desde el Editor de Ruta después de correr esto.

DO $$
DECLARE
  v_course_id uuid;
BEGIN
  -- parent_course_id IS NULL: el curso BASE, nunca un fork de colegio (los
  -- forks tienen su propia copia de course_modules y no se tocan aquí).
  SELECT id INTO v_course_id FROM public.courses
  WHERE theme = 'lab' AND is_active = true AND parent_course_id IS NULL
  ORDER BY created_at ASC LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE NOTICE 'Sin curso activo con theme=lab (Laboratorio de Ciencias Naturales) — se omite.';
  ELSE
    DELETE FROM public.course_modules WHERE course_id = v_course_id;

    -- Bloque 1/7 — Encender el laboratorio (00:00–00:10, 10 min, Activación)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Encender el laboratorio', 'Bloque 1 — Activación',
      '00:00–00:10 · 10 min · Activación',
      'lesson', 1, 30, true, null, 'Encendamos el laboratorio.',
      '[{"type":"intro","title":"Encender el laboratorio","text":"00:00–00:10 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Encendamos el laboratorio.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Actividad rompehielo — cognitiva o física, a elección del tutor."},{"type":"text","title":"Cómo ejecutarlo","text":"Elige la dinámica según la energía con la que llega el grupo: cognitiva si necesitan enfocarse, física si llegan dispersos. — Debe ser corta y de instrucciones simples: el grupo apenas está entrando."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de actividades rompehielo. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 2/7 — Protocolo del experimento (00:10–00:25, 15 min, Encuadre)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Protocolo del experimento', 'Bloque 2 — Encuadre',
      '00:10–00:25 · 15 min · Encuadre',
      'lesson', 2, 30, true, null, 'Antes de experimentar, el protocolo del experimento.',
      '[{"type":"intro","title":"Protocolo del experimento","text":"00:10–00:25 · 15 min"},{"type":"callout","title":"Frase de apertura","text":"“Antes de experimentar, el protocolo del experimento.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Explicación de la estructura de la Prueba Saber — contenido estandarizado por asignatura."},{"type":"text","title":"Cómo ejecutarlo","text":"Se apoya en el material único del área, distribuido aparte. — Objetivo del bloque: que el grupo reconozca secciones, tipos de pregunta y forma de puntuar antes de practicar."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Documento estandarizado por asignatura. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 3/7 — Bitácora de resultados anteriores (00:25–00:35, 10 min, Diagnóstico)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Bitácora de resultados anteriores', 'Bloque 3 — Diagnóstico',
      '00:25–00:35 · 10 min · Diagnóstico',
      'lesson', 3, 30, true, null, 'Revisemos la bitácora de resultados anteriores.',
      '[{"type":"intro","title":"Bitácora de resultados anteriores","text":"00:25–00:35 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Revisemos la bitácora de resultados anteriores.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Lectura y análisis de resultados previos — institucionales, de simulacro o de la Prueba Saber del año anterior."},{"type":"text","title":"Cómo ejecutarlo","text":"Lleva datos reales del grupo o la institución: movilizan más que un ejemplo genérico. — Cierra el bloque con una pregunta abierta al grupo sobre lo que esos resultados dicen de ellos."}]'::jsonb
    );

    -- Bloque 4/7 — Primera ronda de hipótesis (00:35–01:10, 35 min, Práctica)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Primera ronda de hipótesis', 'Bloque 4 — Práctica',
      '00:35–01:10 · 35 min · Práctica',
      'lesson', 4, 30, true, null, 'Primera ronda de hipótesis: midan antes de concluir.',
      '[{"type":"intro","title":"Primera ronda de hipótesis","text":"00:35–01:10 · 35 min"},{"type":"callout","title":"Frase de apertura","text":"“Primera ronda de hipótesis: midan antes de concluir.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Preguntas de nivel medio-alto con retroalimentación inmediata — sugerido 10 a 12 preguntas del banco."},{"type":"text","title":"Cómo ejecutarlo","text":"Retroalimenta cada pregunta o cada bloque corto: no acumules toda la retro para el final. — Ritmo sugerido: cerca de 3 minutos por pregunta, entre responder y retroalimentar."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de preguntas. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 5/7 — Pausa activa en el laboratorio (01:10–01:20, 10 min, Activación)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Pausa activa en el laboratorio', 'Bloque 5 — Activación',
      '01:10–01:20 · 10 min · Activación',
      'lesson', 5, 30, true, null, 'Pausa activa en el laboratorio.',
      '[{"type":"intro","title":"Pausa activa en el laboratorio","text":"01:10–01:20 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Pausa activa en el laboratorio.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Actividad de reactivación — del banco, trae únicamente las que impliquen movimiento."},{"type":"text","title":"Cómo ejecutarlo","text":"A esta altura la atención decae: prioriza movimiento real, no otro ejercicio de escritorio. — Sirve de puente antes del bloque más largo y exigente de la sesión."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de actividades (solo físicas). Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 6/7 — El experimento a fondo (01:20–02:00, 40 min, Práctica)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'El experimento a fondo', 'Bloque 6 — Práctica',
      '01:20–02:00 · 40 min · Práctica',
      'lesson', 6, 30, true, null, 'El experimento a fondo. Aquí se prueba todo lo aprendido.',
      '[{"type":"intro","title":"El experimento a fondo","text":"01:20–02:00 · 40 min"},{"type":"callout","title":"Frase de apertura","text":"“El experimento a fondo. Aquí se prueba todo lo aprendido.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Preguntas de nivel alto con retroalimentación — sugerido 8 a 12 preguntas del banco."},{"type":"text","title":"Cómo ejecutarlo","text":"Es el bloque más largo de toda la sesión: resérvalo para cuando el grupo ya calentó motores en el bloque anterior. — Misma retroalimentación inmediata que en la ronda anterior."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de preguntas. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 7/7 — Conclusiones de la bitácora (02:00–02:10, 10 min, Cierre)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Conclusiones de la bitácora', 'Bloque 7 — Cierre',
      '02:00–02:10 · 10 min · Cierre',
      'lesson', 7, 30, true, null, 'Cerremos la bitácora de hoy.',
      '[{"type":"intro","title":"Conclusiones de la bitácora","text":"02:00–02:10 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Cerremos la bitácora de hoy.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Cierre reflexivo — sin guion fijo, lo gestiona cada tutor."},{"type":"text","title":"Cómo ejecutarlo","text":"Ajusta el enfoque según lo que observaste en el grupo durante la sesión: no hay una fórmula única. — Es un buen momento para nombrar avances puntuales de estudiantes concretos."}]'::jsonb
    );

    RAISE NOTICE 'Listo: 7 bloques del guion insertados para % (theme=lab, id: %)', 'Laboratorio de Ciencias Naturales', v_course_id;
  END IF;
END $$;

DO $$
DECLARE
  v_course_id uuid;
BEGIN
  -- parent_course_id IS NULL: el curso BASE, nunca un fork de colegio (los
  -- forks tienen su propia copia de course_modules y no se tocan aquí).
  SELECT id INTO v_course_id FROM public.courses
  WHERE theme = 'detective' AND is_active = true AND parent_course_id IS NULL
  ORDER BY created_at ASC LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE NOTICE 'Sin curso activo con theme=detective (Detectives) — se omite.';
  ELSE
    DELETE FROM public.course_modules WHERE course_id = v_course_id;

    -- Bloque 1/7 — Apertura del expediente (00:00–00:10, 10 min, Activación)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Apertura del expediente', 'Bloque 1 — Activación',
      '00:00–00:10 · 10 min · Activación',
      'lesson', 1, 30, true, null, 'Abran el expediente: hoy cada palabra es una pista.',
      '[{"type":"intro","title":"Apertura del expediente","text":"00:00–00:10 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Abran el expediente: hoy cada palabra es una pista.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Actividad rompehielo — cognitiva o física, a elección del tutor."},{"type":"text","title":"Cómo ejecutarlo","text":"Elige la dinámica según la energía con la que llega el grupo: cognitiva si necesitan enfocarse, física si llegan dispersos. — Debe ser corta y de instrucciones simples: el grupo apenas está entrando."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de actividades rompehielo. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 2/7 — El manual del detective (00:10–00:25, 15 min, Encuadre)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'El manual del detective', 'Bloque 2 — Encuadre',
      '00:10–00:25 · 15 min · Encuadre',
      'lesson', 2, 30, true, null, 'Antes de investigar, aprendamos cómo se arma un caso.',
      '[{"type":"intro","title":"El manual del detective","text":"00:10–00:25 · 15 min"},{"type":"callout","title":"Frase de apertura","text":"“Antes de investigar, aprendamos cómo se arma un caso.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Explicación de la estructura de la Prueba Saber — contenido estandarizado por asignatura."},{"type":"text","title":"Cómo ejecutarlo","text":"Se apoya en el material único del área, distribuido aparte. — Objetivo del bloque: que el grupo reconozca secciones, tipos de pregunta y forma de puntuar antes de practicar."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Documento estandarizado por asignatura. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 3/7 — Casos anteriores (00:25–00:35, 10 min, Diagnóstico)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Casos anteriores', 'Bloque 3 — Diagnóstico',
      '00:25–00:35 · 10 min · Diagnóstico',
      'lesson', 3, 30, true, null, 'Revisemos los casos que ya investigamos antes de este.',
      '[{"type":"intro","title":"Casos anteriores","text":"00:25–00:35 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Revisemos los casos que ya investigamos antes de este.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Lectura y análisis de resultados previos — institucionales, de simulacro o de la Prueba Saber del año anterior."},{"type":"text","title":"Cómo ejecutarlo","text":"Lleva datos reales del grupo o la institución: movilizan más que un ejemplo genérico. — Cierra el bloque con una pregunta abierta al grupo sobre lo que esos resultados dicen de ellos."}]'::jsonb
    );

    -- Bloque 4/7 — Primera ronda de pistas (00:35–01:10, 35 min, Práctica)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Primera ronda de pistas', 'Bloque 4 — Práctica',
      '00:35–01:10 · 35 min · Práctica',
      'lesson', 4, 30, true, null, 'Primera ronda de pistas. Lean con cuidado antes de acusar.',
      '[{"type":"intro","title":"Primera ronda de pistas","text":"00:35–01:10 · 35 min"},{"type":"callout","title":"Frase de apertura","text":"“Primera ronda de pistas. Lean con cuidado antes de acusar.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Preguntas de nivel medio-alto con retroalimentación inmediata — sugerido 10 a 12 preguntas del banco."},{"type":"text","title":"Cómo ejecutarlo","text":"Retroalimenta cada pregunta o cada bloque corto: no acumules toda la retro para el final. — Ritmo sugerido: cerca de 3 minutos por pregunta, entre responder y retroalimentar."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de preguntas. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 5/7 — Estirar las piernas (01:10–01:20, 10 min, Activación)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Estirar las piernas', 'Bloque 5 — Activación',
      '01:10–01:20 · 10 min · Activación',
      'lesson', 5, 30, true, null, 'Un detective también estira las piernas antes del interrogatorio.',
      '[{"type":"intro","title":"Estirar las piernas","text":"01:10–01:20 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Un detective también estira las piernas antes del interrogatorio.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Actividad de reactivación — del banco, trae únicamente las que impliquen movimiento."},{"type":"text","title":"Cómo ejecutarlo","text":"A esta altura la atención decae: prioriza movimiento real, no otro ejercicio de escritorio. — Sirve de puente antes del bloque más largo y exigente de la sesión."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de actividades (solo físicas). Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 6/7 — El gran interrogatorio (01:20–02:00, 40 min, Práctica)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'El gran interrogatorio', 'Bloque 6 — Práctica',
      '01:20–02:00 · 40 min · Práctica',
      'lesson', 6, 30, true, null, 'El gran interrogatorio. Aquí se resuelve el caso.',
      '[{"type":"intro","title":"El gran interrogatorio","text":"01:20–02:00 · 40 min"},{"type":"callout","title":"Frase de apertura","text":"“El gran interrogatorio. Aquí se resuelve el caso.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Preguntas de nivel alto con retroalimentación — sugerido 8 a 12 preguntas del banco."},{"type":"text","title":"Cómo ejecutarlo","text":"Es el bloque más largo de toda la sesión: resérvalo para cuando el grupo ya calentó motores en el bloque anterior. — Misma retroalimentación inmediata que en la ronda anterior."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de preguntas. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 7/7 — Cierre del caso (02:00–02:10, 10 min, Cierre)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Cierre del caso', 'Bloque 7 — Cierre',
      '02:00–02:10 · 10 min · Cierre',
      'lesson', 7, 30, true, null, 'Cerramos el expediente de hoy.',
      '[{"type":"intro","title":"Cierre del caso","text":"02:00–02:10 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Cerramos el expediente de hoy.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Cierre reflexivo — sin guion fijo, lo gestiona cada tutor."},{"type":"text","title":"Cómo ejecutarlo","text":"Ajusta el enfoque según lo que observaste en el grupo durante la sesión: no hay una fórmula única. — Es un buen momento para nombrar avances puntuales de estudiantes concretos."}]'::jsonb
    );

    RAISE NOTICE 'Listo: 7 bloques del guion insertados para % (theme=detective, id: %)', 'Detectives', v_course_id;
  END IF;
END $$;

DO $$
DECLARE
  v_course_id uuid;
BEGIN
  -- parent_course_id IS NULL: el curso BASE, nunca un fork de colegio (los
  -- forks tienen su propia copia de course_modules y no se tocan aquí).
  SELECT id INTO v_course_id FROM public.courses
  WHERE theme = 'escape-room' AND is_active = true AND parent_course_id IS NULL
  ORDER BY created_at ASC LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE NOTICE 'Sin curso activo con theme=escape-room (Sala de Escape) — se omite.';
  ELSE
    DELETE FROM public.course_modules WHERE course_id = v_course_id;

    -- Bloque 1/7 — Encender la sala (00:00–00:10, 10 min, Activación)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Encender la sala', 'Bloque 1 — Activación',
      '00:00–00:10 · 10 min · Activación',
      'lesson', 1, 30, true, null, 'Encendamos la sala: el reloj ya empezó a correr.',
      '[{"type":"intro","title":"Encender la sala","text":"00:00–00:10 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Encendamos la sala: el reloj ya empezó a correr.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Actividad rompehielo — cognitiva o física, a elección del tutor."},{"type":"text","title":"Cómo ejecutarlo","text":"Elige la dinámica según la energía con la que llega el grupo: cognitiva si necesitan enfocarse, física si llegan dispersos. — Debe ser corta y de instrucciones simples: el grupo apenas está entrando."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de actividades rompehielo. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 2/7 — Las reglas del escape (00:10–00:25, 15 min, Encuadre)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Las reglas del escape', 'Bloque 2 — Encuadre',
      '00:10–00:25 · 15 min · Encuadre',
      'lesson', 2, 30, true, null, 'Antes de los candados, las reglas del escape.',
      '[{"type":"intro","title":"Las reglas del escape","text":"00:10–00:25 · 15 min"},{"type":"callout","title":"Frase de apertura","text":"“Antes de los candados, las reglas del escape.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Explicación de la estructura de la Prueba Saber — contenido estandarizado por asignatura."},{"type":"text","title":"Cómo ejecutarlo","text":"Se apoya en el material único del área, distribuido aparte. — Objetivo del bloque: que el grupo reconozca secciones, tipos de pregunta y forma de puntuar antes de practicar."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Documento estandarizado por asignatura. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 3/7 — Bitácora de intentos anteriores (00:25–00:35, 10 min, Diagnóstico)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Bitácora de intentos anteriores', 'Bloque 3 — Diagnóstico',
      '00:25–00:35 · 10 min · Diagnóstico',
      'lesson', 3, 30, true, null, 'Revisemos la bitácora de intentos anteriores.',
      '[{"type":"intro","title":"Bitácora de intentos anteriores","text":"00:25–00:35 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Revisemos la bitácora de intentos anteriores.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Lectura y análisis de resultados previos — institucionales, de simulacro o de la Prueba Saber del año anterior."},{"type":"text","title":"Cómo ejecutarlo","text":"Lleva datos reales del grupo o la institución: movilizan más que un ejemplo genérico. — Cierra el bloque con una pregunta abierta al grupo sobre lo que esos resultados dicen de ellos."}]'::jsonb
    );

    -- Bloque 4/7 — Primera ronda de candados (00:35–01:10, 35 min, Práctica)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Primera ronda de candados', 'Bloque 4 — Práctica',
      '00:35–01:10 · 35 min · Práctica',
      'lesson', 4, 30, true, null, 'Primera ronda de candados. Calculen, no adivinen.',
      '[{"type":"intro","title":"Primera ronda de candados","text":"00:35–01:10 · 35 min"},{"type":"callout","title":"Frase de apertura","text":"“Primera ronda de candados. Calculen, no adivinen.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Preguntas de nivel medio-alto con retroalimentación inmediata — sugerido 10 a 12 preguntas del banco."},{"type":"text","title":"Cómo ejecutarlo","text":"Retroalimenta cada pregunta o cada bloque corto: no acumules toda la retro para el final. — Ritmo sugerido: cerca de 3 minutos por pregunta, entre responder y retroalimentar."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de preguntas. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 5/7 — Recarga de energía (01:10–01:20, 10 min, Activación)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Recarga de energía', 'Bloque 5 — Activación',
      '01:10–01:20 · 10 min · Activación',
      'lesson', 5, 30, true, null, 'Pausa para recargar energía antes de la sala final.',
      '[{"type":"intro","title":"Recarga de energía","text":"01:10–01:20 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Pausa para recargar energía antes de la sala final.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Actividad de reactivación — del banco, trae únicamente las que impliquen movimiento."},{"type":"text","title":"Cómo ejecutarlo","text":"A esta altura la atención decae: prioriza movimiento real, no otro ejercicio de escritorio. — Sirve de puente antes del bloque más largo y exigente de la sesión."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de actividades (solo físicas). Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 6/7 — Los candados finales (01:20–02:00, 40 min, Práctica)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Los candados finales', 'Bloque 6 — Práctica',
      '01:20–02:00 · 40 min · Práctica',
      'lesson', 6, 30, true, null, 'Los candados finales. La sala más difícil de todas.',
      '[{"type":"intro","title":"Los candados finales","text":"01:20–02:00 · 40 min"},{"type":"callout","title":"Frase de apertura","text":"“Los candados finales. La sala más difícil de todas.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Preguntas de nivel alto con retroalimentación — sugerido 8 a 12 preguntas del banco."},{"type":"text","title":"Cómo ejecutarlo","text":"Es el bloque más largo de toda la sesión: resérvalo para cuando el grupo ya calentó motores en el bloque anterior. — Misma retroalimentación inmediata que en la ronda anterior."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de preguntas. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 7/7 — ¿Logramos escapar? (02:00–02:10, 10 min, Cierre)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, '¿Logramos escapar?', 'Bloque 7 — Cierre',
      '02:00–02:10 · 10 min · Cierre',
      'lesson', 7, 30, true, null, '¿Logramos escapar hoy? Cerremos la sesión.',
      '[{"type":"intro","title":"¿Logramos escapar?","text":"02:00–02:10 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“¿Logramos escapar hoy? Cerremos la sesión.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Cierre reflexivo — sin guion fijo, lo gestiona cada tutor."},{"type":"text","title":"Cómo ejecutarlo","text":"Ajusta el enfoque según lo que observaste en el grupo durante la sesión: no hay una fórmula única. — Es un buen momento para nombrar avances puntuales de estudiantes concretos."}]'::jsonb
    );

    RAISE NOTICE 'Listo: 7 bloques del guion insertados para % (theme=escape-room, id: %)', 'Sala de Escape', v_course_id;
  END IF;
END $$;

DO $$
DECLARE
  v_course_id uuid;
BEGIN
  -- parent_course_id IS NULL: el curso BASE, nunca un fork de colegio (los
  -- forks tienen su propia copia de course_modules y no se tocan aquí).
  SELECT id INTO v_course_id FROM public.courses
  WHERE theme = 'time-travel' AND is_active = true AND parent_course_id IS NULL
  ORDER BY created_at ASC LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE NOTICE 'Sin curso activo con theme=time-travel (Viajeros del Tiempo) — se omite.';
  ELSE
    DELETE FROM public.course_modules WHERE course_id = v_course_id;

    -- Bloque 1/7 — Activar el portal (00:00–00:10, 10 min, Activación)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Activar el portal', 'Bloque 1 — Activación',
      '00:00–00:10 · 10 min · Activación',
      'lesson', 1, 30, true, null, 'Activemos el portal.',
      '[{"type":"intro","title":"Activar el portal","text":"00:00–00:10 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Activemos el portal.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Actividad rompehielo — cognitiva o física, a elección del tutor."},{"type":"text","title":"Cómo ejecutarlo","text":"Elige la dinámica según la energía con la que llega el grupo: cognitiva si necesitan enfocarse, física si llegan dispersos. — Debe ser corta y de instrucciones simples: el grupo apenas está entrando."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de actividades rompehielo. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 2/7 — Las reglas del viaje (00:10–00:25, 15 min, Encuadre)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Las reglas del viaje', 'Bloque 2 — Encuadre',
      '00:10–00:25 · 15 min · Encuadre',
      'lesson', 2, 30, true, null, 'Antes de viajar, las reglas del viaje en el tiempo.',
      '[{"type":"intro","title":"Las reglas del viaje","text":"00:10–00:25 · 15 min"},{"type":"callout","title":"Frase de apertura","text":"“Antes de viajar, las reglas del viaje en el tiempo.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Explicación de la estructura de la Prueba Saber — contenido estandarizado por asignatura."},{"type":"text","title":"Cómo ejecutarlo","text":"Se apoya en el material único del área, distribuido aparte. — Objetivo del bloque: que el grupo reconozca secciones, tipos de pregunta y forma de puntuar antes de practicar."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Documento estandarizado por asignatura. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 3/7 — La línea de tiempo hasta hoy (00:25–00:35, 10 min, Diagnóstico)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'La línea de tiempo hasta hoy', 'Bloque 3 — Diagnóstico',
      '00:25–00:35 · 10 min · Diagnóstico',
      'lesson', 3, 30, true, null, 'Revisemos la línea de tiempo hasta hoy.',
      '[{"type":"intro","title":"La línea de tiempo hasta hoy","text":"00:25–00:35 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Revisemos la línea de tiempo hasta hoy.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Lectura y análisis de resultados previos — institucionales, de simulacro o de la Prueba Saber del año anterior."},{"type":"text","title":"Cómo ejecutarlo","text":"Lleva datos reales del grupo o la institución: movilizan más que un ejemplo genérico. — Cierra el bloque con una pregunta abierta al grupo sobre lo que esos resultados dicen de ellos."}]'::jsonb
    );

    -- Bloque 4/7 — Primera época: preguntas (00:35–01:10, 35 min, Práctica)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Primera época: preguntas', 'Bloque 4 — Práctica',
      '00:35–01:10 · 35 min · Práctica',
      'lesson', 4, 30, true, null, 'Primera época: preguntas de nivel medio-alto.',
      '[{"type":"intro","title":"Primera época: preguntas","text":"00:35–01:10 · 35 min"},{"type":"callout","title":"Frase de apertura","text":"“Primera época: preguntas de nivel medio-alto.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Preguntas de nivel medio-alto con retroalimentación inmediata — sugerido 10 a 12 preguntas del banco."},{"type":"text","title":"Cómo ejecutarlo","text":"Retroalimenta cada pregunta o cada bloque corto: no acumules toda la retro para el final. — Ritmo sugerido: cerca de 3 minutos por pregunta, entre responder y retroalimentar."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de preguntas. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 5/7 — Recarga temporal (01:10–01:20, 10 min, Activación)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Recarga temporal', 'Bloque 5 — Activación',
      '01:10–01:20 · 10 min · Activación',
      'lesson', 5, 30, true, null, 'Recarguemos energía temporal antes de la época final.',
      '[{"type":"intro","title":"Recarga temporal","text":"01:10–01:20 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Recarguemos energía temporal antes de la época final.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Actividad de reactivación — del banco, trae únicamente las que impliquen movimiento."},{"type":"text","title":"Cómo ejecutarlo","text":"A esta altura la atención decae: prioriza movimiento real, no otro ejercicio de escritorio. — Sirve de puente antes del bloque más largo y exigente de la sesión."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de actividades (solo físicas). Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 6/7 — La época decisiva (01:20–02:00, 40 min, Práctica)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'La época decisiva', 'Bloque 6 — Práctica',
      '01:20–02:00 · 40 min · Práctica',
      'lesson', 6, 30, true, null, 'La época decisiva. Aquí se juega todo.',
      '[{"type":"intro","title":"La época decisiva","text":"01:20–02:00 · 40 min"},{"type":"callout","title":"Frase de apertura","text":"“La época decisiva. Aquí se juega todo.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Preguntas de nivel alto con retroalimentación — sugerido 8 a 12 preguntas del banco."},{"type":"text","title":"Cómo ejecutarlo","text":"Es el bloque más largo de toda la sesión: resérvalo para cuando el grupo ya calentó motores en el bloque anterior. — Misma retroalimentación inmediata que en la ronda anterior."},{"type":"callout","title":"Pendiente","icon":"🚧","text":"Depende de: Banco de preguntas. Cárgalo aquí apenas esté listo el banco."}]'::jsonb
    );

    -- Bloque 7/7 — Bitácora del viajero (02:00–02:10, 10 min, Cierre)
    INSERT INTO public.course_modules
      (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
    VALUES (
      v_course_id, 'Bitácora del viajero', 'Bloque 7 — Cierre',
      '02:00–02:10 · 10 min · Cierre',
      'lesson', 7, 30, true, null, 'Cerremos la bitácora del viajero.',
      '[{"type":"intro","title":"Bitácora del viajero","text":"02:00–02:10 · 10 min"},{"type":"callout","title":"Frase de apertura","text":"“Cerremos la bitácora del viajero.”","icon":"🗣️"},{"type":"text","title":"Qué es este bloque","text":"Cierre reflexivo — sin guion fijo, lo gestiona cada tutor."},{"type":"text","title":"Cómo ejecutarlo","text":"Ajusta el enfoque según lo que observaste en el grupo durante la sesión: no hay una fórmula única. — Es un buen momento para nombrar avances puntuales de estudiantes concretos."}]'::jsonb
    );

    RAISE NOTICE 'Listo: 7 bloques del guion insertados para % (theme=time-travel, id: %)', 'Viajeros del Tiempo', v_course_id;
  END IF;
END $$;

