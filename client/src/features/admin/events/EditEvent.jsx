import React from 'react';
import { useParams } from 'react-router-dom';
import { useAdminEventDetails } from '../../../hooks/useAdmin';
import CreateEvent from './CreateEvent';
import AdminLayout from '../../../layouts/AdminLayout';
import { Spinner } from '../../../components/ui';

/**
 * Edit Event Page
 * Wrapper that reuses CreateEvent with pre-filled data
 */
const EditEvent = () => {
  const { eventId } = useParams();
  const { data, isLoading } = useAdminEventDetails(eventId);
  const event = data?.event;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="xl" />
        </div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600">The event you're trying to edit doesn't exist.</p>
        </div>
      </AdminLayout>
    );
  }

  // Prepare default values for the form
  const defaultValues = React.useMemo(() => ({
    title: event.title || '',
    event_slug: event.event_slug || '',
    category: event.category || 'olympiad',
    event_type: event.event_type || 'olympiad',
    grade_levels: event.grade_levels || [],
    short_description: event.short_description || '',
    description: event.description || '',
    schedule_type: event.schedule_type || 'date_range',
    event_start_date: event.event_start_date?.split('T')[0] || '',
    event_end_date: event.event_end_date?.split('T')[0] || '',
    event_dates: (event.schedule?.event_dates || []).map(d => ({
      ...d,
      date: d.date ? d.date.split('T')[0] : ''
    })),
    registration_start_date: event.registration_start_date?.split('T')[0] || '',
    registration_deadline: event.registration_deadline?.split('T')[0] || '',
    result_announced_date: event.result_announced_date?.split('T')[0] || '',
    base_fee_inr: event.base_fee_inr || '',
    base_fee_usd: event.base_fee_usd || '',
    max_participants: event.max_participants || '',
    form_schema: event.form_schema || [],
    bulk_discount_rules: event.bulk_discount_rules || [],
    status: event.status || 'draft',
    banner_url: event.banner_image_url || null,
    posters: event.posters || [],
    brochures: event.brochures || [],
    notice_url: event.notice_url || null,
    is_featured: event.is_featured || false,
    rules_document_url: event.rules_document_url || '',
    // Certificate Configuration
    certificate_config_india: event.certificate_config_india || {
      enabled: false,
      website_url: '',
      certificate_issuance_url: '',
      health_check_url: '',
      key_validation_url: '',
      api_key: '',
      template_id: '',
      auto_generate: false,
    },
    certificate_config_international: event.certificate_config_international || {
      enabled: false,
      website_url: '',
      certificate_issuance_url: '',
      health_check_url: '',
      key_validation_url: '',
      api_key: '',
      template_id: '',
      auto_generate: false,
    },
  }), [event]);

  return <CreateEvent mode="edit" eventId={eventId} defaultValues={defaultValues} />;
};

export default EditEvent;
