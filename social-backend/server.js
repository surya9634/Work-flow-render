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
const multer = require('multer');

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
    autoReplyWebhook: String(process.env.AI_AUTO_REPLY_WEBHOOK || '').toLowerCase() === 'true',
    globalAiEnabled: false,
    globalAiMode: 'replace', // 'replace' | 'hybrid'
    memoryEnabled: true // per-user/per-conversation memory
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
  const choices = resp && resp.choices ? resp.choices : [];
  const first = choices.length > 0 ? choices[0] : {};
  const msg = first.message || {};
  const content = typeof msg.content === 'string' ? msg.content : '';
  return content.trim();
}

// --- Helpers (file IO, stores) ---
const dataDir = path.join(__dirname, 'data');
const profileFile = path.join(dataDir, 'businessProfile.json');
const profilePromptsFile = path.join(dataDir, 'profile-prompts.json');
const userMemoriesFile = path.join(dataDir, 'user-memories.json');
ensureDir(dataDir);

// Load persisted integrations (Facebook Page token/id) on startup
try {
  const integrationsFile = path.join(dataDir, 'integrations.json');
  const saved = readJsonSafeEnsure(integrationsFile, {});
  if (saved && saved.facebook) {
    if (saved.facebook.pageToken) config.facebook.pageToken = saved.facebook.pageToken;
    if (saved.facebook.pageId) config.facebook.pageId = saved.facebook.pageId;
  }
} catch (_) {}

function ensureDir(p) { try { fs.mkdirSync(p, { recursive: true }); } catch (_) {} }
function readJsonSafeEnsure(file, fallback) { try { if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback || {}, null, 2)); return JSON.parse(fs.readFileSync(file, 'utf8') || 'null'); } catch (_) { return JSON.parse(JSON.stringify(fallback || null)); } }
function writeJsonSafe(file, data) { try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); return true; } catch (_) { return false; } }

function readBusinessProfile() {
  try { return readJsonSafeEnsure(profileFile, { business: {}, campaigns: [] }); } catch (_) { return { business: {}, campaigns: [] }; }
}

// Dummy campaigns store (minimal shape needed by KB)
const campaignsStore = { campaigns: new Map() };
try {
  const json = readJsonSafeEnsure(path.join(dataDir, 'campaigns.json'), { campaigns: [] });
  if (Array.isArray(json.campaigns)) {
    for (const c of json.campaigns) {
      const id = c.id || ('c_' + Math.random().toString(36).slice(2, 8));
      campaignsStore.campaigns.set(id, { id, name: c.name || id, brief: { description: c.description || '' } });
    }
  }
} catch (_) {}

// Global AI KB and memory
function buildGlobalKB() {
  var kb = { items: [], business: { name: '', about: '', tone: '' } };
  try {
    var profile = readBusinessProfile() || {};
    kb.business = {
      name: String(profile.business && profile.business.name || ''),
      about: String(profile.business && profile.business.about || ''),
      tone: String(profile.business && profile.business.tone || 'Friendly, helpful, concise')
    };

    // Include onboarding data from all users
    var onboardingData = [];
    for (const [userId, data] of authStore.onboardingByUser) {
      if (data && typeof data === 'object') {
        onboardingData.push({
          userId: userId,
          businessName: String(data.businessName || ''),
          businessAbout: String(data.businessAbout || ''),
          tone: String(data.tone || ''),
          industry: String(data.industry || ''),
          goals: Array.isArray(data.goals) ? data.goals.map(String) : [],
          challenges: Array.isArray(data.challenges) ? data.challenges.map(String) : [],
          sources: ['onboarding']
        });
      }
    }
    kb.onboarding = onboardingData;

    var byId = new Map();
    for (const c of campaignsStore.campaigns.values()) {
      byId.set(c.id, {
        id: c.id,
        name: String(c.name || c.id),
        description: String((c.brief && c.brief.description) || ''),
        keywords: [],
        sources: ['campaign']
      });
    }
    var mai = getActiveMotherAI();
    if (mai && Array.isArray(mai.elements)) {
      for (var i = 0; i < mai.elements.length; i++) {
        var el = mai.elements[i];
        var c = campaignsStore.campaigns.get(el.campaignId);
        if (!c) continue;
        var base = byId.get(c.id);
        var label = String(el.label || '');
        var kws = Array.isArray(el.keywords) ? el.keywords.map(function(k){ return String(k); }) : [];
        if (label && !base.name) base.name = label;
        base.keywords = (base.keywords || []).concat(kws);
        base.sources.push('mother_ai');
      }
    }
    for (const v of byId.values()) kb.items.push(v);
  } catch (_) {}
  return kb;
}

var globalKB = buildGlobalKB();
function refreshGlobalKB() { globalKB = buildGlobalKB(); }

// Simple per-user/per-conversation memory (stored in userMemoriesFile)
function appendMemory(userId, convId, title, data) {
  try {
    if (!config.ai.memoryEnabled) return;
    const db = readJsonSafeEnsure(userMemoriesFile, { users: {} });
    const uid = String(userId || '');
    const cid = String(convId || '');
    db.users = db.users || {};
    db.users[uid] = db.users[uid] || { memories: [] };
    const m = { id: 'mem_' + Date.now(), title: String(title || ''), type: 'note', data: { conversationId: cid, ...data }, createdAt: new Date().toISOString() };
    db.users[uid].memories.push(m);
    writeJsonSafe(userMemoriesFile, db);
  } catch (_) {}
}

