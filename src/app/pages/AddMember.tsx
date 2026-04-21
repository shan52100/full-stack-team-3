import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ChevronLeft, Camera, Loader2 } from 'lucide-react';
import { members as membersApi } from '../services/api';
import { toast } from 'sonner';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export function AddMember() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    rollNumber: '',
    year: '',
    degree: '',
    email: '',
    role: '',
    project: '',
    hobbies: '',
    certificate: '',
    internship: '',
    aboutYourAim: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (imageFile) data.append('image', imageFile);
      await membersApi.create(data);
      toast.success('Member added successfully!');
      navigate('/dashboard/members');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/dashboard/members"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Members
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Member</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details to register a team member.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo upload */}
        <div className="flex justify-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => document.getElementById('photoInput')?.click()}
              className="w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors flex items-center justify-center bg-gray-50 cursor-pointer group"
            >
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-blue-500 transition-colors">
                  <Camera className="w-6 h-6" />
                  <span className="text-xs font-medium">Upload photo</span>
                </div>
              )}
            </button>
            <input id="photoInput" type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </div>
        </div>

        {/* Card: Basic info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Basic Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *" required>
              <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Shanmugapriyan" required className={inputCls} />
            </Field>
            <Field label="Roll Number *" required>
              <input type="text" value={form.rollNumber} onChange={set('rollNumber')} placeholder="e.g. RA2312704010012" required className={inputCls} />
            </Field>
            <Field label="Year *" required>
              <select value={form.year} onChange={set('year')} required className={inputCls}>
                <option value="">Select year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            <Field label="Degree *" required>
              <input type="text" value={form.degree} onChange={set('degree')} placeholder="e.g. B.Tech CSE" required className={inputCls} />
            </Field>
            <Field label="Email *" required>
              <input type="email" value={form.email} onChange={set('email')} placeholder="e.g. user@srmist.edu.in" required className={inputCls} />
            </Field>
            <Field label="Role *" required>
              <input type="text" value={form.role} onChange={set('role')} placeholder="e.g. Full Stack Developer" required className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Card: Academic & Work */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Academic & Work</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Project" className="sm:col-span-2">
              <input type="text" value={form.project} onChange={set('project')} placeholder="e.g. B2B Voice Agent Platform" className={inputCls} />
            </Field>
            <Field label="Hobbies" className="sm:col-span-2">
              <input type="text" value={form.hobbies} onChange={set('hobbies')} placeholder="e.g. Coding, Reading, Gaming" className={inputCls} />
            </Field>
            <Field label="Certifications">
              <input type="text" value={form.certificate} onChange={set('certificate')} placeholder="e.g. AWS Cloud Practitioner" className={inputCls} />
            </Field>
            <Field label="Internship">
              <input type="text" value={form.internship} onChange={set('internship')} placeholder="e.g. SDE Intern at XYZ Corp" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Card: About */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">About & Aim</h2>
          <textarea
            value={form.aboutYourAim}
            onChange={set('aboutYourAim')}
            placeholder="Describe your goals and career aspirations..."
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Link
            to="/dashboard/members"
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors';

function Field({ label, children, required, className }: { label: string; children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
