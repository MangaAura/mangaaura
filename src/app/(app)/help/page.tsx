'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import {
  HelpCircle,
  Search,
  BookOpen,
  Shield,
  CreditCard,
  Users,
  Palette,
  ChevronDown,
  MessageSquare,
  Mail,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const faqCategories = [
  {
    id: 'general',
    title: 'General',
    icon: HelpCircle,
    questions: [
      {
        q: '¿Qué es InkVerse?',
        a: 'InkVerse es una plataforma para descubrir, leer y compartir manga. Ofrecemos una biblioteca extensa de mangas con lectura online, sistema de logros, comunidad activa y herramientas para creadores.',
      },
      {
        q: '¿Es gratis usar InkVerse?',
        a: 'Sí, la mayoría del contenido es gratuito. Algunos mangas premium o funciones exclusivas pueden requerir una suscripción o Ink Coins, nuestra moneda virtual.',
      },
      {
        q: '¿Cómo creo una cuenta?',
        a: 'Haz clic en "Registrarse" en la esquina superior derecha. Puedes registrarte con correo electrónico, Google o GitHub. Solo necesitas un nombre de usuario y una dirección de correo.',
      },
    ],
  },
  {
    id: 'reading',
    title: 'Lectura',
    icon: BookOpen,
    questions: [
      {
        q: '¿Cómo guardo mi progreso de lectura?',
        a: 'Tu progreso se guarda automáticamente cuando inicias sesión. Solo necesitas hacer clic en el botón de lectura y el sistema recordará dónde te quedaste.',
      },
      {
        q: '¿Puedo leer sin conexión a internet?',
        a: 'Actualmente la lectura offline no está disponible, pero es una función planificada para futuras actualizaciones.',
      },
      {
        q: '¿Cómo cambio el modo de lectura?',
        a: 'En el lector, usa el menú de configuración (ícono de engranaje) para cambiar entre lectura de página simple, doble página o scroll continuo.',
      },
    ],
  },
  {
    id: 'community',
    title: 'Comunidad',
    icon: Users,
    questions: [
      {
        q: '¿Cómo sigo a otros usuarios?',
        a: 'Visita el perfil del usuario y haz clic en el botón "Seguir". Recibirás notificaciones cuando publiquen contenido o interactúen contigo.',
      },
      {
        q: '¿Cómo funcionan los clanes?',
        a: 'Los clanes son grupos de la comunidad organizados por intereses. Puedes unirte a un clan existente o crear el tuyo propio para conectar con otros lectores.',
      },
      {
        q: '¿Cómo reporto contenido inapropiado?',
        a: 'Usa el botón de reporte que aparece en cada contenido (manga, comentario, perfil) o visita nuestra página de reportes para enviar un reporte detallado.',
      },
    ],
  },
  {
    id: 'creators',
    title: 'Creadores',
    icon: Palette,
    questions: [
      {
        q: '¿Cómo publico mi manga en InkVerse?',
        a: 'Ve a "Panel de Creador" desde tu menú de perfil y haz clic en "Publicar manga". Podrás subir capítulos, añadir portadas y gestionar toda tu obra.',
      },
      {
        q: '¿Puedo monetizar mi manga?',
        a: 'Sí, a través de nuestro sistema de patrocinios y Ink Coins. Los lectores pueden apoyarte directamente y tú recibes una parte de los ingresos.',
      },
      {
        q: '¿Qué formatos de imagen aceptan?',
        a: 'Aceptamos JPG, PNG y WebP. Recomendamos imágenes de al menos 1200px de ancho para una calidad de lectura óptima.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Cuenta y Pagos',
    icon: CreditCard,
    questions: [
      {
        q: '¿Cómo recupero mi contraseña?',
        a: 'En la página de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?" y sigue las instrucciones. Recibirás un correo para restablecerla.',
      },
      {
        q: '¿Qué son los Ink Coins?',
        a: 'Son la moneda virtual de InkVerse. Puedes usarlos para desbloquear capítulos premium, apoyar a creadores y comprar funciones especiales.',
      },
      {
        q: '¿Cómo elimino mi cuenta?',
        a: 'Ve a Configuración > Cuenta y selecciona "Eliminar cuenta". Ten en cuenta que esta acción es irreversible y perderás todos tus datos.',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Seguridad y Privacidad',
    icon: Shield,
    questions: [
      {
        q: '¿Cómo protegen mis datos?',
        a: 'Utilizamos encriptación SSL, autenticación segura y cumplimos con las regulaciones de privacidad. Puedes revisar nuestra política de privacidad para más detalles.',
      },
      {
        q: '¿Cómo bloqueo a un usuario?',
        a: 'Visita el perfil del usuario, haz clic en los tres puntos y selecciona "Bloquear". No podrán enviarte mensajes ni interactuar contigo.',
      },
      {
        q: '¿Qué hago si soy víctima de acoso?',
        a: 'Reporta al usuario inmediatamente usando la función de reporte. Nuestro equipo de moderación revisará el caso en un máximo de 24 horas. También puedes bloquear al usuario mientras tanto.',
      },
    ],
  },
];

const quickLinks = [
  { name: 'Contacto', href: '/contact', icon: Mail, desc: 'Envíanos un mensaje directo' },
  { name: 'Reportar contenido', href: '/report', icon: Shield, desc: 'Reporta infracciones o contenido inapropiado' },
  { name: 'Términos de servicio', href: '/legal/terms', icon: FileText, desc: 'Conoce nuestras reglas' },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--surface-elevated)] transition-colors"
      >
        <span className="text-sm font-medium text-[var(--text-primary)] pr-4">{question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-4 pt-0">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('general');

  const filteredFAQs = faqCategories
    .filter((cat) => cat.id === activeCategory)
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (q) =>
          !searchQuery ||
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }));

  const totalResults = filteredFAQs.reduce((acc, cat) => acc + cat.questions.length, 0);

  return (
    <Container className="py-12">
      <PageHeader
        title="Centro de Ayuda"
        description="Encuentra respuestas a tus preguntas más frecuentes"
        icon={<HelpCircle className="w-8 h-8" />}
      />

      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 text-center hover:border-[var(--primary)]/30 hover:bg-[var(--surface-elevated)] transition-all group"
              >
                <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-3 text-[var(--primary)] group-hover:bg-[var(--primary)]/20 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">{link.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{link.desc}</p>
              </Link>
            );
          })}
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en preguntas frecuentes..."
            className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--primary)] transition-colors"
          />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {faqCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  activeCategory === cat.id
                    ? 'bg-[var(--primary)] text-[var(--text-inverse)]'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.title}
              </button>
            );
          })}
        </div>

        {searchQuery && (
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {totalResults} resultado{totalResults !== 1 ? 's' : ''} para &ldquo;{searchQuery}&rdquo;
          </p>
        )}

        <div className="space-y-3">
          {filteredFAQs.map((cat) =>
            cat.questions.length > 0 ? (
              <div key={cat.id} className="space-y-3">
                {cat.questions.map((faq, i) => (
                  <FAQItem key={i} question={faq.q} answer={faq.a} />
                ))}
              </div>
            ) : (
              <div key={cat.id} className="text-center py-12">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
                <p className="text-[var(--text-secondary)]">
                  No se encontraron resultados para &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            )
          )}
        </div>

        <div className="mt-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-[var(--primary)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            ¿No encontraste lo que buscabas?
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Nuestro equipo de soporte está disponible para ayudarte
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] font-medium rounded-xl transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contactar soporte
          </Link>
        </div>
      </div>
    </Container>
  );
}
