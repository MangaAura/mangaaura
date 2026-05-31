import json
import os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# --- en.json ---
with open(os.path.join(root, 'src/i18n/locales/en.json'), 'r', encoding='utf-8') as f:
    en = json.load(f)

en['auth']['verify'] = {
    "title": "Verify your email",
    "description": "We've sent a verification link to your email. Please check your inbox and click the link to verify your account.",
    "success": "Email verified successfully!",
    "error": "Invalid or expired verification link",
    "resendButton": "Resend verification email",
    "resendSuccess": "Verification email sent successfully",
    "resendError": "Failed to resend verification email",
    "checkSpam": "Didn't receive the email? Check your spam folder or click below to resend.",
    "alreadyVerified": "Your email is already verified",
    "resendLoading": "Sending...",
    "notVerified": "Not verified"
}

with open(os.path.join(root, 'src/i18n/locales/en.json'), 'w', encoding='utf-8') as f:
    json.dump(en, f, ensure_ascii=False, indent=2)
    f.write('\n')

print("en.json updated successfully")

# --- es.json ---
with open(os.path.join(root, 'src/i18n/locales/es.json'), 'r', encoding='utf-8') as f:
    es = json.load(f)

es['auth']['verify'] = {
    "title": "Verifica tu correo electrónico",
    "description": "Hemos enviado un enlace de verificación a tu correo. Revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.",
    "success": "¡Correo verificado exitosamente!",
    "error": "Enlace de verificación inválido o expirado",
    "resendButton": "Reenviar correo de verificación",
    "resendSuccess": "Correo de verificación enviado exitosamente",
    "resendError": "Error al reenviar el correo de verificación",
    "checkSpam": "¿No recibiste el correo? Revisa tu carpeta de spam o haz clic abajo para reenviar.",
    "alreadyVerified": "Tu correo ya está verificado",
    "resendLoading": "Enviando...",
    "notVerified": "No verificado"
}

with open(os.path.join(root, 'src/i18n/locales/es.json'), 'w', encoding='utf-8') as f:
    json.dump(es, f, ensure_ascii=False, indent=2)
    f.write('\n')

print("es.json updated successfully")
