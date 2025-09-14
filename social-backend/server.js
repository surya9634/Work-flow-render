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
const fs = require('fs');

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
    businessRedirectUri: process.env.INSTAGRAM_BUSINESS_REDIRECT_URI || (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/auth/instagram/business/callback` : 'http://localhost:10000/auth/instagram/business/callback'),
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    callbackUrl: process.env.FACEBOOK_CALLBACK || 'http://localhost:10000/auth/facebook/callback',
    pageId: process.env.FB_PAGE_ID || '',
    pageToken: process.env.FB_PAGE_TOKEN || '',
    provider: process.env.MESSENGER_PROVIDER || 'local', // 'local' | 'facebook'
  },
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    testPhoneNumberId: process.env.WHATSAPP_TEST_PHONE_NUMBER_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'verify-me',
    token: process.env.WHATSAPP_TOKEN || process.env.FB_PAGE_TOKEN || process.env.PAGE_ACCESS_TOKEN || '',
    testToken: process.env.WHATSAPP_TEST_TOKEN || '',
    mode: (process.env.WHATSAPP_MODE || 'production').toLowerCase() === 'test' ? 'test' : 'production' // 'test' | 'production'
  },
  webhook: {
    verifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'WORKFLOW_VERIFY_TOKEN',
  },
  ai: {
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqModel: process.env.GROQ_MODEL || 'llama3-70b-8192',
    autoReplyWebhook: String(process.env.AI_AUTO_REPLY_WEBHOOK || '').toLowerCase() === 'true'
  }
};

// Initialize Groq client
let groqClient = null;
try {
  const { Groq } = require('groq-sdk');
  groqClient = new Groq({ apiKey: (config.ai.groqApiKey || process.env.GROQ_API_KEY || '').trim() });
} catch (e) {
  console.warn('groq-sdk not installed. Run: npm i groq-sdk');
}

// Helper: generate text with Groq GPT-OSS
async function generateWithGroq(userPrompt, systemPrompt) {
  if (!groqClient) throw new Error('groq_not_configured');
  const model = config.ai.groqModel || 'openai/gpt-oss-120b';
  const resp = await groqClient.chat.completions.create({
    model,
    temperature: 0.7,
    max_completion_tokens: 1024,
    messages: [
      { role: 'system', content: String(systemPrompt || 'You are a concise business assistant.').slice(0, 4000) },
      { role: 'user', content: String(userPrompt || '').slice(0, 4000) }
    ]
  });
  return resp?.choices?.[0]?.message?.content?.trim() || '';
}

// Helper to choose WhatsApp credentials by mode
function getWhatsappCreds(preferredMode) {
  const m = (preferredMode || config.whatsapp.mode) === 'test' ? 'test' : 'production';
  const token = m === 'test' ? (config.whatsapp.testToken || config.whatsapp.token) : config.whatsapp.token;
  const phoneNumberId = m === 'test' ? (config.whatsapp.testPhoneNumberId || config.whatsapp.phoneNumberId) : config.whatsapp.phoneNumberId;
  return { mode: m, token, phoneNumberId };
}

console.log('🚀 Starting Work Automation Platform');
console.log('=====================================');
console.log(`PORT: ${PORT}`);
console.log(`Instagram App ID set: ${!!config.instagram.appId}`);
console.log(`Facebook App ID set: ${!!config.facebook.appId}`);
console.log(`Facebook Callback URL: ${config.facebook.callbackUrl}`);
console.log(`WhatsApp Phone ID set: ${!!config.whatsapp.phoneNumberId}`);
console.log('=====================================');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize local stores on boot
try { loadMessengerStore(); } catch (_) {}
try { ensureDir(path.dirname(profilePromptsFile)); readJsonSafeEnsure(profilePromptsFile, { profiles: {} }); } catch (_) {}

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

// Facebook OAuth strategy and routes (always mounted, with config checks)
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
}

app.get('/auth/facebook', (req, res, next) => {
  if (!config.facebook.appId || !config.facebook.appSecret) {
    return res.status(500).send('Facebook auth not configured on server. Set FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_CALLBACK.');
  }
  console.log(`[FB OAuth] Redirecting to Facebook with callbackURL=${config.facebook.callbackUrl}`);
  // Request additional scopes needed to list pages and manage messaging/webhooks
  const scope = ['email', 'public_profile', 'pages_show_list', 'pages_messaging', 'pages_read_engagement', 'pages_manage_metadata'];
  return passport.authenticate('facebook', { scope })(req, res, next);
});

app.get('/auth/facebook/callback', (req, res, next) => {
  if (!config.facebook.appId || !config.facebook.appSecret) {
    return res.redirect('/?error=facebook_not_configured');
  }
  // Use a custom callback so we can auto-bind a Page after successful login
  return passport.authenticate('facebook', { failureRedirect: '/' }, async (_err, user) => {
    try {
      if (!user || !user.accessToken) {
        return res.redirect('/?error=facebook_auth_failed');
      }
      // Fetch user's pages and pick the first one (can be enhanced to allow selection)
      const pagesResp = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
        params: { access_token: user.accessToken, fields: 'id,name,access_token' }
      });
      const firstPage = pagesResp.data && Array.isArray(pagesResp.data.data) ? pagesResp.data.data[0] : null;
      if (!firstPage || !firstPage.id || !firstPage.access_token) {
        return res.redirect('/?error=no_page_found');
      }
      // Bind Page to runtime config and mark provider as facebook
      config.facebook.pageId = firstPage.id;
      config.facebook.pageToken = firstPage.access_token;
      config.facebook.provider = 'facebook';
      req.session.facebookConnected = true;
      // Subscribe app to page webhooks (best-effort)
      try { await fbSubscribePageIfNeeded(); } catch (_) {}
      return res.redirect('/dashboard/chats?connected=facebook');
    } catch (e) {
      console.error('Facebook auto-bind error:', serializeError(e));
      return res.redirect('/?error=facebook_bind_failed');
    }
  })(req, res, next);
});

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// In-memory stores (replace with DB later if needed)
const users = new Map(); // key: instagram user id
const configurations = new Map(); // key: userId -> { postId, keyword, response }
const tokenExpirations = new Map(); // key: userId -> timestamp
// Map conversation thread id -> participant PSID for Facebook provider
const fbConvParticipants = new Map();
// Per-conversation AI mode switch (true = allow auto-replies)
const aiModeByConversation = new Map();
// Track FB users we've already greeted once (per process run)
const firstMessageReplied = new Set(); // keys like `fb:${senderId}`
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



// Instagram OAuth endpoints (Business)
app.get('/auth/instagram/business', (req, res) => {
  try {
    const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${encodeURIComponent(config.instagram.appId)}&redirect_uri=${encodeURIComponent(config.instagram.businessRedirectUri)}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`;
    return res.redirect(authUrl);
  } catch (e) {
    return res.status(500).send('Failed to start Instagram Business OAuth');
  }
});

// Exchange code -> token (server side, Business)
app.get('/auth/instagram/business/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect('/?error=missing_code');

    // Exchange code for long-lived token
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', new URLSearchParams({
      client_id: config.instagram.appId,
      client_secret: config.instagram.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: config.instagram.businessRedirectUri,
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

    res.redirect(`/dashboard/chats?user_id=${user_id}`);
  } catch (err) {
    console.error('Instagram auth error:', serializeError(err));
    res.redirect('/?error=instagram_auth_failed');
  }
});

// Instagram Basic callback (uses your exact redirect_uri)
app.get('/auth/instagram/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect('/?error=missing_code');

    // Validate required envs
    if (!config.instagram.appId || !config.instagram.appSecret || !config.instagram.redirectUri) {
      console.error('Instagram config missing:', {
        hasAppId: !!config.instagram.appId,
        hasAppSecret: !!config.instagram.appSecret,
        redirectUri: config.instagram.redirectUri,
      });
      return res.redirect('/?error=instagram_config');
    }

    // Prepare form as application/x-www-form-urlencoded
    const form = new URLSearchParams();
    form.append('client_id', config.instagram.appId);
    form.append('client_secret', config.instagram.appSecret);
    form.append('grant_type', 'authorization_code');
    form.append('redirect_uri', config.instagram.redirectUri);
    form.append('code', String(code));

    console.log('IG OAuth exchange:', {
      hasClientId: !!config.instagram.appId,
      redirectMatches: typeof config.instagram.redirectUri === 'string' && config.instagram.redirectUri.includes('/auth/instagram/callback'),
    });

    const tokenResponse = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      form,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    if (!tokenResponse.data?.access_token) {
      throw new Error('Invalid token response: ' + JSON.stringify(tokenResponse.data));
    }

    const access_token = tokenResponse.data.access_token;
    const user_id = String(tokenResponse.data.user_id);

    const expirationTime = Date.now() + 60 * 24 * 60 * 60 * 1000;
    tokenExpirations.set(user_id, expirationTime);

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

    res.redirect(`/dashboard/chats?user_id=${user_id}`);
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
    if (!userId || !postId || !response) return res.status(400).json({ error: 'Missing required fields' });
    const user = users.get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    configurations.set(userId, { postId, keyword: keyword || '', response });
    res.json({ success: true });
  } catch (err) {
    console.error('IG config error:', serializeError(err));
    res.status(500).json({ error: 'Configuration failed' });
  }
});

