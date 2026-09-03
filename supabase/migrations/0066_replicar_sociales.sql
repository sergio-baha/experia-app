-- ============================================================
-- 0066_replicar_sociales.sql
-- Replica en "Viajeros del Tiempo — Ciencias Sociales — mi versión" lo
-- mismo hecho en Matemáticas (0062 + 0064): 2 preguntas en vivo
-- intercaladas + contenido real en los 5 "Pendiente".
--
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

DO $$
DECLARE
  v_course_id    uuid := '9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3'; -- Viajeros del Tiempo — mi versión
  v_order_intro  int;
  v_order_mid    int;
BEGIN

  IF EXISTS (
    SELECT 1 FROM public.course_modules
     WHERE course_id = v_course_id AND title = 'Pregunta en Vivo 1 — Estado social de derecho'
  ) THEN
    RAISE NOTICE 'Ya se aplicó antes, no se duplica.';
    RETURN;
  END IF;

  SELECT "order" INTO v_order_intro FROM public.course_modules
   WHERE course_id = v_course_id AND title = 'Activar el portal';
  SELECT "order" INTO v_order_mid FROM public.course_modules
   WHERE course_id = v_course_id AND title = 'Primera época: preguntas';

  IF v_order_intro IS NULL OR v_order_mid IS NULL THEN
    RAISE EXCEPTION 'No se encontraron los módulos pivote en el curso %', v_course_id;
  END IF;

  UPDATE public.course_modules SET "order" = "order" + 1
   WHERE course_id = v_course_id AND "order" > v_order_mid;

  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Pregunta en Vivo 2 — Mecanismos de participación',
    'Simulacro — Aula en Vivo',
    'Pregunta de simulacro tipo Saber (Ciencias Sociales) para resolver en clase en vivo, con explicación.',
    'challenge', 'quiz', v_order_mid + 1, 80, true, null,
    'Otra época se activa: distingan bien los mecanismos antes de responder.',
    $jq2${
      "questions": [
        {
          "question": "El mecanismo de participación ciudadana mediante el cual los ciudadanos pueden proponer directamente un proyecto de ley ante el Congreso se denomina",
          "options": ["Referendo", "Iniciativa popular legislativa", "Consulta popular", "Plebiscito"],
          "correct": 1,
          "explanation": "**Distinguir mecanismos de participación**\nColombia reconoce varios mecanismos de participación ciudadana (Ley 134 de 1994): la iniciativa popular legislativa es específicamente la que permite a un grupo de ciudadanos PROPONER un proyecto de ley o de reforma ante el Congreso. Es una herramienta de origen, no de aprobación o consulta posterior.\n\n**Por qué fallan las otras opciones**\n• El referendo somete a votación popular un proyecto de norma YA EXISTENTE (aprobarlo, modificarlo o derogarlo), no propone uno nuevo desde cero. • La consulta popular pregunta a los ciudadanos sobre una decisión de carácter general, no sobre un texto de ley específico que ellos mismos redactan. • El plebiscito consulta el respaldo a una decisión del Ejecutivo, no crea legislación.\n\n**Para llevarte**: en estas preguntas, la clave está en identificar QUIÉN inicia el proceso y QUÉ tipo de decisión se somete a la ciudadanía — no basta con reconocer que todos son 'mecanismos de participación'.",
          "timeLimit": 50,
          "points": 1200,
          "difficulty": "dificil"
        }
      ]
    }$jq2$::jsonb
  );

  UPDATE public.course_modules SET "order" = "order" + 1
   WHERE course_id = v_course_id AND "order" > v_order_intro;

  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Pregunta en Vivo 1 — Estado social de derecho',
    'Simulacro — Aula en Vivo',
    'Pregunta de simulacro tipo Saber (Ciencias Sociales) para resolver en clase en vivo, con explicación.',
    'challenge', 'quiz', v_order_intro + 1, 80, true, null,
    'Una época rápida: piensen en el presente antes de viajar al pasado.',
    $jq1${
      "questions": [
        {
          "question": "La Constitución Política de Colombia define al país como un Estado social de derecho. ¿Qué implica principalmente esta definición?",
          "options": ["Que el Estado garantiza derechos económicos, sociales y culturales, además de las libertades individuales.", "Que el Estado únicamente protege la propiedad privada.", "Que las leyes solo aplican a las instituciones públicas.", "Que el gobierno puede suspender la Constitución cuando lo considere necesario."],
          "correct": 0,
          "explanation": "**Qué agrega 'social' a 'Estado de derecho'**\nUn Estado de derecho, a secas, se limita a garantizar que el poder se ejerza conforme a la ley. Al agregar 'social', la Constitución (art. 1) compromete al Estado a ir más allá: también debe garantizar condiciones materiales mínimas — salud, educación, vivienda — no solo libertades formales.\n\n**Por qué fallan las otras opciones**\n• B reduce el Estado social de derecho a la protección de la propiedad, cuando en realidad su sello distintivo son los derechos sociales. • C es falso: las leyes rigen para todos, no solo para el sector público. • D contradice el principio mismo de Estado de derecho, que exige que el poder SIEMPRE se sujete a la Constitución, sin excepciones discrecionales.\n\n**Para llevarte**: cuando una pregunta usa un término compuesto como 'Estado social de derecho', conviene preguntarse qué aporta cada palabra por separado antes de elegir la respuesta.",
          "timeLimit": 40,
          "points": 1000,
          "difficulty": "media"
        }
      ]
    }$jq1$::jsonb
  );

  RAISE NOTICE 'Preguntas en vivo de Ciencias Sociales insertadas e intercaladas.';

