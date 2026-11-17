import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  Share2,
  Download,
  Mail,
  MapPin,
  Search,
  ArrowRight,
  Building2,
  PhoneCall,
  Heart,
  HelpCircle,
  Video,
  Lock,
  ShieldAlert,
  ShoppingBag,
  Tv,
  BadgeCheck,
  Camera,
  Bot,
  UserPlus,
} from 'lucide-react';
import { KDF_LEADERSHIP, KDF_ORG, KDF_SERVICES } from '../data/kdfData';
import { FAQSection } from './FAQSection';
import { DashboardWidget } from './DashboardWidget';

interface OverviewSectionProps {
  onNavigate: (tab: string) => void;
  onOpenPhoneTracking: () => void;
  onOpenDatingMarriage: () => void;
  onOpenMeetings: () => void;
  onOpenPrivateVault: () => void;
  onOpenImportantContacts: () => void;
  onOpenMarketsView: (view: 'markets' | 'media' | 'nira' | 'device') => void;
  onOpenBeneficiaryRegistration: () => void;
  onSelectServiceForApplication: (serviceTitle: string) => void;
  onInstallApp: () => void;
  onShareApp: () => void;
  shareMessage: string | null;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  onNavigate,
  onOpenPhoneTracking,
  onOpenDatingMarriage,
  onOpenMeetings,
  onOpenPrivateVault,
  onOpenImportantContacts,
  onOpenMarketsView,
  onOpenBeneficiaryRegistration,
  onSelectServiceForApplication,
  onInstallApp,
  onShareApp,
  shareMessage,
}) => {
  const [directoryFilter, setDirectoryFilter] = useState('');

  const filteredLeaders = KDF_LEADERSHIP.filter(
    (m) =>
      m.name.toLowerCase().includes(directoryFilter.toLowerCase()) ||
      m.role.toLowerCase().includes(directoryFilter.toLowerCase()) ||
      m.department.toLowerCase().includes(directoryFilter.toLowerCase())
  );

  const cleanWa = (phone?: string) => (phone ? phone.replace(/[^0-9]/g, '') : '256789509103');

  return (
    <div className="space-y-14">
      {/* Institutional Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white border border-[#E5DFD3] rounded-xl p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E] font-medium">
              <span>{KDF_ORG.shortName}</span>
              <span aria-hidden="true">·</span>
              <span>{KDF_ORG.jurisdiction}</span>
              <span aria-hidden="true">·</span>
              <span>Mityana District, Uganda</span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1C1917] leading-tight">
              Kibatto Development Foundation Limited
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#44403C] leading-relaxed max-w-2xl">
              Dedicated humanitarian and community development service across Africa — uplifting{' '}
              <strong className="font-semibold text-[#1C1917]">
                orphans, persons with disabilities, the elderly, OVC, widows, the girl child and
                women, and street children
              </strong>{' '}
              through education, medical care, safe buildings, HIV/AIDS awareness, rehabilitation
              centers, community funding, and rural agricultural markets.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('services')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>Apply for KDF Service</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenBeneficiaryRegistration}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E3A8A] hover:bg-[#172C6B] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Orphans, Elderly & Disabled</span>
              </button>

              <button
                onClick={onOpenImportantContacts}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-700 text-red-800 hover:bg-red-50 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Important Health, Medical & Security Contacts</span>
              </button>

              <button
                onClick={() => onOpenMarketsView('markets')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Kaluta Mall, Pi, Pernum, YEM & Markets</span>
              </button>

              <button
                onClick={() => onOpenMarketsView('media')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A]/5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <Tv className="w-4 h-4" />
                <span>Free Online TV & Radio</span>
              </button>

              <button
                onClick={() => onOpenMarketsView('nira')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D6CEBE] text-[#1C1917] hover:bg-[#F3EFE7] text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <BadgeCheck className="w-4 h-4" />
                <span>NIRA & Identity Sources</span>
              </button>

              <button
                onClick={() => onOpenMarketsView('device')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D6CEBE] text-[#1C1917] hover:bg-[#F3EFE7] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Camera className="w-4 h-4" />
                <span>Camera, Mic & Phone Storage</span>
              </button>

              <button
                onClick={() => onNavigate('ai')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <Bot className="w-4 h-4" />
                <span>AI Chat & Studio</span>
              </button>

              <button
                onClick={onOpenPrivateVault}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D6CEBE] text-[#1C1917] hover:bg-[#F3EFE7] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Lock className="w-4 h-4" />
                <span>Family & Passkey Vault</span>
              </button>

              <button
                onClick={onOpenDatingMarriage}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#78350F] text-[#78350F] hover:bg-[#78350F]/5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <Heart className="w-4 h-4" />
                <span>Tinder, Dating & Marriage</span>
              </button>

              <button
                onClick={onOpenPhoneTracking}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A]/5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Phone Number Tracking</span>
              </button>

              <button
                onClick={onOpenMeetings}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <Video className="w-4 h-4" />
                <span>Free Global Meetings</span>
              </button>

              <a
                href={`https://wa.me/${cleanWa(KDF_ORG.officeLine)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Chat & Calls</span>
              </a>

              <a
                href={`tel:${KDF_ORG.officeLine.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D6CEBE] text-[#1C1917] hover:bg-[#F3EFE7] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Phone className="w-4 h-4" />
                <span>Call Office</span>
              </a>

              <button
                onClick={onShareApp}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D6CEBE] text-[#1C1917] hover:bg-[#F3EFE7] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Share2 className="w-4 h-4" />
                <span>Share App</span>
              </button>

              <button
                onClick={onInstallApp}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D6CEBE] text-[#1C1917] hover:bg-[#F3EFE7] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Install App</span>
              </button>

              <a
                href="#kdf-faq"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D6CEBE] text-[#1C1917] hover:bg-[#F3EFE7] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Humanitarian FAQ</span>
              </a>
            </div>

            {shareMessage && (
              <p className="text-xs font-medium text-[#14532D]">{shareMessage}</p>
            )}
          </div>
        </div>

        {/* Hero Visual */}
        <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-[#E5DFD3] min-h-[280px] bg-[#14532D]">
          <img
            src="/assets/aistudio/images_b5dd9d59.jpg"
            alt="Hope and community upliftment banner for KDF Uganda"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover lg:h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
            <p className="text-xs uppercase tracking-widest text-[#E6D4A8]">Headquarters</p>
            <p className="mt-1 text-lg font-display font-semibold">{KDF_ORG.poBox}</p>
            <p className="mt-1 text-xs text-stone-200 font-mono tabular-nums">
              Line: {KDF_ORG.officeLine} · {KDF_ORG.email}
            </p>
          </div>
        </div>
      </section>

      {/* Official Contact Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5DFD3] rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs text-[#78716C] font-medium">
            <Phone className="w-4 h-4 text-[#14532D]" />
            <span>Official Office Line</span>
          </div>
          <p className="mt-2 text-base font-semibold font-mono tabular-nums text-[#1C1917]">
            {KDF_ORG.officeLine}
          </p>
        </div>
        <div className="bg-white border border-[#E5DFD3] rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs text-[#78716C] font-medium">
            <MapPin className="w-4 h-4 text-[#14532D]" />
            <span>Postal & Physical Address</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-[#1C1917]">{KDF_ORG.poBox}</p>
        </div>
        <div className="bg-white border border-[#E5DFD3] rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs text-[#78716C] font-medium">
            <Mail className="w-4 h-4 text-[#14532D]" />
            <span>Official Email</span>
          </div>
          <a
            href={`mailto:${KDF_ORG.email}`}
            className="mt-2 block text-sm font-semibold text-[#1E3A8A] hover:underline truncate"
          >
            {KDF_ORG.email}
          </a>
        </div>
        <div className="bg-white border border-[#E5DFD3] rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs text-[#78716C] font-medium">
            <Building2 className="w-4 h-4 text-[#14532D]" />
            <span>Operational Scope</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-[#1C1917]">
            Uganda & Pan-African Operations
          </p>
        </div>
      </section>

      {/* Live Humanitarian Projects Status Tracker */}
      <DashboardWidget />

      {/* Mission & 7 Mandate Pillars */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5DFD3] pb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#78716C]">Mission & Mandate</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-semibold text-[#1C1917]">
              Seven Core Humanitarian Pillars
            </h2>
          </div>
          <p className="text-sm text-[#57534E] max-w-md">
            Serving {KDF_ORG.beneficiaries.join(', ')}. Select any pillar to register an applicant or
            explore support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {KDF_SERVICES.map((service) => (
            <article
              key={service.id}
              className="bg-white border border-[#E5DFD3] rounded-xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                {service.image && (
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#F3EFE7] border-b border-[#E5DFD3]">
                    <img
                      src={service.image}
                      alt={service.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="text-xs text-[#78716C] font-medium">
                    <span>Pillar {service.number}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{service.targetGroups.slice(0, 2).join(', ')}</span>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-[#1C1917]">{service.title}</h3>
                  <p className="mt-2.5 text-sm text-[#44403C] leading-relaxed">
                    {service.detailedMandate}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-[#F3EFE7]">
                <span className="text-xs text-[#78716C] truncate max-w-[160px]">
                  {service.targetGroups.join(' · ')}
                </span>
                <button
                  onClick={() => {
                    onSelectServiceForApplication(service.title);
                    onNavigate('services');
                  }}
                  className="text-xs font-semibold text-[#14532D] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Complete 14-Member Leadership & Specialist Directory */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5DFD3] pb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#78716C]">Governance & Team</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-semibold text-[#1C1917]">
              KDF Uganda Directors & Specialists
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
            <input
              type="text"
              value={directoryFilter}
              onChange={(e) => setDirectoryFilter(e.target.value)}
              placeholder="Search director, role, department..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D6CEBE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeaders.map((person) => (
            <div
              key={person.id}
              className="bg-white border border-[#E5DFD3] rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <p className="text-xs text-[#78716C] font-medium">
                  {person.role} · {person.department}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[#1C1917]">{person.name}</h3>
                <p className="mt-1 text-xs text-[#57534E]">{person.region}</p>
                {person.phone ? (
                  <p className="mt-2 text-sm font-mono tabular-nums text-[#14532D] font-medium">
                    {person.phone}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-[#78716C]">
                    Via Office Line {KDF_ORG.officeLine}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-[#F3EFE7]">
                <a
                  href={`tel:${(person.phone || KDF_ORG.officeLine).replace(/\s+/g, '')}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#D6CEBE] text-xs font-semibold text-[#1C1917] hover:bg-[#F3EFE7] transition-colors whitespace-nowrap"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
                <a
                  href={`https://wa.me/${cleanWa(person.phone || KDF_ORG.officeLine)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#14532D] text-white text-xs font-semibold hover:bg-[#114224] transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Gemini-Powered FAQSection */}
      <FAQSection />
    </div>
  );
};