// Resolve IG business account id from Page token; caches value in-memory
async function ensureIgBusinessId() {
  try {
    // If already resolved and cached on config, reuse
    if (config.facebook.igBusinessId) return config.facebook.igBusinessId;
    if (!config.facebook.pageToken) return null;

    // 1) Get Page ID if missing
    if (!config.facebook.pageId) {
      const mePages = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
        params: { access_token: config.facebook.pageToken, fields: 'id,name' }
      });
      const first = mePages.data?.data?.[0];
      if (!first?.id) return null;
      config.facebook.pageId = first.id;
    }

    // 2) Get instagram_business_account from Page
    const pageResp = await axios.get(`https://graph.facebook.com/v21.0/${config.facebook.pageId}`, {
      params: { fields: 'instagram_business_account{id,username}', access_token: config.facebook.pageToken }
    });
    const igBiz = pageResp.data?.instagram_business_account?.id;
    if (!igBiz) return null;
    config.facebook.igBusinessId = igBiz;
    return igBiz;
  } catch (e) {
    console.warn('ensureIgBusinessId error:', e?.response?.data || e.message);
    return null;
  }
}

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

    // Send via IG Business account using Page token
    const igBizId = await ensureIgBusinessId();
    if (!igBizId) return res.status(500).json({ error: 'IG business account not resolved' });
    const igResp = await axios.post(`https://graph.facebook.com/v23.0/${igBizId}/messages`, {
      recipient: { username },
      message: { text: message },
    }, {
      params: { access_token: config.facebook.pageToken },
      headers: { 'Content-Type': 'application/json' },
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

// Integration status endpoint
app.get('/api/integrations/status', (req, res) => {
  res.json({
    facebook: {
      connected: !!req.session.facebookConnected,
      accountName: req.user?.displayName || null,
    },
    instagram: {
      connected: false,
    },
    whatsapp: {
      connected: !!(config.whatsapp.phoneNumberId && config.whatsapp.token),
      phoneNumberId: config.whatsapp.phoneNumberId || null,
    }
  });
});

// Messenger data store with JSON persistence
const dataDir = path.join(__dirname, 'data');
const messengerFile = path.join(dataDir, 'messenger.json');
const profilePromptsFile = path.join(dataDir, 'profilePrompts.json');

function ensureDir(p) {
  try { fs.mkdirSync(p, { recursive: true }); } catch (_) {}
}

function readJsonSafe(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read JSON', file, e.message);
    return fallback;
  }
}

function readJsonSafeEnsure(file, fallback) {
  try {
    if (!fs.existsSync(file)) {
      ensureDir(path.dirname(file));
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read JSON (ensure)', file, e.message);
    return fallback;
  }
}

function writeJsonSafe(file, data) {
  try {
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to write JSON', file, e.message);
  }
}

const messengerStore = {
  conversations: new Map(), // convId -> { id, name, profilePic, lastMessage, timestamp, unreadCount }
  messages: new Map(), // convId -> [ { id, sender, text, timestamp } ]
  systemPrompts: new Map(), // convId -> string
  responseTimes: new Map(), // convId -> number[] (ms)
  pendingAutoStart: new Map(), // nameNormalized -> { systemPrompt?: string, createdAt: ISO }
};

// Track last customer message time per conversation for response time measurement (not persisted)
const lastCustomerAtByConversation = new Map();

function loadMessengerStore() {
  const json = readJsonSafeEnsure(messengerFile, { conversations: [], messages: {}, systemPrompts: {}, responseTimes: {}, pendingAutoStart: {} });
  messengerStore.conversations = new Map(json.conversations.map(c => [c.id, c]));
  messengerStore.messages = new Map(Object.entries(json.messages));
  messengerStore.systemPrompts = new Map(Object.entries(json.systemPrompts || {}));
  messengerStore.responseTimes = new Map(Object.entries(json.responseTimes || {}));
  messengerStore.pendingAutoStart = new Map(Object.entries(json.pendingAutoStart || {}));
}

function saveMessengerStore() {
  const conversations = Array.from(messengerStore.conversations.values());
  const messages = Object.fromEntries(Array.from(messengerStore.messages.entries()));
  const systemPrompts = Object.fromEntries(Array.from(messengerStore.systemPrompts.entries()));
  const responseTimes = Object.fromEntries(Array.from(messengerStore.responseTimes.entries()));
  const pendingAutoStart = Object.fromEntries(Array.from(messengerStore.pendingAutoStart.entries()));
  writeJsonSafe(messengerFile, { conversations, messages, systemPrompts, responseTimes, pendingAutoStart });
}

function seedMessengerDataIfEmpty() {
  if (messengerStore.conversations.size > 0) return;
  const now = () => new Date().toISOString();
  const convs = [
    { id: 'conv_1', name: 'Aarav Sharma', username: 'aarav.sharma', profilePic: 'https://unavatar.io/aarav.sharma', lastMessage: 'Can you share pricing?', timestamp: now(), unreadCount: 2 },
    { id: 'conv_2', name: 'Priya Patel', username: 'priya.patel', profilePic: 'https://unavatar.io/priya.patel', lastMessage: 'Thanks for the info!', timestamp: now(), unreadCount: 0 },
    { id: 'conv_3', name: 'Rohan Gupta', username: 'rohan.g', profilePic: 'https://unavatar.io/rohan.g', lastMessage: 'Let’s schedule a demo.', timestamp: now(), unreadCount: 1 },
  ];
  convs.forEach(c => messengerStore.conversations.set(c.id, c));
  messengerStore.messages.set('conv_1', [
    { id: 'm1', sender: 'customer', text: 'Hi! I am interested in your product.', timestamp: now() },
    { id: 'm2', sender: 'agent', text: 'Great! What are you looking to automate?', timestamp: now() },
    { id: 'm3', sender: 'customer', text: 'Can you share pricing?', timestamp: now() },
  ]);
  messengerStore.messages.set('conv_2', [
    { id: 'm4', sender: 'customer', text: 'Appreciate the quick response.', timestamp: now() },
    { id: 'm5', sender: 'agent', text: 'Happy to help!', timestamp: now() },
    { id: 'm6', sender: 'customer', text: 'Thanks for the info!', timestamp: now() },
  ]);
  messengerStore.messages.set('conv_3', [
    { id: 'm7', sender: 'customer', text: 'Can we do a demo this week?', timestamp: now() },
    { id: 'm8', sender: 'agent', text: 'Yes! How about Wednesday 3 PM?', timestamp: now() },
    { id: 'm9', sender: 'customer', text: 'Let’s schedule a demo.', timestamp: now() },
  ]);
  saveMessengerStore();
}

ensureDir(dataDir);
loadMessengerStore();
// Allow demo seeding only when explicitly enabled
if (String(process.env.SEED_DEMO_DATA || '').toLowerCase() === 'true' && config.facebook.provider !== 'facebook') {
  seedMessengerDataIfEmpty();
}

// --- Campaigns store with JSON persistence ---
const campaignsFile = path.join(dataDir, 'campaigns.json');

const campaignsStore = {
  campaigns: new Map(), // id -> campaign
};

function loadCampaignsStore() {
  const json = readJsonSafe(campaignsFile, { campaigns: [] });
  campaignsStore.campaigns = new Map((json.campaigns || []).map(c => [c.id, c]));
}

function saveCampaignsStore() {
  const campaigns = Array.from(campaignsStore.campaigns.values());
  writeJsonSafe(campaignsFile, { campaigns });
}

loadCampaignsStore();

function makeCampaignNameFromDescription(desc = '') {
  const m = String(desc).match(/for\s+([\w-]+)/i);
  const product = (m && m[1]) || 'Product';
  return `${product} Awareness Campaign`;
}

function buildSystemPromptFromCampaign(c) {
  const persona = c?.persona || {};
  const brief = c?.brief || {};
  const productMatch = String(brief.description || '').match(/for\s+([\w-]+)/i);
  const product = (productMatch && productMatch[1]) || 'your product';
  const tone = persona.tone ? `Tone: ${persona.tone}.` : '';
  const notes = persona.notes ? ` Notes: ${persona.notes}.` : '';
  return `You are ${persona.name || 'an assistant'}, a ${persona.position || 'sales assistant'} for ${product}. ${tone}${notes} Be concise, friendly, and helpful. If user asks about pricing or demo, guide them politely.`;
}

// Create campaign
app.post('/api/campaigns', (req, res) => {
  try {
    const payload = req.body || {};
    const id = 'camp_' + Date.now();
    const campaign = {
      id,
      name: payload.name || makeCampaignNameFromDescription(payload?.brief?.description || ''),
      status: 'draft',
      createdAt: new Date().toISOString(),
      brief: payload.brief || { description: '', channels: [] },
      persona: payload.persona || { name: '', position: '', tone: '', notes: '' },
      leads: payload.leads || { targetAudience: '', leadSource: '' },
      message: payload.message || { initialMessage: '', hasOptOut: true, followUpMessage: '' },
      flow: payload.flow || { objective: '', steps: [] },
      files: payload.files || { links: [], attachments: [] },
    };
    campaignsStore.campaigns.set(id, campaign);
    saveCampaignsStore();
    return res.json({ success: true, campaign });
  } catch (e) {
    console.error('Create campaign error:', serializeError(e));
    return res.status(500).json({ success: false, message: 'create_campaign_failed' });
  }
});

// List campaigns
app.get('/api/campaigns', (_req, res) => {
  try {
    const list = Array.from(campaignsStore.campaigns.values()).map(c => {
      let sent = 0, replied = 0;
      const convId = c.conversationId;
      if (convId) {
        const msgs = messengerStore.messages.get(convId) || [];
        // Messages we sent (AI or agent)
        sent = msgs.filter(m => m.sender === 'ai' || m.sender === 'agent').length;
        // Customer messages that received a subsequent reply
        for (let i = 0; i < msgs.length; i++) {
          if (msgs[i].sender !== 'customer') continue;
          for (let j = i + 1; j < msgs.length; j++) {
            const n = msgs[j];
            if (n.sender === 'ai' || n.sender === 'agent') { replied += 1; break; }
          }
        }
      }
      return { ...c, stats: { sent, replied } };
    });
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'list_campaigns_failed' });
  }
});

// Stop campaign: pause AI for its conversation
app.post('/api/campaigns/:id/stop', (req, res) => {
  try {
    const id = req.params.id;
    const campaign = campaignsStore.campaigns.get(id);
    if (!campaign) return res.status(404).json({ success: false, message: 'campaign_not_found' });
    if (campaign.conversationId) {
      aiModeByConversation.set(campaign.conversationId, false);
    }
    campaign.status = 'paused';
    campaignsStore.campaigns.set(id, campaign);
    saveCampaignsStore();
    return res.json({ success: true, campaign });
  } catch (e) {
    console.error('Stop campaign error:', serializeError(e));
    return res.status(500).json({ success: false, message: 'stop_campaign_failed' });
  }
});

// Delete campaign: disable AI and remove from store
app.delete('/api/campaigns/:id', (req, res) => {
  try {
    const id = req.params.id;
    const campaign = campaignsStore.campaigns.get(id);
    if (!campaign) return res.status(404).json({ success: false, message: 'campaign_not_found' });
    if (campaign.conversationId) {
      aiModeByConversation.set(campaign.conversationId, false);
    }
    campaignsStore.campaigns.delete(id);
    saveCampaignsStore();
    return res.json({ success: true });
  } catch (e) {
    console.error('Delete campaign error:', serializeError(e));
    return res.status(500).json({ success: false, message: 'delete_campaign_failed' });
  }
});

