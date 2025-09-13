"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const logger_1 = require("../utils/logger");
const MediaFile_1 = require("../models/MediaFile");
class MediaService {
    constructor() {
        logger_1.logger.info('MediaService initialized');
    }
    async uploadMedia(_file, _filename, _uploadedBy, _metadata, _options) {
        // This will be implemented with actual media processing
        throw new Error('Media upload not yet implemented');
    }
    async getMedia(id) {
        try {
            return await MediaFile_1.MediaFile.findOne({ id }).exec();
        }
        catch (error) {
            logger_1.logger.error('Error retrieving media:', error);
            throw error;
        }
    }
    async updateMedia(id, updates) {
        try {
            return await MediaFile_1.MediaFile.findOneAndUpdate({ id }, { ...updates, updatedAt: new Date() }, { new: true }).exec();
        }
        catch (error) {
            logger_1.logger.error('Error updating media:', error);
            throw error;
        }
    }
    async deleteMedia(id) {
        try {
            const result = await MediaFile_1.MediaFile.findOneAndUpdate({ id }, { status: 'deleted', updatedAt: new Date() }).exec();
            return !!result;
        }
        catch (error) {
            logger_1.logger.error('Error deleting media:', error);
            throw error;
        }
    }
    async searchMedia(query, filters = {}, pagination = { page: 1, limit: 20 }) {
        try {
            const searchQuery = { status: { $ne: 'deleted' } };
            // Add text search if query provided
            if (query) {
                searchQuery.$text = { $search: query };
            }
            // Add filters
            if (filters.format) {
                searchQuery.format = new RegExp(filters.format, 'i');
            }
            if (filters.category) {
                searchQuery['metadata.descriptive.category'] = filters.category;
            }
            if (filters.tags) {
                const tags = filters.tags.split(',').map((tag) => tag.trim());
                searchQuery['metadata.descriptive.tags'] = { $in: tags };
            }
            if (filters.license) {
                searchQuery['metadata.rights.license'] = filters.license;
            }
            const skip = (pagination.page - 1) * pagination.limit;
            const [results, total] = await Promise.all([
                MediaFile_1.MediaFile.find(searchQuery)
                    .skip(skip)
                    .limit(pagination.limit)
                    .sort({ createdAt: -1 })
                    .exec(),
                MediaFile_1.MediaFile.countDocuments(searchQuery).exec()
            ]);
            const pages = Math.ceil(total / pagination.limit);
            return { results, total, pages };
        }
        catch (error) {
            logger_1.logger.error('Error searching media:', error);
            throw error;
        }
    }
}
exports.MediaService = MediaService;
//# sourceMappingURL=MediaService.js.map