-- ============================================================
-- 0062_seed_matematicas_quiz_simulacro.sql
-- Agrega un reto tipo quiz al curso "Sala de Escape - Matematicas"
-- (theme = escape-room) con preguntas de simulacro para usarlas en
-- Modo Aula en Vivo (evaluacion cronometrada + ranking + explicacion).
--
-- EJECUTAR en Supabase SQL Editor (Dashboard > SQL Editor).
--
-- Origen: "preguntas semana capacitacion Simulacro.docx" (solo las
-- preguntas de matematicas; el resto del documento es de otras areas
-- y se sembrara aparte en sus propios cursos).
--
-- Se agrega AL FINAL de la ruta actual (order = max+1) para no alterar
-- el orden de los modulos existentes. Es idempotente respecto al titulo:
-- si ya existe un modulo con ese titulo en el curso, no lo duplica.
-- ============================================================

DO $$
DECLARE
  v_course_id uuid;
  v_next_order int;
BEGIN

  SELECT id INTO v_course_id
  FROM public.courses
  WHERE theme = 'escape-room'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro el curso escape-room (Matematicas)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.course_modules
     WHERE course_id = v_course_id AND title = 'Simulacro en Vivo — Matematicas'
  ) THEN
    RAISE NOTICE 'El modulo ya existe, no se duplica.';
    RETURN;
  END IF;

  SELECT COALESCE(MAX("order"), 0) + 1 INTO v_next_order
  FROM public.course_modules
  WHERE course_id = v_course_id;

  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Simulacro en Vivo — Matematicas',
    'Evaluacion cronometrada',
    'Preguntas de simulacro tipo Saber para resolver en clase en vivo, con ranking y explicacion.',
    'challenge', 'quiz', v_next_order, 100, true, null,
    'Reactiva tu razonamiento: cada pregunta es una puerta mas antes del ranking final.',
    $jq${
      "questions": [
        {
          "question": "Todos los números racionales se pueden expresar en la forma p/q con q≠0, o en forma decimal al realizar dicho cociente. Al expresar el número racional 2,8 con el 5 periódico (2,8555...) como el cociente entre dos números enteros, se obtiene",
          "options": ["257/99", "57/20", "257/90", "58/20"],
          "correct": 2,
          "explanation": "Sea x = 2,8555... Multiplicando por 10: 10x = 28,555... Multiplicando por 100: 100x = 285,555... Restando, 100x - 10x = 285,555... - 28,555... = 257, es decir 90x = 257, por lo tanto x = 257/90.",
          "timeLimit": 40,
          "points": 1000,
          "difficulty": "media"
        },
        {
          "question": "Tres amigos (M, N y P) trabajan en diferentes rutas aéreas. La ruta donde trabaja M tarda 4 horas en ir y volver, la ruta donde trabaja N tarda 6 horas, y la ruta donde trabaja P tarda 3 horas en el mismo recorrido. Si los tres amigos se encontraron hace 4 horas, se volverán a encontrar en el mismo terminal dentro de",
          "options": ["12 horas.", "10 horas.", "8 horas.", "6 horas."],
          "correct": 2,
          "explanation": "Cada amigo vuelve a estar en el terminal cada 4, 6 y 3 horas respectivamente, así que los tres coinciden de nuevo cada mínimo común múltiplo de esos tiempos: mcm(4,6,3) = 12 horas. Si el último encuentro fue hace 4 horas, el próximo será 12 horas después de aquel, es decir dentro de 12 - 4 = 8 horas contadas desde ahora.",
          "timeLimit": 50,
          "points": 1200,
          "difficulty": "dificil"
        }
      ]
    }$jq$::jsonb
  );

  RAISE NOTICE 'Modulo de simulacro en vivo insertado en el curso escape-room, order %', v_next_order;

END $$;
