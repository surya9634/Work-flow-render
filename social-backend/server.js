require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const PORT = process.env.PORT || 10000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Config from env
const config = {
  instagram: {
    appId: process.env.INSTAGRAM_APP_ID || '',
    appSecret: process.env.INSTAGRAM_APP_SECRET || '',
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:10000/auth/instagram/callback',
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    callbackUrl: process.env.FACEBOOK_CALLBACK || 'http://localhost:10000/auth/facebook/callback',
  },
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'verify-me',
  },
  webhook: {
    verifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'WORKFLOW_VERIFY_TOKEN',
  },
  ai: {
    geminiKey: process.env.GEMINI_API_KEY || '',
  }
};

console.log('🚀 Starting Work Automation Platform');
console.log('=====================================');
console.log(`PORT: ${PORT}`);
console.log(`Instagram App ID set: ${!!config.instagram.appId}`);
console.log(`Facebook App ID set: ${!!config.facebook.appId}`);
console.log(`WhatsApp Phone ID set: ${!!config.whatsapp.phoneNumberId}`);
console.log('=====================================');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Minimal in-memory auth + onboarding for demo ---
const authStore = {
  usersByEmail: new Map(), // email -> user
  usersById: new Map(),    // id -> user
  tokens: new Map(),       // token -> userId
  onboardingByUser: new Map(), // userId -> onboarding data
};

function createUser(email, password) {
  const id = 'u_' + Math.random().toString(36).slice(2, 10);
  const user = {
    id,
    email,
    password, // NOTE: plain for demo only
    role: 'user',
    name: '',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    onboardingCompleted: false,
  };
  authStore.usersByEmail.set(email, user);
  authStore.usersById.set(id, user);
  return user;
}

function issueToken(userId) {
  const token = 't_' + Math.random().toString(36).slice(2) + Date.now();
  authStore.tokens.set(token, userId);
  return token;
}

function getTokenFromHeader(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

function requireAuth(req, res, next) {
  const token = getTokenFromHeader(req);
  const userId = token && authStore.tokens.get(token);
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  req.userId = userId;
  next();
}

app.post('/api/auth/signup', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    if (authStore.usersByEmail.has(email)) return res.status(409).json({ success: false, message: 'Email already registered' });
    const user = createUser(email, password);
    user.lastLogin = new Date().toISOString();
    const token = issueToken(user.id);
    return res.json({ success: true, message: 'Account created successfully', token, user: { id: user.id, email: user.email, role: user.role, onboardingCompleted: user.onboardingCompleted } });
  } catch (e) {
    console.error('Signup error:', e);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

app.post('/api/auth/signin', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = authStore.usersByEmail.get(email);
    if (!user || user.password !== password) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    user.lastLogin = new Date().toISOString();
    const token = issueToken(user.id);
    return res.json({ success: true, message: 'Signed in successfully', token, user: { id: user.id, email: user.email, role: user.role, onboardingCompleted: user.onboardingCompleted } });
  } catch (e) {
    console.error('Signin error:', e);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (token) authStore.tokens.delete(token);
    return res.json({ success: true, message: 'Logged out' });
  } catch (e) {
    return res.json({ success: true });
  }
});

app.post('/api/onboarding', requireAuth, (req, res) => {
  try {
    const { userId, ...data } = req.body || {};
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    const user = authStore.usersById.get(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    authStore.onboardingByUser.set(userId, data);
    user.onboardingCompleted = true;
    return res.json({ success: true, message: 'Onboarding saved' });
  } catch (e) {
    console.error('Onboarding error:', e);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});
// --- End in-memory demo ---

app.use(session({
  secret: process.env.SESSION_SECRET || 'work_automation_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
}));

app.use(passport.initialize());
app.use(passport.session());

// Facebook OAuth strategy and routes (optional if keys present)
if (config.facebook.appId && config.facebook.appSecret) {
  passport.use(new FacebookStrategy({
    clientID: config.facebook.appId,
    clientSecret: config.facebook.appSecret,
    callbackURL: config.facebook.callbackUrl,
    profileFields: ['id', 'displayName', 'emails'],
  }, (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    return done(null, profile);
  }));

  app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile', 'pages_show_list', 'pages_messaging'] }));

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/',
  }), (req, res) => {
    // Redirect back into SPA after auth
    res.redirect('/dashboard/chats');
  });
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// In-memory stores (replace with DB later if needed)
const users = new Map(); // key: instagram user id
const configurations = new Map(); // key: userId -> { postId, keyword, response }
const tokenExpirations = new Map(); // key: userId -> timestamp
let frontendSocket = null;

