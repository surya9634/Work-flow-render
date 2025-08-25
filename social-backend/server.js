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
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'verify-me',
    token: process.env.WHATSAPP_TOKEN || process.env.FB_PAGE_TOKEN || process.env.PAGE_ACCESS_TOKEN || ''
  },
  webhook: {
    verifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'WORKFLOW_VERIFY_TOKEN',
  },
  ai: {
    geminiKey: process.env.GEMINI_API_KEY || '',
    autoReplyWebhook: String(process.env.AI_AUTO_REPLY_WEBHOOK || '').toLowerCase() === 'true'
  }
};

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
};

function loadMessengerStore() {
  const json = readJsonSafe(messengerFile, { conversations: [], messages: {}, systemPrompts: {} });
  messengerStore.conversations = new Map(json.conversations.map(c => [c.id, c]));
  messengerStore.messages = new Map(Object.entries(json.messages));
  messengerStore.systemPrompts = new Map(Object.entries(json.systemPrompts || {}));
}

function saveMessengerStore() {
  const conversations = Array.from(messengerStore.conversations.values());
  const messages = Object.fromEntries(Array.from(messengerStore.messages.entries()));
  const systemPrompts = Object.fromEntries(Array.from(messengerStore.systemPrompts.entries()));
  writeJsonSafe(messengerFile, { conversations, messages, systemPrompts });
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
if (config.facebook.provider !== 'facebook') {
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
  return res.json(Array.from(campaignsStore.campaigns.values()));
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
            message: { text: text.slice(0, 900) }
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
      if (isLocalConv && config.ai.geminiKey && config.ai.autoReplyWebhook && (aiModeByConversation.get(conversationId) === true)) {
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

        // Generate AI reply
        const stored = messengerStore.systemPrompts.get(conversationId) || '';
        const baseSystem = String(stored || '').trim() || 'You are a helpful business chat assistant. Reply concisely and politely.';
        const replyText = await generateWithGemini(String(customerText), baseSystem);
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

async function generateWithGemini(userText, systemPrompt) {
  if (!config.ai.geminiKey) throw new Error('gemini_key_missing');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(config.ai.geminiKey)}`;
  const payload = {
    contents: [
      { role: 'user', parts: [{ text: String(userText || '').slice(0, 4000) }] }
    ]
  };
  if (systemPrompt && String(systemPrompt).trim()) {
    payload.systemInstruction = { role: 'system', parts: [{ text: String(systemPrompt).slice(0, 8000) }] };
  }
  const resp = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
  const text = resp?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
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

// Create conversation
app.post('/api/messenger/conversations', (req, res) => {
  const { name, username, profilePic } = req.body || {};
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
  messengerStore.systemPrompts.set(id, '');
  aiModeByConversation.set(id, false); // default OFF until user enables
  saveMessengerStore();
  io.emit('messenger:conversation_created', conv);
  return res.json({ success: true, conversation: conv });
});

app.post('/api/messenger/ai-reply', async (req, res) => {
  try {
    const { conversationId, lastUserMessage, systemPrompt } = req.body || {};
    if (!conversationId) return res.status(400).json({ error: 'conversationId required' });
    if (!config.ai.geminiKey) return res.status(400).json({ error: 'gemini_not_configured' });
    // Respect AI mode switch: do not generate if disabled
    if (aiModeByConversation.get(conversationId) !== true) {
      return res.status(400).json({ error: 'ai_mode_disabled' });
    }
    const stored = messengerStore.systemPrompts.get(conversationId) || '';
    const baseSystem = String(systemPrompt || stored || '').trim() || 'You are a helpful business chat assistant. Reply concisely and politely.';
    const reply = await generateWithGemini(String(lastUserMessage || ''), baseSystem);
    const msg = { id: 'ai_' + Date.now(), sender: 'ai', text: reply, timestamp: new Date().toISOString(), isRead: true };
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
    if (String(conversationId).startsWith('wa_') && config.whatsapp.token && config.whatsapp.phoneNumberId) {
      const toPhone = String(conversationId).slice(3);
      try {
        await axios.post(`https://graph.facebook.com/v21.0/${config.whatsapp.phoneNumberId}/messages`, {
          messaging_product: 'whatsapp',
          to: toPhone,
          type: 'text',
          text: { body: String(text).slice(0, 900) }
        }, { headers: { Authorization: `Bearer ${config.whatsapp.token}`, 'Content-Type': 'application/json' } });
      } catch (waSendErr) {
        console.error('WA outbound send error:', serializeError(waSendErr));
      }
      const msg = { id: 'wa_' + Date.now(), sender: senderNorm, text, timestamp: new Date().toISOString() };
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
      await axios.post(url, { recipient: { id: recipientId }, message: { text } }, { params: { access_token: config.facebook.pageToken } });
      const msg = { id: 'm_' + Date.now(), sender: senderNorm, text, timestamp: new Date().toISOString() };
      io.emit('messenger:message_created', { conversationId, message: msg });
      return res.json({ success: true, message: msg });
    }
    const msg = { id: 'm_' + Date.now(), sender: senderNorm, text, timestamp: new Date().toISOString() };
    const arr = messengerStore.messages.get(conversationId) || [];
    arr.push(msg);
    messengerStore.messages.set(conversationId, arr);
    const conv = messengerStore.conversations.get(conversationId);
    if (conv) {
      conv.lastMessage = text;
      conv.timestamp = new Date().toISOString();
      messengerStore.conversations.set(conversationId, conv);
    }
    saveMessengerStore();
    io.emit('messenger:message_created', { conversationId, message: msg });

    // Auto-reply for local provider when customer sends a message
    if ((senderNorm === 'customer') && config.ai.geminiKey && config.ai.autoReplyWebhook && (aiModeByConversation.get(conversationId) === true)) {
      try {
        const stored = messengerStore.systemPrompts.get(conversationId) || '';
        const baseSystem = String(stored || '').trim() || 'You are a helpful business chat assistant. Reply concisely and politely.';
        const replyText = await generateWithGemini(String(text || ''), baseSystem);
        if (replyText) {
          const aiMsg = { id: 'ai_' + Date.now(), sender: 'ai', text: replyText, timestamp: new Date().toISOString(), isRead: true };
          arr.push(aiMsg);
          messengerStore.messages.set(conversationId, arr);
          if (conv) {
            conv.lastMessage = replyText;
            conv.timestamp = new Date().toISOString();
            messengerStore.conversations.set(conversationId, conv);
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

// --- Webhook verification (Facebook/WhatsApp share the same mechanism) ---
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
            const msg = { id: m.id || ('wa_' + Date.now()), sender: 'customer', text, timestamp: new Date().toISOString(), isRead: true };
            const arr = messengerStore.messages.get(convId) || [];
            arr.push(msg);
            messengerStore.messages.set(convId, arr);
            conv.lastMessage = text;
            conv.timestamp = new Date().toISOString();
            messengerStore.conversations.set(convId, conv);
            saveMessengerStore();
            io.emit('messenger:message_created', { conversationId: convId, message: msg });

            // AI auto-reply if enabled (and AI mode ON for this conversation)
            if (text && config.ai.geminiKey && config.ai.autoReplyWebhook && config.whatsapp.token && config.whatsapp.phoneNumberId && (aiModeByConversation.get(convId) === true)) {
              try {
                const storedPrompt = messengerStore.systemPrompts.get(convId) || '';
                const baseSystem = String(storedPrompt || '').trim() || 'You are a helpful business chat assistant. Reply concisely and politely.';
                const reply = await generateWithGemini(String(text || ''), baseSystem);
                if (reply) {
                  // Send reply via WhatsApp Cloud API
                  await axios.post(`https://graph.facebook.com/v21.0/${config.whatsapp.phoneNumberId}/messages`, {
                    messaging_product: 'whatsapp',
                    to: m.from,
                    type: 'text',
                    text: { body: reply.slice(0, 900) }
                  }, { headers: { Authorization: `Bearer ${config.whatsapp.token}`, 'Content-Type': 'application/json' } });

                  const aiMsg = { id: 'ai_' + Date.now(), sender: 'ai', text: reply, timestamp: new Date().toISOString(), isRead: true };
                  arr.push(aiMsg);
                  messengerStore.messages.set(convId, arr);
                  conv.lastMessage = reply;
                  conv.timestamp = new Date().toISOString();
                  messengerStore.conversations.set(convId, conv);
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
          // Resolve thread id for this PSID
          const threadId = await findThreadIdByPsid(senderId);
          if (threadId) {
            // Cache mapping and emit realtime event
            fbConvParticipants.set(threadId, senderId);
            // Skip echoes of our own messages
            if (message.is_echo) continue;
            const text = message.text || (message.attachments && '[attachment]') || '';
            io.emit('messenger:message_created', {
              conversationId: threadId,
              message: {
                id: 'fb_' + Date.now(),
                sender: 'customer',
                text,
                timestamp: new Date().toISOString(),
                isRead: true,
              }
            });
            // Optional: auto-reply with Gemini when message text exists and AI mode is ON for this thread
            if (text && config.ai.geminiKey && config.facebook.pageToken && config.ai.autoReplyWebhook && (aiModeByConversation.get(threadId) === true)) {
              try {
                const storedPrompt = messengerStore.systemPrompts.get(threadId) || '';
                const baseSystem = String(storedPrompt || '').trim() || 'You are a helpful business chat assistant. Reply concisely and politely.';
                const reply = await generateWithGemini(String(text || ''), baseSystem);
                if (reply) {
                  // Send reply via FB API
                  await axios.post(`https://graph.facebook.com/v21.0/me/messages`, {
                    recipient: { id: senderId },
                    message: { text: reply.slice(0, 900) }
                  }, { params: { access_token: config.facebook.pageToken } });
                  // Emit to frontend
                  io.emit('messenger:message_created', {
                    conversationId: threadId,
                    message: { id: 'ai_' + Date.now(), sender: 'ai', text: reply, timestamp: new Date().toISOString(), isRead: true }
                  });
                }
              } catch (aiErr) {
                console.warn('Gemini auto-reply failed:', serializeError(aiErr));
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

// Save WhatsApp credentials from UI (in-memory for runtime)
app.post('/api/integrations/whatsapp/config', (req, res) => {
  try {
    const { token, phoneNumberId } = req.body || {};
    if (!token || !phoneNumberId) return res.status(400).json({ success: false, message: 'token and phoneNumberId required' });
    config.whatsapp.token = String(token);
    config.whatsapp.phoneNumberId = String(phoneNumberId);
    return res.json({ success: true, whatsapp: { connected: true, phoneNumberId: config.whatsapp.phoneNumberId } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'internal_error' });
  }
});

// Send outbound WhatsApp message via Cloud API (manual send from UI)
app.post('/api/whatsapp/send-message', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body || {};
    if (!phoneNumber || !message) return res.status(400).json({ error: 'Missing required fields' });
    if (!config.whatsapp.phoneNumberId || !config.whatsapp.token) return res.status(400).json({ error: 'whatsapp_not_configured' });
    const resp = await axios.post(`https://graph.facebook.com/v21.0/${config.whatsapp.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: { body: String(message).slice(0, 900) }
    }, { headers: { Authorization: `Bearer ${config.whatsapp.token}`, 'Content-Type': 'application/json' } });
    return res.json({ success: true, result: resp.data });
  } catch (err) {
    console.error('WA send error:', serializeError(err));
    return res.status(500).json({ error: 'whatsapp_send_failed' });
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

// Save or fetch system prompt for a conversation
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
    if (!config.ai.geminiKey) return res.status(400).json({ error: 'gemini_not_configured' });
    const text = await generateWithGemini(String(prompt), String(systemPrompt));
    return res.json({ text });
  } catch (err) {
    console.error('AI test error:', serializeError(err));
    return res.status(500).json({ error: 'ai_test_failed' });
  }
});

// SPA fallback: send index.html for non-API routes
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});