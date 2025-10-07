import mongoose, { Schema, Model } from 'mongoose';
import jwt from 'jsonwebtoken';
import { IUser, IUserModel } from '../interfaces/user';
import { hashPassword, comparePassword } from '../utils/password';

const userSchema: Schema<IUser> = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    company_name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true,
    },
    phone_no: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    whatsapp_no: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    show_pass: {
        type: String,
        required: true
    },
    uid: {
        type: String,
        required: true,
        unique: true
    },
    kyc: {
        type: Number,
        default: 1
    },
    vat_number: {
        type: String,
        required: true,
        trim: true
    },
    id_proof: {
        type: String,
        trim: true
    },
    pack_id: {
        type: Schema.Types.ObjectId,
        ref: 'Package'
    },
    enable: {
        type: Number,
        default: 0
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    approval_status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approved_by: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    approved_at: {
        type: Date
    },
    rejection_reason: {
        type: String,
        trim: true
    },
    pack_start_date: {
        type: Date
    },
    pack_end_date: {
        type: Date
    }
}, {
    timestamps: true
});

userSchema.index({ email: 1 });
userSchema.index({ phone_no: 1 });
userSchema.index({ uid: 1 });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        this.password = await hashPassword(this.password, 10);
        next();
    } catch (error) {
        next(error as Error);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return await comparePassword(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function (): string {
    const token = jwt.sign(
        { _id: this._id, email: this.email },
        process.env.JWT_SECRET || 'LabelXpertz@2025',
        { expiresIn: '7d' }
    );
    return token;
};

userSchema.statics.findByCredentials = async function (email: string, password: string) {
    const user = await this.findOne({ email });
    if (!user) {
        throw new Error('Invalid login credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new Error('Invalid login credentials');
    }

    if (user.role !== 'admin' && user.approval_status !== 'approved') {
        if (user.approval_status === 'pending') {
            throw new Error('Your account is pending admin approval');
        } else if (user.approval_status === 'rejected') {
            throw new Error('Your account has been rejected. Please contact admin');
        }
    }

    return user;
};

// Generate unique UID
userSchema.statics.generateUniqueUid = async function (): Promise<string> {
    let uid: string;
    let user;
    do {
        uid = "LNX" + Math.floor(Math.random() * 900000 + 100000);
        user = await this.findOne({ uid });
    } while (user);
    return uid;
};

userSchema.statics.createDefaultAdmin = async function (): Promise<IUser> {
    const existingAdmin = await this.findOne({ role: 'admin' });
    if (existingAdmin) {
        return existingAdmin;
    }

    const adminUid = await (this as IUserModel).generateUniqueUid();
    const adminUser = new this({
        name: 'LabnetXL Admin',
        email: 'admin@labnetxl.com',
        company_name: 'LabnetXL',
        location: 'System',
        phone_no: '0000000000',
        password: 'Admin@123456',
        show_pass: 'Admin@123456',
        uid: adminUid,
        role: 'admin',
        approval_status: 'approved',
        kyc: 1,
        vat_number: 'ADMIN001',
        enable: 1
    });

    await adminUser.save();
    return adminUser;
};

const User: IUserModel = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;