io.on('connection', (socket) => {
  frontendSocket = socket;
  socket.on('disconnect', () => { frontendSocket = null; });
});

function serializeError(err) {
  if (!err) return 'Unknown error';
  if (err instanceof Error) {
    const e = { name: err.name, message: err.message, stack: err.stack };
    if (err.response) e.response = { status: err.response.status, data: err.response.data, headers: err.response.headers };
    return JSON.stringify(e, null, 2);
  }
  return JSON.stringify(err, null, 2);
}

function isTokenValid(userId) {
  const expiration = tokenExpirations.get(userId);
  return expiration && Date.now() < expiration;
}

async function refreshInstagramToken(userId) {
  try {
    const user = users.get(userId);
    if (!user) return null;

    const response = await axios.get('https://graph.instagram.com/refresh_access_token', {
      params: {
        grant_type: 'ig_refresh_token',
        access_token: user.access_token,
      },
      headers: { 'X-IG-App-ID': config.instagram.appId },
    });

    if (response.data?.access_token) {
      const newToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 5184000; // 60 days
      const expirationTime = Date.now() + expiresIn * 1000;
      user.access_token = newToken;
      users.set(userId, user);
      tokenExpirations.set(userId, expirationTime);
      return newToken;
    }
    return null;
  } catch (err) {
    console.error('Token refresh error:', serializeError(err));
    return null;
  }
}



// Instagram OAuth endpoints (note: real IG OAuth requires client-side flow; placeholder here)
app.get('/auth/instagram', (_req, res) => {
  res.status(501).send('Implement Instagram OAuth client-side. Configure INSTAGRAM_REDIRECT_URI and use the short-lived code to POST to /auth/instagram/callback?code=...');
});

// Exchange code -> token (server side)
app.get('/auth/instagram/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect('/?error=missing_code');

    // Exchange code for long-lived token
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', new URLSearchParams({
      client_id: config.instagram.appId,
      client_secret: config.instagram.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: config.instagram.redirectUri,
      code: code,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-IG-App-ID': config.instagram.appId,
      },
    });

    if (!tokenResponse.data?.access_token) {
      throw new Error('Invalid token response: ' + JSON.stringify(tokenResponse.data));
    }

    const access_token = tokenResponse.data.access_token;
    const user_id = String(tokenResponse.data.user_id);

    const expirationTime = Date.now() + 60 * 24 * 60 * 60 * 1000;
    tokenExpirations.set(user_id, expirationTime);

    // Profile
    const profileResponse = await axios.get('https://graph.instagram.com/me', {
      params: { fields: 'id,username,profile_picture_url', access_token },
      headers: { 'X-IG-App-ID': config.instagram.appId },
    });

    const userData = {
      access_token,
      username: profileResponse.data.username,
      profile_pic: profileResponse.data.profile_picture_url,
      instagram_id: user_id,
      last_login: new Date(),
      platform: 'instagram',
    };
    users.set(user_id, userData);

    res.redirect(`/instagram-dashboard?user_id=${user_id}`);
  } catch (err) {
    console.error('Instagram auth error:', serializeError(err));
    res.redirect('/?error=instagram_auth_failed');
  }
});

// Simple Instagram dashboard (static html)
app.get('/instagram-dashboard', (req, res) => {
  res.send('<h2>Instagram Dashboard</h2><p>Use API endpoints to manage posts, comments, DM.</p>');
});

