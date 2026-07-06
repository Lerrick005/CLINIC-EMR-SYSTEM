'use client';

import Link from 'next/link';

export default function RefundPage() {
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
        Refund & Cancellation Policy
      </h1>
      <p style={{ color: '#6B7280', marginBottom: '32px' }}>
        Last updated: July 4, 2026
      </p>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>1. Subscription Billing</h2>
        <p>
          {appName} operates on a subscription basis. Clinics are billed monthly or annually based on the plan selected. 
          All fees are payable in advance and are non-refundable except as stated in this policy.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>2. Free Trial</h2>
        <p>
          New clinics may be offered a free trial period. No charges are made during the trial. 
          At the end of the trial, the clinic must subscribe to a paid plan to continue using the Service.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>3. Refund Eligibility</h2>
        <p>Refunds may be issued in the following circumstances:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Service Downtime:</strong> If the Service is unavailable for more than 48 consecutive hours due to our fault</li>
          <li><strong>Billing Error:</strong> Duplicate or incorrect charges</li>
          <li><strong>30-Day Guarantee:</strong> New subscribers may request a full refund within 30 days if unsatisfied</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>4. Non-Refundable Items</h2>
        <p>The following are not eligible for refund:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Partial months of service</li>
          <li>Setup or onboarding fees</li>
          <li>Data migration services</li>
          <li>Custom development work</li>
          <li>Accounts terminated for violation of Terms of Service</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>5. Cancellation</h2>
        <p>
          Clinics may cancel their subscription at any time. Cancellation takes effect at the end of the current 
          billing period. Data will be retained for 30 days after cancellation, after which it may be permanently 
          deleted. Clinics may request a data export before deletion.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>6. How to Request a Refund</h2>
        <p>
          To request a refund, contact us at{' '}
          <a href="mailto:billing@clinics.co.ke" style={{ color: '#2563EB' }}>billing@clinics.co.ke</a> with your 
          clinic name and reason for the refund. Requests are reviewed within 5 business days.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>7. Payment Methods</h2>
        <p>
          We accept payments via M-Pesa, bank transfer, and major credit cards. All payments are processed in 
          Kenyan Shillings (KES).
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