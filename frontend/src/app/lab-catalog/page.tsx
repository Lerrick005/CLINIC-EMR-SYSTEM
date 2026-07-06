'use client';

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import styles from './catalog.module.css';

interface Test {
  id: string;
  name: string;
  code: string;
  category: string;
  price: number;
  turnaround: string;
  reference_ranges: any;
  is_active: boolean;
  is_system: boolean;
}

export default function LabCatalog() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    price: '',
    turnaround: '',
    reference_min: '',
    reference_max: '',
    unit: '',
  });

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const res = await api.get('/lab-catalog');
      if (res.data.success) {
        setTests(res.data.tests);
      }
    } catch (error) {
      console.error('Error fetching catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      code: formData.code.toUpperCase(),
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      turnaround: formData.turnaround,
      reference_ranges: {
        [formData.code]: {
          min: parseFloat(formData.reference_min) || null,
          max: parseFloat(formData.reference_max) || null,
          unit: formData.unit,
        },
      },
    };

    try {
      let res;
      if (editingTest) {
        res = await api.put(`/lab-catalog/${editingTest.id}`, payload);
      } else {
        res = await api.post('/lab-catalog', payload);
      }

      if (res.data.success) {
        alert(editingTest ? '✅ Test updated!' : '✅ Test added!');
        setShowModal(false);
        setEditingTest(null);
        setFormData({ name: '', code: '', category: '', price: '', turnaround: '', reference_min: '', reference_max: '', unit: '' });
        fetchCatalog();
      }
    } catch (error) {
      alert('❌ Failed to save test');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await api.delete(`/lab-catalog/${id}`);
      if (res.data.success) {
        alert('✅ Test deleted');
        fetchCatalog();
      }
    } catch (error) {
      alert('❌ Failed to delete test');
    }
  };

  const openEditModal = (test: Test) => {
    setEditingTest(test);
    const ranges = test.reference_ranges?.[test.code] || {};
    setFormData({
      name: test.name,
      code: test.code,
      category: test.category || '',
      price: test.price.toString(),
      turnaround: test.turnaround || '',
      reference_min: ranges.min?.toString() || '',
      reference_max: ranges.max?.toString() || '',
      unit: ranges.unit || '',
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingTest(null);
    setFormData({ name: '', code: '', category: '', price: '', turnaround: '', reference_min: '', reference_max: '', unit: '' });
    setShowModal(true);
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Loading catalog...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📚 Test Catalog</h1>
          <p className={styles.subtitle}>Manage laboratory tests and reference ranges</p>
        </div>
        <button className={styles.addBtn} onClick={openAddModal}>
          ➕ Add Test
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Code</th>
              <th>Category</th>
              <th>Price (KES)</th>
              <th>Turnaround</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>No tests in catalog</td>
              </tr>
            ) : (
              tests.map((test) => (
                <tr key={test.id} className={!test.is_active ? styles.inactiveRow : ''}>
                  <td className={styles.testName}>{test.name}</td>
                  <td><code className={styles.testCode}>{test.code}</code></td>
                  <td>{test.category || '—'}</td>
                  <td className={styles.priceCell}>KES {test.price.toLocaleString()}</td>
                  <td>{test.turnaround || '—'}</td>
                  <td>
                    <button className={styles.editBtn} onClick={() => openEditModal(test)} title="Edit">✏️</button>
                    {!test.is_system && (
                      <button className={styles.deleteBtn} onClick={() => handleDelete(test.id, test.name)} title="Delete">🗑️</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingTest ? '✏️ Edit Test' : '➕ Add Test'}</h3>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Test Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Code *</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Price (KES)</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} min="0" />
                </div>
                <div className={styles.formGroup}>
                  <label>Turnaround Time</label>
                  <input type="text" value={formData.turnaround} onChange={(e) => setFormData({...formData, turnaround: e.target.value})} placeholder="e.g., 24 hours" />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Reference Min</label>
                  <input type="text" value={formData.reference_min} onChange={(e) => setFormData({...formData, reference_min: e.target.value})} placeholder="e.g., 4.5" />
                </div>
                <div className={styles.formGroup}>
                  <label>Reference Max</label>
                  <input type="text" value={formData.reference_max} onChange={(e) => setFormData({...formData, reference_max: e.target.value})} placeholder="e.g., 11.0" />
                </div>
                <div className={styles.formGroup}>
                  <label>Unit</label>
                  <input type="text" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} placeholder="e.g., x10^9/L" />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>
                  {editingTest ? 'Save Changes' : 'Add Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}