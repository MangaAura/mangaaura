import type { Metadata } from 'next';
import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Scale, AlertTriangle, FileCheck, Mail, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política DMCA - InkVerse',
  description: 'Procedimiento para reportar contenido que infringe derechos de autor',
};

export default function DMCAPage() {
  const lastUpdated = '29 de abril de 2026';

  const takedownSteps = [
    {
      number: '1',
      title: 'Identificación del contenido',
      description: 'Localiza la URL exacta del contenido que crees que infringe tus derechos de autor.'
    },
    {
      number: '2',
      title: 'Preparar notificación',
      description: 'Incluye tu información de contacto, descripción de la obra protegida y declaración de buena fe.'
    },
    {
      number: '3',
      title: 'Enviar reporte',
      description: 'Envía la notificación a nuestro agente designado DMCA.'
    },
    {
      number: '4',
      title: 'Revisión',
      description: 'Revisaremos tu reporte y tomaremos acción dentro de las 48-72 horas hábiles.'
    }
  ];

  const requirements = [
    'Firma física o electrónica del propietario de derechos de autor',
    'Identificación de la obra protegida por copyright que se reclama',
    'Identificación del material que se alega infractor y su ubicación',
    'Tu información de contacto (dirección, teléfono, correo)',
    'Declaración de buena fe de que el uso no está autorizado',
    'Declaración de que la información es precisa bajo pena de perjurio'
  ];

  return (
    <Container className="py-12">
      <PageHeader
        title="Política DMCA"
        description={`Última actualización: ${lastUpdated}`}
        icon={<Scale className="w-8 h-8" />}
      />

      <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-[var(--warning)] flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-[var(--warning)] mb-2">Aviso Importante</h2>
              <p className="text-muted text-sm">
                InkVerse respeta los derechos de propiedad intelectual. Si crees que tu trabajo ha sido copiado de manera que constituye infracción de copyright, sigue el procedimiento descrito a continuación.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-accent-blue" />
            Proceso de Notificación DMCA
          </h2>
          <p className="text-muted mb-6">
            Para presentar una reclamación válida de infracción de copyright, sigue estos pasos:
          </p>

          <div className="space-y-4">
            {takedownSteps.map((step, index) => (
              <div key={`step-${step.number}`} className="flex gap-4 p-4 bg-tertiary border border-custom rounded-xl">
                <div className="w-8 h-8 bg-accent-blue text-[var(--text-inverse)] rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Requisitos de la Notificación</h2>
          <p className="text-muted mb-4">
            Tu notificación DMCA debe incluir la siguiente información:
          </p>
          <ul className="space-y-3">
            {requirements.map((req, index) => (
              <li key={`req-${index}`} className="flex items-start gap-3 text-muted">
                <span className="w-2 h-2 bg-accent-blue rounded-full mt-2 flex-shrink-0" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-accent-blue" />
            Agente Designado DMCA
          </h2>
          <p className="text-muted mb-4">
            Envía tus notificaciones de infracción de copyright a:
          </p>
          <div className="bg-tertiary border border-custom rounded-xl p-4">
            <p className="font-semibold">InkVerse DMCA Agent</p>
            <p className="text-muted text-sm">Email: dmca@inkverse.app</p>
            <p className="text-muted text-sm">Dirección: Disponible bajo solicitud</p>
          </div>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Contra-Notificación</h2>
          <p className="text-muted mb-4">
            Si crees que tu contenido fue eliminado por error o que tienes derecho a usar el material, puedes enviar una contra-notificación que debe incluir:
          </p>
          <ul className="space-y-2 text-muted">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-accent-blue rounded-full mt-2" />
              Tu firma física o electrónica
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-accent-blue rounded-full mt-2" />
              Identificación del material eliminado y su ubicación anterior
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-accent-blue rounded-full mt-2" />
              Declaración bajo pena de perjurio de que crees de buena fe que el material fue eliminado por error
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-accent-blue rounded-full mt-2" />
              Tu información de contacto y declaración de consentimiento a jurisdicción federal
            </li>
          </ul>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Política de Repeat Infringers</h2>
          <p className="text-muted">
            InkVerse tiene una política estricta contra infractores reincidentes. Las cuentas de usuarios que reciban múltiples notificaciones DMCA válidas serán suspendidas o terminadas.
          </p>
        </div>

        <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-4 text-accent-blue">¿Necesitas ayuda?</h2>
          <p className="text-muted mb-4">
            Si tienes preguntas sobre el proceso DMCA o necesitas asistencia, contacta a nuestro equipo de soporte.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-medium px-6 py-3 rounded-xl transition-colors"
            >
              <Mail className="w-4 h-4" />
              Contactar Soporte
            </Link>
            <a
              href="https://www.copyright.gov/title17"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-tertiary hover:bg-tertiary/80 text-fg-primary font-medium px-6 py-3 rounded-xl transition-colors border border-custom"
            >
              <ExternalLink className="w-4 h-4" />
              Ley de Derechos de Autor
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}
