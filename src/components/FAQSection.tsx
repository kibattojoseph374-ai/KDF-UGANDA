import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, RefreshCw, Send } from 'lucide-react';
import { KDF_FAQ_QUESTIONS, type FaqPromptItem } from '../data/kdfData';
import { safeReadJson } from '../utils/http';

interface GeneratedAnswer {
  answer: string;
  generatedAt: string;
}

export const FAQSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, GeneratedAnswer>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Custom question state
  const [customQuestion, setCustomQuestion] = useState('');
  const [customItems, setCustomItems] = useState<FaqPromptItem[]>([]);

  const allQuestions = [...customItems, ...KDF_FAQ_QUESTIONS];
  const categories = [
    'All',
    'Humanitarian Services',
    'Programs & Outreach',
    'Registration & Verification',
    'Donors & Partnerships',
  ];

  const visibleQuestions =
    activeCategory === 'All'
      ? allQuestions
      : allQuestions.filter((q) => q.category === activeCategory);

  const fetchAnswer = async (item: FaqPromptItem, forceRefresh = false) => {
    if (!forceRefresh && answers[item.id]) return;
    setLoadingId(item.id);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[item.id];
      return copy;
    });

    try {
      const res = await fetch('/api/faq/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: item.question,
          category: item.category,
        }),
      });
      const data = await safeReadJson<{ answer?: string; generatedAt?: string }>(res);
      if (!res.ok) {
        throw new Error(data.error || 'Could not generate FAQ answer.');
      }
      setAnswers((prev) => ({
        ...prev,
        [item.id]: {
          answer: data.answer || 'No answer could be generated.',
          generatedAt: data.generatedAt || new Date().toISOString(),
        },
      }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [item.id]:
          err instanceof Error ? err.message : 'Unable to generate Gemini FAQ answer.',
      }));
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggle = (item: FaqPromptItem) => {
    if (openId === item.id) {
      setOpenId(null);
      return;
    }
    setOpenId(item.id);
    fetchAnswer(item);
  };

  const handleAskCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customQuestion.trim();
    if (!trimmed) return;
    const newItem: FaqPromptItem = {
      id: `custom-${Date.now()}`,
      category: 'Humanitarian Services',
      question: trimmed,
    };
    setCustomItems((prev) => [newItem, ...prev]);
    setCustomQuestion('');
    setActiveCategory('All');
    setOpenId(newItem.id);
    await fetchAnswer(newItem, true);
  };

  return (
    <section id="kdf-faq" className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E5DFD3] pb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#78716C]">
            Dynamic AI Knowledge Desk
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-semibold text-[#1C1917]">
            Frequently Asked Questions
          </h2>
          <p className="mt-1 text-sm text-[#57534E] max-w-2xl">
            Select any question below or ask your own to dynamically generate an up-to-date Gemini
            answer about KDF Uganda’s humanitarian services, programs, and registration process.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeCategory === cat
                  ? 'bg-[#14532D] text-white'
                  : 'bg-[#F3EFE7] text-[#44403C] hover:bg-[#E5DFD3]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ask Any Custom FAQ Question */}
      <form
        onSubmit={handleAskCustom}
        className="bg-white border border-[#E5DFD3] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <HelpCircle className="w-4 h-4 text-[#78716C] absolute left-3.5 top-3" />
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Ask a question about KDF services, scholarships, medical aid, or registration..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]/30"
          />
        </div>
        <button
          type="submit"
          disabled={!customQuestion.trim() || loadingId !== null}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>Generate Answer</span>
        </button>
      </form>

      {/* Accordion List */}
      <div className="bg-white border border-[#E5DFD3] rounded-xl divide-y divide-[#E5DFD3]">
        {visibleQuestions.map((item) => {
          const isOpen = openId === item.id;
          const isLoading = loadingId === item.id;
          const answerObj = answers[item.id];
          const err = errors[item.id];

          return (
            <div key={item.id} className="p-5 sm:p-6">
              <button
                onClick={() => handleToggle(item)}
                className="w-full flex items-start justify-between gap-4 text-left"
              >
                <div className="space-y-1">
                  <p className="text-xs text-[#78716C] font-medium">{item.category}</p>
                  <h3 className="text-base sm:text-lg font-semibold text-[#1C1917]">
                    {item.question}
                  </h3>
                </div>
                <span className="p-1.5 rounded-lg bg-[#F3EFE7] text-[#1C1917] shrink-0 mt-0.5">
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>

              {isOpen && (
                <div className="mt-4 pt-4 border-t border-[#F3EFE7] space-y-3">
                  {isLoading && (
                    <p className="text-sm text-[#57534E]">
                      Generating dynamic Gemini answer for KDF Uganda...
                    </p>
                  )}

                  {err && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex flex-wrap items-center justify-between gap-2">
                      <span>{err}</span>
                      <button
                        type="button"
                        onClick={() => fetchAnswer(item, true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-red-200 text-xs font-semibold text-red-800 hover:bg-red-100"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Try Again</span>
                      </button>
                    </div>
                  )}

                  {answerObj && !isLoading && (
                    <div className="space-y-3">
                      <p className="text-sm sm:text-base text-[#292524] leading-relaxed whitespace-pre-wrap">
                        {answerObj.answer}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#78716C]">
                        <span>
                          Generated via Gemini ·{' '}
                          {new Date(answerObj.generatedAt).toLocaleTimeString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => fetchAnswer(item, true)}
                          className="inline-flex items-center gap-1 font-semibold text-[#14532D] hover:underline"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Refresh Answer</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
