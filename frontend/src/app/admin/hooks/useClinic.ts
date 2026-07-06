'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface ClinicInfo {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  mflCode: string;
  county: string;
  subcounty: string;
  ward: string;
  consultationFee: number;
  currency: string;
}

export function useClinic() {
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>({
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
    clinicEmail: '',
    mflCode: '',
    county: '',
    subcounty: '',
    ward: '',
    consultationFee: 0,
    currency: 'KES'
  });
  const [saving, setSaving] = useState(false);

  const loadClinicSettings = useCallback(async () => {
    try {
      const res = await api.get('/config/clinic');
      if (res.data.success && res.data.config) {
        setClinicInfo({
          clinicName: res.data.config.clinicName || '',
          clinicAddress: res.data.config.clinicAddress || '',
          clinicPhone: res.data.config.clinicPhone || '',
          clinicEmail: res.data.config.clinicEmail || '',
          mflCode: res.data.config.mflCode || '',
          county: res.data.config.county || '',
          subcounty: res.data.config.subcounty || '',
          ward: res.data.config.ward || '',
          consultationFee: res.data.config.consultationFee || 0,
          currency: res.data.config.currency || 'KES'
        });
      }
    } catch (error) {
      console.error('Error loading clinic settings:', error);
    }
  }, []);

  const saveClinicSettings = async () => {
    setSaving(true);
    try {
      await api.put('/config/clinic', clinicInfo);
      alert('Clinic settings saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadClinicSettings();
  }, [loadClinicSettings]);

  return { clinicInfo, setClinicInfo, saving, saveClinicSettings };
}
