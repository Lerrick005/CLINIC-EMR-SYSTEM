'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  specialty?: string;
  licenseNo?: string;
  email?: string;
  phone?: string;
  pin?: string;
}

export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get('/config/doctors');
      setDoctors(res.data.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  }, []);

  const addDoctor = async (doctorData: any) => {
    try {
      const res = await api.post('/config/doctors', doctorData);
      if (res.data.success) {
        await fetchDoctors();
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Unknown error' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Error adding doctor' };
    }
  };

  const deleteDoctor = async (doctorId: string) => {
    try {
      await api.delete('/config/doctors/' + doctorId);
      await fetchDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, fetchDoctors, addDoctor, deleteDoctor };
}
