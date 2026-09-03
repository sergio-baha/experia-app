-- ============================================================
-- 0065_replicar_lenguaje.sql
-- Replica en "Detectives — mi versión" (Lenguaje) lo mismo hecho en
-- Matemáticas (0062 + 0064): 2 preguntas en vivo intercaladas + contenido
-- real en los 5 "Pendiente". Estructura confirmada idéntica a Matemáticas
-- (mismos 7 bloques/horarios, solo cambia el ropaje temático detective).
--
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

DO $$
DECLARE
  v_course_id    uuid := 'd4aa2014-aa49-46d1-8ac3-7e5842fc8dc1'; -- Detectives — mi versión
  v_order_intro  int;
  v_order_mid    int;
BEGIN

  IF EXISTS (
    SELECT 1 FROM public.course_modules
     WHERE course_id = v_course_id AND title = 'Pregunta en Vivo 1 — Sentido de una metáfora'
  ) THEN
    RAISE NOTICE 'Ya se aplicó antes, no se duplica.';
    RETURN;
  END IF;

  SELECT "order" INTO v_order_intro FROM public.course_modules
   WHERE course_id = v_course_id AND title = 'Apertura del expediente';
  SELECT "order" INTO v_order_mid FROM public.course_modules
   WHERE course_id = v_course_id AND title = 'Primera ronda de pistas';

  IF v_order_intro IS NULL OR v_order_mid IS NULL THEN
    RAISE EXCEPTION 'No se encontraron los módulos pivote en el curso %', v_course_id;
  END IF;

  -- Pregunta 2 primero (usa el orden original, más adelante en la ruta)
  UPDATE public.course_modules SET "order" = "order" + 1
   WHERE course_id = v_course_id AND "order" > v_order_mid;

  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Pregunta en Vivo 2 — La actitud del detective',
    'Simulacro — Aula en Vivo',
    'Pregunta de simulacro tipo Saber (Lectura Crítica) para resolver en clase en vivo, con explicación.',
    'challenge', 'quiz', v_order_mid + 1, 80, true, null,
    'Otra pista se activa: lean con cuidado antes de responder.',
    $jq2${
      "questions": [
        {
          "question": "“—Aquí no hay ningún misterio —dijo el detective—. Solo hay una explicación que todavía no hemos encontrado.” ¿Qué actitud transmite la afirmación del detective sobre los “misterios”?",
          "options": ["Cree que los misterios son sucesos sin causa posible.", "Piensa que todo suceso tiene una causa, aunque todavía no se conozca.", "Considera que investigar es una pérdida de tiempo.", "Afirma que ya resolvió todos los casos posibles."],
          "correct": 1,
          "explanation": "**Leer lo que el hablante da por hecho**\nEl detective no dice 'esto es un misterio sin solución': dice que la explicación existe, solo que aún no se ha encontrado. Esa es una postura racional muy común en el pensamiento científico y detectivesco: descartar lo 'inexplicable' como categoría y asumir que todo tiene una causa, así tome tiempo hallarla.\n\n**Por qué fallan las otras opciones**\n• A dice justo lo contrario de lo que afirma el detective. • C y D no tienen ningún respaldo en la frase — el detective no habla de perder el tiempo ni de haber terminado su trabajo, son ideas añadidas que el texto no sostiene.\n\n**Para llevarte**: en preguntas de actitud/postura, la respuesta correcta es la que el texto sostiene explícita o implícitamente — nunca la que simplemente 'suena razonable' si el texto no la respalda.",
          "timeLimit": 50,
          "points": 1200,
          "difficulty": "dificil"
        }
      ]
    }$jq2$::jsonb
  );

  -- Pregunta 1 (usa el orden original de la intro; cascada correcta)
  UPDATE public.course_modules SET "order" = "order" + 1
   WHERE course_id = v_course_id AND "order" > v_order_intro;

  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Pregunta en Vivo 1 — Sentido de una metáfora',
    'Simulacro — Aula en Vivo',
    'Pregunta de simulacro tipo Saber (Lectura Crítica) para resolver en clase en vivo, con explicación.',
    'challenge', 'quiz', v_order_intro + 1, 80, true, null,
    'Una pista rápida: interpreten antes de acusar.',
    $jq1${
      "questions": [
        {
          "question": "“Los detectives de la ciencia no persiguen sospechosos: persiguen preguntas. Cada vez que una explicación deja un cabo suelto, ahí empieza una nueva investigación.” En el texto, la expresión “cabo suelto” se refiere a",
          "options": ["un error de redacción en el texto.", "un aspecto de una explicación que aún no queda resuelto.", "un sospechoso que escapó de la investigación.", "una pregunta que ya fue respondida por completo."],
          "correct": 1,
          "explanation": "**El sentido figurado en contexto**\n'Cabo suelto' es una expresión que viene de atar cuerdas: si queda un cabo (extremo) sin atar, el nudo no está completo. Aplicada a una explicación, significa que algo quedó sin resolver o sin encajar del todo — justo lo que dice la siguiente frase del texto: 'ahí empieza una nueva investigación'.\n\n**Por qué fallan las otras opciones**\n• A confunde una expresión del contenido con un error de forma del texto mismo. • C toma 'sospechoso' de otra parte de la oración (los detectives 'no persiguen sospechosos') y lo mezcla donde no corresponde. • D dice lo contrario: un cabo suelto es justo lo que NO quedó respondido.\n\n**Para llevarte**: ante una expresión figurada, hay que apoyarse en la oración que sigue o precede — el texto casi siempre da la pista para descifrarla, en vez de tener que adivinarla de memoria.",
          "timeLimit": 40,
          "points": 1000,
          "difficulty": "media"
        }
      ]
    }$jq1$::jsonb
  );

  RAISE NOTICE 'Preguntas en vivo de Lenguaje insertadas e intercaladas.';

