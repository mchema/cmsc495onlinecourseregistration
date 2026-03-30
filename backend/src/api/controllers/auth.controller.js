import AuthService from '../../services/auth.service.js';
import jwt from 'jsonwebtoken';

class AuthController {
    constructor() {
        this.authService = new AuthService();

        // Bind Methods so "this" Works When Passed Into Express Routes
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.getCurrentUser = this.getCurrentUser.bind(this);
        this.changePassword = this.changePassword.bind(this);
        this.updateUserInfo = this.updateUserInfo.bind(this);
    }

    // Express Login Method
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    error: 'Email and Password are required.',
                });
            }

            const result = await this.authService.loginUser(email, password);

            const user = result.user;

            const token = jwt.sign(
                {
                    user: user.toSafeObject() ?? null,
                    firstLogin: user.getFirstLogin(),
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: process.env.JWT_EXPIRES_IN,
                }
            );

            return res.status(200).json({
                message: 'Login Successful',
                firstLogin: result.firstLogin,
                token,
                user: result.user.toSafeObject(),
            });
        } catch (err) {
            next(err);
        }
    }

    // Express Logout Method
    async logout(req, res, next) {
        try {
            return res.status(200).json({
                message: 'Logout Successful',
            });
        } catch (err) {
            next(err);
        }
    }

    // Express Get Current User Method
    async getCurrentUser(req, res, next) {
        try {
            const userInfo = await this.authService.getCurrentUserInfo(req.user);
            const user = userInfo.toSafeObject();

            return res.status(200).json({
                user: user,
            });
        } catch (err) {
            next(err);
        }
    }

    // Express Change Password method
    async changePassword(req, res, next) {
        try {
            const { newPassword } = req.body;

            if (!newPassword) {
                return res.status(400).json({
                    error: 'New password is required.',
                });
            }

            if (typeof newPassword !== 'string') {
                return res.status(400).json({
                    error: 'New password must be a string.',
                });
            }

            if (newPassword.trim().length === 0) {
                return res.status(400).json({
                    error: 'New password cannot be empty.',
                });
            }

            if (newPassword === 'Password') {
                return res.status(400).json({
                    error: 'New password cannot be the default password.',
                });
            }

            await this.authService.changePassword(req.user, newPassword);

            return res.status(200).json({
                message: 'Password changed successfully.',
            });
        } catch (err) {
            next(err);
        }
    }

    // Express Update User Info
    async updateUserInfo(req, res, next) {
        try {
            const { user, name, email } = req.body;

            if (!user || !name || !email) {
                return res.status(400).json({
                    error: 'Missing fields are required.',
                });
            }

            await this.authService.updateUserInfo(user, name, email);

            return res.status(200).json({
                message: 'Updated user Info successfully.',
            });
        } catch (err) {
            next(err);
        }
    }
}

export default AuthController;
