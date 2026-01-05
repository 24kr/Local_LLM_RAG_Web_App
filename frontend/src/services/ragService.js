// File: frontend/src/services/ragService.js
import api from './api';

const ragService = {
    // Upload document
    uploadDocument: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/rag/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // List documents
    listDocuments: async () => {
        const response = await api.get('/rag/documents');
        return response.data;
    },

    // Delete document
    deleteDocument: async (filename) => {
        const response = await api.delete(`/rag/documents/${filename}`);
        return response.data;
    },

    // Chat (non-streaming)
    chat: async (message, useRag = true) => {
        const response = await api.post('/rag/chat', {
            message,
            use_rag: useRag,
            stream: false,
        });
        return response.data;
    },

    // Chat with streaming using EventSource
    chatStream: async (message, useRag = true, onChunk, onDone, onError) => {
        try {
            const response = await fetch('http://localhost:8000/api/rag/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    use_rag: useRag,
                    stream: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    onDone?.();
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.done) {
                                onDone?.(data);
                            } else {
                                onChunk?.(data);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            onError?.(error);
            throw error;
        }
    },

    // Clear knowledge base
    clearKnowledgeBase: async () => {
        const response = await api.post('/rag/clear');
        return response.data;
    },

    // Get status
    getStatus: async () => {
        const response = await api.get('/rag/status');
        return response.data;
    },

    // Save knowledge base
    saveKnowledgeBase: async (filename = 'rag_kb.pkl') => {
        const response = await api.post('/rag/save', null, {
            params: { filename },
        });
        return response.data;
    },

    // Load knowledge base
    loadKnowledgeBase: async (filename = 'rag_kb.pkl') => {
        const response = await api.post('/rag/load', null, {
            params: { filename },
        });
        return response.data;
    },
};

export default ragService;