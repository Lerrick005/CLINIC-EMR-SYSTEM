// frontend/src/services/notificationService.ts
import api from '../lib/api';
import { Socket } from 'socket.io-client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  prescription_new: boolean;
  prescription_dispensed: boolean;
  prescription_partial: boolean;
  prescription_cancelled: boolean;
  consultation_saved: boolean;
  lab_result: boolean;
  lab_abnormal: boolean;
  referral_created: boolean;
  patient_registered: boolean;
}

class NotificationService {
  private socket: Socket | null = null;
  private listeners: ((notification: Notification) => void)[] = [];

  initialize(socket: Socket) {
    this.socket = socket;
    
    this.socket.on('notification:new', (data: Notification) => {
      this.notifyListeners(data);
    });

    this.socket.on('notification:updated', () => {
      this.fetchNotifications();
    });
  }

  onNotification(callback: (notification: Notification) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(notification: Notification) {
    this.listeners.forEach(callback => callback(notification));
  }

  async fetchNotifications(limit: number = 50): Promise<Notification[]> {
    try {
      const response = await api.get(`/notifications?limit=${limit}`);
      if (response.data.success) {
        return response.data.notifications;
      }
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/unread-count');
      if (response.data.success) {
        return response.data.count;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data.success;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async markAllAsRead(): Promise<boolean> {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data.success;
    } catch (error) {
      console.error('Error marking all as read:', error);
      return false;
    }
  }

  async getPreferences(): Promise<NotificationPreferences | null> {
    try {
      const response = await api.get('/notifications/preferences');
      if (response.data.success) {
        return response.data.preferences;
      }
      return null;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return null;
    }
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const response = await api.put('/notifications/preferences', preferences);
      return response.data.success;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'prescription_new': '💊 New Prescription',
      'prescription_dispensed': '✅ Prescription Dispensed',
      'prescription_partial': '⚠️ Partial Dispense',
      'prescription_cancelled': '🚫 Prescription Cancelled',
      'prescription_ready': '📦 Prescription Ready',
      'consultation_saved': '📋 Consultation Saved',
      'lab_result': '🔬 Lab Result',
      'lab_abnormal': '⚠️ Abnormal Lab',
      'referral_created': '📤 Referral Created',
      'patient_registered': '👤 New Patient'
    };
    return labels[type] || type;
  }

  getNotificationStyle(type: string): { icon: string; color: string } {
    const styles: Record<string, { icon: string; color: string }> = {
      'prescription_new': { icon: '💊', color: '#2563EB' },
      'prescription_dispensed': { icon: '✅', color: '#059669' },
      'prescription_partial': { icon: '⚠️', color: '#D97706' },
      'prescription_cancelled': { icon: '🚫', color: '#DC2626' },
      'prescription_ready': { icon: '📦', color: '#059669' },
      'consultation_saved': { icon: '📋', color: '#7C3AED' },
      'lab_result': { icon: '🔬', color: '#2563EB' },
      'lab_abnormal': { icon: '⚠️', color: '#DC2626' },
      'referral_created': { icon: '📤', color: '#D97706' },
      'patient_registered': { icon: '👤', color: '#059669' }
    };
    return styles[type] || { icon: '📌', color: '#6B7280' };
  }

  timeAgo(date: string): string {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return past.toLocaleDateString();
  }
}

export default new NotificationService();
