'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'CLINIC EMR';
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Clinic EMR Ltd';
  const currentYear = new Date().getFullYear();

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'system-ui, sans-serif',
      color: '#1F2937',
      lineHeight: '1.7'
    }}>
      <Link href="/login" style={{
        color: '#2563EB',
        textDecoration: 'none',
        fontSize: '14px',
        marginBottom: '20px',
        display: 'inline-block'
      }}>
        ← Back to Login
      </Link>

      <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
        Privacy Policy
      </h1>
      <p style={{ color: '#6B7280', marginBottom: '32px' }}>
        Last updated: July 4, 2026
      </p>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>1. Information We Collect</h2>
        <p>
          {appName} collects only information necessary to provide healthcare services:
        </p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Clinic Information:</strong> Name, address, MFL code, contact details</li>
          <li><strong>User Information:</strong> Names, email addresses, roles</li>
          <li><strong>Patient Data:</strong> Names, date of birth, gender, phone, medical records, diagnoses, prescriptions, lab results</li>
          <li><strong>Usage Data:</strong> Login timestamps, IP addresses, audit logs</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>2. How We Use Data</h2>
        <p>We use collected data to:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Provide and maintain the EMR service</li>
          <li>Authenticate users and secure accounts</li>
          <li>Generate health reports and analytics for clinics</li>
          <li>Comply with legal obligations under Kenya law</li>
          <li>Improve system performance and security</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>3. Data Storage & Security</h2>
        <p>
          All data is encrypted in transit (HTTPS) and at rest. Patient health data is classified as 
          &ldquo;sensitive personal data&rdquo; under the Kenya Data Protection Act, 2019. We implement 
          appropriate technical and organizational measures to protect your data.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>4. Data Sharing</h2>
        <p>We do NOT sell patient data. Data may only be shared:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Within the same clinic among authorized users</li>
          <li>With patient consent for referrals</li>
          <li>As required by Kenya law or court order</li>
          <li>With service providers who assist in hosting (bound by confidentiality)</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>5. Data Retention</h2>
        <p>
          Patient records are retained for the duration required by Kenya healthcare regulations 
          (minimum 7 years after last consultation). Inactive clinic data may be archived or deleted 
          upon written request.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>6. Your Rights</h2>
        <p>Under the Kenya Data Protection Act, you have the right to:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Access your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of data (subject to legal retention requirements)</li>
          <li>Withdraw consent for data processing</li>
          <li>Lodge a complaint with the Office of the Data Protection Commissioner (ODPC)</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>7. Cookies</h2>
        <p>
          We use essential cookies for authentication and session management. No tracking or advertising 
          cookies are used.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>8. Contact</h2>
        <p>
          For privacy concerns, contact our Data Protection Officer at:{' '}
          <a href="mailto:privacy@clinics.co.ke" style={{ color: '#2563EB' }}>privacy@clinics.co.ke</a>
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '40px 0' }} />

      <div style={{ textAlign: 'center', fontSize: '14px', color: '#6B7280' }}>
        <p>&copy; {currentYear} {companyName}. All rights reserved.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
          <Link href="/terms" style={{ color: '#6B7280' }}>Terms</Link>
          <Link href="/privacy" style={{ color: '#6B7280' }}>Privacy</Link>
          <Link href="/refund" style={{ color: '#6B7280' }}>Refund Policy</Link>
        </div>
      </div>
    </div>
  );
}
