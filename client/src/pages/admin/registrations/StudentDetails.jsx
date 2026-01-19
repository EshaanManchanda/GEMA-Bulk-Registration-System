import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdminRegistrationDetails } from '../../../hooks/useAdmin';
import { Card, Badge, Spinner, Button } from '../../../components/ui';
import { formatDate, capitalizeFirst } from '../../../utils/helpers';
import { STATUS_VARIANTS } from '../../../utils/constants';
import { ArrowLeft, User, School, Calendar, FileText, Database } from 'lucide-react';

const StudentDetails = () => {
    const { registrationId } = useParams();
    const navigate = useNavigate();
    const { data: student, isLoading, error } = useAdminRegistrationDetails(registrationId);

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center min-h-[400px]">
                    <Spinner size="xl" />
                </div>
            </AdminLayout>
        );
    }

    if (error || !student) {
        return (
            <AdminLayout>
                <Card>
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Not Found</h2>
                        <p className="text-gray-600 mb-6">The student registration you're looking for doesn't exist.</p>
                        <Button variant="primary" onClick={() => navigate(-1)}>
                            Go Back
                        </Button>
                    </div>
                </Card>
            </AdminLayout>
        );
    }

    const {
        student_name,
        grade,
        section,
        status,
        event_id: event,
        school_id: school,
        batch_id: batch,
        dynamic_data = {},
        created_at,
        registration_id
    } = student;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <button onClick={() => navigate(-1)} className="hover:text-purple-600 flex items-center gap-1">
                                <ArrowLeft className="h-3 w-3" /> Back
                            </button>
                            <span>/</span>
                            <span className="text-gray-900 font-medium">Student Details</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {student_name}
                        </h1>
                    </div>
                    <div>
                        <Badge variant={status === 'registered' ? 'success' : 'default'} size="lg">
                            {capitalizeFirst(status)}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <Card.Header>
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-gray-400" />
                                <Card.Title>Basic Information</Card.Title>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Student Name</label>
                                        <p className="text-base font-medium text-gray-900 mt-1">{student_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Registration ID</label>
                                        <p className="font-mono text-sm bg-gray-50 px-2 py-1 rounded inline-block mt-1">
                                            {registration_id}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Grade</label>
                                        <p className="text-base font-medium text-gray-900 mt-1">{grade}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Section</label>
                                        <p className="text-base font-medium text-gray-900 mt-1">{section || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Registered On</label>
                                        <p className="text-base font-medium text-gray-900 mt-1">{formatDate(created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Context Information */}
                    <Card>
                        <Card.Header>
                            <div className="flex items-center gap-2">
                                <School className="h-5 w-5 text-gray-400" />
                                <Card.Title>School & Event Context</Card.Title>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">School</label>
                                    <div className="mt-1">
                                        <p className="text-base font-medium text-gray-900">{school?.name}</p>
                                        <p className="text-sm text-gray-500">{school?.school_code}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <label className="text-sm font-medium text-gray-500">Event</label>
                                    <div className="mt-1">
                                        <Link to={`/admin/events/${event?._id}`} className="text-primary-600 hover:text-primary-800 font-medium">
                                            {event?.title}
                                        </Link>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <label className="text-sm font-medium text-gray-500">Batch</label>
                                    <div className="mt-1">
                                        <Link to={`/admin/batches/${batch?.batch_reference}`} className="text-primary-600 hover:text-primary-800 font-medium">
                                            {batch?.batch_reference}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Dynamic Registration Data */}
                    <div className="md:col-span-2">
                        <Card>
                            <Card.Header>
                                <div className="flex items-center gap-2">
                                    <Database className="h-5 w-5 text-gray-400" />
                                    <Card.Title>Registration Data</Card.Title>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {Object.keys(dynamic_data).length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {Object.entries(dynamic_data).map(([key, value]) => (
                                            <div key={key} className="bg-gray-50 p-4 rounded-lg">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                                                    {key.replace(/_/g, ' ')}
                                                </label>
                                                <p className="text-base text-gray-900 break-words">
                                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500 italic">
                                        No additional custom data found for this registration.
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default StudentDetails;
