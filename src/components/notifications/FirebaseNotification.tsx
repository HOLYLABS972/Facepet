'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Coins } from 'lucide-react';
import { Notification } from '@/src/lib/firebase/notifications';

interface FirebaseNotificationProps {
  notification: Notification;
  onClose: () => void;
  onMarkAsRead: () => void;
}

const FirebaseNotification: React.FC<FirebaseNotificationProps> = ({ 
  notification, 
  onClose, 
  onMarkAsRead 
}) => {
  const handleClose = () => {
    if (!notification.isRead) {
      onMarkAsRead();
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative h-22 rounded-2xl overflow-hidden mb-4"
    >
      {/* Glass morphism background */}
      <div className="border-gray absolute inset-0 rounded-2xl border bg-white shadow-sm" />

      {/* Content */}
      <div className="relative z-10 flex h-full">
        {/* Icon Section */}
        <div className="flex items-center justify-center w-20 h-full bg-gradient-to-br from-blue-500 to-purple-600">
          <Coins className="w-8 h-8 text-white" />
        </div>

        {/* Text Section */}
        <div className="flex-1 flex flex-col justify-center px-4 py-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                {notification.title}
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {notification.message}
              </p>
            </div>
            
            {/* Points Badge */}
            {notification.points && (
              <div className="ml-2 flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                +{notification.points}
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Unread Indicator */}
        {!notification.isRead && (
          <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full" />
        )}
      </div>
    </motion.div>
  );
};

export default FirebaseNotification;
