import { Link, Navigate } from 'react-router';
import { Phone, Bot, BarChart3, MessageSquare, Zap, Shield, Globe, ChevronRight, Play, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Landing() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 backdrop-blur-md bg-gray-950/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">VoiceFlow</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#team" className="hover:text-white transition-colors">Team</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors font-medium">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-600/10 text-blue-400 text-xs font-semibold mb-8 tracking-wide">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Voice Agents · Real-time · Scalable
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
            Voice AI that{' '}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              sells, supports
            </span>
            <br />& scales for you
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Deploy intelligent voice agents that handle outbound calls, qualify leads, and manage customer
            conversations — 24/7, at any scale, with human-like naturalness.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="group flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35 hover:-translate-y-0.5"
            >
              Start for free
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all"
            >
              <Play className="w-4 h-4 text-blue-400" />
              Sign in
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl mx-auto">
            {[
              { value: '99.9%', label: 'Uptime' },
              { value: '<200ms', label: 'Response time' },
              { value: '40+', label: 'Languages' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to automate voice</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              From deployment to analytics — the complete platform for AI-driven voice operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Bot,
                color: 'from-blue-500 to-blue-700',
                glow: 'bg-blue-500/10',
                title: 'AI Voice Agents',
                desc: 'Deploy custom agents trained on your business logic. Each agent handles calls with human-like conversation flow.',
              },
              {
                icon: Zap,
                color: 'from-violet-500 to-violet-700',
                glow: 'bg-violet-500/10',
                title: 'Preemptive Generation',
                desc: 'Sub-200ms response latency with preemptive TTS generation — callers never experience awkward pauses.',
              },
              {
                icon: BarChart3,
                color: 'from-cyan-500 to-cyan-700',
                glow: 'bg-cyan-500/10',
                title: 'Real-time Analytics',
                desc: 'Live dashboards tracking call volume, success rates, durations, and agent performance metrics.',
              },
              {
                icon: MessageSquare,
                color: 'from-emerald-500 to-emerald-700',
                glow: 'bg-emerald-500/10',
                title: 'Full Transcripts',
                desc: 'TTS-aligned conversation transcripts with sentiment analysis and automated summaries.',
              },
              {
                icon: Shield,
                color: 'from-orange-500 to-orange-700',
                glow: 'bg-orange-500/10',
                title: 'Per-User Isolation',
                desc: 'Every workspace is fully isolated. Your agents, data, and conversations stay private to your account.',
              },
              {
                icon: Globe,
                color: 'from-pink-500 to-pink-700',
                glow: 'bg-pink-500/10',
                title: 'Global SIP Calling',
                desc: 'Make outbound calls worldwide via LiveKit SIP trunking. Any phone number, any country.',
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="relative group rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 p-6 transition-all hover:-translate-y-1 hover:border-white/15 cursor-default"
                >
                  <div className={`absolute inset-0 rounded-2xl ${f.glow} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="relative font-semibold text-white mb-2">{f.title}</h3>
                  <p className="relative text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Up and running in minutes</h2>
            <p className="text-gray-400 text-lg">No telephony expertise needed.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create your agent',
                desc: 'Define your agent\'s name, voice, personality, and instructions. Pick from 40+ languages.',
              },
              {
                step: '02',
                title: 'Configure & deploy',
                desc: 'Connect your SIP trunk, set your phone number, and toggle the agent live in one click.',
              },
              {
                step: '03',
                title: 'Monitor & optimize',
                desc: 'Review call transcripts, track performance metrics, and refine your agent\'s behavior.',
              },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-blue-600/50 to-transparent -translate-x-4" />
                )}
                <div className="text-5xl font-black text-blue-600/20 mb-4">{s.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Members Section */}
      <section id="team" className="py-24 px-6 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-600/10 text-blue-400 text-xs font-semibold mb-6">
              <Users className="w-3.5 h-3.5" />
              Team Management
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Manage your team members</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Register team profiles, track roles, projects, certifications, and career goals — all in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: '📋', title: 'Rich profiles', desc: 'Store degree, year, roll number, hobbies, internships, and photo.' },
              { icon: '🔍', title: 'Instant lookup', desc: 'Browse all members or drill into individual profiles with one click.' },
              { icon: '📷', title: 'Photo upload', desc: 'Upload profile photos that appear on member cards and detail views.' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/8 bg-white/3 p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35 hover:-translate-y-0.5"
            >
              Get started free
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6 border-t border-white/8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            Ready to automate<br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              your voice operations?
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Join teams already using VoiceFlow to handle thousands of calls per day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto text-center px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all text-lg shadow-xl shadow-blue-600/30 hover:-translate-y-0.5"
            >
              Create free account
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto text-center px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all text-lg"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">VoiceFlow</span>
          </div>
          <p className="text-xs text-gray-600">© 2026 VoiceFlow · B2B Voice Agent Platform</p>
        </div>
      </footer>
    </div>
  );
}
