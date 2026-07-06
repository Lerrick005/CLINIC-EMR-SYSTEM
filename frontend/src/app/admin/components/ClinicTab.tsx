'use client';
import React from 'react';
import { useClinic } from '../hooks/useClinic';
import styles from '../admin.module.css';

export default function ClinicTab() {
  const { clinicInfo, setClinicInfo, saving, saveClinicSettings } = useClinic();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClinicInfo({ ...clinicInfo, [e.target.name]: e.target.value });
  };

  return (
    <div className={styles.section}>
      <h3>Clinic Information</h3>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>Clinic Name</label>
          <input name="clinicName" value={clinicInfo.clinicName} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label>MFL Code</label>
          <input name="mflCode" value={clinicInfo.mflCode} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label>County</label>
          <input name="county" value={clinicInfo.county} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label>Sub-county</label>
          <input name="subcounty" value={clinicInfo.subcounty} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label>Ward</label>
          <input name="ward" value={clinicInfo.ward} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label>Address</label>
          <input name="clinicAddress" value={clinicInfo.clinicAddress} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label>Phone</label>
          <input name="clinicPhone" value={clinicInfo.clinicPhone} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label>Email</label>
          <input name="clinicEmail" value={clinicInfo.clinicEmail} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label>Consultation Fee (KES)</label>
          <input type="number" name="consultationFee" value={clinicInfo.consultationFee} onChange={handleChange} />
        </div>
      </div>
      <button className={styles.saveBtn} onClick={saveClinicSettings} disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
