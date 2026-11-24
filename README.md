# 🏥 CLINIC-EMR-SYSTEM

> Empowering clinics to transition from manual paperwork to intelligent digital healthcare management through secure, efficient, and scalable Electronic Medical Records.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-56%25-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

## 📖 Overview

The **CLINIC-EMR-SYSTEM** is a comprehensive, full-stack Electronic Medical Record platform built to modernize clinical operations. It features a multi-tenant architecture allowing a Super Admin to oversee multiple clinics, while clinic staff manage daily operations. It combines secure patient data management, real-time monitoring, and AI-driven clinical tools to enhance healthcare delivery.

## ✨ Key Features

*   **Multi-Tenant Architecture:** Dedicated Super Admin dashboard to create clinics, monitor system health, and track subscription payments/analytics.
*   **Comprehensive Patient Management:** Register patients, view detailed medical records, track encounters, and print/download medical reports.
*   **Clinical Workflows:** Manage appointments, referrals, lab orders, pharmacy inventory, and consultations from a unified dashboard.
*   **AI-Powered Integrations:** Integrated with **OpenAI** for intelligent assistance and **ElevenLabs** for text-to-speech/voice capabilities.
*   **Real-Time Updates:** Utilizes **Socket.io** for live notifications, dashboard metrics, and system status monitoring.
*   **Progressive Web App (PWA):** Offline-capable frontend with install prompts and background caching via `next-pwa` and Workbox.
*   **Advanced Security & Auth:** JWT-based authentication, Bcrypt password hashing, Google OAuth (Passport), and Helmet.js for HTTP header security.
*   **Data Export & Reporting:** Client-side PDF generation (`jspdf`) and Excel exports (`xlsx`), plus server-side PDF rendering via Puppeteer.

## 🛠️ Tech Stack

**Frontend:**
*   **Framework:** Next.js 14 (App Router), React 18
*   **Styling:** Tailwind CSS, PostCSS
*   **State/Data:** Zustand, SWR, Axios
*   **UI/Charts:** Lucide React, Recharts
*   **Utils:** Socket.io-client, next-pwa, XLSX, jsPDF

**Backend & Database:**
*   **Runtime/Framework:** Node.js, Express
*   **Database:** PostgreSQL 15
*   **ORM/Migrations:** Knex.js
*   **Security:** Passport (Google OAuth), JSON Web Tokens (JWT), Bcrypt, Helmet, Express Rate Limit
*   **Communication:** Socket.io (Real-time), Nodemailer (Email)
*   **AI & Utilities:** OpenAI, ElevenLabs Node, Puppeteer

## 🏗️ Architecture & Project Structure

The application is fully dockerized and decoupled into three primary services.

```text
CLINIC-EMR-SYSTEM/
├── backend/               # Express.js REST API, Knex migrations, Socket.io server
│   ├── src/               # Controllers, routes, models, auth middleware
│   └── package.json
├── frontend/              # Next.js 14 App Router frontend (PWA enabled)
│   ├── src/app/           # Routes: /admin, /patients, /appointments, /lab-orders, etc.
│   ├── public/            # PWA icons, service workers (sw.js)
│   └── package.json
├── docker-compose.yml     # Orchestrates Postgres, Backend, and Frontend
└── README.md
