from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import yaml
import json

from engine.config import FIREWORKS_API_KEY
from engine.session import session_manager
from engine.ledger import house_ledger
from engine.loader import pack_loader
from engine.tools import tools_registry

app = FastAPI(title="GuildHouse Runtime Core")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    pack_id: str
    session_id: Optional[str] = None
    message: str



class PackCreateRequest(BaseModel):
    filename: str
    content: str


class PackUpdateRequest(BaseModel):
    content: str


PACKS_DIR = os.path.join(os.path.dirname(__file__), "packs")
FRONTEND_DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")


@app.on_event("startup")
async def startup_event():
    pack_loader.load_all_packs()
    house_ledger.log_boot()
    if FIREWORKS_API_KEY:
        print("[OK] Fireworks AI API key configured")
    else:
        print("[WARN] No FIREWORKS_API_KEY - running in mock mode")


# ── Health ──

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "GuildHouse Core",
        "fireworks_configured": bool(FIREWORKS_API_KEY),
        "packs_loaded": len(pack_loader.get_all_packs()),
    }


# ── Packs ──

@app.get("/api/packs")
async def get_packs():
    return {"packs": pack_loader.get_all_packs()}


@app.get("/api/packs/{pack_id}")
async def get_pack(pack_id: str):
    pack = pack_loader.get_pack(pack_id)
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found")
    return pack


@app.get("/api/packs/{pack_id}/source")
async def get_pack_source(pack_id: str):
    """Return raw YAML source for the Pack Studio editor."""
    # Search for the pack file
    for filename in os.listdir(PACKS_DIR):
        if filename.endswith(".yaml") or filename.endswith(".yml"):
            filepath = os.path.join(PACKS_DIR, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
                data = yaml.safe_load(content)
                file_pack_id = data.get("name", "").lower().replace(" ", "_")
                if file_pack_id == pack_id:
                    return {"filename": filename, "content": content, "pack_id": pack_id}

    raise HTTPException(status_code=404, detail="Pack source not found")


@app.post("/api/packs")
async def create_pack(request: PackCreateRequest):
    """Create a new pack from YAML content."""
    filename = request.filename
    if not filename.endswith(".yaml"):
        filename += ".yaml"

    filepath = os.path.join(PACKS_DIR, filename)
    if os.path.exists(filepath):
        raise HTTPException(status_code=409, detail="Pack file already exists")

    # Validate YAML
    try:
        data = yaml.safe_load(request.content)
        if not data.get("name"):
            raise HTTPException(status_code=400, detail="Pack must have a 'name' field")
    except yaml.YAMLError as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML: {str(e)}")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(request.content)

    pack_loader.load_all_packs()
    return {"status": "created", "filename": filename}


@app.put("/api/packs/{pack_id}")
async def update_pack(pack_id: str, request: PackUpdateRequest):
    """Update an existing pack's YAML content."""
    # Validate YAML
    try:
        data = yaml.safe_load(request.content)
        if not data.get("name"):
            raise HTTPException(status_code=400, detail="Pack must have a 'name' field")
    except yaml.YAMLError as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML: {str(e)}")

    # Find the pack file
    for filename in os.listdir(PACKS_DIR):
        if filename.endswith((".yaml", ".yml")):
            filepath = os.path.join(PACKS_DIR, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                existing = yaml.safe_load(f.read())
                file_pack_id = existing.get("name", "").lower().replace(" ", "_")
                if file_pack_id == pack_id:
                    with open(filepath, "w", encoding="utf-8") as wf:
                        wf.write(request.content)
                    pack_loader.load_all_packs()
                    return {"status": "updated", "pack_id": pack_id}

    raise HTTPException(status_code=404, detail="Pack not found")


@app.delete("/api/packs/{pack_id}")
async def delete_pack(pack_id: str):
    """Delete a pack."""
    for filename in os.listdir(PACKS_DIR):
        if filename.endswith((".yaml", ".yml")):
            filepath = os.path.join(PACKS_DIR, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                existing = yaml.safe_load(f.read())
                file_pack_id = existing.get("name", "").lower().replace(" ", "_")
                if file_pack_id == pack_id:
                    os.remove(filepath)
                    pack_loader.load_all_packs()
                    return {"status": "deleted", "pack_id": pack_id}

    raise HTTPException(status_code=404, detail="Pack not found")


@app.post("/api/packs/reload")
async def reload_packs():
    pack_loader.load_all_packs()
    return {"status": "success", "count": len(pack_loader.get_all_packs())}

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


# ── Chat ──

@app.post("/api/chat")
async def chat(request: ChatRequest):
    session_id = request.session_id
    if not session_id:
        session_id = session_manager.create_session(request.pack_id)

    try:
        result = await session_manager.process_request(session_id, request.message)
        return {
            "session_id": session_id,
            "response": result["text"],
            "metadata": result["metadata"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Ledger ──

@app.get("/api/ledger")
async def get_ledger():
    try:
        with open(house_ledger.filepath, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f.readlines() if line.strip()]
            return {"events": [json.loads(line) for line in lines]}
    except FileNotFoundError:
        return {"events": []}
    except Exception as e:
        return {"events": [], "error": str(e)}


@app.post("/api/ledger/clear")
async def clear_ledger():
    house_ledger.clear()
    return {"status": "cleared"}


# ── Static files ──

if os.path.isdir(FRONTEND_DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST_DIR, "assets")), name="assets")


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    index_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    return {"message": "GuildHouse API is running. Frontend at http://localhost:5173"}
