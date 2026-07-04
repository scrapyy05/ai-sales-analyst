from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.limiter import limiter, rate_limit_exceeded_handler
from app.api.routers import auth, customers, products, sales, analytics, upload, ask

app = FastAPI(
    title="AI Sales Analyst",
    description="A placement-ready backend service to analyze sales using Gemini Text-to-SQL",
    version="1.0.0"
)

# 1. Register Rate Limiter & Exception Handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# 2. CORS Middleware (so any external client/Postman can connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Include Routers
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(analytics.router)
app.include_router(upload.router)
app.include_router(ask.router)

# 4. Mount Static Frontend Files (Modern SaaS UI)
app.mount("/frontend", StaticFiles(directory="frontend", html=True), name="frontend")

@app.get("/")
def root():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/frontend/")
