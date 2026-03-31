import { Link } from 'react-router-dom'
import { BookOpen, Gift, Users, ArrowRight, Shield, Heart, Zap } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">UniShare</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
            Login
          </Link>
          <Link to="/register" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Heart className="w-4 h-4" />
            Goodwill-based sharing
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
            Share Knowledge,<br />
            <span className="text-blue-600">Strengthen Community</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            A college-exclusive platform where students donate academic resources to juniors
            and alumni mentor the next generation — no money involved, just goodwill.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl"
            >
              Join UniShare <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              I have an account
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Gift,
              title: 'Donate Resources',
              description: 'Share your notes, question papers, stationery, books, and drafting tools with juniors who need them.',
              color: 'blue'
            },
            {
              icon: BookOpen,
              title: 'Browse & Request',
              description: 'Find the resources you need by category, semester, or subject. Request items directly from donors.',
              color: 'emerald'
            },
            {
              icon: Users,
              title: 'Alumni Mentorship',
              description: 'Alumni can post mentorship opportunities. Get career guidance and academic support from seniors.',
              color: 'purple'
            }
          ].map(({ icon: Icon, title, description, color }) => (
            <div key={title} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-slide-up">
              <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center mb-5`}>
                <Icon className={`w-6 h-6 text-${color}-600`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-24 flex flex-wrap justify-center gap-8 text-center">
          {[
            { icon: Shield, label: 'College-verified emails only' },
            { icon: Heart, label: 'Zero monetary transactions' },
            { icon: Zap, label: 'Instant resource sharing' }
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-gray-500">
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        UniShare &copy; {new Date().getFullYear()} — Built for college communities
      </footer>
    </div>
  )
}
