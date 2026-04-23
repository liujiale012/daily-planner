import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full text-sm font-medium shadow-[0_10px_30px_rgba(var(--accent),0.3)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'text-white bg-[rgb(var(--accent))] hover:brightness-110 active:translate-y-[1px]',
        outline:
          'border border-[rgba(var(--accent),0.2)] bg-white/70 text-[rgb(var(--accent))] hover:bg-[rgba(var(--accent),0.08)]',
        ghost: 'bg-transparent text-[rgb(var(--accent))] hover:bg-[rgba(var(--accent),0.08)]',
      },
      size: {
        default: 'h-9 px-5',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-7 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';
export { Button, buttonVariants };
