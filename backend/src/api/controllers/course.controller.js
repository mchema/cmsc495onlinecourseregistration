import CourseService from '../../services/course.service.js';

class CourseController {
    constructor() {
        this.courseService = new CourseService();

        this.getCourseInfo = this.getCourseInfo.bind(this);
        this.addNewCourse = this.addNewCourse.bind(this);
        this.updateCourse = this.updateCourse.bind(this);
        this.removeCourse = this.removeCourse.bind(this);
    }

    async getCourseInfo(req, res, next) {
        try {
            const { courseId } = req.params;

            if (!courseId || Number.isNaN(courseId)) {
                return res.status(400).json({
                    error: 'Valid course ID is required.',
                });
            }

            const course = await this.courseService.getCourseInfo(courseId);

            return res.status(200).json(course.toObject());
        } catch (err) {
            next(err);
        }
    }

    async addNewCourse(req, res, next) {
        try {
            const { courseCode, courseTitle, courseDescription, courseCredits } = req.body;

            if (!courseCode || !courseTitle || !courseDescription || courseCredits == null || Number.isNaN(courseCredits)) {
                return res.status(400).json({
                    error: 'Course code, title, description, and numeric credits are required.',
                });
            }

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

            if (!courseId || Number.isNaN(courseId)) {
                return res.status(400).json({
                    error: 'Valid course ID is required.',
                });
            }

            if (!courseCode || !courseTitle || !courseDescription || courseCredits == null || Number.isNaN(courseCredits)) {
                return res.status(400).json({
                    error: 'Course code, title, description, and numeric credits are required.',
                });
            }

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

            if (!courseId || Number.isNaN(courseId)) {
                return res.status(400).json({
                    error: 'Valid course ID is required.',
                });
            }

            await this.courseService.removeCourse(Number(courseId));

            return res.status(200).json({
                message: 'Course deleted successfully.',
            });
        } catch (err) {
            next(err);
        }
    }
}

export default CourseController;
