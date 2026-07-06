import os
import yaml
from typing import Dict, Any

class PackLoader:
    def __init__(self, packs_dir: str = "packs"):
        self.packs_dir = packs_dir
        self.registry: Dict[str, Any] = {}

    def load_all_packs(self):
        """Scan the packs directory and load all valid YAML manifests."""
        print(f"Loading packs from {self.packs_dir}...")
        if not os.path.exists(self.packs_dir):
            os.makedirs(self.packs_dir, exist_ok=True)
            return

        for filename in os.listdir(self.packs_dir):
            if filename.endswith(".yaml") or filename.endswith(".yml"):
                filepath = os.path.join(self.packs_dir, filename)
                self.load_pack(filepath)

    def load_pack(self, filepath: str):
        """Parse a single YAML file and register it."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                pack_data = yaml.safe_load(f)
            
            if not pack_data or 'name' not in pack_data:
                print(f"Skipping invalid pack: {filepath}")
                return

            pack_id = pack_data['name'].lower().replace(" ", "_")
            self.registry[pack_id] = pack_data
            print(f"Successfully loaded pack: {pack_data['name']} (v{pack_data.get('version', '1.0')})")
        
        except Exception as e:
            print(f"Error loading pack {filepath}: {e}")

    def get_pack(self, pack_id: str) -> Dict[str, Any]:
        return self.registry.get(pack_id)

    def get_all_packs(self) -> list:
        return list(self.registry.values())

# Global registry instance
pack_loader = PackLoader(packs_dir=os.path.join(os.path.dirname(__file__), "..", "packs"))
