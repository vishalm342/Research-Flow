import asyncio
from app.database import connect_to_mongo
from app.models.conversation import Conversation
from app.models.message import Message

async def cleanup_empty_conversations():
    print("Connecting to MongoDB...")
    await connect_to_mongo()
    
    print("Fetching conversations...")
    all_convs = await Conversation.find_all().to_list()
    deleted = 0
    
    for conv in all_convs:
        # Check if conversation has any messages
        message_count = await Message.find(
            Message.conversation_id == conv.conversation_id
        ).count()
        
        if message_count == 0:
            await conv.delete()
            deleted += 1
            if deleted % 500 == 0:
                print(f"Deleted {deleted} empty conversations...")
                
    print(f"✅ Cleanup complete! Deleted {deleted} empty ghost conversations.")

if __name__ == "__main__":
    asyncio.run(cleanup_empty_conversations())