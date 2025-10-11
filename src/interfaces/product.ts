import mongoose, { Document } from 'mongoose';

export interface IProduct extends Document {
    pid: string;
    product_id: string;
    stock_id: string;
    shape: string;
    carat: number;
    color: string;
    clarity: string;
    cut: string;
    polish: string;
    symmetry: string;
    fluorescence: string;
    laboratory: string;
    certificate_number: string;
    depth_percentage: number;
    table_percentage: number;
    price_per_carat: number;
    total_price: number;
    growth_type: string;
    fancy_color: string;
    fancy_color_intensity: string;
    fancy_color_overtone: string;
    seller_name: string;
    seller_company: string;
    seller_location: string;
    seller_phone: string;
    seller_whatsapp: string;
    seller_email: string;
    video_url: string;
    image_url: string;
    certificate_url: string;
    measurements: string;
    seller_id: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

// Allowed values for validation
export const ALLOWED_SHAPES = [
    'Round', 'Pear', 'Oval', 'Marquise', 'Heart', 'Radiant', 'Princess', 'Emerald',
    'Asscher', 'Sq. Emerald', 'Asscher & Sq. Emerald', 'Square Radiant', 'Cushion (All)',
    'Cushion Brilliant', 'Cushion Modified', 'Baguette', 'European Cut', 'Old Miner',
    'Briolette', 'Bullets', 'Calf', 'Circular Brilliant', 'Epaulette', 'Flanders',
    'Half Moon', 'Hexagonal', 'Kite', 'Lozenge', 'Octagonal', 'Pentagonal', 'Rose',
    'Shield', 'Square', 'Star', 'Tapered Baguette', 'Tapered Bullet', 'Trapezoid',
    'Triangular', 'Trilliant', 'Other'
];

export const ALLOWED_COLORS = [
    'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Other'
];

export const ALLOWED_CLARITY = [
    'FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'SI3', 'I1', 'I2', 'I3'
];

export const ALLOWED_CUT_POLISH_SYMMETRY = [
    'Excellent', 'Very Good', 'Good', 'Poor', 'Fair', 'Ideal'
];

export const ALLOWED_FLUORESCENCE = [
    'None', 'Faint', 'Medium', 'Strong', 'Very Strong'
];

export const ALLOWED_LABORATORY = [
    'GIA', 'GIA DOR', 'HRD', 'IGI', 'AGS', 'CGL', 'DBIOD', 'GCAL', 'GII', 'GHI', 'GSI', 'NGTC', 'PGS', 'RAP', 'RDC', 'SGL', 'NONE'
];

export const ALLOWED_FANCY_COLORS = [
    'Black', 'Brown', 'Brownish', 'Champagne', 'Cognac', 'Chameleon', 'Violetish', 'White',
    'Brown-Greenish', 'Green', 'Greenish', 'Purple', 'Purplish', 'Orange', 'Orangey', 'Violet',
    'Gray', 'Grayish', 'None', 'Yellow', 'Yellowish', 'Pink', 'Pinkish', 'Blue', 'Bluish',
    'Red', 'Reddish', 'Gray-Greenish', 'Gray-Yellowish', 'Orange-Brown', 'Other'
];

export const ALLOWED_FANCY_COLOR_INTENSITY = [
    'Faint', 'Very Light', 'Fancy Light', 'Light', 'Fancy', 'Dark Fancy', 'Fancy Intense', 'Fancy Deep', 'Other'
];