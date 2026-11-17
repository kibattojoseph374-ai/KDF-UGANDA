import 'dotenv/config';
import crypto from 'crypto';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const VAULT_DIR = path.resolve(__dirname, '.kdf_vault');
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

// --- AES-256-GCM Server-Side Encryption Vault ---
const RAW_SECRET =
  process.env.KDF_VAULT_SECRET ||
  process.env.GEMINI_API_KEY ||
  'kdf-uganda-mityana-box-2678-vault-key';
const VAULT_KEY = crypto.scryptSync(RAW_SECRET, 'kdf-uganda-salt-2026', 32);

interface EncryptedPayload {
  iv: string;
  tag: string;
  data: string;
}

function encryptObject<T>(obj: T): EncryptedPayload {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', VAULT_KEY, iv);
  const plaintext = JSON.stringify(obj);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted.toString('hex'),
  };
}

function decryptObject<T>(payload: EncryptedPayload): T {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    VAULT_KEY,
    Buffer.from(payload.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.data, 'hex')),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString('utf8')) as T;
}

function readEncryptedStore<T>(name: string, fallback: T): T {
  const filePath = path.join(VAULT_DIR, `${name}.enc.json`);
  if (!fs.existsSync(filePath)) {
    writeEncryptedStore(name, fallback);
    return fallback;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as EncryptedPayload;
    return decryptObject<T>(parsed);
  } catch {
    return fallback;
  }
}

function writeEncryptedStore<T>(name: string, data: T): void {
  const filePath = path.join(VAULT_DIR, `${name}.enc.json`);
  const encrypted = encryptObject(data);
  fs.writeFileSync(filePath, JSON.stringify(encrypted, null, 2), 'utf8');
}

function signToken(userId: string): string {
  const sig = crypto.createHmac('sha256', VAULT_KEY).update(userId).digest('hex');
  return `${userId}.${sig}`;
}

function verifyToken(token?: string): string | null {
  if (!token || !token.includes('.')) return null;
  const [userId, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', VAULT_KEY).update(userId).digest('hex');
  try {
    if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return userId;
    }
  } catch {
    return null;
  }
  return null;
}

function hashSecret(secret: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(secret, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifySecret(secret: string, stored?: string): boolean {
  if (!stored || !stored.includes(':')) return false;
  const [salt, expectedHex] = stored.split(':');
  const derived = crypto.scryptSync(secret, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  try {
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// --- Seed Initial Operational Records (Encrypted at Rest) ---
interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  district: string;
  role: string;
  passwordHash?: string;
  passkeyHash?: string;
  photoCount?: number;
  niraDetails?: {
    nin?: string;
    cardNumber?: string;
    birthDistrict?: string;
    issueStatus?: string;
    verifiedSource?: string;
  };
  socialLinks: Record<string, string>;
  createdAt: string;
}

interface ApplicationRecord {
  id: string;
  trackingCode: string;
  applicantName: string;
  contact: string;
  beneficiaryGroup: string;
  serviceCategory: string;
  district: string;
  summary: string;
  status: 'Submitted' | 'Under Review' | 'Verified' | 'Approved';
  createdAt: string;
}

interface DocumentRecord {
  id: string;
  trackingCode: string;
  ownerName: string;
  title: string;
  docType: string;
  fileName: string;
  fileSize: number;
  sha256: string;
  status: 'Submitted' | 'Under Review' | 'Verified' | 'Approved' | 'Action Needed';
  reviewer: string;
  uploadedAt: string;
  encryptedNotes: string;
}

interface TrackingRecord {
  id: string;
  personName: string;
  roleType: 'Employee' | 'Applicant' | 'Field Specialist';
  department: string;
  district: string;
  coordinates?: { lat: number; lng: number };
  statusNote: string;
  updatedAt: string;
}

interface ContactVaultEntry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  relation: string;
  addedAt: string;
}

const DEFAULT_APPLICATIONS: ApplicationRecord[] = [
  {
    id: 'app-1',
    trackingCode: 'KDF-2026-1042',
    applicantName: 'Nalumansi Grace',
    contact: '+256 772 418920',
    beneficiaryGroup: 'Girl Child & Women',
    serviceCategory: 'Education and Training',
    district: 'Mityana District',
    summary: 'Secondary school bursary & tailoring workshop enrollment.',
    status: 'Verified',
    createdAt: '2026-11-10T09:30:00Z',
  },
  {
    id: 'app-2',
    trackingCode: 'KDF-2026-1058',
    applicantName: 'Ssemakula Peter',
    contact: '+256 704 883211',
    beneficiaryGroup: 'Elderly & Disabled',
    serviceCategory: 'Health and Medical',
    district: 'Kassanda District',
    summary: 'Mobility support and rural clinic medical follow-up.',
    status: 'Approved',
    createdAt: '2026-11-12T14:15:00Z',
  },
  {
    id: 'app-3',
    trackingCode: 'KDF-2026-1071',
    applicantName: 'Namukasa Sarah',
    contact: '+256 781 552094',
    beneficiaryGroup: 'Widows',
    serviceCategory: 'Rural Farming & Harvest Markets',
    district: 'Mubende District',
    summary: 'Improved maize/banana seedlings and cooperative harvest market linkage.',
    status: 'Under Review',
    createdAt: '2026-11-15T11:00:00Z',
  },
];

const DEFAULT_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'doc-1',
    trackingCode: 'KDF-2026-1042',
    ownerName: 'Nalumansi Grace',
    title: 'LC1 Community Recommendation Letter',
    docType: 'Community Recommendation',
    fileName: 'lc1_recommendation_mityana.pdf',
    fileSize: 245120,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'Verified',
    reviewer: 'Nakkazi Josemine (M&E)',
    uploadedAt: '2026-11-10T09:42:00Z',
    encryptedNotes: 'Verified with Mityana sub-county office.',
  },
  {
    id: 'doc-2',
    trackingCode: 'KDF-2026-1058',
    ownerName: 'Ssemakula Peter',
    title: 'District Medical Assessment Certificate',
    docType: 'Medical Certification',
    fileName: 'medical_assessment_kassanda.pdf',
    fileSize: 389040,
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    status: 'Approved',
    reviewer: 'Mugabirwe Jackline (Medical Director)',
    uploadedAt: '2026-11-12T15:10:00Z',
    encryptedNotes: 'Cleared for rehabilitation & assistive care.',
  },
];

const DEFAULT_TRACKING: TrackingRecord[] = [
  {
    id: 'trk-1',
    personName: 'Namutebi Josephine',
    roleType: 'Employee',
    department: 'Regional Directorate (Central)',
    district: 'Mityana District HQ, Uganda',
    coordinates: { lat: 0.4175, lng: 32.0228 },
    statusNote: 'Inspecting community school renovation site and OVC registry.',
    updatedAt: '2026-11-17T08:15:00Z',
  },
  {
    id: 'trk-2',
    personName: 'Mugabirwe Jackline',
    roleType: 'Employee',
    department: 'Medical & HIV/AIDS Outreach',
    district: 'Kassanda Rural Health Outreach',
    coordinates: { lat: 0.5582, lng: 31.8944 },
    statusNote: 'Conducting mobile HIV/AIDS awareness and maternal health clinic.',
    updatedAt: '2026-11-17T09:05:00Z',
  },
  {
    id: 'trk-3',
    personName: 'Bunjo Robert Son',
    roleType: 'Employee',
    department: 'Human Resource Management',
    district: 'Mityana District HQ, P.O Box 2678',
    coordinates: { lat: 0.418, lng: 32.024 },
    statusNote: 'Reviewing field officer applicant dossiers and staff deployment.',
    updatedAt: '2026-11-17T09:30:00Z',
  },
  {
    id: 'trk-4',
    personName: 'Nalumansi Grace',
    roleType: 'Applicant',
    department: 'Education & Training Bursary',
    district: 'Busimbi Division, Mityana',
    statusNote: 'Verification complete — awaiting term placement disbursement.',
    updatedAt: '2026-11-16T16:40:00Z',
  },
];

// --- Gemini Client Helper ---
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractGeminiErrorMessage(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err || 'AI service request failed.');
  let parsedMessage = raw;
  let parsedCode = 500;

  // Unwrap nested JSON error payloads emitted by @google/genai
  try {
    const outer = JSON.parse(raw);
    if (outer?.error) {
      parsedCode = Number(outer.error.code) || parsedCode;
      parsedMessage = String(outer.error.message || raw);
    } else if (outer?.message) {
      parsedMessage = String(outer.message);
    }
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const inner = JSON.parse(jsonMatch[0]);
        if (inner?.error?.message) {
          parsedCode = Number(inner.error.code) || parsedCode;
          parsedMessage = String(inner.error.message);
        }
      } catch {
        // Keep raw message if not JSON
      }
    }
  }

  if (
    parsedCode === 503 ||
    parsedCode === 429 ||
    /high demand|unavailable|resource_exhausted|quota|rate limit|timed out/i.test(parsedMessage)
  ) {
    return {
      status: 503,
      message: 'The AI service is temporarily busy due to high demand. Please wait a moment and try again.',
    };
  }

  return {
    status: parsedCode >= 400 && parsedCode < 600 ? parsedCode : 500,
    message: parsedMessage.trim() || 'Unable to complete AI request right now.',
  };
}

