"""
RAG Service - Core Business Logic
File: backend/app/services/rag_service.py
"""

import ollama
import numpy as np
from pathlib import Path
from typing import List, Dict, AsyncIterator
import pickle
from datetime import datetime

# Import utilities
from app.utils.document_processor import DocumentProcessor
from app.utils.vector_store import SimpleVectorStore


class RAGService:
    """RAG Chatbot Service with document processing and vector search"""
    
    def __init__(self, model: str = "llava", embedding_model: str = "nomic-embed-text"):
        self.model = model
        self.embedding_model = embedding_model
        self.conversation_history = []
        self.vector_store = SimpleVectorStore()
        self.doc_processor = DocumentProcessor()
        self.kb_path = Path("knowledge_bases")
        self.kb_path.mkdir(exist_ok=True)
        
        print(f"✅ RAG Service initialized with model: {model}")
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if chunk:
                chunks.append(chunk)
        
        return chunks
    
    def add_document(self, file_path: str, metadata: Dict = None) -> Dict:
        """Add a document to the knowledge base"""
        try:
            # Extract text
            text = self.doc_processor.process_file(file_path)
            
            # Split into chunks
            chunks = self.chunk_text(text)
            
            # Generate embeddings and store
            filename = Path(file_path).name
            
            for i, chunk in enumerate(chunks):
                # Generate embedding
                embedding_response = ollama.embeddings(
                    model=self.embedding_model,
                    prompt=chunk
                )
                
                # Create unique ID
                doc_id = f"{Path(file_path).stem}_{i}"
                
                # Store in vector store
                self.vector_store.add(
                    ids=[doc_id],
                    embeddings=[embedding_response['embedding']],
                    documents=[chunk],
                    metadatas=[{
                        "source": filename,
                        "chunk_index": i,
                        "added_at": datetime.now().isoformat(),
                        **(metadata or {})
                    }]
                )
            
            return {
                "success": True,
                "chunks": len(chunks),
                "filename": filename
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def retrieve_context(self, query: str, n_results: int = 3) -> tuple:
        """Retrieve relevant context from knowledge base"""
        if not self.vector_store.documents:
            return "", []
        
        # Generate query embedding
        query_embedding = ollama.embeddings(
            model=self.embedding_model,
            prompt=query
        )
        
        # Search vector store
        results = self.vector_store.query(
            query_embedding=query_embedding['embedding'],
            n_results=n_results
        )
        
        # Combine retrieved documents
        if results['documents'] and results['documents'][0]:
            context = "\n\n".join(results['documents'][0])
            sources = list(set([meta['source'] for meta in results['metadatas'][0]]))
            return context, sources
        
        return "", []
    
    async def chat(self, message: str, use_rag: bool = True) -> Dict:
        """Non-streaming chat"""
        context = ""
        sources = []
        
        # Retrieve context if RAG enabled
        if use_rag:
            context, sources = self.retrieve_context(message)
        
        # Build messages
        if context:
            system_message = f"""You are a helpful assistant. Use the following context to answer the user's question.
If the context is relevant, base your answer on it. If not, answer from your general knowledge.

Context:
{context}

Answer the user's question below:"""
            
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": message}
            ]
        else:
            messages = self.conversation_history + [
                {"role": "user", "content": message}
            ]
        
        # Get response
        response = ollama.chat(
            model=self.model,
            messages=messages,
            stream=False
        )
        
        assistant_message = response['message']['content']
        
        # Update history
        self.conversation_history.append({"role": "user", "content": message})
        self.conversation_history.append({"role": "assistant", "content": assistant_message})
        
        return {
            "response": assistant_message,
            "sources": sources
        }
    
    async def chat_stream(self, message: str, use_rag: bool = True) -> AsyncIterator[Dict]:
        """Streaming chat response"""
        context = ""
        sources = []
        
        # Retrieve context if RAG enabled
        if use_rag:
            context, sources = self.retrieve_context(message)
        
        # Build messages
        if context:
            system_message = f"""You are a helpful assistant. Use the following context to answer the user's question.
If the context is relevant, base your answer on it. If not, answer from your general knowledge.

Context:
{context}

Answer the user's question below:"""
            
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": message}
            ]
        else:
            messages = self.conversation_history + [
                {"role": "user", "content": message}
            ]
        
        # Stream response
        full_response = ""
        stream = ollama.chat(
            model=self.model,
            messages=messages,
            stream=True
        )
        
        for chunk in stream:
            content = chunk['message']['content']
            full_response += content
            
            yield {
                "content": content,
                "sources": sources if sources else [],
                "done": False
            }
        
        # Update history
        self.conversation_history.append({"role": "user", "content": message})
        self.conversation_history.append({"role": "assistant", "content": full_response})
        
        # Final chunk with sources
        yield {
            "content": "",
            "sources": sources,
            "done": True
        }
    
    def list_documents(self) -> List[Dict]:
        """List all documents in knowledge base"""
        all_data = self.vector_store.get()
        
        if not all_data['metadatas']:
            return []
        
        # Group by source
        docs_dict = {}
        for meta in all_data['metadatas']:
            source = meta['source']
            if source not in docs_dict:
                docs_dict[source] = {
                    "filename": source,
                    "chunks": 1,
                    "added_at": meta.get('added_at', '')
                }
            else:
                docs_dict[source]['chunks'] += 1
        
        return list(docs_dict.values())
    
    def delete_document(self, filename: str) -> Dict:
        """Delete a document from knowledge base"""
        all_data = self.vector_store.get()
        
        # Find IDs to delete
        ids_to_keep = []
        embeddings_to_keep = []
        documents_to_keep = []
        metadatas_to_keep = []
        
        found = False
        for i, meta in enumerate(all_data['metadatas']):
            if meta['source'] != filename:
                ids_to_keep.append(all_data['ids'][i])
                embeddings_to_keep.append(self.vector_store.embeddings[i])
                documents_to_keep.append(all_data['documents'][i])
                metadatas_to_keep.append(meta)
            else:
                found = True
        
        if found:
            # Replace vector store data
            self.vector_store.ids = ids_to_keep
            self.vector_store.embeddings = embeddings_to_keep
            self.vector_store.documents = documents_to_keep
            self.vector_store.metadatas = metadatas_to_keep
            return {"success": True}
        
        return {"success": False}
    
    def clear_knowledge_base(self):
        """Clear all documents"""
        self.vector_store.clear()
        self.conversation_history = []
    
    def get_status(self) -> Dict:
        """Get service status"""
        all_data = self.vector_store.get()
        documents = self.list_documents()
        
        return {
            "documents_count": len(documents),
            "total_chunks": len(all_data['documents']),
            "model": self.model,
            "embedding_model": self.embedding_model,
            "conversation_length": len(self.conversation_history)
        }
    
    def save_knowledge_base(self, filename: str = "rag_kb.pkl"):
        """Save knowledge base to disk"""
        filepath = self.kb_path / filename
        self.vector_store.save(str(filepath))
    
    def load_knowledge_base(self, filename: str = "rag_kb.pkl") -> Dict:
        """Load knowledge base from disk"""
        filepath = self.kb_path / filename
        
        if filepath.exists():
            self.vector_store.load(str(filepath))
            documents = self.list_documents()
            return {
                "success": True,
                "documents_count": len(documents)
            }
        
        return {"success": False}