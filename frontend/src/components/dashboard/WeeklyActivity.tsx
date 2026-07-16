
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { WeeklyData } from '@/types/dashboard';
import styles from './WeeklyActivity.module.css';

interface WeeklyActivityProps {
  data: WeeklyData[];
  maxCount: number;
  totalVisits: number;
  avgDaily: string;
  peakDay: WeeklyData;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function WeeklyActivity({ data, maxCount, totalVisits, avgDaily, peakDay }: WeeklyActivityProps) {
  const router = useRouter();
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [topDiagnoses, setTopDiagnoses] = useState<any[]>([]);

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
        if (data.weeklyData) setWeeklyData(data.weeklyData);
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>📈 Weekly Activity Trends</h3>
        <button className={styles.viewAllBtn} onClick={() => router.push('/consultations')}>
          View All <ArrowRight size={14} />
        </button>
      </div>

      <div className={styles.barsContainer}>
        <div className={styles.barsWrapper}>
          {data.map((day, idx) => {
            const height = day.count === 0 ? 8 : (day.count / maxCount) * 180;
            const isWeekend = day.date === 'Sat' || day.date === 'Sun';
            return (
              <div key={idx} className={styles.barItem}>
                <div className={styles.barDay}>
                  <span className={styles.dayName}>{day.date}</span>
                  <span className={styles.dayCount}>{day.count}</span>
                </div>
                <div 
                  className={`${styles.barWrapper} ${hoveredBar === idx ? styles.hovered : ''}`}
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <div 
                    className={`${styles.bar} ${isWeekend ? styles.weekend : ''}`}
                    style={{ height: `${height}px` }}
                  >
                    {hoveredBar === idx && day.count > 0 && (
                      <div className={styles.tooltip}>{day.count} visit{day.count !== 1 ? 's' : ''}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.label}>Peak Day</span>
          <span className={styles.value}>{peakDay.fullDate}</span>
          <span className={styles.change}>↑ {peakDay.count} visits</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>This Week</span>
          <span className={styles.value}>{totalVisits}</span>
          <span className={styles.change}>Total consultations</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Daily Avg</span>
          <span className={styles.value}>{avgDaily}</span>
          <span className={styles.change}>per day</span>
        </div>
      </div>
    </div>
  );
}
