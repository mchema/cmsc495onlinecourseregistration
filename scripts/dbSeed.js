import { loadEnv, runSqlFile, getDatabaseName } from './common.js';

export function runSeed() {
    const database = getDatabaseName();

    const seedFiles = ['courses_seeding_data.sql', 'users_seeding_data.sql', 'roles_seeding_data.sql', 'semesters_seeding_data.sql', 'prerequisites_seeding_data.sql'];

    for (const file of seedFiles) {
        runSqlFile(file, { database });
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        loadEnv();
        runSeed();
        console.log('Database seed complete.');
    } catch (error) {
        console.error(`db:seed failed: ${error.message}`);
        process.exit(1);
    }
}