// Start campaign: create a conversation, set system prompt, send initial message
app.post('/api/campaigns/:id/start', async (req, res) => {
  try {
    const id = req.params.id;
    const campaign = campaignsStore.campaigns.get(id);
    if (!campaign) return res.status(404).json({ success: false, message: 'campaign_not_found' });

    // If campaign already has a conversation, just resume AI and set status active
    if (campaign.conversationId) {
      aiModeByConversation.set(campaign.conversationId, true);
      campaign.status = 'active';
      campaignsStore.campaigns.set(id, campaign);
      saveCampaignsStore();
      return res.json({ success: true, campaign });
    }

    const channels = campaign?.brief?.channels || [];
    const platform = channels.includes('facebook') ? 'facebook' : (channels[0] || 'facebook');

    // Build or find a conversation target
    let conversationId = null;

    if (platform === 'facebook' && config.facebook.provider === 'facebook' && config.facebook.pageToken && config.facebook.pageId) {
      // Use provided conversationId or pick the latest page conversation
      let fbThreadId = (req.body && req.body.conversationId) || null;
      // If a conversation is provided, also enable AI mode for it
      if (fbThreadId) aiModeByConversation.set(fbThreadId, true);
      try {
        if (!fbThreadId) {
          const data = await fbApiGet(`${config.facebook.pageId}/conversations`, { fields: 'id,updated_time,participants.limit(10){id,name}', limit: 1 });
          const first = (data.data || [])[0];
          if (first && first.id) fbThreadId = first.id;
        }
        if (fbThreadId) {
          // Cache PSID for send API
          try {
            const conv = await fbApiGet(`${fbThreadId}`, { fields: 'participants.limit(10){id,name}' });
            const parts = (conv.participants && conv.participants.data) || [];
            const other = parts.find(p => String(p.id) !== String(config.facebook.pageId)) || parts[0];
            if (other && other.id) fbConvParticipants.set(fbThreadId, other.id);
          } catch (_) {}

          // Set system prompt for this thread
          messengerStore.systemPrompts.set(fbThreadId, buildSystemPromptFromCampaign(campaign));
          saveMessengerStore();
          // Auto-enable AI mode for this campaign conversation
          aiModeByConversation.set(fbThreadId, true);

          // Send initial message via Facebook
          const text = String(campaign?.message?.initialMessage || '').trim() || `Hi! This is ${campaign?.persona?.name || 'our team'} from ${makeCampaignNameFromDescription(campaign?.brief?.description || '')}. How can we help you today?`;
          await axios.post(`https://graph.facebook.com/v21.0/me/messages`, {
            recipient: { id: fbConvParticipants.get(fbThreadId) },
            message: { text: text.slice(0, 900) },
            messaging_type: 'RESPONSE'
          }, { params: { access_token: config.facebook.pageToken } });

          // Emit to frontend and mark conversationId
          io.emit('messenger:message_created', { conversationId: fbThreadId, message: { id: 'm_' + Date.now(), sender: 'agent', text, timestamp: new Date().toISOString(), isRead: true } });
          conversationId = fbThreadId;
        }
      } catch (fbStartErr) {
        console.warn('FB campaign start send failed:', serializeError(fbStartErr));
      }
    }

    // Local/simulated conversation
    if (!conversationId) {
      const convId = 'conv_' + Date.now();
      const name = campaign?.persona?.name || 'Prospect';
      const conv = {
        id: convId,
        name,
        username: (name || 'prospect').toLowerCase().replace(/\s+/g, '.'),
        profilePic: `https://unavatar.io/${encodeURIComponent(name)}`,
        lastMessage: '',
        timestamp: new Date().toISOString(),
        unreadCount: 0,
      };
      messengerStore.conversations.set(convId, conv);
      messengerStore.messages.set(convId, []);
      messengerStore.systemPrompts.set(convId, buildSystemPromptFromCampaign(campaign));
      saveMessengerStore();
      // Auto-enable AI mode for this local campaign conversation
      aiModeByConversation.set(convId, true);
      io.emit('messenger:conversation_created', conv);
      conversationId = convId;
    }

    // Send initial message (agent)
    const initialText = String(campaign?.message?.initialMessage || '').trim() || `Hi! This is ${campaign?.persona?.name || 'our team'} from ${makeCampaignNameFromDescription(campaign?.brief?.description || '')}. How can we help you today?`;
    const arr = messengerStore.messages.get(conversationId) || [];
    const msg = { id: 'm_' + Date.now(), sender: 'agent', text: initialText, timestamp: new Date().toISOString(), isRead: true };
    arr.push(msg);
    messengerStore.messages.set(conversationId, arr);
    const conv = messengerStore.conversations.get(conversationId);
    if (conv) {
      conv.lastMessage = initialText;
      conv.timestamp = new Date().toISOString();
      messengerStore.conversations.set(conversationId, conv);
    }
    saveMessengerStore();
    io.emit('messenger:message_created', { conversationId, message: msg });

    // If running locally (not FB/WA thread), simulate a customer message to kick off AI
    try {
      const isLocalConv = !String(conversationId).startsWith('wa_') && config.facebook.provider !== 'facebook';
      if (isLocalConv && groqClient && config.ai.autoReplyWebhook && (aiModeByConversation.get(conversationId) === true)) {
        const customerText = campaign?.flow?.objective
          ? `Hi, I want to know more about ${campaign.flow.objective}.`
          : 'Hi, can you tell me more?';
        const custMsg = { id: 'c_' + Date.now(), sender: 'customer', text: customerText, timestamp: new Date().toISOString(), isRead: true };
        arr.push(custMsg);
        messengerStore.messages.set(conversationId, arr);
        const conv2 = messengerStore.conversations.get(conversationId);
        if (conv2) {
          conv2.lastMessage = customerText;
          conv2.timestamp = new Date().toISOString();
          messengerStore.conversations.set(conversationId, conv2);
        }
        saveMessengerStore();
        io.emit('messenger:message_created', { conversationId, message: custMsg });

        // Generate AI reply (Groq GPT-OSS)
        const stored = messengerStore.systemPrompts.get(conversationId) || '';
        const baseSystem = String(stored || '').trim() || 'You are a helpful business chat assistant. Reply concisely and politely.';
        const replyText = await generateWithGroq(String(customerText), baseSystem);
        if (replyText) {
          const aiMsg = { id: 'ai_' + (Date.now() + 1), sender: 'ai', text: replyText, timestamp: new Date().toISOString(), isRead: true };
          arr.push(aiMsg);
          messengerStore.messages.set(conversationId, arr);
          const conv3 = messengerStore.conversations.get(conversationId);
          if (conv3) {
            conv3.lastMessage = replyText;
            conv3.timestamp = new Date().toISOString();
            messengerStore.conversations.set(conversationId, conv3);
          }
          saveMessengerStore();
          io.emit('messenger:message_created', { conversationId, message: aiMsg });
        }
      }
    } catch (simErr) {
      console.warn('Campaign start simulation failed:', serializeError(simErr));
    }

    // Mark campaign active
    campaign.status = 'active';
    campaign.startedAt = new Date().toISOString();
    campaign.platform = platform;
    campaign.conversationId = conversationId;
    campaignsStore.campaigns.set(id, campaign);
    saveCampaignsStore();

    return res.json({ success: true, campaign });
  } catch (e) {
    console.error('Start campaign error:', serializeError(e));
    return res.status(500).json({ success: false, message: 'start_campaign_failed' });
  }
});

// Facebook Messenger proxy helpers
async function fbApiGet(pathSeg, params = {}) {
  const url = `https://graph.facebook.com/v21.0/${pathSeg}`;
  const response = await axios.get(url, { params: { access_token: config.facebook.pageToken, ...params } });
  return response.data;
}
async function fbApiPost(pathSeg, payload = {}) {
  const url = `https://graph.facebook.com/v21.0/${pathSeg}`;
  const response = await axios.post(url, payload, { params: { access_token: config.facebook.pageToken } });
  return response.data;
}

// --- Helpers ---
async function fbGetProfilePic(psid) {
  try {
    if (!psid || !config.facebook.pageToken) return null;
    const data = await fbApiGet(`${psid}`, { fields: 'id,profile_pic' });
    return data && (data.profile_pic || null);
  } catch (err) {
    return null;
  }
}

// Find FB conversation thread by participant PSID
async function findThreadIdByPsid(psid) {
  try {
    const data = await fbApiGet(`${config.facebook.pageId}/conversations`, { fields: 'id,participants.limit(10){id}', limit: 200 });
    const conv = (data.data || []).find(c => {
      const parts = (c.participants && c.participants.data) || [];
      return parts.some(p => String(p.id) === String(psid));
    });
    return conv ? conv.id : null;
  } catch (err) {
    return null;
  }
}

// Unified AI generator using Groq GPT-OSS
async function generateWithGemini(userText, systemPrompt) { // uses Groq under the hood
  // Kept function name for backward compatibility; implementation uses Groq
  if (!groqClient) throw new Error('groq_not_configured');
  const messages = [];
  if (systemPrompt && String(systemPrompt).trim()) {
    messages.push({ role: 'system', content: String(systemPrompt).slice(0, 8000) });
  }
  messages.push({ role: 'user', content: String(userText || '').slice(0, 4000) });
  const resp = await groqClient.chat.completions.create({
    model: config.ai.groqModel || 'llama3-70b-8192',
    messages,
    temperature: 0.7,
    max_completion_tokens: 512,
    top_p: 1
  });
  const txt = resp?.choices?.[0]?.message?.content || '';
  return String(txt).trim();
}

app.get('/api/messenger/conversations', async (_req, res) => {
  try {
    if (config.facebook.provider === 'facebook') {
      if (!config.facebook.pageId || !config.facebook.pageToken) {
        return res.status(400).json({ error: 'facebook_not_configured' });
      }
      const data = await fbApiGet(`${config.facebook.pageId}/conversations`, { fields: 'id,updated_time,participants.limit(10){id,name,profile_pic}', limit: 200 });
      const convs = await Promise.all((data.data || []).map(async (c) => {
        const participants = (c.participants && c.participants.data) || [];
        const other = participants.find(p => String(p.id) !== String(config.facebook.pageId)) || participants[0] || {};
        // Cache PSID for send API
        if (c.id && other.id) fbConvParticipants.set(c.id, other.id);
        // Ensure AI mode default is OFF for FB threads unless explicitly enabled
        if (c.id && !aiModeByConversation.has(c.id)) aiModeByConversation.set(c.id, false);
        // Try to get real FB profile picture
        let profilePic = other.profile_pic || null;
        if (!profilePic && other.id) {
          profilePic = await fbGetProfilePic(other.id);
        }
        // Fallback avatar
        if (!profilePic) profilePic = `https://unavatar.io/${encodeURIComponent(other.name || 'user')}`;
        return {
          id: c.id,
          name: other.name || 'Conversation',
          username: (other.name || 'conversation').toLowerCase().replace(/\s+/g, '.'),
          profilePic,
          lastMessage: '',
          timestamp: c.updated_time || new Date().toISOString(),
          unreadCount: 0,
        };
      }));
      return res.json(convs);
    }
    const list = Array.from(messengerStore.conversations.values());
    return res.json(list);
  } catch (err) {
    console.error('FB conversations error:', serializeError(err));
    return res.status(500).json({ error: 'Error fetching conversations' });
  }
});

app.get('/api/messenger/messages', async (req, res) => {
  const { conversationId } = req.query;
  if (!conversationId) return res.status(400).json({ error: 'conversationId required' });
  try {
    if (config.facebook.provider === 'facebook') {
      if (!config.facebook.pageToken || !config.facebook.pageId) {
        return res.status(400).json({ error: 'facebook_not_configured' });
      }
      const data = await fbApiGet(`${conversationId}/messages`, { fields: 'message,from,created_time', limit: 50 });
      const items = (data.data || []).reverse().map((m, idx) => ({
        id: m.id || `fb_${idx}`,
        sender: m.from && (String(m.from.id) === String(config.facebook.pageId) || String(m.from.id) === String(config.facebook.appId)) ? 'agent' : 'customer',
        text: m.message || '',
        timestamp: m.created_time || new Date().toISOString(),
        isRead: true,
      }));
      return res.json(items);
    }
    const msgs = messengerStore.messages.get(conversationId) || [];
    const systemPrompt = messengerStore.systemPrompts.get(conversationId) || '';
    const aiEnabled = aiModeByConversation.get(conversationId) === true;
    return res.json({ messages: msgs, systemPrompt, aiMode: aiEnabled });
  } catch (err) {
    console.error('FB messages error:', serializeError(err));
    return res.status(500).json({ error: 'Error fetching messages' });
  }
});

