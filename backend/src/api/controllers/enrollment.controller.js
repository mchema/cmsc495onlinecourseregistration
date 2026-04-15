import EnrollmentService from '../../services/enrollment.service.js';

class EnrollmentController {
	constructor() {
		this.e = new EnrollmentService();
		this.addEnrollment = this.addEnrollment.bind(this);
		this.updEnrollment = this.updEnrollment.bind(this);
		this.getEnrollment = this.getEnrollment.bind(this);
		this.rmvEnrollment = this.rmvEnrollment.bind(this);
		this.listEnrollments = this.listEnrollments.bind(this);
	}

	//backend endpoint for listing enrollments for the logged-in student
	async listEnrollments(req, res, next) {
		try {
			const enrollments = await this.e.listEnrollments(req.user, req.query);
			return res.status(200).json(enrollments);
		} catch (err) {
			next(err);
		}
	}

	// Express Add Enrollment Method
	// Missing Prerequisite Check, Section Capacity Check, and Waitlist Handling for now - will be added in future iterations
	async addEnrollment(req, res, next) {
		try {
			const { stuId, secId, code } = req.body;
			const enrollment = await this.e.addEnroll(stuId, secId, req.user, code);

			return res.status(201).json(enrollment);
		} catch (err) {
			next(err);
		}
	}

	// Express update Enrollment Method
	async updEnrollment(req, res, next) {
		try {
			const { id } = req.params;
			const { status, code } = req.body;
			const enrollment = await this.e.updEnroll(id, status, req.user, code);

			return res.status(200).json(enrollment);
		} catch (err) {
			next(err);
		}
	}

	// Express Get Enrollment Info Method
	async getEnrollment(req, res, next) {
		try {
			const { id } = req.params;
			const enrollment = await this.e.getEnroll(id, req.user);

			return res.status(200).json(enrollment);
		} catch (err) {
			next(err);
		}
	}

	// Express Remove Enrollment Method
	async rmvEnrollment(req, res, next) {
		try {
			const { id } = req.params;
			await this.e.rmvEnroll(id, req.user);

			return res.status(200).end();
		} catch (err) {
			next(err);
		}
	}
}

export default EnrollmentController;
