import os
import re
from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent.parent.parent / '.env')

router = APIRouter()

# Global memory store for simplicity in this MVP (use Redis/Postgres in prod)
session_memory = {}

class ChatRequest(BaseModel):
    query: str
    session_id: str = "default"

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]

# --- 1. PII Masking Layer ---
def mask_pii(text: str) -> str:
    """Scrub PAN cards, Aadhaar numbers, and bank details."""
    # Mask PAN (5 letters, 4 digits, 1 letter)
    text = re.sub(r'[A-Z]{5}[0-9]{4}[A-Z]{1}', 'XXXXX0000X', text, flags=re.IGNORECASE)
    # Mask Aadhaar (12 digits, optionally separated by spaces or hyphens)
    text = re.sub(r'\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b', 'XXXX-XXXX-XXXX', text)
    # Mask generic Bank Account numbers (assuming 9-18 digits)
    text = re.sub(r'\b\d{9,18}\b', '[MASKED_ACCOUNT]', text)
    return text

# --- 2. System Prompt ---
SYSTEM_PROMPT = """
You are an expert Indian Tax Consultant. 
1. Use ONLY the provided context from the 2026 Tax Acts. 
2. If the user asks for calculations, clarify if you are using the New or Old regime.
3. If the context doesn't contain the answer, say you don't know rather than hallucinating.
4. MASK any sensitive data like PAN or Aadhaar in your response.

Context:
{context}
"""

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def get_vectorstore():
    from langchain_community.vectorstores import Chroma
    from langchain_google_genai import GoogleGenerativeAIEmbeddings

    persist_dir = Path(__file__).parent.parent.parent.parent / 'chroma_db'
    if not persist_dir.exists():
        # Return None if vector store is not initialized yet
        return None
    
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    return Chroma(persist_directory=str(persist_dir), embedding_function=embeddings)

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        from langchain_core.messages import AIMessage, HumanMessage
        from langchain_core.output_parsers import StrOutputParser
        from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
        from langchain_google_genai import ChatGoogleGenerativeAI
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail="AI assistant dependencies are not installed",
        ) from exc

    masked_query = mask_pii(request.query)
    
    vectorstore = get_vectorstore()
    
    # Mocking retrieval if DB doesn't exist to prevent crash during setup
    if vectorstore:
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        docs = retriever.invoke(masked_query)
        context_text = format_docs(docs)
        source_snippets = [doc.page_content[:200] + "..." for doc in docs]
    else:
        context_text = "Vector store not initialized. Please run data ingestion first."
        source_snippets = []
        
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)
    except Exception as e:
        raise HTTPException(status_code=500, detail="LLM Initialization Failed. Ensure GOOGLE_API_KEY is set.")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{query}")
    ])
    
    # Retrieve history
    history = session_memory.get(request.session_id, [])
    
    # Create LCEL Chain
    chain = prompt | llm | StrOutputParser()
    
    try:
        # Invoke chain
        response = chain.invoke({
            "context": context_text,
            "history": history,
            "query": masked_query
        })
    except Exception as e:
        # Handle API errors gracefully
        response = f"I am unable to process your request at the moment due to an API error. {str(e)}"
    
    # Update memory
    history.append(HumanMessage(content=masked_query))
    history.append(AIMessage(content=response))
    
    # Keep history manageable (last 10 messages)
    if len(history) > 10:
        history = history[-10:]
    session_memory[request.session_id] = history
    
    # Mask PII in response just to be doubly safe
    safe_response = mask_pii(response)
    
    return ChatResponse(answer=safe_response, sources=source_snippets)
