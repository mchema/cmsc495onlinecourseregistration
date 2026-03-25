/**
 * authService
 *
 * Responsibilities:
 * Handle User calls to the database for authentication and validation
 * Depending on user type, set appropriate restrictions
 * On successful login, load user data into memory
 * On logout, unload user data from memory and ensure database matches.
 */

import * as db from '../db/db.js';
import User from '../services/user.js';
import * as bcrypt from 'bcrypt';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const saltRounds = 10;
const rl = readline.createInterface({ input, output });

class AuthService {
    constructor() {}

    // Login User
    async loginUser(email, password) {
        const user = new User(email);
        const loginResult = await user.init();

        if (loginResult == 'ERROR') {
            return null;
        }
        
        if (user.getPasswordHash() == 'Password') {
            console.log('Password must be changed as this is your first time signing in.\n\n\n');
            await this.changePassword(email);
        }

        await bcrypt.compare(password, user.getPasswordHash()).then(function (result) {
            if (result == true) {
                return user;
            } else {
                return null;
            }
        });
    }

    // Set User Type
    async setUserType(user_id) {
        var userType = await rl.question(
            'Please select the User type. Enter either "student" or "professor": '
        );
        if (userType == 'student') {
            await db.queryAdm(
                "INSERT INTO students (user_id, major) VALUES (?, 'Computer Science')",
                [user_id]
            );
        } else if (userType == 'professor') {
            await db.queryAdm(
                "INSERT INTO professors (user_id, department) VALUES (?, 'Engineering')",
                [user_id]
            );
        }
    }

    // Logout User
    logoutUser() {}

    // Password Change
    async changePassword(email) {
        var bool = false;
        var pwd;
        while (bool == false) {
            pwd = await rl.question('Please enter a new password: ');
            var pwdVerification = await rl.question('Please re-enter the password: ');

            if (pwd == pwdVerification) {
                bool = true;
            } else {
                console.log('Passwords did not match, please try again.');
            }
        }

        await bcrypt.hash(pwd, saltRounds).then(function (hash) {
            db.queryAdm('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);
        });
    }
}

export default AuthService;
