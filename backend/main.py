from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import yaml

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

@app.get("/api/packs/{pack_name}")
async def get_pack_raw(pack_name: str):
    filename = f"{pack_name}.yaml"
    filepath = os.path.join(pack_loader.packs_dir, filename)
    if not os.path.exists(filepath):
        # try .yml extension
        filename = f"{pack_name}.yml"
        filepath = os.path.join(pack_loader.packs_dir, filename)
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Pack file not found")
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        return {"content": content, "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SavePackRequest(BaseModel):
    content: str

@app.post("/api/packs/{pack_name}")
async def save_pack(pack_name: str, request: SavePackRequest):
    filename = f"{pack_name}.yaml"
    filepath = os.path.join(pack_loader.packs_dir, filename)
    
    # Pre-validate YAML syntax
    try:
        data = yaml.safe_load(request.content)
        if not data or 'name' not in data:
            return {"status": "error", "message": "Invalid pack data: 'name' is a required root key."}
    except Exception as e:
        return {"status": "error", "message": f"YAML Syntax Error: {str(e)}"}
        
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(request.content)
            
        # Hot-reload packs
        pack_loader.load_all_packs()
        
        # Verify the pack loaded correctly
        pack_id = pack_name.lower().replace(" ", "_")
        loaded_pack = pack_loader.get_pack(pack_id)
        if not loaded_pack:
            return {"status": "quarantined", "message": "YAML saved, but engine quarantined the pack due to structural mismatch."}
            
        return {"status": "success", "message": "Pack saved and hot-reloaded successfully!", "pack": loaded_pack}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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

