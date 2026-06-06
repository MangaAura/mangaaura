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
    coverUrl: 'https://www.animenewsnetwork.com/thumbnails/crop1200x630gOK/youtube/ZcsbhQxhFqU.jpg',
    isFeatured: true,
  },

  // ─── 2. Demon Slayer Infinity Castle ─────────────────────────────────
  {
    title: 'Demon Slayer Infinity Castle: la trilogía que cierra la saga — todo lo que sabemos',
    slug: 'demon-slayer-infinity-castle-trilogia',
    excerpt:
      'La primera película de la trilogía Infinity Castle ya arrasó en taquilla en 2025. El Blu-ray sale el 29 de julio y la segunda parte se espera para 2027. Esto es todo lo que sabemos.',
    content:
      'Cuando Demon Slayer: Mugen Train se estrenó en 2020, nadie imaginaba que una película de anime podría convertirse en la más taquillera de la historia en Japón. Cinco años después, la franquicia ha demostrado que no fue casualidad. Infinity Castle —la primera de las tres películas que adaptan el arco final del manga— se estrenó en Japón el 18 de julio de 2025 y en todo el mundo a partir de septiembre de ese mismo año, arrasando en taquilla con una recaudación que la sitúa entre las películas de anime más exitosas de la historia.\n\nPara los que llegáis nuevos: Demon Slayer cuenta la historia de Tanjiro Kamado, un joven que encuentra a su familia asesinada por un demonio y a su hermana Nezuko transformada en uno. Su viaje para convertir a Nezuko en humana y derrotar al Rey Demonio Muzan Kibutsuji es una montaña rusa de emociones que ha conquistado al mundo entero.\n\nLa película, producida por Ufotable, recibió una acogida espectacular tanto de crítica como de público. En marzo de 2026 regresó a los cines de Norteamérica, Reino Unido e India en formato SCREENX (pantalla de 270 grados), dando una segunda oportunidad a quienes se la perdieron en su estreno original.\n\n¿Y ahora qué? El Blu-ray y DVD en Japón salen el 29 de julio de 2026. En cuanto a la segunda película de la trilogía, se espera que llegue a lo largo de 2027, aunque Ufotable no ha confirmado una fecha exacta. Y la tercera entrega —la conclusión definitiva— apunta a 2029.\n\nSi nunca has visto Demon Slayer, este es el momento perfecto. Las tres temporadas y Mugen Train están disponibles en streaming. Porque hay historias que merecen ser vividas en pantalla grande. Y esta es, sin duda, una de ellas.',
    category: 'platform',
    date: '2026-06-07',
    coverUrl: 'https://www.animenewsnetwork.com/thumbnails/crop1200x630gHB/youtube/Ss0gxiuCPKE.jpg',
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
    coverUrl: 'https://www.animenewsnetwork.com/thumbnails/crop1200x630gLK/cms/news.8/222707/sakamoto-cours-2.jpeg',
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
    coverUrl: 'https://www.animenewsnetwork.com/thumbnails/crop1200x630gGA/cms/news.8/219389/chainsaw-man-rize-1.jfif.jpeg',
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
    coverUrl: 'https://www.animenewsnetwork.com/thumbnails/crop1200x630gJJ/cms/news.8/223207/dan-da-dan-s2.jpg',
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
    coverUrl: 'https://www.animenewsnetwork.com/thumbnails/crop1200x630gK9/cms/feature/237739/006578-00002-01-20250414192709-001.jpg',
    isFeatured: false,
  },

  // ─── 7. Kaiju No. 8 ───────────────────────────────────────────────────
  {
    title: 'Kaiju No. 8: el arco final ya está en producción y promete una guerra sin cuartel',
    slug: 'kaiju-no-8-arco-final-produccion',
    excerpt:
      'La temporada 2 arrasó en 2025 y ahora Production I.G prepara el desenlace. El arco final del anime adaptará los capítulos culminantes del manga de Naoya Matsumoto.',
    content:
      'Si hay un anime que ha sabido mantener a sus fans al borde del asiento durante dos temporadas, ese es Kaiju No. 8. La historia de Kafka Hibino —un treintañero que nunca renunció a su sueño de unirse a las Fuerzas de Defensa y terminó convirtiéndose en el kaiju que juró destruir— ha conquistado a millones de espectadores en todo el mundo.\n\nLa temporada 2 se emitió de julio a septiembre de 2025, adaptando el arco posterior a la detención de Kafka por las Fuerzas de Defensa y la introducción del carismático capitán Gen Narumi. Con 11 episodios a cargo de Production I.G y el diseño de criaturas de Studio Khara, la temporada elevó el listón en animación y coreografías de combate.\n\n¿Y ahora qué? Durante la Jump Festa 2026, celebrada en diciembre de 2025, se anunció que el arco final —titulado Kaiju No. 8: Kanketsu-hen— ya está en producción. El teaser tráiler mostrado en el evento promete una guerra a gran escala entre Kaiju No. 8 y Kaiju No. 9, con batallas que pondrán a prueba los límites de Kafka y sus compañeros.\n\nAdemás, se ha confirmado un anime corto original titulado "Narumi no Heijitsu" (Los Días de Narumi), centrado en la vida cotidiana del capitán de la Primera División, que llegará en otoño de 2026.\n\nAunque no hay fecha exacta para el arco final, se espera que llegue entre finales de 2026 y principios de 2027. El manga original de Naoya Matsumoto, que concluyó en julio de 2025 con 129 capítulos y 16 volúmenes, ya está completo, así que quienes quieran adelantarse pueden leerlo.\n\nPorque a veces, para proteger a la humanidad, primero tienes que convertirte en el monstruo. Y ahora, toca despedirse.',
    category: 'tools',
    date: '2026-06-02',
    coverUrl: 'https://www.animenewsnetwork.com/thumbnails/crop1200x630gJD/youtube/I5op9OLaQNA.jpg',
    isFeatured: false,
  },

  // ─── 8. Solo Leveling comparativa ─────────────────────────────────────
  {
    title: 'Solo Leveling temporada 2 vs manhwa: 7 diferencias que los fans tienen que conocer',
    slug: 'solo-leveling-s2-diferencias-manhwa',
    excerpt:
      'La segunda temporada del anime fue un fenómeno global en 2025. Pero los lectores del manhwa notaron cambios clave. Analizamos las diferencias más importantes.',
    content:
      'Solo Leveling ha sido, sin discusión, uno de los fenómenos anime más importantes de los últimos años. La historia de Sung Jinwoo —el cazador más débil que se convierte en el ser más poderoso del universo— conquistó a millones de personas en todo el mundo. Y la temporada 2, que se emitió de enero a marzo de 2025, elevó el listón hasta cotas insospechadas.\n\nPero los lectores del manhwa original (la versión coreana en webtoon) notaron algo: no todo es exactamente igual. Algunos cambios son pequeños, otros son significativos, y todos tienen una razón de ser. Aquí te contamos los siete más importantes.\n\n1. El orden de los eventos: El anime reorganizó ligeramente la cronología de los primeros capítulos del manhwa para que la narrativa fluyera mejor en formato episódico. Los puristas notaron la diferencia, pero el resultado fue más redondo narrativamente.\n\n2. La batalla contra los monarcas: En el manhwa, ciertas batallas tienen una duración diferente. El anime condensó algunas y expandió otras, aprovechando el medio para ofrecer secuencias de acción más espectaculares.\n\n3. Desarrollo de personajes secundarios: Este fue el cambio más aplaudido. El anime dio más profundidad a personajes que en el manhwa quedaban en segundo plano, especialmente a los cazadores de rango alto que acompañan a Jinwoo en sus incursiones.\n\n4. La relación con Cha Hae-in: Sin spoilers, pero el anime añadió escenas que desarrollan su vínculo de una forma más orgánica que en el webtoon, donde todo sucedía de manera más abrupta.\n\n5. El diseño de los monstruos: Aunque fiel al estilo original, el anime rediseñó a algunos monstruos para que funcionaran mejor en movimiento. El resultado fue visualmente impactante.\n\n6. La banda sonora: Esto no existía en el manhwa, obviamente, pero la OST de Solo Leveling se ha convertido en un fenómeno por sí misma. Temas como "Level Up" son ya icónicos.\n\n7. El final de la temporada 2: El anime ajustó el cliffhanger final para que funcionara mejor como cierre de temporada, dejando abierta la puerta a una tercera entrega que los fans del manhwa saben que será espectacular.\n\nTanto si eres fan del anime como si vienes del manhwa, Solo Leveling es una experiencia que merece la pena en cualquiera de sus formatos.',
    category: 'platform',
    date: '2026-06-01',
    coverUrl: 'https://www.animenewsnetwork.com/thumbnails/crop1200x630g30/cms/news.7/215573/season-2.jpg',
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
    coverUrl: 'https://www.animenewsnetwork.com/thumbnails/crop1200x630gK9/cms/feature/237739/006578-00002-01-20250414192709-001.jpg',
    isFeatured: false,
  },

  // ─── 10. Jujutsu Kaisen ──────────────────────────────────────────────
  {
    title: 'Jujutsu Kaisen: el manga terminó, el anime sigue — así fue el final y qué viene ahora',
    slug: 'jujutsu-kaisen-final-manga-anime',
    excerpt:
      'El manga de Jujutsu Kaisen concluyó en septiembre de 2024 tras 271 capítulos. Más de 100 millones de copias después, el anime se prepara para adaptar el Culling Game.',
    content:
      'El fenómeno Jujutsu Kaisen llegó a su fin en las páginas de Weekly Shonen Jump el 29 de septiembre de 2024, tras seis años y medio de publicación. Con 271 capítulos recopilados en 30 volúmenes y más de 100 millones de copias en circulación, la obra de Gege Akutami se despidió por todo lo alto, dejando un legado que la sitúa entre los mangas más importantes de la década.\n\nPara los que llegáis nuevos: Jujutsu Kaisen es la historia de Yuji Itadori, un joven con una fuerza física sobrehumana que, tras tragar un dedo maldito para salvar a sus amigos, se convierte en el recipiente de Sukuna, el Rey de las Maldiciones. Desde entonces, su vida se convierte en un infierno de batallas, pérdidas y decisiones imposibles.\n\n¿Cómo terminó el manga? (Sin spoilers mayores.) La batalla final —el Shinjuku Showdown— enfrentó a Yuji y sus aliados contra Sukuna en el cuerpo de Megumi Fushiguro. Tras una guerra de desgaste que dejó caer a varios de los hechiceros más poderosos, Yuji logró liberar a Megumi y derrotar a Sukuna de una vez por todas. El capítulo final, titulado "From Now On", muestra a Yuji, Megumi y Nobara retomando sus vidas. El epílogo, publicado en el volumen 30 el 25 de diciembre de 2024, añadió 16 páginas que cierran los arcos de Nobara, Panda, Uraume y Yuko.\n\n¿Y ahora qué? El anime tiene pendiente adaptar el arco del Culling Game —también conocido como Juegos de la Muerte— que se espera sea la temporada 3. Anunciado oficialmente, aún no tiene fecha de estreno, pero se espera que sea uno de los eventos anime más importantes cuando llegue.\n\nSi quieres empezar Jujutsu Kaisen ahora, el anime tiene dos temporadas espectaculares y una película (Jujutsu Kaisen 0) que funciona como precuela perfecta. El manga ya está completo, así que puedes leerlo de principio a fin sin esperas.\n\nPorque hay historias que merecen ser vividas hasta el final. Y Jujutsu Kaisen, pase lo que pase, será recordada como una de las grandes.',
    category: 'community',
    date: '2026-05-28',
    coverUrl: 'https://www.animenewsnetwork.com/thumbnails/crop1200x630gJH/youtube/ruX3rIj3--w.jpg',
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
