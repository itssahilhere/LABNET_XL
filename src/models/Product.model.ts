import mongoose, { Schema } from 'mongoose';
import {
    IProduct,
    ALLOWED_SHAPES,
    ALLOWED_COLORS,
    ALLOWED_CLARITY,
    ALLOWED_CUT_POLISH_SYMMETRY,
    ALLOWED_FLUORESCENCE,
    ALLOWED_LABORATORY,
    ALLOWED_FANCY_COLORS,
    ALLOWED_FANCY_COLOR_INTENSITY
} from '../interfaces/product';

const productSchema: Schema<IProduct> = new Schema({
    pid: {
        type: String,
        required: true,
        unique: true,
        length: 16
    },
    product_id: {
        type: String,
        required: true,
        unique: true
    },
    stock_id: {
        type: String,
        required: true
    },
    shape: {
        type: String,
        required: true,
        enum: ALLOWED_SHAPES
    },
    carat: {
        type: Number,
        required: true,
        min: 0
    },
    color: {
        type: String,
        required: true,
        enum: ALLOWED_COLORS
    },
    clarity: {
        type: String,
        required: true,
        enum: ALLOWED_CLARITY
    },
    cut: {
        type: String,
        required: true,
        enum: ALLOWED_CUT_POLISH_SYMMETRY
    },
    polish: {
        type: String,
        required: true,
        enum: ALLOWED_CUT_POLISH_SYMMETRY
    },
    symmetry: {
        type: String,
        required: true,
        enum: ALLOWED_CUT_POLISH_SYMMETRY
    },
    fluorescence: {
        type: String,
        required: true,
        enum: ALLOWED_FLUORESCENCE
    },
    laboratory: {
        type: String,
        required: true,
        enum: ALLOWED_LABORATORY
    },
    certificate_number: {
        type: String,
        required: true
    },
    depth_percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    table_percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    price_per_carat: {
        type: Number,
        required: true,
        min: 0
    },
    total_price: {
        type: Number,
        required: true,
        min: 0
    },
    growth_type: {
        type: String,
        required: true
    },
    fancy_color: {
        type: String,
        required: true,
        enum: ALLOWED_FANCY_COLORS
    },
    fancy_color_intensity: {
        type: String,
        required: true,
        enum: ALLOWED_FANCY_COLOR_INTENSITY
    },
    fancy_color_overtone: {
        type: String,
        required: true,
        enum: ALLOWED_FANCY_COLORS
    },
    seller_name: {
        type: String,
        required: true,
        trim: true
    },
    seller_company: {
        type: String,
        required: true,
        trim: true
    },
    seller_location: {
        type: String,
        required: true,
        trim: true
    },
    seller_phone: {
        type: String,
        required: true,
        trim: true
    },
    seller_whatsapp: {
        type: String,
        required: true,
        trim: true
    },
    seller_email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    video_url: {
        type: String,
        required: true,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    image_url: {
        type: String,
        required: true,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    certificate_url: {
        type: String,
        required: true,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    measurements: {
        type: String,
        required: true,
        match: [/^\d{2}\.\d{2}\*\d{2}\.\d{2}\*\d{2}\.\d{2}$/, 'Measurement must be in the format 99.99*99.99*99.99']
    },
    seller_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for better query performance
productSchema.index({ seller_id: 1, stock_id: 1 }, { unique: true });
productSchema.index({ shape: 1 });
productSchema.index({ color: 1 });
productSchema.index({ clarity: 1 });
productSchema.index({ carat: 1 });
productSchema.index({ total_price: 1 });

// Generate unique PID
productSchema.statics.generateUniquePid = async function (): Promise<string> {
    let pid: string;
    let product;
    do {
        pid = Math.floor(Math.random() * 9000000000000000 + 1000000000000000).toString();
        product = await this.findOne({ pid });
    } while (product);
    return pid;
};

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;