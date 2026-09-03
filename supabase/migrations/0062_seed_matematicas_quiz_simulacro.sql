-- ============================================================
-- 0062_seed_matematicas_quiz_simulacro.sql
-- Agrega 2 preguntas de simulacro tipo Saber al curso "Sala de Escape -
-- Matematicas" (theme = escape-room), UNA por modulo, INTERCALADAS entre
-- los modulos existentes (no las dos juntas al final) — para usarlas en
-- Modo Aula en Vivo: el profesor recorre la ruta completa y cuando llega a
-- una de estas preguntas se activa la evaluacion cronometrada + explicacion.
--
-- EJECUTAR en Supabase SQL Editor (Dashboard > SQL Editor).
--
-- Origen: "preguntas semana capacitacion Simulacro.docx". Ese documento
-- trae 8 preguntas en total, pero solo 2 son de matematicas (numeros
-- racionales y minimo comun multiplo); las otras 6 son de lectura
-- critica/sociales/ciencias y no se siembran aqui.
--
-- Ubicacion de las preguntas (por titulo del modulo pivote, NO por numero
-- de "order" fijo — si el tutor ya reordeno la ruta desde el editor, esto
-- se adapta al orden REAL en vez de asumir el del seed original 0014):
--   - Pregunta 1 (racionales) va justo DESPUES de "La Puerta del Numero"
--     (modulo 1, introductorio).
--   - Pregunta 2 (mcm) va justo DESPUES de "La Sala de los Datos"
--     (modulo de la mitad de la ruta).
--
-- Es idempotente: si "Pregunta en Vivo 1 — Numeros Racionales" ya existe
-- en el curso, no hace nada (no duplica ni vuelve a correr los corrimientos
-- de "order", que solo deben aplicarse UNA vez).
-- ============================================================