// Analyze a conversation with AI and return structured insights
app.post('/api/ai/analyze-conversation', async (req, res) => {
  try {
    const conversationId = req.body?.conversationId || req.query?.conversationId;
    if (!conversationId) return res.status(400).json({ error: 'conversationId required' });

    // Fetch messages (reuse FB path when configured)
    let messages = [];
    if (config.facebook.provider === 'facebook') {
      if (!config.facebook.pageToken || !config.facebook.pageId) {
        return res.status(400).json({ error: 'facebook_not_configured' });
      }
      const data = await fbApiGet(`${conversationId}/messages`, { fields: 'message,from,created_time', limit: 100 });
      messages = (data.data || []).reverse().map((m, idx) => ({
        id: m.id || `fb_${idx}`,
        sender: m.from && (String(m.from.id) === String(config.facebook.pageId) || String(m.from.id) === String(config.facebook.appId)) ? 'agent' : 'customer',
        text: m.message || '',
        timestamp: m.created_time || new Date().toISOString(),
      }));
    } else {
      messages = messengerStore.messages.get(conversationId) || [];
    }

    // Build compact transcript (last 40 messages)
    const last = messages.slice(-40).map(m => `${m.sender}: ${m.text}`);
    const systemPrompt = `You are a sales counsellor AI. Read the chat transcript and output a concise JSON with:
- intent: short description of what the user wants
- interestScore: 0-100
- stage: one of [awareness, consideration, evaluation, decision, post-sale]
- urgency: low|medium|high
- objections: array of strings
- suggestedNextStep: one actionable next step
- recommendedContent: array of content suggestions (e.g., pricing page, case study)
- summary: 2-3 line summary
Return ONLY JSON.`;

    // Merge business/system prompt into the AI instruction and request multiple future actions
    const providedSP = (req.body && req.body.systemPrompt) ? String(req.body.systemPrompt) : '';
    const storedSP = messengerStore.systemPrompts.get(conversationId) || '';
    const businessContext = (providedSP || storedSP).trim();
    const sp2 = `${systemPrompt}${businessContext ? `\nBusiness context (what we sell, positioning, tone): ${businessContext}\n` : ''}\nAdditionally, include nextBestActions: an array of 3 concise, concrete future actions tailored to the context (with brief reasoning).`;

    let aiResult = null;
    try {
      const text = await generateWithGemini(last.join('\n'), sp2);
      try { aiResult = JSON.parse(text); } catch (_) { aiResult = null; }
    } catch (e) {
      aiResult = null;
    }

    // Heuristic fallback if AI key missing or parsing failed
    if (!aiResult) {
      const all = last.join('\n').toLowerCase();
      const wantsDemo = /demo|schedule|call|meeting/.test(all);
      const pricing = /price|pricing|cost|budget/.test(all);
      const timeline = /today|this week|asap|urgent|soon/.test(all);
      const objections = [];
      if (/too (expensive|costly)|budget/.test(all)) objections.push('Pricing concerns');
      if (/not sure|confus|how it work/.test(all)) objections.push('Clarity/fit');
      const interestScore = Math.min(100, (wantsDemo ? 60 : 0) + (pricing ? 30 : 0) + (timeline ? 20 : 0) + (messages.filter(m=>m.sender==='customer').length > 3 ? 10 : 0));
      aiResult = {
        intent: wantsDemo ? 'Wants a demo' : (pricing ? 'Evaluating pricing' : 'General inquiry'),
        interestScore,
        stage: wantsDemo ? 'evaluation' : (pricing ? 'consideration' : 'awareness'),
        urgency: timeline ? 'high' : (pricing ? 'medium' : 'low'),
        objections,
        suggestedNextStep: wantsDemo ? 'Offer available demo slots and send calendar link' : (pricing ? 'Share pricing overview and value props' : 'Ask 1-2 qualifying questions to understand needs'),
        recommendedContent: wantsDemo ? ['Case study', 'Product walkthrough video'] : (pricing ? ['Pricing page', 'ROI calculator'] : ['One-pager overview']),
        summary: 'Heuristic analysis based on recent messages.'
      };
    }

    return res.json({ conversationId, analysis: aiResult });
  } catch (err) {
    console.error('Analyze conversation error:', serializeError(err));
    return res.status(500).json({ error: 'analyze_failed' });
  }
});

// Per-profile system prompts store (Render Persistent Disk friendly)
// Schema: { profiles: { [profileId: string]: { systemPrompt: string, updatedAt: ISO, sources?: any[] } } }
app.get('/api/profiles/prompts', (_req, res) => {
  try {
    const data = readJsonSafeEnsure(profilePromptsFile, { profiles: {} });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'read_failed' });
  }
});
app.post('/api/profiles/prompts', (req, res) => {
  try {
    const { profileId, systemPrompt, sources } = req.body || {};
    if (!profileId) return res.status(400).json({ error: 'profileId required' });
    const data = readJsonSafeEnsure(profilePromptsFile, { profiles: {} });
    data.profiles = data.profiles || {};
    data.profiles[String(profileId)] = {
      systemPrompt: String(systemPrompt || ''),
      updatedAt: new Date().toISOString(),
      ...(sources ? { sources } : {})
    };
    writeJsonSafe(profilePromptsFile, data);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'write_failed' });
  }
});

// Create conversation
app.post('/api/messenger/conversations', (req, res) => {
  const { name, username, profilePic, autoStartIfFirstMessage, systemPrompt, initialMessage, profileId } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const id = 'conv_' + Date.now();
  const conv = {
    id,
    name,
    username: username || name.toLowerCase().replace(/\s+/g, '.'),
    profilePic: profilePic || `https://unavatar.io/${encodeURIComponent(name)}`,
    lastMessage: '',
    timestamp: new Date().toISOString(),
    unreadCount: 0,
  };
  messengerStore.conversations.set(id, conv);
  messengerStore.messages.set(id, []);
  // If a profileId is supplied and we have a saved system prompt for that profile, seed it for this conversation
  try {
    const profiles = readJsonSafeEnsure(profilePromptsFile, { profiles: {} });
    const sp = profiles?.profiles?.[String(profileId || '')]?.systemPrompt || '';
    messengerStore.systemPrompts.set(id, String(systemPrompt || sp || ''));
  } catch (_) {
    messengerStore.systemPrompts.set(id, String(systemPrompt || ''));
  }
  aiModeByConversation.set(id, false); // default OFF until user enables
  // If requested, remember by normalized name so that on first inbound message AI turns on and sends initialMessage
  if (autoStartIfFirstMessage === true && (username || name)) {
    const key = String(username || name).toLowerCase().replace(/\s+/g, '');
    messengerStore.pendingAutoStart.set(key, { systemPrompt: String(systemPrompt || ''), initialMessage: String(initialMessage || '') , createdAt: new Date().toISOString() });
  }
  saveMessengerStore();
  io.emit('messenger:conversation_created', conv);
  return res.json({ success: true, conversation: conv });
});

// Start automation for a specific contact (by PSID or by matching username to existing convs)
app.post('/api/automation/start-for-contact', async (req, res) => {
  try {
    const { name, messenger, connectedUserId, initialMessage, profileId } = req.body || {};
    if (config.facebook.provider !== 'facebook' || !config.facebook.pageId || !config.facebook.pageToken) {
      return res.status(400).json({ success: false, message: 'facebook_not_configured' });
    }

    const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
    let psid = String(connectedUserId || '').trim();
    let threadId = null;

    if (psid) {
      // We already have a PSID, find its thread
      threadId = await findThreadIdByPsid(psid);
    }

    // If no thread by PSID, try to match messenger username to existing FB conversations by display name
    if (!threadId && messenger) {
      try {
        const data = await fbApiGet(`${config.facebook.pageId}/conversations`, { fields: 'id,participants.limit(10){id,name}', limit: 200 });
        const target = norm(messenger);
        for (const c of (data.data || [])) {
          const parts = (c.participants && c.participants.data) || [];
          const other = parts.find(p => String(p.id) !== String(config.facebook.pageId)) || parts[0];
          if (other && norm(other.name) === target) {
            threadId = c.id;
            psid = other.id;
            break;
          }
        }
      } catch (_) {}
    }

    // If still no threadId, store a pending auto-start entry so when they message first time, AI turns on and sends initialMessage
    if (!threadId) {
      if (messenger) {
        const key = norm(messenger || name);
        messengerStore.pendingAutoStart.set(key, { systemPrompt: '', initialMessage: String(initialMessage || '') , createdAt: new Date().toISOString() });
        saveMessengerStore();
        return res.json({ success: false, pending: true, message: 'pending_until_first_message' });
      }
      return res.status(400).json({ success: false, message: 'no_thread_found' });
    }

    // Enable AI mode for this thread and send initial message
    fbConvParticipants.set(threadId, psid);
    aiModeByConversation.set(threadId, true);
    // If profileId provided, set system prompt for this thread from profilePrompts.json unless already set
    try {
      const profiles = readJsonSafeEnsure(profilePromptsFile, { profiles: {} });
      const sp = profiles?.profiles?.[String(profileId || '')]?.systemPrompt;
      if (sp && !messengerStore.systemPrompts.get(threadId)) {
        messengerStore.systemPrompts.set(threadId, String(sp));
      }
    } catch (_) {}
    const text = String(initialMessage || `Hi ${name || ''}! How can we help you today?`).trim().slice(0, 900);
    await axios.post(`https://graph.facebook.com/v21.0/me/messages`, {
      recipient: { id: psid },
      message: { text },
      messaging_type: 'RESPONSE'
    }, { params: { access_token: config.facebook.pageToken } });

    // Persist message in local store for UI
    const now = new Date().toISOString();
    const arr = messengerStore.messages.get(threadId) || [];
    const msg = { id: 'agent_' + Date.now(), sender: 'agent', text, timestamp: now, isRead: true };
    arr.push(msg);
    messengerStore.messages.set(threadId, arr);
    const conv = messengerStore.conversations.get(threadId) || { id: threadId, name: name || `FB:${psid}`, profilePic: '', lastMessage: '', timestamp: now, unreadCount: 0 };
    conv.lastMessage = text; conv.timestamp = now;
    messengerStore.conversations.set(threadId, conv);
    saveMessengerStore();
    io.emit('messenger:message_created', { conversationId: threadId, message: msg });

    return res.json({ success: true, conversationId: threadId, psid });
  } catch (e) {
    console.error('start-for-contact error:', serializeError(e));
    return res.status(500).json({ success: false, message: 'start_failed' });
  }
});

app.post('/api/messenger/ai-reply', async (req, res) => {
  try {
    const { conversationId, lastUserMessage, systemPrompt } = req.body || {};
    if (!conversationId) return res.status(400).json({ error: 'conversationId required' });
    if (!groqClient) return res.status(400).json({ error: 'groq_not_configured' });
    // Respect AI mode switch: do not generate if disabled
    if (aiModeByConversation.get(conversationId) !== true) {
      return res.status(400).json({ error: 'ai_mode_disabled' });
    }
    const stored = messengerStore.systemPrompts.get(conversationId) || '';
    const baseSystem = String(systemPrompt || stored || '').trim() || 'You are a helpful business chat assistant. Reply concisely and politely.';
    const reply = await generateWithGemini(String(lastUserMessage || ''), baseSystem);
    const aiNow = new Date().toISOString();
    const msg = { id: 'ai_' + Date.now(), sender: 'ai', text: reply, timestamp: aiNow, isRead: true };
    // persist and compute response time
    const arr = messengerStore.messages.get(conversationId) || [];
    arr.push(msg);
    messengerStore.messages.set(conversationId, arr);
    const conv = messengerStore.conversations.get(conversationId);
    if (conv) { conv.lastMessage = reply; conv.timestamp = aiNow; messengerStore.conversations.set(conversationId, conv); }
    const lastTs = lastCustomerAtByConversation.get(conversationId);
    if (typeof lastTs === 'number') {
      const rt = new Date(aiNow).getTime() - lastTs;
      const list = messengerStore.responseTimes.get(conversationId) || [];
      list.push(rt);
      messengerStore.responseTimes.set(conversationId, list);
      lastCustomerAtByConversation.delete(conversationId);
    }
    saveMessengerStore();
    io.emit('messenger:message_created', { conversationId, message: msg });
    return res.json({ success: true, message: msg });
  } catch (err) {
    console.error('AI reply error:', serializeError(err));
    return res.status(500).json({ error: 'ai_reply_failed' });
  }
});

