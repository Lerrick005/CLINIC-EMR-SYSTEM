'use client';

import Link from 'next/link';

export default function TermsPage() {
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
        Terms of Service
      </h1>
      <p style={{ color: '#6B7280', marginBottom: '32px' }}>
        Last updated: July 4, 2026
      </p>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>1. Acceptance of Terms</h2>
        <p>
          By accessing or using {appName} (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. 
          If you do not agree, do not use the Service. {companyName} reserves the right to update these terms at any time.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>2. Description of Service</h2>
        <p>
          {appName} is a cloud-based Electronic Medical Records (EMR) system designed for clinics and healthcare providers. 
          The Service allows clinics to manage patients, consultations, prescriptions, laboratory orders, disease surveillance, 
          and related healthcare operations.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>3. User Accounts</h2>
        <p>
          Each clinic is provisioned by the Super Administrator. Clinic Administrators are responsible for creating and 
          managing user accounts within their clinic. You are responsible for maintaining the confidentiality of your 
          login credentials and for all activities under your account.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>4. Data Ownership & Privacy</h2>
        <p>
          Clinics retain full ownership of their patient data. {companyName} does not sell, share, or access patient 
          data except as required for technical support or as required by law. All data is handled in accordance with 
          our Privacy Policy and the Kenya Data Protection Act, 2019.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to access another clinic&apos;s data without authorization</li>
          <li>Upload malicious code or attempt to disrupt the Service</li>
          <li>Violate patient confidentiality or applicable healthcare laws</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>6. Limitation of Liability</h2>
        <p>
          {companyName} provides the Service &ldquo;as is&rdquo; without warranty. We are not liable for any damages 
          arising from the use of the Service. It is the clinic&apos;s responsibility to verify the accuracy of 
          medical records and maintain appropriate backups of critical data.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>7. Service Availability</h2>
        <p>
          We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance 
          will be communicated in advance when possible.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>8. Termination</h2>
        <p>
          {companyName} reserves the right to suspend or terminate access to the Service for violation of these 
          terms. Clinics may request data export before termination.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>9. Governing Law</h2>
        <p>
          These terms are governed by the laws of the Republic of Kenya. Any disputes shall be resolved in the 
          courts of Kenya.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>10. Contact</h2>
        <p>
          For questions about these Terms, contact us at:{' '}
          <a href="mailto:support@clinics.co.ke" style={{ color: '#2563EB' }}>support@clinics.co.ke</a>
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