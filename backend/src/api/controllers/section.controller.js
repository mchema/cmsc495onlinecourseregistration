import SectionService from '../../services/section.service.js';

class SectionController {
    constructor() {
        this.sectionService = new SectionService();
        this.addSection = this.addSection.bind(this);
        this.getSectionInfo = this.getSectionInfo.bind(this);
        this.updateSection = this.updateSection.bind(this);
        this.removeSection = this.removeSection.bind(this);
        this.getAllSections = this.getAllSections.bind(this);
    }

    // Express Add Section Method
    async addSection(req, res, next) {
        try {
            const { courseId } = req.params;
            const { semesterId, professorId, capacity, days, startTime, endTime } = req.body;

            const section = await this.sectionService.addSection(courseId, semesterId, professorId, capacity, days, startTime, endTime);

            return res.status(201).json({
                message: 'Section added successfully.',
                section: section.toObject(),
            });
        } catch (err) {
            next(err);
        }
    }

    // Express Get Section Info Method
    async getSectionInfo(req, res, next) {
        try {
            const { sectionId } = req.params;
            const section = await this.sectionService.getSectionInfo(sectionId);
            return res.status(200).json({
                message: 'Section info retrieved successfully.',
                section: section.toObject(),
            });
        } catch (err) {
            next(err);
        }
    }

    // Express Get All Sections Method
    async getAllSections(req, res, next) {
        try {
            const { courseId } = req.params;
            const { page = 1, limit = 10, search = '', semesterId = null, professorId = null } = req.query;
            const result = await this.sectionService.getAllSections(page, limit, search, courseId ?? null, semesterId, professorId);

            return res.status(200).json({
                sections: result.data,
                meta: result.meta,
            });
        } catch (err) {
            next(err);
        }
    }

    // Express Update Section Method
    async updateSection(req, res, next) {
        try {
            const { sectionId } = req.params;
            const { semesterId, professorId, capacity, days, startTime, endTime } = req.body;

            const section = await this.sectionService.updateSection(sectionId, { semesterId, professorId, capacity, days, startTime, endTime });

            return res.status(200).json({
                message: 'Section updated successfully.',
                section: section.toObject(),
            });
        } catch (err) {
            next(err);
        }
    }

    // Express Remove Section Method
    async removeSection(req, res, next) {
        try {
            const { sectionId } = req.params;
            await this.sectionService.removeSection(sectionId);
            return res.status(200).json({
                message: 'Section removed successfully.',
            });
        } catch (err) {
            next(err);
        }
    }
}

export default SectionController;
