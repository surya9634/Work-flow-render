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
          if (!senderId || !text) continue;
          if (config.ai.globalAiEnabled) {
            const { reply, sources } = await answerWithGlobalAI(text, senderId);
            try { appendMemory(senderId, String(event.message && event.message.mid || ''), `FB: ${text.slice(0,48)}`, { channel: 'messenger', sources }); } catch (_) {}
            if (config.facebook.pageToken) {
              await axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${config.facebook.pageToken}`, {
                recipient: { id: senderId },
                message: { text: String(reply).slice(0, 900) }
              }, { headers: { 'Content-Type': 'application/json' } });
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

// Start HTTP server
server.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});