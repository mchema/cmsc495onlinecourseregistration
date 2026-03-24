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
    #course_map;
    numCourses;

    constructor() {
        this.#course_map = new Map();
    }

    async init() {
        try {
            const result = await db.queryStd('SELECT * FROM courses', []);

            this.numCourses = result.length;

            for (let index = 1; index <= this.numCourses; index++) {
                var course = new Course(index);
                await course.init();
                //console.log(course.course_code);
                this.#course_map.set(course.course_code, course);
            }

        } catch (err) {
            console.error('Error:', err);
        }
    }

    getCourseInfo(course_code) {
        const course = this.#course_map.get(course_code);
        return [course.course_id, course_code, course.title, course.description, course.credits];
    }
}

const cs = new CourseService();

await cs.init();

console.log(cs.getCourseInfo("CMSC495"))