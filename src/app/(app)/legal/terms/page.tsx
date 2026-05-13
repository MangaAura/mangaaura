import type { Metadata } from 'next';
import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import { FileText, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Términos de Servicio - InkVerse',
  description: 'Términos y condiciones de uso de InkVerse',
};

export default function TermsPage() {
  const lastUpdated = '29 de abril de 2026';

  const sections = [
    {
      title: '1. Aceptación de los Términos',
      content: `Al acceder y utilizar InkVerse, aceptas estar legalmente obligado por estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestra plataforma.`
    },
    {
      title: '2. Descripción del Servicio',
      content: `InkVerse es una plataforma de lectura y publicación de mangas web. Ofrecemos:
      • Acceso a mangas web publicados por creadores
      • Herramientas de publicación para creadores
      • Sistema de colecciones y biblioteca personal
      • Mensajería entre usuarios
      • Funciones sociales y comunidad`
    },
    {
      title: '3. Registro de Cuenta',
      content: `Para usar ciertas funciones, debes registrar una cuenta proporcionando información precisa y completa. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.`
    },
    {
      title: '4. Conducta del Usuario',
      content: `Al usar InkVerse, te comprometes a:
      • No publicar contenido ilegal, ofensivo o que infrinja derechos de terceros
      • No acosar, intimidar o discriminar a otros usuarios
      • No intentar acceder sin autorización a sistemas o datos
      • No usar la plataforma para actividades fraudulentas
      • Respetar los derechos de autor de los creadores`
    },
    {
      title: '5. Contenido del Usuario',
      content: `Los creadores retienen los derechos de su contenido. Al publicar en InkVerse, otorgas a la plataforma una licencia para mostrar, distribuir y promocionar tu contenido dentro del servicio. Puedes eliminar tu contenido en cualquier momento.`
    },
    {
      title: '6. Sistema de Suscripción',
      content: `Ofrecemos contenido gratuito y de pago mediante un sistema de monedas virtuales. Las compras son finales y no reembolsables salvo en casos específicos. Los precios están sujetos a cambio con notificación previa.`
    },
    {
      title: '7. Terminación',
      content: `Podemos suspender o terminar tu cuenta si violas estos términos. También puedes eliminar tu cuenta en cualquier momento desde la configuración. Algunos datos pueden conservarse según lo requiera la ley.`
    },
    {
      title: '8. Limitación de Responsabilidad',
      content: `InkVerse se proporciona "tal cual" sin garantías de ningún tipo. No seremos responsables por daños indirectos, incidentales o consecuentes resultantes del uso o la imposibilidad de usar el servicio.`
    },
    {
      title: '9. Cambios en los Términos',
      content: `Podemos modificar estos términos en cualquier momento. Los cambios significativos serán notificados con 30 días de antelación. El uso continuado del servicio constituye aceptación de los términos modificados.`
    },
    {
      title: '10. Contacto',
      content: `Si tienes preguntas sobre estos términos, contáctanos a través del formulario de contacto o en soporte@inkverse.app`
    }
  ];

  return (
    <Container className="py-12">
      <PageHeader
        title="Términos de Servicio"
        description={`Última actualización: ${lastUpdated}`}
        icon={<FileText className="w-8 h-8" />}
      />

    <div className="max-w-3xl mx-auto">
      <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-[var(--text-secondary)] mb-8">
            Bienvenido a InkVerse. Por favor, lee estos términos cuidadosamente antes de usar nuestra plataforma.
          </p>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <section key={section.title} className="border-b border-custom pb-6 last:border-0">
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5 text-[var(--success)]" />
                  {section.title}
                </h2>
                <div className="text-[var(--text-secondary)] whitespace-pre-line pl-7">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

            <div className="mt-8 p-4 bg-accent-blue/10 border border-accent-blue/30 rounded-xl">
              <p className="text-sm text-accent-blue font-medium">
                Al usar InkVerse, confirmas que has leído, entendido y aceptado estos Términos de Servicio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
