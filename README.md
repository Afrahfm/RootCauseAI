# RootCauseAI
RootCauseAI – Winner of Hexaware AI Innovation League 2026. An AI agent that acts as a "Problem Detective" – saving companies millions by identifying what they actually need vs what they ask for. Full-stack production-ready demo.
# 🎯 RootCauseAI

### Stop building the wrong thing. Start finding the right one.

[![Hackathon](https://img.shields.io/badge/Hexaware-AI%20Innovation%20League%202026-blue)](https://github.com)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan)](https://tailwindcss.com)

---

## 📌 Live Demo

> 🔗 **Deployed URL:** [https://rootcauseai.vercel.app](https://rootcauseai.vercel.app) *(Replace with your actual deployed link)*

**Demo Credentials:**
| Type | Email/ID | Password |
|:-----|:---------|:---------|
| Demo Account | `demo` | `demo123` |
| OR Sign up with | Google Account | - |

---

## 🚀 The Problem We Solve

**Companies waste 60-80% of their IT budget building solutions for misdiagnosed problems.**

- A bank asks for a **$500,000 AI chatbot** → They actually need a **$5,000 tracking button**
- A hospital asks for a **$300,000 AI scheduler** → They actually need **$500 SMS reminders**
- An e-commerce company asks for **$200,000 churn prediction** → They actually need a **simpler checkout**

**RootCauseAI solves this by being a "Problem Detective"** – it uncovers the hidden root cause behind every client request before you write a single line of code.

---

## ✨ Features

| Feature | Description |
|:--------|:------------|
| 🤖 **AI-Powered Analysis** | Detects hidden problems using Google Gemini AI |
| 🔐 **Google OAuth Login** | Sign in with your real Google account |
| 👤 **User Profiles** | Edit name, email, view member since |
| ⚙️ **Settings** | Dark/Light/System theme, notifications, export data |
| 💰 **Cost Savings Calculator** | Shows exactly how much you save by building the right solution |
| 📜 **Analysis History** | All past analyses saved in PostgreSQL |
| 🎨 **Glassmorphism UI** | Modern, premium design with smooth animations |
| 📱 **Responsive** | Works perfectly on desktop, tablet, and mobile |

---

## 🛠️ Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express, JWT, bcrypt |
| **Database** | PostgreSQL (Neon / Docker) |
| **Authentication** | Google OAuth 2.0, JWT |
| **AI Engine** | Google Gemini API |
| **Deployment** | Docker, Vercel (frontend), Render (backend) |

---

## 📁 Project Structure
rootcauseai/
├── client/ # React frontend
│ ├── src/
│ │ ├── pages/ # Login, Signup, Dashboard, Profile, Settings
│ │ ├── components/ # Navbar, Sidebar, LoadingSpinner
│ │ ├── context/ # AuthContext, ThemeContext
│ │ └── App.jsx
│ ├── .env # Frontend env vars
│ └── package.json
├── backend/ # Node.js backend
│ ├── routes/ # API routes (auth, analyze, user)
│ ├── services/ # AI service, email service
│ ├── middleware/ # Auth, validation, rate limiting
│ ├── db/ # Database connection
│ ├── .env # Backend env vars
│ └── package.json
├── docker-compose.yml # PostgreSQL container
└── README.md


---

## 🚀 Quick Start (Run Locally)

### Prerequisites

- Node.js (v18+)
- PostgreSQL (or Docker)
- Google OAuth Client ID ([Get one here](https://console.cloud.google.com))
- Google Gemini API Key ([Get one here](https://aistudio.google.com))


*AI reveals hidden problem, wrong solution, right solution, and savings*

### Analysis History
![Analysis History](./screenshots/history.png)
*View all past analyses*

### Profile Page
![Profile Page](./screenshots/profile.png)
*Edit your profile information*

### Settings Page
![Settings Page](./screenshots/settings.png)
*Theme, notifications, data export*

### Hamburger Menu (Sidebar)
![Sidebar Menu](./screenshots/sidebar.png)
*Navigate between Profile, Settings, and Logout*

---

## 📖 How to Use RootCauseAI

### For Demo Users (Quick Start)

| Step | Action |
|:-----|:-------|
| **1** | Go to the deployed URL or `http://localhost:5173` |
| **2** | Click **"Enter"** on the Welcome page |
| **3** | Use `demo` / `demo123` to login OR click **"Continue with Google"** |
| **4** | On the Dashboard, type a client problem in the input box |
| **5** | Click **"Find REAL Problem"** |
| **6** | View the AI analysis: hidden cause, wrong solution, right solution, savings |
| **7** | Check your **Analysis History** table below |
| **8** | Click **☰ (hamburger menu)** to access Profile and Settings |

### For First-Time Users (Sign Up)

| Step | Action |
|:-----|:-------|
| **1** | Click **"Sign Up"** tab on the login page |
| **2** | Enter: Full Name, Email, Password, Confirm Password |
| **3** | Click **"Sign Up"** |
| **4** | You will be automatically logged in |
| **5** | Start analyzing problems! |

### For Google OAuth Users

| Step | Action |
|:-----|:-------|
| **1** | Click **"Continue with Google"** button |
| **2** | Select your Google account from the popup |
| **3** | Grant the requested permissions |
| **4** | You will be automatically logged in with your real name and profile picture |
