import { describe, it, expect } from 'vitest';
import { Email } from '@/core/value-objects/Email';
import { User } from '@/core/entities/User';
import { XP } from '@/core/value-objects/XP';

describe('Gamification Use Cases', () => {
  describe('ganar XP', () => {
    it('debe ganar XP al completar capítulo', () => {
      const user = User.create({
        email: Email.create('xp@test.com'),
        username: 'xptest',
        xpPoints: 0,
      });

      user.clearDomainEvents();
      user.completeChapter('chapter-001');

      expect(user.xp.amount).toBe(2);

      const xpEvent = user.domainEvents.find((e) => e.type === 'XP_EARNED');
      expect(xpEvent?.payload.amount).toBe(2);
      expect(xpEvent?.payload.reason).toBe('CHAPTER_COMPLETE');
    });

    it('debe ganar XP al comentar', () => {
      const user = User.create({
        email: Email.create('comment@test.com'),
        username: 'commenttest',
      });

      user.clearDomainEvents();
      user.postComment('chapter-001');

      expect(user.xp.amount).toBe(5);
    });

    it('debe subir de nivel correctamente', () => {
      const user = User.create({
        email: Email.create('levelup@test.com'),
        username: 'leveluptest',
        xpPoints: 995,
      });

      expect(user.level).toBe(1);
      user.clearDomainEvents();

      // Completar capítulo da +2 XP = 997 (aún nivel 1)
      user.completeChapter('chapter-001');
      expect(user.level).toBe(1);

      // Comentar da +5 XP = 1002 (nivel 2!)
      user.postComment('chapter-001');
      expect(user.level).toBe(2);

      const levelUpEvent = user.domainEvents.find((e) => e.type === 'LEVEL_UP');
      expect(levelUpEvent).toBeDefined();
      expect(levelUpEvent?.payload.oldLevel).toBe(1);
      expect(levelUpEvent?.payload.newLevel).toBe(2);
    });
  });

  describe('InkCoins', () => {
    it('debe recibir bonus de registro', () => {
      const { user } = User.registerWithEmail(
        Email.create('coins@test.com'),
        'coinstest',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { plainText: 'SecurePass123!' } as any
      );

      expect(user.inkcoins.amount).toBe(50);
    });

    it('debe poder gastar InkCoins', () => {
      const user = User.create({
        email: Email.create('spend@test.com'),
        username: 'spendtest',
        inkcoinsBalance: 100,
      });

      user.spendInkCoins(30, 'TIP_TO_AUTHOR');

      expect(user.inkcoins.amount).toBe(70);

      const event = user.domainEvents.find((e) => e.type === 'INKCOINS_SPENT');
      expect(event?.payload.amount).toBe(30);
      expect(event?.payload.reason).toBe('TIP_TO_AUTHOR');
    });

    it('debe rechazar gasto si no hay fondos', () => {
      const user = User.create({
        email: Email.create('poor@test.com'),
        username: 'poortest',
        inkcoinsBalance: 10,
      });

      expect(() => user.spendInkCoins(50, 'TIP')).toThrow();
    });
  });

  describe('rankings', () => {
    it('debe calcular rango correctamente', () => {
      expect(XP.create(0).rank).toBe('Novato');
      expect(XP.create(1000).rank).toBe('Lector Shonen');
      expect(XP.create(3000).rank).toBe('Otaku Experto');
      expect(XP.create(6000).rank).toBe('Maestro Otaku');
      expect(XP.create(10000).rank).toBe('Leyenda Manga');
    });
  });
});
