'use client';

import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = 'secondary', className, ...props }: ButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'tambo-btn--primary'
      : variant === 'danger'
        ? 'tambo-btn--danger'
        : variant === 'ghost'
          ? 'tambo-btn--ghost'
          : '';

  const cls = ['tambo-btn', variantClass, className].filter(Boolean).join(' ');
  return <button className={cls} {...props} />;
}
