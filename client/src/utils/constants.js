/**
 * Frontend Constants
 * Matches backend constants for consistency
 */

// ===================================
// USER ROLES
// ===================================
export const ROLES = {
  SCHOOL: 'school',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  MODERATOR: 'moderator',
};

// ===================================
// EVENT STATUS
// ===================================
export const EVENT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
};

// ===================================
// EVENT TYPES
// ===================================
export const EVENT_TYPES = {
  EXAM: 'exam',
  OLYMPIAD: 'olympiad',
  CHAMPIONSHIP: 'championship',
  COMPETITION: 'competition',
  WORKSHOP: 'workshop',
  SUBMISSION_ONLY: 'submission_only',
  OTHER: 'other',
};

export const EVENT_TYPE_LABELS = {
  exam: { label: 'Exam', icon: '📝', description: 'Single-date examination' },
  olympiad: { label: 'Olympiad', icon: '🏆', description: 'Academic competition' },
  championship: { label: 'Championship', icon: '🥇', description: 'Multi-day event' },
  competition: { label: 'Competition', icon: '🎯', description: 'General competition' },
  workshop: { label: 'Workshop', icon: '🎓', description: 'Learning workshop' },
  submission_only: { label: 'Submission Only', icon: '📤', description: 'No event date' },
  other: { label: 'Other', icon: '📌', description: 'Other event type' },
};

// ===================================
// GRADE LEVELS
// ===================================
export const GRADE_LEVELS = [
  { value: 'below_1', label: 'Below Grade 1' },
  { value: '1', label: 'Grade 1' },
  { value: '2', label: 'Grade 2' },
  { value: '3', label: 'Grade 3' },
  { value: '4', label: 'Grade 4' },
  { value: '5', label: 'Grade 5' },
  { value: '6', label: 'Grade 6' },
  { value: '7', label: 'Grade 7' },
  { value: '8', label: 'Grade 8' },
  { value: '9', label: 'Grade 9' },
  { value: '10', label: 'Grade 10' },
  { value: '11', label: 'Grade 11' },
  { value: '12', label: 'Grade 12' },
];

// ===================================
// BATCH STATUS
// ===================================
export const BATCH_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

// ===================================
// PAYMENT STATUS
// ===================================
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PENDING_VERIFICATION: 'pending_verification',
};

// ===================================
// PAYMENT MODE
// ===================================
export const PAYMENT_MODE = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
};

// ===================================
// PAYMENT GATEWAYS
// ===================================
export const PAYMENT_GATEWAY = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe',
  BANK_TRANSFER: 'bank_transfer',
};

