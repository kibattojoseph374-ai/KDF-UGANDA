import { useEffect, useState } from 'react';
import { Download, LogOut, Menu, X } from 'lucide-react';
import { KDF_ORG } from './data/kdfData';
import { useOnlineStatus, usePWAInstall } from './hooks/usePWAInstall';
import {
  clearEncryptedSession,
  loadEncryptedSession,
  saveEncryptedSession,
} from './utils/cryptoVault';
import { safeReadJson } from './utils/http';
import { RegistrationGate, type RegisteredUser } from './components/RegistrationGate';
import { OverviewSection } from './components/OverviewSection';
import { ServicesApplicationsSection } from './components/ServicesApplicationsSection';
import { OperationsCommsSection } from './components/OperationsCommsSection';
import { GlobalPortalsSection } from './components/GlobalPortalsSection';
import { AiAgentsSection } from './components/AiAgentsSection';
import { MarketsMediaSection } from './components/MarketsMediaSection';
import { ImportantContactsModal } from './components/ImportantContactsModal';

type MainTab = 'overview' | 'services' | 'markets' | 'operations' | 'portals' | 'ai';

const SESSION_STORAGE_KEY = 'kdf_uganda_session_v1';

export default function App() {
  const [user, setUser] = useState<RegisteredUser | null>(null);
  const [token, setToken] = useState<string>('');
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [operationsSubTab, setOperationsSubTab] = useState<
    'news' | 'tracking' | 'phone' | 'intelligence' | 'contacts'
  >('news');
  const [portalsCategory, setPortalsCategory] = useState<
    'un' | 'meetings' | 'vault' | 'universities' | 'legal' | 'telecom' | 'friends'
  >('un');
  const [marketsView, setMarketsView] = useState<'markets' | 'media' | 'nira' | 'device'>('markets');
  const [preselectedService, setPreselectedService] = useState('');
  const [preselectedBeneficiary, setPreselectedBeneficiary] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showImportantContacts, setShowImportantContacts] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    let active = true;
    (async () => {
      const saved = await loadEncryptedSession<{ user: RegisteredUser; token: string }>(
        SESSION_STORAGE_KEY
      );
      if (!active) return;
      if (saved?.token && saved?.user) {
        if (typeof navigator === 'undefined' || navigator.onLine) {
          try {
            const res = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${saved.token}` },
            });
            if (!active) return;
            if (res.status === 401) {
              clearEncryptedSession(SESSION_STORAGE_KEY);
              setInitializing(false);
              return;
            }
            if (res.ok) {
              const data = await safeReadJson<{ user?: RegisteredUser }>(res);
              const freshUser = data.user || saved.user;
              setUser(freshUser);
              setToken(saved.token);
              await saveEncryptedSession(SESSION_STORAGE_KEY, {
                user: freshUser,
                token: saved.token,
              });
              setInitializing(false);
              return;
            }
          } catch {
            // Network unavailable: retain cached offline encrypted session
          }
        }
        setUser(saved.user);
        setToken(saved.token);
      }
      if (active) setInitializing(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleRegistered = async (newUser: RegisteredUser, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    await saveEncryptedSession(SESSION_STORAGE_KEY, { user: newUser, token: newToken });
  };

  const handleUserUpdated = async (updated: RegisteredUser) => {
    setUser(updated);
    await saveEncryptedSession(SESSION_STORAGE_KEY, { user: updated, token });
  };

  const handleSignOut = () => {
    clearEncryptedSession(SESSION_STORAGE_KEY);
    setUser(null);
    setToken('');
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'manual') setShowInstallModal(true);
    } else {
      setShowInstallModal(true);
    }
  };

  const handleShareApp = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: KDF_ORG.name,
      text: `${KDF_ORG.name} (${KDF_ORG.shortName}) — Humanitarian support, applicant registration, medical & education services in Uganda & Africa.`,
      url: shareUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareMessage('App link shared successfully.');
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage('KDF Uganda app link copied to clipboard for sharing.');
    } catch {
      setShareMessage(`Share URL: ${shareUrl}`);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center text-sm text-[#57534E]">
        Loading KDF Uganda Encrypted Portal...
      </div>
    );
  }

  if (!user) {
    return <RegistrationGate onRegistered={handleRegistered} />;
  }

  const navItems: Array<{ id: MainTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: 'Services & Apply' },
    { id: 'markets', label: 'Markets & TV' },
    { id: 'operations', label: 'Operations' },
    { id: 'portals', label: 'Global Portals' },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] flex flex-col">
      {/* Three-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-sm border-b border-[#E5DFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            onClick={() => setActiveTab('overview')}
            className="text-lg font-display font-bold tracking-tight text-[#14532D] whitespace-nowrap shrink-0 text-left"
          >
            KDF Uganda
          </button>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#57534E]">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
                  activeTab === item.id
                    ? 'text-[#14532D] font-semibold border-b-2 border-[#14532D]'
                    : 'hover:text-[#1C1917]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {!isInstalled ? (
              <button
                onClick={handleInstallClick}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('ai')}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>AI Desk</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-lg border border-[#D6CEBE] text-[#1C1917]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5DFD3] bg-white px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  activeTab === item.id
                    ? 'bg-[#14532D] text-white'
                    : 'text-[#1C1917] hover:bg-[#F3EFE7]'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                setActiveTab('ai');
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'ai'
                  ? 'bg-[#14532D] text-white'
                  : 'text-[#1C1917] hover:bg-[#F3EFE7]'
              }`}
            >
              AI Chat & Studio
            </button>
            <button
              onClick={() => {
                setShowImportantContacts(true);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg bg-red-50 text-sm font-semibold text-red-800"
            >
              Important Health & Security Contacts
            </button>
            {!isInstalled && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleInstallClick();
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-[#F3EFE7] text-sm font-semibold text-[#14532D]"
              >
                Install KDF Uganda App
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === 'overview' && (
          <OverviewSection
            onNavigate={(tab) => setActiveTab(tab as MainTab)}
            onOpenPhoneTracking={() => {
              setOperationsSubTab('phone');
              setActiveTab('operations');
            }}
            onOpenDatingMarriage={() => {
              setPortalsCategory('friends');
              setActiveTab('portals');
            }}
            onOpenMeetings={() => {
              setPortalsCategory('meetings');
              setActiveTab('portals');
            }}
            onOpenPrivateVault={() => {
              setPortalsCategory('vault');
              setActiveTab('portals');
            }}
            onOpenImportantContacts={() => setShowImportantContacts(true)}
            onOpenMarketsView={(view) => {
              setMarketsView(view);
              setActiveTab('markets');
            }}
            onOpenBeneficiaryRegistration={() => {
              setPreselectedBeneficiary('Orphans & Vulnerable Children (OVC)');
              setActiveTab('services');
            }}
            onSelectServiceForApplication={(svc) => setPreselectedService(svc)}
            onInstallApp={handleInstallClick}
            onShareApp={handleShareApp}
            shareMessage={shareMessage}
          />
        )}

        {activeTab === 'services' && (
          <ServicesApplicationsSection
            preselectedService={preselectedService}
            preselectedBeneficiary={preselectedBeneficiary}
            currentUserName={user.fullName}
            currentUserContact={user.phone || user.email}
          />
        )}

        {activeTab === 'markets' && (
          <MarketsMediaSection
            user={user}
            authToken={token}
            onUserUpdated={handleUserUpdated}
            initialView={marketsView}
          />
        )}

        {activeTab === 'operations' && (
          <OperationsCommsSection
            user={user}
            authToken={token}
            onUserUpdated={handleUserUpdated}
            onShareApp={handleShareApp}
            initialSubTab={operationsSubTab}
          />
        )}

        {activeTab === 'portals' && (
          <GlobalPortalsSection
            initialCategory={portalsCategory}
            currentUserName={user.fullName}
            currentUserLocation={`${user.district || 'Mityana'}, ${user.country || 'Uganda'}`}
            authToken={token}
          />
        )}

        {activeTab === 'ai' && <AiAgentsSection />}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="border-t border-[#E5DFD3] bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#57534E]">
          <div className="space-y-1">
            <p className="font-semibold text-[#1C1917]">
              {KDF_ORG.name} ({KDF_ORG.shortName})
            </p>
            <p>
              {KDF_ORG.poBox} · Line: {KDF_ORG.officeLine} · {KDF_ORG.email}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Registered Member: <strong className="text-[#1C1917]">{user.fullName}</strong> (
              {user.role})
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 text-[#78350F] hover:underline font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Offline PWA Banner */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 rounded-lg bg-[#78350F] px-3.5 py-2 text-xs font-medium text-white shadow-lg">
          Offline Mode — Cached KDF Uganda data is active.
        </div>
      )}

      {/* Install App Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
            <h3 className="text-xl font-semibold text-[#1C1917]">
              Install KDF Uganda Application
            </h3>
            {isIOS ? (
              <p className="text-sm text-[#44403C] leading-relaxed">
                1. Tap the <strong>Share</strong> button in your Safari browser toolbar.
                <br />
                2. Scroll down and select <strong>Add to Home Screen</strong>.
              </p>
            ) : (
              <p className="text-sm text-[#44403C] leading-relaxed">
                Use your browser’s <strong>Install App</strong> or{' '}
                <strong>Add to Home Screen</strong> menu option to install KDF Uganda as a
                standalone offline-ready application on Android, iOS, or Desktop.
              </p>
            )}
            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2.5 rounded-lg bg-[#14532D] text-white text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Important Health, Medical & Security Contacts Modal */}
      <ImportantContactsModal
        open={showImportantContacts}
        onClose={() => setShowImportantContacts(false)}
      />
    </div>
  );
}