END $$;

-- ── Módulo 1: Apertura del expediente — banco de actividades rompehielo ────
UPDATE public.course_modules
   SET content = $m1$[
  {"text":"00:00–00:10 · 10 min","type":"intro","title":"Apertura del expediente"},
  {"icon":"🗣️","text":"“Abran el expediente: hoy cada palabra es una pista.”","type":"callout","title":"Frase de apertura"},
  {"text":"Actividad rompehielo — cognitiva o física, a elección del tutor.","type":"text","title":"Qué es este bloque"},
  {"text":"Elige la dinámica según la energía con la que llega el grupo: cognitiva si necesitan enfocarse, física si llegan dispersos. — Debe ser corta y de instrucciones simples: el grupo apenas está entrando.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de actividades rompehielo","label":"Ver banco de actividades 🎲","openLabel":"Cerrar banco","icon":"🎲","items":[
    {"t":"Uno, dos, tres… conmigo (física, 2 min)","d":"En parejas, uno hace un gesto simple (aplaudir, chasquear, saltar) y el otro lo repite lo más rápido posible; cada 3 rondas cambian de pareja. Sirve para activar el cuerpo sin necesitar espacio ni materiales."},
    {"t":"La palabra encadenada (cognitiva, 3 min)","d":"En círculo, cada persona dice una palabra relacionada con lectura o lenguaje que empiece con la última letra de la palabra anterior (ej. 'texto' → 'oración' → 'narrador'). Quien se demore más de 5 segundos o repita una palabra sigue en el juego, pero propone la siguiente categoría."},
    {"t":"Sondeo rápido de manos (cognitiva/social, 2 min)","d":"El tutor lanza preguntas rápidas de sí o no relacionadas con la sesión ('¿quién ya presentó la Prueba Saber?', '¿a quién le gusta más leer novelas que poesía?') y el grupo responde levantando la mano. Sin materiales, ideal para grupos grandes."},
    {"t":"Espejo en parejas (física, 3 min)","d":"En parejas, uno hace movimientos lentos con brazos y manos mientras el otro los imita como un espejo; a la mitad del tiempo intercambian el rol de quien dirige. Ayuda a bajar la tensión inicial con humor."},
    {"t":"Bingo de presentación express (cognitiva/social, 5 min)","d":"Se reparte una cuadrícula con frases cortas ('le gusta la poesía', 'ha enseñado más de 10 años', 'prefiere los textos argumentativos'); cada quien debe conseguir la firma de un colega distinto por cada casilla que le aplique. Gana quien complete una línea primero. Requiere imprimir la cuadrícula con anticipación."}
  ]}
]$m1$::jsonb
 WHERE course_id = 'd4aa2014-aa49-46d1-8ac3-7e5842fc8dc1'
   AND title = 'Apertura del expediente'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 2: El manual del detective — estructura de la Prueba Saber ──────
