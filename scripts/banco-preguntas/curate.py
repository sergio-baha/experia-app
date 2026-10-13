"""Arma el banco final de preguntas a partir de draft.json (lo llama build.py).
Uso: python curate.py <carpeta_de_trabajo> <repo>
Escribe <repo>/src/lib/questionBank.json y copia las imágenes a <repo>/public/preguntas/.
"""
import json, os, re, sys, random
from PIL import Image, ImageDraw, ImageFont

S, REPO = sys.argv[1], sys.argv[2]
d = json.load(open(os.path.join(S, 'draft.json'), encoding='utf-8'))

AREAS = {
    'matematicas': {'label': 'Matemáticas', 'icon': '🔢'},
    'lectura':     {'label': 'Lectura crítica', 'icon': '📖'},
    'biologia':    {'label': 'Biología', 'icon': '🧬'},
    'quimica':     {'label': 'Química', 'icon': '⚗️'},
    'fisica':      {'label': 'Física', 'icon': '🧲'},
    'sociales':    {'label': 'Ciencias Sociales', 'icon': '🌎'},
}

# ── Imágenes: (carpeta docx, imagen) → nombre publicado ─────────────────────
# Matemáticas: documento de 50 preguntas (oct 2026). Las imágenes del banco
# anterior (visitantes-museo, cuadrado-inscrito…) siguen en public/ porque
# algún módulo editado a mano podría aún usarlas.
IMGS = {
    ('mat', 'image1'): 'matematicas/promedios-cursos',
    ('mat', 'image2'): 'matematicas/franjas-museo',
    ('mat', 'image3'): 'matematicas/capacitacion-informatica',
    ('mat', 'image4'): 'matematicas/portalapices',
    ('mat', 'image5'): 'matematicas/transporte-frutas',
    ('mat', 'image10'): 'matematicas/sombras-postes',
    ('mat', 'image11'): 'matematicas/caja-aristas',
    ('mat', 'image12'): 'matematicas/faros-barco',
    ('mat', 'image13'): 'matematicas/publicidad-ganancias',
    ('mat', 'image14'): 'matematicas/triangulo-corte',
    ('mat', 'image15'): 'matematicas/cartabon',
    ('mat', 'image19'): 'matematicas/transporte-intermunicipal',
    ('mat', 'image20'): 'matematicas/cursos-undecimo',
    ('mat', 'image21'): 'matematicas/escalera-muro',
    ('mat', 'image22'): 'matematicas/baraja-poquer',
    ('mat', 'image23'): 'matematicas/procedimientos-ecuacion',
    ('mat', 'image28'): 'matematicas/pedidos-pizzeria',
    ('mat', 'image39'): 'matematicas/empaques-volumen',
    ('mat', 'image29'): 'matematicas/cancha-futbol',
    ('mat', 'image34'): 'matematicas/funcion-5-sobre-x',
    # Imágenes de opción (OPTION_IMAGES, más abajo)
    ('mat', 'image6'): 'matematicas/costos-ciudades-a', ('mat', 'image7'): 'matematicas/costos-ciudades-b',
    ('mat', 'image8'): 'matematicas/costos-ciudades-c', ('mat', 'image9'): 'matematicas/costos-ciudades-d',
    ('mat', 'image24'): 'matematicas/tabla-transporte-a', ('mat', 'image25'): 'matematicas/tabla-transporte-b',
    ('mat', 'image26'): 'matematicas/tabla-transporte-c', ('mat', 'image27'): 'matematicas/tabla-transporte-d',
    ('mat', 'image30'): 'matematicas/maqueta-cancha-a', ('mat', 'image31'): 'matematicas/maqueta-cancha-b',
    ('mat', 'image32'): 'matematicas/maqueta-cancha-c', ('mat', 'image33'): 'matematicas/maqueta-cancha-d',
    ('mat', 'image35'): 'matematicas/grafica-area-a', ('mat', 'image36'): 'matematicas/grafica-area-b',
    ('mat', 'image37'): 'matematicas/grafica-area-c', ('mat', 'image38'): 'matematicas/grafica-area-d',
    ('cie', 'image1'): 'ciencias/glucosa-en-sangre',
    ('cie', 'image2'): 'ciencias/solubilidad-sales',
    ('cie', 'image3'): 'ciencias/ley-de-hooke',
    ('cie', 'image4'): 'ciencias/crecimiento-logistico',
    ('cie', 'image5'): 'ciencias/bloques-polea',
    ('cie', 'image6'): 'ciencias/rampa-resorte',
    ('cie', 'image7'): 'ciencias/circuito-mixto',
    ('cie', 'image9'): 'ciencias/placas-paralelas',
    ('lec', 'image1'): 'lectura/rcp-infografia',
    ('lec', 'image2'): 'lectura/calvin-limonada',
    ('lec', 'image3'): 'lectura/quino-angel',
    ('lec', 'image4'): 'lectura/quino-no-me-grite',
    ('lec', 'image5'): 'lectura/crates-historieta',
    ('lec', 'image6'): 'lectura/oms-transito-infografia',
    ('lec', 'image7'): 'lectura/tetra-pak-anuncio',
    ('lec', 'image8'): 'lectura/mafalda-burocracia',
    ('lec', 'image9'): 'lectura/colmena-anuncio',
    ('soc', 'image1'): 'sociales/caricaturas-la-violencia',
}
used_imgs = set()


def pub(folder, img):
    key = (folder, img)
    if key not in IMGS:
        return None
    used_imgs.add(key)
    return '/preguntas/' + IMGS[key] + '.jpg'