// Analytics API: exposes simple message counters
app.get('/api/analytics', (_req, res) => {
  try {
    const data = loadAnalytics();
    return res.json({ success: true, analytics: data });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
});

function getRecentMemories(userId, limit) {
  try {
    const db = readJsonSafeEnsure(userMemoriesFile, { users: {} });
    const arr = (db.users && db.users[String(userId || '')] && db.users[String(userId || '')].memories) || [];
    return arr.slice(-1 * (limit || 5));
  } catch (_) { return []; }
}

function retrieveContext(query, k) {
  var q = String(query || '').toLowerCase();
  var scored = [];
  for (var i = 0; i < globalKB.items.length; i++) {
    var it = globalKB.items[i];
    var hay = (it.name + ' ' + it.description + ' ' + (it.keywords || []).join(' ')).toLowerCase();
    var score = 0;
    if (hay.indexOf(q) >= 0) score += 5;
    var toks = q.split(/[^a-z0-9]+/);
    for (var t = 0; t < toks.length; t++) {
      var tok = toks[t]; if (!tok) continue;
      if (hay.indexOf(tok) >= 0) score += 1;
    }
    if (score > 0) scored.push({ score: score, item: it });
  }
  scored.sort(function(a,b){ return b.score - a.score; });
  var top = scored.slice(0, k || 3).map(function(s){ return s.item; });
  var ctx = [];
  for (var j = 0; j < top.length; j++) {
    var x = top[j];
    ctx.push('- ' + x.name + ': ' + x.description + (x.keywords && x.keywords.length ? ' (keywords: ' + x.keywords.join(', ') + ')' : ''));
  }
  return { items: top, text: ctx.join('\n') };
}

async function answerWithGlobalAI(userText, userId) {
  var ctx = retrieveContext(userText, 3);
  var tone = globalKB.business && globalKB.business.tone ? globalKB.business.tone : 'Friendly, helpful, concise';
  var biz = globalKB.business && globalKB.business.name ? globalKB.business.name : 'our business';
  var recent = getRecentMemories(userId, 5).map(function(m){ return '- ' + m.title; }).join('\n');
  var system = [
    'You are the Global AI for ' + biz + '. Keep answers concise and helpful in the tone: ' + tone + '.',
    'Use ONLY the provided context. If uncertain, ask a brief clarifying question.',
    'Mention the product/campaign names you used.',
    (globalKB.business && globalKB.business.about ? ('Business about: ' + globalKB.business.about) : ''),
    (recent ? ('Recent user memory:\n' + recent) : ''),
    'Context:\n' + ctx.text
  ].filter(Boolean).join('\n');
  var reply = await generateWithGroq(userText, system);
  return { reply: reply, sources: ctx.items.map(function(i){ return i.id; }) };
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

// Upload storage (temp files on disk)
const uploadDir = path.join(__dirname, 'uploads');
ensureDir(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '_' + safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB

// Initialize local stores on boot
try { loadMessengerStore(); } catch (_) {}
try { ensureDir(path.dirname(profilePromptsFile)); readJsonSafeEnsure(profilePromptsFile, { profiles: {} }); } catch (_) {}
try { ensureDir(path.dirname(userMemoriesFile)); readJsonSafeEnsure(userMemoriesFile, { users: {} }); } catch (_) {}

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
    // Persist business profile from onboarding
    try {
      const existing = readBusinessProfile();
      const updated = {
        ...existing,
        business: {
          ...(existing.business || {}),
          name: data.businessName || existing.business?.name || '',
          about: data.businessAbout || existing.business?.about || '',
          tone: data.tone || existing.business?.tone || 'Friendly, helpful, concise'
        }
      };
      writeJsonSafe(profileFile, updated);
      refreshGlobalKB();
    } catch (_) {}
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// --- Messenger store, campaigns, mother AI configs ---
const dataPath = path.join(__dirname, 'data');
ensureDir(dataPath);
const messengerStoreFile = path.join(dataPath, 'messengerStore.json');
const campaignsFile = path.join(dataPath, 'campaigns.json');
const motherAIFile = path.join(dataPath, 'motherAI.json');

const messengerStore = { conversations: new Map(), systemPrompts: new Map() };

function readJsonSafe(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return null; } }

function loadMessengerStore() {
  const json = readJsonSafe(messengerStoreFile) || { conversations: [], systemPrompts: [] };
  messengerStore.conversations = new Map((json.conversations || []).map(c => [c.id, c]));
  messengerStore.systemPrompts = new Map((json.systemPrompts || []).map(s => [s.conversationId, s.systemPrompt]));
}

function saveMessengerStore() {
  const json = {
    conversations: Array.from(messengerStore.conversations.values()),
    systemPrompts: Array.from(messengerStore.systemPrompts.entries()).map(([conversationId, systemPrompt]) => ({ conversationId, systemPrompt }))
  };
  writeJsonSafe(messengerStoreFile, json);
}

// --- Simple analytics (messages sent/received per channel) ---
const analyticsFile = path.join(dataPath, 'analytics.json');
function defaultAnalytics() {
  return {
    counters: {
      messenger: { sent: 0, received: 0 },
      whatsapp: { sent: 0, received: 0 },
      instagram: { sent: 0, received: 0 },
      total: { sent: 0, received: 0 }
    }
  };
}
function loadAnalytics() { return readJsonSafe(analyticsFile) || defaultAnalytics(); }
function saveAnalytics(a) { writeJsonSafe(analyticsFile, a || defaultAnalytics()); }
function bumpAnalytics(channel, direction) {
  try {
    const a = loadAnalytics();
    const key = String(channel || 'messenger');
    a.counters[key] = a.counters[key] || { sent: 0, received: 0 };
    if (direction === 'sent') { a.counters[key].sent += 1; a.counters.total.sent += 1; }
    if (direction === 'received') { a.counters[key].received += 1; a.counters.total.received += 1; }
    saveAnalytics(a);
  } catch (_) {}
}

// --- Helpers to upsert conversations/messages locally ---
function ensureConversation(conversationId, seed) {
  const convId = String(conversationId);
  const existing = messengerStore.conversations.get(convId) || null;
  if (existing) return existing;
  const base = {
    id: convId,
    name: (seed && seed.name) || convId,
    username: (seed && seed.username) || '',
    profilePic: (seed && seed.profilePic) || null,
    lastMessage: '',
    timestamp: new Date().toISOString(),
    aiMode: false,
    pending: { autoStartIfFirstMessage: false, initialMessage: '', profileId: 'default' },
    messages: []
  };
  messengerStore.conversations.set(convId, base);
  saveMessengerStore();
  return base;
}
function appendMessage(conversationId, message) {
  const conv = ensureConversation(conversationId);
  conv.messages = Array.isArray(conv.messages) ? conv.messages : [];
  conv.messages.push(message);
  conv.lastMessage = message.text;
  conv.timestamp = message.timestamp;
  messengerStore.conversations.set(conversationId, conv);
  saveMessengerStore();
  try { io.emit('messenger:message_created', { conversationId, message }); } catch (_) {}
  return conv;
}

const campaignsStore2 = { campaigns: new Map() };
function loadCampaigns() {
  const json = readJsonSafeEnsure(campaignsFile, { campaigns: [] });
  const arr = Array.isArray(json.campaigns) ? json.campaigns : [];
  campaignsStore2.campaigns = new Map(arr.map(c => [c.id, c]));
}
function saveCampaigns() {
  const arr = Array.from(campaignsStore2.campaigns.values());
  writeJsonSafe(campaignsFile, { campaigns: arr });
}
loadCampaigns();

// --- Mother AI Config Store ---
const motherAIStore = { items: [], activeMotherAIId: null };
function loadMotherAIStore() {
  const json = readJsonSafeEnsure(motherAIFile, { items: [], activeMotherAIId: null });
  motherAIStore.items = Array.isArray(json.items) ? json.items : [];
  motherAIStore.activeMotherAIId = json.activeMotherAIId || null;
}
function saveMotherAIStore() {
  writeJsonSafe(motherAIFile, { items: motherAIStore.items, activeMotherAIId: motherAIStore.activeMotherAIId || null });
}
function getActiveMotherAI() {
  const id = motherAIStore.activeMotherAIId;
  if (!id) return null;
  return motherAIStore.items.find(i => i.id === id) || null;
}
loadMotherAIStore();

// --- WEBHOOKS, routes etc. (trimmed) ---
// ... existing webhook handlers earlier in file ...

// Minimal campaigns API for UI
app.get('/api/campaigns', (_req, res) => {
  try {
    const arr = Array.from(campaignsStore2.campaigns.values()).map(c => ({
      id: c.id,
      name: c.name || c.id,
      brief: { description: (c.brief && c.brief.description) || '' }
    }));
    return res.json(arr);
  } catch (e) {
    return res.status(500).json({ error: 'campaigns_list_failed' });
  }
});

// Upsert a campaign (rename or create)
app.post('/api/campaigns', (req, res) => {
  try {
    const { id, name, description } = req.body || {};
    const cid = String(id || ('c_' + Date.now()));
    const existing = campaignsStore2.campaigns.get(cid) || { id: cid, name: cid, brief: { description: '' } };
    const updated = {
      ...existing,
      id: cid,
      name: typeof name === 'string' && name.trim() ? name.trim() : (existing.name || cid),
      brief: { description: typeof description === 'string' ? description : (existing.brief && existing.brief.description) || '' }
    };
    campaignsStore2.campaigns.set(cid, updated);
    saveCampaigns();
    try { refreshGlobalKB(); } catch (_) {}
    return res.json({ success: true, campaign: updated });
  } catch (e) {
    return res.status(500).json({ error: 'campaigns_upsert_failed' });
  }
});

// Patch a campaign (rename/description)
app.patch('/api/campaigns/:id', (req, res) => {
  try {
    const id = String(req.params.id || '');
    const existing = campaignsStore2.campaigns.get(id);
    if (!existing) return res.status(404).json({ error: 'not_found' });
    const { name, description } = req.body || {};
    const updated = {
      ...existing,
      name: typeof name === 'string' && name.trim() ? name.trim() : existing.name,
      brief: { description: typeof description === 'string' ? description : (existing.brief && existing.brief.description) || '' }
    };
    campaignsStore2.campaigns.set(id, updated);
    saveCampaigns();
    try { refreshGlobalKB(); } catch (_) {}
    return res.json({ success: true, campaign: updated });
  } catch (e) {
    return res.status(500).json({ error: 'campaigns_patch_failed' });
  }
});

// Start a campaign (mark active, no conversation creation per requirements)
app.post('/api/campaigns/:id/start', (req, res) => {
  try {
    const id = String(req.params.id || '');
    const existing = campaignsStore2.campaigns.get(id);
    if (!existing) return res.status(404).json({ success: false, message: 'campaign_not_found' });
    const updated = { ...existing, active: true, startedAt: new Date().toISOString() };
    campaignsStore2.campaigns.set(id, updated);
    saveCampaigns();
    return res.json({ success: true, campaign: updated });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'campaign_start_failed' });
  }
});

