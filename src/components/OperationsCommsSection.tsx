import React, { useEffect, useState } from 'react';
import {
  Newspaper,
  MapPin,
  PhoneCall,
  ShieldAlert,
  Contact,
  MessageCircle,
  Phone,
  Search,
  Globe,
  ExternalLink,
  Share2,
  LocateFixed,
} from 'lucide-react';
import { KDF_ORG, LEGAL_MEDICAL_POLICE_PORTALS } from '../data/kdfData';
import type { RegisteredUser } from './RegistrationGate';
import { safeReadJson } from '../utils/http';

interface TrackingItem {
  id: string;
  personName: string;
  roleType: string;
  department: string;
  district: string;
  coordinates?: { lat: number; lng: number };
  statusNote: string;
  updatedAt: string;
}

interface ContactVaultItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  relation: string;
  addedAt: string;
}

interface PhoneLookupResult {
  e164: string;
  country: string;
  region: string;
  timezone: string;
  carrier: string;
  locationDetails?: {
    hubLocation: string;
    coordinates: { lat: number; lng: number };
    emergencyNumber: string;
    mapsUrl: string;
  };
  callerMatch: {
    verified: boolean;
    name: string;
    role: string;
    address: string;
    source: string;
  };
  whatsappUrl: string;
  telUrl: string;
}

interface OperationsCommsSectionProps {
  user: RegisteredUser;
  authToken: string;
  onUserUpdated: (user: RegisteredUser) => void;
  onShareApp: () => void;
  initialSubTab?: 'news' | 'tracking' | 'phone' | 'intelligence' | 'contacts';
}

