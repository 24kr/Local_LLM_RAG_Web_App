// File: frontend/src/pages/RAGPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Send, Trash2, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import ragService from '../services/ragService';
import ReactMarkdown from 'react-markdown';

export default function RAGPage() {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [useRag, setUseRag] = useState(true);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const queryClient = useQueryClient();

    // Fetch documents
    const { data: documentsData, isLoading: docsLoading } = useQuery({
        queryKey: ['documents'],
        queryFn: ragService.listDocuments,
    });

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: ragService.uploadDocument,
        onSuccess: () => {
            queryClient.invalidateQueries(['documents']);
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: ragService.deleteDocument,
        onSuccess: () => {
            queryClient.invalidateQueries(['documents']);
        },
    });

    // Clear KB mutation
    const clearMutation = useMutation({
        mutationFn: ragService.clearKnowledgeBase,
        onSuccess: () => {
            queryClient.invalidateQueries(['documents']);
            setMessages([]);
        },
    });

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle file upload
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            await uploadMutation.mutateAsync(file);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload document: ' + error.message);
        }
    };

    // Handle send message
    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isStreaming) return;

        const userMessage = { role: 'user', content: inputMessage };
        setMessages((prev) => [...prev, userMessage]);
        setInputMessage('');
        setIsStreaming(true);

        // Add placeholder for assistant message
        const assistantMessageIndex = messages.length + 1;
        setMessages((prev) => [...prev, { role: 'assistant', content: '', sources: [] }]);

        try {
            let fullContent = '';
            let sources = [];

            await ragService.chatStream(
                inputMessage,
                useRag,
                // onChunk
                (data) => {
                    fullContent += data.content;
                    if (data.sources && data.sources.length > 0) {
                        sources = data.sources;
                    }
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        newMessages[assistantMessageIndex] = {
                            role: 'assistant',
                            content: fullContent,
                            sources: sources,
                        };
                        return newMessages;
                    });
                },
                // onDone
                (data) => {
                    if (data?.sources && data.sources.length > 0) {
                        sources = data.sources;
                        setMessages((prev) => {
                            const newMessages = [...prev];
                            newMessages[assistantMessageIndex] = {
                                role: 'assistant',
                                content: fullContent,
                                sources: sources,
                            };
                            return newMessages;
                        });
                    }
                    setIsStreaming(false);
                },
                // onError
                (error) => {
                    console.error('Streaming error:', error);
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        newMessages[assistantMessageIndex] = {
                            role: 'assistant',
                            content: 'Error: ' + error.message,
                            sources: [],
                        };
                        return newMessages;
                    });
                    setIsStreaming(false);
                }
            );
        } catch (error) {
            console.error('Chat error:', error);
            setIsStreaming(false);
        }
    };

    const documents = documentsData?.documents || [];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">📚 RAG Assistant</h2>

                    {/* Upload button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {uploadMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        Upload Document
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.docx,.doc,.txt,.csv,.xlsx,.xls"
                        className="hidden"
                    />
                </div>

                {/* Documents list */}
                <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Documents ({documents.length})
                    </h3>
                    {docsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : documents.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">
                            No documents yet. Upload one to get started!
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {documents.map((doc, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <FileText className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">
                                            {doc.filename}
                                        </p>
                                        <p className="text-xs text-gray-500">{doc.chunks} chunks</p>
                                    </div>
                                    <button
                                        onClick={() => deleteMutation.mutate(doc.filename)}
                                        disabled={deleteMutation.isPending}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-200 space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={useRag}
                            onChange={(e) => setUseRag(e.target.checked)}
                            className="rounded"
                        />
                        <span>Use RAG (search documents)</span>
                    </label>
                    <button
                        onClick={() => clearMutation.mutate()}
                        disabled={clearMutation.isPending || documents.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear Knowledge Base
                    </button>
                </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                    Welcome to RAG Assistant
                                </h3>
                                <p className="text-gray-600">
                                    Upload documents and start asking questions!
                                </p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-3xl px-4 py-3 rounded-lg ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white border border-gray-200'
                                        }`}
                                >
                                    <ReactMarkdown className="prose prose-sm max-w-none">
                                        {msg.content}
                                    </ReactMarkdown>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                            <p className="text-xs text-gray-600 font-semibold">
                                                📚 Sources: {msg.sources.join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 p-4 bg-white">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask a question about your documents..."
                            disabled={isStreaming}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isStreaming || !inputMessage.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                        >
                            {isStreaming ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}