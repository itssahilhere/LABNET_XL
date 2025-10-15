export const ALLOWED_SHAPES = [
    'Round', 'Pear', 'Oval', 'Marquise', 'Heart', 'Radiant', 'Princess', 
    'Emerald', 'Asscher', 'Sq. Emerald', 'Asscher & Sq. Emerald', 
    'Square Radiant', 'Cushion (All)', 'Cushion Brilliant', 'Cushion Modified', 
    'Baguette', 'European Cut', 'Old Miner', 'Briolette', 'Bullets', 'Calf', 
    'Circular Brilliant', 'Epaulette', 'Flanders', 'Half Moon', 'Hexagonal', 
    'Kite', 'Lozenge', 'Octagonal', 'Pentagonal', 'Rose', 'Shield', 'Square', 
    'Star', 'Tapered Baguette', 'Tapered Bullet', 'Trapezoid', 'Triangular', 
    'Trilliant', 'Other'
] as const;

export const ALLOWED_CLARITY = [
    'FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'SI3', 'I1', 'I2', 'I3'
] as const;

export const ALLOWED_COLORS = [
    'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 
    'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Other'
] as const;

export const ALLOWED_FANCY_COLORS = [
    'Black', 'Brown', 'Brownish', 'Champagne', 'Cognac', 'Chameleon', 
    'Violetish', 'White', 'Brown-Greenish', 'Green', 'Greenish', 'Purple', 
    'Purplish', 'Orange', 'Orangey', 'Violet', 'Gray', 'Grayish', 'None', 
    'Yellow', 'Yellowish', 'Pink', 'Pinkish', 'Blue', 'Bluish', 'Red', 
    'Reddish', 'Gray-Greenish', 'Gray-Yellowish', 'Orange-Brown', 'Other'
] as const;

export const ALLOWED_FLUORESCENCE = [
    'None', 'Faint', 'Medium', 'Strong', 'Very Strong'
] as const;

export const ALLOWED_CUT_POLISH_SYMMETRY = [
    'Excellent', 'Very Good', 'Good', 'Poor', 'Fair', 'Ideal'
] as const;

export const ALLOWED_FANCY_COLOR_INTENSITY = [
    'Faint', 'Very Light', 'Fancy Light', 'Light', 'Fancy', 'Dark Fancy', 
    'Fancy Intense', 'Fancy Deep', 'Other'
] as const;

export const ALLOWED_LABORATORY = [
    'GIA', 'GIA DOR', 'HRD', 'IGI', 'AGS', 'CGL', 'DBIOD', 'GCAL', 'GII', 
    'GHI', 'GSI', 'NGTC', 'PGS', 'RAP', 'RDC', 'SGL', 'NONE'
] as const;

export const ALLOWED_GROWTH_TYPES = [
    'Natural', 'Lab Grown', 'HPHT', 'CVD'
] as const;

// Type helpers
export type Shape = typeof ALLOWED_SHAPES[number];
export type Clarity = typeof ALLOWED_CLARITY[number];
export type Color = typeof ALLOWED_COLORS[number];
export type FancyColor = typeof ALLOWED_FANCY_COLORS[number];
export type Fluorescence = typeof ALLOWED_FLUORESCENCE[number];
export type CutPolishSymmetry = typeof ALLOWED_CUT_POLISH_SYMMETRY[number];
export type FancyColorIntensity = typeof ALLOWED_FANCY_COLOR_INTENSITY[number];
export type Laboratory = typeof ALLOWED_LABORATORY[number];
export type GrowthType = typeof ALLOWED_GROWTH_TYPES[number];

// Validation helper functions
export function isValidShape(value: string): value is Shape {
    return ALLOWED_SHAPES.includes(value as Shape);
}

export function isValidClarity(value: string): value is Clarity {
    return ALLOWED_CLARITY.includes(value as Clarity);
}

export function isValidColor(value: string): value is Color {
    return ALLOWED_COLORS.includes(value as Color);
}

export function isValidFancyColor(value: string): value is FancyColor {
    return ALLOWED_FANCY_COLORS.includes(value as FancyColor);
}

export function isValidFluorescence(value: string): value is Fluorescence {
    return ALLOWED_FLUORESCENCE.includes(value as Fluorescence);
}

export function isValidCutPolishSymmetry(value: string): value is CutPolishSymmetry {
    return ALLOWED_CUT_POLISH_SYMMETRY.includes(value as CutPolishSymmetry);
}

export function isValidFancyColorIntensity(value: string): value is FancyColorIntensity {
    return ALLOWED_FANCY_COLOR_INTENSITY.includes(value as FancyColorIntensity);
}

export function isValidLaboratory(value: string): value is Laboratory {
    return ALLOWED_LABORATORY.includes(value as Laboratory);
}

export function isValidGrowthType(value: string): value is GrowthType {
    return ALLOWED_GROWTH_TYPES.includes(value as GrowthType);
}

// Measurement format validation
export const MEASUREMENT_REGEX = /^\d{2}\.\d{2}\*\d{2}\.\d{2}\*\d{2}\.\d{2}$/;

export function isValidMeasurement(value: string): boolean {
    return MEASUREMENT_REGEX.test(value);
}

// Excel template headers
export const EXCEL_HEADERS = [
    'Stock_ID',
    'Shape',
    'Carat',
    'Color',
    'Clarity',
    'Cut',
    'Polish',
    'Symmetry',
    'Fluorescence',
    'Laboratory',
    'Certificate_Number',
    'Measurements',
    'Depth_Percentage',
    'Table_Percentage',
    'Price_Per_Carat',
    'Total_Price',
    'Growth_Type',
    'Fancy_Color',
    'Fancy_Color_Intensity',
    'Fancy_Color_Overtone',
    'Seller_Name',
    'Seller_Company',
    'Seller_Location',
    'Seller_Phone',
    'Seller_WhatsApp',
    'Seller_Email',
    'Video_URL',
    'Image_URL',
    'Certificate_URL'
] as const;

export type ExcelHeader = typeof EXCEL_HEADERS[number];
