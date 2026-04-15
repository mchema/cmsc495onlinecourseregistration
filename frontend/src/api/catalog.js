import { getCourses } from './courses.js';
import { getSections } from './sections.js';

export async function getCatalogData({ coursePage = 1, courseLimit = 100, sectionPage = 1, sectionLimit = 50 } = {}) {
  const [courseData, sectionData] = await Promise.all([
    getCourses({ page: coursePage, limit: courseLimit }),
    getSections({ page: sectionPage, limit: sectionLimit }),
  ]);

  const rawCourses = courseData?.Course || [];
  const rawSections = sectionData?.Section || [];

  const courses = rawCourses.map((entry) => entry?.Course || entry);
  const sections = rawSections.map((entry) => entry?.Section || entry);

  const sectionsByCourseId = sections.reduce((acc, section) => {
    const key = Number(section.course_id);
    if (!acc[key]) acc[key] = [];
    acc[key].push(section);
    return acc;
  }, {});

  const catalog = courses.map((course) => ({
    ...course,
    sections: sectionsByCourseId[Number(course.course_id)] || [],
  }));

  return {
    courses: catalog,
    courseMeta: courseData?.Meta || null,
    sectionMeta: sectionData?.Meta || null,
  };
}