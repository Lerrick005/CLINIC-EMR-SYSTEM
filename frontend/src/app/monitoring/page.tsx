'use client';

import React, { useState, useEffect } from 'react';
import styles from './monitoring.module.css';

interface Disease {
  name: string;
  count: number;
  time?: string;
  patientName?: string;
  age?: number;
  doctorName?: string;
}

interface DayData {
  day: number;
  totalCases: number;
  diseases: Disease[];
}

export default function DiseaseMonitoringPage() {
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [monthlyData, setMonthlyData] = useState<DayData[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<{ day: number; diseases: Disease[] } | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    };
  };

  useEffect(() => {
    fetchAvailableYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchMonthlyData();
    }
  }, [selectedYear, selectedMonth]);

  const fetchAvailableYears = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/disease-monitoring/available-years`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setAvailableYears(data.years || [new Date().getFullYear()]);
      }
    } catch (error) {
      console.error('Error fetching available years:', error);
      setAvailableYears([new Date().getFullYear()]);
    }
  };

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/disease-monitoring/monthly-summary?year=${selectedYear}&month=${selectedMonth + 1}`,
        { headers: getHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        setMonthlyData(data.days || []);
      } else {
        setMonthlyData([]);
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      setMonthlyData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDayDetails = async (day: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/disease-monitoring/day-details?year=${selectedYear}&month=${selectedMonth + 1}&day=${day}`,
        { headers: getHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedDayData({
          day,
          diseases: data.diseases || []
        });
        setShowDetails(true);
      } else {
        alert('Failed to load day details');
      }
    } catch (error) {
      console.error('Error fetching day details:', error);
      alert('Error loading day details');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    let csv = "Day,Diseases,Cases\n";
    monthlyData.forEach(day => {
      const diseasesList = day.diseases.map(d => `${d.name} (${d.count})`).join(', ');
      csv += `${day.day},"${diseasesList}",${day.totalCases}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disease_report_${months[selectedMonth]}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Report exported to CSV');
  };

  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth();
  const totalCases = monthlyData.reduce((sum, d) => sum + (d.totalCases || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📊 Disease Surveillance Dashboard</h1>
        <p>Track and monitor disease outbreaks by day</p>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <label>Year:</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Month:</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
            {months.map((month, idx) => (
              <option key={idx} value={idx}>{month}</option>
            ))}
          </select>
        </div>

        <button className={styles.exportBtn} onClick={exportToCSV}>
          📥 Export to CSV
        </button>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2>{months[selectedMonth]} {selectedYear}</h2>
          <span className={styles.totalBadge}>Total Cases: {totalCases}</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading data...</p>
          </div>
        ) : (
          <table className={styles.diseaseTable}>
            <thead>
              <tr>
                <th>Day</th>
                <th>Diseases</th>
                <th>Cases</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dayData = monthlyData.find(d => d.day === day);
                const hasData = dayData && dayData.totalCases > 0;

                return (
                  <tr key={day} className={hasData ? styles.hasData : ''}>
                    <td className={styles.dayCell}>
                      <span className={styles.dayNumber}>{day}</span>
                      <span className={styles.dayName}>
                        {new Date(selectedYear, selectedMonth, day).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </td>
                    <td className={styles.diseasesCell}>
                      {hasData ? (
                        <div className={styles.diseasesList}>
                          {dayData.diseases?.slice(0, 3).map((d, idx) => (
                            <span key={idx} className={styles.diseaseTag}>
                              {d.name} ({d.count})
                            </span>
                          ))}
                          {dayData.diseases?.length > 3 && (
                            <span className={styles.moreTag}>+{dayData.diseases.length - 3} more</span>
                          )}
                        </div>
                      ) : (
                        <span className={styles.noData}>—</span>
                      )}
                    </td>
                    <td className={styles.casesCell}>
                      {hasData ? (
                        <span className={styles.caseCount}>{dayData.totalCases}</span>
                      ) : (
                        <span className={styles.noData}>0</span>
                      )}
                    </td>
                    <td className={styles.actionCell}>
                      {hasData && (
                        <button className={styles.viewBtn} onClick={() => fetchDayDetails(day)}>
                          👁️ View Details
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showDetails && selectedDayData && (
        <div className={styles.modalOverlay} onClick={() => setShowDetails(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>📋 {months[selectedMonth]} {selectedDayData.day}, {selectedYear} - Diseases</h3>
              <button className={styles.closeModal} onClick={() => setShowDetails(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {selectedDayData.diseases.length === 0 ? (
                <div className={styles.emptyDetails}>
                  <p>No diseases recorded on this day</p>
                </div>
              ) : (
                <table className={styles.detailsTable}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Disease</th>
                      <th>Patient</th>
                      <th>Age</th>
                      <th>Doctor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDayData.diseases.map((disease, idx) => (
                      <tr key={idx}>
                        <td>{disease.time || '—'}</td>
                        <td><strong>{disease.name}</strong></td>
                        <td>{disease.patientName || '—'}</td>
                        <td>{disease.age || '—'}</td>
                        <td>{disease.doctorName || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.printBtn} onClick={() => window.print()}>
                🖨️ Print Details
              </button>
              <button className={styles.closeBtn} onClick={() => setShowDetails(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
