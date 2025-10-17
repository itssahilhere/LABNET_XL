import { Request, Response, NextFunction } from 'express';
import {
    ALLOWED_SHAPES,
    ALLOWED_COLORS,
    ALLOWED_CLARITY,
    ALLOWED_CUT_POLISH_SYMMETRY,
    ALLOWED_FLUORESCENCE,
    ALLOWED_LABORATORY,
    ALLOWED_FANCY_COLORS,
    ALLOWED_FANCY_COLOR_INTENSITY
} from '../constants/productValidation';
import { sendErrorResponse, ErrorResponses } from '../utils/responses';

export interface IProductCreateRequest {
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
}

// Email validation regex
const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

// URL validation regex
const urlRegex = /^https?:\/\/.+/;

// Measurements validation regex (99.99*99.99*99.99)
const measurementsRegex = /^\d{2}\.\d{2}\*\d{2}\.\d{2}\*\d{2}\.\d{2}$/;

export const validateProductCreation = (req: Request, res: Response, next: NextFunction) => {
    const errors: { [key: string]: string[] } = {};
    const data: IProductCreateRequest = req.body;

    // Required field checks
    const requiredFields = [
        'stock_id', 'shape', 'carat', 'color', 'clarity', 'cut', 'polish', 'symmetry',
        'fluorescence', 'laboratory', 'certificate_number', 'depth_percentage', 'table_percentage',
        'price_per_carat', 'total_price', 'growth_type', 'fancy_color', 'fancy_color_intensity',
        'fancy_color_overtone', 'seller_name', 'seller_company', 'seller_location', 'seller_phone',
        'seller_whatsapp', 'seller_email', 'video_url', 'image_url', 'certificate_url', 'measurements'
    ];

    // Check for missing required fields
    for (const field of requiredFields) {
        if (!data[field as keyof IProductCreateRequest] && data[field as keyof IProductCreateRequest] !== 0) {
            if (!errors[field]) errors[field] = [];
            errors[field].push(`${field} is required`);
        }
    }

    // Validate enum fields
    if (data.shape && !(ALLOWED_SHAPES as readonly string[]).includes(data.shape)) {
        if (!errors.shape) errors.shape = [];
        errors.shape.push('The selected shape is invalid');
    }

    if (data.color && !(ALLOWED_COLORS as readonly string[]).includes(data.color)) {
        if (!errors.color) errors.color = [];
        errors.color.push('The selected color is invalid');
    }

    if (data.clarity && !(ALLOWED_CLARITY as readonly string[]).includes(data.clarity)) {
        if (!errors.clarity) errors.clarity = [];
        errors.clarity.push('The selected clarity is invalid');
    }

    if (data.cut && !(ALLOWED_CUT_POLISH_SYMMETRY as readonly string[]).includes(data.cut)) {
        if (!errors.cut) errors.cut = [];
        errors.cut.push('The selected cut is invalid');
    }

    if (data.polish && !(ALLOWED_CUT_POLISH_SYMMETRY as readonly string[]).includes(data.polish)) {
        if (!errors.polish) errors.polish = [];
        errors.polish.push('The selected polish is invalid');
    }

    if (data.symmetry && !(ALLOWED_CUT_POLISH_SYMMETRY as readonly string[]).includes(data.symmetry)) {
        if (!errors.symmetry) errors.symmetry = [];
        errors.symmetry.push('The selected symmetry is invalid');
    }

    if (data.fluorescence && !(ALLOWED_FLUORESCENCE as readonly string[]).includes(data.fluorescence)) {
        if (!errors.fluorescence) errors.fluorescence = [];
        errors.fluorescence.push('The selected fluorescence is invalid');
    }

    if (data.laboratory && !(ALLOWED_LABORATORY as readonly string[]).includes(data.laboratory)) {
        if (!errors.laboratory) errors.laboratory = [];
        errors.laboratory.push('The selected laboratory is invalid');
    }

    if (data.fancy_color && !(ALLOWED_FANCY_COLORS as readonly string[]).includes(data.fancy_color)) {
        if (!errors.fancy_color) errors.fancy_color = [];
        errors.fancy_color.push('The selected fancy color is invalid');
    }

    if (data.fancy_color_intensity && !(ALLOWED_FANCY_COLOR_INTENSITY as readonly string[]).includes(data.fancy_color_intensity)) {
        if (!errors.fancy_color_intensity) errors.fancy_color_intensity = [];
        errors.fancy_color_intensity.push('The selected fancy color intensity is invalid');
    }

    if (data.fancy_color_overtone && !(ALLOWED_FANCY_COLORS as readonly string[]).includes(data.fancy_color_overtone)) {
        if (!errors.fancy_color_overtone) errors.fancy_color_overtone = [];
        errors.fancy_color_overtone.push('The selected fancy color overtone is invalid');
    }

    // Validate email format
    if (data.seller_email && !emailRegex.test(data.seller_email)) {
        if (!errors.seller_email) errors.seller_email = [];
        errors.seller_email.push('Please enter a valid email address');
    }

    // Validate URL formats
    if (data.video_url && !urlRegex.test(data.video_url)) {
        if (!errors.video_url) errors.video_url = [];
        errors.video_url.push('Please enter a valid video URL');
    }

    if (data.image_url && !urlRegex.test(data.image_url)) {
        if (!errors.image_url) errors.image_url = [];
        errors.image_url.push('Please enter a valid image URL');
    }

    if (data.certificate_url && !urlRegex.test(data.certificate_url)) {
        if (!errors.certificate_url) errors.certificate_url = [];
        errors.certificate_url.push('Please enter a valid certificate URL');
    }

    // Validate measurements format
    if (data.measurements && !measurementsRegex.test(data.measurements)) {
        if (!errors.measurements) errors.measurements = [];
        errors.measurements.push('Measurement must be in the format 99.99*99.99*99.99');
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
        return res.status(422).json({
            message: 'The given data was invalid.',
            errors
        });
    }

    next();
};

