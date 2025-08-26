import React from 'react';
import { WEB_CONSTANTS } from '../app/web_constantsthe';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  message,
  confirmText = 'نعم',
  cancelText = 'لا',
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-xs w-full p-6 flex flex-col items-center animate-fadeIn" dir="rtl">
        <div className="text-center text-lg font-semibold text-gray-900 mb-6">{message}</div>
        <div className="flex gap-4 w-full">
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg text-white font-bold text-base transition-colors"
            style={{ background: WEB_CONSTANTS.primaryColor }}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-900 font-bold text-base bg-white transition-colors hover:bg-gray-50"
          >
            {cancelText}
          </button>
        </div>
      </div>
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.18s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmDialog; 