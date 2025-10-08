import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
}: ConfirmDialogProps) => {
  useEffect(() => {
    if (open) {
      // Prevenir scroll do body quando o modal está aberto
      document.body.style.overflow = 'hidden';
      // Remover qualquer atributo inert que possa estar presente
      document.body.removeAttribute('inert');
    } else {
      // Restaurar scroll quando fechar
      document.body.style.overflow = '';
      document.body.removeAttribute('inert');
    }

    // Cleanup: sempre restaurar overflow e remover inert ao desmontar
    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('inert');
      // Garantir que nenhum elemento tenha pointer-events bloqueado
      document.body.style.pointerEvents = '';
    };
  }, [open]);

  // Não renderizar se não estiver aberto
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in-0"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div
        className={cn(
          "relative w-full max-w-md mx-4 bg-background border rounded-lg shadow-lg",
          "animate-in zoom-in-95 slide-in-from-top-[10%]",
          "duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h2
                id="confirm-dialog-title"
                className="text-lg font-semibold leading-none tracking-tight"
              >
                {title}
              </h2>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 pb-4">
          <p
            id="confirm-dialog-description"
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="mb-2 sm:mb-0"
          >
            {isLoading ? 'Processando...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

