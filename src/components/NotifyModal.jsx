import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: { Icon: CheckCircle2, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  error:   { Icon: X,            color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30'     },
  warning: { Icon: AlertTriangle, color: 'text-yellow-400',  bg: 'bg-yellow-500/10',   border: 'border-yellow-500/30'   },
  info:    { Icon: Info,          color: 'text-yellow-400',   bg: 'bg-yellow-500/10',    border: 'border-yellow-500/30'    },
  confirm: { Icon: AlertTriangle, color: 'text-yellow-400',  bg: 'bg-yellow-500/10',   border: 'border-yellow-500/30'   },
};

/**
 * NotifyModal – replaces all window.alert() and window.confirm() calls.
 *
 * Props:
 *   type: 'success' | 'error' | 'warning' | 'info' | 'confirm'
 *   title: string
 *   message: string
 *   onClose: () => void          (for info / success / error)
 *   onConfirm: () => void        (only for type='confirm')
 *   confirmText?: string
 *   cancelText?: string
 */
const NotifyModal = ({
  type = 'info',
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  const { Icon, color, bg, border } = icons[type] || icons.info;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111111] border border-[#222222]/70 rounded-[2rem] shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center gap-5">
        <div className={`w-16 h-16 ${bg} ${border} border rounded-[1.5rem] flex items-center justify-center`}>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
        {title && <h3 className="text-xl font-black text-white">{title}</h3>}
        {message && <p className="text-gray-400 font-medium leading-relaxed text-sm">{message}</p>}

        {type === 'confirm' ? (
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-[#222222]/50 text-gray-300 font-bold hover:bg-[#1A1A1A] transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={() => { onConfirm?.(); onClose?.(); }}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold transition-all shadow-lg shadow-red-500/20"
            >
              {confirmText}
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-white font-bold transition-all shadow-lg shadow-yellow-500/20"
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
};

export default NotifyModal;
