'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { useSocket } from '../../../hooks/useSocket';
import styles from './audit.module.css';

interface AuditLog {
  id: string;
  user_id: string;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface AuditStats {
  actions: Array<{ action: string; count: number }>;
  total: number;
  activeUsers: number;
  periodDays: number;
}

export default function AuditPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [filters, setFilters] = useState({
    action: 'all',
    resourceType: 'all',
    userId: 'all',
    dateFrom: '',
    dateTo: '',
    limit: 50,
    offset: 0
  });
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const actionColors: Record<string, string> = {
    CREATE: '#10B981',
    UPDATE: '#3B82F6',
    DELETE: '#EF4444',
    VIEW: '#6B7280',
    LOGIN: '#8B5CF6',
    LOGOUT: '#F59E0B'
  };

  // Real-time socket listener for audit updates
  useEffect(() => {
    if (!socket) return;

    const handleAuditUpdate = (data: any) => {
      console.log('🔄 Real-time audit update:', data);
      fetchLogs();
      fetchStats();
    };

    socket.on('audit:new', handleAuditUpdate);

    return () => {
      socket.off('audit:new', handleAuditUpdate);
    };
  }, [socket]);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.action !== 'all') params.append('action', filters.action);
      if (filters.resourceType !== 'all') params.append('resourceType', filters.resourceType);
      if (filters.userId !== 'all') params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      params.append('limit', filters.limit.toString());
      params.append('offset', filters.offset.toString());

      const res = await api.get('/audit/logs?' + params.toString());
      if (res.data.success) {
        setLogs(res.data.data);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/audit/stats?days=7');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionBadge = (action: string) => {
    const color = actionColors[action] || '#6B7280';
    return (
      <span className={styles.actionBadge} style={{ background: color }}>
        {action}
      </span>
    );
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Loading audit logs...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📋 Audit Logs</h1>
          <p className={styles.subtitle}>Track all system activities and user actions</p>
        </div>
        <button className={styles.refreshBtn} onClick={() => { fetchLogs(); fetchStats(); }}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats?.total || 0}</div>
          <div className={styles.statLabel}>Total Actions (7 days)</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats?.activeUsers || 0}</div>
          <div className={styles.statLabel}>Active Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats?.actions?.length || 0}</div>
          <div className={styles.statLabel}>Action Types</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats?.periodDays || 7}</div>
          <div className={styles.statLabel}>Days Tracked</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Action</label>
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value, offset: 0 })}
          >
            <option value="all">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="VIEW">View</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Resource</label>
          <select
            value={filters.resourceType}
            onChange={(e) => setFilters({ ...filters, resourceType: e.target.value, offset: 0 })}
          >
            <option value="all">All Resources</option>
            <option value="patient">Patient</option>
            <option value="consultation">Consultation</option>
            <option value="prescription">Prescription</option>
            <option value="lab_order">Lab Order</option>
            <option value="referral">Referral</option>
            <option value="user">User</option>
            <option value="clinic">Clinic</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Date From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, offset: 0 })}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Date To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, offset: 0 })}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Limit</label>
          <select
            value={filters.limit}
            onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), offset: 0 })}
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Action</th>
              <th>User</th>
              <th>Resource</th>
              <th>Details</th>
              <th>IP Address</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>No audit logs found</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{getActionBadge(log.action)}</td>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.userName}>
                        {log.user_first_name} {log.user_last_name}
                      </div>
                      <div className={styles.userEmail}>{log.user_email}</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.resourceCell}>
                      <div className={styles.resourceType}>{log.resource_type}</div>
                      <div className={styles.resourceId}>{log.resource_id?.slice(0, 8)}...</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.detailsCell}>
                      {log.details?.method || log.details?.action || '—'}
                    </div>
                  </td>
                  <td className={styles.ipCell}>{log.ip_address || '—'}</td>
                  <td className={styles.dateCell}>{formatDate(log.created_at)}</td>
                  <td>
                    <button
                      className={styles.viewBtn}
                      onClick={() => handleViewDetails(log)}
                    >
                      📋 Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > filters.limit && (
        <div className={styles.pagination}>
          <button
            disabled={filters.offset === 0}
            onClick={() => setFilters({ ...filters, offset: Math.max(0, filters.offset - filters.limit) })}
          >
            ← Previous
          </button>
          <span>
            {Math.floor(filters.offset / filters.limit) + 1} of {Math.ceil(total / filters.limit)}
          </span>
          <button
            disabled={filters.offset + filters.limit >= total}
            onClick={() => setFilters({ ...filters, offset: filters.offset + filters.limit })}
          >
            Next →
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetails && selectedLog && (
        <div className={styles.modalOverlay} onClick={() => setShowDetails(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>📋 Audit Log Details</h2>
              <button className={styles.modalClose} onClick={() => setShowDetails(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Action:</span>
                <span className={styles.detailValue}>{getActionBadge(selectedLog.action)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>User:</span>
                <span className={styles.detailValue}>
                  {selectedLog.user_first_name} {selectedLog.user_last_name} ({selectedLog.user_email})
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Resource:</span>
                <span className={styles.detailValue}>
                  {selectedLog.resource_type} - {selectedLog.resource_id}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Time:</span>
                <span className={styles.detailValue}>{formatDate(selectedLog.created_at)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>IP Address:</span>
                <span className={styles.detailValue}>{selectedLog.ip_address || '—'}</span>
              </div>
              <div className={styles.detailSection}>
                <h4>Details</h4>
                <pre className={styles.detailJson}>
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.closeBtn} onClick={() => setShowDetails(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
