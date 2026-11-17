import React, { useEffect, useRef, useState } from 'react';
import {
  ShoppingBag,
  Tv,
  Radio,
  BadgeCheck,
  Camera,
  Mic,
  HardDriveUpload,
  ExternalLink,
  ShoppingCart,
  Square,
} from 'lucide-react';
import {
  DIGITAL_COMMERCE_AND_MARKETS,
  FREE_TV_AND_RADIO,
  NIRA_OFFICIAL_SOURCES,
} from '../data/kdfData';
import type { RegisteredUser } from './RegistrationGate';
import { safeReadJson } from '../utils/http';

interface MarketItem {
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
}

interface MarketsMediaSectionProps {
  user: RegisteredUser;
  authToken: string;
  onUserUpdated: (user: RegisteredUser) => void;
  initialView?: 'markets' | 'media' | 'nira' | 'device';
}

export const MarketsMediaSection: React.FC<MarketsMediaSectionProps> = ({
  user,
  authToken,
  onUserUpdated,
  initialView = 'markets',
}) => {
  const [view, setView] = useState<'markets' | 'media' | 'nira' | 'device'>(initialView);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  // Marketplace State
  const [items, setItems] = useState<MarketItem[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Rural Farming Harvest');
  const [price, setPrice] = useState('');
  const [marketChannel, setMarketChannel] = useState('KDF Direct & Kaluta Mall');
  const [description, setDescription] = useState('');
  const [marketMsg, setMarketMsg] = useState<string | null>(null);

  // NIRA & Official ID Record State
  const [nin, setNin] = useState(user.niraDetails?.nin || '');
  const [cardNumber, setCardNumber] = useState(user.niraDetails?.cardNumber || '');
  const [birthDistrict, setBirthDistrict] = useState(
    user.niraDetails?.birthDistrict || user.district || 'Mityana District'
  );
  const [issueStatus, setIssueStatus] = useState(
    user.niraDetails?.issueStatus || 'Registered Citizen / Holder'
  );
  const [niraMsg, setNiraMsg] = useState<string | null>(null);

  // Device Camera, Microphone & Storage State
  const [camActive, setCamActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [storageFiles, setStorageFiles] = useState<Array<{ name: string; size: number }>>([]);
  const [deviceMsg, setDeviceMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetch('/api/marketplace')
      .then((r) => (r.ok ? safeReadJson<{ items?: MarketItem[] }>(r) : { items: [] }))
      .then((d) => setItems(d.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      camStreamRef.current?.getTracks().forEach((t) => t.stop());
      camStreamRef.current = null;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore recorder stop errors on unmount
        }
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleSupplyItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarketMsg(null);
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          price,
          sellerName: user.fullName,
          sellerContact: user.phone || user.email,
          location: `${user.district}, ${user.country}`,
          marketChannel,
          description,
        }),
      });
      const data = await safeReadJson<{ item?: MarketItem }>(res);
      if (!res.ok || !data.item) {
        setMarketMsg(data.error || 'Could not publish marketplace item.');
        return;
      }
      setItems((prev) => [data.item!, ...prev]);
      setTitle('');
      setPrice('');
      setDescription('');
      setMarketMsg('Item listed for supply across KDF & Global Market channels.');
    } catch {
      setMarketMsg('Unable to reach marketplace right now. Please try again.');
    }
  };

  const handleBuyItem = async (itemId: string) => {
    setMarketMsg(null);
    try {
      const res = await fetch(`/api/marketplace/${itemId}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName: user.fullName,
          buyerContact: user.phone || user.email,
          quantity: 1,
        }),
      });
      const data = await safeReadJson<{ item?: MarketItem }>(res);
      if (!res.ok || !data.item) {
        setMarketMsg(data.error || 'Unable to place order right now.');
        return;
      }
      setItems((prev) => prev.map((it) => (it.id === itemId ? data.item! : it)));
      setMarketMsg(`Order placed for "${data.item.title}". Supplier contact shared.`);
    } catch {
      setMarketMsg('Network error while placing order. Please try again.');
    }
  };

  const handleSaveNira = async (e: React.FormEvent) => {
    e.preventDefault();
    setNiraMsg(null);
    try {
      const res = await fetch('/api/auth/nira', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          niraDetails: {
            nin,
            cardNumber,
            birthDistrict,
            issueStatus,
            verifiedSource: 'User-Submitted NIRA Record (Encrypted AES-256-GCM)',
          },
        }),
      });
      const d = await safeReadJson<{ user?: RegisteredUser }>(res);
      if (!res.ok || !d.user) {
        setNiraMsg(d.error || 'Could not save NIRA details. Please sign in again if your session expired.');
        return;
      }
      onUserUpdated(d.user);
      setNiraMsg('NIRA & Identity registration details encrypted and saved to your profile.');
    } catch {
      setNiraMsg('Network error while saving NIRA details.');
    }
  };

  const startCamera = async () => {
    setDeviceMsg(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setDeviceMsg('Camera API is not supported on this browser or insecure context.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      camStreamRef.current = stream;
      setCamActive(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 60);
    } catch {
      setDeviceMsg('Camera permission denied or unavailable on this browser.');
    }
  };

  const stopCamera = () => {
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current = null;
    setCamActive(false);
  };

  const snapAndEncryptPhoto = async () => {
    if (!videoRef.current) return;
    setDeviceMsg(null);
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(b64);
    try {
      const res = await fetch('/api/vault/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmailOrPhone: user.email || user.phone,
          title: `Camera Snapshot ${new Date().toLocaleTimeString()}`,
          classification: 'Private Personal Record',
          notes: 'Captured via KDF Device Camera Studio.',
          fileName: `camera_${Date.now()}.jpg`,
          fileBase64: b64,
        }),
      });
      const data = await safeReadJson(res);
      if (!res.ok) {
        setDeviceMsg(data.error || 'Photo captured locally, but failed to upload to vault.');
        return;
      }
      setDeviceMsg('Photo captured from camera and stored encrypted in KDF Vault.');
    } catch {
      setDeviceMsg('Photo captured locally; could not connect to vault server.');
    }
  };

  const toggleMicRecording = async () => {
    setDeviceMsg(null);
    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setDeviceMsg('Microphone recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        setDeviceMsg('Microphone voice note recorded cleanly.');
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setDeviceMsg('Microphone permission denied or unavailable.');
    }
  };

  const handleStorageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setDeviceMsg(null);
    setStorageFiles(files.map((f) => ({ name: f.name, size: f.size })));
    const reader = new FileReader();
    reader.onerror = () => {
      setDeviceMsg(`Could not read "${files[0].name}" from device storage.`);
    };
    reader.onload = async () => {
      try {
        const res = await fetch('/api/vault/secrets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerEmailOrPhone: user.email || user.phone,
            title: `Phone Storage File: ${files[0].name}`,
            classification: 'Confidential',
            notes: 'Imported from phone/device storage.',
            fileName: files[0].name,
            fileBase64: String(reader.result || ''),
          }),
        });
        const data = await safeReadJson(res);
        if (!res.ok) {
          setDeviceMsg(data.error || 'Could not encrypt file into KDF Vault.');
          return;
        }
        setDeviceMsg(`${files.length} file(s) accessed from phone storage and encrypted.`);
      } catch {
        setDeviceMsg('Unable to reach vault server while encrypting selected file.');
      }
    };
    reader.readAsDataURL(files[0]);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border border-[#E5DFD3] rounded-xl p-4 flex flex-wrap gap-2">
        <button
          onClick={() => setView('markets')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            view === 'markets'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Kaluta, Pi, Pernum, YEM & Global Markets</span>
        </button>

        <button
          onClick={() => setView('media')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            view === 'media'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Free Online TV & Radio</span>
        </button>

        <button
          onClick={() => setView('nira')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            view === 'nira'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          <span>NIRA & Official Identity Sources</span>
        </button>

        <button
          onClick={() => setView('device')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
            view === 'device'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Phone Storage, Camera & Microphone</span>
        </button>
      </div>

      {/* 1. Digital Shopping Mall of Kaluta, Pi Network, Pernum, YEM & Supply/Buy Markets */}
      {view === 'markets' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DIGITAL_COMMERCE_AND_MARKETS.map((mkt) => (
              <article
                key={mkt.name}
                className="bg-white border border-[#E5DFD3] rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <p className="text-xs text-[#78716C]">{mkt.category}</p>
                  <h3 className="mt-1 text-base font-semibold text-[#1C1917]">{mkt.name}</h3>
                  <p className="mt-2 text-xs text-[#44403C] leading-relaxed">{mkt.description}</p>
                </div>
                <a
                  href={mkt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#172C6B] text-white text-xs font-semibold"
                >
                  <span>{mkt.actionLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-semibold text-[#1C1917]">
                Supply Items to Local & Global Markets
              </h3>
              {marketMsg && (
                <p className="text-xs font-medium text-[#14532D] bg-[#14532D]/10 p-2.5 rounded-lg">
                  {marketMsg}
                </p>
              )}
              <form onSubmit={handleSupplyItem} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Item / Harvest Name</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Robusta Coffee Bags / Handwoven Baskets"
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    >
                      <option>Rural Farming Harvest</option>
                      <option>Workshops & Crafts</option>
                      <option>Digital Goods / Services</option>
                      <option>Building & Tools</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Price (UGX / USD / Pi / YEM)</label>
                    <input
                      type="text"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. $20 or UGX 75,000"
                      className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Target Market Channel</label>
                  <select
                    value={marketChannel}
                    onChange={(e) => setMarketChannel(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  >
                    <option>KDF Direct & Kaluta Mall</option>
                    <option>Pi Network & YEM / Pernum Trade</option>
                    <option>Jumia & Jiji East Africa</option>
                    <option>Global Export Wholesale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold"
                >
                  Publish Item for Sale / Supply
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-semibold text-[#1C1917]">
                Buy Items from Community & Global Suppliers
              </h3>
              <div className="divide-y divide-[#F3EFE7]">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-xs text-[#78716C]">
                        {it.category} · {it.marketChannel}
                      </p>
                      <h4 className="text-base font-semibold text-[#1C1917]">{it.title}</h4>
                      <p className="text-sm text-[#44403C]">{it.description}</p>
                      <p className="text-xs font-mono text-[#14532D] font-semibold">
                        {it.price} · Supplier: {it.sellerName} ({it.location}) · {it.ordersCount}{' '}
                        orders
                      </p>
                    </div>
                    <button
                      onClick={() => handleBuyItem(it.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-xs font-semibold shrink-0"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Buy / Order</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Free Online TV & Radio */}
      {view === 'media' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5DFD3] rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#1C1917]">
              Free Online World TV & Live Radio
            </h2>
            <p className="mt-1 text-sm text-[#57534E]">
              Listen directly to live international radio streams below or launch free 24/7 public
              TV broadcasts for Uganda, Africa, and world news.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FREE_TV_AND_RADIO.map((media) => (
              <div
                key={media.id}
                className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#78716C] font-medium">
                      {media.type} · {media.region}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-[#1C1917]">{media.name}</h3>
                  </div>
                  {media.type === 'TV' ? (
                    <Tv className="w-5 h-5 text-[#1E3A8A] shrink-0" />
                  ) : (
                    <Radio className="w-5 h-5 text-[#14532D] shrink-0" />
                  )}
                </div>
                <p className="text-sm text-[#44403C]">{media.description}</p>
                {media.streamUrl && (
                  <audio controls preload="none" className="w-full h-10">
                    <source src={media.streamUrl} type="audio/mpeg" />
                  </audio>
                )}
                <a
                  href={media.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-xs font-semibold"
                >
                  <span>Watch / Listen Live</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. NIRA & Official Identity Sources */}
      {view === 'nira' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-[#1C1917]">
              Encrypted NIRA & Registration Record
            </h2>
            <p className="text-xs text-[#57534E]">
              Store and access your personal NIRA National Identification Number (NIN), Card
              Number, and civil registration details securely encrypted inside your KDF account.
            </p>
            {niraMsg && (
              <p className="text-xs font-medium text-[#14532D] bg-[#14532D]/10 p-2.5 rounded-lg">
                {niraMsg}
              </p>
            )}
            <form onSubmit={handleSaveNira} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">NIRA NIN (14-Character ID)</label>
                <input
                  type="text"
                  value={nin}
                  onChange={(e) => setNin(e.target.value)}
                  placeholder="e.g. CM90000100000X"
                  className="w-full px-3 py-2 text-sm font-mono bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Card Number / Passport Ref</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">District of Registration</label>
                <input
                  type="text"
                  value={birthDistrict}
                  onChange={(e) => setBirthDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Registration Status</label>
                <input
                  type="text"
                  value={issueStatus}
                  onChange={(e) => setIssueStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold"
              >
                Save Encrypted NIRA Details
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {NIRA_OFFICIAL_SOURCES.map((src) => (
              <div
                key={src.name}
                className="bg-white border border-[#E5DFD3] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="text-xs text-[#78716C]">{src.category}</p>
                  <h3 className="text-base font-semibold text-[#1C1917]">{src.name}</h3>
                  <p className="mt-1 text-xs text-[#44403C]">{src.description}</p>
                </div>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-xs font-semibold shrink-0"
                >
                  <span>{src.actionLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Phone Storage, Camera & Microphone Access Studio */}
      {view === 'device' && (
        <div className="space-y-6">
          {deviceMsg && (
            <div className="p-3 rounded-lg bg-[#14532D]/10 border border-[#14532D]/25 text-sm text-[#14532D] font-medium">
              {deviceMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Camera */}
            <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-[#1C1917]">
                <Camera className="w-5 h-5 text-[#14532D]" />
                <h3>Camera Access</h3>
              </div>
              <p className="text-xs text-[#57534E]">
                Capture beneficiary, ID, or field construction photos directly and encrypt them.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={camActive ? stopCamera : startCamera}
                  className="px-4 py-2 rounded-lg bg-[#14532D] text-white text-xs font-semibold"
                >
                  {camActive ? 'Stop Camera' : 'Open Camera'}
                </button>
                {camActive && (
                  <button
                    onClick={snapAndEncryptPhoto}
                    className="px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-xs font-semibold"
                  >
                    Capture & Encrypt
                  </button>
                )}
              </div>
              {camActive && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg bg-black max-h-48 object-cover"
                />
              )}
              {capturedPhoto && (
                <img
                  src={capturedPhoto}
                  alt="Captured snapshot"
                  className="w-full rounded-lg border border-[#E5DFD3]"
                />
              )}
            </div>

            {/* Microphone */}
            <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-[#1C1917]">
                <Mic className="w-5 h-5 text-[#14532D]" />
                <h3>Microphone Recorder</h3>
              </div>
              <p className="text-xs text-[#57534E]">
                Record community testimonies, medical notes, or voice dispatches directly from your
                microphone.
              </p>
              <button
                onClick={toggleMicRecording}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white ${
                  recording ? 'bg-red-700' : 'bg-[#14532D]'
                }`}
              >
                {recording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{recording ? 'Stop Recording' : 'Start Voice Recording'}</span>
              </button>
              {audioUrl && <audio controls src={audioUrl} className="w-full" />}
            </div>

            {/* Phone Storage */}
            <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-[#1C1917]">
                <HardDriveUpload className="w-5 h-5 text-[#14532D]" />
                <h3>Phone Storage Access</h3>
              </div>
              <p className="text-xs text-[#57534E]">
                Browse phone storage to encrypt and store documents, photos, or certifications.
              </p>
              <input
                type="file"
                multiple
                onChange={handleStorageSelect}
                className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#14532D] file:text-white file:font-semibold"
              />
              {storageFiles.length > 0 && (
                <ul className="text-xs space-y-1 text-[#292524] font-mono">
                  {storageFiles.map((f, idx) => (
                    <li key={idx}>
                      {f.name} ({Math.round(f.size / 1024)} KB)
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
