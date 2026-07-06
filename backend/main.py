from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
from engine.session import session_manager
from engine.ledger import house_ledger
from engine.loader import pack_loader

app = FastAPI(title="GuildHouse Runtime Core")

class ChatRequest(BaseModel):
    pack_id: str
    session_id: str = None
    message: str

@app.on_event("startup")
async def startup_event():
    pack_loader.load_all_packs()
    house_ledger.log_boot()

FRONTEND_DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "GuildHouse Core"}

@app.get("/api/packs")
async def get_packs():
    return {"packs": pack_loader.get_all_packs()}

@app.post("/api/packs/reload")
async def reload_packs():
    pack_loader.load_all_packs()
    return {"status": "success", "message": "Packs reloaded"}

@app.get("/api/ledger")
async def get_ledger():
    import json
    try:
        with open(house_ledger.filepath, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f.readlines() if line.strip()]
            return {"events": [json.loads(line) for line in lines]}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    session_id = request.session_id
    if not session_id:
        session_id = session_manager.create_session(request.pack_id)
        
    try:
        response_text = await session_manager.process_request(session_id, request.message)
        return {"session_id": session_id, "response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount the static directory if it exists, otherwise it will fail to start
if os.path.isdir(FRONTEND_DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST_DIR, "assets")), name="assets")

# Catch-all route to serve the React SPA index.html
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    index_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    return {"error": "Frontend build not found. Please run 'npm run build' in the frontend directory."}

