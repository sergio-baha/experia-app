-- ============================================================
-- 0067_replicar_ciencias.sql
-- Replica en "Laboratorio de Ciencias Naturales — Versión 1" lo mismo
-- hecho en Matemáticas (0062 + 0064): 2 preguntas en vivo intercaladas +
-- contenido real en los 5 "Pendiente".
--
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

DO $$
DECLARE
  v_course_id    uuid := '4d2af3cd-767e-4e14-a364-23fd596ada10'; -- Laboratorio — Versión 1
  v_order_intro  int;
  v_order_mid    int;
BEGIN

  IF EXISTS (
    SELECT 1 FROM public.course_modules
     WHERE course_id = v_course_id AND title = 'Pregunta en Vivo 1 — Cambios de estado'
  ) THEN
    RAISE NOTICE 'Ya se aplicó antes, no se duplica.';
    RETURN;
  END IF;

  SELECT "order" INTO v_order_intro FROM public.course_modules
   WHERE course_id = v_course_id AND title = 'Encender el laboratorio';
  SELECT "order" INTO v_order_mid FROM public.course_modules
   WHERE course_id = v_course_id AND title = 'Primera ronda de hipótesis';

  IF v_order_intro IS NULL OR v_order_mid IS NULL THEN
    RAISE EXCEPTION 'No se encontraron los módulos pivote en el curso %', v_course_id;
  END IF;

  UPDATE public.course_modules SET "order" = "order" + 1
   WHERE course_id = v_course_id AND "order" > v_order_mid;

  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Pregunta en Vivo 2 — Energía cinética',
    'Simulacro — Aula en Vivo',
    'Pregunta de simulacro tipo Saber (Ciencias Naturales) para resolver en clase en vivo, con explicación.',
    'challenge', 'quiz', v_order_mid + 1, 80, true, null,
    'Otra hipótesis se activa: no olviden elevar al cuadrado.',
    $jq2${
      "questions": [
        {
          "question": "Un objeto de 2 kg se mueve con una velocidad de 3 m/s. ¿Cuál es su energía cinética?",
          "options": ["9 J", "18 J", "6 J", "3 J"],
          "correct": 0,
          "explanation": "**Aplicando la fórmula correctamente**\nLa energía cinética es Ec = ½mv². Con m=2 kg y v=3 m/s: Ec = 0,5×2×3² = 0,5×2×9 = 9 J.\n\n**Por qué fallan las otras opciones**\n• 18 J sale de olvidar el factor ½ (calcular directamente m×v²=2×9=18). • 3 J sale de olvidar elevar la velocidad al cuadrado (0,5×2×3=3). • 6 J confunde la fórmula por completo y multiplica solo masa por velocidad (2×3=6), sin el ½ ni el cuadrado.\n\n**Para llevarte**: en fórmulas con exponentes, conviene resolver PRIMERO la potencia (v²) y después multiplicar por las constantes — invertir el orden es la fuente más común de error en este tipo de preguntas.",
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
    'Pregunta en Vivo 1 — Cambios de estado',
    'Simulacro — Aula en Vivo',
    'Pregunta de simulacro tipo Saber (Ciencias Naturales) para resolver en clase en vivo, con explicación.',
    'challenge', 'quiz', v_order_intro + 1, 80, true, null,
    'Una hipótesis rápida: observen antes de concluir.',
    $jq1${
      "questions": [
        {
          "question": "Cuando el agua pasa de estado líquido a estado gaseoso mediante calentamiento, este cambio de estado se llama",
          "options": ["Condensación", "Evaporación", "Sublimación", "Solidificación"],
          "correct": 1,
          "explanation": "**Identificando el cambio de estado**\nLa evaporación es, por definición, el paso de líquido a gaseoso por efecto del calor. Cada uno de los otros términos nombra un cambio de estado DISTINTO: la condensación es gaseoso→líquido (el proceso inverso), la sublimación es sólido→gaseoso directamente (sin pasar por líquido), y la solidificación es líquido→sólido.\n\n**Para llevarte**: en preguntas de cambios de estado, conviene identificar primero el estado INICIAL y el estado FINAL que describe el texto, y luego buscar el término que conecta exactamente esos dos — confundir el sentido del cambio (ida vs. vuelta) es el error más común.",
          "timeLimit": 40,
          "points": 1000,
          "difficulty": "media"
        }
      ]
    }$jq1$::jsonb
  );

  RAISE NOTICE 'Preguntas en vivo de Ciencias Naturales insertadas e intercaladas.';

END $$;

-- ── Módulo 1: Encender el laboratorio — banco de actividades rompehielo ────
UPDATE public.course_modules
   SET content = $m1$[
  {"text":"00:00–00:10 · 10 min","type":"intro","title":"Encender el laboratorio"},
  {"icon":"🗣️","text":"“Encendamos el laboratorio.”","type":"callout","title":"Frase de apertura"},
  {"text":"Actividad rompehielo — cognitiva o física, a elección del tutor.","type":"text","title":"Qué es este bloque"},
  {"text":"Elige la dinámica según la energía con la que llega el grupo: cognitiva si necesitan enfocarse, física si llegan dispersos. — Debe ser corta y de instrucciones simples: el grupo apenas está entrando.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de actividades rompehielo","label":"Ver banco de actividades 🎲","openLabel":"Cerrar banco","icon":"🎲","items":[
    {"t":"Uno, dos, tres… conmigo (física, 2 min)","d":"En parejas, uno hace un gesto simple (aplaudir, chasquear, saltar) y el otro lo repite lo más rápido posible; cada 3 rondas cambian de pareja. Sirve para activar el cuerpo sin necesitar espacio ni materiales."},
    {"t":"La palabra encadenada (cognitiva, 3 min)","d":"En círculo, cada persona dice una palabra relacionada con ciencias naturales que empiece con la última letra de la palabra anterior (ej. 'célula' → 'átomo' → 'oxígeno'). Quien se demore más de 5 segundos o repita una palabra sigue en el juego, pero propone la siguiente categoría."},
    {"t":"Sondeo rápido de manos (cognitiva/social, 2 min)","d":"El tutor lanza preguntas rápidas de sí o no relacionadas con la sesión ('¿quién ya presentó la Prueba Saber?', '¿a quién le gusta más la biología que la física?') y el grupo responde levantando la mano. Sin materiales, ideal para grupos grandes."},
    {"t":"Espejo en parejas (física, 3 min)","d":"En parejas, uno hace movimientos lentos con brazos y manos mientras el otro los imita como un espejo; a la mitad del tiempo intercambian el rol de quien dirige. Ayuda a bajar la tensión inicial con humor."},
    {"t":"Bingo de presentación express (cognitiva/social, 5 min)","d":"Se reparte una cuadrícula con frases cortas ('le gusta la química', 'ha enseñado más de 10 años', 'prefiere la biología'); cada quien debe conseguir la firma de un colega distinto por cada casilla que le aplique. Gana quien complete una línea primero. Requiere imprimir la cuadrícula con anticipación."}
  ]}
]$m1$::jsonb
 WHERE course_id = '4d2af3cd-767e-4e14-a364-23fd596ada10'
   AND title = 'Encender el laboratorio'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 2: Protocolo del experimento — estructura de la Prueba Saber ────
UPDATE public.course_modules
   SET content = $m2$[
  {"text":"00:10–00:25 · 15 min","type":"intro","title":"Protocolo del experimento"},
  {"icon":"🗣️","text":"“Antes de experimentar, el protocolo del experimento.”","type":"callout","title":"Frase de apertura"},
  {"text":"Explicación de la estructura de la Prueba Saber — contenido estandarizado por asignatura.","type":"text","title":"Qué es este bloque"},
  {"text":"Se apoya en el material único del área, distribuido aparte. — Objetivo del bloque: que el grupo reconozca secciones, tipos de pregunta y forma de puntuar antes de practicar.","type":"text","title":"Cómo ejecutarlo"},
  {"text":"Antes de practicar con las preguntas de las siguientes rondas, conviene que el grupo reconozca cómo está armada la prueba real — así entienden qué se les va a exigir y por qué las preguntas se sienten como se sienten.","type":"text","title":"Antes de empezar"},
  {"type":"steps","title":"Estructura de la Prueba Saber — Ciencias Naturales","items":[
    {"icon":"📝","t":"Formato de las preguntas","d":"Selección múltiple con única respuesta, cuatro opciones marcadas A, B, C y D, frecuentemente a partir de una situación experimental, gráfico o tabla de datos. No hay penalización por responder incorrectamente, así que siempre conviene marcar una opción aunque haya duda."},
    {"icon":"🧠","t":"Competencias evaluadas","d":"Las preguntas se agrupan en tres competencias: uso comprensivo del conocimiento científico (aplicar conceptos de física, química y biología), explicación de fenómenos (dar razones de por qué ocurre algo), e indagación (interpretar datos, gráficas y diseños experimentales)."},
    {"icon":"🔬","t":"Áreas que integra","d":"La prueba combina preguntas de física, química y biología, muchas veces conectadas mediante una misma situación o experimento — no se evalúan las tres áreas por separado, sino de forma integrada."},
    {"icon":"📊","t":"Cómo se califica","d":"El puntaje NO es un simple porcentaje de aciertos: se calcula con un modelo estadístico (Teoría de Respuesta al Ítem) que pondera la dificultad de cada pregunta, y se reporta en una escala de 0 a 100. Por eso dos personas con el mismo número de aciertos pueden obtener puntajes distintos si acertaron preguntas de diferente dificultad."}
  ]}
]$m2$::jsonb
 WHERE course_id = '4d2af3cd-767e-4e14-a364-23fd596ada10'
   AND title = 'Protocolo del experimento'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 4: Primera ronda de hipótesis — banco nivel medio-alto (10) ─────
UPDATE public.course_modules
   SET content = $m4$[
  {"text":"00:35–01:10 · 35 min","type":"intro","title":"Primera ronda de hipótesis"},
  {"icon":"🗣️","text":"“Primera ronda de hipótesis: midan antes de concluir.”","type":"callout","title":"Frase de apertura"},
  {"text":"Preguntas de nivel medio-alto con retroalimentación inmediata — sugerido 10 a 12 preguntas del banco.","type":"text","title":"Qué es este bloque"},
  {"text":"Retroalimenta cada pregunta o cada bloque corto: no acumules toda la retro para el final. — Ritmo sugerido: cerca de 3 minutos por pregunta, entre responder y retroalimentar.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de preguntas — nivel medio-alto (10)","label":"Ver banco de preguntas 🧪","openLabel":"Cerrar banco","icon":"🧪","items":[
    {"t":"Pregunta 1. Un cuerpo en caída libre parte del reposo. Si después de 2 segundos su velocidad es 20 m/s (ignorando la resistencia del aire), ¿cuál es su aceleración? A) 10 m/s²  B) 20 m/s²  C) 5 m/s²  D) 40 m/s²","d":"Respuesta correcta: A) 10 m/s². La aceleración es a=v/t=20/2=10 m/s², que además coincide con el valor aproximado de la gravedad terrestre. B) confunde velocidad final con aceleración, y C) y D) surgen de dividir o multiplicar mal los datos."},
    {"t":"Pregunta 2. La unidad básica de la vida es: A) el átomo  B) la célula  C) el tejido  D) el órgano","d":"Respuesta correcta: B) la célula. El átomo es una unidad de la materia en general, no específica de los seres vivos; los tejidos y órganos son niveles de organización SUPERIORES, formados por muchas células."},
    {"t":"Pregunta 3. El proceso mediante el cual las plantas convierten luz solar, agua y CO2 en glucosa y oxígeno se llama: A) respiración celular  B) fotosíntesis  C) fermentación  D) transpiración","d":"Respuesta correcta: B) fotosíntesis. La respiración celular es casi el proceso inverso (usa oxígeno y glucosa para liberar energía), y la transpiración es la pérdida de agua por las hojas, no la producción de glucosa."},
    {"t":"Pregunta 4. ¿Cuál de las siguientes es una mezcla homogénea? A) agua con arena  B) agua salada  C) aceite y agua  D) ensalada de frutas","d":"Respuesta correcta: B) agua salada. Una mezcla es homogénea cuando sus componentes no se distinguen a simple vista, como ocurre cuando la sal se disuelve completamente — a diferencia de A, C y D, donde los componentes siguen siendo visibles por separado."},
    {"t":"Pregunta 5. La fuerza de gravedad entre dos objetos depende principalmente de: A) su color y forma  B) su masa y la distancia entre ellos  C) su temperatura  D) su velocidad","d":"Respuesta correcta: B. Según la Ley de Gravitación Universal, la fuerza gravitacional depende directamente de las masas de los objetos e inversamente de la distancia al cuadrado entre ellos — no del color, la forma, la temperatura ni la velocidad."},
    {"t":"Pregunta 6. Un ácido se caracteriza por tener un pH: A) mayor que 7  B) igual a 7  C) menor que 7  D) siempre igual a 0","d":"Respuesta correcta: C. La escala de pH va de 0 a 14: los valores menores a 7 son ácidos, el 7 es neutro, y los mayores a 7 son básicos o alcalinos. Un ácido no tiene por qué ser exactamente 0."},
    {"t":"Pregunta 7. En el sistema circulatorio humano, la función principal del corazón es: A) filtrar la sangre  B) bombear la sangre por el cuerpo  C) producir glóbulos rojos  D) almacenar oxígeno","d":"Respuesta correcta: B. Filtrar la sangre es función de los riñones, y producir glóbulos rojos ocurre en la médula ósea — el corazón es específicamente la bomba que impulsa la circulación."},
    {"t":"Pregunta 8. Si la resistencia eléctrica de un circuito aumenta y el voltaje se mantiene constante, según la Ley de Ohm, la corriente: A) aumenta  B) disminuye  C) se mantiene igual  D) se vuelve cero","d":"Respuesta correcta: B. La Ley de Ohm es I=V/R: si V no cambia y R aumenta, el cociente (la corriente I) necesariamente disminuye."},
    {"t":"Pregunta 9. La capa de la atmósfera donde ocurren los fenómenos climáticos (lluvia, viento) es la: A) estratosfera  B) troposfera  C) ionosfera  D) exosfera","d":"Respuesta correcta: B. La troposfera es la capa más baja de la atmósfera, donde se concentra la mayor parte del vapor de agua y ocurre la dinámica del clima; las otras capas están mucho más arriba y no generan estos fenómenos."},
    {"t":"Pregunta 10. Dos especies que compiten por el mismo recurso limitado en un ecosistema establecen una relación de: A) mutualismo  B) depredación  C) competencia  D) comensalismo","d":"Respuesta correcta: C. El mutualismo beneficia a ambas especies, la depredación implica que una se alimenta de otra, y el comensalismo beneficia a una sin afectar a la otra — competir por un mismo recurso limitado es, por definición, competencia."}
  ]}
]$m4$::jsonb
 WHERE course_id = '4d2af3cd-767e-4e14-a364-23fd596ada10'
   AND title = 'Primera ronda de hipótesis'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 5: Pausa activa en el laboratorio — banco SOLO físicas ─────────
UPDATE public.course_modules
   SET content = $m5$[
  {"text":"01:10–01:20 · 10 min","type":"intro","title":"Pausa activa en el laboratorio"},
  {"icon":"🗣️","text":"“Pausa activa en el laboratorio.”","type":"callout","title":"Frase de apertura"},
  {"text":"Actividad de reactivación — del banco, trae únicamente las que impliquen movimiento.","type":"text","title":"Qué es este bloque"},
  {"text":"A esta altura la atención decae: prioriza movimiento real, no otro ejercicio de escritorio. — Sirve de puente antes del bloque más largo y exigente de la sesión.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de actividades físicas","label":"Ver banco de actividades 🤸","openLabel":"Cerrar banco","icon":"🤸","items":[
    {"t":"Estiramiento guiado de pie (2 min)","d":"De pie junto a su puesto, el grupo sigue una secuencia corta guiada por el tutor: brazos arriba, giro de hombros, estiramiento lateral del cuello. No requiere materiales ni espacio adicional."},
    {"t":"El barco se hunde (4 min)","d":"El tutor da instrucciones tipo 'formen grupos de 3' o 'toquen algo de color azul' y el grupo debe moverse rápido para cumplirlas; quien se quede sin grupo o sin tocar el objeto sigue jugando proponiendo la siguiente instrucción. Clásico energizante que solo necesita espacio para moverse."},
    {"t":"Simón dice (3 min)","d":"El tutor da órdenes de movimiento ('salten', 'toquen su cabeza') pero el grupo solo debe obedecer si la orden empieza con 'Simón dice'; quien se equivoque da una palmada y sigue en el juego. Ritmo rápido, ideal para recuperar energía."},
    {"t":"Caminata cruzada (2 min)","d":"De pie, cada persona toca su rodilla derecha con la mano izquierda y luego la rodilla izquierda con la mano derecha, repitiendo el patrón por unos 20 segundos. Es un ejercicio de coordinación cruzada que ayuda a reactivar la atención sin necesitar espacio."}
  ]}
]$m5$::jsonb
 WHERE course_id = '4d2af3cd-767e-4e14-a364-23fd596ada10'
   AND title = 'Pausa activa en el laboratorio'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 6: El experimento a fondo — banco nivel alto (10) ───────────────
UPDATE public.course_modules
   SET content = $m6$[
  {"text":"01:20–02:00 · 40 min","type":"intro","title":"El experimento a fondo"},
  {"icon":"🗣️","text":"“El experimento a fondo. Aquí se prueba todo lo aprendido.”","type":"callout","title":"Frase de apertura"},
  {"text":"Preguntas de nivel alto con retroalimentación — sugerido 8 a 12 preguntas del banco.","type":"text","title":"Qué es este bloque"},
  {"text":"Es el bloque más largo de toda la sesión: resérvalo para cuando el grupo ya calentó motores en el bloque anterior. — Misma retroalimentación inmediata que en la ronda anterior.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de preguntas — nivel alto (10)","label":"Ver banco de preguntas 🧪","openLabel":"Cerrar banco","icon":"🧪","items":[
    {"t":"Pregunta 1. Un resorte se estira 0,1 m al aplicarle una fuerza de 20 N. Según la Ley de Hooke, ¿cuál es la constante elástica del resorte? A) 200 N/m  B) 20 N/m  C) 2 N/m  D) 2.000 N/m","d":"Respuesta correcta: A) 200 N/m. La Ley de Hooke es F=kx, así que k=F/x=20/0,1=200 N/m. Las demás opciones surgen de errores al mover el punto decimal al dividir."},
    {"t":"Pregunta 2. En una reacción, 2 moles de H₂ reaccionan con 1 mol de O₂ para formar 2 moles de H₂O. Si se dispone de 4 moles de H₂ y suficiente O₂, ¿cuántos moles de agua se producen? A) 4  B) 2  C) 8  D) 1","d":"Respuesta correcta: A) 4 moles. La proporción entre H₂ y H₂O en la ecuación balanceada es 2:2, es decir 1:1 — por cada mol de H₂ que reacciona se produce un mol de H₂O, así que 4 moles de H₂ producen 4 moles de H₂O."},
    {"t":"Pregunta 3. La primera ley de la termodinámica establece que la energía: A) siempre aumenta en un sistema aislado  B) no se crea ni se destruye, solo se transforma  C) se destruye gradualmente con el tiempo  D) solo se transfiere en forma de calor","d":"Respuesta correcta: B. Es el principio de conservación de la energía: la energía total de un sistema aislado permanece constante, aunque cambie de una forma a otra (por ejemplo, de cinética a calor)."},
    {"t":"Pregunta 4. Un ecosistema donde la eliminación de un depredador tope provoca un aumento descontrolado de una especie herbívora, que a su vez agota la vegetación, ejemplifica: A) mutualismo  B) una cascada trófica  C) comensalismo  D) simbiosis obligada","d":"Respuesta correcta: B. Una cascada trófica es justamente el efecto en cadena que se propaga por varios niveles de la red alimenticia cuando se altera uno de sus eslabones — en este caso, al quitar el depredador tope."},
    {"t":"Pregunta 5. ¿Por qué el agua líquida es más densa que el hielo? A) porque el hielo tiene menos moléculas de agua  B) porque la estructura cristalina del hielo deja más espacio vacío entre las moléculas  C) porque el hielo está más caliente que el agua líquida  D) porque el agua líquida tiene una composición química diferente a la del hielo","d":"Respuesta correcta: B. Al congelarse, las moléculas de agua forman una red cristalina abierta (por los puentes de hidrógeno) que ocupa más volumen que en estado líquido — por eso el hielo flota, siendo menos denso, no porque tenga 'menos moléculas' ni una composición distinta."},
    {"t":"Pregunta 6. Durante la meiosis, a diferencia de la mitosis, el número de cromosomas de las células resultantes: A) se duplica  B) se reduce a la mitad  C) permanece igual  D) se vuelve cero","d":"Respuesta correcta: B. La meiosis produce células con la mitad de cromosomas (células sexuales), a diferencia de la mitosis, que produce células con el mismo número de cromosomas que la célula original."},
    {"t":"Pregunta 7. Un objeto se mueve en línea recta con velocidad constante. La fuerza neta que actúa sobre él es: A) igual a su masa por su velocidad  B) cero, según la primera ley de Newton  C) siempre positiva  D) proporcional a la distancia recorrida","d":"Respuesta correcta: B. La primera ley de Newton (inercia) establece que un cuerpo con velocidad constante (incluyendo el reposo) no experimenta fuerza neta — si hubiera fuerza neta, el objeto aceleraría o desaceleraría."},
    {"t":"Pregunta 8. En la tabla periódica, los elementos de un mismo grupo (columna) comparten principalmente: A) el mismo número de neutrones  B) el mismo número de electrones de valencia, lo que les da propiedades químicas similares  C) la misma masa atómica  D) el mismo estado de la materia a temperatura ambiente","d":"Respuesta correcta: B. Los elementos de un mismo grupo tienen configuraciones electrónicas externas similares (mismo número de electrones de valencia), lo que explica que reaccionen químicamente de forma parecida — no comparten necesariamente neutrones, masa ni estado físico."},
    {"t":"Pregunta 9. Si la frecuencia de una onda aumenta y su velocidad de propagación se mantiene constante, ¿qué sucede con su longitud de onda? A) aumenta  B) disminuye  C) se mantiene igual  D) se vuelve cero","d":"Respuesta correcta: B. La relación es v=λf (velocidad = longitud de onda × frecuencia). Si v es constante y f aumenta, λ debe disminuir para que el producto siga siendo el mismo."},
    {"t":"Pregunta 10. La selección natural, como la describió Darwin, actúa principalmente sobre: A) el deseo de un organismo de adaptarse  B) la variación heredable que ya existe en una población y que afecta la supervivencia y reproducción  C) cambios que un organismo decide hacer durante su vida  D) la extinción total e inmediata de las especies menos aptas","d":"Respuesta correcta: B. La selección natural no depende de que un organismo 'decida' cambiar (esa es una idea lamarckiana, no darwiniana): actúa sobre variaciones que YA EXISTEN de forma heredable en la población, favoreciendo a quienes sobreviven y se reproducen más en su ambiente."}
  ]}
]$m6$::jsonb
 WHERE course_id = '4d2af3cd-767e-4e14-a364-23fd596ada10'
   AND title = 'El experimento a fondo'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;