app.post('/api/messenger/send-message', async (req, res) => {
  const { conversationId, text, sender, systemPrompt } = req.body || {};
  if (!conversationId || !text) return res.status(400).json({ error: 'Missing required fields' });
  try {
    // Normalize sender to 'agent' or 'customer'
    const senderNorm = (sender === 'customer') ? 'customer' : 'agent';

    if (typeof systemPrompt === 'string') {
      messengerStore.systemPrompts.set(conversationId, systemPrompt);
      saveMessengerStore();
      if (!aiModeByConversation.has(conversationId)) aiModeByConversation.set(conversationId, false);
    }

    // WhatsApp outbound via Cloud API
    if (String(conversationId).startsWith('wa_')) {
      const toPhone = String(conversationId).slice(3);
      const { token, phoneNumberId, mode: waMode } = getWhatsappCreds(req.body?.mode);
      if (!token || !phoneNumberId) {
        return res.status(400).json({ error: 'whatsapp_not_configured' });
      }
      try {
        await axios.post(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
          messaging_product: 'whatsapp',
          to: toPhone,
          type: 'text',
          text: { body: String(text).slice(0, 900) }
        }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-WA-Mode': waMode } });
      } catch (waSendErr) {
        console.error('WA outbound send error:', serializeError(waSendErr));
      }
      const nowIso = new Date().toISOString();
      const msg = { id: 'wa_' + Date.now(), sender: senderNorm, text, timestamp: nowIso };
      // persist
      const arr = messengerStore.messages.get(conversationId) || [];
      arr.push(msg);
      messengerStore.messages.set(conversationId, arr);
      const conv = messengerStore.conversations.get(conversationId);
      if (conv) {
        conv.lastMessage = text;
        conv.timestamp = nowIso;
        messengerStore.conversations.set(conversationId, conv);
      }
      saveMessengerStore();
      io.emit('messenger:message_created', { conversationId, message: msg });
      return res.json({ success: true, message: msg });
    }

    if (config.facebook.provider === 'facebook' && config.facebook.pageToken) {
      // For Facebook, we need the participant PSID for this thread
      let recipientId = fbConvParticipants.get(conversationId);
      if (!recipientId) {
        try {
          const conv = await fbApiGet(`${conversationId}`, { fields: 'participants.limit(10){id}' });
          const parts = (conv.participants && conv.participants.data) || [];
          const other = parts.find(p => String(p.id) !== String(config.facebook.pageId)) || parts[0];
          if (other && other.id) {
            recipientId = other.id;
            fbConvParticipants.set(conversationId, recipientId);
          }
        } catch (e) {
          console.error('FB resolve PSID error:', serializeError(e));
        }
      }
      if (!recipientId) return res.status(400).json({ error: 'Could not resolve participant PSID for conversation' });
      const url = `https://graph.facebook.com/v21.0/me/messages`;
      const body = {
        recipient: { id: recipientId },
        message: { text: String(text).slice(0, 900) },
        messaging_type: 'RESPONSE'
      };
      // Allow sending outside 24h with a permitted tag
      if (req.body && typeof req.body.tag === 'string' && req.body.tag.trim()) {
        body.messaging_type = 'MESSAGE_TAG';
        body.tag = req.body.tag.trim(); // e.g., CONFIRMED_EVENT_UPDATE, POST_PURCHASE_UPDATE, ACCOUNT_UPDATE, HUMAN_AGENT
      }
      try {
        await axios.post(url, body, { params: { access_token: config.facebook.pageToken } });
      } catch (fbErr) {
        console.error('FB send error:', serializeError(fbErr));
        const resp = fbErr?.response?.data || {};
        return res.status(400).json({ error: 'fb_send_failed', details: resp });
      }
      const nowIso = new Date().toISOString();
      const msg = { id: 'm_' + Date.now(), sender: senderNorm, text, timestamp: nowIso };
      // persist
      const arr = messengerStore.messages.get(conversationId) || [];
      arr.push(msg);
      messengerStore.messages.set(conversationId, arr);
      const conv = messengerStore.conversations.get(conversationId);
      if (conv) {
        conv.lastMessage = text;
        conv.timestamp = nowIso;
        messengerStore.conversations.set(conversationId, conv);
      }
      saveMessengerStore();
      io.emit('messenger:message_created', { conversationId, message: msg });
      return res.json({ success: true, message: msg });
    }
    const nowIso = new Date().toISOString();
    const msg = { id: 'm_' + Date.now(), sender: senderNorm, text, timestamp: nowIso };
    const arr = messengerStore.messages.get(conversationId) || [];
    arr.push(msg);
    messengerStore.messages.set(conversationId, arr);
    const conv = messengerStore.conversations.get(conversationId);
    if (conv) {
      conv.lastMessage = text;
      conv.timestamp = nowIso;
      messengerStore.conversations.set(conversationId, conv);
    }
    // if customer, start response timer
    if (senderNorm === 'customer') {
      lastCustomerAtByConversation.set(conversationId, new Date(nowIso).getTime());
    }
    saveMessengerStore();
    io.emit('messenger:message_created', { conversationId, message: msg });

    // Auto-reply for local provider when customer sends a message
    if ((senderNorm === 'customer') && groqClient && config.ai.autoReplyWebhook && (aiModeByConversation.get(conversationId) === true)) {
      try {
        const stored = messengerStore.systemPrompts.get(conversationId) || '';
        const baseSystem = String(stored || '').trim() || 'You are a helpful business chat assistant. Reply concisely and politely.';
        const replyText = await generateWithGemini(String(text || ''), baseSystem);
        if (replyText) {
          const aiNow = new Date().toISOString();
          const aiMsg = { id: 'ai_' + Date.now(), sender: 'ai', text: replyText, timestamp: aiNow, isRead: true };
          arr.push(aiMsg);
          messengerStore.messages.set(conversationId, arr);
          if (conv) {
            conv.lastMessage = replyText;
            conv.timestamp = aiNow;
            messengerStore.conversations.set(conversationId, conv);
          }
          // compute response time if prior customer timestamp exists
          const lastTs = lastCustomerAtByConversation.get(conversationId);
          if (typeof lastTs === 'number') {
            const rt = new Date(aiNow).getTime() - lastTs;
            const list = messengerStore.responseTimes.get(conversationId) || [];
            list.push(rt);
            messengerStore.responseTimes.set(conversationId, list);
            lastCustomerAtByConversation.delete(conversationId);
          }
          saveMessengerStore();
          io.emit('messenger:message_created', { conversationId, message: aiMsg });
        }
      } catch (autoErr) {
        console.warn('Local auto-reply failed:', serializeError(autoErr));
      }
    }

    return res.json({ success: true, message: msg });
  } catch (err) {
    console.error('FB send error:', serializeError(err));
    return res.status(500).json({ error: 'Error sending message' });
  }
});

// IG business ID cache and resolver
let igBusinessIdCache = { id: null, fetchedAt: 0 };
async function ensureIgBusinessId() {
  try {
    const now = Date.now();
    if (igBusinessIdCache.id && (now - igBusinessIdCache.fetchedAt) < 10 * 60 * 1000) {
      return igBusinessIdCache.id;
    }
    if (!config.facebook.pageId || !config.facebook.pageToken) {
      console.warn('Missing FB_PAGE_ID or FB_PAGE_TOKEN; cannot resolve ig_business_account');
      return null;
    }
    const resp = await axios.get(`https://graph.facebook.com/v23.0/${config.facebook.pageId}`, {
      params: { fields: 'instagram_business_account{id,username}', access_token: config.facebook.pageToken },
      timeout: 15000,
    });
    const ig = resp.data && resp.data.instagram_business_account;
    const igId = ig && ig.id ? String(ig.id) : null;
    if (igId) {
      igBusinessIdCache = { id: igId, fetchedAt: now };
      console.log('Resolved ig_business_account id:', igId);
    } else {
      console.warn('Could not resolve instagram_business_account from page');
    }
    return igId;
  } catch (e) {
    console.warn('ensureIgBusinessId error:', serializeError(e));
    return null;
  }
}

// --- Webhook verification (Facebook/WhatsApp/Instagram share the same mechanism) ---
app.get('/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && (token === config.webhook.verifyToken || token === config.whatsapp.verifyToken)) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  } catch (err) {
    console.error('Webhook verify error:', serializeError(err));
    return res.sendStatus(500);
  }
});

// --- Webhook receiver (handles Instagram comments for automation) ---
app.post('/webhook', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (body.object === 'instagram' && Array.isArray(body.entry)) {
      console.log('IG webhook received:', JSON.stringify(body).slice(0, 500));
      for (const entry of body.entry) {
        const igUserId = String(entry.id || '');
        const user = users.get(igUserId);
        const cfg = configurations.get(igUserId);
        const igConvId = 'ig_' + igUserId; // aggregate IG events under this conversation for analytics
        if (!messengerStore.conversations.get(igConvId)) {
          messengerStore.conversations.set(igConvId, { id: igConvId, name: `Instagram:${igUserId}`, profilePic: '', lastMessage: '', timestamp: new Date().toISOString(), unreadCount: 0 });
          messengerStore.messages.set(igConvId, []);
          saveMessengerStore();
        }
        if (!user) { console.log('IG webhook: no user found for id', igUserId); }
        if (!cfg) { console.log('IG webhook: no configuration for id', igUserId); }
        if (!user || !cfg) continue; // not configured
        const changes = Array.isArray(entry.changes) ? entry.changes : [];
        console.log('IG webhook: changes count', changes.length, 'for user', igUserId);
        for (const change of changes) {
          const field = change.field || '';
          const val = change.value || {};
          if (field !== 'comments') { continue; }
          const mediaId = String(val.media_id || '');
          const text = String(val.text || '');
          const username = val.username || '';
          if (!mediaId || !username) { console.log('IG webhook: missing mediaId or username'); continue; }
          // persist IG incoming comment as a customer message for analytics
          try {
            const nowIso = new Date().toISOString();
            const arr = messengerStore.messages.get(igConvId) || [];
            arr.push({ id: 'igc_' + Date.now(), sender: 'customer', text, timestamp: nowIso, isRead: true, meta: { mediaId, username } });
            messengerStore.messages.set(igConvId, arr);
            const conv = messengerStore.conversations.get(igConvId);
            if (conv) { conv.lastMessage = text; conv.timestamp = nowIso; messengerStore.conversations.set(igConvId, conv); }
            // record last customer time for response measurement
            lastCustomerAtByConversation.set(igConvId, new Date(nowIso).getTime());
            saveMessengerStore();
          } catch (e) { console.warn('IG persist comment failed:', e?.message || e); }
          // Match configured post and keyword
          const keyword = String(cfg.keyword || '').toLowerCase();
          const mediaMatch = String(cfg.postId) === mediaId;
          const keywordMatch = (!keyword || text.toLowerCase().includes(keyword));
          if (!mediaMatch) { console.log('IG webhook: media mismatch. got', mediaId, 'expected', cfg.postId); }
          if (!keywordMatch) { console.log('IG webhook: keyword not matched. configured', keyword, 'text', text); }
          if (mediaMatch && keywordMatch) {
            try {
              // Send IG DM via Graph API (requires Page token + ig_business_account)
              const igBizId = await ensureIgBusinessId();
              if (!igBizId) throw new Error('No ig_business_account id resolved');
              await axios.post(`https://graph.facebook.com/v23.0/${igBizId}/messages`, {
                recipient: { username },
                message: { text: String(cfg.response || 'Hi! How are you doing?') },
              }, {
                params: { access_token: config.facebook.pageToken },
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000,
              });
              // persist IG outbound DM as 'ai' message for analytics and compute response time
              try {
                const nowIso = new Date().toISOString();
                const arr = messengerStore.messages.get(igConvId) || [];
                const outText = String(cfg.response || 'Hi! How are you doing?');
                const aiMsg = { id: 'igdm_' + Date.now(), sender: 'ai', text: outText, timestamp: nowIso, isRead: true, meta: { to: username } };
                arr.push(aiMsg);
                messengerStore.messages.set(igConvId, arr);
                const conv = messengerStore.conversations.get(igConvId);
                if (conv) { conv.lastMessage = outText; conv.timestamp = nowIso; messengerStore.conversations.set(igConvId, conv); }
                // compute response time if we have a last customer timestamp
                const lastTs = lastCustomerAtByConversation.get(igConvId);
                if (typeof lastTs === 'number') {
                  const rt = new Date(nowIso).getTime() - lastTs;
                  const list = messengerStore.responseTimes.get(igConvId) || [];
                  list.push(rt);
                  messengerStore.responseTimes.set(igConvId, list);
                  lastCustomerAtByConversation.delete(igConvId);
                }
                saveMessengerStore();
                io.emit('messenger:message_created', { conversationId: igConvId, message: aiMsg });
              } catch (e) { console.warn('IG persist DM failed:', e?.message || e); }
              console.log(`[IG Auto-DM] Sent to @${username} for media ${mediaId}`);
            } catch (sendErr) {
              console.warn('IG Auto-DM failed:', serializeError(sendErr));
            }
          }
        }
      }
      return res.sendStatus(200);
    }
    // Not an Instagram webhook: pass to next handlers (e.g., WhatsApp)
    return next();
  } catch (err) {
    console.error('Webhook POST error:', serializeError(err));
    return res.sendStatus(500);
  }
});

