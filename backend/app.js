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

//import CourseService from './services/courseService.js';
import CourseController from './controllers/courseController.js';
import AuthController from './controllers/authController.js';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output, exit } from 'node:process';
import * as Errors from './errors/index.js';

const rl = readline.createInterface({ input, output });

async function main() {
    try {
        const cc = new CourseController(rl);
        const ac = new AuthController(rl);

        const context = { rl, cc, ac, currentUser: null };

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
                    state = await coursesMenu(context);
                    break;
                case 'USERS_MENU':
                    state = await usersMenu(context);
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
        const user = await context.ac.loginUser(userEmail, userPassword);
        context.currentUser = user;
        console.log('\nLogin successful.\n');
        return 'MAIN_MENU';
    } catch (err) {
        console.log('\n', err.message, '\n');
        return 'LOGIN';
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

// course menu
async function coursesMenu(context) {
    console.log('**** COURSES MENU ****');
    console.log('Enter the number that corresponds to your choice.');
    console.log('1. Get Course Info');
    console.log('2. Add New Course');
    console.log('3. Update Existing Course');
    console.log('4. Remove an Existing Course');
    console.log('6. Logout');
    console.log('7. Exit');

    const selection = (await rl.question('Select an option: ')).trim();

    switch (selection.toLowerCase()) {
        case '1':
            console.log(await context.cc.getCourseInfo());
            return 'COURSES_MENU';

        case '2':
            return 'COURSES_MENU';

        case '3':
            return 'COURSES_MENU';

        case '4':
            return 'COURSES_MENU';

        case '6':
        case 'logout':
            return 'LOGIN';

        case '7':
        case 'exit':
            return 'EXIT';

        default:
            console.log('\nInvalid selection.\n');
            return 'COURSES_MENU';
    }
}

// user menu
async function usersMenu(context) {
    console.log('**** USERS MENU ****');
    console.log('Enter the number that corresponds to your choice.');
    console.log('1. Get Current User Info');
    console.log('2. Update User Info');
    console.log('3. ADMIN - Add New User');
    console.log('4. ADMIN - Remove a User');
    console.log('6. Logout');
    console.log('7. Exit');

    const selection = (await rl.question('Select an option: ')).trim();

    switch (selection.toLowerCase()) {
        case '1':
            console.log(await context.cc.getCourseInfo());
            return 'USERS_MENU';

        case '2':
            return 'USERS_MENU';

        case '3':
            return 'USERS_MENU';

        case '4':
            return 'USERS_MENU';

        case '6':
        case 'logout':
            return 'LOGIN';

        case '7':
        case 'exit':
            return 'EXIT';

        default:
            console.log('\nInvalid selection.\n');
            return 'USERS_MENU';
    }
}

async function enrollmentMenu(context) {}

async function sectionsMenu(context) {}

async function prerequisitesMenu(context) {}

main();