// Stop a campaign
app.post('/api/campaigns/:id/stop', (req, res) => {
  try {
    const id = String(req.params.id || '');
    const existing = campaignsStore2.campaigns.get(id);
    if (!existing) return res.status(404).json({ success: false, message: 'campaign_not_found' });
    const updated = { ...existing, active: false, stoppedAt: new Date().toISOString(), status: 'paused' };
    campaignsStore2.campaigns.set(id, updated);
    saveCampaigns();
    return res.json({ success: true, campaign: updated });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'campaign_stop_failed' });
  }
});

// Delete a campaign
app.delete('/api/campaigns/:id', (req, res) => {
  try {
    const id = String(req.params.id || '');
    const existed = campaignsStore2.campaigns.delete(id);
    saveCampaigns();
    return res.json({ success: true, deleted: existed });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'campaign_delete_failed' });
  }
});

// --- Messenger chat APIs ---
// List conversations
app.get('/api/messenger/conversations', (_req, res) => {
  try {
    const arr = Array.from(messengerStore.conversations.values()).map(c => ({
      id: c.id,
      name: c.name || c.username || c.id,
      profilePic: c.profilePic || null,
      lastMessage: c.lastMessage || '',
      timestamp: c.timestamp || new Date().toISOString(),
    }));
    return res.json(arr);
  } catch (e) {
    return res.status(500).json({ error: 'conversations_list_failed' });
  }
});

