# MediGo - Smart Ambulance Management System

This repository contains the full-stack MediGo application, including the Admin Dashboard (React), the Backend API (NestJS), and the Driver Application (Flutter).

## Project Structure
- `/admin-dash`: React + Vite frontend for hospital administrators.
- `/server`: NestJS backend API with Firebase Admin SDK integration.
- `/driver_application`: Flutter mobile application for ambulance drivers.

---

## 🚀 Getting Started

To run this project locally, follow these steps:

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Firebase Project** (Realtime Database + Authentication)

### 2. Backend Setup (NestJS)
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Create a `.env` file in the `server/` root.
   - Add your `FIREBASE_DATABASE_URL`.
   - Place your `serviceAccountKey.json` in the `server/` root.
4. Start the server:
   ```bash
   npm run start:dev
   ```
   *The API will be available at http://localhost:3001*

### 3. Frontend Setup (React)
1. Navigate to the admin-dash directory:
   ```bash
   cd admin-dash
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Create a `.env` file with your Firebase Web Config and Google Maps API Key.
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The dashboard will be available at http://localhost:5173*

---

## 🔒 Security Note
Never commit `.env` files or `serviceAccountKey.json` to version control. These files are listed in `.gitignore` for your protection.
