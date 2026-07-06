# update-action-toolbar.ps1
Write-Host "🔧 Fixing ActionToolbar icons..." -ForegroundColor Yellow

$filePath = "frontend\src\components\Layout\ActionToolbar.tsx"

$newContent = @"
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './ActionToolbar.module.css';

export default function ActionToolbar() {
  const router = useRouter();

  const actions = [
    { label: 'Add Patient', icon: '➕', onClick: () => router.push('/patients/new'), color: '#FFD700', textColor: '#1A1A1A' },
    { label: 'New Consultation', icon: '📝', onClick: () => router.push('/consultations/new'), color: '#2563EB', textColor: 'white' },
    { label: 'Order Lab', icon: '🔬', onClick: () => router.push('/lab-orders/new'), color: '#10B981', textColor: 'white' },
    { label: 'Referral', icon: '📤', onClick: () => router.push('/referrals/new'), color: '#F97316', textColor: 'white' },
    { label: 'Print Report', icon: '🖨️', onClick: () => alert('Print feature coming soon'), color: '#8B5CF6', textColor: 'white' },
  ];

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarContainer}>
        <Link href="/dashboard" className={styles.logo}>
          <span className={styles.logoIcon}>🏥</span>
          <span className={styles.logoText}>CLINIC EMR</span>
        </Link>

        <div className={styles.actionGroup}>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={styles.actionBtn}
              style={{
                background: action.color,
                color: action.textColor
              }}
            >
              <span className={styles.btnIcon}>{action.icon}</span>
              <span className={styles.btnLabel}>{action.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.rightGroup}>
          <button
            className={styles.logoutBtn}
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}
"@

# Backup
Copy-Item $filePath "$filePath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "✅ Backup created" -ForegroundColor Green

# Save
Set-Content -Path $filePath -Value $newContent -Encoding utf8
Write-Host "✅ ActionToolbar icons fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Icons Updated:" -ForegroundColor Cyan
Write-Host "  ✅ Logo: 🏥" -ForegroundColor White
Write-Host "  ✅ Add Patient: ➕" -ForegroundColor White
Write-Host "  ✅ New Consultation: 📝" -ForegroundColor White
Write-Host "  ✅ Order Lab: 🔬" -ForegroundColor White
Write-Host "  ✅ Referral: 📤" -ForegroundColor White
Write-Host "  ✅ Print Report: 🖨️" -ForegroundColor White
Write-Host "  ✅ Logout: 🚪" -ForegroundColor White
