/*
   BOT NAME: Whitekid Prime 
   FULL NAME: Whitekid Prime
   DEVELOPER: WhiteKid Tech
   CONTACT: +263789846423 | t.me/whitekid01
   VERSION: 6.0.0 (Games & Fun Pack - 350+ commands)
   COPYRIGHT: © 2026 WhiteKid Tech. All Rights Reserved.
*/
'use strict';

const fs = require('fs-extra');
const path = require('path');
const { exec, execSync } = require('child_process');
const crypto = require('crypto');
const os = require('os');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

// ─── AUTO MODULE INSTALLER ────────────────────────────────────────────────────
const REQUIRED_MODULES = [
    '@whiskeysockets/baileys','@octokit/rest','axios','chalk','express',
    'form-data','fs-extra','moment-timezone','node-telegram-bot-api','pino',
    'qrcode','yt-search','@distube/ytdl-core','openai','cheerio',
    'sharp','fluent-ffmpeg','@vitalets/google-translate-api','denethdev-ytmp3',
    'node-fetch','ruhend-scraper','yt-dlp-exec','file-type','node-id3'
];
function autoInstallModules() {
    const missing = [];
    for (const mod of REQUIRED_MODULES) { try { require.resolve(mod); } catch { missing.push(mod); } }
    if (missing.length > 0) {
        console.log(`\n📦 Installing ${missing.length} missing modules: ${missing.join(', ')}\n`);
        try { execSync(`npm install ${missing.join(' ')} --save --legacy-peer-deps`, { stdio: 'inherit' }); console.log('\n✅ Modules installed!\n'); }
        catch (e) { console.error('⚠️ Install error:', e.message); }
    }
}
autoInstallModules();

// ─── SAFE LOADER ──────────────────────────────────────────────────────────────
function safeRequire(name, fallback) { try { return require(name); } catch { console.warn(`⚠️ Missing: ${name}`); return fallback; } }

// ─── CHALK ────────────────────────────────────────────────────────────────────
let chalk;
try { chalk = require('chalk'); }
catch { const id = s => s; chalk = new Proxy(id, { get: (t, p) => { if (typeof p === 'string' && /^(bold|cyan|green|red|yellow|blue|magenta|white|gray|dim|underline)$/i.test(p)) return chalk; return id; }, apply: (t, th, a) => a[0] }); }

// ─── DEPS ─────────────────────────────────────────────────────────────────────
let express = safeRequire('express', null);
let router = express ? express.Router() : { get: () => {}, post: () => {}, use: () => {} };
const pino = safeRequire('pino', () => () => ({ level: 'silent', info: () => {}, error: () => {}, warn: () => {}, debug: () => {}, child: () => ({ level: 'fatal' }) }));
const OctokitPkg = safeRequire('@octokit/rest', null);
const { Octokit } = OctokitPkg || { Octokit: class { constructor() { this.repos = { getContent: async () => ({}), createOrUpdateFileContents: async () => ({}), deleteFile: async () => ({}) }; } } };
const moment = safeRequire('moment-timezone', () => { const f = () => ({ tz: () => ({ format: () => new Date().toISOString() }) }); return f; });
const axios = safeRequire('axios', { get: async () => ({ data: {} }), post: async () => ({ data: {} }) });
const FormData = safeRequire('form-data', class FD { append() {} getHeaders() { return {}; } });
const QRCode = safeRequire('qrcode', { toBuffer: async () => Buffer.from([]) });
const TelegramBot = safeRequire('node-telegram-bot-api', class { constructor() {} onText() {} on() {} sendMessage() {} answerCallbackQuery() {} deleteMessage() {} sendPhoto() {} });
const yts = safeRequire('yt-search', () => ({ search: async () => ({ videos: [] }) }));
const ytdl = safeRequire('@distube/ytdl-core', null);
let ytdlp; try { ytdlp = safeRequire('yt-dlp-exec', null); } catch (_) { ytdlp = null; }
const OpenAI = safeRequire('openai', null);
const cheerio = safeRequire('cheerio', () => ({ load: () => ({}) }));
const translate = safeRequire('@vitalets/google-translate-api', { translate: async () => ({ text: '' }) });
const ffmpeg = safeRequire('fluent-ffmpeg', null);
const ddownr = safeRequire('denethdev-ytmp3', null);
const sharp = safeRequire('sharp', null);

// ─── BAILEYS ──────────────────────────────────────────────────────────────────
const bf = {
    default: () => ({}), useMultiFileAuthState: async () => ({ state: { creds: {}, keys: {} }, saveCreds: () => {} }),
    delay: ms => new Promise(r => setTimeout(r, ms)), getContentType: () => 'conversation',
    makeCacheableSignalKeyStore: k => k, Browsers: { macOS: () => [] },
    jidNormalizedUser: j => j, downloadContentFromMessage: async () => (async function* () { yield Buffer.from([]); })(),
    fetchLatestBaileysVersion: async () => ({ version: [2, 3000, 1015901307] }),
    DisconnectReason: { loggedOut: 401 }, proto: {}, prepareWAMessageMedia: async () => ({}),
    generateWAMessageFromContent: () => ({}), S_WHATSAPP_NET: '@s.whatsapp.net',
    downloadMediaMessage: async () => Buffer.from([])
};
const B = safeRequire('@whiskeysockets/baileys', bf);
const makeWASocket = B.default || bf.default;
const useMultiFileAuthState = B.useMultiFileAuthState || bf.useMultiFileAuthState;
const delay = B.delay || bf.delay;
const getContentType = B.getContentType || bf.getContentType;
const makeCacheableSignalKeyStore = B.makeCacheableSignalKeyStore || bf.makeCacheableSignalKeyStore;
const Browsers = B.Browsers || bf.Browsers;
const jidNormalizedUser = B.jidNormalizedUser || bf.jidNormalizedUser;
const downloadContentFromMessage = B.downloadContentFromMessage || bf.downloadContentFromMessage;
const fetchLatestBaileysVersion = B.fetchLatestBaileysVersion || bf.fetchLatestBaileysVersion;
const DisconnectReason = B.DisconnectReason || bf.DisconnectReason;
const proto = B.proto || bf.proto;
const prepareWAMessageMedia = B.prepareWAMessageMedia || bf.prepareWAMessageMedia;
const generateWAMessageFromContent = B.generateWAMessageFromContent || bf.generateWAMessageFromContent;
const downloadMediaMessage = B.downloadMediaMessage || bf.downloadMediaMessage;

let sms; try { ({ sms } = require('./msg')); } catch { sms = (s, m) => m; }

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const BOT_IMAGES = [
    'https://files.catbox.moe/3hn4a7.jpg','https://files.catbox.moe/3hn4a7.jpg',
'https://files.catbox.moe/3hn4a7.jpg','https://files.catbox.moe/3hn4a7.jpg',
'https://files.catbox.moe/3hn4a7.jpg','https://files.catbox.moe/3hn4a7.jpg',
'https://files.catbox.moe/3hn4a7.jpg','https://files.catbox.moe/3hn4a7.jpg'
];
const AI_FULL_NAME = 'Whitekid Prime';
const AI_SHORT_NAME = 'Whitekid Prime';
// HARDCODED DEVELOPER — NEVER CHANGES REGARDLESS OF BOT PAIRING
const DEVELOPER_NUMBER = '263789846423';

const AI_SYSTEM_IDENTITY = `You are ${AI_SHORT_NAME}, whose full name is ${AI_FULL_NAME}. Created by WhiteKid Tech in 2026. Never claim to be any other AI.`;

const config = {
    PREFIX: '.', BOT_NAME: AI_SHORT_NAME, BOT_FULL_NAME: AI_FULL_NAME, VERSION: '6.0.0',
    OWNER_NUMBERS: [DEVELOPER_NUMBER, '263789846423'],
    OWNER_NAME: 'WhiteKid Tech',
    OWNER_TG: 'https://t.me/whitekid01', OWNER_WA: `https://wa.me/${DEVELOPER_NUMBER}`,
    BOT_IMAGES, NEWSLETTER_JID: '120363425165511768@newsletter',
    USER_CHANNEL_JID: '120363171743427809@newsletter',
    USER_CHANNEL_URL: 'https://whatsapp.com/channel/0029Vb86qKOA89Mi8iCgNe1R', NEWSLETTER_NAME: 'Whitekid Prime bot',
    RCD_IMAGE_PATH: 'https://files.catbox.moe/3hn4a7.jpg',
    WATERMARK: '\n',
    MAX_RETRIES: 3, OTP_EXPIRY: 300000,
    GROUP_INVITE_LINK: 'https://chat.whatsapp.com/BnGr96zHiz075lNTZzvRUN?s=cl&p=a&mlu=0',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN_HERE',
    TG_TOKEN: process.env.TG_TOKEN || '8903617100:AAH4QClS_QnUfOSwbn3WMHT8aqh78DxIJYY',
    PAXSENIX_API_KEY: 'sk-paxsenix-u2B9yx-k8ITOM7GJHji302l9JjuGrwLDyJW1g3DtzbNG3WUz',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    TMDB_API_KEY: process.env.TMDB_API_KEY || 'YOUR_TMDB_API_KEY',
    NEWS_API_KEY: 'dcd720a6f1914e2d9dba9790c188c08c',
    GIFTED_TECH_API: 'https://api.giftedtech.co.ke', GIFTED_API_KEY: 'free_key@maher_apis',
    SPORTS_API_BASE: 'https://apiskeith.top',
    PAXSENIX_URL: 'https://api.paxsenix.org',
    DAVID_API: 'https://apis.davidcyril.name.ng',
    NEXRAY_API: 'https://api.nexray.web.id',
    NEXRAY_EU: 'https://api.nexray.eu.cc',
    ELITE_API: 'https://eliteprotech-apis.zone.id',
    DELINE_API: 'https://api.deline.web.id',
    RYNEKOO_API: 'https://rynekoo-api.hf.space',
    QASIM_API: 'https://api.qasimdev.dpdns.org',
    NEOXR_API: 'https://api.neoxr.eu',
    PRINCE_API: 'https://api.princetechn.com/api', PRINCE_KEY: 'prince',
    PREXZY_API: 'https://apis.prexzyvilla.site',
    DISCARD_API: 'https://discardapi.dpdns.org',
    SILENT_API: 'https://darkvibe314-silent-movies-api.hf.space',
    OKATSU_API: 'https://okatsu-rolezapiiz.vercel.app',
    NAYAN_API: 'https://nayan-video-downloader.vercel.app',
    BOT_FOOTER: '✰Whitekid Prime',
    AUTO_RECORDING: 'true'
};
const WM = config.WATERMARK;
// ─── PAXSENIX ─────────────────────────────────────────────────────────────────
const PAXSENIX = {
    BASE: 'https://api.paxsenix.org', KEY: config.PAXSENIX_API_KEY,
    headers: { Authorization: `Bearer ${config.PAXSENIX_API_KEY}`, 'Content-Type': 'application/json' },
    async get(ep) { const r = await axios.get(`${this.BASE}${ep}`, { headers: this.headers, timeout: 60000 }); return r.data; },
    async post(ep, data) { const r = await axios.post(`${this.BASE}${ep}`, data, { headers: this.headers, timeout: 60000 }); return r.data; }
};

// ─── HOSTIFY (GROK) ───────────────────────────────────────────────────────────
const HOSTIFY = {
    BASE_URL: 'https://api.hostify.indevs.in/api',
    EP: { GROK: '/ai/grok', LYRICS: '/search/lyrics' },
    TIMEOUT: 30000, RETRIES: 2, RETRY_DELAY: 1000
};
async function hostifyPost(ep, body = {}) {
    for (let i = 0; i <= HOSTIFY.RETRIES; i++) {
        try { return (await axios.post(HOSTIFY.BASE_URL + ep, body, { headers: { 'Content-Type': 'application/json' }, timeout: HOSTIFY.TIMEOUT })).data; }
        catch (e) { if (i === HOSTIFY.RETRIES) throw e; await delay(HOSTIFY.RETRY_DELAY); }
    }
}

// ─── MULTI-API HUB ────────────────────────────────────────────────────────────
const APIS = {
    imageGen: p => [
        `${config.NEXRAY_EU}/ai/gptimage?param=${encodeURIComponent(p)}`,
        `${config.NEXRAY_API}/ai/gptimage?prompt=${encodeURIComponent(p)}`,
        `https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(p)}`,
        `https://stable.stacktoy.workers.dev/?apikey=Suhail&prompt=${encodeURIComponent(p)}`,
        `https://dalle.stacktoy.workers.dev/?apikey=Suhail&prompt=${encodeURIComponent(p)}`,
        `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1024&height=1024&nologo=true`,
        `https://api.dreaded.site/api/dalle?text=${encodeURIComponent(p)}`
    ],
    download: {
        nayanYtInfo: u => `${config.NAYAN_API}/youtube?url=${encodeURIComponent(u)}`,
        nayanYtDown: u => `${config.NAYAN_API}/ytdown?url=${encodeURIComponent(u)}`,
        nayanYtSearch: q => `${config.NAYAN_API}/ytsearch?query=${encodeURIComponent(q)}`,
        nayanIg: u => `${config.NAYAN_API}/instagram?url=${encodeURIComponent(u)}`,
        nayanAio: u => `${config.NAYAN_API}/alldown?url=${encodeURIComponent(u)}`,
        ytmp3Prince: u => `${config.PRINCE_API}/download/ytmp3?apikey=${config.PRINCE_KEY}&url=${encodeURIComponent(u)}`,
        ytmp4Prince: u => `${config.PRINCE_API}/download/ytmp4?apikey=${config.PRINCE_KEY}&url=${encodeURIComponent(u)}`,
        ytvPrince: u => `${config.PRINCE_API}/download/ytv?apikey=${config.PRINCE_KEY}&url=${encodeURIComponent(u)}`,
        ytaudioPrince: u => `${config.PRINCE_API}/download/ytaudio?apikey=${config.PRINCE_KEY}&format=128kbps&url=${encodeURIComponent(u)}`,
        ytDownload: (u, type = 'audio', fmt = 'mp3') => `${config.PREXZY_API}/download/ytdownload?url=${encodeURIComponent(u)}&type=${type}&format=${fmt}`,
        tiktokPrexzy: u => `${config.PREXZY_API}/download/tiktokvideo?url=${encodeURIComponent(u)}`,
        saveweb2zip: u => `${config.PREXZY_API}/download/saveweb2zip?url=${encodeURIComponent(u)}`,
        mediafirePrexzy: u => `${config.PREXZY_API}/download/mediafire?url=${encodeURIComponent(u)}`,
        aio: u => `${config.PREXZY_API}/download/aio?url=${encodeURIComponent(u)}`,
        ytmp3: u => `${config.NEXRAY_API}/downloader/ytmp3?url=${encodeURIComponent(u)}`,
        ytplayvid: u => `${config.NEXRAY_API}/downloader/ytplayvid?url=${encodeURIComponent(u)}`,
        ytmp3Elite: u => `${config.ELITE_API}/ytdown?format=mp3&url=${encodeURIComponent(u)}`,
        ytmp4Elite: u => `${config.ELITE_API}/ytmp4?url=${encodeURIComponent(u)}`,
        fbElite: u => `${config.ELITE_API}/facebook?url=${encodeURIComponent(u)}`,
        ytDavid: u => `${config.DAVID_API}/download/youtube?url=${encodeURIComponent(u)}`,
        mediafire: u => `${config.DAVID_API}/download/mediafire?url=${encodeURIComponent(u)}`,
        twitter: u => `${config.DAVID_API}/download/twitter?url=${encodeURIComponent(u)}`,
        gdrive: u => `${config.DAVID_API}/download/googledrive?url=${encodeURIComponent(u)}`,
        website: u => `${config.DAVID_API}/download/website?url=${encodeURIComponent(u)}`,
        spotify: u => `${config.DAVID_API}/download/spotify?url=${encodeURIComponent(u)}`,
        igstory: u => `${config.DELINE_API}/downloader/igstory?url=${encodeURIComponent(u)}`,
        threads: u => `${config.DELINE_API}/downloader/threads?url=${encodeURIComponent(u)}`,
        apk: q => `${config.ELITE_API}/fdriod?query=${encodeURIComponent(q)}`,
        apkPure: q => `${config.QASIM_API}/api/apkpure/search?q=${encodeURIComponent(q)}`
    },
    ai: {
        gptimageEu: p => `${config.NEXRAY_EU}/ai/gptimage?param=${encodeURIComponent(p)}`,
        text2imageEu: `${config.NEXRAY_EU}/ai/v1/text2image`,
        nanoBananaEu: `${config.NEXRAY_EU}/ai/nanobanana`,
        advanced: (t, mode = '') => `${config.PREXZY_API}/ai/advanced?text=${encodeURIComponent(t)}${mode ? '&mode=' + mode : ''}`,
        gpt4: q => `https://api.dreaded.site/api/chatgpt4?text=${encodeURIComponent(q)}`,
        gemini: q => `https://api.dreaded.site/api/gemini?text=${encodeURIComponent(q)}`,
        llama: q => `${config.NEXRAY_API}/ai/llamacoder?model=qwen3-coder&prompt=${encodeURIComponent(q)}`,
        deepseek: q => `https://api.dreaded.site/api/deepseek?text=${encodeURIComponent(q)}`,
        mathgpt: q => `${config.ELITE_API}/mathgpt?question=${encodeURIComponent(q)}`,
        sologo: p => `${config.NEXRAY_API}/ai/sologo?prompt=${encodeURIComponent(p)}`,
        stablesd: p => `${config.DAVID_API}/tools/stablediffusion?prompt=${encodeURIComponent(p)}`,
        txt2vid: p => `${config.OKATSU_API}/ai/txt2video?text=${encodeURIComponent(p)}`
    },
    search: {
        ytsPrince: q => `${config.PRINCE_API}/search/yts?apikey=${config.PRINCE_KEY}&query=${encodeURIComponent(q)}`,
        nayanYts: q => `${config.NAYAN_API}/ytsearch?query=${encodeURIComponent(q)}`,
        lyricsPrince: q => `${config.PRINCE_API}/search/lyricsv2?apikey=${config.PRINCE_KEY}&query=${encodeURIComponent(q)}`,
        wiki: q => `${config.NEXRAY_API}/search/wikipedia?query=${encodeURIComponent(q)}`,
        pinterest: q => `${config.DAVID_API}/search/pinterest?query=${encodeURIComponent(q)}`,
        github: q => `${config.NEXRAY_API}/search/github?query=${encodeURIComponent(q)}`,
        yts: q => `${config.ELITE_API}/ytsearch?query=${encodeURIComponent(q)}`,
        bingImage: q => `${config.NEXRAY_API}/search/bingimage?query=${encodeURIComponent(q)}`,
        googleImage: q => `${config.NEXRAY_API}/search/googleimage?query=${encodeURIComponent(q)}`,
        wallpaper: q => `${config.ELITE_API}/wallpaper?query=${encodeURIComponent(q)}`,
        lyrics: q => `${config.ELITE_API}/lyrics?title=${encodeURIComponent(q)}`,
        lyrics2: q => `${config.DAVID_API}/search/lyrics?query=${encodeURIComponent(q)}`
    },
    tools: {
        remini: u => `${config.DAVID_API}/tools/remini?imageUrl=${encodeURIComponent(u)}`,
        removebg: u => `https://api.siputzx.my.id/api/iloveimg/removebg?image=${encodeURIComponent(u)}`,
        qr: t => `https://api.siputzx.my.id/api/tools/qr?text=${encodeURIComponent(t)}`,
        ssweb: u => `https://api.siputzx.my.id/api/tools/ssweb?url=${encodeURIComponent(u)}&theme=light&device=desktop`,
        ocr: u => `${config.NEXRAY_API}/tools/ocr?imageUrl=${encodeURIComponent(u)}`,
        trackip: ip => `${config.NEXRAY_API}/tools/trackip?ip=${encodeURIComponent(ip)}`,
        blurface: u => `${config.NEXRAY_API}/tools/blurface?imageUrl=${encodeURIComponent(u)}`,
        obfuscate: c => `${config.DAVID_API}/tools/jsobfuscator?code=${encodeURIComponent(c)}`,
        calc: e => `${config.DAVID_API}/tools/calculator?expression=${encodeURIComponent(e)}`,
        nanobanana: (u, p) => `${config.DAVID_API}/tools/nanobanana?imageUrl=${encodeURIComponent(u)}&prompt=${encodeURIComponent(p)}`,
        nanoBananaEu: (u, p) => `${config.NEXRAY_EU}/ai/nanobanana?imageUrl=${encodeURIComponent(u)}&prompt=${encodeURIComponent(p)}`,
        imagescanner: u => `${config.DAVID_API}/tools/imagescanner?imageUrl=${encodeURIComponent(u)}`,
        vcc: t => `${config.NEXRAY_API}/tools/vcc?type=${t}`,
        ytt: u => `${config.NEXRAY_API}/tools/yt-transcribe?url=${encodeURIComponent(u)}`,
        webcopier: u => `${config.ELITE_API}/webcopier?url=${encodeURIComponent(u)}`,
        font: t => `${config.ELITE_API}/font?text=${encodeURIComponent(t)}`,
        fancy: t => `https://www.dark-yasiya-api.site/other/font?text=${encodeURIComponent(t)}`,
        gimage: q => `${config.DISCARD_API}/api/dl/gimage?apikey=guru&query=${encodeURIComponent(q)}`,
        spongebob: t => `${config.PREXZY_API}/imagecreator/spongebob?text=${encodeURIComponent(t)}`,
        memeText: (t, w = 800, h = 600) => `${config.PREXZY_API}/imagecreator/memeText?text=${encodeURIComponent(t)}&width=${w}&height=${h}`,
        textGif: (t, bg = '000000', color = 'ffffff') => `${config.PREXZY_API}/imagecreator/gif?text=${encodeURIComponent(t)}&background=${bg}&color=${color}`,
        textMp4: (t, bg = '000000', color = 'ffffff') => `${config.PREXZY_API}/imagecreator/mp4?text=${encodeURIComponent(t)}&background=${bg}&color=${color}`
    },
    fun: {
        joke: () => 'https://v2.jokeapi.dev/joke/Any?type=single',
        darkjoke: () => 'https://v2.jokeapi.dev/joke/Dark?type=single',
        fact: () => 'https://uselessfacts.jsph.pl/random.json?language=en',
        advice: () => 'https://api.adviceslip.com/advice',
        waifu: () => 'https://api.waifu.pics/sfw/waifu',
        meme: () => `${config.PAXSENIX_URL}/fun/memes`,
        cat: () => 'https://api.thecatapi.com/v1/images/search',
        dog: () => `${config.DAVID_API}/random/dogs`,
        dare: () => 'https://shizoapi.onrender.com/api/texts/dare?apikey=shizo',
        truth: () => 'https://shizoapi.onrender.com/api/texts/truth?apikey=shizo',
        roast: () => 'https://vinuxd.vercel.app/api/roast',
        pickup: () => 'https://vinuxd.vercel.app/api/pickup',
        lovequote: () => 'https://api.popcat.xyz/lovequote',
        rizz: () => 'https://api.siputzx.my.id/api/r/rizz',
        riddle: () => 'https://api.siputzx.my.id/api/r/riddle',
        eightball: q => `https://api.siputzx.my.id/api/r/8ball?question=${encodeURIComponent(q)}`,
        technews: () => `${config.DAVID_API}/random/technews`,
        livefunfact: () => `${config.NEXRAY_API}/fun/livefunfact`,
        gaming: () => 'https://raw.githubusercontent.com/GlobalTechInfo/Database/main/images/game.json'
    },
    stalk: {
        tg: u => `${config.DAVID_API}/stalk/telegram?username=${encodeURIComponent(u)}`,
        npm: p => `${config.DAVID_API}/stalk/npm?package=${encodeURIComponent(p)}`,
        wachannel: u => `${config.DAVID_API}/stalk/whatsappchannel?url=${encodeURIComponent(u)}`,
        tiktok: u => `${config.ELITE_API}/tiktokstalk?username=${encodeURIComponent(u)}`,
        youtube: u => `${config.DAVID_API}/stalk/youtube?channel=${encodeURIComponent(u)}`
    },
    crypto: c => `https://api.coingecko.com/api/v3/simple/price?ids=${c}&vs_currencies=usd`,
    countries: () => `${config.ELITE_API}/countries`
};

// ─── AUDIO ENDPOINTS (for song/play multi-fallback) ───────────────────────────
const audioEndpoints = [
    u => `${config.NAYAN_API}/ytdown?url=${encodeURIComponent(u)}`,
    u => `${config.PRINCE_API}/download/ytmp3?apikey=${config.PRINCE_KEY}&url=${encodeURIComponent(u)}`,
    u => `${config.PRINCE_API}/download/ytaudio?apikey=${config.PRINCE_KEY}&format=128kbps&url=${encodeURIComponent(u)}`,
    u => `${config.PREXZY_API}/download/ytdownload?url=${encodeURIComponent(u)}&type=audio&format=mp3`,
    u => `${config.NEXRAY_API}/downloader/ytmp3?url=${encodeURIComponent(u)}`,
    u => `${config.ELITE_API}/ytdown?format=mp3&url=${encodeURIComponent(u)}`,
    u => `${config.OKATSU_API}/downloader/ytmp3?url=${encodeURIComponent(u)}`,
    u => `${config.PREXZY_API}/download/aio?url=${encodeURIComponent(u)}`
];

// ─── AUDIO HELPERS ────────────────────────────────────────────────────────────
async function queryAudioEndpoints(videoUrl, timeout = 30000) {
    for (const epFn of audioEndpoints) {
        try {
            const { data } = await axios.get(epFn(videoUrl), { timeout });
            const dl = data?.mp3 || data?.audio || data?.download_url ||
                       data?.result?.download_url || data?.result?.audio ||
                       data?.url || data?.dl;
            if (dl && typeof dl === 'string' && dl.startsWith('http')) return { success: true, download_url: dl };
        } catch {}
    }
    return { success: false, download_url: null };
}

function isValidBuffer(buf) {
    return Buffer.isBuffer(buf) && buf.length > 16 * 1024;
}

async function ossBuffer(url) {
    try {
        const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 90000, maxContentLength: Infinity });
        return Buffer.from(data);
    } catch { return Buffer.alloc(0); }
}

async function formatAudio(buffer) {
    // If ffmpeg available, ensure proper mp3 encoding; otherwise return as-is
    if (!ffmpeg || !buffer || buffer.length === 0) return buffer;
    return new Promise((resolve) => {
        const tmpIn = path.join(os.tmpdir(), `aud_in_${Date.now()}.tmp`);
        const tmpOut = path.join(os.tmpdir(), `aud_out_${Date.now()}.mp3`);
        try {
            fs.writeFileSync(tmpIn, buffer);
            ffmpeg(tmpIn)
                .audioCodec('libmp3lame')
                .audioBitrate(128)
                .format('mp3')
                .save(tmpOut)
                .on('end', () => {
                    try {
                        const out = fs.readFileSync(tmpOut);
                        fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut);
                        resolve(out.length > 0 ? out : buffer);
                    } catch { resolve(buffer); }
                })
                .on('error', () => {
                    try { fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); } catch {}
                    resolve(buffer);
                });
        } catch { resolve(buffer); }
    });
}

// ─── GROK AI (Multi-backend) ──────────────────────────────────────────────────
const IDENTITY_TRIGGERS = ['who created you','who made you','who are you','your creator','who built you','what is your name','what are you','introduce yourself','tell me about yourself','what does Prime stand for','full name'];
async function askGrok(userMessage) {
    if (IDENTITY_TRIGGERS.some(t => userMessage.toLowerCase().includes(t)))
        return `🤖 I am *${AI_SHORT_NAME}* — *${AI_FULL_NAME}*.\n\nCreated by *WhiteKid Tech*, in 2026.\n📞 wa.me/${DEVELOPER_NUMBER}\n📱 t.me/whitekid01`;
    const tryApis = [
        // Primary: Paxsenix GPT-4o (has API key, most reliable)
        async () => { const d = await PAXSENIX.post('/ai/gpt-4o', { message: `[SYSTEM: ${AI_SYSTEM_IDENTITY}] ${userMessage}` }); return d?.result || d?.response || d?.message || d?.text || null; },
        // Paxsenix Gemini Flash
        async () => { const d = await PAXSENIX.post('/ai/gemini-2.0-flash', { message: userMessage }); return d?.result || d?.response || null; },
        // Paxsenix Claude Haiku
        async () => { const d = await PAXSENIX.post('/ai/claude-3-5-haiku', { message: userMessage }); return d?.result || d?.response || null; },
        // Hostify Grok fallback
        async () => { const d = await hostifyPost(HOSTIFY.EP.GROK, { message: `[SYSTEM: ${AI_SYSTEM_IDENTITY}] ${userMessage}` }); return d?.result || d?.response || d?.message || null; },
        // Free API fallbacks
        async () => { const { data } = await axios.get(`https://api.dreaded.site/api/gemini?text=${encodeURIComponent(userMessage)}`, { timeout: 20000 }); return data?.result || data?.response || null; },
        async () => { const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/deepseek?text=${encodeURIComponent(userMessage)}`, { timeout: 20000 }); return data?.result || null; },
        async () => { const { data } = await axios.get(`https://api.giftedtech.co.ke/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(userMessage)}`, { timeout: 15000 }); return data?.result || null; }
    ];
    for (const fn of tryApis) { try { const r = await fn(); if (r) return r; } catch {} }
    return null;
}

// ─── TOGGLES ──────────────────────────────────────────────────────────────────
const PM_PATH = './data/publicMode.json', AI_PATH = './data/aiToggle.json',
      VOICE_PATH = './data/voiceToggle.json', WELCOME_PATH = './data/welcome.json',
      ANTILINK_PATH = './data/antilink.json', PREFIX_PATH = './data/prefix.json',
      AUTOREAD_PATH = './data/autoread.json', AUTORECORD_PATH = './data/autorecord.json',
      AUTOSTATUS_PATH = './data/autoStatus.json', ADPATH = './data/antidelete.json',
      SETTINGS_OVERRIDE_PATH = './data/ownerSettings.json';
const GOODBYE_PATH = './data/goodbye.json';
const AUTOADD_PATH = './data/autoadd.json';

const isPublicMode = () => { try { return JSON.parse(fs.readFileSync(PM_PATH, 'utf8')).enabled !== false; } catch { return true; } };
const setPublicMode = v => { try { fs.writeFileSync(PM_PATH, JSON.stringify({ enabled: v }, null, 2)); } catch {} };
const isAiEnabled = () => { try { return JSON.parse(fs.readFileSync(AI_PATH, 'utf8')).enabled !== false; } catch { return true; } };
const setAiEnabled = v => { try { fs.mkdirSync('./data', { recursive: true }); fs.writeFileSync(AI_PATH, JSON.stringify({ enabled: v }, null, 2)); } catch (e) { console.error(e.message); } };
const isVoiceEnabled = () => { try { return JSON.parse(fs.readFileSync(VOICE_PATH, 'utf8')).enabled !== false; } catch { return true; } };
const setVoiceEnabled = v => { try { fs.mkdirSync('./data', { recursive: true }); fs.writeFileSync(VOICE_PATH, JSON.stringify({ enabled: v }, null, 2)); } catch (e) { console.error(e.message); } };
const getCustomPrefix = () => { try { return JSON.parse(fs.readFileSync(PREFIX_PATH, 'utf8')).prefix || config.PREFIX; } catch { return config.PREFIX; } };
const setCustomPrefix = p => { try { fs.writeFileSync(PREFIX_PATH, JSON.stringify({ prefix: p }, null, 2)); } catch {} };
const isAutoRead = () => { try { return JSON.parse(fs.readFileSync(AUTOREAD_PATH, 'utf8')).enabled !== false; } catch { return true; } };
const setAutoRead = v => { try { fs.mkdirSync('./data', { recursive: true }); fs.writeFileSync(AUTOREAD_PATH, JSON.stringify({ enabled: v }, null, 2)); } catch {} };
const isAutoRecord = () => { try { return JSON.parse(fs.readFileSync(AUTORECORD_PATH, 'utf8')).enabled !== false; } catch { return true; } };
const setAutoRecord = v => { try { fs.mkdirSync('./data', { recursive: true }); fs.writeFileSync(AUTORECORD_PATH, JSON.stringify({ enabled: v }, null, 2)); } catch {} };
const getAutoStatus = () => { try { return JSON.parse(fs.readFileSync(AUTOSTATUS_PATH, 'utf8')); } catch { return { enabled: false, reactOn: false }; } };
const setAutoStatus = v => { try { fs.mkdirSync('./data', { recursive: true }); fs.writeFileSync(AUTOSTATUS_PATH, JSON.stringify(v, null, 2)); } catch {} };
const loadAD = () => { try { return fs.existsSync(ADPATH) ? JSON.parse(fs.readFileSync(ADPATH)) : { enabled: false }; } catch { return { enabled: false }; } };
const saveAD = c => { try { fs.writeFileSync(ADPATH, JSON.stringify(c, null, 2)); } catch {} };

const getOwnerSettings = () => { try { return fs.existsSync(SETTINGS_OVERRIDE_PATH) ? JSON.parse(fs.readFileSync(SETTINGS_OVERRIDE_PATH, 'utf8')) : {}; } catch { return {}; } };
const saveOwnerSettings = s => { try { fs.mkdirSync('./data', { recursive: true }); fs.writeFileSync(SETTINGS_OVERRIDE_PATH, JSON.stringify(s, null, 2)); } catch {} };

async function isWelcomeOn(cid) { try { const d = JSON.parse(fs.readFileSync(WELCOME_PATH, 'utf8')); return d[cid]?.enabled || false; } catch { return false; } }
async function getWelcome(cid) { try { const d = JSON.parse(fs.readFileSync(WELCOME_PATH, 'utf8')); return d[cid]?.message || null; } catch { return null; } }
async function setWelcome(cid, en, msg = null) { let d = {}; try { d = JSON.parse(fs.readFileSync(WELCOME_PATH, 'utf8')); } catch {} d[cid] = { enabled: en, message: msg }; fs.writeFileSync(WELCOME_PATH, JSON.stringify(d, null, 2)); }
async function getAntilink(cid) { try { const d = JSON.parse(fs.readFileSync(ANTILINK_PATH, 'utf8')); return d[cid] || { enabled: false, action: 'delete' }; } catch { return { enabled: false, action: 'delete' }; } }
async function setAntilink(cid, en, action = 'delete') { let d = {}; try { d = JSON.parse(fs.readFileSync(ANTILINK_PATH, 'utf8')); } catch {} d[cid] = { enabled: en, action }; fs.writeFileSync(ANTILINK_PATH, JSON.stringify(d, null, 2)); }
async function isGoodbyeOn(cid) { try { const d = JSON.parse(fs.readFileSync(GOODBYE_PATH, 'utf8')); return d[cid]?.enabled || false; } catch { return false; } }
async function getGoodbye(cid) { try { const d = JSON.parse(fs.readFileSync(GOODBYE_PATH, 'utf8')); return d[cid]?.message || null; } catch { return null; } }
async function setGoodbye(cid, en, msg = null) { let d = {}; try { d = JSON.parse(fs.readFileSync(GOODBYE_PATH, 'utf8')); } catch {} d[cid] = { enabled: en, message: msg }; fs.writeFileSync(GOODBYE_PATH, JSON.stringify(d, null, 2)); }
async function isAutoAddOn(cid) { try { const d = JSON.parse(fs.readFileSync(AUTOADD_PATH, 'utf8')); return d[cid]?.enabled || false; } catch { return false; } }
async function setAutoAdd(cid, en) { let d = {}; try { d = JSON.parse(fs.readFileSync(AUTOADD_PATH, 'utf8')); } catch {} d[cid] = { enabled: en }; fs.writeFileSync(AUTOADD_PATH, JSON.stringify(d, null, 2)); }

// ─── SESSION SETTINGS ─────────────────────────────────────────────────────────
const SESS_DIR = './data/settings';
if (!fs.existsSync(SESS_DIR)) fs.mkdirSync(SESS_DIR, { recursive: true });
const loadSS = n => { try { const p = path.join(SESS_DIR, `${n}.json`); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {}; } catch { return {}; } };
const saveSS = (n, obj) => { try { const p = path.join(SESS_DIR, `${n}.json`); fs.writeFileSync(p, JSON.stringify({ ...loadSS(n), ...obj }, null, 2)); } catch {} };

// ─── MISC HELPERS ─────────────────────────────────────────────────────────────
const formatMessage = (t, c, f) => `${t}\n\n${c}\n\n— ${f}`;
const fmtMsg = formatMessage;
const getTS = () => { try { return moment().tz('Africa/Harare').format('YYYY-MM-DD HH:mm:ss'); } catch { return new Date().toISOString(); } };
const fmtBytes = (b, d = 2) => { if (!b) return '0 B'; const k = 1024, s = ['B', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(b) / Math.log(k)); return parseFloat((b / Math.pow(k, i)).toFixed(d < 0 ? 0 : d)) + ' ' + s[i]; };
const formatBytes = fmtBytes;
let _cachedCmdCount = null;
const totalcmds = async () => { if (_cachedCmdCount !== null) return _cachedCmdCount; try { const src = await fs.readFile(path.join(__dirname, 'pair.js'), 'utf-8'); const a = src.indexOf('switch (' + 'command) {'), b = src.indexOf('} // end ' + 'switch'); const sw = (a >= 0 && b > a) ? src.slice(a, b) : src; const names = new Set(); for (const m of sw.matchAll(/\bcase\s*['"]([^'"\n]+)['"]\s*:/g)) names.add(m[1]); _cachedCmdCount = names.size; return _cachedCmdCount; } catch { return 350; } };
// ─── ESPN SPORTS HELPER ────────────────────────────────────────────────────────
async function espnScoreboard(sport, league) {
    try {
        const { data } = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`, { timeout: 15000 });
        return (data?.events || []).map(ev => {
            const comp = ev.competitions?.[0];
            const home = comp?.competitors?.find(c => c.homeAway === 'home');
            const away = comp?.competitors?.find(c => c.homeAway === 'away');
            return { name: ev.name || ev.shortName || '?', home: home?.team?.displayName || '?', away: away?.team?.displayName || '?', homeScore: home?.score || '0', awayScore: away?.score || '0', status: ev.status?.type?.detail || ev.status?.type?.shortDetail || ev.status?.type?.name || 'Scheduled' };
        });
    } catch { return []; }
}
async function sportsdbSearch(endpoint, params) {
    try {
        const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
        const { data } = await axios.get(`https://www.thesportsdb.com/api/v1/json/3/${endpoint}.php?${qs}`, { timeout: 15000 });
        return data;
    } catch { return {}; }
}
const LEAGUE_IDS = { epl: '4328', 'premier league': '4328', laliga: '4335', bundesliga: '4331', 'serie a': '4332', 'ligue 1': '4334', champions: '4480', ucl: '4480' };

const getUptime = st => { const u = Date.now() - st, h = Math.floor(u / 3600000), m = Math.floor((u % 3600000) / 60000), s = Math.floor((u % 60000) / 1000); return `${h}h ${m}m ${s}s`; };
const generateBar = pct => { const t = 10, f = Math.floor((pct / 100) * t); return '█'.repeat(f) + '░'.repeat(t - f); };

// ─── LOCATION & TIME ──────────────────────────────────────────────────────────
let cachedLocation = null, lastLocationFetch = 0;
async function getUserLocation() {
    const now = Date.now();
    if (cachedLocation && (now - lastLocationFetch) < 3600000) return cachedLocation;
    try { const r = await axios.get('https://ipapi.co/json/', { timeout: 5000 }); cachedLocation = { city: r.data.city || 'Unknown', region: r.data.region || 'Unknown', country: r.data.country_name || 'Unknown', timezone: r.data.timezone || 'UTC', lat: r.data.latitude, lon: r.data.longitude }; lastLocationFetch = now; return cachedLocation; }
    catch { return { city: 'Unknown', region: 'Unknown', country: 'Unknown', timezone: 'UTC' }; }
}
function getCurrentDateTime() {
    const now = new Date(), opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
    return { formatted: now.toLocaleString('en-US', opts), timestamp: now.getTime(), day: now.toLocaleDateString('en-US', { weekday: 'long' }), date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
}

// ─── VOICE REPLY ─────────────────────────────────────────────────────────────
async function sendVoiceReply(text, socket, from, quotedMsg) {
    try {
        const clean = text.replace(/[*_~`>]/g, '').replace(/\n+/g, ' ').substring(0, 200);
        let audioBuffer = null;
        // Primary: StreamElements TTS (free, no key)
        try {
            const r = await axios.get(`https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(clean)}`, { responseType: 'arraybuffer', timeout: 20000 });
            if (r.data && r.data.byteLength > 500) audioBuffer = Buffer.from(r.data);
        } catch {}
        // Fallback: Google Translate TTS
        if (!audioBuffer) {
            try {
                const r2 = await axios.get(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(clean)}&tl=en&client=tw-ob`, { responseType: 'arraybuffer', timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
                if (r2.data && r2.data.byteLength > 500) audioBuffer = Buffer.from(r2.data);
            } catch {}
        }
        // Fallback 2: TikTok TTS
        if (!audioBuffer) {
            try {
                const r3 = await axios.post('https://tiktok-tts.weilbyte.dev/api/generate', { text: clean.substring(0, 150), voice: 'en_us_002' }, { responseType: 'arraybuffer', timeout: 15000 });
                if (r3.data && r3.data.byteLength > 500) audioBuffer = Buffer.from(r3.data);
            } catch {}
        }
        if (!audioBuffer) throw new Error('All TTS services unavailable');
        await socket.sendMessage(from, { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: quotedMsg });
        return true;
    } catch (e) { console.error('[VOICE REPLY]', e.message); return false; }
}
async function generateGreetingAudio(displayName, socket, from, quoted) {
    try {
        const txt = `Hey ${displayName}! Welcome! I am ${AI_SHORT_NAME}, powered by WhiteKid Tech. Type dot menu to see all my commands!`;
        let audioBuffer = null;
        try {
            const r = await axios.get(`https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(txt)}`, { responseType: 'arraybuffer', timeout: 20000 });
            if (r.data && r.data.byteLength > 500) audioBuffer = Buffer.from(r.data);
        } catch {}
        if (!audioBuffer) {
            try {
                const r2 = await axios.get(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(txt.substring(0, 200))}&tl=en&client=tw-ob`, { responseType: 'arraybuffer', timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
                if (r2.data && r2.data.byteLength > 500) audioBuffer = Buffer.from(r2.data);
            } catch {}
        }
        if (!audioBuffer) throw new Error('TTS unavailable');
        await socket.sendMessage(from, { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: false }, { quoted });
        return true;
    } catch (e) { console.error('[TTS GREETING]', e.message); return false; }
}

// ─── CATBOX UPLOAD ────────────────────────────────────────────────────────────
async function uploadAudioToCatbox(audioBuffer, ext) {
    const safeExt = ext.replace(/[^a-z0-9]/gi, '') || 'ogg';
    const tmpPath = path.join(os.tmpdir(), `audio_${Date.now()}.${safeExt}`);
    try { fs.writeFileSync(tmpPath, audioBuffer); const form = new FormData(); form.append('fileToUpload', fs.createReadStream(tmpPath), `audio.${safeExt}`); form.append('reqtype', 'fileupload'); const res = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders(), timeout: 60000, maxContentLength: Infinity, maxBodyLength: Infinity }); try { fs.unlinkSync(tmpPath); } catch {} const url = (res.data || '').trim(); if (!url.startsWith('http')) throw new Error('No URL'); return url; }
    catch (e) { try { fs.unlinkSync(tmpPath); } catch {} throw e; }
}
async function uploadToCatbox(buffer, mimeType) {
    const ext = mimeType.includes('jpeg') ? '.jpg' : mimeType.includes('png') ? '.png' : '.jpg';
    const tmp = path.join(os.tmpdir(), `upload_${Date.now()}${ext}`);
    fs.writeFileSync(tmp, buffer);
    const form = new FormData(); form.append('fileToUpload', fs.createReadStream(tmp), `image${ext}`); form.append('reqtype', 'fileupload');
    const res = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders(), timeout: 60000, maxContentLength: Infinity, maxBodyLength: Infinity });
    try { fs.unlinkSync(tmp); } catch {}
    const catboxUrl = (res.data || '').toString().trim();
    if (!catboxUrl || !catboxUrl.startsWith('http')) throw new Error('Catbox upload failed: ' + catboxUrl);
    return catboxUrl;
}

// ─── TRANSCRIBE ───────────────────────────────────────────────────────────────
async function transcribeAudio(audioBuffer, mimeType) {
    const extMap = { 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/m4a': 'm4a', 'audio/wav': 'wav', 'audio/aac': 'aac', 'audio/webm': 'webm', 'audio/3gp': '3gp', 'audio/opus': 'ogg' };
    const mime = (mimeType || '').toLowerCase().split(';')[0].trim(), ext = extMap[mime] || 'ogg';
    let audioUrl = null; try { audioUrl = await uploadAudioToCatbox(audioBuffer, ext); } catch (e) { console.error('[TRANSCRIBE] Upload failed:', e.message); }
    if (audioUrl) {
        for (const u of [`https://api.siputzx.my.id/api/ai/whisper?url=${encodeURIComponent(audioUrl)}`, `https://api.dreaded.site/api/speech-to-text?url=${encodeURIComponent(audioUrl)}`, `${config.NEXRAY_API}/tools/yt-transcribe?url=${encodeURIComponent(audioUrl)}`]) {
            try { const { data } = await axios.get(u, { timeout: 40000 }); const t = data?.result || data?.text || data?.transcript; if (t && typeof t === 'string' && t.trim()) return t.trim(); } catch {}
        }
    }
    return null;
}

// ─── IMAGE GENERATION (Multi-endpoint) ───────────────────────────────────────
const generateImage = async prompt => {
    for (const apiUrl of APIS.imageGen(prompt)) {
        try {
            if (apiUrl.includes('text2image')) {
                const { data } = await axios.post(apiUrl, { prompt }, { timeout: 60000 });
                const imgUrl = data?.result || data?.imageUrl || data?.url;
                if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
                    const { data: imgData } = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
                    const buf = Buffer.from(imgData); if (buf[0] === 0x89 || buf[0] === 0xFF) return buf;
                }
                continue;
            }
            const { data } = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 30000 });
            const buf = Buffer.from(data); if (buf[0] === 0x89 || buf[0] === 0xFF) return buf;
        } catch { continue; }
    }
    throw new Error('All image generation APIs failed');
};

// ─── YOUTUBE INFO ─────────────────────────────────────────────────────────────
async function ytGetInfo(url) {
    for (const fn of [
        async () => { const { data } = await axios.get(`${config.NAYAN_API}/youtube?url=${encodeURIComponent(url)}`, { timeout: 15000 }); if (data?.title) return data; throw new Error('no info'); },
        async () => { const { data } = await axios.get(`${config.PRINCE_API}/search/yts?apikey=${config.PRINCE_KEY}&query=${encodeURIComponent(url)}`, { timeout: 15000 }); if (data?.result?.length) return data.result[0]; throw new Error('no info'); },
        async () => { const sr = await yts(url); const v = sr.videos?.[0]; if (v) return v; throw new Error('no info'); },
        async () => { const { data } = await axios.get(`${config.NAYAN_API}/ytsearch?query=${encodeURIComponent(url)}`, { timeout: 10000 }); if (data?.results?.length) return data.results[0]; throw new Error('no info'); }
    ]) { try { return await fn(); } catch {} }
    return null;
}

async function ytDownloadMp4(url) {
    for (const fn of [
        async () => { const { data } = await axios.get(`${config.NAYAN_API}/ytdown?url=${encodeURIComponent(url)}`, { timeout: 30000 }); const dl = data?.mp4 || data?.video || data?.download_url; if (dl) return dl; throw new Error('no url'); },
        async () => { const { data } = await axios.get(`${config.PRINCE_API}/download/ytmp4?apikey=${config.PRINCE_KEY}&url=${encodeURIComponent(url)}`, { timeout: 30000 }); const dl = data?.result?.download_url || data?.download_url; if (dl) return dl; throw new Error('no url'); },
        async () => { const { data } = await axios.get(`${config.PRINCE_API}/download/ytv?apikey=${config.PRINCE_KEY}&url=${encodeURIComponent(url)}`, { timeout: 30000 }); const dl = data?.result?.download_url || data?.download_url; if (dl) return dl; throw new Error('no url'); },
        async () => { const { data } = await axios.get(`${config.NEXRAY_API}/downloader/ytplayvid?url=${encodeURIComponent(url)}`, { timeout: 30000 }); const dl = data?.result?.download_url || data?.url; if (dl) return dl; throw new Error('no url'); },
        async () => { const { data } = await axios.get(`${config.ELITE_API}/ytmp4?url=${encodeURIComponent(url)}`, { timeout: 30000 }); const dl = data?.result?.download_url || data?.download_url; if (dl) return dl; throw new Error('no url'); }
    ]) { try { const dl = await fn(); if (dl) return dl; } catch {} }
    return null;
}

// ─── LOCAL YOUTUBE ENGINE (no third-party API — last-resort fallback) ─────────
async function localYtAudio(url) {
    if (ytdlp) {
        const out = path.join(os.tmpdir(), `yta_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.mp3`);
        try {
            await ytdlp(url, { extractAudio: true, audioFormat: 'mp3', audioQuality: 5, output: out, noPlaylist: true, noWarnings: true });
            if (fs.existsSync(out)) { const b = fs.readFileSync(out); if (isValidBuffer(b)) return b; }
        } catch (e) { console.error('[LOCAL yt-dlp audio]', e.message); }
        finally { try { fs.unlinkSync(out); } catch {} }
    }
    if (ytdl) {
        try {
            const chunks = []; const st = ytdl(url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 });
            for await (const c of st) chunks.push(c);
            const b = Buffer.concat(chunks); if (isValidBuffer(b)) return b;
        } catch (e) { console.error('[LOCAL ytdl audio]', e.message); }
    }
    return Buffer.alloc(0);
}
async function localYtVideo(url) {
    if (ytdlp) {
        const out = path.join(os.tmpdir(), `ytv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.mp4`);
        try {
            await ytdlp(url, { format: 'best[ext=mp4][height<=480]/best[height<=480]/best', output: out, noPlaylist: true, noWarnings: true });
            if (fs.existsSync(out)) { const b = fs.readFileSync(out); if (isValidBuffer(b)) return b; }
        } catch (e) { console.error('[LOCAL yt-dlp video]', e.message); }
        finally { try { fs.unlinkSync(out); } catch {} }
    }
    if (ytdl) {
        try {
            const chunks = []; const st = ytdl(url, { quality: 18, highWaterMark: 1 << 25 });
            for await (const c of st) chunks.push(c);
            const b = Buffer.concat(chunks); if (isValidBuffer(b)) return b;
        } catch (e) { console.error('[LOCAL ytdl video]', e.message); }
    }
    return Buffer.alloc(0);
}

// ─── PAXSENIX VIDEO JOB (handles instant results AND task_url / jobId polling) ─
async function paxVideoJob(endpoint, prompt) {
    const pickUrl = d => d?.video_url || d?.url || d?.result?.video_url || d?.result?.url || d?.data?.video_url || d?.data?.url || (typeof d?.result === 'string' && /^https?:/.test(d.result) ? d.result : null) || (typeof d?.output === 'string' && /^https?:/.test(d.output) ? d.output : null) || null;
    let d; try { d = await PAXSENIX.post(endpoint, { prompt }); } catch (e) { console.error('[PAX VIDEO]', endpoint, e.message); return null; }
    let url = pickUrl(d); if (url) return url;
    let taskUrl = d?.task_url || d?.taskUrl || (d?.jobId ? `${PAXSENIX.BASE}/task/${d.jobId}` : null);
    if (!taskUrl) return null;
    if (!/^https?:/.test(taskUrl)) taskUrl = `${PAXSENIX.BASE}${taskUrl.startsWith('/') ? '' : '/'}${taskUrl}`;
    for (let i = 0; i < 40; i++) {
        await delay(4000);
        try {
            const r = await axios.get(taskUrl, { headers: PAXSENIX.headers, timeout: 30000 }); const td = r.data;
            url = pickUrl(td); if (url) return url;
            if (/fail|error/i.test(String(td?.status || ''))) return null;
        } catch {}
    }
    return null;
}

// ─── LYRICS ENGINE ────────────────────────────────────────────────────────────
async function getLyrics(query) {
    for (const fn of [
        async () => { const { data } = await axios.get(`${config.PRINCE_API}/search/lyricsv2?apikey=${config.PRINCE_KEY}&query=${encodeURIComponent(query)}`, { timeout: 15000 }); const l = data?.result?.lyrics || data?.lyrics; if (l) return l; throw new Error('no'); },
        async () => { const { data } = await axios.get(`${config.ELITE_API}/lyrics?title=${encodeURIComponent(query)}`, { timeout: 15000 }); const l = data?.result?.lyrics || data?.lyrics; if (l) return l; throw new Error('no'); },
        async () => { const { data } = await axios.get(`${config.DAVID_API}/search/lyrics?query=${encodeURIComponent(query)}`, { timeout: 15000 }); const l = data?.result?.lyrics || data?.lyrics; if (l) return l; throw new Error('no'); },
        async () => { const r = await fetch(`https://lyricsapi.fly.dev/api/lyrics?q=${encodeURIComponent(query)}`); const d = await r.json(); const l = d?.result?.lyrics; if (l) return l; throw new Error('no'); },
        // NEW: lrclib fallback (plain lyrics)
        async () => {
            const { data } = await axios.get(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`, { timeout: 15000 });
            const l = data?.[0]?.plainLyrics || data?.[0]?.syncedLyrics;
            if (l) return l; throw new Error('no');
        }
    ]) { try { const l = await fn(); if (l) return l; } catch {} }
    return null;
}

// ─── AIO DOWNLOADER ───────────────────────────────────────────────────────────
async function aioDownload(url) {
    for (const fn of [
        async () => { const { data } = await axios.get(`${config.NAYAN_API}/alldown?url=${encodeURIComponent(url)}`, { timeout: 30000 }); return data?.result || data; },
        async () => { const { data } = await axios.get(`${config.PREXZY_API}/download/aio?url=${encodeURIComponent(url)}`, { timeout: 30000 }); return data?.result || data; }
    ]) { try { const r = await fn(); if (r) return r; } catch {} }
    return null;
}

// ─── MEDIAFIRE ────────────────────────────────────────────────────────────────
async function mediafireDl(url) {
    for (const fn of [
        async () => { const { data } = await axios.get(`${config.PREXZY_API}/download/mediafire?url=${encodeURIComponent(url)}`, { timeout: 30000 }); if (data?.result?.link || data?.link) return { link: data?.result?.link || data?.link, name: data?.result?.name || 'file', size: data?.result?.size || 'Unknown' }; throw new Error('no'); },
        async () => { const { data } = await axios.get(`${config.DAVID_API}/download/mediafire?url=${encodeURIComponent(url)}`, { timeout: 30000 }); if (data?.result) return data.result; throw new Error('no'); },
        // NEW: Nexray EU mediafire
        async () => { const { data } = await axios.get(`${config.NEXRAY_EU}/downloader/mediafire?url=${encodeURIComponent(url)}`, { timeout: 30000 }); if (data?.result?.link || data?.link) return { link: data?.result?.link || data?.link, name: data?.result?.name || 'file', size: data?.result?.size || 'Unknown' }; throw new Error('no'); },
        async () => { const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }); const $ = cheerio.load(data); const link = $('#downloadButton').attr('href'); const name = $('.dl-btn-label').attr('title') || 'file'; const size = $('#downloadButton').text().replace(/Download|[()]|\s/g, '').trim(); if (link) return { name, size, link, ext: (name || '').split('.').pop() || 'bin' }; throw new Error('no'); }
    ]) { try { const r = await fn(); if (r) return r; } catch {} }
    return null;
}

// ─── PAXSENIX WRAPPERS ────────────────────────────────────────────────────────
const paxShazam = async u => { try { return await PAXSENIX.post('/tools/shazam', { url: u }); } catch { return null; } };
const paxMemes = async () => { try { return await PAXSENIX.get('/fun/memes'); } catch { return null; } };
const paxQuotes = async () => { try { return await PAXSENIX.get('/fun/quotes'); } catch { return null; } };
const paxVeo = async p => { try { return await PAXSENIX.post('/ai-video/veo-3.1', { prompt: p }); } catch { return null; } };
const paxTempMailCreate = async () => { try { return await PAXSENIX.get('/tempmail/create'); } catch { return null; } };
const paxTempMailInbox = async e => { try { return await PAXSENIX.get(`/tempmail/inbox?email=${encodeURIComponent(e)}`); } catch { return null; } };
const paxTempMailBody = async id => { try { return await PAXSENIX.get(`/tempmail/body?id=${id}`); } catch { return null; } };
const paxMovieSearch = async q => { try { return await PAXSENIX.get(`/moviebox/search?query=${encodeURIComponent(q)}`); } catch { return null; } };
const paxMovieSources = async id => { try { return await PAXSENIX.get(`/moviebox/sources?id=${id}`); } catch { return null; } };

// ─── STATE & GLOBALS ──────────────────────────────────────────────────────────
global.movieSubCache = global.movieSubCache || {};
global.tempMailCache = global.tempMailCache || {};
global.tempMailCachePax = global.tempMailCachePax || {};
global.apkSessionStore = global.apkSessionStore || new Map();
global.pairCodeStore = global.pairCodeStore || new Map();

const octokit = new Octokit({ auth: config.GITHUB_TOKEN });
const ghOwner = 'LGT09', ghRepo = 'Whitekid Prime-Mini', owner = ghOwner, repo = ghRepo;
const telegram = new TelegramBot(config.TG_TOKEN, { polling: true });

const activeSockets = new Map(), socketCreationTime = new Map(), qrMessages = new Map();
const userState = {}, messageStore = new Map();
const botStartTime = Date.now();
const presenceTracker = new Map();
const botImageCache = { current: null, lastRotation: 0, index: 0 };
const games = {};
let _schedulerStarted = false;

function getRandomBotImage() { const now = Date.now(); if (!botImageCache.current || (now - botImageCache.lastRotation) > 3600000) { botImageCache.index = (botImageCache.index + 1) % BOT_IMAGES.length; botImageCache.current = BOT_IMAGES[botImageCache.index]; botImageCache.lastRotation = now; } return botImageCache.current; }

const SESSION_BASE_PATH = './session', SESSIONS_DIR = './sessions', NUMBER_LIST_PATH = './numbers.json';
const BANS_PATH = './data/bans.json', SCHEDULES_PATH = './data/schedules.json';
const PAIRER_MAP_PATH = './data/pairerMap.json';
const loadPairerMap = () => { try { return fs.existsSync(PAIRER_MAP_PATH) ? JSON.parse(fs.readFileSync(PAIRER_MAP_PATH, 'utf8')) : {}; } catch { return {}; } };
const savePairerMap = (m) => { try { fs.mkdirSync('./data', { recursive: true }); fs.writeFileSync(PAIRER_MAP_PATH, JSON.stringify(m, null, 2)); } catch {} };
const TEMP_MEDIA_DIR = path.join(process.cwd(), 'temp');

for (const d of [SESSION_BASE_PATH, SESSIONS_DIR, './data', './data/settings', './tmp', './temp', TEMP_MEDIA_DIR])
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });

if (!fs.existsSync(BANS_PATH)) fs.writeFileSync(BANS_PATH, JSON.stringify([]));
for (const [p, v] of [[AI_PATH, { enabled: true }], [VOICE_PATH, { enabled: true }], [AUTOREAD_PATH, { enabled: true }], [AUTORECORD_PATH, { enabled: true }], [AUTOSTATUS_PATH, { enabled: false, reactOn: false }]])
    if (!fs.existsSync(p)) try { fs.writeFileSync(p, JSON.stringify(v, null, 2)); } catch {}

setInterval(() => { try { const files = fs.readdirSync(TEMP_MEDIA_DIR); let total = 0; for (const f of files) { try { total += fs.statSync(path.join(TEMP_MEDIA_DIR, f)).size; } catch {} } if (total > 200 * 1024 * 1024) { for (const f of files) { try { fs.unlinkSync(path.join(TEMP_MEDIA_DIR, f)); } catch {} } console.log('[TEMP] Cleaned.'); } } catch {} }, 60 * 1000);

process.on('uncaughtException', e => { console.error(chalk.red('🌺'), e); exec(`pm2 restart ${process.env.PM2_NAME || 'Whitekid Prime-Mini-main'}`); });
process.on('unhandledRejection', r => console.error(chalk.red('🌺'), r));

// ─── BANNED ───────────────────────────────────────────────────────────────────
function isBanned(userJid) { try { const b = JSON.parse(fs.readFileSync(BANS_PATH, 'utf8')); return b.includes(userJid.split('@')[0]); } catch { return false; } }

// ─── DEVELOPER OVERRIDE ───────────────────────────────────────────────────────
function isDeveloper(senderNumber) {
    const clean = (senderNumber || '').replace(/[^0-9]/g, '');
    const devClean = DEVELOPER_NUMBER.replace(/[^0-9]/g, '');
    return clean === devClean || clean.endsWith(devClean) || devClean.endsWith(clean);
}
function isPairedOwner(senderNumber, botNumber, ownerNumbers) {
    const sn = (senderNumber || '').replace(/[^0-9]/g, '');
    const bn = (botNumber || '').replace(/[^0-9]/g, '');
    return bn === sn || (ownerNumbers || []).map(n => n.replace(/[^0-9]/g, '')).includes(sn);
}

// ─── ANTIDELETE ───────────────────────────────────────────────────────────────
async function storeMsg(socket, message) {
    const cfg = loadAD(); if (!cfg.enabled || !message.key?.id) return;
    const mid = message.key.id; let content = '', mediaType = '', mediaPath = '';
    const sender = message.key.participant || message.key.remoteJid;
    try {
        const voContainer = message.message?.viewOnceMessageV2?.message || message.message?.viewOnceMessage?.message;
        if (voContainer) {
            let vType = null, vMsg = null;
            if (voContainer.imageMessage) { vType = 'image'; vMsg = voContainer.imageMessage; }
            else if (voContainer.videoMessage) { vType = 'video'; vMsg = voContainer.videoMessage; }
            if (vType && vMsg) {
                mediaType = vType; content = vMsg.caption || '';
                const stream = await downloadContentFromMessage(vMsg, vType); let buf = Buffer.from([]); for await (const c of stream) buf = Buffer.concat([buf, c]);
                mediaPath = path.join(TEMP_MEDIA_DIR, `${mid}.${vType === 'image' ? 'jpg' : 'mp4'}`); fs.writeFileSync(mediaPath, buf);
                const ownerJid = `${socket.user.id.split(':')[0]}@s.whatsapp.net`;
                const opts = { caption: `*Anti-ViewOnce ${vType}*\nFrom: @${sender.split('@')[0]}`, mentions: [sender] };
                try { if (vType === 'image') await socket.sendMessage(ownerJid, { image: { url: mediaPath }, ...opts }); else await socket.sendMessage(ownerJid, { video: { url: mediaPath }, ...opts }); } catch {}
                try { fs.unlinkSync(mediaPath); } catch {}
            }
        } else if (message.message?.conversation) content = message.message.conversation;
        else if (message.message?.extendedTextMessage?.text) content = message.message.extendedTextMessage.text;
        else if (message.message?.imageMessage) {
            mediaType = 'image'; content = message.message.imageMessage.caption || '';
            try { const s = await downloadContentFromMessage(message.message.imageMessage, 'image'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); mediaPath = path.join(TEMP_MEDIA_DIR, `${mid}.jpg`); fs.writeFileSync(mediaPath, b); } catch {}
        } else if (message.message?.videoMessage) {
            mediaType = 'video'; content = message.message.videoMessage.caption || '';
            try { const s = await downloadContentFromMessage(message.message.videoMessage, 'video'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); mediaPath = path.join(TEMP_MEDIA_DIR, `${mid}.mp4`); fs.writeFileSync(mediaPath, b); } catch {}
        } else if (message.message?.audioMessage) {
            mediaType = 'audio';
            try { const s = await downloadContentFromMessage(message.message.audioMessage, 'audio'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); mediaPath = path.join(TEMP_MEDIA_DIR, `${mid}.ogg`); fs.writeFileSync(mediaPath, b); } catch {}
        } else if (message.message?.stickerMessage) {
            mediaType = 'sticker';
            try { const s = await downloadContentFromMessage(message.message.stickerMessage, 'sticker'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); mediaPath = path.join(TEMP_MEDIA_DIR, `${mid}.webp`); fs.writeFileSync(mediaPath, b); } catch {}
        }
        messageStore.set(mid, { content, mediaType, mediaPath, sender, group: message.key.remoteJid?.endsWith('@g.us') ? message.key.remoteJid : null, timestamp: new Date().toISOString() });
    } catch (err) { console.error('storeMessage error:', err); }
}

async function handleMessageRevocation(sock, message) {
    try {
        const cfg = loadAD(); if (!cfg.enabled) return;
        const messageId = message.message?.protocolMessage?.key?.id; if (!messageId) return;
        const deletedBy = message.participant || message.key?.participant || message.key?.remoteJid;
        const ownerJid = `${sock.user.id.split(':')[0]}@s.whatsapp.net`;
        if (deletedBy?.includes(sock.user.id) || deletedBy === ownerJid) return;
        const original = messageStore.get(messageId); if (!original) return;
        const senderName = original.sender?.split('@')[0] || '?';
        let grpName = ''; try { if (original.group) { const gm = await sock.groupMetadata(original.group); grpName = gm.subject; } } catch {}
        const time = new Date().toLocaleString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
        let txt = `*🔰 ANTIDELETE REPORT 🔰*\n\n*🗑️ Deleted By:* @${deletedBy?.split('@')[0]}\n*👤 Sender:* @${senderName}\n*📱 Number:* ${original.sender}\n*🕒 Time:* ${time}${grpName ? `\n*👥 Group:* ${grpName}` : ''}`;
        if (original.content) txt += `\n\n*💬 Message:*\n${original.content}`;
        await sock.sendMessage(ownerJid, { text: txt, mentions: [deletedBy, original.sender].filter(Boolean) });
        if (original.mediaType && original.mediaPath && fs.existsSync(original.mediaPath)) {
            const opts = { caption: `*Deleted ${original.mediaType}*\nFrom: @${senderName}`, mentions: [original.sender] };
            try { switch (original.mediaType) { case 'image': await sock.sendMessage(ownerJid, { image: { url: original.mediaPath }, ...opts }); break; case 'video': await sock.sendMessage(ownerJid, { video: { url: original.mediaPath }, ...opts }); break; case 'audio': await sock.sendMessage(ownerJid, { audio: { url: original.mediaPath }, mimetype: 'audio/mpeg', ptt: false, ...opts }); break; case 'sticker': await sock.sendMessage(ownerJid, { sticker: { url: original.mediaPath }, ...opts }); break; } } catch {}
            try { fs.unlinkSync(original.mediaPath); } catch {}
        }
        messageStore.delete(messageId);
    } catch (err) { console.error('handleMessageRevocation error:', err); }
}

// ─── AUTO STATUS ──────────────────────────────────────────────────────────────
async function handleStatusUpdate(sock, update) {
    try {
        const cfg = getAutoStatus(); if (!cfg.enabled) return;
        const keys = [];
        if (update.messages?.length) for (const m of update.messages) { if (m.key?.remoteJid === 'status@broadcast') keys.push(m.key); }
        if (update.key?.remoteJid === 'status@broadcast') keys.push(update.key);
        for (const k of keys) { try { await delay(500); await sock.readMessages([k]); if (cfg.reactOn) { try { await sock.sendMessage('status@broadcast', { react: { text: '💚', key: k } }); } catch {} } } catch (e) { if (e.message?.includes('rate-overlimit')) await delay(2000); } }
    } catch (e) { console.error('[AUTO STATUS]', e.message); }
}


// ─── TELEGRAM IMAGE REPLIES — every message goes out with a banner ───────────
const TG_ASSETS = path.join(__dirname, 'assets');
const tgEsc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function tgReply(chatId, kind, html, extra = {}) {
    const local = path.join(TG_ASSETS, `${kind}.png`);
    const hasLocal = fs.existsSync(local);
    if (!hasLocal) console.warn(`[TG IMG] ${local} not found - using fallback image. Upload the assets folder next to pair.js.`);
    const photo = hasLocal ? local : config.RCD_IMAGE_PATH;
    const opts = { parse_mode: 'HTML', ...extra };
    try {
        try {
            if (html.length <= 1000) return await telegram.sendPhoto(chatId, photo, { ...opts, caption: html });
            await telegram.sendPhoto(chatId, photo);
        } catch (imgErr) {
            console.error('[TG IMG]', imgErr.message);
        }
        return await telegram.sendMessage(chatId, html, opts);
    } catch (e) {
        console.error('[TG REPLY]', e.message);
        try { return await telegram.sendMessage(chatId, html.replace(/<[^>]+>/g, '')); } catch {}
    }
}

// ─── TELEGRAM BOT ─────────────────────────────────────────────────────────────
// ─── TELEGRAM MENU ────────────────────────────────────────────────────────────
const TG_MENU = {
    pair:  { icon: '🔗', title: 'PAIRING', lines: ['<code>/pair 263789846423</code> — get your WhatsApp code', '<code>/deletepair 263789846423</code> — unlink a number', '<code>/link</code> — link with a QR code instead', '<code>/menu</code> — open this menu'] },
    games: { icon: '🎮', title: 'GAMES', lines: ['.trivia  .scramble  .mathquiz', '.emojiquiz  .flagquiz  .capitalquiz', '.hangman  .blackjack  .guess', '.rps  .slots  .dice  .roulette', '.tictactoe  .wyr  .nhie  .lottery', '', 'Answer quizzes with <code>.answer your answer</code>'] },
    fun:   { icon: '🎭', title: 'FUN', lines: ['.joke  .dadjoke  .pun  .riddle', '.quote  .fact  .motivate  .affirm', '.rate  .ship  .fortune  .horoscope', '.roast  .compliment  .rizz  .meme', '.dare  .truth  .topic  .iqtest'] },
    tools: { icon: '🧰', title: 'TEXT &amp; TOOLS', lines: ['.reverse  .mock  .clap  .bubble  .uwu', '.morse  .binary  .hex  .rot13  .leet', '.password  .uuid  .age  .bmi  .tip', '.calc  .translate  .qr  .shorturl', '.sticker  .toimg  .removebg  .remini'] },
    dl:    { icon: '⬇️', title: 'DOWNLOADS', lines: ['.play  .song  .video  .ytmp4', '.tiktok  .fb  .ig  .twitter  .spotify', '.apk  .mediafire  .gitclone  .lyrics'] },
    ai:    { icon: '🤖', title: 'AI &amp; LOGOS', lines: ['.ai  .gpt4  .gemini  .deepseek  .llama', '.imagine  .flux  .dalle  .vision', '.veo  .aivid  .txt2vid  .suno', '.logo &lt;style&gt; &lt;text&gt;  — see .logolist'] },
    group: { icon: '👥', title: 'GROUP', lines: ['.tagall  .kick  .add  .promote  .demote', '.mute  .unmute  .antilink  .welcome', '.grouplink  .setgname  .warn  .who'] }
};
const tgMenuKeyboard = () => ({ inline_keyboard: [
    [{ text: '🎮 Games', callback_data: 'tgm:games' }, { text: '🎭 Fun', callback_data: 'tgm:fun' }],
    [{ text: '🧰 Tools', callback_data: 'tgm:tools' }, { text: '⬇️ Downloads', callback_data: 'tgm:dl' }],
    [{ text: '🤖 AI & Logos', callback_data: 'tgm:ai' }, { text: '👥 Group', callback_data: 'tgm:group' }],
    [{ text: '🔗 Pairing', callback_data: 'tgm:pair' }, { text: '🏠 Home', callback_data: 'tgm:main' }]
] });
async function tgMenuText(key) {
    if (key && TG_MENU[key]) { const m = TG_MENU[key]; return `${m.icon} <b>${m.title}</b>\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n${m.lines.join('\n')}\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n<i>Use these on WhatsApp after you link — prefix is</i> <code>${tgEsc(config.PREFIX)}</code>`; }
    const n = await totalcmds().catch(() => 350);
    return `◤ <b>WHITEKID PRIME</b> ◥\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n◈ Version ⟶ <b>v${tgEsc(config.VERSION)}</b>\n◈ Commands ⟶ <b>${n}+</b>\n◈ Prefix ⟶ <code>${tgEsc(config.PREFIX)}</code>\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈\nPick a category below to see the commands.\nFull list on WhatsApp: <code>${tgEsc(config.PREFIX)}menu</code>\n\n⌁ ${tgEsc(config.OWNER_NAME)} · 🤟🏼 <i>Whitekid Dev</i>`;
}
telegram.onText(/^\/(menu|help|commands)\b/i, async msg => { tgReply(msg.chat.id, 'info', await tgMenuText('main'), { reply_markup: tgMenuKeyboard() }); });
telegram.on('callback_query', async cq => {
    try {
        const data = cq.data || ''; if (!data.startsWith('tgm:')) return;
        const key = data.slice(4);
        const html = await tgMenuText(key === 'main' ? null : key);
        await telegram.answerCallbackQuery(cq.id).catch(() => {});
        const opts = { chat_id: cq.message?.chat?.id, message_id: cq.message?.message_id, parse_mode: 'HTML', reply_markup: tgMenuKeyboard() };
        try { await telegram.editMessageCaption(html, opts); } catch { await telegram.editMessageText(html, opts).catch(() => {}); }
    } catch (e) { console.error('[TG MENU CB]', e.message); }
});
// Blue "Menu" button in Telegram = the bot command list
try { Promise.resolve(telegram.setMyCommands?.([{ command: 'start', description: 'Start & how to link' }, { command: 'pair', description: 'Get a WhatsApp pairing code' }, { command: 'deletepair', description: 'Unlink a number' }, { command: 'link', description: 'Link with a QR code' }, { command: 'menu', description: 'Open the command menu' }])).catch(() => {}); } catch {}

telegram.onText(/\/start/, msg => {
    const name = tgEsc(msg.from?.first_name || msg.from?.username || 'friend');
    tgReply(msg.chat.id, 'start',
        `◤ <b>WHITEKID PRIME</b> ◥\n` +
        `Welcome aboard, ${name}.\n\n` +
        `Link your WhatsApp to the bot with one short code. No QR scanning, no fuss.\n\n` +
        `<b>① Get your code</b>\n<code>/pair 263789846423</code>\n\n` +
        `<b>② Unlink any time</b>\n<code>/deletepair 263789846423</code>\n<i>only the person who linked a number can unlink it</i>\n\n` +
        `<b>③ Start using it</b>\nSend <code>.menu</code> on WhatsApp.\n\n` +
        `Built by ${tgEsc(config.OWNER_NAME)} · @whitekid01\n🤟🏼 <i>Whitekid Dev</i>`,
        { reply_markup: { inline_keyboard: [[{ text: '📋 Open Menu', callback_data: 'tgm:main' }], [{ text: '👑 Owner', url: config.OWNER_TG }, { text: '📢 Channel', url: config.USER_CHANNEL_URL }]] } });
});

telegram.onText(/\/pair (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const number = (match[1] || '').replace(/[^0-9]/g, '');
    if (!number || number.length < 10) {
        return tgReply(chatId, 'error',
            `✖ <b>That number does not look right</b>\n\nUse the full international format, digits only:\n<code>/pair 263789846423</code>`);
    }
    const sp = path.join(SESSIONS_DIR, number);
    if (fs.existsSync(sp)) { try { fs.removeSync(sp); } catch {} }
    // Store who paired this number (for delete authorization)
    const pm = loadPairerMap();
    pm[number] = String(chatId);
    savePairerMap(pm);
    await tgReply(chatId, 'pair',
        `⌁ <b>Asking WhatsApp for a code</b>\n\nNumber: <code>+${number}</code>\nGive it a few seconds…`);
    startTelegramSession(chatId, number, true);
});

telegram.onText(/\/deletepair (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const number = (match[1] || '').replace(/[^0-9]/g, '');
    if (!number || number.length < 10) {
        return tgReply(chatId, 'error',
            `✖ <b>That number does not look right</b>\n\nUse the full international format, digits only:\n<code>/deletepair 263789846423</code>`);
    }
    // Authorization: only the person who paired this number can delete it
    const pairerMap = loadPairerMap();
    const authorizedId = pairerMap[number];
    if (authorizedId && String(authorizedId) !== String(chatId)) {
        return tgReply(chatId, 'error',
            `🛑 <b>Not yours to remove</b>\n\n<code>+${number}</code> was linked from a different Telegram account, so only that account can unlink it.`);
    }
    if (activeSockets.has(number)) {
        const sock = activeSockets.get(number);
        try { sock.ev.removeAllListeners(); sock.ws?.close(); } catch {}
        activeSockets.delete(number); socketCreationTime.delete(number);
    }
    const sp = path.join(SESSIONS_DIR, number);
    if (fs.existsSync(sp)) { try { fs.removeSync(sp); } catch {} }
    await deleteSessionFromGitHub(number).catch(() => {});
    // Remove from pairer map
    delete pairerMap[number];
    savePairerMap(pairerMap);
    await tgReply(chatId, 'remove',
        `⌁ <b>Unlinked</b>\n\n<code>+${number}</code> is disconnected and the bot has been taken off that number.\nLink it again any time with <code>/pair ${number}</code>.`);
});

async function handleQRLink(chatId) {
    const sid = String(chatId); if (activeSockets.has(sid)) { const s = activeSockets.get(sid); try { s.ev.removeAllListeners(); s.ws.close(); s.end(); } catch {} activeSockets.delete(sid); }
    const prev = qrMessages.get(chatId); if (prev) { telegram.deleteMessage(chatId, prev).catch(() => {}); qrMessages.delete(chatId); }
    const sp = path.join(SESSIONS_DIR, sid); if (fs.existsSync(sp)) fs.removeSync(sp);
    await tgReply(chatId, 'pair', `⌁ <b>Building your QR</b>\n\nOne moment…`);
    startTelegramSession(chatId, sid, false);
}
telegram.onText(/^\/link\b/, msg => handleQRLink(msg.chat.id));

async function startTelegramSession(tgChatId, identifier, usePairing) {
    const sp = path.join(SESSIONS_DIR, identifier);
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sp);
        let version; try { version = (await fetchLatestBaileysVersion()).version; } catch { version = [2, 3000, 1015901307]; }
        const sock = makeWASocket({ version, logger: pino({ level: 'silent' }), printQRInTerminal: false, auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }).child({ level: 'fatal' })) }, browser: ['Ubuntu', 'Chrome', '20.0.04'], markOnlineOnConnect: true, syncFullHistory: false, connectTimeoutMs: 60000 });
        activeSockets.set(identifier, sock);
        if (usePairing && !sock.authState.creds.registered && tgChatId) {
            setTimeout(async () => {
                try { const code = await sock.requestPairingCode(identifier); const f = code?.match(/.{1,4}/g)?.join('-') || code; tgReply(tgChatId, 'pair', `🔑 <b>Your pairing code</b>\n\n<code>${tgEsc(f)}</code>\n\nOn WhatsApp: Settings → Linked devices → Link with phone number, then type this in.\n<i>Tap the code to copy it.</i>`); }
                catch { tgReply(tgChatId, 'error', `✖ <b>No code this time</b>\n\nWhatsApp did not hand one over. Try again:\n<code>/pair ${tgEsc(identifier)}</code>`); }
            }, 6000);
        }
        let qrCount = 0;
        sock.ev.on('connection.update', async update => {
            const { connection, lastDisconnect, qr } = update;
            if (qr && tgChatId && !usePairing) { qrCount++; if (qrCount > 5) { tgReply(tgChatId, 'error', `✖ <b>QR timed out</b>\n\nSend /link and I will build a fresh one.`); return; } try { const qrBuf = await QRCode.toBuffer(qr, { type: 'png', width: 512, margin: 2 }); const prev = qrMessages.get(tgChatId); if (prev) telegram.deleteMessage(tgChatId, prev).catch(() => {}); const sent = await telegram.sendPhoto(tgChatId, qrBuf, { caption: `⌁ <b>Scan to link</b>\nWhatsApp → Linked devices → Link a device\nAttempt ${qrCount} of 5`, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '✖ Cancel', callback_data: 'cancel' }]] } }); qrMessages.set(tgChatId, sent.message_id); } catch (e) { console.error('QR err:', e.message); } }
            if (connection === 'close') { const r = lastDisconnect?.error?.output?.statusCode; if (r !== DisconnectReason.loggedOut && r !== 401) startTelegramSession(tgChatId, identifier, false); else { if (tgChatId) tgReply(tgChatId, 'error', `✖ <b>WhatsApp logged this session out</b>\n\nLink again with /pair or /link.`); fs.removeSync(sp); activeSockets.delete(identifier); } }
            else if (connection === 'open') { socketCreationTime.set(identifier, Date.now()); if (tgChatId) { const prev = qrMessages.get(tgChatId); if (prev) { telegram.deleteMessage(tgChatId, prev).catch(() => {}); qrMessages.delete(tgChatId); } try { await joinNewsletter(sock, config.NEWSLETTER_JID); } catch {} tgReply(tgChatId, 'success', `✔ <b>You are connected</b>\n\nWhitekid Prime is live on your WhatsApp.\nSend <code>.menu</code> there to see what it can do.`); } attachMessageHandler(sock, identifier.replace(/[^0-9]/g, '') || identifier); }
        });
        sock.ev.on('creds.update', saveCreds);
    } catch (err) { console.error(`[TG SESSION ERROR] ${identifier}:`, err); }
}

// ─── GITHUB HELPERS ───────────────────────────────────────────────────────────
async function cleanDuplicateFiles(n) { try { const { data } = await octokit.repos.getContent({ owner: ghOwner, repo: ghRepo, path: 'session' }); const files = data.filter(f => f.name.startsWith(`empire_${n}_`) && f.name.endsWith('.json')).sort((a, b) => parseInt(b.name.match(/empire_\d+_(\d+)\.json/)?.[1] || 0) - parseInt(a.name.match(/empire_\d+_(\d+)\.json/)?.[1] || 0)); for (let i = 1; i < files.length; i++) await octokit.repos.deleteFile({ owner: ghOwner, repo: ghRepo, path: `session/${files[i].name}`, message: `Del dup ${n}`, sha: files[i].sha }); } catch (e) { console.error('cleanDup:', e.message); } }
async function restoreSession(n) { try { const { data } = await octokit.repos.getContent({ owner: ghOwner, repo: ghRepo, path: 'session' }); const f = data.find(f => f.name === `creds_${n}.json`); if (!f) return null; const { data: fd } = await octokit.repos.getContent({ owner: ghOwner, repo: ghRepo, path: `session/${f.name}` }); return JSON.parse(Buffer.from(fd.content, 'base64').toString('utf8')); } catch { return null; } }
async function loadUserConfig(n) { try { const { data } = await octokit.repos.getContent({ owner: ghOwner, repo: ghRepo, path: `session/config_${n}.json` }); return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')); } catch { return { ...config }; } }
async function updateUserConfig(n, cfg) { const p = `session/config_${n}.json`; let sha; try { const { data } = await octokit.repos.getContent({ owner: ghOwner, repo: ghRepo, path: p }); sha = data.sha; } catch {} await octokit.repos.createOrUpdateFileContents({ owner: ghOwner, repo: ghRepo, path: p, message: `Update config ${n}`, content: Buffer.from(JSON.stringify(cfg, null, 2)).toString('base64'), sha }); }
async function deleteSessionFromGitHub(n) { try { const { data } = await octokit.repos.getContent({ owner: ghOwner, repo: ghRepo, path: 'session' }); for (const f of data.filter(f => f.name.includes(n) && f.name.endsWith('.json'))) await octokit.repos.deleteFile({ owner: ghOwner, repo: ghRepo, path: `session/${f.name}`, message: `Del session ${n}`, sha: f.sha }); let nums = fs.existsSync(NUMBER_LIST_PATH) ? JSON.parse(fs.readFileSync(NUMBER_LIST_PATH, 'utf8')) : []; nums = nums.filter(x => x !== n); fs.writeFileSync(NUMBER_LIST_PATH, JSON.stringify(nums, null, 2)); await updateNumberListOnGitHub(n); } catch (e) { console.error('delSession:', e.message); } }
async function updateNumberListOnGitHub(newNum) { const p = 'session/numbers.json'; let nums = [], sha; try { const { data } = await octokit.repos.getContent({ owner: ghOwner, repo: ghRepo, path: p }); nums = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')); sha = data.sha; } catch {} if (!nums.includes(newNum)) nums.push(newNum); await octokit.repos.createOrUpdateFileContents({ owner: ghOwner, repo: ghRepo, path: p, message: 'Update numbers', sha, content: Buffer.from(JSON.stringify(nums, null, 2)).toString('base64') }); }

async function joinGroup(socket) {
    if (!config.GROUP_INVITE_LINK) return { status: 'skipped' };
    const cleanLink = config.GROUP_INVITE_LINK.split('?')[0];
    const m = cleanLink.match(/chat\.whatsapp\.com\/(?:invite\/)?([a-zA-Z0-9_-]+)/);
    if (!m) return { status: 'failed', error: 'Invalid invite link' };
    const code = m[1]; let retries = config.MAX_RETRIES;
    while (retries > 0) { try { const r = await socket.groupAcceptInvite(code); if (r?.gid) return { status: 'success', gid: r.gid }; throw new Error('No gid'); } catch (e) { retries--; if (retries === 0) return { status: 'failed', error: e.message }; await delay(2000 * (config.MAX_RETRIES - retries + 1)); } }
    return { status: 'failed', error: 'Max retries' };
}
async function joinNewsletter(socket, jidOrUrl) {
    try {
        const isUrl = typeof jidOrUrl === 'string' && jidOrUrl.startsWith('http');
        if (isUrl) {
            if (typeof socket.newsletterFollow === 'function') { await socket.newsletterFollow(jidOrUrl); console.log(`✅ Followed newsletter: ${jidOrUrl}`); return true; }
            if (typeof socket.newsletterJoin === 'function') { await socket.newsletterJoin(jidOrUrl); return true; }
        } else {
            if (typeof socket.newsletterJoin === 'function') { await socket.newsletterJoin(jidOrUrl); console.log(`✅ Joined newsletter: ${jidOrUrl}`); return true; }
            if (typeof socket.newsletterFollow === 'function') { await socket.newsletterFollow(jidOrUrl); return true; }
        }
        return false;
    } catch (e) { console.error(`[NEWSLETTER]`, e.message); return false; }
}

// ─── CAROUSEL & BUTTON HELPERS ────────────────────────────────────────────────
function extractButtonId(msg) { if (!msg) return null; if (msg.templateButtonReplyMessage?.selectedId) return msg.templateButtonReplyMessage.selectedId; if (msg.buttonsResponseMessage?.selectedButtonId) return msg.buttonsResponseMessage.selectedButtonId; if (msg.listResponseMessage?.singleSelectReply?.selectedRowId) return msg.listResponseMessage.singleSelectReply.selectedRowId; if (msg.interactiveResponseMessage) { const nf = msg.interactiveResponseMessage.nativeFlowResponseMessage; if (nf?.paramsJson) { try { const p = JSON.parse(nf.paramsJson); if (p.id) return p.id; } catch {} } return msg.interactiveResponseMessage.buttonId || null; } return null; }

async function sendCarousel(sock, from, title, items, fakeCard) {
    if (!items || !items.length) return false;
    try {
        const cards = [];
        for (const item of items.slice(0, 8)) {
            const media = item.image ? await prepareWAMessageMedia({ image: { url: item.image } }, { upload: sock.waUploadToServer }).catch(() => null) : null;
            const buttons = (item.buttons || []).map(btn => ({ name: btn.name || "quick_reply", buttonParamsJson: JSON.stringify({ display_text: btn.display, id: btn.id }) }));
            if (item.ctaUrl) buttons.push({ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: item.ctaUrl.label, url: item.ctaUrl.url }) });
            if (item.ctaCopy) buttons.push({ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: item.ctaCopy.label, copy_code: item.ctaCopy.code }) });
            cards.push({ body: proto.Message.InteractiveMessage.Body.create({ text: item.description || item.title }), header: proto.Message.InteractiveMessage.Header.create({ title: item.title, hasMediaAttachment: !!media, imageMessage: media?.imageMessage }), nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons }) });
        }
        const im = proto.Message.InteractiveMessage.create({ body: proto.Message.InteractiveMessage.Body.create({ text: title }), carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({ cards, messageVersion: 1 }) });
        const msg2 = generateWAMessageFromContent(from, { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, interactiveMessage: im } } }, { quoted: fakeCard });
        await sock.relayMessage(from, msg2.message, { messageId: msg2.key.id }); return true;
    } catch (e) { console.error('[sendCarousel]', e.message); return false; }
}

async function sendButtons(sock, from, { title, text, footer, image, buttons, fakeCard }) {
    try {
        const ib = (buttons || []).map(btn => ({ name: btn.name || "quick_reply", buttonParamsJson: JSON.stringify({ display_text: btn.text, id: btn.id }) }));
        const im = proto.Message.InteractiveMessage.create({ body: proto.Message.InteractiveMessage.Body.create({ text }), footer: footer ? proto.Message.InteractiveMessage.Footer.create({ text: footer }) : undefined, header: image ? proto.Message.InteractiveMessage.Header.create({ title, hasMediaAttachment: true, imageMessage: (await prepareWAMessageMedia({ image: { url: image.url } }, { upload: sock.waUploadToServer })).imageMessage }) : proto.Message.InteractiveMessage.Header.create({ title }), nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: ib }) });
        const msg2 = generateWAMessageFromContent(from, { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, interactiveMessage: im } } }, { userJid: sock.user.id });
        await sock.relayMessage(from, msg2.message, { messageId: msg2.key.id });
    } catch (e) { console.error('[sendButtons]', e.message); await sock.sendMessage(from, { text: text || title }); }
}

async function sendListMessage(sock, from, headerText, bodyText, footerText, sections, fakeCard) {
    try {
        const im = generateWAMessageFromContent(from, { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, interactiveMessage: proto.Message.InteractiveMessage.create({ body: proto.Message.InteractiveMessage.Body.create({ text: bodyText }), footer: proto.Message.InteractiveMessage.Footer.create({ text: footerText || '© WhiteKid Tech' }), header: proto.Message.InteractiveMessage.Header.create({ title: headerText, hasMediaAttachment: false }), nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "🔽 Select", sections }) }] }) }) } } }, { quoted: fakeCard });
        await sock.relayMessage(from, im.message, { messageId: im.key.id });
    } catch (e) { console.error('[sendListMessage]', e.message); }
}

// ─── SCHEDULER ────────────────────────────────────────────────────────────────
async function loadSchedules() { try { return fs.existsSync(SCHEDULES_PATH) ? JSON.parse(fs.readFileSync(SCHEDULES_PATH, 'utf8')) : []; } catch { return []; } }
async function saveSchedules(data) { fs.writeFileSync(SCHEDULES_PATH, JSON.stringify(data, null, 2)); }
function generateId() { return Math.random().toString(36).substring(2, 7).toUpperCase(); }
function parseTime(input) { const now = new Date(); const rm = input.match(/^(?:(\d+)h)?(?:(\d+)m)?$/i); if (rm && (rm[1] || rm[2])) { const h = parseInt(rm[1] || '0'), mn = parseInt(rm[2] || '0'); if (h === 0 && mn === 0) return null; return new Date(now.getTime() + (h * 60 + mn) * 60 * 1000); } const cm = input.match(/^(\d{1,2}):(\d{2})(am|pm)?$/i); if (cm) { let h = parseInt(cm[1]), mn2 = parseInt(cm[2]), mer = cm[3]?.toLowerCase(); if (mer === 'pm' && h < 12) h += 12; if (mer === 'am' && h === 12) h = 0; const t = new Date(now); t.setHours(h, mn2, 0, 0); if (t.getTime() <= now.getTime()) t.setDate(t.getDate() + 1); return t; } return null; }
function formatTimeLeft(ms) { if (ms <= 0) return 'now'; const ts = Math.floor(ms / 1000), h = Math.floor(ts / 3600), m = Math.floor((ts % 3600) / 60), s = ts % 60; const p = []; if (h) p.push(`${h}h`); if (m) p.push(`${m}m`); if (s || !p.length) p.push(`${s}s`); return p.join(' '); }
function startScheduler(sock) { if (_schedulerStarted) return; _schedulerStarted = true; setInterval(async () => { try { const now = Date.now(), sched = await loadSchedules(); const rem = []; let ch = false; for (const item of sched) { if (now >= item.sendAt) { try { await sock.sendMessage(item.chatId, { text: item.message }); console.log(`[SCHEDULE] ✅ Sent ID:${item.id}`); } catch (e) { console.error(`[SCHEDULE] Failed:`, e.message); } ch = true; } else rem.push(item); } if (ch) await saveSchedules(rem); } catch (e) { console.error('[SCHEDULE] Error:', e.message); } }, 10000); }

// ─── MOVIE HELPERS ────────────────────────────────────────────────────────────
async function searchMovies(query, sock, from, m, fakeCard, botImg) {
    try {
        try {
            const { data } = await axios.get(`${config.SILENT_API}/api/search`, { params: { query }, timeout: 20000 });
            if (data.results?.length) {
                const results = data.results.slice(0, 5); const cards = [];
                for (const movie of results) {
                    const title = (movie.title || "Unknown").slice(0, 50), isSeries = movie.subjectType === 2;
                    global.movieSubCache[movie.subjectId] = movie.subtitles || "None";
                    const subText = movie.subtitles ? movie.subtitles.split(',').slice(0, 3).join(', ') + '...' : 'None';
                    const desc = `⭐ ${movie.imdbRatingValue || 'N/A'} 🎭 ${movie.genre || 'N/A'}\n📅 ${movie.releaseDate?.split('-')[0] || '?'} 📌 ${isSeries ? 'Series' : 'Movie'}\n💬 Subs: ${subText}`;
                    const coverUrl = movie.cover?.url || botImg;
                    const media = await prepareWAMessageMedia({ image: { url: coverUrl } }, { upload: sock.waUploadToServer }).catch(() => null);
                    const ab = isSeries ? [
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📺 Download", id: `${config.PREFIX}dlmovie ${movie.subjectId} 1 1` }) },
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📝 Subtitles", id: `${config.PREFIX}smsubs ${movie.subjectId} 1 1` }) }
                    ] : [
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎬 Download", id: `${config.PREFIX}dlmovie ${movie.subjectId} null null` }) },
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📝 Subtitles", id: `${config.PREFIX}smsubs ${movie.subjectId} null null` }) }
                    ];
                    cards.push({ body: proto.Message.InteractiveMessage.Body.create({ text: desc }), header: proto.Message.InteractiveMessage.Header.create({ title: `🎬 ${title}`, hasMediaAttachment: !!media, imageMessage: media?.imageMessage }), nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: ab }) });
                }
                const im = proto.Message.InteractiveMessage.create({ body: proto.Message.InteractiveMessage.Body.create({ text: `🎥 *Results for:* ${query}\n\nSwipe ➡️` }), carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({ cards, messageVersion: 1 }) });
                const msg2 = generateWAMessageFromContent(from, { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, interactiveMessage: im } } }, { quoted: m });
                await sock.relayMessage(from, msg2.message, { messageId: msg2.key.id }); await sock.sendMessage(from, { react: { text: '✅', key: m.key } }); return null;
            }
        } catch {}
        const tmdb = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${config.TMDB_API_KEY}&query=${encodeURIComponent(query)}`, { timeout: 10000 }).then(r => r.data.results || []).catch(() => []);
        if (!tmdb.length) return "⚠️ No results found.";
        const cards2 = [];
        for (const item of tmdb.slice(0, 8)) {
            const isSeries = item.media_type === 'tv', title = isSeries ? item.name : item.title, desc = (item.overview || 'No description.').substring(0, 200);
            const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : botImg;
            const media = await prepareWAMessageMedia({ image: { url: poster } }, { upload: sock.waUploadToServer }).catch(() => null);
            const ab = isSeries ? [{ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📺 Download", id: `${config.PREFIX}dlmovie ${item.id} 1 1` }) }, { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📝 Subs", id: `${config.PREFIX}smsubs ${item.id} 1 1` }) }] : [{ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎬 Download", id: `${config.PREFIX}dlmovie ${item.id} null null` }) }, { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📝 Subs", id: `${config.PREFIX}smsubs ${item.id} null null` }) }];
            cards2.push({ body: proto.Message.InteractiveMessage.Body.create({ text: desc }), header: proto.Message.InteractiveMessage.Header.create({ title: `🎬 ${title}`, hasMediaAttachment: !!media, imageMessage: media?.imageMessage }), nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: ab }) });
        }
        const im2 = proto.Message.InteractiveMessage.create({ body: proto.Message.InteractiveMessage.Body.create({ text: `🎥 *Results for:* ${query}\n\nSwipe ➡️` }), carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({ cards: cards2, messageVersion: 1 }) });
        const msg3 = generateWAMessageFromContent(from, { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, interactiveMessage: im2 } } }, { quoted: m });
        await sock.relayMessage(from, msg3.message, { messageId: msg3.key.id }); await sock.sendMessage(from, { react: { text: '✅', key: m.key } }); return null;
    } catch (e) { console.error("[MOVIE SEARCH ERROR]", e.message); return `🩸 Search Error: ${e.message}`; }
}

async function showSubtitleOptions(movieId, season, episode, sock, from, m) {
    const cached = global.movieSubCache[movieId]; if (!cached || cached === 'None') return "🩸 No subtitles available.";
    const subList = cached.split(',').map(s => s.trim());
    const rows = subList.map(sub => ({ header: "", title: `📝 ${sub}`, description: `Download with ${sub}`, id: `${config.PREFIX}dlmovie ${movieId} ${season || 'null'} ${episode || 'null'} ${sub}` }));
    await sendListMessage(sock, from, "📝 Subtitles", "🗣️ *Select Subtitle Language*\n\nChoose from the list below:", "© WhiteKid Tech", [{ title: "Available Languages", rows }], m);
    return null;
}

async function downloadMovieFile(movieId, season, episode, lang, sock, from, m) {
    try {
        const params = { movie_id: movieId }; if (season && season !== 'null' && episode && episode !== 'null') { params.season = season; params.episode = episode; } if (lang) params.sub_lang = lang;
        const { data } = await axios.get(`${config.SILENT_API}/api/download`, { params, timeout: 60000 }); if (!data.download_url) throw new Error("No download URL");
        const sizeMB = data.size_bytes ? parseFloat((parseInt(data.size_bytes) / (1024 * 1024)).toFixed(2)) : 0;
        const fn = (season && season !== 'null') ? `Silent_S${season}E${episode}.mp4` : `Silent_Movie_${movieId}.mp4`;
        if (sizeMB > 100) {
            await sock.sendMessage(from, { text: `📦 File is ${sizeMB}MB. Uploading to GoFile...` }, { quoted: m });
            const wPath = path.join(os.tmpdir(), fn); const writer = fs.createWriteStream(wPath); const resp = await axios({ url: data.download_url, method: 'GET', responseType: 'stream' }); resp.data.pipe(writer); await new Promise((res, rej) => { writer.on('finish', res); writer.on('error', rej); });
            const { data: sd } = await axios.get('https://api.gofile.io/servers'); const srv = sd.data.servers[0].name;
            const fd2 = new FormData(); fd2.append('file', fs.createReadStream(wPath)); const { data: ud } = await axios.post(`https://${srv}.gofile.io/contents/uploadfile`, fd2, { headers: fd2.getHeaders(), maxBodyLength: Infinity, maxContentLength: Infinity });
            if (!ud || ud.status !== 'ok') throw new Error("GoFile upload failed");
            await sock.sendMessage(from, { text: `🎬 *${fn}*\n\n📦 *Size:* ${sizeMB}MB\n🔗 *GoFile:* ${ud.data.downloadPage}` }, { quoted: m }); try { fs.unlinkSync(wPath); } catch {}
        } else { await sock.sendMessage(from, { document: { url: data.download_url }, mimetype: 'video/mp4', fileName: fn, caption: `🎬 *Downloaded*\n📦 Size: ${sizeMB}MB${WM}` }, { quoted: m }); }
        if (data.subtitle_url) { try { const sn2 = (season && season !== 'null') ? `Subs_${lang || 'Default'}_S${season}E${episode}.srt` : `Subs_${lang || 'Default'}.srt`; const sr = await axios.get(data.subtitle_url, { responseType: 'arraybuffer' }); await sock.sendMessage(from, { document: Buffer.from(sr.data), mimetype: 'application/x-subrip', fileName: sn2, caption: `📝 *${lang || 'English'} Subtitles*` }, { quoted: m }); } catch {} }
        return null;
    } catch (e) { return `🩸 Download Error: ${e.message}`; }
}

// ─── TIC TAC TOE ─────────────────────────────────────────────────────────────
class TicTacToeGame { constructor(pX, pO) { this.playerX = pX; this.playerO = pO; this.board = Array(9).fill(null); this.currentTurn = pX; this.winner = null; this.turns = 0; } turn(player, pos) { if (this.winner || player !== this.currentTurn || this.board[pos] !== null) return false; this.board[pos] = player === this.playerX ? 'X' : 'O'; this.turns++; this.checkWinner(); if (!this.winner) this.currentTurn = this.currentTurn === this.playerX ? this.playerO : this.playerX; return true; } checkWinner() { const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]; for (const [a, b, c] of lines) { if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) { this.winner = this.board[a] === 'X' ? this.playerX : this.playerO; return; } } if (this.turns === 9) this.winner = 'draw'; } render() { return this.board.map(c => c || ' '); } }
async function handleTicTacToeMove(sock, chatId, senderId, text) { try { const room = Object.values(games).find(r => r.id.startsWith('tictactoe') && [r.game.playerX, r.game.playerO].includes(senderId) && r.state === 'PLAYING'); if (!room) return; const isSurrender = /^(surrender|give up)$/i.test(text); if (!isSurrender && !/^[1-9]$/.test(text)) return; if (senderId !== room.game.currentTurn && !isSurrender) { await sock.sendMessage(chatId, { text: '⚠️ Not your turn!' }); return; } const ok = isSurrender ? true : room.game.turn(senderId, parseInt(text, 10) - 1); if (!ok) { await sock.sendMessage(chatId, { text: '⚠️ Invalid move!' }); return; } let winner = room.game.winner; const isTie = room.game.turns === 9; const arr = room.game.render().map((v, i) => v === ' ' ? (i + 1).toString() : v).map(v => ({ 'X': '❎', 'O': '⭕', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣', '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣' }[v] || v)); if (isSurrender) { winner = senderId === room.game.playerX ? room.game.playerO : room.game.playerX; await sock.sendMessage(chatId, { text: `🏳️ @${senderId.split('@')[0]} surrendered! @${winner.split('@')[0]} wins!`, mentions: [senderId, winner] }); delete games[room.id]; return; } let gs; if (winner && winner !== 'draw') gs = `🎉 @${winner.split('@')[0]} wins!`; else if (isTie || winner === 'draw') gs = `🤝 Draw!`; else gs = `🎲 Turn: @${room.game.currentTurn.split('@')[0]}`; const str = `🎮 *TicTacToe*\n\n${gs}\n\n${arr.slice(0, 3).join('')}\n${arr.slice(3, 6).join('')}\n${arr.slice(6).join('')}\n\n▢ ❎: @${room.game.playerX.split('@')[0]}\n▢ ⭕: @${room.game.playerO.split('@')[0]}\n\n${!winner && !isTie ? 'Type 1-9 or *surrender*' : ''}`; await sock.sendMessage(chatId, { text: str, mentions: [room.game.playerX, room.game.playerO] }); if (winner || isTie) delete games[room.id]; } catch (e) { console.error('Tictactoe:', e); } }

// ─── ANTILINK / WELCOME / PROMOTION ──────────────────────────────────────────
async function handleLinkDetection(sock, chatId, message, userMessage, senderId, isGroupAdmin, isOwner) { try { const al = await getAntilink(chatId); if (!al.enabled || isOwner || isGroupAdmin) return; const lp = { wag: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i, wac: /wa\.me\/channel\/[A-Za-z0-9]{20,}/i, tg: /t\.me\/[A-Za-z0-9_]+/i, all: /https?:\/\/\S+|www\.\S+/i }; let shouldAct = false, linkType = ''; if (lp.wag.test(userMessage)) { shouldAct = true; linkType = 'WhatsApp Group'; } else if (lp.wac.test(userMessage)) { shouldAct = true; linkType = 'WhatsApp Channel'; } else if (lp.tg.test(userMessage)) { shouldAct = true; linkType = 'Telegram'; } else if (lp.all.test(userMessage)) { shouldAct = true; linkType = 'Link'; } if (!shouldAct) return; const action = al.action || 'delete'; if (action === 'delete' || action === 'kick') { try { await sock.sendMessage(chatId, { delete: { remoteJid: chatId, fromMe: false, id: message.key.id, participant: senderId } }); } catch {} } if (action === 'warn' || action === 'delete') { await sock.sendMessage(chatId, { text: `⚠️ *Antilink Warning*\n\n@${senderId.split('@')[0]}, posting ${linkType} links is not allowed!`, mentions: [senderId] }); } if (action === 'kick') { try { await sock.groupParticipantsUpdate(chatId, [senderId], 'remove'); await sock.sendMessage(chatId, { text: `🚫 @${senderId.split('@')[0]} removed for posting ${linkType} links.`, mentions: [senderId] }); } catch {} } } catch (e) { console.error('Antilink:', e); } }

async function handleWelcome(sock, chatId, participants, groupMetadata) { const welOn = await isWelcomeOn(chatId); if (!welOn) return; const customMsg = await getWelcome(chatId), groupName = groupMetadata.subject, groupDesc = groupMetadata.desc || 'No description'; for (const p of participants) { const ps = typeof p === 'string' ? p : p.id, user = ps.split('@')[0]; let displayName = user; try { const gp = groupMetadata.participants.find(x => x.id === ps); if (gp?.name) displayName = gp.name; } catch {} let finalMsg; if (customMsg) { finalMsg = customMsg.replace(/{user}/g, `@${displayName}`).replace(/{group}/g, groupName).replace(/{description}/g, groupDesc); } else { const now = new Date(), ts = now.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }); finalMsg = `🎊 *NEW MEMBER!* 🎊\n\nHey *@${displayName}*! 👋\nWelcome to *${groupName}*! 🔥${groupDesc ? '\n\n📌 ' + groupDesc : ''}\n\n👥 Member *#${groupMetadata.participants.length}*\n🕒 ${ts}\n\n✨ Enjoy your stay!\n*Whitekid Prime*`; } try { let pp = 'https://img.pyrocdn.com/dbKUgahg.png'; try { pp = await sock.profilePictureUrl(ps, 'image'); } catch {} await sock.sendMessage(chatId, { image: { url: pp }, caption: finalMsg, mentions: [ps] }); } catch { await sock.sendMessage(chatId, { text: finalMsg, mentions: [ps] }); } } }

async function handleGoodbye(sock, chatId, participants, groupMetadata) {
    const gbyOn = await isGoodbyeOn(chatId); if (!gbyOn) return;
    const customMsg = await getGoodbye(chatId), groupName = groupMetadata.subject;
    for (const p of participants) {
        const ps = typeof p === 'string' ? p : p.id, user = ps.split('@')[0];
        let finalMsg;
        if (customMsg) { finalMsg = customMsg.replace(/{user}/g, `@${user}`).replace(/{group}/g, groupName); }
        else {
            const ts = new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
            finalMsg = `💔 *Goodbye...* 😢\n\n*@${user}* has left *${groupName}*\n\nWe'll really miss you 🥺\nIt won't be the same without you...\n\n👥 Members remaining: ${groupMetadata.participants.length}\n🕒 ${ts}\n\n_Hope to see you again someday 💭_\n*Whitekid Prime*`;
        }
        try { let pp = 'https://img.pyrocdn.com/dbKUgahg.png'; try { pp = await sock.profilePictureUrl(ps, 'image'); } catch {} await sock.sendMessage(chatId, { image: { url: pp }, caption: finalMsg, mentions: [ps] }); } catch { await sock.sendMessage(chatId, { text: finalMsg, mentions: [ps] }); }
    }
}
async function handlePromotionEvent(sock, groupId, participants, author) { try { if (!Array.isArray(participants) || !participants.length) return; const names = participants.map(j => `@${(typeof j === 'string' ? j : (j.id || j.toString())).split('@')[0]} `); const mentionList = participants.map(j => typeof j === 'string' ? j : (j.id || j.toString())); let promotedBy = 'System'; if (author && author.length > 0) { const aj = typeof author === 'string' ? author : (author.id || author.toString()); promotedBy = `@${aj.split('@')[0]}`; mentionList.push(aj); } await sock.sendMessage(groupId, { text: `*『 GROUP PROMOTION 』*\n\n👥 *Promoted:*\n${names.map(n => `• ${n}`).join('\n')}\n\n👑 *By:* ${promotedBy}\n\n📅 *Date:* ${new Date().toLocaleString()}`, mentions: mentionList }); } catch (e) { console.error('Promotion:', e); } }

// ─── GROUP STATUS UPDATE ──────────────────────────────────────────────────────
async function groupStatusUpdate(sock, from, m, args, reply) {
    if (!from.endsWith('@g.us')) return reply("⚠️ Groups only.");
    const quotedMsg = m.message.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
    const isImage = quotedMsg.imageMessage, isVideo = quotedMsg.videoMessage, text = args.join(" ");
    if (!isImage && !isVideo && !text) return reply("⚠️ Reply to media or type text.");
    await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });
    try {
        let mp = {};
        if (isImage || isVideo) {
            let mb = Buffer.from([]);
            if (isImage) {
                const imgMsgDl = quotedMsg?.imageMessage;
                if (imgMsgDl) { const s = await downloadContentFromMessage(imgMsgDl, 'image'); for await (const c of s) mb = Buffer.concat([mb, c]); }
            } else {
                const vidMsgDl = quotedMsg?.videoMessage;
                if (vidMsgDl) { const s = await downloadContentFromMessage(vidMsgDl, 'video'); for await (const c of s) mb = Buffer.concat([mb, c]); }
            }
            if (!mb.length) { reply('⚠️ Could not download media. Make sure to reply to a media message.'); return; }
            let mo = {};
            if (isImage) mo = { image: mb, caption: text };
            else mo = { video: mb, caption: text };
            const pm = await prepareWAMessageMedia(mo, { upload: sock.waUploadToServer });
            let fm = {};
            if (isImage) fm = { imageMessage: pm.imageMessage };
            else fm = { videoMessage: pm.videoMessage };
            mp = { groupStatusMessageV2: { message: fm } };
        } else {
            const rh = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
            const bgColor = (0xFF000000 + parseInt(rh, 16)) >>> 0;
            mp = { groupStatusMessageV2: { message: { extendedTextMessage: { text, backgroundArgb: bgColor, font: 2, previewType: 0 } } } };
        }
        const msg2 = generateWAMessageFromContent(from, mp, { userJid: sock.user.id });
        await sock.relayMessage(from, msg2.message, { messageId: msg2.key.id });
        await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { console.error("[GC STATUS ERROR]", e); reply(`⚠️ GC Status error: ${e.message}`); }
}

// ─── ATTACH HANDLERS ─────────────────────────────────────────────────────────
function attachMessageHandler(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => { const msg = messages[0]; if (!msg?.key || msg.key.remoteJid === 'status@broadcast') return; try { if (isAutoRecord()) { try { await socket.sendPresenceUpdate('recording', msg.key.remoteJid); } catch {} } if (isAutoRead() && !msg.key.fromMe) { try { await socket.readMessages([msg.key]); } catch {} } } catch {} });
    socket.ev.on('messages.upsert', async ({ messages }) => { for (const m of messages) { try { await storeMsg(socket, m); } catch {} } });
    socket.ev.on('messages.upsert', async ({ messages }) => { for (const m of messages) { if (m.message?.protocolMessage?.type === 0) try { await handleMessageRevocation(socket, m); } catch {} } });
    socket.ev.on('messages.delete', async ({ keys }) => { const cfg = loadAD(); if (!cfg.enabled || !keys?.length) return; const k = keys[0]; const orig = messageStore.get(k.id); if (!orig) return; const ownerJid = socket.user?.id?.split(':')[0] + '@s.whatsapp.net'; try { await socket.sendMessage(ownerJid, { image: { url: config.RCD_IMAGE_PATH }, caption: `🗑️ *DELETED*\nFrom: ${orig.sender}\nTime: ${getTS()}${orig.content ? `\n\nMessage: ${orig.content}` : ''}${WM}` }); if (orig.mediaType && orig.mediaPath && fs.existsSync(orig.mediaPath)) { if (orig.mediaType === 'image') await socket.sendMessage(ownerJid, { image: { url: orig.mediaPath }, caption: 'Deleted media' + WM }); else if (orig.mediaType === 'video') await socket.sendMessage(ownerJid, { video: { url: orig.mediaPath }, caption: 'Deleted media' + WM }); try { fs.unlinkSync(orig.mediaPath); } catch {} } } catch {} messageStore.delete(k.id); });
    socket.ev.on('messages.upsert', async ({ messages }) => { for (const m of messages) { if (m.key?.remoteJid === 'status@broadcast') try { await handleStatusUpdate(socket, m); } catch {} } });
    socket.ev.on('group-participants.update', async (update) => { const { id, participants, action, author } = update; if (action === 'add') { try { const gm = await socket.groupMetadata(id); await handleWelcome(socket, id, participants, gm); } catch (e) { console.error('Welcome error:', e); } } else if (action === 'promote') { await handlePromotionEvent(socket, id, participants, author); } else if (action === 'remove' || action === 'leave') { try { const gm = await socket.groupMetadata(id); await handleGoodbye(socket, id, participants, gm); } catch (e) { console.error('Goodbye error:', e); } try { if (await isAutoAddOn(id)) { for (const jid of participants) { try { await socket.groupParticipantsUpdate(id, [jid], 'add'); } catch {} } } } catch {} } });
    socket.ev.on('presence.update', ({ id, presences }) => { for (const [jid, pr] of Object.entries(presences || {})) { if (['available','composing','recording'].includes(pr.lastKnownPresence)) presenceTracker.set(jid, Date.now()); } });
    setupCommandHandlers(socket, number);
    setupAutoRestart(socket, number);
}

// ─── MEDIA UPLOAD UTILITIES ──────────────────────────────────────────────────
const { fromBuffer } = safeRequire('file-type', { fromBuffer: async () => ({ ext: 'bin', mime: 'application/octet-stream' }) });

async function TelegraPh(filePath) {
    return new Promise(async (resolve, reject) => {
        if (!fs.existsSync(filePath)) return reject(new Error("File not Found"));
        try {
            const form = new FormData();
            form.append("file", fs.createReadStream(filePath));
            const data = await axios({ url: "https://telegra.ph/upload", method: "POST", headers: { ...form.getHeaders() }, data: form });
            return resolve("https://telegra.ph" + data.data[0].src);
        } catch (err) { return reject(new Error(String(err))); }
    });
}

async function UploadFileUgu(input) {
    return new Promise(async (resolve, reject) => {
        const form = new FormData();
        form.append("files[]", fs.createReadStream(input));
        await axios({ url: "https://uguu.se/upload.php", method: "POST", headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", ...form.getHeaders() }, data: form })
            .then(data => resolve(data.data.files[0]))
            .catch(err => reject(err));
    });
}

async function webp2mp4File(filePath) {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('new-image-url', '');
        form.append('new-image', fs.createReadStream(filePath));
        axios({ method: 'post', url: 'https://s6.ezgif.com/webp-to-mp4', data: form, headers: { 'Content-Type': `multipart/form-data; boundary=${form._boundary}` } })
            .then(({ data }) => {
                const form2 = new FormData();
                const $ = cheerio.load(data);
                const file = $('input[name="file"]').attr('value');
                form2.append('file', file); form2.append('convert', "Convert WebP to MP4!");
                axios({ method: 'post', url: 'https://ezgif.com/webp-to-mp4/' + file, data: form2, headers: { 'Content-Type': `multipart/form-data; boundary=${form2._boundary}` } })
                    .then(({ data: d2 }) => { const $2 = cheerio.load(d2); const result = 'https:' + $2('div#output > p.outfile > video > source').attr('src'); resolve({ status: true, result }); })
                    .catch(reject);
            }).catch(reject);
    });
}

async function uploadToTelegraph(buffer, mimeType) {
    try {
        const ext = mimeType.includes('jpeg') ? '.jpg' : mimeType.includes('png') ? '.png' : mimeType.includes('gif') ? '.gif' : '.jpg';
        const tmp = path.join(os.tmpdir(), `tph_${Date.now()}${ext}`);
        fs.writeFileSync(tmp, buffer);
        const url = await TelegraPh(tmp);
        try { fs.unlinkSync(tmp); } catch {}
        return url;
    } catch (e) { console.error('[TelegraPh upload]', e.message); return null; }
}

async function uploadSmartMedia(buffer, mimeType) {
    try { const url = await uploadToCatbox(buffer, mimeType); if (url) return url; } catch {}
    try { return await uploadToTelegraph(buffer, mimeType); } catch {}
    return null;
}

async function viewonceCommand(sock, chatId, message, fakeCard) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quoted?.imageMessage;
    const quotedVideo = quoted?.videoMessage;
    const voMsg2 = message.message?.viewOnceMessageV2?.message;
    const voMsg = message.message?.viewOnceMessage?.message;
    const imgMsg = quotedImage?.viewOnce ? quotedImage : (voMsg2?.imageMessage || voMsg?.imageMessage);
    const vidMsg = quotedVideo?.viewOnce ? quotedVideo : (voMsg2?.videoMessage || voMsg?.videoMessage);
    if (imgMsg) {
        const stream = await downloadContentFromMessage(imgMsg, 'image');
        let buffer = Buffer.from([]); for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await sock.sendMessage(chatId, { image: buffer, caption: imgMsg.caption || '✨ Revealed image' }, { quoted: fakeCard });
    } else if (vidMsg) {
        const stream = await downloadContentFromMessage(vidMsg, 'video');
        let buffer = Buffer.from([]); for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await sock.sendMessage(chatId, { video: buffer, caption: vidMsg.caption || '✨ Revealed video' }, { quoted: fakeCard });
    } else {
        await sock.sendMessage(chatId, { text: '⚠️ Please reply to a view-once image or video.' }, { quoted: message });
    }
}


// ─── LOCAL UNICODE FONT GENERATOR ────────────────────────────────────────────
function generateLocalFonts(text) {
    const maps = [
        ['𝗕𝗼𝗹𝗱', 0x1D400, 0x1D41A, 0x1D7CE],
        ['𝘐𝘵𝘢𝘭𝘪𝘤', 0x1D434, 0x1D44E, null],
        ['𝙱𝚘𝚕𝚍 𝙸𝚝𝚊𝚕𝚒𝚌', 0x1D468, 0x1D482, null],
        ['𝒮𝒸𝓇𝒾𝓅𝓉', 0x1D49C, 0x1D4B6, null],
        ['𝔉𝔯𝔞𝔨𝔱𝔲𝔯', 0x1D504, 0x1D51E, null],
        ['𝔻𝕠𝕦𝕓𝕝𝕖 𝕊𝕥𝕣𝕦𝕔𝕜', 0x1D538, 0x1D552, 0x1D7D8],
        ['𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎', 0x1D670, 0x1D68A, 0x1D7F6],
        ['𝖲𝖺𝗇𝗌', 0x1D5A0, 0x1D5BA, 0x1D7E2],
        ['𝗦𝗮𝗻𝘀 𝗕𝗼𝗹𝗱', 0x1D5D4, 0x1D5EE, 0x1D7EC],
        ['𝘚𝘢𝘯𝘴 𝘐𝘵𝘢𝘭𝘪𝘤', 0x1D608, 0x1D622, null],
    ];
    const scriptExc = { B:'ℬ', E:'ℰ', F:'ℱ', H:'ℋ', I:'ℐ', L:'ℒ', M:'ℳ', R:'ℛ', e:'ℯ', g:'ℊ', o:'ℴ' };
    const frakExc = { C:'ℭ', H:'ℌ', I:'ℑ', R:'ℜ', Z:'ℨ' };
    const dblExc = { C:'ℂ', H:'ℍ', N:'ℕ', P:'ℙ', Q:'ℚ', R:'ℝ', Z:'ℤ' };
    const excMaps = [null, null, null, scriptExc, frakExc, dblExc, null, null, null, null];
    const smallCaps = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'Q',r:'ʀ',s:'ꜱ',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'};
    const flipMap = {a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z'};
    const results = [];
    maps.forEach(([name, upper, lower, digits], idx) => {
        const exc = excMaps[idx] || {};
        let out = '';
        for (const c of text) {
            if (exc[c]) out += exc[c];
            else if (c >= 'A' && c <= 'Z' && upper) out += String.fromCodePoint(upper + (c.charCodeAt(0) - 65));
            else if (c >= 'a' && c <= 'z' && lower) out += String.fromCodePoint(lower + (c.charCodeAt(0) - 97));
            else if (c >= '0' && c <= '9' && digits) out += String.fromCodePoint(digits + (c.charCodeAt(0) - 48));
            else out += c;
        }
        results.push({ name, result: out });
    });
    const sc = [...text].map(c => smallCaps[c.toLowerCase()] || c).join('');
    const fl = [...text.toLowerCase()].map(c => flipMap[c] || c).reverse().join('');
    results.push({ name: 'Sᴍᴀʟʟ Cᴀᴘs', result: sc });
    results.push({ name: 'ᴜpsᴉpǝ poʍu', result: fl });
    return results;
}
// ─────────────────────────────────────────────────────────────────────────────
// ─── SMALL CAPS CONVERTER (bot reply font) ──────────────────────────────────
function toSmallCaps(text) {
    return text; // normal font — small caps disabled
}

// ─── WHATSAPP REPLY STYLER (every reply except the menu) ─────────────────────
function styleWA(raw, tone) {
    let text = String(raw || '').trim();
    if (!text) return text;
    const t = tone || (/^(\s*)(⚠️|❌|🚫|❗|🔐|⛔)/.test(text) ? 'err' : /^(\s*)(✅|🎉|👁️|🔓)/.test(text) ? 'ok' : 'info');
    const icon = { err: '✖', ok: '✔', info: '✦' }[t];
    const lines = text.split('\n');
    // first short line becomes the title
    let title = 'WHITEKID PRIME', bodyLines = lines;
    const first = lines[0].replace(/^[^\p{L}\p{N}]+/u, '').replace(/[|:]+\s*$/, '').trim();
    if (lines.length > 1 && first && first.length <= 34) { title = first.toUpperCase(); bodyLines = lines.slice(1); }
    else if (lines.length === 1 && first.length <= 34) { title = { err: 'HOLD ON', ok: 'DONE', info: 'WHITEKID PRIME' }[t]; bodyLines = [lines[0].replace(/^[^\p{L}\p{N}`.]+/u, '')]; }
    const isLong = text.length > 900;
    const body = bodyLines.map(l => {
        if (!l.trim()) return '';
        if (isLong) return l;
        let o = l.replace(/^\s*[•\-\*▪●]\s+/, '◈ ');
        const m = o.match(/^(\s*[^\p{L}\p{N}\s]{0,3}\s*)([A-Za-z][A-Za-z ]{1,18}):\s+(.+)$/u);
        if (m && !/^https?$/i.test(m[2])) o = `${m[1]}${m[2].trim()} ⟶ ${m[3]}`;
        return o;
    }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    const rule = '┈┈┈┈┈┈┈┈┈┈┈┈┈┈';
    return `⟦ ${icon} ${title} ⟧\n${rule}\n${body}\n${rule}\n⌁ whitekid prime`;
}
// <<WK_PACK_START>>
// ═══════════════════════════════════════════════════════════════════════════
// WHITEKID PRIME v6 — GAMES & FUN PACK (fully offline — no external API needed)
// ═══════════════════════════════════════════════════════════════════════════
const WK = {
    quiz: new Map(), guess: new Map(), bj: new Map(), hm: new Map(),
    pick: a => a[Math.floor(Math.random() * a.length)],
    int: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
    hash: s => { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; },
    norm: s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim(),
    shuffle: a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; },
    bar: p => '█'.repeat(Math.round(p / 10)) + '░'.repeat(10 - Math.round(p / 10)),
    today: () => new Date().toISOString().slice(0, 10)
};

const WK_TRIVIA = [
    ['What is the capital of Zimbabwe?', ['Bulawayo', 'Harare', 'Mutare', 'Gweru'], 1],
    ['Which is the largest planet in our solar system?', ['Saturn', 'Earth', 'Jupiter', 'Neptune'], 2],
    ['How many continents are there?', ['5', '6', '7', '8'], 2],
    ['What is the chemical symbol for gold?', ['Ag', 'Au', 'Gd', 'Go'], 1],
    ['Who painted the Mona Lisa?', ['Picasso', 'Van Gogh', 'Leonardo da Vinci', 'Michelangelo'], 2],
    ['Which is the largest ocean?', ['Atlantic', 'Indian', 'Arctic', 'Pacific'], 3],
    ['What is the fastest land animal?', ['Lion', 'Cheetah', 'Horse', 'Leopard'], 1],
    ['Victoria Falls lies on which river?', ['Limpopo', 'Nile', 'Zambezi', 'Congo'], 2],
    ['What is the hardest natural substance?', ['Gold', 'Iron', 'Quartz', 'Diamond'], 3],
    ['How many players does one football (soccer) team have on the pitch?', ['9', '10', '11', '12'], 2],
    ['Which planet is known as the Red Planet?', ['Mars', 'Venus', 'Mercury', 'Jupiter'], 0],
    ['What is the number 2 in binary?', ['01', '10', '11', '100'], 1],
    ['Who wrote Romeo and Juliet?', ['Charles Dickens', 'William Shakespeare', 'Mark Twain', 'Jane Austen'], 1],
    ['What is the capital of Japan?', ['Osaka', 'Kyoto', 'Tokyo', 'Seoul'], 2],
    ['What is H2O commonly known as?', ['Salt', 'Water', 'Oxygen', 'Hydrogen'], 1],
    ['What is the smallest prime number?', ['0', '1', '2', '3'], 2],
    ['In which year did Zimbabwe gain independence?', ['1960', '1975', '1980', '1990'], 2],
    ['Which mountain is the highest above sea level?', ['K2', 'Kilimanjaro', 'Mount Everest', 'Mont Blanc'], 2],
    ['Which language is built into every web browser?', ['Python', 'Java', 'C++', 'JavaScript'], 3],
    ['Which company created the Android operating system?', ['Google', 'Apple', 'Microsoft', 'Nokia'], 0],
    ['What is the currency of Japan?', ['Won', 'Yuan', 'Yen', 'Ringgit'], 2],
    ['How many strings does a standard guitar have?', ['4', '5', '6', '8'], 2],
    ['Which is the largest country by area?', ['Canada', 'China', 'USA', 'Russia'], 3],
    ['Which gas do plants absorb from the air?', ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'], 1],
    ['WhatsApp is owned by which company?', ['Google', 'Meta', 'Amazon', 'Telegram'], 1]
];
const WK_WORDS = ['zimbabwe', 'whatsapp', 'elephant', 'computer', 'keyboard', 'javascript', 'football', 'telegram', 'mountain', 'chocolate', 'internet', 'android', 'database', 'universe', 'birthday', 'champion', 'lightning', 'butterfly', 'pyramid', 'dolphin', 'diamond', 'treasure', 'umbrella', 'dinosaur', 'galaxy', 'rainbow', 'notebook', 'bicycle', 'sunshine', 'adventure'];
const WK_HANG = ['harare', 'baobab', 'giraffe', 'hospital', 'language', 'internet', 'program', 'network', 'battery', 'monkey', 'guitar', 'cricket', 'penguin', 'volcano', 'library', 'pancake', 'tornado', 'whistle', 'blanket', 'rooster', 'sandwich', 'compass', 'lantern', 'popcorn', 'machine'];
const WK_FLAGS = [['🇿🇼', ['zimbabwe']], ['🇿🇦', ['south africa']], ['🇳🇬', ['nigeria']], ['🇰🇪', ['kenya']], ['🇬🇭', ['ghana']], ['🇪🇬', ['egypt']], ['🇧🇷', ['brazil']], ['🇫🇷', ['france']], ['🇩🇪', ['germany']], ['🇯🇵', ['japan']], ['🇮🇳', ['india']], ['🇨🇳', ['china']], ['🇺🇸', ['usa', 'united states', 'america', 'us']], ['🇬🇧', ['uk', 'united kingdom', 'britain', 'england']], ['🇨🇦', ['canada']], ['🇦🇺', ['australia']], ['🇮🇹', ['italy']], ['🇪🇸', ['spain']], ['🇲🇽', ['mexico']], ['🇧🇼', ['botswana']], ['🇿🇲', ['zambia']], ['🇹🇿', ['tanzania']], ['🇲🇿', ['mozambique']], ['🇦🇷', ['argentina']]];
const WK_CAPITALS = [['Zimbabwe', ['harare']], ['South Africa', ['pretoria']], ['Nigeria', ['abuja']], ['Kenya', ['nairobi']], ['Ghana', ['accra']], ['Egypt', ['cairo']], ['Brazil', ['brasilia']], ['France', ['paris']], ['Germany', ['berlin']], ['Japan', ['tokyo']], ['India', ['new delhi', 'delhi']], ['Canada', ['ottawa']], ['Australia', ['canberra']], ['Italy', ['rome']], ['Spain', ['madrid']], ['Zambia', ['lusaka']], ['Botswana', ['gaborone']], ['Tanzania', ['dodoma']], ['Ethiopia', ['addis ababa']], ['Morocco', ['rabat']], ['Mozambique', ['maputo']], ['Namibia', ['windhoek']]];
const WK_EMOJIQ = [['🦁👑', ['lion king', 'the lion king']], ['🕷️🧑', ['spiderman', 'spider man']], ['🚢🧊', ['titanic']], ['🦇👨', ['batman']], ['❄️👸', ['frozen']], ['🐠🔍', ['finding nemo']], ['🧙‍♂️💍', ['lord of the rings']], ['🦈🌊', ['jaws']], ['🏠🎈', ['up']], ['🤖❤️', ['wall e', 'walle']], ['⚽🏆', ['world cup']], ['🎂🎉', ['birthday']], ['☔🌧️', ['rain']], ['🌙⭐', ['night']], ['🍕🇮🇹', ['pizza']], ['📱🍎', ['iphone', 'apple']], ['🐍💻', ['python']], ['🔥🐉', ['dragon']], ['🏝️☀️', ['holiday', 'vacation', 'beach']], ['🎸🎤', ['rock star', 'rockstar', 'band']]];
const WK_WYR = ['Would you rather be able to fly or be invisible?', 'Would you rather have unlimited money or unlimited time?', 'Would you rather never use social media again or never watch a video again?', 'Would you rather always be 10 minutes late or always be 20 minutes early?', 'Would you rather speak every language or play every instrument?', 'Would you rather live in the past or in the future?', 'Would you rather have no phone for a year or no friends for a month?', 'Would you rather fight 1 horse-sized duck or 100 duck-sized horses?', 'Would you rather be famous or be rich and unknown?', 'Would you rather read minds or see the future?', 'Would you rather lose all your memories or never make new ones?', 'Would you rather eat only sadza or only rice for a year?', 'Would you rather have a rewind button or a pause button for your life?', 'Would you rather be the smartest or the funniest person in the room?', 'Would you rather always say what you think or never speak again?', 'Would you rather have free data forever or free airtime forever?', 'Would you rather be a superhero or a billionaire?', 'Would you rather explore space or the deep ocean?', 'Would you rather lose your phone or your wallet today?', 'Would you rather have a personal chef or a personal driver?'];
const WK_NHIE = ['Never have I ever stayed up all night chatting.', 'Never have I ever sent a message to the wrong person.', 'Never have I ever pretended to be asleep to avoid someone.', 'Never have I ever laughed so hard I cried in public.', 'Never have I ever forgotten someone’s name right after meeting them.', 'Never have I ever replied "lol" without actually laughing.', 'Never have I ever been left on read and panicked.', 'Never have I ever got lost in a place I know well.', 'Never have I ever talked to myself in the mirror.', 'Never have I ever eaten food that fell on the floor.', 'Never have I ever screenshotted a chat to show a friend.', 'Never have I ever walked into a glass door.', 'Never have I ever cried at a movie.', 'Never have I ever gone a full day without checking my phone.', 'Never have I ever sung loudly in the shower.'];
const WK_FORTUNES = ['A pleasant surprise is waiting for you.', 'Your hard work will soon pay off.', 'Someone is thinking of you right now.', 'A new opportunity arrives when you least expect it.', 'Patience today brings a big win tomorrow.', 'You will soon meet someone who changes your plans for the better.', 'Money comes to those who keep building.', 'Good news travels your way this week.', 'Trust your gut on the next big decision.', 'A small step today is a giant leap next month.', 'The answer you are looking for is closer than you think.', 'Your next idea will be your best one yet.'];
const WK_DADJOKES = ['I only know 25 letters of the alphabet. I don’t know y.', 'Why don’t eggs tell jokes? They’d crack each other up.', 'I used to hate facial hair, but then it grew on me.', 'What do you call a fake noodle? An impasta.', 'Why did the scarecrow win an award? He was outstanding in his field.', 'I’m reading a book about anti-gravity. It’s impossible to put down.', 'Why can’t you trust stairs? They’re always up to something.', 'What do you call cheese that isn’t yours? Nacho cheese.', 'Did you hear about the claustrophobic astronaut? He just needed a bit more space.', 'Why do bees have sticky hair? They use honeycombs.', 'I told my wife she was drawing her eyebrows too high. She looked surprised.', 'What do you call a bear with no teeth? A gummy bear.', 'How does a penguin build its house? Igloos it together.', 'Why did the bicycle fall over? It was two tired.', 'What’s brown and sticky? A stick.'];
const WK_PUNS = ['I used to be a banker, but I lost interest.', 'Time flies like an arrow. Fruit flies like a banana.', 'I’m on a seafood diet. I see food and I eat it.', 'The graveyard is so crowded people are dying to get in.', 'I wasn’t originally going to get a brain transplant, but then I changed my mind.', 'A bicycle can’t stand on its own because it is two tired.', 'I’d tell you a chemistry joke but I know I wouldn’t get a reaction.', 'Broken pencils are pointless.', 'I lost my job at the calendar factory for taking a couple of days off.', 'Don’t trust atoms. They make up everything.', 'Reading while sunbathing makes you well red.', 'I can’t believe I got fired from the calendar factory. All I did was take a day off.'];
const WK_COMPLIMENTS = ['You light up every chat you walk into.', 'Your energy makes hard days feel lighter.', 'You are way more capable than you give yourself credit for.', 'You have a great sense of humor.', 'Your ideas are seriously creative.', 'People are lucky to have you around.', 'You make being kind look easy.', 'Your work ethic is inspiring.', 'You have a smile that changes the room.', 'You handle pressure like a pro.', 'You are the kind of friend everyone needs.', 'Your confidence is contagious.'];
const WK_MOTIVATE = ['Start where you are. Use what you have. Do what you can.', 'Small progress is still progress.', 'Discipline beats motivation on the days motivation disappears.', 'You don’t have to be perfect — you have to be consistent.', 'Dream big, start small, act now.', 'Every expert was once a beginner.', 'Your only limit is the effort you refuse to give.', 'Do it tired. Do it scared. Just do it.', 'The best time to start was yesterday. The next best time is now.', 'Work in silence, let results make the noise.', 'Hard roads often lead to beautiful destinations.', 'Be stubborn about your goals and flexible about your methods.'];
const WK_AFFIRM = ['I am capable of achieving what I set my mind to.', 'I grow stronger with every challenge.', 'I choose progress over perfection.', 'I deserve good things and I am open to receiving them.', 'My effort matters and my future is bright.', 'I am calm, focused and in control.', 'I learn from mistakes and keep moving forward.', 'I am building the life I want, one day at a time.'];
const WK_SHOWER = ['Your future self is watching you right now through memories.', 'Every “new” idea is just old ideas wearing a different outfit.', 'The word “bed” actually looks like a bed.', 'Nobody has ever seen their own face without a screen or a mirror.', 'You never remember the last time you fell asleep.', 'We call it “rush hour” even though nobody is moving.', 'Somewhere out there is the exact middle of nowhere.', 'Passwords are the only secrets we all keep and forget.', 'If you clean a vacuum cleaner, you become a vacuum cleaner.', 'Your phone has more computing power than the machines that reached the moon.', 'The first person to milk a cow was a very brave person.', 'Every time you blink, the world goes dark and you never notice.'];
const WK_TWISTERS = ['She sells seashells by the seashore.', 'Peter Piper picked a peck of pickled peppers.', 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?', 'Red lorry, yellow lorry.', 'Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair.', 'A proper copper coffee pot.', 'Betty Botter bought some butter but she said the butter’s bitter.', 'Unique New York, you know you need unique New York.'];
const WK_TOPICS = ['What’s the best meal you’ve ever had?', 'If you could live anywhere, where would it be?', 'What skill would you master instantly if you could?', 'What was the last thing that made you laugh out loud?', 'What’s your most useless talent?', 'If you could have dinner with anyone, who would it be?', 'What’s a small thing that always makes your day better?', 'What’s the best advice you’ve ever received?', 'What song is stuck in your head right now?', 'What’s a hobby you’d love to try?', 'What would your superpower be?', 'What’s the best trip you’ve ever taken?', 'What’s one thing you want to achieve this year?', 'Which app could you not live without?', 'What is the most underrated movie you know?'];
const WK_SIGNS = [['capricorn', '♑', 12, 22, 1, 19], ['aquarius', '♒', 1, 20, 2, 18], ['pisces', '♓', 2, 19, 3, 20], ['aries', '♈', 3, 21, 4, 19], ['taurus', '♉', 4, 20, 5, 20], ['gemini', '♊', 5, 21, 6, 20], ['cancer', '♋', 6, 21, 7, 22], ['leo', '♌', 7, 23, 8, 22], ['virgo', '♍', 8, 23, 9, 22], ['libra', '♎', 9, 23, 10, 22], ['scorpio', '♏', 10, 23, 11, 21], ['sagittarius', '♐', 11, 22, 12, 21]];
const WK_HORO_LINES = ['Good energy surrounds your plans today.', 'A conversation clears up something that has been bothering you.', 'Take the chance you have been hesitating on.', 'Money matters improve if you stay patient.', 'Someone close needs your support — be generous with your time.', 'A creative idea turns out better than expected.', 'Slow down today; the answer comes when you stop rushing.', 'Work gets easier once you finish the one thing you keep avoiding.', 'Expect good news before the day ends.', 'Rest is productive today — do not feel guilty for it.'];
const WK_MORSE = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.', '@': '.--.-.' };
const WK_MORSE_REV = Object.fromEntries(Object.entries(WK_MORSE).map(([k, v]) => [v, k]));
const WK_FLIP = { a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z', '?': '¿', '!': '¡', '.': '˙', ',': '\'', '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '_': '‾', '&': '⅋', '\'': ',' };
const WK_LEET = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', b: '8', g: '9', l: '1' };
const WK_BJ_SUITS = ['♠', '♥', '♦', '♣'], WK_BJ_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function wkQuoted(msg) {
    try {
        const c = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        return c?.conversation || c?.extendedTextMessage?.text || c?.imageMessage?.caption || c?.videoMessage?.caption || '';
    } catch { return ''; }
}
function wkMentions(msg) { try { return msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || []; } catch { return []; } }
function wkScramble(w) { let s = w; for (let i = 0; i < 12 && s === w; i++) s = WK.shuffle(w.split('')).join(''); return s; }
function wkBjDeck() { const d = []; for (const s of WK_BJ_SUITS) for (const r of WK_BJ_RANKS) d.push(r + s); return WK.shuffle(d); }
function wkBjValue(hand) { let t = 0, aces = 0; for (const c of hand) { const r = c.slice(0, -1); if (r === 'A') { aces++; t += 11; } else if (r === 'J' || r === 'Q' || r === 'K') t += 10; else t += parseInt(r, 10); } while (t > 21 && aces > 0) { t -= 10; aces--; } return t; }
function wkHangView(g) { return g.word.split('').map(c => g.guessed.has(c) ? c : '_').join(' '); }
function wkSetQuiz(chat, quiz) { WK.quiz.set(chat, { ...quiz, expires: Date.now() + 90000 }); }
function wkParseDate(s) {
    s = String(s || '').trim(); let m;
    if ((m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/))) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if ((m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/))) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
    return null;
}
function wkSignOf(day, month) {
    for (const [name, icon, m1, d1, m2, d2] of WK_SIGNS) { if ((month === m1 && day >= d1) || (month === m2 && day <= d2)) return { name, icon }; }
    return { name: 'capricorn', icon: '♑' };
}
async function wkRaw(socket, from, text, quoted) { try { await socket.sendMessage(from, { text }, quoted ? { quoted } : undefined); } catch (e) { console.error('[WK RAW]', e.message); } }

// ctx: { socket, from, msg, q, args, reply, react, raw, activePrefix, nowsender, senderName, isGroup, fakeCard }
async function wkRun(cmd, ctx) {
    const { socket, from, msg, q, args, reply, react, activePrefix: p, nowsender, senderName, isGroup } = ctx;
    const raw = t => wkRaw(socket, from, t, ctx.fakeCard);
    const me = nowsender;
    const textIn = q || wkQuoted(msg);
    const chatKey = from, userKey = `${from}:${me}`;

    switch (cmd) {
        // ───────────────────────── GAMES ─────────────────────────
        case 'dice': {
            await react('🎲');
            const m = (args[0] || '').toLowerCase().match(/^(\d{1,2})?d?(\d{1,4})?$/);
            let n = 1, sides = 6;
            if (m && args[0]) { if (args[0].toLowerCase().includes('d')) { n = parseInt(m[1] || '1', 10); sides = parseInt(m[2] || '6', 10); } else sides = parseInt(args[0], 10); }
            n = Math.min(Math.max(n || 1, 1), 10); sides = Math.min(Math.max(sides || 6, 2), 1000);
            const rolls = Array.from({ length: n }, () => WK.int(1, sides));
            return reply(`🎲 DICE ROLL\n\n${n}d${sides} → ${rolls.join(' + ')}${n > 1 ? `\nTotal: ${rolls.reduce((a, b) => a + b, 0)}` : ''}`);
        }
        case 'coinflip': case 'flip': {
            await react('🪙');
            return reply(`🪙 COIN FLIP\n\n${Math.random() < 0.5 ? '🟡 HEADS' : '⚪ TAILS'}`);
        }
        case 'rps': {
            const opts = ['rock', 'paper', 'scissors'], icons = { rock: '🪨', paper: '📄', scissors: '✂️' };
            const alias = { r: 'rock', p: 'paper', s: 'scissors' };
            const mine = alias[(args[0] || '').toLowerCase()] || (args[0] || '').toLowerCase();
            if (!opts.includes(mine)) return reply(`✊ ROCK PAPER SCISSORS\n\nUsage: ${p}rps rock | paper | scissors`);
            const bot = WK.pick(opts);
            const win = mine === bot ? 'draw' : ((mine === 'rock' && bot === 'scissors') || (mine === 'paper' && bot === 'rock') || (mine === 'scissors' && bot === 'paper')) ? 'you' : 'bot';
            return reply(`✊ ROCK PAPER SCISSORS\n\nYou: ${icons[mine]} ${mine}\nBot: ${icons[bot]} ${bot}\n\n${win === 'draw' ? '🤝 Draw!' : win === 'you' ? '🎉 You win!' : '😎 I win!'}`);
        }
        case 'slots': {
            await react('🎰');
            const sym = ['🍒', '🍋', '🍉', '⭐', '💎', '7️⃣'];
            const r = [WK.pick(sym), WK.pick(sym), WK.pick(sym)];
            const uniq = new Set(r).size;
            return reply(`🎰 SLOT MACHINE\n\n[ ${r.join(' | ')} ]\n\n${uniq === 1 ? '💥 JACKPOT! Three of a kind!' : uniq === 2 ? '✨ Nice! Two matched.' : '😅 No match. Try again!'}`);
        }
        case 'guess': {
            let g = WK.guess.get(userKey);
            const n = parseInt(args[0], 10);
            if (!g || Date.now() > g.expires || args[0]?.toLowerCase() === 'new') {
                g = { num: WK.int(1, 100), tries: 0, expires: Date.now() + 300000 }; WK.guess.set(userKey, g);
                if (isNaN(n)) return reply(`🔢 GUESS THE NUMBER\n\nI picked a number from 1 to 100.\nYou have 7 tries.\nUse ${p}guess <number>`);
            }
            if (isNaN(n)) return reply(`🔢 GUESS THE NUMBER\n\nTries used: ${g.tries}/7\nUse ${p}guess <number>`);
            g.tries++;
            if (n === g.num) { WK.guess.delete(userKey); return reply(`🎉 CORRECT!\n\n${senderName} got ${g.num} in ${g.tries} ${g.tries === 1 ? 'try' : 'tries'}!`); }
            if (g.tries >= 7) { WK.guess.delete(userKey); return reply(`💀 GAME OVER\n\nThe number was ${g.num}. Send ${p}guess to play again.`); }
            return reply(`🔢 ${n < g.num ? '⬆️ Higher!' : '⬇️ Lower!'}\n\nTries: ${g.tries}/7`);
        }
        case 'trivia': {
            const [qq, opts, ci] = WK.pick(WK_TRIVIA); const L = ['A', 'B', 'C', 'D'];
            wkSetQuiz(chatKey, { type: 'trivia', answers: [L[ci].toLowerCase(), WK.norm(opts[ci])], show: `${L[ci]}. ${opts[ci]}` });
            return reply(`🧠 TRIVIA\n\n${qq}\n\n${opts.map((o, i) => `${L[i]}. ${o}`).join('\n')}\n\n⏳ 90s — reply with ${p}answer <A-D>`);
        }
        case 'scramble': {
            const w = WK.pick(WK_WORDS);
            wkSetQuiz(chatKey, { type: 'scramble', answers: [w], show: w });
            return reply(`🔤 WORD SCRAMBLE\n\nUnscramble: ${wkScramble(w).toUpperCase()}\nHint: starts with "${w[0].toUpperCase()}", ${w.length} letters\n\n⏳ 90s — ${p}answer <word>`);
        }
        case 'mathquiz': {
            let a = WK.int(2, 50), b = WK.int(2, 30); const op = WK.pick(['+', '-', '×']);
            if (op === '-' && a < b) [a, b] = [b, a];
            const ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
            wkSetQuiz(chatKey, { type: 'math', answers: [String(ans)], show: String(ans) });
            return reply(`➗ MATH QUIZ\n\n${a} ${op} ${b} = ?\n\n⏳ 90s — ${p}answer <number>`);
        }
        case 'emojiquiz': {
            const [e, a] = WK.pick(WK_EMOJIQ);
            wkSetQuiz(chatKey, { type: 'emoji', answers: a.map(WK.norm), show: a[0] });
            return reply(`😎 EMOJI QUIZ\n\nGuess it: ${e}\n\n⏳ 90s — ${p}answer <guess>`);
        }
        case 'flagquiz': {
            const [f, a] = WK.pick(WK_FLAGS);
            wkSetQuiz(chatKey, { type: 'flag', answers: a.map(WK.norm), show: a[0] });
            return reply(`🏳️ FLAG QUIZ\n\nWhich country is this? ${f}\n\n⏳ 90s — ${p}answer <country>`);
        }
        case 'capitalquiz': {
            const [c, a] = WK.pick(WK_CAPITALS);
            wkSetQuiz(chatKey, { type: 'capital', answers: a.map(WK.norm), show: a[0] });
            return reply(`🌍 CAPITAL QUIZ\n\nWhat is the capital of ${c}?\n\n⏳ 90s — ${p}answer <city>`);
        }
        case 'answer': {
            const qz = WK.quiz.get(chatKey);
            if (!qz) return reply(`❓ No active quiz here.\n\nStart one: ${p}trivia | ${p}scramble | ${p}mathquiz | ${p}emojiquiz | ${p}flagquiz | ${p}capitalquiz`);
            if (Date.now() > qz.expires) { WK.quiz.delete(chatKey); return reply(`⌛ Time's up!\n\nThe answer was: ${qz.show}`); }
            if (!q) return reply(`Usage: ${p}answer <your answer>`);
            if (qz.answers.includes(WK.norm(q))) { WK.quiz.delete(chatKey); return reply(`🎉 CORRECT!\n\n@${me.split('@')[0]} got it: ${qz.show}`, [me]); }
            return reply(`❌ Nope, try again!`);
        }
        case 'hangman': {
            let g = WK.hm.get(chatKey);
            if (g && Date.now() < g.expires) return reply(`🪢 HANGMAN\n\n${wkHangView(g)}\n\n❤️ Lives: ${6 - g.wrong}/6\nWrong: ${[...g.bad].join(' ') || '-'}\nGuess with ${p}hm <letter>`);
            g = { word: WK.pick(WK_HANG), guessed: new Set(), bad: new Set(), wrong: 0, expires: Date.now() + 600000 }; WK.hm.set(chatKey, g);
            return reply(`🪢 HANGMAN\n\n${wkHangView(g)}\n\n${g.word.length} letters • ❤️ 6 lives\nGuess with ${p}hm <letter>`);
        }
        case 'hm': {
            const g = WK.hm.get(chatKey);
            if (!g || Date.now() > g.expires) return reply(`No active game. Start with ${p}hangman`);
            const t = (args[0] || '').toLowerCase();
            if (!t) return reply(`Usage: ${p}hm <letter>`);
            if (t.length > 1) {
                if (t === g.word) { WK.hm.delete(chatKey); return reply(`🎉 YOU WIN!\n\nThe word was ${g.word.toUpperCase()}`); }
                g.wrong++;
            } else {
                if (!/[a-z]/.test(t)) return reply('Send a single letter a-z.');
                if (g.guessed.has(t) || g.bad.has(t)) return reply(`You already tried "${t}".`);
                if (g.word.includes(t)) g.guessed.add(t); else { g.bad.add(t); g.wrong++; }
            }
            if (g.word.split('').every(c => g.guessed.has(c))) { WK.hm.delete(chatKey); return reply(`🎉 YOU WIN!\n\nThe word was ${g.word.toUpperCase()}`); }
            if (g.wrong >= 6) { WK.hm.delete(chatKey); return reply(`💀 GAME OVER\n\nThe word was ${g.word.toUpperCase()}`); }
            return reply(`🪢 HANGMAN\n\n${wkHangView(g)}\n\n❤️ Lives: ${6 - g.wrong}/6\nWrong: ${[...g.bad].join(' ') || '-'}`);
        }
        case 'roulette': {
            await react('🔫');
            const chamber = WK.int(1, 6);
            return reply(`🔫 RUSSIAN ROULETTE\n\n${chamber === 1 ? '💥 BANG! You lost this round.' : '😮‍💨 *click* — you survived!'}\n\n(just a game — nobody gets hurt)`);
        }
        case 'lottery': {
            const nums = WK.shuffle(Array.from({ length: 49 }, (_, i) => i + 1)).slice(0, 6).sort((a, b) => a - b);
            return reply(`🎟️ LUCKY LOTTERY\n\nYour numbers: ${nums.join(' - ')}\nBonus: ${WK.int(1, 49)}\n\nGood luck! 🍀`);
        }
        case 'wyr': return reply(`🤔 WOULD YOU RATHER\n\n${WK.pick(WK_WYR)}`);
        case 'nhie': return reply(`🙈 NEVER HAVE I EVER\n\n${WK.pick(WK_NHIE)}`);
        case 'rate': {
            if (!textIn) return reply(`Usage: ${p}rate <anything>`);
            const s = WK.hash(WK.norm(textIn)) % 101;
            return reply(`⭐ RATING\n\n${textIn}\n${WK.bar(s)} ${s}/100\n\n${s > 85 ? '🔥 Legendary!' : s > 60 ? '👍 Pretty good' : s > 35 ? '😐 Average' : '💀 Rough'}`);
        }
        case 'ship': {
            const mj = wkMentions(msg);
            let a, b;
            if (mj.length >= 2) { a = '@' + mj[0].split('@')[0]; b = '@' + mj[1].split('@')[0]; }
            else if (mj.length === 1) { a = senderName; b = '@' + mj[0].split('@')[0]; }
            else { const parts = q.split(/\s*(?:\+|&|x|and|,)\s*/i).filter(Boolean); if (parts.length < 2) return reply(`💘 SHIP\n\nUsage: ${p}ship name1 + name2\nor tag two people`); a = parts[0]; b = parts[1]; }
            const pct = WK.hash([a, b].map(WK.norm).sort().join('|')) % 101;
            return reply(`💘 LOVE METER\n\n${a} ❤️ ${b}\n${WK.bar(pct)} ${pct}%\n\n${pct > 80 ? '💍 Soulmates!' : pct > 55 ? '😍 Great match' : pct > 30 ? '🤷 Could work' : '💔 Just friends'}`, mj);
        }
        case 'iqtest': {
            const iq = 70 + (WK.hash(me + WK.today()) % 91);
            return reply(`🧠 IQ TEST (for fun)\n\n${senderName}\nScore: ${iq}\n${iq > 140 ? '🧬 Genius level!' : iq > 115 ? '🎓 Above average' : iq > 90 ? '🙂 Average' : '😴 Needs coffee'}\n\nResult resets daily — it is just a joke!`);
        }
        case 'fortune': return reply(`🥠 FORTUNE COOKIE\n\n${WK.pick(WK_FORTUNES)}\n\nLucky numbers: ${WK.shuffle(Array.from({ length: 49 }, (_, i) => i + 1)).slice(0, 5).join(', ')}`);
        case 'horoscope': {
            const sg = (args[0] || '').toLowerCase(); const found = WK_SIGNS.find(s => s[0] === sg);
            if (!found) return reply(`🔮 HOROSCOPE\n\nUsage: ${p}horoscope <sign>\nSigns: ${WK_SIGNS.map(s => s[0]).join(', ')}`);
            const h = WK.hash(sg + WK.today());
            const colors = ['red', 'blue', 'green', 'gold', 'purple', 'white', 'orange', 'pink'];
            return reply(`🔮 ${found[0].toUpperCase()} ${found[1]}\n\n${WK_HORO_LINES[h % WK_HORO_LINES.length]}\nLucky number: ${(h % 99) + 1}\nLucky color: ${colors[(h >>> 3) % colors.length]}\nMood: ${['💪 Strong', '😊 Happy', '🧘 Calm', '🔥 Bold', '🌙 Dreamy'][(h >>> 5) % 5]}\n\nFor entertainment only.`);
        }
        case 'luckynumber': return reply(`🍀 LUCKY NUMBERS\n\n${Array.from({ length: 5 }, () => WK.int(1, 99)).join(' • ')}`);
        case 'choose': {
            const opts = q.split(/\s*(?:\||,|\bor\b)\s*/i).map(s => s.trim()).filter(Boolean);
            if (opts.length < 2) return reply(`Usage: ${p}choose pizza | burger | sadza`);
            return reply(`🎯 I CHOOSE\n\n👉 ${WK.pick(opts)}`);
        }
        case 'who': {
            if (!isGroup) return reply('⚠️ This command only works in groups.');
            try {
                const meta = await socket.groupMetadata(from);
                const pick = WK.pick(meta.participants).id;
                return reply(`🎯 RANDOM PICK\n\n@${pick.split('@')[0]} ${q || 'is the chosen one'}`, [pick]);
            } catch (e) { return reply(`⚠️ ${e.message}`); }
        }
        case 'blackjack': {
            const ex = WK.bj.get(userKey);
            if (ex && Date.now() < ex.expires) return reply(`🃏 BLACKJACK (in progress)\n\nYou: ${ex.player.join(' ')} = ${wkBjValue(ex.player)}\nDealer: ${ex.dealer[0]} ??\n\n${p}hit or ${p}stand`);
            const deck = wkBjDeck(); const g = { deck, player: [deck.pop(), deck.pop()], dealer: [deck.pop(), deck.pop()], expires: Date.now() + 300000 };
            if (wkBjValue(g.player) === 21) {
                const dv = wkBjValue(g.dealer);
                return reply(`🃏 BLACKJACK!\n\nYou: ${g.player.join(' ')} = 21\nDealer: ${g.dealer.join(' ')} = ${dv}\n\n${dv === 21 ? '🤝 Push (both 21)' : '🎉 You win!'}`);
            }
            WK.bj.set(userKey, g);
            return reply(`🃏 BLACKJACK\n\nYou: ${g.player.join(' ')} = ${wkBjValue(g.player)}\nDealer: ${g.dealer[0]} ??\n\n${p}hit to draw • ${p}stand to hold`);
        }
        case 'hit': {
            const g = WK.bj.get(userKey);
            if (!g || Date.now() > g.expires) return reply(`No blackjack game. Start with ${p}blackjack`);
            g.player.push(g.deck.pop()); const v = wkBjValue(g.player);
            if (v > 21) { WK.bj.delete(userKey); return reply(`💥 BUST!\n\nYou: ${g.player.join(' ')} = ${v}\nDealer wins.`); }
            if (v === 21) return wkRun('stand', ctx);
            return reply(`🃏 BLACKJACK\n\nYou: ${g.player.join(' ')} = ${v}\nDealer: ${g.dealer[0]} ??\n\n${p}hit or ${p}stand`);
        }
        case 'stand': {
            const g = WK.bj.get(userKey);
            if (!g || Date.now() > g.expires) return reply(`No blackjack game. Start with ${p}blackjack`);
            while (wkBjValue(g.dealer) < 17) g.dealer.push(g.deck.pop());
            const pv = wkBjValue(g.player), dv = wkBjValue(g.dealer); WK.bj.delete(userKey);
            const res = dv > 21 ? '🎉 Dealer busts — you win!' : pv > dv ? '🎉 You win!' : pv === dv ? '🤝 Push (tie)' : '😎 Dealer wins.';
            return reply(`🃏 BLACKJACK RESULT\n\nYou: ${g.player.join(' ')} = ${pv}\nDealer: ${g.dealer.join(' ')} = ${dv}\n\n${res}`);
        }

        // ───────────────────────── TEXT FUN ─────────────────────────
        case 'reverse': return textIn ? raw([...textIn].reverse().join('')) : reply(`Usage: ${p}reverse <text>`);
        case 'mock': return textIn ? raw([...textIn].map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join('')) : reply(`Usage: ${p}mock <text>`);
        case 'clap': return textIn ? raw(textIn.split(/\s+/).join(' 👏 ') + ' 👏') : reply(`Usage: ${p}clap <text>`);
        case 'bubble': {
            if (!textIn) return reply(`Usage: ${p}bubble <text>`);
            return raw([...textIn].map(c => { const k = c.charCodeAt(0); if (k >= 97 && k <= 122) return String.fromCodePoint(0x24D0 + k - 97); if (k >= 65 && k <= 90) return String.fromCodePoint(0x24B6 + k - 65); if (k >= 49 && k <= 57) return String.fromCodePoint(0x2460 + k - 49); if (k === 48) return '⓪'; return c; }).join(''));
        }
        case 'uwu': return textIn ? raw(textIn.replace(/[rl]/g, 'w').replace(/[RL]/g, 'W').replace(/n([aeiou])/g, 'ny$1').replace(/N([aeiou])/g, 'Ny$1') + ' uwu') : reply(`Usage: ${p}uwu <text>`);
        case 'vaporwave': return textIn ? raw([...textIn].map(c => { const k = c.charCodeAt(0); return k === 32 ? '\u3000' : (k >= 33 && k <= 126) ? String.fromCharCode(k + 0xFEE0) : c; }).join('')) : reply(`Usage: ${p}vaporwave <text>`);
        case 'upsidedown': return textIn ? raw([...textIn.toLowerCase()].map(c => WK_FLIP[c] || c).reverse().join('')) : reply(`Usage: ${p}upsidedown <text>`);
        case 'leet': return textIn ? raw([...textIn].map(c => WK_LEET[c.toLowerCase()] || c).join('')) : reply(`Usage: ${p}leet <text>`);
        case 'rot13': return textIn ? raw(textIn.replace(/[a-z]/gi, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + 13) % 26 + b); })) : reply(`Usage: ${p}rot13 <text>`);
        case 'morse': {
            if (!textIn) return reply(`Usage: ${p}morse <text>\nDecode: ${p}morse decode .... .. (use / between words)`);
            if (/^decode\b/i.test(textIn)) return raw(textIn.replace(/^decode\s*/i, '').trim().split(/\s*\/\s*/).map(w => w.split(/\s+/).map(c => WK_MORSE_REV[c] || '?').join('')).join(' '));
            return raw(textIn.toLowerCase().split(/\s+/).map(w => [...w].map(c => WK_MORSE[c] || '').filter(Boolean).join(' ')).join(' / '));
        }
        case 'binary': {
            if (!textIn) return reply(`Usage: ${p}binary <text>\nDecode: ${p}binary decode 01001000 01101001`);
            if (/^decode\b/i.test(textIn)) { const bits = textIn.replace(/^decode\s*/i, '').replace(/[^01]/g, ''); if (!bits || bits.length % 8) return reply('⚠️ Binary must be groups of 8 bits.'); return raw(Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2))).toString('utf8')); }
            return raw([...Buffer.from(textIn, 'utf8')].map(b => b.toString(2).padStart(8, '0')).join(' '));
        }
        case 'hex': {
            if (!textIn) return reply(`Usage: ${p}hex <text>\nDecode: ${p}hex decode 48656c6c6f`);
            if (/^decode\b/i.test(textIn)) { const h = textIn.replace(/^decode\s*/i, '').replace(/[^0-9a-f]/gi, ''); if (!h || h.length % 2) return reply('⚠️ Invalid hex string.'); return raw(Buffer.from(h, 'hex').toString('utf8')); }
            return raw(Buffer.from(textIn, 'utf8').toString('hex'));
        }
        case 'repeat': {
            const n = Math.min(Math.max(parseInt(args[0], 10) || 0, 0), 20); const t = args.slice(1).join(' ');
            if (!n || !t) return reply(`Usage: ${p}repeat <1-20> <text>`);
            return raw(Array(n).fill(t).join('\n').slice(0, 3000));
        }
        case 'count': {
            if (!textIn) return reply(`Usage: ${p}count <text> (or reply to a message)`);
            return reply(`🔢 TEXT COUNT\n\nCharacters: ${[...textIn].length}\nWithout spaces: ${textIn.replace(/\s/g, '').length}\nWords: ${textIn.trim().split(/\s+/).length}\nLines: ${textIn.split('\n').length}`);
        }
        case 'shuffle': return textIn ? raw(WK.shuffle(textIn.split(/\s+/)).join(' ')) : reply(`Usage: ${p}shuffle <words>`);
        case 'palindrome': {
            if (!textIn) return reply(`Usage: ${p}palindrome <text>`);
            const n = WK.norm(textIn).replace(/ /g, ''); const ok = n.length > 0 && n === [...n].reverse().join('');
            return reply(`🔁 PALINDROME CHECK\n\n"${textIn}"\n${ok ? '✅ Yes, it is a palindrome!' : '❌ No, it is not a palindrome.'}`);
        }
        case 'roman': {
            const n = parseInt(args[0], 10);
            if (!n || n < 1 || n > 3999) return reply(`Usage: ${p}roman <1-3999>`);
            let r = '', x = n; for (const [v, s] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (x >= v) { r += s; x -= v; }
            return reply(`🏛️ ROMAN NUMERAL\n\n${n} → ${r}`);
        }
        case 'lorem': {
            const w = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat'.split(' ');
            const n = Math.min(Math.max(parseInt(args[0], 10) || 30, 5), 150);
            const out = Array.from({ length: n }, () => WK.pick(w)).join(' '); return raw(out.charAt(0).toUpperCase() + out.slice(1) + '.');
        }

        // ───────────────────────── UTILITIES ─────────────────────────
        case 'password': {
            const len = Math.min(Math.max(parseInt(args[0], 10) || 16, 8), 64);
            const set = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*?';
            const pw = Array.from({ length: len }, () => set[crypto.randomInt(0, set.length)]).join('');
            await reply(`🔑 PASSWORD (${len} chars)\n\nCopy it below and delete this chat after saving it somewhere safe.`);
            return raw(pw);
        }
        case 'randcolor': {
            const h = WK.int(0, 0xFFFFFF), r = (h >> 16) & 255, g = (h >> 8) & 255, b = h & 255;
            return reply(`🎨 RANDOM COLOR\n\nHEX: #${h.toString(16).padStart(6, '0').toUpperCase()}\nRGB: ${r}, ${g}, ${b}`);
        }
        case 'uuid': return raw(crypto.randomUUID());
        case 'timestamp': {
            const d = new Date();
            return reply(`🕒 TIMESTAMP\n\nUnix: ${Math.floor(d.getTime() / 1000)}\nUTC: ${d.toISOString()}\nHarare: ${d.toLocaleString('en-GB', { timeZone: 'Africa/Harare', hour12: false })}`);
        }
        case 'age': {
            const d = wkParseDate(args[0]); const now = new Date();
            if (!d || d > now) return reply(`🎂 AGE CALCULATOR\n\nUsage: ${p}age 2000-05-14\nor ${p}age 14/05/2000`);
            let y = now.getUTCFullYear() - d.getUTCFullYear(), m = now.getUTCMonth() - d.getUTCMonth(), dd = now.getUTCDate() - d.getUTCDate();
            if (dd < 0) { m--; dd += new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).getUTCDate(); }
            if (m < 0) { y--; m += 12; }
            let next = new Date(Date.UTC(now.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); if (next <= now) next = new Date(Date.UTC(now.getUTCFullYear() + 1, d.getUTCMonth(), d.getUTCDate()));
            return reply(`🎂 AGE\n\n${y} years, ${m} months, ${dd} days\nTotal days: ${Math.floor((now - d) / 86400000)}\nNext birthday in: ${Math.ceil((next - now) / 86400000)} days`);
        }
        case 'bmi': {
            const kg = parseFloat(args[0]), cm = parseFloat(args[1]);
            if (!kg || !cm || kg <= 0 || cm <= 0) return reply(`⚖️ BMI\n\nUsage: ${p}bmi <kg> <cm>\nExample: ${p}bmi 70 175`);
            const v = kg / Math.pow(cm / 100, 2);
            return reply(`⚖️ BMI\n\nYour BMI: ${v.toFixed(1)}\nCategory: ${v < 18.5 ? 'Underweight' : v < 25 ? 'Normal' : v < 30 ? 'Overweight' : 'Obese'}\n\nGeneral guide only — not medical advice.`);
        }
        case 'tip': {
            const bill = parseFloat(args[0]), pc = parseFloat(args[1] ?? 10), ppl = parseInt(args[2], 10) || 1;
            if (isNaN(bill) || isNaN(pc)) return reply(`💵 TIP CALCULATOR\n\nUsage: ${p}tip <bill> [percent] [people]\nExample: ${p}tip 50 15 2`);
            const tip = bill * pc / 100, total = bill + tip;
            return reply(`💵 TIP\n\nBill: ${bill.toFixed(2)}\nTip (${pc}%): ${tip.toFixed(2)}\nTotal: ${total.toFixed(2)}${ppl > 1 ? `\nPer person (${ppl}): ${(total / ppl).toFixed(2)}` : ''}`);
        }
        case 'discount': {
            const price = parseFloat(args[0]), off = parseFloat(args[1]);
            if (isNaN(price) || isNaN(off)) return reply(`🏷️ DISCOUNT\n\nUsage: ${p}discount <price> <percent>`);
            return reply(`🏷️ DISCOUNT\n\nPrice: ${price.toFixed(2)}\nOff: ${off}%\nYou save: ${(price * off / 100).toFixed(2)}\nFinal: ${(price - price * off / 100).toFixed(2)}`);
        }
        case 'percent': {
            const a = parseFloat(args[0]), b = parseFloat(args[1]);
            if (isNaN(a) || isNaN(b)) return reply(`➗ PERCENT\n\nUsage: ${p}percent <part> <total>\nExample: ${p}percent 25 200`);
            return reply(`➗ PERCENT\n\n${a} of ${b} = ${b ? ((a / b) * 100).toFixed(2) : '∞'}%\n${a}% of ${b} = ${(a * b / 100).toFixed(2)}`);
        }
        case 'daysleft': {
            const d = wkParseDate(args[0]);
            if (!d) return reply(`⏳ COUNTDOWN\n\nUsage: ${p}daysleft 2027-01-01`);
            const diff = Math.ceil((d - new Date()) / 86400000);
            return reply(`⏳ COUNTDOWN\n\n${diff > 0 ? `${diff} day(s) left until ${args[0]}` : diff === 0 ? 'That is today!' : `${-diff} day(s) have passed since ${args[0]}`}`);
        }
        case 'zodiac': {
            const m = String(args[0] || '').match(/^(\d{1,2})[\/\-.](\d{1,2})$/);
            if (!m || +m[1] < 1 || +m[1] > 31 || +m[2] < 1 || +m[2] > 12) return reply(`♈ ZODIAC\n\nUsage: ${p}zodiac <day>/<month>\nExample: ${p}zodiac 14/05`);
            const s = wkSignOf(+m[1], +m[2]); return reply(`${s.icon} ZODIAC\n\nBorn ${args[0]} → ${s.name.toUpperCase()}`);
        }
        case 'worldtime': {
            const zones = args[0] ? [args[0]] : ['Africa/Harare', 'Africa/Lagos', 'Africa/Nairobi', 'Europe/London', 'America/New_York', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'];
            const lines = [];
            for (const z of zones) { try { lines.push(`${z.split('/').pop().replace(/_/g, ' ')}: ${new Date().toLocaleString('en-GB', { timeZone: z, hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit' })}`); } catch { return reply(`⚠️ Unknown timezone "${z}". Use format like Europe/Paris`); } }
            return reply(`🌐 WORLD TIME\n\n${lines.join('\n')}`);
        }

        // ───────────────────────── RANDOM BANKS ─────────────────────────
        case 'dadjoke': return reply(`👨 DAD JOKE\n\n${WK.pick(WK_DADJOKES)}`);
        case 'pun': return reply(`😏 PUN\n\n${WK.pick(WK_PUNS)}`);
        case 'compliment': return reply(`💐 COMPLIMENT\n\n${q ? q + ', ' : ''}${WK.pick(WK_COMPLIMENTS)}`);
        case 'motivate': return reply(`💪 MOTIVATION\n\n${WK.pick(WK_MOTIVATE)}`);
        case 'affirm': return reply(`🌱 AFFIRMATION\n\n${WK.pick(WK_AFFIRM)}`);
        case 'showerthought': return reply(`🚿 SHOWER THOUGHT\n\n${WK.pick(WK_SHOWER)}`);
        case 'twister': return reply(`👅 TONGUE TWISTER\n\n${WK.pick(WK_TWISTERS)}\n\nSay it 3 times fast!`);
        case 'topic': return reply(`💬 CONVERSATION STARTER\n\n${WK.pick(WK_TOPICS)}`);
    }
    return false;
}
// <<WK_PACK_END>>

// <<LOGO_ENGINE_START>>
// ═══════════════════════════════════════════════════════════════════════════
// LOCAL LOGO ENGINE — renders every style offline with sharp (SVG → PNG).
// No third-party API needed, so .logo can never "fail because an API is down".
// ═══════════════════════════════════════════════════════════════════════════
const LOGO_FONT = "DejaVu Sans, Liberation Sans, Arial, Helvetica, sans-serif";
const LOGO_STYLES = ['glossysilver', 'writetext', 'blackpinklogo', 'glitchtext', 'advancedglow', 'typographytext', 'pixelglitch', 'neonglitch', 'deletingtext', 'glowingtext', 'underwater', 'logomaker', 'cartoonstyle', 'papercut', 'effectclouds', 'gradienttext', 'summerbeach', 'luxurygold', 'galaxy', 'makingneon', 'texteffect', 'galaxystyle', 'lighteffect'];
const LOGO_ALIAS = { silver: 'glossysilver', write: 'writetext', blackpink: 'blackpinklogo', glitch: 'glitchtext', glow: 'glowingtext', neon: 'makingneon', gold: 'luxurygold', cloud: 'effectclouds', clouds: 'effectclouds', beach: 'summerbeach', gradient: 'gradienttext', pixel: 'pixelglitch', cartoon: 'cartoonstyle', paper: 'papercut', light: 'lighteffect', maker: 'logomaker', typography: 'typographytext', delete: 'deletingtext', water: 'underwater' };

function logoEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function logoRand(seed) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function logoStars(W, H, n, seed, colors = ['#fff']) { const r = logoRand(seed); let o = ''; for (let i = 0; i < n; i++) o += `<circle cx="${(r() * W).toFixed(1)}" cy="${(r() * H).toFixed(1)}" r="${(r() * 1.8 + 0.3).toFixed(2)}" fill="${colors[Math.floor(r() * colors.length)]}" opacity="${(r() * 0.7 + 0.3).toFixed(2)}"/>`; return o; }

function logoSvg(style, raw) {
    const text = String(raw).trim().slice(0, 40) || 'WHITEKID';
    const t = logoEsc(text), len = [...text].length;
    const W = Math.max(1000, Math.min(1800, len * 95 + 220)), H = 500;
    const fs = Math.max(48, Math.min(190, Math.floor((W - 180) / (len * 0.68))));
    const cx = W / 2, cy = H / 2;
    const seed = [...text].reduce((a, c) => a + c.codePointAt(0), 7);
    const TXT = (attrs, content = t, x = cx, y = cy) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" ${/font-family/.test(attrs) ? '' : `font-family="${LOGO_FONT}"`} font-size="${fs}" font-weight="bold" ${attrs}>${content}</text>`;
    const blur = (id, sd) => `<filter id="${id}" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
    const glow = (id, sd, col) => `<filter id="${id}" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="${sd}" result="b"/><feFlood flood-color="${col}" result="c"/><feComposite in="c" in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    const rect = c => `<rect width="${W}" height="${H}" fill="${c}"/>`;
    const lg = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
    let defs = '', body = '';

    switch (style) {
        case 'glossysilver':
            defs = lg('bg', [[0, '#1b1f27'], [1, '#05070a']]) + lg('s', [[0, '#ffffff'], [0.45, '#8f98a3'], [0.5, '#d9dee4'], [1, '#6b727b']]) + blur('b', 6);
            body = rect('url(#bg)') + TXT('fill="#000" opacity="0.7" filter="url(#b)"', t, cx + 6, cy + 14) + TXT('fill="url(#s)" stroke="#3a3f46" stroke-width="3" paint-order="stroke"') + `<rect x="${cx - W * 0.4}" y="${cy - fs * 0.5}" width="${W * 0.8}" height="${fs * 0.22}" fill="#fff" opacity="0.12"/>`; break;
        case 'writetext':
            defs = lg('bg', [[0, '#fdfaf0'], [1, '#efe7d2']]);
            body = rect('url(#bg)') + Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${60 + i * 50}" x2="${W}" y2="${60 + i * 50}" stroke="#b9cbe6" stroke-width="2"/>`).join('') + `<line x1="90" y1="0" x2="90" y2="${H}" stroke="#e48a8a" stroke-width="3"/>` + TXT('fill="#1d2f6f" font-style="italic" font-family="Georgia, DejaVu Serif, serif"') + `<path d="M${cx - len * fs * 0.3} ${cy + fs * 0.62} q ${len * fs * 0.3} 16 ${len * fs * 0.6} 0" stroke="#1d2f6f" stroke-width="5" fill="none" stroke-linecap="round"/>`; break;
        case 'blackpinklogo':
            body = rect('#0a0a0a') + `<rect x="0" y="0" width="${W}" height="26" fill="#ff2d95"/><rect x="0" y="${H - 26}" width="${W}" height="26" fill="#ff2d95"/>` + TXT('fill="#ff2d95"', t, cx + 9, cy + 9) + TXT('fill="#fff" stroke="#0a0a0a" stroke-width="4" paint-order="stroke"') + `<text x="${cx}" y="${cy + fs * 0.85}" text-anchor="middle" font-family="${LOGO_FONT}" font-size="30" fill="#ff2d95" letter-spacing="14">BLACKPINK</text>`; break;
        case 'glitchtext':
            body = rect('#050505') + TXT('fill="#ff003c" opacity="0.85"', t, cx - 9, cy - 3) + TXT('fill="#00f0ff" opacity="0.85"', t, cx + 9, cy + 3) + TXT('fill="#fff"') + Array.from({ length: 7 }, (_, i) => { const r = logoRand(seed + i); return `<rect x="${(r() * W * 0.7).toFixed(0)}" y="${(cy - fs / 2 + r() * fs).toFixed(0)}" width="${(60 + r() * 220).toFixed(0)}" height="${(4 + r() * 10).toFixed(0)}" fill="${i % 2 ? '#00f0ff' : '#ff003c'}" opacity="0.7"/>`; }).join(''); break;
        case 'advancedglow':
            defs = glow('g', 14, '#2d8cff') + lg('bg', [[0, '#050b1a'], [1, '#000']]);
            body = rect('url(#bg)') + TXT('fill="#9ccaff" filter="url(#g)"') + TXT('fill="#fff"'); break;
        case 'typographytext': {
            defs = lg('bg', [[0, '#ff7a18'], [1, '#af002d']]);
            const rows = Array.from({ length: 8 }, (_, i) => `<text x="${cx}" y="${40 + i * 62}" text-anchor="middle" font-family="${LOGO_FONT}" font-size="64" font-weight="bold" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="2">${(t + ' ').repeat(6)}</text>`).join('');
            body = rect('url(#bg)') + rows + TXT('fill="#fff" stroke="#1a0008" stroke-width="6" paint-order="stroke"'); break; }
        case 'pixelglitch': {
            const r = logoRand(seed); let px = '';
            for (let i = 0; i < 90; i++) px += `<rect x="${Math.floor(r() * W / 16) * 16}" y="${Math.floor(r() * H / 16) * 16}" width="16" height="16" fill="${['#00ff9c', '#ff00e6', '#00b7ff'][i % 3]}" opacity="${(r() * 0.5 + 0.15).toFixed(2)}"/>`;
            body = rect('#08080f') + px + TXT('fill="#ff00e6" font-family="DejaVu Sans Mono, monospace"', t, cx - 7, cy) + TXT('fill="#00b7ff" font-family="DejaVu Sans Mono, monospace"', t, cx + 7, cy) + TXT('fill="#fff" font-family="DejaVu Sans Mono, monospace"'); break; }
        case 'neonglitch':
            defs = glow('g1', 10, '#00ff9c') + glow('g2', 10, '#ff00e6');
            body = rect('#04040a') + TXT('fill="#ff00e6" filter="url(#g2)" opacity="0.9"', t, cx + 8, cy + 4) + TXT('fill="#00ff9c" filter="url(#g1)" opacity="0.95"', t, cx - 8, cy - 4) + TXT('fill="#fff"'); break;
        case 'deletingtext':
            body = rect('#14161c') + TXT('fill="#6b7280" opacity="0.5"', t, cx + 10, cy + 10) + TXT('fill="#e5e7eb"') + `<rect x="${cx - len * fs * 0.34}" y="${cy - 5}" width="${len * fs * 0.68}" height="10" fill="#ef4444"/>` + `<text x="${cx}" y="${H - 50}" text-anchor="middle" font-family="${LOGO_FONT}" font-size="28" fill="#ef4444" letter-spacing="6">DELETING…</text>`; break;
        case 'glowingtext':
            defs = glow('g', 16, '#ffd400');
            body = rect('#07070b') + TXT('fill="#fff7b0" filter="url(#g)"') + TXT('fill="#fffde8"'); break;
        case 'underwater': {
            defs = lg('bg', [[0, '#35d0ff'], [0.55, '#0a6fb8'], [1, '#021b3a']]) + `<filter id="w" x="-5%" y="-20%" width="110%" height="140%"><feTurbulence type="turbulence" baseFrequency="0.012 0.05" numOctaves="2" seed="${seed % 50}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="16"/></filter>`;
            const r = logoRand(seed); let b = ''; for (let i = 0; i < 28; i++) b += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(4 + r() * 16).toFixed(0)}" fill="none" stroke="#d6f6ff" stroke-width="2" opacity="${(0.25 + r() * 0.5).toFixed(2)}"/>`;
            body = rect('url(#bg)') + b + TXT('fill="#e9fbff" stroke="#05507f" stroke-width="4" paint-order="stroke" filter="url(#w)"'); break; }
        case 'logomaker': {
            const ini = logoEsc([...text][0].toUpperCase());
            defs = lg('c', [[0, '#7c3aed'], [1, '#2563eb']], 1, 1);
            body = rect('#0f172a') + `<circle cx="${cx}" cy="${cy - 55}" r="150" fill="url(#c)"/><circle cx="${cx}" cy="${cy - 55}" r="170" fill="none" stroke="#a78bfa" stroke-width="5"/>` + `<text x="${cx}" y="${cy - 55}" text-anchor="middle" dominant-baseline="central" font-family="${LOGO_FONT}" font-size="190" font-weight="bold" fill="#fff">${ini}</text>` + `<text x="${cx}" y="${cy + 195}" text-anchor="middle" font-family="${LOGO_FONT}" font-size="${Math.min(70, fs * 0.55)}" font-weight="bold" fill="#e2e8f0" letter-spacing="8">${logoEsc(text.toUpperCase())}</text>`; break; }
        case 'cartoonstyle':
            defs = lg('bg', [[0, '#8ee3ff'], [1, '#d5f6ff']]) + lg('f', [[0, '#fff35c'], [1, '#ffb300']]);
            body = rect('url(#bg)') + TXT('fill="#000"', t, cx + 10, cy + 12) + TXT('fill="url(#f)" stroke="#111" stroke-width="12" stroke-linejoin="round" paint-order="stroke"'); break;
        case 'papercut': {
            const cols = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2']; defs = blur('s', 5);
            body = rect('#f4f1ea') + TXT('fill="#222" opacity="0.25" filter="url(#s)"', t, cx + 18, cy + 26) + cols.map((c, i) => TXT(`fill="${c}" stroke="#fff" stroke-width="4" paint-order="stroke" opacity="0.98"`, t, cx + (3 - i) * 7, cy + (3 - i) * 7)).join(''); break; }
        case 'effectclouds': {
            defs = lg('bg', [[0, '#3a8dde'], [1, '#bfe4ff']]);
            const r = logoRand(seed); let c = ''; for (let i = 0; i < 9; i++) { const x = r() * W, y = 40 + r() * (H - 80), s = 0.7 + r() * 1.1; c += `<g opacity="0.92" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})"><ellipse cx="0" cy="0" rx="90" ry="34" fill="#fff"/><ellipse cx="-45" cy="-14" rx="48" ry="30" fill="#fff"/><ellipse cx="25" cy="-24" rx="55" ry="36" fill="#fff"/></g>`; }
            body = rect('url(#bg)') + c + TXT('fill="#0b3d73" opacity="0.35"', t, cx + 6, cy + 8) + TXT('fill="#fff" stroke="#2b6cb0" stroke-width="3" paint-order="stroke"'); break; }
        case 'gradienttext':
            defs = lg('g', [[0, '#ff0080'], [0.25, '#ff8c00'], [0.5, '#ffe600'], [0.75, '#00e676'], [1, '#00b0ff']], 1, 0);
            body = rect('#0b0b12') + TXT('fill="url(#g)"'); break;
        case 'summerbeach':
            defs = lg('sky', [[0, '#ff9a3c'], [0.6, '#ffd89b'], [1, '#fff3d6']]) + lg('sea', [[0, '#19b5d8'], [1, '#0a6f9c']]);
            body = `<rect width="${W}" height="${H * 0.62}" fill="url(#sky)"/><circle cx="${W * 0.82}" cy="${H * 0.3}" r="70" fill="#fff6c9"/><circle cx="${W * 0.82}" cy="${H * 0.3}" r="52" fill="#ffd23f"/><rect y="${H * 0.62}" width="${W}" height="${H * 0.2}" fill="url(#sea)"/><rect y="${H * 0.82}" width="${W}" height="${H * 0.18}" fill="#f3d9a4"/>` + TXT('fill="#7a3b00" opacity="0.35"', t, cx + 5, cy - 25) + TXT('fill="#fff" stroke="#e8590c" stroke-width="5" paint-order="stroke"', t, cx, cy - 30); break;
        case 'luxurygold':
            defs = lg('g', [[0, '#fff3b0'], [0.35, '#d4a017'], [0.55, '#fff0a0'], [0.8, '#a67c00'], [1, '#f6d365']]);
            body = rect('#070707') + `<rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="url(#g)" stroke-width="5"/><rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="#d4a017" stroke-width="1.5"/>` + TXT('fill="#000" opacity="0.6"', t, cx + 4, cy + 6) + TXT('fill="url(#g)" stroke="#5a4200" stroke-width="2" paint-order="stroke"'); break;
        case 'galaxy':
            defs = `<radialGradient id="bg" cx="50%" cy="50%" r="75%"><stop offset="0" stop-color="#3b1a78"/><stop offset="0.6" stop-color="#150a33"/><stop offset="1" stop-color="#030014"/></radialGradient>` + lg('g', [[0, '#8ec5ff'], [0.5, '#c77dff'], [1, '#ff6ec7']], 1, 0);
            body = rect('url(#bg)') + logoStars(W, H, 160, seed, ['#fff', '#cfe3ff', '#ffd6f5']) + TXT('fill="url(#g)" stroke="#fff" stroke-opacity="0.5" stroke-width="2" paint-order="stroke"'); break;
        case 'makingneon':
            defs = glow('g', 9, '#ff2bd6');
            body = rect('#120a16') + Array.from({ length: 10 }, (_, i) => `<line x1="0" y1="${i * 50}" x2="${W}" y2="${i * 50}" stroke="#1d1224" stroke-width="3"/>`).join('') + TXT('fill="none" stroke="#ff2bd6" stroke-width="7" filter="url(#g)"') + TXT('fill="none" stroke="#ffd1f5" stroke-width="2.5"'); break;
        case 'texteffect': {
            defs = lg('bg', [[0, '#232526'], [1, '#414345']]) + lg('f', [[0, '#ffffff'], [1, '#9be15d']]);
            let ext = ''; for (let i = 22; i >= 1; i--) ext += TXT('fill="#1c7a3e"', t, cx + i * 1.4, cy + i * 1.4);
            body = rect('url(#bg)') + ext + TXT('fill="url(#f)" stroke="#0f4d27" stroke-width="3" paint-order="stroke"'); break; }
        case 'galaxystyle':
            defs = `<radialGradient id="n1" cx="25%" cy="30%" r="55%"><stop offset="0" stop-color="#2b6fff" stop-opacity="0.75"/><stop offset="1" stop-color="#2b6fff" stop-opacity="0"/></radialGradient><radialGradient id="n2" cx="78%" cy="70%" r="55%"><stop offset="0" stop-color="#ff3fa4" stop-opacity="0.65"/><stop offset="1" stop-color="#ff3fa4" stop-opacity="0"/></radialGradient>` + glow('g', 12, '#7aa8ff');
            body = rect('#020412') + rect('url(#n1)') + rect('url(#n2)') + logoStars(W, H, 200, seed + 3, ['#fff', '#bcd4ff', '#ffc4e8']) + TXT('fill="#dbe7ff" filter="url(#g)"') + TXT('fill="#fff"'); break;
        case 'lighteffect': {
            defs = `<radialGradient id="r" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#fff6c2" stop-opacity="0.9"/><stop offset="1" stop-color="#fff6c2" stop-opacity="0"/></radialGradient>` + glow('g', 12, '#ffe066');
            let rays = ''; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, b = a + 0.1; rays += `<polygon points="${cx},${cy} ${(cx + Math.cos(a) * W).toFixed(0)},${(cy + Math.sin(a) * W).toFixed(0)} ${(cx + Math.cos(b) * W).toFixed(0)},${(cy + Math.sin(b) * W).toFixed(0)}" fill="#fff3a8" opacity="0.1"/>`; }
            body = rect('#05050a') + rays + `<ellipse cx="${cx}" cy="${cy}" rx="${W * 0.45}" ry="${H * 0.5}" fill="url(#r)"/>` + TXT('fill="#fff" filter="url(#g)"') + TXT('fill="#fffbe0"'); break; }
        default: return null;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${body}</svg>`;
}

async function makeLogo(styleRaw, text) {
    const style = LOGO_ALIAS[styleRaw] || styleRaw;
    const svg = logoSvg(style, text);
    if (!svg) throw new Error(`Unknown style "${styleRaw}"`);
    if (!sharp) throw new Error('sharp is not installed (run: npm install sharp)');
    return await sharp(Buffer.from(svg)).png().toBuffer();
}
// <<LOGO_ENGINE_END>>

const MENU_CATS = [
    ['NEXUS', '🌐', ["prime_store"]],
    ['QUOTES', '💭', ["heartbreak", "friendship", "love", "newyear", "boyfriendsday", "christmas", "mothersday"]],
    ['GENERAL', '⚙️', ["alive", "ping", "menu", "owner", "devdetails", "repo", "datetime", "location", "bot_info", "bot_stats", "uptime", "pair", "settings", "prefix", "report", "active", "countries", "calc", "google", "fetch", "help", "dev", "developer", "setprefix", "calculate", "readmore", "deleteme", "autoview", "voicestatus"]],
    ['AI CORE', '🤖', ["ai", "aion", "aioff", "aitoggle", "gpt4", "gemini", "llama", "deepseek", "mathgpt", "aicode", "textdetect", "imagine", "aiimg", "gptimage", "vision", "stablesd", "sologo", "nanobanana", "veo", "suno", "txt2vid", "txt2img", "voice", "voiceon", "voiceoff", "flux", "dalle", "txt2video", "aivid", "analyze", "describe", "yttranscribe"]],
    ['DOWNLOADS', '⬇️', ["song", "play", "video", "ytmp4", "tiktok", "fb", "ig", "twitter", "threads", "igstory", "spotify", "gdrive", "mediafire", "apk", "gitclone", "snack", "lyrics", "ytt", "website", "aio", "ytmp3", "yta", "lyric", "lirik", "alldown", "facebook", "ttdl", "insta", "x", "twdl", "mfdl", "gitdl", "googledrive", "snackdl", "downloadmovie", "sm", "silent"]],
    ['SEARCH', '🔎', ["weather", "wiki", "github", "npm", "whois", "winfo", "bible", "quran", "movie", "dlmovie", "smsubs", "news", "crypto", "shazam", "imdb", "wallpaper", "npmstalk", "tgstalk", "ytstalk", "ttstalk", "stalk", "getpp", "pp", "profilepic", "search", "get", "wikipedia", "npmsearch", "tiktokstalk", "whatmusic", "livefunfact"]],
    ['FUN', '🎭', ["joke", "darkjoke", "riddle", "dare", "truth", "roast", "quote", "fact", "advice", "pickup", "lovequote", "waifu", "meme", "rizz", "pickupline", "gaming"]],
    ['IMAGES', '🖼️', ["cat", "dog", "eightball", "technews", "funfact", "tictactoe", "game", "spongebob", "memetext", "textgif", "textmp4", "fancy", "nasa", "gimage", "googleimage", "wp", "4kwallpaper", "4kwp", "pinterest", "pin"]],
    ['ANIME', '🐉', ["animesearch", "topanime", "currentanime", "animechar", "samehadaku", "anime"]],
    ['TOOLS', '🧰', ["sticker", "s", "remini", "removebg", "wasted", "jail", "wanted", "gun", "brat", "neon", "qr", "ssweb", "vv", "viewonce", "rvo", "catbox", "url", "shorturl", "tinyurl", "tourl", "translate", "tr", "tts", "bomb", "togif", "ocr", "trackip", "ipinfo", "vcc", "ccgen", "obfuscate", "obf", "blurface", "imagescanner", "webcopier", "webtozip", "webp2mp4", "webptomp4", "telegraph", "tph", "uploadugu", "uguu", "toimg", "stickertoimg", "sticker2img", "font", "base64", "units"]],
    ['GROUP ADMIN', '👥', ["add", "kick", "promote", "demote", "open", "close", "tagall", "link", "admins", "vcf", "gcstatus", "antilink", "welcome", "kickall", "warn", "bc", "join", "goodbye", "tagactive", "setgpp", "setgname", "autostatus", "autoadd", "mute", "unmute", "removeall", "grouplink", "invite", "setgroupname", "broadcast", "spam", "greet", "desc", "admin", "bye"]],
    ['OWNER', '👑', ["mode", "ban", "unban", "bannedlist", "bio", "autoread", "autorecord", "antidelete", "setpp", "whitekid", "savestatus", "antidel", "setbio", "ram", "system", "cpu", "store"]],
    ['SPORTS', '⚽', ["soccer", "nba", "nfl", "livescores", "standings", "teamsearch", "playersearch", "surebet", "topscorers", "upcomingmatches", "soccerscores", "live", "score", "bettips", "upcoming"]],
    ['TEMP MAIL', '📧', ["tempmail", "tempinbox", "readmail", "delmail", "tempmailgen"]],
    ['LOGO MAKER', '🎨', ["logolist", "logo", "logos"]],
    ['GAMES', '🎮', ["dice", "coinflip", "flip", "rps", "slots", "roulette", "lottery", "guess", "trivia", "scramble", "mathquiz", "emojiquiz", "flagquiz", "capitalquiz", "answer", "hangman", "hm", "blackjack", "hit", "stand", "wyr", "nhie"]],
    ['FUN EXTRAS', '🎲', ["rate", "ship", "iqtest", "fortune", "horoscope", "luckynumber", "choose", "who", "dadjoke", "pun", "compliment", "motivate", "affirm", "showerthought", "twister", "topic"]],
    ['TEXT FUN', '🔤', ["reverse", "mock", "clap", "bubble", "uwu", "vaporwave", "upsidedown", "leet", "rot13", "morse", "binary", "hex", "repeat", "count", "shuffle", "palindrome", "lorem", "roman"]],
    ['UTILITIES', '🛠️', ["password", "randcolor", "uuid", "timestamp", "age", "bmi", "tip", "discount", "percent", "daysleft", "zodiac", "worldtime"]]
];
MENU_CATS.find(c => c[0] === 'LOGO MAKER')[2].push(...LOGO_STYLES.filter(x => !MENU_CATS.find(c => c[0] === 'LOGO MAKER')[2].includes(x)));

// <<MENU_ENGINE_START>>
// Menu is built from the REAL case labels in this file, so every command shown works and the count is always true.
let _caseSetCache = null;
async function getCaseSet() {
    if (_caseSetCache) return _caseSetCache;
    const set = new Set();
    try {
        const src = await fs.readFile(path.join(__dirname, 'pair.js'), 'utf-8');
        const a = src.indexOf('switch (' + 'command) {'), b = src.indexOf('} // end ' + 'switch');
        const sw = (a >= 0 && b > a) ? src.slice(a, b) : src;
        for (const m of sw.matchAll(/\bcase\s*['"]([^'"\n]+)['"]\s*:/g)) set.add(m[1]);
    } catch {}
    _caseSetCache = set; return set;
}
const MENU_HIDDEN = new Set(['whitekid', 'bomb']);
function menuBlocks(set, only) {
    const used = new Set(), blocks = [], summary = [];
    const make = (title, icon, cmds, p) => {
        const rows = [];
        for (let i = 0; i < cmds.length; i += 3) rows.push('┃ ' + cmds.slice(i, i + 3).map(c => `◦ ${p}${c}`).join('   '));
        return { title, icon, n: cmds.length, text: `╭━━━〔 ${icon} ${title} · ${cmds.length} 〕\n${rows.join('\n')}\n╰━━━━━━━━━━━━━━━━━━` };
    };
    const P = getCustomPrefix();
    for (const [title, icon, cmds] of MENU_CATS) {
        const live = cmds.filter(c => set.has(c) && !MENU_HIDDEN.has(c));
        cmds.forEach(c => used.add(c));
        if (!live.length) continue;
        summary.push({ title, icon, n: live.length });
        if (only && !title.toLowerCase().replace(/\s+/g, '').includes(only)) continue;
        blocks.push(make(title, icon, live, P));
    }
    const rest = [...set].filter(c => !used.has(c) && !MENU_HIDDEN.has(c) && !/^\d/.test(c)).sort();
    if (rest.length) { summary.push({ title: 'MORE', icon: '✨', n: rest.length }); if (!only || 'more'.includes(only)) blocks.push(make('MORE', '✨', rest, P)); }
    return { blocks, summary };
}
function menuChunks(blocks, limit = 3000) {
    const out = []; let cur = '';
    for (const b of blocks) { if (cur && (cur.length + b.text.length + 2) > limit) { out.push(cur); cur = ''; } cur += (cur ? '\n\n' : '') + b.text; }
    if (cur) out.push(cur); return out;
}
// <<MENU_ENGINE_END>>

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND HANDLER
// ═══════════════════════════════════════════════════════════════════════════
function setupCommandHandlers(socket, number) {
    // ─── AUTO SMALL-CAPS WRAPPER — hits EVERY bot response (text + caption) ──────
    if (!socket._scWrapped) {
        socket._scWrapped = true;
        const _origSend = socket.sendMessage.bind(socket);
        socket.sendMessage = async (jid, content, opts) => {
            if (content && typeof content === 'object') {
                const c = { ...content };
                if (typeof c.text === 'string') c.text = toSmallCaps(c.text);
                if (typeof c.caption === 'string') c.caption = toSmallCaps(c.caption);
                return _origSend(jid, c, opts);
            }
            return _origSend(jid, content, opts);
        };
    }
    // ─────────────────────────────────────────────────────────────────────────────
    socket.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg?.message || msg.key.remoteJid === 'status@broadcast') return;
            const type = getContentType(msg.message);
            if (!type) return;
            if (type === 'ephemeralMessage') msg.message = msg.message.ephemeralMessage.message;

            const sn = number.replace(/[^0-9]/g, '');
            const ss = loadSS(sn);
            const activePrefix = getCustomPrefix();
            const botImg = getRandomBotImage();

            const makeCtx = (mentionedJid = []) => ({ mentionedJid, groupMentions: [] });

            const fakeCard = { key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' }, message: { contactMessage: { displayName: `© ${AI_SHORT_NAME} ✅`, vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${AI_SHORT_NAME}\nORG:WhiteKid Tech;\nTEL;type=CELL;waid=${config.OWNER_NUMBERS[0]}:+${config.OWNER_NUMBERS[0]}\nEND:VCARD` } } };

            const reply = async (text, mentions = []) => { try {
            // Clean formatting — strip borders, bold, italic, blockquote
            const _lines = (text || '').split('\n');
            const _cleaned = _lines
                .filter(l => !l.includes('━━━━━━━━━━━━━'))
                .map(l => l.replace(/^\*┃\*\s?/, '').replace(/\*([^*\n]+)\*/g, '$1').replace(/_([^_\n]+)_/g, '$1').replace(/^> /, ''))
                .join('\n').replace(/\n{3,}/g, '\n\n').trim();
            await socket.sendMessage(msg.key.remoteJid, { text: styleWA(_cleaned) + WM, contextInfo: makeCtx(mentions) }, { quoted: fakeCard });
        } catch (e) { console.error('[REPLY]', e.message); } };
            const replyImg = async (imgUrl, caption, mentions = [], rawMenu = false) => { try { let _cap = (caption || '').replace(/\*([^*\n]+)\*/g, '$1').replace(/_([^_\n]+)_/g, '$1').replace(/^> /gm, ''); if (!rawMenu) _cap = styleWA(_cap); await socket.sendMessage(msg.key.remoteJid, { image: { url: imgUrl }, caption: _cap + WM, contextInfo: makeCtx(mentions) }, { quoted: fakeCard }); } catch (e) { console.error('[REPLYIMG]', e.message); await reply(caption, mentions); } };
            const react = async emoji => { try { await socket.sendMessage(msg.key.remoteJid, { react: { text: emoji, key: msg.key } }); } catch {} };
            const replyWithVoice = async (text, imgUrl = null) => { if (imgUrl) await replyImg(imgUrl, text); else await reply(text); }; // voice removed

            const replyCarousel = async (titleText, items) => { return await sendCarousel(socket, msg.key.remoteJid, titleText, items, fakeCard); };
            const replyButtons = async (opts) => { return await sendButtons(socket, msg.key.remoteJid, { ...opts, fakeCard }); };

            const from = msg.key.remoteJid;
            const nowsender = msg.key.fromMe ? ((socket.user?.id?.split(':')[0] || '') + '@s.whatsapp.net') : (msg.key.participant || msg.key.remoteJid);
            const senderNumber = nowsender.split('@')[0].replace(/[^0-9]/g, '');
            const botNumber = (socket.user?.id?.split(':')[0] || '').replace(/[^0-9]/g, '');

            const isDevOverride = isDeveloper(senderNumber);
            const isOwner = msg.key.fromMe || isPairedOwner(senderNumber, botNumber, config.OWNER_NUMBERS) || isDevOverride;
            const isGroup = from.endsWith('@g.us');

            if (!isOwner && !isDevOverride && isBanned(senderNumber)) { await reply('🚫 You are banned from using this bot.'); return; }
            if (!isOwner && !isDevOverride && !isPublicMode() && !isGroup) return; // groups always active

            const senderDisplayName = msg.pushName || nowsender.split('@')[0];

            // ─── AUDIO / VOICE HANDLER ────────────────────────────────────────
            if ((type === 'audioMessage' || type === 'pttMessage') && !msg.key.fromMe) {
                if (!isOwner && !isDevOverride && !isAiEnabled()) return;
                try {
                    await react('🎙️');
                    const audioMsg = msg.message.audioMessage || msg.message.pttMessage;
                    const mimeType = audioMsg?.mimetype || 'audio/ogg; codecs=opus';
                    const stream = await downloadContentFromMessage(audioMsg, 'audio');
                    let audioBuf = Buffer.from([]); for await (const chunk of stream) audioBuf = Buffer.concat([audioBuf, chunk]);
                    if (audioBuf.length < 100) { await reply(`🎙️ Audio seems empty. Try again.`); return; }
                    await reply(`🎙️ _Processing your audio, ${senderDisplayName}..._`);
                    const transcript = await transcribeAudio(audioBuf, mimeType);
                    if (!transcript) { await replyWithVoice(`Sorry ${senderDisplayName}, couldn't transcribe. Please type instead.`); return; }
                    await reply(`📝 *Transcribed:* _"${transcript}"_`);
                    const aiResponse = await askGrok(`${transcript} [Context: Voice message. Respond as ${AI_SHORT_NAME}.]`);
                    if (aiResponse) await replyWithVoice(aiResponse);
                    else await replyWithVoice(`I heard you, ${senderDisplayName}, but couldn't respond right now.`);
                } catch (e) { console.error('[AUDIO HANDLER]', e.message); await reply(`⚠️ Audio processing failed. Please type instead.`); }
                return;
            }

            // ─── EXTRACT BODY ─────────────────────────────────────────────────
            let body = '';
            try {
                if (type === 'conversation') body = msg.message.conversation || '';
                else if (type === 'extendedTextMessage') body = msg.message.extendedTextMessage?.text || '';
                else if (type === 'imageMessage') body = msg.message.imageMessage?.caption || '';
                else if (type === 'videoMessage') body = msg.message.videoMessage?.caption || '';
                else if (type === 'buttonsResponseMessage') body = msg.message.buttonsResponseMessage?.selectedButtonId || '';
                else if (type === 'listResponseMessage') body = msg.message.listResponseMessage?.singleSelectReply?.selectedRowId || '';
                else if (type === 'templateButtonReplyMessage') body = msg.message.templateButtonReplyMessage?.selectedId || '';
                else if (type === 'interactiveResponseMessage') { const pj = msg.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson; body = pj ? (JSON.parse(pj)?.id || '') : ''; }
            } catch { body = ''; }

            if (!body || !body.trim()) return;

            // ─── APK INTERACTIVE REPLY ────────────────────────────────────────
            if (global.apkSessionStore.has(from)) {
                const sess = global.apkSessionStore.get(from);
                if (sess.userId === nowsender) {
                    const choice = parseInt(body.trim(), 10);
                    if (!isNaN(choice) && choice >= 1 && choice <= (sess.results?.length || 0)) {
                        clearTimeout(sess.timeout); global.apkSessionStore.delete(from);
                        const selected = sess.results[choice - 1];
                        await react('⬇️'); await socket.sendMessage(from, { text: `⬇️ Downloading *${selected.judul || selected.name}*...\n⏱ Please wait...` }, { quoted: msg });
                        try { const dlUrl = `${config.DISCARD_API}/api/apk/dl/android1?apikey=guru&url=${encodeURIComponent(selected.link || selected.url)}`; const { data: dlRes } = await axios.get(dlUrl, { timeout: 60000 }); const apk = dlRes?.result; if (!apk?.url) throw new Error('No APK URL'); const safeName = (apk.name || 'app').replace(/[^\w.-]/g, '_'); const cap = `📦 *${apk.name}*\n⭐ ${apk.rating || 'N/A'}\n📦 ${apk.size || 'N/A'}\n📱 ${apk.requirement || 'N/A'}\n📅 ${apk.published || 'N/A'}`; await socket.sendMessage(from, { document: { url: apk.url }, fileName: `${safeName}.apk`, mimetype: 'application/vnd.android.package-archive', caption: cap + WM }, { quoted: fakeCard }); await react('✅'); } catch (e) { await reply(`⚠️ APK download failed: ${e.message}`); }
                        return;
                    }
                }
            }

            // ─── ANTILINK ─────────────────────────────────────────────────────
            if (isGroup) {
                const isAdmin2 = await (async () => { try { const m2 = await socket.groupMetadata(from); const p2 = m2.participants.find(p => p.id === nowsender); return p2?.admin === 'admin' || p2?.admin === 'superadmin'; } catch { return false; } })();
                await handleLinkDetection(socket, from, msg, body, nowsender, isAdmin2, isOwner || isDevOverride);
            }

            const isCmd = body.startsWith(activePrefix) || body.startsWith('#') || body.startsWith('/');
            const rawCmd = isCmd ? body.slice(1).trim().split(/\s+/)[0].toLowerCase() : '';
            const command = rawCmd === '8ball' ? 'eightball' : rawCmd;
            const args = body.trim().split(/\s+/).slice(1);
            const q = args.join(' ').trim();

            async function isGroupAdmin(jid, user) { try { const m3 = await socket.groupMetadata(jid); const p3 = m3.participants.find(p => p.id === user); return p3?.admin === 'admin' || p3?.admin === 'superadmin' || false; } catch { return false; } }
            const isSenderGroupAdmin = isGroup ? await isGroupAdmin(from, nowsender) : false;

            // ─── PREFIXLESS AI AUTO-REPLY — DISABLED (use .ai command) ─────────
            if (!isCmd && !msg.key.fromMe && body.trim()) {
                return; // AI only responds to explicit .ai command
            }
            if (!isCmd || !command) return;

            const count = await totalcmds();
            startScheduler(socket);

            // ════════════════════════════════════════════════════════════════
            switch (command) {

// ─── WhiteKid DEVELOPER OVERRIDE ─────────────────────────────────────────────
case 'whitekid': {
    const devNum = DEVELOPER_NUMBER.replace(/[^0-9]/g, '');
    const snClean = senderNumber.replace(/[^0-9]/g, '');
    if (snClean !== devNum && !snClean.endsWith(devNum)) {
        await reply('🔐 *Developer only command.*'); return;
    }
    const sub = (args.join(' ') || '').toLowerCase().trim();
    const os2 = getOwnerSettings();
    if (!sub || sub === 'status') {
        await reply(`🔐 *DEVELOPER PANEL*\n\n🌐 Mode: ${isPublicMode() ? 'Public' : 'Private'}\n🤖 AI: ${isAiEnabled() ? 'ON' : 'OFF'}\n🎙️ Voice: ${isVoiceEnabled() ? 'ON' : 'OFF'}\n👁️ AutoRead: ${isAutoRead() ? 'ON' : 'OFF'}\n🎥 AutoRecord: ${isAutoRecord() ? 'ON' : 'OFF'}\n🛡️ Antidelete: ${loadAD().enabled ? 'ON' : 'OFF'}\n🔑 Prefix: ${activePrefix}\n📱 Number: ${devNum}\n👥 Sessions: ${activeSockets.size}\n\nSubcommands: mode | ai | voice | autoread | autorecord | antidelete | prefix | reset | ban | unban | restart | sessions`);
    } else if (sub.startsWith('mode')) { const v = sub.includes('on') || sub.includes('public'); setPublicMode(v); await reply(`🌐 Public Mode: ${v ? 'ON' : 'OFF'} ✅ [Dev Override]`); }
    else if (sub.startsWith('ai')) { const v = sub.includes('on'); setAiEnabled(v); await reply(`🤖 AI: ${v ? 'ON' : 'OFF'} ✅ [Dev Override]`); }
    else if (sub.startsWith('voice')) { const v = sub.includes('on'); setVoiceEnabled(v); await reply(`🎙️ Voice: ${v ? 'ON' : 'OFF'} ✅ [Dev Override]`); }
    else if (sub.startsWith('autoread')) { const v = sub.includes('on'); setAutoRead(v); await reply(`👁️ AutoRead: ${v ? 'ON' : 'OFF'} ✅ [Dev Override]`); }
    else if (sub.startsWith('autorecord')) { const v = sub.includes('on'); setAutoRecord(v); await reply(`🎥 AutoRecord: ${v ? 'ON' : 'OFF'} ✅ [Dev Override]`); }
    else if (sub.startsWith('antidelete')) { const v = sub.includes('on'); saveAD({ enabled: v }); await reply(`🛡️ Antidelete: ${v ? 'ON' : 'OFF'} ✅ [Dev Override]`); }
    else if (sub.startsWith('autostatus')) { const cfg = getAutoStatus(); cfg.enabled = sub.includes('on'); setAutoStatus(cfg); await reply(`📺 AutoStatus: ${cfg.enabled ? 'ON' : 'OFF'} ✅ [Dev Override]`); }
    else if (sub.startsWith('prefix')) { const np = args[1]; if (np) { setCustomPrefix(np); await reply(`🔑 Prefix: \`${np}\` ✅ [Dev Override]`); } else await reply(`Current prefix: \`${activePrefix}\`\nUsage: .whitekid prefix <new>`); }
    else if (sub === 'reset') { setPublicMode(true); setAiEnabled(true); setVoiceEnabled(true); setAutoRead(true); setAutoRecord(true); setCustomPrefix('.'); saveAD({ enabled: false }); await reply('✅ All settings reset to defaults [Dev Override]'); }
    else if (sub.startsWith('ban')) { const bn = args[1]?.replace(/[^0-9]/g, ''); if (bn) { let b = []; try { b = JSON.parse(fs.readFileSync(BANS_PATH, 'utf8')); } catch {} if (!b.includes(bn)) { b.push(bn); fs.writeFileSync(BANS_PATH, JSON.stringify(b, null, 2)); } await reply(`🚫 ${bn} banned ✅ [Dev Override]`); } }
    else if (sub.startsWith('unban')) { const un = args[1]?.replace(/[^0-9]/g, ''); if (un) { let b = []; try { b = JSON.parse(fs.readFileSync(BANS_PATH, 'utf8')); } catch {} b = b.filter(x => x !== un); fs.writeFileSync(BANS_PATH, JSON.stringify(b, null, 2)); await reply(`✅ ${un} unbanned [Dev Override]`); } }
    else if (sub === 'restart') { await reply('🔄 Restarting...'); exec(`pm2 restart ${process.env.PM2_NAME || 'Whitekid Prime-Mini-main'}`); }
    else if (sub.startsWith('setowner')) { const newOwner = args[1]?.replace(/[^0-9]/g, ''); if (newOwner) { os2.extraOwners = os2.extraOwners || []; if (!os2.extraOwners.includes(newOwner)) os2.extraOwners.push(newOwner); saveOwnerSettings(os2); await reply(`✅ Added ${newOwner} as extra owner [Dev Override]`); } }
    else if (sub.startsWith('setnewsletter')) { const jid = args[1]; if (jid) { saveSS(sn, { newsletterJid: jid }); await reply(`✅ Newsletter JID set to: ${jid} [Dev Override]`); } }
    else if (sub.startsWith('setwatermark')) { const wm = args.slice(1).join(' '); if (wm) { os2.customWatermark = wm; saveOwnerSettings(os2); await reply(`✅ Watermark updated [Dev Override]`); } }
    else if (sub === 'sessions') { await reply(`📦 *Active Sessions:*\n${Array.from(activeSockets.keys()).join('\n') || 'None'}\n\nTotal: ${activeSockets.size}`); }
    else if (sub.startsWith('kick')) { const kNum = args[1]?.replace(/[^0-9]/g, ''); if (kNum) { const kJid = kNum + '@s.whatsapp.net'; if (isGroup) { try { await socket.groupParticipantsUpdate(from, [kJid], 'remove'); await reply(`✅ Kicked ${kNum} [Dev Override]`); } catch (e) { reply(`⚠️ ${e.message}`); } } } }
    else await reply('❓ Unknown whitekid subcommand.\n\nAvailable:\nstatus | mode on/off | ai on/off | voice on/off | autoread on/off | autorecord on/off | antidelete on/off | autostatus on/off | prefix <new> | reset | ban <n> | unban <n> | restart | setowner <n> | sessions');
    break;
}

// ─── PAIR ─────────────────────────────────────────────────────────────────────
case 'pair': {
    await react('📲');
    const pairNum = q?.replace(/[^0-9]/g, '');
    if (!pairNum || pairNum.length < 10) return reply(`Usage: ${activePrefix}pair +26378xxxxxx\n\nExample: ${activePrefix}pair +263789846423`);

    await reply(`⏳ Requesting pairing code for +${pairNum}...`);
    try {
        const pairSessPath = path.join(SESSION_BASE_PATH, `session_${pairNum}`);
        if (fs.existsSync(pairSessPath)) { try { fs.removeSync(pairSessPath); } catch {} }
        fs.mkdirSync(pairSessPath, { recursive: true });

        const { state: ps, saveCreds: psc } = await useMultiFileAuthState(pairSessPath);
        let pVer; try { pVer = (await fetchLatestBaileysVersion()).version; } catch { pVer = [2, 3000, 1015901307]; }

        const pairSock = makeWASocket({
            version: pVer,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: { creds: ps.creds, keys: makeCacheableSignalKeyStore(ps.keys, pino({ level: 'silent' }).child({ level: 'fatal' })) },
            browser: Browsers.macOS('Safari'),
            connectTimeoutMs: 60000,
            markOnlineOnConnect: false,
            syncFullHistory: false
        });

        let codeSent = false, pairRestarted = false;
        const pairTO = setTimeout(async () => {
            if (!codeSent) {
                await reply(`❌ Pairing code request timed out.\nMake sure WhatsApp is installed on +${pairNum} and try again.`);
                try { pairSock.ev.removeAllListeners(); pairSock.ws?.close(); } catch {}
                activeSockets.delete(`pair_${pairNum}`);
            }
        }, 35000);

        activeSockets.set(`pair_${pairNum}`, pairSock);
        pairSock.ev.on('creds.update', psc);

        pairSock.ev.on('connection.update', async (upd) => {
            const { connection: conn, lastDisconnect: ld } = upd;

            if (conn === 'open') {
                clearTimeout(pairTO);
                if (!codeSent) {
                    codeSent = true;
                    socketCreationTime.set(pairNum, Date.now());
                    activeSockets.set(pairNum, pairSock);
                    activeSockets.delete(`pair_${pairNum}`);
                    attachMessageHandler(pairSock, pairNum);

                    try { const fc = await fs.readFile(path.join(pairSessPath, 'creds.json'), 'utf8'); let sha2; try { const { data: gd } = await octokit.repos.getContent({ owner: ghOwner, repo: ghRepo, path: `session/creds_${pairNum}.json` }); sha2 = gd.sha; } catch {} await octokit.repos.createOrUpdateFileContents({ owner: ghOwner, repo: ghRepo, path: `session/creds_${pairNum}.json`, message: `Add session ${pairNum}`, content: Buffer.from(fc).toString('base64'), sha: sha2 }); await updateNumberListOnGitHub(pairNum); } catch (e) { console.error('[PAIR GITHUB]', e.message); }

                    await reply(`✅ +${pairNum} CONNECTED!\n\nThe bot is now linked. Send ${activePrefix}menu to get started.`);
                }
                return;
            }

            if (conn === 'close') {
                const sc = ld?.error?.output?.statusCode;
                if (sc === 401 || sc === DisconnectReason.loggedOut) { activeSockets.delete(pairNum); activeSockets.delete(`pair_${pairNum}`); socketCreationTime.delete(pairNum); }
                else if (codeSent && !pairRestarted && !activeSockets.has(pairNum) && (sc === 515 || sc === DisconnectReason.restartRequired || pairSock.authState?.creds?.registered)) {
                    // WhatsApp closes this socket right after the code is accepted (restartRequired).
                    // Re-open the session from the saved creds so the link actually finishes.
                    pairRestarted = true;
                    try { pairSock.ev.removeAllListeners(); } catch {}
                    activeSockets.delete(`pair_${pairNum}`);
                    await reply(`🔗 Code accepted — finishing the link for +${pairNum}...`);
                    await delay(2000);
                    const _pr = { headersSent: false, send: () => {}, status: () => _pr };
                    await EmpirePair(pairNum, _pr).catch(e => console.error('[PAIR RESTART]', e.message));
                }
            }
        });

        setTimeout(async () => {
            try {
                if (pairSock.authState.creds.registered) { clearTimeout(pairTO); codeSent = true; await reply(`✅ +${pairNum} is already registered/paired!`); return; }
                const code = await pairSock.requestPairingCode(pairNum);
                if (!code) throw new Error('Empty code returned');
                codeSent = true;
                clearTimeout(pairTO);
                const formatted = code.match(/.{1,4}/g)?.join('-') || code;

                // Plain text on purpose: interactive carousels do not render on stock Baileys, so the code never arrived.
                await reply(`📱 PAIRING CODE FOR +${pairNum}\n\n1. Open WhatsApp on that phone\n2. Settings → Linked Devices → Link a Device\n3. Tap "Link with phone number instead"\n4. Enter the code below\n\n⏰ The code expires in about 60 seconds`);
                await socket.sendMessage(from, { text: formatted }, { quoted: fakeCard });
            } catch (e) {
                clearTimeout(pairTO);
                codeSent = true;
                console.error('[PAIR CODE ERROR]', e.message);
                await reply(`❌ Failed to get pairing code: ${e.message}\n\nMake sure:\n• The number has WhatsApp installed\n• The number is not already linked\n• Try again in a moment`);
                try { pairSock.ev.removeAllListeners(); pairSock.ws?.close(); } catch {}
                activeSockets.delete(`pair_${pairNum}`);
            }
        }, 3500);

    } catch (e) {
        console.error('[PAIR CMD ERROR]', e.message);
        await reply(`❌ Pairing error: ${e.message}\n\nPlease try again.`);
    }
    break;
}

// ─── MENU ──────────────────────────────────────────────────────────────────
case 'menu': case 'allmenu': case 'commands': case 'cmds': {
    await react('🌹');
    const set = await getCaseSet();
    const only = (args[0] || '').toLowerCase().replace(/[^a-z]/g, '');
    const { blocks, summary } = menuBlocks(set, only);
    if (only && !blocks.length) return reply(`⚠️ No category called "${args[0]}".\n\nTry: ${summary.map(s => s.title.toLowerCase().replace(/\s+/g, '')).join(', ')}`);
    const total = await totalcmds(), dt = getCurrentDateTime();
    const head =
`╭━━━━━━━━━━━━━━━━━━━━━━╮
┃   ✦  WHITEKID PRIME  ✦
┃   v${config.VERSION} · by WhiteKid Tech
╰━━━━━━━━━━━━━━━━━━━━━━╯
▸ User      ⟶ ${senderDisplayName}
▸ Commands  ⟶ ${total}
▸ Prefix    ⟶ ${activePrefix}
▸ Mode      ⟶ ${isPublicMode() ? 'PUBLIC' : 'PRIVATE'}
▸ Uptime    ⟶ ${getUptime(botStartTime)}
▸ Time      ⟶ ${dt.time}

❖ CATEGORIES
${summary.map(s => `${s.icon} ${s.title} (${s.n})`).join('\n')}

💡 ${activePrefix}menu <category>  e.g. ${activePrefix}menu games`;
    await replyImg(botImg, head, [], true);
    for (const chunk of menuChunks(blocks)) { await socket.sendMessage(from, { text: chunk }, { quoted: fakeCard }); await delay(400); }
    break;
}

// ─── ALIVE ────────────────────────────────────────────────────────────────────
case 'alive': {
    await react('🪔');
    const st = socketCreationTime.get(number) || Date.now(), up = Math.floor((Date.now() - st) / 1000);
    const h = Math.floor(up / 3600), mn = Math.floor((up % 3600) / 60), sec = up % 60;
    const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    await reply(`✅ *${config.BOT_NAME} — ONLINE*\n⏱️ *Uptime:* ${h}h ${mn}m ${sec}s\n💾 *RAM:* ${mem}MB\n👥 *Sessions:* ${activeSockets.size}\n📝 *Commands:* ${count}+\n🌐 *Mode:* ${isPublicMode() ? 'Public' : 'Private'}\n🤖 *AI:* ${isAiEnabled() ? 'ON' : 'OFF'}\n🎙️ *Voice:* ${isVoiceEnabled() ? 'ON' : 'OFF'}`);
    break;
}

// ─── PING ─────────────────────────────────────────────────────────────────────
case 'ping': {
    await react('📍');
    const t1 = Date.now();
    const pingMsg = await socket.sendMessage(from, { text: toSmallCaps('pinging...') }, { quoted: msg });
    const lat = Date.now() - t1;
    await delay(400);
    await socket.sendMessage(from, {
        text: toSmallCaps(`Whitekid Prime pong speed: ${lat}ms`) + WM,
        edit: pingMsg.key
    });
    break;
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
case 'settings': {
    if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!');
    await reply(
        `⚙️ *BOT SETTINGS*\n\n` +
        `🌐 Mode: ${isPublicMode() ? 'Public 🟢' : 'Private 🔴'}\n` +
        `🤖 AI: ${isAiEnabled() ? 'ON 🟢' : 'OFF 🔴'}\n` +
        `🎙️ Voice: ${isVoiceEnabled() ? 'ON 🟢' : 'OFF 🔴'}\n` +
        `🛡️ Antidelete: ${loadAD().enabled ? 'ON 🟢' : 'OFF 🔴'}\n\n` +
        `${activePrefix}mode on/off\n` +
        `${activePrefix}aion / ${activePrefix}aioff\n` +
        `${activePrefix}voiceon / ${activePrefix}voiceoff\n` +
        `${activePrefix}antidelete on/off\n` +
        `${activePrefix}prefix <new>`
    );
    break;
}

// ─── MODE ─────────────────────────────────────────────────────────────────────
case 'mode': {
    if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!');
    const ma = args[0]?.toLowerCase();
    if (!ma || !['on', 'off', 'public', 'private'].includes(ma)) return reply(`🌐 *Public Mode:* ${isPublicMode() ? 'ON' : 'OFF'}\nUsage: ${activePrefix}mode on/off`);
    const nm = (ma === 'on' || ma === 'public'); setPublicMode(nm);
    await reply(`🌐 *Public Mode set to ${nm ? 'ON' : 'OFF'}*\n\n${nm ? 'Anyone can use the bot.' : 'Only owner can use the bot.'}`);
    break;
}

// ─── PREFIX ───────────────────────────────────────────────────────────────────
case 'prefix': case 'setprefix': {
    if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!');
    if (!args[0]) return reply(`Current prefix: \`${activePrefix}\`\nUsage: ${activePrefix}prefix <newprefix>`);
    setCustomPrefix(args[0]); await reply(`✅ Prefix changed to: \`${args[0]}\``);
    break;
}

// ─── AI TOGGLES ───────────────────────────────────────────────────────────────
case 'aion': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); setAiEnabled(true); await reply('🤖 *AI Auto-reply is now ON*'); break; }
case 'aioff': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); setAiEnabled(false); await reply('🔕 *AI Auto-reply is now OFF*'); break; }
case 'aitoggle': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); const ns = !isAiEnabled(); setAiEnabled(ns); await reply(ns ? '🤖 *AI is now ON*' : '🔕 *AI is now OFF*'); break; }
case 'voice': case 'voicestatus': { await reply(`🎙️ Voice: ${isVoiceEnabled() ? 'ON 🟢' : 'OFF 🔴'}\nUsage: ${activePrefix}voiceon / ${activePrefix}voiceoff`); break; }
case 'voiceon': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); setVoiceEnabled(true); await reply('🎙️ *Voice Reply ON*'); break; }
case 'voiceoff': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); setVoiceEnabled(false); await reply('🔇 *Voice Reply OFF*'); break; }
case 'autoread': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); const s = args[0]?.toLowerCase(); if (s === 'on') { setAutoRead(true); await reply('👁️ *AutoRead ON*'); } else if (s === 'off') { setAutoRead(false); await reply('👁️ *AutoRead OFF*'); } else await reply(`👁️ AutoRead: ${isAutoRead() ? 'ON' : 'OFF'}\nUsage: ${activePrefix}autoread on/off`); break; }
case 'autorecord': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); const s = args[0]?.toLowerCase(); if (s === 'on') { setAutoRecord(true); await reply('🎥 *AutoRecord ON*'); } else if (s === 'off') { setAutoRecord(false); await reply('🎥 *AutoRecord OFF*'); } else await reply(`🎥 AutoRecord: ${isAutoRecord() ? 'ON' : 'OFF'}\nUsage: ${activePrefix}autorecord on/off`); break; }
case 'autostatus': case 'autoview': {
    if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!');
    const cfg = getAutoStatus(), s = args[0]?.toLowerCase();
    if (!s) { await replyCarousel('📺 AUTO STATUS SETTINGS', [{ title: `Auto View: ${cfg.enabled ? '✅' : '⚠️'}`, description: `Reactions: ${cfg.reactOn ? '✅' : '⚠️'}\n\nUsage:\n.autostatus on/off\n.autostatus react on/off`, image: botImg, buttons: [{ display: cfg.enabled ? '⚠️ Disable' : '✅ Enable', id: `${activePrefix}autostatus ${cfg.enabled ? 'off' : 'on'}` }, { display: cfg.reactOn ? '💚 Reactions OFF' : '💚 Reactions ON', id: `${activePrefix}autostatus react ${cfg.reactOn ? 'off' : 'on'}` }] }]); break; }
    if (s === 'on') { cfg.enabled = true; setAutoStatus(cfg); await reply('✅ *Auto status view enabled!*'); }
    else if (s === 'off') { cfg.enabled = false; setAutoStatus(cfg); await reply('⚠️ *Auto status view disabled!*'); }
    else if (s === 'react') { const rv = args[1]?.toLowerCase() === 'on'; cfg.reactOn = rv; setAutoStatus(cfg); await reply(`${rv ? '💚' : '⚠️'} *Status reactions ${rv ? 'enabled' : 'disabled'}!*`); }
    break;
}
case 'antidelete': case 'antidel': {
    if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!');
    const s = args[0]?.toLowerCase();
    if (s === 'on') { saveAD({ enabled: true }); await reply('✅ *Antidelete enabled!*\n\n• Tracks all messages\n• Monitors deleted messages\n• Saves ViewOnce media\n• Reports deletions to owner'); }
    else if (s === 'off') { saveAD({ enabled: false }); await reply('⚠️ *Antidelete disabled!*'); }
    else { const cfg = loadAD(); await replyCarousel('🛡️ ANTIDELETE', [{ title: `Status: ${cfg.enabled ? '✅ Enabled' : '⚠️ Disabled'}`, description: 'Track deleted messages, save media, ViewOnce bypass', image: botImg, buttons: [{ display: cfg.enabled ? '⚠️ Disable' : '✅ Enable', id: `${activePrefix}antidelete ${cfg.enabled ? 'off' : 'on'}` }] }]); }
    break;
}

// ─── PRIME/ STORE ─────────────────────────────────────────────────────────
case 'prime_store': case 'store': {
  await reply(
`*Welcome To  Bot Store*
*Get bot for free:* t.me/whitekid_prime_bot

*•We help create bots like Whitekid Prime for just $5, then you'll become a legend like WhiteKid*
*•We also help you create your own website with a .zone.id domain for $5*
*•WhatsApp unban within 24hour's only $3*
*•Fake number tricks for only $3*
*•For more info DM:* +263789846423*`
  );
  break;
}

// ─── OWNER / DEV INFO ─────────────────────────────────────────────────────────
case 'owner': case 'dev': case 'developer': {
    await reply(`👑 *BOT OWNER*\n🏷️ *Name:* ${config.OWNER_NAME}\n📞 *Number:* +${DEVELOPER_NUMBER}\n📱 *WA:* wa.me/${DEVELOPER_NUMBER}\n✈️ *TG:* t.me/whitekid01`);
    break;
}

// ─── AI COMMANDS ──────────────────────────────────────────────────────────────
case 'ai': {
    await react('🤖');
    if (!q) return reply(
        `🤖 *AI*  |  ${isAiEnabled() ? 'Online 🟢' : 'Offline 🔴'}\n\n` +
        `Usage: ${activePrefix}ai <your question>\n` +
        `Voice: ${isVoiceEnabled() ? 'On 🎙️' : 'Off 🔇'}`
    );
    try {
        const _ans = await askGrok(q);
        if (_ans) {
            await reply(_ans);
        } else reply('⚠️ AI is unavailable right now. Try again.');
    } catch (e) { reply(`⚠️ AI error: ${e.message}`); }
    break;
}
case 'gpt4': {
    await react('🧠'); if (!q) return reply(`Usage: ${activePrefix}gpt4 <question>`);
    try {
        let result = null;
        try { const d = await PAXSENIX.post('/ai/gpt-4o', { message: q }); result = d?.result || d?.response || d?.message; } catch {}
        if (!result) { try { const { data } = await axios.get(`https://api.dreaded.site/api/chatgpt4?text=${encodeURIComponent(q)}`, { timeout: 30000 }); result = data?.result || data?.response; } catch {} }
        if (!result) { try { const { data } = await axios.get(`https://api.giftedtech.co.ke/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(q)}`, { timeout: 15000 }); result = data?.result; } catch {} }
        if (result) await reply(`🧠 *GPT-4o:*\n\n${result}`);
        else reply('⚠️ GPT-4 unavailable right now. Try .ai command.');
    } catch (e) { reply(`⚠️ Error: ${e.message}`); }
    break;
}
case 'gemini': {
    await react('💎'); if (!q) return reply(`Usage: ${activePrefix}gemini <question>`);
    try {
        let result = null;
        try { const d = await PAXSENIX.post('/ai/gemini-2.0-flash', { message: q }); result = d?.result || d?.response; } catch {}
        if (!result) { try { const { data } = await axios.get(`https://api.dreaded.site/api/gemini?text=${encodeURIComponent(q)}`, { timeout: 30000 }); result = data?.result || data?.response; } catch {} }
        if (!result) { try { const { data } = await axios.get(`https://api.giftedtech.co.ke/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(q)}`, { timeout: 15000 }); result = data?.result; } catch {} }
        if (result) await reply(`💎 *Gemini 2.0 Flash:*\n\n${result}`);
        else reply('⚠️ Gemini unavailable right now. Try .ai command.');
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}
case 'llama': {
    await react('🦙'); if (!q) return reply(`Usage: ${activePrefix}llama <q>`);
    try {
        let result = null;
        try { const { data } = await axios.get(`${config.NEXRAY_API}/ai/llamacoder?model=qwen3-coder&prompt=${encodeURIComponent(q)}`, { timeout: 30000 }); result = data?.result || data?.response; } catch {}
        if (!result) { try { const d = await PAXSENIX.post('/ai/llama-3.1-8b', { message: q }); result = d?.result || d?.response; } catch {} }
        if (result) await reply(`🦙 *LLaMA:*\n\n${result}`);
        else reply('⚠️ LLaMA unavailable. Try .ai command.');
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}
case 'deepseek': {
    await react('🧬'); if (!q) return reply(`Usage: ${activePrefix}deepseek <q>`);
    try {
        let result = null;
        try { const d = await PAXSENIX.post('/ai/deepseek-v3', { message: q }); result = d?.result || d?.response; } catch {}
        if (!result) { try { const { data } = await axios.get(`https://api.dreaded.site/api/deepseek?text=${encodeURIComponent(q)}`, { timeout: 30000 }); result = data?.result || data?.response; } catch {} }
        if (!result) { try { const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/deepseek?text=${encodeURIComponent(q)}`, { timeout: 20000 }); result = data?.result; } catch {} }
        if (result) await reply(`🧬 *DeepSeek V3:*\n\n${result}`);
        else reply('⚠️ DeepSeek unavailable. Try .ai command.');
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}
case 'mathgpt': { await react('🔢'); if (!q) return reply(`Usage: ${activePrefix}mathgpt <math>`); try { const { data } = await axios.get(`${config.ELITE_API}/mathgpt?question=${encodeURIComponent(q)}`, { timeout: 30000 }); const t = data?.result || data?.answer; if (t) await reply(`🔢 *MathGPT:*\n\n${t}`); else reply('⚠️ Unavailable.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'aicode': {
    await react('💻'); if (!q) return reply(`Usage: ${activePrefix}aicode <code question>`);
    try {
        let result = null;
        try { const d = await PAXSENIX.post('/ai/gpt-4o', { message: `Write code for: ${q}. Respond with clean, commented code.` }); result = d?.result || d?.response; } catch {}
        if (!result) { try { const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/codegpt?prompt=${encodeURIComponent(q)}`, { timeout: 30000 }); result = data?.result || data?.response; } catch {} }
        if (result) await reply(`💻 *AI Code:*\n\n${result}`);
        else reply('⚠️ Code AI unavailable. Try .ai command.');
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}
case 'textdetect': { await react('🤖'); if (!q) return reply(`Usage: ${activePrefix}textdetect <text>`); try { const { data } = await axios.get(`${config.DAVID_API}/tools/aitextdetector?text=${encodeURIComponent(q)}`, { timeout: 30000 }); await reply(`🤖 *AI Text Detector:*\n\n${data?.result || JSON.stringify(data)}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }

// ─── IMAGE GENERATION ─────────────────────────────────────────────────────────
case 'imagine': case 'flux': case 'aiimg': case 'dalle': {
    await react('🎨'); if (!q) return reply(`Usage: ${activePrefix}${command} <prompt>`);
    try { const buf = await generateImage(q); await socket.sendMessage(from, { image: buf, caption: `🎨 *AI Image*\nPrompt: ${q}${WM}` }, { quoted: fakeCard }); }
    catch (e) { reply(`⚠️ Image generation failed: ${e.message}`); }
    break;
}
case 'gptimage': {
    await react('📸'); if (!q) return reply(`Usage: ${activePrefix}gptimage <prompt>`);
    try {
        let imgUrl = null;
        try { const { data } = await axios.get(`${config.NEXRAY_EU}/ai/gptimage?param=${encodeURIComponent(q)}`, { timeout: 60000 }); imgUrl = data?.result || data?.imageUrl || data?.url; } catch {}
        if (!imgUrl) { try { const { data } = await axios.post(`${config.NEXRAY_EU}/ai/v1/text2image`, { prompt: q }, { timeout: 60000 }); imgUrl = data?.result || data?.imageUrl || data?.url; } catch {} }
        if (!imgUrl) { try { const { data } = await axios.get(`${config.NEXRAY_API}/ai/gptimage?prompt=${encodeURIComponent(q)}`, { timeout: 60000 }); imgUrl = data?.result || data?.imageUrl; } catch {} }
        if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) { await replyImg(imgUrl, `📸 *GPT Image*\nPrompt: ${q}`); }
        else { const buf = await generateImage(q); await socket.sendMessage(from, { image: buf, caption: `📸 *Image*\nPrompt: ${q}${WM}` }, { quoted: fakeCard }); }
    } catch (e) { reply(`⚠️ Error: ${e.message}`); }
    break;
}
case 'nanobanana': {
    await react('⚡');
    const qImgNb = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
    const hasImgNb = qImgNb?.imageMessage || msg.message?.imageMessage;
    if (!hasImgNb && !q) return reply(`Usage: ${activePrefix}nanobanana <prompt>\n_or reply to an image_`);
    try {
        let imgUrl = null;
        if (hasImgNb) { const imgObj = qImgNb?.imageMessage || msg.message.imageMessage; const s = await downloadContentFromMessage(imgObj, 'image'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); imgUrl = await uploadSmartMedia(b, 'image/jpeg'); }
        const prompt2 = q || 'enhance and improve this image';
        let result = null;
        try { const { data } = await axios.post(`${config.NEXRAY_EU}/ai/nanobanana`, { imageUrl: imgUrl || '', prompt: prompt2 }, { timeout: 60000 }); result = data?.result?.image || data?.imageUrl || data?.url; } catch {}
        if (!result) { try { const { data } = await axios.get(`${config.DAVID_API}/tools/nanobanana?imageUrl=${encodeURIComponent(imgUrl || '')}&prompt=${encodeURIComponent(prompt2)}`, { timeout: 60000 }); result = data?.result?.image || data?.imageUrl; } catch {} }
        if (result) await replyImg(result, `⚡ *Nano Banana:*\n${prompt2}`);
        else reply('⚠️ Failed.');
    } catch (e) { reply(`⚠️ Error: ${e.message}`); }
    break;
}
case 'sologo': { await react('🎨'); if (!q) return reply(`Usage: ${activePrefix}sologo <prompt>`); try { const { data } = await axios.get(`${config.NEXRAY_API}/ai/sologo?prompt=${encodeURIComponent(q)}`, { responseType: 'arraybuffer', timeout: 60000 }); await socket.sendMessage(from, { image: Buffer.from(data), caption: `🎨 *AI Logo*\nPrompt: ${q}${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'stablesd': { await react('🎨'); if (!q) return reply(`Usage: ${activePrefix}stablesd <prompt>`); try { const { data } = await axios.get(`${config.DAVID_API}/tools/stablediffusion?prompt=${encodeURIComponent(q)}`, { timeout: 60000 }); const imgUrl = data?.result?.image || data?.imageUrl; if (imgUrl) await replyImg(imgUrl, `🎨 *Stable Diffusion*\nPrompt: ${q}`); else reply('⚠️ Failed.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'veo': { await react('🎥'); if (!q) return reply(`Usage: ${activePrefix}veo <prompt>`); try { await reply(`🎥 *Generating AI video...*\n⏳ This can take up to a minute.`); const vUrl = await paxVideoJob('/ai-video/veo-3.1', q); if (vUrl) { await socket.sendMessage(from, { video: { url: vUrl }, caption: `🎥 *VEO Video*\nPrompt: ${q}${WM}` }, { quoted: fakeCard }); await react('✅'); } else await reply('⚠️ Video generation failed. Try again.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'txt2vid': case 'txt2video': case 'aivid': {
    await react('🎥'); if (!q) return reply(`Usage: ${activePrefix}txt2vid <prompt>`);
    await reply(`🎥 *Generating AI video...*\nPrompt: _${q}_\n⏳ This may take 30-60 seconds...`);
    try {
        let vidUrl = null;
        // Primary: Paxsenix VEO (reliable with API key)
        try { vidUrl = await paxVideoJob('/ai-video/veo-3.1', q); } catch {}
        // Fallback: Paxsenix VEO 2
        if (!vidUrl) { try { vidUrl = await paxVideoJob('/ai-video/veo-2', q); } catch {} }
        // Fallback: RunwayML via Paxsenix
        if (!vidUrl) { try { const { data: rwD } = await axios.post(`${config.PAXSENIX_URL}/ai-video/runway`, { prompt: q }, { headers: PAXSENIX.headers, timeout: 90000 }); vidUrl = rwD?.video_url || rwD?.url || rwD?.result; } catch {} }
        // Fallback: OKATSU
        if (!vidUrl) { try { const { data } = await axios.get(`${config.OKATSU_API}/ai/txt2video?text=${encodeURIComponent(q)}`, { timeout: 60000 }); vidUrl = data?.videoUrl || data?.result; } catch {} }
        // Fallback: Nexray text2video
        if (!vidUrl) { try { const { data: nxV } = await axios.post(`${config.NEXRAY_EU}/ai/text2video`, { prompt: q }, { timeout: 90000 }); vidUrl = nxV?.result || nxV?.video_url; } catch {} }
        if (!vidUrl) return reply('⚠️ Video generation failed. All services are busy. Try again later.');
        await socket.sendMessage(from, { video: { url: vidUrl }, caption: `🎥 *AI Video Generated!*\nPrompt: ${q}${WM}` }, { quoted: fakeCard });
        await react('✅');
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}
case 'suno': {
    await react('🎵'); if (!q) return reply(`Usage: ${activePrefix}suno <title>|<style>|<prompt>`);
    try { const parts = q.split('|').map(s => s.trim()); const title = parts[0] || q, style = parts[1] || 'pop', prompt = parts[2] || q; await reply(`🎵 Generating: "${title}"...`); const d = await PAXSENIX.post('/ai-music/suno-music/v3', { customMode: true, instrumental: false, title, style, prompt, model: 'V3_5' }); if (d?.audio_url || d?.url) await socket.sendMessage(from, { audio: { url: d.audio_url || d.url }, mimetype: 'audio/mpeg', caption: `🎵 *${title}*\nStyle: ${style}${WM}` }, { quoted: fakeCard }); else await reply('⚠️ Suno generation failed.'); }
    catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}
case 'txt2img': {
    if (!q) return reply(`Usage: ${activePrefix}txt2img <prompt> | <style>`);
    await react('🎨');
    const [p, s] = (q || '').split('|').map(x => x.trim());
    const finalStyle = ['photorealistic', 'digital-art', 'anime', 'fantasy', 'sci-fi', 'vintage'].includes(s) ? s : 'anime';
    try {
        let imgUrl = null;
        try { const { data } = await axios.post(`${config.NEXRAY_EU}/ai/v1/text2image`, { prompt: p || q, style: finalStyle }, { timeout: 60000 }); imgUrl = data?.result || data?.imageUrl || data?.url; } catch {}
        if (!imgUrl) { try { const { data } = await axios.get(`https://api.neoxr.eu/api/txt2img?prompt=${encodeURIComponent(p || q)}&style=${finalStyle}&apikey=Milik-Bot-OurinMD`, { timeout: 60000 }); if (data?.status && data?.data?.length) imgUrl = data.data[0].url; } catch {} }
        if (!imgUrl) { const buf = await generateImage(p || q); await socket.sendMessage(from, { image: buf, caption: `🎨 *Generated*\nPrompt: ${p || q}\nStyle: ${finalStyle}${WM}` }, { quoted: fakeCard }); break; }
        await socket.sendMessage(from, { image: { url: imgUrl }, caption: `🎨 *Generated*\nPrompt: ${p || q}\nStyle: ${finalStyle}${WM}` }, { quoted: fakeCard }); await react('✅');
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── SONG / PLAY — REPLACED WITH NEW MULTI-FALLBACK ENGINE ───────────────────
case 'play':
case 'ytmp3':
case 'song':
case 'yta': {
    if (!q) {
        await reply(`🎵 *${AI_SHORT_NAME} Play*\n\nUsage: ${activePrefix}play [song name]\nExample: ${activePrefix}play faded`);
        return;
    }

    try {
        await react('🎧');
        await reply(`⏳ *${AI_SHORT_NAME} Play*\n\nSearching: ${q}\nGive me a moment...`);

        // ---- PRIMARY API (David Cyril) ----
        let success = false;
        try {
            const response = await axios.get(`https://apis.davidcyril.name.ng/play?query=${encodeURIComponent(q)}&apikey=`, {
                timeout: 60000
            });

            const data = response.data;
            if (data.status && data.result?.download_url) {
                await reply(`🎵 *${AI_SHORT_NAME} Play*\n\nTitle: ${data.result.title || 'N/A'}\nDuration: ${data.result.duration || 'N/A'}\nViews: ${data.result.views?.toLocaleString() || 'N/A'}\n\nDownloading audio...`);

                const audioResponse = await axios.get(data.result.download_url, {
                    responseType: 'arraybuffer',
                    timeout: 120000
                });

                const audioBuffer = Buffer.from(audioResponse.data);
                const convertedBuffer = await formatAudio(audioBuffer);

                await socket.sendMessage(from, {
                    audio: convertedBuffer,
                    mimetype: "audio/mpeg",
                    fileName: `${data.result.title}.mp3`,
                    caption: `🎵 *${data.result.title}*\n👁️ ${data.result.views?.toLocaleString() || 'N/A'} views • ⏱️ ${data.result.duration || 'N/A'}${WM}`,
                    contextInfo: {
                        externalAdReply: {
                            thumbnailUrl: data.result.thumbnail,
                            title: data.result.title,
                            body: `👁️ ${data.result.views?.toLocaleString() || 'N/A'} views • ⏱️ ${data.result.duration || 'N/A'}`,
                            sourceUrl: data.result.video_url,
                            renderLargerThumbnail: true,
                            mediaType: 1
                        }
                    }
                }, { quoted: msg });

                await react('✅');
                success = true;
            } else {
                throw new Error('No download URL from David Cyril');
            }
        } catch (primaryError) {
            console.error('[PLAY] Primary API failed, using fallback:', primaryError.message);
            // Fallback to multi-endpoint system
            try {
                let videoUrl = q;
                let videoTitle = "YouTube Audio";
                let videoTimestamp = "";

                if (!q.includes('youtube.com') && !q.includes('youtu.be')) {
                    const searchResponse = await yts(q);
                    if (!searchResponse.videos || searchResponse.videos.length === 0) {
                        throw new Error('No results found');
                    }
                    const video = searchResponse.videos[0];
                    videoUrl = video.url;
                    videoTitle = video.title;
                    videoTimestamp = video.timestamp || "Unknown";
                }

                await reply(`🔥 Fallback: found "${videoTitle.substring(0, 50)}", downloading...`);
                await socket.sendPresenceUpdate('recording', from);

                let buffer = Buffer.alloc(0);
                const result = await queryAudioEndpoints(videoUrl, 30000);
                if (result.success && result.download_url) buffer = await ossBuffer(result.download_url);
                if (!isValidBuffer(buffer)) {
                    const retry = await queryAudioEndpoints(videoUrl, 30000);
                    if (retry.success && retry.download_url) buffer = await ossBuffer(retry.download_url);
                }
                // Every public API failed — fall back to the local yt-dlp / ytdl-core engine
                if (!isValidBuffer(buffer)) { await reply('🛠️ Public APIs are down, using the local engine...'); buffer = await localYtAudio(videoUrl); }
                if (!isValidBuffer(buffer)) throw new Error('All download methods failed');

                const convertedBuffer = await formatAudio(buffer);
                if (convertedBuffer.length <= 16 * 1024 * 1024) {
                    await socket.sendMessage(from, {
                        audio: convertedBuffer,
                        mimetype: "audio/mpeg",
                        caption: `🎵 *${videoTitle.substring(0, 80)}*\n⏱️ *Duration:* ${videoTimestamp}\n\n> ${AI_SHORT_NAME} — WhiteKid Tech`
                    }, { quoted: msg });
                } else {
                    await socket.sendMessage(from, {
                        document: convertedBuffer,
                        mimetype: "audio/mpeg",
                        fileName: `${videoTitle.replace(/[^\w\s.-]/gi, '').substring(0, 50)}.mp3`,
                        caption: `🎵 *${videoTitle.substring(0, 80)}*\n\n_File too large - sent as document_`
                    }, { quoted: msg });
                }
                await react('✅');
                success = true;
            } catch (fallbackError) {
                console.error('[PLAY] Fallback also failed:', fallbackError.message);
                throw new Error('All download methods failed');
            }
        }

        if (!success) throw new Error('Could not complete download');

        // Optional: send a "Download Again" button
        await sendButtons(socket, from, {
            title: "✅ AUDIO READY",
            text: `🎵 *${q}* has been sent!`,
            footer: "Play again?",
            buttons: [
                { text: "🔄 Download Again", id: `${activePrefix}play ${q}` }
            ]
        });

    } catch (error) {
        console.error('[PLAY ERROR]', error.message);
        await react('⚠️');
        await reply(`⚠️ *${AI_SHORT_NAME} Play*\n\nMusic service is napping. Try again in a moment.\n\nError: ${error.message.substring(0, 100)}`);
    }
    break;
}
// ─── VIDEO ────────────────────────────────────────────────────────────────────
case 'video': case 'ytmp4': {
    if (!q) return reply(`❗ Usage: ${activePrefix}video <youtube url or search>`);
    await react('🎬');
    try {
        let videoUrl = q;
        if (!/youtu/.test(q)) { const vi = await ytGetInfo(q); if (!vi) return reply('⚠️ No video found.'); videoUrl = vi.url || `https://www.youtube.com/watch?v=${vi.id}`; }
        await reply('⬇️ Downloading video...');
        const dlUrl = await ytDownloadMp4(videoUrl);
        if (dlUrl) { await socket.sendMessage(from, { video: { url: dlUrl }, mimetype: 'video/mp4', caption: `🎬 Video downloaded${WM}` }, { quoted: fakeCard }); await react('✅'); break; }
        const localVid = await localYtVideo(videoUrl);
        if (!isValidBuffer(localVid)) return reply('⚠️ All video download services failed.');
        await socket.sendMessage(from, { video: localVid, mimetype: 'video/mp4', caption: `🎬 Video downloaded${WM}` }, { quoted: fakeCard }); await react('✅');
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── QUOTES ─────────────────────────────────────────────────────────
case 'heartbreak': {
    try {
        await socket.sendMessage(from, { react: { text: '💔', key: msg.key } });
        const response = await axios.get('https://api.giftedtech.co.ke/api/fun/heartbreak?apikey=gifted');
        
        if (response.data.status && response.data.result) {
            await socket.sendMessage(from, {
                text: `💔 *Heartbreak Quote*\n\n${response.data.result}\n\n_powered by whitekid tech_`
            }, { quoted: msg });
        } else {
            await socket.sendMessage(from, {
                text: '❌ Failed to fetch heartbreak quote.'
            }, { quoted: msg });
        }
    } catch (error) {
        console.error('Heartbreak command error:', error);
        await socket.sendMessage(from, {
            text: '❌ Error fetching heartbreak quote.'
        }, { quoted: msg });
    }
    break;
}

case 'friendship': {
    try {
        await socket.sendMessage(from, { react: { text: '🤝', key: msg.key } });
        const response = await axios.get('https://api.giftedtech.co.ke/api/fun/friendship?apikey=gifted');
        
        if (response.data.status && response.data.result) {
            await socket.sendMessage(from, {
                text: `🤝 *Friendship Quote*\n\n${response.data.result}\n\n_powered by whitekid tech_`
            }, { quoted: msg });
        } else {
            await socket.sendMessage(from, {
                text: '❌ Failed to fetch friendship quote.'
            }, { quoted: msg });
        }
    } catch (error) {
        console.error('Friendship command error:', error);
        await socket.sendMessage(from, {
            text: '❌ Error fetching friendship quote.'
        }, { quoted: msg });
    }
    break;
}

case 'love': {
    try {
        await socket.sendMessage(from, { react: { text: '❤️', key: msg.key } });
        const response = await axios.get('https://api.giftedtech.co.ke/api/fun/love?apikey=gifted');
        
        if (response.data.status && response.data.result) {
            await socket.sendMessage(from, {
                text: `❤️ *Love Quote*\n\n${response.data.result}\n\n_powered by whitekid tech_`
            }, { quoted: msg });
        } else {
            await socket.sendMessage(from, {
                text: '❌ Failed to fetch love quote.'
            }, { quoted: msg });
        }
    } catch (error) {
        console.error('Love command error:', error);
        await socket.sendMessage(from, {
            text: '❌ Error fetching love quote.'
        }, { quoted: msg });
    }
    break;
}

case 'newyear': {
    try {
        await socket.sendMessage(from, { react: { text: '🎉', key: msg.key } });
        const response = await axios.get('https://api.giftedtech.co.ke/api/fun/newyear?apikey=gifted');
        
        if (response.data.status && response.data.result) {
            await socket.sendMessage(from, {
                text: `🎉 *New Year Message*\n\n${response.data.result}\n\n_powered by whitekid tech_`
            }, { quoted: msg });
        } else {
            await socket.sendMessage(from, {
                text: '❌ Failed to fetch New Year message.'
            }, { quoted: msg });
        }
    } catch (error) {
        console.error('Newyear command error:', error);
        await socket.sendMessage(from, {
            text: '❌ Error fetching New Year message.'
        }, { quoted: msg });
    }
    break;
}

case 'boyfriendsday': {
    try {
        await socket.sendMessage(from, { react: { text: '💙', key: msg.key } });
        const response = await axios.get('https://api.giftedtech.co.ke/api/fun/boyfriendsday?apikey=gifted');
        
        if (response.data.status && response.data.result) {
            await socket.sendMessage(from, {
                text: `💙 *Boyfriend's Day Message*\n\n${response.data.result}\n\n_powered by whitekid tech_`
            }, { quoted: msg });
        } else {
            await socket.sendMessage(from, {
                text: '❌ Failed to fetch Boyfriend\'s Day message.'
            }, { quoted: msg });
        }
    } catch (error) {
        console.error('Boyfriendsday command error:', error);
        await socket.sendMessage(from, {
            text: '❌ Error fetching Boyfriend\'s Day message.'
        }, { quoted: msg });
    }
    break;
}

case 'christmas': {
    try {
        await socket.sendMessage(from, { react: { text: '🎄', key: msg.key } });
        const response = await axios.get('https://api.giftedtech.co.ke/api/fun/christmas?apikey=gifted');
        
        if (response.data.status && response.data.result) {
            await socket.sendMessage(from, {
                text: `🎄 *Christmas Message*\n\n${response.data.result}\n\n_powered by whitekid tech_`
            }, { quoted: msg });
        } else {
            await socket.sendMessage(from, {
                text: '❌ Failed to fetch Christmas message.'
            }, { quoted: msg });
        }
    } catch (error) {
        console.error('Christmas command error:', error);
        await socket.sendMessage(from, {
            text: '❌ Error fetching Christmas message.'
        }, { quoted: msg });
    }
    break;
}

case 'mothersday': {
    try {
        await socket.sendMessage(from, { react: { text: '👩', key: msg.key } });
        const response = await axios.get('https://api.giftedtech.co.ke/api/fun/mothersday?apikey=gifted');
        
        if (response.data.status && response.data.result) {
            await socket.sendMessage(from, {
                text: `👩‍👧‍👦 *Mother's Day Message*\n\n${response.data.result}\n\n_powered by whitekid tech_`
            }, { quoted: msg });
        } else {
            await socket.sendMessage(from, {
                text: '❌ Failed to fetch Mother\'s Day message.'
            }, { quoted: msg });
        }
    } catch (error) {
        console.error('Mothersday command error:', error);
        await socket.sendMessage(from, {
            text: '❌ Error fetching Mother\'s Day message.'
        }, { quoted: msg });
    }
    break;
}

// ─── LYRICS — ENHANCED WITH LRCLIB FALLBACK ───────────────────────────────────
case 'lyrics': case 'lyric': case 'lirik': {
    if (!q) return reply(`❗ Usage: ${activePrefix}lyrics <song name>\n\n📌 Example: ${activePrefix}lyrics Shape of You`);
    await react('🎶');
    try {
        // Try lrclib for rich metadata first
        let lyricsText = null, trackTitle = q, artistName = '';
        try {
            const { data: lrcData } = await axios.get(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`, { timeout: 15000 });
            if (lrcData?.[0]) {
                const r = lrcData[0];
                trackTitle = r.trackName || q;
                artistName = r.artistName || '';
                lyricsText = r.plainLyrics || r.syncedLyrics?.replace(/\[\d+:\d+\.\d+\]/g, '').trim();
            }
        } catch {}

        // Fallback to other engines
        if (!lyricsText) lyricsText = await getLyrics(q);

        if (lyricsText) {
            const header = artistName
                ? `🎶 *${trackTitle}*\n🎤 *Artist:* ${artistName}\n\n`
                : `🎶 *Lyrics: ${q}*\n\n`;
            await reply(`${header}${lyricsText.substring(0, 3500)}`);
        } else {
            await reply(`⚠️ Lyrics not found for *${q}*\n\n_Try a more specific title._`);
        }
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── AIO DOWNLOADER ───────────────────────────────────────────────────────────
case 'aio': case 'alldown': {
    if (!q) return reply(`❗ Usage: ${activePrefix}aio <url>\n\nSupports: YouTube, TikTok, Instagram, Facebook, Twitter, and more!`);
    await react('⬇️'); await reply(`⬇️ Downloading from: ${q.substring(0, 60)}...`);
    try {
        const result = await aioDownload(q);
        if (!result) return reply('⚠️ Could not download from that URL.');
        const video = result.video || result.mp4 || result.download_url;
        const audio = result.audio || result.mp3;
        const image = result.image || result.photo || result.thumbnail;
        const title = result.title || result.name || 'Downloaded file';
        if (video) { await socket.sendMessage(from, { video: { url: video }, mimetype: 'video/mp4', caption: `⬇️ *${title}*${WM}` }, { quoted: fakeCard }); }
        else if (audio) { await socket.sendMessage(from, { audio: { url: audio }, mimetype: 'audio/mpeg', ptt: false }, { quoted: fakeCard }); }
        else if (image) { await replyImg(image, `⬇️ *${title}*`); }
        else reply('⚠️ No downloadable media found in that URL.');
        await react('✅');
    } catch (e) { reply(`⚠️ AIO download failed: ${e.message}`); }
    break;
}

// ─── FACEBOOK ─────────────────────────────────────────────────────────────────
case 'fb': case 'facebook': {
    if (!q) return reply(`❗ Usage: ${activePrefix}fb <url>`);
    await react('📘');
    try {
        let vidUrl = null;
        for (const fn of [
            async () => { const { data } = await axios.get(`${config.NAYAN_API}/alldown?url=${encodeURIComponent(q)}`, { timeout: 30000 }); return data?.result?.video || data?.video; },
            async () => { const { data } = await axios.get(`${config.ELITE_API}/facebook?url=${encodeURIComponent(q)}`, { timeout: 30000 }); return data?.result?.download_url || data?.hd_video || data?.sd_video; },
            async () => { const { data } = await axios.get(`https://suhas-bro-api.vercel.app/download/fbdown?url=${encodeURIComponent(q)}`); return data?.result?.sd || data?.result?.hd; }
        ]) { try { const r = await fn(); if (r) { vidUrl = r; break; } } catch {} }
        if (!vidUrl) return reply('⚠️ Failed to fetch Facebook video.');
        await socket.sendMessage(from, { video: { url: vidUrl }, mimetype: 'video/mp4', caption: `📘 Facebook Video${WM}` }, { quoted: fakeCard }); await react('✅');
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── TIKTOK ───────────────────────────────────────────────────────────────────
case 'tiktok': case 'ttdl': {
    if (!q) return reply(`❗ Usage: ${activePrefix}tiktok <url>`);
    await react('🎵');
    try {
        let vidUrl = null, titleT = '', coverUrl = null;
        for (const fn of [
            async () => { const { data } = await axios.get(`${config.PREXZY_API}/download/tiktokvideo?url=${encodeURIComponent(q)}`, { timeout: 30000 }); if (data?.result?.video) { vidUrl = data.result.video; titleT = data.result.title || ''; coverUrl = data.result.cover; return true; } },
            async () => { const { data } = await axios.get(`${config.GIFTED_TECH_API}/api/download/tiktok?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(q)}`, { timeout: 30000 }); if (data?.success && data?.result?.video) { vidUrl = data.result.video; titleT = data.result.title || ''; coverUrl = data.result.cover; return true; } },
            async () => { const { data } = await axios.get(`${config.NAYAN_API}/alldown?url=${encodeURIComponent(q)}`, { timeout: 30000 }); if (data?.result?.video) { vidUrl = data.result.video; return true; } }
        ]) { try { const r = await fn(); if (r) break; } catch {} }
        if (!vidUrl) return reply('⚠️ Failed to fetch TikTok video.');
        if (coverUrl) await socket.sendMessage(from, { image: { url: coverUrl }, caption: `🎵 *TikTok*\n${titleT}${WM}` }, { quoted: fakeCard });
        await socket.sendMessage(from, { video: { url: vidUrl }, mimetype: 'video/mp4', caption: `🎥 TikTok Video${WM}` }, { quoted: fakeCard }); await react('✅');
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── INSTAGRAM ────────────────────────────────────────────────────────────────
case 'ig': case 'insta': {
    if (!q) return reply(`❗ Usage: ${activePrefix}ig <instagram url>`);
    await react('📸');
    try {
        let vidUrl = null;
        for (const fn of [
            async () => { const { data } = await axios.get(`${config.NAYAN_API}/instagram?url=${encodeURIComponent(q)}`, { timeout: 30000 }); return data?.result?.download_url || data?.url || data?.video; },
            async () => { const { data } = await axios.get(`${config.GIFTED_TECH_API}/api/download/instadl?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(q)}`, { timeout: 30000 }); return data?.result?.download_url; },
            async () => { const { data } = await axios.get(`${config.PREXZY_API}/download/aio?url=${encodeURIComponent(q)}`, { timeout: 30000 }); return data?.result?.video || data?.video; },
            async () => { const { igdl } = require('ruhend-scraper'); const res = await igdl(q); return res.data?.[0]?.url; }
        ]) { try { const r = await fn(); if (r) { vidUrl = r; break; } } catch {} }
        if (!vidUrl) return reply('⚠️ Failed to fetch Instagram content.');
        await socket.sendMessage(from, { video: { url: vidUrl }, mimetype: 'video/mp4', caption: `📸 Instagram Video${WM}` }, { quoted: fakeCard }); await react('✅');
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── TWITTER ──────────────────────────────────────────────────────────────────
case 'twitter': case 'x': case 'twdl': {
    if (!q) return reply(`❗ Usage: ${activePrefix}twitter <url>`);
    await react('🐦');
    try {
        let vidUrl = null;
        for (const fn of [
            async () => { const { data } = await axios.get(`${config.NAYAN_API}/alldown?url=${encodeURIComponent(q)}`, { timeout: 30000 }); return data?.result?.video || data?.video; },
            async () => { const { data } = await axios.get(`${config.DAVID_API}/download/twitter?url=${encodeURIComponent(q)}`, { timeout: 30000 }); return data?.result?.videoUrls?.[0]?.url || data?.result?.download_url; },
            async () => { const { data } = await axios.get(`${config.GIFTED_TECH_API}/api/download/twitter?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(q)}`, { timeout: 30000 }); return data?.result?.videoUrls?.[0]?.url; }
        ]) { try { const r = await fn(); if (r) { vidUrl = r; break; } } catch {} }
        if (!vidUrl) return reply('⚠️ No video found.');
        await socket.sendMessage(from, { video: { url: vidUrl }, mimetype: 'video/mp4', caption: `🐦 Twitter Video${WM}` }, { quoted: fakeCard }); await react('✅');
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── MEDIAFIRE — ENHANCED ─────────────────────────────────────────────────────
case 'mediafire': case 'mfdl': {
    if (!q) return reply(`❗ Usage: ${activePrefix}mediafire <url>`);
    await react('☁️');
    try {
        const result = await mediafireDl(q);
        if (!result?.link) return reply('⚠️ Failed to fetch MediaFire download link.');

        const fileName = result.name || 'file';
        const fileSize = result.size || 'Unknown';
        const fileExt = (fileName.split('.').pop() || 'bin').toLowerCase();

        await reply(`📁 *${fileName}*\n📦 *Size:* ${fileSize}\n⬇️ _Downloading..._`);

        // Try to send as document — works for most file types
        await socket.sendMessage(from, {
            document: { url: result.link },
            fileName: fileName,
            mimetype: result.mimetype || 'application/octet-stream',
            caption: `☁️ *MediaFire*\n📁 ${fileName}\n📦 ${fileSize}${WM}`
        }, { quoted: fakeCard });

        await react('✅');
    } catch (e) { reply(`⚠️ MediaFire error: ${e.message}`); }
    break;
}

// ─── APK ──────────────────────────────────────────────────────────────────────
case 'apk': {
    if (!q) return reply(`❗ Usage: ${activePrefix}apk <app name>\n\nExample: ${activePrefix}apk ha tunnel`);
    await react('📦');
    await reply(`🔎 *Searching APK:* ${q}`);
    try {
        let results = [];
        // Search using multiple APIs
        try { const { data } = await axios.get(`${config.DISCARD_API}/api/apk/search?apikey=guru&q=${encodeURIComponent(q)}`, { timeout: 15000 }); if (data?.result?.length) results = data.result.slice(0, 5); } catch {}
        if (!results.length) { try { const r = await fetch(`https://api.nexoracle.com/downloader/apk?q=${encodeURIComponent(q)}&apikey=free_key@maher_apis`); const d = await r.json(); if (d?.status === 200 && d?.result) results = [{ judul: d.result.name, dev: d.result.package, rating: d.result.rating || 'N/A', link: d.result.dllink, thumb: d.result.icon }]; } catch {} }
        if (!results.length) { try { const { data } = await axios.get(`${config.QASIM_API}/api/apkpure/search?q=${encodeURIComponent(q)}`, { timeout: 15000 }); if (data?.result?.length) results = data.result.slice(0, 3); } catch {} }
        if (!results.length) { try { const { data: apkX } = await axios.get(`${config.NEXRAY_API}/downloader/apk?q=${encodeURIComponent(q)}`, { timeout: 15000 }); if (apkX?.result?.length) results = apkX.result.slice(0, 3); } catch {} }
        if (!results.length) return reply('⚠️ No APKs found for: ' + q);

        // Take first result and send details + image
        const top = results[0];
        const appName = (top.judul || top.name || q).substring(0, 60);
        const appDev = top.dev || top.developer || 'N/A';
        const appRating = top.rating || 'N/A';
        const appThumb = top.thumb || top.icon || botImg;

        // Send app details with image
        await socket.sendMessage(from, {
            image: { url: appThumb },
            caption: `📦 *${appName}*\n👨‍💻 *Dev:* ${appDev}\n⭐ *Rating:* ${appRating}\n\n⬇️ _Downloading APK file..._${WM}\n`
        }, { quoted: fakeCard });

        // Download and send APK
        try {
            let apkUrl = null, apkName = appName, apkSize = 'N/A', apkReq = 'N/A';
            // Try DISCARD API download
            try {
                const dlUrl = `${config.DISCARD_API}/api/apk/dl/android1?apikey=guru&url=${encodeURIComponent(top.link || top.url || '')}`;
                const { data: dlRes } = await axios.get(dlUrl, { timeout: 60000 });
                const apk = dlRes?.result;
                if (apk?.url) { apkUrl = apk.url; apkName = apk.name || appName; apkSize = apk.size || 'N/A'; apkReq = apk.requirement || 'N/A'; }
            } catch {}
            // Fallback: use top.link directly
            if (!apkUrl && (top.link || top.dllink || top.url)) apkUrl = top.link || top.dllink || top.url;
            if (!apkUrl) throw new Error('No APK URL found');
            const safeName = apkName.replace(/[^\w.-]/g, '_');
            await socket.sendMessage(from, {
                document: { url: apkUrl },
                fileName: `${safeName}.apk`,
                mimetype: 'application/vnd.android.package-archive',
                caption: `✅ *${apkName}*\n📦 *Size:* ${apkSize}\n📱 *Requires:* ${apkReq}${WM}\n`
            }, { quoted: fakeCard });
            await react('✅');
        } catch (e) { await reply(`⚠️ APK download failed: ${e.message}\nTry a more specific app name.`); }
    } catch (e) { reply(`⚠️ APK error: ${e.message}`); }
    break;
}

// ─── WEBP TO MP4 ──────────────────────────────────────────────────────────────
case 'webp2mp4': case 'webptomp4': {
    await react('🎞️');
    // Extract sticker from quoted message (Baileys contextInfo pattern)
    const wCtx = msg.message?.extendedTextMessage?.contextInfo;
    const wQuoted = wCtx?.quotedMessage;
    const stickerMsgW = wQuoted?.stickerMessage || msg.message?.stickerMessage;
    if (!stickerMsgW) return reply('⚠️ Reply to a sticker to convert it to MP4.');
    try {
        const s = await downloadContentFromMessage(stickerMsgW, 'sticker'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]);
        const tmpWebp = path.join(os.tmpdir(), `sticker_${Date.now()}.webp`); fs.writeFileSync(tmpWebp, b);
        await reply('⏳ Converting WebP to MP4...');
        const result = await webp2mp4File(tmpWebp);
        try { fs.unlinkSync(tmpWebp); } catch {}
        if (result?.result) { await socket.sendMessage(from, { video: { url: result.result }, mimetype: 'video/mp4', caption: `🎞️ *WebP → MP4*${WM}` }, { quoted: fakeCard }); await react('✅'); }
        else reply('⚠️ Conversion failed.');
    } catch (e) { reply(`⚠️ WebP→MP4 error: ${e.message}`); }
    break;
}

// ─── STICKER TO IMAGE — NEW (adapted from example toimg handler) ──────────────
case 'toimg': case 'stickertoimg': case 'sticker2img': {
    await react('🖼️');
    // Check for quoted sticker or image
    const qMsgToImg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
    const stickerMsgTI = qMsgToImg?.stickerMessage || msg.message?.stickerMessage;
    const imageMsgTI = qMsgToImg?.imageMessage || msg.message?.imageMessage;

    if (!stickerMsgTI && !imageMsgTI) {
        return reply('⚠️ Reply to a sticker (WebP) or image to convert it to PNG.\n\nUsage: Reply to sticker/image and send ' + activePrefix + 'toimg');
    }

    try {
        let mediaBuffer = Buffer.from([]);

        if (stickerMsgTI) {
            // Download sticker
            const stream = await downloadContentFromMessage(stickerMsgTI, 'sticker');
            for await (const chunk of stream) mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
        } else {
            // Download image
            const stream = await downloadContentFromMessage(imageMsgTI, 'image');
            for await (const chunk of stream) mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
        }

        if (!mediaBuffer || mediaBuffer.length === 0) return reply('⚠️ Failed to download media.');

        await reply('⏳ *Converting to PNG...*');

        // Convert using sharp (if available)
        let pngBuffer = null;
        if (sharp) {
            try {
                pngBuffer = await sharp(mediaBuffer)
                    .toFormat('png')
                    .png({ quality: 100, compressionLevel: 9 })
                    .toBuffer();
            } catch (sharpErr) {
                console.error('[TOIMG sharp]', sharpErr.message);
            }
        }

        // If sharp failed or unavailable, try ezgif webp2png via webp2mp4File approach
        if (!pngBuffer || pngBuffer.length === 0) {
            // Fallback: upload to catbox and use an online converter
            try {
                const webpUrl = await uploadToCatbox(mediaBuffer, 'image/webp');
                const { data: convData } = await axios.get(
                    `https://api.siputzx.my.id/api/tools/webp2png?url=${encodeURIComponent(webpUrl)}`,
                    { responseType: 'arraybuffer', timeout: 30000 }
                );
                pngBuffer = Buffer.from(convData);
            } catch {}
        }

        if (!pngBuffer || pngBuffer.length === 0) {
            return reply('⚠️ Conversion failed. Make sure sharp is installed (`npm install sharp`) or try again.');
        }

        await socket.sendMessage(from, {
            image: pngBuffer,
            caption: `🖼️ *Converted to PNG!*${WM}`
        }, { quoted: fakeCard });

        await react('✅');
    } catch (e) {
        console.error('[TOIMG]', e.message);
        reply(`⚠️ Conversion error: ${e.message}`);
    }
    break;
}

// ─── TELEGRAPH UPLOAD ─────────────────────────────────────────────────────────
case 'telegraph': case 'tph': {
    await react('📤');
    const quotedImgTph = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
    if (!quotedImgTph?.imageMessage && !msg.message?.imageMessage) return reply('❗ Reply to an image to upload to Telegraph.');
    try {
        const imgObj = quotedImgTph?.imageMessage || msg.message.imageMessage;
        const s = await downloadContentFromMessage(imgObj, 'image'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]);
        const ext = await fromBuffer(b).catch(() => ({ ext: 'jpg' }));
        const tmp = path.join(os.tmpdir(), `tph_${Date.now()}.${ext?.ext || 'jpg'}`); fs.writeFileSync(tmp, b);
        const url = await TelegraPh(tmp);
        try { fs.unlinkSync(tmp); } catch {}
        await reply(`📤 *Telegraph Upload:*\n\n🔗 ${url}`); await react('✅');
    } catch (e) { reply(`⚠️ Telegraph upload failed: ${e.message}`); }
    break;
}

// ─── UGUU UPLOAD ──────────────────────────────────────────────────────────────
case 'uploadugu': case 'uguu': {
    await react('📤');
    const quotedImgUgu = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
    const hasMediaUgu = quotedImgUgu?.imageMessage || quotedImgUgu?.videoMessage || quotedImgUgu?.audioMessage || msg.message?.imageMessage;
    if (!hasMediaUgu) return reply('❗ Reply to media (image/video/audio) to upload to Uguu.');
    try {
        const msgObj = quotedImgUgu?.imageMessage ? { obj: quotedImgUgu.imageMessage, type: 'image', ext: 'jpg' } : quotedImgUgu?.videoMessage ? { obj: quotedImgUgu.videoMessage, type: 'video', ext: 'mp4' } : quotedImgUgu?.audioMessage ? { obj: quotedImgUgu.audioMessage, type: 'audio', ext: 'ogg' } : { obj: msg.message.imageMessage, type: 'image', ext: 'jpg' };
        const s = await downloadContentFromMessage(msgObj.obj, msgObj.type); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]);
        const tmp = path.join(os.tmpdir(), `uguu_${Date.now()}.${msgObj.ext}`); fs.writeFileSync(tmp, b);
        const result = await UploadFileUgu(tmp);
        try { fs.unlinkSync(tmp); } catch {}
        if (result?.url) await reply(`📤 *Uguu Upload:*\n\n🔗 ${result.url}\n📁 ${result.name || 'file'}\n📦 ${result.size ? fmtBytes(result.size) : '?'}`);
        else reply('⚠️ Upload failed.');
        await react('✅');
    } catch (e) { reply(`⚠️ Uguu upload failed: ${e.message}`); }
    break;
}

// ─── VIEW ONCE ────────────────────────────────────────────────────────────────
case 'vv': case 'rvo': case 'viewonce': {
    await react('✨');
    await viewonceCommand(socket, from, msg, fakeCard);
    break;
}

// ─── STICKER ──────────────────────────────────────────────────────────────────
case 'sticker': case 's': {
    await react('✨');
    try {
        // Properly extract media from quoted message (Baileys contextInfo)
        const sCtx = msg.message?.extendedTextMessage?.contextInfo;
        const sQuotedMsg = sCtx?.quotedMessage;
        const sCurMsg = msg.message;
        const sSrc = sQuotedMsg || sCurMsg;
        const sMediaType = ['imageMessage','videoMessage'].find(t => sSrc?.[t]);
        if (!sMediaType) return socket.sendMessage(from, { text: '⚠️ Reply to an image or video to make a sticker!' }, { quoted: msg });
        const sMediaObj = sSrc[sMediaType];
        const sDlType = sMediaType.replace('Message','');
        const sStream = await downloadContentFromMessage(sMediaObj, sDlType);
        let mediaBuf = Buffer.from([]);
        for await (const chunk of sStream) mediaBuf = Buffer.concat([mediaBuf, chunk]);
        if (!mediaBuf.length) throw new Error('Empty buffer');
        await socket.sendMessage(from, { sticker: mediaBuf }, { quoted: msg });
        await react('✅');
    } catch (e) { await socket.sendMessage(from, { text: `💔 Failed to create sticker: ${e.message}` }, { quoted: msg }); }
    break;
}

// ─── TOGIF ────────────────────────────────────────────────────────────────────
case 'togif': {
    await react('⏳');
    // Extract sticker from quoted message (Baileys contextInfo pattern)
    const gifCtx = msg.message?.extendedTextMessage?.contextInfo;
    const gifQuoted = gifCtx?.quotedMessage;
    const stickerMsg = gifQuoted?.stickerMessage || msg.message?.stickerMessage;
    if (!stickerMsg) return reply('⚠️ Reply to an animated sticker with .togif');
    const td = path.join(process.cwd(), 'temp'); if (!fs.existsSync(td)) fs.mkdirSync(td, { recursive: true });
    const ip = path.join(td, `togif_${Date.now()}.webp`), op = path.join(td, `togif_${Date.now()}.gif`);
    try { const s = await downloadContentFromMessage(stickerMsg, 'sticker'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); fs.writeFileSync(ip, b); if (!ffmpeg) return reply('⚠️ ffmpeg not available.'); await new Promise((res, rej) => { ffmpeg(ip).outputOptions(['-vf', 'fps=10,scale=512:512:force_original_aspect_ratio=decrease', '-loop', '0']).save(op).on('end', res).on('error', rej); }); await socket.sendMessage(from, { video: fs.readFileSync(op), mimetype: 'video/gif', caption: '🎞️ Converted GIF' }, { quoted: fakeCard }); await react('✅'); } catch (e) { reply(`⚠️ ${e.message}`); } finally { try { fs.unlinkSync(ip); fs.unlinkSync(op); } catch {} }
    break;
}

// ─── REMINI ───────────────────────────────────────────────────────────────────
case 'remini': {
    await react('🪄');
    const qi = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
    if (!qi?.imageMessage && !msg.message?.imageMessage) return reply('❗ Reply to an image');
    try {
        const imgObj = qi?.imageMessage || msg.message.imageMessage;
        const s = await downloadContentFromMessage(imgObj, 'image'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]);
        const imgUrl = await uploadSmartMedia(b, 'image/jpeg');
        let enhanced = null;
        for (const fn of [async () => { const { data } = await axios.get(`${config.DAVID_API}/tools/remini?imageUrl=${encodeURIComponent(imgUrl)}`, { timeout: 60000 }); return data?.result?.image || data?.imageUrl; }, async () => { const { data } = await axios.get(`https://api.siputzx.my.id/api/tools/remini?url=${encodeURIComponent(imgUrl)}`, { timeout: 60000 }); return data?.result || data?.url; }]) { try { const r = await fn(); if (r) { enhanced = r; break; } } catch {} }
        if (enhanced) await socket.sendMessage(from, { image: { url: enhanced }, caption: `🪄 *Remini Enhanced!*${WM}` }, { quoted: fakeCard });
        else reply('⚠️ Remini failed.');
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── REMOVEBG ─────────────────────────────────────────────────────────────────
case 'removebg': {
    await react('✂️');
    const qiRb = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
    const hasImgRb = qiRb?.imageMessage || msg.message?.imageMessage;
    if (!hasImgRb && !q) return reply('❗ Reply to an image or provide URL.');
    try {
        let imgUrl = q;
        if (!imgUrl || !imgUrl.startsWith('http')) { const imgObj = qiRb?.imageMessage || msg.message.imageMessage; const s = await downloadContentFromMessage(imgObj, 'image'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); imgUrl = await uploadSmartMedia(b, 'image/jpeg'); }
        const { data } = await axios.get(`https://api.siputzx.my.id/api/iloveimg/removebg?image=${encodeURIComponent(imgUrl)}`, { responseType: 'arraybuffer', timeout: 60000 });
        if (data) await socket.sendMessage(from, { image: Buffer.from(data), caption: `✂️ *Background Removed!*${WM}` }, { quoted: fakeCard });
        else reply('⚠️ RemoveBG failed.');
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── IMAGE EDITORS ────────────────────────────────────────────────────────────
case 'wasted': { await react('💀'); const qi2 = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message; if (!qi2?.imageMessage && !msg.message?.imageMessage) return reply('❗ Reply to an image'); try { const imgObj = qi2?.imageMessage || msg.message.imageMessage; const s = await downloadContentFromMessage(imgObj, 'image'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); const imgUrl = await uploadSmartMedia(b, 'image/jpeg'); const { data } = await axios.get(`${config.NEXRAY_API}/editor/wasted?url=${encodeURIComponent(imgUrl)}`, { responseType: 'arraybuffer', timeout: 30000 }); await socket.sendMessage(from, { image: Buffer.from(data), caption: `💀 *WASTED!*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'jail': { await react('🚔'); const qi3 = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message; if (!qi3?.imageMessage && !msg.message?.imageMessage) return reply('❗ Reply to an image'); try { const imgObj = qi3?.imageMessage || msg.message.imageMessage; const s = await downloadContentFromMessage(imgObj, 'image'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); const imgUrl = await uploadSmartMedia(b, 'image/jpeg'); const { data } = await axios.get(`https://api.siputzx.my.id/api/maker/jail?url=${encodeURIComponent(imgUrl)}`, { responseType: 'arraybuffer', timeout: 30000 }); await socket.sendMessage(from, { image: Buffer.from(data), caption: `🚔 *JAILED!*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'wanted': { await react('🎯'); const qi4 = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message; if (!qi4?.imageMessage && !msg.message?.imageMessage) return reply('❗ Reply to an image'); try { const imgObj = qi4?.imageMessage || msg.message.imageMessage; const s = await downloadContentFromMessage(imgObj, 'image'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); const imgUrl = await uploadSmartMedia(b, 'image/jpeg'); const { data } = await axios.get(`${config.NEXRAY_API}/editor/wanted?url=${encodeURIComponent(imgUrl)}&text=${encodeURIComponent(q || 'WANTED')}`, { responseType: 'arraybuffer', timeout: 30000 }); await socket.sendMessage(from, { image: Buffer.from(data), caption: `🎯 *WANTED!*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'gun': { await react('🔫'); const qi5 = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message; if (!qi5?.imageMessage && !msg.message?.imageMessage) return reply('❗ Reply to an image'); try { const imgObj = qi5?.imageMessage || msg.message.imageMessage; const s = await downloadContentFromMessage(imgObj, 'image'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); const imgUrl = await uploadSmartMedia(b, 'image/jpeg'); const { data } = await axios.get(`${config.DAVID_API}/canvas/gun?imageUrl=${encodeURIComponent(imgUrl)}`, { responseType: 'arraybuffer', timeout: 30000 }); await socket.sendMessage(from, { image: Buffer.from(data), caption: `🔫 *GUN EFFECT!*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'brat': { await react('😈'); if (!q) return reply(`Usage: ${activePrefix}brat <text>`); try { const { data } = await axios.get(`https://api.siputzx.my.id/api/maker/brat?text=${encodeURIComponent(q)}`, { responseType: 'arraybuffer', timeout: 30000 }); await socket.sendMessage(from, { image: Buffer.from(data), caption: `😈 *Brat: ${q}*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'neon': { await react('🌈'); if (!q) return reply(`Usage: ${activePrefix}neon <text>`); try { const { data } = await axios.get(`https://api.siputzx.my.id/api/maker/neon?text=${encodeURIComponent(q)}`, { responseType: 'arraybuffer', timeout: 30000 }); await socket.sendMessage(from, { image: Buffer.from(data), caption: `🌈 *Neon: ${q}*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }

// ─── PREXZY IMAGE CREATORS ────────────────────────────────────────────────────
case 'spongebob': { await react('🤣'); if (!q) return reply(`Usage: ${activePrefix}spongebob <text>`); try { const { data } = await axios.get(`${config.PREXZY_API}/imagecreator/spongebob?text=${encodeURIComponent(q)}`, { responseType: 'arraybuffer', timeout: 30000 }); await socket.sendMessage(from, { image: Buffer.from(data), caption: `🧽 *SpongeBob says:* ${q}${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'memetext': { await react('🖼️'); if (!q) return reply(`Usage: ${activePrefix}memetext <text>`); try { const { data } = await axios.get(`${config.PREXZY_API}/imagecreator/memeText?text=${encodeURIComponent(q)}&width=800&height=600`, { responseType: 'arraybuffer', timeout: 30000 }); await socket.sendMessage(from, { image: Buffer.from(data), caption: `🖼️ *Meme: ${q}*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'textgif': { await react('🎬'); if (!q) return reply(`Usage: ${activePrefix}textgif <text> | <bg_color> | <text_color>`); try { const parts = q.split('|').map(s => s.trim()); const txt = parts[0], bg = (parts[1] || '000000').replace('#', ''), color = (parts[2] || 'ffffff').replace('#', ''); const { data } = await axios.get(`${config.PREXZY_API}/imagecreator/gif?text=${encodeURIComponent(txt)}&background=${bg}&color=${color}`, { responseType: 'arraybuffer', timeout: 30000 }); await socket.sendMessage(from, { video: Buffer.from(data), mimetype: 'video/gif', caption: `🎬 *Text GIF: ${txt}*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'textmp4': { await react('🎬'); if (!q) return reply(`Usage: ${activePrefix}textmp4 <text> | <bg_color> | <text_color>`); try { const parts = q.split('|').map(s => s.trim()); const txt = parts[0], bg = (parts[1] || '000000').replace('#', ''), color = (parts[2] || 'ffffff').replace('#', ''); const { data } = await axios.get(`${config.PREXZY_API}/imagecreator/mp4?text=${encodeURIComponent(txt)}&background=${bg}&color=${color}`, { responseType: 'arraybuffer', timeout: 30000 }); await socket.sendMessage(from, { video: Buffer.from(data), mimetype: 'video/mp4', caption: `🎬 *Text Video: ${txt}*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }

// ─── QR / SSWEB ───────────────────────────────────────────────────────────────
case 'qr': { await react('🔳'); if (!q) return reply(`Usage: ${activePrefix}qr <text>`); try { const { data } = await axios.get(`https://api.siputzx.my.id/api/tools/qr?text=${encodeURIComponent(q)}`, { responseType: 'arraybuffer', timeout: 15000 }); await socket.sendMessage(from, { image: Buffer.from(data), caption: `🔳 *QR Code: ${q}*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'ssweb': { await react('🌐'); if (!q) return reply(`Usage: ${activePrefix}ssweb <url>`); try { const { data } = await axios.get(`https://api.siputzx.my.id/api/tools/ssweb?url=${encodeURIComponent(q)}&theme=light&device=desktop`, { responseType: 'arraybuffer', timeout: 30000 }); await socket.sendMessage(from, { image: Buffer.from(data), caption: `🌐 *Screenshot: ${q}*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }

// ─── GOOGLE SEARCH — NEW ──────────────────────────────────────────────────────
case 'google': case 'search': {
    await react('🔍');
    if (!q) return reply(`Usage: ${activePrefix}google <query>\n\n📌 Example: ${activePrefix}google best programming languages 2026`);
    try {
        // Try to get real search results first
        let searchResults = null;
        try {
            const { data } = await axios.get(`${config.NEXRAY_API}/search/google?query=${encodeURIComponent(q)}`, { timeout: 15000 });
            searchResults = data?.result || data?.results;
        } catch {}

        if (!searchResults) {
            try {
                const { data } = await axios.get(`${config.DAVID_API}/search/google?query=${encodeURIComponent(q)}`, { timeout: 15000 });
                searchResults = data?.result || data?.results;
            } catch {}
        }

        if (!searchResults) {
            try {
                const { data } = await axios.get(`${config.ELITE_API}/google?query=${encodeURIComponent(q)}`, { timeout: 15000 });
                searchResults = data?.result || data?.results;
            } catch {}
        }

        if (searchResults && Array.isArray(searchResults) && searchResults.length > 0) {
            let txt = `🔍 *Google Search: ${q}*\n\n`;
            searchResults.slice(0, 5).forEach((r, i) => {
                const title = r.title || r.name || 'No title';
                const desc = (r.description || r.snippet || r.desc || '').substring(0, 120);
                const link = r.url || r.link || r.href || '';
                txt += `*${i + 1}. ${title}*\n${desc}\n${link ? `🔗 ${link}` : ''}\n\n`;
            });
            await reply(txt.trim());
        } else {
            // Fallback: provide a Google search link
            const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
            await replyImg(botImg,
                `🔍 *Google Search: ${q}*\n\n🌐 Open this link to view results:\n${googleUrl}\n\n_No direct results fetched — tap the link to search on Google._`
            );
        }
        await react('✅');
    } catch (e) { reply(`⚠️ Google search error: ${e.message}`); }
    break;
}

// ─── FETCH — ENHANCED (adapted from example fetch handler) ───────────────────
case 'fetch': case 'get': {
    if (!q) return reply(`Usage: ${activePrefix}fetch <url>\n\nFetches any URL and returns content.\nSupports: images, JSON, text, HTML, documents`);
    await react('📡');

    // Normalise URL
    let fetchUrl = q.trim();
    if (!/^https?:\/\//i.test(fetchUrl)) fetchUrl = 'http://' + fetchUrl;

    try {
        const MAX_REDIRECTS = 10;
        let redirectCount = 0;
        let currentUrl = fetchUrl;

        while (redirectCount < MAX_REDIRECTS) {
            const response = await axios.get(currentUrl, {
                timeout: 20000,
                maxRedirects: 0,
                validateStatus: s => s < 400 || s === 301 || s === 302 || s === 307 || s === 308,
                responseType: 'arraybuffer'
            });

            const contentType = (response.headers['content-type'] || '').toLowerCase();
            const contentLength = parseInt(response.headers['content-length'] || '0');

            // Guard against huge files (>100MB)
            if (contentLength > 100 * 1024 * 1024) {
                await reply(`⚠️ File too large (${fmtBytes(contentLength)}). Cannot fetch.`);
                break;
            }

            // Handle redirects manually
            if ([301, 302, 307, 308].includes(response.status)) {
                const location = response.headers['location'];
                if (location) { currentUrl = location; redirectCount++; continue; }
                else break;
            }

            const rawBuffer = Buffer.from(response.data);
            const fileName = path.basename(new URL(currentUrl).pathname) || 'file';

            if (/^image\//.test(contentType)) {
                await socket.sendMessage(from, { image: rawBuffer, caption: `📡 *Fetched Image*\n🔗 ${currentUrl.substring(0, 80)}${WM}` }, { quoted: fakeCard });
            } else if (/^video\//.test(contentType)) {
                await socket.sendMessage(from, { video: rawBuffer, mimetype: contentType.split(';')[0], caption: `📡 *Fetched Video*\n🔗 ${currentUrl.substring(0, 80)}${WM}` }, { quoted: fakeCard });
            } else if (/^audio\//.test(contentType)) {
                await socket.sendMessage(from, { audio: rawBuffer, mimetype: contentType.split(';')[0], ptt: false }, { quoted: fakeCard });
            } else if (/json/.test(contentType)) {
                const txt = rawBuffer.toString('utf8');
                let pretty = txt;
                try { pretty = JSON.stringify(JSON.parse(txt), null, 2); } catch {}
                if (pretty.length <= 3500) {
                    await reply(`📡 *Fetch Result (JSON):*\n\n\`\`\`\n${pretty.substring(0, 3400)}\n\`\`\``);
                } else {
                    await socket.sendMessage(from, { document: Buffer.from(pretty), fileName: `${fileName}.json`, mimetype: 'application/json', caption: `📡 *Fetched JSON*\n🔗 ${currentUrl.substring(0, 60)}${WM}` }, { quoted: fakeCard });
                }
            } else if (/^text\//.test(contentType)) {
                const txt = rawBuffer.toString('utf8');
                if (txt.length <= 3500) {
                    await reply(`📡 *Fetch Result (${contentType.split(';')[0]}):*\n\n${txt.substring(0, 3400)}`);
                } else {
                    const ext = /html/.test(contentType) ? 'html' : 'txt';
                    await socket.sendMessage(from, { document: rawBuffer, fileName: `${fileName}.${ext}`, mimetype: contentType.split(';')[0] || 'text/plain', caption: `📡 *Fetched Text File*\n🔗 ${currentUrl.substring(0, 60)}${WM}` }, { quoted: fakeCard });
                }
            } else {
                // Send as generic document
                await socket.sendMessage(from, { document: rawBuffer, fileName: fileName, mimetype: contentType.split(';')[0] || 'application/octet-stream', caption: `📡 *Fetched File*\n📁 ${fileName}\n📦 ${fmtBytes(rawBuffer.length)}\n🔗 ${currentUrl.substring(0, 60)}${WM}` }, { quoted: fakeCard });
            }

            await react('✅');
            break;
        }

        if (redirectCount >= MAX_REDIRECTS) {
            await reply(`⚠️ Too many redirects (max: ${MAX_REDIRECTS}).`);
        }
    } catch (e) {
        reply(`⚠️ Fetch error: ${e.message}`);
    }
    break;
}

// ─── OCR ──────────────────────────────────────────────────────────────────────
case 'ocr': {
    await react('🔍');
    const qiOcr = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
    if (!qiOcr?.imageMessage && !msg.message?.imageMessage) return reply('❗ Reply to an image');
    try { const imgObj = qiOcr?.imageMessage || msg.message.imageMessage; const s = await downloadContentFromMessage(imgObj, 'image'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); const imgUrl = await uploadSmartMedia(b, 'image/jpeg'); const { data } = await axios.get(`${config.NEXRAY_API}/tools/ocr?imageUrl=${encodeURIComponent(imgUrl)}`, { timeout: 30000 }); const t = data?.result || data?.text; if (t) await reply(`🔍 *OCR Result:*\n\n${t}`); else reply('⚠️ OCR failed.'); } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── URL UPLOAD (catbox) ──────────────────────────────────────────────────────
case 'url': case 'tourl': case 'catbox': {
    await react('📤');
    try {
        // Properly extract quoted message (reply) using Baileys contextInfo
        const quotedCtx = msg.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = quotedCtx?.quotedMessage;
        // Check both quoted message and current message for media
        const MEDIA_TYPES = ['imageMessage','videoMessage','audioMessage','documentMessage','stickerMessage'];
        const sourceMsg = quotedMsg || msg.message;
        const mt5 = MEDIA_TYPES.find(t => sourceMsg?.[t]);
        if (!mt5) return reply('⚠️ Reply to an image, audio, video or document and type .catbox');
        const mimeDefaults = { imageMessage:'image/jpeg', videoMessage:'video/mp4', audioMessage:'audio/mpeg', documentMessage:'application/octet-stream', stickerMessage:'image/webp' };
        const mediaObj = sourceMsg[mt5];
        const mime5 = mediaObj?.mimetype || mimeDefaults[mt5] || 'application/octet-stream';
        await reply('⏳ *Uploading to Catbox...*');
        // Download using downloadContentFromMessage for proper key handling
        const dlType = mt5.replace('Message','');
        const stream5 = await downloadContentFromMessage(mediaObj, dlType);
        let buffer5 = Buffer.from([]);
        for await (const chunk of stream5) buffer5 = Buffer.concat([buffer5, chunk]);
        if (!buffer5?.length) throw new Error('Empty buffer — could not download media');
        const ext5 = mime5.includes('jpeg')||mime5.includes('jpg') ? '.jpg' :
                     mime5.includes('png') ? '.png' :
                     mime5.includes('webp') ? '.webp' :
                     mime5.includes('gif') ? '.gif' :
                     mime5.includes('mp4') ? '.mp4' :
                     mime5.includes('mpeg')||mime5.includes('mp3') ? '.mp3' :
                     mime5.includes('ogg') ? '.ogg' :
                     mime5.includes('pdf') ? '.pdf' : '.bin';
        const name5 = `file_${Date.now()}${ext5}`;
        const tmp5 = path.join(os.tmpdir(), name5);
        fs.writeFileSync(tmp5, buffer5);
        const form5 = new FormData();
        form5.append('fileToUpload', fs.createReadStream(tmp5), name5);
        form5.append('reqtype', 'fileupload');
        const res5 = await axios.post('https://catbox.moe/user/api.php', form5, {
            headers: form5.getHeaders(), timeout: 60000,
            maxContentLength: Infinity, maxBodyLength: Infinity
        });
        try { fs.unlinkSync(tmp5); } catch {}
        const uploadedUrl = (res5.data || '').toString().trim();
        if (!uploadedUrl.startsWith('http')) {
            // Catbox failed — fallback to telegra.ph
            try {
                const _tph = await uploadToTelegraph(buffer5, mime5);
                if (_tph) { await reply(`📤 *Uploaded!*\n\n🔗 ${_tph}\n📁 ${fmtBytes(buffer5.length)}\n_via Telegra.ph_`); await react('✅'); return; }
            } catch {}
            throw new Error('All upload services failed');
        }
        await reply(`📤 *Uploaded!*\n\n🔗 ${uploadedUrl}\n📁 ${fmtBytes(buffer5.length)}`);
        await react('✅');
    } catch (e) { reply(`⚠️ Upload failed: ${e.message}`); }
    break;
}

// ─── SHORTURL ─────────────────────────────────────────────────────────────────
case 'shorturl': case 'tinyurl': { await react('🔗'); if (!q) return reply(`Usage: ${activePrefix}shorturl <url>`); if (!/^https?:\/\//.test(q)) return reply('⚠️ Invalid URL.'); try { const r = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(q)}`, { timeout: 10000 }); const su = r.data.trim(); if (su.startsWith('https://')) await reply(`✅ *Short URL:*\n🔗 ${su}\n\n🌐 Original: ${q}`); else reply('⚠️ Failed.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }

// ─── TRANSLATE / TTS / BOMB ───────────────────────────────────────────────────
case 'translate': case 'tr': {
    await react('🌍');
    const lang6 = args[0], text6 = args.slice(1).join(' ');
    if (!lang6 || !text6) return reply(`Usage: ${activePrefix}translate <lang> <text>\n\nExample: ${activePrefix}translate es Hello World`);
    try {
        let translated = null;
        // Primary: @vitalets/google-translate-api
        try { const r = await translate.translate(text6, { to: lang6 }); translated = r.text; } catch {}
        // Fallback: MyMemory API (free, no key)
        if (!translated) {
            try {
                const { data } = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text6)}&langpair=en|${lang6}`, { timeout: 15000 });
                translated = data?.responseData?.translatedText;
                if (translated === text6) translated = null; // same text = failed
            } catch {}
        }
        // Fallback: LibreTranslate
        if (!translated) {
            try {
                const { data } = await axios.post('https://translate.argosopentech.com/translate', { q: text6, source: 'en', target: lang6, format: 'text' }, { timeout: 15000 });
                translated = data?.translatedText;
            } catch {}
        }
        if (translated) await reply(`🌍 *TRANSLATION*\n🔤 Original: ${text6}\n💬 (${lang6}): ${translated}\n`);
        else reply(`⚠️ Translation failed for language code: ${lang6}\n\nTry common codes: es, fr, de, pt, ar, zh, ja, ru, hi`);
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}
case 'tts': { await react('🔊'); if (!q) return reply(`Usage: ${activePrefix}tts <text>`); await sendVoiceReply(q, socket, from, msg); break; }
case 'bomb': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); await react('🔥'); const [t7, m7, c7] = q.split(',').map(x => x?.trim()); const cnt = parseInt(c7) || 5; if (!t7 || !m7) return reply('Usage: .bomb <number>,<message>,<count>'); if (cnt > 20) return reply('⚠️ Max 20!'); const jid7 = `${t7.replace(/[^0-9]/g, '')}@s.whatsapp.net`; for (let i = 0; i < cnt; i++) { await socket.sendMessage(jid7, { text: m7 }); await delay(700); } await reply(`✅ Bomb sent to ${t7} — ${cnt}x! 💣`); break; }

// ─── WEATHER / WIKI / WHOIS / WINFO / GETPP / BIBLE / QURAN / CRYPTO / NEWS ──
case 'weather': { await react('🌦️'); if (!q) return reply(`Usage: ${activePrefix}weather <city>`); try { const { data } = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=2d61a72574c11c4f36173b627f8cb177&units=metric`, { timeout: 10000 }); await replyCarousel(`🌤 Weather: ${data.name}`, [{ title: `🌡️ ${data.main.temp}°C`, description: `Feels Like: ${data.main.feels_like}°C\nHumidity: ${data.main.humidity}%\n${data.weather[0].main}: ${data.weather[0].description}\nWind: ${data.wind.speed} m/s\nPressure: ${data.main.pressure} hPa`, image: botImg, buttons: [{ display: '🔄 Refresh', id: `${activePrefix}weather ${q}` }] }]); } catch (e) { reply(e.message.includes('404') ? '⚠️ City not found!' : `⚠️ ${e.message}`); } break; }
case 'wiki': case 'wikipedia': { await react('📖'); if (!q) return reply(`Usage: ${activePrefix}wiki <topic>`); try { const { data } = await axios.get(`${config.NEXRAY_API}/search/wikipedia?query=${encodeURIComponent(q)}`, { timeout: 15000 }); const t = data?.result?.extract || data?.extract; if (t) await reply(`📖 *Wikipedia: ${q}*\n\n${(typeof t === 'string' ? t : JSON.stringify(t)).substring(0, 2000)}`); else reply('⚠️ No results.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'whois': { await react('👤'); if (!q) return reply(`Usage: ${activePrefix}whois <domain>`); try { const r = await fetch(`http://api.whois.vu/?whois=${encodeURIComponent(q)}`); const d = await r.json(); if (!d.domain) throw new Error('Not found'); await reply(`🔍 *WHOIS: ${d.domain}*\n\nRegistered: ${d.created_date || 'N/A'}\nExpires: ${d.expiry_date || 'N/A'}\nRegistrar: ${d.registrar || 'N/A'}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'winfo': case 'stalk': { await react('😢'); if (!q && !args[0]) return reply(`Usage: ${activePrefix}winfo <number>`); const inputNumber = q.replace(/[^0-9]/g, ''); if (inputNumber.length < 10) return reply('⚠️ Invalid number.'); try { const [wu] = await socket.onWhatsApp(inputNumber + '@s.whatsapp.net').catch(() => []); if (!wu?.exists) return reply('⚠️ Not on WhatsApp.'); let pp = 'https://img.pyrocdn.com/dbKUgahg.png'; try { pp = await socket.profilePictureUrl(inputNumber + '@s.whatsapp.net', 'image'); } catch {} let bio = 'No bio'; try { const sd = await socket.fetchStatus(inputNumber + '@s.whatsapp.net').catch(() => null); if (sd?.status) bio = sd.status; } catch {} await socket.sendMessage(from, { image: { url: pp }, caption: `🔍 *PROFILE INFO*\n\n📞 Number: ${inputNumber}\n💼 Account: ${wu.isBusiness ? 'Business' : 'Personal'}\n📝 Bio: ${bio}${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'getpp': case 'pp': case 'profilepic': {
    await react('👤');
    try {
        let tu = nowsender;
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (mentionedJid.length > 0) tu = mentionedJid[0];
        else if (quotedParticipant) tu = quotedParticipant;
        const ppUrl = await socket.profilePictureUrl(tu, 'image').catch(() => null);
        if (ppUrl) await socket.sendMessage(from, { image: { url: ppUrl }, caption: `👤 Profile: @${tu.split('@')[0]}\n${WM}`, mentions: [tu] });
        else await reply(`@${tu.split('@')[0]} has no profile picture set.`, [tu]);
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}
case 'bible': { await react('✝️'); if (!q) return reply(`Usage: ${activePrefix}bible <verse>`); try { let verse = null; try { const { data } = await axios.get(`${config.ELITE_API}/bible?verse=${encodeURIComponent(q)}`, { timeout: 10000 }); verse = data?.result?.text || data?.text; } catch {} if (!verse) { const { data } = await axios.get(`https://bible-api.com/${encodeURIComponent(q)}`, { timeout: 10000 }); verse = data?.text; } if (verse) await reply(`✝️ *${q}*\n\n"${verse}"`); else reply('⚠️ Verse not found.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'quran': { await react('☪️'); if (!q) return reply(`Usage: ${activePrefix}quran <surah:ayah>`); try { const { data } = await axios.get(`https://api.alquran.cloud/v1/ayah/${encodeURIComponent(q)}`, { timeout: 10000 }); const t = data?.data?.text; if (t) await reply(`☪️ *Quran ${q}*\n\n"${t}"`); else reply('⚠️ Verse not found.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'crypto': { await react('💰'); if (!q) return reply(`Usage: ${activePrefix}crypto <coin>`); try { const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${q}&vs_currencies=usd`, { timeout: 10000 }); const price = data?.[q]?.usd; if (price) await reply(`💰 *${q.toUpperCase()}*\n\nPrice: $${price} USD`); else reply('⚠️ Coin not found.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'news': {
    await react('📰');
    try {
        let articles = [];
        // BBC World News via RSS2JSON (free, no key)
        try {
            const { data } = await axios.get('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/world/rss.xml', { timeout: 15000 });
            articles = data?.items || [];
        } catch {}
        // Fallback: David API tech news
        if (!articles.length) {
            const { data } = await axios.get(`${config.DAVID_API}/random/technews`, { timeout: 15000 });
            articles = data?.result || data?.news || [];
        }
        if (!articles.length) return reply('⚠️ No news available right now.');
        const category = q || 'World';
        let txt = `📰 *LATEST NEWS*`;
        articles.slice(0, 5).forEach((n, i) => {
            const title = n.title || n.headline || '';
            const desc = (n.description || n.summary || n.content || '').replace(/<[^>]*>/g, '').substring(0, 120);
            const link = n.link || n.url || '';
            const date = n.pubDate ? new Date(n.pubDate).toLocaleDateString() : '';
            txt += `\n*${i+1}. ${title}*\n${desc}...\n${date ? `🕒 ${date}` : ''} ${link ? `🔗 ${link}` : ''}\n`;
        });
        await reply(txt);
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}
case 'nasa': { await react('✔️'); try { const r = await fetch('https://api.nasa.gov/planetary/apod?api_key=8vhAFhlLCDlRLzt5P1iLu2OOMkxtmScpO5VmZEjZ'); const d = await r.json(); if (!d.title || d.media_type !== 'image') return reply('⚠️ No image today.'); await socket.sendMessage(from, { image: { url: d.url }, caption: `🌌 *NASA APOD*\n\n🌠 *${d.title}*\n\n${d.explanation.substring(0, 300)}...\n\n📆 ${d.date}${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }

// ─── FUN COMMANDS ─────────────────────────────────────────────────────────────
case 'joke': { await react('🤣'); try { const r = await fetch('https://v2.jokeapi.dev/joke/Any?type=single'); const d = await r.json(); if (d?.joke) await reply(`🃏 *Joke:*\n\n${d.joke}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'darkjoke': { await react('😬'); try { const r = await fetch('https://v2.jokeapi.dev/joke/Dark?type=single'); const d = await r.json(); if (d?.joke) await reply(`🌚 *Dark Humor:*\n\n${d.joke}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'fact': { await react('😑'); try { const r = await fetch('https://uselessfacts.jsph.pl/random.json?language=en'); const d = await r.json(); if (d?.text) await reply(`💡 *Random Fact:*\n\n${d.text}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'advice': { await react('💡'); try { const r = await fetch('https://api.adviceslip.com/advice'); const d = await r.json(); if (d?.slip?.advice) await reply(`💡 *Advice:*\n\n${d.slip.advice}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'riddle': { await react('❓'); try { const { data } = await axios.get('https://api.siputzx.my.id/api/r/riddle', { timeout: 10000 }); const r = data?.result || data?.riddle; if (r) await reply(`❓ *Riddle:*\n\n${typeof r === 'object' ? (r.riddle || r.question || JSON.stringify(r)) : r}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'dare': { await react('🎯'); try { let dareT = null; try { const rd = await fetch('https://shizoapi.onrender.com/api/texts/dare?apikey=shizo'); const dd = await rd.json(); dareT = dd?.dare || dd?.data; } catch {} if (!dareT) { try { const { data: drd } = await axios.get('https://api.truthordarebot.xyz/v1/dare', { timeout: 8000 }); dareT = drd?.question; } catch {} } if (!dareT) { try { const { data: dd2 } = await axios.get(`${config.NEXRAY_API}/fun/dare`, { timeout: 8000 }); dareT = dd2?.result || dd2?.dare; } catch {} } if (!dareT) { const dares = ['Say the alphabet backwards in 15 seconds','Do 10 push-ups right now','Send a voice note singing any song','Tag someone and give a genuine compliment','Share your most embarrassing moment']; dareT = dares[Math.floor(Math.random()*dares.length)]; } await reply(`🎯 *Dare:*\n\n${dareT}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'truth': { await react('🤫'); try { let truthT = null; try { const rt = await fetch('https://shizoapi.onrender.com/api/texts/truth?apikey=shizo'); const dt = await rt.json(); truthT = dt?.truth || dt?.data; } catch {} if (!truthT) { try { const { data: trd } = await axios.get('https://api.truthordarebot.xyz/v1/truth', { timeout: 8000 }); truthT = trd?.question; } catch {} } if (!truthT) { try { const { data: dt2 } = await axios.get(`${config.NEXRAY_API}/fun/truth`, { timeout: 8000 }); truthT = dt2?.result || dt2?.truth; } catch {} } if (!truthT) { const truths = ['What is your biggest fear?','Have you ever lied to your best friend?','What is your most embarrassing memory?','Who was your first crush?','What secret does nobody here know?']; truthT = truths[Math.floor(Math.random()*truths.length)]; } await reply(`🤫 *Truth:*\n\n${truthT}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'roast': { await react('🤬'); try {
    let _roast = null;
    try { const r = await fetch('https://vinuxd.vercel.app/api/roast'); const d = await r.json(); _roast = d?.data; } catch {}
    if (!_roast) { try { const { data } = await axios.get('https://evilinsult.com/generate_insult.php?lang=en&type=json', { timeout: 8000 }); _roast = data?.insult; } catch {} }
    if (!_roast) { const _roasts = [
        "You're the reason they put instructions on shampoo.",
        "I'd roast you but my mum said I'm not allowed to burn trash.",
        "You're like a cloud. When you disappear, it's a beautiful day.",
        "Error 404: your personality not found.",
        "I'm jealous of people who don't know you.",
        "You have your entire life to be an idiot. Take a day off.",
        "If laughter is the best medicine, your face must be curing diseases.",
        "You bring everyone so much joy — when you leave the room.",
        "I'd agree with you, but then we'd both be wrong.",
        "Your secrets are safe with me. I never listen when you tell me them."
    ]; _roast = _roasts[Math.floor(Math.random() * _roasts.length)]; }
    await reply(`🔥 *Roast:* ${_roast}`);
} catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'quote': { await react('🤔'); try { let q2 = null; try { const d = await paxQuotes(); q2 = d?.quote || d?.result; } catch {} if (!q2) { try { const { data: zq } = await axios.get('https://zenquotes.io/api/random', { timeout: 8000 }); if (zq?.[0]?.q) q2 = `"${zq[0].q}"\n— ${zq[0].a || 'Unknown'}`; } catch {} }
        if (!q2) { try { const rqt = await fetch('https://api.quotable.io/random'); const dqt = await rqt.json(); if (dqt?.content) q2 = `"${dqt.content}"\n— ${dqt.author}`; } catch {} }
        if (!q2) { try { const { data: fq } = await axios.get('https://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en', { timeout: 8000 }); if (fq?.quoteText) q2 = `"${fq.quoteText.trim()}"\n— ${fq.quoteAuthor || 'Unknown'}`; } catch {} } await reply(`💭 *Quote:*\n\n${q2}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'pickup': case 'pickupline': { await react('🥰'); try { const r = await fetch('https://vinuxd.vercel.app/api/pickup'); const d = await r.json(); if (d?.data) await reply(`💘 *Pickup Line:*\n\n_${d.data}_`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'lovequote': { await react('🙈'); try { const r = await fetch('https://api.popcat.xyz/lovequote'); const d = await r.json(); if (d?.quote) await reply(`❤️ *Love Quote:*\n\n"${d.quote}"`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'rizz': { await react('😏'); try {
    let rizzText = null;
    try { const { data } = await axios.get('https://api.siputzx.my.id/api/r/rizz', { timeout: 10000 }); const r = data?.result || data?.rizz || data?.data; if (r) rizzText = typeof r === 'string' ? r : (r.rizz || r.text || JSON.stringify(r)); } catch {}
    if (!rizzText) { try { const rd = await fetch('https://vinuxd.vercel.app/api/pickup'); const dd = await rd.json(); rizzText = dd?.data; } catch {} }
    if (!rizzText) { try { const { data } = await axios.get(`${config.NEXRAY_API}/fun/rizz`, { timeout: 8000 }); rizzText = data?.result || data?.rizz; } catch {} }
    if (!rizzText) { const _rz = ["Are you a magician? Because whenever I look at you, everyone else disappears.","Do you have a map? I keep getting lost in your eyes.","Is your name Google? Because you have everything I've been searching for.","Are you a camera? Because every time I look at you, I smile.","I must be a snowflake, because I've fallen for you.","Are you a bank loan? Because you have my interest.","Do you believe in love at first sight, or should I walk by again?","Is it hot in here, or is it just you?"]; rizzText = _rz[Math.floor(Math.random()*_rz.length)]; }
    if (rizzText) await reply(`😏 *Rizz:*\n\n${rizzText}`);
    else await reply('⚠️ Rizz service unavailable right now.');
} catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'waifu': { await react('🥲'); try { const r = await fetch('https://api.waifu.pics/sfw/waifu'); const d = await r.json(); if (d?.url) await socket.sendMessage(from, { image: { url: d.url }, caption: `✨ Random Waifu!${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'meme': { await react('😂'); try { let memeUrl = null, memeTitle = 'Meme'; try { const d = await paxMemes(); memeUrl = d?.url || d?.imageUrl; memeTitle = d?.title || 'Meme'; } catch {} if (!memeUrl) { const r = await fetch('https://meme-api.com/gimme'); const d = await r.json(); memeUrl = d?.url; memeTitle = d?.title || 'Meme'; } if (memeUrl) await socket.sendMessage(from, { image: { url: memeUrl }, caption: `🤣 *${memeTitle}*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'cat': { await react('🐱'); try { const r = await fetch('https://api.thecatapi.com/v1/images/search'); const d = await r.json(); if (d?.[0]?.url) await socket.sendMessage(from, { image: { url: d[0].url }, caption: `🐱 Cute cat!${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'dog': { await react('🦮'); try { let dogUrl = null; try { const { data } = await axios.get(`${config.DAVID_API}/random/dogs`, { timeout: 10000 }); dogUrl = data?.result?.url || data?.url; } catch {} if (!dogUrl) { const r = await fetch('https://dog.ceo/api/breeds/image/random'); const d = await r.json(); dogUrl = d?.message; } if (dogUrl) await socket.sendMessage(from, { image: { url: dogUrl }, caption: `🐶 Cute dog!${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'eightball': { await react('🎱'); if (!q) return reply(`Usage: ${activePrefix}eightball <question>`); try { const { data } = await axios.get(`https://api.siputzx.my.id/api/r/8ball?question=${encodeURIComponent(q)}`, { timeout: 10000 }); const a = data?.result || data?.answer; if (a) await reply(`🎱 *8Ball: ${q}*\n\n${typeof a === 'object' ? JSON.stringify(a) : a}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'technews': { await react('📡'); try { const { data } = await axios.get(`${config.DAVID_API}/random/technews`, { timeout: 15000 }); const items = data?.result || data?.news || []; let txt = `📡 *Tech News:*\n\n`; items.slice(0, 5).forEach((n, i) => { txt += `${i + 1}. *${n.title || ''}*\n${(n.description || n.summary || '').substring(0, 120)}\n\n`; }); await reply(txt); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'funfact': case 'livefunfact': { await react('💡'); try { const { data } = await axios.get(`${config.NEXRAY_API}/fun/livefunfact`, { timeout: 10000 }); const t = data?.result || data?.fact; if (t) await reply(`💡 *Fun Fact:*\n\n${t}`); else { const r = await fetch('https://uselessfacts.jsph.pl/random.json?language=en'); const d = await r.json(); await reply(`💡 *Fun Fact:*\n\n${d.text}`); } } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'game': case 'gaming': { await react('🎮'); try { const { data } = await axios.get('https://raw.githubusercontent.com/GlobalTechInfo/Database/main/images/game.json', { timeout: 10000 }); if (!data?.length) return reply('⚠️ No gaming images.'); const imgUrl = data[Math.floor(Math.random() * data.length)]; await socket.sendMessage(from, { image: { url: imgUrl }, caption: `🎮 Gaming Image${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }

// ─── TICTACTOE ────────────────────────────────────────────────────────────────
case 'tictactoe': {
    if (!isGroup) return reply('⚠️ Groups only!');
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return reply(`❗ Usage: ${activePrefix}tictactoe @user`);
    const playerO = mentioned[0]; if (playerO === nowsender) return reply('⚠️ You can\'t play against yourself!');
    const roomId = `tictactoe_${from}_${Date.now()}`;
    const game = new TicTacToeGame(nowsender, playerO);
    games[roomId] = { id: roomId, game, state: 'PLAYING', x: from, o: from };
    const arr = game.render().map((v, i) => v === ' ' ? (i + 1).toString() : v).map(v => ({ 'X': '❎', 'O': '⭕', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣', '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣' }[v] || v));
    await socket.sendMessage(from, { text: `🎮 *TicTacToe Started!*\n\n❎: @${nowsender.split('@')[0]}\n⭕: @${playerO.split('@')[0]}\n\n${arr.slice(0, 3).join('')}\n${arr.slice(3, 6).join('')}\n${arr.slice(6).join('')}\n\n🎲 Turn: @${nowsender.split('@')[0]} (❎)\nType 1-9 to play`, mentions: [nowsender, playerO] });
    break;
}

// ─── ANIME ────────────────────────────────────────────────────────────────────
case 'animesearch': case 'anime': { await react('🐉'); if (!q) return reply(`Usage: ${activePrefix}animesearch <name>`); try { const { data } = await axios.get(`${config.DAVID_API}/anime/search?query=${encodeURIComponent(q)}`, { timeout: 15000 }); const results = data?.result || data?.animes || []; if (!results.length) return reply('⚠️ No anime found.'); const animeItems = results.slice(0, 5).map(a => ({ title: (a.title || a.name || '?').substring(0, 50), description: `⭐ ${a.score || 'N/A'} | 📺 ${a.episodes || '?'} eps\n${(a.synopsis || a.description || '').substring(0, 100)}`, image: a.image || botImg, buttons: [{ display: '🔍 Info', id: `anime_${a.id || a.title}` }] })); await replyCarousel(`🐉 *Anime Search: ${q}*`, animeItems); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'topanime': { await react('🏆'); try { const { data } = await axios.get(`${config.DAVID_API}/anime/top`, { timeout: 15000 }); const results = data?.result || []; let txt = `🏆 *Top Anime:*\n\n`; results.slice(0, 10).forEach((a, i) => { txt += `${i + 1}. *${a.title || a.name}* ⭐ ${a.score || 'N/A'}\n`; }); await reply(txt); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'currentanime': { await react('📺'); try { const { data } = await axios.get(`${config.DAVID_API}/anime/currentseason`, { timeout: 15000 }); const results = data?.result || []; let txt = `📺 *Current Season:*\n\n`; results.slice(0, 8).forEach((a, i) => { txt += `${i + 1}. *${a.title || a.name}*\n📺 ${a.episodes || '?'} | ⭐ ${a.score || 'N/A'}\n\n`; }); await reply(txt); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'animechar': { await react('👤'); if (!q) return reply(`Usage: ${activePrefix}animechar <name>`); try { const { data } = await axios.get(`${config.DAVID_API}/anime/characters?query=${encodeURIComponent(q)}`, { timeout: 15000 }); const r = data?.result?.[0]; if (!r) return reply('⚠️ Not found.'); await reply(`👤 *${r.name || q}*\n\nAnime: ${r.anime || 'N/A'}\nRole: ${r.role || 'N/A'}\nAbout: ${(r.about || '').substring(0, 300)}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'samehadaku': { await react('🎌'); if (!q) return reply(`Usage: ${activePrefix}samehadaku <name>`); try { const { data } = await axios.get(`${config.NEXRAY_API}/anime/samehadaku/search?query=${encodeURIComponent(q)}`, { timeout: 15000 }); const results = data?.result || []; let txt = `🎌 *Samehadaku: ${q}*\n\n`; results.slice(0, 5).forEach((a, i) => { txt += `${i + 1}. *${a.title || a.name}*\nEps: ${a.episode || '?'}\n🔗 ${a.url || ''}\n\n`; }); await reply(txt); } catch (e) { reply(`⚠️ ${e.message}`); } break; }

// ─── SPORTS ───────────────────────────────────────────────────────────────────
case 'soccer': case 'soccerscores': {
    await react('⚽');
    const league = q?.toLowerCase() || 'epl';
    const espnLeague = league.includes('la liga') || league === 'laliga' ? 'esp.1' : league.includes('bundesliga') ? 'ger.1' : league.includes('serie') ? 'ita.1' : league.includes('ligue') ? 'fra.1' : 'eng.1';
    try {
        let games = await espnScoreboard('soccer', espnLeague);
        if (!games.length) games = await espnScoreboard('soccer', 'all');
        if (!games.length) return reply('⚠️ No soccer scores available right now.');
        let txt = `⚽ *SOCCER SCORES*`;
        games.slice(0, 8).forEach(g => { txt += `\n⚽ ${g.home} *${g.homeScore} - ${g.awayScore}* ${g.away}\n📍 ${g.status}\n`; });
        await reply(txt);
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}
case 'nba': {
    await react('🏀');
    try {
        const games = await espnScoreboard('basketball', 'nba');
        if (!games.length) return reply('⚠️ No NBA games right now. Check back during game day!');
        let txt = `🏀 *NBA SCORES*\n`;
        games.slice(0, 8).forEach(g => { txt += `\n🏀 ${g.home} *${g.homeScore} - ${g.awayScore}* ${g.away}\n📍 ${g.status}\n`; });
        await reply(txt);
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}
case 'livescores': case 'live': case 'score': {
    await react('⚽');
    try {
        let allGames = [];
        // Try multiple ESPN sport endpoints
        for (const [sport, league] of [['soccer', 'eng.1'], ['soccer', 'all'], ['basketball', 'nba'], ['football', 'nfl']]) {
            const games = await espnScoreboard(sport, league);
            const live = games.filter(g => g.status && !['Scheduled', 'Final', 'STATUS_SCHEDULED', 'STATUS_FINAL'].some(s => g.status.includes(s)));
            allGames = allGames.concat(live);
        }
        if (!allGames.length) {
            // Fallback: show today's games even if not live
            allGames = await espnScoreboard('soccer', 'eng.1');
        }
        if (!allGames.length) return reply('⚠️ No live scores right now. Try again during match time!');
        let txt = `🔴 *LIVE SCORES*`;
        allGames.slice(0, 8).forEach(g => { txt += `\n🔴 ${g.home} *${g.homeScore} - ${g.awayScore}* ${g.away}\n📍 ${g.status}\n`; });
        await reply(txt);
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}
case 'surebet': case 'bettips': {
    await react('🎲');
    try {
        // Try TheOdds API (free tier) or generate from live scores
        const games = await espnScoreboard('soccer', 'eng.1');
        if (!games.length) return reply('⚠️ No betting tips available right now.');
        let txt = `🎲 *TODAY\'S MATCHES*`;
        games.slice(0, 6).forEach((g, i) => {
            txt += `\n${i+1}. *${g.home} vs ${g.away}*\n📍 ${g.status}\n`;
        });
        txt += `\n_Bet responsibly. Gamble at your own risk._`;
        await reply(txt);
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}
case 'standings': {
    await react('📊');
    const lc = (args[0] || 'epl').toLowerCase();
    try {
        const leagueId = LEAGUE_IDS[lc] || '4328';
        const d = await sportsdbSearch('lookuptable', { l: leagueId });
        const teams = d?.table || [];
        if (!teams.length) return reply(`⚠️ No standings found for *${lc}*. Try: epl, laliga, bundesliga, serie a`);
        let txt = `📊 *${lc.toUpperCase()} STANDINGS*`;
        teams.slice(0, 10).forEach(t => {
            txt += `\n${t.intRank}. *${t.strTeam}* — ${t.intPoints}pts (${t.intWin}W ${t.intDraw}D ${t.intLoss}L)`;
        });
        await reply(txt);
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── TEMP MAIL ────────────────────────────────────────────────────────────────
case 'tempmail': case 'tempmailgen': {
    await react('📧');
    try {
        let email = null;
        try { const d = await paxTempMailCreate(); email = d?.email || d?.address; } catch {}
        if (!email) { try { const { data } = await axios.get(`${config.ELITE_API}/tempemail`, { timeout: 10000 }); email = data?.result?.email || data?.email; } catch {} }
        if (!email) { try { const { data } = await axios.get(`${config.GIFTED_TECH_API}/api/tempmail/generate?apikey=${config.GIFTED_API_KEY}`, { timeout: 10000 }); email = data?.result?.email; } catch {} }
        if (!email) return reply('⚠️ Failed to generate temp email.');
        global.tempMailCachePax[senderNumber] = { email, expires: Date.now() + 10 * 60000 };
        await reply(`📧 *Temp Email Generated*\n\n📮 ${email}\n⏰ Expires in 10 minutes\n\n${activePrefix}tempinbox — check inbox\n${activePrefix}readmail <n> — read email\n${activePrefix}delmail — delete`);
        await react('✅');
    } catch (e) { reply(`⚠️ TempMail error: ${e.message}`); }
    break;
}
case 'tempinbox': { const c2 = global.tempMailCachePax?.[senderNumber] || global.tempMailCache?.[senderNumber]; if (!c2 || Date.now() > c2.expires) return reply(`⚠️ No active temp email. Use ${activePrefix}tempmail`); await react('📥'); try { let mails = []; try { const d = await paxTempMailInbox(c2.email); mails = d?.emails || d?.messages || d?.result || []; } catch {} if (!mails.length) { try { const { data } = await axios.get(`${config.GIFTED_TECH_API}/api/tempmail/inbox?email=${encodeURIComponent(c2.email)}&apikey=${config.GIFTED_API_KEY}`, { timeout: 10000 }); mails = data?.result || []; } catch {} } if (!mails.length) return reply(`📥 *Inbox (${c2.email})*\n\nNo emails yet.`); let txt = `📥 *Inbox: ${c2.email}*\n\n`; mails.slice(0, 5).forEach((m16, i) => { txt += `${i + 1}. From: ${m16.from || '?'}\nSubject: ${m16.subject || 'No subject'}\nDate: ${m16.date || '?'}\n\n`; }); txt += `Use ${activePrefix}readmail <number>`; await reply(txt); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'readmail': { const num2 = parseInt(args[0]); if (isNaN(num2)) return reply(`Usage: ${activePrefix}readmail <number>`); const c3 = global.tempMailCachePax?.[senderNumber]; if (!c3 || Date.now() > c3.expires) return reply('⚠️ No active temp email.'); try { const d = await paxTempMailInbox(c3.email); const mails2 = d?.emails || d?.messages || d?.result || []; if (!mails2.length || num2 > mails2.length) return reply('⚠️ Invalid email number.'); const mail2 = mails2[num2 - 1]; let body = '(No content)'; try { if (mail2.id) { const bd = await paxTempMailBody(mail2.id); body = bd?.body || bd?.content || bd?.html || bd?.text || body; } } catch {} await reply(`📧 *Email #${num2}*\nFrom: ${mail2.from || '?'}\nSubject: ${mail2.subject || 'No subject'}\nDate: ${mail2.date || '?'}\n\nContent:\n${String(body).replace(/<[^>]*>/g, ' ').substring(0, 2000)}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'delmail': { if (global.tempMailCachePax?.[senderNumber]) delete global.tempMailCachePax[senderNumber]; if (global.tempMailCache?.[senderNumber]) delete global.tempMailCache[senderNumber]; await reply('🗑️ Temp email session deleted.'); break; }

// ─── LOGO ─────────────────────────────────────────────────────────────────────
case 'logolist': { await react('🎨'); const rows = LOGO_STYLES.map((s, i) => `${String(i + 1).padStart(2, '0')}. ${s}`).join('\n'); await reply(`🎨 LOGO STYLES (${LOGO_STYLES.length})\n\n${rows}\n\nUsage: ${activePrefix}logo <style> <text>\nExample: ${activePrefix}logo luxurygold Whitekid\n\nTip: ${activePrefix}logo all <text> sends every style.`); break; }
case 'logo': case 'logos': {
    const styleLg = (args[0] || '').toLowerCase(); const textLg = args.slice(1).join(' ').trim();
    if (!styleLg || !textLg) return reply(`Usage: ${activePrefix}logo <style> <text>\nSee ${activePrefix}logolist`);
    await react('🎨');
    try {
        if (styleLg === 'all' || styleLg === 'random') {
            const list = styleLg === 'all' ? LOGO_STYLES : [LOGO_STYLES[Math.floor(Math.random() * LOGO_STYLES.length)]];
            for (const s of list) { try { const buf = await makeLogo(s, textLg); await socket.sendMessage(from, { image: buf, caption: `✨ Logo: ${s}\nText: ${textLg}${WM}` }, { quoted: fakeCard }); await delay(600); } catch (e) { console.error('[LOGO]', s, e.message); } }
            await react('✅'); break;
        }
        const resolved = LOGO_ALIAS[styleLg] || styleLg;
        if (!LOGO_STYLES.includes(resolved)) return reply(`⚠️ Unknown style "${styleLg}".\nSee ${activePrefix}logolist for all ${LOGO_STYLES.length} styles.`);
        const buf = await makeLogo(resolved, textLg);
        await socket.sendMessage(from, { image: buf, caption: `✨ Logo: ${resolved}\nText: ${textLg}${WM}` }, { quoted: fakeCard });
        await react('✅');
    } catch (e) { console.error('[LOGO]', e.message); reply(`⚠️ Logo error: ${e.message}`); }
    break;
}
// per-style shortcuts: .glitchtext Name, .luxurygold Name, ...
case 'glossysilver': case 'writetext': case 'blackpinklogo': case 'glitchtext': case 'advancedglow': case 'typographytext': case 'pixelglitch': case 'neonglitch': case 'deletingtext': case 'glowingtext': case 'underwater': case 'logomaker': case 'cartoonstyle': case 'papercut': case 'effectclouds': case 'gradienttext': case 'summerbeach': case 'luxurygold': case 'galaxy': case 'makingneon': case 'texteffect': case 'galaxystyle': case 'lighteffect': {
    if (!q) return reply(`Usage: ${activePrefix}${command} <text>`);
    await react('🎨');
    try { const buf = await makeLogo(command, q); await socket.sendMessage(from, { image: buf, caption: `✨ Logo: ${command}\nText: ${q}${WM}` }, { quoted: fakeCard }); await react('✅'); }
    catch (e) { console.error('[LOGO]', e.message); reply(`⚠️ Logo error: ${e.message}`); }
    break;
}

// ─── SCHEDULE ─────────────────────────────────────────────────────────────────
case 'schedule': { if (!q) return reply(`Usage: ${activePrefix}schedule <time> <message>\nExamples:\n${activePrefix}schedule 2h Hello!\n${activePrefix}schedule 10:30pm Reminder!`); const timeStr = args[0], msgTxt = args.slice(1).join(' '); if (!msgTxt) return reply('⚠️ Please provide a message.'); const sendAt = parseTime(timeStr); if (!sendAt) return reply('⚠️ Invalid time. Use: 2h, 30m, 10:30am'); const id = generateId(); const sched = await loadSchedules(); sched.push({ id, chatId: from, message: msgTxt, sendAt: sendAt.getTime(), createdAt: Date.now() }); await saveSchedules(sched); await reply(`✅ *Scheduled!*\n\nID: \`${id}\`\nTime: ${sendAt.toLocaleString()}\nIn: ${formatTimeLeft(sendAt.getTime() - Date.now())}\nMessage: ${msgTxt}`); break; }
case 'schedulelist': { const sched2 = await loadSchedules(); const mine = sched2.filter(s => s.chatId === from); if (!mine.length) return reply('📋 No scheduled messages.'); let txt = `📋 *Scheduled:*\n\n`; mine.forEach(s => { txt += `ID: \`${s.id}\`\nMessage: ${s.message}\nIn: ${formatTimeLeft(s.sendAt - Date.now())}\n\n`; }); await reply(txt); break; }
case 'schedulecancel': { if (!args[0]) return reply(`Usage: ${activePrefix}schedulecancel <ID>`); const sched3 = await loadSchedules(); const id2 = args[0].toUpperCase(); const filtered = sched3.filter(s => s.id !== id2); if (filtered.length === sched3.length) return reply('⚠️ No schedule found.'); await saveSchedules(filtered); await reply(`✅ Schedule \`${id2}\` cancelled.`); break; }

// ─── WELCOME / ANTILINK ───────────────────────────────────────────────────────
case 'welcome': { if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); const sub = args[0]?.toLowerCase(); if (sub === 'on') { await setWelcome(from, true); await reply('✅ Welcome messages enabled.'); } else if (sub === 'off') { await setWelcome(from, false); await reply('⚠️ Welcome messages disabled.'); } else if (sub === 'set') { const wMsg = args.slice(1).join(' '); if (!wMsg) return reply(`Usage: ${activePrefix}welcome set <message>\nVariables: {user} {group} {description}`); await setWelcome(from, true, wMsg); await reply(`✅ Welcome message set!\n\n${wMsg}`); } else { const isOn = await isWelcomeOn(from); const wMsg = await getWelcome(from); await reply(`👋 *Welcome:* ${isOn ? 'ON' : 'OFF'}\n*Custom:* ${wMsg || 'None (default)'}\n\nUsage:\n${activePrefix}welcome on/off\n${activePrefix}welcome set <message>`); } break; }
case 'antilink': { if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); const sub = args[0]?.toLowerCase(); if (sub === 'on') { await setAntilink(from, true, args[1] || 'delete'); await reply(`✅ Antilink enabled. Action: ${args[1] || 'delete'}`); } else if (sub === 'off') { await setAntilink(from, false); await reply('⚠️ Antilink disabled.'); } else { const al = await getAntilink(from); await reply(`🚫 *Antilink:* ${al.enabled ? 'ON' : 'OFF'}\nAction: ${al.action}\n\nUsage: ${activePrefix}antilink on/off [delete|warn|kick]`); } break; }

// ─── GROUP COMMANDS ───────────────────────────────────────────────────────────
case 'add': { await react('➕️'); if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); try {
    let _addJid = null;
    const _mentA = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (_mentA.length > 0) _addJid = _mentA[0];
    else if (args[0]) _addJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (!_addJid) return reply(`Usage: ${activePrefix}add +26378xxxxx or @tag someone`);
    await socket.groupParticipantsUpdate(from, [_addJid], 'add');
    await socket.sendMessage(from, { text: `✅ Added @${_addJid.split('@')[0]}${WM}`, mentions: [_addJid] });
} catch (e) {
    const _em = e.message || '';
    if (_em.includes('not-authorized') || _em.includes('forbidden')) reply('⚠️ Bot must be admin to add members!');
    else if (_em.includes('privacy')) reply('⚠️ Could not add — user privacy settings blocked this.');
    else reply(`⚠️ Add failed: ${_em}`);
} break; }
case 'kick': { await react('🚬'); if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); try {
    let nk = null;
    const _mentK = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (_mentK.length > 0) nk = _mentK[0];
    else if (msg.message?.extendedTextMessage?.contextInfo?.participant) nk = msg.message.extendedTextMessage.contextInfo.participant;
    else if (msg.quoted) nk = msg.quoted.key?.participant;
    else if (args[0]) nk = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (!nk) return reply(`Usage: ${activePrefix}kick @user or reply to their message`);
    const _botJidK = (socket.user?.id?.split(':')[0] || '') + '@s.whatsapp.net';
    if (nk === _botJidK) return reply('⚠️ I cannot kick myself!');
    await socket.groupParticipantsUpdate(from, [nk], 'remove');
    await socket.sendMessage(from, { text: `✅ Kicked @${nk.split('@')[0]}${WM}`, mentions: [nk] });
} catch (e) { reply(`⚠️ Kick failed: ${e.message}`); } break; }
case 'promote': { await react('👑'); if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); try { let np = null; if (msg.quoted) np = msg.quoted.key?.participant; else if (args[0]) np = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'; if (!np) return reply(`Usage: ${activePrefix}promote @user`); await socket.groupParticipantsUpdate(from, [np], 'promote'); await reply(`✅ Promoted ${np.split('@')[0]}!`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'demote': { await react('🙆‍♀️'); if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); try { let nd = null; if (msg.quoted) nd = msg.quoted.key?.participant; else if (args[0]) nd = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'; if (!nd) return reply(`Usage: ${activePrefix}demote @user`); await socket.groupParticipantsUpdate(from, [nd], 'demote'); await reply(`✅ Demoted ${nd.split('@')[0]}.`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'open': case 'unmute': { await react('🔓'); if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); try { await socket.groupSettingUpdate(from, 'not_announcement'); await reply('🔓 *Group OPEN*'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'close': case 'mute': { await react('🔒'); if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); try { await socket.groupSettingUpdate(from, 'announcement'); await reply('🔒 *Group CLOSED*'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'tagall': { await react('🫂'); if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); try { const gm = await socket.groupMetadata(from); let mentionsText = ''; gm.participants.forEach(p => { mentionsText += `@${p.id.split('@')[0]}\n`; }); await socket.sendMessage(from, { image: { url: botImg }, caption: `╭───────────────⭓\n│ 👥 ${gm.subject}\n│ Members: ${gm.participants.length}\n│ By: @${nowsender.split('@')[0]}\n│ ${q || 'Hey everyone!'}\n╰───────────────⭓\n\n${mentionsText}`, mentions: [nowsender, ...gm.participants.map(p => p.id)] }, { quoted: msg }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'kickall': case 'removeall': { await react('⚡'); if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); try { const gm2 = await socket.groupMetadata(from); const botJid2 = socket.user?.id; const toRemove = gm2.participants.filter(p => p.admin === null && p.id !== botJid2).map(p => p.id); if (!toRemove.length) return reply('⚠️ No members to remove.'); await reply(`⚠️ Removing ${toRemove.length} members...`); for (let i = 0; i < toRemove.length; i += 50) { await socket.groupParticipantsUpdate(from, toRemove.slice(i, i + 50), 'remove'); await delay(2000); } await reply(`✅ Removed ${toRemove.length} members.`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'link': case 'grouplink': case 'invite': { await react('🔗'); if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); try { const code = await socket.groupInviteCode(from); await reply(`🔗 *Group Link:*\n\nhttps://chat.whatsapp.com/${code}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'admins': case 'admin': { await react('👮'); if (!isGroup) return reply('⚠️ Groups only!'); try { const gm3 = await socket.groupMetadata(from); const adms = gm3.participants.filter(p => p.admin); let txt = `👮 *Admins of ${gm3.subject}:*\n\n`; adms.forEach(a => { txt += `• @${a.id.split('@')[0]}${a.admin === 'superadmin' ? ' 👑' : ''}\n`; }); await socket.sendMessage(from, { text: txt + WM, mentions: adms.map(a => a.id) }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'setgname': case 'setgroupname': { if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); if (!q) return reply(`Usage: ${activePrefix}setgname <name>`); try { await socket.groupUpdateSubject(from, q); await reply(`✅ Group name: ${q}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'setgpp': { if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); const qiGpp = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message; if (!qiGpp?.imageMessage && !msg.message?.imageMessage) return reply('❗ Reply to an image.'); try { const imgObj = qiGpp?.imageMessage || msg.message.imageMessage; const s = await downloadContentFromMessage(imgObj, 'image'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); await socket.updateProfilePicture(from, b); await reply('✅ Group picture updated!'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'setpp': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); const qiPp = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message; if (!qiPp?.imageMessage && !msg.message?.imageMessage) return reply('❗ Reply to an image.'); try { const imgObj = qiPp?.imageMessage || msg.message.imageMessage; const s = await downloadContentFromMessage(imgObj, 'image'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); await socket.updateProfilePicture(socket.user.id, b); await reply('✅ Profile picture updated!'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'vcf': { if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); await react('📇'); try { const gm4 = await socket.groupMetadata(from); let vcf = ''; for (const p of gm4.participants) { const num = p.id.split('@')[0]; vcf += `BEGIN:VCARD\nVERSION:3.0\nFN:+${num}\nTEL;type=CELL;waid=${num}:+${num}\nEND:VCARD\n`; } await socket.sendMessage(from, { document: Buffer.from(vcf, 'utf-8'), mimetype: 'text/vcard', fileName: `${gm4.subject}_contacts.vcf`, caption: `📇 *Group Contacts*\nTotal: ${gm4.participants.length} members${WM}` }, { quoted: fakeCard }); await react('✅'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'warn': { await react('⚠️'); if (!isGroup) return reply('⚠️ Groups only!'); if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!'); try { let tu2 = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || msg.message?.extendedTextMessage?.contextInfo?.participant; if (!tu2 && msg.quoted) tu2 = msg.quoted.key?.participant; if (!tu2) return reply(`Usage: ${activePrefix}warn @user or reply`); if (tu2 === nowsender) return reply('⚠️ Cannot warn yourself.'); const wr = args.join(' ') || 'No reason'; await socket.sendMessage(from, { text: `⚠️ *WARNING*\n\n👤 User: @${tu2.split('@')[0]}\n📝 Reason: ${wr}\n👮 By: @${nowsender.split('@')[0]}${WM}`, mentions: [tu2, nowsender] }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'bc': case 'broadcast': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); await react('📢'); if (!q) return reply(`Usage: ${activePrefix}bc <message>`); try { const chats = Object.values(socket.chats || {}).filter(c => c.id?.endsWith('@g.us')); if (!chats.length) return reply('⚠️ Not in any groups.'); await reply(`📢 Broadcasting to ${chats.length} groups...`); let ok = 0, fail = 0; for (const chat of chats) { try { await socket.sendMessage(chat.id, { text: `╭─────────────⭓\n│ 📢 *Broadcast*\n│ ${q}\n╰─────────────⭓${WM}` }); ok++; await delay(300); } catch { fail++; } } await reply(`✅ Done!\nSuccess: ${ok}\nFailed: ${fail}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'join': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); if (!args[0]) return reply(`Usage: ${activePrefix}join <invite link>`); await react('👏'); try { const m2 = args[0].match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/); if (!m2) return reply('⚠️ Invalid link.'); const r = await socket.groupAcceptInvite(m2[1]); if (r?.gid) await reply(`✅ Joined! ID: ${r.gid}`); else throw new Error('No gid'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }

// ─── OWNER COMMANDS ───────────────────────────────────────────────────────────
case 'ban': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); const banNum = args[0]?.replace(/[^0-9]/g, '') || msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]?.split('@')[0]; if (!banNum) return reply(`Usage: ${activePrefix}ban <number>`); try { let b = []; try { b = JSON.parse(fs.readFileSync(BANS_PATH, 'utf8')); } catch {} if (!b.includes(banNum)) { b.push(banNum); fs.writeFileSync(BANS_PATH, JSON.stringify(b, null, 2)); } await reply(`🚫 ${banNum} banned.`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'unban': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); const unbanNum = args[0]?.replace(/[^0-9]/g, ''); if (!unbanNum) return reply(`Usage: ${activePrefix}unban <number>`); try { let b = []; try { b = JSON.parse(fs.readFileSync(BANS_PATH, 'utf8')); } catch {} b = b.filter(x => x !== unbanNum); fs.writeFileSync(BANS_PATH, JSON.stringify(b, null, 2)); await reply(`✅ ${unbanNum} unbanned.`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'bannedlist': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); try { const bans = JSON.parse(fs.readFileSync(BANS_PATH, 'utf8')); if (!bans.length) return reply('📋 No banned users.'); await reply(`🚫 *Banned (${bans.length}):*\n\n${bans.map((b, i) => `${i + 1}. ${b}`).join('\n')}`); } catch { reply('📋 No banned users.'); } break; }
case 'bio': case 'setbio': { if (!isOwner && !isDevOverride) return reply('⚠️ Owner only!'); if (!q) return reply(`Usage: ${activePrefix}bio <bio>`); try { await socket.updateProfileStatus(q); await reply(`✅ Bio updated: "${q}"`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
// newsletter command removed — auto-join handled on pair
case 'active': { await react('🧑‍💻'); await reply(`👥 *Active Sessions: ${activeSockets.size}*\n\nNumbers:\n${Array.from(activeSockets.keys()).join('\n') || 'None'}`); break; }
case 'deleteme': { const sp3 = path.join(SESSION_BASE_PATH, `session_${sn}`); if (fs.existsSync(sp3)) fs.removeSync(sp3); await deleteSessionFromGitHub(sn); if (activeSockets.has(sn)) { try { activeSockets.get(sn).ws.close(); } catch {} activeSockets.delete(sn); socketCreationTime.delete(sn); } await reply('🗑️ *Session deleted.*'); break; }
case 'uptime': { await reply(`⏱️ *Uptime:* ${getUptime(botStartTime)}`); break; }
case 'datetime': { const dt = getCurrentDateTime(); await reply(`📅 *DATE & TIME*\n\n${dt.formatted}\n\n📆 Day: ${dt.day}\n📅 Date: ${dt.date}\n⏰ Time: ${dt.time}`); break; }
case 'location': { const loc = await getUserLocation(); await reply(`📍 *LOCATION*\n\n🌍 City: ${loc.city}\n🗺️ Region: ${loc.region}\n🏳️ Country: ${loc.country}\n⏰ Timezone: ${loc.timezone}`); break; }
case 'bot_info': {
    await reply(`🤖 *BOT INFO*\n📛 *Name:* ${AI_SHORT_NAME}\n📋 *Full Name:* ${AI_FULL_NAME}\n👑 *Developer:* WhiteKid Tech\n🔢 *Version:* v${config.VERSION}\n🔑 *Prefix:* ${activePrefix}\n🌐 *Mode:* ${isPublicMode() ? 'Public' : 'Private'}\n🤖 *AI:* ${isAiEnabled() ? 'ON' : 'OFF'}\n🎙️ *Voice:* ${isVoiceEnabled() ? 'ON' : 'OFF'}`);
    break;
}
case 'bot_stats': {
    const st3 = socketCreationTime.get(number) || Date.now(), up3 = Math.floor((Date.now() - st3) / 1000);
    const h3 = Math.floor(up3 / 3600), mn3 = Math.floor((up3 % 3600) / 60), s3 = up3 % 60;
    const u3 = Math.round(process.memoryUsage().heapUsed / 1024 / 1024), t3 = Math.round(os.totalmem() / 1024 / 1024);
    await reply(`📊 *BOT STATS*\n*⏱️Uptime:* ${h3}h ${mn3}m ${s3}s\n💾 *RAM:* ${u3}MB / ${t3}MB\n👥 *Sessions:* ${activeSockets.size} active\n📱 *Number:* ${number}\n🔢 *Version:* v${config.VERSION}\n🌐 *Mode:* ${isPublicMode() ? 'Public' : 'Private'}\n🤖 *AI:* ${isAiEnabled() ? 'ON' : 'OFF'}\n🎙️ *Voice:* ${isVoiceEnabled() ? 'ON' : 'OFF'}`);
    break;
}
case 'ram': case 'system': { const tm = os.totalmem(), fm = os.freemem(), um = tm - fm; await reply(`*RAM USAGE*\n\nTotal: ${fmtBytes(tm)}\nUsed: ${fmtBytes(um)}\nFree: ${fmtBytes(fm)}\nPlatform: ${os.platform()} (${os.arch()})`); break; }
case 'cpu': { const cpus = os.cpus(); await reply(`*CPU INFO*\n\nModel: ${cpus[0].model}\nSpeed: ${cpus[0].speed} MHz\nCores: ${cpus.length}\nUptime: ${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`); break; }
case 'shazam': case 'whatmusic': {
    await react('🎧');
    const qAudio = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
    const hasAudio = qAudio?.audioMessage || qAudio?.videoMessage || msg.message?.audioMessage;
    if (!hasAudio && !q) return reply(`❗ Reply to audio or provide URL.`);
    try {
        let audioUrl = q || null;
        if (!audioUrl && hasAudio) { const audioObj = qAudio?.audioMessage || qAudio?.videoMessage || msg.message.audioMessage; const s = await downloadContentFromMessage(audioObj, 'audio'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); audioUrl = await uploadAudioToCatbox(b, 'ogg'); }
        let result = null;
        try { const { data } = await axios.get(`${config.ELITE_API}/whatmusic?url=${encodeURIComponent(audioUrl || '')}`, { timeout: 30000 }); result = data?.result || data; } catch {}
        if (!result) { try { result = await paxShazam(audioUrl); } catch {} }
        if (result) { const t = result?.title || result?.track?.title || result?.name || 'Unknown'; const a = result?.artist || result?.track?.subtitle || 'Unknown'; await replyCarousel(`🎧 Shazam Result`, [{ title: `🎵 ${t}`, description: `🎤 Artist: ${a}\n📀 Album: ${result?.album || 'N/A'}`, image: botImg, buttons: [{ display: '🎶 Get Lyrics', id: `${activePrefix}lyrics ${t}` }, { display: '⬇️ Download', id: `${activePrefix}song ${t}` }] }]); }
        else await reply('⚠️ Could not identify the audio.');
    } catch (e) { reply(`⚠️ Shazam error: ${e.message}`); }
    break;
}
case 'base64': { await react('🔐'); if (!q) return reply(`Usage: ${activePrefix}base64 encode/decode <text>`); const sub = args[0]?.toLowerCase(), txt = args.slice(1).join(' '); if (sub === 'encode') await reply(`🔐 *Encoded:*\n\n${Buffer.from(txt).toString('base64')}`); else if (sub === 'decode') { try { await reply(`🔓 *Decoded:*\n\n${Buffer.from(txt, 'base64').toString('utf8')}`); } catch { reply('⚠️ Invalid base64.'); } } else await reply(`Usage: ${activePrefix}base64 encode/decode <text>`); break; }
case 'calc': case 'calculate': { await react('🔢'); if (!q) return reply(`Usage: ${activePrefix}calc <expression>`); try { let result = null; try { const { data } = await axios.get(`${config.DAVID_API}/tools/calculator?expression=${encodeURIComponent(q)}`, { timeout: 10000 }); result = data?.result || data?.answer; } catch {} if (!result) result = eval(q.replace(/[^0-9+\-*/.()% ]/g, '')); await reply(`🔢 *Calculator*\n${q} = ${result}`); } catch { reply('⚠️ Invalid expression.'); } break; }
case 'countries': { await react('🌍'); try { const { data } = await axios.get(`${config.ELITE_API}/countries`, { timeout: 10000 }); const countries = data?.result || data || []; if (!countries.length) return reply('⚠️ No data.'); let txt = q ? '' : `🌍 *World Countries (${countries.length} total)*\n\n`; if (q) { const found = countries.find(c => (c.name || '').toLowerCase().includes(q.toLowerCase())); if (found) txt = `🌍 *${found.name}*\n\nCapital: ${found.capital || 'N/A'}\nPopulation: ${found.population || 'N/A'}\nRegion: ${found.region || 'N/A'}\nCurrency: ${found.currency || 'N/A'}`; else txt = `⚠️ Country "${q}" not found.`; } else { countries.slice(0, 20).forEach(c => txt += `• ${c.name || c}\n`); txt += `\n_Use ${activePrefix}countries <name> for details_`; } await reply(txt); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'report': { if (!q) return reply(`Usage: ${activePrefix}report <message>`); const ownerJid = config.OWNER_NUMBERS[0] + '@s.whatsapp.net'; try { await socket.sendMessage(ownerJid, { text: `📢 *REPORT*\nFrom: @${senderNumber}\nChat: ${from}\nMessage: ${q}${WM}`, mentions: [nowsender] }); await reply('✅ Report sent.'); } catch { reply(`⚠️ Contact: wa.me/${DEVELOPER_NUMBER}`); } break; }
case 'help': { await reply(`📖 Whitekid Prime HELP\n🤖 *Bot:* ${AI_SHORT_NAME}\n🔑 *Prefix:* \`${activePrefix}\`\n👑 *Owner:* WhiteKid Tech\n\nHOW TO USE\n• Commands: \`${activePrefix}command\`\n• Example: \`${activePrefix}play faded\` | \`${activePrefix}ai hello\`\n• Reply to image → \`${activePrefix}sticker\`\n\nCATEGORIES\n🌐 General: ${activePrefix}alive ${activePrefix}ping ${activePrefix}menu\n🤖 AI: ${activePrefix}ai ${activePrefix}gpt4 ${activePrefix}gemini\n📥 Downloads: ${activePrefix}play ${activePrefix}video ${activePrefix}tiktok\n🔍 Search: ${activePrefix}wiki ${activePrefix}weather ${activePrefix}news\n🎭 Fun: ${activePrefix}joke ${activePrefix}dare ${activePrefix}truth ${activePrefix}quote\n🛠️ Tools: ${activePrefix}sticker ${activePrefix}qr ${activePrefix}translate\n👥 Group: ${activePrefix}tagall ${activePrefix}welcome ${activePrefix}goodbye\nSUPPORT\n📱 wa.me/${DEVELOPER_NUMBER}\n📟 t.me/whitekid01`); break; }
case 'movie': case 'sm': case 'silent': { if (!q) return reply(`❗ Usage: ${activePrefix}movie <name>`); await react('🎬'); await reply(`🔎 Searching: "${q}"...`); const err = await searchMovies(q, socket, from, msg, fakeCard, botImg); if (err) reply(err); break; }
case 'smsubs': { const movieId = args[0], season = args[1] || 'null', episode = args[2] || 'null'; if (!movieId) return reply('Usage: .smsubs <movieId> [season] [episode]'); const err = await showSubtitleOptions(movieId, season, episode, socket, from, msg); if (err) reply(err); break; }
case 'dlmovie': case 'downloadmovie': { const movieId = args[0], season = (args[1] && args[1] !== 'null') ? args[1] : null, episode = (args[2] && args[2] !== 'null') ? args[2] : null, lang = args.slice(3).join(' '); if (!movieId) return reply('Usage: .dlmovie <movie_id> [season] [episode] [language]'); await react('⏳'); await reply(`⏳ *Fetching Download Links...*`); const err = await downloadMovieFile(movieId, season, episode, lang, socket, from, msg); if (err) reply(err); break; }
case 'wallpaper': case 'wp': { await react('🖼️'); if (!q) return reply(`Usage: ${activePrefix}wallpaper <search>`); try { let imgUrl = null; for (const fn of [async () => { const { data } = await axios.get(`${config.ELITE_API}/wallpaper?query=${encodeURIComponent(q)}`, { timeout: 15000 }); return data?.result?.[0]?.url || data?.images?.[0]?.url; }, async () => { const { data } = await axios.get(`${config.DAVID_API}/search/wallpapers?query=${encodeURIComponent(q)}`, { timeout: 15000 }); return data?.result?.[0]?.url || data?.images?.[0]; }]) { try { const r = await fn(); if (r) { imgUrl = r; break; } } catch {} } if (!imgUrl) return reply('⚠️ No wallpaper found.'); await socket.sendMessage(from, { image: { url: imgUrl }, caption: `🖼️ *Wallpaper: ${q}*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case '4kwallpaper': case '4kwp': { await react('🖼️'); if (!q) return reply(`Usage: ${activePrefix}4kwallpaper <query>`); try { const { data } = await axios.get(`${config.ELITE_API}/4kwallpaper?type=search&query=${encodeURIComponent(q)}`, { timeout: 15000 }); const imgUrl = data?.result?.[0]?.url || data?.images?.[0]; if (imgUrl) await socket.sendMessage(from, { image: { url: imgUrl }, caption: `🖼️ *4K Wallpaper: ${q}*${WM}` }, { quoted: fakeCard }); else reply('⚠️ Not found.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'pinterest': case 'pin': { await react('📌'); if (!q) return reply(`Usage: ${activePrefix}pinterest <query>`); try { let imgs = []; for (const fn of [async () => { const { data } = await axios.get(`${config.DAVID_API}/search/pinterest?query=${encodeURIComponent(q)}`, { timeout: 15000 }); return data?.result || []; }, async () => { const { data } = await axios.get(`https://api.siputzx.my.id/api/s/pinterest?q=${encodeURIComponent(q)}`, { timeout: 15000 }); return data?.result || []; }]) { try { const r = await fn(); if (r?.length) { imgs = r; break; } } catch {} } if (!imgs.length) return reply('⚠️ No results.'); const imgUrl = imgs[0]?.url || imgs[0]; await socket.sendMessage(from, { image: { url: imgUrl }, caption: `📌 *Pinterest: ${q}*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'gimage': case 'googleimage': { await react('🔍'); if (!q) return reply(`Usage: ${activePrefix}gimage <query>`); try { let images = []; for (const fn of [async () => { const { data } = await axios.get(`${config.DISCARD_API}/api/dl/gimage?apikey=guru&query=${encodeURIComponent(q)}`, { timeout: 15000 }); return data?.imageUrls; }, async () => { const { data } = await axios.get(`${config.NEXRAY_API}/search/googleimage?query=${encodeURIComponent(q)}`, { timeout: 15000 }); return data?.result || data?.images; }]) { try { const r = await fn(); if (r?.length) { images = r; break; } } catch {} } if (!images.length) return reply('⚠️ No images found.'); for (let i = 0; i < Math.min(4, images.length); i++) { const imgUrl = typeof images[i] === 'string' ? images[i] : images[i]?.url; if (!imgUrl) continue; await socket.sendMessage(from, { image: { url: imgUrl }, caption: `🖼️ *Google Image ${i + 1}*` }, { quoted: fakeCard }); await delay(1000); } await react('✅'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'npm': case 'npmsearch': { await react('📦'); if (!q) return reply(`Usage: ${activePrefix}npm <package>`); try { const { data } = await axios.get(`https://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(q)}&size=5`, { timeout: 10000 }); if (!data.objects?.length) return reply('No packages found.'); let msg8 = `📦 *NPM: "${q}"*\n\n`; data.objects.slice(0, 5).forEach((p, i) => { msg8 += `${i + 1}. *${p.package.name}* v${p.package.version}\n   ${p.package.description?.substring(0, 80) || ''}\n   👤 ${p.package.publisher?.username || 'unknown'}\n\n`; }); await reply(msg8); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'npmstalk': { await react('📦'); if (!q) return reply(`Usage: ${activePrefix}npmstalk <package>`); try { for (const fn of [async () => { const { data } = await axios.get(`${config.DAVID_API}/stalk/npm?package=${encodeURIComponent(q)}`, { timeout: 15000 }); const r = data?.result || data; return `📦 *NPM: ${q}*\n\nVersion: ${r?.version || 'N/A'}\nDescription: ${r?.description || 'N/A'}\nAuthor: ${r?.author || 'N/A'}\nLicense: ${r?.license || 'N/A'}\n🔗 https://npmjs.com/package/${q}`; }, async () => { const { data } = await axios.get(`https://registry.npmjs.com/${q}`, { timeout: 10000 }); return `📦 *NPM: ${data.name}*\n\nVersion: ${data['dist-tags']?.latest}\nDescription: ${data.description || 'N/A'}\nLicense: ${data.license || 'N/A'}`; }]) { try { const r = await fn(); if (r) { await reply(r); break; } } catch {} } } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'tgstalk': { await react('📱'); if (!q) return reply(`Usage: ${activePrefix}tgstalk <username>`); try { const { data } = await axios.get(`${config.DAVID_API}/stalk/telegram?username=${encodeURIComponent(q)}`, { timeout: 15000 }); const r = data?.result || data; await reply(`📱 *Telegram: @${q}*\n\nName: ${r?.name || 'N/A'}\nUsername: ${r?.username || 'N/A'}\nBio: ${r?.bio || 'N/A'}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'ttstalk': case 'tiktokstalk': { await react('📱'); if (!q) return reply(`Usage: ${activePrefix}ttstalk <username>`); try { const { data } = await axios.get(`${config.ELITE_API}/tiktokstalk?username=${encodeURIComponent(q)}`, { timeout: 15000 }); const r = data?.result || data; await reply(`📱 *TikTok: @${q}*\n\nName: ${r?.nickname || 'N/A'}\nFollowers: ${r?.followers || 'N/A'}\nLikes: ${r?.likes || 'N/A'}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'gitclone': case 'gitdl': { if (!q) return reply(`Usage: ${activePrefix}gitclone <github url>`); await react('📦'); try { const m2 = q.match(/github\.com\/([^\/]+)\/([^\/]+)/i); if (!m2) return reply('⚠️ Invalid GitHub URL.'); const [, user, repoG] = m2; await reply(`Fetching ${user}/${repoG}...`); await socket.sendMessage(from, { document: { url: `https://api.github.com/repos/${user}/${repoG}/zipball` }, fileName: `${user}-${repoG}.zip`, mimetype: 'application/zip', caption: `📦 *GitHub:* ${user}/${repoG}${WM}` }, { quoted: fakeCard }); await react('✅'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'igstory': { if (!q) return reply(`Usage: ${activePrefix}igstory <url>`); await react('📖'); try { const { data } = await axios.get(`${config.DELINE_API}/downloader/igstory?url=${encodeURIComponent(q)}`, { timeout: 30000 }); const url = data?.result?.download_url || data?.url; if (url) await socket.sendMessage(from, { image: { url }, caption: `📖 Instagram Story${WM}` }, { quoted: fakeCard }); else reply('⚠️ No story found.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'threads': { if (!q) return reply(`Usage: ${activePrefix}threads <url>`); await react('📱'); try { const { data } = await axios.get(`${config.DELINE_API}/downloader/threads?url=${encodeURIComponent(q)}`, { timeout: 30000 }); const url = data?.result?.download_url || data?.url; if (url) await socket.sendMessage(from, { video: { url }, mimetype: 'video/mp4', caption: `📱 Threads Video${WM}` }, { quoted: fakeCard }); else reply('⚠️ Failed.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'spotify': { if (!q) return reply(`Usage: ${activePrefix}spotify <url or name>`); await react('🎵'); try { const { data } = await axios.get(`${config.DAVID_API}/download/spotify?url=${encodeURIComponent(q)}`, { timeout: 60000 }); const url = data?.result?.download_url || data?.audio_url; if (url) await socket.sendMessage(from, { audio: { url }, mimetype: 'audio/mpeg', caption: `🎵 Spotify Audio${WM}` }, { quoted: fakeCard }); else reply('⚠️ Failed.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'gdrive': case 'googledrive': { if (!q) return reply(`Usage: ${activePrefix}gdrive <url>`); await react('📂'); try { const { data } = await axios.get(`${config.DAVID_API}/download/googledrive?url=${encodeURIComponent(q)}`, { timeout: 60000 }); const url = data?.result?.download_url || data?.url; if (url) await socket.sendMessage(from, { document: { url }, fileName: data?.result?.name || 'file', caption: `📂 Google Drive${WM}` }, { quoted: fakeCard }); else reply('⚠️ Failed.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'website': { if (!q) return reply(`Usage: ${activePrefix}website <url>`); await react('🌐'); try { for (const fn of [async () => { const { data } = await axios.get(`${config.DAVID_API}/download/website?url=${encodeURIComponent(q)}`, { timeout: 60000 }); return data?.result?.download_url || data?.url; }, async () => { const { data } = await axios.get(`${config.PREXZY_API}/download/saveweb2zip?url=${encodeURIComponent(q)}`, { timeout: 60000 }); return data?.result?.download_url || data?.url; }]) { try { const r = await fn(); if (r) { await socket.sendMessage(from, { document: { url: r }, fileName: 'website.zip', caption: `🌐 Website${WM}` }, { quoted: fakeCard }); break; } } catch {} } } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'snack': case 'snackdl': { if (!q) return reply(`Usage: ${activePrefix}snack <url>`); await react('🍿'); try { const { data } = await axios.get(`${config.GIFTED_TECH_API}/api/download/snackdl?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(q)}`, { timeout: 60000 }); if (!data?.success || !data?.result?.media) return reply('⚠️ Failed.'); const { title, media, thumbnail } = data.result; if (thumbnail) await socket.sendMessage(from, { image: { url: thumbnail }, caption: `🍿 ${title || ''}${WM}` }, { quoted: fakeCard }); await socket.sendMessage(from, { video: { url: media }, mimetype: 'video/mp4', caption: `🍿 Snack Video${WM}` }, { quoted: fakeCard }); await react('✅'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'webtozip': { await react('💻'); if (!q) return reply(`Usage: ${activePrefix}webtozip <url>`); try { const { data } = await axios.get(`${config.NEXRAY_API}/tools/webtozip?url=${encodeURIComponent(q)}`, { timeout: 60000 }); const url = data?.result?.download_url || data?.url; if (url) await socket.sendMessage(from, { document: { url }, fileName: 'website.zip', caption: `💻 Website ZIP${WM}` }, { quoted: fakeCard }); else reply('⚠️ Failed.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'webcopier': { await react('🌐'); if (!q) return reply(`Usage: ${activePrefix}webcopier <url>`); try { const { data } = await axios.get(`${config.ELITE_API}/webcopier?url=${encodeURIComponent(q)}`, { timeout: 30000 }); const html = data?.result || data?.html; if (html) { const tmpHtml = path.join(os.tmpdir(), `web_${Date.now()}.html`); fs.writeFileSync(tmpHtml, html, 'utf8'); await socket.sendMessage(from, { document: fs.readFileSync(tmpHtml), fileName: 'webpage.html', mimetype: 'text/html', caption: `🌐 Webpage: ${q}${WM}` }, { quoted: fakeCard }); try { fs.unlinkSync(tmpHtml); } catch {} } else reply('⚠️ Failed.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'obfuscate': case 'obf': { await react('📝'); if (!q) return reply(`Usage: ${activePrefix}obfuscate <javascript code>`); try { const { data } = await axios.get(`${config.DAVID_API}/tools/jsobfuscator?code=${encodeURIComponent(q)}`, { timeout: 30000 }); const t = data?.result || data?.code; if (t) await reply(`📝 *Obfuscated:*\n\n${t.substring(0, 2000)}`); else reply('⚠️ Failed.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'trackip': case 'ipinfo': { await react('🌐'); if (!q) return reply(`Usage: ${activePrefix}trackip <IP>`); try { const { data } = await axios.get(`${config.NEXRAY_API}/tools/trackip?ip=${encodeURIComponent(q)}`, { timeout: 15000 }); const r = data?.result || data; await reply(`🌐 *IP Info: ${q}*\n\nCountry: ${r?.country || 'N/A'}\nCity: ${r?.city || 'N/A'}\nISP: ${r?.isp || 'N/A'}\nLat: ${r?.lat || 'N/A'}\nLon: ${r?.lon || 'N/A'}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'vcc': case 'ccgen': { await react('💳'); const type = args[0] || 'visa'; try { const { data } = await axios.get(`${config.NEXRAY_API}/tools/vcc?type=${type}`, { timeout: 15000 }); const r = data?.result || data; await reply(`💳 *VCC (${type}):*\n\n${JSON.stringify(r, null, 2).substring(0, 500)}`); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'fancy': case 'font': {
    await react('🖋'); if (!q) return reply(`Usage: ${activePrefix}font <text>`);
    let fontList = null;
    // Try dark-yasiya-api (primary)
    try {
        const { data } = await axios.get(`https://www.dark-yasiya-api.site/other/font?text=${encodeURIComponent(q)}`, { timeout: 12000 });
        if (data?.status && Array.isArray(data?.result) && data.result.length > 0) {
            fontList = data.result.map(f => `*${f.name}:*\n${f.result || f.text || ''}`).join('\n\n');
        }
    } catch {}
    // Try siputzx (fallback 1)
    if (!fontList) try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/other/fancytext?text=${encodeURIComponent(q)}`, { timeout: 12000 });
        if (data?.result && Array.isArray(data.result)) {
            fontList = data.result.map(f => `*${f.name}:*\n${f.text || f.result || ''}`).join('\n\n');
        }
    } catch {}
    // Try elite API (fallback 2)
    if (!fontList) try {
        const { data } = await axios.get(`${config.ELITE_API}/font?text=${encodeURIComponent(q)}`, { timeout: 12000 });
        const arr = data?.result || data?.fonts;
        if (Array.isArray(arr)) fontList = arr.map(f => `*${f.name || f.style}:*\n${f.result || f.text || ''}`).join('\n\n');
        else if (typeof arr === 'string') fontList = arr;
    } catch {}
    // Try NEXRAY (fallback 3)
    if (!fontList) try {
        const { data } = await axios.get(`${config.NEXRAY_API}/tools/fancy?text=${encodeURIComponent(q)}`, { timeout: 12000 });
        const arr = data?.result;
        if (Array.isArray(arr)) fontList = arr.map(f => `*${f.name}:*\n${f.result || f.text}`).join('\n\n');
    } catch {}
    // Local Unicode generator (ALWAYS works — no API needed)
    if (!fontList) {
        const localFonts = generateLocalFonts(q);
        fontList = localFonts.map(f => `*${f.name}:*\n${f.result}`).join('\n\n');
    }
    await reply(`🎨 *Fancy Fonts for:* _${q}_\n\n${fontList.substring(0, 3500)}`);
    break;
}
case 'ytt': case 'yttranscribe': { await react('📝'); if (!q) return reply(`Usage: ${activePrefix}ytt <youtube url>`); try { const { data } = await axios.get(`${config.NEXRAY_API}/tools/yt-transcribe?url=${encodeURIComponent(q)}`, { timeout: 60000 }); const t = data?.result || data?.transcript; if (t) await reply(`📝 *YouTube Transcript:*\n\n${t.substring(0, 3000)}`); else reply('⚠️ Transcription failed.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'readmore': { if (!q) return reply(`Usage: ${activePrefix}readmore <text>`); await socket.sendMessage(from, { text: `${q}\u0085\u0085\u0085\n\n_Read more hidden text_${WM}` }, { quoted: fakeCard }); break; }
// forwarded/viral command removed (channel-related)
// channelid command removed
// fc/follow channel command removed
case 'units': { await react('⚖️'); if (!q) return reply(`Usage: ${activePrefix}units <value> <from> <to>`); const val = parseFloat(args[0]), f2 = args[1]?.toLowerCase(), t2 = args[2]?.toLowerCase(); if (isNaN(val) || !f2 || !t2) return reply('⚠️ Invalid format.'); const conv = { 'km-miles': v => v * 0.621371, 'miles-km': v => v * 1.60934, 'kg-lbs': v => v * 2.20462, 'lbs-kg': v => v * 0.453592, 'm-ft': v => v * 3.28084, 'ft-m': v => v * 0.3048, 'c-f': v => v * 9 / 5 + 32, 'f-c': v => (v - 32) * 5 / 9 }; const key = `${f2}-${t2}`; if (conv[key]) await reply(`⚖️ *Conversion:*\n\n${val} ${f2} = ${conv[key](val).toFixed(4)} ${t2}`); else reply(`⚠️ Conversion "${f2}" to "${t2}" not supported.`); break; }
case 'savestatus': { await react('💾'); if (!msg.quoted) return reply('❗ Reply to a status to save it!'); try { const mediaSt = await downloadMediaMessage(msg.quoted, 'buffer', {}); const fileExt = msg.quoted?.message?.imageMessage ? 'jpg' : 'mp4'; const mimeType = msg.quoted?.message?.imageMessage ? 'image/jpeg' : 'video/mp4'; if (fileExt === 'jpg') await socket.sendMessage(from, { image: mediaSt, caption: `💾 Saved Status${WM}` }, { quoted: fakeCard }); else await socket.sendMessage(from, { document: mediaSt, mimetype: mimeType, fileName: `status_${Date.now()}.${fileExt}`, caption: `💾 Saved Status${WM}` }, { quoted: fakeCard }); await react('✅'); } catch (e) { reply(`⚠️ ${e.message}`); } break; } 
case 'imdb': { if (!q) return reply(`Usage: ${activePrefix}imdb <movie name>`); await react('⭐'); try { const res = await fetch(`https://api.popcat.xyz/imdb?q=${encodeURIComponent(q)}`); const json = await res.json(); const info = `🎬 *${json.title || 'N/A'}* (${json.year || 'N/A'})\n🎭 Genre: ${json.genres || 'N/A'}\n⭐ Rating: ${json.rating || 'N/A'} (${json.votes || 'N/A'} votes)\n📝 Plot: ${json.plot || 'N/A'}\n🎬 Director: ${json.director || 'N/A'}\n👨‍👩‍👧‍👦 Actors: ${json.actors || 'N/A'}\n⏱️ Runtime: ${json.runtime || 'N/A'}\n📅 Released: ${json.released || 'N/A'}`; if (json.poster) await socket.sendMessage(from, { image: { url: json.poster }, caption: info + WM }, { quoted: fakeCard }); else await reply(info); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'blurface': { await react('🔇'); const qi6 = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message; if (!qi6?.imageMessage && !msg.message?.imageMessage) return reply('❗ Reply to an image'); try { const imgObj = qi6?.imageMessage || msg.message.imageMessage; const s = await downloadContentFromMessage(imgObj, 'image'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); const imgUrl = await uploadSmartMedia(b, 'image/jpeg'); const { data } = await axios.get(`${config.NEXRAY_API}/tools/blurface?imageUrl=${encodeURIComponent(imgUrl)}`, { responseType: 'arraybuffer', timeout: 30000 }); await socket.sendMessage(from, { image: Buffer.from(data), caption: `🔇 *Face Blurred!*${WM}` }, { quoted: fakeCard }); } catch (e) { reply(`⚠️ ${e.message}`); } break; }
case 'imagescanner': { await react('🔍'); const qiIs = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message; if (!qiIs?.imageMessage && !msg.message?.imageMessage) return reply('❗ Reply to an image'); try { const imgObj = qiIs?.imageMessage || msg.message.imageMessage; const s = await downloadContentFromMessage(imgObj, 'image'); let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]); const imgUrl = await uploadSmartMedia(b, 'image/jpeg'); const { data } = await axios.get(`${config.DAVID_API}/tools/imagescanner?imageUrl=${encodeURIComponent(imgUrl)}`, { timeout: 30000 }); const result = data?.result || data?.text || data?.description; if (result) await reply(`🔍 *Image Scanner:*\n\n${typeof result === 'string' ? result : JSON.stringify(result, null, 2)}`); else reply('⚠️ Could not analyse image.'); } catch (e) { reply(`⚠️ ${e.message}`); } break; }

// ─── VISION (image + AI analysis) ────────────────────────────────────────────
case 'vision': case 'analyze': case 'describe': {
    await react('🔍');
    const qiVis = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
    const hasImgVis = qiVis?.imageMessage || msg.message?.imageMessage;
    if (!hasImgVis) return reply(`❗ Reply to an image with ${activePrefix}vision [optional question]`);
    try {
        const imgObj = qiVis?.imageMessage || msg.message.imageMessage;
        const s = await downloadContentFromMessage(imgObj, 'image');
        let b = Buffer.from([]); for await (const c of s) b = Buffer.concat([b, c]);
        const imgUrl = await uploadSmartMedia(b, 'image/jpeg');
        const prompt = q || 'Describe this image in detail.';
        await reply('🔍 _Analysing image..._');
        let result = null;
        // Nanobanana vision
        try { const { data } = await axios.get(`${config.DAVID_API}/tools/nanobanana?imageUrl=${encodeURIComponent(imgUrl)}&prompt=${encodeURIComponent(prompt)}`, { timeout: 60000 }); result = data?.result?.text || data?.result?.description || data?.text; } catch {}
        // Nexray EU nanobanana
        if (!result) { try { const { data } = await axios.post(`${config.NEXRAY_EU}/ai/nanobanana`, { imageUrl: imgUrl, prompt }, { timeout: 60000 }); result = data?.result?.text || data?.result?.description || data?.text; } catch {} }
        // Image scanner fallback
        if (!result) { try { const { data } = await axios.get(`${config.DAVID_API}/tools/imagescanner?imageUrl=${encodeURIComponent(imgUrl)}`, { timeout: 30000 }); result = data?.result || data?.text || data?.description; } catch {} }
        // OCR fallback
        if (!result) { try { const { data } = await axios.get(`${config.NEXRAY_API}/tools/ocr?imageUrl=${encodeURIComponent(imgUrl)}`, { timeout: 30000 }); result = data?.result || data?.text; } catch {} }
        if (result) await replyImg(imgUrl, `🔍 *Vision Analysis:*\n\n${typeof result === 'string' ? result : JSON.stringify(result, null, 2)}`);
        else reply('⚠️ Could not analyse image. Try again.');
    } catch (e) { reply(`⚠️ Vision error: ${e.message}`); }
    break;
}

// ─── REPO ─────────────────────────────────────────────────────────────────────
case 'repo': case 'github': {
    await react('💻');
    if (q && !q.startsWith('http')) {
        // Search GitHub repos
        try {
            const { data } = await axios.get(`${config.NEXRAY_API}/search/github?query=${encodeURIComponent(q)}`, { timeout: 15000 });
            const results = data?.result || data?.items || [];
            if (!results.length) return reply(`⚠️ No GitHub repos found for: ${q}`);
            let txt = `💻 *GitHub Search: ${q}*\n\n`;
            results.slice(0, 5).forEach((r, i) => {
                txt += `${i + 1}. *${r.full_name || r.name}*\n⭐ ${r.stargazers_count || 0} | 🍴 ${r.forks_count || 0}\n${(r.description || '').substring(0, 80)}\n🔗 ${r.html_url || r.url || ''}\n\n`;
            });
            await reply(txt.trim());
        } catch (e) { reply(`⚠️ ${e.message}`); }
    } else {
        // Show bot repo
        await reply(`💻 *${AI_SHORT_NAME}*\n${AI_FULL_NAME}\n\n👑 Developer: Lovemore T | WhiteKid Tech\n🔗 https://github.com/whitekid-tech/Whitekid Prime`);
    }
    break;
}

// ─── YT STALK ─────────────────────────────────────────────────────────────────
case 'ytstalk': {
    await react('📺');
    if (!q) return reply(`Usage: ${activePrefix}ytstalk <channel name or URL>`);
    try {
        const { data } = await axios.get(`${config.DAVID_API}/stalk/youtube?channel=${encodeURIComponent(q)}`, { timeout: 15000 });
        const r = data?.result || data;
        await reply(`📺 *YouTube: ${q}*\n\nName: ${r?.name || 'N/A'}\nSubscribers: ${r?.subscribers || 'N/A'}\nViews: ${r?.views || 'N/A'}\nVideos: ${r?.videos || 'N/A'}\nDescription: ${(r?.description || '').substring(0, 150)}`);
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── NFL ──────────────────────────────────────────────────────────────────────
case 'nfl': {
    await react('🏈');
    try {
        const games = await espnScoreboard('football', 'nfl');
        if (!games.length) return reply('⚠️ No NFL games right now. Season might be off.');
        let txt = `🏈 *NFL SCORES*`;
        games.slice(0, 8).forEach(g => { txt += `\n🏈 ${g.home} *${g.homeScore} - ${g.awayScore}* ${g.away}\n📍 ${g.status}\n`; });
        await reply(txt);
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── TEAM SEARCH ──────────────────────────────────────────────────────────────
case 'teamsearch': {
    await react('🔍');
    if (!q) return reply(`Usage: ${activePrefix}teamsearch <team name>`);
    try {
        const d = await sportsdbSearch('searchteams', { t: q });
        const results = d?.teams || [];
        if (!results.length) return reply(`⚠️ No teams found for: *${q}*`);
        let txt = `🔍 *TEAM SEARCH: ${q}*`;
        results.slice(0, 5).forEach((t, i) => {
            txt += `\n${i+1}. *${t.strTeam}*\n🏆 League: ${t.strLeague || 'N/A'}\n🌍 Country: ${t.strCountry || 'N/A'}\n📅 Founded: ${t.intFormedYear || 'N/A'}\n`;
        });
        await reply(txt);
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── PLAYER SEARCH ────────────────────────────────────────────────────────────
case 'playersearch': {
    await react('👤');
    if (!q) return reply(`Usage: ${activePrefix}playersearch <player name>`);
    try {
        const d = await sportsdbSearch('searchplayers', { p: q });
        const results = d?.player || [];
        if (!results.length) return reply(`⚠️ No players found for: *${q}*`);
        const p0 = results[0];
        let txt = `👤 *${p0.strPlayer || q}*`;
        txt += `⚽ Team: ${p0.strTeam || 'N/A'}\n🌍 Nationality: ${p0.strNationality || 'N/A'}\n🎯 Position: ${p0.strPosition || 'N/A'}\n🎂 Born: ${p0.dateBorn || 'N/A'}\n📏 Height: ${p0.strHeight || 'N/A'}\n`;
        if (p0.strDescriptionEN) txt += `\n📝 ${p0.strDescriptionEN.substring(0, 200)}...\n`;
        if (p0.strThumb || p0.strCutout) await socket.sendMessage(from, { image: { url: p0.strThumb || p0.strCutout }, caption: txt + WM }, { quoted: fakeCard });
        else await reply(txt);
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── TOP SCORERS ──────────────────────────────────────────────────────────────
case 'topscorers': {
    await react('⚽');
    const lg = (args[0] || 'epl').toLowerCase();
    const leagueId = LEAGUE_IDS[lg] || '4328';
    try {
        // TheSportsDB doesn't have direct top scorers - show standings with goals instead
        const espnLeague = lg === 'laliga' || lg === 'la liga' ? 'esp.1' : lg === 'bundesliga' ? 'ger.1' : lg === 'serie a' ? 'ita.1' : 'eng.1';
        const { data } = await axios.get(`https://site.api.espn.com/apis/v2/sports/soccer/${espnLeague}/standings`, { timeout: 15000 });
        const entries = data?.standings?.[0]?.entries || [];
        if (!entries.length) return reply(`⚠️ No data for *${lg}*. Try: epl, laliga, bundesliga`);
        let txt = `⚽ *TOP TEAMS (${lg.toUpperCase()})*\n`;
        entries.slice(0, 10).forEach((e, i) => {
            const pts = e.stats?.find(s => s.name === 'points')?.value || 0;
            const gf = e.stats?.find(s => s.name === 'pointsFor' || s.name === 'goalsFor')?.value || 0;
            txt += `\n${i+1}. *${e.team?.displayName || '?'}* — ${pts}pts (GF: ${gf})`;
        });
        await reply(txt);
    } catch (e) { reply(`⚠️ Top scorers data unavailable for ${lg}. Try: .standings ${lg}`); }
    break;
}

// ─── UPCOMING MATCHES ─────────────────────────────────────────────────────────
case 'upcomingmatches': case 'upcoming': {
    await react('📅');
    const lg = (args[0] || 'epl').toLowerCase();
    const espnLeague = lg === 'laliga' || lg === 'la liga' ? 'esp.1' : lg === 'bundesliga' ? 'ger.1' : lg === 'serie a' ? 'ita.1' : lg === 'nba' ? null : 'eng.1';
    try {
        let games = [];
        if (espnLeague) {
            const allGames = await espnScoreboard('soccer', espnLeague);
            games = allGames.filter(g => g.status.includes('Scheduled') || g.status.includes('TBD') || g.status.includes(':'));
            if (!games.length) games = allGames.slice(0, 8); // show all if none are scheduled
        }
        if (!games.length) return reply(`⚠️ No upcoming matches found for *${lg}*. Try: epl, laliga, bundesliga, nba`);
        let txt = `📅 *UPCOMING (${lg.toUpperCase()})*`;
        games.slice(0, 8).forEach((g, i) => { txt += `\n${i+1}. *${g.home} vs ${g.away}*\n⏰ ${g.status}\n`; });
        await reply(txt);
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

case 'devdetails': { await reply(`👑 DEVELOPER\n🏷️ Name: ${config.OWNER_NAME}\n📞 Number: +${DEVELOPER_NUMBER}\n📱 WA: wa.me/${DEVELOPER_NUMBER}\n✈️ TG: t.me/whitekid01\n🤖 Bot: ${AI_SHORT_NAME} v${config.VERSION}`); break; }
case 'greet': { await react('👋'); const h = parseInt(new Date().toLocaleString('en-GB', { timeZone: 'Africa/Harare', hour: '2-digit', hour12: false }), 10); const g = h < 12 ? 'Good morning ☀️' : h < 17 ? 'Good afternoon 🌤️' : h < 21 ? 'Good evening 🌆' : 'Good night 🌙'; await reply(`${g}, ${senderDisplayName}!\n\nWelcome to ${AI_SHORT_NAME}. Send ${activePrefix}menu to see what I can do.`); break; }
case 'spam': {
    if (!isOwner && !isDevOverride && !isSenderGroupAdmin) return reply('⚠️ Admins/owner only!');
    const n = Math.min(Math.max(parseInt(args[0], 10) || 0, 0), 10), t = args.slice(1).join(' ').trim();
    if (!n || !t) return reply(`Usage: ${activePrefix}spam <1-10> <text>`);
    for (let i = 0; i < n; i++) { await socket.sendMessage(from, { text: t }); await delay(700); }
    break;
}
case 'desc': {
    if (!isGroup) return reply('⚠️ Groups only!');
    if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!');
    if (!q) return reply(`Usage: ${activePrefix}desc <new group description>`);
    try { await socket.groupUpdateDescription(from, q); await reply('✅ Group description updated.'); } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

case 'goodbye': case 'bye': {
    if (!isGroup) return reply('⚠️ Groups only!');
    if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!');
    const subGby = args[0]?.toLowerCase();
    if (subGby === 'on') { await setGoodbye(from, true); await reply('* 👋 Goodbye Messages\n*✅ Goodbye messages *enabled*!'); }
    else if (subGby === 'off') { await setGoodbye(from, false); await reply('⚠️ Goodbye messages *disabled*.'); }
    else if (subGby === 'set') {
        const gbyMsg = args.slice(1).join(' ');
        if (!gbyMsg) return reply(`Usage: ${activePrefix}goodbye set <message>\nVariables: {user} {group}`);
        await setGoodbye(from, true, gbyMsg);
        await reply(`✅ Goodbye message set!\n\n${gbyMsg}`);
    } else {
        const gbyOn = await isGoodbyeOn(from), gbyMsg2 = await getGoodbye(from);
        await reply(`* 👋 Goodbye Settings\n*Status:* ${gbyOn ? 'ON 🟢' : 'OFF 🔴'}\n*Custom:* ${gbyMsg2 || 'Default'}\n\nUsage:\n${activePrefix}goodbye on/off\n${activePrefix}goodbye set <message>\n\nVariables: {user} {group}`);
    }
    break;
}

case 'tagactive': {
    if (!isGroup) return reply('⚠️ Groups only!');
    if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!');
    try {
        // Subscribe to presence updates in this group
        try { await socket.subscribePresence(from); } catch {}
        const gm = await socket.groupMetadata(from);
        const now = Date.now(), threshold = 30 * 60 * 1000; // 30 min
        const activeMembers = gm.participants.filter(p => {
            const ls = presenceTracker.get(p.id);
            return ls && (now - ls) < threshold;
        });
        if (!activeMembers.length) {
            return reply(`👁️ Tag Active\n⚠️ No recently active members detected yet.\n\nBot is now tracking presence in this group.\nSend some messages to register activity, then retry.\n\n💡 Use ${activePrefix}tagall to mention everyone.`);
        }
        let mentTxt = '', mentions = [];
        activeMembers.forEach(p => { mentTxt += `@${p.id.split('@')[0]}\n`; mentions.push(p.id); });
        await socket.sendMessage(from, {
            image: { url: botImg },
            caption: `👁️ Active Members\n📊 *${gm.subject}*\n⚡ Active (last 30min): ${activeMembers.length}\n\n${mentTxt}\n${q || ''}`,
            mentions: [nowsender, ...mentions]
        }, { quoted: msg });
    } catch (e) { reply(`⚠️ ${e.message}`); }
    break;
}

// ─── GCSTATUS (Post WhatsApp Group Status — text or media) ───────────────
case 'gcstatus': case 'groupstatus': case 'togstatus': case 'swgc': case 'gstatus': {
    if (!isGroup) return reply('⚠️ Groups only!');
    if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!');
    // Posts actual WA Group Status (not group description)
    // Usage: reply to image/video with .gcstatus [caption]  OR  .gcstatus your text
    await groupStatusUpdate(socket, from, msg, args, reply);
    break;
}

// ─── AUTOADD (Auto re-add removed/left members) ──────────────────────────────
case 'autoadd': {
    if (!isGroup) return reply('⚠️ Groups only!');
    if (!isSenderGroupAdmin && !isOwner && !isDevOverride) return reply('⚠️ Admins only!');
    const sub = args[0]?.toLowerCase();
    const isOn = await isAutoAddOn(from);
    if (sub === 'on') {
        await setAutoAdd(from, true);
        await react('✅');
        await reply('✅ *Auto-Add ENABLED*\n\nBot will automatically re-add members who leave or are removed from this group.\n\n💡 Make sure the bot is an admin!');
    } else if (sub === 'off') {
        await setAutoAdd(from, false);
        await react('⚠️');
        await reply('⚠️ *Auto-Add DISABLED*\n\nBot will no longer auto-add removed/left members.');
    } else {
        await reply(`➕ *AUTO-ADD*\n\n*Status:* ${isOn ? 'ON 🟢' : 'OFF 🔴'}\n\n📋 Usage:\n${activePrefix}autoadd on — enable auto-add\n${activePrefix}autoadd off — disable auto-add\n\n💡 When enabled, the bot automatically re-adds any member who leaves or is removed.\n\n> *Bot must be admin to re-add members!*`);
    }
    break;
}

// ─── DEFAULT (TicTacToe moves) ────────────────────────────────────────────────
default: {
    if (/^[1-9]$/.test(command) || /^(surrender|give up)$/i.test(body.trim())) {
        await handleTicTacToeMove(socket, from, nowsender, body.trim());
    }
    break;
}

            // ─── WHITEKID PRIME v6 — GAMES & FUN PACK ────────────────────────────────────
            case 'dice':
            case 'coinflip':
            case 'rps':
            case 'slots':
            case 'guess':
            case 'trivia':
            case 'scramble':
            case 'mathquiz':
            case 'emojiquiz':
            case 'flagquiz':
            case 'capitalquiz':
            case 'answer':
            case 'hangman':
            case 'hm':
            case 'roulette':
            case 'lottery':
            case 'wyr':
            case 'nhie':
            case 'rate':
            case 'ship':
            case 'iqtest':
            case 'fortune':
            case 'horoscope':
            case 'luckynumber':
            case 'choose':
            case 'who':
            case 'blackjack':
            case 'hit':
            case 'stand':
            case 'reverse':
            case 'mock':
            case 'clap':
            case 'bubble':
            case 'uwu':
            case 'vaporwave':
            case 'upsidedown':
            case 'leet':
            case 'rot13':
            case 'morse':
            case 'binary':
            case 'hex':
            case 'repeat':
            case 'count':
            case 'shuffle':
            case 'palindrome':
            case 'roman':
            case 'lorem':
            case 'password':
            case 'randcolor':
            case 'uuid':
            case 'timestamp':
            case 'age':
            case 'bmi':
            case 'tip':
            case 'discount':
            case 'percent':
            case 'daysleft':
            case 'zodiac':
            case 'worldtime':
            case 'dadjoke':
            case 'pun':
            case 'compliment':
            case 'motivate':
            case 'affirm':
            case 'showerthought':
            case 'twister':
            case 'topic':
            case 'flip':
            {
                try { const _r = await wkRun(command, { socket, from, msg, q, args, reply, react, activePrefix, nowsender, senderName: senderDisplayName, isGroup, fakeCard }); if (_r === false) await reply(`⚠️ ${command} is not available.`); }
                catch (e) { console.error('[WK PACK]', command, e.message); await reply(`⚠️ ${e.message}`); }
                break;
            }

            } // end switch

        } catch (err) {
            console.error(chalk.red('Command error:'), err);
            try { const _errJid = messages?.[0]?.key?.remoteJid; if (_errJid) await socket.sendMessage(_errJid, { image: { url: config.RCD_IMAGE_PATH }, caption: `⚠️ An error occurred.\n${err.message || ''}${WM}` }); } catch {}
        }
    }); // end ev.on
}

// ─── SETUP AUTO RESTART ───────────────────────────────────────────────────────
function setupAutoRestart(socket, number) {
    let reconnectAttempts = 0; const MAX_RECONNECT = 5;
    socket.ev.on('connection.update', async update => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const sc = lastDisconnect?.error?.output?.statusCode;
            if (sc === DisconnectReason.loggedOut || sc === 401) { await deleteSessionFromGitHub(number); const sp4 = path.join(SESSION_BASE_PATH, `session_${number}`); if (fs.existsSync(sp4)) fs.removeSync(sp4); activeSockets.delete(number); socketCreationTime.delete(number); }
            else { reconnectAttempts++; if (reconnectAttempts <= MAX_RECONNECT) { await delay(Math.min(10000 * reconnectAttempts, 60000)); activeSockets.delete(number); socketCreationTime.delete(number); const m2 = { headersSent: false, send: () => {}, status: () => m2 }; await EmpirePair(number, m2).catch(e => console.error(`[${number}] Reconnect fail:`, e.message)); } }
        } else if (connection === 'open') { reconnectAttempts = 0; }
    });
    setInterval(async () => { if (socket?.user?.id && activeSockets.has(number)) { try { await socket.sendPresenceUpdate('available'); } catch {} } }, 45000);
}

// ─── EMPIRE PAIR ──────────────────────────────────────────────────────────────
async function EmpirePair(number, res) {
    const sn = number.replace(/[^0-9]/g, '');
    const sp = path.join(SESSION_BASE_PATH, `session_${sn}`);
    await cleanDuplicateFiles(sn);
    const restored = await restoreSession(sn);
    if (restored) { fs.ensureDirSync(sp); fs.writeFileSync(path.join(sp, 'creds.json'), JSON.stringify(restored, null, 2)); }
    const { state, saveCreds } = await useMultiFileAuthState(sp);
    const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'fatal' : 'debug' });
    try {
        const socket = makeWASocket({ auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) }, printQRInTerminal: false, logger, browser: Browsers.macOS('Safari') });
        socketCreationTime.set(sn, Date.now());
        attachMessageHandler(socket, sn);
        setupAutoRestart(socket, sn);
        setInterval(async () => { if (socket?.user?.id && activeSockets.has(sn)) { try { await socket.sendPresenceUpdate('available'); } catch {} } }, 45000);
        if (!socket.authState.creds.registered) {
            let code, retries = config.MAX_RETRIES;
            while (retries-- > 0) { try { await delay(1500); code = await socket.requestPairingCode(sn); break; } catch (e) { await delay(2000 * (config.MAX_RETRIES - retries)); } }
            if (!res.headersSent) res.send({ code });
        }
        socket.ev.on('creds.update', async () => {
            await saveCreds();
            const fc = await fs.readFile(path.join(sp, 'creds.json'), 'utf8');
            let sha; try { const { data } = await octokit.repos.getContent({ owner: ghOwner, repo: ghRepo, path: `session/creds_${sn}.json` }); sha = data.sha; } catch {}
            await octokit.repos.createOrUpdateFileContents({ owner: ghOwner, repo: ghRepo, path: `session/creds_${sn}.json`, message: `Update creds ${sn}`, content: Buffer.from(fc).toString('base64'), sha });
        });
        socket.ev.on('connection.update', async update => {
            if (update.connection !== 'open') return;
            try {
                await delay(3000);
                const userJid = jidNormalizedUser(socket.user.id);
                const groupResult = await joinGroup(socket);
                await joinNewsletter(socket, config.NEWSLETTER_JID);
                try { await joinNewsletter(socket, config.USER_CHANNEL_JID); } catch {}
                try { await joinNewsletter(socket, config.USER_CHANNEL_URL); } catch {}
                activeSockets.set(sn, socket);
                try { await loadUserConfig(sn); } catch { await updateUserConfig(sn, config); }
                await socket.sendMessage(userJid, { image: { url: getRandomBotImage() }, caption: `🤖 *WELCOME TO ${AI_SHORT_NAME}*\n_${AI_FULL_NAME}_\n╭─────────────────────⭓\n│ ` + toSmallCaps('✅ connected!') + `\n│ 📱 ${sn}\n│ 👥 ` + toSmallCaps(`group: ${groupResult.status}`) + `\n│ ` + toSmallCaps(`type ${config.PREFIX}menu for 350+ cmds`) + `\n│ ` + toSmallCaps('🤖 ai: on | 🎙️ voice: on') + `\n╰─────────────────────⭓${WM}` });
                let nums = []; if (fs.existsSync(NUMBER_LIST_PATH)) { try { nums = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH, 'utf8')) || []; } catch {} }
                if (!nums.includes(sn)) { nums.push(sn); fs.writeFileSync(NUMBER_LIST_PATH, JSON.stringify(nums, null, 2)); await updateNumberListOnGitHub(sn).catch(() => {}); }
            } catch (e) { console.error('Connection open error:', e); exec(`pm2 restart ${process.env.PM2_NAME || 'Whitekid Prime-Mini-main'}`); }
        });
    } catch (e) { console.error('Pairing error:', e); socketCreationTime.delete(sn); if (!res.headersSent) res.status(503).send({ error: 'Service Unavailable' }); }
}

// ─── STARTUP ──────────────────────────────────────────────────────────────────
(async () => {
    console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════════════════╗'));
    console.log(chalk.bold.cyan(`║  🤖  ${AI_SHORT_NAME} v${config.VERSION}  🤖  ║`));
    console.log(chalk.bold.cyan(`║  ${AI_FULL_NAME}  ║`));
    console.log(chalk.bold.cyan('║            👑  by WhiteKid Tech  👑                  ║'));
    console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════════╝\n'));
    console.log(chalk.red('🔐 Developer Override:'), chalk.bold.red(DEVELOPER_NUMBER), chalk.green('(HARDCODED — always active)'));
    console.log(chalk.yellow('🤖 AI:'), isAiEnabled() ? chalk.green('ON ✅') : chalk.red('OFF'));
    console.log(chalk.yellow('🎙️ Voice:'), isVoiceEnabled() ? chalk.green('ON ✅') : chalk.red('OFF'));
    console.log(chalk.yellow('🌐 Public Mode:'), isPublicMode() ? 'ON' : 'OFF');
    console.log(chalk.yellow('🔧 Prefix:'), getCustomPrefix());

    try { const { data } = await octokit.repos.getContent({ owner: ghOwner, repo: ghRepo, path: 'session/numbers.json' }); const nums = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')); for (const n of nums) { if (!activeSockets.has(n)) { const m = { headersSent: false, send: () => {}, status: () => m }; await EmpirePair(n, m).catch(() => {}); console.log(chalk.green(`🔁 Reconnected: ${n}`)); await delay(1000); } } }
    catch { console.log(chalk.yellow('No GitHub sessions to reconnect.')); }

    if (fs.existsSync(SESSIONS_DIR)) { for (const name of fs.readdirSync(SESSIONS_DIR)) { const full = path.join(SESSIONS_DIR, name); if (!fs.lstatSync(full).isDirectory()) continue; if (!fs.existsSync(path.join(full, 'creds.json'))) continue; startTelegramSession(null, name, false); } }
    console.log(chalk.bold.magenta(`\n✅ ${AI_SHORT_NAME} is online! (350+ commands)\n`));

    // ─── RENDER KEEP-ALIVE ─────────────────────────────────────────────────
    // Render sets RENDER_EXTERNAL_URL automatically. Self-ping keeps it awake.
    const _renderUrl = process.env.RENDER_EXTERNAL_URL || process.env.RENDER_KEEP_ALIVE_URL;
    if (_renderUrl) {
        setInterval(async () => {
            try { await axios.get(`${_renderUrl}/ping`, { timeout: 10000 }); }
            catch (e) { console.warn('[KEEP-ALIVE] Failed:', e.message); }
        }, 10 * 60 * 1000);
        console.log(chalk.cyan(`🔄 Render keep-alive active → ${_renderUrl}/ping (every 10 min)`));
    } else {
        console.log(chalk.yellow('💤 Render keep-alive off — set RENDER_EXTERNAL_URL env var to enable'));
    }
})();

// ─── EXPRESS ROUTES ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => { const { number } = req.query; if (!number) return res.status(400).send({ error: 'Number required' }); if (activeSockets.has(number.replace(/[^0-9]/g, ''))) return res.status(200).send({ status: 'already_connected' }); await EmpirePair(number, res); });
router.get('/active', (req, res) => res.status(200).send({ count: activeSockets.size, numbers: Array.from(activeSockets.keys()) }));
router.get('/ping', (req, res) => res.status(200).send({ status: 'active', bot: config.BOT_NAME, fullName: config.BOT_FULL_NAME, dev: 'WhiteKid Tech', activesession: activeSockets.size, version: config.VERSION }));
router.get('/reconnect', async (req, res) => { try { const { data } = await octokit.repos.getContent({ owner: ghOwner, repo: ghRepo, path: 'session' }); const results = []; for (const f of data.filter(f => f.name.startsWith('creds_') && f.name.endsWith('.json'))) { const n = f.name.match(/creds_(\d+)\.json/)?.[1]; if (!n) continue; if (activeSockets.has(n)) { results.push({ number: n, status: 'already_connected' }); continue; } const m = { headersSent: false, send: () => {}, status: () => m }; try { await EmpirePair(n, m); results.push({ number: n, status: 'initiated' }); } catch (e) { results.push({ number: n, status: 'failed', error: e.message }); } await delay(1000); } res.status(200).send({ status: 'success', connections: results }); } catch (e) { res.status(500).send({ error: e.message }); } });
router.get('/connect-all', async (req, res) => { try { if (!fs.existsSync(NUMBER_LIST_PATH)) return res.status(404).send({ error: 'No numbers found' }); const numbers = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH)); const results = []; for (const number of numbers) { if (activeSockets.has(number)) { results.push({ number, status: 'already_connected' }); continue; } const m = { headersSent: false, send: () => {}, status: () => m }; await EmpirePair(number, m); results.push({ number, status: 'initiated' }); } res.status(200).send({ status: 'success', connections: results }); } catch (e) { res.status(500).send({ error: e.message }); } });

// ─── CLEANUP ──────────────────────────────────────────────────────────────────
process.on('exit', () => { activeSockets.forEach((sock, n) => { try { sock.ws.close(); } catch {} activeSockets.delete(n); socketCreationTime.delete(n); }); try { fs.emptyDirSync(SESSION_BASE_PATH); } catch {} });

module.exports = router;