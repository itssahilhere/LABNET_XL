import mongoose, { Schema } from 'mongoose';
import { IProductCheck } from '../interfaces/product';
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

const productCheckSchema: Schema<IProductCheck> = new Schema({
    pid: {
        type: String,
        required: true,
        length: 16
    },
    product_id: {
        type: String,
        required: false
    },
    stock_id: {
        type: String,
        required: false
    },
    shape: {
        type: String,
        required: false,
        enum: ALLOWED_SHAPES
    },
    carat: {
        type: Number,
        required: false,
        min: 0
    },
    color: {
        type: String,
        required: false,
        enum: ALLOWED_COLORS
    },
    clarity: {
        type: String,
        required: false,
        enum: ALLOWED_CLARITY
    },
    cut: {
        type: String,
        required: false,
        enum: ALLOWED_CUT_POLISH_SYMMETRY
    },
    polish: {
        type: String,
        required: false,
        enum: ALLOWED_CUT_POLISH_SYMMETRY
    },
    symmetry: {
        type: String,
        required: false,
        enum: ALLOWED_CUT_POLISH_SYMMETRY
    },
    fluorescence: {
        type: String,
        required: false,
        enum: ALLOWED_FLUORESCENCE
    },
    laboratory: {
        type: String,
        required: false,
        enum: ALLOWED_LABORATORY
    },
    certificate_number: {
        type: String,
        required: false
    },
    depth_percentage: {
        type: Number,
        required: false,
        min: 0,
        max: 100
    },
    table_percentage: {
        type: Number,
        required: false,
        min: 0,
        max: 100
    },
    price_per_carat: {
        type: Number,
        required: false,
        min: 0
    },
    total_price: {
        type: Number,
        required: false,
        min: 0
    },
    growth_type: {
        type: String,
        required: false
    },
    fancy_color: {
        type: String,
        required: false,
        enum: ALLOWED_FANCY_COLORS
    },
    fancy_color_intensity: {
        type: String,
        required: false,
        enum: ALLOWED_FANCY_COLOR_INTENSITY
    },
    fancy_color_overtone: {
        type: String,
        required: false,
        enum: ALLOWED_FANCY_COLORS
    },
    eye_clean: {
        type: String,
        required: false,
        trim: true
    },
    seller_name: {
        type: String,
        required: false,
        trim: true
    },
    seller_company: {
        type: String,
        required: false,
        trim: true
    },
    seller_location: {
        type: String,
        required: false,
        trim: true
    },
    seller_phone: {
        type: String,
        required: false,
        trim: true
    },
    seller_whatsapp: {
        type: String,
        required: false,
        trim: true
    },
    seller_email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    video_url: {
        type: String,
        // required: true,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    image_url: {
        type: String,
        // required: true,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    certificate_url: {
        type: String,
        // required: true,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    measurements: {
        type: String,
        required: false,
        match: [/^\d{2}\.\d{2}\*\d{2}\.\d{2}\*\d{2}\.\d{2}$/, 'Measurement must be in the format 99.99*99.99*99.99']
    },
    seller_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['valid', 'invalid'],
        default: 'valid',
        required: true
    },
    remarks: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for better query performance
// Partial unique index: only enforce uniqueness when stock_id is not null
productCheckSchema.index(
    { seller_id: 1, stock_id: 1 }, 
    { 
        unique: true,
        partialFilterExpression: { stock_id: { $type: 'string', $ne: null } }
    }
);
productCheckSchema.index({ status: 1 });
productCheckSchema.index({ seller_id: 1, status: 1 });

const ProductCheck = mongoose.model<IProductCheck>('ProductCheck', productCheckSchema);

export default ProductCheck;
