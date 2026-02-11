import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    MessageSquare, HelpCircle, FileText, Award,
    Upload, Download, Brain, ChevronRight, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import AdminLayout from '../../../layouts/AdminLayout';
import { Card, Button } from '../../../components/ui';
import { showSuccess, showError } from '../../../components/common/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function ChatbotDashboard() {
    const [stats, setStats] = useState(null);
    const [recentConversations, setRecentConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const { data } = await axios.get(`${API_URL}/chatbot/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(data.stats);
            setRecentConversations(data.recent_conversations || []);
        } catch (err) {
            console.error(err);
            showError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleExportFAQs = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_URL}/chatbot/faqs/export`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'faqs.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            showSuccess('FAQs exported successfully');
        } catch (err) {
            showError('Failed to export FAQs');
        }
    };

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 p-6">
                <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </Card>
    );

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Chatbot Dashboard</h1>
                        <p className="text-gray-500 mt-1">Overview of chatbot performance and activity</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/admin/chatbot/settings')}>
                            Settings
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Chats"
                        value={stats?.total_chats || 0}
                        icon={MessageSquare}
                        color="bg-blue-600"
                    />
                    <StatCard
                        title="Total FAQs"
                        value={stats?.total_faqs || 0}
                        icon={HelpCircle}
                        color="bg-purple-600"
                    />
                    <StatCard
                        title="Total Messages"
                        value={stats?.total_messages || 0}
                        icon={FileText}
                        color="bg-green-600"
                    />
                    <StatCard
                        title="Certificates Issued"
                        value={stats?.certificates_issued || 0}
                        icon={Award}
                        color="bg-orange-600"
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate('/admin/chatbot/faqs')}>
                        <div className="flex items-center gap-3 mb-2">
                            <Upload className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-900">Import/Manage FAQs</h3>
                        </div>
                        <p className="text-sm text-gray-500">
                            Bulk upload FAQs via CSV or manage them manually.
                        </p>
                    </Card>

                    <Card className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={handleExportFAQs}>
                        <div className="flex items-center gap-3 mb-2">
                            <Download className="w-5 h-5 text-green-600" />
                            <h3 className="font-semibold text-gray-900">Export FAQs</h3>
                        </div>
                        <p className="text-sm text-gray-500">
                            Download all FAQs as a CSV file backup.
                        </p>
                    </Card>

                    <Card className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate('/admin/chatbot/faqs')}>
                        <div className="flex items-center gap-3 mb-2">
                            <Brain className="w-5 h-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-900">Training</h3>
                        </div>
                        <p className="text-sm text-gray-500">
                            Generate embeddings to improve bot accuracy.
                        </p>
                    </Card>
                </div>

                {/* Recent Conversations */}
                <Card>
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
                        <Link to="/admin/chatbot/analytics" className="text-sm text-purple-600 hover:text-purple-700 flex items-center">
                            View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-3 text-left">User</th>
                                    <th className="px-6 py-3 text-left">Last Message</th>
                                    <th className="px-6 py-3 text-center">Messages</th>
                                    <th className="px-6 py-3 text-right">Time</th>
                                    <th className="px-6 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentConversations.length > 0 ? (
                                    recentConversations.map((chat) => (
                                        <tr key={chat.session_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${chat.user_type === 'School' ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                                                    <span className="text-sm font-medium text-gray-900 capitalize">
                                                        {chat.user_type || 'Anonymous'}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono mt-1">
                                                    {chat.session_id.substring(0, 8)}...
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600 truncate max-w-xs">
                                                    {chat.preview || 'No messages'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {chat.total_messages}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-500">
                                                {chat.last_activity && format(new Date(chat.last_activity), 'PP p')}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/chatbot/history/${chat.session_id}`)}>
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            No conversations found yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </AdminLayout>
    );
}