async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: Parameters<GoogleGenAI['models']['generateContent']>[0],
  retries = 1
) {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await Promise.race([
        ai.models.generateContent(params),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI request timed out after 12 seconds.')), 12000)
        ),
      ]);
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err || '');
      const isTransient = /503|429|UNAVAILABLE|high demand|RESOURCE_EXHAUSTED|temporarily|timed out/i.test(
        msg
      );
      if (!isTransient || attempt === retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw lastErr;
}

// --- E.164 / African Telecom Analyzer ---
const PHONE_COUNTRY_MAP: Array<{
  prefix: string;
  country: string;
  region: string;
  timezone: string;
  carriers: Array<{ code: string; name: string }>;
}> = [
  {
    prefix: '+256',
    country: 'Uganda',
    region: 'East Africa',
    timezone: 'EAT (UTC+3)',
    carriers: [
      { code: '77', name: 'MTN Uganda' },
      { code: '78', name: 'MTN Uganda' },
      { code: '76', name: 'MTN Uganda' },
      { code: '70', name: 'Airtel Uganda' },
      { code: '75', name: 'Airtel Uganda' },
      { code: '74', name: 'Airtel Uganda' },
      { code: '71', name: 'Uganda Telecom (UTL)' },
      { code: '73', name: 'K2 / Airtel Uganda' },
      { code: '72', name: 'Lycamobile Uganda' },
    ],
  },
  {
    prefix: '+254',
    country: 'Kenya',
    region: 'East Africa',
    timezone: 'EAT (UTC+3)',
    carriers: [
      { code: '70', name: 'Safaricom Kenya' },
      { code: '71', name: 'Safaricom Kenya' },
      { code: '72', name: 'Safaricom Kenya' },
      { code: '79', name: 'Safaricom Kenya' },
      { code: '73', name: 'Airtel Kenya' },
      { code: '78', name: 'Airtel Kenya' },
      { code: '77', name: 'Telkom Kenya' },
    ],
  },
  {
    prefix: '+255',
    country: 'Tanzania',
    region: 'East Africa',
    timezone: 'EAT (UTC+3)',
    carriers: [
      { code: '74', name: 'Vodacom Tanzania' },
      { code: '75', name: 'Vodacom Tanzania' },
      { code: '76', name: 'Vodacom Tanzania' },
      { code: '78', name: 'Airtel Tanzania' },
      { code: '71', name: 'Tigo / Yas Tanzania' },
      { code: '65', name: 'Tigo / Yas Tanzania' },
    ],
  },
  {
    prefix: '+250',
    country: 'Rwanda',
    region: 'East Africa',
    timezone: 'CAT (UTC+2)',
    carriers: [
      { code: '78', name: 'MTN Rwanda' },
      { code: '79', name: 'MTN Rwanda' },
      { code: '73', name: 'Airtel Rwanda' },
    ],
  },
  {
    prefix: '+234',
    country: 'Nigeria',
    region: 'West Africa',
    timezone: 'WAT (UTC+1)',
    carriers: [
      { code: '803', name: 'MTN Nigeria' },
      { code: '806', name: 'MTN Nigeria' },
      { code: '802', name: 'Airtel Nigeria' },
      { code: '805', name: 'Globacom (Glo)' },
    ],
  },
  {
    prefix: '+27',
    country: 'South Africa',
    region: 'Southern Africa',
    timezone: 'SAST (UTC+2)',
    carriers: [
      { code: '82', name: 'Vodacom South Africa' },
      { code: '83', name: 'MTN South Africa' },
      { code: '84', name: 'Cell C' },
    ],
  },
  {
    prefix: '+233',
    country: 'Ghana',
    region: 'West Africa',
    timezone: 'GMT (UTC+0)',
    carriers: [
      { code: '24', name: 'MTN Ghana' },
      { code: '54', name: 'MTN Ghana' },
      { code: '20', name: 'Telecel Ghana' },
    ],
  },
  {
    prefix: '+251',
    country: 'Ethiopia',
    region: 'East Africa',
    timezone: 'EAT (UTC+3)',
    carriers: [
      { code: '9', name: 'Ethio Telecom' },
      { code: '7', name: 'Safaricom Ethiopia' },
    ],
  },
  {
    prefix: '+1',
    country: 'United States / Canada',
    region: 'North America',
    timezone: 'UTC-5 to UTC-8',
    carriers: [],
  },
  {
    prefix: '+44',
    country: 'United Kingdom',
    region: 'Europe',
    timezone: 'GMT/BST',
    carriers: [],
  },
];

