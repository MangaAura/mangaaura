const { readFileSync, writeFileSync } = require('fs');

const ES_KEYS = {
  about: {
    badge: 'Desde 2023 — Construyendo el Futuro del Manga',
    stats: { readersValue: '500K+', creatorsValue: '2,000+', mangaValue: '50K+' },
    team: {
      member1: { name: 'Kenji Nakamura', role: 'Fundador & CEO', desc: 'Ex-editor en Shonen Jump con 15 a\u00f1os de experiencia. Apasionado por conectar creadores con lectores en todo el mundo.' },
      member2: { name: 'Luna Martinez', role: 'Directora de Plataforma de Creadores', desc: 'Ex-artista indie de manga convertida en arquitecta de plataforma. Cre\u00f3 herramientas usadas por m\u00e1s de 2,000 creadores.' },
      member3: { name: 'Alex Chen', role: 'Ingeniero Principal', desc: 'Contribuidor de open source y entusiasta del manga. Hace que la experiencia de lectura sea fluida.' },
      member4: { name: 'Yuki Tanaka', role: 'Directora de Comunidad', desc: 'Administra el servidor de Discord de manga m\u00e1s grande (50K+ miembros). Experta en construcci\u00f3n de comunidad.' }
    },
    values: {
      item1: { title: 'Para Creadores', desc: 'Herramientas potentes para publicar, monetizar y hacer crecer tu audiencia. Conserva el 80% de tus ganancias.' },
      item2: { title: 'Para Lectores', desc: 'Lectura sin anuncios, descargas offline y una comunidad que celebra la cultura del manga.' },
      item3: { title: 'Potenciado por IA', desc: 'Traducciones inteligentes, etiquetado autom\u00e1tico y recomendaciones personalizadas impulsadas por IA.' },
      item4: { title: 'Creadores Primero', desc: 'Compensaci\u00f3n justa, algoritmos transparentes y apoyo directo de los fans sin intermediarios.' },
      item5: { title: 'Espacio Seguro', desc: 'Tolerancia cero al robo de contenido. Protecci\u00f3n DMCA y moderaci\u00f3n robusta para todos.' },
      item6: { title: 'Comunidad Global', desc: 'Conecta con fans del manga de m\u00e1s de 150 pa\u00edses. Soporte multiling\u00fce y eventos locales.' }
    }
  },
  guides: { badge: 'Biblioteca de gu\u00edas', title: 'Gu\u00edas de Manga', subtitle: 'Aprende todo sobre el mundo del manga: d\u00f3nde leer, qu\u00e9 apps usar, c\u00f3mo empezar y descubre las series m\u00e1s vendidas de la historia.', ctaText: '\u00bfNo encuentras lo que buscas?', ctaLink: 'Visita nuestro centro de ayuda' }
};

const EN_KEYS = {
  about: {
    badge: 'Since 2023 \u2014 Building the Future of Manga',
    stats: { readersValue: '500K+', creatorsValue: '2,000+', mangaValue: '50K+' },
    team: {
      member1: { name: 'Kenji Nakamura', role: 'Founder & CEO', desc: 'Ex-editor at Shonen Jump with 15 years experience. Passionate about connecting creators with readers worldwide.' },
      member2: { name: 'Luna Martinez', role: 'Head of Creator Platform', desc: 'Former indie manga artist turned platform architect. Built tools used by 2000+ creators on the platform.' },
      member3: { name: 'Alex Chen', role: 'Lead Engineer', desc: 'Open source contributor and manga enthusiast. Makes the reading experience smooth as silk.' },
      member4: { name: 'Yuki Tanaka', role: 'Community Director', desc: 'Runs the largest manga Discord server (50k+ members). Fluent in community building and creator relations.' }
    },
    values: {
      item1: { title: 'For Creators', desc: 'Powerful tools to publish, monetize, and grow your audience. Keep 80% of your earnings.' },
      item2: { title: 'For Readers', desc: 'Ad-free reading, offline downloads, and a community that celebrates manga culture.' },
      item3: { title: 'AI Enhanced', desc: 'Smart translations, auto-tagging, and personalized recommendations powered by AI.' },
      item4: { title: 'Creator First', desc: 'Fair compensation, transparent algorithms, and direct fan support without intermediaries.' },
      item5: { title: 'Safe Space', desc: 'Zero tolerance for content theft. DMCA protection and robust moderation for everyone.' },
      item6: { title: 'Global Community', desc: 'Connect with manga fans from 150+ countries. Multilingual support and local events.' }
    }
  },
  guides: { badge: 'Guide Library', title: 'Manga Guides', subtitle: "Learn everything about the world of manga: where to read, which apps to use, how to get started, and discover the best-selling series in history.", ctaText: "Can't find what you're looking for?", ctaLink: 'Visit our help center' }
};

