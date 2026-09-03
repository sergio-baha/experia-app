-- ============================================================
-- 0064_llenar_pendientes_matematicas.sql
-- Reemplaza los 5 avisos "Pendiente" del fork "Sala de Escape -
-- Matematicas — mi versión" con el contenido real que cada uno pedía:
--
--   order 1 "Encender la sala"          -> banco de actividades rompehielo
--   order 3 "Las reglas del escape"     -> estructura de la Prueba Saber (Matemáticas)
--   order 5 "Primera ronda de candados" -> banco de 10 preguntas nivel medio-alto
--   order 7 "Recarga de energía"        -> banco de actividades SOLO físicas
--   order 8 "Los candados finales"      -> banco de 10 preguntas nivel alto
--
-- Las 20 preguntas son originales (no salen del docx de simulacro, que solo
-- traía 2) y cada una fue resuelta y verificada a mano antes de escribirla
-- aquí — ver la respuesta correcta + por qué fallan las demás en cada "d".
--
-- Cada UPDATE reemplaza el array `content` COMPLETO del módulo (conservando
-- intactos los primeros 4 bloques, solo se sustituye el quinto, el
-- callout "Pendiente"). El WHERE exige que el contenido actual TODAVÍA
-- tenga ese aviso, así que es idempotente y no pisa una edición manual
-- posterior desde el editor de ruta.
--
-- EJECUTAR en Supabase SQL Editor (Dashboard > SQL Editor).
-- ============================================================

