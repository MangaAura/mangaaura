module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nueva funcionalidad
        'fix',      // Corrección de bug
        'docs',     // Documentación
        'style',    // Formato (sin cambio de código)
        'refactor', // Refactorización
        'perf',     // Performance
        'test',     // Tests
        'chore',    // Mantenimiento
        'ci',       // CI/CD
        'build',    // Build system
        'revert',   // Revertir cambios
        'i18n',     // Internacionalización
        'a11y',     // Accesibilidad
        'seo',      // SEO
        'db',       // Base de datos / migraciones
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'auth',     'api',        'ui',
        'reader',   'manga',      'chapter',
        'admin',    'profile',    'settings',
        'clan',     'comments',   'notifications',
        'payments', 'stripe',     'aura',
        'xp',       'achievements', 'quests',
        'search',   'feed',       'bookmarks',
        'collections', 'corrections', 'sponsorships',
        'tips',     'transactions', 'messages',
        'i18n',     'a11y',       'seo',
        'pwa',      'cache',      'redis',
        'ai',       'email',      'cron',
        'ci',       'deps',       'deps-dev',
        'db',       'config',     'docker',
        'test',     'docs',       'scripts',
        'layout',   'home',       'landing',
      ],
    ],
    'scope-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
    'subject-case': [2, 'always', 'lower-case'],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
  },
};