// ===================================
// COUNTRIES (Full ISO 3166-1 list, sorted A-Z)
// ===================================
export const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', currency: 'USD', phoneCode: '+93' },
  { code: 'AL', name: 'Albania', currency: 'USD', phoneCode: '+355' },
  { code: 'DZ', name: 'Algeria', currency: 'USD', phoneCode: '+213' },
  { code: 'AD', name: 'Andorra', currency: 'USD', phoneCode: '+376' },
  { code: 'AO', name: 'Angola', currency: 'USD', phoneCode: '+244' },
  { code: 'AG', name: 'Antigua and Barbuda', currency: 'USD', phoneCode: '+1-268' },
  { code: 'AR', name: 'Argentina', currency: 'USD', phoneCode: '+54' },
  { code: 'AM', name: 'Armenia', currency: 'USD', phoneCode: '+374' },
  { code: 'AU', name: 'Australia', currency: 'USD', phoneCode: '+61' },
  { code: 'AT', name: 'Austria', currency: 'USD', phoneCode: '+43' },
  { code: 'AZ', name: 'Azerbaijan', currency: 'USD', phoneCode: '+994' },
  { code: 'BS', name: 'Bahamas', currency: 'USD', phoneCode: '+1-242' },
  { code: 'BH', name: 'Bahrain', currency: 'USD', phoneCode: '+973' },
  { code: 'BD', name: 'Bangladesh', currency: 'USD', phoneCode: '+880' },
  { code: 'BB', name: 'Barbados', currency: 'USD', phoneCode: '+1-246' },
  { code: 'BY', name: 'Belarus', currency: 'USD', phoneCode: '+375' },
  { code: 'BE', name: 'Belgium', currency: 'USD', phoneCode: '+32' },
  { code: 'BZ', name: 'Belize', currency: 'USD', phoneCode: '+501' },
  { code: 'BJ', name: 'Benin', currency: 'USD', phoneCode: '+229' },
  { code: 'BT', name: 'Bhutan', currency: 'USD', phoneCode: '+975' },
  { code: 'BO', name: 'Bolivia', currency: 'USD', phoneCode: '+591' },
  { code: 'BA', name: 'Bosnia and Herzegovina', currency: 'USD', phoneCode: '+387' },
  { code: 'BW', name: 'Botswana', currency: 'USD', phoneCode: '+267' },
  { code: 'BR', name: 'Brazil', currency: 'USD', phoneCode: '+55' },
  { code: 'BN', name: 'Brunei', currency: 'USD', phoneCode: '+673' },
  { code: 'BG', name: 'Bulgaria', currency: 'USD', phoneCode: '+359' },
  { code: 'BF', name: 'Burkina Faso', currency: 'USD', phoneCode: '+226' },
  { code: 'BI', name: 'Burundi', currency: 'USD', phoneCode: '+257' },
  { code: 'CV', name: 'Cabo Verde', currency: 'USD', phoneCode: '+238' },
  { code: 'KH', name: 'Cambodia', currency: 'USD', phoneCode: '+855' },
  { code: 'CM', name: 'Cameroon', currency: 'USD', phoneCode: '+237' },
  { code: 'CA', name: 'Canada', currency: 'USD', phoneCode: '+1' },
  { code: 'CF', name: 'Central African Republic', currency: 'USD', phoneCode: '+236' },
  { code: 'TD', name: 'Chad', currency: 'USD', phoneCode: '+235' },
  { code: 'CL', name: 'Chile', currency: 'USD', phoneCode: '+56' },
  { code: 'CN', name: 'China', currency: 'USD', phoneCode: '+86' },
  { code: 'CO', name: 'Colombia', currency: 'USD', phoneCode: '+57' },
  { code: 'KM', name: 'Comoros', currency: 'USD', phoneCode: '+269' },
  { code: 'CG', name: 'Congo', currency: 'USD', phoneCode: '+242' },
  { code: 'CD', name: 'Congo (DRC)', currency: 'USD', phoneCode: '+243' },
  { code: 'CR', name: 'Costa Rica', currency: 'USD', phoneCode: '+506' },
  { code: 'HR', name: 'Croatia', currency: 'USD', phoneCode: '+385' },
  { code: 'CU', name: 'Cuba', currency: 'USD', phoneCode: '+53' },
  { code: 'CY', name: 'Cyprus', currency: 'USD', phoneCode: '+357' },
  { code: 'CZ', name: 'Czech Republic', currency: 'USD', phoneCode: '+420' },
  { code: 'DK', name: 'Denmark', currency: 'USD', phoneCode: '+45' },
  { code: 'DJ', name: 'Djibouti', currency: 'USD', phoneCode: '+253' },
  { code: 'DM', name: 'Dominica', currency: 'USD', phoneCode: '+1-767' },
  { code: 'DO', name: 'Dominican Republic', currency: 'USD', phoneCode: '+1-809' },
  { code: 'EC', name: 'Ecuador', currency: 'USD', phoneCode: '+593' },
  { code: 'EG', name: 'Egypt', currency: 'USD', phoneCode: '+20' },
  { code: 'SV', name: 'El Salvador', currency: 'USD', phoneCode: '+503' },
  { code: 'GQ', name: 'Equatorial Guinea', currency: 'USD', phoneCode: '+240' },
  { code: 'ER', name: 'Eritrea', currency: 'USD', phoneCode: '+291' },
  { code: 'EE', name: 'Estonia', currency: 'USD', phoneCode: '+372' },
  { code: 'SZ', name: 'Eswatini', currency: 'USD', phoneCode: '+268' },
  { code: 'ET', name: 'Ethiopia', currency: 'USD', phoneCode: '+251' },
  { code: 'FJ', name: 'Fiji', currency: 'USD', phoneCode: '+679' },
  { code: 'FI', name: 'Finland', currency: 'USD', phoneCode: '+358' },
  { code: 'FR', name: 'France', currency: 'USD', phoneCode: '+33' },
  { code: 'GA', name: 'Gabon', currency: 'USD', phoneCode: '+241' },
  { code: 'GM', name: 'Gambia', currency: 'USD', phoneCode: '+220' },
  { code: 'GE', name: 'Georgia', currency: 'USD', phoneCode: '+995' },
  { code: 'DE', name: 'Germany', currency: 'USD', phoneCode: '+49' },
  { code: 'GH', name: 'Ghana', currency: 'USD', phoneCode: '+233' },
  { code: 'GR', name: 'Greece', currency: 'USD', phoneCode: '+30' },
  { code: 'GD', name: 'Grenada', currency: 'USD', phoneCode: '+1-473' },
  { code: 'GT', name: 'Guatemala', currency: 'USD', phoneCode: '+502' },
  { code: 'GN', name: 'Guinea', currency: 'USD', phoneCode: '+224' },
  { code: 'GW', name: 'Guinea-Bissau', currency: 'USD', phoneCode: '+245' },
  { code: 'GY', name: 'Guyana', currency: 'USD', phoneCode: '+592' },
  { code: 'HT', name: 'Haiti', currency: 'USD', phoneCode: '+509' },
  { code: 'HN', name: 'Honduras', currency: 'USD', phoneCode: '+504' },
  { code: 'HU', name: 'Hungary', currency: 'USD', phoneCode: '+36' },
  { code: 'IS', name: 'Iceland', currency: 'USD', phoneCode: '+354' },
  { code: 'IN', name: 'India', currency: 'INR', phoneCode: '+91' },
  { code: 'ID', name: 'Indonesia', currency: 'USD', phoneCode: '+62' },
  { code: 'IR', name: 'Iran', currency: 'USD', phoneCode: '+98' },
  { code: 'IQ', name: 'Iraq', currency: 'USD', phoneCode: '+964' },
  { code: 'IE', name: 'Ireland', currency: 'USD', phoneCode: '+353' },
  { code: 'IL', name: 'Israel', currency: 'USD', phoneCode: '+972' },
  { code: 'IT', name: 'Italy', currency: 'USD', phoneCode: '+39' },
  { code: 'CI', name: 'Ivory Coast', currency: 'USD', phoneCode: '+225' },
  { code: 'JM', name: 'Jamaica', currency: 'USD', phoneCode: '+1-876' },
  { code: 'JP', name: 'Japan', currency: 'USD', phoneCode: '+81' },
  { code: 'JO', name: 'Jordan', currency: 'USD', phoneCode: '+962' },
  { code: 'KZ', name: 'Kazakhstan', currency: 'USD', phoneCode: '+7' },
  { code: 'KE', name: 'Kenya', currency: 'USD', phoneCode: '+254' },
  { code: 'KI', name: 'Kiribati', currency: 'USD', phoneCode: '+686' },
  { code: 'KP', name: 'Korea (North)', currency: 'USD', phoneCode: '+850' },
  { code: 'KR', name: 'Korea (South)', currency: 'USD', phoneCode: '+82' },
  { code: 'KW', name: 'Kuwait', currency: 'USD', phoneCode: '+965' },
  { code: 'KG', name: 'Kyrgyzstan', currency: 'USD', phoneCode: '+996' },
  { code: 'LA', name: 'Laos', currency: 'USD', phoneCode: '+856' },
  { code: 'LV', name: 'Latvia', currency: 'USD', phoneCode: '+371' },
  { code: 'LB', name: 'Lebanon', currency: 'USD', phoneCode: '+961' },
  { code: 'LS', name: 'Lesotho', currency: 'USD', phoneCode: '+266' },
  { code: 'LR', name: 'Liberia', currency: 'USD', phoneCode: '+231' },
  { code: 'LY', name: 'Libya', currency: 'USD', phoneCode: '+218' },
  { code: 'LI', name: 'Liechtenstein', currency: 'USD', phoneCode: '+423' },
  { code: 'LT', name: 'Lithuania', currency: 'USD', phoneCode: '+370' },
  { code: 'LU', name: 'Luxembourg', currency: 'USD', phoneCode: '+352' },
  { code: 'MG', name: 'Madagascar', currency: 'USD', phoneCode: '+261' },
  { code: 'MW', name: 'Malawi', currency: 'USD', phoneCode: '+265' },
  { code: 'MY', name: 'Malaysia', currency: 'USD', phoneCode: '+60' },
  { code: 'MV', name: 'Maldives', currency: 'USD', phoneCode: '+960' },
  { code: 'ML', name: 'Mali', currency: 'USD', phoneCode: '+223' },
  { code: 'MT', name: 'Malta', currency: 'USD', phoneCode: '+356' },
  { code: 'MH', name: 'Marshall Islands', currency: 'USD', phoneCode: '+692' },
  { code: 'MR', name: 'Mauritania', currency: 'USD', phoneCode: '+222' },
  { code: 'MU', name: 'Mauritius', currency: 'USD', phoneCode: '+230' },
  { code: 'MX', name: 'Mexico', currency: 'USD', phoneCode: '+52' },
  { code: 'FM', name: 'Micronesia', currency: 'USD', phoneCode: '+691' },
  { code: 'MD', name: 'Moldova', currency: 'USD', phoneCode: '+373' },
  { code: 'MC', name: 'Monaco', currency: 'USD', phoneCode: '+377' },
  { code: 'MN', name: 'Mongolia', currency: 'USD', phoneCode: '+976' },
  { code: 'ME', name: 'Montenegro', currency: 'USD', phoneCode: '+382' },
  { code: 'MA', name: 'Morocco', currency: 'USD', phoneCode: '+212' },
  { code: 'MZ', name: 'Mozambique', currency: 'USD', phoneCode: '+258' },
  { code: 'MM', name: 'Myanmar', currency: 'USD', phoneCode: '+95' },
  { code: 'NA', name: 'Namibia', currency: 'USD', phoneCode: '+264' },
  { code: 'NR', name: 'Nauru', currency: 'USD', phoneCode: '+674' },
  { code: 'NP', name: 'Nepal', currency: 'USD', phoneCode: '+977' },
  { code: 'NL', name: 'Netherlands', currency: 'USD', phoneCode: '+31' },
  { code: 'NZ', name: 'New Zealand', currency: 'USD', phoneCode: '+64' },
  { code: 'NI', name: 'Nicaragua', currency: 'USD', phoneCode: '+505' },
  { code: 'NE', name: 'Niger', currency: 'USD', phoneCode: '+227' },
  { code: 'NG', name: 'Nigeria', currency: 'USD', phoneCode: '+234' },
  { code: 'MK', name: 'North Macedonia', currency: 'USD', phoneCode: '+389' },
  { code: 'NO', name: 'Norway', currency: 'USD', phoneCode: '+47' },
  { code: 'OM', name: 'Oman', currency: 'USD', phoneCode: '+968' },
  { code: 'PK', name: 'Pakistan', currency: 'USD', phoneCode: '+92' },
  { code: 'PW', name: 'Palau', currency: 'USD', phoneCode: '+680' },
  { code: 'PS', name: 'Palestine', currency: 'USD', phoneCode: '+970' },
  { code: 'PA', name: 'Panama', currency: 'USD', phoneCode: '+507' },
  { code: 'PG', name: 'Papua New Guinea', currency: 'USD', phoneCode: '+675' },
  { code: 'PY', name: 'Paraguay', currency: 'USD', phoneCode: '+595' },
  { code: 'PE', name: 'Peru', currency: 'USD', phoneCode: '+51' },
  { code: 'PH', name: 'Philippines', currency: 'USD', phoneCode: '+63' },
  { code: 'PL', name: 'Poland', currency: 'USD', phoneCode: '+48' },
  { code: 'PT', name: 'Portugal', currency: 'USD', phoneCode: '+351' },
  { code: 'QA', name: 'Qatar', currency: 'USD', phoneCode: '+974' },
  { code: 'RO', name: 'Romania', currency: 'USD', phoneCode: '+40' },
  { code: 'RU', name: 'Russia', currency: 'USD', phoneCode: '+7' },
  { code: 'RW', name: 'Rwanda', currency: 'USD', phoneCode: '+250' },
  { code: 'KN', name: 'Saint Kitts and Nevis', currency: 'USD', phoneCode: '+1-869' },
  { code: 'LC', name: 'Saint Lucia', currency: 'USD', phoneCode: '+1-758' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', currency: 'USD', phoneCode: '+1-784' },
  { code: 'WS', name: 'Samoa', currency: 'USD', phoneCode: '+685' },
  { code: 'SM', name: 'San Marino', currency: 'USD', phoneCode: '+378' },
  { code: 'ST', name: 'Sao Tome and Principe', currency: 'USD', phoneCode: '+239' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'USD', phoneCode: '+966' },
  { code: 'SN', name: 'Senegal', currency: 'USD', phoneCode: '+221' },
  { code: 'RS', name: 'Serbia', currency: 'USD', phoneCode: '+381' },
  { code: 'SC', name: 'Seychelles', currency: 'USD', phoneCode: '+248' },
  { code: 'SL', name: 'Sierra Leone', currency: 'USD', phoneCode: '+232' },
  { code: 'SG', name: 'Singapore', currency: 'USD', phoneCode: '+65' },
  { code: 'SK', name: 'Slovakia', currency: 'USD', phoneCode: '+421' },
  { code: 'SI', name: 'Slovenia', currency: 'USD', phoneCode: '+386' },
  { code: 'SB', name: 'Solomon Islands', currency: 'USD', phoneCode: '+677' },
  { code: 'SO', name: 'Somalia', currency: 'USD', phoneCode: '+252' },
  { code: 'ZA', name: 'South Africa', currency: 'USD', phoneCode: '+27' },
  { code: 'SS', name: 'South Sudan', currency: 'USD', phoneCode: '+211' },
  { code: 'ES', name: 'Spain', currency: 'USD', phoneCode: '+34' },
  { code: 'LK', name: 'Sri Lanka', currency: 'USD', phoneCode: '+94' },
  { code: 'SD', name: 'Sudan', currency: 'USD', phoneCode: '+249' },
  { code: 'SR', name: 'Suriname', currency: 'USD', phoneCode: '+597' },
  { code: 'SE', name: 'Sweden', currency: 'USD', phoneCode: '+46' },
  { code: 'CH', name: 'Switzerland', currency: 'USD', phoneCode: '+41' },
  { code: 'SY', name: 'Syria', currency: 'USD', phoneCode: '+963' },
  { code: 'TW', name: 'Taiwan', currency: 'USD', phoneCode: '+886' },
  { code: 'TJ', name: 'Tajikistan', currency: 'USD', phoneCode: '+992' },
  { code: 'TZ', name: 'Tanzania', currency: 'USD', phoneCode: '+255' },
  { code: 'TH', name: 'Thailand', currency: 'USD', phoneCode: '+66' },
  { code: 'TL', name: 'Timor-Leste', currency: 'USD', phoneCode: '+670' },
  { code: 'TG', name: 'Togo', currency: 'USD', phoneCode: '+228' },
  { code: 'TO', name: 'Tonga', currency: 'USD', phoneCode: '+676' },
  { code: 'TT', name: 'Trinidad and Tobago', currency: 'USD', phoneCode: '+1-868' },
  { code: 'TN', name: 'Tunisia', currency: 'USD', phoneCode: '+216' },
  { code: 'TR', name: 'Turkey', currency: 'USD', phoneCode: '+90' },
  { code: 'TM', name: 'Turkmenistan', currency: 'USD', phoneCode: '+993' },
  { code: 'TV', name: 'Tuvalu', currency: 'USD', phoneCode: '+688' },
  { code: 'UG', name: 'Uganda', currency: 'USD', phoneCode: '+256' },
  { code: 'UA', name: 'Ukraine', currency: 'USD', phoneCode: '+380' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'USD', phoneCode: '+971' },
  { code: 'GB', name: 'United Kingdom', currency: 'USD', phoneCode: '+44' },
  { code: 'US', name: 'United States', currency: 'USD', phoneCode: '+1' },
  { code: 'UY', name: 'Uruguay', currency: 'USD', phoneCode: '+598' },
  { code: 'UZ', name: 'Uzbekistan', currency: 'USD', phoneCode: '+998' },
  { code: 'VU', name: 'Vanuatu', currency: 'USD', phoneCode: '+678' },
  { code: 'VA', name: 'Vatican City', currency: 'USD', phoneCode: '+379' },
  { code: 'VE', name: 'Venezuela', currency: 'USD', phoneCode: '+58' },
  { code: 'VN', name: 'Vietnam', currency: 'USD', phoneCode: '+84' },
  { code: 'YE', name: 'Yemen', currency: 'USD', phoneCode: '+967' },
  { code: 'ZM', name: 'Zambia', currency: 'USD', phoneCode: '+260' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'USD', phoneCode: '+263' },
];