UPDATE public.course_modules
   SET content = $m2$[
  {"text":"00:10–00:25 · 15 min","type":"intro","title":"El manual del detective"},
  {"icon":"🗣️","text":"“Antes de investigar, aprendamos cómo se arma un caso.”","type":"callout","title":"Frase de apertura"},
  {"text":"Explicación de la estructura de la Prueba Saber — contenido estandarizado por asignatura.","type":"text","title":"Qué es este bloque"},
  {"text":"Se apoya en el material único del área, distribuido aparte. — Objetivo del bloque: que el grupo reconozca secciones, tipos de pregunta y forma de puntuar antes de practicar.","type":"text","title":"Cómo ejecutarlo"},
  {"text":"Antes de practicar con las preguntas de las siguientes rondas, conviene que el grupo reconozca cómo está armada la prueba real — así entienden qué se les va a exigir y por qué las preguntas se sienten como se sienten.","type":"text","title":"Antes de empezar"},
  {"type":"steps","title":"Estructura de la Prueba Saber — Lectura Crítica","items":[
    {"icon":"📝","t":"Formato de las preguntas","d":"Selección múltiple con única respuesta, cuatro opciones marcadas A, B, C y D, casi siempre a partir de un texto corto o mediano. No hay penalización por responder incorrectamente, así que siempre conviene marcar una opción aunque haya duda."},
    {"icon":"🧠","t":"Competencias evaluadas","d":"Las preguntas se agrupan en tres competencias: identificar y entender los contenidos literales de un texto, comprender cómo se articulan sus partes para darle sentido global, y reflexionar sobre el texto para tomar postura frente a lo que dice."},
    {"icon":"📚","t":"Tipos de texto","d":"Los textos varían entre narrativos, argumentativos, informativos y continuos o discontinuos (como gráficos, tablas o infografías) — el objetivo es que el lector se enfrente a formatos distintos, no solo a cuentos o ensayos."},
    {"icon":"📊","t":"Cómo se califica","d":"El puntaje NO es un simple porcentaje de aciertos: se calcula con un modelo estadístico (Teoría de Respuesta al Ítem) que pondera la dificultad de cada pregunta, y se reporta en una escala de 0 a 100. Por eso dos personas con el mismo número de aciertos pueden obtener puntajes distintos si acertaron preguntas de diferente dificultad."}
  ]}
]$m2$::jsonb
 WHERE course_id = 'd4aa2014-aa49-46d1-8ac3-7e5842fc8dc1'
   AND title = 'El manual del detective'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 4: Primera ronda de pistas — banco nivel medio-alto (10) ────────
