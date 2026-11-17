import React, { useEffect, useState } from 'react';
import {
  Globe2,
  GraduationCap,
  Scale,
  Radio,
  Heart,
  ExternalLink,
  Wifi,
  UserPlus,
  Video,
  Lock,
  Unlock,
  Send,
  Copy,
  Satellite,
  Users,
  ShieldCheck,
} from 'lucide-react';
import {
  FRIENDSHIP_AND_AI_PLATFORMS,
  GLOBAL_FREE_DATING_AND_MARRIAGE,
  GLOBAL_GOVERNMENT_POLICE_PORTALS,
  GLOBAL_SATELLITE_PORTALS,
  LEGAL_MEDICAL_POLICE_PORTALS,
  TELECOM_SATELLITE_BANKING,
  UN_AND_GLOBAL_PORTALS,
  UNIVERSITIES_AND_LEARNING,
  type GlobalLinkItem,
} from '../data/kdfData';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { safeReadJson } from '../utils/http';

interface CommunityProfile {
  id: string;
  displayName: string;
  intent: string;
  cityCountry: string;
  bio: string;
  preferredApp: string;
  contactHandle: string;
  createdAt: string;
}

interface UnDispatchItem {
  id: string;
  agency: string;
  senderName: string;
  dispatchType: string;
  subject: string;
  details: string;
  createdAt: string;
}

interface MeetingRoomItem {
  id: string;
  title: string;
  hostName: string;
  roomSlug: string;
  meetingUrl: string;
  category: string;
  createdAt: string;
}

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

interface FamilyMemberItem {
  id: string;
  fullName: string;
  relationship: string;
  ageOrCategory: string;
  phone: string;
  emergencyNotes: string;
  addedAt: string;
}

interface GlobalPortalsSectionProps {
  initialCategory?:
    | 'un'
    | 'meetings'
    | 'vault'
    | 'universities'
    | 'legal'
    | 'telecom'
    | 'friends';
  currentUserName?: string;
  currentUserLocation?: string;
  authToken?: string;
}

