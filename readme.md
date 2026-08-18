# 🚀 Scalable URL Shortener

A **production-grade URL shortening service** designed with scalability, low latency, and reliability in mind.  
The system uses **Node.js, MongoDB, and Redis**, and is built around **cache-first redirects**, **distributed rate limiting**, **URL expiration**, and **asynchronous analytics**.

This project is intentionally designed as a **system-design showcase**, not just a CRUD application.

---

## 📌 Problem Statement

Design a URL shortening service that:
- Generates short, unique URLs
- Redirects users with **very low latency**
- Scales under high read traffic
- Prevents abuse
- Supports URL expiration
- Tracks click analytics efficiently

---

## 🧠 High-Level Architecture

Client
↓
API Server (Node.js + Express)
├── Redis
│ ├── Redirect Cache
│ ├── Distributed Rate Limiting
│ └── Analytics Queue
└── MongoDB
└── Persistent URL Store (TTL-based expiration)
↑
Analytics Worker (Background Process)


---

## 🔑 Key Design Goals

- **Fast redirects** (Redis-backed, no DB writes on hot path)
- **Horizontal scalability**
- **Abuse prevention**
- **Eventual consistency** for analytics
- **Environment-agnostic deployment** (Dockerized)

---

## ✨ Features

### 1️⃣ URL Creation
- Generates short codes using **Base62 encoding**
- Stores mappings in MongoDB
- Protected by Redis-backed rate limiting

**Endpoint**
POST /api/v1/shorten


---

### 2️⃣ Redirect Path (Hot Path)
- Reads from Redis cache
- Falls back to MongoDB on cache miss
- Enqueues click event asynchronously
- Redirects immediately (no database writes)

**Endpoint**
GET /api/v1/:shortCode


📌 This keeps the redirect path extremely fast and scalable.

---

### 3️⃣ Caching Strategy (Cache-Aside)
- Redis stores `shortCode → longURL`
- Cache is populated on first access
- Subsequent requests hit Redis directly

**Why Redis?**
- In-memory speed
- Shared across instances
- Supports caching, rate limiting, and queues

---

### 4️⃣ URL Expiration
- Optional expiration time per URL
- Two-layer protection:
  - Runtime expiration validation
  - MongoDB TTL index for automatic cleanup

📌 MongoDB TTL cleanup is asynchronous, so expired URLs may return `404` after deletion.

---

### 5️⃣ Distributed Rate Limiting
- Implemented using `express-rate-limit` with Redis
- Enforces limits across multiple API instances
- Prevents abuse on URL creation endpoints

---

### 6️⃣ Asynchronous Analytics
- Redirects enqueue click events to Redis
- Background worker consumes events
- MongoDB updates happen outside the redirect hot path

📌 Ensures redirect latency is unaffected by analytics writes.

---

## 🧪 Load Testing

Load tested using **autocannon** after cache warm-up.

Concurrency: 100 clients
Duration: 20 seconds


### Results
- **~12,000 requests/sec**
- **~7.8 ms average latency**
- **~12 ms p99 latency**
- 0 failures (302 redirects counted as non-2xx)

📌 Confirms Redis-backed redirects and effective cache-aside design.

---

## 🐳 Dockerized Deployment

The entire system is containerized using **Docker Compose**.

### Services
- API Server
- Analytics Worker
- MongoDB
- Redis

### Run the system
```bash
docker-compose up --build
This starts all services with correct networking and configuration.

🔐 Configuration
All infrastructure details are injected via environment variables:

MONGO_URL=...
REDIS_URL=...
This allows seamless switching between:

Local development

Docker-based environments

Production (e.g., MongoDB Atlas)

⚖️ Design Trade-offs
Decision	Rationale
Redis vs in-memory cache	Required for horizontal scaling
Async analytics	Keeps redirect latency minimal
MongoDB TTL	Avoids manual cleanup jobs
Base62 counter	Simple, deterministic, URL-friendly
Cache-aside pattern	Explicit control over cache behavior
📈 Scalability Considerations
API servers can scale horizontally

Redis acts as shared state

MongoDB handles persistence only

Analytics worker can scale independently

Redirect hot path avoids database writes

🧩 Future Improvements
Authentication and per-user quotas

Custom aliases

Analytics dashboard

Bloom filter for faster existence checks

CDN in front of redirect endpoint

🎯 Summary
This project demonstrates:

Real-world system design principles

Performance-oriented backend architecture

Proper separation of hot and cold paths

Distributed systems thinking

It is designed not just to work, but to scale.