'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, Stethoscope, FlaskRound, FileText, Calendar,
  TrendingUp, ArrowRight, AlertCircle, ChevronRight
} from 'lucide-react';
import api from '../../lib/api';
import styles from './dashboard.module.css';

interface DashboardStats {
  patients: { total: number; active: number };
  consultations: { today: number; total: number };
  labs: { pending: number; total: number; processing: number; completed: number };
  referrals: { pending: number; total: number };
}

interface WeeklyData {
  date: string; count: number; fullDate: string;
}

interface Diagnosis {
  diagnosis: string; count: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    patients: { total: 0, active: 0 },
    consultations: { today: 0, total: 0 },
    labs: { pending: 0, total: 0, processing: 0, completed: 0 },
    referrals: { pending: 0, total: 0 }
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [topDiagnoses, setTopDiagnoses] = useState<Diagnosis[]>([]);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  useEffect(() => {
    const accessToken = searchParams?.get('accessToken');
    const refreshToken = searchParams?.get('refreshToken');
    const userId = searchParams?.get('userId');
    const existingToken = localStorage.getItem('accessToken');

    if (accessToken && refreshToken && userId && !existingToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userId);

      fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.user.role === 'SUPER_ADMIN') {
            window.location.href = '/super-admin';
            return;
          }
        }
      })
      .catch(err => console.error('Failed to fetch user:', err));

      window.history.replaceState({}, '', '/dashboard');
    }

    fetchDashboardData();
  }, [searchParams]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [statsRes, weeklyRes, diagnosesRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/stats`, { headers }),
        fetch(`${API_URL}/consultations/stats/weekly`, { headers }),
        fetch(`${API_URL}/consultations/stats/top-diagnoses?limit=5`, { headers })
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.success) {
          setStats({
            patients: data.patients || { total: 0, active: 0 },
            consultations: data.consultations || { today: 0, total: 0 },
            labs: data.labs || { pending: 0, total: 0, processing: 0, completed: 0 },
            referrals: data.referrals || { pending: 0, total: 0 }
          });
        }
      }

      if (weeklyRes.ok) {
        const data = await weeklyRes.json();
        if (data.weeklyData) setWeeklyData(orderDataFromMonday(data.weeklyData));
      }

      if (diagnosesRes.ok) {
        const data = await diagnosesRes.json();
        if (data.diagnoses) setTopDiagnoses(data.diagnoses);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const orderDataFromMonday = (data: any[]): WeeklyData[] => {
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap: Record<string, string> = {
      'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
      'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
    };
    return dayOrder.map(day => {
      const found = data.find(item => item.date === day);
      return found || { date: day, count: 0, fullDate: dayMap[day] };
    });
  };

  const maxCount = Math.max(...weeklyData.map(d => d.count), 1);
  const totalWeeklyVisits = weeklyData.reduce((sum, d) => sum + d.count, 0);
  const avgDailyVisits = (totalWeeklyVisits / 7).toFixed(1);
  const peakDay = weeklyData.reduce((peak, d) => d.count > peak.count ? d : peak, { count: 0, date: 'None', fullDate: 'None' });

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) return (
    <div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div><p>Loading dashboard...</p></div>
  );

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div><h1>Dashboard</h1><p>Welcome back! Here's your clinic overview</p></div>
        <div className={styles.date}><Calendar size={16} style={{ marginRight: '8px' }} />{formatDate()}</div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.blue}`}><div className={styles.statIcon}><Users size={24} /></div><div className={styles.statValue}>{stats.patients.total}</div><div className={styles.statTitle}>Total Patients</div><div className={styles.statSub}>Active: {stats.patients.active}</div></div>
        <div className={`${styles.statCard} ${styles.green}`}><div className={styles.statIcon}><Stethoscope size={24} /></div><div className={styles.statValue}>{stats.consultations.today}</div><div className={styles.statTitle}>Today's Visits</div><div className={styles.statSub}>Total: {stats.consultations.total}</div></div>
        <div className={`${styles.statCard} ${styles.amber}`}><div className={styles.statIcon}><FlaskRound size={24} /></div><div className={styles.statValue}>{stats.labs.pending}</div><div className={styles.statTitle}>Pending Labs</div><div className={styles.statSub}>Total: {stats.labs.total}</div></div>
        <div className={`${styles.statCard} ${styles.purple}`}><div className={styles.statIcon}><FileText size={24} /></div><div className={styles.statValue}>{stats.referrals.pending}</div><div className={styles.statTitle}>Active Referrals</div><div className={styles.statSub}>Total: {stats.referrals.total}</div></div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}><h3>Weekly Activity Trends</h3><button className={styles.viewAllBtn} onClick={() => router.push('/consultations')}>View All <ChevronRight size={14} /></button></div>
          <div className={styles.barsContainer}>
            <div className={styles.barsWrapper}>
              {weeklyData.map((day, idx) => {
                const height = day.count === 0 ? 8 : (day.count / maxCount) * 150;
                const isWeekend = day.date === 'Sat' || day.date === 'Sun';
                return (
                  <div key={idx} className={styles.barItem}>
                    <div className={styles.barDay}><span className={styles.dayName}>{day.date}</span><span className={styles.dayCount}>{day.count}</span></div>
                    <div className={styles.barWrapper} onMouseEnter={() => setHoveredBar(idx)} onMouseLeave={() => setHoveredBar(null)}>
                      <div className={`${styles.bar} ${isWeekend ? styles.weekend : ''}`} style={{ height: `${height}px` }}>
                        {hoveredBar === idx && day.count > 0 && <div className={styles.barTooltip}>{day.count} visit{day.count !== 1 ? 's' : ''}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={styles.weeklyStats}>
            <div className={styles.weeklyStat}><span className={styles.weeklyStatLabel}>Peak Day</span><span className={styles.weeklyStatValue}>{peakDay.fullDate}</span><span className={styles.weeklyStatChange}>↑ {peakDay.count} visits</span></div>
            <div className={styles.weeklyStat}><span className={styles.weeklyStatLabel}>This Week</span><span className={styles.weeklyStatValue}>{totalWeeklyVisits}</span><span className={styles.weeklyStatChange}>Total consultations</span></div>
            <div className={styles.weeklyStat}><span className={styles.weeklyStatLabel}>Daily Average</span><span className={styles.weeklyStatValue}>{avgDailyVisits}</span><span className={styles.weeklyStatChange}>per day</span></div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}><h3>Top Diagnoses</h3><button className={styles.viewAllBtn} onClick={() => router.push('/diagnoses')}>View All <ChevronRight size={14} /></button></div>
          {topDiagnoses.length === 0 ? (
            <div className={styles.emptyState}><AlertCircle size={48} style={{ color: '#94A3B8' }} /><h4>No diagnoses recorded</h4><p>Complete consultations to see diagnosis trends</p></div>
          ) : (
            <div className={styles.diagnosisList}>
              {topDiagnoses.map((diag, idx) => {
                const maxCount = topDiagnoses[0]?.count || 1;
                const percentage = (diag.count / maxCount) * 100;
                const colors = ['#2563EB', '#0D9488', '#7C3AED', '#D97706', '#DC2626'];
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={idx} className={styles.diagnosisItem}>
                    <div className={styles.diagnosisRank}>{idx < 3 ? medals[idx] : `#${idx + 1}`}</div>
                    <div className={styles.diagnosisInfo}>
                      <div className={styles.diagnosisHeader}><span className={styles.diagnosisName}>{diag.diagnosis}</span><span className={styles.diagnosisCount}>{diag.count} cases</span></div>
                      <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${percentage}%`, background: colors[idx % colors.length] }} /></div>
                      <div className={styles.diagnosisFooter}><span className={styles.diagnosisPercent}>{Math.round(percentage)}% of top cases</span>{idx === 0 && <span className={styles.trendingBadge}>📈 Most common</span>}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div><p>Loading...</p></div>}>
      <DashboardContent />
    </Suspense>
  );
}