async function fbSubscribePageIfNeeded() {
  if (config.facebook.provider !== 'facebook' || !config.facebook.pageId || !config.facebook.pageToken) return;
  try {
    await axios.post(`https://graph.facebook.com/v21.0/${config.facebook.pageId}/subscribed_apps`, null, {
      params: {
        subscribed_fields: [
          'messages','message_deliveries','messaging_postbacks','messaging_optins','messaging_handovers'
        ].join(','),
        access_token: config.facebook.pageToken,
      }
    });
    console.log('Subscribed app to page webhooks.');
  } catch (err) {
    console.warn('Subscribe warning:', serializeError(err));
  }
}

async function findThreadIdByPsid(psid) {
  try {
    const data = await fbApiGet(`${config.facebook.pageId}/conversations`, { fields: 'id,participants.limit(10){id}', limit: 200 });
    const conv = (data.data || []).find(c => {
      const parts = (c.participants && c.participants.data) || [];
      return parts.some(p => String(p.id) === String(psid));
    });
    return conv ? conv.id : null;
  } catch (err) {
    console.error('findThreadIdByPsid error:', serializeError(err));
    return null;
  }
}

// --- Health: Instagram/FB config & connectivity ---
app.get('/api/instagram/health', async (_req, res) => {
  try {
    const health = {
      instagram: {
        appIdSet: !!config.instagram.appId,
        businessRedirectUri: config.instagram.businessRedirectUri,
        basicRedirectUri: config.instagram.redirectUri,
        businessCallbackOk: typeof config.instagram.businessRedirectUri === 'string' && config.instagram.businessRedirectUri.includes('/auth/instagram/business/callback')
      },
      facebook: {
        pageIdSet: !!config.facebook.pageId,
        pageTokenSet: !!config.facebook.pageToken,
        igBusinessId: null
      },
      webhook: {
        verifyTokenSet: !!config.webhook.verifyToken,
        callbackUrl: (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/webhook` : 'http://localhost:10000/webhook')
      },
      notes: []
    };

    // Try resolve IG business account id
    try {
      const igBizId = await ensureIgBusinessId();
      health.facebook.igBusinessId = igBizId || null;
      if (!igBizId) health.notes.push('IG business account not resolved. Ensure IG is linked to a Facebook Page and FB_PAGE_TOKEN is set.');
    } catch (e) {
      health.notes.push('Error resolving ig_business_account: ' + (e?.message || 'unknown'));
    }

    if (!health.instagram.appIdSet) health.notes.push('Missing INSTAGRAM_APP_ID');
    if (!health.facebook.pageTokenSet) health.notes.push('Missing FB_PAGE_TOKEN');
    if (!health.webhook.verifyTokenSet) health.notes.push('Missing WEBHOOK_VERIFY_TOKEN');

    return res.json({ ok: true, health });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

// Debug: list IG users and configurations
app.get('/api/instagram/debug-config', (_req, res) => {
  const u = [];
  for (const [id, v] of users.entries()) { u.push({ id, username: v.username || '', platform: v.platform }); }
  const cfgs = [];
  for (const [id, v] of configurations.entries()) { cfgs.push({ id, postId: v.postId, keyword: v.keyword }); }
  return res.json({ users: u, configurations: cfgs, pageId: config.facebook.pageId, pageTokenSet: !!config.facebook.pageToken });
});

// --- Analytics API ---
app.get('/api/analytics', (_req, res) => {
  try {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const messagesMap = messengerStore.messages || new Map();
    const allConvs = messengerStore.conversations || new Map();

    // Flatten messages with conversationId and platform guess
    const flat = [];
    const fbIds = new Set(Array.from(fbConvParticipants.keys()));
    for (const [convId, msgs] of messagesMap.entries()) {
      const platform = convId.startsWith('wa_') ? 'WhatsApp' : (convId.startsWith('ig_') ? 'Instagram' : (fbIds.has(convId) ? 'Messenger' : 'Messenger'));
      for (const m of msgs || []) {
        flat.push({ conversationId: convId, platform, sender: m.sender, timestamp: new Date(m.timestamp).getTime() });
      }
    }

    // Summary metrics
    const totalMessages = flat.length;
    const aiReplies = flat.filter(m => m.sender === 'ai').length;
    const humanReplies = flat.filter(m => m.sender === 'agent').length;
    const customerMsgs = flat.filter(m => m.sender === 'customer').sort((a,b) => a.timestamp - b.timestamp);

    let responded = 0;
    let totalRespTime = 0;
    // Compute response time per conversation: next reply after a customer message
    const byConv = new Map();
    for (const m of flat.sort((a,b)=>a.timestamp-b.timestamp)) {
      if (!byConv.has(m.conversationId)) byConv.set(m.conversationId, []);
      byConv.get(m.conversationId).push(m);
    }
    for (const arr of byConv.values()) {
      for (let i = 0; i < arr.length; i++) {
        const m = arr[i];
        if (m.sender !== 'customer') continue;
        // find next reply
        let reply = null;
        for (let j = i + 1; j < arr.length; j++) {
          const n = arr[j];
          if (n.sender === 'ai' || n.sender === 'agent') { reply = n; break; }
        }
        if (reply) {
          responded += 1;
          totalRespTime += Math.max(0, reply.timestamp - m.timestamp);
        }
      }
    }
    const responseRate = customerMsgs.length ? responded / customerMsgs.length : 0;
    const avgResponseTimeSeconds = responded ? Math.round(totalRespTime / responded / 1000) : 0;
    const aiReplyRate = totalMessages ? (aiReplies / totalMessages) : 0;

    // Compute global average AI response time from persisted responseTimes
    let totalRt = 0, countRt = 0;
    for (const list of messengerStore.responseTimes.values()) {
      for (const rt of (list || [])) { totalRt += rt; countRt += 1; }
    }
    const persistedAvgAiSeconds = countRt ? Math.round(totalRt / countRt / 1000) : avgResponseTimeSeconds;

    // Time series last 30 days
    const days = 30;
    const labels = [];
    const processed = new Array(days).fill(0);
    const aiSeries = new Array(days).fill(0);
    for (let d = days - 1; d >= 0; d--) {
      const dayStart = new Date(now - d * dayMs);
      labels.push(`${dayStart.getMonth() + 1}/${dayStart.getDate()}`);
    }
    for (const m of flat) {
      const offset = Math.floor((now - m.timestamp) / dayMs);
      if (offset >= 0 && offset < days) {
        const idx = days - 1 - offset;
        processed[idx] += 1;
        if (m.sender === 'ai') aiSeries[idx] += 1;
      }
    }
    const workflowPerformance = {
      labels,
      datasets: [
        { label: 'Messages Processed', data: processed, borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.4 },
        { label: 'AI Responses', data: aiSeries, borderColor: 'rgb(16, 185, 129)', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4 },
      ]
    };

    // Platform Distribution
    const platCounts = { Instagram: 0, WhatsApp: 0, Messenger: 0 };
    for (const m of flat) platCounts[m.platform] = (platCounts[m.platform] || 0) + 1;
    const platformDistribution = {
      labels: Object.keys(platCounts),
      datasets: [{ data: Object.values(platCounts), backgroundColor: ['rgb(236,72,153)','rgb(34,197,94)','rgb(59,130,246)'], borderWidth: 0 }]
    };

    // Engagement by platform (last 4 weeks response rate)
    const weeks = 4;
    const weekMs = 7 * dayMs;
    const weekLabels = ['Week 1','Week 2','Week 3','Week 4'];
    const platforms = ['Instagram','WhatsApp','Messenger'];
    const perPlatRates = Object.fromEntries(platforms.map(p => [p, new Array(weeks).fill(0)]));
    const perPlatCounts = Object.fromEntries(platforms.map(p => [p, new Array(weeks).fill(0)]));
    for (const [convId, arr] of byConv.entries()) {
      const platform = convId.startsWith('wa_') ? 'WhatsApp' : (fbIds.has(convId) ? 'Messenger' : 'Messenger');
      for (let i = 0; i < arr.length; i++) {
        const m = arr[i];
        if (m.sender !== 'customer') continue;
        let reply = null;
        for (let j = i + 1; j < arr.length; j++) {
          const n = arr[j];
          if (n.sender === 'ai' || n.sender === 'agent') { reply = n; break; }
        }
        const bucket = Math.min(weeks - 1, Math.max(0, Math.floor((now - m.timestamp) / weekMs)));
        perPlatCounts[platform][bucket] += 1;
        if (reply) perPlatRates[platform][bucket] += 1;
      }
    }
    const engagementRate = {
      labels: weekLabels,
      datasets: platforms.map((p, i) => ({
        label: p,
        data: perPlatCounts[p].map((c, idx) => c ? Math.round((perPlatRates[p][idx] / c) * 100) : 0),
        borderColor: ['rgb(236,72,153)','rgb(34,197,94)','rgb(59,130,246)'][i],
        backgroundColor: [
          'rgba(236,72,153,0.2)',
          'rgba(34,197,94,0.2)',
          'rgba(59,130,246,0.2)'
        ][i],
        fill: true,
        tension: 0.4,
      }))
    };

    // Response types
    const responseTypes = {
      labels: ['Auto Reply', 'Smart Reply', 'Human Reply'],
      datasets: [{ data: [aiReplies, 0, humanReplies], backgroundColor: ['rgb(59,130,246)','rgb(16,185,129)','rgb(245,158,11)'], borderWidth: 0 }]
    };

    // Profile metrics
    const sentMessages = flat.filter(m => m.sender === 'ai' || m.sender === 'agent').length;
    // Leads: unique conversations where we responded to at least one customer message
    const engagedConversations = new Set();
    for (const [convId, arr] of byConv.entries()) {
      for (let i = 0; i < arr.length; i++) {
        const m = arr[i];
        if (m.sender !== 'customer') continue;
        let replied = false;
        for (let j = i + 1; j < arr.length; j++) {
          const n = arr[j];
          if (n.sender === 'ai' || n.sender === 'agent') { replied = true; break; }
        }
        if (replied) { engagedConversations.add(convId); break; }
      }
    }
    const leadsGenerated = engagedConversations.size;
    const activeAutomations = Array.from((campaignsStore.campaigns || new Map()).values()).filter(c => c.status === 'active').length;

    // Activity feed: latest 20 events
    const latest = flat.sort((a,b)=>b.timestamp-a.timestamp).slice(0, 20).map(m => ({
      platform: m.platform,
      action: m.sender === 'customer' ? 'Customer message' : (m.sender === 'ai' ? 'AI replied' : 'Agent replied'),
      time: relativeTime(now - m.timestamp),
      status: m.sender === 'ai' ? 'success' : (m.sender === 'agent' ? 'escalated' : 'success')
    }));

    function relativeTime(diff) {
      const s = Math.floor(diff/1000);
      if (s < 60) return `${s}s ago`;
      const m = Math.floor(s/60);
      if (m < 60) return `${m} minutes ago`;
      const h = Math.floor(m/60);
      if (h < 24) return `${h} hours ago`;
      const d = Math.floor(h/24);
      return `${d} days ago`;
    }

    return res.json({
      summary: {
        totalMessages,
        responseRate,
        avgResponseTimeSeconds: persistedAvgAiSeconds,
        aiReplyRate,
      },
      workflowPerformance,
      platformDistribution,
      engagementRate,
      responseTypes,
      activityFeed: latest,
      profile: {
        totalMessagesSent: sentMessages,
        activeAutomations,
        leadsGenerated,
        engagementRate: Math.round((responseRate || 0) * 1000) / 10 // as percentage with 1 decimal
      }
    });
  } catch (e) {
    console.error('Analytics error:', serializeError(e));
    return res.status(500).json({ error: 'analytics_failed' });
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const body = req.body || {};

    // WhatsApp webhook structure
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value || {};
          const messages = value.messages || [];
          const contacts = value.contacts || [];
          for (const m of messages) {
            if (!m.from) continue;
            // Build or find conversation by WhatsApp phone number
            const convId = 'wa_' + m.from; // stable per sender
            let conv = messengerStore.conversations.get(convId);
            if (!conv) {
              const name = (contacts[0] && contacts[0].profile && contacts[0].profile.name) || (contacts[0] && contacts[0].wa_id) || m.from;
              conv = { id: convId, name: name || ('+' + m.from), profilePic: `https://unavatar.io/${encodeURIComponent(name || m.from)}`, lastMessage: '', timestamp: new Date().toISOString(), unreadCount: 0 };
              messengerStore.conversations.set(convId, conv);
              messengerStore.messages.set(convId, []);
              saveMessengerStore();
              io.emit('messenger:conversation_created', conv);
            }
            const text = (m.text && m.text.body) || (m.type === 'button' && m.button && m.button.text) || '';
            const nowIso = new Date().toISOString();
            const msg = { id: m.id || ('wa_' + Date.now()), sender: 'customer', text, timestamp: nowIso, isRead: true };
            const arr = messengerStore.messages.get(convId) || [];
            arr.push(msg);
            messengerStore.messages.set(convId, arr);
            conv.lastMessage = text;
            conv.timestamp = nowIso;
            messengerStore.conversations.set(convId, conv);
            // record last customer time for response measurement
            lastCustomerAtByConversation.set(convId, new Date(nowIso).getTime());
            saveMessengerStore();
            io.emit('messenger:message_created', { conversationId: convId, message: msg });

            // AI auto-reply if enabled (and AI mode ON for this conversation)
            if (text && groqClient && config.ai.autoReplyWebhook && (aiModeByConversation.get(convId) === true)) {
              try {
                const storedPrompt = messengerStore.systemPrompts.get(convId) || '';
                const baseSystem = String(storedPrompt || '').trim() || 'You are a helpful business chat assistant. Reply concisely and politely.';
                const reply = await generateWithGemini(String(text || ''), baseSystem);
                if (reply) {
                  // Send reply via WhatsApp Cloud API using selected mode
                  const { token, phoneNumberId, mode: waMode } = getWhatsappCreds();
                  if (!token || !phoneNumberId) throw new Error('whatsapp_not_configured');
                  await axios.post(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
                    messaging_product: 'whatsapp',
                    to: m.from,
                    type: 'text',
                    text: { body: reply.slice(0, 900) }
                  }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-WA-Mode': waMode } });

                  const aiNow = new Date().toISOString();
                  const aiMsg = { id: 'ai_' + Date.now(), sender: 'ai', text: reply, timestamp: aiNow, isRead: true };
                  arr.push(aiMsg);
                  messengerStore.messages.set(convId, arr);
                  conv.lastMessage = reply;
                  conv.timestamp = aiNow;
                  messengerStore.conversations.set(convId, conv);
                  // compute response time if we have a last customer timestamp
                  const lastTs = lastCustomerAtByConversation.get(convId);
                  if (typeof lastTs === 'number') {
                    const rt = new Date(aiNow).getTime() - lastTs;
                    const list = messengerStore.responseTimes.get(convId) || [];
                    list.push(rt);
                    messengerStore.responseTimes.set(convId, list);
                    lastCustomerAtByConversation.delete(convId);
                  }
                  saveMessengerStore();
                  io.emit('messenger:message_created', { conversationId: convId, message: aiMsg });
                }
              } catch (waAIerr) {
                console.warn('WA auto-reply failed:', serializeError(waAIerr));
              }
            }
          }
        }
      }
      return res.sendStatus(200);
    }

    // Facebook webhook structure
    if (body.object !== 'page') return res.sendStatus(404);
    for (const entry of body.entry || []) {
      const messaging = entry.messaging || [];
      for (const event of messaging) {
        const senderId = event.sender && event.sender.id;
        const message = event.message;
        if (senderId && message && (message.text || message.attachments)) {
          // If this sender matches a pending auto-start by normalized name, enable AI and send initial message
          try {
            if (messengerStore.pendingAutoStart && messengerStore.pendingAutoStart.size > 0) {
              // Resolve thread id for this PSID to read participant name
              const threadIdForCheck = await findThreadIdByPsid(senderId);
              if (threadIdForCheck) {
                const conv = await fbApiGet(`${threadIdForCheck}`, { fields: 'participants.limit(10){id,name}' });
                const parts = (conv.participants && conv.participants.data) || [];
                const other = parts.find(p => String(p.id) !== String(config.facebook.pageId)) || parts[0];
                const otherName = (other && other.name) ? other.name.toLowerCase().replace(/\s+/g, '') : '';
                if (otherName && messengerStore.pendingAutoStart.has(otherName)) {
                  const plan = messengerStore.pendingAutoStart.get(otherName) || {};
                  messengerStore.pendingAutoStart.delete(otherName);
                  // Ensure mappings and AI mode ON
                  fbConvParticipants.set(threadIdForCheck, senderId);
                  const sp = String(plan.systemPrompt || '').trim();
                  if (sp) messengerStore.systemPrompts.set(threadIdForCheck, sp);
                  aiModeByConversation.set(threadIdForCheck, true);
                  saveMessengerStore();
                  // Send initial message now
                  const init = String(plan.initialMessage || `Hi! How can we help you today?`).slice(0, 900);
                  await axios.post(`https://graph.facebook.com/v21.0/me/messages`, {
                    recipient: { id: senderId },
                    message: { text: init },
                    messaging_type: 'RESPONSE'
                  }, { params: { access_token: config.facebook.pageToken } });
                  // Persist and emit
                  const aiNow = new Date().toISOString();
                  const arrInit = messengerStore.messages.get(threadIdForCheck) || [];
                  const initMsg = { id: 'agent_' + Date.now(), sender: 'agent', text: init, timestamp: aiNow, isRead: true };
                  arrInit.push(initMsg);
                  messengerStore.messages.set(threadIdForCheck, arrInit);
                  const conv0 = messengerStore.conversations.get(threadIdForCheck) || { id: threadIdForCheck, name: `FB:${senderId}`, profilePic: '', lastMessage: '', timestamp: aiNow, unreadCount: 0 };
                  conv0.lastMessage = init; conv0.timestamp = aiNow;
                  messengerStore.conversations.set(threadIdForCheck, conv0);
                  saveMessengerStore();
                  io.emit('messenger:message_created', { conversationId: threadIdForCheck, message: initMsg });
                }
              }
            }
          } catch (autoErr) {
            console.warn('Auto-start on first message failed:', serializeError(autoErr));
          }
          // Resolve thread id for this PSID
          const threadId = await findThreadIdByPsid(senderId);
          if (threadId) {
            // Cache mapping and emit realtime event
            fbConvParticipants.set(threadId, senderId);
            // Skip echoes of our own messages
            if (message.is_echo) continue;
            const text = message.text || (message.attachments && '[attachment]') || '';
            const nowIso = new Date().toISOString();
            // Persist incoming FB message to store so analytics are real
            const arr0 = messengerStore.messages.get(threadId) || [];
            arr0.push({ id: 'fb_' + Date.now(), sender: 'customer', text, timestamp: nowIso, isRead: true });
            messengerStore.messages.set(threadId, arr0);
            const conv0 = messengerStore.conversations.get(threadId) || { id: threadId, name: `FB:${senderId}`, profilePic: '', lastMessage: '', timestamp: nowIso, unreadCount: 0 };
            conv0.lastMessage = text;
            conv0.timestamp = nowIso;
            messengerStore.conversations.set(threadId, conv0);
            lastCustomerAtByConversation.set(threadId, new Date(nowIso).getTime());
            saveMessengerStore();
            io.emit('messenger:message_created', {
              conversationId: threadId,
              message: {
                id: 'fb_' + Date.now(),
                sender: 'customer',
                text,
                timestamp: nowIso,
                isRead: true,
              }
            });
            // First-message auto-reply removed: only AI replies when AI mode is ON.

            // Optional: auto-reply with Groq when message text exists and AI mode is ON for this thread
            if (text && groqClient && config.facebook.pageToken && config.ai.autoReplyWebhook && (aiModeByConversation.get(threadId) === true)) {
              try {
                const storedPrompt = messengerStore.systemPrompts.get(threadId) || '';
                const baseSystem = String(storedPrompt || '').trim() || 'You are a helpful business chat assistant. Reply concisely and politely.';
                const reply = await generateWithGemini(String(text || ''), baseSystem);
                if (reply) {
                  // Send reply via FB API
                  await axios.post(`https://graph.facebook.com/v21.0/me/messages`, {
                    recipient: { id: senderId },
                    message: { text: reply.slice(0, 900) },
                    messaging_type: 'RESPONSE'
                  }, { params: { access_token: config.facebook.pageToken }, headers: { 'Content-Type': 'application/json' } });
                  const aiNow = new Date().toISOString();
                  // Persist AI reply for FB, compute response time
                  const arr1 = messengerStore.messages.get(threadId) || [];
                  const aiMsg = { id: 'ai_' + Date.now(), sender: 'ai', text: reply, timestamp: aiNow, isRead: true };
                  arr1.push(aiMsg);
                  messengerStore.messages.set(threadId, arr1);
                  const conv1 = messengerStore.conversations.get(threadId) || { id: threadId, name: `FB:${senderId}`, profilePic: '', lastMessage: '', timestamp: aiNow, unreadCount: 0 };
                  conv1.lastMessage = reply;
                  conv1.timestamp = aiNow;
                  messengerStore.conversations.set(threadId, conv1);
                  const lastTs = lastCustomerAtByConversation.get(threadId);
                  if (typeof lastTs === 'number') {
                    const rt = new Date(aiNow).getTime() - lastTs;
                    const list = messengerStore.responseTimes.get(threadId) || [];
                    list.push(rt);
                    messengerStore.responseTimes.set(threadId, list);
                    lastCustomerAtByConversation.delete(threadId);
                  }
                  saveMessengerStore();
                  // Emit to frontend
                  io.emit('messenger:message_created', { conversationId: threadId, message: aiMsg });
                }
              } catch (aiErr) {
                console.warn('AI auto-reply failed:', serializeError(aiErr));
              }
            }
          } else {
            console.warn('Webhook: could not resolve thread for PSID', senderId);
          }
        }
      }
    }
    return res.sendStatus(200);
  } catch (err) {
    console.error('Webhook handler error:', serializeError(err));
    return res.sendStatus(500);
  }
});