END $$;

-- ── Módulo 1: Activar el portal — banco de actividades rompehielo ──────────
UPDATE public.course_modules
   SET content = $m1$[
  {"text":"00:00–00:10 · 10 min","type":"intro","title":"Activar el portal"},
  {"icon":"🗣️","text":"“Activemos el portal.”","type":"callout","title":"Frase de apertura"},
  {"text":"Actividad rompehielo — cognitiva o física, a elección del tutor.","type":"text","title":"Qué es este bloque"},
  {"text":"Elige la dinámica según la energía con la que llega el grupo: cognitiva si necesitan enfocarse, física si llegan dispersos. — Debe ser corta y de instrucciones simples: el grupo apenas está entrando.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de actividades rompehielo","label":"Ver banco de actividades 🎲","openLabel":"Cerrar banco","icon":"🎲","items":[
    {"t":"Uno, dos, tres… conmigo (física, 2 min)","d":"En parejas, uno hace un gesto simple (aplaudir, chasquear, saltar) y el otro lo repite lo más rápido posible; cada 3 rondas cambian de pareja. Sirve para activar el cuerpo sin necesitar espacio ni materiales."},
    {"t":"La palabra encadenada (cognitiva, 3 min)","d":"En círculo, cada persona dice una palabra relacionada con historia o sociedad que empiece con la última letra de la palabra anterior (ej. 'estado' → 'orden' → 'nación'). Quien se demore más de 5 segundos o repita una palabra sigue en el juego, pero propone la siguiente categoría."},
    {"t":"Sondeo rápido de manos (cognitiva/social, 2 min)","d":"El tutor lanza preguntas rápidas de sí o no relacionadas con la sesión ('¿quién ya presentó la Prueba Saber?', '¿a quién le gusta más la historia que la geografía?') y el grupo responde levantando la mano. Sin materiales, ideal para grupos grandes."},
    {"t":"Espejo en parejas (física, 3 min)","d":"En parejas, uno hace movimientos lentos con brazos y manos mientras el otro los imita como un espejo; a la mitad del tiempo intercambian el rol de quien dirige. Ayuda a bajar la tensión inicial con humor."},
    {"t":"Bingo de presentación express (cognitiva/social, 5 min)","d":"Se reparte una cuadrícula con frases cortas ('le gusta la geografía', 'ha enseñado más de 10 años', 'prefiere la historia contemporánea'); cada quien debe conseguir la firma de un colega distinto por cada casilla que le aplique. Gana quien complete una línea primero. Requiere imprimir la cuadrícula con anticipación."}
  ]}
]$m1$::jsonb
 WHERE course_id = '9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3'
   AND title = 'Activar el portal'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 2: Las reglas del viaje — estructura de la Prueba Saber ─────────