const KNOWN_KDF_DIRECTORY = [
  { name: 'KDF Uganda Official Office Line', role: 'Headquarters Desk', phone: '+256789509103', address: 'P.O Box 2678, Mityana District, Uganda' },
  { name: 'Kibatto Joseph', role: 'Director', phone: '+256770610329', address: 'KDF Executive Office, Mityana District, Uganda' },
  { name: 'Namwanje Proscovia', role: 'Secretary', phone: '+256776391872', address: 'KDF Secretariat, Mityana District, Uganda' },
  { name: 'Nakyejwe Sherina', role: 'Chief Executive Director', phone: '+256783913861', address: 'KDF Executive Wing, Mityana District, Uganda' },
  { name: 'Namayanja Oivia', role: 'Chief Advisor', phone: '+256709270120', address: 'KDF Advisory Desk, Uganda' },
  { name: 'Mugabirwe Jackline', role: 'Medical Director', phone: '+256731509445', address: 'KDF Health & Medical Unit, Mityana, Uganda' },
  { name: 'Akankunda Violah', role: 'Specialist', phone: '+256706600148', address: 'KDF Specialist Care Unit, Uganda' },
  { name: 'Sempa Abdulrahman', role: 'Managing Director', phone: '+25670762727481', address: 'KDF Management Operations, Uganda' },
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  function sanitizeUser(u: UserRecord) {
    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      country: u.country,
      district: u.district,
      role: u.role,
      photoCount: u.photoCount || 0,
      hasPasskey: Boolean(u.passkeyHash),
      niraDetails: u.niraDetails || {},
      socialLinks: u.socialLinks || {},
      createdAt: u.createdAt,
    };
  }

  // --- Auth / Registration with Passkey, Password & 3-Photo Verification ---
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { fullName, email, phone, country, district, role, password, passkey, photos } =
      req.body || {};
    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    const cleanName = typeof fullName === 'string' ? fullName.trim() : '';
    const cleanPass = typeof password === 'string' ? password.trim() : '';
    const cleanPasskey = typeof passkey === 'string' ? passkey.trim() : '';
    const photoArray = Array.isArray(photos) ? photos : [];

    if (!cleanName || (!cleanEmail && !cleanPhone)) {
      res.status(400).json({
        error: 'Full name and at least an email address or phone number are required.',
      });
      return;
    }

    if (!cleanPasskey || cleanPasskey.length < 4) {
      res.status(400).json({
        error: 'Please create a Passkey (at least 4 characters or digits) to protect your data.',
      });
      return;
    }

    if (photoArray.length < 3) {
      res.status(400).json({
        error: 'Please upload or capture at least 3 verification photos to access all information.',
      });
      return;
    }

    const users = readEncryptedStore<UserRecord[]>('users', []);
    const duplicate = users.find(
      (u) =>
        (cleanEmail && u.email.toLowerCase() === cleanEmail.toLowerCase()) ||
        (cleanPhone && u.phone.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, ''))
    );

    if (duplicate) {
      res.status(409).json({
        error: 'An account with this email or phone already exists. Please use Sign In or Reset Password.',
      });
      return;
    }

    const userId = crypto.randomUUID();
    // Encrypt the 3+ verification photos separately at rest
    writeEncryptedStore(`user_photos_${userId}`, {
      count: photoArray.length,
      photos: photoArray.slice(0, 6),
      uploadedAt: new Date().toISOString(),
    });

    const newUser: UserRecord = {
      id: userId,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      country: country || 'Uganda',
      district: district || 'Mityana District',
      role: role || 'Applicant / Community Member',
      passwordHash: hashSecret(cleanPass || cleanPasskey),
      passkeyHash: hashSecret(cleanPasskey),
      photoCount: photoArray.length,
      niraDetails: {},
      socialLinks: {},
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeEncryptedStore('users', users);

    const token = signToken(newUser.id);
    res.json({
      token,
      user: sanitizeUser(newUser),
      encryption: 'AES-256-GCM + scrypt',
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, secret } = req.body || {};
    const idClean = String(identifier || '').trim().toLowerCase();
    const secClean = String(secret || '').trim();
    if (!idClean || !secClean) {
      res.status(400).json({ error: 'Email or phone number and password/passkey are required.' });
      return;
    }
    const users = readEncryptedStore<UserRecord[]>('users', []);
    const user = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === idClean) ||
        (u.phone && u.phone.replace(/\s+/g, '') === idClean.replace(/\s+/g, ''))
    );
    if (!user) {
      res.status(404).json({ error: 'Account not found. Please register a new account.' });
      return;
    }
    const valid =
      verifySecret(secClean, user.passwordHash) || verifySecret(secClean, user.passkeyHash);
    if (!valid) {
      res.status(401).json({ error: 'Incorrect password or passkey. You can reset it if forgotten.' });
      return;
    }
    const token = signToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  });

  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { identifier, fullName, newPassword, newPasskey } = req.body || {};
    const idClean = String(identifier || '').trim().toLowerCase();
    const nameClean = String(fullName || '').trim().toLowerCase();
    if (!idClean || !nameClean || (!newPassword && !newPasskey)) {
      res.status(400).json({
        error: 'Provide your registered email/phone, full name for verification, and a new password/passkey.',
      });
      return;
    }
    const users = readEncryptedStore<UserRecord[]>('users', []);
    const idx = users.findIndex(
      (u) =>
        ((u.email && u.email.toLowerCase() === idClean) ||
          (u.phone && u.phone.replace(/\s+/g, '') === idClean.replace(/\s+/g, ''))) &&
        u.fullName.toLowerCase() === nameClean
    );
    if (idx === -1) {
      res.status(404).json({
        error: 'No matching account found with that email/phone and full name.',
      });
      return;
    }
    if (newPassword) users[idx].passwordHash = hashSecret(String(newPassword).trim());
    if (newPasskey) users[idx].passkeyHash = hashSecret(String(newPasskey).trim());
    writeEncryptedStore('users', users);
    res.json({ ok: true, message: 'Password and passkey reset successfully. You may now sign in.' });
  });

  app.post('/api/auth/verify-passkey', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const userId = verifyToken(token);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { passkey } = req.body || {};
    const users = readEncryptedStore<UserRecord[]>('users', []);
    const user = users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const ok =
      !user.passkeyHash ||
      verifySecret(String(passkey || '').trim(), user.passkeyHash) ||
      verifySecret(String(passkey || '').trim(), user.passwordHash);
    if (!ok) {
      res.status(403).json({ error: 'Invalid Passkey. Vault remains locked.' });
      return;
    }
    res.json({ unlocked: true });
  });

  app.post('/api/auth/nira', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const userId = verifyToken(token);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const users = readEncryptedStore<UserRecord[]>('users', []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    users[idx].niraDetails = req.body?.niraDetails || {};
    writeEncryptedStore('users', users);
    res.json({ user: sanitizeUser(users[idx]) });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const userId = verifyToken(token);
    if (!userId) {
      res.status(401).json({ error: 'Registration required.' });
      return;
    }
    const users = readEncryptedStore<UserRecord[]>('users', []);
    const user = users.find((u) => u.id === userId);
    if (!user) {
      res.status(401).json({ error: 'Account not found.' });
      return;
    }
    res.json({ user: sanitizeUser(user), encryption: 'AES-256-GCM + scrypt' });
  });

  app.post('/api/auth/social-links', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const userId = verifyToken(token);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const users = readEncryptedStore<UserRecord[]>('users', []);
    const user = users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    user.socialLinks = req.body?.socialLinks || {};
    writeEncryptedStore('users', users);
    res.json({ user: sanitizeUser(user) });
  });

  // --- Applicant Registrations ---
  app.get('/api/applications', (_req: Request, res: Response) => {
    const apps = readEncryptedStore<ApplicationRecord[]>('applications', DEFAULT_APPLICATIONS);
    res.json({ applications: apps });
  });

  app.post('/api/applications', (req: Request, res: Response) => {
    const { applicantName, contact, beneficiaryGroup, serviceCategory, district, summary } =
      req.body || {};
    if (!applicantName || !contact || !serviceCategory) {
      res.status(400).json({ error: 'Applicant name, contact, and service category are required.' });
      return;
    }
    const apps = readEncryptedStore<ApplicationRecord[]>('applications', DEFAULT_APPLICATIONS);
    const trackingCode = `KDF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const record: ApplicationRecord = {
      id: crypto.randomUUID(),
      trackingCode,
      applicantName: String(applicantName).trim(),
      contact: String(contact).trim(),
      beneficiaryGroup: String(beneficiaryGroup || 'Orphans & Vulnerable Children (OVC)'),
      serviceCategory: String(serviceCategory),
      district: String(district || 'Mityana District'),
      summary: String(summary || ''),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };
    apps.unshift(record);
    writeEncryptedStore('applications', apps);
    res.json({ application: record });
  });

  // --- Document Upload & Verification Status ---
  app.get('/api/documents', (_req: Request, res: Response) => {
    const docs = readEncryptedStore<DocumentRecord[]>('documents', DEFAULT_DOCUMENTS);
    res.json({ documents: docs });
  });

  app.post('/api/documents/upload', (req: Request, res: Response) => {
    const { ownerName, trackingCode, title, docType, fileName, fileSize, fileBase64, notes } =
      req.body || {};
    if (!ownerName || !title || !fileName) {
      res.status(400).json({ error: 'Owner name, document title, and file are required.' });
      return;
    }
    const rawContent = typeof fileBase64 === 'string' ? fileBase64 : `${fileName}:${Date.now()}`;
    const sha256 = crypto.createHash('sha256').update(rawContent).digest('hex');

    // Encrypt file payload separately at rest
    const docId = crypto.randomUUID();
    writeEncryptedStore(`doc_blob_${docId}`, {
      fileName,
      content: rawContent,
      sha256,
    });

    const docs = readEncryptedStore<DocumentRecord[]>('documents', DEFAULT_DOCUMENTS);
    const newDoc: DocumentRecord = {
      id: docId,
      trackingCode: String(trackingCode || `KDF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`),
      ownerName: String(ownerName).trim(),
      title: String(title).trim(),
      docType: String(docType || 'Certification'),
      fileName: String(fileName),
      fileSize: Number(fileSize || 0),
      sha256,
      status: 'Submitted',
      reviewer: 'Pending M&E Assignment (Nakkazi Josemine)',
      uploadedAt: new Date().toISOString(),
      encryptedNotes: String(notes || 'Encrypted with AES-256-GCM in KDF Vault.'),
    };
    docs.unshift(newDoc);
    writeEncryptedStore('documents', docs);
    res.json({ document: newDoc });
  });

  app.patch('/api/documents/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, reviewer, notes } = req.body || {};
    const docs = readEncryptedStore<DocumentRecord[]>('documents', DEFAULT_DOCUMENTS);
    const idx = docs.findIndex((d) => d.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }
    if (status) docs[idx].status = status;
    if (reviewer) docs[idx].reviewer = reviewer;
    if (notes) docs[idx].encryptedNotes = notes;
    writeEncryptedStore('documents', docs);
    res.json({ document: docs[idx] });
  });

  // --- Employee & Applicant Tracking ---
  app.get('/api/tracking', (_req: Request, res: Response) => {
    const records = readEncryptedStore<TrackingRecord[]>('tracking', DEFAULT_TRACKING);
    res.json({ records });
  });

  app.post('/api/tracking/checkin', (req: Request, res: Response) => {
    const { personName, roleType, department, district, coordinates, statusNote } = req.body || {};
    if (!personName || !district) {
      res.status(400).json({ error: 'Name and district/location are required.' });
      return;
    }
    const records = readEncryptedStore<TrackingRecord[]>('tracking', DEFAULT_TRACKING);
    const entry: TrackingRecord = {
      id: crypto.randomUUID(),
      personName: String(personName).trim(),
      roleType: roleType || 'Employee',
      department: String(department || 'Field Operations'),
      district: String(district).trim(),
      coordinates:
        coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number'
          ? { lat: coordinates.lat, lng: coordinates.lng }
          : undefined,
      statusNote: String(statusNote || 'Checked in via KDF Uganda Operations Portal'),
      updatedAt: new Date().toISOString(),
    };
    records.unshift(entry);
    writeEncryptedStore('tracking', records);
    res.json({ record: entry });
  });

  // --- Encrypted Contacts Vault ---
  app.get('/api/contacts/vault', (_req: Request, res: Response) => {
    const contacts = readEncryptedStore<ContactVaultEntry[]>('contacts', []);
    res.json({ contacts });
  });

  app.post('/api/contacts/vault', (req: Request, res: Response) => {
    const incoming: Array<Partial<ContactVaultEntry>> = Array.isArray(req.body?.contacts)
      ? req.body.contacts
      : [req.body];
    const contacts = readEncryptedStore<ContactVaultEntry[]>('contacts', []);
    const added: ContactVaultEntry[] = [];
    for (const c of incoming) {
      if (!c?.name || !c?.phone) continue;
      const entry: ContactVaultEntry = {
        id: crypto.randomUUID(),
        name: String(c.name).trim(),
        phone: String(c.phone).trim(),
        email: c.email ? String(c.email).trim() : undefined,
        address: c.address ? String(c.address).trim() : undefined,
        relation: String(c.relation || 'Community / Personal Contact'),
        addedAt: new Date().toISOString(),
      };
      contacts.unshift(entry);
      added.push(entry);
    }
    writeEncryptedStore('contacts', contacts);
    res.json({ added, contacts });
  });

  // --- Jobs & Donors ---
  app.post('/api/jobs/apply', (req: Request, res: Response) => {
    const { jobTitle, applicantName, email, phone, qualification } = req.body || {};
    if (!jobTitle || !applicantName || (!email && !phone)) {
      res.status(400).json({ error: 'Job title, name, and contact details are required.' });
      return;
    }
    const jobApps = readEncryptedStore<Array<Record<string, string>>>('job_applications', []);
    const item = {
      id: crypto.randomUUID(),
      jobTitle: String(jobTitle),
      applicantName: String(applicantName),
      email: String(email || ''),
      phone: String(phone || ''),
      qualification: String(qualification || ''),
      status: 'Received by HR (Bunjo Robert Son)',
      submittedAt: new Date().toISOString(),
    };
    jobApps.unshift(item);
    writeEncryptedStore('job_applications', jobApps);
    res.json({ application: item });
  });

  app.post('/api/donors/pledge', (req: Request, res: Response) => {
    const { donorName, organization, email, focusArea, amountNote } = req.body || {};
    if (!donorName || !email || !focusArea) {
      res.status(400).json({ error: 'Donor name, email, and focus area are required.' });
      return;
    }
    const pledges = readEncryptedStore<Array<Record<string, string>>>('donor_pledges', []);
    const item = {
      id: crypto.randomUUID(),
      donorName: String(donorName),
      organization: String(organization || 'Individual Sponsor'),
      email: String(email),
      focusArea: String(focusArea),
      amountNote: String(amountNote || ''),
      assignedTo: 'Director Kibatto Joseph & CED Nakyejwe Sherina',
      submittedAt: new Date().toISOString(),
    };
    pledges.unshift(item);
    writeEncryptedStore('donor_pledges', pledges);
    res.json({ pledge: item });
  });

  // --- Global Phone Number Analyzer & Caller Address Lookup ---
  app.post('/api/phone/lookup', (req: Request, res: Response) => {
    const rawNumber = String(req.body?.phoneNumber || '').trim();
    const normalized = rawNumber.replace(/[\s()-]/g, '');
    if (!normalized || normalized.length < 7) {
      res.status(400).json({ error: 'Enter a valid international phone number (e.g. +256 789509103).' });
      return;
    }

    const e164 = normalized.startsWith('0') ? `+256${normalized.slice(1)}` : normalized.startsWith('+') ? normalized : `+${normalized}`;
    const matchedCountry = PHONE_COUNTRY_MAP.find((c) => e164.startsWith(c.prefix));
    let carrier = 'International Carrier';
    if (matchedCountry) {
      const localPart = e164.slice(matchedCountry.prefix.length);
      const foundCarrier = matchedCountry.carriers.find((cr) => localPart.startsWith(cr.code));
      if (foundCarrier) carrier = foundCarrier.name;
      else if (matchedCountry.carriers.length > 0) carrier = `${matchedCountry.country} Telecom Network`;
    }

    const countryGeoMap: Record<string, { city: string; lat: number; lng: number; emergency: string }> = {
      '+256': { city: 'Kampala / Mityana Hub, Uganda', lat: 0.3476, lng: 32.5825, emergency: '999 / 112' },
      '+254': { city: 'Nairobi Hub, Kenya', lat: -1.2921, lng: 36.8219, emergency: '999 / 112' },
      '+255': { city: 'Dar es Salaam / Dodoma Hub, Tanzania', lat: -6.7924, lng: 39.2083, emergency: '112' },
      '+250': { city: 'Kigali Hub, Rwanda', lat: -1.9441, lng: 30.0619, emergency: '112' },
      '+234': { city: 'Lagos / Abuja Hub, Nigeria', lat: 6.5244, lng: 3.3792, emergency: '112' },
      '+27': { city: 'Johannesburg / Pretoria Hub, South Africa', lat: -26.2041, lng: 28.0473, emergency: '10111' },
      '+233': { city: 'Accra Hub, Ghana', lat: 5.6037, lng: -0.187, emergency: '191 / 112' },
      '+251': { city: 'Addis Ababa Hub, Ethiopia', lat: 9.032, lng: 38.7469, emergency: '911' },
      '+1': { city: 'North America NANP Routing', lat: 38.9072, lng: -77.0369, emergency: '911' },
      '+44': { city: 'London Telecom Hub, UK', lat: 51.5074, lng: -0.1278, emergency: '999 / 112' },
    };

    const geoInfo = (matchedCountry && countryGeoMap[matchedCountry.prefix]) || {
      city: 'Global International Telecom Gateway',
      lat: 0.3476,
      lng: 32.5825,
      emergency: '112',
    };

    // Check internal encrypted vault & official KDF directory for Caller ID & Address
    const vaultContacts = readEncryptedStore<ContactVaultEntry[]>('contacts', []);
    const knownKdf = KNOWN_KDF_DIRECTORY.find(
      (k) => k.phone.replace(/\s+/g, '') === e164
    );
    const knownVault = vaultContacts.find(
      (v) => v.phone.replace(/[\s()-]/g, '') === e164 || v.phone.replace(/[\s()-]/g, '') === normalized
    );

    const resolvedLocation = knownKdf
      ? { city: 'Mityana District HQ, Uganda', lat: 0.4175, lng: 32.0228 }
      : { city: geoInfo.city, lat: geoInfo.lat, lng: geoInfo.lng };

    res.json({
      e164,
      country: matchedCountry?.country || 'International / Other Country Code',
      region: matchedCountry?.region || 'Global Telecommunications Network',
      timezone: matchedCountry?.timezone || 'Check IANA Time Zone',
      carrier,
      locationDetails: {
        hubLocation: resolvedLocation.city,
        coordinates: { lat: resolvedLocation.lat, lng: resolvedLocation.lng },
        emergencyNumber: geoInfo.emergency,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${resolvedLocation.lat},${resolvedLocation.lng}`,
      },
      callerMatch: knownKdf
        ? {
            verified: true,
            name: knownKdf.name,
            role: knownKdf.role,
            address: knownKdf.address,
            source: 'KDF Uganda Official Verified Directory',
          }
        : knownVault
        ? {
            verified: true,
            name: knownVault.name,
            role: knownVault.relation,
            address: knownVault.address || 'Saved in Encrypted Contact Vault',
            source: 'Encrypted Personal Contact Vault',
          }
        : {
            verified: false,
            name: 'Unregistered External Number',
            role: 'External Caller',
            address: `${matchedCountry?.country || 'International'} (${carrier}) · Routing Hub: ${resolvedLocation.city}`,
            source: 'E.164 Numbering Registry',
          },
      whatsappUrl: `https://wa.me/${e164.replace('+', '')}`,
      telUrl: `tel:${e164}`,
    });
  });

  // --- KDF Dating, Friendship & Marriage Encrypted Community Board ---
  interface CommunityProfile {
    id: string;
    displayName: string;
    intent: 'Friendship' | 'Dating' | 'Marriage' | 'Pen Pal / Cultural Exchange';
    cityCountry: string;
    ageConfirmed18Plus: boolean;
    bio: string;
    preferredApp: string;
    contactHandle: string;
    createdAt: string;
  }

  const DEFAULT_COMMUNITY_PROFILES: CommunityProfile[] = [
    {
      id: 'comm-1',
      displayName: 'Grace N.',
      intent: 'Friendship',
      cityCountry: 'Mityana, Uganda',
      ageConfirmed18Plus: true,
      bio: 'Community educator interested in cross-cultural friendship, women empowerment, and youth literacy.',
      preferredApp: 'Tandem / Meetup',
      contactHandle: 'Available via KDF Moderated Desk',
      createdAt: '2026-11-15T10:00:00Z',
    },
    {
      id: 'comm-2',
      displayName: 'David K.',
      intent: 'Marriage',
      cityCountry: 'Kampala, Uganda',
      ageConfirmed18Plus: true,
      bio: 'Agricultural engineer looking for a values-oriented partner for serious marriage and family.',
      preferredApp: 'Hinge / AfroIntroductions',
      contactHandle: 'Available via KDF Moderated Desk',
      createdAt: '2026-11-16T12:30:00Z',
    },
  ];

  app.get('/api/community/connections', (_req: Request, res: Response) => {
    const profiles = readEncryptedStore<CommunityProfile[]>(
      'community_connections',
      DEFAULT_COMMUNITY_PROFILES
    );
    res.json({ profiles });
  });

  app.post('/api/community/connections', (req: Request, res: Response) => {
    const { displayName, intent, cityCountry, bio, preferredApp, contactHandle, ageConfirmed18Plus } =
      req.body || {};
    if (!displayName || !cityCountry || !ageConfirmed18Plus) {
      res.status(400).json({
        error: 'Display name, city/country, and 18+ confirmation are required.',
      });
      return;
    }
    const profiles = readEncryptedStore<CommunityProfile[]>(
      'community_connections',
      DEFAULT_COMMUNITY_PROFILES
    );
    const entry: CommunityProfile = {
      id: crypto.randomUUID(),
      displayName: String(displayName).trim(),
      intent: intent || 'Friendship',
      cityCountry: String(cityCountry).trim(),
      ageConfirmed18Plus: true,
      bio: String(bio || '').trim(),
      preferredApp: String(preferredApp || 'Global Free Platforms'),
      contactHandle: String(contactHandle || 'In-portal verification'),
      createdAt: new Date().toISOString(),
    };
    profiles.unshift(entry);
    writeEncryptedStore('community_connections', profiles);
    res.json({ profile: entry });
  });

  // --- Dynamic FAQ Answer Generation via Server-Side Gemini API ---
  app.post('/api/faq/answer', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured in Settings > Secrets.',
      });
      return;
    }

    const { question, category } = req.body || {};
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question text is required.' });
      return;
    }

    const systemInstruction = `You are the official FAQ specialist for Kibatto Development Foundation Limited (KDF UGANDA), registered to operate in Africa.
Office: P.O Box 2678, Mityana District, Uganda. Office Line: +256 789509103. Email: Kibattojoseph374@gmail.com.
Leadership: Director Kibatto Joseph (+256 770610329), Secretary Namwanje Proscovia (+256 776391872), Chief Executive Director Nakyejwe Sherina (+256783913861), General Director RF Kule David, Chief Advisor Namayanja Oivia (+256709270120), Medical Director Mugabirwe Jackline (+256731509445), Specialist Akankunda Violah (+256706600148), Managing Director Sempa Abdulrahman (+25670762727481), Regional Directors Namutebi Josephine and Nansubuga Joseline, Human Resource Bunjo Robert Son, Monitoring & Evaluation Nakkazi Josemine, ICT Specialist Nabunjo Vivian, Legal Advisor Namutebi Vanessa.
Target beneficiaries: Orphans, persons with disabilities, elderly, OVC, widows, girl child and women, and street children.
7 Mandate Pillars:
1. Education and training (school bursaries, literacy, vocational skills)
2. Health and medical (primary care, assistive devices, maternal support)
3. Construction of new buildings and renovation of premises for vulnerable groups
4. Disease education in rural and urban areas including HIV/AIDS
5. Construct and maintain rehabilitation centers, workshops, schools, and hospitals
6. Mobilise funds supporting the community in all sections
7. Improve and develop new farming skills in rural areas and support better markets for harvests.
Registration & Verification Process: Users register with email or phone number (encrypted with AES-256-GCM), submit an Applicant & Service Registration form to receive a KDF-YYYY-XXXX tracking code, upload supporting documents/certifications (SHA-256 hashed and encrypted), and track verification overseen by M&E (Nakkazi Josemine), HR (Bunjo Robert Son), and Legal (Namutebi Vanessa).
Answer the user's FAQ question clearly, accurately, and concisely in 3-5 helpful sentences (or short clear steps where helpful).`;

    try {
      const response = await generateContentWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: `Category: ${category || 'General'}\nQuestion: ${question}`,
        config: {
          systemInstruction,
        },
      });

      res.json({
        answer: response.text || 'No answer could be generated.',
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      const friendly = extractGeminiErrorMessage(err);
      res.status(friendly.status).json({ error: friendly.message });
    }
  });

  // --- Live Humanitarian Projects Tracker (DashboardWidget) ---
  interface ProjectRecord {
    id: string;
    title: string;
    category: string;
    district: string;
    leadDirector: string;
    progress: number;
    status: 'In Progress' | 'Active Outreach' | 'Completed';
    beneficiariesReached: number;
    latestMilestone: string;
    updatedAt: string;
  }

  const DEFAULT_PROJECTS: ProjectRecord[] = [
    {
      id: 'proj-school-mityana',
      title: 'Mityana Orphans & Girl Child Community School Construction',
      category: 'Education & Construction',
      district: 'Mityana District, Uganda',
      leadDirector: 'Sempa Abdulrahman & Kibatto Joseph',
      progress: 74,
      status: 'In Progress',
      beneficiariesReached: 420,
      latestMilestone:
        'Four-classroom block roofing completed; solar water harvesting tanks installed.',
      updatedAt: '2026-11-17T05:30:00Z',
    },
    {
      id: 'proj-medical-camp',
      title: 'Kassanda & Mityana Mobile Medical & HIV/AIDS Outreach Camp',
      category: 'Health & Disease Education',
      district: 'Kassanda & Mityana',
      leadDirector: 'Mugabirwe Jackline & Akankunda Violah',
      progress: 86,
      status: 'Active Outreach',
      beneficiariesReached: 1180,
      latestMilestone:
        'Free maternal checkups, HIV/AIDS counseling, and assistive mobility devices distributed across 6 parishes.',
      updatedAt: '2026-11-17T06:00:00Z',
    },
    {
      id: 'proj-rehab-workshop',
      title: 'Street Children Rehabilitation Center & Vocational Workshop',
      category: 'Rehabilitation & Workshops',
      district: 'Mityana Central',
      leadDirector: 'Nakyejwe Sherina & Namutebi Josephine',
      progress: 62,
      status: 'In Progress',
      beneficiariesReached: 245,
      latestMilestone:
        'Tailoring, carpentry, and ICT skills wing equipped; counseling dormitories under interior finishing.',
      updatedAt: '2026-11-16T17:15:00Z',
    },
    {
      id: 'proj-farming-markets',
      title: 'Widows Rural Farming Skills & Harvest Market Cooperative',
      category: 'Agriculture & Markets',
      district: 'Mubende & Mityana',
      leadDirector: 'Nansubuga Joseline & Nakkazi Josemine',
      progress: 100,
      status: 'Completed',
      beneficiariesReached: 690,
      latestMilestone:
        'Season harvest aggregation center operational; 18 tons of maize and coffee connected directly to Kampala buyers.',
      updatedAt: '2026-11-15T14:20:00Z',
    },
  ];

  app.get('/api/projects', (_req: Request, res: Response) => {
    const projects = readEncryptedStore<ProjectRecord[]>('projects', DEFAULT_PROJECTS);
    res.json({ projects });
  });

  app.patch('/api/projects/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { progress, latestMilestone, beneficiariesReached } = req.body || {};
    const projects = readEncryptedStore<ProjectRecord[]>('projects', DEFAULT_PROJECTS);
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    if (typeof progress === 'number' && !Number.isNaN(progress)) {
      const clamped = Math.min(100, Math.max(0, Math.round(progress)));
      projects[idx].progress = clamped;
      if (clamped === 100) projects[idx].status = 'Completed';
      else if (projects[idx].status === 'Completed') projects[idx].status = 'In Progress';
    }
    if (latestMilestone) projects[idx].latestMilestone = String(latestMilestone).trim();
    if (typeof beneficiariesReached === 'number' && !Number.isNaN(beneficiariesReached)) {
      projects[idx].beneficiariesReached = Math.max(0, Math.round(beneficiariesReached));
    }
    projects[idx].updatedAt = new Date().toISOString();
    writeEncryptedStore('projects', projects);
    res.json({ project: projects[idx] });
  });

  // --- Encrypted Private Vault (NIST AES-256-GCM) ---
  interface VaultSecretItem {
    id: string;
    ownerEmailOrPhone: string;
    title: string;
    classification: string;
    notes: string;
    fileName?: string;
    sha256: string;
    cipher: string;
    createdAt: string;
  }

  app.get('/api/vault/secrets', (_req: Request, res: Response) => {
    const secrets = readEncryptedStore<VaultSecretItem[]>('private_vault', []);
    res.json({ secrets });
  });

  app.post('/api/vault/secrets', (req: Request, res: Response) => {
    const { ownerEmailOrPhone, title, classification, notes, fileName, fileBase64 } = req.body || {};
    if (!title || (!notes && !fileBase64)) {
      res.status(400).json({ error: 'Title and confidential note or file are required.' });
      return;
    }
    const rawPayload = `${title}:${notes || ''}:${fileBase64 || ''}`;
    const sha256 = crypto.createHash('sha256').update(rawPayload).digest('hex');
    const id = crypto.randomUUID();
    if (fileBase64) {
      writeEncryptedStore(`vault_file_${id}`, { fileName, fileBase64, sha256 });
    }
    const secrets = readEncryptedStore<VaultSecretItem[]>('private_vault', []);
    const item: VaultSecretItem = {
      id,
      ownerEmailOrPhone: String(ownerEmailOrPhone || 'Registered Member'),
      title: String(title).trim(),
      classification: String(classification || 'Confidential'),
      notes: String(notes || '').trim(),
      fileName: fileName ? String(fileName) : undefined,
      sha256,
      cipher: 'NIST AES-256-GCM + SHA-256',
      createdAt: new Date().toISOString(),
    };
    secrets.unshift(item);
    writeEncryptedStore('private_vault', secrets);
    res.json({ secret: item });
  });

  // --- UN Agencies Inter-Agency Communication, Duties & Confidential Dispatches ---
  interface UnDispatchItem {
    id: string;
    agency: string;
    senderName: string;
    dispatchType: 'Communication' | 'Field Duty Assignment' | 'Confidential Brief';
    subject: string;
    details: string;
    createdAt: string;
  }

  const DEFAULT_UN_DISPATCHES: UnDispatchItem[] = [
    {
      id: 'un-1',
      agency: 'UN Partner Portal (UNPP) & UNICEF',
      senderName: 'Kibatto Joseph & Nakyejwe Sherina',
      dispatchType: 'Field Duty Assignment',
      subject: 'Mityana OVC & Girl Child Education Baseline Survey',
      details:
        'Coordinate with Regional Director Namutebi Josephine and M&E Nakkazi Josemine to compile quarterly school enrollment verification.',
      createdAt: '2026-11-16T11:20:00Z',
    },
    {
      id: 'un-2',
      agency: 'UN Women & eSANGO',
      senderName: 'Namutebi Vanessa (Legal Advisor)',
      dispatchType: 'Communication',
      subject: 'Widows Land & Legal Protection Workshop',
      details:
        'Joint legal literacy clinic scheduled for widows and women cooperatives in Mityana District.',
      createdAt: '2026-11-17T04:45:00Z',
    },
  ];

  app.get('/api/un/dispatches', (_req: Request, res: Response) => {
    const dispatches = readEncryptedStore<UnDispatchItem[]>('un_dispatches', DEFAULT_UN_DISPATCHES);
    res.json({ dispatches });
  });

  app.post('/api/un/dispatches', (req: Request, res: Response) => {
    const { agency, senderName, dispatchType, subject, details } = req.body || {};
    if (!agency || !subject || !details) {
      res.status(400).json({ error: 'UN agency, subject, and details are required.' });
      return;
    }
    const dispatches = readEncryptedStore<UnDispatchItem[]>('un_dispatches', DEFAULT_UN_DISPATCHES);
    const entry: UnDispatchItem = {
      id: crypto.randomUUID(),
      agency: String(agency),
      senderName: String(senderName || 'KDF Coordinator'),
      dispatchType: dispatchType || 'Communication',
      subject: String(subject).trim(),
      details: String(details).trim(),
      createdAt: new Date().toISOString(),
    };
    dispatches.unshift(entry);
    writeEncryptedStore('un_dispatches', dispatches);
    res.json({ dispatch: entry });
  });

  // --- Free Global Multi-Participant Meetings & Calls (Jitsi WebRTC) ---
  interface MeetingRoomItem {
    id: string;
    title: string;
    hostName: string;
    roomSlug: string;
    meetingUrl: string;
    category: string;
    createdAt: string;
  }

  const DEFAULT_MEETINGS: MeetingRoomItem[] = [
    {
      id: 'meet-1',
      title: 'KDF Uganda & International Donors Weekly Coordination',
      hostName: 'Director Kibatto Joseph',
      roomSlug: 'KDF-Uganda-Global-Coordination-Room',
      meetingUrl: 'https://meet.jit.si/KDF-Uganda-Global-Coordination-Room',
      category: 'UN & Donor Briefing',
      createdAt: '2026-11-17T06:00:00Z',
    },
    {
      id: 'meet-2',
      title: 'Rural Medical & HIV/AIDS Field Team Call',
      hostName: 'Medical Director Mugabirwe Jackline',
      roomSlug: 'KDF-Uganda-Medical-Outreach-Call',
      meetingUrl: 'https://meet.jit.si/KDF-Uganda-Medical-Outreach-Call',
      category: 'Health & Medical',
      createdAt: '2026-11-17T06:15:00Z',
    },
  ];

  app.get('/api/meetings', (_req: Request, res: Response) => {
    const meetings = readEncryptedStore<MeetingRoomItem[]>('meetings', DEFAULT_MEETINGS);
    res.json({ meetings });
  });

  app.post('/api/meetings', (req: Request, res: Response) => {
    const { title, hostName, category } = req.body || {};
    if (!title) {
      res.status(400).json({ error: 'Meeting title is required.' });
      return;
    }
    const cleanSlug = `KDF-Uganda-${String(title)
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 36)}-${Math.floor(100 + Math.random() * 900)}`;
    const meetings = readEncryptedStore<MeetingRoomItem[]>('meetings', DEFAULT_MEETINGS);
    const room: MeetingRoomItem = {
      id: crypto.randomUUID(),
      title: String(title).trim(),
      hostName: String(hostName || 'KDF Member'),
      roomSlug: cleanSlug,
      meetingUrl: `https://meet.jit.si/${cleanSlug}`,
      category: String(category || 'Global Open Conference'),
      createdAt: new Date().toISOString(),
    };
    meetings.unshift(room);
    writeEncryptedStore('meetings', meetings);
    res.json({ meeting: room });
  });

  // --- Server-Side Gemini AI Customer Service & Chat ---
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured in Settings > Secrets.',
      });
      return;
    }

    const { message, agentRole, history, useSearch } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message text is required.' });
      return;
    }

    const agentPersonas: Record<string, string> = {
      general:
        'You are the KDF Uganda Chief Customer Service AI Agent representing Director Kibatto Joseph (+256 770610329), Chief Executive Director Nakyejwe Sherina (+256 783913861), General Director RF Kule David, Managing Director Sempa Abdulrahman (+256 70762727481), and Office Line +256 789509103 (P.O Box 2678, Mityana District, Uganda).',
      medical:
        'You are the KDF Uganda Health, Medical & HIV/AIDS Outreach AI Agent supporting Medical Director Mugabirwe Jackline (+256 731509445) and Specialist Akankunda Violah (+256 706600148). Provide compassionate, evidence-based health education, HIV/AIDS prevention guidance, and clinic referral info. Always advise consulting licensed doctors for clinical diagnosis.',
      hr:
        'You are the KDF Uganda HR, Applicant & M&E AI Agent supporting Human Resource Bunjo Robert Son, Monitoring & Evaluation Nakkazi Josemine, and Secretary Namwanje Proscovia (+256 776391872). Help applicants register for KDF services, verify document requirements, and navigate job opportunities.',
      legal:
        'You are the KDF Uganda Legal & Protection AI Agent supporting Legal Advisor Namutebi Vanessa and Chief Advisor Namayanja Oivia (+256 709270120). Guide widows, girl child, orphans, and community members on legal aid, Uganda police emergency contacts (999/112), child protection, and UN human rights resources.',
      agriculture:
        'You are the KDF Uganda Rural Farming, Education & ICT AI Agent supporting Regional Directors Namutebi Josephine and Nansubuga Joseline, and ICT Specialist Nabunjo Vivian. Advise on modern Ugandan rural farming, post-harvest market access, vocational workshops, and free online courses like Alison and UNDSS.',
    };

    const systemInstruction = `${agentPersonas[agentRole] || agentPersonas.general}
Organization: Kibatto Development Foundation Limited (KDF UGANDA), registered to operate in Africa. Office: P.O Box 2678, Mityana District, Uganda. Email: Kibattojoseph374@gmail.com.
Mission & Mandate (serving orphans, disabled, elderly, OVC, widows, girl child and women, street children):
1. Education and training
2. Health and medical
3. Construction of new buildings and renovation of premises for vulnerable groups
4. Educate about different diseases in rural and urban areas, including HIV/AIDS
5. Construct and maintain rehabilitation centers, workshops, schools, hospitals
6. Mobilise funds supporting the community in all sections
7. Improve and develop new skills of farming in rural areas and support better markets for harvests.
Keep responses clear, warm, practical, and accurate. Never fabricate private personal records or unauthorized intelligence data.`;

    try {
      const formattedContents = Array.isArray(history)
        ? [
            ...history.slice(-8).map((h: { role: string; text: string }) => ({
              role: h.role === 'model' ? 'model' : 'user',
              parts: [{ text: String(h.text || '') }],
            })),
            { role: 'user', parts: [{ text: message }] },
          ]
        : message;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: formattedContents,
        config: {
          systemInstruction,
          ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks
        .map((c: { web?: { uri?: string; title?: string } }) => c.web)
        .filter((w): w is { uri: string; title?: string } => Boolean(w?.uri));

      res.json({
        reply: response.text || 'I could not generate a response at this moment.',
        sources,
      });
    } catch (err) {
      const friendly = extractGeminiErrorMessage(err);
      res.status(friendly.status).json({ error: friendly.message });
    }
  });

  // --- Server-Side World News & Public OSINT Research (Gemini + Google Search Grounding) ---
  app.post('/api/news/search', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured in Settings > Secrets.',
      });
      return;
    }

    const { query, mode } = req.body || {};
    const searchQuery = String(query || 'Uganda Africa humanitarian development UN SDG news today').trim();

    const prompt =
      mode === 'osint'
        ? `Perform a factual public open-source verification and institutional reference summary for: "${searchQuery}". Only report publicly verified facts, official public registries, or official government/UN/NGO information. Do not invent private addresses or private personal data.`
        : `Provide a structured, concise briefing of the latest current news and verified updates regarding: "${searchQuery}". Include 4-5 clear bullet points with dates and context relevant to Uganda, Africa, or global humanitarian affairs.`;

    try {
      const response = await generateContentWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks
        .map((c: { web?: { uri?: string; title?: string } }) => c.web)
        .filter((w): w is { uri: string; title?: string } => Boolean(w?.uri));

      res.json({
        summary: response.text || 'No updates returned.',
        sources,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const friendly = extractGeminiErrorMessage(err);
      res.status(friendly.status).json({ error: friendly.message });
    }
  });

  // --- Encrypted Family Members Protection Registry ---
  interface FamilyMemberItem {
    id: string;
    fullName: string;
    relationship: string;
    ageOrCategory: string;
    phone: string;
    emergencyNotes: string;
    addedAt: string;
  }

  app.get('/api/family', (_req: Request, res: Response) => {
    const members = readEncryptedStore<FamilyMemberItem[]>('family_members', []);
    res.json({ members });
  });

  app.post('/api/family', (req: Request, res: Response) => {
    const { fullName, relationship, ageOrCategory, phone, emergencyNotes } = req.body || {};
    if (!fullName || !relationship) {
      res.status(400).json({ error: 'Family member name and relationship are required.' });
      return;
    }
    const members = readEncryptedStore<FamilyMemberItem[]>('family_members', []);
    const item: FamilyMemberItem = {
      id: crypto.randomUUID(),
      fullName: String(fullName).trim(),
      relationship: String(relationship).trim(),
      ageOrCategory: String(ageOrCategory || 'Family Member'),
      phone: String(phone || '').trim(),
      emergencyNotes: String(emergencyNotes || '').trim(),
      addedAt: new Date().toISOString(),
    };
    members.unshift(item);
    writeEncryptedStore('family_members', members);
    res.json({ member: item });
  });

  // --- Global & Community Marketplace (Supply & Buy Items) ---
  interface MarketListingItem {
    id: string;
    title: string;
    category: string;
    price: string;
    sellerName: string;
    sellerContact: string;
    location: string;
    marketChannel: string;
    description: string;
    ordersCount: number;
    createdAt: string;
  }

  const DEFAULT_MARKET_LISTINGS: MarketListingItem[] = [
    {
      id: 'mkt-1',
      title: 'Mityana Organic Matooke & Arabica Coffee Harvest',
      category: 'Rural Farming Harvest',
      price: 'UGX 45,000 / Bunch · $12 USD',
      sellerName: 'Mityana Widows Cooperative',
      sellerContact: '+256 789509103',
      location: 'Mityana District, Uganda',
      marketChannel: 'KDF Direct & Kaluta Mall',
      description: 'Fresh smallholder harvest available for wholesale and community purchase.',
      ordersCount: 14,
      createdAt: '2026-11-16T08:00:00Z',
    },
    {
      id: 'mkt-2',
      title: 'Vocational Workshop School Uniforms & Carpentry Desks',
      category: 'Workshops & Crafts',
      price: 'UGX 120,000 / Set · $32 USD',
      sellerName: 'KDF Youth Vocational Workshop',
      sellerContact: '+256 770610329',
      location: 'Mityana Central, Uganda',
      marketChannel: 'KDF Marketplace & Pi/YEM Trade',
      description: 'Handcrafted timber desks and tailored school uniforms supporting OVC trainees.',
      ordersCount: 9,
      createdAt: '2026-11-16T15:00:00Z',
    },
  ];

  app.get('/api/marketplace', (_req: Request, res: Response) => {
    const items = readEncryptedStore<MarketListingItem[]>('marketplace', DEFAULT_MARKET_LISTINGS);
    res.json({ items });
  });

  app.post('/api/marketplace', (req: Request, res: Response) => {
    const { title, category, price, sellerName, sellerContact, location, marketChannel, description } =
      req.body || {};
    if (!title || !price || !sellerName) {
      res.status(400).json({ error: 'Item title, price, and supplier name are required.' });
      return;
    }
    const items = readEncryptedStore<MarketListingItem[]>('marketplace', DEFAULT_MARKET_LISTINGS);
    const entry: MarketListingItem = {
      id: crypto.randomUUID(),
      title: String(title).trim(),
      category: String(category || 'Community Supply'),
      price: String(price).trim(),
      sellerName: String(sellerName).trim(),
      sellerContact: String(sellerContact || '+256 789509103').trim(),
      location: String(location || 'Uganda').trim(),
      marketChannel: String(marketChannel || 'Global Marketplace'),
      description: String(description || '').trim(),
      ordersCount: 0,
      createdAt: new Date().toISOString(),
    };
    items.unshift(entry);
    writeEncryptedStore('marketplace', items);
    res.json({ item: entry });
  });

  app.post('/api/marketplace/:id/buy', (req: Request, res: Response) => {
    const { id } = req.params;
    const { buyerName, buyerContact, quantity } = req.body || {};
    const items = readEncryptedStore<MarketListingItem[]>('marketplace', DEFAULT_MARKET_LISTINGS);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }
    items[idx].ordersCount += Number(quantity || 1);
    writeEncryptedStore('marketplace', items);
    const orders = readEncryptedStore<Array<Record<string, unknown>>>('market_orders', []);
    const order = {
      id: crypto.randomUUID(),
      itemTitle: items[idx].title,
      buyerName: String(buyerName || 'KDF Member'),
      buyerContact: String(buyerContact || ''),
      quantity: Number(quantity || 1),
      orderedAt: new Date().toISOString(),
    };
    orders.unshift(order);
    writeEncryptedStore('market_orders', orders);
    res.json({ item: items[idx], order });
  });

  // --- Multimodal AI Assistant Tool (Translate, Draft Grant/Support Letter, Analyze Photo/Doc) ---
  app.post('/api/ai/assistant-tool', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured in Settings > Secrets.',
      });
      return;
    }
    const { mode, text, targetLanguage, imageBase64 } = req.body || {};
    try {
      if (mode === 'analyze-image' && typeof imageBase64 === 'string' && imageBase64.includes(',')) {
        const [header, b64] = imageBase64.split(',');
        const mimeMatch = header.match(/data:(.*?);base64/);
        const mimeType = mimeMatch?.[1] || 'image/jpeg';
        const response = await generateContentWithRetry(ai, {
          model: 'gemini-4-hydrogen',
          contents: {
            parts: [
              { inlineData: { mimeType, data: b64 } },
              {
                text:
                  text ||
                  'Analyze this image or document clearly for KDF Uganda (community support, agriculture, medical, education, or verification notes).',
              },
            ],
          },
        });
        res.json({ result: response.text || 'Analysis complete.' });
        return;
      }

      const prompt =
        mode === 'translate'
          ? `Translate the following humanitarian/community message clearly into ${
              targetLanguage || 'Luganda'
            }, preserving warm and respectful tone:\n\n${text}`
          : mode === 'draft-letter'
          ? `Draft a formal, compassionate letter on behalf of Kibatto Development Foundation Limited (KDF UGANDA, P.O Box 2678, Mityana District, Uganda, +256 789509103) for the following request:\n\n${text}`
          : String(text || '');

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: prompt,
      });
      res.json({ result: response.text || 'Completed.' });
    } catch (err) {
      const friendly = extractGeminiErrorMessage(err);
      res.status(friendly.status).json({ error: friendly.message });
    }
  });

  // --- JSON API Error Middleware (Prevents HTML 413/400/500 pages breaking client JSON parsing) ---
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (!err) {
      next();
      return;
    }
    const errObj = err as { status?: number; statusCode?: number; type?: string; message?: string };
    const status =
      errObj.type === 'entity.too.large'
        ? 413
        : errObj.status || errObj.statusCode || 500;
    const message =
      status === 413
        ? 'Uploaded file or photos exceeded the maximum size limit. Please choose smaller files.'
        : errObj.message || 'An unexpected server error occurred.';
    if (req.path.startsWith('/api') || res.headersSent === false) {
      res.status(status).json({ error: message });
      return;
    }
    next(err);
  });

  // --- Vite Middleware / Static Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KDF Uganda server listening on http://localhost:${PORT}`);
  });
}

startServer();
