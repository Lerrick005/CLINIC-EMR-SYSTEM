'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import styles from '../super-admin.module.css';

interface Clinic {
  id: string;
  name: string;
  subscription_status: string;
  is_active: boolean;
  is_legacy: boolean;
  user_count: number;
  patient_count: number;
  created_at: string;
  county: string;
}

interface Props {
  clinics: Clinic[];
  onClose: () => void;
}

const COLORS = ['#7A1E2C', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function AnalyticsDashboard({ clinics, onClose }: Props) {
  const statusData = [
    { name: 'Paid', value: clinics.filter(c => c.subscription_status === 'PAID').length },
    { name: 'Trial', value: clinics.filter(c => c.subscription_status === 'TRIAL').length },
    { name: 'Legacy', value: clinics.filter(c => c.is_legacy).length },
    { name: 'Active', value: clinics.filter(c => c.subscription_status === 'ACTIVE').length },
    { name: 'Expired', value: clinics.filter(c => c.subscription_status === 'EXPIRED').length },
  ].filter(d => d.value > 0);

  const countyMap: Record<string, number> = {};
  clinics.forEach(c => {
    const county = c.county || 'Unknown';
    countyMap[county] = (countyMap[county] || 0) + 1;
  });
  const countyData = Object.entries(countyMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthMap: Record<string, number> = {};
  clinics.forEach(c => {
    const d = new Date(c.created_at);
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
    monthMap[key] = (monthMap[key] || 0) + 1;
  });
  const monthData = Object.entries(monthMap).map(([name, value]) => ({ name, value })).slice(-12);

  const clinicStats = clinics
    .map(c => ({ name: c.name.substring(0, 15), staff: c.user_count || 0, patients: c.patient_count || 0 }))
    .sort((a, b) => b.patients - a.patients)
    .slice(0, 10);

  const totalPatients = clinics.reduce((s, c) => s + (c.patient_count || 0), 0);
  const totalUsers = clinics.reduce((s, c) => s + (c.user_count || 0), 0);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px' }}>
        <div className={styles.modalHeader}>
          <h2>System Analytics</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {[{ label: 'Total Clinics', value: clinics.length, color: '#7A1E2C' }, { label: 'Total Patients', value: totalPatients, color: '#3b82f6' }, { label: 'Total Staff', value: totalUsers, color: '#10b981' }, { label: 'Active Clinics', value: clinics.filter(c => c.is_active).length, color: '#8b5cf6' }].map((k, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Clinic Status Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Clinics by County</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={countyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7A1E2C" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Monthly Clinic Registrations</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#7A1E2C" strokeWidth={2} dot={{ fill: '#7A1E2C', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Top 10 Clinics - Staff vs Patients</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clinicStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="patients" fill="#7A1E2C" name="Patients" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="staff" fill="#3b82f6" name="Staff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}