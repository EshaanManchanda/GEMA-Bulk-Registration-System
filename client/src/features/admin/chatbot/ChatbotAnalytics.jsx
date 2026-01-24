import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, TrendingUp, FileText, Award, ThumbsUp, ThumbsDown, Clock, CheckCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminLayout from '../../../layouts/AdminLayout';
import { Card } from '../../../components/ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ChatbotAnalytics() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, trendsRes, perfRes] = await Promise.all([
        axios.get(`${API_URL}/chatbot/stats`, { headers }),
        axios.get(`${API_URL}/chatbot/analytics/trends?period=${period}`, { headers }),
        axios.get(`${API_URL}/chatbot/analytics/performance`, { headers })
      ]);

      setStats(statsRes.data);
      setTrends(trendsRes.data.data.trends);
      setPerformance(perfRes.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load chatbot analytics');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Chats',
      value: stats?.total_chats || 0,
      icon: MessageCircle,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Active Chats',
      value: stats?.active_chats || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Resolved Chats',
      value: stats?.resolved_chats || 0,
      icon: CheckCircle,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Total Messages',
      value: stats?.total_messages || 0,
      icon: FileText,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    },
    {
      title: 'Certificates Generated',
      value: stats?.total_certificates || 0,
      icon: Award,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      title: 'Avg Response Time',
      value: `${stats?.average_response_time || 0}ms`,
      icon: Clock,
      color: 'bg-pink-500',
      textColor: 'text-pink-600'
    },
    {
      title: 'Satisfaction Rate',
      value: `${stats?.satisfaction_rate || 0}%`,
      icon: ThumbsUp,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Helpful Responses',
      value: stats?.helpful_responses || 0,
      icon: ThumbsUp,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chatbot Analytics</h1>
            <p className="text-gray-600 mt-1">Monitor chatbot usage and performance</p>
          </div>
          <div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 ${stat.color.replace('bg-', 'bg-').replace('-500', '-100')} rounded-full mb-3`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
                <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Conversation Trends */}
        {trends && trends.length > 0 && (
          <Card>
            <Card.Header>
              <Card.Title>Conversation Trends</Card.Title>
              <p className="text-sm text-gray-600 mt-1">Number of conversations and messages over time</p>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" name="Conversations" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="total_messages" stroke="#10b981" name="Messages" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        )}

        {/* Intent Distribution */}
        {stats?.intent_distribution && stats.intent_distribution.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <Card.Title>Intent Distribution</Card.Title>
                <p className="text-sm text-gray-600 mt-1">User intent breakdown</p>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.intent_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ intent, count }) => `${intent}: ${count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.intent_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {stats.intent_distribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="capitalize text-gray-700">{item.intent}</span>
                      </div>
                      <span className="font-medium text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Feedback Stats */}
            <Card>
              <Card.Header>
                <Card.Title>User Feedback</Card.Title>
                <p className="text-sm text-gray-600 mt-1">Response quality ratings</p>
              </Card.Header>
              <Card.Body>
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-green-600 mb-2">
                      {stats?.satisfaction_rate || 0}%
                    </div>
                    <p className="text-gray-600 mb-6">Satisfaction Rate</p>
                    <div className="flex gap-8 justify-center">
                      <div className="text-center">
                        <div className="flex items-center gap-2 justify-center mb-1">
                          <ThumbsUp className="w-5 h-5 text-green-600" />
                          <span className="text-2xl font-bold text-gray-900">{stats?.helpful_responses || 0}</span>
                        </div>
                        <p className="text-sm text-gray-600">Helpful</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-2 justify-center mb-1">
                          <ThumbsDown className="w-5 h-5 text-red-600" />
                          <span className="text-2xl font-bold text-gray-900">{stats?.not_helpful_responses || 0}</span>
                        </div>
                        <p className="text-sm text-gray-600">Not Helpful</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Response Time Distribution */}
        {performance?.response_time_distribution && performance.response_time_distribution.length > 0 && (
          <Card>
            <Card.Header>
              <Card.Title>Response Time Distribution</Card.Title>
              <p className="text-sm text-gray-600 mt-1">Bot response speed breakdown</p>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performance.response_time_distribution.map((item, i) => ({
                  range: i === 0 ? '0-500ms' : i === 1 ? '500-1000ms' : i === 2 ? '1-2s' : i === 3 ? '2-5s' : i === 4 ? '5-10s' : '10s+',
                  count: item.count
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        )}

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <Card.Body>
            <h3 className="font-semibold text-blue-900 mb-2">About Chatbot Analytics</h3>
            <p className="text-sm text-blue-800">
              Real-time statistics about chatbot interactions. Use these insights to understand
              user needs and improve chatbot experience. Response times are measured in milliseconds,
              and satisfaction rates are calculated from user feedback.
            </p>
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
}
