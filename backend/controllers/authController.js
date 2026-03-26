// Given the current STATE, direct the call from COURSES_MENU to the appropriate service call.

//import * as readline from 'node:readline/promises';
//import { stdin as input, stdout as output } from 'node:process';
import AuthService from '../services/authService.js';

class AuthController {
    rl;
    as;
    constructor(rl) {
        this.rl = rl;
        this.as = new AuthService();
    }

    // Login User
    async loginUser(email, password) {
        const user = await this.as.loginUser(email, password);
        const firstLoginCheck = await this.as.firstLoginCheck(user);
        if (firstLoginCheck === true) {
            console.log('Password must be changed as this is your first time signing in.\n\n\n');
            await this.changePassword(email);
        }
        return user;
    }

    // Password Change
    async changePassword(email) {
        var bool = false;
        var pwd;
        while (bool === false) {
            pwd = await this.rl.question('Please enter a new password: ');
            var pwdVerification = await this.rl.question('Please re-enter the password: ');

            if (pwd === pwdVerification) {
                bool = true;
            } else {
                console.log('Passwords did not match, please try again.');
            }
        }

        await this.as.changePassword(email, pwd);
    }

    // Logout User
    async logoutUser(user) {
        const logout = await this.as.logoutUser(user);
        return logout;
    }
}

export default AuthController;
