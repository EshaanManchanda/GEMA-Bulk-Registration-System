import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { schoolRegisterSchema } from '../../../utils/validators';
import { useAuth } from '../../../context/AuthContext';
import { Button, Input, Select, Card } from '../../../components/ui';
import Stepper from '../../../components/ui/Stepper';
import { showError, showSuccess } from '../../../components/common/Toast';
import { COUNTRIES, COUNTRIES_MAP } from '../../../utils/constants';

const steps = [
  { label: 'School Info', description: 'Basic details' },
  { label: 'Contact Person', description: 'Primary contact' },
  { label: 'Address', description: 'Location details' },
];

/**
 * School Registration Page
 * Multi-step registration form for schools
 */
const SchoolRegister = () => {
  const navigate = useNavigate();
  const { registerSchool } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Transform countries for Select component
  const countryOptions = useMemo(() =>
    COUNTRIES.map(c => ({ value: c.code, label: c.name })),
  []);

  // Phone code options derived from countries
  const phoneCodeOptions = useMemo(() =>
    COUNTRIES.map(c => ({ value: c.phoneCode, label: `${c.phoneCode} (${c.name})` })),
  []);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schoolRegisterSchema),
    defaultValues: {
      name: '',
      country: '',
      contact_person_name: '',
      email: '',
      phone_country_code: '+91',
      phone: '',
      password: '',
      confirm_password: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
    },
  });

  // Auto-update phone code when country changes
  const selectedCountry = watch('country');
  const selectedCountryData = selectedCountry ? COUNTRIES_MAP[selectedCountry] : null;

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Transform flat form data to match backend schema
      const transformedData = {
        name: data.name,
        country: data.country,
        contact_person: {
          name: data.contact_person_name,
          email: data.email,
          phone: data.phone,
          phone_country_code: data.phone_country_code,
        },
        address: {
          street: data.address,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          country: data.country,
        },
        password: data.password,
        confirm_password: data.confirm_password,
      };

      await registerSchool(transformedData);
      showSuccess('Registration successful! Please check your email to verify your account.');
      navigate('/school/verify-email', { state: { email: data.email } });
    } catch (error) {
      showError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/assets/images/gema-logo.png" alt="GEMA Events" className="h-16 w-auto mx-auto mb-4" />
          <p className="text-gray-600">School Registration</p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Registration Form */}
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: School Info */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">School Information</h3>

                <Input
                  {...register('name')}
                  label="School Name"
                  placeholder="e.g., ABC International School"
                  error={errors.name?.message}
                  required
                />

                <Select
                  {...register('country')}
                  label="Country"
                  placeholder="Select country"
                  options={countryOptions}
                  error={errors.country?.message}
                  required
                />

                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={handleNext} variant="primary">
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Contact Person */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Person Details</h3>

                <Input
                  {...register('contact_person_name')}
                  label="Contact Person Name"
                  placeholder="Full name"
                  error={errors.contact_person_name?.message}
                  required
                />

                <Input
                  {...register('email')}
                  type="email"
                  label="Email Address"
                  placeholder="school@example.com"
                  helperText="This will be your login email"
                  error={errors.email?.message}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="w-36">
                      <Select
                        {...register('phone_country_code')}
                        options={phoneCodeOptions}
                        error={errors.phone_country_code?.message}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        {...register('phone')}
                        type="tel"
                        placeholder="9876543210"
                        error={errors.phone?.message}
                      />
                    </div>
                  </div>
                  {errors.phone?.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone?.message}</p>
                  )}
                </div>

                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Create a strong password"
                  helperText="At least 8 characters with uppercase, lowercase, and numbers"
                  error={errors.password?.message}
                  required
                  rightIcon={
                    showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )
                  }
                  onRightIconClick={() => setShowPassword(!showPassword)}
                />

                <Input
                  {...register('confirm_password')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  error={errors.confirm_password?.message}
                  required
                  rightIcon={
                    showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )
                  }
                  onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />

                <div className="flex justify-between pt-4">
                  <Button type="button" onClick={handlePrevious} variant="outline">
                    Previous
                  </Button>
                  <Button type="button" onClick={handleNext} variant="primary">
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Address */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address & Preferences</h3>

                <Input
                  {...register('address')}
                  label="Street Address"
                  placeholder="Street address"
                  error={errors.address?.message}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    {...register('city')}
                    label="City"
                    placeholder="City"
                    error={errors.city?.message}
                    required
                  />

                  <Input
                    {...register('state')}
                    label="State/Province"
                    placeholder="State"
                    error={errors.state?.message}
                    required
                  />
                </div>

                <Input
                  {...register('postal_code')}
                  label="Postal Code"
                  placeholder="Postal/ZIP code"
                  error={errors.postal_code?.message}
                  required
                />

                <div className="flex justify-between pt-4">
                  <Button type="button" onClick={handlePrevious} variant="outline">
                    Previous
                  </Button>
                  <Button type="submit" variant="primary" loading={isLoading}>
                    Complete Registration
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/school/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in here
            </Link>
          </div>
        </Card>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SchoolRegister;