// Kick off subscription on startup (if configured)
fbSubscribePageIfNeeded();

// WhatsApp Cloud API config (runtime, from UI)
app.get('/api/integrations/whatsapp/config', (_req, res) => {
  try {
    const hasToken = Boolean(config.whatsapp.token);
    const tokenMasked = hasToken ? `${config.whatsapp.token.slice(0, 6)}...${config.whatsapp.token.slice(-4)}` : null;
    const callbackUrl = (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/webhook` : 'http://localhost:10000/webhook');
    return res.json({
      success: true,
      whatsapp: {
        connected: !!(config.whatsapp.phoneNumberId && config.whatsapp.token),
        phoneNumberId: config.whatsapp.phoneNumberId || '',
        verifyTokenSet: Boolean(config.whatsapp.verifyToken),
        tokenMasked,
        callbackUrl,
        mode: config.whatsapp.mode || 'production'
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'internal_error' });
  }
});

// Save WhatsApp credentials from UI (in-memory for runtime)
app.post('/api/integrations/whatsapp/config', (req, res) => {
  try {
    const { token, phoneNumberId, verifyToken, mode } = req.body || {};
    if (!token || !phoneNumberId) return res.status(400).json({ success: false, message: 'token and phoneNumberId required' });
    config.whatsapp.token = String(token);
    config.whatsapp.phoneNumberId = String(phoneNumberId);
    if (verifyToken) config.whatsapp.verifyToken = String(verifyToken);
    if (mode && (mode === 'test' || mode === 'production')) config.whatsapp.mode = mode;
    return res.json({ success: true, whatsapp: { connected: true, phoneNumberId: config.whatsapp.phoneNumberId, verifyTokenSet: Boolean(config.whatsapp.verifyToken), mode: config.whatsapp.mode } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'internal_error' });
  }
});

// Send outbound WhatsApp message via Cloud API (manual send from UI)
app.post('/api/whatsapp/send-message', async (req, res) => {
  try {
    const { phoneNumber, message, mode } = req.body || {};
    if (!phoneNumber || !message) return res.status(400).json({ error: 'Missing required fields' });
    const { token, phoneNumberId, mode: waMode } = getWhatsappCreds(mode);
    if (!phoneNumberId || !token) return res.status(400).json({ error: 'whatsapp_not_configured' });
    const resp = await axios.post(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: { body: String(message).slice(0, 900) }
    }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-WA-Mode': waMode } });
    return res.json({ success: true, result: resp.data, mode: waMode });
  } catch (err) {
    console.error('WA send error:', serializeError(err));
    const status = (err && err.response && err.response.status) || 500;
    const fbErr = err && err.response && err.response.data && err.response.data.error;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: 'whatsapp_send_failed',
      details: fbErr ? { message: fbErr.message, code: fbErr.code, subcode: fbErr.error_subcode } : undefined
    });
  }
});

// Diagnose WhatsApp Cloud API configuration and linkage
app.get('/api/whatsapp/diagnose', async (_req, res) => {
  try {
    if (!config.whatsapp.phoneNumberId || !config.whatsapp.token) {
      return res.status(400).json({ success: false, issues: ['whatsapp_not_configured'] });
    }
    const issues = [];
    const headers = { Authorization: `Bearer ${config.whatsapp.token}` };
    let pnInfo = null;
    let wabaId = null;
    let wabaNumbers = null;
    const mode = config.whatsapp.mode || 'production';
    // 1) Fetch phone number details and owning WABA id
    try {
      pnInfo = await axios.get(`https://graph.facebook.com/v23.0/${config.whatsapp.phoneNumberId}?fields=id,display_phone_number,verified_name,whatsapp_business_account`, { headers });
      wabaId = pnInfo?.data?.whatsapp_business_account?.id || null;
      if (!wabaId && mode === 'production') issues.push('no_waba_for_phone_number');
    } catch (e) {
      issues.push('phone_number_lookup_failed');
    }
    // 2) If WABA present, list its phone numbers to confirm membership (prod only)
    if (wabaId && mode === 'production') {
      try {
        const resp = await axios.get(`https://graph.facebook.com/v23.0/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name`, { headers });
        wabaNumbers = resp?.data?.data || null;
        const inWaba = Array.isArray(wabaNumbers) && wabaNumbers.some(n => String(n.id) === String(config.whatsapp.phoneNumberId));
        if (!inWaba) issues.push('phone_number_not_in_waba');
      } catch (e) {
        issues.push('waba_numbers_lookup_failed');
      }
    }
    // 3) In test mode, remind to use test recipients
    if (mode === 'test') {
      issues.push('test_mode_reminder_add_test_recipients');
    }
    return res.json({
      success: issues.length === 0,
      phoneNumberId: config.whatsapp.phoneNumberId,
      phoneNumberInfo: pnInfo && pnInfo.data ? pnInfo.data : null,
      wabaId,
      wabaNumbers,
      mode,
      issues
    });
  } catch (err) {
    console.error('WA diagnose error:', serializeError(err));
    return res.status(500).json({ success: false, issues: ['diagnose_failed'] });
  }
});

