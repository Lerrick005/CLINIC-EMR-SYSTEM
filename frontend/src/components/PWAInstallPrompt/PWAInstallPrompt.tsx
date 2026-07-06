'use client';

import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import './PWAInstallPrompt.css';

export default function PWAInstallPrompt() {
  const { showPrompt, installApp, dismissBanner, isInstalled } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (showPrompt && !isInstalled) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 100);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [showPrompt, isInstalled]);

  const handleInstall = async () => {
    await installApp();
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleDismiss = () => {
    dismissBanner();
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`pwa-prompt-wrapper ${isAnimating ? 'slide-up' : ''}`}>
      <div className="pwa-prompt-card">
        <button className="pwa-close-btn" onClick={handleDismiss} aria-label="Close">
          ✕
        </button>

        <div className="pwa-prompt-content">
          <div className="pwa-logo">
            <span className="pwa-logo-icon">🏥</span>
          </div>

          <h3 className="pwa-title">Install EMR</h3>
          <p className="pwa-description">
            Get quick access to patient records, appointments, prescriptions, 
            laboratory results, referrals and reports.
          </p>

          <div className="pwa-buttons">
            <button className="pwa-install-btn" onClick={handleInstall}>
              📲 Install App
            </button>
            <button className="pwa-not-now-btn" onClick={handleDismiss}>
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}