UPDATE public.course_modules
   SET content = $m2$[
  {"text":"00:10–00:25 · 15 min","type":"intro","title":"Las reglas del viaje"},
  {"icon":"🗣️","text":"“Antes de viajar, las reglas del viaje en el tiempo.”","type":"callout","title":"Frase de apertura"},
  {"text":"Explicación de la estructura de la Prueba Saber — contenido estandarizado por asignatura.","type":"text","title":"Qué es este bloque"},
  {"text":"Se apoya en el material único del área, distribuido aparte. — Objetivo del bloque: que el grupo reconozca secciones, tipos de pregunta y forma de puntuar antes de practicar.","type":"text","title":"Cómo ejecutarlo"},
  {"text":"Antes de practicar con las preguntas de las siguientes épocas, conviene que el grupo reconozca cómo está armada la prueba real — así entienden qué se les va a exigir y por qué las preguntas se sienten como se sienten.","type":"text","title":"Antes de empezar"},
  {"type":"steps","title":"Estructura de la Prueba Saber — Ciencias Sociales y Ciudadanas","items":[
    {"icon":"📝","t":"Formato de las preguntas","d":"Selección múltiple con única respuesta, cuatro opciones marcadas A, B, C y D, muchas veces a partir de un texto, mapa, gráfico o situación corta. No hay penalización por responder incorrectamente, así que siempre conviene marcar una opción aunque haya duda."},
    {"icon":"🧠","t":"Competencias evaluadas","d":"Las preguntas se agrupan en tres competencias: pensamiento social (comprender conceptos y procesos sociales, políticos, económicos e históricos), interpretación y análisis de perspectivas (reconocer que un mismo hecho admite varias miradas), y pensamiento reflexivo y sistémico (relacionar causas, consecuencias y contextos de un fenómeno)."},
    {"icon":"🌎","t":"Ejes temáticos","d":"Los contenidos cruzan historia, geografía, democracia y participación ciudadana, y economía — no se evalúa memoria de fechas aisladas, sino la capacidad de analizar procesos y relaciones entre estas áreas."},
    {"icon":"📊","t":"Cómo se califica","d":"El puntaje NO es un simple porcentaje de aciertos: se calcula con un modelo estadístico (Teoría de Respuesta al Ítem) que pondera la dificultad de cada pregunta, y se reporta en una escala de 0 a 100. Por eso dos personas con el mismo número de aciertos pueden obtener puntajes distintos si acertaron preguntas de diferente dificultad."}
  ]}
]$m2$::jsonb
 WHERE course_id = '9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3'
   AND title = 'Las reglas del viaje'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 4: Primera época: preguntas — banco nivel medio-alto (10) ───────
