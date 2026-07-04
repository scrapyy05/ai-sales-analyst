# AI Sales Analyst Backend

A Python FastAPI backend service that translates natural language questions into executable SQL queries to analyze relational sales data. Built with a focus on system reliability, predictable latency, and API security, the platform integrates LLM capabilities with traditional database engineering practices.

This project was developed to address common challenges in integrating LLMs with production databases: non-deterministic SQL generation, high inference latency, and data security risks. By pairing Google Gemini 1.5 Pro with deterministic SQLAlchemy ORM endpoints, Redis caching, per-user rate limiting, and an automated retry loop, the application provides an accurate and resilient analytical API.

---

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=flat-square&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-316192?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-5.0%2B-DC382D?style=flat-square&logo=redis&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0%2B-D71F00?style=flat-square)
![Gemini](https://img.shields.io/badge/Gemini-1.5%20Pro-8E75B2?style=flat-square&logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Key Highlights

- 🚀 **REST APIs** built with FastAPI
- 🤖 **Natural Language → SQL** using Gemini
- ⚡ **Redis Query Cache** (~2 ms cache hits)
- 🔒 **JWT Authentication** + RBAC
- 📊 **PostgreSQL** + SQLAlchemy ORM
- 📁 **CSV ETL Pipeline** with Pandas
- 🛡️ **SQL Injection Protection**
- 🔄 **Self-Healing SQL Retry Pipeline**
- 🚦 **Per-user Rate Limiting** via SlowAPI

---

## Features

- **Natural Language Query Engine**: Dynamic translation of conversational English into optimized PostgreSQL queries using Gemini 1.5 Pro.
- **Redis Query Cache**: In-memory caching of frequently requested queries to drop repeated response times down to ~2 ms.
- **Self-Healing SQL Pipeline**: Automated interception of PostgreSQL driver errors with a 3-turn feedback loop for query correction.
- **JWT Authentication**: Stateless API security using OAuth2 with Bearer tokens and password hashing via `bcrypt`.
- **RBAC**: Role-Based Access Control enforcing protected routes and ownership validation.
- **PostgreSQL**: Relational database schema handling users, customers, products, and sales transactions.
- **SQLAlchemy ORM**: Type-safe database interaction and pre-compiled analytical queries.
- **CSV Upload & ETL**: Bulk data ingestion endpoint with Pandas parsing, schema validation, and automated entity creation.
- **Business Analytics APIs**: High-speed, pre-compiled REST endpoints for standard business metrics.
- **Per-User Rate Limiting**: SlowAPI integration throttling endpoints based on authenticated JWT user IDs rather than IP addresses.

---

## Tech Stack

- **Backend Framework**: Python 3.10+, FastAPI, Uvicorn
- **Database & ORM**: PostgreSQL, SQLAlchemy 2.0, Alembic
- **Caching Layer**: Redis, `fakeredis`
- **AI Integration**: Google Generative AI (`google-genai` / Gemini 1.5 Pro)
- **Data Processing**: Pandas
- **Authentication & Security**: Pydantic v2, `python-jose`, `passlib[bcrypt]`, SlowAPI

---

## Project Structure

```text
ai_sales_analyst/
├── app/
│   ├── api/
│   │   ├── dependencies.py       # Authentication & database injection dependencies
│   │   └── routers/
│   │       ├── analytics.py      # Pre-compiled business analytics endpoints
│   │       ├── ask.py            # Natural Language Query Engine endpoint
│   │       ├── auth.py           # User registration and JWT login
│   │       ├── customers.py      # Customer management CRUD
│   │       ├── products.py       # Product catalog CRUD
│   │       ├── sales.py          # Sales transaction logging and mutation
│   │       └── upload.py         # Bulk CSV ingestion pipeline
│   ├── core/
│   │   ├── cache.py              # Redis Query Cache engine & TTL management
│   │   ├── config.py             # Environment settings & validation
│   │   ├── limiter.py            # SlowAPI rate limiter & JWT user extraction
│   │   └── security.py           # Cryptographic hashing & token encoding
│   ├── db/
│   │   └── database.py           # SQLAlchemy engine & session factory
│   ├── models/                   # Database tables (User, Customer, Product, Sale)
│   ├── schemas/                  # Pydantic request/response validation schemas
│   ├── services/
│   │   └── gemini_service.py     # Gemini LLM integration & retry wrapper
│   └── main.py                   # ASGI application entry point & middleware setup
├── alembic/                      # Database migration scripts
├── requirements.txt              # Project dependencies
└── README.md                     # Project documentation
```

---

## Architecture

The application follows a layered architecture that separates request handling, authentication, business logic, AI processing, and database access.

```mermaid
flowchart TB
    subgraph Client ["Client Layer"]
        UI["Swagger API / Client"]
    end

    subgraph Security ["Security Layer"]
        JWT["OAuth2 JWT Bearer Auth"]
        RBAC["Role-Based Access Control"]
    end

    subgraph Core ["FastAPI Application Engine"]
        CACHE["⚡ Redis Query Cache<br>(SHA-256 / 300s TTL)"]
        ETL["Pandas ETL Pipeline<br>(POST /upload/csv)"]
        KPI["Analytics Endpoints<br>(GET /analytics/*)"]
        AI["Natural Language Query Engine<br>(POST /ask/)"]
    end

    subgraph Guardrails ["Validation & Safety Layer"]
        INJECT["SQL Validation Layer<br>(Blocks DDL/DML Mutations)"]
        HEAL["Self-Healing SQL Pipeline<br>(3-Turn Error Recovery)"]
    end

    subgraph Storage ["Database Layer"]
        PG[(PostgreSQL Database)]
    end

    UI --> Security
    Security --> ETL & KPI & AI
    ETL & KPI --> PG
    
    AI <-->|1st Check: Instant 2ms Hit| CACHE
    AI -->|2nd Check: Cache Miss| Guardrails
    Guardrails <-->|Auto-Corrects Queries| AI
    Guardrails -->|Executes Validated SQL| PG
```

### Architectural Components

1. **Request Handling & Middleware**: Handled by FastAPI and SlowAPI. Requests pass through CORS filters and rate limiters before route dispatch.
2. **Authentication Layer**: Evaluates Bearer tokens against the secret key. Extracts user identity (`sub`) to establish execution context and enforce API throttling limits.
3. **Hybrid Query Engine**:
   - **Business Analytics Engine**: Serves standard dashboard metrics (`/analytics/summary`, `/analytics/top-products`) using pre-compiled SQL joins executed via SQLAlchemy ORM.
   - **Natural Language Query Engine**: Processes ad-hoc questions (`/ask`). Sanitizes input, checks Redis cache, formats schema context, and calls Gemini for SQL synthesis.
4. **Data Ingestion Pipeline**: Accepts CSV uploads (`/upload/csv`), validates required schema columns using Pandas, creates missing foreign key records, and batch-commits transaction rows.

---

## Performance Summary

By routing frequent analytical queries through pre-compiled ORM endpoints and caching complex NLP queries in Redis, the system reduces reliance on external LLM inference.

| Operation | Average Latency | Execution Mechanism |
| :--- | ---: | :--- |
| ORM Analytics | ~10 ms | Compiled SQL join execution via PostgreSQL connection pool |
| Gemini SQL Generation | ~1.5 s | External REST API inference call to Google Gemini 1.5 Pro |
| Redis Cache Hit | ~2 ms | In-memory SHA-256 key lookup via Redis client |

---

## Engineering Challenges Solved

### 1. LLM Non-Determinism & SQL Errors
Large language models occasionally generate syntactically incorrect queries or reference non-existent schema attributes.
- **Solution**: Implemented a closed-loop retry mechanism inside the `/ask` route. If `db.execute()` raises a SQLAlchemy database error, the stack trace is intercepted and injected back into the LLM prompt. Gemini analyzes the failure and returns a corrected query within a 3-turn limit.

### 2. High Inference Latency & API Costs
Relying solely on LLM generation for every user request causes slow response times (~1.5s) and incurs unnecessary API consumption.
- **Solution**: Integrated a Redis caching layer. Incoming natural language prompts are lowercased, stripped of excess whitespace, and hashed using SHA-256. Successful query results are cached with a 300-second Time-To-Live (TTL). Repeat queries bypass the LLM entirely, executing in ~2 ms.

### 3. Cache Desynchronization
When new data is ingested into the database, existing cached answers for aggregate metrics become stale.
- **Solution**: Added automated cache invalidation hooks. Whenever new sales records are inserted via `POST /upload/csv` or mutated via CRUD operations (`POST`, `PUT`, `DELETE` on `/sales/`), the application executes `query_cache.clear()`, ensuring downstream queries reflect current database state.

### 4. API Security & Resource Exhaustion
Publicly exposed LLM endpoints are vulnerable to denial-of-service attacks and prompt injection.
- **Solution**:
  - **Rate Limiting**: Configured SlowAPI to limit users to 20 requests per minute. To avoid shared-IP issues behind corporate NATs, throttling is keyed to the user's JWT identity (`sub`) rather than the network IP address.
  - **SQL Injection Protection**: Applied a two-stage filter that validates `SELECT` statements and rejects queries containing DDL/DML keywords (`DROP`, `DELETE`, `UPDATE`, `ALTER`, `INSERT`).

---

## Getting Started

### Prerequisites
- Python 3.10 or higher
- PostgreSQL server running locally or remotely
- Redis server or local emulation enabled

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/scrapyy05/ai_sales_analyst.git
   cd ai_sales_analyst
   ```

2. **Set up virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create a `.env` file in the project root containing your database parameters and API credentials:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/sales_db
   SECRET_KEY=your_secure_jwt_secret_key
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

5. **Apply database migrations:**
   Run Alembic to create the relational database schema:
   ```bash
   alembic upgrade head
   ```

6. **Start the development server:**
   Launch the Uvicorn ASGI server with hot reloading enabled:
   ```bash
   uvicorn app.main:app --reload
   ```

7. **Access documentation:**
   Open `http://localhost:8000/docs` in your browser to interact with the Swagger API interface.

---

## Testing

To verify that rate limiting, caching, and database flows function correctly in local environments:

1. **Test Rate Limiter**: Send 21 rapid POST requests to `/ask/` using a single bearer token. Verify that the 21st request returns HTTP `429 Too Many Requests` along with standard `X-RateLimit-*` response headers.
2. **Test Semantic Caching**: Send the exact same text prompt twice. Verify via terminal logs that the first invocation logs Gemini API execution while the second invocation logs an instant Redis cache hit.
3. **Test ETL & Cache Invalidation**: Upload a sample dataset via `POST /upload/csv`. Verify that `query_cache.clear()` executes and flushes stored keys.

---

## Screenshots

Here are visual placeholders representing the primary workflows of the application:

### Swagger UI & API Interface
![Swagger UI](https://via.placeholder.com/800x400.png?text=Swagger+UI+Interactive+API+Docs)

### JWT Login Endpoint
![Login Endpoint](https://via.placeholder.com/800x300.png?text=OAuth2+JWT+Login+Endpoint)

### CSV Upload Pipeline
![CSV Upload](https://via.placeholder.com/800x300.png?text=Pandas+CSV+ETL+Upload+Route)

### Natural Language Query Engine (`/ask`)
![Ask Endpoint](https://via.placeholder.com/800x400.png?text=Natural+Language+to+SQL+Query+Execution)

### Redis Cache Hit Verification
![Redis Cache Hit](https://via.placeholder.com/800x200.png?text=Sub-Millisecond+Redis+Cache+Hit+Log)

### Business Analytics Response
![Analytics Response](https://via.placeholder.com/800x350.png?text=Pre-Compiled+ORM+Analytics+JSON)

---

## Usage Example

### Natural Language Query (`POST /ask/`)

**Request:**
```json
{
  "question": "What is the total revenue generated by product category?"
}
```

**Terminal Output (Initial Request - Cache Miss):**
```text
INFO: Executing dynamic Text-to-SQL via Gemini...
INFO: Database query successful. Returning results.
```

**Terminal Output (Repeat Request - Cache Hit):**
```text
⚡ REDIS CACHE HIT! Returning instant answer for: 'What is the total revenue generated by product category?'
```

**Response Payload:**
```json
{
  "results": [
    { "category": "Electronics", "revenue": 45000.00 },
    { "category": "Software", "revenue": 32000.00 }
  ],
  "analysis": {
    "summary": "Electronics leads sales with $45,000 in revenue, followed by Software at $32,000.",
    "insight": "Hardware categories currently generate 58% of overall business revenue.",
    "recommendation": "Increase marketing spend on high-margin software subscriptions to balance revenue distribution."
  }
}
```

---

## Future Improvements

- **Asynchronous Background Processing**: Offload large CSV ingestion tasks (`POST /upload/csv`) to Celery workers backed by RabbitMQ or Redis broker to prevent blocking the ASGI event loop during gigabyte-scale data imports.
- **Dynamic Tiered Rate Limiting**: Extend SlowAPI configuration to support tiered subscription limits (e.g., Free: 20 req/min, Pro: 100 req/min, Admin: Unlimited) parsed from JWT claims.
- **Vector Database Integration**: Incorporate `pgvector` into PostgreSQL to enable hybrid semantic search over unstructured product descriptions alongside structured SQL aggregations.