// Instagram APIs
app.get('/api/instagram/posts', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    const user = users.get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const response = await axios.get('https://graph.instagram.com/v23.0/me/media', {
      params: { fields: 'id,caption,media_url,media_type,thumbnail_url', access_token: user.access_token },
      headers: { 'X-IG-App-ID': config.instagram.appId },
    });

    const processed = (response.data?.data || []).map((p) => ({
      id: p.id,
      caption: p.caption || '',
      media_url: p.media_type === 'VIDEO' ? (p.thumbnail_url || '') : p.media_url,
      media_type: p.media_type,
    }));

    res.json(processed);
  } catch (err) {
    console.error('IG posts error:', serializeError(err));
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

app.get('/api/instagram/comments', async (req, res) => {
  try {
    const { userId, postId } = req.query;
    if (!userId || !postId) return res.status(400).json({ error: 'User ID and Post ID required' });
    const user = users.get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const response = await axios.get(`https://graph.instagram.com/v23.0/${postId}/comments`, {
      params: { fields: 'id,text,username,timestamp', access_token: user.access_token },
      headers: { 'X-IG-App-ID': config.instagram.appId },
    });

    res.json(response.data?.data || []);
  } catch (err) {
    console.error('IG comments error:', serializeError(err));
    res.status(500).json({ error: 'Error fetching comments' });
  }
});

app.post('/api/instagram/configure', async (req, res) => {
  try {
    const { userId, postId, keyword, response } = req.body;
    if (!userId || !postId || !keyword || !response) return res.status(400).json({ error: 'Missing required fields' });
    const user = users.get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    configurations.set(userId, { postId, keyword, response });
    res.json({ success: true });
  } catch (err) {
    console.error('IG config error:', serializeError(err));
    res.status(500).json({ error: 'Configuration failed' });
  }
});

app.post('/api/instagram/send-dm', async (req, res) => {
  try {
    const { userId, username, message } = req.body;
    if (!userId || !username || !message) return res.status(400).json({ error: 'Missing required fields' });
    const user = users.get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!isTokenValid(userId)) {
      const newTok = await refreshInstagramToken(userId);
      if (!newTok) return res.status(401).json({ error: 'Token expired. Reconnect IG.', code: 'TOKEN_REFRESH_FAILED' });
    }

    const igResp = await axios.post(`https://graph.facebook.com/v23.0/${user.instagram_id}/messages`, {
      recipient: { username },
      message: { text: message },
    }, {
      headers: { Authorization: `Bearer ${user.access_token}`, 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    res.json({ success: true, data: igResp.data });
  } catch (err) {
    console.error('IG DM error:', serializeError(err));
    res.status(500).json({ error: 'Failed to send DM' });
  }
});

app.get('/api/user-info', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const tokenStatus = isTokenValid(userId) ? 'valid' : 'expired';
  const expirationTime = tokenExpirations.get(userId) || null;
  res.json({
    username: user.username,
    instagram_id: user.instagram_id,
    profile_pic: user.profile_pic,
    platform: user.platform,
    last_login: user.last_login,
    token_status: tokenStatus,
    token_expiration: expirationTime,
  });
});

// Simple placeholders for Messenger/WhatsApp until keys/pages are configured
app.get('/api/messenger/conversations', (_req, res) => {
  res.json([{ id: 'conv1', name: 'John Doe' }, { id: 'conv2', name: 'Jane Smith' }]);
});

app.get('/api/messenger/messages', (_req, res) => {
  res.json([{ id: 'msg1', sender_name: 'John Doe', text: 'Hello!' }, { id: 'msg2', sender_name: 'You', text: 'Hi there!' }]);
});

app.post('/api/messenger/send-message', (req, res) => {
  const { conversationId, message } = req.body || {};
  if (!conversationId || !message) return res.status(400).json({ error: 'Missing required fields' });
  res.json({ success: true, to: conversationId, message });
});

app.post('/api/whatsapp/send-message', (req, res) => {
  const { phoneNumber, message } = req.body || {};
  if (!phoneNumber || !message) return res.status(400).json({ error: 'Missing required fields' });
  res.json({ success: true, to: phoneNumber, message });
});

// Serve frontend build (Vite) from work-flow/dist
const clientDir = path.join(__dirname, '..', 'work-flow', 'dist');
// Serve frontend build (Vite) with caching and correct content types
app.use('/assets', express.static(path.join(clientDir, 'assets'), {
  maxAge: '1y',
  immutable: true
}));
app.use(express.static(clientDir, {
  maxAge: '1h'
}));

// SPA fallback: send index.html for non-API routes
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});