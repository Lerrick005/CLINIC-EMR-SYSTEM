'use client';

import React, { useState, useEffect } from 'react';
import styles from './diagnoses.module.css';
import api from '../../lib/api';

interface Diagnosis {
  id: string;
  name: string;
  code?: string;
  category?: string;
  total_cases?: number;
}

interface Stats {
  total_unique: number;
  total_with_diagnosis: number;
  top_diagnoses: Array<{ name: string; count: number }>;
}

export default function AllDiagnosesPage() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDiagnosis, setNewDiagnosis] = useState({ name: '', code: '', category: 'General' });

  useEffect(() => {
    fetchDiagnoses();
    fetchStats();
  }, []);

  const fetchDiagnoses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/diagnoses/all');
      if (response.data.success) {
        setDiagnoses(response.data.diagnoses || []);
      }
    } catch (error: any) {
      console.error('Error fetching diagnoses:', error);
      setError(error.response?.data?.error || 'Failed to load diagnoses');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/diagnoses/stats/overview');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAddDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/diagnoses', newDiagnosis);
      if (response.data.success) {
        setShowAddModal(false);
        setNewDiagnosis({ name: '', code: '', category: 'General' });
        fetchDiagnoses();
        fetchStats();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add diagnosis');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const response = await api.delete(`/diagnoses/${id}`);
      if (response.data.success) {
        fetchDiagnoses();
        fetchStats();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete diagnosis');
    }
  };

  const filteredDiagnoses = diagnoses.filter(d =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading diagnoses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>❌ {error}</p>
          <button onClick={fetchDiagnoses}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>📋 All Diagnoses</h1>
          <p className={styles.subtitle}>Manage and track diagnoses used in consultations</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.addButton}
            onClick={() => setShowAddModal(true)}
          >
            ➕ Add Diagnosis
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{diagnoses.length}</div>
          <div className={styles.statLabel}>Total Diagnoses</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats?.total_unique || 0}</div>
          <div className={styles.statLabel}>Unique Diagnoses</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats?.total_with_diagnosis || 0}</div>
          <div className={styles.statLabel}>Total Cases</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {stats?.top_diagnoses?.[0]?.name || 'N/A'}
          </div>
          <div className={styles.statLabel}>Most Common</div>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchSection}>
        <input
          type="text"
          placeholder="🔍 Search by name, code, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        {searchTerm && (
          <span className={styles.resultCount}>
            Found {filteredDiagnoses.length} results
          </span>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Code</th>
              <th>Diagnosis Name</th>
              <th>Category</th>
              <th>Total Cases</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDiagnoses.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  No diagnoses found matching "{searchTerm}"
                </td>
              </tr>
            ) : (
              filteredDiagnoses.map((diagnosis, idx) => (
                <tr key={diagnosis.id || idx}>
                  <td>{idx + 1}</td>
                  <td className={styles.code}>{diagnosis.code || 'N/A'}</td>
                  <td className={styles.name}>{diagnosis.name}</td>
                  <td className={styles.category}>
                    <span className={styles.categoryBadge}>
                      {diagnosis.category || 'General'}
                    </span>
                  </td>
                  <td className={styles.cases}>
                    <span className={styles.caseBadge}>
                      {diagnosis.total_cases || 0}
                    </span>
                  </td>
                  <td>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(diagnosis.id, diagnosis.name)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Diagnosis Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>➕ Add New Diagnosis</h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddDiagnosis}>
              <div className={styles.formGroup}>
                <label>Diagnosis Name *</label>
                <input
                  type="text"
                  value={newDiagnosis.name}
                  onChange={(e) => setNewDiagnosis({ ...newDiagnosis, name: e.target.value })}
                  placeholder="Enter diagnosis name"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Code (Optional)</label>
                <input
                  type="text"
                  value={newDiagnosis.code}
                  onChange={(e) => setNewDiagnosis({ ...newDiagnosis, code: e.target.value })}
                  placeholder="e.g., ICD-10 code"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Category</label>
                <select
                  value={newDiagnosis.category}
                  onChange={(e) => setNewDiagnosis({ ...newDiagnosis, category: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="Infectious">Infectious</option>
                  <option value="Chronic">Chronic</option>
                  <option value="Acute">Acute</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Respiratory">Respiratory</option>
                  <option value="Neurological">Neurological</option>
                  <option value="Psychiatric">Psychiatric</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                >
                  Add Diagnosis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
