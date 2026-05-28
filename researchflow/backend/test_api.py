from fastapi import FastAPI
import fastapi
app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello, ResearchFlow!"}