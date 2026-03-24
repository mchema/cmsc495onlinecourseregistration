/**
 * CourseService
 *
 * Responsibilities:
 * Retrieve course catalog data
 * Retrieve sections for a given course
 * Support simple filtering by semester
 */

import * as db from '../db/db.js';
import Course from './course.js';

class CourseService {
    #course_list;
    numCourses;

    constructor() {
        this.#course_list = [];
    }

    async init() {
        try {
            const result = await db.queryStd('SELECT * FROM courses', []);

            this.numCourses = result.length;

            for (let index = 1; index <= this.numCourses; index++) {
                const course = new Course(index);
                this.#course_list.push(course);
            }
        } catch (err) {
            console.error('Error:', err);
        }
    }
}

const cs = new CourseService();

cs.init();
