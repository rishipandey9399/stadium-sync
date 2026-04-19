const { z } = require('zod');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const envSchema = z.object({
  // Server Config
  PORT: z.string().transform(Number).default('8080'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Google Services
  GEMINI_API_KEY: z.string().optional(), // Optional in dev, validated below
  
  // Firebase Config
  FIREBASE_API_KEY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  
  // Maps
  GOOGLE_MAPS_API_KEY: z.string().optional(),
});

let config;

try {
  config = envSchema.parse(process.env);
  
  // Custom Production Check
  if (config.NODE_ENV === 'production') {
    const required = ['GEMINI_API_KEY', 'FIREBASE_API_KEY', 'GOOGLE_MAPS_API_KEY', 'FIREBASE_PROJECT_ID'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error("❌ CRITICAL: Production Environment Missing Keys:", missing.join(', '));
      process.exit(1);
    }
  }
  
  console.log(`✅ Environment Mode: ${config.NODE_ENV}`);
} catch (error) {
  console.error("⚠️ Environment Parse Warning:", error.message);
}

module.exports = config || process.env;
