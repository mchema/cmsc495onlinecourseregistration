import { z } from 'zod';
import { paginationQuerySchema } from './common.schema.js';

// Validation schema for setting user role, using discriminated union to handle different role details based on user type
const adminRoleSchema = z.object({
    userType: z.literal('ADMIN'),
    roleDetails: z.coerce.number().int().positive(),
});

const professorRoleSchema = z.object({
    userType: z.literal('PROFESSOR'),
    roleDetails: z.string().trim().min(1),
});

const studentRoleSchema = z.object({
    userType: z.literal('STUDENT'),
    roleDetails: z.string().trim().min(1),
});

export const setUserRoleSchema = z.discriminatedUnion('userType', [adminRoleSchema, professorRoleSchema, studentRoleSchema]);

const addUserBaseSchema = z.object({
    name: z.string().trim().min(1).max(45),
    email: z.email(),
});

// Formatting validation schemas for adding a user
export const addUserSchema = z.discriminatedUnion('userType', [addUserBaseSchema.extend(adminRoleSchema.shape), addUserBaseSchema.extend(professorRoleSchema.shape), addUserBaseSchema.extend(studentRoleSchema.shape)]);

// Validation schema for getting all users with optional role filter and pagination
export const getAllUsersQuerySchema = paginationQuerySchema.extend({
    role: z.enum(['ADMIN', 'PROFESSOR', 'STUDENT']).optional(),
});
