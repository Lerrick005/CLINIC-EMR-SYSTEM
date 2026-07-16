'use client';

import React, { useState, useEffect } from 'react';
import styles from './surveillance.module.css';

const adultDiseases = [
  "Diarrhoea", "DIARRHOEA", "Tuberculosis", "Dysentery (Blood Diarrhoea)", "Cholera",
  "Meningococcal Meningitis", "Other Meningitis", "Tetanus", "Poliomyelitis (AFP)",
  "Chicken Pox", "Measles", "Hepatitis", "Mumps", "Suspected Malaria", "Confirmed Malaria", "Malaria", "MALARIA",
  "Malaria in Pregnancy", "Amoebiasis", "Typhoid Fever", "Typhoid", "typhoid", "Sexually Transmitted Infection",
  "Urinary Tract Infection", "Bilharzia (Schistosomiasis)", "Intestinal Worms", "Malnutrition",
  "Anaemia", "Eye Infection/Condition", "Ear Infection/Conditions", "Upper Respiratory Tract Infection",
  "Asthma", "Pneumonia", "Other Lower Respiratory Tract Infection", "Abortion",
  "Disorders of Puerperium and Childbirth", "Hypertension", "Mental Disorders", "Dental Disorders",
  "Jiggers Infestation", "Diseases of the Skin", "Arthritis, Joint Pains etc", "Poisoning",
  "Road Traffic Injuries", "Deaths Due to Road Traffic Injuries", "Other Injuries", "Sexual Violence",
  "Violence Related Injuries", "Burns", "Snake Bites", "Dog Bites", "Other Bites", "Diabetes",
  "Epilepsy", "Brucellosis", "Cardiovascular Conditions", "Central Nervous System Disorders",
  "Overweight (BMI > 25)", "Musculoskeletal Conditions", "Fistula (Birth Related)",
  "Suspected Neoplasms/Cancers", "Physical Disability", "Trypanosomiasis", "Rift Valley Fever",
  "Yellow Fever", "Viral Hemorrhagic Fever", "Chikungunya", "Dengue Fever",
  "Leishmaniasis (Kala-azar)", "Cutaneous Leishmaniasis", "Suspected Anthrax", "All Other Diseases"
];

const childrenDiseases = [
  "Diarrhoea", "DIARRHOEA", "Cholera", "Dysentery (Blood Diarrhoea)", "Gastroenteritis",
  "Pneumonia", "Severe Pneumonia", "Upper Respiratory Tract Infections", "Lower Respiratory Tract Infections",
  "Asthma", "Presumed Tuberculosis", "Suspected Malaria", "Tested for Malaria", "Confirmed Malaria",
  "Measles", "Malnutrition", "Anaemia", "Diarrhoea with Dehydration", "Diarrhoea with Some Dehydration",
  "Diarrhoea with Severe Dehydration", "Ear Infection/Conditions", "Eye Infection/Condition",
  "Skin Disease", "Intestinal Worms", "Urinary Tract Infection", "Hypoxaemia", "Neonatal Sepsis",
  "Other Neonatal Conditions", "Birth asphyxia", "Low birth weight (< 2.5kg)", "Cerebral Palsy",
  "Downs Syndrome", "Autism", "Other Congenital Abnormalities", "Rickets", "Jiggers Infestation",
  "Meningococcal Meningitis", "Other Meningitis", "Tetanus", "Neonatal Tetanus", "Poliomyelitis (AFP)",
  "Chicken Pox", "Hepatitis", "Mumps", "Rubella", "Whooping Cough (Pertussis)", "Diphtheria",
  "Amoebiasis", "Typhoid Fever", "Typhoid", "typhoid", "Brucellosis", "Leishmaniasis (Kala-azar)", "Cutaneous Leishmaniasis",
  "Trypanosomiasis", "Bilharzia (Schistosomiasis)", "Hydatid Disease", "Rabies", "Anthrax",
  "Plague", "Relapsing Fever", "Scabies", "Ringworm", "Pediculosis", "Dental Disorders",
  "Eye Infections", "Ear Infections", "Poisoning", "Burns", "Fractures", "Other Injuries",
  "Road Traffic Injuries", "Dog Bites", "Snake Bites", "Other Bites", "Malaria in Pregnancy",
  "All Other Diseases"
];

interface DiseaseCounts {
  [disease: string]: {
    [day: number]: number;
  };
}

