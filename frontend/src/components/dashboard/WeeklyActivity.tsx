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

export function WeeklyActivity({ data, maxCount, totalVisits, avgDaily, peakDay }: WeeklyActivityProps) {
  const router = useRouter();
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

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
