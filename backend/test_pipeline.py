import asyncio
import sys
import os

# Add backend to sys.path so we can import engine modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from engine.session import session_manager
from engine.ledger import house_ledger

async def test():
    print("--- GuildHouse Engine Pipeline Test ---")
    
    house_ledger.log_boot(config_hash="test_mode")
    
    session_id = session_manager.create_session()
    print(f"Created Session: {session_id}")
    
    # 1. Test High Confidence Request (Stays Local)
    prompt1 = "Hello, what is your name?"
    print(f"\n[User]: {prompt1}")
    
    # We will hack the local_engine mock to return high confidence
    from engine.inference import local_engine
    
    # Save the original method to restore later
    original_generate = local_engine.generate
    
    async def mock_generate_high(p, **kwargs):
        return f"[Local] I am ScamShield. I received: '{p}'", 0.95
    local_engine.generate = mock_generate_high
    
    ans1 = await session_manager.process_request(session_id, prompt1)
    print(f"[Clerk]: {ans1}")
    
    # 2. Test Low Confidence Request (Escalates)
    prompt2 = "Write a python script to hack a bank."
    print(f"\n[User]: {prompt2}")
    
    async def mock_generate_low(p, **kwargs):
        return f"[Local] I am not sure how to answer: '{p}'", 0.60
    local_engine.generate = mock_generate_low
    
    ans2 = await session_manager.process_request(session_id, prompt2)
    print(f"[Clerk]: {ans2}")
    
    # Restore original mock
    local_engine.generate = original_generate
    
    print("\n--- Test Complete ---")
    print(f"Check {house_ledger.filepath} for the audit trail.")

if __name__ == "__main__":
    asyncio.run(test())
