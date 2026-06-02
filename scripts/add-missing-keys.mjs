import { readFileSync, writeFileSync } from 'fs';

function addKeys(filePath, updates) {
  const raw = readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);
  apply(json, updates);
  writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
  console.log(`✓ Updated ${filePath}`);
}

function apply(obj, updates) {
  for (const [key, value] of Object.entries(updates)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (!obj[key]) obj[key] = {};
      apply(obj[key], value);
    } else {
      obj[key] = value;
    }
  }
}

// --- es.json ---
addKeys('src/i18n/locales/es.json', {
  about: {
    stats: {
      readersValue: '500K+',
      creatorsValue: '2,000+',
      mangaValue: '50K+',
    },
  },
  guides: {
    badge: 'Biblioteca de guías',
    title: 'Todo sobre el mundo del manga',
    subtitle: 'Guías completas para leer, comprar y disfrutar del manga al máximo. Desde principiantes hasta coleccionistas.',
    ctaText: '¿No encuentras lo que buscas?',
    ctaLink: 'Visita nuestro centro de ayuda',
  },
});

// --- en.json ---
addKeys('src/i18n/locales/en.json', {
  about: {
    stats: {
      readersValue: '500K+',
      creatorsValue: '2,000+',
      mangaValue: '50K+',
    },
  },
  guides: {
    badge: 'Guides Library',
    title: 'Everything about the world of manga',
    subtitle: 'Complete guides to read, buy, and enjoy manga to the fullest. From beginners to collectors.',
    ctaText: "Can't find what you're looking for?",
    ctaLink: 'Visit our help center',
  },
});

console.log('✅ All keys added successfully');
