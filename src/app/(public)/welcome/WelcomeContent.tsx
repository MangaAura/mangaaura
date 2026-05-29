'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  cta: string;
}

interface Props {
  steps: Step[];
}

export function WelcomeContent({ steps }: Props) {
  return (
    <div className="grid sm:grid-cols-2 gap-4 text-left">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <Link
            key={i}
            href={step.href}
            className="group p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-surface-secondary transition-all"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-fg-secondary mb-4">{step.description}</p>
            <span className="text-sm font-medium text-primary group-hover:underline">
              {step.cta} &rarr;
            </span>
          </Link>
        );
      })}
    </div>
  );
}