UPDATE public.course_modules
   SET content = $m4$[
  {"text":"00:35–01:10 · 35 min","type":"intro","title":"Primera época: preguntas"},
  {"icon":"🗣️","text":"“Primera época: preguntas de nivel medio-alto.”","type":"callout","title":"Frase de apertura"},
  {"text":"Preguntas de nivel medio-alto con retroalimentación inmediata — sugerido 10 a 12 preguntas del banco.","type":"text","title":"Qué es este bloque"},
  {"text":"Retroalimenta cada pregunta o cada bloque corto: no acumules toda la retro para el final. — Ritmo sugerido: cerca de 3 minutos por pregunta, entre responder y retroalimentar.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de preguntas — nivel medio-alto (10)","label":"Ver banco de preguntas 🕰️","openLabel":"Cerrar banco","icon":"🕰️","items":[
    {"t":"Pregunta 1. La división de poderes en ramas Ejecutiva, Legislativa y Judicial busca principalmente: A) concentrar el poder en una sola persona para mayor eficiencia  B) evitar el abuso de poder mediante controles mutuos entre las ramas  C) eliminar la necesidad de elecciones periódicas  D) que solo el poder judicial tome decisiones políticas","d":"Respuesta correcta: B. La separación de poderes busca que cada rama controle y equilibre a las otras (frenos y contrapesos), evitando que el poder se concentre en una sola institución o persona."},
    {"t":"Pregunta 2. ¿Cuál de los siguientes NO es un mecanismo de participación ciudadana reconocido en Colombia? A) Referendo  B) Consulta popular  C) Revocatoria del mandato  D) Censura parlamentaria","d":"Respuesta correcta: D. La moción de censura es un control político que ejerce el Congreso sobre los ministros — no es un mecanismo mediante el cual los CIUDADANOS participan directamente, a diferencia de las otras tres opciones."},
    {"t":"Pregunta 3. Una economía en la que el Estado interviene activamente en la producción y distribución de bienes, limitando la propiedad privada de los medios de producción, se conoce como: A) economía de mercado  B) economía mixta  C) economía centralmente planificada  D) economía de subsistencia","d":"Respuesta correcta: C. En una economía centralmente planificada, es el Estado (no el mercado) quien decide qué, cómo y cuánto producir, con poca o ninguna propiedad privada sobre los medios de producción."},
    {"t":"Pregunta 4. El proceso histórico mediante el cual las colonias americanas rompieron los vínculos políticos con las potencias europeas durante el siglo XIX se conoce como: A) la Revolución Industrial  B) los procesos de independencia  C) la Guerra Fría  D) el Renacimiento","d":"Respuesta correcta: B. Las otras opciones corresponden a procesos históricos de otra naturaleza o época: la Revolución Industrial es económica/tecnológica, la Guerra Fría es del siglo XX, y el Renacimiento es cultural y anterior (siglos XIV-XVI)."},
    {"t":"Pregunta 5. En un mapa, las líneas que unen puntos de igual altitud se llaman: A) isotermas  B) isóbaras  C) curvas de nivel  D) meridianos","d":"Respuesta correcta: C. Las isotermas unen puntos de igual temperatura, las isóbaras de igual presión atmosférica, y los meridianos son líneas de referencia geográfica norte-sur — ninguna representa altitud."},
    {"t":"Pregunta 6. La migración forzada de personas debido a un conflicto armado interno se clasifica principalmente como: A) migración voluntaria  B) desplazamiento forzado  C) turismo  D) migración estacional","d":"Respuesta correcta: B. La clave es que la persona NO elige moverse: lo hace por una amenaza directa a su seguridad, lo que la distingue de la migración voluntaria o estacional (por trabajo temporal)."},
    {"t":"Pregunta 7. ¿Cuál de las siguientes es una función principal de la Rama Judicial en Colombia? A) Sancionar las leyes aprobadas por el Congreso  B) Administrar justicia y resolver conflictos conforme a la ley  C) Ejecutar el presupuesto nacional  D) Representar al país en tratados internacionales","d":"Respuesta correcta: B. Sancionar leyes es función del Ejecutivo (Presidente), ejecutar el presupuesto también es del Ejecutivo, y representar al país en tratados corresponde al Ejecutivo con control del Legislativo — administrar justicia es, específicamente, la función de la Rama Judicial."},
    {"t":"Pregunta 8. El concepto de 'globalización' se refiere principalmente a: A) el aislamiento económico de los países  B) la creciente interconexión económica, cultural y política entre países  C) la desaparición completa de las fronteras políticas  D) el regreso a economías exclusivamente locales","d":"Respuesta correcta: B. La globalización aumenta la interdependencia entre países, pero no elimina las fronteras políticas (C) ni implica aislamiento (A) o un regreso a lo local (D) — de hecho, es casi lo opuesto a esas ideas."},
    {"t":"Pregunta 9. Un sistema político en el que el poder se hereda dentro de una misma familia se denomina: A) democracia  B) monarquía  C) república  D) dictadura militar","d":"Respuesta correcta: B. La característica distintiva de la monarquía es precisamente la transmisión hereditaria del poder — ni la democracia ni la república se organizan así, y una dictadura militar tampoco es necesariamente hereditaria."},
    {"t":"Pregunta 10. La Declaración Universal de los Derechos Humanos fue proclamada por la Organización de las Naciones Unidas en el año: A) 1945  B) 1948  C) 1955  D) 1960","d":"Respuesta correcta: B) 1948, tres años después de la fundación de la ONU (1945) y como respuesta directa a las atrocidades de la Segunda Guerra Mundial."}
  ]}
]$m4$::jsonb
 WHERE course_id = '9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3'
   AND title = 'Primera época: preguntas'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 5: Recarga temporal — banco de actividades SOLO físicas ─────────
