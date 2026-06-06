/**
 * Seed de noticias diseñadas para atraer nuevos usuarios (Junio 2026)
 *
 * Temas virales, SEO potente y storytelling emocional para captar
 * a la audiencia de habla hispana amante del manga y el anime.
 *
 * Uso: npx dotenv-cli -e .env -- npx tsx prisma/seed-news-attract.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const url = process.env.DATABASE_URL || '';
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

interface NewsSeed {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: 'platform' | 'community' | 'tools' | 'mobile' | 'contest';
  date: string;
  coverUrl: string;
  isFeatured: boolean;
}

const articles: NewsSeed[] = [
  // ─── 1. One Piece Elbaf ──────────────────────────────────────────────
  {
    title: 'One Piece: El arco de Elbaf ya está aquí — y es el momento PERFECTO para empezar el anime',
    slug: 'one-piece-elbaf-empezar-anime',
    excerpt:
      'El arco de Elbaf promete ser uno de los más épicos de la historia. Si nunca viste One Piece por miedo a sus +1000 episodios, esta es la señal que estabas esperando.',
    content:
      'Si hay una frase que todo fan de One Piece ha escuchado (y dicho) hasta el cansancio es: "cuando llegues a Enies Lobby, no podrás parar". Y es cierta. Pero hay otra verdad que pocos cuentan: cada cierto tiempo, la serie ofrece puntos de entrada naturales para nuevos espectadores. Y Elbaf —el arco que comienza ahora mismo— es el mejor de todos.\n\n¿Por qué ahora? Porque el arco de Egghead acaba de concluir, cerrando un ciclo narrativo que comenzó hace más de una década. Los misterios de Joy Boy, la relación con el Gobierno Mundial y el despertar de la verdadera naturaleza de la Gomu Gomu no Mi han quedado resueltos. El escenario está limpio para que nuevos lectores y espectadores se suban al barco sin sentirse perdidos.\n\nPero no te mentiremos. One Piece es larga. Más de 1000 episodios asustan a cualquiera. Sin embargo, aquí va el truco: no tienes que verla toda de golpe. Puedes empezar con el arco de Elbaf —sí, directo— y si algo no entiendes, la propia serie te da contexto. O mejor aún: lee los primeros capítulos del manga para pillar la esencia y luego salta al anime.\n\nElbaf no es un arco cualquiera. Es la tierra de los gigantes, un lugar del que hemos oído hablar desde el arco de Little Garden, hace más de veinte años. Es donde vive el príncipe Loki, donde las leyendas nórdicas cobran vida y donde —sospechamos— Oda ha guardado algunos de los secretos más importantes de la serie.\n\nY lo mejor de todo: mientras el mundo espera el final de One Piece, Elbaf llega como ese arco que todos llevamos años deseando. El que promete respuestas, batallas épicas y, sobre todo, la magia de una historia que se niega a envejecer.\n\nNunca es tarde para comenzar la aventura más grande del manga. Y si vas a hacerlo, que sea ahora. Elbaf te espera.',
    category: 'community',
    date: '2026-06-07',
    coverUrl: 'https://images.unsplash.com/photo-1535666669445-e8c15cd2e7d9?w=800&h=450&fit=crop&auto=format',
    isFeatured: true,
  },

  // ─── 2. Demon Slayer Infinity Castle ─────────────────────────────────
  {
    title: 'Demon Slayer: Infinity Castle — fecha, duración y todo lo que sabemos de la película más esperada',
    slug: 'demon-slayer-infinity-castle-pelicula',
    excerpt:
      'La conclusión de Kimetsu no Yaiba llega a los cines con una trilogía de películas que promete ser el evento cinematográfico del año. Esto es todo lo que sabemos.',
    content:
      'Cuando Demon Slayer: Mugen Train se estrenó en 2020, nadie imaginaba que una película de anime podría convertirse en la más taquillera de la historia en Japón. Nadie excepto los que ya sabíamos que Kimetsu no Yaiba era algo especial. Ahora, cinco años después, la franquicia se prepara para su cierre con Infinity Castle, y todo apunta a que superará cualquier expectativa.\n\nPara los que llegáis nuevos: Demon Slayer cuenta la historia de Tanjiro Kamado, un joven que encuentra a su familia asesinada por un demonio y a su hermana Nezuko transformada en uno. Su viaje para convertir a Nezuko en humana y derrotar al Rey Demonio Muzan Kibutsuji es una montaña rusa de emociones que ha conquistado al mundo entero.\n\n¿Qué sabemos de Infinity Castle? Que será una trilogía de películas que adapta el arco final del manga. El primer tráiler, lanzado el mes pasado, nos mostró una animación que supera todo lo visto hasta ahora en la serie. Ufotable ha llevado su estudio al límite, con secuencias de batalla que parecen pinturas en movimiento y una dirección artística que quita el aliento.\n\nSe rumorea que la primera película tendrá una duración de aproximadamente 2 horas y 20 minutos, aunque el estudio no lo ha confirmado oficialmente. Lo que sí sabemos es que el estreno en Japón será a finales de este año, con llegada a occidente prevista para principios de 2027.\n\nSi nunca has visto Demon Slayer, este es el momento. Las tres temporadas y Mugen Train están disponibles en streaming. Y cuando termines, llegarás justo a tiempo para Infinity Castle. Porque hay historias que merecen ser vividas en pantalla grande. Y esta es una de ellas.',
    category: 'platform',
    date: '2026-06-07',
    coverUrl: 'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=800&h=450&fit=crop&auto=format',
    isFeatured: true,
  },

  // ─── 3. Sakamoto Days ─────────────────────────────────────────────────
  {
    title: 'Sakamoto Days: cómo pasó de ser un manga infravalorado al anime más visto de la temporada',
    slug: 'sakamoto-days-exito-anime',
    excerpt:
      'Lo llamaban "el John Wick del manga" pero su éxito va mucho más allá. Descubre por qué Sakamoto Days se ha convertido en el fenómeno que nadie esperaba.',
    content:
      'Cuando Sakamoto Days comenzó su publicación en Weekly Shonen Jump en 2020, pocos apostaban por él. Un asesino retirado, con sobrepeso, dueño de una tienda de barrio… no sonaba precisamente a fórmula ganadora. Pero Yuto Suzuki, su creador, sabía algo que el resto no: que detrás de esa premisa aparentemente simple se escondía una de las historias más sorprendentes, divertidas y emocionantes del manga moderno.\n\nTaro Sakamoto era el asesino más letal del mundo. Imparable. Legendario. Hasta que se enamoró. Y por amor, lo dejó todo: las armas, los encargos, la sangre. Ahora regenta una tienda de barrio, tiene una hija y… bastantes kilos de más. Pero cuando su pasado vuelve a llamar a la puerta, Sakamoto demuestra que los viejos hábitos —y las viejas habilidades— nunca desaparecen del todo.\n\nEl anime, estrenado a principios de 2026, ha superado todas las expectativas. Con una animación fluida que captura la esencia del manga —coreografías de lucha imposibles, humor absurdo y momentos de acción que te dejan sin aliento—, Sakamoto Days se ha convertido en la serie más vista de la temporada en múltiples plataformas.\n\n¿La clave de su éxito? Que Sakamoto Days no es solo acción. Es una historia sobre segundas oportunidades. Sobre elegir una vida tranquila cuando podrías tenerlo todo. Sobre familia, amistad y redención. Y sí, también tiene peleas increíbles.\n\nSi aún no le has dado una oportunidad, este es tu momento. El manga está en plena publicación, el anime está en emisión, y Taro Sakamoto —el asesino más letal convertido en el dueño de tienda más querido— te espera para demostrarte que nunca es tarde para cambiar.\n\nY recuerda: si ves a un señor con gafas y delantal de supermercado moverse más rápido que la luz… corre. O mejor, siéntate y disfruta.',
    category: 'community',
    date: '2026-06-06',
    coverUrl: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800&h=450&fit=crop&auto=format',
    isFeatured: false,
  },

  // ─── 4. Chainsaw Man Reze ────────────────────────────────────────────
  {
    title: 'Chainsaw Man: la película de Reze confirma su fecha con un tráiler eléctrico',
    slug: 'chainsaw-man-pelicula-reze-trailer',
    excerpt:
      'El arco del explosivo amor de Denji llegará a los cines con una animación que promete superar a la serie. El tráiler ya está aquí y no deja indiferente a nadie.',
    content:
      'Si creías que Chainsaw Man ya lo había dado todo en su primera temporada, prepárate. La película del arco de Reze —titulada Chainsaw Man: Reze — va a reventar todos los esquemas. MAPPA lo ha vuelto a hacer, y el tráiler que acaban de lanzar es una declaración de intenciones: esto no es una simple película, es un evento.\n\nPara los que aún no conocéis Chainsaw Man: Denji es un joven desesperado que, tras fusionarse con su demonio mascota Pochita, se convierte en el Devil Hunter más peligroso —y más caótico— del mundo. Su motivación principal? Tocar un pecho. Sí, así de sincero es. Pero detrás de ese humor grotesco y violento se esconde una historia sorprendentemente profunda sobre deseos, sacrificio y lo que significa realmente ser feliz.\n\nEl arco de Reze es especial. Es el arco del amor. Pero esto no es un romance shōjo precisamente. Reze —la misteriosa chica que aparece en la vida de Denji— es un torbellino de emociones, secretos y violencia que cambiará para siempre la forma en que vemos a nuestro protagonista. Y el tráiler nos muestra exactamente por qué.\n\nLa animación es, sencillamente, de otro nivel. MAPPA ha llevado el presupuesto al límite: las escenas de lucha fluyen con una violencia poética, los fondos son detallados hasta el último ladrillo, y los momentos más íntimos están tratados con una sensibilidad que contrasta brutalmente con la carnicería.\n\nLa fecha de estreno está confirmada para agosto en Japón y septiembre en occidente. Y si hay algo que sabemos con certeza, es que Chainsaw Man: Reze no es una película para ver en casa con la luz encendida. Es para sentirla en el cine, en pantalla grande, con el volumen que merece.\n\nNo te fíes de las apariencias. En el mundo de Chainsaw Man, la explosión es solo el principio.',
    category: 'tools',
    date: '2026-06-05',
    coverUrl: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=800&h=450&fit=crop&auto=format',
    isFeatured: false,
  },

  // ─── 5. Dandadan ──────────────────────────────────────────────────────
  {
    title: 'Dandadan: por qué todo el mundo habla de este manga (y deberías leerlo YA)',
    slug: 'dandadan-manga-recomendado',
    excerpt:
      'Ovnis, fantasmas, romance adolescente y la energía más caótica del manga moderno. Dandadan no es solo una historia: es una experiencia. Y la temporada 2 está en camino.',
    content:
      'Hay mangas que se leen. Y hay mangas que se EXPERIMENTAN. Dandadan pertenece a la segunda categoría. Si aún no te has topado con esta locura de Yukinobu Tatsu, déjanos ponerte en contexto: imagina que un día una chica de tu instituto te dice que cree en los fantasmas pero no en los extraterrestres. Tú le respondes que tú crees en los extraterrestres pero no en los fantasmas. Para resolver el debate, vuestros amigos os retan a pasar una noche en lugares encantados. Ella va a un hospital abandonado (buscando ovnis). Tú vas a un túnel con fama de estar embrujado (buscando fantasmas). Y, sorpresa, ambos teníais razón. Y ahora tenéis poderes. Y estáis huyendo de una anciana turbo-psíquica que os quiere robar… bueno, no te vamos a spoilear todo.\n\nDandadan es eso y mucho más. Es una montaña rusa que combina comedia romántica, terror cósmico, acción desenfrenada y una dirección artística que parece que las páginas van a explotar. Cada capítulo es un subidón de adrenalina que te deja con ganas de más.\n\nLa primera temporada del anime, estrenada en 2024, fue un fenómeno. Science SARU, el estudio detrás de la adaptación, capturó a la perfección la energía caótica del manga original. Y ahora, con la temporada 2 confirmada para finales de este año, no hay mejor momento para ponerse al día.\n\nSi buscas algo diferente. Algo que te haga reír, llorar y preguntarte "¿qué acabo de leer?" en el mejor sentido posible. Dandadan es tu respuesta. Y cuando termines el manga, nos lo agradecerás. O nos maldecirás por haberte creado una nueva adicción. Probablemente ambas.',
    category: 'community',
    date: '2026-06-04',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=450&fit=crop&auto=format',
    isFeatured: false,
  },

  // ─── 6. Guía para leer manga legal en español ─────────────────────────
  {
    title: 'Guía definitiva: cómo leer manga legalmente en español en 2026',
    slug: 'guia-leer-manga-legal-espanol',
    excerpt:
      'Plataformas, precios, aplicaciones y trucos para leer manga en español sin piratear. Tu bolsillo (y los creadores) te lo agradecerán.',
    content:
      'Vamos a ser sinceros: todos hemos pirateado manga alguna vez. Ya sea porque no encontrabamos una serie en castellano, porque el capítulo semanal no llegaba a tiempo o simplemente porque era más cómodo. Y aunque nadie te va a juzgar por ello, la realidad es que el pirateo daña a la industria que tantas horas de felicidad nos regala.\n\nPor suerte, en 2026 leer manga legalmente en español es más fácil —y más barato— que nunca. Aquí tienes la guía definitiva para hacerlo bien.\n\n1. Manga Plus (la mejor opción gratuita): La plataforma oficial de Shueisha te permite leer los primeros y últimos capítulos de todas las series de Jump de forma gratuita. One Piece, Jujutsu Kaisen, Chainsaw Man, Dandadan… todo está ahí. Además, han mejorado su catálogo en español y ahora incluyen series que antes solo estaban en inglés.\n\n2. MANGA Plus por MAX (suscripción): Por unos 4,99€ al mes, tendrás acceso ilimitado a todo el catálogo de Shueisha. Lectura sin publicidad, descargas offline y acceso anticipado. Es, probablemente, la suscripción manga con mejor relación calidad-precio del mercado.\n\n3. Ivrea (físico y digital): El gigante argentino-español sigue siendo el rey del manga en papel para España y Latinoamérica. Sus ediciones tienen una calidad espectacular y su catálogo es enorme. Además, su plataforma digital permite comprar tomos individuales sin necesidad de suscripción.\n\n4. Norma Editorial: Otra de las grandes. Su catálogo incluye desde clásicos hasta las series más actuales. Especialmente recomendada para ediciones de lujo y tomos únicos.\n\n5. Kindle Unlimited y Prime Reading: Amazon ha apostado fuerte por el manga digital. Muchos tomos están incluidos en las suscripciones de Kindle Unlimited y Prime Reading. No es el catálogo más completo, pero si ya tienes la suscripción, es una forma de leer sin gastar extra.\n\n6. Bibliotecas públicas: Sí, las bibliotecas tienen manga. Muchas ofrecen préstamo digital a través de plataformas como eBiblio. Y es completamente gratis.\n\nEl manga legal es más accesible que nunca. Los precios son razonables, las plataformas compiten por ofrecer el mejor servicio y los creadores reciben lo que merecen. Leer bien nunca fue tan fácil.\n\nComparte esta guía con quien esté empezando en el mundo del manga. Todos empezamos alguna vez. Y todos merecemos hacerlo bien.',
    category: 'platform',
    date: '2026-06-03',
    coverUrl: 'https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=800&h=450&fit=crop&auto=format',
    isFeatured: false,
  },

  // ─── 7. Kaiju No. 8 ───────────────────────────────────────────────────
  {
    title: 'Kaiju No. 8 temporada 2: reparto, fecha de estreno y por qué esta temporada lo cambiará TODO',
    slug: 'kaiju-no-8-temporada-2',
    excerpt:
      'La segunda temporada del anime más kaiju de la década promete superar a la primera con un arco argumental que los fans del manga llevan años esperando.',
    content:
      'Cuando Kaiju No. 8 se estrenó en 2024, nadie esperaba que un anime sobre un hombre que se convierte en el monstruo que jura destruir fuera a conectar tan profundamente con la audiencia. Pero Kafka Hibino —un treintañero que nunca renunció a su sueño de unirse a las Fuerzas de Defensa— demostró que la perseverancia, el humor y un buen diseño de personajes pueden convertir cualquier premisa en oro.\n\nAhora, la temporada 2 está a la vuelta de la esquina y las expectativas están por las nubes. ¿Por qué? Porque esta temporada adapta el arco de la Defensa de Tachikawa, uno de los más aclamados del manga de Naoya Matsumoto. Sin spoilers, pero podemos decirte que verás a los capitanes en acción como nunca antes, que las batallas alcanzarán un nivel de destrucción sin precedentes y que algunos secretos sobre el origen de los kaijus saldrán a la luz.\n\nProduction I.G ha confirmado que mantiene al equipo creativo de la primera temporada, lo que significa que la calidad de animación —que ya era impresionante— se mantendrá o mejorará. El diseño de sonido, las coreografías de combate y la banda sonora vuelven a estar en manos de los mejores del sector.\n\nSi no viste la primera temporada, aún estás a tiempo. Está disponible en Crunchyroll y su doblaje al español es de los mejores que hemos escuchado. Y si ya la viste… bueno, sabes perfectamente de qué estamos hablando. La espera casi ha terminado.\n\nPorque a veces, para proteger a la humanidad, primero tienes que convertirte en el monstruo.',
    category: 'tools',
    date: '2026-06-02',
    coverUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop&auto=format',
    isFeatured: false,
  },

  // ─── 8. Solo Leveling comparativa ─────────────────────────────────────
  {
    title: 'Solo Leveling temporada 2 vs manhwa: 7 diferencias que los fans tienen que conocer',
    slug: 'solo-leveling-temporada-2-diferencias-manhwa',
    excerpt:
      'La segunda temporada del anime de Solo Leveling ha sido fiel al manhwa original… pero no exactamente igual. Te contamos los cambios más importantes y por qué importan.',
    content:
      'Solo Leveling ha sido, sin discusión, uno de los fenómenos anime más importantes de los últimos años. La historia de Sung Jinwoo —el cazador más débil que se convierte en el ser más poderoso del universo— ha conquistado a millones de personas en todo el mundo. Y la temporada 2, actualmente en emisión, ha elevado el listón aún más.\n\nPero los lectores del manhwa original (la versión coreana en webtoon) habrán notado algo: no todo es exactamente igual. Algunos cambios son pequeños, otros son significativos, y todos tienen una razón de ser. Aquí te contamos los siete más importantes.\n\n1. El orden de los eventos: El anime ha reorganizado ligeramente la cronología de los primeros capítulos del manhwa para que la narrativa fluya mejor en formato episódico. Los puristas notarán la diferencia, pero el resultado es más redondo narrativamente.\n\n2. La batalla contra los monarcas: En el manhwa, ciertas batallas tienen una duración diferente. El anime ha condensado algunas y expandido otras, aprovechando el medio para ofrecer secuencias de acción más espectaculares.\n\n3. Desarrollo de personajes secundarios: Este es el cambio más aplaudido. El anime ha dado más profundidad a personajes que en el manhwa quedaban en segundo plano, especialmente a los cazadores de rango alto que acompañan a Jinwoo en sus incursiones.\n\n4. La relación con Cha Hae-in: Sin spoilers, pero el anime ha añadido escenas que desarrollan su vínculo de una forma más orgánica que en el webtoon, donde todo sucedía de manera más abrupta.\n\n5. El diseño de los monstruos: Aunque fiel al estilo original, el anime ha rediseñado a algunos monstruos para que funcionen mejor en movimiento. El resultado es visualmente impactante.\n\n6. La banda sonora: Esto no existía en el manhwa, obviamente, pero la OST de Solo Leveling se ha convertido en un fenómeno por sí misma. Temas como "Level Up" son ya icónicos.\n\n7. El final de la temporada 2: Sin entrar en detalles, el anime ha ajustado el cliffhanger final para que funcione mejor como cierre de temporada, dejando abierta la puerta a una tercera entrega que los fans del manhwa saben que será espectacular.\n\nTanto si eres fan del anime como si vienes del manhwa, Solo Leveling es una experiencia que merece la pena en cualquiera de sus formatos. Y si aún no has visto ninguna de las dos… ¿a qué esperas? El nivel de entrada es ahora.',
    category: 'platform',
    date: '2026-06-01',
    coverUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b6414?w=800&h=450&fit=crop&auto=format',
    isFeatured: false,
  },

  // ─── 9. Nuevos lectores ──────────────────────────────────────────────
  {
    title: 'Nunca has leído manga y no sabes por dónde empezar? Esta guía es para ti',
    slug: 'guia-empezar-a-leer-manga-principiantes',
    excerpt:
      'Más de 50.000 series, cientos de géneros y un mar de recomendaciones contradictorias. Si quieres empezar a leer manga pero te sientes abrumado, aquí tienes la ruta definitiva.',
    content:
      'Te ha pasado, ¿verdad? Entras en una librería, ves la sección de manga con cientos de tomos ordenados por editorial, y no sabes ni por dónde mirar. O peor aún: abres Instagram o TikTok y ves recomendaciones sin parar: "lee esto", "esto es lo mejor", "esto es malísimo". Al final, terminas sin leer nada.\n\nTranquilo. A todos nos pasó. Empezar a leer manga puede parecer abrumador, pero en realidad es muy sencillo si sabes qué buscas.\n\nPaso 1: Define qué te gusta en otros medios. ¿Te gustan las historias de acción? Ahí tienes shōnen como One Piece o Demon Slayer. ¿Prefieres thrillers psicológicos? El manga de terror y suspense japonés es el mejor del mundo. ¿Te van las historias románticas? El shojo y el josei te van a volar la cabeza. ¿Buscas algo más adulto y reflexivo? El seinen es tu género.\n\nPaso 2: Empieza por un clásico moderno. No empieces por algo de 50 volúmenes. Elige series más cortas o en curso. Death Note (12 tomos), Fullmetal Alchemist (27 tomos) o Spy x Family (en curso, 13 tomos) son opciones perfectas para empezar.\n\nPaso 3: Usa plataformas digitales. Manga Plus te permite leer gratis los primeros capítulos de casi todo. Así puedes probar series sin compromiso antes de comprar el físico.\n\nPaso 4: No tengas miedo a dejar una serie. Si algo no te gusta, déjalo. El manga es para disfrutar, no para sufrir. Hay miles de series esperándote.\n\nPaso 5: Únete a una comunidad. Leer manga en solitario está bien, pero compartirlo es mucho mejor. Foros, Discord, redes sociales… encontrarás a gente que siente pasión por las mismas historias que tú.\n\nEl mundo del manga es enorme, maravilloso y está lleno de historias que te cambiarán la vida. Solo necesitas dar el primer paso.\n\nY nosotros estamos aquí para acompañarte.',
    category: 'community',
    date: '2026-05-30',
    coverUrl: 'https://images.unsplash.com/photo-1614107159108-8a0f5f86cb1c?w=800&h=450&fit=crop&auto=format',
    isFeatured: false,
  },

  // ─── 10. Jujutsu Kaisen ──────────────────────────────────────────────
  {
    title: 'Jujutsu Kaisen: qué esperar del esperado arco final que prepara Gege Akutami',
    slug: 'jujutsu-kaisen-arco-final-akutami',
    excerpt:
      'El manga de Jujutsu Kaisen se acerca a su conclusión y las teorías se disparan. ¿Qué sabemos del final que Gege Akutami ha estado construyendo durante años?',
    content:
      'El fenómeno Jujutsu Kaisen ha sido una montaña rusa de emociones desde su primer capítulo. Con la conclusión del manga cada vez más cerca —Gege Akutami ha confirmado que la historia entra en su recta final—, los fans de todo el mundo contienen la respiración preguntándose: ¿cómo terminará todo?\n\nPara los que llegáis nuevos: Jujutsu Kaisen es la historia de Yuji Itadori, un joven con una fuerza física sobrehumana que, tras tragar un dedo maldito para salvar a sus amigos, se convierte en el recipiente de Sukuna, el Rey de las Maldiciones. Desde entonces, su vida se convierte en un infierno de batallas, pérdidas y decisiones imposibles.\n\n¿Qué sabemos del arco final? Que Akutami ha estado sembrando pistas desde el principio. La relación entre Yuji y Sukuna, el verdadero origen de las maldiciones, el papel de Kenjaku en todo esto y —quizás lo más importante— qué significa realmente ser un hechicero jujutsu.\n\nEl arco actual, que comenzó tras la masacre de Shibuya y ha pasado por el torneo de intercambio y el arco de la masacre de Shinjuku, ha ido cerrando cuentas pendientes y revelando secretos que los fans llevaban años esperando. Pero la pregunta del millón sigue en el aire: ¿Yuji logrará salvar a Megumi? ¿Podrá derrotar a Sukuna sin perderse a sí mismo en el proceso?\n\nPara los que quieran empezar Jujutsu Kaisen ahora, el anime tiene dos temporadas espectaculares y una película (Jujutsu Kaisen 0) que funciona como precuela perfecta. El manga está en su recta final, lo que significa que es el momento ideal para ponerse al día y vivir el desenlace en tiempo real.\n\nPorque hay historias que merecen ser vividas hasta el final. Y Jujutsu Kaisen, pase lo que pase, será recordada como una de las grandes.',
    category: 'community',
    date: '2026-05-28',
    coverUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&h=450&fit=crop&auto=format',
    isFeatured: true,
  },
];

async function seedNewsAttract() {
  console.log('📰 Sembrando noticias de atracción...\n');

  const admin = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'OWNER'] } },
    select: { id: true },
  });

  if (!admin) {
    console.error('❌ No se encontró ningún admin. Ejecuta el seed principal primero.');
    process.exit(1);
  }

  console.log(`✅ Admin: ${admin.id}\n`);

  let created = 0;
  let skipped = 0;

  for (const article of articles) {
    const publishedAt = new Date(article.date + 'T14:00:00Z');

    const existing = await prisma.newsArticle.findUnique({
      where: { slug: article.slug },
      select: { id: true },
    });

    if (existing) {
      console.log(`⏭️  Ya existe: "${article.title}"`);
      skipped++;
      continue;
    }

    await prisma.newsArticle.create({
      data: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        coverUrl: article.coverUrl,
        category: article.category,
        authorId: admin.id,
        isPublished: true,
        isFeatured: article.isFeatured,
        publishedAt,
      },
    });

    console.log(`✅ Creada: "${article.title}"`);
    created++;
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Creadas: ${created}`);
  console.log(`   Saltadas: ${skipped}`);
  console.log(`   Destacadas: ${articles.filter(a => a.isFeatured).length}`);
  console.log('✨ ¡Noticias de atracción sembradas correctamente!');
}

seedNewsAttract()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
