import React, { useEffect, useState } from 'react';
import {
  FileCheck2,
  Upload,
  UserPlus,
  Briefcase,
  HeartHandshake,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { KDF_JOBS, KDF_ORG, KDF_SERVICES } from '../data/kdfData';
import { safeReadJson } from '../utils/http';

interface ApplicationItem {
  id: string;
  trackingCode: string;
  applicantName: string;
  contact: string;
  beneficiaryGroup: string;
  serviceCategory: string;
  district: string;
  summary: string;
  status: string;
  createdAt: string;
}

interface DocumentItem {
  id: string;
  trackingCode: string;
  ownerName: string;
  title: string;
  docType: string;
  fileName: string;
  fileSize: number;
  sha256: string;
  status: string;
  reviewer: string;
  uploadedAt: string;
  encryptedNotes: string;
}

interface ServicesApplicationsSectionProps {
  preselectedService: string;
  preselectedBeneficiary?: string;
  currentUserName: string;
  currentUserContact: string;
}

export const ServicesApplicationsSection: React.FC<ServicesApplicationsSectionProps> = ({
  preselectedService,
  preselectedBeneficiary,
  currentUserName,
  currentUserContact,
}) => {
  const [subTab, setSubTab] = useState<
    'apply' | 'documents' | 'verification' | 'jobs' | 'donors'
  >('apply');

  // Service selection & Applications
  const [selectedService, setSelectedService] = useState(
    preselectedService || KDF_SERVICES[0].title
  );
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [appName, setAppName] = useState(currentUserName);
  const [appContact, setAppContact] = useState(currentUserContact);
  const [appGroup, setAppGroup] = useState(KDF_ORG.beneficiaries[0]);
  const [appDistrict, setAppDistrict] = useState('Mityana District');
  const [appSummary, setAppSummary] = useState('');
  const [appFeedback, setAppFeedback] = useState<string | null>(null);

  // Documents & Verification
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [docOwner, setDocOwner] = useState(currentUserName);
  const [docTracking, setDocTracking] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('National ID / Birth Certificate');
  const [docFile, setDocFile] = useState<{ name: string; size: number; base64: string } | null>(
    null
  );
  const [docNotes, setDocNotes] = useState('');
  const [docFeedback, setDocFeedback] = useState<string | null>(null);
  const [verifySearch, setVerifySearch] = useState('');

  // Jobs & Donors
  const [selectedJob, setSelectedJob] = useState(KDF_JOBS[0].title);
  const [jobQualification, setJobQualification] = useState('');
  const [jobFeedback, setJobFeedback] = useState<string | null>(null);

  const [donorName, setDonorName] = useState(currentUserName);
  const [donorOrg, setDonorOrg] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorFocus, setDonorFocus] = useState(KDF_SERVICES[0].title);
  const [donorNote, setDonorNote] = useState('');
  const [donorFeedback, setDonorFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedService) setSelectedService(preselectedService);
  }, [preselectedService]);

  useEffect(() => {
    if (preselectedBeneficiary) setAppGroup(preselectedBeneficiary);
  }, [preselectedBeneficiary]);

  const loadData = async () => {
    try {
      const [appsRes, docsRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/documents'),
      ]);
      if (appsRes.ok) {
        const d = await safeReadJson<{ applications?: ApplicationItem[] }>(appsRes);
        setApplications(d.applications || []);
      }
      if (docsRes.ok) {
        const d = await safeReadJson<{ documents?: DocumentItem[] }>(docsRes);
        setDocuments(d.documents || []);
      }
    } catch {
      // Ignore network glitches while offline
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppFeedback(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: appName,
          contact: appContact,
          beneficiaryGroup: appGroup,
          serviceCategory: selectedService,
          district: appDistrict,
          summary: appSummary,
        }),
      });
      const data = await safeReadJson<{ application?: ApplicationItem }>(res);
      if (res.ok && data.application) {
        setApplications((prev) => [data.application!, ...prev]);
        setDocTracking(data.application.trackingCode);
        setAppSummary('');
        setAppFeedback(
          `Registered successfully. Tracking Code: ${data.application.trackingCode} (Encrypted in KDF Vault).`
        );
      } else {
        setAppFeedback(data.error || 'Failed to register applicant.');
      }
    } catch {
      setAppFeedback('Unable to submit registration right now. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => {
      setDocFeedback(`Could not read "${file.name}". Please choose another file.`);
    };
    reader.onload = () => {
      setDocFile({
        name: file.name,
        size: file.size,
        base64: String(reader.result || ''),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocFeedback(null);
    if (!docFile) {
      setDocFeedback('Please choose a document or certification file to upload.');
      return;
    }
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: docOwner,
          trackingCode: docTracking,
          title: docTitle || docFile.name,
          docType,
          fileName: docFile.name,
          fileSize: docFile.size,
          fileBase64: docFile.base64,
          notes: docNotes,
        }),
      });
      const data = await safeReadJson<{ document?: DocumentItem }>(res);
      if (res.ok && data.document) {
        setDocuments((prev) => [data.document!, ...prev]);
        setDocTitle('');
        setDocNotes('');
        setDocFile(null);
        setDocFeedback(
          `Encrypted & uploaded. SHA-256 checksum recorded for ${data.document.trackingCode}.`
        );
        setSubTab('verification');
      } else {
        setDocFeedback(data.error || 'Upload failed.');
      }
    } catch {
      setDocFeedback('Network error while uploading document. Please try again.');
    }
  };

  const handleUpdateDocStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/documents/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewer: 'Nakkazi Josemine (M&E) & Namutebi Vanessa (Legal)',
        }),
      });
      if (res.ok) {
        const data = await safeReadJson<{ document?: DocumentItem }>(res);
        if (data.document) {
          setDocuments((prev) => prev.map((d) => (d.id === id ? data.document! : d)));
        }
      }
    } catch {
      // Retain existing status if offline
    }
  };

  const handleApplyJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobFeedback(null);
    try {
      const res = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: selectedJob,
          applicantName: currentUserName,
          phone: currentUserContact,
          email: currentUserContact.includes('@') ? currentUserContact : '',
          qualification: jobQualification,
        }),
      });
      const data = await safeReadJson<{ application?: { status: string } }>(res);
      if (res.ok && data.application) {
        setJobQualification('');
        setJobFeedback(`Application submitted to ${data.application.status}.`);
      } else {
        setJobFeedback(data.error || 'Could not submit job application.');
      }
    } catch {
      setJobFeedback('Unable to submit job application right now. Please try again.');
    }
  };

  const handleSubmitDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    setDonorFeedback(null);
    try {
      const res = await fetch('/api/donors/pledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName,
          organization: donorOrg,
          email: donorEmail,
          focusArea: donorFocus,
          amountNote: donorNote,
        }),
      });
      const data = await safeReadJson<{ pledge?: { assignedTo: string } }>(res);
      if (res.ok && data.pledge) {
        setDonorNote('');
        setDonorFeedback(`Pledge logged and routed to ${data.pledge.assignedTo}.`);
      } else {
        setDonorFeedback(data.error || 'Could not submit pledge.');
      }
    } catch {
      setDonorFeedback('Unable to submit pledge right now. Please try again.');
    }
  };

  const filteredDocs = documents.filter(
    (d) =>
      d.ownerName.toLowerCase().includes(verifySearch.toLowerCase()) ||
      d.trackingCode.toLowerCase().includes(verifySearch.toLowerCase()) ||
      d.title.toLowerCase().includes(verifySearch.toLowerCase())
  );

  const activeServiceObj = KDF_SERVICES.find((s) => s.title === selectedService) || KDF_SERVICES[0];

  return (
    <div className="space-y-8">
      {/* Workspace Action Bar (All Requested Buttons) */}
      <div className="bg-white border border-[#E5DFD3] rounded-xl p-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSubTab('apply')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
            subTab === 'apply'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Registration of Applicants & Services</span>
        </button>

        <button
          onClick={() => setSubTab('documents')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
            subTab === 'documents'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Documents & Certifications</span>
        </button>

        <button
          onClick={() => setSubTab('verification')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
            subTab === 'verification'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Document Verification Status</span>
        </button>

        <button
          onClick={() => setSubTab('jobs')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
            subTab === 'jobs'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Job Opportunities</span>
        </button>

        <button
          onClick={() => setSubTab('donors')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
            subTab === 'donors'
              ? 'bg-[#14532D] text-white'
              : 'bg-[#F3EFE7] text-[#1C1917] hover:bg-[#E5DFD3]'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Donors & Sponsors</span>
        </button>
      </div>

      {/* Sub-Tab 1: Different Buttons for Different Services + Applicant Registration */}
      {subTab === 'apply' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-[#E5DFD3] rounded-xl p-6">
              <p className="text-xs uppercase tracking-widest text-[#78716C]">Select Service</p>
              <h2 className="mt-1 text-xl font-semibold text-[#1C1917]">KDF Service Programs</h2>
              <div className="mt-4 flex flex-col gap-2">
                {KDF_SERVICES.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedService(svc.title)}
                    className={`text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      selectedService === svc.title
                        ? 'bg-[#14532D] border-[#14532D] text-white'
                        : 'bg-[#FBF9F5] border-[#E5DFD3] text-[#1C1917] hover:bg-[#F3EFE7]'
                    }`}
                  >
                    <span className="font-mono mr-2 opacity-80">{svc.number}.</span>
                    <span>{svc.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E5DFD3] rounded-xl p-6">
              <p className="text-xs text-[#78716C] font-medium">Selected Service Brief</p>
              <h3 className="mt-1 text-lg font-semibold text-[#1C1917]">
                {activeServiceObj.title}
              </h3>
              <p className="mt-2 text-sm text-[#44403C] leading-relaxed">
                {activeServiceObj.detailedMandate}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-[#1C1917]">
                Applicant & Service Registration
              </h2>
              <p className="mt-1 text-sm text-[#57534E]">
                Register orphans, the elderly, persons with disabilities, widows, or community
                members in need for KDF Uganda support. Records are encrypted and assigned a
                tracking code immediately.
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {KDF_ORG.beneficiaries.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setAppGroup(group)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      appGroup === group
                        ? 'bg-[#14532D] border-[#14532D] text-white'
                        : 'bg-[#FBF9F5] border-[#E5DFD3] text-[#44403C] hover:bg-[#F3EFE7]'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>

              {appFeedback && (
                <div className="mt-4 p-3 rounded-lg bg-[#14532D]/10 border border-[#14532D]/25 text-sm text-[#14532D] font-medium">
                  {appFeedback}
                </div>
              )}

              <form onSubmit={handleRegisterApplicant} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                      Applicant Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                      Phone or Email Contact
                    </label>
                    <input
                      type="text"
                      required
                      value={appContact}
                      onChange={(e) => setAppContact(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                      Beneficiary Category
                    </label>
                    <select
                      value={appGroup}
                      onChange={(e) => setAppGroup(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    >
                      {KDF_ORG.beneficiaries.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                      District / Location
                    </label>
                    <input
                      type="text"
                      required
                      value={appDistrict}
                      onChange={(e) => setAppDistrict(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                    Service Being Applied For
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  >
                    {KDF_SERVICES.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                    Case Summary / Need Description
                  </label>
                  <textarea
                    rows={3}
                    value={appSummary}
                    onChange={(e) => setAppSummary(e.target.value)}
                    placeholder="Describe schooling, medical, shelter, rehabilitation, or farming market support needed..."
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    Submit Applicant Registration
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTab('documents')}
                    className="px-4 py-2.5 rounded-lg border border-[#D6CEBE] text-sm font-medium hover:bg-[#F3EFE7] whitespace-nowrap"
                  >
                    Proceed to Document Upload
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Applications Table */}
            <div className="bg-white border border-[#E5DFD3] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#1C1917]">Registered Applicants Ledger</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E5DFD3] text-xs text-[#78716C]">
                      <th className="py-2 pr-3">Tracking ID</th>
                      <th className="py-2 pr-3">Applicant</th>
                      <th className="py-2 pr-3">Service</th>
                      <th className="py-2 pr-3">District</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFE7]">
                    {applications.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 pr-3 font-mono tabular-nums text-xs font-semibold text-[#14532D]">
                          {item.trackingCode}
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="font-medium text-[#1C1917]">{item.applicantName}</div>
                          <div className="text-xs text-[#78716C]">{item.beneficiaryGroup}</div>
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-[#44403C]">
                          {item.serviceCategory}
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-[#57534E]">{item.district}</td>
                        <td className="py-2.5 text-xs font-semibold text-[#1E3A8A]">
                          {item.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Upload Relevant Documents & Certifications */}
      {subTab === 'documents' && (
        <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 sm:p-8 max-w-3xl">
          <h2 className="text-2xl font-semibold text-[#1C1917]">
            Upload Relevant Documents & Certifications
          </h2>
          <p className="mt-1 text-sm text-[#57534E]">
            Upload academic transcripts, LC1 recommendations, medical certificates, NGO clearances,
            or identity documents. Files receive a SHA-256 checksum and AES-256-GCM encryption.
          </p>

          {docFeedback && (
            <div className="mt-4 p-3 rounded-lg bg-[#14532D]/10 border border-[#14532D]/25 text-sm text-[#14532D] font-medium">
              {docFeedback}
            </div>
          )}

          <form onSubmit={handleUploadDoc} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                  Document Owner Full Name
                </label>
                <input
                  type="text"
                  required
                  value={docOwner}
                  onChange={(e) => setDocOwner(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                  Applicant Tracking Code (Optional)
                </label>
                <input
                  type="text"
                  value={docTracking}
                  onChange={(e) => setDocTracking(e.target.value)}
                  placeholder="e.g. KDF-2026-1042"
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. UCE Academic Certificate"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                  Certification Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                >
                  <option>National ID / Birth Certificate</option>
                  <option>Academic Certificate / School Report</option>
                  <option>Medical Certification</option>
                  <option>Community Recommendation (LC1)</option>
                  <option>Legal / Land / Widowhood Affidavit</option>
                  <option>Vocational / Professional Certificate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                Select File (PDF, Image, Word, Scan)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#14532D] file:text-white hover:file:bg-[#114224]"
              />
              {docFile && (
                <p className="mt-1.5 text-xs text-[#14532D] font-mono">
                  Selected: {docFile.name} ({Math.round(docFile.size / 1024)} KB)
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                Verification Notes
              </label>
              <input
                type="text"
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                placeholder="Issuing authority, district, or date"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Encrypt & Upload Document</span>
            </button>
          </form>
        </div>
      )}

      {/* Sub-Tab 3: Document Verification Status */}
      {subTab === 'verification' && (
        <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[#1C1917]">
                Document Verification Status
              </h2>
              <p className="mt-1 text-sm text-[#57534E]">
                Track document checks overseen by M&E (Nakkazi Josemine), HR (Bunjo Robert Son), and
                Legal (Namutebi Vanessa).
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
              <input
                type="text"
                value={verifySearch}
                onChange={(e) => setVerifySearch(e.target.value)}
                placeholder="Filter by code, name, title..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
              />
            </div>
          </div>

          <div className="divide-y divide-[#E5DFD3]">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C]">
                    <span className="font-mono font-semibold text-[#14532D]">
                      {doc.trackingCode}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{doc.docType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{doc.fileName}</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#1C1917]">
                    {doc.title} — {doc.ownerName}
                  </h3>
                  <p className="text-xs text-[#57534E]">
                    Reviewer: {doc.reviewer} · {doc.encryptedNotes}
                  </p>
                  <p className="text-[11px] font-mono text-[#78716C] truncate max-w-xl">
                    SHA-256: {doc.sha256}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3EFE7] text-xs font-semibold text-[#1C1917]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#14532D]" />
                    <span>{doc.status}</span>
                  </span>
                  <select
                    aria-label={`Update status for ${doc.title}`}
                    value={doc.status}
                    onChange={(e) => handleUpdateDocStatus(doc.id, e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  >
                    <option>Submitted</option>
                    <option>Under Review</option>
                    <option>Verified</option>
                    <option>Approved</option>
                    <option>Action Needed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Job Opportunities */}
      {subTab === 'jobs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            {KDF_JOBS.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-[#E5DFD3] rounded-xl p-6 flex flex-col justify-between gap-3"
              >
                <div>
                  <p className="text-xs text-[#78716C] font-medium">
                    {job.type} · {job.location}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-[#1C1917]">{job.title}</h3>
                  <p className="mt-2 text-sm text-[#44403C]">{job.summary}</p>
                  <p className="mt-2 text-xs text-[#57534E]">Reporting to: {job.supervisor}</p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setSelectedJob(job.title)}
                    className="text-xs font-semibold text-[#14532D] hover:underline"
                  >
                    Select Position to Apply →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white border border-[#E5DFD3] rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[#1C1917]">Apply for KDF Position</h3>
              <p className="mt-1 text-xs text-[#57534E]">
                Reviewed by Human Resource: Bunjo Robert Son
              </p>

              {jobFeedback && (
                <div className="mt-4 p-3 rounded-lg bg-[#14532D]/10 text-sm text-[#14532D] font-medium">
                  {jobFeedback}
                </div>
              )}

              <form onSubmit={handleApplyJob} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Role Selected</label>
                  <select
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  >
                    {KDF_JOBS.map((j) => (
                      <option key={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Qualifications & Experience Summary
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={jobQualification}
                    onChange={(e) => setJobQualification(e.target.value)}
                    placeholder="Summarize your degree/diploma, field experience, and languages spoken..."
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold"
                >
                  Submit Job Application
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Donors & Sponsors */}
      {subTab === 'donors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 bg-white border border-[#E5DFD3] rounded-xl p-6 sm:p-8">
            <p className="text-xs uppercase tracking-widest text-[#78716C]">
              Community Fund Mobilisation
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#1C1917]">
              Partner as a Donor or Sponsor
            </h2>
            <p className="mt-2 text-sm text-[#44403C] leading-relaxed">
              Your partnership directly funds school bursaries for orphans and the girl child, rural
              clinics and HIV/AIDS outreach, safe housing renovations for widows and the elderly,
              rehabilitation centers, workshops, and agricultural harvest cooperatives.
            </p>

            <div className="mt-6 pt-5 border-t border-[#E5DFD3] space-y-2 text-sm text-[#292524]">
              <p>
                <strong>Director:</strong> Kibatto Joseph (
                <span className="font-mono">+256 770610329</span>)
              </p>
              <p>
                <strong>Chief Executive Director:</strong> Nakyejwe Sherina (
                <span className="font-mono">+256783913861</span>)
              </p>
              <p>
                <strong>Official Office Line:</strong>{' '}
                <span className="font-mono">{KDF_ORG.officeLine}</span>
              </p>
              <p>
                <strong>Email:</strong> {KDF_ORG.email}
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white border border-[#E5DFD3] rounded-xl p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-[#1C1917]">
              Donor & Sponsor Partnership Form
            </h3>
            {donorFeedback && (
              <div className="mt-4 p-3 rounded-lg bg-[#14532D]/10 text-sm text-[#14532D] font-medium">
                {donorFeedback}
              </div>
            )}

            <form onSubmit={handleSubmitDonor} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Organization / Foundation
                  </label>
                  <input
                    type="text"
                    value={donorOrg}
                    onChange={(e) => setDonorOrg(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="partner@organization.org"
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Mandate Focus Area</label>
                <select
                  value={donorFocus}
                  onChange={(e) => setDonorFocus(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                >
                  {KDF_SERVICES.map((s) => (
                    <option key={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Sponsorship / Grant Proposal Details
                </label>
                <textarea
                  rows={3}
                  value={donorNote}
                  onChange={(e) => setDonorNote(e.target.value)}
                  placeholder="Describe grant support, medical supplies, school construction, or child sponsorship..."
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold"
              >
                Register Donor / Sponsor Commitment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
