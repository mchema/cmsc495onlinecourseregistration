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

            await this.authService.changePassword(req.user, newPassword);

            const result = await this.authService.loginUser(req.user.email, newPassword);
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
                message: 'Password changed successfully.',
                firstLogin: result.firstLogin,
                token,
                user: user.toSafeObject(),
            });
        } catch (err) {
            next(err);
        }
    }

    // Express Update User Info
    async updateUserInfo(req, res, next) {
        try {
            const { name, email } = req.body;

            const user = await this.authService.updateUserInfo(name, email, req.user.id);
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
                message: 'Updated user info successfully.',
                token,
                user: user.toSafeObject(),
            });
        } catch (err) {
            next(err);
        }
    }
}

export default AuthController;
