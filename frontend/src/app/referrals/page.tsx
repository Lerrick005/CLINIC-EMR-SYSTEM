'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import styles from './referrals.module.css';

interface Referral {
  id: string;
  referral_no: string;
  patient_id: string;
  patient_first_name: string;
  patient_last_name: string;
  specialty: string;
  urgency: string;
  status: string;
  reason_for_referral: string;
  created_at: string;
}

const statusColors = {
  generated: { label: 'Generated', color: '#6B7280' },
  sent: { label: 'Sent', color: '#3B82F6' },
  accepted: { label: 'Accepted', color: '#10B981' },
  completed: { label: 'Completed', color: '#059669' },
  cancelled: { label: 'Cancelled', color: '#EF4444' },
};

const urgencyColors = {
  routine: { label: 'Routine', color: '#10B981' },
  urgent: { label: 'Urgent', color: '#F59E0B' },
  emergency: { label: 'Emergency', color: '#EF4444' },
};

export default function ReferralsPage() {
  const router = useRouter();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchReferrals();
  }, [statusFilter]);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const url = statusFilter !== 'all' ? `/referrals?status=${statusFilter}` : '/referrals';
      const res = await api.get(url);
      if (res.data.success) {
        setReferrals(res.data.referrals);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = statusColors[status as keyof typeof statusColors] || statusColors.generated;
    return (
      <span className={styles.statusBadge} style={{ background: s.color }}>
        {s.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const u = urgencyColors[urgency as keyof typeof urgencyColors] || urgencyColors.routine;
    return (
      <span className={styles.urgencyBadge} style={{ color: u.color, borderColor: u.color }}>
        {u.label}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Loading referrals...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📋 Referrals</h1>
          <p className={styles.subtitle}>Manage patient referrals</p>
        </div>
        <button className={styles.newBtn} onClick={() => router.push('/referrals/new')}>
          ➕ New Referral
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="generated">Generated</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Total</label>
          <span className={styles.count}>{referrals.length}</span>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Referral No</th>
              <th>Patient</th>
              <th>Specialty</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>No referrals found</td>
              </tr>
            ) : (
              referrals.map((ref) => (
                <tr key={ref.id}>
                  <td className={styles.referralNo}>{ref.referral_no}</td>
                  <td>
                    {ref.patient_first_name} {ref.patient_last_name}
                  </td>
                  <td>{ref.specialty || 'General'}</td>
                  <td>{getUrgencyBadge(ref.urgency)}</td>
                  <td>{getStatusBadge(ref.status)}</td>
                  <td className={styles.dateCell}>{formatDate(ref.created_at)}</td>
                  <td>
                    <button
                      className={styles.viewBtn}
                      onClick={() => router.push(`/referrals/${ref.id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}