
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';

interface Patient {
  id: string;
  medical_no: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchPatient();
  }, []);

  const fetchPatient = async () => {
    try {
      const res = await api.get(`/patients/${params?.id}`);
      if (res.data.success) {
        const p = res.data.patient;
        setPatient(p);
        setFormData({
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          date_of_birth: p.date_of_birth || '',
          gender: p.gender || '',
          phone: p.phone || '',
          email: p.email || '',
          address: p.address || ''
        });
      } else {
        setError('Patient not found');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load patient');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.put(`/patients/${params?.id}`, formData);
      setIsEditing(false);
      fetchPatient();
      alert('Patient updated');
    } catch (err: any) {
      alert('Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;
  if (error) return <div style={{ padding: '24px', color: 'red' }}>{error}</div>;
  if (!patient) return <div style={{ padding: '24px' }}>Patient not found</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <button onClick={() => router.back()} style={{ color: '#2563eb', marginRight: '16px' }}>← Back</button>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'inline' }}>Patient Details</h1>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} style={{ background: '#2563eb', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '8px' }}>Edit</button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setIsEditing(false)} style={{ background: '#9ca3af', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '8px' }}>Cancel</button>
            <button onClick={handleUpdate} style={{ background: '#10b981', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '8px' }}>Save</button>
          </div>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div><strong>Medical No:</strong> {patient.medical_no}</div>
          <div><strong>Status:</strong> {patient.is_active ? 'Active' : 'Inactive'}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div><strong>First Name</strong><br />{isEditing ? <input type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px' }} /> : <div>{patient.first_name}</div>}</div>
          <div><strong>Last Name</strong><br />{isEditing ? <input type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px' }} /> : <div>{patient.last_name}</div>}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div><strong>Date of Birth</strong><br />{isEditing ? <input type="date" value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px' }} /> : <div>{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</div>}</div>
          <div><strong>Gender</strong><br />{isEditing ? <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px' }}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select> : <div>{patient.gender || '—'}</div>}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div><strong>Phone</strong><br />{isEditing ? <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px' }} /> : <div>{patient.phone || '—'}</div>}</div>
          <div><strong>Email</strong><br />{isEditing ? <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px' }} /> : <div>{patient.email || '—'}</div>}</div>
        </div>
        <div style={{ marginTop: '16px' }}><strong>Address</strong><br />{isEditing ? <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={2} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px' }} /> : <div>{patient.address || '—'}</div>}</div>
      </div>
    </div>
  );
}
