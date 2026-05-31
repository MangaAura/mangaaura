import json

security_en = {
    # Verification
    "verificationTitle": "Email verification",
    "notVerified": "Not verified",
    "resendVerification": "Resend verification",
    "sending": "Sending...",
    "verificationResent": "Verification email sent successfully!",
    "verificationError": "Error sending verification email",

    # Password section
    "changePasswordTitle": "Change password",
    "currentPassword": "Current password",
    "newPassword": "New password",
    "confirmPassword": "Confirm new password",
    "changePasswordButton": "Change password",
    "changing": "Changing...",
    "passwordChanged": "Password changed successfully",
    "passwordError": "Error changing password",
    "passwordsDoNotMatch": "Passwords do not match",
    "passwordMinLength": "New password must be at least 8 characters",
    "passwordRequirements": "Password does not meet security requirements",
    "passwordRequirementsLabel": "Password requirements",

    # Account security section
    "sectionTitle": "Account security",
    "passwordSecure": "Secure password",
    "passwordBcrypt": "Uses bcrypt with 12 rounds",
    "twoFactorAuth": "Two-factor authentication",
    "twoFactorEnabled": "Enabled",
    "twoFactorDisabled": "Not configured",
    "twoFactorDisable": "Disable",
    "twoFactorSetup": "Set up",

    # 2FA setup
    "setupTitle": "Set up 2FA",
    "step1ScanQR": "Scan the QR code",
    "step1Description": "Open your authenticator app (Google Authenticator, Authy, etc.) and scan this code:",
    "qrAlt": "QR code for 2FA",
    "qrFallback": "Could not generate QR",
    "orEnterManually": "Or enter manually:",
    "step2Verify": "Verify the code",
    "step2Description": "Enter the 6-digit code from your app:",
    "placeholderCode": "000000",
    "verifyAndActivate": "Verify and activate",
    "backupCodesTitle": "Backup codes",
    "backupCodesDescription": "Save these codes in a safe place. Each code can only be used once. You will lose access to your account if you lose access to your authenticator app.",
    "copy": "Copy",
    "download": "Download",
    "regenerate": "Regenerate",
    "disableTitle": "Disable 2FA",
    "disableDescription": "Enter your password to disable two-factor authentication.",
    "currentPasswordPlaceholder": "Current password",
    "disableButton": "Disable 2FA",
    "cancel": "Cancel",
    "securityRecommendation": "For security, we recommend changing your password every 3 months and enabling 2FA.",
    "copied": "Codes copied to clipboard",
    "backupRegenerated": "Backup codes regenerated successfully",
    "twoFactorActivated": "2FA activated successfully! Save your backup codes!",
    "twoFactorDisabled": "2FA disabled successfully",
    "fixFieldErrors": "Fix the errors marked in the fields"
}

security_es = {
    # Verification
    "verificationTitle": "Verificaci\u00f3n de correo",
    "notVerified": "No verificado",
    "resendVerification": "Reenviar verificaci\u00f3n",
    "sending": "Enviando...",
    "verificationResent": "\u00a1Correo de verificaci\u00f3n reenviado correctamente!",
    "verificationError": "Error al reenviar verificaci\u00f3n",

    # Password section
    "changePasswordTitle": "Cambiar contrase\u00f1a",
    "currentPassword": "Contrase\u00f1a actual",
    "newPassword": "Nueva contrase\u00f1a",
    "confirmPassword": "Confirmar nueva contrase\u00f1a",
    "changePasswordButton": "Cambiar contrase\u00f1a",
    "changing": "Cambiando...",
    "passwordChanged": "Contrase\u00f1a actualizada correctamente",
    "passwordError": "Error al cambiar la contrase\u00f1a",
    "passwordsDoNotMatch": "Las contrase\u00f1as no coinciden",
    "passwordMinLength": "La nueva contrase\u00f1a debe tener al menos 8 caracteres",
    "passwordRequirements": "La contrase\u00f1a no cumple los requisitos de seguridad",

    # Account security section
    "sectionTitle": "Seguridad de la cuenta",
    "passwordSecure": "Contrase\u00f1a segura",
    "passwordBcrypt": "Usa bcrypt con 12 rondas",
    "passwordRequirementsLabel": "Requisitos de contrase\u00f1a",
    "twoFactorAuth": "Autenticaci\u00f3n de dos factores",
    "twoFactorEnabled": "Configurada",
    "twoFactorDisabled": "No configurada",
    "twoFactorDisable": "Deshabilitar",
    "twoFactorSetup": "Configurar",

    # 2FA setup
    "setupTitle": "Configurar 2FA",
    "step1ScanQR": "Escanea el c\u00f3digo QR",
    "step1Description": "Abre tu aplicaci\u00f3n de autenticaci\u00f3n (Google Authenticator, Authy, etc.) y escanea este c\u00f3digo:",
    "qrAlt": "C\u00f3digo QR para 2FA",
    "qrFallback": "No se pudo generar el QR",
    "orEnterManually": "O ingresa manualmente:",
    "step2Verify": "Verifica el c\u00f3digo",
    "step2Description": "Ingresa el c\u00f3digo de 6 d\u00edgitos que aparece en tu aplicaci\u00f3n:",
    "placeholderCode": "000000",
    "verifyAndActivate": "Verificar y activar",
    "backupCodesTitle": "C\u00f3digos de respaldo",
    "backupCodesDescription": "Guarda estos c\u00f3digos en un lugar seguro. Cada c\u00f3digo solo puede usarse una vez y perder\u00e1s acceso a tu cuenta si pierdes el acceso a tu aplicaci\u00f3n de autenticaci\u00f3n.",
    "copy": "Copiar",
    "download": "Descargar",
    "regenerate": "Regenerar",
    "disableTitle": "Deshabilitar 2FA",
    "disableDescription": "Ingresa tu contrase\u00f1a para deshabilitar la autenticaci\u00f3n de dos factores.",
    "currentPasswordPlaceholder": "Contrase\u00f1a actual",
    "disableButton": "Deshabilitar 2FA",
    "cancel": "Cancelar",
    "securityRecommendation": "Por seguridad, te recomendamos cambiar tu contrase\u00f1a cada 3 meses y activar 2FA",
    "copied": "C\u00f3digos copiados al portapapeles",
    "backupRegenerated": "C\u00f3digos de respaldo regenerados correctamente",
    "twoFactorActivated": "\u00a12FA activado correctamente! \u00a1Guarda tus c\u00f3digos de respaldo!",
    "twoFactorDisabled": "2FA deshabilitado correctamente",
    "fixFieldErrors": "Corrige los errores marcados en los campos"
}

with open('src/i18n/locales/en.json', 'r', encoding='utf-8') as f:
    en = json.load(f)

en['settings']['security'] = security_en

with open('src/i18n/locales/en.json', 'w', encoding='utf-8') as f:
    json.dump(en, f, ensure_ascii=False, indent=2)
print("en.json updated")

with open('src/i18n/locales/es.json', 'r', encoding='utf-8') as f:
    es = json.load(f)

es['settings']['security'] = security_es

with open('src/i18n/locales/es.json', 'w', encoding='utf-8') as f:
    json.dump(es, f, ensure_ascii=False, indent=2)
print("es.json updated")
