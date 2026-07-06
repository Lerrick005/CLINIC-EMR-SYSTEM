'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import styles from './NotificationBell.module.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string;
  reference_type: string;
  is_read: boolean;
  created_at: string;
}

type FilterType = 'all' | 'unread' | 'prescription' | 'consultation' | 'lab' | 'referral';

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showToast, setShowToast] = useState<Notification | null>(null);
  const [playSound, setPlaySound] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    setupSocketListeners();

    // Click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setupSocketListeners = () => {
    try {
      const socket = getSocket();
      socket.on('notification:new', (data) => {
        const newNotification = {
          ...data,
          is_read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        showToastNotification(newNotification);
        
        // Play sound
        if (playSound) {
          playNotificationSound();
        }
      });

      return () => {
        socket.off('notification:new');
      };
    } catch (error) {
      console.error('Socket setup error:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=50');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data.success) {
        setUnreadCount(res.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);

    // Navigate based on type
    switch (notification.reference_type) {
      case 'patient':
        router.push(`/patients/${notification.reference_id}`);
        break;
      case 'consultation':
        router.push(`/consultations/${notification.reference_id}`);
        break;
      case 'lab':
        router.push(`/lab-orders/${notification.reference_id}`);
        break;
      case 'referral':
        router.push(`/referrals/${notification.reference_id}`);
        break;
      default:
        break;
    }
    setIsOpen(false);
  };

  const showToastNotification = (notification: Notification) => {
    setShowToast(notification);
    
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(null);
    }, 5000);
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Audio not supported, silently fail
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      patient: '👤',
      consultation: '🩺',
      lab: '🔬',
      prescription: '💊',
      referral: '📤',
      lab_abnormal: '⚠️',
      prescription_new: '💊',
      prescription_dispensed: '✅',
      prescription_partial: '⚠️',
      prescription_cancelled: '🚫',
      prescription_ready: '📦',
      consultation_saved: '📋',
      patient_registered: '👤'
    };
    return icons[type] || '📌';
  };

  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.is_read);
    return notifications.filter(n => n.type.includes(filter));
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getFilterLabel = (filterType: FilterType) => {
    const labels: Record<FilterType, string> = {
      all: 'All',
      unread: 'Unread',
      prescription: '💊 Prescriptions',
      consultation: '🩺 Consultations',
      lab: '🔬 Lab',
      referral: '📤 Referrals'
    };
    return labels[filterType];
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#141414',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
            padding: '16px 20px',
            maxWidth: '380px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 10000,
            animation: 'slideIn 0.3s ease-out',
            cursor: 'pointer',
          }}
          onClick={() => {
            setShowToast(null);
            setIsOpen(true);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3B82F6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2A2A2A';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '24px' }}>
              {getTypeIcon(showToast.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: 'white', fontSize: '14px' }}>
                {showToast.title}
              </div>
              <div style={{ color: '#A3A3A3', fontSize: '13px', marginTop: '2px' }}>
                {showToast.message}
              </div>
              <div style={{ color: '#6B6B6B', fontSize: '11px', marginTop: '4px' }}>
                {getTimeAgo(showToast.created_at)}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowToast(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B6B6B',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0 4px',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Main Notification Bell */}
      <div className={styles.container} ref={dropdownRef}>
        <button
          className={styles.bellButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Notifications"
        >
          🔔
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.header}>
              <span className={styles.title}>Notifications</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setPlaySound(!playSound)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: playSound ? '#3B82F6' : '#6B6B6B',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                  title={playSound ? 'Sound on' : 'Sound off'}
                >
                  {playSound ? '🔊' : '🔇'}
                </button>
                {unreadCount > 0 && (
                  <button className={styles.markAllBtn} onClick={handleMarkAllAsRead}>
                    Mark all as read
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div style={{
              display: 'flex',
              gap: '4px',
              padding: '8px 12px',
              borderBottom: '1px solid #1F1F1F',
              flexWrap: 'wrap',
            }}>
              {(['all', 'unread', 'prescription', 'consultation', 'lab', 'referral'] as FilterType[]).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '16px',
                    border: filter === filterType ? '1px solid #3B82F6' : '1px solid #2A2A2A',
                    background: filter === filterType ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: filter === filterType ? '#3B82F6' : '#A3A3A3',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {getFilterLabel(filterType)}
                </button>
              ))}
            </div>

            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <span>📭</span>
                <p>No notifications</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <span>🔍</span>
                <p>No {filter !== 'all' ? filter : ''} notifications</p>
              </div>
            ) : (
              <div className={styles.list}>
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`${styles.item} ${!notification.is_read ? styles.unread : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={styles.icon}>{getTypeIcon(notification.type)}</div>
                    <div className={styles.content}>
                      <div className={styles.title}>{notification.title}</div>
                      <div className={styles.message}>{notification.message}</div>
                      <div className={styles.time}>{getTimeAgo(notification.created_at)}</div>
                    </div>
                    {!notification.is_read && <div className={styles.unreadDot}></div>}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.footer}>
              <button className={styles.viewAllBtn} onClick={() => router.push('/notifications')}>
                View all notifications →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
