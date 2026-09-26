import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B211C]/50 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-[#FBF8F3] border border-[#E8DCCB] rounded-2xl shadow-modal overflow-hidden p-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {isDestructive && (
              <div className="w-10 h-10 rounded-full bg-[#A65D43]/15 text-[#A65D43] flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#3A2118]">{title}</h3>
              <p className="mt-1 text-sm text-[#542F20]/80 leading-relaxed">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#795548] hover:text-[#3A2118] p-1 rounded-lg hover:bg-[#F5EFE6] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#E8DCCB]/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-[#542F20] bg-[#F5EFE6] hover:bg-[#E8DCCB] rounded-lg transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg text-white transition disabled:opacity-50',
              isDestructive
                ? 'bg-[#A65D43] hover:bg-[#8D4E38]'
                : 'bg-[#542F20] hover:bg-[#3A2118]'
            )}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
