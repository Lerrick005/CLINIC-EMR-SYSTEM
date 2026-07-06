'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import styles from './ActionToolbar.module.css';

export default function ActionToolbar() {
  const router = useRouter();
  const [clinicName, setClinicName] = useState('Loading...');

  useEffect(() => {
    const fetchClinicName = async () => {
      try {
        const response = await api.get('/config/clinic');
        if (response.data.success && response.data.config) {
          const name = response.data.config.clinicName || 'CLINIC EMR';
          setClinicName(name);
        }
      } catch (error) {
        console.error('Error fetching clinic name:', error);
        setClinicName('CLINIC EMR');
      }
    };
    
    fetchClinicName();
  }, []);

  const actions = [
    { label: 'Add Patient', icon: '➕', onClick: () => router.push('/patients/new'), color: '#FFD700', textColor: '#1A1A1A' },
    { label: 'Order Lab', icon: '🔬', onClick: () => router.push('/lab-orders/new'), color: '#10B981', textColor: 'white' },
    { label: 'Referral', icon: '📤', onClick: () => router.push('/referrals/new'), color: '#F97316', textColor: 'white' },
  ];

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarContainer}>
        <Link href="/dashboard" className={styles.logo}>
          <span className={styles.logoIcon}>🏥</span>
          <span className={styles.logoText}>{clinicName}</span>
        </Link>

        <div className={styles.actionGroup}>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={styles.actionBtn}
              style={{
                background: action.color,
                color: action.textColor
              }}
            >
              <span className={styles.btnIcon}>{action.icon}</span>
              <span className={styles.btnLabel}>{action.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.rightGroup}>
          <button
            className={styles.logoutBtn}
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}
