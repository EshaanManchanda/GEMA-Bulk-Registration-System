import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../../layouts/AdminLayout';
import { Card } from '../../../components/ui';
import { Search, Plus, Upload, Brain, Edit2, Trash2, X, Download } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function FAQManager() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingFAQ, setEditingFAQ] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [events, setEvents] = useState([]);
    const [formData, setFormData] = useState({
        query: '',
        response: '',
        keyword: '',
        category: '',
        lang: 'en',
        location: 'global',
        eventId: ''
    });
    const [showImportModal, setShowImportModal] = useState(false);
    const [importSettings, setImportSettings] = useState({
        eventId: '',
        location: 'global'
    });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchFAQs();
        fetchEvents();
    }, []);

    const fetchFAQs = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_URL}/chatbot/faqs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFaqs(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching FAQs:', error);
            toast.error('Failed to load FAQs');
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_URL}/admin/events`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data && response.data.data) {
                // Handle pagination structure where events are nested in data.events
                if (response.data.data.events && Array.isArray(response.data.data.events)) {
                    setEvents(response.data.data.events);
                } else if (Array.isArray(response.data.data)) {
                    setEvents(response.data.data);
                }
            } else if (Array.isArray(response.data)) {
                setEvents(response.data);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');

        try {
            const payload = { ...formData };
            if (!payload.eventId) delete payload.eventId; // Remove empty string if no event selected

            if (editingFAQ) {
                await axios.put(`${API_URL}/chatbot/faqs/${editingFAQ._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('FAQ updated successfully');
            } else {
                await axios.post(`${API_URL}/chatbot/faqs`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('FAQ added successfully');
            }

            fetchFAQs();
            resetForm();
        } catch (error) {
            console.error('Error saving FAQ:', error);
            toast.error('Failed to save FAQ');
        }
    };

    const handleEdit = (faq) => {
        setEditingFAQ(faq);
        setFormData({
            query: faq.query,
            response: faq.response,
            keyword: faq.keyword || '',
            category: faq.category || '',
            lang: faq.lang || 'en',
            location: faq.location || 'global',
            eventId: faq.eventId?._id || faq.eventId || ''
        });
        setShowAddForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this FAQ?')) return;

        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`${API_URL}/chatbot/faqs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('FAQ deleted successfully');
            fetchFAQs();
        } catch (error) {
            console.error('Error deleting FAQ:', error);
            toast.error('Failed to delete FAQ');
        }
    };

    const resetForm = () => {
        setFormData({
            query: '',
            response: '',
            keyword: '',
            category: '',
            lang: 'en',
            location: 'global',
            eventId: ''
        });
        setEditingFAQ(null);
        setShowAddForm(false);
    };

    const handleGenerateEmbeddings = async () => {
        const toastId = toast.loading('Generating embeddings... This may take a moment.');
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.post(`${API_URL}/chatbot/faqs/generate-embeddings`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.dismiss(toastId);
            toast.success(response.data.message);
            fetchFAQs();
        } catch (error) {
            toast.dismiss(toastId);
            console.error('Error generating embeddings:', error);
            toast.error('Failed to generate embeddings');
        }
    };

    const handleImportCSV = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        if (importSettings.eventId) formData.append('eventId', importSettings.eventId);
        formData.append('location', importSettings.location);

        const toastId = toast.loading('Importing FAQs...');
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.post(`${API_URL}/chatbot/faqs/import-csv`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.dismiss(toastId);
            toast.success(response.data.message);
            setShowImportModal(false);
            setImportSettings({ eventId: '', location: 'global' });
            fetchFAQs();
        } catch (error) {
            toast.dismiss(toastId);
            console.error('Error importing FAQs:', error);
            toast.error(error.response?.data?.message || 'Failed to import CSV');
        }

        event.target.value = ''; // Reset file input
    };

    const handleExportCSV = async () => {
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
        } catch (error) {
            console.error('Error exporting FAQs:', error);
            toast.error('Failed to export FAQs');
        }
    };

    const filteredFaqs = faqs.filter(faq =>
        faq.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.response.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (faq.category && faq.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">FAQ Manager</h1>
                        <p className="text-gray-600 mt-1">Manage chatbot FAQs and knowledge base</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add FAQ
                        </button>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Import CSV
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={handleGenerateEmbeddings}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            title="Generate embeddings for better search"
                        >
                            <Brain className="w-4 h-4" />
                            Generate Embeddings
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <Card>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search FAQs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </Card>

                {/* FAQ Table */}
                <Card>
                    {loading ? (
                        <div className="text-center py-8">Loading FAQs...</div>
                    ) : filteredFaqs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No FAQs found. Add one to get started!</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredFaqs.map((faq) => (
                                        <tr key={faq._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{faq.query}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={faq.response}>{faq.response}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{faq.category || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{faq.location || 'Global'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {faq.eventId ? (faq.eventId.title || 'Unknown Event') : 'Global'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleEdit(faq)} className="text-blue-600 hover:text-blue-900 mr-4">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(faq._id)} className="text-red-600 hover:text-red-900">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Add/Edit Modal */}
                {showAddForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">{editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}</h2>
                                <button onClick={resetForm}><X className="w-6 h-6 text-gray-500" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.query}
                                        onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Response *</label>
                                    <textarea
                                        required
                                        rows="4"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.response}
                                        onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                                        <input
                                            type="text"
                                            placeholder="comma, separated"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.keyword}
                                            onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        >
                                            <option value="global">Global (All Locations)</option>
                                            <option value="india">India</option>
                                            <option value="international">International</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Event (Optional)</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.eventId}
                                            onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                                        >
                                            <option value="">Global (All Events)</option>
                                            {events.map(event => (
                                                <option key={event._id} value={event._id}>{event.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        {editingFAQ ? 'Update FAQ' : 'Create FAQ'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Import Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Import FAQs from CSV</h2>
                                <button onClick={() => setShowImportModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location for all FAQs</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={importSettings.location}
                                        onChange={(e) => setImportSettings({ ...importSettings, location: e.target.value })}
                                    >
                                        <option value="global">Global</option>
                                        <option value="india">India</option>
                                        <option value="international">International</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Event for all FAQs (Optional)</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={importSettings.eventId}
                                        onChange={(e) => setImportSettings({ ...importSettings, eventId: e.target.value })}
                                    >
                                        <option value="">None (Global)</option>
                                        {events.map(event => (
                                            <option key={event._id} value={event._id}>{event.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select CSV File</label>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleImportCSV}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        CSV should have columns: query, response, keyword, category
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
