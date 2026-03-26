// Given the current STATE, direct the call from COURSES_MENU to the appropriate service call.

//import * as readline from 'node:readline/promises';
//import { stdin as input, stdout as output } from 'node:process';
import CourseService from '../services/courseService.js';

class CourseController {

    rl

    constructor(rl) {
        this.rl = rl;
    }

    // Get Course Info
    async getCourseInfo() {
        const selection = (await this.rl.question('Please enter the Course Code: '));
        const cs = new CourseService(selection);
        await cs.init();

        return cs.getCourseInfo(selection);
    }

    // Add New Course
    async addNewCourse() {}

    // Update Existing Course
    async updateCourse() {}

    // Remove an Existing Course
    async removeCourse() {}
}

export default CourseController;