DO $$
DECLARE
  v_course_id    uuid;
  v_order_intro  int;
  v_order_mid    int;
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
     WHERE course_id = v_course_id AND title = 'Pregunta en Vivo 1 — Numeros Racionales'
  ) THEN
    RAISE NOTICE 'Las preguntas ya existen, no se duplican ni se vuelve a correr el corrimiento de orden.';
    RETURN;
  END IF;

  SELECT "order" INTO v_order_intro FROM public.course_modules
   WHERE course_id = v_course_id AND title = 'La Puerta del Numero';
  SELECT "order" INTO v_order_mid FROM public.course_modules
   WHERE course_id = v_course_id AND title = 'La Sala de los Datos';

  IF v_order_intro IS NULL OR v_order_mid IS NULL THEN
    RAISE EXCEPTION 'No se encontraron los modulos pivote ("La Puerta del Numero" / "La Sala de los Datos"). Si la ruta fue renombrada desde el editor, ajusta los titulos de este script.';
  END IF;

  -- Se inserta primero la pregunta MAS ADELANTE en la ruta (usando su orden
  -- ORIGINAL, capturado arriba antes de tocar nada) para que el corrimiento
  -- de la pregunta anterior, más abajo, la vuelva a correr en cascada y las
  -- dos terminen en la posición correcta. Ver comentario largo en el chat /
  -- commit: invertir este orden desordena la ruta.

  -- ── Pregunta 2 (mcm) justo después de "La Sala de los Datos" ────────────
  UPDATE public.course_modules SET "order" = "order" + 1
   WHERE course_id = v_course_id AND "order" > v_order_mid;

  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Pregunta en Vivo 2 — Encuentro de Rutas',
    'Simulacro — Aula en Vivo',
    'Pregunta de simulacro tipo Saber (mínimo común múltiplo) para resolver en clase en vivo, con explicación.',
    'challenge', 'quiz', v_order_mid + 1, 80, true, null,
    'Otra puerta se activa: calcula bien el tiempo antes de que se cierre.',
    $jq2${
      "questions": [
        {
          "question": "Tres amigos (M, N y P) trabajan en diferentes rutas aéreas. La ruta donde trabaja M tarda 4 horas en ir y volver, la ruta donde trabaja N tarda 6 horas, y la ruta donde trabaja P tarda 3 horas en el mismo recorrido. Si los tres amigos se encontraron hace 4 horas, se volverán a encontrar en el mismo terminal dentro de",
          "options": ["12 horas.", "10 horas.", "8 horas.", "6 horas."],
          "correct": 2,
          "explanation": "**¿Por qué el mínimo común múltiplo (mcm)?**\nCada amigo repite su propio ciclo: M vuelve a estar en el terminal cada 4 h, N cada 6 h, P cada 3 h. Para que los TRES coincidan otra vez en el mismo lugar, tiene que pasar una cantidad de tiempo que sea múltiplo de los tres ciclos a la vez — eso es exactamente lo que significa el mcm. No sirve la suma, ni el promedio, ni el mayor de los tres: el mcm es el menor número que los 4, 6 y 3 \"reparten exacto\".\n\n**Calculando mcm(4,6,3) por factores primos**\n4 = 2², 6 = 2×3, 3 = 3. El mcm se arma tomando cada factor primo elevado a su mayor potencia entre los tres: 2² × 3 = 12. Por eso los tres vuelven a coincidir cada 12 horas — es el mismo principio detrás de por qué dos engranajes con distinto número de dientes, o dos planetas con distinto período orbital, vuelven a alinearse cada cierto ciclo fijo.\n\n**El detalle que hace la pregunta tramposa**\nEl mcm te dice cada CUÁNTO se repite el encuentro (12 h), pero la pregunta no pregunta eso: pregunta cuánto falta DESDE AHORA, y ya pasaron 4 de esas 12 horas desde el último encuentro. Por eso la respuesta no es 12, sino 12 − 4 = **8 horas**.\n\n**Por qué fallan las otras opciones**\n• 12 horas — es el error más común: responder el mcm directo, olvidando restar las 4 horas que ya transcurrieron desde el último encuentro.\n• 10 y 6 horas — no corresponden a ninguna combinación real de 4, 6 y 3 (ni mcm, ni MCD, ni resta de ciclos); son distractores de cálculo apresurado, típicos de sumar o promediar los tiempos en vez de encontrar el múltiplo común.\n\n**Para llevarte**: cualquier problema de \"varios ciclos que vuelven a coincidir\" (buses, semáforos, turnos, órbitas) se resuelve con el mcm de los períodos — y siempre hay que revisar desde qué momento te están preguntando el tiempo restante.",
          "timeLimit": 50,
          "points": 1200,
          "difficulty": "dificil"
        }
      ]
    }$jq2$::jsonb
  );

  -- ── Pregunta 1 (racionales) justo después de "La Puerta del Número" ─────
  -- Este corrimiento usa el "order" ORIGINAL de la intro (capturado antes de
  -- tocar nada) y, como es mayor que v_order_mid, también vuelve a correr la
  -- Pregunta 2 recién insertada — es el efecto en cascada esperado.
  UPDATE public.course_modules SET "order" = "order" + 1
   WHERE course_id = v_course_id AND "order" > v_order_intro;

  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Pregunta en Vivo 1 — Numeros Racionales',
    'Simulacro — Aula en Vivo',
    'Pregunta de simulacro tipo Saber (números racionales) para resolver en clase en vivo, con explicación.',
    'challenge', 'quiz', v_order_intro + 1, 80, true, null,
    'Una puerta rápida: resuélvela antes de seguir explorando la sala.',
    $jq1${
      "questions": [
        {
          "question": "Todos los números racionales se pueden expresar en la forma p/q con q≠0, o en forma decimal al realizar dicho cociente. Al expresar el número racional 2,8 con el 5 periódico (2,8555...) como el cociente entre dos números enteros, se obtiene",
          "options": ["257/99", "57/20", "257/90", "58/20"],
          "correct": 2,
          "explanation": "**Del decimal periódico a la fracción**\nTodo número racional se puede escribir como p/q. Cuando su expansión decimal se repite para siempre, existe un método algebraico para hallar esa fracción sin adivinar: se multiplica por potencias de 10 hasta que la parte que se repite quede alineada en dos versiones del número, y al restarlas la cola infinita se cancela.\n\n**Paso a paso con 2,8555...**\nSea x = 2,8555...\n• ×10 para dejar el punto justo antes de que empiece lo que se repite: 10x = 28,555...\n• ×100 para correr un ciclo completo más: 100x = 285,555...\n• Restamos: 100x − 10x = 285,555... − 28,555... = 257 (la cola de 5 infinitos se cancela exacto), es decir 90x = 257.\n• Despejamos: x = 257/90.\n\n**Por qué el denominador es 90 y no otra cosa**\n2,8555... es un decimal periódico MIXTO: el 8 es fijo (no se repite) y solo el 5 es periódico. La regla general es: tantos 9 en el denominador como cifras se repiten, y tantos 0 como cifras fijas haya después de la coma antes de que empiece el período. Aquí hay 1 cifra periódica (el 5) y 1 cifra fija (el 8) → un 9 y un 0 → 90. Si en cambio TODO lo que sigue a la coma se repitiera (periódico PURO, como 2,555...), el denominador llevaría solo 9 (sin ceros). Confundir estos dos casos es el error de fondo detrás de casi todas las opciones equivocadas de este tipo de preguntas.\n\n**Por qué fallan las otras opciones**\n• 57/20 = 2,85 exacto — es lo que sale si se ignora la barra de periodicidad y se convierte 2,85 como si fuera un decimal que simplemente termina ahí, sin ninguna cifra repitiéndose.\n• 257/99 — aparece cuando se arma el denominador con dos nueves (como si tanto el 8 como el 5 fueran periódicos) en vez de reconocer que el 8 es una cifra fija; por eso conserva el mismo numerador 257 pero con el denominador de un periódico puro de dos cifras, que no es el caso.\n• 58/20 = 2,9 — ni siquiera coincide con el número original: es un desliz aritmético al simplificar, no un error conceptual.\n\n**Para llevarte**: antes de aplicar la fórmula, separa con cuidado cuántas cifras decimales son fijas y cuántas son periódicas — de eso depende exactamente cuántos 9 y cuántos 0 lleva el denominador.",
          "timeLimit": 40,
          "points": 1000,
          "difficulty": "media"
        }
      ]
    }$jq1$::jsonb
  );

  RAISE NOTICE 'Preguntas en vivo insertadas e intercaladas en el curso escape-room.';

END $$;
