'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SuperAdminIndicator() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const data = JSON.parse(user);
        if (data.role === 'SUPER_ADMIN') {
          setIsAdmin(true);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  if (!isAdmin) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 9999
    }}>
      <Link
        href="/super-admin"
        style={{
          color: '#94A3B8',
          textDecoration: 'none',
          fontSize: '12px',
          fontFamily: 'monospace',
          opacity: 0.4,
          transition: 'opacity 0.2s',
          background: 'rgba(255,255,255,0.5)',
          padding: '2px 8px',
          borderRadius: '4px'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
      >
        ⚙️ Admin
      </Link>
    </div>
  );
}
