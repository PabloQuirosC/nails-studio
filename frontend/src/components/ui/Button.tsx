import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[#f2d29b] text-[#0d0b09] hover:bg-[#f7ddab] active:scale-95',
    accent: 'bg-[#d4613a] text-white hover:bg-[#e06848] active:scale-95',
    outline: 'border border-[#f2d29b] text-[#f2d29b] hover:bg-[#f2d29b]/10 active:scale-95',
    ghost: 'text-[#b3a893] hover:text-[#faf7f0] hover:bg-[#332a1d] active:scale-95',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
