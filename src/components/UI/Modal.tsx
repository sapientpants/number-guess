import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }[];
}

export const Modal = ({ isOpen, onClose, title, children, actions }: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4">{title}</h3>
              <div className="mb-6 text-gray-300">{children}</div>

              {actions && (
                <div className="flex gap-3 justify-end">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      onClick={action.onClick}
                      variant={action.variant || 'secondary'}
                      size="sm"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
