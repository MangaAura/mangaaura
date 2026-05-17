import { describe, it, expect } from 'vitest';
import { User } from '@/core/entities/User';
import { Email } from '@/core/value-objects/Email';
import { Password } from '@/core/value-objects/Password';
import { XP } from '@/core/value-objects/XP';

describe('User Entity', () => {
  describe('creación básica', () => {
    it('debe crear usuario con valores por defecto', () => {
      const user = User.create({
        email: Email.create('test@test.com'),
        username: 'testuser',
      });

      expect(user.id).toBeDefined();
      expect(user.email.value).toBe('test@test.com');
      expect(user.username).toBe('testuser');
      expect(user.role).toBe('USER');
      expect(user.xp.amount).toBe(0);
      expect(user.inkcoins.amount).toBe(0);
      expect(user.readingStreak).toBe(0);
    });

    it('debe crear usuario con valores personalizados', () => {
      const user = User.create({
        id: 'custom-id',
        email: Email.create('user@test.com'),
        username: 'customuser',
        displayName: 'Custom User',
        role: 'CREATOR',
        xpPoints: 1000,
        inkcoinsBalance: 500,
      });

      expect(user.id).toBe('custom-id');
      expect(user.username).toBe('customuser');
      expect(user.displayName).toBe('Custom User');
      expect(user.role).toBe('CREATOR');
      expect(user.xp.amount).toBe(1000);
      expect(user.inkcoins.amount).toBe(500);
    });
  });

  describe('registro con email', () => {
    it('debe registrar usuario con contraseña', () => {
      const { user, events } = User.registerWithEmail(
        Email.create('new@user.com'),
        'newuser',
        Password.createFromPlain('SecurePass123!')
      );

      expect(user.username).toBe('newuser');
      expect(user.inkcoins.amount).toBe(50); // Bonus de registro
      expect(user.passwordHash).toBeDefined();

      const regEvent = events.find((e) => e.type === 'USER_REGISTERED');
      expect(regEvent).toBeDefined();
      expect(regEvent?.payload.registrationBonus).toBe(50);
    });
  });

  describe('registro con OAuth', () => {
    it('debe registrar usuario desde OAuth', () => {
      const { user, events } = User.registerWithOAuth(
        Email.create('oauth@user.com'),
        'oauthuser',
        'google',
        'google-123'
      );

      expect(user.emailVerified).toBeDefined();
      expect(user.inkcoins.amount).toBe(50);

      const oauthEvent = events.find((e) => e.type === 'USER_REGISTERED_OAUTH');
      expect(oauthEvent).toBeDefined();
      expect(oauthEvent?.payload.provider).toBe('google');
    });
  });

  describe('gamificación - XP', () => {
    it('debe agregar XP y emitir evento', () => {
      const user = User.create({
        email: Email.create('xp@test.com'),
        username: 'xptest',
      });

      user.clearDomainEvents();
      user.addXP(XP.fromChapterComplete(), 'CHAPTER_COMPLETE');

      expect(user.xp.amount).toBe(2);
      expect(user.domainEvents).toHaveLength(1);
      expect(user.domainEvents[0].type).toBe('XP_EARNED');
    });

    it('debe subir de nivel cuando alcanza suficiente XP', () => {
      const user = User.create({
        email: Email.create('levelup@test.com'),
        username: 'levelup',
        xpPoints: 998,
      });

      expect(user.level).toBe(1);
      user.clearDomainEvents();

      user.addXP(XP.fromComment(), 'COMMENT_POSTED'); // +5 XP

      expect(user.xp.amount).toBe(1003);
      expect(user.level).toBe(2);

      const levelUpEvent = user.domainEvents.find((e) => e.type === 'LEVEL_UP');
      expect(levelUpEvent).toBeDefined();
      expect(levelUpEvent?.payload.oldLevel).toBe(1);
      expect(levelUpEvent?.payload.newLevel).toBe(2);
    });

    it('debe completar capítulo y ganar XP', () => {
      const user = User.create({
        email: Email.create('chapter@test.com'),
        username: 'chaptertest',
      });

      user.completeChapter('chapter-123');

      expect(user.xp.amount).toBe(2);
      expect(user.readingStreak).toBe(1);
      expect(user.lastReadAt).toBeDefined();

      const events = user.domainEvents.filter(
        (e) => e.type === 'CHAPTER_COMPLETED' || e.type === 'XP_EARNED'
      );
      expect(events.length).toBeGreaterThanOrEqual(2);
    });

    it('debe ganar XP por comentario', () => {
      const user = User.create({
        email: Email.create('comment@test.com'),
        username: 'commenttest',
      });

      user.postComment('chapter-456');

      expect(user.xp.amount).toBe(5);
    });
  });

  describe('gamificación - InkCoins', () => {
    it('debe agregar InkCoins', () => {
      const user = User.create({
        email: Email.create('coins@test.com'),
        username: 'coinstest',
      });

      user.clearDomainEvents();
      user.addInkCoins(100, 'DAILY_BONUS');

      expect(user.inkcoins.amount).toBe(100);
      expect(user.domainEvents[0].type).toBe('INKCOINS_EARNED');
    });

    it('debe gastar InkCoins', () => {
      const user = User.create({
        email: Email.create('spend@test.com'),
        username: 'spendtest',
        inkcoinsBalance: 200,
      });

      user.spendInkCoins(50, 'TIP_TO_AUTHOR');

      expect(user.inkcoins.amount).toBe(150);
    });

    it('debe lanzar error al gastar más de lo disponible', () => {
      const user = User.create({
        email: Email.create('poor@test.com'),
        username: 'poortest',
        inkcoinsBalance: 10,
      });

      expect(() => user.spendInkCoins(100, 'TIP')).toThrow();
    });
  });

  describe('lectura y streak', () => {
    it('debe incrementar streak al leer diariamente', () => {
      // Usar fechas fijas para evitar problemas de zona horaria
      const yesterday = new Date('2024-01-15T10:00:00Z');
      const today = new Date('2024-01-16T14:00:00Z');

      // Mock Date para el test
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor(...args: (string | number | Date)[]) {
          if (args.length === 0) {
            super(today);
          } else {
            super(...(args as [string | number | Date]));
          }
        }
        static now() {
          return today.getTime();
        }
      } as DateConstructor;

      const user = User.create({
        email: Email.create('streak@test.com'),
        username: 'streaktest',
        readingStreak: 5,
        lastReadAt: yesterday,
      });

      user.completeChapter('chapter-789');

      // Restaurar Date
      global.Date = originalDate;

      expect(user.readingStreak).toBe(6);
    });

    it('debe establecer streak en 1 para primera lectura', () => {
      const user = User.create({
        email: Email.create('firstread@test.com'),
        username: 'firstread',
      });

      user.completeChapter('chapter-001');

      expect(user.readingStreak).toBe(1);
    });
  });

  describe('roles y permisos', () => {
    it('debe verificar roles correctamente', () => {
      const user = User.create({
        email: Email.create('admin@test.com'),
        username: 'adminuser',
        role: 'ADMIN',
      });

      expect(user.hasRole('ADMIN')).toBe(true);
      expect(user.hasRole('USER')).toBe(false);
    });

    it('debe lanzar error si no tiene rol requerido', () => {
      const user = User.create({
        email: Email.create('regular@test.com'),
        username: 'regularuser',
        role: 'USER',
      });

      expect(() => user.requireRole('ADMIN')).toThrow();
    });

    it('debe cambiar de rol', () => {
      const user = User.create({
        email: Email.create('promote@test.com'),
        username: 'promoteuser',
      });

      user.changeRole('CREATOR');

      expect(user.role).toBe('CREATOR');
    });
  });

  describe('perfil', () => {
    it('debe actualizar display name y avatar', () => {
      const user = User.create({
        email: Email.create('profile@test.com'),
        username: 'profileuser',
      });

      user.updateProfile({
        displayName: 'New Display Name',
        avatarUrl: 'https://example.com/avatar.png',
      });

      expect(user.displayName).toBe('New Display Name');
      expect(user.avatarUrl).toBe('https://example.com/avatar.png');
    });
  });

  describe('eventos de dominio', () => {
    it('debe limpiar eventos después de procesarlos', () => {
      const user = User.create({
        email: Email.create('events@test.com'),
        username: 'eventstest',
      });

      user.addInkCoins(100, 'TEST');
      expect(user.domainEvents.length).toBeGreaterThan(0);

      user.clearDomainEvents();
      expect(user.domainEvents.length).toBe(0);
    });
  });

  describe('serialización', () => {
    it('debe serializar a JSON correctamente', () => {
      const user = User.create({
        id: 'test-id',
        email: Email.create('json@test.com'),
        username: 'jsontest',
        xpPoints: 1500,
        inkcoinsBalance: 300,
      });

      const json = user.toJSON();

      expect(json.id).toBe('test-id');
      expect(json.email).toBe('json@test.com');
      expect(json.level).toBe(2);
      expect(json.rank).toBe('Lector Shonen');
      expect(json.inkcoinsBalance).toBe(300);
    });
  });
});
