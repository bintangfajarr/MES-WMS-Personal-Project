# 🌾 Smart Rice Milling MES & WMS System
### Enterprise Manufacturing Execution System & Warehouse Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0-green?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## 📌 Project Overview

**Smart Rice Milling MES & WMS** is an end-to-end industrial software solution built for rice processing plants (Rice Milling Units / RMU). It bridges real-time shop-floor operational data (**Manufacturing Execution System**) with inventory lifecycle management (**Warehouse Management System**) to ensure full product traceability, inventory accuracy, and maximum milling yield efficiency.

Designed for real-world enterprise operations, the system tracks raw paddy (*Gabah*) from supplier arrival, multi-stage milling & grading, packaging, FIFO-enforced warehouse storage, up to delivery dispatch.

---

## ✨ Key Features & Architecture

### 🏭 1. Manufacturing Execution System (MES)
* **Incoming Quality Control (QC):** Moisture level checking, impurity assessment, supplier lot generation (`LOT-YYYYMMDD-XXX`).
* **Multi-Stage Milling Workflow:**
  1. **Drying (Pengeringan):** Moisture reduction logging with temperature monitoring & loss tracking.
  2. **Husking (Penggilingan):** Hull removal tracking & husking yield calculation (brown rice vs. husk by-product).
  3. **Polishing (Penyosohan):** Bran removal level configuration (Premium vs. Medium grade output).
  4. **Color Sorting & Grading:** Separation of whole grains, broken grains (*menir*), and rejected grains.
  5. **Packaging:** Automated batch labeling (`BATCH-YYYYMMDD-XXX`), weight verification (±1% tolerance), and expiry computation (+6 months).
* **Yield & KPI Analytics:** Live monitoring of Overall Milling Yield (Target ≥62%), Husking Yield (≥78%), Polishing Yield (≥95%), and Machine OEE.

### 📦 2. Warehouse Management System (WMS)
* **Raw Material Warehouse (RM):** Variety segregation, moisture level monitoring, and long-standing storage alerts (>7 days).
* **Finished Goods Warehouse (FG):** Pallet slotting system (Rack-Row-Column placement e.g., `A-01-03`).
* **Strict FIFO Enforcement:** Automated batch picking suggestions based on earliest expiry date.
* **Stock Opname & Variance Control:** Variance detection with manager approval triggers for discrepancies >2%.
* **Dispatch & Delivery Orders:** Delivery Order (DO) management, dynamic PDF Surat Jalan generation via `@react-pdf/renderer`, and driver delivery confirmation.

### 🔐 3. Security & Role-Based Access Control (RBAC)
Supported User Roles:
- 👑 **ADMIN / Manager:** Full system access, Master Data setup, Work Order creation, and analytical reports.
- ⚙️ **OPR_PROD (Production Operator):** Work order execution, shop-floor metrics logging, QC entry.
- 🏬 **OPR_WHS (Warehouse Operator):** Inbound receiving, storage slotting, picking execution, stock opname.
- 🚚 **DRIVER:** Delivery route management & digital proof-of-delivery confirmation.

---

## 🛠️ Tech Stack

* **Frontend Framework:** Next.js 16 (App Router), React 19, TypeScript
* **Styling & UI:** Tailwind CSS v4, Shadcn UI, Lucide Icons, Sonner Notifications
* **State & Data Management:** TanStack React Query v5, Zustand
* **Database & ORM:** PostgreSQL / SQLite, Prisma ORM 6
* **Authentication:** NextAuth.js, Bcryptjs
* **Document Engine:** `@react-pdf/renderer` (PDF Invoice & Delivery Note generation)
* **Charts & Visualization:** Recharts

---

## 📂 Project Structure

```text
MES-WMS-Personal-Project/
├── DOC-01-business-process.md   # Complete business process specification
├── DOC-02-requirements.md       # Technical requirements & functional specs
├── DOC-03-technical.md          # Architecture, DB Schema & API documentation
├── DOC-04-checklist-task.md     # Development task tracker
└── mes-wms-beras/               # Next.js Application Source Code
    ├── app/                     # Next.js App Router (Pages & API Routes)
    ├── components/              # Reusable UI & Dashboard Components
    ├── lib/                     # Database client & helper utilities
    ├── prisma/                  # Database Schema & Seed scripts
    └── types/                   # TypeScript interfaces & types
```

---

## 🚀 Quick Start Guide

### Prerequisites
* Node.js v18+ 
* npm / pnpm / yarn

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/bintangfajarr/MES-WMS-Personal-Project.git
   cd MES-WMS-Personal-Project/mes-wms-beras
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file inside `mes-wms-beras/`:
   ```env
   DATABASE_URL="file:./dev.db" # Or your PostgreSQL URI
   NEXTAUTH_SECRET="your-super-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Initialize Database & Seed Data**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Author

**Bintang Fajar**  
* GitHub: [@bintangfajarr](https://github.com/bintangfajarr)  
* LinkedIn: [Bintang Fajar](https://linkedin.com/in/)  

---
*Developed as a full-stack enterprise showcase project for Smart Manufacturing & Supply Chain Systems.*