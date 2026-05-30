// Type declarations for jest-axe v10 (no built-in types)
declare module 'jest-axe' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axe: any;
  export function axe(
    element: Element | null,
    options?: Record<string, unknown>
  ): Promise<{ violations: Array<Record<string, unknown>> }>;

  export const toHaveNoViolations: Record<string, unknown>;
}

// Extend vitest's matchers
declare module 'vitest' {
   
  interface Assertion<T = unknown> {
    toHaveNoViolations(): void;
  }
   
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