export const OperationsCommsSection: React.FC<OperationsCommsSectionProps> = ({
  user,
  authToken,
  onUserUpdated,
  onShareApp,
  initialSubTab = 'news',
}) => {
  const [subTab, setSubTab] = useState<'news' | 'tracking' | 'phone' | 'intelligence' | 'contacts'>(
    initialSubTab
  );

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  // News State
  const [newsQuery, setNewsQuery] = useState(
    'Uganda Africa humanitarian development UN SDG news'
  );
  const [newsResult, setNewsResult] = useState<string>('');
  const [newsSources, setNewsSources] = useState<Array<{ uri: string; title?: string }>>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Tracking State
  const [trackingList, setTrackingList] = useState<TrackingItem[]>([]);
  const [trackFilter, setTrackFilter] = useState('');
  const [checkinName, setCheckinName] = useState(user.fullName);
  const [checkinRole, setCheckinRole] = useState('Employee');
  const [checkinDistrict, setCheckinDistrict] = useState(user.district || 'Mityana District');
  const [checkinNote, setCheckinNote] = useState('');
  const [checkinCoords, setCheckinCoords] = useState<{ lat: number; lng: number } | undefined>();
  const [trackMessage, setTrackMessage] = useState<string | null>(null);

  // Phone Lookup & Dialer State
  const [phoneInput, setPhoneInput] = useState('+256 789509103');
  const [phoneResult, setPhoneResult] = useState<PhoneLookupResult | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Intelligence & Public Info Research State
  const [osintQuery, setOsintQuery] = useState('');
  const [osintResult, setOsintResult] = useState('');
  const [osintSources, setOsintSources] = useState<Array<{ uri: string; title?: string }>>([]);
  const [osintLoading, setOsintLoading] = useState(false);
  const [osintError, setOsintError] = useState<string | null>(null);

  // Phone Contacts & Social Links State
  const [contacts, setContacts] = useState<ContactVaultItem[]>([]);
  const [contactStatus, setContactStatus] = useState<string | null>(null);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(user.socialLinks || {});
  const [socialSavedMsg, setSocialSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tracking')
      .then((r) => r.json())
      .then((d) => setTrackingList(d.records || []))
      .catch(() => {});

    fetch('/api/contacts/vault')
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts || []))
      .catch(() => {});
  }, []);

  const runNewsSearch = async (customQuery?: string) => {
    const q = customQuery ?? newsQuery;
    setNewsLoading(true);
    setNewsError(null);
    try {
      const res = await fetch('/api/news/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, mode: 'news' }),
      });
      const data = await safeReadJson<{ summary?: string; sources?: Array<{ uri: string; title?: string }> }>(res);
      if (!res.ok) throw new Error(data.error || 'News search failed');
      setNewsResult(data.summary || '');
      setNewsSources(data.sources || []);
    } catch (err) {
      setNewsError(err instanceof Error ? err.message : 'Unable to fetch world news updates.');
    } finally {
      setNewsLoading(false);
    }
  };

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setTrackMessage('Browser geolocation is unavailable on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCheckinCoords({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        });
        setTrackMessage('GPS coordinates attached.');
      },
      () => {
        setTrackMessage('Location permission declined — you can still enter district manually.');
      }
    );
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackMessage(null);
    try {
      const res = await fetch('/api/tracking/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personName: checkinName,
          roleType: checkinRole,
          department: user.role,
          district: checkinDistrict,
          coordinates: checkinCoords,
          statusNote: checkinNote,
        }),
      });
      const data = await safeReadJson<{ record?: TrackingItem }>(res);
      if (res.ok && data.record) {
        setTrackingList((prev) => [data.record!, ...prev]);
        setCheckinNote('');
        setTrackMessage('Check-in recorded in encrypted tracking log.');
      } else {
        setTrackMessage(data.error || 'Could not record check-in.');
      }
    } catch {
      setTrackMessage('Network error while recording check-in.');
    }
  };

  const handlePhoneLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    try {
      const res = await fetch('/api/phone/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneInput }),
      });
      const data = await safeReadJson<PhoneLookupResult>(res);
      if (res.ok) {
        setPhoneResult(data);
      } else {
        setPhoneError(data.error || 'Lookup failed');
      }
    } catch {
      setPhoneError('Unable to perform phone number lookup right now.');
    }
  };

  const runOsintSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osintQuery.trim()) return;
    setOsintLoading(true);
    setOsintError(null);
    try {
      const res = await fetch('/api/news/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: osintQuery.trim(), mode: 'osint' }),
      });
      const data = await safeReadJson<{ summary?: string; sources?: Array<{ uri: string; title?: string }> }>(res);
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setOsintResult(data.summary || '');
      setOsintSources(data.sources || []);
    } catch (err) {
      setOsintError(err instanceof Error ? err.message : 'Unable to perform global research.');
    } finally {
      setOsintLoading(false);
    }
  };

  const handleAccessPhoneContacts = async () => {
    setContactStatus(null);
    const nav = navigator as unknown as {
      contacts?: {
        select: (
          props: string[],
          opts: { multiple: boolean }
        ) => Promise<Array<{ name?: string[]; tel?: string[]; email?: string[] }>>;
      };
    };

    if (nav.contacts && typeof nav.contacts.select === 'function') {
      try {
        const picked = await nav.contacts.select(['name', 'tel', 'email'], { multiple: true });
        if (picked.length > 0) {
          const formatted = picked.map((p) => ({
            name: p.name?.[0] || 'Saved Contact',
            phone: p.tel?.[0] || '',
            email: p.email?.[0] || '',
            relation: 'Imported Device Contact',
          }));
          const res = await fetch('/api/contacts/vault', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contacts: formatted }),
          });
          const d = await safeReadJson<{ contacts?: ContactVaultItem[] }>(res);
          if (res.ok) {
            setContacts(d.contacts || []);
            setContactStatus(`Imported ${formatted.length} encrypted contacts from device.`);
          } else {
            setContactStatus(d.error || 'Could not import selected contacts.');
          }
        }
      } catch {
        setContactStatus('Device contact picker closed. You can also add or import .vcf contacts below.');
      }
    } else {
      setContactStatus(
        'Your browser does not expose native device contacts directly. Use the encrypted Contact Vault or import a .vcf file below.'
      );
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;
    setContactStatus(null);
    try {
      const res = await fetch('/api/contacts/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newContactName,
          phone: newContactPhone,
          address: newContactAddress,
          relation: 'Personal / Caller Directory',
        }),
      });
      const d = await safeReadJson<{ contacts?: ContactVaultItem[] }>(res);
      if (res.ok) {
        setContacts(d.contacts || []);
        setNewContactName('');
        setNewContactPhone('');
        setNewContactAddress('');
        setContactStatus('Contact encrypted and saved to your KDF Vault.');
      } else {
        setContactStatus(d.error || 'Could not save contact.');
      }
    } catch {
      setContactStatus('Network error while saving contact.');
    }
  };

  const handleSaveSocials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSocialSavedMsg(null);
    try {
      const res = await fetch('/api/auth/social-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ socialLinks }),
      });
      const d = await safeReadJson<{ user?: RegisteredUser }>(res);
      if (res.ok && d.user) {
        onUserUpdated(d.user);
        setSocialSavedMsg('Social media accounts saved securely.');
      } else {
        setSocialSavedMsg(d.error || 'Could not save social links.');
      }
    } catch {
      setSocialSavedMsg('Network error while saving social links.');
    }
  };

  const filteredTracking = trackingList.filter(
    (t) =>
      t.personName.toLowerCase().includes(trackFilter.toLowerCase()) ||
      t.district.toLowerCase().includes(trackFilter.toLowerCase()) ||
      t.roleType.toLowerCase().includes(trackFilter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Navigation Toolbar */}
      <div className="bg-white border border-[#E5DFD3] rounded-xl p-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSubTab('news')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            subTab === 'news'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Feeds & World News</span>
        </button>

        <button
          onClick={() => setSubTab('tracking')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            subTab === 'tracking'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Employee & Applicant Tracking</span>
        </button>

        <button
          onClick={() => setSubTab('phone')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            subTab === 'phone'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Global Number & Caller Lookup</span>
        </button>

        <button
          onClick={() => setSubTab('intelligence')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            subTab === 'intelligence'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Intelligence, Safety & Global Search</span>
        </button>

        <button
          onClick={() => setSubTab('contacts')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            subTab === 'contacts'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <Contact className="w-4 h-4" />
          <span>Contacts, Calling & Social Links</span>
        </button>
      </div>

      {/* 1. Feeds & World News Updates */}
      {subTab === 'news' && (
        <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#78716C]">
                Live Grounded Briefing
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[#1C1917]">
                Daily & Immediate World News Updates
              </h2>
              <p className="mt-1 text-sm text-[#57534E]">
                Access daily and breaking world news, Uganda community alerts, UN SDG initiatives,
                and health bulletins with cited sources.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const breaking = 'Breaking world news, Uganda & East Africa daily updates today';
                setNewsQuery(breaking);
                runNewsSearch(breaking);
              }}
              disabled={newsLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E3A8A] hover:bg-[#172C6B] text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Globe className="w-4 h-4" />
              <span>{newsLoading ? 'Updating...' : "Load Today's World Updates"}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              'Breaking world news today Africa Uganda UN',
              'Uganda Mityana community development and health news',
              'UN Women and SDG Africa humanitarian updates',
              'East Africa agriculture coffee maize market prices',
              'Global HIV/AIDS education and WHO Africa updates',
            ].map((topic) => (
              <button
                key={topic}
                onClick={() => {
                  setNewsQuery(topic);
                  runNewsSearch(topic);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#F3EFE7] hover:bg-[#E5DFD3] text-xs font-medium text-[#1C1917]"
              >
                {topic}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newsQuery}
              onChange={(e) => setNewsQuery(e.target.value)}
              placeholder="Search world news updates..."
              className="flex-1 px-4 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
            />
            <button
              onClick={() => runNewsSearch()}
              disabled={newsLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold whitespace-nowrap disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              <span>{newsLoading ? 'Searching World News...' : 'Search World News'}</span>
            </button>
          </div>

          {newsError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {newsError}
            </div>
          )}

          {newsResult && (
            <div className="p-6 rounded-xl bg-[#FBF9F5] border border-[#E5DFD3] space-y-4">
              <div className="prose prose-sm max-w-none text-[#1C1917] whitespace-pre-wrap leading-relaxed">
                {newsResult}
              </div>
              {newsSources.length > 0 && (
                <div className="pt-4 border-t border-[#E5DFD3]">
                  <p className="text-xs font-semibold text-[#57534E] mb-2">Verified Web Sources</p>
                  <ul className="space-y-1">
                    {newsSources.map((src, i) => (
                      <li key={i}>
                        <a
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#1E3A8A] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{src.title || src.uri}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Employee & Applicant Tracking */}
      {subTab === 'tracking' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-[#1C1917]">
              Record Location / Field Check-In
            </h2>
            <p className="text-xs text-[#57534E]">
              Employees, regional directors, and applicants can log verified district check-ins
              with optional GPS coordinates.
            </p>
            {trackMessage && (
              <p className="text-xs font-medium text-[#14532D] bg-[#14532D]/10 p-2.5 rounded-lg">
                {trackMessage}
              </p>
            )}
            <form onSubmit={handleCheckin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Person Name</label>
                <input
                  type="text"
                  required
                  value={checkinName}
                  onChange={(e) => setCheckinName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Role Type</label>
                  <select
                    value={checkinRole}
                    onChange={(e) => setCheckinRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  >
                    <option>Employee</option>
                    <option>Applicant</option>
                    <option>Field Specialist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">District / Location</label>
                  <input
                    type="text"
                    required
                    value={checkinDistrict}
                    onChange={(e) => setCheckinDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Activity / Status Note</label>
                <input
                  type="text"
                  value={checkinNote}
                  onChange={(e) => setCheckinNote(e.target.value)}
                  placeholder="e.g. Clinic outreach or bursary interview"
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D6CEBE] text-xs font-semibold hover:bg-[#F3EFE7]"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>Attach GPS Coordinates</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-xs font-semibold"
                >
                  Submit Check-In
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[#1C1917]">
                Tracking & Tracing Roster
              </h2>
              <input
                type="text"
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
                placeholder="Trace employee or applicant..."
                className="px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg sm:w-64"
              />
            </div>

            <div className="divide-y divide-[#F3EFE7]">
              {filteredTracking.map((rec) => (
                <div key={rec.id} className="py-3.5 flex flex-col sm:flex-row justify-between gap-2">
                  <div>
                    <p className="text-xs text-[#78716C]">
                      {rec.roleType} · {rec.department}
                    </p>
                    <h3 className="text-base font-semibold text-[#1C1917]">{rec.personName}</h3>
                    <p className="text-sm text-[#44403C]">{rec.statusNote}</p>
                  </div>
                  <div className="sm:text-right text-xs text-[#57534E] shrink-0">
                    <p className="font-semibold text-[#14532D]">{rec.district}</p>
                    {rec.coordinates && (
                      <p className="font-mono tabular-nums">
                        {rec.coordinates.lat}, {rec.coordinates.lng}
                      </p>
                    )}
                    <p className="font-mono text-[11px] text-[#78716C]">
                      {new Date(rec.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Global Phone Number Tracking & Caller ID / Address Lookup */}
      {subTab === 'phone' && (
        <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#78716C]">
              Telecom & Caller Verification
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#1C1917]">
              Global Phone Number Tracking & Caller Address Lookup
            </h2>
            <p className="mt-1 text-sm text-[#57534E]">
              Identify country, African or global telecom carrier, time zone, and verified caller
              identity/address from the KDF directory and your encrypted contact vault.
            </p>
          </div>

          <form onSubmit={handlePhoneLookup} className="flex flex-col sm:flex-row gap-3">
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Enter phone number e.g. +256 770610329"
              className="flex-1 px-4 py-2.5 text-sm font-mono tabular-nums bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold whitespace-nowrap"
            >
              Trace Number & Caller
            </button>
          </form>

          {phoneError && (
            <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{phoneError}</p>
          )}

          {phoneResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 rounded-xl bg-[#FBF9F5] border border-[#E5DFD3] space-y-2">
                <p className="text-xs text-[#78716C]">Network & Country Routing</p>
                <p className="text-xl font-mono font-semibold text-[#14532D]">
                  {phoneResult.e164}
                </p>
                <p className="text-sm">
                  <strong>Country:</strong> {phoneResult.country} ({phoneResult.region})
                </p>
                <p className="text-sm">
                  <strong>Carrier Network:</strong> {phoneResult.carrier}
                </p>
                <p className="text-sm">
                  <strong>Time Zone:</strong> {phoneResult.timezone}
                </p>
                {phoneResult.locationDetails && (
                  <div className="pt-2 border-t border-[#E5DFD3] space-y-1 text-sm">
                    <p>
                      <strong>Routing Hub Location:</strong>{' '}
                      {phoneResult.locationDetails.hubLocation}
                    </p>
                    <p className="font-mono text-xs text-[#57534E] tabular-nums">
                      Coordinates: {phoneResult.locationDetails.coordinates.lat},{' '}
                      {phoneResult.locationDetails.coordinates.lng} · Emergency:{' '}
                      {phoneResult.locationDetails.emergencyNumber}
                    </p>
                    <a
                      href={phoneResult.locationDetails.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A8A] hover:underline pt-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>View Routing Hub Location on Map</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="p-5 rounded-xl bg-[#FBF9F5] border border-[#E5DFD3] space-y-3">
                <p className="text-xs text-[#78716C]">Caller Identity & Address</p>
                <h3 className="text-lg font-semibold text-[#1C1917]">
                  {phoneResult.callerMatch.name}
                </h3>
                <p className="text-xs text-[#57534E]">
                  {phoneResult.callerMatch.role} · {phoneResult.callerMatch.source}
                </p>
                <p className="text-sm text-[#292524]">{phoneResult.callerMatch.address}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href={phoneResult.telUrl}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D6CEBE] bg-white text-xs font-semibold hover:bg-[#F3EFE7]"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Caller</span>
                  </a>
                  <a
                    href={phoneResult.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#14532D] text-white text-xs font-semibold hover:bg-[#114224]"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Chat & Call</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Intelligence, Investigation & Global Public Information Research */}
      {subTab === 'intelligence' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 sm:p-8 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#78716C]">
                Public Safety, OSINT & Institutional Verification
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[#1C1917]">
                Intelligence, Investigation & Global Public Search
              </h2>
              <p className="mt-1 text-sm text-[#57534E]">
                Search public international records, NGO compliance registries, official UN/CIA
                World Factbook country briefings, and public safety advisories.
              </p>
            </div>

            <form onSubmit={runOsintSearch} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={osintQuery}
                onChange={(e) => setOsintQuery(e.target.value)}
                placeholder="Search public information, organization, country profile, or safety advisory..."
                className="flex-1 px-4 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
              />
              <button
                type="submit"
                disabled={osintLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1E3A8A] hover:bg-[#172C6B] text-white text-sm font-semibold whitespace-nowrap disabled:opacity-60"
              >
                <Globe className="w-4 h-4" />
                <span>{osintLoading ? 'Researching...' : 'Search Global Public Records'}</span>
              </button>
            </form>

            {osintError && (
              <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{osintError}</p>
            )}

            {osintResult && (
              <div className="p-6 rounded-xl bg-[#FBF9F5] border border-[#E5DFD3] space-y-3">
                <div className="text-sm text-[#1C1917] whitespace-pre-wrap leading-relaxed">
                  {osintResult}
                </div>
                {osintSources.length > 0 && (
                  <div className="pt-3 border-t border-[#E5DFD3] space-y-1">
                    {osintSources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-[#1E3A8A] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{s.title || s.uri}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LEGAL_MEDICAL_POLICE_PORTALS.map((item) => (
              <div
                key={item.name}
                className="bg-white border border-[#E5DFD3] rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <p className="text-xs text-[#78716C]">{item.category}</p>
                  <h3 className="mt-1 text-base font-semibold text-[#1C1917]">{item.name}</h3>
                  <p className="mt-2 text-xs text-[#44403C] leading-relaxed">{item.description}</p>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] hover:underline"
                >
                  <span>{item.actionLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Phone Contacts, Calling, WhatsApp & Social Links */}
      {subTab === 'contacts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#1C1917]">
                  Encrypted Phone Contacts & Quick Dialer
                </h2>
                <p className="text-xs text-[#57534E]">
                  Access device contacts or manage your encrypted KDF contact list.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAccessPhoneContacts}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#14532D] text-white text-xs font-semibold hover:bg-[#114224]"
                >
                  <Contact className="w-4 h-4" />
                  <span>Access Phone Contacts</span>
                </button>
                <button
                  onClick={onShareApp}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D6CEBE] text-xs font-semibold hover:bg-[#F3EFE7]"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share App</span>
                </button>
              </div>
            </div>

            {contactStatus && (
              <p className="text-xs font-medium text-[#14532D] bg-[#14532D]/10 p-2.5 rounded-lg">
                {contactStatus}
              </p>
            )}

            <form onSubmit={handleSaveContact} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                required
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Contact Name"
                className="px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
              />
              <input
                type="tel"
                required
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                placeholder="Phone (+256...)"
                className="px-3 py-2 text-sm font-mono bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newContactAddress}
                  onChange={(e) => setNewContactAddress(e.target.value)}
                  placeholder="Address / District"
                  className="flex-1 min-w-0 px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-[#14532D] text-white text-xs font-semibold whitespace-nowrap"
                >
                  Add
                </button>
              </div>
            </form>

            <div className="divide-y divide-[#F3EFE7]">
              {contacts.length === 0 ? (
                <p className="py-4 text-xs text-[#78716C]">
                  No personal contacts saved yet. Click "Access Phone Contacts" or add one above.
                </p>
              ) : (
                contacts.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1C1917]">{c.name}</p>
                      <p className="text-xs font-mono text-[#57534E]">
                        {c.phone} {c.address ? `· ${c.address}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`tel:${c.phone.replace(/\s+/g, '')}`}
                        className="px-2.5 py-1.5 rounded border border-[#D6CEBE] text-xs font-semibold hover:bg-[#F3EFE7]"
                      >
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded bg-[#14532D] text-white text-xs font-semibold"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Personal Social Media Accounts Hub */}
          <div className="lg:col-span-5 bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-[#1C1917]">
              Your Social Media Accounts
            </h2>
            <p className="text-xs text-[#57534E]">
              Link your social profiles securely inside your KDF account for community and partner
              verification.
            </p>
            {socialSavedMsg && (
              <p className="text-xs font-medium text-[#14532D] bg-[#14532D]/10 p-2 rounded-lg">
                {socialSavedMsg}
              </p>
            )}
            <form onSubmit={handleSaveSocials} className="space-y-3">
              {['WhatsApp', 'Facebook', 'LinkedIn', 'X (Twitter)', 'Instagram', 'YouTube', 'TikTok'].map(
                (platform) => (
                  <div key={platform}>
                    <label className="block text-xs font-semibold text-[#292524] mb-1">
                      {platform} Profile / Handle
                    </label>
                    <input
                      type="text"
                      value={socialLinks[platform] || ''}
                      onChange={(e) =>
                        setSocialLinks((prev) => ({ ...prev, [platform]: e.target.value }))
                      }
                      placeholder={`https://... or @handle`}
                      className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                  </div>
                )
              )}
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold"
              >
                Save Encrypted Social Accounts
              </button>
            </form>

            <div className="pt-4 border-t border-[#E5DFD3] text-xs text-[#57534E]">
              Direct KDF Official WhatsApp:{' '}
              <a
                href={`https://wa.me/${KDF_ORG.officeLine.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#14532D] hover:underline"
              >
                {KDF_ORG.officeLine}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