// Country lookup map by code
export const COUNTRIES_MAP = COUNTRIES.reduce((acc, country) => {
  acc[country.code] = country;
  return acc;
}, {});

// Phone codes list for dropdown
export const PHONE_CODES = COUNTRIES.map(c => ({
  code: c.code,
  phoneCode: c.phoneCode,
  label: `${c.phoneCode} (${c.name})`
}));

// ===================================
// CURRENCIES
// ===================================
export const CURRENCIES = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
  },
};

export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
};

// ===================================
// SCHOOL STATUS
// ===================================
export const SCHOOL_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
};

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// ===================================
// FORM FIELD TYPES
// ===================================
export const FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  EMAIL: 'email',
  DATE: 'date',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  CHECKBOX: 'checkbox',
  FILE: 'file',
  URL: 'url',
};

// ===================================
// FILE TYPES
// ===================================
export const ALLOWED_FILE_TYPES = {
  CSV: [
    'text/csv',
    'text/plain',
    'application/csv',
  ],
  EXCEL: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ],
  SPREADSHEET: [
    'text/csv',
    'text/plain',
    'application/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ],
  IMAGE: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
  PDF: ['application/pdf'],
};

export const FILE_EXTENSIONS = {
  CSV: ['.csv'],
  EXCEL: ['.xlsx', '.xls'],
  SPREADSHEET: ['.csv', '.xlsx', '.xls'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  PDF: ['.pdf'],
};

// ===================================
// FILE SIZE LIMITS (in bytes)
// ===================================
export const FILE_SIZE_LIMITS = {
  CSV: 20 * 1024 * 1024, // 20MB
  EXCEL: 20 * 1024 * 1024, // 20MB
  SPREADSHEET: 20 * 1024 * 1024, // 20MB
  IMAGE: 20 * 1024 * 1024, // 20MB
  PDF: 20 * 1024 * 1024, // 20MB
};

// ===================================
// PAGINATION
// ===================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// ===================================
// STATUS COLORS (Tailwind classes)
// ===================================
export const STATUS_COLORS = {
  // Event Status
  [EVENT_STATUS.DRAFT]: 'text-gray-600 bg-gray-100',
  [EVENT_STATUS.ACTIVE]: 'text-green-600 bg-green-100',
  [EVENT_STATUS.CLOSED]: 'text-red-600 bg-red-100',
  [EVENT_STATUS.ARCHIVED]: 'text-gray-600 bg-gray-100',

  // Batch Status
  [BATCH_STATUS.DRAFT]: 'text-gray-600 bg-gray-100',
  [BATCH_STATUS.SUBMITTED]: 'text-blue-600 bg-blue-100',
  [BATCH_STATUS.CONFIRMED]: 'text-green-600 bg-green-100',
  [BATCH_STATUS.CANCELLED]: 'text-red-600 bg-red-100',

  // Payment Status
  [PAYMENT_STATUS.PENDING]: 'text-yellow-600 bg-yellow-100',
  [PAYMENT_STATUS.PROCESSING]: 'text-blue-600 bg-blue-100',
  [PAYMENT_STATUS.COMPLETED]: 'text-green-600 bg-green-100',
  [PAYMENT_STATUS.FAILED]: 'text-red-600 bg-red-100',
  [PAYMENT_STATUS.REFUNDED]: 'text-orange-600 bg-orange-100',
  [PAYMENT_STATUS.PENDING_VERIFICATION]: 'text-yellow-600 bg-yellow-100',

  // School Status
  [SCHOOL_STATUS.ACTIVE]: 'text-green-600 bg-green-100',
  [SCHOOL_STATUS.SUSPENDED]: 'text-red-600 bg-red-100',
  [SCHOOL_STATUS.INACTIVE]: 'text-gray-600 bg-gray-100',

  // Approval Status
  [APPROVAL_STATUS.PENDING]: 'text-yellow-600 bg-yellow-100',
  [APPROVAL_STATUS.APPROVED]: 'text-green-600 bg-green-100',
  [APPROVAL_STATUS.REJECTED]: 'text-red-600 bg-red-100',
};

// ===================================
// STATUS VARIANTS (for Badge component)
// ===================================
export const STATUS_VARIANTS = {
  // Event Status
  [EVENT_STATUS.DRAFT]: 'info',
  [EVENT_STATUS.ACTIVE]: 'success',
  [EVENT_STATUS.CLOSED]: 'error',
  [EVENT_STATUS.ARCHIVED]: 'info',

  // Batch Status
  [BATCH_STATUS.DRAFT]: 'info',
  [BATCH_STATUS.SUBMITTED]: 'warning',
  [BATCH_STATUS.CONFIRMED]: 'success',
  [BATCH_STATUS.CANCELLED]: 'error',

  // Payment Status
  [PAYMENT_STATUS.PENDING]: 'warning',
  [PAYMENT_STATUS.PROCESSING]: 'info',
  [PAYMENT_STATUS.COMPLETED]: 'success',
  [PAYMENT_STATUS.FAILED]: 'error',
  [PAYMENT_STATUS.REFUNDED]: 'warning', // Orange is usually warning/info
  [PAYMENT_STATUS.PENDING_VERIFICATION]: 'warning',

  // School Status
  [SCHOOL_STATUS.ACTIVE]: 'success',
  [SCHOOL_STATUS.SUSPENDED]: 'error',
  [SCHOOL_STATUS.INACTIVE]: 'info',

  // Approval Status
  [APPROVAL_STATUS.PENDING]: 'warning',
  [APPROVAL_STATUS.APPROVED]: 'success',
  [APPROVAL_STATUS.REJECTED]: 'error',
};

// ===================================
// BADGE CLASSES (from global.css)
// ===================================
export const BADGE_CLASSES = {
  SUCCESS: 'badge-success',
  WARNING: 'badge-warning',
  ERROR: 'badge-error',
  INFO: 'badge-info',
};

// ===================================
// DATE FORMATS
// ===================================
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy', // Jan 15, 2024
  DISPLAY_LONG: 'MMMM dd, yyyy', // January 15, 2024
  DISPLAY_WITH_TIME: 'MMM dd, yyyy hh:mm a', // Jan 15, 2024 02:30 PM
  INPUT: 'yyyy-MM-dd', // 2024-01-15 (for date inputs)
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", // ISO 8601
};

