export interface DashboardStats {
  patients: { total: number; active: number };
  consultations: { today: number; total: number };
  labs: { pending: number; total: number; processing: number; completed: number };
  referrals: { pending: number; total: number };
}

export interface WeeklyData {
  date: string;
  count: number;
  fullDate: string;
}

export interface Diagnosis {
  diagnosis: string;
  count: number;
}
