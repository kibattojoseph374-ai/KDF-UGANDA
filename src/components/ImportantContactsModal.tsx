import React, { useState } from 'react';
import { Phone, MessageCircle, X, ShieldAlert } from 'lucide-react';
import { IMPORTANT_HEALTH_SECURITY_CONTACTS } from '../data/kdfData';

interface ImportantContactsModalProps {
  open: boolean;
  onClose: () => void;
}

export const ImportantContactsModal: React.FC<ImportantContactsModalProps> = ({ open, onClose }) => {
  const [filter, setFilter] = useState<string>('All');
  if (!open) return null;

  const categories = [
    'All',
    'Health & Medical',
    'Security & Police',
    'Legal & Protection',
    'Headquarters & Advisory',
  ];

  const items =
    filter === 'All'
      ? IMPORTANT_HEALTH_SECURITY_CONTACTS
      : IMPORTANT_HEALTH_SECURITY_CONTACTS.filter((c) => c.category === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-3xl max-h-[88vh] bg-white border border-[#E5DFD3] rounded-xl flex flex-col overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-[#E5DFD3] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#14532D]" />
            <div>
              <h2 className="text-xl font-semibold text-[#1C1917]">
                Important Health, Medical, Security & Service Contacts
              </h2>
              <p className="text-xs text-[#57534E]">
                Direct 24/7 emergency police, medical, legal, and KDF Uganda headquarters contacts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close important contacts"
            className="p-2 rounded-lg border border-[#D6CEBE] hover:bg-[#F3EFE7]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-[#F3EFE7] flex flex-wrap gap-1.5 bg-[#FBF9F5]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                filter === cat
                  ? 'bg-[#14532D] text-white'
                  : 'bg-white border border-[#E5DFD3] text-[#44403C] hover:bg-[#F3EFE7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 divide-y divide-[#F3EFE7]">
          {items.map((item) => (
            <div
              key={item.id}
              className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-xs text-[#78716C] font-medium">
                  {item.category} · {item.location}
                </p>
                <h3 className="text-base font-semibold text-[#1C1917]">
                  {item.title} — {item.personOrUnit}
                </h3>
                <p className="text-xs text-[#44403C]">{item.notes}</p>
                <p className="text-sm font-mono tabular-nums font-semibold text-[#14532D]">
                  {item.phone}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`tel:${item.phone}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D6CEBE] text-xs font-semibold hover:bg-[#F3EFE7]"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
                {item.phone.length > 5 && (
                  <a
                    href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#14532D] text-white text-xs font-semibold hover:bg-[#114224]"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
