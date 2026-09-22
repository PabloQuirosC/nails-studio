import { useEffect, type ReactNode } from 'react';
import { Loader2, Pencil, TriangleAlert, Trash2, X } from 'lucide-react';

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
    <div className="modal-overlay p-4 overflow-y-auto" onClick={onClose}>
      <div
        className={`w-full ${sizeMap[size]} m-auto max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-[#14110c] border border-[#403521] rounded-lg shadow-2xl animate-scale-in`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#403521]">
            <h3 className="font-serif text-lg text-[#faf7f0]">{title}</h3>
            <button onClick={onClose} className="text-[#b3a893] hover:text-[#faf7f0] p-1 rounded">
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
    success: 'border-[#f2d29b] text-[#f2d29b]',
    error: 'border-[#d4613a] text-[#d4613a]',
    info: 'border-[#b3a893] text-[#b3a893]',
  };
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] glass border px-5 py-3 rounded-full text-sm font-mono animate-fade-in-up ${colors[type]}`}>
      {message}
    </div>
  );
}

/* ── Confirmación de eliminado premium ────────────────────────────── */
interface ConfirmDeleteProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Nombre del elemento, destacado en tarjeta. */
  itemName?: string;
  /** Línea descriptiva principal. */
  description: string;
  /** Consecuencia o condición (línea secundaria tenue). */
  consequence?: string;
  error?: string | null;
  confirmLabel?: string;
  onConfirm: () => void;
  pending?: boolean;
}

export function ConfirmDeleteModal({
  open, onClose, title, itemName, description, consequence,
  error, confirmLabel = 'Eliminar', onConfirm, pending = false,
}: ConfirmDeleteProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="relative overflow-hidden rounded-xl -m-6 p-6">
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg, transparent, #d4613a, transparent)' }} />
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-[#d4613a]/40"
            style={{ background: 'linear-gradient(135deg, #261410, #120e0a)', boxShadow: '0 0 24px rgba(212,97,58,0.25)' }}>
            <Trash2 size={18} className="text-[#e08a6d]" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[#d4613a] text-[10px] tracking-[0.28em] uppercase">Eliminar · irreversible</p>
            <h3 className="font-serif text-xl text-[#faf7f0] mt-1 leading-tight">{title}</h3>
          </div>
        </div>

        <p className="text-[#b3a893] text-sm mt-5 leading-relaxed">{description}</p>
        {itemName && (
          <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-[#0d0b09] border border-dashed border-[#403521] font-mono text-[13px] text-[#f9e9c8] truncate">
            {itemName}
          </div>
        )}
        {consequence && (
          <p className="text-[#6b6355] text-xs mt-2.5">{consequence}</p>
        )}
        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2.5 p-3.5 bg-[#d4613a]/10 border border-[#d4613a]/30 rounded-xl text-[#e08a6d] text-xs leading-relaxed">
            <TriangleAlert size={14} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-[#403521] text-[#b3a893] text-sm rounded-xl hover:border-[#b3a893] hover:text-[#faf7f0] transition-all">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={pending}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl text-white transition-all disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #d4613a, #a03d22)', boxShadow: '0 4px 20px rgba(212,97,58,0.35)' }}>
            {pending ? (<><Loader2 size={15} className="animate-spin" /> Eliminando…</>) : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Edición premium ──────────────────────────────────────────────── */
interface EditModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  error?: string | null;
  children: ReactNode;
  onSave: () => void;
  saveLabel?: string;
  pending?: boolean;
}

export function EditModalShell({
  open, onClose, title, eyebrow = 'Editar registro', error,
  children, onSave, saveLabel = 'Guardar cambios', pending = false,
}: EditModalShellProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="relative overflow-hidden rounded-xl -m-6 p-6">
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg, transparent, #f2d29b, transparent)' }} />
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-[#f2d29b]/40"
            style={{ background: 'linear-gradient(135deg, #2a2013, #120e0a)', boxShadow: '0 0 20px rgba(242,210,155,0.22)' }}>
            <Pencil size={17} className="text-[#f9e9c8]" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[#f2d29b] text-[10px] tracking-[0.28em] uppercase">{eyebrow}</p>
            <h3 className="font-serif text-xl text-[#faf7f0] mt-1 leading-tight">{title}</h3>
          </div>
        </div>

        <div className="space-y-4 mb-6">{children}</div>

        {error && (
          <div role="alert" className="mb-5 flex items-start gap-2.5 p-3.5 bg-[#d4613a]/10 border border-[#d4613a]/30 rounded-xl text-[#e08a6d] text-xs leading-relaxed">
            <TriangleAlert size={14} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-[#403521] text-[#b3a893] text-sm rounded-xl hover:border-[#b3a893] hover:text-[#faf7f0] transition-all">
            Cancelar
          </button>
          <button onClick={onSave} disabled={pending}
            className="flex-1 py-2.5 bg-[#f2d29b] text-[#0d0b09] text-sm font-medium rounded-xl hover:bg-[#f7ddab] disabled:opacity-60 disabled:cursor-wait transition-all flex items-center justify-center gap-2"
            style={{ boxShadow: '0 4px 20px rgba(242,210,155,0.25)' }}>
            {pending ? (<><Loader2 size={15} className="animate-spin" /> Guardando…</>) : saveLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
