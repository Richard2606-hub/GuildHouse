"""
Quick smoke test for the GuildHouse pipeline.
Run with: python test_pipeline.py
"""
import asyncio
import os
import sys

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Ensure we can import from the engine
sys.path.insert(0, os.path.dirname(__file__))

from engine.loader import pack_loader
from engine.session import session_manager
from engine.config import FIREWORKS_API_KEY


async def main():
    print("=" * 60)
    print("GuildHouse Pipeline Smoke Test")
    print("=" * 60)

    if FIREWORKS_API_KEY:
        print(f"[OK] Fireworks API key found (ends with ...{FIREWORKS_API_KEY[-4:]})")
    else:
        print("[WARN] No FIREWORKS_API_KEY set - will run in mock mode")

    # Load packs
    pack_loader.load_all_packs()
    packs = pack_loader.get_all_packs()
    print(f"\nLoaded {len(packs)} packs: {[p['name'] for p in packs]}")

    # Test with ScamShield pack
    test_pack_id = "scamshield"
    test_message = "I received a text message saying I won a lottery and need to pay RM500 to claim it. Is this a scam?"

    print(f"\n--- Testing pack: {test_pack_id} ---")
    print(f"User: {test_message}")

    session_id = session_manager.create_session(test_pack_id)
    result = await session_manager.process_request(session_id, test_message)

    print(f"\nAssistant: {result['text']}")
    print(f"\nPipeline Metadata:")
    for key, value in result["metadata"].items():
        print(f"   {key}: {value}")

    # Test with MyInvois pack
    test_pack_id2 = "myinvois_clerk"
    test_message2 = "How do I generate an e-invoice for a client in Malaysia?"

    print(f"\n--- Testing pack: {test_pack_id2} ---")
    print(f"User: {test_message2}")

    session_id2 = session_manager.create_session(test_pack_id2)
    result2 = await session_manager.process_request(session_id2, test_message2)

    print(f"\nAssistant: {result2['text']}")
    print(f"\nPipeline Metadata:")
    for key, value in result2["metadata"].items():
        print(f"   {key}: {value}")

    print("\n" + "=" * 60)
    print("[OK] Smoke test complete!")


if __name__ == "__main__":
    asyncio.run(main())