export const GlobalPortalsSection: React.FC<GlobalPortalsSectionProps> = ({
  initialCategory = 'un',
  currentUserName = '',
  currentUserLocation = 'Mityana, Uganda',
  authToken = '',
}) => {
  const [category, setCategory] = useState<
    'un' | 'meetings' | 'vault' | 'universities' | 'legal' | 'telecom' | 'friends'
  >(initialCategory);
  const isOnline = useOnlineStatus();

  // UN Inter-Agency Dispatches
  const [dispatches, setDispatches] = useState<UnDispatchItem[]>([]);
  const [unAgency, setUnAgency] = useState('UN Partner Portal (UNPP)');
  const [dispatchType, setDispatchType] = useState('Communication');
  const [dispatchSubject, setDispatchSubject] = useState('');
  const [dispatchDetails, setDispatchDetails] = useState('');
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);

  // Free Global Meetings & Calls
  const [meetings, setMeetings] = useState<MeetingRoomItem[]>([]);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingCategory, setMeetingCategory] = useState('Global Open Conference');
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

  // Encrypted Private Vault, Passkey Lock & Family Protection
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [unlockingVault, setUnlockingVault] = useState(false);

  const [secrets, setSecrets] = useState<VaultSecretItem[]>([]);
  const [secretTitle, setSecretTitle] = useState('');
  const [secretClass, setSecretClass] = useState('Confidential');
  const [secretNotes, setSecretNotes] = useState('');
  const [secretFile, setSecretFile] = useState<{ name: string; base64: string } | null>(null);
  const [secretMsg, setSecretMsg] = useState<string | null>(null);

  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>([]);
  const [famName, setFamName] = useState('');
  const [famRelation, setFamRelation] = useState('Child / Dependent');
  const [famCategory, setFamCategory] = useState('Protected Dependent');
  const [famPhone, setFamPhone] = useState('');
  const [famNotes, setFamNotes] = useState('');
  const [famMsg, setFamMsg] = useState<string | null>(null);

  // KDF Dating, Friendship & Marriage Encrypted Board
  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);
  const [displayName, setDisplayName] = useState(currentUserName);
  const [intent, setIntent] = useState('Friendship');
  const [cityCountry, setCityCountry] = useState(currentUserLocation);
  const [preferredApp, setPreferredApp] = useState('Tinder / AfroIntroductions / Hinge');
  const [bio, setBio] = useState('');
  const [age18Plus, setAge18Plus] = useState(true);
  const [boardMessage, setBoardMessage] = useState<string | null>(null);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    fetch('/api/community/connections')
      .then((r) => r.json())
      .then((d) => setProfiles(d.profiles || []))
      .catch(() => {});

    fetch('/api/un/dispatches')
      .then((r) => r.json())
      .then((d) => setDispatches(d.dispatches || []))
      .catch(() => {});

    fetch('/api/meetings')
      .then((r) => r.json())
      .then((d) => setMeetings(d.meetings || []))
      .catch(() => {});

    fetch('/api/vault/secrets')
      .then((r) => r.json())
      .then((d) => setSecrets(d.secrets || []))
      .catch(() => {});

    fetch('/api/family')
      .then((r) => r.json())
      .then((d) => setFamilyMembers(d.members || []))
      .catch(() => {});
  }, []);

  const handlePostDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchMsg(null);
    try {
      const res = await fetch('/api/un/dispatches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency: unAgency,
          senderName: currentUserName || 'KDF Coordinator',
          dispatchType,
          subject: dispatchSubject,
          details: dispatchDetails,
        }),
      });
      const data = await safeReadJson<{ dispatch?: UnDispatchItem }>(res);
      if (res.ok && data.dispatch) {
        setDispatches((prev) => [data.dispatch!, ...prev]);
        setDispatchSubject('');
        setDispatchDetails('');
        setDispatchMsg('UN partner communication & duty logged in encrypted KDF dispatch vault.');
      } else {
        setDispatchMsg(data.error || 'Could not send UN dispatch.');
      }
    } catch {
      setDispatchMsg('Network error while sending UN dispatch.');
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: meetingTitle,
          hostName: currentUserName || 'KDF Host',
          category: meetingCategory,
        }),
      });
      const data = await safeReadJson<{ meeting?: MeetingRoomItem }>(res);
      if (res.ok && data.meeting) {
        setMeetings((prev) => [data.meeting!, ...prev]);
        setMeetingTitle('');
      }
    } catch {
      // Ignore transient network errors
    }
  };

  const handleCopyMeeting = async (room: MeetingRoomItem) => {
    try {
      await navigator.clipboard.writeText(room.meetingUrl);
      setCopiedRoomId(room.id);
      setTimeout(() => setCopiedRoomId(null), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleSecretFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => {
      setSecretMsg(`Could not read "${file.name}". Please choose another file.`);
    };
    reader.onload = () => {
      setSecretFile({ name: file.name, base64: String(reader.result || '') });
    };
    reader.readAsDataURL(file);
  };

  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasskeyError(null);
    setUnlockingVault(true);
    try {
      const res = await fetch('/api/auth/verify-passkey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ passkey: passkeyInput }),
      });
      const data = await safeReadJson<{ unlocked?: boolean }>(res);
      if (!res.ok) {
        setPasskeyError(data.error || 'Invalid Passkey. Vault remains locked.');
        return;
      }
      setVaultUnlocked(true);
      setPasskeyInput('');
    } catch {
      setPasskeyError('Unable to verify passkey right now.');
    } finally {
      setUnlockingVault(false);
    }
  };

  const handleSaveFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFamMsg(null);
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: famName,
          relationship: famRelation,
          ageOrCategory: famCategory,
          phone: famPhone,
          emergencyNotes: famNotes,
        }),
      });
      const data = await safeReadJson<{ member?: FamilyMemberItem }>(res);
      if (res.ok && data.member) {
        setFamilyMembers((prev) => [data.member!, ...prev]);
        setFamName('');
        setFamPhone('');
        setFamNotes('');
        setFamMsg('Family member added to your Passkey-protected KDF registry.');
      } else {
        setFamMsg(data.error || 'Could not add family member.');
      }
    } catch {
      setFamMsg('Network error while saving family member.');
    }
  };

  const handleSaveSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecretMsg(null);
    try {
      const res = await fetch('/api/vault/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmailOrPhone: currentUserName || 'Registered Member',
          title: secretTitle,
          classification: secretClass,
          notes: secretNotes,
          fileName: secretFile?.name,
          fileBase64: secretFile?.base64,
        }),
      });
      const data = await safeReadJson<{ secret?: VaultSecretItem }>(res);
      if (res.ok && data.secret) {
        setSecrets((prev) => [data.secret!, ...prev]);
        setSecretTitle('');
        setSecretNotes('');
        setSecretFile(null);
        setSecretMsg('Encrypted with NIST AES-256-GCM + SHA-256 checksum inside your KDF Vault.');
      } else {
        setSecretMsg(data.error || 'Could not save secret.');
      }
    } catch {
      setSecretMsg('Network error while storing secret.');
    }
  };

  const handlePostProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBoardMessage(null);
    try {
      const res = await fetch('/api/community/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          intent,
          cityCountry,
          preferredApp,
          bio,
          ageConfirmed18Plus: age18Plus,
        }),
      });
      const data = await safeReadJson<{ profile?: CommunityProfile }>(res);
      if (res.ok && data.profile) {
        setProfiles((prev) => [data.profile!, ...prev]);
        setBio('');
        setBoardMessage('Profile encrypted and published to the KDF Dating, Friendship & Marriage board.');
      } else {
        setBoardMessage(data.error || 'Could not publish profile.');
      }
    } catch {
      setBoardMessage('Network error while publishing profile.');
    }
  };

  const renderGrid = (items: GlobalLinkItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((item) => (
        <article
          key={item.name}
          className="bg-white border border-[#E5DFD3] rounded-xl p-6 flex flex-col justify-between gap-4"
        >
          <div>
            <p className="text-xs text-[#78716C] font-medium">{item.category}</p>
            <h3 className="mt-1.5 text-lg font-semibold text-[#1C1917]">{item.name}</h3>
            <p className="mt-2 text-sm text-[#44403C] leading-relaxed">{item.description}</p>
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#172C6B] text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <span>{item.actionLabel}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </article>
      ))}
    </div>
  );

  const navInfo =
    typeof navigator !== 'undefined'
      ? (navigator as unknown as {
          connection?: { effectiveType?: string; downlink?: number; saveData?: boolean };
        }).connection
      : undefined;

  return (
    <div className="space-y-8">
      <div className="bg-white border border-[#E5DFD3] rounded-xl p-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('un')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            category === 'un'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>UN Portals & Agency Dispatch</span>
        </button>

        <button
          onClick={() => setCategory('meetings')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            category === 'meetings'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Free Global Meetings & Calls</span>
        </button>

        <button
          onClick={() => setCategory('vault')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            category === 'vault'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Passkey Vault & Family Protection</span>
        </button>

        <button
          onClick={() => setCategory('legal')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            category === 'legal'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Police, U.S. Gov, FBI/CIA & Legal</span>
        </button>

        <button
          onClick={() => setCategory('telecom')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            category === 'telecom'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Satellites, Telecoms & Banking</span>
        </button>

        <button
          onClick={() => setCategory('universities')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            category === 'universities'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Free Universities (Alison & UNDSS)</span>
        </button>

        <button
          onClick={() => setCategory('friends')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            category === 'friends'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>KDF Dating, Friendship & Marriage</span>
        </button>
      </div>

      {/* 1. UN Partner Portal, UN Agencies & Inter-Agency Communication/Duties Dispatch */}
      {category === 'un' && (
        <div className="space-y-8">
          <div className="bg-white border border-[#E5DFD3] rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#1C1917]">
              United Nations, eSANGO, SDG & World Bank Connections
            </h2>
            <p className="mt-1 text-sm text-[#57534E]">
              Connect with UN Partner Portal, UN Women, UN ECOSOC eSANGO, UNICEF, UNHCR, WHO, WFP,
              UNDP, and World Bank, and coordinate duties and confidential briefs in the KDF
              encrypted dispatch log below.
            </p>
          </div>

          {renderGrid(UN_AND_GLOBAL_PORTALS)}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-semibold text-[#1C1917]">
                UN Agency Communication & Duty Dispatch
              </h3>
              {dispatchMsg && (
                <p className="text-xs font-medium text-[#14532D] bg-[#14532D]/10 p-2.5 rounded-lg">
                  {dispatchMsg}
                </p>
              )}
              <form onSubmit={handlePostDispatch} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">UN Organization</label>
                  <select
                    value={unAgency}
                    onChange={(e) => setUnAgency(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  >
                    <option>UN Partner Portal (UNPP)</option>
                    <option>UN Women</option>
                    <option>UNICEF</option>
                    <option>UNHCR</option>
                    <option>World Health Organization (WHO)</option>
                    <option>World Food Programme (WFP)</option>
                    <option>UNDP & SDG Action</option>
                    <option>UN DESA / eSANGO</option>
                    <option>World Bank Group</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Dispatch Type</label>
                  <select
                    value={dispatchType}
                    onChange={(e) => setDispatchType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  >
                    <option>Communication</option>
                    <option>Field Duty Assignment</option>
                    <option>Confidential Brief</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={dispatchSubject}
                    onChange={(e) => setDispatchSubject(e.target.value)}
                    placeholder="e.g. Joint HIV/AIDS Outreach Duty Roster"
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Message / Duty Instructions
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={dispatchDetails}
                    onChange={(e) => setDispatchDetails(e.target.value)}
                    placeholder="Specify action items, district, and assigned personnel..."
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Encrypted Dispatch</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-semibold text-[#1C1917]">
                Inter-Agency Communications & Assigned Duties
              </h3>
              <div className="divide-y divide-[#F3EFE7]">
                {dispatches.map((d) => (
                  <div key={d.id} className="py-3.5 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#78716C]">
                      <span className="font-semibold text-[#1E3A8A]">{d.agency}</span>
                      <span>
                        {d.dispatchType} · {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-base font-semibold text-[#1C1917]">{d.subject}</h4>
                    <p className="text-sm text-[#44403C]">{d.details}</p>
                    <p className="text-xs text-[#78716C]">Sent by: {d.senderName}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Free Global Multi-Participant Meetings & Calls */}
      {category === 'meetings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
            <p className="text-xs uppercase tracking-widest text-[#78716C]">
              Open WebRTC Conferencing
            </p>
            <h2 className="text-2xl font-semibold text-[#1C1917]">
              Free Global Meetings & Calls
            </h2>
            <p className="text-sm text-[#57534E]">
              Create free international video and voice conference rooms powered by open-source
              Jitsi Meet. Share the room link with staff, UN partners, donors, or community groups
              worldwide with no subscription fee.
            </p>

            <form onSubmit={handleCreateMeeting} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Meeting Room Title</label>
                <input
                  type="text"
                  required
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Mityana Community Townhall"
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Meeting Category</label>
                <select
                  value={meetingCategory}
                  onChange={(e) => setMeetingCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                >
                  <option>Global Open Conference</option>
                  <option>UN & Donor Briefing</option>
                  <option>Health & Medical Outreach</option>
                  <option>Staff & Board Meeting</option>
                  <option>Community & Education Seminar</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold"
              >
                <Video className="w-4 h-4" />
                <span>Create Free Global Meeting Room</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
            <h3 className="text-xl font-semibold text-[#1C1917]">Active Conference Rooms</h3>
            <div className="divide-y divide-[#F3EFE7]">
              {meetings.map((room) => (
                <div
                  key={room.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs text-[#78716C]">
                      {room.category} · Host: {room.hostName}
                    </p>
                    <h4 className="text-base font-semibold text-[#1C1917]">{room.title}</h4>
                    <p className="text-xs font-mono text-[#57534E] truncate max-w-md">
                      {room.meetingUrl}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyMeeting(room)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D6CEBE] text-xs font-semibold hover:bg-[#F3EFE7]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedRoomId === room.id ? 'Copied' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={room.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-xs font-semibold"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Free Call</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Passkey-Protected Private Vault & Family Members Registry */}
      {category === 'vault' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#14532D] font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Intruder Protection Active · NIST AES-256-GCM + scrypt Passkey</span>
              </div>
              <h2 className="text-2xl font-semibold text-[#1C1917]">
                Passkey Private Vault & Family Protection Registry
              </h2>
              <p className="text-sm text-[#57534E]">
                Add your family members for emergency protection and store confidential records or
                files protected by your personal Passkey.
              </p>
            </div>
            {vaultUnlocked && (
              <button
                onClick={() => setVaultUnlocked(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D6CEBE] text-xs font-semibold text-[#1C1917] hover:bg-[#F3EFE7] shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Vault</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              {/* Family Member Protection Form */}
              <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-[#1C1917]">
                  <Users className="w-5 h-5 text-[#14532D]" />
                  <h3>Add Family Member for Protection</h3>
                </div>
                {famMsg && (
                  <p className="text-xs font-medium text-[#14532D] bg-[#14532D]/10 p-2.5 rounded-lg">
                    {famMsg}
                  </p>
                )}
                <form onSubmit={handleSaveFamilyMember} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Family Member Full Name</label>
                    <input
                      type="text"
                      required
                      value={famName}
                      onChange={(e) => setFamName(e.target.value)}
                      placeholder="e.g. Namukasa Sarah"
                      className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Relationship</label>
                      <select
                        value={famRelation}
                        onChange={(e) => setFamRelation(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                      >
                        <option>Child / Dependent</option>
                        <option>Spouse</option>
                        <option>Parent / Elderly</option>
                        <option>Orphan Under Care</option>
                        <option>Sibling / Relative</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Support Category</label>
                      <select
                        value={famCategory}
                        onChange={(e) => setFamCategory(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                      >
                        <option>Protected Dependent</option>
                        <option>Orphan / OVC</option>
                        <option>Elderly</option>
                        <option>Person with Disability</option>
                        <option>Girl Child / Widow</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Phone / Emergency Contact</label>
                    <input
                      type="tel"
                      value={famPhone}
                      onChange={(e) => setFamPhone(e.target.value)}
                      placeholder="+256..."
                      className="w-full px-3 py-2 text-sm font-mono bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Medical / Safety / School Protection Notes
                    </label>
                    <textarea
                      rows={2}
                      value={famNotes}
                      onChange={(e) => setFamNotes(e.target.value)}
                      placeholder="Allergies, NIRA ref, school, or emergency protection instructions..."
                      className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold"
                  >
                    <Users className="w-4 h-4" />
                    <span>Encrypt & Protect Family Member</span>
                  </button>
                </form>
              </div>

              {/* Confidential Secrets & Files Form */}
              <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-[#1C1917]">
                  Upload & Store Confidential Secrets
                </h3>
                {secretMsg && (
                  <p className="text-xs font-medium text-[#14532D] bg-[#14532D]/10 p-2.5 rounded-lg">
                    {secretMsg}
                  </p>
                )}

                <form onSubmit={handleSaveSecret} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Record Title</label>
                    <input
                      type="text"
                      required
                      value={secretTitle}
                      onChange={(e) => setSecretTitle(e.target.value)}
                      placeholder="e.g. Land Deed / Confidential Case File"
                      className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Privacy Classification</label>
                    <select
                      value={secretClass}
                      onChange={(e) => setSecretClass(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    >
                      <option>Confidential</option>
                      <option>Private Personal Record</option>
                      <option>Board / Executive Only</option>
                      <option>Legal & Protection Sensitive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Confidential Notes</label>
                    <textarea
                      rows={3}
                      value={secretNotes}
                      onChange={(e) => setSecretNotes(e.target.value)}
                      placeholder="Enter protected details..."
                      className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Attach File (Optional)</label>
                    <input
                      type="file"
                      onChange={handleSecretFileChange}
                      className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#14532D] file:text-white file:font-semibold"
                    />
                    {secretFile && (
                      <p className="mt-1 text-xs text-[#14532D] font-mono">{secretFile.name}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#172C6B] text-white text-sm font-semibold"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Encrypt & Store Secret in Vault</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Panel: Passkey Unlock Gate -> Protected Family & Secrets */}
            <div className="lg:col-span-7 space-y-6">
              {!vaultUnlocked ? (
                <div className="bg-white border border-[#E5DFD3] rounded-xl p-8 space-y-4">
                  <div className="flex items-center gap-2.5 text-[#78350F]">
                    <Lock className="w-5 h-5" />
                    <h3 className="text-xl font-semibold text-[#1C1917]">
                      Vault Locked — Enter Your Passkey to View Protected Records
                    </h3>
                  </div>
                  <p className="text-sm text-[#57534E]">
                    To prevent intruders from reading your family members’ information or stored
                    secrets, enter your personal Passkey or account password to unlock this panel.
                    ({familyMembers.length} protected family members · {secrets.length} encrypted
                    secrets currently sealed)
                  </p>
                  {passkeyError && (
                    <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                      {passkeyError}
                    </p>
                  )}
                  <form onSubmit={handleUnlockVault} className="flex flex-col sm:flex-row gap-3 pt-2">
                    <input
                      type="password"
                      required
                      value={passkeyInput}
                      onChange={(e) => setPasskeyInput(e.target.value)}
                      placeholder="Enter your personal Passkey..."
                      className="flex-1 px-4 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                    <button
                      type="submit"
                      disabled={unlockingVault}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold whitespace-nowrap"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>{unlockingVault ? 'Verifying...' : 'Unlock with Passkey'}</span>
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
                    <h3 className="text-xl font-semibold text-[#1C1917]">
                      Protected Family Members ({familyMembers.length})
                    </h3>
                    {familyMembers.length === 0 ? (
                      <p className="text-sm text-[#78716C]">
                        No family members registered yet. Add a family member on the left.
                      </p>
                    ) : (
                      <div className="divide-y divide-[#F3EFE7]">
                        {familyMembers.map((m) => (
                          <div key={m.id} className="py-3.5 space-y-1">
                            <div className="flex items-center justify-between text-xs text-[#78716C]">
                              <span className="font-semibold text-[#14532D]">
                                {m.relationship} · {m.ageOrCategory}
                              </span>
                              {m.phone && <span className="font-mono">{m.phone}</span>}
                            </div>
                            <h4 className="text-base font-semibold text-[#1C1917]">{m.fullName}</h4>
                            {m.emergencyNotes && (
                              <p className="text-sm text-[#44403C]">{m.emergencyNotes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
                    <h3 className="text-xl font-semibold text-[#1C1917]">
                      Encrypted Vault Secrets ({secrets.length})
                    </h3>
                    {secrets.length === 0 ? (
                      <p className="text-sm text-[#78716C]">
                        No confidential secrets stored yet. Use the form on the left to encrypt and
                        store a record.
                      </p>
                    ) : (
                      <div className="divide-y divide-[#F3EFE7]">
                        {secrets.map((s) => (
                          <div key={s.id} className="py-3.5 space-y-1">
                            <div className="flex items-center justify-between text-xs text-[#78716C]">
                              <span className="font-semibold text-[#14532D]">{s.classification}</span>
                              <span className="font-mono">{s.cipher}</span>
                            </div>
                            <h4 className="text-base font-semibold text-[#1C1917]">{s.title}</h4>
                            {s.notes && <p className="text-sm text-[#44403C]">{s.notes}</p>}
                            {s.fileName && (
                              <p className="text-xs font-mono text-[#1E3A8A]">File: {s.fileName}</p>
                            )}
                            <p className="text-[11px] font-mono text-[#78716C] truncate">
                              SHA-256: {s.sha256}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Police Headquarters, U.S. Government, FBI/CIA Public Portals & Legal/Medical */}
      {category === 'legal' && (
        <div className="space-y-8">
          <div className="bg-white border border-[#E5DFD3] rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#1C1917]">
              World Police Headquarters, U.S. Government, FBI/CIA Public Portals & Free Legal Aid
            </h2>
            <p className="mt-1 text-sm text-[#57534E]">
              Verified official public contact portals for Uganda Police Force (999 / 112), INTERPOL
              Headquarters, U.S. Government (USA.gov), U.S. Embassy Kampala, FBI, CIA public
              contact channels, free lawyers (LASPNET/FIDA/ILF), and humanitarian medical networks.
            </p>
          </div>
          {renderGrid(GLOBAL_GOVERNMENT_POLICE_PORTALS)}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-[#1C1917]">
              Free Legal Aid, Medical & Safety Networks
            </h3>
            {renderGrid(LEGAL_MEDICAL_POLICE_PORTALS)}
          </div>
        </div>
      )}

      {/* 5. Global Satellites, African Telecoms, Wi-Fi & Banking */}
      {category === 'telecom' && (
        <div className="space-y-8">
          <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[#1C1917]">
                Global Satellites, African Telecom Roaming, Wi-Fi & Banking
              </h2>
              <p className="mt-1 text-sm text-[#57534E]">
                Public Earth observation and humanitarian satellite hubs (UNOSAT, NASA Worldview,
                ESA Copernicus, CelesTrak, Starlink), Pan-African mobile carriers, and development
                banking portals.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#FBF9F5] border border-[#E5DFD3] text-xs font-mono shrink-0 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#14532D]">
                <Wifi className="w-3.5 h-3.5" />
                <span>Connection: {isOnline ? 'Online' : 'Offline Cache Mode'}</span>
              </div>
              <div className="text-[#57534E]">
                Network: {navInfo?.effectiveType || 'Standard'} · Downlink:{' '}
                {navInfo?.downlink ? `${navInfo.downlink} Mbps` : 'Adaptive'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-[#1C1917]">
              <Satellite className="w-5 h-5 text-[#14532D]" />
              <h3>Global Satellite & Earth Observation Networks</h3>
            </div>
            {renderGrid(GLOBAL_SATELLITE_PORTALS)}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#1C1917]">
              African Phone Carriers & International Banking
            </h3>
            {renderGrid(TELECOM_SATELLITE_BANKING)}
          </div>
        </div>
      )}

      {/* 6. Free Universities */}
      {category === 'universities' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E5DFD3] rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#1C1917]">
              Free Universities, Alison, UNDSS & Humanitarian Training
            </h2>
            <p className="mt-1 text-sm text-[#57534E]">
              Free accredited learning and safety certifications for KDF staff, youth, girl child
              scholars, and rural community leaders.
            </p>
          </div>
          {renderGrid(UNIVERSITIES_AND_LEARNING)}
        </div>
      )}

      {/* 7. KDF Dating, Friendship & Marriage */}
      {category === 'friends' && (
        <div className="space-y-8">
          <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#78716C]">
                Global Social, Community & Relationship Hub (18+)
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[#1C1917]">
                KDF Dating, Friendship, Marriage & Tinder Connect
              </h2>
              <p className="mt-1 text-sm text-[#57534E]">
                Connect safely with Tinder, local and international friends, companionship, and
                marriage partners across the world’s leading free platforms, plus our encrypted
                KDF Community Introduction Board.
              </p>
            </div>
            <a
              href="https://tinder.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#78350F] hover:bg-[#5E2A0B] text-white text-sm font-semibold whitespace-nowrap shrink-0"
            >
              <Heart className="w-4 h-4" />
              <span>Connect on Tinder</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {renderGrid(GLOBAL_FREE_DATING_AND_MARRIAGE)}

          {/* Encrypted KDF Dating, Friendship & Marriage Introduction Board */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#14532D]">
                <UserPlus className="w-4 h-4" />
                <span>Post KDF Community Introduction (18+)</span>
              </div>
              {boardMessage && (
                <p className="text-xs font-medium text-[#14532D] bg-[#14532D]/10 p-2.5 rounded-lg">
                  {boardMessage}
                </p>
              )}
              <form onSubmit={handlePostProfile} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Connection Type</label>
                    <select
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    >
                      <option>Friendship</option>
                      <option>Dating</option>
                      <option>Marriage</option>
                      <option>Pen Pal / Cultural Exchange</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">City & Country</label>
                    <input
                      type="text"
                      required
                      value={cityCountry}
                      onChange={(e) => setCityCountry(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Preferred Free Global App
                  </label>
                  <input
                    type="text"
                    value={preferredApp}
                    onChange={(e) => setPreferredApp(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Introduction Bio</label>
                  <textarea
                    rows={3}
                    required
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share your values, interests, or what kind of friendship/marriage connection you seek..."
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-[#44403C]">
                  <input
                    type="checkbox"
                    checked={age18Plus}
                    onChange={(e) => setAge18Plus(e.target.checked)}
                    required
                  />
                  <span>
                    I confirm I am 18 years or older and consent to respectful community rules.
                  </span>
                </label>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold"
                >
                  Save & Post Encrypted Introduction
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-semibold text-[#1C1917]">
                KDF Global Connections Directory
              </h3>
              <div className="divide-y divide-[#F3EFE7]">
                {profiles.map((p) => (
                  <div key={p.id} className="py-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#78716C]">
                      <span className="font-semibold text-[#14532D]">{p.intent}</span>
                      <span>
                        {p.cityCountry} · {p.preferredApp}
                      </span>
                    </div>
                    <h4 className="text-base font-semibold text-[#1C1917]">{p.displayName}</h4>
                    <p className="text-sm text-[#44403C]">{p.bio}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-4">
            <h3 className="text-xl font-semibold text-[#1C1917]">
              Advanced Global AI & Open Research Systems
            </h3>
            {renderGrid(FRIENDSHIP_AND_AI_PLATFORMS.slice(4))}
          </div>
        </div>
      )}
    </div>
  );
};
