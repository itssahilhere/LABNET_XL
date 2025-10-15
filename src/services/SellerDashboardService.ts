import Product from '../models/Product.model';
import { Types } from 'mongoose';

export class SellerDashboardService {
    /**
     * Get dashboard statistics for a specific seller
     * @param sellerId - The ID of the seller (user)
     * @returns Dashboard statistics including total product counts
     */
    async getDashboardStats(sellerId: string | Types.ObjectId) {
        const sellerObjectId = typeof sellerId === 'string' 
            ? new Types.ObjectId(sellerId) 
            : sellerId;

        // Get total products count for this seller
        const totalProducts = await Product.countDocuments({ 
            seller_id: sellerObjectId 
        });

        return {
            overview: {
                totalProducts
            },
            metrics: {
                productsCount: totalProducts
            }
        };
    }

    /**
     * Get detailed product statistics for a seller
     * @param sellerId - The ID of the seller (user)
     * @returns Detailed product statistics
     */
    async getProductStats(sellerId: string | Types.ObjectId) {
        const sellerObjectId = typeof sellerId === 'string' 
            ? new Types.ObjectId(sellerId) 
            : sellerId;

        const [
            totalProducts,
            productsByShape,
            productsByColor,
            productsByClarity,
            totalInventoryValue,
            avgPricePerCarat
        ] = await Promise.all([
            // Total products count
            Product.countDocuments({ seller_id: sellerObjectId }),

            // Products grouped by shape
            Product.aggregate([
                { $match: { seller_id: sellerObjectId } },
                { $group: { _id: '$shape', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Products grouped by color
            Product.aggregate([
                { $match: { seller_id: sellerObjectId } },
                { $group: { _id: '$color', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Products grouped by clarity
            Product.aggregate([
                { $match: { seller_id: sellerObjectId } },
                { $group: { _id: '$clarity', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Total inventory value
            Product.aggregate([
                { $match: { seller_id: sellerObjectId } },
                { $group: { _id: null, total: { $sum: '$total_price' } } }
            ]),

            // Average price per carat
            Product.aggregate([
                { $match: { seller_id: sellerObjectId } },
                { $group: { _id: null, avg: { $avg: '$price_per_carat' } } }
            ])
        ]);

        return {
            totalProducts,
            breakdown: {
                byShape: productsByShape,
                byColor: productsByColor,
                byClarity: productsByClarity
            },
            pricing: {
                totalInventoryValue: totalInventoryValue[0]?.total || 0,
                avgPricePerCarat: avgPricePerCarat[0]?.avg || 0
            }
        };
    }

}
