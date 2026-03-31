export const COURSE_SUBJECTS = {
    CMSC: 'Computer Science',
    MATH: 'Mathematics',
    ENGL: 'English',
    HIST: 'History',
    PHYS: 'Physics',
    CHEM: 'Chemistry',
    NURS: 'Nursing',
    IFSM: 'Information Systems Management',
};

export function getSubjectCodeFromCourseCode(courseCode) {
    return String(courseCode).trim().toUpperCase().slice(0, 4);
}

export function getSubjectNameFromCourseCode(courseCode) {
    const subjectCode = getSubjectCodeFromCourseCode(courseCode);
    return COURSE_SUBJECTS[subjectCode] ?? null;
}
