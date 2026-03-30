export function createTestContext() {
    const now = Date.now();

    const newUser = {
        name: `API Test User ${now}`,
        email: `api_test_${now}@gmail.com`,
        userType: 'student',
    };

    newUser.password = `${newUser.name}${newUser.email}`;

    return {
        adminAuth: null,
        nonAdminAuth: null,
        updatedNonAdminAuth: null,
        createdCourseId: null,
        newUser,
        newUserUpdatedPassword: `UpdatedPass!${now}A1`,
        passwordPolicyTests: {
            tooShort: 'Aa1!a',
            missingUppercase: 'lowercase1!',
            missingLowercase: 'UPPERCASE1!',
            missingNumber: 'NoNumber!',
            missingSpecial: 'NoSpecial1',
            containsEmailLocalPart: `${newUser.email.split('@')[0]}!Aa1`,
        },
        courseTest: {
            create: {
                courseCode: `APIT${String(now).slice(-5)}`,
                courseTitle: `API Test Course ${now}`,
                courseDescription: 'Created by apiTestRunner for CRUD validation.',
                courseCredits: 3,
            },
            update: {
                courseCode: `APUT${String(now + 1).slice(-5)}`,
                courseTitle: `Updated API Test Course ${now + 1}`,
                courseDescription: 'Updated by apiTestRunner for CRUD validation.',
                courseCredits: 4,
            },
        },
    };
}
