// File: frontend/src/pages/HomePage.jsx
import { Link } from 'react-router-dom';
import { FileText, Package, Briefcase, ArrowRight } from 'lucide-react';

export default function HomePage() {
    const apps = [
        {
            title: 'RAG Assistant',
            description: 'Upload documents and chat with your knowledge base using AI-powered question answering.',
            icon: FileText,
            path: '/rag',
            color: 'blue',
            features: ['Document Q&A', 'Context-aware responses', 'Source citations']
        },
        {
            title: 'Smart Organizer',
            description: 'Organize any collection of items intelligently. From groceries to tasks, let AI categorize and suggest.',
            icon: Package,
            path: '/organizer',
            color: 'green',
            features: ['Smart categorization', 'AI suggestions', 'Multiple contexts']
        },
        {
            title: 'Recruiter Agency',
            description: 'Match candidates with jobs using AI. Parse resumes, analyze skills, and generate interview questions.',
            icon: Briefcase,
            path: '/recruiter',
            color: 'purple',
            features: ['Resume parsing', 'Job matching', 'Interview prep']
        },
    ];

    return (
        <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-8 py-12">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                        Local LLM Applications
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Powerful AI applications running completely offline on your machine.
                        Private, secure, and fast.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>100% Offline</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Privacy First</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>No Cloud Required</span>
                        </div>
                    </div>
                </div>

                {/* App Cards */}
                <div className="grid md:grid-cols-3 gap-8">
                    {apps.map((app) => {
                        const Icon = app.icon;
                        const colorClasses = {
                            blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
                            green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
                            purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
                        };

                        return (
                            <Link
                                key={app.path}
                                to={app.path}
                                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                            >
                                <div className={`bg-gradient-to-r ${colorClasses[app.color]} p-6 text-white`}>
                                    <Icon className="w-12 h-12 mb-4" />
                                    <h3 className="text-2xl font-bold mb-2">{app.title}</h3>
                                    <p className="text-white/90 text-sm">{app.description}</p>
                                </div>

                                <div className="p-6">
                                    <ul className="space-y-2 mb-6">
                                        {app.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                                        <span>Get Started</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Features Section */}
                <div className="mt-20 bg-white rounded-2xl shadow-lg p-12">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Why Local LLM Applications?
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                title: 'Privacy',
                                description: 'Your data never leaves your machine. Complete control over sensitive information.',
                            },
                            {
                                title: 'No Internet',
                                description: 'Works completely offline. No dependency on cloud services or internet connection.',
                            },
                            {
                                title: 'Cost Effective',
                                description: 'No API fees or subscription costs. One-time setup, unlimited usage.',
                            },
                            {
                                title: 'Fast',
                                description: 'Low latency responses. No network delays or rate limits.',
                            },
                        ].map((feature, idx) => (
                            <div key={idx} className="text-center">
                                <h3 className="font-bold text-lg text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tech Stack */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-gray-500">
                        Powered by Ollama • React • FastAPI • Python
                    </p>
                </div>
            </div>
        </div>
    );
}