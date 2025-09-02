'use client';

import { motion } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '../lib/utils';

interface AdminNotificationCardProps {
  title: string;
  message: string;
  onClose?: () => void;
  type?: 'info' | 'warning' | 'success' | 'error';
  actionText?: string;
  onAction?: () => void;
}

const AdminNotificationCard: React.FC<AdminNotificationCardProps> = ({ 
  title, 
  message, 
  onClose, 
  type = 'info',
  actionText,
  onAction 
}) => {
  const [isClosed, setIsClosed] = useState(false);
  const iconSectionWidth = 100; // width reserved for the icon

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClosed(true);
    if (onClose) {
      onClose();
    }
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAction) {
      onAction();
    }
  };

  if (isClosed) {
    return null;
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="relative h-22 rounded-2xl transition duration-200 hover:shadow-lg">
      {/* Background with type-specific styling */}
      <div className={cn(
        "absolute inset-0 rounded-2xl border shadow-sm",
        getTypeStyles()
      )} />

      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 z-20 p-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>

      {/* Content */}
      <div className="relative z-10 flex h-full">
        <div className="flex grow flex-col justify-center p-4">
          {/* Title with blur animation */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-lg font-bold text-gray-900"
          >
            {title}
          </motion.div>
          {/* Message with slight delay */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="text-sm text-gray-700"
          >
            {message}
          </motion.div>
          {/* Action button if provided */}
          {actionText && onAction && (
            <motion.button
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.2 }}
              onClick={handleAction}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              {actionText} →
            </motion.button>
          )}
        </div>

        {/* Icon overlay */}
        <div
          className={cn(
            'flex items-center justify-center',
            `w-[${iconSectionWidth}px]`
          )}
        >
          <div className="flex items-center justify-center">
            <span className="text-2xl">{getTypeIcon()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationCard;
