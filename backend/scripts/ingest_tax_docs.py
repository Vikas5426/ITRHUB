import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma

# Load environment variables (expecting GOOGLE_API_KEY)
load_dotenv(Path(__file__).parent.parent / '.env')

def main():
    docs_dir = Path(__file__).parent.parent / 'tax_docs'
    persist_dir = Path(__file__).parent.parent / 'chroma_db'
    
    if not docs_dir.exists():
        print(f"Directory {docs_dir} does not exist.")
        return
        
    pdf_files = list(docs_dir.glob('*.pdf'))
    if not pdf_files:
        print(f"No PDF files found in {docs_dir}")
        return
        
    documents = []
    print(f"Found {len(pdf_files)} PDF files. Loading...")
    
    for pdf_file in pdf_files:
        loader = PyPDFLoader(str(pdf_file))
        docs = loader.load()
        documents.extend(docs)
        
    print(f"Loaded {len(documents)} document pages.")
    
    # Split documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100
    )
    splits = text_splitter.split_documents(documents)
    print(f"Split into {len(splits)} chunks.")
    
    # Create vector store
    print("Generating embeddings and saving to ChromaDB...")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    
    vectorstore = Chroma.from_documents(
        documents=splits,
        embedding=embeddings,
        persist_directory=str(persist_dir)
    )
    
    print(f"Successfully ingested {len(splits)} chunks into ChromaDB at {persist_dir}")

if __name__ == "__main__":
    main()
