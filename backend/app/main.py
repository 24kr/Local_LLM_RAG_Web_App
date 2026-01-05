"""
FastAPI Backend - Main Application Entry Point
File: backend/app/main.py
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager

# Import routers (we'll create these)
from app.routers import rag, organizer, recruiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("🚀 Starting Local LLM Application Server...")
    print("📊 Checking Ollama connection...")
    
    # Startup logic
    try:
        import ollama
        models = ollama.list()
        print(f"✅ Ollama connected! Available models: {len(models.get('models', []))}")
    except Exception as e:
        print(f"⚠️ Warning: Could not connect to Ollama: {e}")
    
    yield
    
    # Shutdown logic
    print("👋 Shutting down server...")


# Create FastAPI app
app = FastAPI(
    title="Local LLM Applications API",
    description="Offline AI-powered applications using Ollama",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "path": str(request.url)
        }
    )


# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "Local LLM Applications API",
        "status": "online",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        import ollama
        models = ollama.list()
        return {
            "status": "healthy",
            "ollama_connected": True,
            "available_models": [m['name'] for m in models.get('models', [])]
        }
    except Exception as e:
        return {
            "status": "degraded",
            "ollama_connected": False,
            "error": str(e)
        }


@app.get("/api/system/status")
async def system_status():
    """Get detailed system status"""
    try:
        import ollama
        import psutil
        
        models = ollama.list()
        
        return {
            "ollama": {
                "connected": True,
                "models": [m['name'] for m in models.get('models', [])]
            },
            "system": {
                "cpu_percent": psutil.cpu_percent(),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_percent": psutil.disk_usage('/').percent
            }
        }
    except Exception as e:
        return {
            "ollama": {"connected": False, "error": str(e)},
            "system": {"error": "Could not get system info"}
        }


# Include routers
app.include_router(rag.router, prefix="/api/rag", tags=["RAG Chatbot"])
app.include_router(organizer.router, prefix="/api/organizer", tags=["Smart Organizer"])
app.include_router(recruiter.router, prefix="/api/recruiter", tags=["Recruiter Agency"])


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )