import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { UserPlus, Users, Search, GraduationCap, Calendar } from 'lucide-react';
import { members as membersApi, type Member } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function ViewMembers() {
  const [memberList, setMemberList] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    membersApi.list()
      .then(setMemberList)
      .catch(() => setError('Failed to load members.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = memberList.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      m.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-500 text-sm mt-1">{memberList.length} member{memberList.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Link
          to="/dashboard/members/add"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Member
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, role, or roll number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {search ? 'No matching members' : 'No members yet'}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {search ? 'Try a different search term.' : 'Add your first team member to get started.'}
          </p>
          {!search && (
            <Link
              to="/dashboard/members/add"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </Link>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((member) => (
          <div
            key={member._id}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
          >
            {/* Photo */}
            <div className="h-44 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center overflow-hidden">
              {member.image ? (
                <img
                  src={`/uploads/${member.image}`}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {member.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-4">
              <h3 className="font-bold text-gray-900 text-base mb-1 truncate">{member.name}</h3>
              <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3">
                {member.role}
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{member.degree}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{member.year}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-2 truncate">{member.rollNumber}</p>
            </div>

            {/* Footer */}
            <div className="px-4 pb-4">
              <Link
                to={`/dashboard/members/${member._id}`}
                className="block text-center py-2 bg-gray-50 hover:bg-blue-600 hover:text-white border border-gray-200 hover:border-blue-600 rounded-lg text-sm font-semibold text-gray-700 transition-all"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
