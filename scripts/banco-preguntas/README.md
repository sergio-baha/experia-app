# Banco de preguntas de las rondas en vivo

Convierte los Word del equipo académico en `src/lib/questionBank.json` (lo que
lee el editor de ruta) y en las imágenes de `public/preguntas/`.

```bash
pip install pillow                      # una sola vez
python scripts/banco-preguntas/build.py # Word → banco + imágenes
node scripts/build-rondas.mjs           # banco → migración 0075 (rondas predeterminadas)
node scripts/test-migraciones/run-rondas.mjs   # probar la migración antes de correrla
node scripts/test-migraciones/run-rondas-matematicas.mjs   # 0080
```

## Fuente

`scripts/data/banco-preguntas/`: `matematicas.docx`, `lectura-critica.docx`,
`ciencias-naturales.docx` (biología, química y física en un solo documento, en
dos partes). Las claves salen de las tablas de respuestas de cada documento.

## Qué hace cada paso

| Script | Qué hace |
|---|---|
| `dump.py` | Vuelca el .docx a texto: listas, tablas, imágenes y ecuaciones (OMML → texto lineal). |
| `parse.py` | Separa pregunta por pregunta, opciones, clave, justificación y los textos de lectura compartidos. |
| `curate.py` | Lo editorial: correcciones de transcripción, **pistas** (las escribe el script, una por pregunta), explicaciones de Ciencias parte 1, preguntas a revisar, dificultad, tiempos y rondas predeterminadas. |

## Decisiones que conviene saber

- **Dificultad al azar (provisional).** El equipo académico aún no la definió:
  `curate.py` la asigna con semilla fija (`random.Random(2026)`), así que
  regenerar no la baraja de nuevo. Cuando llegue la real, ponerla por id en
  `curate.py` en vez del azar.
- **Preguntas corregidas respecto al Word** (en `FIX`, con un comentario cada
  una): bio-05 (“depredación” → mimetismo engañoso) y qui-10 (dos respuestas
  posibles: mercurio → hierro y datos reales del cloro). En fis-21 se quitó la
  imagen porque dibujaba la desviación al revés de la clave. En Matemáticas,
  mate-08 (el Word perdió el “= −” de las opciones A y C) y mate-47 (decía
  10³ = 1/1₀ en vez de I/I₀). Si aparece otra pregunta dudosa, `REVIEW` la deja
  en el banco con "⚠️ Revisar" y fuera de las rondas predeterminadas.
- **Ids estables** (`mat-01`, `lec-37`…): son el id de la pregunta dentro del
  módulo. Cambiar el orden del Word cambia los ids — si ya hay rondas en uso,
  agregar las preguntas nuevas al final.
- **Lectura**: cada pregunta lleva su texto copiado (`passage`), porque en el
  módulo las preguntas se eligen sueltas.
- **Matemáticas** (`matematicas.docx`, 50 preguntas tipo Saber, oct 2026;
  reemplazó al documento de 20). El Word trae solo la clave (tabla final): las
  **explicaciones** y las pistas las escribe `curate.py`, y cada clave se
  verificó resolviendo la pregunta.
  - Ids **`mate-NN`** (= número de la pregunta en el Word), distintos de los
    `mat-NN` del banco anterior: el análisis de ítems agrupa por id y no debe
    mezclar respuestas de preguntas distintas.
  - Los bloques “RESPONDE LAS PREGUNTAS 4 A 6…” (y 9 a 13) van como texto de
    apoyo (`passageId` `mp-01`, `mp-02`), igual que en Lectura.
  - Las preguntas con **opciones gráficas** (12, 33, 42, 43) llevan una
    imagen por opción (`optionImages`, en `OPTION_IMAGES`) con el texto de la
    opción vacío. La 24 trae tres figuras en el enunciado y se publican en una
    sola imagen, en fila (`COMPOSITES`): una pregunta tiene una sola imagen de
    enunciado.
  - La figura de la 44 (rueda giratoria) no venía en el Word: llegó aparte y
    vive en `scripts/data/banco-preguntas/extra/mate-44.png` (`EXTRA_IMGS`).
  - Fórmulas que en texto plano quedaban ambiguas van en LaTeX (`\( … \)`,
    KaTeX). Dificultad al azar con **su propio generador**, para no barajar la
    de las otras asignaturas.
  - Rondas: primera = 1–8, 14, 15; final = 9–13, 16–20 (los bloques de
    información compartida no se parten). Las cambia en la base de datos
    `0080_rondas_matematicas_nuevo_banco.sql`.
- **Migraciones ya aplicadas no se reescriben**: `build-rondas.mjs` solo
  escribe 0075/0078/0080 si no existen (`--force` para regenerarlas). Un cambio
  del banco después de aplicarlas va en una migración nueva.
- **Ciencias Sociales** (`sociales.docx`, 49 preguntas) trae la **dificultad
  real**, la competencia y la afirmación de cada pregunta en su tabla final:
  se usan tal cual (no consume el azar, así que agregarla no cambió la
  dificultad de las otras asignaturas). La pregunta 16 venía en un solo
  párrafo y se reescribe en `FIX`. Sus rondas van en `0078_rondas_sociales.sql`
  (`node scripts/build-rondas.mjs` la genera junto con 0075).