UPDATE public.course_modules
   SET content = $m4$[
  {"text":"00:35–01:10 · 35 min","type":"intro","title":"Primera ronda de pistas"},
  {"icon":"🗣️","text":"“Primera ronda de pistas. Lean con cuidado antes de acusar.”","type":"callout","title":"Frase de apertura"},
  {"text":"Preguntas de nivel medio-alto con retroalimentación inmediata — sugerido 10 a 12 preguntas del banco.","type":"text","title":"Qué es este bloque"},
  {"text":"Retroalimenta cada pregunta o cada bloque corto: no acumules toda la retro para el final. — Ritmo sugerido: cerca de 3 minutos por pregunta, entre responder y retroalimentar.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de preguntas — nivel medio-alto (10)","label":"Ver banco de preguntas 🔍","openLabel":"Cerrar banco","icon":"🔍","items":[
    {"t":"Pregunta 1. \"El profesor explicó la lección con calma, pero los estudiantes, agotados por el calor, apenas podían concentrarse.\" Según el texto, la dificultad de los estudiantes para concentrarse se debe principalmente a: A) la falta de calma del profesor  B) el calor del ambiente  C) la complejidad de la lección  D) el desinterés por la materia","d":"Respuesta correcta: B. El texto lo dice de forma literal: 'agotados por el calor'. Las demás opciones introducen causas que el texto nunca menciona — es un ejercicio de comprensión literal, no de interpretación."},
    {"t":"Pregunta 2. \"Aunque el informe fue extenso, no aportó ninguna conclusión nueva.\" La palabra 'extenso' en el texto se refiere a que el informe: A) era corto y directo  B) tenía mucha información o longitud  C) estaba mal escrito  D) fue publicado recientemente","d":"Respuesta correcta: B. 'Extenso' significa amplio o largo; el 'aunque' de la oración además sugiere un contraste (algo extenso se esperaría que aportara más), reforzando que se refiere a su longitud, no a su calidad."},
    {"t":"Pregunta 3. \"—No voy a mentirte —dijo ella—, pero tampoco te voy a contar todo.\" ¿Qué actitud tiene el hablante hacia la verdad? A) Está dispuesta a decir la verdad completa  B) Está dispuesta a ser honesta, pero de forma parcial  C) Piensa mentir para proteger al oyente  D) Se niega por completo a hablar del tema","d":"Respuesta correcta: B. La frase combina dos negaciones ('no voy a mentirte' y 'tampoco... todo') que juntas describen una honestidad incompleta: no miente, pero tampoco revela todo. A ignora la segunda parte, y C y D contradicen directamente lo que ella misma afirma."},
    {"t":"Pregunta 4. \"El río, antes caudaloso, hoy apenas es un hilo de agua.\" La comparación 'un hilo de agua' se usa para mostrar que el río: A) desapareció por completo  B) tiene ahora muy poco caudal  C) cambió de curso  D) se congeló","d":"Respuesta correcta: B. Un 'hilo' es delgado, así que la imagen exagera lo poco que queda del caudal, sin decir que el río desapareció del todo (todavía hay agua, aunque escasa)."},
    {"t":"Pregunta 5. \"Antes de encender el equipo, verifique que esté conectado correctamente y que el área esté despejada.\" El propósito principal de este texto es: A) narrar una historia  B) dar instrucciones de seguridad antes de un procedimiento  C) opinar sobre el uso de equipos  D) describir las partes de un equipo","d":"Respuesta correcta: B. El uso de verbos en modo imperativo ('verifique') y la secuencia de pasos antes de una acción son marcas típicas de un texto instructivo, no narrativo, argumentativo ni descriptivo."},
    {"t":"Pregunta 6. \"El comité aprobó la propuesta, aunque dos de sus miembros expresaron reservas sobre el presupuesto.\" Según el texto, ¿la propuesta fue aprobada por unanimidad? A) Sí, todos estuvieron de acuerdo sin objeciones  B) No, hubo miembros con dudas sobre un aspecto específico  C) No, la propuesta fue rechazada  D) El texto no permite saberlo","d":"Respuesta correcta: B. El texto es explícito: hubo aprobación, PERO también reservas de algunos miembros — eso descarta la unanimidad sin implicar que la propuesta fuera rechazada."},
    {"t":"Pregunta 7. Se llama 'metáfora' a la figura literaria que nombra algo usando el nombre de otra cosa con la que comparte alguna semejanza, SIN usar 'como' o 'parece'. ¿Cuál de las siguientes expresiones es una metáfora? A) 'Sus ojos son como dos luceros'  B) 'Sus ojos son dos luceros'  C) 'Tiene los ojos verdes'  D) 'Sus ojos parecen cansados'","d":"Respuesta correcta: B. Identifica directamente 'ojos' con 'luceros' sin usar comparativos. A y D usan 'como'/'parecen' (eso las hace símiles, no metáforas), y C es una descripción literal, sin figura retórica."},
    {"t":"Pregunta 8. \"El autor concluye su ensayo afirmando que la tecnología, bien usada, puede acortar las brechas educativas, aunque advierte que por sí sola no resuelve la desigualdad.\" ¿Cuál opción resume mejor la postura del autor? A) La tecnología es la única solución a la desigualdad educativa  B) La tecnología puede ayudar, pero no es suficiente por sí sola  C) La tecnología no tiene ningún efecto sobre la educación  D) La desigualdad educativa ya fue resuelta gracias a la tecnología","d":"Respuesta correcta: B. El texto combina una afirmación positiva ('puede acortar brechas') con una advertencia ('no resuelve la desigualdad por sí sola') — la síntesis correcta debe recoger AMBAS partes, no solo una."},
    {"t":"Pregunta 9. \"Como no llovió en todo el mes, el nivel del embalse bajó considerablemente.\" La relación entre las dos ideas del texto es de: A) causa y efecto  B) comparación  C) contraste  D) ejemplificación","d":"Respuesta correcta: A. El conector 'como' (en este uso, equivalente a 'porque') introduce la causa (no llovió) que explica el efecto (bajó el nivel del embalse)."},
    {"t":"Pregunta 10. \"El informe, publicado apenas ayer, ya generó reacciones encontradas entre los expertos.\" La expresión 'reacciones encontradas' indica que los expertos: A) están completamente de acuerdo entre sí  B) tienen opiniones divididas o contrarias  C) no han leído el informe todavía  D) rechazan por completo el informe","d":"Respuesta correcta: B. 'Encontradas' aquí significa 'opuestas entre sí' (como cuando dos personas 'se encuentran' de frente) — indica división de opiniones, ni acuerdo total ni rechazo unánime."}
  ]}
]$m4$::jsonb
 WHERE course_id = 'd4aa2014-aa49-46d1-8ac3-7e5842fc8dc1'
   AND title = 'Primera ronda de pistas'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 5: Estirar las piernas — banco de actividades SOLO físicas ──────
