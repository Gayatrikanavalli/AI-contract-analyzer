import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database.session import engine, Base
from backend.app.api.endpoints import router as api_router

# Create database tables automatically if not present
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database initialization notice: {e}")

app = FastAPI(
    title="Contract PDF Clause & Risk Analyzer API",
    description="Production REST API for legal PDF extraction, clause categorization, and Gemini 3.6 Flash risk assessment.",
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "service": "Contract PDF Clause & Risk Analyzer",
        "status": "online",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=True)
