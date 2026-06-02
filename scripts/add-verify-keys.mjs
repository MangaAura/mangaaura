import fs from 'fs';

const esPath = './src/i18n/locales/es.json';
const enPath = './src/i18n/locales/en.json';

const es = JSON.parse(fs.readFileSync(esPath, 'utf-8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

const missingKeys = {
  verifying: 'Verificando tu correo...',
  pleaseWait: 'Por favor espera mientras verificamos tu enlace.',
  successTitle: '¡Correo verificado exitosamente!',
  successMessage: 'Tu cuenta ha sido verificada. Serás redirigido a la página principal.',
  goHome: 'Ir al inicio',
  expiredTitle: 'Enlace expirado',
  expiredMessage: 'El enlace de verificación ha expirado. Solicita un nuevo correo de verificación.',
  errorTitle: 'Error de verificación',
  goToLogin: 'Ir a iniciar sesión',
  missingToken: 'No se encontró un token de verificación en el enlace.',
  genericError: 'Ocurrió un error al verificar tu correo. Intenta de nuevo.',
  networkError: 'Error de conexión. Verifica tu internet e inténtalo de nuevo.',
  resending: 'Reenviando...',
  resendTitle: 'Reenviar correo de verificación',
  resendDescription: 'Ingresa tu correo electrónico y te enviaremos un nuevo enlace de verificación.',
  resendPlaceholder: 'tu@email.com',
  resendCta: 'Reenviar correo',
  resendSuccessTitle: '¡Correo enviado!',
  resendSuccessDesc: 'Si existe una cuenta con ese correo pendiente de verificación, recibirás un nuevo enlace. Revisa tu bandeja de entrada y carpeta de spam.',
};

const enTranslations = {
  verifying: 'Verifying your email...',
  pleaseWait: 'Please wait while we verify your link.',
  successTitle: 'Email verified successfully!',
  successMessage: 'Your account has been verified. You will be redirected to the home page.',
  goHome: 'Go home',
  expiredTitle: 'Link expired',
  expiredMessage: 'The verification link has expired. Request a new verification email.',
  errorTitle: 'Verification error',
  goToLogin: 'Go to login',
  missingToken: 'No verification token was found in the link.',
  genericError: 'An error occurred while verifying your email. Please try again.',
  networkError: 'Network error. Check your internet and try again.',
  resending: 'Resending...',
  resendTitle: 'Resend verification email',
  resendDescription: 'Enter your email address and we\'ll send you a new verification link.',
  resendPlaceholder: 'your@email.com',
  resendCta: 'Resend email',
  resendSuccessTitle: 'Email sent!',
  resendSuccessDesc: 'If an account exists with that email pending verification, you will receive a new link. Check your inbox and spam folder.',
};

// Add to Spanish
Object.assign(es.auth.verify, missingKeys);

// Add to English
Object.assign(en.auth.verify, enTranslations);

fs.writeFileSync(esPath, JSON.stringify(es, null, 2) + '\n', 'utf-8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf-8');

console.log('✓ Keys added to both locale files');
