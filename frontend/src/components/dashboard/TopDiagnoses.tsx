'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Diagnosis } from '@/types/dashboard';
import styles from './TopDiagnoses.module.css';

interface TopDiagnosesProps {
  data: Diagnosis[];
}

export function TopDiagnoses({ data }: TopDiagnosesProps) {
  const router = useRouter();
  const colors = ['#DC2626', '#F97316', '#F59E0B', '#10B981', '#3B82F6'];
  const medals = ['🥇', '🥈', '🥉'];
  const maxCount = data[0]?.count || 1;

  if (data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>🏆 Top Diagnoses</h3>
          <button className={styles.viewAllBtn} onClick={() => router.push('/diagnoses')}>
            View All <ArrowRight size={14} />
          </button>
        </div>
        <div className={styles.empty}>
          <AlertCircle size={48} />
          <h4>No diagnoses recorded</h4>
          <p>Complete consultations to see trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>🏆 Top Diagnoses</h3>
        <button className={styles.viewAllBtn} onClick={() => router.push('/diagnoses')}>
          View All <ArrowRight size={14} />
        </button>
      </div>

      <div className={styles.list}>
        {data.map((diag, idx) => {
          const percentage = (diag.count / maxCount) * 100;
          return (
            <div key={idx} className={styles.item}>
              <div className={styles.rank}>
                {idx < 3 ? <span>{medals[idx]}</span> : <span className={styles.number}>{idx + 1}</span>}
              </div>
              <div className={styles.info}>
                <div className={styles.row}>
                  <span className={styles.name}>{diag.diagnosis}</span>
                  <span className={styles.count}>{diag.count} cases</span>
                </div>
                <div className={styles.bar}>
                  <div className={styles.fill} style={{ width: `${percentage}%`, background: colors[idx % colors.length] }} />
                </div>
                <div className={styles.footer}>
                  <span>{Math.round(percentage)}% of top cases</span>
                  {idx === 0 && <span className={styles.badge}>📈 Most common</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
