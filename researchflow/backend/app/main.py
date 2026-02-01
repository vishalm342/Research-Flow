from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.database import connect_to_mongo, close_mongo_connection
from app.api import research, reports

app = FastAPI()

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins = [frontend_url]
else:
    # No FRONTEND_URL configured: disable CORS by default
    allowed_origins = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(research.router)
app.include_router(reports.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to ResearchFlow API"}

@app.on_event("startup")
async def on_startup():
    await connect_to_mongo()

@app.on_event("shutdown")
async def on_shutdown():
    await close_mongo_connection()
