# 📊 Smart Expense Tracker (Mobile)

**SE2020 - Web and Mobile Technologies | Group Assignment**  
A full-stack mobile application for personal finance management.

---

## 🚀 Project Overview

This project is a comprehensive mobile solution designed to help users:
- Track their income
- Manage expenses
- Set savings goals
- Monitor recurring subscriptions  

It utilizes a modern full-stack architecture to ensure:
- Data security  
- Real-time updates  
- Seamless integration across multiple financial modules  

---

## 🛠 Tech Stack

We have chosen a high-performance, JavaScript-centric stack to ensure seamless integration between the mobile frontend and the cloud database.

---

## 📱 Frontend (Mobile)

- **Framework:** React Native (Expo)  
- **Navigation:** React Navigation (Tabs & Stacks)  
- **State Management:** Zustand (Global store for cross-module sync)  
- **UI Components:** React Native Paper (Material Design)  
- **Charts:** React Native Gifted Charts (Data visualization)  
- **API Client:** Axios (Connecting to hosted backend)  
- **Validation:** React Hook Form + Zod  

---

## ⚙️ Backend (Server)

- **Runtime:** Node.js  
- **Framework:** Express.js  
- **Authentication:** JWT (JSON Web Tokens) & Password Hashing (Bcrypt)  
- **File Handling:** Multer (For receipt/image uploads)  
- **Hosting:** Render / Railway (Live API Environment)  

---

## 🗄 Database

- **Database:** MongoDB Atlas (NoSQL Cloud Database)  
- **ORM:** Mongoose (Schema-based data modeling)  

---

## 📂 Team & Module Responsibility

As per the requirement for **Equal Workload Distribution**, each member is responsible for a full-stack module.

| Student | Module | Core CRUD Entity | Focus Area |
|--------|--------|-----------------|-----------|
| Member 1 (Lead) | Auth & Savings | SavingsGoal | JWT Auth, Config, Goal Tracking |
| Member 2 | Income | Income | Salary & Revenue Management |
| Member 3 | Expense | Expense | Daily Spending & Categories |
| Member 4 | Budgeting | Budget | Monthly Limits & Alerts |
| Member 5 | Subscriptions | Subscription | Recurring Bills & Image Upload |

---

## ⚙️ Core System Features

- **Secure Authentication:** User registration and login with encrypted passwords and protected routes.  
- **Real-time Dashboard:** Instant balance updates using reactive state management.  
- **Cloud Connectivity:** Fully hosted backend with no hardcoded local data.  
- **Visual Analytics:** Interactive charts for spending and income trends.  

---
