# 🎨 ROVE

> **The collaborative whiteboard so fast, it defies the laws of network latency (and Zookeeper).**

[![Docker](https://img.shields.io/badge/Docker-Node%2020-blue?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Redis](https://img.shields.io/badge/Redis-Streams-DC382D?style=for-the-badge&logo=redis)](https://upstash.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render)](https://render.com/)

---

## 🤔 What is Rove?

Ever wanted to draw circles with your friends in real-time, but:
1. **Confluent Cloud** demanded your credit card? 💳
2. **Zookeeper** wanted your eternal soul just to start a message broker? 👹
3. **Your ISP** decided to block Atlas MongoDB SRV queries with a nasty `querySrv ECONNREFUSED` error? 🔌

Yes, us too. That's why we built **Rove**. 

Rove is a vector-sharp, collaborative, zero-latency whiteboard built on **card-free Upstash Redis Streams** instead of heavyweight Kafka. It is styled in a sleek, premium violet-indigo neon theme so you look like a cybersecurity hacker while drawing stick figures.

---

## 🛠️ The Tech Stack (Or, How We Saved Your Wallet)

* **🎨 Frontend (Vite + React + Framer Motion)**: Butter-smooth cursor wiggling, snapping guides, and connector lines. Refactored to be **100% free of hardcoded `localhost` strings** using a single central endpoint config file.
* **🚀 Backend (Express + Node 20 + Socket.io + Mongoose)**: Features a custom Zod-driven validator that automatically strips single and double quotes from pasted environment variables—because let's face it, copy-pasting is hard.
* **📡 Message Queue (Upstash Redis Streams)**: Real-time, localized, event-sourced collaborative **Undo/Redo** transactions durably logged to the `rove:whiteboard:commands` stream. Zero latency, zero cost, and zero credit card verifications.
* **🐳 Dockerization**: Custom production-ready Node 20 base container configured for optimal process signal handling. Upgraded to Node 20 to supply native global `crypto` support so Mongoose handshakes don't blow up.

---

## 🚀 How to Run the Masterpiece

### 1. Configure the Secrets 🤫
Create a `.env` file in the root workspace and paste the following (without the quotes, although our backend cleans them anyway because we care about you):

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://your_mongo_srv_uri
REDIS_URI=rediss://default:your_upstash_redis_uri
JWT_SECRET=your_super_secret_jwt_key_at_least_10_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_at_least_10_chars
```

### 2. Start the Backend Engine 🚂
```bash
cd backend
npm install
npm run dev
```
*The server will boot on port 5000, connect to MongoDB & Redis, and spin up the Event Sourcing consumer loop.*

### 3. Launch the Frontend Rocket 🚀
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` and start Roving!*

---

## 🧠 Fun Features Built-In

* **Render Wake-Up Ping**: The landing page immediately fires a silent background Axios ping (`GET /api/v1/health`) the millisecond it mounts to wake up Render's free-tier nodes before the user even clicks "Get Started". ☕
* **Infinite Whiteboard Mockup Loop**: A 12-second CSS/Framer Motion whiteboard loop wiggles cursors, snaps connector lines, and draws diagrams in a gorgeous premium mockup card in the hero section to wow first-time visitors. 🤩
* **Bulletproof Anti-Conflict Undo**: If your friend edits your masterpiece, Rove's sequence stream flags it and denies you the right to undo it until the conflict is resolved. Collaborative sanity maintained! 🛡️

---

*Made with 💜 and absolute zero Kafka headaches.*
