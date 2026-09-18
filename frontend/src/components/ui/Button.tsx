import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[#c9a96e] text-[#0d0b0a] hover:bg-[#d4b87e] active:scale-95',
    accent: 'bg-[#d4613a] text-white hover:bg-[#e06848] active:scale-95',
    outline: 'border border-[#c9a96e] text-[#c9a96e] hover:bg-[#c9a96e]/10 active:scale-95',
    ghost: 'text-[#8a7d6e] hover:text-[#f0ebe4] hover:bg-[#2a2018] active:scale-95',
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