// Sync Messenger conversations from Facebook if configured
app.post('/api/messenger/sync', async (_req, res) => {
  try {
    const { pageToken, pageId } = config.facebook;
    if (!pageToken || !pageId) return res.status(400).json({ success: false, error: 'facebook_not_configured' });
    const fbConvs = await fetchFacebookConversations(pageToken, pageId);
    for (const c of fbConvs) {
      // Upsert conversation
      const existing = messengerStore.conversations.get(c.id) || null;
      const base = existing || { id: c.id, messages: [] };
      const updated = {
        ...base,
        name: c.name || base.name || c.id,
        username: c.username || base.username || '',
        profilePic: c.profilePic || base.profilePic || null,
        lastMessage: c.lastMessage || base.lastMessage || '',
        timestamp: c.timestamp || base.timestamp || new Date().toISOString(),
        aiMode: typeof base.aiMode === 'boolean' ? base.aiMode : false,
        pending: base.pending || { autoStartIfFirstMessage: false, initialMessage: '', profileId: 'default' },
        messages: Array.isArray(base.messages) && base.messages.length > 0 ? base.messages : (c.messages || [])
      };
      messengerStore.conversations.set(c.id, updated);
    }
    saveMessengerStore();
    try { io.emit('messenger:conversations_synced'); } catch (_) {}
    return res.json({ success: true, count: messengerStore.conversations.size });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'sync_failed' });
  }
});

// Create/register a conversation or pending entry
app.post('/api/messenger/conversations', (req, res) => {
  try {
    const { id, name, username, autoStartIfFirstMessage, systemPrompt, initialMessage, profileId } = req.body || {};
    const convId = String(id || ('conv_' + Date.now()));
    const existing = messengerStore.conversations.get(convId) || null;
    const base = existing || { id: convId, messages: [] };
    const updated = {
      ...base,
      name: typeof name === 'string' && name ? name : (base.name || username || convId),
      username: typeof username === 'string' ? username : (base.username || ''),
      profilePic: base.profilePic || null,
      lastMessage: base.lastMessage || '',
      timestamp: base.timestamp || new Date().toISOString(),
      aiMode: typeof base.aiMode === 'boolean' ? base.aiMode : false,
      pending: { autoStartIfFirstMessage: !!autoStartIfFirstMessage, initialMessage: initialMessage || '', profileId: profileId || 'default' }
    };
    if (typeof systemPrompt === 'string') messengerStore.systemPrompts.set(convId, systemPrompt);
    messengerStore.conversations.set(convId, updated);
    saveMessengerStore();
    try { io.emit('messenger:conversation_created', updated); } catch (_) {}
    return res.json({ success: true, conversation: updated });
  } catch (e) {
    return res.status(500).json({ error: 'conversation_create_failed' });
  }
});

// Get messages for a conversation
app.get('/api/messenger/messages', (req, res) => {
  try {
    const convId = String(req.query.conversationId || '');
    const conv = messengerStore.conversations.get(convId);
    if (!conv) return res.status(404).json({ error: 'conversation_not_found' });
    const systemPrompt = messengerStore.systemPrompts.get(convId) || '';
    return res.json({
      messages: Array.isArray(conv.messages) ? conv.messages : [],
      systemPrompt,
      aiMode: !!conv.aiMode
    });
  } catch (e) {
    return res.status(500).json({ error: 'messages_fetch_failed' });
  }
});

