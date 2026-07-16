'use client';

import { useState, useEffect } from 'react';
import api from '../../lib/api';

// ============= TYPES =============
type PrescriptionStatus = 'pending' | 'partially_dispensed' | 'dispensed' | 'cancelled';

interface Prescription {
  id: string;
  consultation_id: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  medical_no?: string;
  doctor_name: string;
  doctor_id?: string;
  consultation_date: string;
  diagnosis: string;
  medication: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
  instructions: string;
  quantity: number;
  status: PrescriptionStatus;
  status_badge?: { color: string; text: string };
  dispensed_quantity: number;
  dispensed_at: string | null;
  dispensed_by: string | null;
  dispensed_notes: string;
  history: HistoryEntry[];
  created_at: string;
  updated_at: string;
  expiry_date: string | null;
  is_dispensed: boolean;
  is_partial: boolean;
  is_pending: boolean;
  is_cancelled: boolean;
}

interface HistoryEntry {
  status: PrescriptionStatus;
  timestamp: string;
  actor: string;
  actor_name: string;
  actor_role: string;
  notes: string;
}

interface Stats {
  total: number;
  pending: number;
  dispensed: number;
  partially_dispensed?: number;
  cancelled?: number;
  dispense_rate?: number;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  prescriptions?: Prescription[];
  stats?: Stats;
}

type FilterType = 'all' | 'pending' | 'partially_dispensed' | 'dispensed' | 'cancelled';

// ============= DISPENSE MODAL =============
interface DispenseModalProps {
  prescription: Prescription | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, notes: string) => void;
  loading: boolean;
}

