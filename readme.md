# 🚀 Scalable URL Shortener

A **production-grade URL shortening service** designed with scalability, low latency, and reliability in mind.  
The system uses **Node.js, MongoDB, and Redis**, and is built around **cache-first redirects**, **distributed sliding-window rate limiting**, **JWT authentication**, **URL expiration**, and **asynchronous click analytics**.

This project is intentionally designed as a **system-design showcase**, demonstrating performance engineering and distributed backend patterns.

---

## 📌 Problem Statement

Design a URL shortening service that:
- Generates short, deterministic unique URLs using Base62 encoding
- Redirects users with **sub-10ms latency** on hot paths
- Scales horizontally under high read traffic
- Prevents abuse with cluster-wide sliding-window rate limiting
- Supports user authentication via JWT and authenticated URL management
- Enforces TTL-based URL expiration at runtime and database levels
- Aggregates click analytics asynchronously without degrading redirect throughput

---

## 🧠 High-Level Architecture

```
Client (Web / Mobile / API)
   │
   ▼
API Gateway / Server (Node.js + Express)
   ├── JWT Auth & User Management (bcrypt + jsonwebtoken)
   ├── Distributed Sliding-Window Rate Limiter (Redis ZSET + Lua Script)
   ├── Redirect Cache (Redis Cache-Aside Layer)
   └── Analytics Queue (Redis LPUSH Pipeline)
         │
         ├──► MongoDB (Persistent URL & User Store with TTL Indexes)
         │
         ▼
Analytics Worker (Background BRPOP Consumer Process)
   └── Updates MongoDB Click Counts Outside Critical Path
```

---

## 🔑 Key Design Goals

- **Fast redirects**: Redis-backed cache-aside layer eliminating database round-trips on critical redirect paths.
- **Sliding-window abuse prevention**: Distributed sliding-window rate limiter in Redis to avoid fixed-window boundary burst spikes across API clusters.
- **Stateless authentication**: JWT auth allowing horizontal scaling of API nodes without shared session storage.
- **Eventual consistency**: Click events enqueued to Redis and processed asynchronously by background workers.
- **Environment-agnostic deployment**: Fully containerized using Docker and Docker Compose.

---

## ✨ Features

### 1️⃣ URL Creation & Base62 Encoding
- Generates short codes using an atomic MongoDB sequence counter and **Base62 encoding** (`[0-9a-zA-Z]`).
- Supports optional **TTL expiration** (in seconds).
- Optional JWT authentication attaches created links to user accounts for dashboard tracking.
- Protected by cluster-wide distributed rate limiting.

**Endpoint**: `POST /api/v1/shorten`

---

### 2️⃣ Redirect Path (Hot Path) & Cache-Aside Layer
- Reads destination URL directly from **Redis cache**.
- Falls back to MongoDB only on cache misses, backfilling Redis with a 1-hour TTL.
- Enqueues click events asynchronously to Redis (`analytics:clicks`) using `LPUSH`.
- Performs HTTP 302 redirect immediately without blocking on database writes.

**Endpoint**: `GET /api/v1/:code`

---

### 3️⃣ Distributed Sliding-Window Rate Limiting
- Built directly on Redis using **Sorted Sets (`ZSET`)** and an atomic **Lua script**.
- Stores request timestamps as scores with unique member tokens (`now:seq`).
- On every request, atomically:
  1. Cleans old entries with `ZREMRANGEBYSCORE` (`now - windowMs`).
  2. Counts entries in the current sliding window with `ZCARD`.
  3. Rejects with `429 Too Many Requests` if the limit is exceeded.
  4. Records the request with `ZADD` and refreshes key TTL (`PEXPIRE`).
- **Why Sliding-Window over Fixed-Window?** Fixed-window limiters allow 2x burst traffic around boundary resets. The sliding-window log guarantees strict per-client request quotas across distributed API clusters.

---

### 4️⃣ JWT Authentication & Analytics Dashboard
- Secure user signup and login with **bcrypt password hashing** and signed **JSON Web Tokens (JWT)**.
- Authenticated endpoints:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
  - `GET /api/v1/user/urls` (fetches all URLs and live click stats for user)
- Interactive frontend dashboard to manage links and view live redirect metrics.

---

### 5️⃣ Dual-Layer URL Expiration (TTL)
- **Application Layer**: Runtime check on redirect (`expiresAt < new Date()`), returning `410 Gone` if expired.
- **Database Layer**: MongoDB TTL index (`expireAfterSeconds: 0`) for automatic background document cleanup.

---

### 6️⃣ Asynchronous Analytics Pipeline
- Redirects push click events to Redis list `analytics:clicks` via non-blocking `LPUSH`.
- Background worker process (`workers/analyticsWorker.js`) consumes events using blocking `BRPOP`.
- Batch/eventual increment of click counters in MongoDB outside the HTTP request-response cycle.

---

## 🧪 Load Testing (Autocannon)

Load tested using **Autocannon** after cache warm-up:

- **Concurrency**: 100 clients
- **Duration**: 20 seconds
- **Throughput**: **~12,000 requests/sec**
- **Latency**: **~7.8 ms average latency**, **~12 ms p99 latency**
- **Error Rate**: 0% failures (302 redirects)

---

## 🐳 Dockerized Deployment

The entire system is containerized using **Docker Compose**:

```yaml
services:
  api:
    build: .
    ports: ["3001:3001"]
  worker:
    build: .
    command: node workers/analyticsWorker.js
  mongo:
    image: mongo:7
  redis:
    image: redis:7
```

### Run the system
```bash
docker-compose up --build
```

---

## ⚖️ Design Trade-offs

| Decision | Rationale |
|---|---|
| **Redis vs In-Memory Cache** | In-memory cache breaks in multi-instance deployments; Redis provides shared state across clusters. |
| **Sliding-Window vs Fixed-Window** | Sliding window prevents boundary burst attacks across API cluster nodes. |
| **Stateless JWT vs Sessions** | Stateless JWT eliminates server-side session lookups, allowing independent API scaling. |
| **Async Analytics Queue** | Decouples redirect response time from database write latency. |
| **Base62 Counter vs UUID/Hash** | Produces short, predictable, collision-free URLs without truncation issues. |

---

## 🎯 Summary

This project demonstrates:
- High-throughput, low-latency backend architecture
- Strict separation between critical hot paths and asynchronous cold paths
- Cluster-aware rate limiting with Redis atomic scripts
- Production security practices with JWT and password hashing