export const validateProductUpdate = (req: Request, res: Response, next: NextFunction) => {
    const errors: { [key: string]: string[] } = {};
    let data: Partial<IProductCreateRequest> = req.body;
    if (req.body.field && req.body.value !== undefined) {
        data = { [req.body.field]: req.body.value } as Partial<IProductCreateRequest>;
    }

    // Validate enum fields if provided
    if (data.shape && !(ALLOWED_SHAPES as readonly string[]).includes(data.shape)) {
        if (!errors.shape) errors.shape = [];
        errors.shape.push('The selected shape is invalid');
    }

    if (data.color && !(ALLOWED_COLORS as readonly string[]).includes(data.color)) {
        if (!errors.color) errors.color = [];
        errors.color.push('The selected color is invalid');
    }

    if (data.clarity && !(ALLOWED_CLARITY as readonly string[]).includes(data.clarity)) {
        if (!errors.clarity) errors.clarity = [];
        errors.clarity.push('The selected clarity is invalid');
    }

    if (data.cut && !(ALLOWED_CUT_POLISH_SYMMETRY as readonly string[]).includes(data.cut)) {
        if (!errors.cut) errors.cut = [];
        errors.cut.push('The selected cut is invalid');
    }

    if (data.polish && !(ALLOWED_CUT_POLISH_SYMMETRY as readonly string[]).includes(data.polish)) {
        if (!errors.polish) errors.polish = [];
        errors.polish.push('The selected polish is invalid');
    }

    if (data.symmetry && !(ALLOWED_CUT_POLISH_SYMMETRY as readonly string[]).includes(data.symmetry)) {
        if (!errors.symmetry) errors.symmetry = [];
        errors.symmetry.push('The selected symmetry is invalid');
    }

    if (data.fluorescence && !(ALLOWED_FLUORESCENCE as readonly string[]).includes(data.fluorescence)) {
        if (!errors.fluorescence) errors.fluorescence = [];
        errors.fluorescence.push('The selected fluorescence is invalid');
    }

    if (data.laboratory && !(ALLOWED_LABORATORY as readonly string[]).includes(data.laboratory)) {
        if (!errors.laboratory) errors.laboratory = [];
        errors.laboratory.push('The selected laboratory is invalid');
    }

    if (data.fancy_color && !(ALLOWED_FANCY_COLORS as readonly string[]).includes(data.fancy_color)) {
        if (!errors.fancy_color) errors.fancy_color = [];
        errors.fancy_color.push('The selected fancy color is invalid');
    }

    if (data.fancy_color_intensity && !(ALLOWED_FANCY_COLOR_INTENSITY as readonly string[]).includes(data.fancy_color_intensity)) {
        if (!errors.fancy_color_intensity) errors.fancy_color_intensity = [];
        errors.fancy_color_intensity.push('The selected fancy color intensity is invalid');
    }

    if (data.fancy_color_overtone && !(ALLOWED_FANCY_COLORS as readonly string[]).includes(data.fancy_color_overtone)) {
        if (!errors.fancy_color_overtone) errors.fancy_color_overtone = [];
        errors.fancy_color_overtone.push('The selected fancy color overtone is invalid');
    }

    // Validate numeric fields if provided
    if (data.carat !== undefined && (typeof data.carat !== 'number' || data.carat < 0)) {
        if (!errors.carat) errors.carat = [];
        errors.carat.push('Carat must be a positive number');
    }

    if (data.depth_percentage !== undefined && (typeof data.depth_percentage !== 'number' || data.depth_percentage < 0 || data.depth_percentage > 100)) {
        if (!errors.depth_percentage) errors.depth_percentage = [];
        errors.depth_percentage.push('Depth percentage must be between 0 and 100');
    }

    if (data.table_percentage !== undefined && (typeof data.table_percentage !== 'number' || data.table_percentage < 0 || data.table_percentage > 100)) {
        if (!errors.table_percentage) errors.table_percentage = [];
        errors.table_percentage.push('Table percentage must be between 0 and 100');
    }

    if (data.price_per_carat !== undefined && (typeof data.price_per_carat !== 'number' || data.price_per_carat < 0)) {
        if (!errors.price_per_carat) errors.price_per_carat = [];
        errors.price_per_carat.push('Price per carat must be a positive number');
    }

    if (data.total_price !== undefined && (typeof data.total_price !== 'number' || data.total_price < 0)) {
        if (!errors.total_price) errors.total_price = [];
        errors.total_price.push('Total price must be a positive number');
    }

    // Validate email format if provided
    if (data.seller_email && !emailRegex.test(data.seller_email)) {
        if (!errors.seller_email) errors.seller_email = [];
        errors.seller_email.push('Please enter a valid email address');
    }

    // Validate URL formats if provided
    if (data.video_url && !urlRegex.test(data.video_url)) {
        if (!errors.video_url) errors.video_url = [];
        errors.video_url.push('Please enter a valid video URL');
    }

    if (data.image_url && !urlRegex.test(data.image_url)) {
        if (!errors.image_url) errors.image_url = [];
        errors.image_url.push('Please enter a valid image URL');
    }

    if (data.certificate_url && !urlRegex.test(data.certificate_url)) {
        if (!errors.certificate_url) errors.certificate_url = [];
        errors.certificate_url.push('Please enter a valid certificate URL');
    }

    // Validate measurements format if provided
    if (data.measurements && !measurementsRegex.test(data.measurements)) {
        if (!errors.measurements) errors.measurements = [];
        errors.measurements.push('Measurement must be in the format 99.99*99.99*99.99');
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
        return res.status(422).json({
            message: 'The given data was invalid.',
            errors
        });
    }

    next();
};