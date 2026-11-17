import React, { useState } from 'react';
import { Bot, Send, Globe, ExternalLink, Sparkles, Languages, FileText, Image as ImageIcon } from 'lucide-react';
import { safeReadJson } from '../utils/http';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: Array<{ uri: string; title?: string }>;
}

const AGENTS = [
  {
    id: 'general',
    name: 'KDF Chief Customer Service Agent',
    desk: 'Director Kibatto Joseph & CED Nakyejwe Sherina Desk',
    greeting:
      'Welcome to Kibatto Development Foundation Limited (KDF Uganda). How can I assist you with our programs, headquarters in Mityana District, or donor partnerships today?',
  },
  {
    id: 'medical',
    name: 'Health & HIV/AIDS Outreach Agent',
    desk: 'Medical Director Mugabirwe Jackline & Specialist Akankunda Violah',
    greeting:
      'Hello! I support KDF Uganda’s Health, Medical, and HIV/AIDS rural/urban education programs. What health support or clinic guidance do you need?',
  },
  {
    id: 'hr',
    name: 'HR, Applicants & M&E Agent',
    desk: 'HR Bunjo Robert Son, M&E Nakkazi Josemine & Secretary Namwanje Proscovia',
    greeting:
      'Welcome to the Applicant, Verification & HR Desk. Ask me about registering for services, document requirements, verification checks, or KDF job opportunities.',
  },
  {
    id: 'legal',
    name: 'Legal & Child Protection Agent',
    desk: 'Legal Advisor Namutebi Vanessa & Chief Advisor Namayanja Oivia',
    greeting:
      'Welcome to the Legal Protection Desk. I can guide widows, orphans, the girl child, and community members to free legal aid, police safety lines, and UN protection portals.',
  },
  {
    id: 'agriculture',
    name: 'Farming, Education & ICT Agent',
    desk: 'Regional Directors Namutebi Josephine, Nansubuga Joseline & ICT Nabunjo Vivian',
    greeting:
      'Hello! Ask me about rural farming techniques, harvest market access, school bursaries, vocational workshops, or free university courses on Alison and UNDSS.',
  },
];

