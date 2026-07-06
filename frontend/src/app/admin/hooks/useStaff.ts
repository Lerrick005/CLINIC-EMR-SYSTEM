'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface StaffMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export function useStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/staff');
      if (res.data.success) {
        setStaff(res.data.staff || []);
      } else {
        setError('Failed to load staff');
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Could not load staff');
    } finally {
      setLoading(false);
    }
  }, []);

  const addStaff = async (staffData: any) => {
    try {
      const res = await api.post('/staff', staffData);
      if (res.data.success) {
        await fetchStaff();
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Unknown error' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Error adding staff' };
    }
  };

  const deactivateStaff = async (id: string) => {
    try {
      await api.delete('/staff/' + id);
      await fetchStaff();
    } catch (error) {
      console.error('Error deactivating staff:', error);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  return { staff, loading, error, fetchStaff, addStaff, deactivateStaff };
}
