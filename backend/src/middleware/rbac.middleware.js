import * as db from '../db/connection.js';

async function getCurrentRoleForUser(id) {
    const existsAdmin = await db.query('SELECT employee_id, access_level FROM admins WHERE user_id = ?', [id]);
    if (existsAdmin.length > 0) {
        return {
            role: 'ADMIN',
            role_id: existsAdmin[0].employee_id,
            role_details: existsAdmin[0].access_level,
        };
    }

    const existsProfessor = await db.query('SELECT professor_id, department FROM professors WHERE user_id = ?', [id]);
    if (existsProfessor.length > 0) {
        return {
            role: 'PROFESSOR',
            role_id: existsProfessor[0].professor_id,
            role_details: existsProfessor[0].department,
        };
    }

    const existsStudent = await db.query('SELECT student_id, major FROM students WHERE user_id = ?', [id]);
    if (existsStudent.length > 0) {
        return {
            role: 'STUDENT',
            role_id: existsStudent[0].student_id,
            role_details: existsStudent[0].major,
        };
    }

    return null;
}

function authorizeRoles(...allowedRoles) {
    if (allowedRoles.length === 0) {
        throw new Error('authorizeRoles requires at least one role');
    }

    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required.',
            });
        }

        const currentRole = await getCurrentRoleForUser(req.user.id);

        if (!currentRole) {
            return res.status(403).json({
                error: 'Forbidden.',
            });
        }

        req.user = {
            ...req.user,
            role: currentRole.role,
            role_id: currentRole.role_id,
            role_details: currentRole.role_details,
        };

        if (!allowedRoles.includes(currentRole.role)) {
            return res.status(403).json({
                error: 'Forbidden.',
            });
        }

        next();
    };
}

export default authorizeRoles;
