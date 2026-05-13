import type { Metadata } from 'next';
import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Shield, Lock, Eye, Server, Trash2, Mail, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidad - InkVerse',
  description: 'Cómo InkVerse recopila, usa y protege tu información personal',
};

export default function PrivacyPage() {
  const lastUpdated = '29 de abril de 2026';

  const dataTypes = [
    {
      icon: <Eye className="w-5 h-5" />,
      title: 'Información de Cuenta',
      items: ['Nombre de usuario', 'Correo electrónico', 'Contraseña (encriptada)', 'Foto de perfil']
    },
    {
      icon: <Server className="w-5 h-5" />,
      title: 'Datos de Uso',
      items: ['Mangas leídos', 'Tiempo de lectura', 'Preferencias', 'Actividad en la plataforma']
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: 'Información Técnica',
      items: ['Dirección IP', 'Tipo de navegador', 'Dispositivo', 'Cookies']
    }
  ];

  const rights = [
    {
      title: 'Acceso',
      description: 'Puedes solicitar una copia de tus datos personales en cualquier momento.'
    },
    {
      title: 'Rectificación',
      description: 'Puedes actualizar tu información de perfil desde la configuración de cuenta.'
    },
    {
      title: 'Eliminación',
      description: 'Puedes eliminar tu cuenta y todos tus datos asociados permanentemente.'
    },
    {
      title: 'Portabilidad',
      description: 'Puedes exportar tus datos en formato JSON desde tu panel de usuario.'
    }
  ];

  return (
    <Container className="py-12">
      <PageHeader
        title="Política de Privacidad"
        description={`Última actualización: ${lastUpdated}`}
        icon={<Shield className="w-8 h-8" />}
      />

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-accent-blue" />
            Información que Recopilamos
          </h2>
          <p className="text-muted mb-6">
            En InkVerse, nos tomamos tu privacidad muy en serio. Solo recopilamos la información necesaria para proporcionar y mejorar nuestros servicios.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {dataTypes.map((type, index) => (
              <div key={type.title} className="bg-tertiary border border-custom rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 text-accent-blue">
                  {type.icon}
                  <h3 className="font-semibold text-sm">{type.title}</h3>
                </div>
                <ul className="space-y-1">
                  {type.items.map((item, i) => (
                    <li key={`item-${i}`} className="text-sm text-muted flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-accent-blue rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent-blue" />
            Cómo Usamos tu Información
          </h2>
          <ul className="space-y-3 text-muted">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-accent-blue rounded-full mt-2 flex-shrink-0" />
              <span>Proporcionar y mantener el servicio de lectura y publicación de mangas</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-accent-blue rounded-full mt-2 flex-shrink-0" />
              <span>Personalizar tu experiencia y recomendaciones de contenido</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-accent-blue rounded-full mt-2 flex-shrink-0" />
              <span>Procesar pagos y transacciones de manera segura</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-accent-blue rounded-full mt-2 flex-shrink-0" />
              <span>Comunicarnos contigo sobre actualizaciones y soporte</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-accent-blue rounded-full mt-2 flex-shrink-0" />
              <span>Prevenir fraudes y garantizar la seguridad de la plataforma</span>
            </li>
          </ul>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent-blue" />
            Tus Derechos de Privacidad
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {rights.map((right, index) => (
              <div key={right.title} className="p-4 bg-tertiary border border-custom rounded-xl">
                <h3 className="font-semibold mb-1">{right.title}</h3>
                <p className="text-sm text-muted">{right.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-accent-blue" />
            Seguridad de Datos
          </h2>
          <p className="text-muted mb-4">
            Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos:
          </p>
          <ul className="space-y-2 text-muted">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--success)]" />
              Encriptación SSL/TLS para todas las comunicaciones
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--success)]" />
              Contraseñas hasheadas con bcrypt
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--success)]" />
              Acceso restringido a datos personales
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--success)]" />
              Auditorías regulares de seguridad
            </li>
          </ul>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-accent-blue" />
            Retención y Eliminación
          </h2>
          <p className="text-muted">
            Conservamos tus datos mientras mantengas una cuenta activa. Si eliminas tu cuenta, tus datos personales se eliminarán permanentemente dentro de 30 días, excepto cuando la ley requiera su conservación.
          </p>
        </div>

        <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-accent-blue">
            <Mail className="w-5 h-5" />
            Contacto de Privacidad
          </h2>
          <p className="text-muted mb-4">
            Si tienes preguntas sobre esta política de privacidad o deseas ejercer tus derechos, contáctanos:
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:privacy@inkverse.app"
              className="inline-flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-medium px-6 py-3 rounded-xl transition-colors"
            >
              <Mail className="w-4 h-4" />
              privacy@inkverse.app
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}