export default function DiseaseSurveillancePage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<string>('adults');
  const [loading, setLoading] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [diseaseCounts, setDiseaseCounts] = useState<DiseaseCounts>({});
  const [lastSynced, setLastSynced] = useState<string>('');

  const monthNames: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const getYears = (): number[] => {
    const currentYear: number = new Date().getFullYear();
    const years: number[] = [];
    for (let year: number = 2026; year <= currentYear + 50; year++) {
      years.push(year);
    }
    return years;
  };

  const getCurrentDiseases = (): string[] => {
    return activeTab === 'adults' ? adultDiseases : childrenDiseases;
  };

  const getDaysInMonth = (): number => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  };

  const initializeEmptyData = (): void => {
    const diseases: string[] = getCurrentDiseases();
    const days: number = getDaysInMonth();
    const emptyData: DiseaseCounts = {};
    for (const disease of diseases) {
      emptyData[disease] = {};
      for (let day: number = 1; day <= days; day++) {
        emptyData[disease][day] = 0;
      }
    }
    setDiseaseCounts(emptyData);
  };

  const handleAutoSync = async (): Promise<void> => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/disease-surveillance/auto-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          month: monthNames[selectedMonth],
          year: selectedYear.toString()
        })
      });

      const data = await response.json();
      if (data.success) {
        const newCounts: DiseaseCounts = JSON.parse(JSON.stringify(diseaseCounts));
        const autoData = activeTab === 'adults' ? data.adults : data.children;

        const diseases: string[] = getCurrentDiseases();
        const days: number = getDaysInMonth();
        for (const disease of diseases) {
          for (let day: number = 1; day <= days; day++) {
            if (newCounts[disease]) {
              newCounts[disease][day] = 0;
            }
          }
        }

        for (const dateStr in autoData) {
          const day: number = parseInt(dateStr.split('-')[2]);
          const diseasesData = autoData[dateStr];
          for (const diseaseName in diseasesData) {
            if (newCounts[diseaseName]) {
              newCounts[diseaseName][day] = diseasesData[diseaseName];
            }
          }
        }

        setDiseaseCounts(newCounts);
        setLastSynced(new Date().toLocaleTimeString());
        alert('Synced ' + data.totalConsultations + ' consultations!');
      } else {
        alert('No data found to sync');
      }
    } catch (error) {
      console.error('Auto-sync error:', error);
      alert('Failed to auto-sync');
    } finally {
      setSyncing(false);
    }
  };

  const loadSurveillanceData = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('accessToken');
      const url = `${API_BASE_URL}/disease-surveillance/data?month=${monthNames[selectedMonth]}&year=${selectedYear}&ageGroup=${activeTab === 'adults' ? 'ADULT' : 'CHILD'}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        const newCounts: DiseaseCounts = JSON.parse(JSON.stringify(diseaseCounts));
        const diseases: string[] = getCurrentDiseases();
        const days: number = getDaysInMonth();

        for (const disease of diseases) {
          if (!newCounts[disease]) {
            newCounts[disease] = {};
          }
          for (let day: number = 1; day <= days; day++) {
            newCounts[disease][day] = 0;
          }
        }

        data.data.forEach(function(record: any) {
          const day: number = new Date(record.diagnosis_date).getDate();
          const diseaseName: string = record.disease_name;
          if (newCounts[diseaseName]) {
            newCounts[diseaseName][day] = (newCounts[diseaseName][day] || 0) + 1;
          }
        });

        setDiseaseCounts(newCounts);
      }
    } catch (error) {
      console.error('Error loading surveillance data:', error);
    }
  };

  const handleCountChange = (disease: string, day: number, value: string): void => {
    setDiseaseCounts((prev: DiseaseCounts) => {
      const newState: DiseaseCounts = JSON.parse(JSON.stringify(prev));
      if (!newState[disease]) {
        newState[disease] = {};
      }
      newState[disease][day] = parseInt(value) || 0;
      return newState;
    });
  };

  useEffect(() => {
    initializeEmptyData();
    loadSurveillanceData();
  }, [selectedMonth, selectedYear, activeTab]);

  useEffect(() => {
    initializeEmptyData();
    loadSurveillanceData();
  }, []);

  const diseases: string[] = getCurrentDiseases();
  const days: number = getDaysInMonth();
  const dayNumbers: number[] = [];
  for (let i: number = 1; i <= days; i++) {
    dayNumbers.push(i);
  }
  const totalDiseases: number = diseases.length;
  const availableYears: number[] = getYears();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Disease Surveillance</h1>
        <p>KHIS Compliant Disease Entry System</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.selectGroup}>
          <select value={selectedMonth} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setSelectedMonth(parseInt(e.target.value)); }}>
            {monthNames.map((m: string, i: number) => {
              return <option key={i} value={i}>{m}</option>;
            })}
          </select>
          <select value={selectedYear} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setSelectedYear(parseInt(e.target.value)); }}>
            {availableYears.map((y: number) => {
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>

        <div className={styles.tabs}>
          <button
            className={activeTab === 'adults' ? styles.active : ''}
            onClick={() => { setActiveTab('adults'); }}
          >
            Adults ({adultDiseases.length})
          </button>
          <button
            className={activeTab === 'children' ? styles.active : ''}
            onClick={() => { setActiveTab('children'); }}
          >
            Children ({childrenDiseases.length})
          </button>
        </div>

        <div className={styles.actions}>
          <button onClick={handleAutoSync} disabled={syncing} className={styles.syncBtn}>
            {syncing ? 'Syncing...' : 'Auto-Sync'}
          </button>
          <button onClick={initializeEmptyData} className={styles.resetBtn}>
            Reset All
          </button>
        </div>
      </div>

      <div className={styles.infoBar}>
        <span>Total Diseases: <strong>{totalDiseases}</strong></span>
        <span>{monthNames[selectedMonth]} {selectedYear}</span>
        <span>Days: <strong>{days}</strong></span>
        {lastSynced && <span>Last synced: <strong>{lastSynced}</strong></span>}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.diseaseTable}>
          <thead>
            <tr>
              <th className={styles.diseaseCol}>Disease</th>
              {dayNumbers.map((day: number) => {
                return <th key={day} className={styles.dayCol}>{day}</th>;
              })}
              <th className={styles.totalCol}>Total</th>
            </tr>
          </thead>
          <tbody>
            {diseases.map((disease: string) => {
              let total: number = 0;
              for (let day: number = 1; day <= days; day++) {
                total += diseaseCounts[disease]?.[day] || 0;
              }
              const hasData: boolean = total > 0;
              return (
                <tr key={disease} className={hasData ? styles.hasData : ''}>
                  <td className={styles.diseaseCell}>{disease}</td>
                  {dayNumbers.map((day: number) => {
                    const value: number = diseaseCounts[disease]?.[day] || 0;
                    return (
                      <td key={day} className={styles.dataCell}>
                        <input
                          type="number"
                          value={value}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { handleCountChange(disease, day, e.target.value); }}
                          className={value > 0 ? styles.hasValue : ''}
                          min="0"
                        />
                      </td>
                    );
                  })}
                  <td className={styles.totalCell}>{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


