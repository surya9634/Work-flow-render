// Entry point for Render that delegates to social-backend/server.js
require('dotenv').config({ path: require('path').join(__dirname, 'social-backend', '.env') });
require('./social-backend/server');