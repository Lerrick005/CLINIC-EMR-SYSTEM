import { useState, useEffect } from 'react';
import { DashboardStats, WeeklyData, Diagnosis } from '@/types/dashboard';

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    patients: { total: 0, active: 0 },
    consultations: { today: 0, total: 0 },
    labs: { pending: 0, total: 0, processing: 0, completed: 0 },
    referrals: { pending: 0, total: 0 }
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [topDiagnoses, setTopDiagnoses] = useState<Diagnosis[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [statsRes, weeklyRes, diagnosesRes] = await Promise.all([
        fetch('http://localhost:3001/api/dashboard/stats', { headers }),
        fetch('http://localhost:3001/api/consultations/stats/weekly', { headers }),
        fetch('http://localhost:3001/api/consultations/stats/top-diagnoses?limit=5', { headers })
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
        if (data.weeklyData) {
          setWeeklyData(orderDataFromMonday(data.weeklyData));
        }
      }

      if (diagnosesRes.ok) {
        const data = await diagnosesRes.json();
        if (data.diagnoses) {
          setTopDiagnoses(data.diagnoses);
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxCount = Math.max(...weeklyData.map(d => d.count), 1);
  const totalWeeklyVisits = weeklyData.reduce((sum, d) => sum + d.count, 0);
  const avgDailyVisits = (totalWeeklyVisits / 7).toFixed(1);
  const peakDay = weeklyData.reduce((peak, d) => d.count > peak.count ? d : peak, { count: 0, date: 'None', fullDate: 'None' });

  return { 
    loading, 
    stats, 
    weeklyData, 
    topDiagnoses,
    maxCount,
    totalWeeklyVisits,
    avgDailyVisits,
    peakDay
  };
}