function findJsonEnd(content, startIdx) {
  let depth = 0, inString = false, escape = false;
  for (let i = startIdx; i < content.length; i++) {
    const ch = content[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') { if (depth === 0) return i + 1; depth--; }
  }
  return content.length;
}

function processFile(filepath, langKeys) {
  let content = readFileSync(filepath, 'utf-8');
  const isEs = filepath.includes('es.json');

  // 1. Add about.badge
  const aboutMatch = content.match(/"about"\s*:\s*\{/);
  if (aboutMatch) {
    const insertPos = aboutMatch.index + aboutMatch[0].length;
    const aboutSlice = content.slice(insertPos);
    if (!aboutSlice.startsWith('\n    "badge"')) {
      content = content.slice(0, insertPos) + '\n    "badge": "' + langKeys.about.badge + '",' + content.slice(insertPos);
    }
  }

  // 2. Add stats values
  const statsMatch = content.match(/"stats"\s*:\s*\{/);
  if (statsMatch) {
    const insertPos = statsMatch.index + statsMatch[0].length;
    const statsSlice = content.slice(insertPos);
    if (!statsSlice.startsWith('\n      "readersValue"')) {
      content = content.slice(0, insertPos) + '\n      "readersValue": "' + langKeys.about.stats.readersValue + '",\n      "creatorsValue": "' + langKeys.about.stats.creatorsValue + '",\n      "mangaValue": "' + langKeys.about.stats.mangaValue + '",' + content.slice(insertPos);
    }
  }

  // 3. Replace team section
  const teamMatch = content.match(/"team"\s*:\s*\{/);
  if (teamMatch) {
    const teamEnd = findJsonEnd(content, teamMatch.index + teamMatch[0].length - 1);
    const teamSection = content.slice(teamMatch.index, teamEnd);
    if (!teamSection.includes('"member1"')) {
      const newTeam = '"team": {\n    "badge": "' + (isEs ? 'El Equipo' : 'The Team') + '",\n    "title": "' + (isEs ? 'Conoce a las personas detr\u00e1s de MangaAura' : 'Meet the people behind MangaAura') + '",\n    "subtitle": "' + (isEs ? 'Somos un equipo diverso de creadores, ingenieros y entusiastas del manga comprometidos a construir la mejor plataforma para la comunidad.' : 'We are a diverse team of creators, engineers, and manga enthusiasts committed to building the best platform for the community.') + '",\n    "member1": { "name": "' + langKeys.about.team.member1.name + '", "role": "' + langKeys.about.team.member1.role + '", "desc": "' + langKeys.about.team.member1.desc + '" },\n    "member2": { "name": "' + langKeys.about.team.member2.name + '", "role": "' + langKeys.about.team.member2.role + '", "desc": "' + langKeys.about.team.member2.desc + '" },\n    "member3": { "name": "' + langKeys.about.team.member3.name + '", "role": "' + langKeys.about.team.member3.role + '", "desc": "' + langKeys.about.team.member3.desc + '" },\n    "member4": { "name": "' + langKeys.about.team.member4.name + '", "role": "' + langKeys.about.team.member4.role + '", "desc": "' + langKeys.about.team.member4.desc + '" }\n  }';
      content = content.slice(0, teamMatch.index) + newTeam + content.slice(teamEnd);
    }
  }

  // 4. Replace values section
  const valuesMatch = content.match(/"values"\s*:\s*\{/);
  if (valuesMatch) {
    const valuesEnd = findJsonEnd(content, valuesMatch.index + valuesMatch[0].length - 1);
    const valuesSection = content.slice(valuesMatch.index, valuesEnd);
    if (!valuesSection.includes('"item1"')) {
      const items = [];
      for (let i = 1; i <= 6; i++) {
        const item = langKeys.about.values['item' + i];
        items.push('    "item' + i + '": { "title": "' + item.title + '", "desc": "' + item.desc + '" }');
      }
      const newValues = '"values": {\n    "badge": "' + (isEs ? 'Nuestros Valores' : 'Our Values') + '",\n    "title": "' + (isEs ? 'Lo que nos impulsa' : 'What drives us') + '",\n    "subtitle": "' + (isEs ? 'Creamos una plataforma que pone a creadores y lectores en el centro de todo lo que hacemos.' : 'We built a platform that puts creators and readers at the center of everything we do.') + '",\n' + items.join(',\n') + '\n  }';
      content = content.slice(0, valuesMatch.index) + newValues + content.slice(valuesEnd);
    }
  }

  // 5. Replace guides string with object
  const guidesMatch = content.match(/"guides"\s*:\s*"[^"]*"/);
  if (guidesMatch) {
    const after = content[guidesMatch.index + guidesMatch[0].length];
    if (after === ',' || after === '\n' || after === '\r') {
      const newGuides = '"guides": {\n    "badge": "' + langKeys.guides.badge + '",\n    "title": "' + langKeys.guides.title + '",\n    "subtitle": "' + langKeys.guides.subtitle + '",\n    "ctaText": "' + langKeys.guides.ctaText + '",\n    "ctaLink": "' + langKeys.guides.ctaLink + '"\n  }';
      content = content.slice(0, guidesMatch.index) + newGuides + content.slice(guidesMatch.index + guidesMatch[0].length);
    }
  }

  writeFileSync(filepath, content, 'utf-8');
  console.log('Updated:', filepath);
}

processFile('src/i18n/locales/es.json', ES_KEYS);
processFile('src/i18n/locales/en.json', EN_KEYS);
console.log('Done!');
