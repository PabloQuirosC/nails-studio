import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`w-full ${sizeMap[size]} mx-4 bg-[#181310] border border-[#2e2518] rounded-lg shadow-2xl animate-scale-in`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2e2518]">
            <h3 className="font-serif text-lg text-[#f0ebe4]">{title}</h3>
            <button onClick={onClose} className="text-[#8a7d6e] hover:text-[#f0ebe4] p-1 rounded">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
}

export function Toast({ message, type = 'success', visible }: ToastProps) {
  if (!visible) return null;
  const colors = {
    success: 'border-[#c9a96e] text-[#c9a96e]',
    error: 'border-[#d4613a] text-[#d4613a]',
    info: 'border-[#8a7d6e] text-[#8a7d6e]',
  };
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] glass border px-5 py-3 rounded-full text-sm font-mono animate-fade-in-up ${colors[type]}`}>
      {message}
    </div>
  );
}
