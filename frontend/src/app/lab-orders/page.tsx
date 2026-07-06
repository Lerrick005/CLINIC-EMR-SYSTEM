'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import styles from './lab.module.css';

interface LabOrder {
  id: string;
  patient_id: string;
  patient_first_name: string;
  patient_last_name: string;
  test_name: string;
  test_code: string;
  priority: string;
  status: string;
  ordered_date: string;
  amount_due: number;
  is_abnormal: boolean;
  abnormal_flags: string[];
}

const priorityColors = {
  routine: { label: 'Routine', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  urgent: { label: 'Urgent', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  stat: { label: 'STAT', color: '#F97316', bg: 'rgba(249,115,22,0.15)' },
  emergency: { label: 'Emergency', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};

const statusLabels = {
  pending: 'Pending',
  sample_collected: 'Sample Collected',
  processing: 'Processing',
  completed: 'Completed',
  reviewed: 'Reviewed',
};

export default function LabDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [filter, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('priority', filter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const url = `/lab-orders${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await api.get(url);
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (error) {
      console.error('Error fetching lab orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const p = priorityColors[priority as keyof typeof priorityColors] || priorityColors.routine;
    return (
      <span className={styles.priorityBadge} style={{ background: p.bg, color: p.color }}>
        {p.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = statusLabels;
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      sample_collected: '#3B82F6',
      processing: '#8B5CF6',
      completed: '#10B981',
      reviewed: '#6B7280',
    };
    return (
      <span className={styles.statusBadge} style={{ background: colors[status] || '#6B7280' }}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Loading lab orders...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🔬 Laboratory Dashboard</h1>
          <p className={styles.subtitle}>Manage lab orders and results</p>
        </div>
        <button className={styles.newOrderBtn} onClick={() => router.push('/lab-orders/new')}>
          + New Lab Order
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Priority</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="stat">STAT</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="sample_collected">Sample Collected</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Orders</label>
          <span className={styles.orderCount}>{orders.length}</span>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Test</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Ordered</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>No lab orders found</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className={order.is_abnormal ? styles.abnormalRow : ''}>
                  <td>
                    <div className={styles.patientCell}>
                      <span className={styles.patientName}>
                        {order.patient_first_name} {order.patient_last_name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.testCell}>
                      <span className={styles.testName}>{order.test_name}</span>
                      {order.test_code && <span className={styles.testCode}>{order.test_code}</span>}
                    </div>
                  </td>
                  <td>{getPriorityBadge(order.priority)}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td className={styles.dateCell}>{formatDate(order.ordered_date)}</td>
                  <td className={styles.amountCell}>KES {order.amount_due?.toLocaleString() || '0'}</td>
                  <td>
                    <button
                      className={styles.viewBtn}
                      onClick={() => router.push(`/lab-orders/${order.id}`)}
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
