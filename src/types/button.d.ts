declare module '@/components/ui/Button' {
  import { ForwardRefExoticComponent , ButtonHTMLAttributes } from 'react';
  

  interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'ink';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
  }

  export const Button: ForwardRefExoticComponent<ButtonProps>;
  export const buttonVariants: (props: { variant?: string; size?: string; className?: string }) => string;
  export type { ButtonProps };
}