UPDATE public.course_modules
   SET content = $m5$[
  {"text":"01:10–01:20 · 10 min","type":"intro","title":"Estirar las piernas"},
  {"icon":"🗣️","text":"“Un detective también estira las piernas antes del interrogatorio.”","type":"callout","title":"Frase de apertura"},
  {"text":"Actividad de reactivación — del banco, trae únicamente las que impliquen movimiento.","type":"text","title":"Qué es este bloque"},
  {"text":"A esta altura la atención decae: prioriza movimiento real, no otro ejercicio de escritorio. — Sirve de puente antes del bloque más largo y exigente de la sesión.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de actividades físicas","label":"Ver banco de actividades 🤸","openLabel":"Cerrar banco","icon":"🤸","items":[
    {"t":"Estiramiento guiado de pie (2 min)","d":"De pie junto a su puesto, el grupo sigue una secuencia corta guiada por el tutor: brazos arriba, giro de hombros, estiramiento lateral del cuello. No requiere materiales ni espacio adicional."},
    {"t":"El barco se hunde (4 min)","d":"El tutor da instrucciones tipo 'formen grupos de 3' o 'toquen algo de color azul' y el grupo debe moverse rápido para cumplirlas; quien se quede sin grupo o sin tocar el objeto sigue jugando proponiendo la siguiente instrucción. Clásico energizante que solo necesita espacio para moverse."},
    {"t":"Simón dice (3 min)","d":"El tutor da órdenes de movimiento ('salten', 'toquen su cabeza') pero el grupo solo debe obedecer si la orden empieza con 'Simón dice'; quien se equivoque da una palmada y sigue en el juego. Ritmo rápido, ideal para recuperar energía."},
    {"t":"Caminata cruzada (2 min)","d":"De pie, cada persona toca su rodilla derecha con la mano izquierda y luego la rodilla izquierda con la mano derecha, repitiendo el patrón por unos 20 segundos. Es un ejercicio de coordinación cruzada que ayuda a reactivar la atención sin necesitar espacio."}
  ]}
]$m5$::jsonb
 WHERE course_id = 'd4aa2014-aa49-46d1-8ac3-7e5842fc8dc1'
   AND title = 'Estirar las piernas'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 6: El gran interrogatorio — banco nivel alto (10) ───────────────
