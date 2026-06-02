import { readFileSync, writeFileSync } from 'fs';

function addKeys(filePath, updates) {
  const raw = readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);
  apply(json, updates);
  writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
  console.log('✓ Updated ' + filePath);
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

addKeys('src/i18n/locales/es.json', {
  page: {
    announcements: {
      badge: 'Comunicados oficiales',
      heroTitle: 'Anuncios',
      heroSubtitle: 'Novedades importantes, mantenimientos y comunicados oficiales de MangaAura.',
      ctaTitle: '¿Tienes alguna pregunta?',
      ctaDescription: 'Si necesitas más información sobre nuestros anuncios, visita nuestro centro de ayuda.',
      ctaButton: 'Ir al centro de ayuda',
    },
  },
});

addKeys('src/i18n/locales/en.json', {
  page: {
    announcements: {
      badge: 'Official announcements',
      heroTitle: 'Announcements',
      heroSubtitle: 'Important news, maintenance updates, and official announcements from MangaAura.',
      ctaTitle: 'Have any questions?',
      ctaDescription: 'If you need more information about our announcements, visit our help center.',
      ctaButton: 'Go to help center',
    },
  },
});

console.log('✅ All announcements i18n keys added');