UPDATE public.course_modules
   SET content = $m5$[
  {"text":"01:10–01:20 · 10 min","type":"intro","title":"Recarga temporal"},
  {"icon":"🗣️","text":"“Recarguemos energía temporal antes de la época final.”","type":"callout","title":"Frase de apertura"},
  {"text":"Actividad de reactivación — del banco, trae únicamente las que impliquen movimiento.","type":"text","title":"Qué es este bloque"},
  {"text":"A esta altura la atención decae: prioriza movimiento real, no otro ejercicio de escritorio. — Sirve de puente antes del bloque más largo y exigente de la sesión.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de actividades físicas","label":"Ver banco de actividades 🤸","openLabel":"Cerrar banco","icon":"🤸","items":[
    {"t":"Estiramiento guiado de pie (2 min)","d":"De pie junto a su puesto, el grupo sigue una secuencia corta guiada por el tutor: brazos arriba, giro de hombros, estiramiento lateral del cuello. No requiere materiales ni espacio adicional."},
    {"t":"El barco se hunde (4 min)","d":"El tutor da instrucciones tipo 'formen grupos de 3' o 'toquen algo de color azul' y el grupo debe moverse rápido para cumplirlas; quien se quede sin grupo o sin tocar el objeto sigue jugando proponiendo la siguiente instrucción. Clásico energizante que solo necesita espacio para moverse."},
    {"t":"Simón dice (3 min)","d":"El tutor da órdenes de movimiento ('salten', 'toquen su cabeza') pero el grupo solo debe obedecer si la orden empieza con 'Simón dice'; quien se equivoque da una palmada y sigue en el juego. Ritmo rápido, ideal para recuperar energía."},
    {"t":"Caminata cruzada (2 min)","d":"De pie, cada persona toca su rodilla derecha con la mano izquierda y luego la rodilla izquierda con la mano derecha, repitiendo el patrón por unos 20 segundos. Es un ejercicio de coordinación cruzada que ayuda a reactivar la atención sin necesitar espacio."}
  ]}
]$m5$::jsonb
 WHERE course_id = '9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3'
   AND title = 'Recarga temporal'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 6: La época decisiva — banco nivel alto (10) ────────────────────