UPDATE public.course_modules
   SET content = $m6$[
  {"text":"01:20–02:00 · 40 min","type":"intro","title":"El gran interrogatorio"},
  {"icon":"🗣️","text":"“El gran interrogatorio. Aquí se resuelve el caso.”","type":"callout","title":"Frase de apertura"},
  {"text":"Preguntas de nivel alto con retroalimentación — sugerido 8 a 12 preguntas del banco.","type":"text","title":"Qué es este bloque"},
  {"text":"Es el bloque más largo de toda la sesión: resérvalo para cuando el grupo ya calentó motores en el bloque anterior. — Misma retroalimentación inmediata que en la ronda anterior.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de preguntas — nivel alto (10)","label":"Ver banco de preguntas 🔍","openLabel":"Cerrar banco","icon":"🔍","items":[
    {"t":"Pregunta 1. \"Decir que la lectura es un lujo es desconocer que, sin ella, ni siquiera podríamos nombrar aquello que nos falta.\" El argumento del autor sugiere principalmente que la lectura: A) es innecesaria para la vida cotidiana  B) es una herramienta básica para pensar y expresar carencias, no un privilegio superfluo  C) solo es útil para quienes ya saben leer bien  D) reemplaza la necesidad de otras formas de comunicación","d":"Respuesta correcta: B. El autor rebate la idea de 'lujo' (algo prescindible) mostrando que la lectura es necesaria incluso para nombrar lo que nos hace falta — es decir, la presenta como básica, no como accesorio."},
    {"t":"Pregunta 2. \"—Usted dice que actuó por necesidad —replicó el juez—, pero la necesidad no siempre justifica el medio.\" ¿Qué relación establece el juez entre 'necesidad' y 'justificación'? A) Afirma que la necesidad siempre justifica cualquier acción  B) Sostiene que la necesidad, por sí sola, no es suficiente para justificar un acto  C) Niega que la necesidad exista en este caso  D) Afirma que el medio usado fue completamente inocente","d":"Respuesta correcta: B. El conector 'pero' introduce una limitación: hay necesidad, PERO eso no basta para justificar el medio — el juez no niega la necesidad (C) ni valida el acto (D), matiza la relación entre ambas."},
    {"t":"Pregunta 3. \"El estudio no demuestra que el fenómeno sea falso; solo demuestra que, con los datos disponibles, no se pudo comprobar que fuera cierto.\" La diferencia que señala el texto es entre: A) 'falso' y 'verdadero'  B) 'no comprobado' y 'falso'  C) 'estudio' y 'fenómeno'  D) 'datos' y 'conclusión'","d":"Respuesta correcta: B. Es una distinción clásica del pensamiento crítico: que algo no se haya podido comprobar (por falta de evidencia) no equivale a que sea falso — son dos categorías distintas que el texto explícitamente separa."},
    {"t":"Pregunta 4. \"Quienes critican la medida sin proponer una alternativa viable corren el riesgo de quedarse solo en la queja.\" El autor sugiere que la crítica sin alternativa: A) siempre es más valiosa que cualquier propuesta  B) puede quedarse en un simple reclamo sin aportar soluciones  C) debe prohibirse por completo  D) es la única forma válida de participación ciudadana","d":"Respuesta correcta: B. 'Correr el riesgo de quedarse solo en la queja' es una advertencia, no una prohibición (C) ni una afirmación de superioridad (A) — describe una posibilidad negativa, no una regla absoluta."},
    {"t":"Pregunta 5. \"No se trata de que el error sea imposible de evitar, sino de que, cuando ocurre, se reconozca a tiempo.\" Según el texto, lo más importante frente al error es: A) evitarlo a toda costa, sin excepción  B) reconocerlo oportunamente cuando sucede  C) ignorarlo si nadie lo nota  D) negar que haya ocurrido","d":"Respuesta correcta: B. La estructura 'no se trata de... sino de...' señala explícitamente cuál es el énfasis real del texto: no la prevención absoluta, sino el reconocimiento oportuno."},
    {"t":"Pregunta 6. \"El poema no llora la pérdida: la nombra, la mira de frente y, al nombrarla, la vuelve soportable.\" Según el texto, ¿qué función cumple 'nombrar' la pérdida en el poema? A) Ninguna, nombrar y llorar son lo mismo en el texto  B) Convierte el dolor en algo posible de enfrentar  C) Hace que la pérdida desaparezca por completo  D) Evita que el lector entienda el poema","d":"Respuesta correcta: B. El texto contrasta 'llorar' con 'nombrar/mirar de frente/volver soportable' — el efecto que describe no es la desaparición del dolor, sino hacerlo más manejable."},
    {"t":"Pregunta 7. \"Que una teoría sea útil no significa que sea la única explicación posible.\" La idea central del texto es que la utilidad de una teoría: A) prueba que es la explicación definitiva y única  B) no descarta que existan otras explicaciones posibles  C) demuestra que las demás teorías son falsas  D) depende únicamente de su antigüedad","d":"Respuesta correcta: B. El texto niega explícitamente (‘no significa que...’) que utilidad implique exclusividad — deja abierta la posibilidad de que existan otras explicaciones."},
    {"t":"Pregunta 8. \"Mientras unos ven en la duda una debilidad, otros la reconocen como el primer paso hacia el conocimiento riguroso.\" El texto presenta la duda como: A) un obstáculo que siempre debe evitarse  B) una idea sobre la que hay posturas distintas, una de ellas favorable al conocimiento  C) un error que todos condenan por igual  D) algo irrelevante para el conocimiento","d":"Respuesta correcta: B. La estructura 'mientras unos... otros...' presenta explícitamente DOS posturas contrapuestas, no una sola condena unánime — descartando A, C y D."},
    {"t":"Pregunta 9. \"El testigo no mintió, pero tampoco dijo todo lo que sabía; entre la mentira y la verdad completa hay más de un camino.\" El texto plantea principalmente que entre mentir y decir toda la verdad: A) no existe ninguna otra posibilidad  B) existen matices, como el de omitir información sin mentir  C) siempre se elige mentir  D) la ley obliga a decir toda la verdad","d":"Respuesta correcta: B. La frase 'hay más de un camino' es explícita: existen posiciones intermedias entre mentir y la verdad completa, como omitir sin mentir — justo lo que describe el testigo."},
    {"t":"Pregunta 10. \"Que la ciencia no tenga todas las respuestas no la hace menos confiable: la hace, precisamente, honesta sobre sus límites.\" Según el autor, que la ciencia no tenga todas las respuestas es señal de: A) que no se puede confiar en ella  B) honestidad respecto a lo que aún no se sabe  C) que ha fracasado en su propósito  D) que debe ser reemplazada por otro método","d":"Respuesta correcta: B. El texto invierte explícitamente la lectura negativa ('no la hace menos confiable') y la reemplaza por una positiva ('la hace... honesta') — la respuesta debe seguir esa misma dirección argumentativa."}
  ]}
]$m6$::jsonb
 WHERE course_id = 'd4aa2014-aa49-46d1-8ac3-7e5842fc8dc1'
   AND title = 'El gran interrogatorio'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;