-- ── Módulo 1: Encender la sala — banco de actividades rompehielo ───────────
UPDATE public.course_modules
   SET content = $m1$[
  {"text":"00:00–00:10 · 10 min","type":"intro","title":"Encender la sala"},
  {"icon":"🗣️","text":"“Encendamos la sala: el reloj ya empezó a correr.”","type":"callout","title":"Frase de apertura"},
  {"text":"Actividad rompehielo — cognitiva o física, a elección del tutor.","type":"text","title":"Qué es este bloque"},
  {"text":"Elige la dinámica según la energía con la que llega el grupo: cognitiva si necesitan enfocarse, física si llegan dispersos. — Debe ser corta y de instrucciones simples: el grupo apenas está entrando.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de actividades rompehielo","label":"Ver banco de actividades 🎲","openLabel":"Cerrar banco","icon":"🎲","items":[
    {"t":"Uno, dos, tres… conmigo (física, 2 min)","d":"En parejas, uno hace un gesto simple (aplaudir, chasquear, saltar) y el otro lo repite lo más rápido posible; cada 3 rondas cambian de pareja. Sirve para activar el cuerpo sin necesitar espacio ni materiales."},
    {"t":"La palabra encadenada (cognitiva, 3 min)","d":"En círculo, cada persona dice una palabra relacionada con matemáticas que empiece con la última letra de la palabra anterior (ej. 'suma' → 'ángulo' → 'ocho'). Quien se demore más de 5 segundos o repita una palabra sigue en el juego, pero propone la siguiente categoría."},
    {"t":"Sondeo rápido de manos (cognitiva/social, 2 min)","d":"El tutor lanza preguntas rápidas de sí o no relacionadas con la sesión ('¿quién ya presentó la Prueba Saber?', '¿a quién le gusta más la geometría que el álgebra?') y el grupo responde levantando la mano. Sin materiales, ideal para grupos grandes."},
    {"t":"Espejo en parejas (física, 3 min)","d":"En parejas, uno hace movimientos lentos con brazos y manos mientras el otro los imita como un espejo; a la mitad del tiempo intercambian el rol de quien dirige. Ayuda a bajar la tensión inicial con humor."},
    {"t":"Bingo de presentación express (cognitiva/social, 5 min)","d":"Se reparte una cuadrícula con frases cortas ('le gusta la geometría', 'ha enseñado más de 10 años', 'prefiere el álgebra'); cada quien debe conseguir la firma de un colega distinto por cada casilla que le aplique. Gana quien complete una línea primero. Requiere imprimir la cuadrícula con anticipación."}
  ]}
]$m1$::jsonb
 WHERE course_id = '88136e1a-4564-45bd-b514-0ad6690b182c'
   AND "order" = 1
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 3: Las reglas del escape — estructura de la Prueba Saber ────────
UPDATE public.course_modules
   SET content = $m3$[
  {"text":"00:10–00:25 · 15 min","type":"intro","title":"Las reglas del escape"},
  {"icon":"🗣️","text":"“Antes de los candados, las reglas del escape.”","type":"callout","title":"Frase de apertura"},
  {"text":"Explicación de la estructura de la Prueba Saber — contenido estandarizado por asignatura.","type":"text","title":"Qué es este bloque"},
  {"text":"Se apoya en el material único del área, distribuido aparte. — Objetivo del bloque: que el grupo reconozca secciones, tipos de pregunta y forma de puntuar antes de practicar.","type":"text","title":"Cómo ejecutarlo"},
  {"text":"Antes de practicar con las preguntas de las siguientes salas, conviene que el grupo reconozca cómo está armada la prueba real — así entienden qué se les va a exigir y por qué las preguntas se sienten como se sienten.","type":"text","title":"Antes de empezar"},
  {"type":"steps","title":"Estructura de la Prueba Saber — Matemáticas","items":[
    {"icon":"📝","t":"Formato de las preguntas","d":"Selección múltiple con única respuesta, cuatro opciones marcadas A, B, C y D. No hay penalización por responder incorrectamente, así que siempre conviene marcar una opción aunque haya duda."},
    {"icon":"🧠","t":"Competencias evaluadas","d":"Las preguntas de matemáticas se agrupan en tres competencias: interpretación y representación (leer e interpretar información matemática), formulación y ejecución (plantear y resolver un procedimiento), y argumentación (justificar por qué un procedimiento o resultado es válido)."},
    {"icon":"🌎","t":"Contextos de las preguntas","d":"Cada pregunta se plantea en un contexto — personal, laboral u ocupacional, comunitario o científico — para evaluar si el estudiante puede aplicar las matemáticas a situaciones reales, no solo repetir un procedimiento memorizado."},
    {"icon":"📊","t":"Cómo se califica","d":"El puntaje NO es un simple porcentaje de aciertos: se calcula con un modelo estadístico (Teoría de Respuesta al Ítem) que pondera la dificultad de cada pregunta, y se reporta en una escala de 0 a 100. Por eso dos personas con el mismo número de aciertos pueden obtener puntajes distintos si acertaron preguntas de diferente dificultad."}
  ]}
]$m3$::jsonb
 WHERE course_id = '88136e1a-4564-45bd-b514-0ad6690b182c'
   AND "order" = 3
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 5: Primera ronda de candados — banco nivel medio-alto (10) ──────
UPDATE public.course_modules
   SET content = $m5$[
  {"text":"00:35–01:10 · 35 min","type":"intro","title":"Primera ronda de candados"},
  {"icon":"🗣️","text":"“Primera ronda de candados. Calculen, no adivinen.”","type":"callout","title":"Frase de apertura"},
  {"text":"Preguntas de nivel medio-alto con retroalimentación inmediata — sugerido 10 a 12 preguntas del banco.","type":"text","title":"Qué es este bloque"},
  {"text":"Retroalimenta cada pregunta o cada bloque corto: no acumules toda la retro para el final. — Ritmo sugerido: cerca de 3 minutos por pregunta, entre responder y retroalimentar.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de preguntas — nivel medio-alto (10)","label":"Ver banco de preguntas 🔐","openLabel":"Cerrar banco","icon":"🔐","items":[
    {"t":"Pregunta 1. Un colegio tiene 300 estudiantes. El 40% practica algún deporte, y de esos, el 25% juega fútbol. ¿Cuántos estudiantes juegan fútbol? A) 30  B) 120  C) 75  D) 45","d":"Respuesta correcta: A) 30. El 40% de 300 es 120 (los que practican deporte), y el 25% de esos 120 es 30. B) se queda solo con el primer filtro (120) y olvida aplicar el segundo porcentaje. C) aplica el 25% directo sobre los 300, sin condicionar primero a quienes practican deporte. D) es un desliz aritmético que no corresponde a ninguna de las dos operaciones."},
    {"t":"Pregunta 2. La suma de tres números impares consecutivos es 63. ¿Cuál es el mayor de los tres? A) 23  B) 22  C) 21  D) 19","d":"Respuesta correcta: A) 23. Si n, n+2 y n+4 son los tres impares consecutivos, 3n+6=63, entonces n=19 y los números son 19, 21 y 23. B) sale de tratarlos como consecutivos comunes (n, n+1, n+2) en vez de impares, un error frecuente. C) es el número del medio, no el mayor. D) es el menor de los tres, confundiendo 'mayor' con 'primero'."},
    {"t":"Pregunta 3. Un terreno rectangular tiene un perímetro de 60 m. Si el largo es el doble del ancho, ¿cuál es el área del terreno? A) 200 m²  B) 300 m²  C) 150 m²  D) 100 m²","d":"Respuesta correcta: A) 200 m². Del perímetro, largo+ancho=30; como el largo es el doble del ancho, el ancho es 10 m y el largo 20 m, así que el área es 10×20=200 m². Las demás opciones salen de despejar mal la relación entre largo y ancho o de confundir el semiperímetro con un solo lado."},
    {"t":"Pregunta 4. Las calificaciones de 7 estudiantes fueron: 2, 3, 3, 4, 5, 5, 9. ¿Cuál afirmación es verdadera? A) La media es mayor que la mediana  B) La media es menor que la mediana  C) La media es igual a la mediana  D) No se puede calcular la mediana","d":"Respuesta correcta: A. La media es (2+3+3+4+5+5+9)/7 ≈ 4,43, y la mediana (el valor central al ordenar los 7 datos) es 4. El valor atípico 9 arrastra la media hacia arriba sin mover la mediana, que es más resistente a valores extremos — por eso ambas medidas no siempre coinciden en distribuciones con datos alejados del resto."},
    {"t":"Pregunta 5. Un tanque tiene 40 litros de agua y se llena a razón de 15 litros por minuto. ¿Cuántos litros habrá después de 8 minutos? A) 160  B) 120  C) 200  D) 150","d":"Respuesta correcta: A) 160 litros. Se parte de los 40 litros iniciales y se suma lo que entra en 8 minutos: 40+15×8=40+120=160. B) olvida sumar los 40 litros iniciales. C) y D) corresponden a multiplicaciones incorrectas de la tasa por el tiempo."},
    {"t":"Pregunta 6. Una bolsa tiene 5 fichas rojas, 3 azules y 2 verdes. Se saca una ficha al azar. ¿Cuál es la probabilidad de que NO sea roja? A) 1/2  B) 3/10  C) 1/5  D) 4/5","d":"Respuesta correcta: A) 1/2. Hay 10 fichas en total y 5 son rojas, así que P(roja)=5/10=1/2, y P(no roja) es su complemento, también 1/2. B) es la probabilidad de sacar azul, y C) la de sacar verde — ambas calculan un solo color en vez del complemento de rojo."},
    {"t":"Pregunta 7. En una tienda, 3 cuadernos y 2 lápices cuestan $16.000, y 1 cuaderno y 4 lápices cuestan $12.000. ¿Cuánto cuesta un cuaderno? A) $4.000  B) $2.000  C) $3.000  D) $6.000","d":"Respuesta correcta: A) $4.000. Resolviendo el sistema (3c+2p=16.000 y c+4p=12.000), se despeja c=12.000-4p, se sustituye y se obtiene p=2.000, con lo que c=4.000. Se puede verificar: 3(4.000)+2(2.000)=16.000. Las demás opciones surgen de despejar la variable equivocada o de un error al sustituir."},
    {"t":"Pregunta 8. Una escalera de 5 m se apoya contra una pared, con la base a 3 m de esta. ¿A qué altura de la pared llega la escalera? A) 4 m  B) 4,5 m  C) 3,5 m  D) 2 m","d":"Respuesta correcta: A) 4 m. Es un triángulo rectángulo con hipotenusa 5 y un cateto 3 (el clásico trío pitagórico 3-4-5): 5²=3²+h² → h²=25-9=16 → h=4. Las demás opciones no satisfacen el teorema de Pitágoras con esos dos valores."},
    {"t":"Pregunta 9. El precio de un producto pasó de $20.000 a $25.000 en un año. ¿Cuál fue el porcentaje de incremento? A) 25%  B) 20%  C) 5%  D) 80%","d":"Respuesta correcta: A) 25%. El aumento fue de $5.000 sobre el valor INICIAL de $20.000: 5.000/20.000=0,25=25%. B) calcula el aumento sobre el precio final en vez del inicial, y C) confunde el valor absoluto del aumento ($5.000) con un porcentaje."},
    {"t":"Pregunta 10. ¿De cuántas formas distintas se pueden ordenar las letras de la palabra 'SOL'? A) 6  B) 3  C) 9  D) 2","d":"Respuesta correcta: A) 6. Con 3 letras distintas, el número de ordenamientos posibles es 3!=3×2×1=6 (SOL, SLO, OSL, OLS, LSO, LOS)."}
  ]}
]$m5$::jsonb
 WHERE course_id = '88136e1a-4564-45bd-b514-0ad6690b182c'
   AND "order" = 5
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 7: Recarga de energía — banco de actividades SOLO físicas ───────
UPDATE public.course_modules
   SET content = $m7$[
  {"text":"01:10–01:20 · 10 min","type":"intro","title":"Recarga de energía"},
  {"icon":"🗣️","text":"“Pausa para recargar energía antes de la sala final.”","type":"callout","title":"Frase de apertura"},
  {"text":"Actividad de reactivación — del banco, trae únicamente las que impliquen movimiento.","type":"text","title":"Qué es este bloque"},
  {"text":"A esta altura la atención decae: prioriza movimiento real, no otro ejercicio de escritorio. — Sirve de puente antes del bloque más largo y exigente de la sesión.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de actividades físicas","label":"Ver banco de actividades 🤸","openLabel":"Cerrar banco","icon":"🤸","items":[
    {"t":"Estiramiento guiado de pie (2 min)","d":"De pie junto a su puesto, el grupo sigue una secuencia corta guiada por el tutor: brazos arriba, giro de hombros, estiramiento lateral del cuello. No requiere materiales ni espacio adicional."},
    {"t":"El barco se hunde (4 min)","d":"El tutor da instrucciones tipo 'formen grupos de 3' o 'toquen algo de color azul' y el grupo debe moverse rápido para cumplirlas; quien se quede sin grupo o sin tocar el objeto sigue jugando proponiendo la siguiente instrucción. Clásico energizante que solo necesita espacio para moverse."},
    {"t":"Simón dice (3 min)","d":"El tutor da órdenes de movimiento ('salten', 'toquen su cabeza') pero el grupo solo debe obedecer si la orden empieza con 'Simón dice'; quien se equivoque da una palmada y sigue en el juego. Ritmo rápido, ideal para recuperar energía."},
    {"t":"Caminata cruzada (2 min)","d":"De pie, cada persona toca su rodilla derecha con la mano izquierda y luego la rodilla izquierda con la mano derecha, repitiendo el patrón por unos 20 segundos. Es un ejercicio de coordinación cruzada que ayuda a reactivar la atención sin necesitar espacio."}
  ]}
]$m7$::jsonb
 WHERE course_id = '88136e1a-4564-45bd-b514-0ad6690b182c'
   AND "order" = 7
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 8: Los candados finales — banco nivel alto (10) ─────────────────
UPDATE public.course_modules
   SET content = $m8$[
  {"text":"01:20–02:00 · 40 min","type":"intro","title":"Los candados finales"},
  {"icon":"🗣️","text":"“Los candados finales. La sala más difícil de todas.”","type":"callout","title":"Frase de apertura"},
  {"text":"Preguntas de nivel alto con retroalimentación — sugerido 8 a 12 preguntas del banco.","type":"text","title":"Qué es este bloque"},
  {"text":"Es el bloque más largo de toda la sesión: resérvalo para cuando el grupo ya calentó motores en el bloque anterior. — Misma retroalimentación inmediata que en la ronda anterior.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de preguntas — nivel alto (10)","label":"Ver banco de preguntas 🔐","openLabel":"Cerrar banco","icon":"🔐","items":[
    {"t":"Pregunta 1. Se quiere preparar 10 litros de una solución al 24% de alcohol mezclando una al 15% con otra al 40%. ¿Cuántos litros de la solución al 40% se necesitan? A) 3,6  B) 4  C) 6,4  D) 2,4","d":"Respuesta correcta: A) 3,6 litros. Si x son los litros al 40% y (10-x) los litros al 15%, se plantea 0,40x+0,15(10-x)=0,24(10), que da 0,25x=0,9 y x=3,6. Las demás opciones no cumplen el balance de concentración al verificarlas en la ecuación."},
    {"t":"Pregunta 2. Un cilindro tiene radio 3 cm y altura 10 cm. Usando π≈3, ¿cuál es su volumen? A) 270 cm³  B) 90 cm³  C) 300 cm³  D) 1.080 cm³","d":"Respuesta correcta: A) 270 cm³. El volumen de un cilindro es π×r²×h=3×3²×10=3×9×10=270. B) olvida elevar al cuadrado el radio, y D) corresponde a usar el diámetro (6 cm) como si fuera el radio."},
    {"t":"Pregunta 3. La altura de un objeto lanzado se modela con h(t)=-5t²+20t, con t en segundos. ¿En qué tiempo alcanza su altura máxima? A) 2 s  B) 4 s  C) 10 s  D) 1 s","d":"Respuesta correcta: A) 2 s. El máximo de una parábola h(t)=at²+bt+c se alcanza en t=-b/(2a)=-20/(2×-5)=2. Las demás opciones no corresponden a ese vértice — por ejemplo, 4 s es cuando el objeto vuelve a tocar el suelo (una raíz de la ecuación), no el punto más alto."},
    {"t":"Pregunta 4. Dos grupos obtuvieron la misma nota promedio, pero el grupo A tiene una desviación estándar mucho mayor que el grupo B. ¿Qué se puede concluir? A) Las notas del grupo A están más dispersas alrededor del promedio que las del grupo B  B) El grupo A tuvo mejor desempeño que el grupo B  C) El grupo B tiene más estudiantes que el grupo A  D) Las notas de A y B son idénticas","d":"Respuesta correcta: A. La desviación estándar mide qué tan dispersos están los datos respecto al promedio, no el nivel de desempeño ni el tamaño del grupo — dos grupos pueden promediar igual y aun así tener una distribución de notas muy distinta (uno más parejo, otro con más extremos)."},
    {"t":"Pregunta 5. Si 8 obreros construyen un muro en 15 días, ¿cuántos días tardarán 12 obreros trabajando al mismo ritmo? A) 10  B) 20  C) 22,5  D) 6","d":"Respuesta correcta: A) 10 días. Es una relación inversamente proporcional: a más obreros, menos días. El trabajo total es 8×15=120 'obrero-días', y con 12 obreros se necesitan 120/12=10 días. B) invierte la proporcionalidad tratándola como directa."},
    {"t":"Pregunta 6. ¿Cuál es la distancia entre los puntos A(1,2) y B(4,6)? A) 5  B) 7  C) 25  D) 6,4","d":"Respuesta correcta: A) 5. Con la fórmula de distancia, d=√((4-1)²+(6-2)²)=√(9+16)=√25=5. C) es el resultado sin la raíz cuadrada final, un error común al aplicar la fórmula."},
    {"t":"Pregunta 7. Se invierten $1.000.000 a interés compuesto del 10% anual. ¿Cuál será el monto aproximado después de 2 años? A) $1.210.000  B) $1.200.000  C) $1.100.000  D) $1.331.000","d":"Respuesta correcta: A) $1.210.000. Con interés compuesto, el monto es 1.000.000×(1,10)²=1.000.000×1,21=1.210.000. B) corresponde a interés SIMPLE (sin capitalizar los intereses del primer año), C) es el monto tras solo 1 año, y D) es el resultado de calcular a 3 años en vez de 2."},
    {"t":"Pregunta 8. Desde un punto en el suelo, a 50 m de la base de un edificio, el ángulo de elevación hasta la parte superior es de 45°. ¿Cuál es aproximadamente la altura del edificio? A) 50 m  B) 25 m  C) 70,7 m  D) 100 m","d":"Respuesta correcta: A) 50 m. Como tan(45°)=1, la altura es igual a la distancia horizontal: h=50×tan(45°)=50×1=50 m. Es un caso particular en que el triángulo formado es isósceles (los dos catetos son iguales)."},
    {"t":"Pregunta 9. De un grupo de 6 candidatos, se deben elegir 2 para representar al curso, sin importar el orden. ¿De cuántas formas se puede hacer la elección? A) 15  B) 30  C) 12  D) 36","d":"Respuesta correcta: A) 15. Como el orden no importa, se usa combinación: C(6,2)=6!/(2!×4!)=15. B) corresponde a la PERMUTACIÓN (6×5=30), que sí tendría en cuenta el orden — por ejemplo, si los 2 elegidos tuvieran roles distintos entre sí."},
    {"t":"Pregunta 10. Un taxi cobra $4.000 de tarifa fija más $1.200 por kilómetro. Si un pasajero dispone de máximo $20.000, ¿cuál es la mayor distancia, en kilómetros completos, que puede recorrer? A) 13  B) 14  C) 16  D) 12","d":"Respuesta correcta: A) 13 km. Se plantea 4.000+1.200k≤20.000, que da k≤13,33. Como el pasajero no puede pagar un kilómetro incompleto que supere su presupuesto, la mayor distancia completa posible es 13 km (14 km costaría 4.000+1.200×14=20.800, más de lo disponible)."}
  ]}
]$m8$::jsonb
 WHERE course_id = '88136e1a-4564-45bd-b514-0ad6690b182c'
   AND "order" = 8
   AND content @> '[{"title":"Pendiente"}]'::jsonb;
