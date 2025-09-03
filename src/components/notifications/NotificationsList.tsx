'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNotifications } from '@/src/contexts/NotificationsContext';
import { cn } from '@/lib/utils';

interface NotificationsListProps {
  className?: string;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ className = '' }) => {
  const { notifications, deleteNotification } = useNotifications();

  const handleDismiss = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No notifications yet</p>
        </div>
      ) : (
        notifications.map((notification) => (
          <div key={notification.id} className="relative h-22 rounded-2xl overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative h-full rounded-2xl"
            >
              {/* Glass morphism background */}
              <div className="border-gray absolute inset-0 rounded-2xl border bg-white shadow-sm" />

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full">
                {/* Title Section - Top */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {notification.title}
                  </h3>
                  <button
                    onClick={() => handleDismiss(notification.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Message Section - Bottom */}
                <div className="flex-1 px-4 py-3">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationsList;
