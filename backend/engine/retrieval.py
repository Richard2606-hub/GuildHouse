import os
from typing import Dict, Any, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class RetrievalEngine:
    """
    GuildHouse Knowledge Retrieval Module.
    Uses TF-IDF for fast, local, dependency-light exact-term retrieval.
    """

    def __init__(self):
        self.indices = {}  # pack_id -> {"vectorizer": obj, "vectors": array, "chunks": list}
        self.pack_dir = os.path.join(os.path.dirname(__file__), "..", "packs")

    def _chunk_text(self, text: str, chunk_size: int = 500) -> List[str]:
        """Simple paragraph-based chunking."""
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = ""
        for p in paragraphs:
            if len(current_chunk) + len(p) > chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = p + "\n\n"
            else:
                current_chunk += p + "\n\n"
        if current_chunk:
            chunks.append(current_chunk.strip())
        return [c for c in chunks if c]

    def build_index(self, pack_id: str):
        """Build the TF-IDF index for a pack's corpus."""
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

        vectorizer = TfidfVectorizer(stop_words='english')
        try:
            vectors = vectorizer.fit_transform(chunks)
            self.indices[pack_id] = {
                "vectorizer": vectorizer,
                "vectors": vectors,
                "chunks": chunks
            }
        except ValueError:
            # Handle empty vocabulary
            self.indices[pack_id] = None

    def retrieve(self, pack_id: str, query: str, top_k: int = 2) -> List[str]:
        """Retrieve top_k chunks for the given query and pack."""
        if pack_id not in self.indices:
            self.build_index(pack_id)
            
        index_data = self.indices.get(pack_id)
        if not index_data:
            return []

        vectorizer = index_data["vectorizer"]
        vectors = index_data["vectors"]
        chunks = index_data["chunks"]

        try:
            query_vector = vectorizer.transform([query])
            similarities = cosine_similarity(query_vector, vectors).flatten()
            
            # Get indices of top_k results
            if len(similarities) == 0 or np.max(similarities) == 0:
                return []
                
            top_indices = similarities.argsort()[-top_k:][::-1]
            return [chunks[i] for i in top_indices if similarities[i] > 0.05]
        except Exception:
            return []

# Global instance
retrieval_engine = RetrievalEngine()
