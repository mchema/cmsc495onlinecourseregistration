import { loadEnv } from './common.js';
import { runSchema } from './dbSchema.js';
import { runSeed } from './dbSeed.js';

try {
    loadEnv();
    runSchema();
    runSeed();
    console.log('Database reset complete.');
} catch (error) {
    console.error(`db:reset failed: ${error.message}`);
    process.exit(1);
}
