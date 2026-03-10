import { createPlaywrightConfig } from '@iblai/iblai-js/playwright';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

dotenv.config({ path: path.resolve(__dirname, envFile) });

export default createPlaywrightConfig({
  platforms: [
    { name: 'skills', dependencies: ['setup'], otherTestMatch: ['**skills/*/*.spec.ts'] },
  ],
});
