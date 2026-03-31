import CourseService from '../../services/course.service.js';

class CourseController {
    constructor() {
        this.courseService = new CourseService();

        this.getCourseInfo = this.getCourseInfo.bind(this);
        this.addNewCourse = this.addNewCourse.bind(this);
        this.updateCourse = this.updateCourse.bind(this);
        this.removeCourse = this.removeCourse.bind(this);
        this.getAllCourses = this.getAllCourses.bind(this);
    }

    async getCourseInfo(req, res, next) {
        try {
            const { courseId } = req.params;
            const course = await this.courseService.getCourseInfo(courseId);

            return res.status(200).json(course.toObject());
        } catch (err) {
            next(err);
        }
    }

    async addNewCourse(req, res, next) {
        try {
            const { courseCode, courseTitle, courseDescription, courseCredits } = req.body;
            const course = await this.courseService.addNewCourse({
                course_code: courseCode,
                title: courseTitle,
                description: courseDescription,
                credits: courseCredits,
            });

            return res.status(201).json({
                message: 'Course added successfully.',
                course: course.toObject(),
            });
        } catch (err) {
            next(err);
        }
    }

    async updateCourse(req, res, next) {
        try {
            const { courseId } = req.params;
            const { courseCode, courseTitle, courseDescription, courseCredits } = req.body;
            const course = await this.courseService.updateCourse(courseId, {
                course_code: courseCode,
                title: courseTitle,
                description: courseDescription,
                credits: courseCredits,
            });

            return res.status(200).json({
                message: 'Course updated successfully.',
                course: course.toObject(),
            });
        } catch (err) {
            next(err);
        }
    }

    async removeCourse(req, res, next) {
        try {
            const { courseId } = req.params;
            await this.courseService.removeCourse(courseId);

            return res.status(200).json({
                message: 'Course deleted successfully.',
            });
        } catch (err) {
            next(err);
        }
    }

    async getAllCourses(req, res, next) {
        try {
            const { page = 1, limit = 10, search = '', subject = null } = req.query;
            const result = await this.courseService.getAllCourses(page, limit, search, subject);

            return res.status(200).json({
                courses: result.data,
                meta: result.meta,
            });
        } catch (err) {
            next(err);
        }
    }
}

export default CourseController;
