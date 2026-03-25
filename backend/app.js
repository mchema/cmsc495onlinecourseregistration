/*
 * During development of the backend, app.js will be a simple CLI utility
 * This allows for rapid testing and development of the backend
 * And can be adapted to the frontend integration later on.
 */

// Command Menu
/**
 * Course:
 * Get Course Info -
 * getCourseTitle(course_code)
 * getCourseID(course_code)
 * getCourseDescription(course_code)
 * getCourseCredits(course_code)
 *
 * Add New Course -
 *
 *
 * Edit Existing Course -
 *
 *
 * Delete Course -
 *
 *
 * Section:
 *
 */

import CourseService from './services/courseService.js';
import AuthService from './services/authService.js';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output, exit } from 'node:process';

const rl = readline.createInterface({ input, output });

async function main() {
    try {
        const cs = new CourseService();
        await cs.init();
        const as = new AuthService();

        const context = { cs, as, currentUser: null };

        let state = 'LOGIN';

        while (state != 'EXIT') {
            switch (state) {
                case 'LOGIN':
                    state = await loginMenu(context);
                    break;
                case 'MAIN_MENU':
                    state = await mainMenu();
                    break;
                case 'COURSES_MENU':
                    state = await loginMenu(context);
                    break;
                case 'USERS_MENU':
                    state = await loginMenu(context);
                    break;
                case 'ENROLLMENT_MENU':
                    state = await loginMenu(context);
                    break;
                case 'SECTIONS_MENU':
                    state = await loginMenu(context);
                    break;
                case 'PREREQUISITES_MENU':
                    state = await loginMenu(context);
                    break;
                case 'LOGOUT':
                    context.currentUser = null;
                    console.log('\nLogged out successfully.\n');
                    state = 'LOGIN';
                    break;
                default:
                    console.log('\nUnknown state encountered. Exiting now...\n');
                    state = 'EXIT';
                    break;
            }
        }
    } catch (error) {
        console.error(error.message);
    } finally {
        rl.close();
        exit();
    }
}

// Login menu
async function loginMenu(context) {
    console.log('\n **** LOGIN ****');
    console.log('Type "exit" at any prompt to quit.\n');

    const userEmail = (await rl.question('Please enter your email address: ')).trim();
    if (userEmail.toLowerCase() == 'exit') {
        return 'EXIT';
    }

    const userPassword = (await rl.question('Please enter your password: ')).trim();
    if (userPassword.toLowerCase() == 'exit') {
        return 'EXIT';
    }

    try {
        //Needs adjustment once auth process is complete.
        const user = await context.as.loginUser(userEmail, userPassword);

        if (user == null) {
            console.log('\nLogin failed. Invalid email and/or password.\n');
            return 'LOGIN';
        }

        context.currentUser = user;
        console.log('\nLogin successful.\n');
        return 'MAIN_MENU';
    } catch (err) {
        console.error(err);
    }
}

// Main menu
async function mainMenu() {
    console.log('**** MAIN MENU ****');
    console.log('1. Courses');
    console.log('2. Users');
    console.log('3. Enrollment');
    console.log('4. Sections');
    console.log('5. Prerequisites');
    console.log('6. Logout');
    console.log('7. Exit\n');

    const selection = (await rl.question('Select an option: ')).trim();

    switch (selection.toLowerCase()) {
        case '1':
        case 'courses':
            return 'COURSES_MENU';

        case '2':
        case 'users':
            return 'USERS_MENU';

        case '3':
        case 'enrollment':
            return 'ENROLLMENT_MENU';

        case '4':
        case 'sections':
            return 'SECTIONS_MENU';

        case '5':
        case 'prerequisites':
            return 'PREREQUISITES_MENU';

        case '6':
        case 'logout':
            return 'LOGOUT';

        case '7':
        case 'exit':
            return 'EXIT';

        default:
            console.log('\nInvalid selection.\n');
            return 'MAIN_MENU';
    }
}

main();
