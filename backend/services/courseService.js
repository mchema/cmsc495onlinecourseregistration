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

    // Constructor initializes the Map
    constructor() {
        this.#course_map = new Map();
    }

    // Initializes all courses in the database into memory, used on first startup of the application to cache frequently accessed items.
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

            console.log('courseService initialized!');
        } catch (err) {
            console.error('Error:', err);
        }
    }

    // ****** Courses ******

    // Gets course information from memory
    getCourseInfo(course_code) {
        const course = this.#course_map.get(course_code);
        return [course.course_id, course_code, course.title, course.description, course.credits];
    }

    getCourseID(course_code) {
        return this.getCourseInfo(course_code)[0];
    }

    getCourseTitle(course_code) {
        return this.getCourseInfo(course_code)[2];
    }

    getCourseDescription(course_code) {
        return this.getCourseInfo(course_code)[3];
    }

    getCourseCredits(course_code) {
        return this.getCourseInfo(course_code)[4];
    }

    // ****** Sections ******

    // Create new section
    async createSection(course_id, semester_id, professor_id, capacity, days, start_time, end_time) {
        try {
            console.log(course_id, semester_id, professor_id, capacity, days, start_time, end_time);
        } catch(err) {
            console.error(err);
        }
    }
}

export default CourseService;
