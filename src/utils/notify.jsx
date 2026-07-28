import React from 'react';
import { createRoot } from 'react-dom/client';
import NotifyModal from '../components/NotifyModal';

let modalRoot = null;

export const showNotify = (props) => {
  if (!modalRoot) {
    const div = document.createElement('div');
    document.body.appendChild(div);
    modalRoot = createRoot(div);
  }

  const handleClose = () => {
    modalRoot.render(null);
    if (props.onClose) props.onClose();
  };

  const handleConfirm = () => {
    if (props.onConfirm) props.onConfirm();
  };

  modalRoot.render(
    <NotifyModal 
      {...props} 
      onClose={handleClose} 
      onConfirm={handleConfirm} 
    />
  );
};

// Global override for window.alert
export const setupGlobalAlert = () => {
  window.alert = (message) => {
    showNotify({
      type: 'info',
      title: 'Alert',
      message: String(message)
    });
  };
};
