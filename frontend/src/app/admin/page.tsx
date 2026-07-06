'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ClinicTab from './components/ClinicTab';
import DoctorsTab from './components/DoctorsTab';
import StaffTab from './components/StaffTab';
import styles from './admin.module.css';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('clinic');
  const router = useRouter();

  const handleTabClick = (tab: string) => {
    if (tab === 'audit') {
      router.push('/admin/audit');
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button className={activeTab === 'clinic' ? styles.active : ''} onClick={() => handleTabClick('clinic')}>
          Clinic
        </button>
        <button className={activeTab === 'doctors' ? styles.active : ''} onClick={() => handleTabClick('doctors')}>
          Doctors
        </button>
        <button className={activeTab === 'staff' ? styles.active : ''} onClick={() => handleTabClick('staff')}>
          Staff
        </button>
        <button className={styles.auditTab} onClick={() => handleTabClick('audit')}>
          📋 Audit Logs
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'clinic' && <ClinicTab />}
        {activeTab === 'doctors' && <DoctorsTab />}
        {activeTab === 'staff' && <StaffTab />}
      </div>
    </div>
  );
}
