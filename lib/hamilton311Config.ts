/**
 * Waterloo 311 Service Request Configuration
 * Pre-configured categories, form fields, and submission instructions
 */

export interface Category311 {
    id: string;
    name: string;
    description: string;
    icon: string;
    subcategories: string[];
    formFields: FormField[];
    submissionSteps: string[];
}

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    required: boolean;
    placeholder?: string;
    options?: string[];
}

export interface GeneratedForm {
    category: string;
    subcategory: string;
    location: string;
    description: string;
    additionalDetails?: string;
    contactInfo?: string;
}

// Waterloo 311 official website
export const HAMILTON_311_URL = 'https://www.hamilton.ca/home-neighbourhood/get-help-city-services/report-problem-311';

// Common form fields for all categories
const COMMON_FIELDS: FormField[] = [
    { name: 'location', label: 'Location', type: 'text', required: true, placeholder: 'Street address or intersection' },
    { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the issue in detail' },
];

// Waterloo 311 Categories
export const CATEGORIES: Category311[] = [
    {
        id: 'road-hazard',
        name: 'Road Hazard',
        description: 'Potholes, road damage, debris',
        icon: '🚧',
        subcategories: ['Pothole', 'Road Crack', 'Debris on Road', 'Road Flooding', 'Other Road Hazard'],
        formFields: [
            { name: 'subcategory', label: 'Type of Hazard', type: 'select', required: true, options: ['Pothole', 'Road Crack', 'Debris on Road', 'Road Flooding', 'Other'] },
            ...COMMON_FIELDS,
            { name: 'laneAffected', label: 'Lane Affected', type: 'select', required: false, options: ['Left Lane', 'Right Lane', 'Center Lane', 'All Lanes', 'Shoulder'] },
        ],
        submissionSteps: [
            'Go to hamilton.ca/311 or call 905-546-CITY (2489)',
            'Select "Roads & Traffic" from the category menu',
            'Choose "Road Hazard" or "Pothole" as the issue type',
            'Enter the exact location (street address or nearest intersection)',
            'Paste the description in the details field',
            'Add any photos if available',
            'Submit and save your confirmation number',
        ],
    },
    {
        id: 'traffic',
        name: 'Traffic Issue',
        description: 'Signals, signs, congestion',
        icon: '🚦',
        subcategories: ['Broken Traffic Light', 'Missing Sign', 'Damaged Sign', 'Traffic Congestion', 'Crosswalk Issue'],
        formFields: [
            { name: 'subcategory', label: 'Type of Issue', type: 'select', required: true, options: ['Broken Traffic Light', 'Missing Sign', 'Damaged Sign', 'Crosswalk Issue', 'Other'] },
            ...COMMON_FIELDS,
            { name: 'intersection', label: 'Intersection', type: 'text', required: false, placeholder: 'Cross streets if applicable' },
        ],
        submissionSteps: [
            'Go to hamilton.ca/311 or call 905-546-CITY (2489)',
            'Select "Roads & Traffic" from the category menu',
            'Choose "Traffic Signal" or "Sign" as the issue type',
            'Provide the exact intersection or location',
            'Describe what is malfunctioning or missing',
            'Include time of day the issue was observed',
            'Submit and save your confirmation number',
        ],
    },
    {
        id: 'streetlight',
        name: 'Streetlight',
        description: 'Broken or flickering lights',
        icon: '💡',
        subcategories: ['Light Out', 'Flickering Light', 'Light On During Day', 'Damaged Pole'],
        formFields: [
            { name: 'subcategory', label: 'Type of Issue', type: 'select', required: true, options: ['Light Out', 'Flickering', 'On During Day', 'Damaged Pole'] },
            ...COMMON_FIELDS,
            { name: 'poleNumber', label: 'Pole Number (if visible)', type: 'text', required: false, placeholder: 'Found on metal tag on pole' },
        ],
        submissionSteps: [
            'Go to hamilton.ca/311 or call 905-546-CITY (2489)',
            'Select "Roads & Traffic" category',
            'Choose "Street Lighting" as the issue type',
            'Enter the exact address nearest to the streetlight',
            'Include the pole number if visible (metal tag on pole)',
            'Describe the issue (not working, flickering, etc.)',
            'Submit and save your confirmation number',
        ],
    },
    {
        id: 'sidewalk',
        name: 'Sidewalk',
        description: 'Cracks, damage, obstructions',
        icon: '🚶',
        subcategories: ['Cracked Sidewalk', 'Raised Sidewalk', 'Missing Section', 'Obstruction'],
        formFields: [
            { name: 'subcategory', label: 'Type of Issue', type: 'select', required: true, options: ['Cracked', 'Raised/Uneven', 'Missing Section', 'Obstruction', 'Other'] },
            ...COMMON_FIELDS,
            { name: 'hazardLevel', label: 'Hazard Level', type: 'select', required: false, options: ['Minor', 'Moderate', 'Severe - Tripping Hazard'] },
        ],
        submissionSteps: [
            'Go to hamilton.ca/311 or call 905-546-CITY (2489)',
            'Select "Roads & Traffic" category',
            'Choose "Sidewalk" as the issue type',
            'Provide the exact address where the damage is located',
            'Describe the severity and nature of the damage',
            'Mention if it poses a tripping hazard',
            'Submit and save your confirmation number',
        ],
    },
    {
        id: 'graffiti',
        name: 'Graffiti',
        description: 'Vandalism on public property',
        icon: '🎨',
        subcategories: ['On Building', 'On Sign', 'On Bridge/Overpass', 'On Utility Box'],
        formFields: [
            { name: 'subcategory', label: 'Location Type', type: 'select', required: true, options: ['Building', 'Sign', 'Bridge/Overpass', 'Utility Box', 'Other'] },
            ...COMMON_FIELDS,
            { name: 'offensive', label: 'Is it offensive?', type: 'select', required: false, options: ['Yes - Offensive/Hateful', 'No - Not Offensive'] },
        ],
        submissionSteps: [
            'Go to hamilton.ca/311 or call 905-546-CITY (2489)',
            'Select "Property & Environment" category',
            'Choose "Graffiti" as the issue type',
            'Enter the exact address or location',
            'Indicate if the graffiti is on public or private property',
            'Note if the content is offensive (prioritized for removal)',
            'Submit and save your confirmation number',
        ],
    },
    {
        id: 'litter',
        name: 'Litter & Dumping',
        description: 'Garbage, illegal dumping',
        icon: '🗑️',
        subcategories: ['Litter', 'Illegal Dumping', 'Overflowing Bin', 'Dead Animal'],
        formFields: [
            { name: 'subcategory', label: 'Type of Issue', type: 'select', required: true, options: ['Litter', 'Illegal Dumping', 'Overflowing Public Bin', 'Dead Animal', 'Other'] },
            ...COMMON_FIELDS,
            { name: 'quantity', label: 'Quantity', type: 'select', required: false, options: ['Small (bag size)', 'Medium (several bags)', 'Large (requires truck)'] },
        ],
        submissionSteps: [
            'Go to hamilton.ca/311 or call 905-546-CITY (2489)',
            'Select "Garbage & Recycling" category',
            'Choose "Litter" or "Illegal Dumping" as appropriate',
            'Provide the exact location of the waste',
            'Describe the type and approximate quantity',
            'Note any hazardous materials if present',
            'Submit and save your confirmation number',
        ],
    },
    {
        id: 'noise',
        name: 'Noise Complaint',
        description: 'Excessive noise disturbances',
        icon: '🔊',
        subcategories: ['Construction Noise', 'Loud Music', 'Vehicle Noise', 'Commercial Noise'],
        formFields: [
            { name: 'subcategory', label: 'Type of Noise', type: 'select', required: true, options: ['Construction', 'Loud Music/Party', 'Vehicle', 'Commercial/Industrial', 'Other'] },
            ...COMMON_FIELDS,
            { name: 'timeOfDay', label: 'Time of Disturbance', type: 'text', required: false, placeholder: 'e.g., 11pm - 2am' },
        ],
        submissionSteps: [
            'Go to hamilton.ca/311 or call 905-546-CITY (2489)',
            'Select "Bylaw & Licensing" category',
            'Choose "Noise Complaint" as the issue type',
            'Enter the address where the noise is coming from',
            'Describe the type of noise and duration',
            'Include the times when noise typically occurs',
            'Submit and save your confirmation number',
        ],
    },
];

// Get category by ID
export function getCategoryById(id: string): Category311 | undefined {
    return CATEGORIES.find(c => c.id === id);
}

// Get category by name (case-insensitive)
export function getCategoryByName(name: string): Category311 | undefined {
    const lower = name.toLowerCase();
    return CATEGORIES.find(c =>
        c.name.toLowerCase().includes(lower) ||
        c.id.includes(lower)
    );
}

// Map report category/subcategory to 311 category
export function mapReportTo311Category(reportCategory: string, reportSubcategory: string): Category311 | undefined {
    const combined = `${reportCategory} ${reportSubcategory}`.toLowerCase();

    if (combined.includes('pothole') || combined.includes('road hazard') || combined.includes('road damage')) {
        return getCategoryById('road-hazard');
    }
    if (combined.includes('traffic') || combined.includes('signal') || combined.includes('sign')) {
        return getCategoryById('traffic');
    }
    if (combined.includes('light') || combined.includes('streetlight')) {
        return getCategoryById('streetlight');
    }
    if (combined.includes('sidewalk') || combined.includes('walkway')) {
        return getCategoryById('sidewalk');
    }
    if (combined.includes('graffiti') || combined.includes('vandal')) {
        return getCategoryById('graffiti');
    }
    if (combined.includes('litter') || combined.includes('garbage') || combined.includes('dump')) {
        return getCategoryById('litter');
    }
    if (combined.includes('noise')) {
        return getCategoryById('noise');
    }

    return undefined;
}
