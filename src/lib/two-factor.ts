import bcrypt from 'bcryptjs';
import { TOTP, Secret } from 'otpauth';

import { prisma } from './prisma';

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const code = Array.from({ length: 10 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.charAt(Math.floor(Math.random() * 32))
    ).join('');
    codes.push(code);
  }
  return codes;
}

function hashBackupCode(code: string): string {
  return bcrypt.hashSync(code, 8);
}

export async function generateTwoFactorSecret(userId: string, email: string) {
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    secret,
    issuer: 'InkVerse',
    label: email,
  });

  const secretBase32 = secret.base32;
  const otpauthUrl = totp.toString();

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secretBase32 },
  });

  return { secret: secretBase32, otpauthUrl };
}

export function verifyTOTP(secretBase32: string, token: string): boolean {
  try {
    const secret = Secret.fromBase32(secretBase32);
    const totp = new TOTP({
      secret,
      issuer: 'InkVerse',
      label: 'user',
    });
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

export async function enableTwoFactor(userId: string, token: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  });

  if (!user?.twoFactorSecret) {
    return { success: false, error: '2FA no iniciado. Genera un secreto primero.' };
  }

  if (!verifyTOTP(user.twoFactorSecret, token)) {
    return { success: false, error: 'Código inválido. Intenta de nuevo.' };
  }

  const backupCodes = generateBackupCodes();
  const hashedCodes = backupCodes.map(hashBackupCode);

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorBackupCodes: JSON.stringify(hashedCodes),
    },
  });

  return { success: true, backupCodes };
}

export async function disableTwoFactor(userId: string, passwordHash: string, currentPassword: string) {
  const isValid = await bcrypt.compare(currentPassword, passwordHash);
  if (!isValid) {
    return { success: false, error: 'Contraseña incorrecta' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: null,
      twoFactorEnabled: false,
      twoFactorBackupCodes: null,
    },
  });

  return { success: true };
}

export async function verifyTwoFactorLogin(userId: string, token: string): Promise<{ valid: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorBackupCodes: true, twoFactorEnabled: true },
  });

  if (!user?.twoFactorEnabled || !user?.twoFactorSecret) {
    return { valid: false, error: '2FA no está habilitado' };
  }

  if (verifyTOTP(user.twoFactorSecret, token)) {
    return { valid: true };
  }

  const backupCodes = user.twoFactorBackupCodes ? JSON.parse(user.twoFactorBackupCodes) as string[] : [];
  for (let i = 0; i < backupCodes.length; i++) {
    if (bcrypt.compareSync(token, backupCodes[i])) {
      backupCodes.splice(i, 1);
      const rehashed = backupCodes.map(hashBackupCode);
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorBackupCodes: JSON.stringify(rehashed) },
      });
      return { valid: true };
    }
  }

  return { valid: false, error: 'Código inválido' };
}