def load_rgb(folder, img):
    im = Image.open(os.path.join(S, 'img', folder, img + '.png'))
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        bg = Image.new('RGB', im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert('RGB')


def save_jpg(im, name):
    dst = os.path.join(REPO, 'public', 'preguntas', name + '.jpg')
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if im.width > 1400:
        im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
    im.save(dst, 'JPEG', quality=84, optimize=True, progressive=True)


def export_images():
    for (folder, img), name in IMGS.items():
        if (folder, img) in used_imgs:
            save_jpg(load_rgb(folder, img), name)


# ── Opciones con imagen ──────────────────────────────────────────────────────
# Preguntas cuyas opciones son gráficas, tablas o diseños: cada opción lleva su
# imagen (optionImages, alineado por índice con options) y el texto va vacío.
OPTION_IMAGES = {
    'mate-12': ['image6', 'image7', 'image8', 'image9'],
    'mate-33': ['image24', 'image25', 'image26', 'image27'],
    'mate-42': ['image30', 'image31', 'image32', 'image33'],
    'mate-43': ['image35', 'image36', 'image37', 'image38'],
}

# ── Varias figuras del enunciado → una sola imagen ───────────────────────────
# Una pregunta lleva UNA imagen de enunciado: la 24 trae tres figuras y se
# publican en fila. (compose también arma rejillas A–D, hoy sin uso: las
# opciones gráficas van en OPTION_IMAGES.)
COMPOSITES = {
    'mate-24': ('matematicas/figuras-eloisa', ['image16', 'image17', 'image18'], []),
}


def _font(size):
    for f in ('arialbd.ttf', 'DejaVuSans-Bold.ttf'):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default(size=size)


def compose(qid):
    name, top, opts = COMPOSITES[qid]
    pad, gap = 24, 28
    # Figuras del enunciado a la misma altura (vienen a escalas muy distintas).
    tops = [load_rgb('mat', i) for i in top]
    th = 260 if len(tops) > 1 else 2 * max((t.height for t in tops), default=0)
    tops = [t.resize((round(t.width * th / t.height), th), Image.LANCZOS) for t in tops]
    cells = [load_rgb('mat', i) for i in opts]
    cw = max((c.width for c in cells), default=0) * 2
    cells = [c.resize((cw, round(c.height * cw / c.width)), Image.LANCZOS) for c in cells]
    ch = max((c.height for c in cells), default=0)
    lab = 56
    grid_w = 2 * cw + gap if cells else 0
    grid_h = 2 * (ch + lab) + gap if cells else 0
    top_w = sum(t.width for t in tops) + gap * max(0, len(tops) - 1)
    W = max(top_w, grid_w) + 2 * pad
    H = pad + (th + gap if tops else 0) + grid_h + pad
    out = Image.new('RGB', (W, H), 'white')
    d = ImageDraw.Draw(out)
    x, y = (W - top_w) // 2, pad
    for t in tops:
        out.paste(t, (x, y)); x += t.width + gap
    if tops and cells:
        y += th + gap // 2
        d.line([(pad, y), (W - pad, y)], fill=(200, 200, 200), width=2)
        y += gap // 2
    gx = (W - grid_w) // 2
    f = _font(40)
    for k, c in enumerate(cells):
        cx, cy = gx + (k % 2) * (cw + gap), y + (k // 2) * (ch + lab + gap)
        d.text((cx, cy), 'ABCD'[k], font=f, fill=(30, 30, 30))
        out.paste(c, (cx, cy + lab))
    save_jpg(out, name)
    return '/preguntas/' + name + '.jpg'


# ── Química/física: fórmulas que en el Word venían como texto plano ─────────
SUBS = [
    ('Si3N4', 'Si₃N₄'), ('N2O4', 'N₂O₄'), ('NO2', 'NO₂'), ('C6H12O6', 'C₆H₁₂O₆'),
    ('CH3-CH2-CH2-OH', 'CH₃–CH₂–CH₂–OH'), ('CH3-O-CH2-CH3', 'CH₃–O–CH₂–CH₃'),
    ('Cu2+', 'Cu²⁺'), ('Zn2+', 'Zn²⁺'), ('Cu0', 'Cu⁰'), ('Zn0', 'Zn⁰'), ('2e-', '2e⁻'),
    ('Al3+', 'Al³⁺'), ('Na+/K+', 'Na⁺/K⁺'), ('(Na+)', '(Na⁺)'), ('Na+/glucosa', 'Na⁺/glucosa'),
    ('CO2', 'CO₂'), ('O2', 'O₂'), ('N2', 'N₂'), ('ΔH1', 'ΔH₁'), ('ΔH2', 'ΔH₂'),
    ('[A]^2', '[A]²'), ('<=>', '⇌'), ('K_ps', 'Kps'), ('Q_ps', 'Qps'),
]


def chem(t):
    for a, b in SUBS:
        t = t.replace(a, b)
    return t


TYPOS = {'proble máticas': 'problemáticas', 'funda mentales': 'fundamentales', 'más afin ': 'más afín ', 'Jordanía': 'Jordania'}


def tidy(t):
    for a, b in TYPOS.items():
        t = t.replace(a, b)
    t = re.sub(r'\(\s+', '(', t)
    t = re.sub(r'\s+([.,;:?)])', r'\1', t)
    return re.sub(r'[ \t]+', ' ', t).strip()


# ── Pistas: las dice el tutor del curso durante la pregunta en vivo ─────────
HINTS = {
    # Matemáticas (documento de 50 preguntas, oct 2026). Ids "mate-NN" = número
    # de la pregunta en el Word; distintos de los "mat-NN" del banco anterior
    # para que el análisis de ítems no mezcle respuestas de preguntas distintas.
    'mate-01': 'Como todos los cursos tienen el mismo número de estudiantes, compara la SUMA de los promedios de cada año.',
    'mate-02': 'Si la tasa de cambio no se mueve, ¿pasar la inversión a pesos cambia el porcentaje de ganancia?',
    'mate-03': 'Las franjas no tienen que llenarse por completo: ¿qué pasa si cambias la franja más cara por otra?',
    'mate-04': 'Calcula cuánto cuesta un curso del módulo I y cuántos cursos se pagan con $ 4.200.000.',
    'mate-05': '50 personas no caben en un solo curso: ¿cuántos cursos se necesitan y cuánto vale cada uno?',
    'mate-06': '40 funcionarios necesitan 2 cursos. ¿Cuánto costó entonces cada curso?',
    'mate-07': 'Si los lados se multiplican por 3/4, ¿por cuánto se multiplica el área de un cuadrado?',
    'mate-08': 'La temperatura BAJA al subir: el término de la altitud debe restar. Prueba cada expresión con 1.000 m.',
    'mate-09': 'Calcula en cada ciudad lo que se recibe y lo que se gasta: 6 toneladas necesitan 2 camiones y 4 trabajadores.',
    'mate-10': 'Sigue los pasos: 15 toneladas, $ 600.000 de diferencia por tonelada… y son 3 camiones con 2 trabajadores cada uno.',
    'mate-11': 'El bono solo cuenta grupos completos de 5 toneladas: de 47, ¿cuántas entran?',
    'mate-12': '7 toneladas también necesitan 2 camiones. Calcula transporte y trabajadores en cada ciudad.',
    'mate-13': 'Cada camión lleva máximo 5 toneladas. ¿Qué puedes deducir de 150 toneladas?',
    'mate-14': 'Aumentar un lado en 100 % es multiplicarlo por 2. ¿Qué le pasa a base × altura?',
    'mate-15': 'Los rayos del sol llegan paralelos a los dos postes.',
    'mate-16': 'Un promedio no dice cuántas personas están por encima o por debajo de 1,80 m.',
    'mate-17': 'Cuenta cuántas aristas tiene la caja: ¿cuántas miden l, cuántas a y cuántas h?',
    'mate-18': 'Usa el triángulo de la derecha: conoces el lado que mide 1 y sus ángulos de 60° y 75°. Ley del seno.',
    'mate-19': 'Si P anota x puntos más, Q anota (3/2)x. Escribe el marcador de cada robot e iguálalos.',
    'mate-20': 'Prueba cada función con los tres años de la tabla: la correcta debe cumplirse en todos.',
    'mate-21': 'Si hay 3 veces más sillas que mesas, ¿cuál se multiplica por 3: M o S?',
    'mate-22': 'Despeja h: 120 × 0,71. Luego divide entre 2.',
    'mate-23': 'Si la hipotenusa es el doble del cateto menor, el triángulo es de 30°, 60° y 90°. Usa tan 60°.',
    'mate-24': 'Haz como Eloísa: mueve los triángulos que rodean el cuadrado. ¿Cuántos cuadrados iguales al sombreado se forman?',
    'mate-25': '¿Cuántos dígitos puedes poner en la primera posición? ¿Y en la segunda, si no se pueden repetir?',
    'mate-26': 'Suma los porcentajes de bus, microbús y buseta, y compáralo con el 50 %.',
    'mate-27': '¿Hay números entre 10,49 y 10,50? Piensa en milésimas.',
    'mate-28': 'Probabilidad = casos favorables ÷ casos posibles. ¿De dónde sale 45/75?',
    'mate-29': 'Coseno = cateto adyacente ÷ hipotenusa. ¿Qué cateto toca el ángulo θ?',
    'mate-30': 'Probabilidad cero significa que NO existe ninguna carta con las dos características.',
    'mate-31': 'Revisa cada procedimiento: ¿alguien cambió un producto por una suma?',
    'mate-32': 'Si el eje y parte la figura en dos mitades iguales, cada vértice tiene su reflejo: cambia el signo de x.',
    'mate-33': 'De 100 personas, ¿cuántas son mujeres y cuántas de ellas van en bus? Haz lo mismo con los hombres.',
    'mate-34': 'Aumentar 20 dB es aplicar DOS veces el aumento de 10 dB.',
    'mate-35': 'Los pasos 1 y 2 calculan el 90 % del precio original. ¿Qué deberían hacer los pasos 3 y 4?',
    'mate-36': 'Cuenta cuántas bolas hay de cada color.',
    'mate-37': 'Tres puntos forman un triángulo, o un segmento si están alineados. ¿Qué segmento podría ser?',
    'mate-38': 'Nadie eligió las dos bebidas. ¿Cuántos clientes NO pidieron bebida?',
    'mate-39': 'Calcula cada caso: tres dígitos 10 × 10 × 10; distintos 10 × 9 × 8; hay 26 mayúsculas y 26 minúsculas.',
    'mate-40': 'Para que k + 1/j sea menor que k + 1/11, ¿cómo tiene que ser j? ¿Cuántos enteros cumplen eso?',
    'mate-41': 'En todo triángulo, la suma de dos lados debe ser mayor que el tercero.',
    'mate-42': 'Divide 100 m y 60 m entre 100 y pasa el resultado a centímetros.',
    'mate-43': 'Simplifica: x · (5/x) = ?',
    'mate-44': 'Primero el ángulo: 2π ÷ 10 con π = 3. Luego reemplaza en S = r²θ/2 con r = 3.',
    'mate-45': 'El orden no importa: elige 2 de 5 en décimo, 3 de 4 en undécimo, y multiplica.',
    'mate-46': 'Ganar la consola es ganar el juego 1 Y el juego 2. ¿Cuál es el evento contrario?',
    'mate-47': 'Si 10³ = I / I₀, despeja I.',
    'mate-48': 'Después del 2, ¿cuánto deben sumar las otras dos balotas en cada caso? Cuenta las formas.',
    'mate-49': 'Valorizarse un 5 % cada año es multiplicar por 1,05 cada año.',
    'mate-50': 'Calcula los volúmenes con r = L = 3/2 y h = 2: cilindro πr²h, caja L²h, esfera (4/3)πr³.',

    'bio-01': 'Compara los 2 mg/L con el límite de 4 mg/L que señalan los investigadores.',
    'bio-02': 'Para poner a prueba una hipótesis necesitas dos grupos que solo se diferencien en lo que quieres probar.',
    'bio-03': 'El agua se mueve hacia donde hay más sal. ¿En qué solución entra agua a la célula y en cuál sale?',
    'bio-04': 'En la tabla, sobrevivir mucho significa ser resistente: busca el porcentaje más alto.',
    'bio-05': 'Pregúntate quién gana en esta relación: ¿la orquídea, el insecto o los dos? ¿Alguien se come a alguien?',
    'bio-06': 'Ni el agua ni el abono reemplazan lo que impulsa la fotosíntesis.',
    'bio-07': 'Si disminuye un depredador, ¿qué le pasa a la presa que se comía?',
    'bio-08': 'Lo único que cambió entre los dos grupos fue la presencia de las bacterias.',
    'bio-09': 'Haz el cuadro de Punnett Rr × Rr: ¿cuántas de las 4 casillas son rr?',
    'bio-10': '¿Qué hormona baja la glucosa en la sangre y en qué forma la guarda el cuerpo?',
    'bio-11': 'Sigue la cadena: más nutrientes → más algas → menos luz → ¿quién gasta el oxígeno al descomponerlas?',
    'bio-12': 'En Hardy-Weinberg, el fenotipo recesivo es q². Saca la raíz cuadrada en cada momento.',
    'bio-13': 'El transporte secundario usa un gradiente que otra bomba mantiene gastando ATP.',
    'bio-14': 'Pasa la hebra molde a ARNm y mira qué aminoácido codifica el codón que cambió.',
    'bio-15': 'Con el cuerpo deshidratado, los riñones deben ahorrar agua: ¿qué hormona da esa orden?',
    'bio-16': 'La banda de Caspary es el filtro que obliga al agua a pasar por dentro de las células. ¿Y si se rompe?',
    'bio-17': 'La proteína Rb sin fosforilar mantiene frenado el paso de G1 a S.',
    'bio-18': 'El sistema inmune tiene memoria para lo que ya conoce, no para lo nuevo.',
    'bio-19': 'Una sustancia persistente se va acumulando en cada eslabón de la cadena trófica.',
    'bio-20': 'La célula sabe copiar ADN y pasar ADN a ARN, pero no fabricar ARN a partir de ARN.',
    'bio-21': 'Si no se libera acetilcolina, el músculo nunca recibe la orden de contraerse.',
    'bio-22': 'Para que el clon tenga solo el genoma del donante, hay que quitarle algo al óvulo.',
    'bio-23': 'Las dos especies viven en el mismo estanque, pero se reproducen en meses distintos.',
    'bio-24': 'Mira la gráfica: ¿en qué punto la curva sube más empinada? Fíjate en la línea punteada verde.',
    'bio-25': 'Una hormona estimula las raíces y la otra rompe la dominancia de la yema apical.',

    'qui-01': 'Una sustancia pura hierve a una temperatura fija y no deja residuo.',
    'qui-02': 'Suma la masa de lo que entró y compárala con la de lo que salió (producto + sobrante).',
    'qui-03': 'La masa de los reactivos es igual a la de los productos: resta.',
    'qui-04': 'Si 100 g de solución tienen 25 g de ácido, ¿cuánto tendrán 500 g?',
    'qui-05': 'Ubica en la gráfica la línea de cada sal a 20 °C y a 80 °C y compara.',
    'qui-06': 'El número de masa suma las partículas del núcleo.',
    'qui-07': 'Compartir electrones es la marca de un tipo de enlace.',
    'qui-08': 'La ecuación dice que 1 mol de N₂ da 2 de NH₃. Revisa si el H₂ alcanza.',
    'qui-09': 'Lo más denso se va al fondo.',
    'qui-10': 'Compara cada temperatura con 25 °C: un líquido funde por debajo y hierve por encima.',
    'qui-11': 'Primero balancea: 3 Si + 2 N₂ → Si₃N₄. Luego calcula cuántas moles tienes de cada reactivo.',
    'qui-12': 'El recipiente es rígido: el volumen no cambia. Si la temperatura absoluta se duplica, ¿qué pasa con la presión?',
    'qui-13': 'Le Châtelier: el calor favorece la reacción endotérmica y la presión favorece el lado con menos moles de gas.',
    'qui-14': 'Calcula los moles de HCl y de NaOH: ¿qué sobra y en cuánto volumen total queda?',
    'qui-15': 'Reemplaza en la ecuación: [A] se duplica (¡y está al cuadrado!) y [B] se reduce a la mitad.',
    'qui-16': 'En la pila se oxida el metal con el potencial de reducción más bajo; E° = cátodo − ánodo.',
    'qui-17': 'El punto de ebullición sube según el número de partículas disueltas, no según su masa.',
    'qui-18': 'Mismos átomos, pero una molécula es un alcohol (–OH) y la otra un éter (–O–).',
    'qui-19': 'El oxígeno tiene 2 pares de electrones libres que empujan los enlaces.',
    'qui-20': 'Invierte la segunda reacción y súmala con la primera.',
    'qui-21': 'El último nivel es el 3 y tiene 6 electrones de valencia: ¿cuántos le faltan para el octeto?',
    'qui-22': 'Los tres líquidos se mezclan entre sí, pero hierven a temperaturas distintas.',
    'qui-23': 'Markovnikov: el H se une al carbono que ya tiene más hidrógenos.',
    'qui-24': 'Calcula Q = [Ba²⁺]·[SO₄²⁻] y compáralo con Kps.',
    'qui-25': 'En la desintegración β⁻ un neutrón se vuelve protón: el número de masa no cambia.',

    'fis-01': 'Velocidad constante: distancia = velocidad × tiempo.',
    'fis-02': 'F = k·q₁·q₂ / r². Y ojo: ¿cargas del mismo signo se atraen o se repelen?',
    'fis-03': 'Peso = masa × gravedad.',
    'fis-04': 'La luz cambia de medio, y con él cambian su velocidad y su dirección.',
    'fis-05': 'Si la fuerza va en contra del desplazamiento, el ángulo entre ellos es 180°.',
    'fis-06': 'Al recoger los brazos, el patinador reduce su momento de inercia… algo tiene que conservarse.',
    'fis-07': 'En la altura máxima la velocidad es 0: ¿cuánto tarda la gravedad en frenar 30 m/s?',
    'fis-08': 'Ley de Ohm: I = V / R.',
    'fis-09': 'Velocidad de una onda = frecuencia × longitud de onda.',
    'fis-10': 'La gráfica es una recta que pasa por el origen: la fuerza es proporcional al alargamiento.',
    'fis-11': 'Separa la velocidad en componentes: la vertical se anula en la cima; la horizontal no cambia.',
    'fis-12': 'Lo que mueve el sistema es el peso de m₂; lo que lo frena es la fricción sobre m₁. Las dos masas se aceleran juntas.',
    'fis-13': 'Toda la energía potencial del inicio termina como energía elástica: mgh = ½kx².',
    'fis-14': 'Torricelli: v = √(2gh), con h medida desde la superficie hasta el orificio.',
    'fis-15': 'Primero resuelve las dos de 6 Ω en paralelo; después súmales la de 4 Ω en serie.',
    'fis-16': 'Cuando la fuente se acerca el sonido se oye más agudo; cuando se aleja, más grave.',
    'fis-17': 'Eficiencia de Carnot = 1 − T fría / T caliente.',
    'fis-18': 'Ecuación del espejo: 1/f = 1/dₒ + 1/dᵢ. El objeto está entre f y 2f.',
    'fis-19': 'La energía del fotón se reparte: una parte arranca el electrón y el resto es energía cinética.',
    'fis-20': 'Tercera ley de Kepler: T² es proporcional a R³.',
    'fis-21': 'F = q(v × B): dedos hacia v, dóblalos hacia B (entrando en la página) y mira hacia dónde apunta el pulgar.',
    'fis-22': 'La pelota cambia de sentido: el cambio de velocidad es 15 + 25, no 25 − 15.',
    'fis-23': 'Distancia entre franjas: y = λ·D / d. Cuida las unidades (nm y mm).',
    'fis-24': 'T = 2π·√(L/g), y aquí g = π².',
    'fis-25': 'E = ΔV / d, y el trabajo para mover la carga es W = q·ΔV.',

    'lec-01': '“Famélico” viene de “hambre”: busca la palabra que signifique lo contrario de muy flaco.',
    'lec-02': 'Fíjate en los pronombres: “…le gustaba llevarme…”. ¿Quién está hablando?',
    'lec-03': 'Johnny vive como magnate sin trabajar y a costa de otros. ¿Qué palabra resume eso?',
    'lec-04': 'Busca la cita que muestra una conducta repetida sin cambio, aunque no tenga sentido.',
    'lec-05': 'El título da la pista: ¿la avispa piensa o sigue un instinto?',
    'lec-06': 'Sigue el orden de los pasos: el masaje cardíaco va después de comprobar algo.',
    'lec-07': 'Ubica en la infografía el paso que empieza con “Si no respira…”.',
    'lec-08': 'Pregúntate qué NO necesita ilustrar una guía de primeros auxilios.',
    'lec-09': 'Las metáforas describen una mesa casi vacía. ¿Qué dicen de lo que cocina Diego?',
    'lec-10': 'La narradora dice que imagina “el infierno” como las tareas del hogar obligatorias.',
    'lec-11': 'El título dice “contra el método”: ¿el texto propone un método nuevo o critica la idea de que la ciencia es un método?',
    'lec-12': 'El liberalismo dice que todos son iguales. ¿Qué afirmación pone a todas las teorías en el mismo nivel?',
    'lec-13': 'El niño inventa justificaciones que le convienen: ¿es economía real o su propia versión?',
    'lec-14': 'Mira la figura tendida en el piso: tiene alas. ¿Qué le hizo la multitud?',
    'lec-15': 'El Partido no permite lealtad, amor ni arte… salvo hacia él. ¿Qué queda de cada persona?',
    'lec-16': 'La imagen de la bota no es un plan: describe cómo vivirán las personas bajo ese poder.',
    'lec-17': '“Irrecusable” es algo que no se puede rechazar ni refutar.',
    'lec-18': 'El texto habla de los turistas en general; el resumen, de un grupo en particular.',
    'lec-19': 'La descripción hace parte del relato de las campañas del capitán Galarza y sus soldados.',
    'lec-20': 'Borja sostiene que el indio de Aguado es “retórico”: construido en el texto.',
    'lec-21': 'Pregúntate si la caricatura critica a un gobierno o se burla de una situación cotidiana.',
    'lec-22': 'Busca un hecho concreto del que el autor dice ser “testigo”.',
    'lec-23': '“Escamotear” es hacer desaparecer algo con habilidad, sin que se note.',
    'lec-24': 'La autora critica que la ciencia de su época no aceptaba hablar de motivaciones.',
    'lec-25': 'El personaje dice que separarse de Crates sí depende de él.',
    'lec-26': 'Rubens aparece justo después de hablar de lo bello que nos gusta ver en la realidad.',
    'lec-27': 'Un juicio de valor es una opinión, no un hecho que se pueda comprobar.',
    'lec-28': 'El texto defiende que la belleza de un cuadro no depende de la belleza de su tema.',
    'lec-29': 'El autor sostiene que NADIE es justo por voluntad. ¿Qué afirmación lo niega?',
    'lec-30': 'Decir que la injusticia da “más” ventajas supone que la justicia también da alguna.',
    'lec-31': 'Busca la opción que, si fuera cierta, confirmaría que solo somos justos por obligación.',
    'lec-32': 'El primer párrafo dice que es la ley la que obliga a seguir el camino del respeto.',
    'lec-33': 'Giges, con poder y sin castigo, actuó injustamente. ¿Qué quiere demostrar el autor con eso?',
    'lec-34': 'El texto dice que la idea del amor como base del matrimonio aparece en el siglo XVIII.',
    'lec-35': '“Sin embargo” marca un contraste… pero ¿niega lo anterior o lo matiza?',
    'lec-36': 'La dote era el dinero, los bienes o las tierras que aportaba la mujer al casarse.',
    'lec-37': 'El ejemplo de China muestra que en otras culturas el amor y el matrimonio no van juntos.',
    'lec-38': 'Busca un dato histórico que muestre que esa idea es reciente.',
    'lec-39': 'Lo político y lo económico tienen que ver con dinero, bienes y tierras.',
    'lec-40': 'Algunas mujeres fulbes aprueban el amor, pero solo después de cumplido el objetivo del matrimonio.',
    'lec-41': 'El texto recorre distintas épocas y culturas.',
    'lec-42': '“A pesar de” introduce algo que no se esperaría. ¿Qué es lo inesperado aquí?',
    'lec-43': 'Revisa si todo lo que menciona la descripción aparece de verdad en la infografía.',
    'lec-44': 'Suma los porcentajes de peatones, ciclistas y motociclistas: ¿qué queda para los demás?',
    'lec-45': 'Las cifras están dadas por cada 100.000 habitantes de cada región.',
    'lec-46': 'Compara la proporción de vehículos con la proporción de muertes de cada grupo de países.',
    'lec-47': 'Las figuras humanas solo repiten, en dibujo, el dato “3 de 4”.',
    'lec-48': 'La infografía presenta riesgos de morir, no consejos para conducir.',
    'lec-49': '¿A quién le interesaría mostrar el riesgo de morir en un accidente?',
    'lec-50': 'El texto atribuye la baja cobertura a la poca garantía de acceso y de aseguramiento de la población pobre.',
    'lec-51': 'Si se estudian para saber cuáles son perjudiciales, ¿qué haría después la autoridad con ellas?',
    'lec-52': 'En el segundo párrafo el autor dice que los opositores “no entienden” el toreo.',
    'lec-53': 'Una falacia compara cosas que no son equivalentes: morir naturalmente no es lo mismo que ser matado.',
    'lec-54': 'Busca la frase de Escobar que empieza con “El propósito era…”.',
    'lec-55': 'Truman dice: “Producir más es la clave…”. ¿Y cuál es la clave para producir más?',
    'lec-56': 'Felipe le habla a Isabel con ironía y le echa la culpa. ¿Qué siente hacia ella?',
    'lec-57': 'Helena insiste una y otra vez en lo que ella prefiere para el jardín.',
    'lec-58': 'David admite que el árbol se veía “sucio, débil y gris”.',
    'lec-59': 'La vaca en el carrito sugiere llevarse algo “tal como sale de la vaca”.',
    'lec-60': 'El anuncio presenta dos ideas (“reciclable” y “no deja pasar la luz”) como si una causara la otra.',
    'lec-61': 'Con la burocracia, nunca se sabe cuándo atienden…',
    'lec-62': 'El autor está en contra de las corridas, pero también en contra de prohibirlas.',
    'lec-63': 'La autora cita a Mattelart sin dar pruebas de lo que afirma.',
    'lec-64': 'Luisa compara estar con alguien “porque sí” con estar “por plata”, como si fuera lo mismo.',
    'lec-65': 'Piensa en lo que garantiza la condición “solo si”… y en lo que NO garantiza.',
    'lec-66': 'Pregúntate qué hace cada conector: ¿“pero” contradice o matiza? ¿“ya que” explica o concluye?',
    'lec-67': 'Si una búsqueda “es” la otra, quien hace una también hace la otra.',
    'lec-68': 'Una antítesis afirma lo contrario: que un orden puede ser justo SIN satisfacer a todos.',
    'lec-69': 'Benevolencia es querer el bien del otro. ¿Qué es lo contrario?',
    'lec-70': '“Sin embargo” contrasta dos ideas sin negar la primera.',
    'lec-71': 'Pregúntate cuál de las dos ideas sirve para justificar a la otra.',
    'lec-72': 'La tesis es que las sociedades nacen del miedo mutuo. Lo contrario sería…',
    'lec-73': 'Para Hobbes, el miedo a ser dominado lleva a buscar…',
    'lec-74': 'Hobbes dice que dominar resulta “mejor” que asociarse para obtener comodidades.',
    'lec-75': 'El anuncio es de un banco, no de una agencia de citas: ¿qué ofrece realmente?',

    'soc-01': 'Fíjate en el NO: busca la afirmación que describe MAL lo que defiende cada persona.',
    'soc-02': 'Un argumento válido ataca el razonamiento: ¿que una zona sea insegura prueba quién comete allí los delitos?',
    'soc-03': 'Un prejuicio da por hecho algo sin fundamento sobre un grupo. ¿Qué frase supone que se “contagia” una orientación?',
    'soc-04': 'Ubica cada magnicidio en su década: Uribe Uribe a inicios de siglo, Gaitán en 1948, Galán en 1989…',
    'soc-05': 'Lee con calma las DOS posturas: ¿alguna de ellas está a favor de legalizar?',
    'soc-06': 'Que se vote no significa que todos queden bien: ¿quién sigue afectado por el ruido?',
    'soc-07': 'Pregúntate quién gana de verdad: la constructora sigue construyendo… ¿y el humedal?',
    'soc-08': 'Las tres propuestas atacan el mismo problema: ¿cuál es el costo de la expansión urbana?',
    'soc-09': 'De los mecanismos de participación, solo uno permite aprobar reformas a la Constitución por voto popular.',
    'soc-10': 'La iniciativa popular necesita un respaldo mínimo de firmas del censo electoral, no de una sola persona.',
    'soc-11': '¿Cuál de los mecanismos de participación permite reformar la Constitución?',
    'soc-12': 'Los denunciantes señalan que el alcalde compró tierras y luego las valorizó con obras públicas.',
    'soc-13': 'En condiciones normales, ¿qué rama del poder es la que ordena la captura de una persona?',
    'soc-14': '¿Qué rama cita a los ministros a debate y puede separarlos del cargo con una moción de censura?',
    'soc-15': 'Se trata de anular una norma de la Constitución: ¿qué mecanismo permite derogar normas por voto popular?',
    'soc-16': 'Lee los rótulos de las caricaturas: “violencia conservadora”, “víctimas liberales”, “violencia liberal”…',
    'soc-17': 'Busca la opción que explica para qué se hizo el acuerdo entre los dos partidos tradicionales.',
    'soc-18': 'Fíjate en quién habla: dice que la guerrilla los “obligó a responder”.',
    'soc-19': 'El neoliberalismo busca que el Estado intervenga menos en la economía.',
    'soc-20': 'Eliminar trabas y simplificar trámites para que funcione el mercado: ¿qué modelo propone eso?',
    'soc-21': 'Criticar al neoliberalismo es defender que el Estado intervenga para garantizar la equidad.',
    'soc-22': 'Los aranceles protegen lo que el país ya produce. ¿Cuándo tiene sentido protegerlo?',
    'soc-23': 'Si las disputas son por territorios estratégicos, ¿qué revela el desplazamiento sobre los actores armados?',
    'soc-24': 'Ubica cada revolución en el tiempo: México 1910, Rusia 1917, Cuba 1959, Nicaragua 1979.',
    'soc-25': 'Piensa en la historia del campo colombiano: ¿la tierra está bien repartida? ¿La violencia fue partidista?',
    'soc-26': 'La tutela protege derechos fundamentales cuando están en riesgo inmediato.',
    'soc-27': 'Quienes se van tienen ingresos medios y altos: no buscan vivienda barata, buscan…',
    'soc-28': 'Hacerse visibles sirve para reclamar derechos y denunciar la exclusión.',
    'soc-29': 'Si la producción pasa a las fábricas de la ciudad, ¿a dónde se va la gente del campo?',
    'soc-30': 'Si es la “ley de leyes”, ¿qué hace con todas las demás normas y con el poder del Estado?',
    'soc-31': 'Si se buscan “justificaciones” para las agresiones, ¿qué pasa con la gravedad de la violencia?',
    'soc-32': 'Cada organización defiende algo distinto: ¿qué está dispuesta a sacrificar cada una?',
    'soc-33': 'Sustituir importaciones es producir aquí lo que antes se compraba afuera.',
    'soc-34': 'Cobrar más a quien tiene más: ¿qué impuestos recaen sobre el patrimonio y la renta?',
    'soc-35': 'El socialismo busca que los medios de producción sean de todos.',
    'soc-36': 'Riohacha, Leticia, Arauca y Florencia no son Bogotá: ¿lo que se necesita allí será igual?',
    'soc-37': 'Para ser un Estado se necesita un territorio reconocido, con fronteras definidas.',
    'soc-38': 'Nombrar en vez de elegir: ¿qué derecho de los estudiantes se salta?',
    'soc-39': 'Hubo consulta y un largo proceso de conciliación con la comunidad antes de decidir.',
    'soc-40': 'Tratar distinto a hombres y mujeres sin una razón válida, ¿qué principio de la Constitución rompe?',
    'soc-41': 'La Constitución reconoce y protege la diversidad de los pueblos que forman la nación.',
    'soc-42': 'Antes de juzgar por los titulares, mira los datos: ¿cambió la criminalidad desde que llegó el alcalde?',
    'soc-43': 'Un argumento a favor de legalizar diría que prohibir ha causado más daño que beneficio.',
    'soc-44': 'Si la culpa se pone en la ropa de la víctima, ¿a quién se está justificando?',
    'soc-45': 'Cerrar barrios afecta a los residentes… y también a quienes ya no podrán pasar por ahí.',
    'soc-46': 'Si se respeta su objeción de conciencia, ¿puede seguir en el Ejército?',
    'soc-47': 'Compara cuántas clases pierden los niños en cada opción.',
    'soc-48': 'Reducir la industria pesada choca con el crecimiento económico: ¿qué dimensiones se enfrentan?',
    'soc-49': 'Piensa en las personas que vivían de esas ventas.',
}

# Explicaciones de Ciencias (parte 1): el Word solo traía la temática.
EXPLAIN = {
    'bio-01': 'Con 2 mg/L el oxígeno queda muy por debajo del umbral de 4 mg/L a partir del cual aumenta la mortalidad: la población disminuirá.',
    'bio-02': 'Un experimento controlado compara dos grupos que solo difieren en la variable de la hipótesis (raíces conectadas vs. separadas por una barrera). Las otras opciones no ponen a prueba el intercambio de nutrientes.',
    'bio-03': 'En agua destilada (hipotónica) entra agua y la célula se hincha; al 0,9 % (isotónica) no hay flujo neto; al 10 % (hipertónica) sale agua y la célula se encoge.',
    'bio-04': 'La bacteria C sobrevive un 85 % con el antibiótico Z, frente a 5 % con X y 40 % con Y: es su mayor resistencia.',
    # Matemáticas: el Word solo traía la clave.
    'mate-01': 'Con cursos del mismo tamaño, el promedio total de cada año se compara sumando los promedios: año anterior 63 + 61 + 50 + 53 = 227; año actual 65 + 45 + 53 + 54 = 217. El promedio total bajó, aunque tres de los cuatro cursos subieron: la caída del curso II (16 puntos) pesa más que esas subidas.',
    'mate-02': 'Pasar de dólares a pesos es multiplicar por 4.000 tanto la inversión como la ganancia. Como la tasa es constante, la proporción entre ganancia e inversión no cambia: en pesos también es del 3 %. A es incorrecta porque la conclusión depende justamente de que la tasa no varíe.',
    'mate-03': 'Con las franjas 1, 3 y 4: 50 × 35.000 + 30 × 50.000 + 60 × 45.000 = $ 5.950.000. Con las franjas 1, 2 y 4 (caben 150) se llenan primero las más baratas: 50 × 35.000 + 40 × 40.000 + 50 × 45.000 = $ 5.600.000, que es menos. La franja 3 es la más cara por estudiante.',
    'mate-04': 'Un curso del módulo I cuesta 40 h × $ 35.000 = $ 1.400.000. Con $ 4.200.000 se pagan 3 cursos, cada uno de 20 a 30 personas: la dependencia tiene entre 60 y 90 trabajadores.',
    'mate-05': 'Un curso del módulo II cuesta 30 h × $ 30.000 = $ 900.000. Como cada curso admite máximo 30 personas, los 50 trabajadores necesitan 2 cursos: $ 1.800.000, que entre 50 da $ 36.000 por persona.',
    'mate-06': 'Con máximo 30 personas por curso, 40 funcionarios necesitan 2 cursos: cada uno costó $ 900.000 ÷ 2 = $ 450.000. Solo el módulo IV cuesta eso: 10 h × $ 45.000. (Un curso del módulo II cuesta $ 900.000, pero habría que pagar dos.)',
    'mate-07': 'Base y boca son cuadradas, así que la razón entre sus lados es la de los perímetros, 3/4. El área depende del lado al cuadrado: la razón entre las áreas es (3/4)² = 9/16, no 3/4.',
    'mate-08': 'La temperatura baja 1 °C por cada 100 m: el término es −Altitud/100. Para que a 1.000 m dé 20 °C hay que sumar 30 (−10 + 30 = 20). A 4.000 m: −40 + 30 = −10 °C. B y D multiplican la altitud por 100 en lugar de dividirla.',
    'mate-09': '6 toneladas necesitan 2 camiones y 4 trabajadores. En W: ventas 6 × 1.300.000 = 7.800.000 y gastos 2 × 150.000 + 4 × 180.000 = 1.020.000. En Z: ventas 8.100.000 y gastos 2 × 180.000 + 4 × 200.000 = 1.160.000. En Z se vende 300.000 más y se gasta solo 140.000 más: por eso es más rentable. A no basta: también hay que mirar los gastos.',
    'mate-10': 'Paso 1: 15 t. Paso 2: 1.000.000 − 400.000 = 600.000. Paso 3: 15 × 600.000 = 9.000.000. Paso 4: transporte 3 × 150.000 = 450.000 más trabajadores 6 × 180.000 = 1.080.000, en total 1.530.000. Paso 5: 9.000.000 − 1.530.000 = $ 7.470.000.',
    'mate-11': '47 ÷ 5 deja residuo 2, así que cuentan 45 toneladas. 45 × 1.300.000 = 58.500.000, y el 0,3 % de eso es 175.500: unos 175.000 pesos para cada empleado.',
    'mate-12': 'Tanto 7 como 10 toneladas necesitan 2 camiones y 4 trabajadores. En W: transporte 2 × 150.000 = 300.000 y trabajadores 4 × 180.000 = 720.000. En Z: transporte 2 × 180.000 = 360.000 y trabajadores 4 × 200.000 = 800.000. Es la gráfica B.',
    'mate-13': 'Cada camión lleva máximo 5 toneladas: 150 toneladas requieren al menos 150 ÷ 5 = 30 viajes. Lo demás no se puede saber, porque no se conoce a qué ciudad se vendió cada carga ni cuántos viajes hizo cada trabajador.',
    'mate-14': 'Aumentar un lado en 100 % es duplicarlo. Como el área es base × altura y el otro lado no cambia, el área también se duplica.',
    'mate-15': 'Los postes son paralelos y los ilumina la misma fuente, con rayos paralelos: sus sombras también son paralelas y forman el mismo ángulo con la acera, β = 30°. La altura del poste cambia el largo de la sombra, no su dirección.',
    'mate-16': 'El promedio no informa cómo se reparten las estaturas: con un promedio de 1,70 m puede haber varias personas de más de 1,80 m. Que el promedio sea menor que 1,80 m no implica que las piscinas tengan cantidades distintas, y subirlo a 1,80 m tampoco garantiza que se igualen.',
    'mate-17': 'Una caja tiene 12 aristas: 4 de largo l, 4 de ancho a y 4 de alto h. La longitud total es 4l + 4a + 4h. (lah es el volumen.)',
    'mate-18': 'En el triángulo formado por el faro superior, el faro de la derecha y el barco, el lado que mide 1 está frente al ángulo de 75° (en el barco) y x está frente al de 60°. Por la ley del seno: x / sen(60°) = 1 / sen(75°), así que x = sen(60°) / sen(75°).',
    'mate-19': 'Si P anota x puntos, Q anota 3/2 de x (3 por cada 2). P tendrá 7 + x y Q tendrá 2 + (3/2)x. Se igualan cuando 7 + x = (3/2)x + 2: con x = 10 quedan 17 a 17.',
    'mate-20': 'G(p) = 30p + 2.000 cumple los tres años: 30 × 200 + 2.000 = 8.000; 30 × 280 + 2.000 = 10.400; 30 × 250 + 2.000 = 9.500. G(p) = 40p solo cumple el primero y G(p) = 40p − 800, ninguno.',
    'mate-21': 'La ecuación 1 está bien: precio por cantidad de cada artículo. Pero si se vendieron 3 veces más sillas que mesas, la relación es S = 3M. La ecuación M = 3S dice lo contrario: 3 veces más mesas que sillas.',
    'mate-22': 'h = 120 × sen(45°) ≈ 120 × 0,71 = 85,2 cm. La mitad es 85,2 ÷ 2 ≈ 42,6 cm: el corte se hizo a unos 42 cm. 85 cm es la altura completa.',
    'mate-23': 'Si la hipotenusa es el doble del cateto menor, el ángulo opuesto a ese cateto es de 30° (sen 30° = 1/2): el cartabón es un triángulo de 30°, 60° y 90°. Entonces tan 60° = cateto mayor ÷ cateto menor, √3 = 32 / c, y c = 32/√3 cm.',
    'mate-24': 'Cada uno de los cuatro triángulos que rodean el cuadrado sombreado se puede trasladar para formar, con él, una cruz de 5 cuadrados iguales al sombreado. La cruz tiene la misma área que el cuadrado grande (1 dm²), así que el sombreado mide 1/5 dm².',
    'mate-25': 'Son ordenaciones de 4 dígitos distintos: 4 × 3 × 2 × 1 = 24 extensiones.',
    'mate-26': 'Buses (24 %) + microbuses (23 %) + busetas (18 %) = 65 %: son más de la mitad. Automóviles (18 %), camionetas (9 %) y camperos (7 %) suman solo 34 %.',
    'mate-27': 'Entre 10,49 y 10,50 hay infinitos números, por ejemplo 10,497. Ese tiempo es menor que 10,50 (rompe el récord olímpico) y mayor que 10,49 (no rompe el mundial).',
    'mate-28': 'Hay 45 mujeres entre 75 estudiantes: 45/75 = 3/5. El numerador es el total de mujeres y el denominador, el total de estudiantes de grado undécimo.',
    'mate-29': 'En la figura 2 la escalera (13 m) es la hipotenusa, el muro (12 m) es el cateto opuesto a θ y la distancia en el suelo (5 m) es el adyacente: cos θ = 5/13.',
    'mate-30': 'Las picas son negras: ninguna carta es roja y de picas, así que la probabilidad es 0. Las otras parejas sí existen (el 2 de picas es negro y par; el K de diamantes es rojo y de diamantes).',
    'mate-31': 'La ecuación tiene dos soluciones, x = 3 y x = −3. María desarrolla los productos y llega a x² = 9; Nelson saca factor común (x + 3) y llega a (x + 3)(x − 3) = 0: los dos son correctos. Óscar convierte los productos en sumas, lo cual no es válido.',
    'mate-32': 'Por la simetría respecto al eje y, el reflejo de (x, y) es (−x, y): (−4, 2) → (4, 2) y (−2, 8) → (2, 8).',
    'mate-33': 'Hay 60 mujeres y 40 hombres. Mujeres en bus: 20 % de 60 = 12, caminando 48. Hombres caminando: 40 % de 40 = 16, en bus 24. Es la tabla D.',
    'mate-34': 'Cada aumento de 10 dB multiplica la intensidad por 10. Aumentar 20 dB es hacerlo dos veces: × 10 × 10 = × 100, no × 20.',
    'mate-35': 'Pasos 1 y 2: 50 × 9 ÷ 10 = 45, el precio con el primer descuento. Los pasos 3 y 4 deben sacar el 90 % de 45 (multiplicar por 90 y dividir entre 100 = $ 40,50). El error está en el paso 3, que multiplica por 10.',
    'mate-36': 'Hay 18 bolas: P(blanca) = 12/18 = 2/3, mientras que P(roja) = P(negra) = 3/18 = 1/6. Hay más blancas, así que los colores no tienen la misma probabilidad.',
    'mate-37': 'OP y OP′ son radios, así que al unir los tres puntos sale un triángulo isósceles (equilátero si PP′ también mide un radio) o, si P y P′ son opuestos, un diámetro. Nunca queda un solo radio: siempre intervienen los tres puntos.',
    'mate-38': 'Nadie eligió las dos bebidas: 20 + 40 = 60 clientes pidieron bebida y 110 − 60 = 50 no la pidieron; esos 50 solo eligieron pizza. En cambio, no se sabe cuántos de los que pidieron bebida también pidieron pizza, por eso A, B y D no se pueden calcular.',
    'mate-39': 'R1: 10³ = 1.000. R2: 10 × 9 × 8 = 720. R3: 26 × 26 × 10 = 6.760. R4: 52 × 10 × 10 = 5.200. De menor a mayor: R2, R1, R4, R3.',
    'mate-40': 'k + 1/j es menor que k + 1/11 cuando j es mayor que 11. Hay infinitos enteros mayores que 11 (12, 13, 14…), así que se pueden construir infinitos racionales.',
    'mate-41': 'En todo triángulo cada lado es menor que la suma de los otros dos. Con lados 7, 7 y 18: 7 + 7 = 14 < 18, así que ese triángulo no existe. Los demás requerimientos sí se pueden cumplir (la suma de 180° se cumple siempre).',
    'mate-42': '100 m ÷ 100 = 1 m = 100 cm = 1 × 10² cm, y 60 m ÷ 100 = 0,6 m = 60 cm = 6 × 10¹ cm. Es el diseño D. El C tiene los mismos números, pero en metros: sería la cancha de tamaño real.',
    'mate-43': 'A(x) = x · f(x) = x · 5/x = 5 para todo x > 0: todos esos rectángulos tienen área 5. La gráfica es una recta horizontal en y = 5, sin incluir x = 0 (círculo vacío).',
    'mate-44': 'θ = 2π / 10 = 6 / 10 = 0,6. S = 3² × 0,6 / 2 = 9 × 0,3 = 2,7 m².',
    'mate-45': 'En décimo hay C(5, 2) = 10 formas de elegir a 2; en undécimo, C(4, 3) = 4 formas de elegir a 3. Como se eligen las dos cosas, se multiplica: 10 × 4 = 40 grupos.',
    'mate-46': 'Los juegos son independientes: P(ganar los dos) = 1/2 × 1/6 = 1/12 (procedimiento 2). Lo contrario de ganar los dos es perder en al menos uno, así que también sirve 1 − P(perder en al menos uno) (procedimiento 3). Sumar no sirve, y "perder exactamente en uno" deja por fuera el caso de perder los dos.',
    'mate-47': 'De 10³ = I / I₀ se obtiene I = 1.000 · I₀: la intensidad es mil veces la mínima que percibe el oído.',
    'mate-48': 'Con un 2 ya fuera, para llegar a 10 las otras dos balotas deben sumar 8: (2,6), (3,5), (4,4), (5,3), (6,2), 5 formas. Para llegar a 7 deben sumar 5: (1,4), (2,3), (3,2), (4,1), 4 formas. El estudiante del 10 tiene una posibilidad más.',
    'mate-49': 'Cada año el costo se multiplica por (1 + 5/100) = 1,05; tras n años es 800.000 × (1 + 5/100)ⁿ. A suma solo 5 pesos por año y C multiplica por el 5 %, lo que haría bajar el precio.',
    'mate-50': 'Cilindro: π(3/2)² × 2 = 4,5π ≈ 14,1. Caja: (3/2)² × 2 = 4,5. Esfera: (4/3)π(3/2)³ = 4,5π. El cilindro es mayor que la caja y la esfera tiene el mismo volumen que el cilindro.',
    'bio-05': 'La orquídea imita a la hembra del insecto y así consigue que el macho la polinice, pero el insecto no recibe nada a cambio (ni néctar ni pareja): es un mimetismo engañoso. No es mutualismo, porque solo una especie se beneficia; tampoco parasitismo, porque la orquídea no se alimenta del insecto, ni competencia, porque no se disputan ningún recurso.',
    'bio-06': 'La fotosíntesis depende de la luz: más horas de luz solar directa permiten más fotosíntesis. Ni el agua ni el abono reemplazan la luz.',
    'bio-07': 'Las serpientes se comen a las ranas: si las serpientes disminuyen, las ranas tienen menos depredadores y su población aumenta.',
    'bio-08': 'El único factor distinto fue la presencia de bacterias fijadoras de nitrógeno, que aportan nitrógeno aprovechable: benefician el crecimiento.',
    'bio-09': 'Rr × Rr da RR, Rr, Rr y rr: solo 1 de 4 (25 %) es rr y tiene flores blancas.',
    'bio-10': 'Tras el pico, la insulina hace que el hígado y los músculos conviertan la glucosa en glucógeno, y el nivel en sangre baja.',
    'qui-01': 'La sustancia 1 hierve a una temperatura fija y no deja residuo: es pura. La 2 hierve en un rango y deja residuo: es una mezcla.',
    'qui-02': 'Entran 20 g (10 + 10) y salen 20 g (15 g de C + 5 g de B sin reaccionar): la masa se conserva.',
    'qui-03': 'Por conservación de la masa: 36,5 + 40 = 76,5 g de reactivos; 76,5 − 58,5 = 18 g de agua.',
    'qui-04': '25 g por cada 100 g de solución: en 500 g hay 5 × 25 = 125 g de H₂SO₄.',
    'qui-05': 'La línea de la sal X sube de unos 33 g a 20 °C a unos 42 g a 80 °C: es más soluble a 80 °C.',
    'qui-06': 'Número de masa = protones + neutrones = 11 + 12 = 23.',
    'qui-07': 'Cuando los átomos comparten electrones forman enlaces covalentes.',
    'qui-08': '1 mol de N₂ reacciona con 3 de H₂ y da 2 de NH₃. Con 2 mol de N₂ y 6 de H₂ (proporción exacta) se forman 4 mol de NH₃.',
    'qui-09': 'Las capas se ordenan por densidad: glicerina (1,26) abajo, luego agua (1,0) y arriba aceite (0,9).',
    'qui-10': 'Una sustancia es líquida a 25 °C si funde por debajo de 25 °C y hierve por encima. El bromo funde a −7 °C y hierve a 59 °C: es líquido. El hierro sigue sólido (funde a 1538 °C), y el cloro y el oxígeno ya hirvieron (−34 °C y −183 °C): son gases.',
    'fis-01': 'd = v·t = 20 m/s × 10 s = 200 m.',
    'fis-02': 'F = 9×10⁹ × (2×10⁻⁶)² / 0,3² = 0,036 / 0,09 = 0,4 N. Las cargas del mismo signo se repelen.',
    'fis-03': 'P = m·g = 2 kg × 10 m/s² = 20 N.',
    'fis-04': 'La refracción es el cambio de dirección de la luz al pasar de un medio a otro con distinta velocidad de propagación.',
    'fis-05': 'W = F·d·cos θ. Con la fuerza opuesta al movimiento, θ = 180° y cos 180° = −1: el trabajo es negativo.',
    'fis-06': 'Sin torques externos, L = I·ω se conserva: al reducir I (brazos recogidos), ω aumenta.',
    'fis-07': 'v = v₀ − g·t → 0 = 30 − 10·t → t = 3 s.',
    'fis-08': 'I = V / R = 120 V / 10 Ω = 12 A.',
    'fis-09': 'v = f·λ = 5 Hz × 0,4 m = 2 m/s.',
    'fis-10': 'La fuerza es proporcional al alargamiento (F = k·x): es la ley de Hooke. Aquí k = 50 N/m.',
}

# Preguntas que el equipo académico debe revisar antes de usar: quedan en el
# banco con aviso y FUERA de las rondas predeterminadas. Vacío desde oct 2026:
# las cinco que había (bio-05, qui-10 y tres del banco anterior de
# Matemáticas) se corrigieron abajo en FIX — ver el comentario de cada una.
REVIEW = {}


def _stem_replace(q, pairs):
    stem = list(q['stem'])
    for a, b in pairs:
        stem = [s.replace(a, b) for s in stem]
    return stem


FIX = {
    # ── Matemáticas (documento de 50 preguntas, oct 2026) ───────────────────
    # mate-08: en el Word las opciones A y C perdieron el "= −" (está así en el
    # XML del documento, no es un error de lectura). Se restituye: la clave C
    # solo funciona con la altitud restando.
    'mate-08': lambda q: {**q, 'options': [r'\( \text{Temperatura} = -\dfrac{\text{Altitud}}{100} + 10 \)',
                                           r'\( \text{Temperatura} = -\text{Altitud} \times 100 + 300 \)',
                                           r'\( \text{Temperatura} = -\dfrac{\text{Altitud}}{100} + 30 \)',
                                           r'\( \text{Temperatura} = -\text{Altitud} \times 100 + 10 \)']},
    # mate-47: el Word dice 10³ = 1/1₀ en lugar de 10³ = I/I₀.
    'mate-47': lambda q: {**q, 'stem': [r'La expresión \( 10^3 = \dfrac{I}{I_0} \) relaciona la sonoridad de un sonido de 30 decibeles con su intensidad (I) y la menor intensidad (I₀) que percibe el oído humano. ¿Cuántas veces es el valor de I respecto a I₀?']},
    # mate-44: el Word dice "como muestra la figura", pero no trae la figura.
    'mate-44': lambda q: {**q, 'stem': [q['stem'][0].replace(', como muestra la figura', ''),
                                        'Para determinar el área que le corresponde a cada persona, se divide 2π entre 10, lo que determina el ángulo θ de cada sector, y se usa la fórmula del área de un sector circular:',
                                        r'\[ S = \dfrac{r^2\,\theta}{2} \]', 'donde r es el radio de la circunferencia.'] + q['stem'][4:],
                         'options': [o.replace(' m2', ' m²') for o in q['options']]},
    # Opciones gráficas: el texto va vacío, la opción es su imagen (OPTION_IMAGES).
    'mate-12': lambda q: {**q, 'options': ['', '', '', '']},
    'mate-33': lambda q: {**q, 'options': ['', '', '', '']},
    'mate-42': lambda q: {**q, 'options': ['', '', '', '']},
    'mate-43': lambda q: {**q, 'stem': [r'El área de los rectángulos que se pueden construir a partir del origen, los ejes y un punto que pertenece a la gráfica de la función \( f(x) = \dfrac{5}{x} \), donde x > 0, se describe con la expresión \( A(x) = x \cdot f(x) \).',
                                        '¿Cuál de las siguientes gráficas corresponde a A(x)?'],
                         'options': ['', '', '', '']},
    # Fórmulas que en texto plano quedaban ambiguas: en LaTeX (KaTeX, CLAUDE.md §5).
    'mate-18': lambda q: {**q, 'options': [r'\( x = \dfrac{2\,\text{sen}(30^\circ)}{\text{sen}(45^\circ)} \)', r'\( x = \dfrac{2\,\text{sen}(60^\circ)}{\text{sen}(45^\circ)} \)',
                                           r'\( x = \dfrac{\text{sen}(60^\circ)}{\text{sen}(75^\circ)} \)', r'\( x = \dfrac{\text{sen}(30^\circ)}{\text{sen}(60^\circ)} \)']},
    'mate-19': lambda q: {**q, 'options': [r'\( \tfrac{3}{2}x = 0 \), donde x es la cantidad de puntos que anotará P.',
                                           r'\( 7 + x = \tfrac{3}{2}x + 2 \), donde x es la cantidad de puntos que anotará P.',
                                           r'\( 7 + 3x = 2 + 2y \), donde x es la cantidad de puntos que anotará P, y y la cantidad de puntos que anotará Q.',
                                           r'\( x + y = 7 + 2 \), donde x es la cantidad de puntos que anotará P, y y la cantidad de puntos que anotará Q.']},
    'mate-22': lambda q: {**q, 'stem': [q['stem'][0], r'Para realizar el corte, se determinó la altura del triángulo usando la fórmula \( \text{sen}(45^\circ) = \dfrac{h}{120} \); luego se dividió h entre dos. Realizando este procedimiento, y teniendo en cuenta que \( \text{sen}(45^\circ) = \dfrac{\sqrt{2}}{2} \approx 0{,}71 \), ¿cuál fue, aproximadamente, la distancia a la que se cortó la altura del triángulo?']},
    'mate-49': lambda q: {**q, 'options': [r'\( 800.000 + 5n \)', r'\( 800.000\,(5n) \)', r'\( 800.000\left(\dfrac{5}{100}\right)^{n} \)', r'\( 800.000\left(1 + \dfrac{5}{100}\right)^{n} \)']},
    # Renglones partidos o pegados en el Word.
    'mate-15': lambda q: {**q, 'stem': [s.replace('30º', '30°') for s in q['stem']]},
    'mate-24': lambda q: {**q, 'stem': [s.replace('dm² ”', 'dm²”') for s in q['stem']]},
    'mate-40': lambda q: {**q, 'stem': [q['stem'][0] + ' ' + q['stem'][1]]},
    'mate-46': lambda q: {**q, 'stem': q['stem'][:4] + re.split(r' (?=Procedimiento \d\.)', q['stem'][4]) + q['stem'][5:]},
    # ── Corregidas: en el Word la clave o los datos no cuadraban ────────────
    # bio-05: "depredación" no describe el fenómeno. La opción A nombra ahora
    # lo que es (mimetismo engañoso), con la misma justificación del Word.
    'bio-05': lambda q: {**q, 'options': ['Mimetismo engañoso, porque la orquídea se beneficia y el insecto es engañado sin recibir nada a cambio.'] + q['options'][1:],
                         'correct': 0},
    # qui-10: el mercurio también es líquido a 25 °C y los datos del "cloro"
    # eran de otro elemento. Se cambia el mercurio por hierro y se corrigen
    # los datos del cloro: solo el bromo queda líquido.
    'qui-10': lambda q: {**q, 'stem': _stem_replace(q, [('▸ Mercurio | -39 | 357', '▸ Hierro | 1538 | 2862'),
                                                        ('▸ Cloro | 660 | 2520', '▸ Cloro | -101 | -34'),
                                                        ('▸ Oxigeno |', '▸ Oxígeno |')]),
                         'options': ['Bromo', 'Hierro', 'Cloro', 'Oxígeno'], 'correct': 0},

    'bio-15': lambda q: {**q, 'stem': [s.replace('sustained', 'sostenido') for s in q['stem']]},
    'fis-05': lambda q: {**q, 'stem': [s.replace('En el sistema de la figura, una fuerza', 'Una fuerza') for s in q['stem']]},
    'fis-16': lambda q: {**q, 'stem': [s.replace(' emitie una', ' y emite una') for s in q['stem']]},
    # La flecha de la imagen original dibuja el protón desviándose hacia ABAJO,
    # lo contrario de la clave (y de la física): se publica sin la imagen.
    'fis-21': lambda q: {**q, 'images': []},
    'lec-11': lambda q: {**q, 'options': [o.replace('El texto crítica', 'El texto critica') for o in q['options']]},
    'lec-24': lambda q: {**q, 'stem': [s.replace('Consideré el', 'Considere el') for s in q['stem']]},
    'lec-37': lambda q: {**q, 'options': [o.replace('Demuestrar', 'Demostrar').replace('de como la', 'de cómo la') for o in q['options']]},
    'lec-54': lambda q: {**q, 'options': q['options'][:3] + ['generar altos niveles de industrialización y urbanización, tecnificando la agricultura de los países menos avanzados.']},
    'lec-60': lambda q: {**q, 'stem': [q['stem'][0].replace('Este texto induce al lector a pensar que erróneamente.', 'Este texto induce al lector a pensar, erróneamente, que')]},
    'lec-66': lambda q: {**q, 'stem': ['Considere el siguiente fragmento: “La Justicia es en primer lugar una cualidad posible, **pero** no necesaria, de un orden social que regula las relaciones mutuas entre los hombres. Sólo secundariamente es una virtud humana, **ya que** un hombre es justo sólo si su conducta se adecúa a las normas de un orden social supuestamente justo”.',
                                       'Las palabras resaltadas en negrilla (**pero** y **ya que**) indican respectivamente']},
    'lec-69': lambda q: {**q, 'stem': ['Según el texto anterior, ¿cuál de las siguientes expresiones sería el antónimo más adecuado para la expresión “mutua benevolencia”?']},
    'lec-75': lambda q: {**q, 'passage': None},
    # soc-16: en el Word la pregunta venía en un solo párrafo, con las opciones
    # pegadas y el texto repetido dos veces.
    'soc-16': lambda q: {**q, 'stem': ['Las siguientes son dos caricaturas publicadas en la prensa colombiana.',
                                       '¿Qué periodo de la historia política colombiana se representa en estas caricaturas?'],
                         'options': ['La Violencia política.', 'El Frente Nacional.', 'La Patria Boba.', 'El gobierno de Rojas Pinilla.']},
}

# ── Ids estables por asignatura ──────────────────────────────────────────────
AREA_OF = {'mat': 'matematicas', 'lec': 'lectura', 'bio': 'biologia', 'qui': 'quimica', 'fis': 'fisica', 'soc': 'sociales'}
# Matemáticas cambió de documento (oct 2026): sus ids van con otro prefijo
# ("mate-") para no reutilizar los "mat-" de preguntas que ya no existen.
ID_PREFIX = {'mat': 'mate'}
seq = {}
out_q = []
for it in d['items']:
    k = it['src']
    seq[k] = seq.get(k, 0) + 1
    qid = f'{ID_PREFIX.get(k, k)}-{seq[k]:02d}'
    it = dict(it)
    if qid in FIX:
        it = FIX[qid](it)
    it['id'] = qid
    out_q.append(it)

# ── Textos de lectura ───────────────────────────────────────────────────────
SOURCE_START = ('Tomado', 'Adaptado', 'Rubio, M.', 'La invención del Tercer Mundo')
pass_out = {}
for p in d['passages']:
    pid = f"lp-{p['id'] + 1:02d}"
    head = p['head']
    body = list(p['body'])
    title = None
    if p['id'] == 8:  # 17 y 18 — el título quedó pegado al encabezado
        head, title = head.replace(' Sobre la fotografía', ''), 'Sobre la fotografía'
    if p['id'] == 13:
        head, body = head + ' INFORMACIÓN', ['Aprendiendo de los chimpancés'] + body[1:]
    if p['id'] == 27:
        head, body = head.replace(' INFORMACIÓN EL', ' INFORMACIÓN'), ['EL CONSUMIDOR DEL “AJUSTE”'] + body[1:]
    src_i = next((i for i, l in enumerate(body) if l.startswith(SOURCE_START)), len(body))
    source = ' '.join(body[src_i:]) or None
    paras = body[:src_i]
    if title is None and paras and len(paras[0]) < 70 and not paras[0].rstrip().endswith(('.', ':', '»')) and not paras[0].startswith('»'):
        title, paras = paras[0], paras[1:]
    if p['id'] == 23:  # pasaje de novela: numeración de líneas y renglones partidos
        joined = []
        for l in paras:
            l = re.sub(r'^[-–]\s*', '', l).strip()
            l = re.sub(r'^\d{1,2}\s+', '', l).strip()
            if joined and (l[:1].islower() or joined[-1].endswith((',', 'hubiera', 'más bien', 'algo como', 'uno de', 'Un árbol', 'maldita'))):
                joined[-1] += ' ' + l
            else:
                joined.append(l)
        paras = [l.replace('che lines', 'chelines').replace('iOh!', '¡Oh!').replace('“‘¡Maravilloso', '“¡Maravilloso')
                 for l in joined]
    imgs = [{'url': pub('lec', im)} for im in p['images'] if pub('lec', im)]
    pas = {'intro': head.replace('RESPONDA ', 'RESPONDE ').strip()}
    if title: pas['title'] = title
    if paras: pas['paragraphs'] = paras
    if imgs: pas['images'] = imgs
    if source: pas['source'] = source
    pass_out[pid] = pas

# Matemáticas: información compartida por varias preguntas ("RESPONDE LAS
# PREGUNTAS 4 A 6…"). Viaja como texto de apoyo (passage) igual que en
# Lectura; el encabezado del Word se cambia porque en la ronda la numeración
# es otra y las preguntas se eligen sueltas.
MATH_PASSAGE_TITLE = {0: 'Capacitación en informática básica', 1: 'Mango y banano para las ciudades W y Z'}
for p in d.get('mpassages', []):
    imgs = [{'url': pub('mat', im)} for im in p['images'] if pub('mat', im)]
    pas = {'intro': 'Lee la siguiente información para responder.', 'title': MATH_PASSAGE_TITLE[p['id']],
           'paragraphs': [tidy(x) for x in p['body']]}
    if imgs: pas['images'] = imgs
    pass_out[f"mp-{p['id'] + 1:02d}"] = pas


def time_limit(q, area, passage):
    if area == 'matematicas':
        # Enunciados tipo Saber (tablas, procedimientos): según lo que hay que leer.
        chars = sum(len(x) for x in q['stem']) + sum(len(o) for o in q['options'])
        chars += sum(len(x) for x in (passage or {}).get('paragraphs', []))
        t = 45 + chars / 12 + (20 if q.get('images') or (passage or {}).get('images') else 0)
        return int(min(150, max(60, round(t / 15) * 15)))
    if area == 'sociales':
        # Enunciados largos (casos, fragmentos de textos): según lo que hay que leer.
        chars = sum(len(x) for x in q['stem']) + sum(len(o) for o in q['options'])
        t = 30 + chars / 12 + (15 if q.get('images') else 0)
        return int(min(150, max(60, round(t / 15) * 15)))
    if area == 'lectura':
        chars = sum(len(x) for x in (passage or {}).get('paragraphs', [])) if passage else 0
        t = 45 + chars / 15
        if passage and passage.get('images'):
            t = max(t, 120)
        return int(min(180, max(60, round(t / 15) * 15)))
    base = 60 if q['set'] == 1 else 90
    return base + (15 if q.get('images') else 0)


rng = random.Random(2026)
DIFFS = ['facil', 'media', 'dificil']
# Matemáticas va primero en el borrador y el banco anterior (20 preguntas)
# consumía los 20 primeros valores del generador. Se descartan esos 20 y
# Matemáticas usa su propio generador: así cambiar de documento no le
# baraja la dificultad a Ciencias ni a Lectura.
for _ in range(20):
    rng.choice(DIFFS)
rng_mat = random.Random('matematicas-2026')
questions = []
for it in out_q:
    area = AREA_OF[it['src']]
    stem = [chem(tidy(l.replace('▸ ', ''))) if area in ('quimica', 'fisica', 'biologia') else tidy(l.replace('▸ ', '')) for l in it['stem']]
    opts = [chem(tidy(o)) if area in ('quimica', 'fisica', 'biologia') else tidy(o) for o in it['options']]
    passage_id = f"lp-{it['passage'] + 1:02d}" if it.get('passage') is not None else None
    if it.get('mpassage') is not None:
        passage_id = f"mp-{it['mpassage'] + 1:02d}"
    q = {'id': it['id'], 'area': area, 'question': '\n'.join(stem), 'options': opts, 'correct': it['correct']}
    opt_imgs = OPTION_IMAGES.get(it['id'], [])
    imgs = [pub(it['src'] if it['src'] in ('mat', 'lec', 'soc') else 'cie', im) for im in it.get('images', []) if im not in opt_imgs]
    imgs = [x for x in imgs if x]
    if it['id'] in COMPOSITES:
        imgs = [compose(it['id'])]
    if opt_imgs:
        q['optionImages'] = [pub('mat', im) for im in opt_imgs]
        assert all(q['optionImages']) and len(q['optionImages']) == len(opts), it['id']
    if imgs:
        q['image'] = imgs[0]
    # EXPLAIN primero: en las preguntas corregidas reemplaza la justificación del Word.
    exp = EXPLAIN.get(it['id']) or it.get('explanation') or ''
    if area == 'lectura' and it.get('topic'):
        exp = f"Competencia que evalúa: {it['topic'][0].lower() + it['topic'][1:]}"
    if area == 'sociales':
        exp = f"Competencia: {it['topic']}. Afirmación: {tidy(it['afirmacion']).rstrip('.')}."
    if exp:
        q['explanation'] = chem(exp) if area in ('quimica', 'fisica') else exp
    q['hint'] = HINTS[it['id']]
    # Sociales trae la dificultad REAL en el documento. Las demás asignaturas,
    # al azar con semilla fija; Sociales no consume el generador, así que
    # agregarla no cambia la dificultad ya asignada a las otras.
    if area == 'sociales':
        q['difficulty'] = {'baja': 'facil', 'media': 'media', 'alta': 'dificil'}[it['dificultad'].strip().lower()]
    elif area == 'matematicas':
        q['difficulty'] = rng_mat.choice(DIFFS)
    else:
        q['difficulty'] = rng.choice(DIFFS)
    if it.get('topic') and area != 'lectura':
        q['topic'] = it['topic'].split(' - ', 1)[-1]
    if area == 'lectura' and it.get('topic'):
        q['topic'] = it['topic'].rstrip('.')
    if passage_id:
        q['passageId'] = passage_id
    q['timeLimit'] = time_limit(it, area, pass_out.get(passage_id))
    if it['id'] in REVIEW:
        q['review'] = REVIEW[it['id']]
    q['source'] = {'mat': 'Prueba de Matemáticas', 'lec': f"Lectura crítica — parte {it['set']}",
                   'soc': 'Sociales y competencias ciudadanas'}.get(it['src'], f"Ciencias Naturales — parte {it['set']}")
    questions.append(q)

missing = [q['id'] for q in questions if not q.get('hint')]
assert not missing, missing

# ── Rondas predeterminadas (10 por ronda; sin preguntas "a revisar") ─────────
byarea = {}
for q in questions:
    byarea.setdefault(q['area'], []).append(q)
defaults = {}
for area, qs in byarea.items():
    ok = [q for q in qs if 'review' not in q]
    if area == 'lectura':
        # Por bloques de texto completos, para no partir una lectura en dos rondas.
        r1_p = ['lp-01', 'lp-02', 'lp-03', 'lp-06', 'lp-07']           # Johnny, avispa, RCP, Calvin, Quino
        r2_p = ['lp-17', 'lp-08', 'lp-09', 'lp-11']                    # Giges, Gran Hermano, fotografía, Quino
        r1 = [q['id'] for q in ok if q.get('passageId') in r1_p]
        r2 = [q['id'] for q in ok if q.get('passageId') in r2_p]
    elif area == 'sociales':
        # Con dificultad real: primera ronda = baja y media; ronda final = alta.
        r1 = [q['id'] for q in ok if q['difficulty'] in ('facil', 'media')][:10]
        r2 = [q['id'] for q in ok if q['difficulty'] == 'dificil'][:10]
    elif area == 'matematicas':
        # Las primeras 20 del documento, sin partir un bloque de información
        # compartida: la 4–6 (capacitación) va completa en la primera ronda y
        # la 9–13 (mango y banano) completa en la final.
        ids = [q['id'] for q in ok]
        pick = lambda nums: [f'mate-{n:02d}' for n in nums if f'mate-{n:02d}' in ids]
        r1 = pick([1, 2, 3, 4, 5, 6, 7, 8, 14, 15])
        r2 = pick([9, 10, 11, 12, 13, 16, 17, 18, 19, 20])
    else:
        # Primera ronda: las primeras del documento (las más directas);
        # ronda final: las del segundo bloque, que piden más elaboración.
        first = [q for q in ok if q['source'].endswith('parte 1')]
        second = [q for q in ok if q['source'].endswith('parte 2')]
        r2 = [q['id'] for q in second[:10]]
        r1 = [q['id'] for q in first[:10]]
        r1 += [q['id'] for q in second[10:]][:10 - len(r1)]
    defaults[area] = {'r1': r1, 'r2': r2}

bank = {
    '_generado': 'NO EDITAR A MANO — lo genera scripts/banco-preguntas/build.py (ver CLAUDE.md §14).',
    'version': 1,
    'areas': AREAS,
    'passages': pass_out,
    'questions': questions,
    'defaults': defaults,
}
export_images()
dst = os.path.join(REPO, 'src', 'lib', 'questionBank.json')
json.dump(bank, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
from collections import Counter
print('preguntas', len(questions), Counter(q['area'] for q in questions))
print('dificultad', Counter(q['difficulty'] for q in questions))
for a, v in defaults.items():
    print(a, 'r1', len(v['r1']), 'r2', len(v['r2']))
print('bytes', os.path.getsize(dst))