function DispenseModal({ prescription, isOpen, onClose, onConfirm, loading }: DispenseModalProps) {
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (prescription) {
      setQuantity(prescription.quantity || 1);
    }
  }, [prescription]);

  if (!isOpen || !prescription) return null;

  const maxQuantity = prescription.quantity || 1;
  const remaining = maxQuantity - (prescription.dispensed_quantity || 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
          💊 Dispense Prescription
        </h2>
        <p style={{ color: '#475569', marginBottom: '20px' }}>
          {prescription.medication} - {prescription.patient_name}
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
            Quantity to Dispense
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              min={1}
              max={remaining}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 0, remaining))}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
            <span style={{ fontSize: '14px', color: '#475569', whiteSpace: 'nowrap' }}>
              / {remaining} remaining
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            Total prescribed: {prescription.quantity} | Already dispensed: {prescription.dispensed_quantity || 0}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
            Dispensing Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Only 20 tablets available, patient will return for remaining"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              fontSize: '14px',
              minHeight: '80px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: '#475569',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(quantity, notes)}
            disabled={loading || quantity < 1}
            style={{
              padding: '10px 20px',
              background: quantity >= remaining ? '#059669' : '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading || quantity < 1 ? 'not-allowed' : 'pointer',
              opacity: loading || quantity < 1 ? 0.6 : 1
            }}
          >
            {loading ? 'Dispensing...' : quantity >= remaining ? '✅ Full Dispense' : '⚠️ Partial Dispense'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= CANCEL MODAL =============
interface CancelModalProps {
  prescription: Prescription | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}

function CancelModal({ prescription, isOpen, onClose, onConfirm, loading }: CancelModalProps) {
  const [reason, setReason] = useState<string>('');

  if (!isOpen || !prescription) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#DC2626' }}>
          🚫 Cancel Prescription
        </h2>
        <p style={{ color: '#475569', marginBottom: '20px' }}>
          {prescription.medication} - {prescription.patient_name}
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
            Reason for Cancellation <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Patient allergic, Wrong prescription, Out of stock permanently"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              fontSize: '14px',
              minHeight: '80px',
              resize: 'vertical'
            }}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: '#475569',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
            style={{
              padding: '10px 20px',
              background: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading || !reason.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !reason.trim() ? 0.6 : 1
            }}
          >
            {loading ? 'Cancelling...' : '🚫 Cancel Prescription'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= HISTORY MODAL =============
interface HistoryModalProps {
  prescription: Prescription | null;
  isOpen: boolean;
  onClose: () => void;
}

function HistoryModal({ prescription, isOpen, onClose }: HistoryModalProps) {
  if (!isOpen || !prescription) return null;

  const history = prescription.history || [];

  const getStatusLabel = (status: PrescriptionStatus): string => {
    const labels = {
      'pending': '📝 Prescribed',
      'partially_dispensed': '⚠️ Partially Dispensed',
      'dispensed': '✅ Dispensed',
      'cancelled': '🚫 Cancelled'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: PrescriptionStatus): string => {
    const colors = {
      'pending': '#D97706',
      'partially_dispensed': '#2563EB',
      'dispensed': '#059669',
      'cancelled': '#DC2626'
    };
    return colors[status] || '#475569';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>
            📋 Prescription History
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#475569'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontWeight: '600', color: '#0F172A' }}>
            {prescription.medication} - {prescription.patient_name}
          </p>
          <p style={{ fontSize: '14px', color: '#475569' }}>
            Current Status: {getStatusBadgeText(prescription.status)}
          </p>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
            No history available
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '20px' }}>
            <div style={{
              position: 'absolute',
              left: '6px',
              top: '10px',
              bottom: '10px',
              width: '2px',
              background: '#E2E8F0'
            }} />

            {history.map((entry, index) => (
              <div key={index} style={{ position: 'relative', marginBottom: '16px', paddingLeft: '24px' }}>
                <div style={{
                  position: 'absolute',
                  left: '0',
                  top: '4px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: getStatusColor(entry.status),
                  border: '2px solid white',
                  boxShadow: '0 0 0 2px ' + getStatusColor(entry.status)
                }} />
                
                <div style={{
                  background: '#F8FAFC',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#0F172A' }}>
                        {getStatusLabel(entry.status)}
                      </div>
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                        {entry.actor_name} ({entry.actor_role})
                      </div>
                      {entry.notes && (
                        <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', fontStyle: 'italic' }}>
                          "{entry.notes}"
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============= UTILITY FUNCTIONS =============
const getStatusBadgeText = (status: PrescriptionStatus): React.ReactElement => {
  const configs = {
    'pending': { bg: '#FEF3C7', color: '#92400E', text: '⏳ Pending' },
    'partially_dispensed': { bg: '#DBEAFE', color: '#1E40AF', text: '⚠️ Partially Dispensed' },
    'dispensed': { bg: '#DCFCE7', color: '#059669', text: '✅ Dispensed' },
    'cancelled': { bg: '#FEE2E2', color: '#991B1B', text: '🚫 Cancelled' }
  };
  const config = configs[status] || configs.pending;
  return (
    <span style={{
      background: config.bg,
      color: config.color,
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      display: 'inline-block',
      fontWeight: '500'
    }}>
      {config.text}
    </span>
  );
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
};

// ============= MAIN COMPONENT =============
export default function PharmacyPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    dispensed: 0,
    partially_dispensed: 0,
    cancelled: 0,
    dispense_rate: 0
  });

  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showDispenseModal, setShowDispenseModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async (): Promise<void> => {
    setLoading(true);
    try {
      const url = filter !== 'all'
        ? `/pharmacy/prescriptions?status=${filter}`
        : '/pharmacy/prescriptions';

      const res = await api.get<ApiResponse>(url);
      if (res.data.success && res.data.prescriptions) {
        setPrescriptions(res.data.prescriptions);
      }

      const statsRes = await api.get<ApiResponse>('/pharmacy/stats');
      if (statsRes.data.success && statsRes.data.stats) {
        setStats(statsRes.data.stats);
      }
    } catch (error) {
      console.error('Error fetching pharmacy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDispenseClick = (prescription: Prescription): void => {
    if (prescription.status === 'cancelled') {
      alert('Cannot dispense a cancelled prescription');
      return;
    }
    if (prescription.status === 'dispensed') {
      alert('Prescription already fully dispensed');
      return;
    }
    setSelectedPrescription(prescription);
    setShowDispenseModal(true);
  };

  const handleDispenseConfirm = async (quantity: number, notes: string): Promise<void> => {
    if (!selectedPrescription) return;
    
    setModalLoading(true);
    try {
      const res = await api.put<ApiResponse>(
        `/pharmacy/prescriptions/${selectedPrescription.id}/dispense`,
        {
          quantity_dispensed: quantity,
          notes: notes
        }
      );
      
      if (res.data.success) {
        const remaining = selectedPrescription.quantity - quantity;
        const statusMessage = remaining > 0 ? 
          `⚠️ Partially dispensed (${quantity}/${selectedPrescription.quantity})` : 
          '✅ Fully dispensed!';
        alert(statusMessage);
        setShowDispenseModal(false);
        setSelectedPrescription(null);
        await fetchData();
      } else {
        alert('❌ Failed to dispense: ' + (res.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error dispensing:', error);
      alert('❌ Error dispensing prescription');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancelClick = (prescription: Prescription): void => {
    if (prescription.status === 'dispensed') {
      alert('Cannot cancel a dispensed prescription');
      return;
    }
    if (prescription.status === 'cancelled') {
      alert('Prescription already cancelled');
      return;
    }
    setSelectedPrescription(prescription);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async (reason: string): Promise<void> => {
    if (!selectedPrescription) return;
    
    setModalLoading(true);
    try {
      const res = await api.put<ApiResponse>(
        `/pharmacy/prescriptions/${selectedPrescription.id}/cancel`,
        { reason }
      );
      
      if (res.data.success) {
        alert('🚫 Prescription cancelled successfully');
        setShowCancelModal(false);
        setSelectedPrescription(null);
        await fetchData();
      } else {
        alert('❌ Failed to cancel: ' + (res.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error cancelling:', error);
      alert('❌ Error cancelling prescription');
    } finally {
      setModalLoading(false);
    }
  };

  
  const handleDeletePrescription = async (id: string, medication: string) => {
    if (!confirm(`Delete prescription for ${medication}? This action cannot be undone.`)) return;
    try {
      const res = await api.delete(`/pharmacy/prescriptions/${id}`);
      if (res.data.success) {
        alert("Prescription deleted successfully!");
        await fetchData();
      } else {
        alert("Failed to delete prescription");
      }
    } catch (error) {
      console.error("Error deleting prescription:", error);
      alert("Error deleting prescription");
    }
  };

  const handleHistoryClick = (prescription: Prescription): void => {
    setSelectedPrescription(prescription);
    setShowHistoryModal(true);
  };

  const renderStats = (): React.ReactElement => (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '28px', fontWeight: '700', color: '#2563EB' }}>
          {stats.total}
        </div>
        <div style={{ fontSize: '12px', color: '#475569' }}>
          Total Prescriptions
        </div>
      </div>
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '28px', fontWeight: '700', color: '#D97706' }}>
          {stats.pending || 0}
        </div>
        <div style={{ fontSize: '12px', color: '#475569' }}>
          ⏳ Pending
        </div>
      </div>
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '28px', fontWeight: '700', color: '#2563EB' }}>
          {stats.partially_dispensed || 0}
        </div>
        <div style={{ fontSize: '12px', color: '#475569' }}>
          ⚠️ Partial
        </div>
      </div>
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '28px', fontWeight: '700', color: '#059669' }}>
          {stats.dispensed || 0}
        </div>
        <div style={{ fontSize: '12px', color: '#475569' }}>
          ✅ Dispensed
        </div>
      </div>
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '28px', fontWeight: '700', color: '#DC2626' }}>
          {stats.cancelled || 0}
        </div>
        <div style={{ fontSize: '12px', color: '#475569' }}>
          🚫 Cancelled
        </div>
      </div>
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '28px', fontWeight: '700', color: '#7C3AED' }}>
          {stats.dispense_rate || 0}%
        </div>
        <div style={{ fontSize: '12px', color: '#475569' }}>
          Dispense Rate
        </div>
      </div>
    </div>
  );

  const renderFilters = (): React.ReactElement => (
    <div style={{
      display: 'flex',
      gap: '8px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    }}>
      {(['all', 'pending', 'partially_dispensed', 'dispensed', 'cancelled'] as FilterType[]).map((filterType) => {
        const labels = {
          'all': '📋 All',
          'pending': '⏳ Pending',
          'partially_dispensed': '⚠️ Partial',
          'dispensed': '✅ Dispensed',
          'cancelled': '🚫 Cancelled'
        };
        return (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            style={{
              padding: '8px 16px',
              background: filter === filterType ? '#2563EB' : 'white',
              color: filter === filterType ? 'white' : '#475569',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: filter === filterType ? '600' : '400',
              transition: 'all 0.2s'
            }}
          >
            {labels[filterType]}
          </button>
        );
      })}
    </div>
  );

  const renderTable = (): React.ReactElement => {
    if (prescriptions.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#94A3B8'
        }}>
          No prescriptions found
        </div>
      );
    }

    return (
      <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
        <thead>
          <tr style={{
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0'
          }}>
            <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              color: '#475569',
              fontSize: '12px', 
              textTransform: 'uppercase'
            }}>
              Patient
            </th>
            <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              color: '#475569',
              fontSize: '12px',
              textTransform: 'uppercase'
            }}>
              Medication
            </th>
            <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              color: '#475569',
              fontSize: '12px',
              textTransform: 'uppercase'
            }}>
              Dosage / Qty
            </th>
            <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              color: '#475569',
              fontSize: '12px',
              textTransform: 'uppercase'
            }}>
              Doctor
            </th>
            <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              color: '#475569',
              fontSize: '12px',
              textTransform: 'uppercase'
            }}>
              Status
            </th>
            <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              color: '#475569',
              fontSize: '12px',
              textTransform: 'uppercase'
            }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {prescriptions.map((prescription) => (
            <tr key={prescription.id} style={{
              borderBottom: '1px solid #E2E8F0',
              opacity: prescription.status === 'cancelled' ? 0.6 : 1
            }}>
              <td style={{ padding: '12px 16px', color: '#0F172A' }}>
                <div>
                  <div style={{ fontWeight: '500' }}>
                    {prescription.patient_name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    {formatDate(prescription.consultation_date)}
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px 16px', color: '#0F172A' }}>
                <div>
                  <div style={{ fontWeight: '500' }}>
                    {prescription.medication}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    {prescription.diagnosis}
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px 16px', color: '#0F172A' }}>
                <div>
                  <div>{prescription.dosage}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    {prescription.frequency} · Qty: {prescription.quantity}
                    {prescription.dispensed_quantity > 0 && (
                      <span style={{ color: '#2563EB' }}>
                        {' '}({prescription.dispensed_quantity} dispensed)
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px 16px', color: '#0F172A' }}>
                {prescription.doctor_name}
              </td>
              <td style={{ padding: '12px 16px' }}>
                {getStatusBadgeText(prescription.status)}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['pending', 'partially_dispensed'].includes(prescription.status) && (
                    <button
                      onClick={() => handleDispenseClick(prescription)}
                      style={{
                        padding: '6px 14px',
                        background: prescription.status === 'partially_dispensed' ? '#2563EB' : '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'background 0.2s'
                      }}
                    >
                      {prescription.status === 'partially_dispensed' ? '📦 Dispense More' : '💊 Dispense'}
                    </button>
                  )}

                  {['pending', 'partially_dispensed'].includes(prescription.status) && (
                    <button
                      onClick={() => handleCancelClick(prescription)}
                      style={{
                        padding: '6px 14px',
                        background: '#DC2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🚫 Cancel
                    </button>
                  )}

                  <button
                    onClick={() => handleHistoryClick(prescription)}
                    style={{
                      padding: '6px 14px',
                      background: '#6B7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    📋 History
                  </button>
                    <button
                      onClick={() => handleDeletePrescription(prescription.id, prescription.medication)}
                      style={{
                        padding: "6px 14px",
                        background: "#EF4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      🗑️ Delete
                    </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        color: '#475569',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div>Loading pharmacy data...</div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      background: '#F8FAFC',
      minHeight: '100vh'
    }}>
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#0F172A',
            margin: 0
          }}>
            💊 Pharmacy
          </h1>
          <p style={{
            color: '#475569',
            marginTop: '4px'
          }}>
            Manage prescriptions and dispensing
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{
            padding: '8px 16px',
            background: '#E2E8F0',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {renderStats()}
      {renderFilters()}

      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        {renderTable()}
      </div>

      <DispenseModal
        prescription={selectedPrescription}
        isOpen={showDispenseModal}
        onClose={() => {
          setShowDispenseModal(false);
          setSelectedPrescription(null);
        }}
        onConfirm={handleDispenseConfirm}
        loading={modalLoading}
      />

      <CancelModal
        prescription={selectedPrescription}
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedPrescription(null);
        }}
        onConfirm={handleCancelConfirm}
        loading={modalLoading}
      />

      <HistoryModal
        prescription={selectedPrescription}
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedPrescription(null);
        }}
      />
    </div>
  );
}


