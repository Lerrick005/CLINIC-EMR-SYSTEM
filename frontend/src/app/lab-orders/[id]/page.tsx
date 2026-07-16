'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import styles from './detail.module.css';

interface LabOrder {
  id: string;
  patient_id: string;
  patient_first_name: string;
  patient_last_name: string;
  test_name: string;
  test_code: string;
  test_category: string;
  priority: string;
  status: string;
  ordered_date: string;
  clinical_notes: string;
  amount_due: number;
  is_abnormal: boolean;
  abnormal_flags: string[];
  resulted_by: string;
  resulted_date: string;
  reviewed_by: string;
  reviewed_date: string;
  result_notes: string;
}

interface LabResult {
  id: string;
  parameter: string;
  value: string;
  unit: string;
  reference_min: string;
  reference_max: string;
  is_abnormal: boolean;
  flag: string;
  notes: string;
}

const priorityLabels = {
  routine: { label: 'Routine', color: '#10B981' },
  urgent: { label: 'Urgent', color: '#F59E0B' },
  stat: { label: 'STAT', color: '#F97316' },
  emergency: { label: 'Emergency', color: '#EF4444' },
};

const statusLabels = {
  pending: 'Pending',
  sample_collected: 'Sample Collected',
  processing: 'Processing',
  completed: 'Completed',
  reviewed: 'Reviewed',
};

export default function LabOrderDetail() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<LabOrder | null>(null);
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [resultNotes, setResultNotes] = useState('');
  const [status, setStatus] = useState('completed');

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/lab-orders/${params?.id}`);
      if (res.data.success) {
        setOrder(res.data.order);
        setResults(res.data.results || []);
        setResultNotes(res.data.order.result_notes || '');
        setStatus(res.data.order.status || 'completed');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultChange = (index: number, field: string, value: string) => {
    const updated = [...results];
    updated[index] = { ...updated[index], [field]: value };
    setResults(updated);
  };

  const addResultRow = () => {
    setResults([
      ...results,
      {
        id: '',
        parameter: '',
        value: '',
        unit: '',
        reference_min: '',
        reference_max: '',
        is_abnormal: false,
        flag: '',
        notes: '',
      },
    ]);
  };

  const removeResultRow = (index: number) => {
    const updated = results.filter((_, i) => i !== index);
    setResults(updated);
  };

  const handleSubmit = async () => {
    // Validate
    const hasResults = results.some((r) => r.parameter && r.value);
    if (!hasResults) {
      alert('Please enter at least one result');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post(`/lab-orders/${params?.id}/results`, {
        results: results.filter((r) => r.parameter && r.value),
        result_notes: resultNotes,
        status: status,
      });

      if (res.data.success) {
        alert('✅ Results saved successfully!');
        if (res.data.isAbnormal) {
          alert(`⚠️ Abnormal results detected: ${res.data.abnormalFlags?.join(', ')}`);
        }
        router.push('/lab-orders');
      } else {
        alert('❌ Failed to save results');
      }
    } catch (error) {
      console.error('Error saving results:', error);
      alert('❌ Error saving results');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Loading...</div>;
  }

  if (!order) {
    return <div className={styles.loadingContainer}>Order not found</div>;
  }

  const priority = priorityLabels[order.priority as keyof typeof priorityLabels] || priorityLabels.routine;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>← Back</button>
        <h1 className={styles.title}>🔬 Lab Order Details</h1>
      </div>

      {/* Order Info */}
      <div className={styles.orderInfo}>
        <div className={styles.infoGrid}>
          <div>
            <label>Patient</label>
            <span className={styles.infoValue}>
              {order.patient_first_name} {order.patient_last_name}
            </span>
          </div>
          <div>
            <label>Test</label>
            <span className={styles.infoValue}>{order.test_name}</span>
            {order.test_code && <span className={styles.infoCode}>{order.test_code}</span>}
          </div>
          <div>
            <label>Priority</label>
            <span className={styles.priorityBadge} style={{ color: priority.color }}>
              {priority.label}
            </span>
          </div>
          <div>
            <label>Status</label>
            <span className={styles.statusBadge}>
              {statusLabels[order.status as keyof typeof statusLabels] || order.status}
            </span>
          </div>
          <div>
            <label>Ordered Date</label>
            <span className={styles.infoValue}>
              {new Date(order.ordered_date).toLocaleDateString('en-KE', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div>
            <label>Amount Due</label>
            <span className={styles.amountValue}>KES {order.amount_due?.toLocaleString() || '0'}</span>
          </div>
        </div>
        {order.clinical_notes && (
          <div className={styles.notesSection}>
            <label>Clinical Notes</label>
            <p>{order.clinical_notes}</p>
          </div>
        )}
      </div>

      {/* Results Entry */}
      <div className={styles.resultsSection}>
        <div className={styles.sectionHeader}>
          <h3>📊 Results</h3>
          <button className={styles.addRowBtn} onClick={addResultRow}>
            + Add Result
          </button>
        </div>

        {results.length === 0 ? (
          <div className={styles.emptyResults}>
            <p>No results entered yet. Click "Add Result" to start.</p>
          </div>
        ) : (
          <div className={styles.resultsTable}>
            <table>
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Reference Range</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} className={result.is_abnormal ? styles.abnormalRow : ''}>
                    <td>
                      <input
                        type="text"
                        value={result.parameter}
                        onChange={(e) => handleResultChange(index, 'parameter', e.target.value)}
                        placeholder="e.g., WBC"
                        className={styles.input}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={result.value}
                        onChange={(e) => handleResultChange(index, 'value', e.target.value)}
                        placeholder="e.g., 6.5"
                        className={styles.input}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={result.unit}
                        onChange={(e) => handleResultChange(index, 'unit', e.target.value)}
                        placeholder="e.g., x10^9/L"
                        className={styles.input}
                      />
                    </td>
                    <td>
                      <div className={styles.rangeInputs}>
                        <input
                          type="text"
                          value={result.reference_min}
                          onChange={(e) => handleResultChange(index, 'reference_min', e.target.value)}
                          placeholder="Min"
                          className={styles.inputSmall}
                        />
                        <span>–</span>
                        <input
                          type="text"
                          value={result.reference_max}
                          onChange={(e) => handleResultChange(index, 'reference_max', e.target.value)}
                          placeholder="Max"
                          className={styles.inputSmall}
                        />
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={result.notes}
                        onChange={(e) => handleResultChange(index, 'notes', e.target.value)}
                        placeholder="Notes"
                        className={styles.input}
                      />
                    </td>
                    <td>
                      <button className={styles.removeBtn} onClick={() => removeResultRow(index)}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.resultNotes}>
          <label>Result Notes (Free Text)</label>
          <textarea
            value={resultNotes}
            onChange={(e) => setResultNotes(e.target.value)}
            placeholder="Add any additional notes about the results..."
            rows={3}
          />
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <div className={styles.statusSelect}>
          <label>Update Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="sample_collected">Sample Collected</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
        <div className={styles.actionButtons}>
          <button className={styles.cancelBtn} onClick={() => router.push('/lab-orders')}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Results'}
          </button>
        </div>
      </div>
    </div>
  );
}