// ===================================
// VALIDATION PATTERNS
// ===================================
export const VALIDATION_PATTERNS = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE: /^[+]?[0-9]{10,15}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  SCHOOL_CODE: /^[A-Z0-9]{6}$/,
  POSTAL_CODE: /^[0-9]{5,10}$/,
};

// ===================================
// LOCAL STORAGE KEYS
// ===================================
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  AUTH_STORAGE: 'auth-storage',
};

// ===================================
// API RESPONSE CODES
// ===================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
};

// ===================================
// COUNTRY-CURRENCY MAPPING (Common)
// ===================================
export const COUNTRY_CURRENCY_MAP = COUNTRIES.reduce((acc, country) => {
  acc[country.code] = country.currency === 'INR' ? CURRENCIES.INR : CURRENCIES.USD;
  return acc;
}, {});

// ===================================
// EXPORT ALL
// ===================================
export default {
  ROLES,
  EVENT_STATUS,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  GRADE_LEVELS,
  BATCH_STATUS,
  PAYMENT_STATUS,
  PAYMENT_MODE,
  PAYMENT_GATEWAY,
  CURRENCIES,
  CURRENCY_SYMBOLS,
  SCHOOL_STATUS,
  APPROVAL_STATUS,
  FIELD_TYPES,
  ALLOWED_FILE_TYPES,
  FILE_EXTENSIONS,
  FILE_SIZE_LIMITS,
  PAGINATION,
  STATUS_COLORS,
  STATUS_VARIANTS,
  BADGE_CLASSES,
  DATE_FORMATS,
  VALIDATION_PATTERNS,
  STORAGE_KEYS,
  HTTP_STATUS,
  COUNTRY_CURRENCY_MAP,
};
