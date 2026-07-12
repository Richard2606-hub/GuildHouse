import os
from typing import Dict, Any, List
import numpy as np

try:
    import faiss
    from sentence_transformers import SentenceTransformer
except ImportError:
    faiss = None
    SentenceTransformer = None

class RetrievalEngine:
    """
    GuildHouse Knowledge Retrieval Module.
    Uses semantic search via sentence-transformers and FAISS.
    """

    def __init__(self):
        self.indices = {}  # pack_id -> {"index": faiss_index, "chunks": list}
        self.pack_dir = os.path.join(os.path.dirname(__file__), "..", "packs")
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2') if SentenceTransformer else None

    def _chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Chunking with overlap."""
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end].strip())
            start += chunk_size - overlap
        return [c for c in chunks if c]

    def build_index(self, pack_id: str):
        """Build the FAISS index for a pack's corpus."""
        if not self.embedder or not faiss:
            print("[Retrieval] Warning: FAISS or sentence-transformers not installed. Skipping RAG.")
            self.indices[pack_id] = None
            return

        corpus_path = os.path.join(self.pack_dir, f"{pack_id}_corpus.txt")
        if not os.path.exists(corpus_path):
            self.indices[pack_id] = None
            return

        with open(corpus_path, 'r', encoding='utf-8') as f:
            text = f.read()

        chunks = self._chunk_text(text)
        if not chunks:
            self.indices[pack_id] = None
            return

        # Generate embeddings
        try:
            embeddings = self.embedder.encode(chunks, convert_to_numpy=True)
            dimension = embeddings.shape[1]
            
            # Create FAISS index (L2 distance)
            index = faiss.IndexFlatL2(dimension)
            index.add(embeddings)
            
            self.indices[pack_id] = {
                "index": index,
                "chunks": chunks
            }
            print(f"[Retrieval] Built semantic index for {pack_id} with {len(chunks)} chunks.")
        except Exception as e:
            print(f"[Retrieval] Failed to build index for {pack_id}: {e}")
            self.indices[pack_id] = None

    def retrieve(self, pack_id: str, query: str, top_k: int = 2) -> List[str]:
        """Retrieve top_k chunks for the given query and pack."""
        if pack_id not in self.indices:
            self.build_index(pack_id)
            
        index_data = self.indices.get(pack_id)
        if not index_data or not self.embedder:
            return []

        index = index_data["index"]
        chunks = index_data["chunks"]

        try:
            query_vector = self.embedder.encode([query], convert_to_numpy=True)
            distances, top_indices = index.search(query_vector, top_k)
            
            results = []
            for i, idx in enumerate(top_indices[0]):
                if idx >= 0 and idx < len(chunks):
                    # distance is L2, lower is better. We can add thresholding if needed.
                    results.append(chunks[idx])
            return results
        except Exception as e:
            print(f"[Retrieval] Search failed for {pack_id}: {e}")
            return []

# Global instance
retrieval_engine = RetrievalEngine()
