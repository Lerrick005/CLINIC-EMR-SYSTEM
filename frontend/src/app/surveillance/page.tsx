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

export default function DiseaseSurveillancePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('adults');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [diseaseCounts, setDiseaseCounts] = useState({});
  const [lastSynced, setLastSynced] = useState('');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2026; year <= currentYear + 50; year++) {
      years.push(year);
    }
    return years;
  };

  const getCurrentDiseases = () => {
    return activeTab === 'adults' ? adultDiseases : childrenDiseases;
  };

  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  };

  const initializeEmptyData = () => {
    const diseases = getCurrentDiseases();
    const days = getDaysInMonth();
    const emptyData = {};
    for (const disease of diseases) {
      emptyData[disease] = {};
      for (let day = 1; day <= days; day++) {
        emptyData[disease][day] = 0;
      }
    }
    setDiseaseCounts(emptyData);
  };

  const handleAutoSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(API_BASE_URL + '/disease-surveillance/auto-sync', {
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
        const newCounts = JSON.parse(JSON.stringify(diseaseCounts));
        const autoData = activeTab === 'adults' ? data.adults : data.children;

        const diseases = getCurrentDiseases();
        const days = getDaysInMonth();
        for (const disease of diseases) {
          for (let day = 1; day <= days; day++) {
            if (newCounts[disease]) {
              newCounts[disease][day] = 0;
            }
          }
        }

        for (const dateStr in autoData) {
          const day = parseInt(dateStr.split('-')[2]);
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

  const loadSurveillanceData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const url = API_BASE_URL + '/disease-surveillance/data?month=' + monthNames[selectedMonth] + '&year=' + selectedYear + '&ageGroup=' + (activeTab === 'adults' ? 'ADULT' : 'CHILD');
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        const newCounts = JSON.parse(JSON.stringify(diseaseCounts));
        const diseases = getCurrentDiseases();
        const days = getDaysInMonth();

        for (const disease of diseases) {
          if (!newCounts[disease]) {
            newCounts[disease] = {};
          }
          for (let day = 1; day <= days; day++) {
            newCounts[disease][day] = 0;
          }
        }

        data.data.forEach(function(record) {
          const day = new Date(record.diagnosis_date).getDate();
          const diseaseName = record.disease_name;
          if (newCounts[diseaseName]) {
            newCounts[diseaseName][day] = (newCounts[diseaseName][day] || 0) + 1;
          }
        });

        setDiseaseCounts(newCounts);
        console.log('Loaded surveillance data:', data.data.length, 'records');
      }
    } catch (error) {
      console.error('Error loading surveillance data:', error);
    }
  };

  const handleCountChange = function(disease, day, value) {
    setDiseaseCounts(function(prev) {
      var newState = JSON.parse(JSON.stringify(prev));
      if (!newState[disease]) {
        newState[disease] = {};
      }
      newState[disease][day] = parseInt(value) || 0;
      return newState;
    });
  };

  useEffect(function() {
    initializeEmptyData();
    loadSurveillanceData();
  }, [selectedMonth, selectedYear, activeTab]);

  useEffect(function() {
    initializeEmptyData();
    loadSurveillanceData();
  }, []);

  var diseases = getCurrentDiseases();
  var days = getDaysInMonth();
  var dayNumbers = [];
  for (var i = 1; i <= days; i++) {
    dayNumbers.push(i);
  }
  var totalDiseases = diseases.length;
  var availableYears = getYears();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Disease Surveillance</h1>
        <p>KHIS Compliant Disease Entry System</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.selectGroup}>
          <select value={selectedMonth} onChange={function(e) { setSelectedMonth(parseInt(e.target.value)); }}>
            {monthNames.map(function(m, i) {
              return <option key={i} value={i}>{m}</option>;
            })}
          </select>
          <select value={selectedYear} onChange={function(e) { setSelectedYear(parseInt(e.target.value)); }}>
            {availableYears.map(function(y) {
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>

        <div className={styles.tabs}>
          <button
            className={activeTab === 'adults' ? styles.active : ''}
            onClick={function() { setActiveTab('adults'); }}
          >
            Adults ({adultDiseases.length})
          </button>
          <button
            className={activeTab === 'children' ? styles.active : ''}
            onClick={function() { setActiveTab('children'); }}
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
              {dayNumbers.map(function(day) {
                return <th key={day} className={styles.dayCol}>{day}</th>;
              })}
              <th className={styles.totalCol}>Total</th>
            </tr>
          </thead>
          <tbody>
            {diseases.map(function(disease) {
              var total = 0;
              for (var day = 1; day <= days; day++) {
                total += diseaseCounts[disease]?.[day] || 0;
              }
              var hasData = total > 0;
              return (
                <tr key={disease} className={hasData ? styles.hasData : ''}>
                  <td className={styles.diseaseCell}>{disease}</td>
                  {dayNumbers.map(function(day) {
                    var value = diseaseCounts[disease]?.[day] || 0;
                    return (
                      <td key={day} className={styles.dataCell}>
                        <input
                          type="number"
                          value={value}
                          onChange={function(e) { handleCountChange(disease, day, e.target.value); }}
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

