'use client';

import { Users, Stethoscope, FlaskRound, FileText } from 'lucide-react';
import { DashboardStats } from '@/types/dashboard';
import styles from './StatsCards.module.css';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { title: 'Total Patients', value: stats.patients.total, sub: `Active: ${stats.patients.active}`, icon: Users, color: '#FFD700' },
    { title: "Today's Visits", value: stats.consultations.today, sub: `Total: ${stats.consultations.total}`, icon: Stethoscope, color: '#3B82F6' },
    { title: 'Pending Labs', value: stats.labs.pending, sub: `Total: ${stats.labs.total}`, icon: FlaskRound, color: '#10B981' },
    { title: 'Active Referrals', value: stats.referrals.pending, sub: `Total: ${stats.referrals.total}`, icon: FileText, color: '#8B5CF6' },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card, index) => (
        <div key={index} className={styles.card}>
          <div className={styles.icon} style={{ background: `${card.color}15`, color: card.color }}>
            <card.icon size={24} />
          </div>
          <div className={styles.info}>
            <div className={styles.value}>{card.value}</div>
            <div className={styles.title}>{card.title}</div>
            <div className={styles.sub}>{card.sub}</div>
          </div>
          <div className={styles.glow} style={{ background: `linear-gradient(135deg, ${card.color}, transparent)` }}></div>
        </div>
      ))}
    </div>
  );
}