// Send a message in a conversation
app.post('/api/messenger/send-message', async (req, res) => {
  try {
    const { conversationId, text, sender } = req.body || {};
    const convId = String(conversationId || '');
    if (!convId) return res.status(400).json({ error: 'conversationId_required' });
    if (!text) return res.status(400).json({ error: 'text_required' });
    const conv = messengerStore.conversations.get(convId) || { id: convId, name: convId, messages: [], aiMode: false };
    const msg = { id: 'm_' + Date.now(), sender: sender || 'agent', text: String(text), timestamp: new Date().toISOString(), isRead: true };
    conv.messages = Array.isArray(conv.messages) ? conv.messages : [];
    conv.messages.push(msg);
    conv.lastMessage = msg.text;
    conv.timestamp = msg.timestamp;
    messengerStore.conversations.set(convId, conv);
    saveMessengerStore();
    try { io.emit('messenger:message_created', { conversationId: convId, message: msg }); } catch (_) {}

    // Bridge to Facebook Messenger if configured and sender is agent
    if ((sender || 'agent') === 'agent' && config.facebook.pageToken) {
      try {
        await axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${config.facebook.pageToken}`, {
          recipient: { id: convId }, // convId should be PSID for real FB convs
          message: { text: String(text).slice(0, 900) }
        }, { headers: { 'Content-Type': 'application/json' } });
        bumpAnalytics('messenger', 'sent');
      } catch (err) {
        // Log but continue
        console.warn('FB send failed:', err.response?.data || err.message);
      }
    }

    // If this is a customer message and Global AI is enabled, optionally auto-reply locally
    if ((sender || 'agent') === 'customer' && config.ai.globalAiEnabled) {
      try {
        const { reply } = await answerWithGlobalAI(String(text), convId);
        const aiMsg = { id: 'm_' + (Date.now() + 1), sender: 'agent', text: String(reply).slice(0, 900), timestamp: new Date().toISOString(), isRead: true };
        conv.messages.push(aiMsg);
        conv.lastMessage = aiMsg.text;
        conv.timestamp = aiMsg.timestamp;
        messengerStore.conversations.set(convId, conv);
        saveMessengerStore();
        try { io.emit('messenger:message_created', { conversationId: convId, message: aiMsg }); } catch (_) {}
      } catch (_) {}
    }

    return res.json({ success: true, message: msg });
  } catch (e) {
    return res.status(500).json({ error: 'send_failed' });
  }
});

// Toggle AI mode per conversation
app.post('/api/messenger/ai-mode', (req, res) => {
  try {
    const { conversationId, enabled } = req.body || {};
    const convId = String(conversationId || '');
    const conv = messengerStore.conversations.get(convId);
    if (!conv) return res.status(404).json({ error: 'conversation_not_found' });
    conv.aiMode = !!enabled;
    messengerStore.conversations.set(convId, conv);
    saveMessengerStore();
    return res.json({ success: true, aiMode: conv.aiMode });
  } catch (e) {
    return res.status(500).json({ error: 'ai_mode_failed' });
  }
});

// Explicit AI reply helper
app.post('/api/messenger/ai-reply', async (req, res) => {
  try {
    const { conversationId, lastUserMessage, systemPrompt } = req.body || {};
    const convId = String(conversationId || '');
    if (!convId) return res.status(400).json({ error: 'conversationId_required' });
    const conv = messengerStore.conversations.get(convId);
    if (!conv) return res.status(404).json({ error: 'conversation_not_found' });
    if (typeof systemPrompt === 'string') messengerStore.systemPrompts.set(convId, systemPrompt);
    const { reply } = await answerWithGlobalAI(String(lastUserMessage || ''), convId);
    const aiMsg = { id: 'm_' + Date.now(), sender: 'agent', text: String(reply).slice(0, 900), timestamp: new Date().toISOString(), isRead: true };
    conv.messages = Array.isArray(conv.messages) ? conv.messages : [];
    conv.messages.push(aiMsg);
    conv.lastMessage = aiMsg.text;
    conv.timestamp = aiMsg.timestamp;
    messengerStore.conversations.set(convId, conv);
    saveMessengerStore();
    try { io.emit('messenger:message_created', { conversationId: convId, message: aiMsg }); } catch (_) {}
    return res.json({ success: true, message: aiMsg });
  } catch (e) {
    return res.status(500).json({ error: 'ai_reply_failed' });
  }
});

// Save system prompt per conversation
app.post('/api/messenger/system-prompt', (req, res) => {
  try {
    const { conversationId, systemPrompt } = req.body || {};
    const convId = String(conversationId || '');
    if (!convId) return res.status(400).json({ success: false, message: 'conversationId_required' });
    if (typeof systemPrompt !== 'string') return res.status(400).json({ success: false, message: 'systemPrompt_required' });
    // ensure conversation exists to keep things consistent
    ensureConversation(convId);
    messengerStore.systemPrompts.set(convId, systemPrompt);
    saveMessengerStore();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'system_prompt_save_failed' });
  }
});

// Activate a Mother AI config and refresh Global KB
app.post('/api/mother-ai/activate/:id', (req, res) => {
  try {
    const id = String(req.params.id || '');
    const found = motherAIStore.items.find(i => i.id === id);
    if (!found) return res.status(404).json({ error: 'not_found' });
    motherAIStore.activeMotherAIId = id;
    saveMotherAIStore();
    try { refreshGlobalKB(); } catch (_) {}
    return res.json({ success: true, activeMotherAIId: id });
  } catch (e) {
    return res.status(500).json({ error: 'activate_failed' });
  }
});

// Global AI direct answer endpoint
app.post('/api/global-ai/answer', async (req, res) => {
  try {
    const { text, userId, conversationId } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text_required' });
    const uid = String(userId || 'anon');
    const { reply, sources } = await answerWithGlobalAI(String(text), uid);
    try { appendMemory(uid, String(conversationId || ''), `Asked: ${String(text).slice(0, 48)}`, { lastText: text, sources }); } catch (_) {}
    return res.json({ success: true, reply, sources });
  } catch (e) {
    const msg = (e && e.message) || 'internal_error';
    return res.status(500).json({ success: false, error: msg });
  }
});

// AI config endpoints (toggle Global AI, mode, memory)
app.get('/api/ai/config', (_req, res) => {
  try {
    return res.json({
      success: true,
      config: {
        globalAiEnabled: !!config.ai.globalAiEnabled,
        globalAiMode: config.ai.globalAiMode || 'replace',
        memoryEnabled: !!config.ai.memoryEnabled
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
});

app.post('/api/ai/config', (req, res) => {
  try {
    const { globalAiEnabled, globalAiMode, memoryEnabled } = req.body || {};
    if (typeof globalAiEnabled === 'boolean') config.ai.globalAiEnabled = globalAiEnabled;
    if (globalAiMode && (globalAiMode === 'replace' || globalAiMode === 'hybrid')) config.ai.globalAiMode = globalAiMode;
    if (typeof memoryEnabled === 'boolean') config.ai.memoryEnabled = memoryEnabled;
    try { refreshGlobalKB(); } catch (_) {}
    return res.json({
      success: true,
      config: {
        globalAiEnabled: !!config.ai.globalAiEnabled,
        globalAiMode: config.ai.globalAiMode || 'replace',
        memoryEnabled: !!config.ai.memoryEnabled
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
});

// WhatsApp webhook (verification + inbound handling)
app.get('/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const expected = config.whatsapp.verifyToken || config.webhook.verifyToken || 'WORKFLOW_VERIFY_TOKEN';
    if (mode === 'subscribe' && String(token) === String(expected) && challenge) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('forbidden');
  } catch (_) {
    return res.status(500).send('error');
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const body = req.body || {};
    if (body.object !== 'whatsapp_business_account') {
      return res.sendStatus(200);
    }
    const entries = Array.isArray(body.entry) ? body.entry : [];
    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const ch of changes) {
        const value = ch && ch.value ? ch.value : {};
        const messages = Array.isArray(value.messages) ? value.messages : [];
        const phoneNumberId = (value.metadata && value.metadata.phone_number_id) || config.whatsapp.phoneNumberId;
        for (const msg of messages) {
          try {
            const from = msg.from || msg.phone_number || msg.wa_id || 'unknown';
            const type = msg.type;
            const text = type === 'text' ? (msg.text && msg.text.body) : (msg.body || '');
            if (!text) continue;
            // Use Global AI if enabled
            if (config.ai.globalAiEnabled) {
              const { reply, sources } = await answerWithGlobalAI(String(text), String(from));
              try { appendMemory(String(from), String(msg.id || ''), `WA: ${String(text).slice(0,48)}`, { channel: 'whatsapp', sources }); } catch (_) {}
              // Send reply
              const { token } = getWhatsappCreds();
              if (phoneNumberId && token) {
                await axios.post(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
                  messaging_product: 'whatsapp',
                  to: from,
                  type: 'text',
                  text: { body: String(reply).slice(0, 900) }
                }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
              }
            }
          } catch (e) {
            // swallow per-message errors
          }
        }
      }
    }
    return res.sendStatus(200);
  } catch (e) {
    return res.sendStatus(200);
  }
});

// WhatsApp utility endpoints (trimmed)
app.get('/api/integrations/whatsapp/config', (req, res) => {
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
    const status = (err && err.response && err.response.status) || 500;
    const fbErr = err && err.response && err.response.data && err.response.data.error;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: 'whatsapp_send_failed',
      details: fbErr ? { message: fbErr.message, code: fbErr.code, subcode: fbErr.error_subcode } : undefined
    });
  }
});

app.get('/api/whatsapp/diagnose', async (_req, res) => {
  try {
    if (!config.whatsapp.phoneNumberId || !config.whatsapp.token) {
      return res.status(400).json({ success: false, issues: ['whatsapp_not_configured'] });
    }
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
});

// Serve frontend build (Vite)
const clientDir = path.join(__dirname, '..', 'work-flow', 'dist');
app.use('/assets', express.static(path.join(clientDir, 'assets'), { maxAge: '1y', immutable: true }));
app.use(express.static(clientDir, { maxAge: '1h' }));

// Facebook App info for Integration banner
app.get('/api/facebook/app', (_req, res) => {
  try {
    return res.json({
      appId: config.facebook.appId || null,
      appName: process.env.FACEBOOK_APP_NAME || 'Facebook App',
      callback: config.facebook.callbackUrl || null
    });
  } catch (e) {
    return res.status(500).json({});
  }
});

// Integrations overall status
app.get('/api/integrations/status', (_req, res) => {
  try {
    const fbConnected = !!(config.facebook.pageToken && config.facebook.pageId);
    const waMode = config.whatsapp.mode || 'production';
    const waToken = waMode === 'test' ? (config.whatsapp.testToken || '') : (config.whatsapp.token || '');
    const waConnected = !!(config.whatsapp.phoneNumberId && waToken);

    return res.json({
      facebook: {
        connected: fbConnected,
        pageId: config.facebook.pageId || null,
        provider: config.facebook.provider || 'local'
      },
      whatsapp: {
        connected: waConnected,
        mode: waMode,
        phoneNumberId: config.whatsapp.phoneNumberId || null
      },
      instagram: {
        connected: false
      }
    });
  } catch (e) {
    return res.status(500).json({ facebook: { connected: false }, whatsapp: { connected: false }, instagram: { connected: false } });
  }
});

// Helper function to fetch Facebook conversations
async function fetchFacebookConversations(pageToken, pageId) {

  try {
    // Fetch conversations from Facebook Graph API
    const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/conversations`, {
      params: {
        access_token: pageToken,
        fields: 'id,participants,messages.limit(10){message,from,to,created_time,id}',
        limit: 50
      }
    });

    const conversations = response.data.data || [];
    const normalizedConversations = [];

    for (const conv of conversations) {

      if (!conv.participants || !conv.participants.data) continue;

      // Find the customer participant (not the page)
      const customerParticipant = conv.participants.data.find(p => p.id !== pageId);
      if (!customerParticipant) continue;

      // Get the latest message
      const messages = conv.messages && conv.messages.data ? conv.messages.data : [];
      const lastMessage = messages.length > 0 ? messages[0] : null;

      // Create conversation object
      // IMPORTANT: use PSID (customerParticipant.id) as our canonical conversation ID.
      // This ensures outbound send via /me/messages works and inbound webhooks (sender.id) map to same ID.
      const conversation = {
        id: customerParticipant.id,
        threadId: conv.id,
        name: customerParticipant.name || customerParticipant.id,
        username: customerParticipant.id,
        profilePic: null, // Could fetch user profile pic separately
        messages: messages.reverse().map(msg => ({
          id: msg.id,
          sender: msg.from.id === pageId ? 'agent' : 'customer',
          text: msg.message || '',
          timestamp: msg.created_time,
          isRead: true
        })),
        lastMessage: lastMessage ? (lastMessage.message || '') : '',
        timestamp: lastMessage ? lastMessage.created_time : new Date().toISOString(),
        aiMode: false,
        pending: { autoStartIfFirstMessage: false, initialMessage: '', profileId: 'default' }
      };


      normalizedConversations.push(conversation);
    }

    return normalizedConversations;
  } catch (error) {
    console.error('Error fetching Facebook conversations:', error.response?.data || error.message);
    return [];
  }
}

// Facebook OAuth to fetch Page Access Token (optional convenience)
app.get('/auth/facebook', (req, res) => {
  try {
    const redirect = config.facebook.callbackUrl;
    if (!config.facebook.appId || !config.facebook.appSecret) {
      return res.status(400).send('facebook_app_not_configured');
    }
    const params = new URLSearchParams({
      client_id: config.facebook.appId,
      redirect_uri: redirect,
      scope: [
        'pages_messaging',
        'pages_manage_metadata',
        'pages_read_engagement',
        'pages_show_list'
      ].join(','),
      response_type: 'code',
      auth_type: 'rerequest'
    }).toString();
    return res.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params}`);
  } catch (e) {
    return res.status(500).send('auth_error');
  }
});

app.get('/auth/facebook/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('missing_code');
    const redirect = config.facebook.callbackUrl;
    const tokenResp = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: config.facebook.appId,
        client_secret: config.facebook.appSecret,
        redirect_uri: redirect,
        code
      }
    });
    const userAccessToken = tokenResp.data && tokenResp.data.access_token;
    if (!userAccessToken) return res.status(400).send('no_user_token');

    // Fetch pages for this user and pick a page
    const pagesResp = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: { access_token: userAccessToken }
    });
    const pages = Array.isArray(pagesResp.data && pagesResp.data.data) ? pagesResp.data.data : [];
    if (!pages.length) return res.status(400).send('no_pages_found');

    const desiredPageId = process.env.FB_PAGE_ID || config.facebook.pageId || null;
    let page = null;
    if (desiredPageId) {
      page = pages.find(p => String(p.id) === String(desiredPageId)) || null;
    }
    if (!page) page = pages[0];

    const pageToken = page && page.access_token;
    const pageId = page && page.id;
    if (!pageToken || !pageId) return res.status(400).send('no_page_token');

    // Save in-memory
    config.facebook.pageToken = pageToken;
    config.facebook.pageId = pageId;

    // Persist to disk so it survives restarts
    try {
      const integrationsFile = path.join(dataDir, 'integrations.json');
      const current = readJsonSafeEnsure(integrationsFile, { facebook: {} });
      current.facebook = current.facebook || {};
      current.facebook.pageId = pageId;
      current.facebook.pageToken = pageToken;
      current.facebook.connectedAt = new Date().toISOString();
      writeJsonSafe(integrationsFile, current);
    } catch (_) {}

    // Redirect to Integration dashboard immediately with absolute URL; HTML fallback if redirect fails
    const baseUrl = process.env.RENDER_EXTERNAL_URL || '';
    const nextUrl = `${baseUrl}/dashboard/integration?connected=1`;
    try {
      return res.redirect(302, nextUrl);
    } catch (_) {
      return res
        .status(200)
        .send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Facebook Connected</title>
  <meta http-equiv="refresh" content="0; url=${nextUrl}" />
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; background: #0f172a; color: #e2e8f0; display: grid; place-items: center; min-height: 100vh; margin: 0; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(148,163,184,0.2); padding: 24px 28px; border-radius: 16px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .desc { font-size: 14px; color: #94a3b8; margin-bottom: 16px; }
    .btn { display: inline-block; padding: 10px 16px; border-radius: 10px; background: linear-gradient(135deg, #059669, #2563eb); color: white; text-decoration: none; font-weight: 600; }
  </style>
  <script>
    try {
      // Mark integration flag and ensure SPA can enter dashboard without manual login (demo UX)
      window.localStorage.setItem('integration_connected', '1');
      const existingUser = window.localStorage.getItem('user');
      if (!existingUser) {
        const demoUser = { id: 'oauth-user', email: 'oauth@return.local', role: 'user', onboardingCompleted: true };
        window.localStorage.setItem('user', JSON.stringify(demoUser));
      }
    } catch (e) {}
    setTimeout(function(){ window.location.replace('${nextUrl}'); }, 60);
  </script>
</head>
<body>
  <div class="card">
    <div class="title">Facebook connected</div>
    <div class="desc">Page token saved. Redirecting you to Integration dashboard…</div>
    <a class="btn" href="${nextUrl}">Go to Dashboard</a>
  </div>
</body>
</html>`);
    }
  } catch (e) {
    const msg = e && e.response && e.response.data ? JSON.stringify(e.response.data) : (e.message || 'error');
    return res.status(500).send(msg);
  }
});

