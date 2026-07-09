from engine.loader import pack_loader

pack_loader.load_all_packs()
packs = pack_loader.get_all_packs()
print(f"\nLoaded {len(packs)} packs successfully.")
for p in packs:
    print(f"- {p['name']}")
