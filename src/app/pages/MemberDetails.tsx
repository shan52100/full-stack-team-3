import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ChevronLeft, Mail, GraduationCap, Calendar, Briefcase, Star, Award, Target, Trash2 } from 'lucide-react';
import { members as membersApi, type Member } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'sonner';

export function MemberDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    membersApi.get(id)
      .then(setMember)
      .catch(() => toast.error('Member not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Delete this member? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await membersApi.delete(id);
      toast.success('Member deleted');
      navigate('/dashboard/members');
    } catch {
      toast.error('Failed to delete member');
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;
  }

  if (!member) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-4">Member not found.</p>
        <Link to="/dashboard/members" className="text-blue-600 hover:underline text-sm font-medium">← Back to Members</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        to="/dashboard/members"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Members
      </Link>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {/* Header banner */}
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

        {/* Avatar + basic info */}
        <div className="px-6 pb-6 -mt-14">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
            {member.image ? (
              <img src={`/uploads/${member.image}`} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                {member.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
              <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-0.5 rounded-full">
                {member.role}
              </span>
              <p className="text-sm text-gray-400 font-mono mt-2">{member.rollNumber}</p>
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 self-start"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* Info sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <InfoCard icon={Mail} label="Email" value={member.email} />
        <InfoCard icon={GraduationCap} label="Degree" value={member.degree} />
        <InfoCard icon={Calendar} label="Year" value={member.year} />
        {member.project && <InfoCard icon={Briefcase} label="Project" value={member.project} />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {member.hobbies && <InfoCard icon={Star} label="Hobbies" value={member.hobbies} />}
        {member.certificate && <InfoCard icon={Award} label="Certifications" value={member.certificate} />}
        {member.internship && <InfoCard icon={Briefcase} label="Internship" value={member.internship} className="sm:col-span-2" />}
      </div>

      {member.aboutYourAim && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <Target className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">About & Aim</h3>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm">{member.aboutYourAim}</p>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  className = '',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-gray-900 font-medium text-sm">{value}</p>
    </div>
  );
}
