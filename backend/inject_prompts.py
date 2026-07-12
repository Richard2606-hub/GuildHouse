import os
import yaml

PACKS_DIR = os.path.join(os.path.dirname(__file__), "packs")

PROMPTS = {
    "AgriVision Crop Doctor": ["Analyze my crop photo", "What causes yellowing leaves?"],
    "Chain-to-Human Explainer": ["Explain this blockchain transaction", "What does this smart contract do?"],
    "Clinic Front-Desk Clerk": ["Book an appointment", "What are the clinic hours?"],
    "Cross-Border Listing Clerk": ["List my product in Singapore", "What are the import duties?"],
    "Edge Retail Shelf Clerk": ["Check inventory for SKU 123", "Are there any out of stock items?"],
    "Factory SOP Copilot": ["Show me the safety checklist", "How do I restart the conveyor?"],
    "Fine-Tune Concierge": ["Help me tune a model", "What dataset format is needed?"],
    "Grant & Tender Writer's Aide": ["Draft an executive summary", "Check compliance for this tender"],
    "Hackathon Judge Copilot": ["Evaluate this project on innovation", "What is the scoring criteria?"],
    "IIoT Alarm-Storm Doctor": ["Diagnose the pressure alarm", "Is there a cascade failure?"],
    "LectureForge": ["Generate a quiz for this lecture", "Summarize the key points"],
    "Manglish Support Clerk": ["Tolong check my order la", "Can refund or not?"],
    "Meeting Multiplexer": ["Summarize the latest meeting", "Extract action items"],
    "MyInvois Clerk": ["Extract supplier name and tax ID", "Check if this receipt complies with LHDN"],
    "PDPA Compliance Auditor": ["Audit this privacy policy", "What are the consent requirements?"],
    "ROCm Migration Assistant": ["Convert this CUDA code to HIP", "How to optimize for ROCm?"],
    "ScamShield": ["Is this SMS a scam?", "Verify this caller"],
    "Tenancy & Contract Explainer": ["Summarize the termination clause", "What are my rights as a tenant?"],
    "ZK Circuit Auditor": ["Audit this Circom circuit", "Check for underconstrained signals"]
}

def inject():
    for filename in os.listdir(PACKS_DIR):
        if not filename.endswith(".yaml"): continue
        filepath = os.path.join(PACKS_DIR, filename)
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            
        name = data.get('name')
        if name in PROMPTS:
            data['suggested_prompts'] = PROMPTS[name]
        
        # Write back preserving order as much as possible but yaml.dump is fine
        with open(filepath, 'w', encoding='utf-8') as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
            
    print("Injected suggested_prompts into all packs.")

if __name__ == "__main__":
    inject()