UPDATE public.course_modules
   SET content = $m6$[
  {"text":"01:20–02:00 · 40 min","type":"intro","title":"La época decisiva"},
  {"icon":"🗣️","text":"“La época decisiva. Aquí se juega todo.”","type":"callout","title":"Frase de apertura"},
  {"text":"Preguntas de nivel alto con retroalimentación — sugerido 8 a 12 preguntas del banco.","type":"text","title":"Qué es este bloque"},
  {"text":"Es el bloque más largo de toda la sesión: resérvalo para cuando el grupo ya calentó motores en el bloque anterior. — Misma retroalimentación inmediata que en la ronda anterior.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de preguntas — nivel alto (10)","label":"Ver banco de preguntas 🕰️","openLabel":"Cerrar banco","icon":"🕰️","items":[
    {"t":"Pregunta 1. Un Estado con amplia autonomía de sus entidades territoriales, pero donde estas NO tienen soberanía propia ni pueden separarse unilateralmente, se describe mejor como un Estado: A) unitario descentralizado  B) federal  C) confederado  D) totalitario","d":"Respuesta correcta: A. Es exactamente el modelo colombiano (art. 1 de la Constitución): unitario (una sola soberanía nacional) pero descentralizado (con autonomía administrativa de departamentos y municipios) — distinto del federalismo, donde los estados sí conservan soberanía propia."},
    {"t":"Pregunta 2. Durante la Guerra Fría, la política de 'contención' impulsada por Estados Unidos tenía como objetivo principal: A) expandir el comunismo a nuevos territorios  B) frenar la expansión de la influencia soviética sin llegar a una guerra directa  C) unificar a Europa bajo un solo gobierno  D) eliminar las fronteras entre países capitalistas","d":"Respuesta correcta: B. La contención (Doctrina Truman) buscaba impedir el avance del comunismo mediante apoyo económico y militar a países aliados, evitando un enfrentamiento militar directo entre las dos superpotencias."},
    {"t":"Pregunta 3. El efecto por el cual una decisión económica tomada en un país puede afectar rápidamente los mercados de otros países se conoce como: A) proteccionismo  B) interdependencia económica  C) autarquía  D) aislacionismo","d":"Respuesta correcta: B. Proteccionismo, autarquía y aislacionismo describen políticas que buscan REDUCIR la dependencia de otros países — justo lo opuesto al fenómeno descrito, que refleja lo conectadas que están las economías entre sí."},
    {"t":"Pregunta 4. Cuando un gobierno restringe derechos civiles alegando una amenaza a la seguridad nacional, se genera una tensión característica entre: A) el poder judicial y el poder legislativo únicamente  B) la seguridad del Estado y las libertades individuales de los ciudadanos  C) la economía nacional y el comercio internacional  D) la Iglesia y el Estado","d":"Respuesta correcta: B. Es una de las tensiones centrales de la teoría política y constitucional: hasta qué punto la seguridad justifica limitar derechos y libertades — no se trata de un conflicto entre ramas del poder (A) ni de temas económicos o religiosos (C, D)."},
    {"t":"Pregunta 5. El 'bono demográfico' se refiere a la etapa en la que un país tiene: A) más adultos mayores que población en edad de trabajar  B) una proporción alta de población en edad de trabajar respecto a los dependientes (niños y adultos mayores)  C) una tasa de natalidad igual a la de mortalidad  D) una población decreciente en todos los grupos de edad","d":"Respuesta correcta: B. El bono demográfico es una ventana de oportunidad económica: cuando hay proporcionalmente más personas trabajando que dependientes, un país puede crecer más rápido si aprovecha esa fuerza laboral."},
    {"t":"Pregunta 6. La diferencia principal entre un tratado internacional y una costumbre internacional como fuentes del derecho internacional es que: A) el tratado es un acuerdo escrito y explícito entre Estados, mientras la costumbre surge de una práctica reiterada y aceptada como obligatoria  B) solo la costumbre es válida legalmente  C) los tratados nunca son vinculantes  D) la costumbre siempre prevalece sobre cualquier tratado","d":"Respuesta correcta: A. Ambas son fuentes reconocidas del derecho internacional, pero se originan distinto: el tratado se negocia y firma explícitamente, mientras la costumbre se construye con el tiempo a través de la práctica reiterada de los Estados."},
    {"t":"Pregunta 7. Un conflicto se considera de carácter 'multicausal' cuando: A) tiene un único origen claramente identificable  B) responde a la combinación de varios factores (económicos, sociales, políticos) que interactúan entre sí  C) solo involucra a dos actores  D) se resuelve siempre por medios militares","d":"Respuesta correcta: B. La mayoría de los conflictos sociales e históricos reales no tienen una sola causa: entender su carácter multicausal es clave para el pensamiento social y sistémico que evalúa la prueba."},
    {"t":"Pregunta 8. El 'efecto invernadero' es un fenómeno natural necesario para la vida en la Tierra; el problema ambiental actual se relaciona principalmente con: A) la desaparición completa del efecto invernadero  B) la intensificación del efecto invernadero por el aumento de gases como el CO2 de origen humano  C) la ausencia total de gases en la atmósfera  D) el enfriamiento generalizado del planeta","d":"Respuesta correcta: B. El efecto invernadero en sí mismo no es el problema (sin él, la Tierra sería demasiado fría) — el problema es su intensificación por la actividad humana, que altera el equilibrio natural del planeta."},
    {"t":"Pregunta 9. Cuando distintos grupos sociales interpretan un mismo hecho histórico de manera distinta según su contexto e intereses, se habla de: A) un error historiográfico que debe corregirse  B) la existencia de múltiples perspectivas o relatos sobre un mismo hecho  C) la inexistencia de una verdad histórica  D) la necesidad de ocultar las versiones divergentes","d":"Respuesta correcta: B. Reconocer múltiples perspectivas sobre un mismo hecho histórico es parte central de la competencia de 'interpretación y análisis de perspectivas' — no implica que no haya hechos verificables, sino que su significado puede leerse de formas distintas."},
    {"t":"Pregunta 10. La 'revocatoria del mandato' en Colombia permite a los ciudadanos: A) proponer directamente un proyecto de ley  B) destituir, antes de que termine su periodo, a un gobernador o alcalde elegido popularmente  C) elegir al presidente por voto directo  D) modificar la Constitución sin necesidad de referendo","d":"Respuesta correcta: B. Es un mecanismo de control POSTERIOR a la elección: permite a los ciudadanos que votaron por un gobernador o alcalde retirarle el mandato antes de que termine su periodo, algo distinto de proponer leyes (A) o elegir presidente (C)."}
  ]}
]$m6$::jsonb
 WHERE course_id = '9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3'
   AND title = 'La época decisiva'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;
