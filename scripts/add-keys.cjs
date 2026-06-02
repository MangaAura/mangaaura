const fs = require('fs');

const ES_ABOUT = {
  badge: 'Desde 2023 — Construyendo el Futuro del Manga',
  stats: { readersValue: '500K+', creatorsValue: '2,000+', mangaValue: '50K+' },
  team: {
    member1: { name: 'Kenji Nakamura', role: 'Fundador & CEO', desc: 'Ex-editor en Shonen Jump con 15 años de experiencia. Apasionado por conectar creadores con lectores en todo el mundo.' },
    member2: { name: 'Luna Martinez', role: 'Directora de Plataforma de Creadores', desc: 'Ex-artista indie de manga convertida en arquitecta de plataforma. Creó herramientas usadas por más de 2,000 creadores.' },
    member3: { name: 'Alex Chen', role: 'Ingeniero Principal', desc: 'Contribuidor de open source y entusiasta del manga. Hace que la experiencia de lectura sea fluida.' },
    member4: { name: 'Yuki Tanaka', role: 'Directora de Comunidad', desc: 'Administra el servidor de Discord de manga más grande (50K+ miembros). Experta en construcción de comunidad.' }
  },
  values: {
    item1: { title: 'Para Creadores', desc: 'Herramientas potentes para publicar, monetizar y hacer crecer tu audiencia. Conserva el 80% de tus ganancias.' },
    item2: { title: 'Para Lectores', desc: 'Lectura sin anuncios, descargas offline y una comunidad que celebra la cultura del manga.' },
    item3: { title: 'Potenciado por IA', desc: 'Traducciones inteligentes, etiquetado automático y recomendaciones personalizadas impulsadas por IA.' },
    item4: { title: 'Creadores Primero', desc: 'Compensación justa, algoritmos transparentes y apoyo directo de los fans sin intermediarios.' },
    item5: { title: 'Espacio Seguro', desc: 'Tolerancia cero al robo de contenido. Protección DMCA y moderación robusta para todos.' },
    item6: { title: 'Comunidad Global', desc: 'Conecta con fans del manga de más de 150 países. Soporte multilingüe y eventos locales.' }
  }
};

const EN_ABOUT = {
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
};

const ES_GUIDES = { badge: 'Biblioteca de guías', title: 'Guías de Manga', subtitle: 'Aprende todo sobre el mundo del manga: dónde leer, qué apps usar, cómo empezar y descubre las series más vendidas de la historia.', ctaText: '¿No encuentras lo que buscas?', ctaLink: 'Visita nuestro centro de ayuda' };
const EN_GUIDES = { badge: 'Guide Library', title: 'Manga Guides', subtitle: 'Learn everything about the world of manga: where to read, which apps to use, how to get started, and discover the best-selling series in history.', ctaText: "Can't find what you're looking for?", ctaLink: 'Visit our help center' };

function updateFile(filePath, aboutData, guidesData) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const isEs = filePath.includes('es.json');
  const data = isEs ? ES_ABOUT : EN_ABOUT;
  const guides = isEs ? ES_GUIDES : EN_GUIDES;

  // 1. Merge about stats values
  const statsMatch = content.match(/"stats"\s*:\s*\{[\s\S]*?\n\s*\}/);
  if (statsMatch) {
    const statsStr = statsMatch[0];
    if (!statsStr.includes('"readersValue"')) {
      const openBraceIdx = statsStr.indexOf('{');
      const beforeContent = statsStr.slice(0, openBraceIdx + 1);
      const afterContent = statsStr.slice(openBraceIdx + 1);
      const newStats = beforeContent + '\n      "readersValue": "' + data.stats.readersValue + '",\n      "creatorsValue": "' + data.stats.creatorsValue + '",\n      "mangaValue": "' + data.stats.mangaValue + '",' + afterContent;
      content = content.replace(statsMatch[0], newStats);
    }
  }

  // 2. Expand team
  const teamMatch = content.match(/"team"\s*:\s*\{[\s\S]*?\n\s*\}/);
  if (teamMatch) {
    const teamStr = teamMatch[0];
    if (!teamStr.includes('"member1"')) {
      const m1 = data.team.member1, m2 = data.team.member2, m3 = data.team.member3, m4 = data.team.member4;
      const keepBadge = teamStr.match(/"badge"\s*:\s*"[^"]*"/)?.[0] || '"badge": "' + (isEs ? 'El Equipo' : 'The Team') + '"';
      const keepTitle = teamStr.match(/"title"\s*:\s*"[^"]*"/)?.[0] || '"title": "' + (isEs ? 'Conoce a las personas detr\u00e1s de MangaAura' : 'Meet the people behind MangaAura') + '"';
      const keepSub = teamStr.match(/"subtitle"\s*:\s*"[^"]*"/)?.[0] || '"subtitle": ""';
      
      const newTeam = '"team": {\n    ' + keepBadge + ',\n    ' + keepTitle + ',\n    ' + keepSub + ',\n    "member1": {\n      "name": "' + m1.name + '",\n      "role": "' + m1.role + '",\n      "desc": "' + m1.desc + '"\n    },\n    "member2": {\n      "name": "' + m2.name + '",\n      "role": "' + m2.role + '",\n      "desc": "' + m2.desc + '"\n    },\n    "member3": {\n      "name": "' + m3.name + '",\n      "role": "' + m3.role + '",\n      "desc": "' + m3.desc + '"\n    },\n    "member4": {\n      "name": "' + m4.name + '",\n      "role": "' + m4.role + '",\n      "desc": "' + m4.desc + '"\n    }\n  }';
      content = content.replace(teamMatch[0], newTeam);
    }
  }

  // 3. Expand values
  const valuesMatch = content.match(/"values"\s*:\s*\{[\s\S]*?\n\s*\}/);
  if (valuesMatch) {
    const valuesStr = valuesMatch[0];
    if (!valuesStr.includes('"item1"')) {
      const keepBadge = valuesStr.match(/"badge"\s*:\s*"[^"]*"/)?.[0] || '"badge": "' + (isEs ? 'Nuestros Valores' : 'Our Values') + '"';
      const keepTitle = valuesStr.match(/"title"\s*:\s*"[^"]*"/)?.[0] || '"title": ""';
      const keepSub = valuesStr.match(/"subtitle"\s*:\s*"[^"]*"/)?.[0] || '"subtitle": ""';
      
      let itemsStr = '';
      for (let i = 1; i <= 6; i++) {
        const item = data.values['item' + i];
        itemsStr += ',\n    "item' + i + '": {\n      "title": "' + item.title + '",\n      "desc": "' + item.desc + '"\n    }';
      }
      const newValues = '"values": {\n    ' + keepBadge + ',\n    ' + keepTitle + ',\n    ' + keepSub + itemsStr + '\n  }';
      content = content.replace(valuesMatch[0], newValues);
    }
  }

  // 4. Replace guides string with object
  const guidesMatch = content.match(/"guides"\s*:\s*"[^"]*"/);
  if (guidesMatch) {
    const newGuides = JSON.stringify(guides);
    // Replace just the value part after "guides": 
    const prefix = content.slice(0, guidesMatch.index);
    const afterMatch = content.slice(guidesMatch.index + guidesMatch[0].length);
    content = prefix + '"guides": ' + newGuides + afterMatch;
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Updated:', filePath, '(' + (content.match(/"about"/) ? 'about ok' : 'about missing') + ')');
}

updateFile('src/i18n/locales/es.json', ES_ABOUT, ES_GUIDES);
updateFile('src/i18n/locales/en.json', EN_ABOUT, EN_GUIDES);
console.log('Done!');
