export interface FilterOperation {
    field: string;
    operation: string;
    value: any;
}

export class QueryBuilder {
    /**
     * Build MongoDB filter object from advanced filter operations
     * @param filters - Array of filter operations
     * @returns MongoDB filter object
     */
    static buildAdvancedFilters(filters: FilterOperation[]): Record<string, any> {
        const filter: Record<string, any> = {};

        if (!Array.isArray(filters) || filters.length === 0) {
            return filter;
        }

        for (const filterItem of filters) {
            const { field, operation, value } = filterItem;
            
            if (!field || !operation) continue;

            switch (operation.toLowerCase()) {
                case 'equals':
                case 'eq':
                    filter[field] = value;
                    break;

                case 'notequals':
                case 'ne':
                    filter[field] = { $ne: value };
                    break;

                case 'contains':
                    filter[field] = new RegExp(this.escapeRegex(value), 'i');
                    break;

                case 'notcontains':
                    filter[field] = { $not: new RegExp(this.escapeRegex(value), 'i') };
                    break;

                case 'startswith':
                    filter[field] = new RegExp(`^${this.escapeRegex(value)}`, 'i');
                    break;

                case 'endswith':
                    filter[field] = new RegExp(`${this.escapeRegex(value)}$`, 'i');
                    break;

                case 'in':
                    if (Array.isArray(value) && value.length > 0) {
                        filter[field] = { $in: value };
                    }
                    break;

                case 'notin':
                    if (Array.isArray(value) && value.length > 0) {
                        filter[field] = { $nin: value };
                    }
                    break;

                case 'gt':
                case 'greaterthan':
                    filter[field] = { $gt: this.parseNumericValue(value) };
                    break;

                case 'gte':
                case 'greaterthanorequal':
                    filter[field] = { $gte: this.parseNumericValue(value) };
                    break;

                case 'lt':
                case 'lessthan':
                    filter[field] = { $lt: this.parseNumericValue(value) };
                    break;

                case 'lte':
                case 'lessthanorequal':
                    filter[field] = { $lte: this.parseNumericValue(value) };
                    break;

                case 'between':
                case 'range':
                    if (Array.isArray(value) && value.length === 2) {
                        filter[field] = { 
                            $gte: this.parseNumericValue(value[0]), 
                            $lte: this.parseNumericValue(value[1]) 
                        };
                    }
                    break;

                case 'exists':
                    filter[field] = { $exists: Boolean(value) };
                    break;

                case 'regex':
                    filter[field] = new RegExp(this.escapeRegex(value), 'i');
                    break;

                default:
                    // Default to contains for unknown operations
                    filter[field] = new RegExp(this.escapeRegex(value), 'i');
            }
        }

        return filter;
    }

    /**
     * Build global search filter across multiple fields
     * @param searchTerm - Search term
     * @param fields - Array of field names to search
     * @returns MongoDB $or filter object
     */
    static buildGlobalSearch(searchTerm: string, fields: string[]): Record<string, any> | null {
        if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) {
            return null;
        }

        const searchRegex = new RegExp(this.escapeRegex(searchTerm.trim()), 'i');
        const searchConditions = fields.map(field => ({ [field]: searchRegex }));

        return { $or: searchConditions };
    }

    /**
     * Build sort object for MongoDB queries
     * @param sortBy - Field to sort by
     * @param sortOrder - Sort order ('asc' or 'desc')
     * @returns MongoDB sort object
     */
    static buildSort(sortBy: string = 'createdAt', sortOrder: string = 'desc'): Record<string, 1 | -1> {
        return {
            [sortBy]: sortOrder.toLowerCase() === 'asc' ? 1 : -1
        };
    }

    /**
     * Parse numeric value (handles strings and numbers)
     * @param value - Value to parse
     * @returns Parsed number
     */
    private static parseNumericValue(value: any): number {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Escape special regex characters
     * @param str - String to escape
     * @returns Escaped string
     */
    private static escapeRegex(str: string): string {
        if (typeof str !== 'string') return String(str);
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get unique values from array of objects for a specific field
     * @param data - Array of objects
     * @param field - Field name
     * @returns Sorted array of unique values
     */
    static getUniqueValues(data: any[], field: string): any[] {
        return [...new Set(data.map(item => item[field]).filter(Boolean))].sort();
    }

    /**
     * Get min and max values for a numeric field
     * @param data - Array of objects
     * @param field - Field name
     * @returns Object with min and max values
     */
    static getRange(data: any[], field: string): { min: number; max: number } {
        if (data.length === 0) {
            return { min: 0, max: 0 };
        }

        const values = data.map(item => item[field] || 0).filter(val => val > 0);
        
        return {
            min: values.length > 0 ? Math.min(...values) : 0,
            max: values.length > 0 ? Math.max(...values) : 0
        };
    }

    /**
     * Merge multiple filter objects into one
     * @param filters - Array of filter objects
     * @returns Merged filter object
     */
    static mergeFilters(...filters: Record<string, any>[]): Record<string, any> {
        return Object.assign({}, ...filters.filter(f => f !== null && Object.keys(f).length > 0));
    }
}