// WhatsApp registration: request verification code (production number)
app.post('/api/whatsapp/request-code', async (req, res) => {
  try {
    const { codeMethod, language } = req.body || {};
    const { token, phoneNumberId } = getWhatsappCreds('production');
    if (!token || !phoneNumberId) return res.status(400).json({ success: false, message: 'whatsapp_not_configured' });
    const payload = { code_method: (codeMethod === 'VOICE' ? 'VOICE' : 'SMS'), language: String(language || 'en') };
    const resp = await axios.post(`https://graph.facebook.com/v23.0/${phoneNumberId}/request_code`, payload, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    return res.json({ success: true, result: resp.data });
  } catch (err) {
    console.error('WA request_code error:', serializeError(err));
    const status = (err && err.response && err.response.status) || 500;
    const fbErr = err && err.response && err.response.data && err.response.data.error;
    return res.status(status >= 400 && status < 600 ? status : 500).json({ success: false, error: 'request_code_failed', details: fbErr });
  }
});

// WhatsApp registration: verify code (production number)
app.post('/api/whatsapp/verify-code', async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ success: false, message: 'code required' });
    const { token, phoneNumberId } = getWhatsappCreds('production');
    if (!token || !phoneNumberId) return res.status(400).json({ success: false, message: 'whatsapp_not_configured' });
    const resp = await axios.post(`https://graph.facebook.com/v23.0/${phoneNumberId}/verify_code`, { code: String(code) }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    return res.json({ success: true, result: resp.data });
  } catch (err) {
    console.error('WA verify_code error:', serializeError(err));
    const status = (err && err.response && err.response.status) || 500;
    const fbErr = err && err.response && err.response.data && err.response.data.error;
    return res.status(status >= 400 && status < 600 ? status : 500).json({ success: false, error: 'verify_code_failed', details: fbErr });
  }
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

// System prompt endpoints
app.get('/api/messenger/system-prompt', (req, res) => {
  try {
    const id = req.query?.conversationId;
    if (!id) return res.status(400).json({ error: 'conversationId required' });
    const sp = messengerStore.systemPrompts.get(String(id)) || '';
    return res.json({ systemPrompt: sp });
  } catch (err) {
    console.error('Fetch system prompt error:', serializeError(err));
    return res.status(500).json({ error: 'fetch_system_prompt_failed' });
  }
});

app.post('/api/messenger/system-prompt', (req, res) => {
  try {
    const { conversationId, systemPrompt } = req.body || {};
    if (!conversationId) return res.status(400).json({ error: 'conversationId required' });
    messengerStore.systemPrompts.set(conversationId, String(systemPrompt || ''));
    saveMessengerStore();
    return res.json({ success: true });
  } catch (err) {
    console.error('Save system prompt error:', serializeError(err));
    return res.status(500).json({ error: 'save_system_prompt_failed' });
  }
});

// Toggle AI mode for a conversation (persisted in-memory)
app.post('/api/messenger/ai-mode', (req, res) => {
  try {
    const { conversationId, enabled } = req.body || {};
    if (!conversationId || typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'conversationId and enabled(boolean) required' });
    }
    aiModeByConversation.set(conversationId, enabled);
    return res.json({ success: true, conversationId, enabled });
  } catch (err) {
    console.error('Toggle AI mode error:', serializeError(err));
    return res.status(500).json({ success: false, message: 'toggle_failed' });
  }
});

// Simple AI test endpoint for /ai-chat page
app.post('/api/ai/test', async (req, res) => {
  try {
    const prompt = (req.body && req.body.prompt) || 'Say hello!';
    const systemPrompt = (req.body && req.body.systemPrompt) || '';
    if (!groqClient) return res.status(400).json({ error: 'groq_not_configured' });
    const text = await generateWithGemini(String(prompt), String(systemPrompt));
    return res.json({ text });
  } catch (err) {
    console.error('AI test error:', serializeError(err));
    return res.status(500).json({ error: 'ai_test_failed' });
  }
});

// Facebook App info endpoint (for UI banner)
app.get('/api/facebook/app', async (_req, res) => {
  try {
    const appId = config.facebook.appId || null;
    const appSecret = config.facebook.appSecret || null;
    const callback = config.facebook.callbackUrl || null;
    let appName = null;
    if (appId && appSecret) {
      const appToken = `${appId}|${appSecret}`;
      try {
        const resp = await axios.get(`https://graph.facebook.com/v21.0/${encodeURIComponent(appId)}`, {
          params: { access_token: appToken, fields: 'name' },
          timeout: 8000
        });
        appName = resp?.data?.name || null;
      } catch (_) { /* ignore */ }
    }
    return res.json({ appId, appName, callback });
  } catch (err) {
    console.error('App info error:', serializeError(err));
    return res.status(500).json({ error: 'app_info_failed' });
  }
});

// SPA fallback: send index.html for non-API routes
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});