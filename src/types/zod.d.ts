declare module 'zod' {
export const z: typeof import('zod/v4').z;
export class ZodError<T = unknown> {
issues: Array<{ message: string; path: (string | number)[]; code: string }>;
errors: Array<{ message: string; path: (string | number)[]; code: string }>;
message: string;
format(): Record<string, unknown>;
flatten(): { formErrors: string[]; fieldErrors: Record<string, string[]> };
}
}

declare namespace z {
export type infer<T> = T extends { _output: infer O } ? O : T extends { _def: { output: infer O } } ? O : never;
}
