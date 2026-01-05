// File: frontend/src/components/Layout/Layout.jsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FileText, Package, Briefcase, Home } from 'lucide-react';

export default function Layout() {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/rag', label: 'RAG Assistant', icon: FileText },
        { path: '/organizer', label: 'Smart Organizer', icon: Package },
        { path: '/recruiter', label: 'Recruiter Agency', icon: Briefcase },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar Navigation */}
            <nav className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-2xl font-bold">🤖 Local LLM</h1>
                    <p className="text-sm text-gray-400 mt-1">AI Applications Suite</p>
                </div>

                <div className="flex-1 py-6">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive
                                        ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                                        : 'text-gray-300 hover:bg-gray-800 border-l-4 border-transparent'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-6 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-400">Ollama Connected</span>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}