// Facebook Messenger webhook (optional direct page webhooks)
app.get('/messenger/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const expected = config.webhook.verifyToken || 'WORKFLOW_VERIFY_TOKEN';
    if (mode === 'subscribe' && String(token) === String(expected) && challenge) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('forbidden');
  } catch (_) {
    return res.status(500).send('error');
  }
});

app.post('/messenger/webhook', async (req, res) => {
  try {
    const body = req.body || {};
    if (body.object !== 'page') {
      return res.sendStatus(200);
    }
    const entries = Array.isArray(body.entry) ? body.entry : [];
    for (const entry of entries) {
      const messaging = Array.isArray(entry.messaging) ? entry.messaging : [];
      for (const event of messaging) {
        try {
          const senderId = event.sender && event.sender.id ? String(event.sender.id) : null;
          const text = event.message && event.message.text ? String(event.message.text) : '';
          if (!senderId) continue;

          // Upsert local conversation and store incoming message
          if (text) {
            const incoming = { id: String(event.message && event.message.mid || ('m_' + Date.now())), sender: 'customer', text, timestamp: new Date().toISOString(), isRead: false };
            appendMessage(senderId, incoming);
            bumpAnalytics('messenger', 'received');
          }

          // If Global AI enabled, auto-reply on Messenger
          if (text && config.ai.globalAiEnabled) {
            const { reply, sources } = await answerWithGlobalAI(text, senderId);
            try { appendMemory(senderId, String(event.message && event.message.mid || ''), `FB: ${text.slice(0,48)}`, { channel: 'messenger', sources }); } catch (_) {}
            if (config.facebook.pageToken) {
              await axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${config.facebook.pageToken}`, {
                recipient: { id: senderId },
                message: { text: String(reply).slice(0, 900) }
              }, { headers: { 'Content-Type': 'application/json' } });
              const outgoing = { id: 'm_' + (Date.now() + 1), sender: 'agent', text: String(reply).slice(0, 900), timestamp: new Date().toISOString(), isRead: true };
              appendMessage(senderId, outgoing);
              bumpAnalytics('messenger', 'sent');
            }
          }
        } catch (e) {
          // ignore per-message errors
        }
      }
    }
    return res.sendStatus(200);
  } catch (e) {
    return res.sendStatus(200);
  }
});

// Mother AI endpoints (kept for compatibility with flow builder data)
app.get('/api/mother-ai', (_req, res) => {
  try {
    return res.json({ items: motherAIStore.items, activeMotherAIId: motherAIStore.activeMotherAIId || null });
  } catch (e) {
    return res.status(500).json({ error: 'list_failed' });
  }
});

app.post('/api/mother-ai', (req, res) => {
  try {
    const item = (req.body && req.body.item) || {};
    if (!item.id) item.id = 'mai_' + Date.now();
    const idx = motherAIStore.items.findIndex(i => i.id === item.id);
    if (idx >= 0) motherAIStore.items[idx] = item; else motherAIStore.items.push(item);
    saveMotherAIStore();
    return res.json({ success: true, items: motherAIStore.items, activeMotherAIId: motherAIStore.activeMotherAIId || null, lastId: item.id });
  } catch (e) {
    return res.status(500).json({ error: 'save_failed' });
  }
});

// SPA fallback for client-side routing
app.get('*', (req, res) => {
  // Do not capture API/auth/webhook routes
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/auth') ||
    req.path.startsWith('/webhook') ||
    req.path.startsWith('/messenger')
  ) {
    return res.status(404).send('Not found');
  }
  try {
    res.sendFile(path.join(clientDir, 'index.html'));
  } catch (e) {
    res.status(200).sendFile(path.join(clientDir, 'index.html'));
  }
});

// Start HTTP server
server.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});