export const AiAgentsSection: React.FC = () => {
  const [workspaceMode, setWorkspaceMode] = useState<'chat' | 'studio'>('chat');

  // Chat state
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: AGENTS[0].greeting },
  ]);
  const [input, setInput] = useState('');
  const [useSearch, setUseSearch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Multimodal & Translation Studio state
  const [studioTool, setStudioTool] = useState<'analyze-image' | 'translate' | 'draft-letter'>('analyze-image');
  const [studioText, setStudioText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Luganda');
  const [studioImage, setStudioImage] = useState<string | null>(null);
  const [studioImageName, setStudioImageName] = useState('');
  const [studioResult, setStudioResult] = useState('');
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioError, setStudioError] = useState<string | null>(null);

  const handleSelectAgent = (agent: typeof AGENTS[number]) => {
    setSelectedAgent(agent);
    setMessages([{ role: 'model', text: agent.greeting }]);
    setError(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const nextHistory = [...messages, { role: 'user' as const, text: userText }];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          agentRole: selectedAgent.id,
          history: messages,
          useSearch,
        }),
      });
      const data = await safeReadJson<{ reply?: string; sources?: Array<{ uri: string; title?: string }> }>(res);
      if (!res.ok) throw new Error(data.error || 'AI request failed');
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: data.reply || 'No reply received.', sources: data.sources || [] },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach AI Customer Service.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudioImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStudioError(null);
    setStudioImageName(file.name);
    const reader = new FileReader();
    reader.onerror = () => {
      setStudioError(`Could not read "${file.name}". Please choose another image.`);
    };
    reader.onload = () => setStudioImage(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleRunStudioTool = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudioError(null);
    setStudioResult('');
    if (studioTool === 'analyze-image' && !studioImage) {
      setStudioError('Please select a photo or document image to analyze.');
      return;
    }
    if (studioTool !== 'analyze-image' && !studioText.trim()) {
      setStudioError('Please enter text or instructions for the AI assistant.');
      return;
    }
    setStudioLoading(true);
    try {
      const res = await fetch('/api/ai/assistant-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: studioTool,
          text: studioText.trim(),
          targetLanguage,
          imageBase64: studioTool === 'analyze-image' ? studioImage : undefined,
        }),
      });
      const data = await safeReadJson<{ result?: string }>(res);
      if (!res.ok) throw new Error(data.error || 'AI studio request failed');
      setStudioResult(data.result || '');
    } catch (err) {
      setStudioError(err instanceof Error ? err.message : 'AI studio request failed.');
    } finally {
      setStudioLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E5DFD3] rounded-xl p-4 flex flex-wrap gap-2">
        <button
          onClick={() => setWorkspaceMode('chat')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
            workspaceMode === 'chat'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Customer Service Agents</span>
        </button>

        <button
          onClick={() => setWorkspaceMode('studio')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
            workspaceMode === 'studio'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Photo Analyzer, Translator & Letter Studio</span>
        </button>
      </div>

      {workspaceMode === 'chat' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Agent Selector */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white border border-[#E5DFD3] rounded-xl p-5">
              <p className="text-xs uppercase tracking-widest text-[#78716C]">
                KDF AI Customer Service
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#1C1917]">Select Specialist Agent</h2>

              <div className="mt-4 space-y-2">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-colors ${
                      selectedAgent.id === agent.id
                        ? 'bg-[#14532D] border-[#14532D] text-white'
                        : 'bg-[#FBF9F5] border-[#E5DFD3] text-[#1C1917] hover:bg-[#F3EFE7]'
                    }`}
                  >
                    <p className="text-sm font-semibold">{agent.name}</p>
                    <p
                      className={`mt-0.5 text-xs ${
                        selectedAgent.id === agent.id ? 'text-[#D6E6DC]' : 'text-[#57534E]'
                      }`}
                    >
                      {agent.desk}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Chat Workspace */}
          <div className="lg:col-span-8 bg-white border border-[#E5DFD3] rounded-xl flex flex-col min-h-[540px] max-h-[680px]">
            <div className="px-6 py-4 border-b border-[#E5DFD3] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Bot className="w-5 h-5 text-[#14532D]" />
                <div>
                  <h3 className="text-base font-semibold text-[#1C1917]">{selectedAgent.name}</h3>
                  <p className="text-xs text-[#57534E]">{selectedAgent.desk}</p>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#292524] cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSearch}
                  onChange={(e) => setUseSearch(e.target.checked)}
                  className="rounded border-[#D6CEBE] text-[#14532D]"
                />
                <Globe className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span>Live Web Search Grounding</span>
              </label>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FBF9F5]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-[#14532D] text-white'
                        : 'bg-white border border-[#E5DFD3] text-[#1C1917]'
                    }`}
                  >
                    {msg.text}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-[#E5DFD3] space-y-1">
                        {msg.sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-[#1E3A8A] hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{s.title || s.uri}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-xs text-[#57534E]">AI Agent is preparing your response...</div>
              )}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {error}
                </div>
              )}
            </div>

            <form
              onSubmit={handleSend}
              className="p-4 border-t border-[#E5DFD3] bg-white flex items-center gap-3 rounded-b-xl"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask KDF AI Customer Service anything..."
                className="flex-1 px-4 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]/30"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#78716C]">
                KDF Advanced AI Tools
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[#1C1917]">
                Multimodal Photo, Translation & Letter Studio
              </h2>
              <p className="mt-1 text-xs text-[#57534E]">
                Inspect field photos or documents, translate community notices into Luganda or
                Swahili, and draft formal KDF Uganda letters.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setStudioTool('analyze-image');
                  setStudioError(null);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left text-sm font-semibold ${
                  studioTool === 'analyze-image'
                    ? 'bg-[#14532D] border-[#14532D] text-white'
                    : 'bg-[#FBF9F5] border-[#E5DFD3] text-[#1C1917]'
                }`}
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span>Photo & Document Analyzer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStudioTool('translate');
                  setStudioError(null);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left text-sm font-semibold ${
                  studioTool === 'translate'
                    ? 'bg-[#14532D] border-[#14532D] text-white'
                    : 'bg-[#FBF9F5] border-[#E5DFD3] text-[#1C1917]'
                }`}
              >
                <Languages className="w-4 h-4 shrink-0" />
                <span>Luganda / Swahili / English Translator</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStudioTool('draft-letter');
                  setStudioError(null);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left text-sm font-semibold ${
                  studioTool === 'draft-letter'
                    ? 'bg-[#14532D] border-[#14532D] text-white'
                    : 'bg-[#FBF9F5] border-[#E5DFD3] text-[#1C1917]'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Formal Humanitarian & Donor Letter Drafter</span>
              </button>
            </div>

            <form onSubmit={handleRunStudioTool} className="space-y-4">
              {studioTool === 'analyze-image' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Select Photo or Document Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleStudioImageSelect}
                    className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#14532D] file:text-white file:font-semibold"
                  />
                  {studioImageName && (
                    <p className="mt-1 text-xs font-mono text-[#14532D]">{studioImageName}</p>
                  )}
                </div>
              )}

              {studioTool === 'translate' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Target Language</label>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  >
                    <option>Luganda</option>
                    <option>Swahili</option>
                    <option>English</option>
                    <option>Runyankole-Rukiga</option>
                    <option>French</option>
                    <option>Arabic</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {studioTool === 'analyze-image'
                    ? 'What should KDF AI examine in this image? (Optional)'
                    : studioTool === 'translate'
                    ? 'Message to Translate'
                    : 'Letter Purpose, Recipient & Key Points'}
                </label>
                <textarea
                  rows={4}
                  value={studioText}
                  onChange={(e) => setStudioText(e.target.value)}
                  placeholder={
                    studioTool === 'analyze-image'
                      ? 'e.g. Summarize certificate details, check crop health, or transcribe handwritten notes...'
                      : studioTool === 'translate'
                      ? 'Enter English, Luganda, or Swahili text to translate...'
                      : 'e.g. Grant support request to UN Partner Portal for Mityana orphan school construction...'
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>

              {studioError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {studioError}
                </div>
              )}

              <button
                type="submit"
                disabled={studioLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4" />
                <span>{studioLoading ? 'Running AI Studio...' : 'Run KDF AI Assistant'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-[#E5DFD3] rounded-xl p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-semibold text-[#1C1917]">AI Studio Output</h3>
            {studioImage && studioTool === 'analyze-image' && (
              <img
                src={studioImage}
                alt="Uploaded for KDF AI analysis"
                className="max-h-56 rounded-lg border border-[#E5DFD3] object-contain"
              />
            )}
            {studioResult ? (
              <div className="p-5 rounded-xl bg-[#FBF9F5] border border-[#E5DFD3] text-sm text-[#1C1917] whitespace-pre-wrap leading-relaxed">
                {studioResult}
              </div>
            ) : (
              <p className="text-sm text-[#78716C]">
                Choose an AI tool on the left and click <strong>Run KDF AI Assistant</strong> to
                generate image analysis, translations, or formal letters.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

