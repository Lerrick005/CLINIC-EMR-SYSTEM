'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './TopNavbar.module.css';
import NotificationBell from '../Notifications/NotificationBell';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

const allNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Patients', href: '/patients', icon: '👥' },
  { name: 'Pharmacy', href: '/pharmacy', icon: '💊' },
  { name: 'Diagnoses', href: '/diagnoses', icon: '📋' },
  { name: 'Disease Entry', href: '/surveillance', icon: '📝' },
  { name: 'Disease Monitoring', href: '/monitoring', icon: '📈' },
  { name: 'Admin', href: '/admin', icon: '⚙️', adminOnly: true },
];

export default function TopNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>(allNavItems);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const isAdmin = user.role === 'CLINIC_ADMIN' || user.role === 'SUPER_ADMIN';
        if (!isAdmin) {
          setNavItems(allNavItems.filter(item => !item.adminOnly));
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <div className={styles.navLinks}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navName}>{item.name}</span>
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NotificationBell />
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}