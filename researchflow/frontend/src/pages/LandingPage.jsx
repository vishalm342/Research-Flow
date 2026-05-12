import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, PenTool, CheckCircle2, Zap } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const floatVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: 0.3 },
    },
  };

  const pulseVariants = {
    pulse: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
      },
    },
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background gradient */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2 }}
      >
        <div className="absolute inset-0 bg-gradient-radial from-emerald-900 via-transparent to-transparent opacity-10 blur-3xl animate-pulse" />
      </motion.div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-between px-6 md:px-12 pt-8 pb-12">
        {/* Navigation */}
        <motion.nav
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 text-emerald-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
                <path d="M6 9l2 2 3-3m-5 6l2 2 3-3" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">ResearchFlow</h1>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors rounded-lg text-sm font-medium"
          >
            Sign In
          </button>
        </motion.nav>

        {/* Hero Content */}
        <motion.div
          className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full mb-8"
          >
            <motion.div
              className="w-2 h-2 bg-emerald-400 rounded-full"
              variants={pulseVariants}
              animate="pulse"
            />
            <span className="text-emerald-400 text-xs font-medium">
              Powered by LangGraph + SambaNova + Parallel Agents + Real-Time Streaming
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            variants={itemVariants}
            className="text-5xl md:text-6xl font-light italic text-center leading-tight mb-6"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Research that thinks,{' '}
            <br />
            writes, and refines itself.
          </motion.h2>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-lg text-zinc-400 text-center mb-12 max-w-2xl leading-relaxed"
          >
            Seven autonomous AI agents — parallel researchers, critic gate, LLM-powered supervisor — collaborating with intelligent routing and real-time streaming.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              Start Researching
              <ArrowRight size={18} />
            </button>
            <button className="px-8 py-3 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors rounded-lg font-semibold">
              View on GitHub
            </button>
          </motion.div>
        </motion.div>

        {/* Floating Card Mockup */}
        <motion.div
          variants={floatVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-md"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
          >
            {/* Agent Progress Items */}
            {[
              { name: 'Researcher Primary', status: 'Complete', desc: 'Searching + Scraping Sources' },
              { name: 'Researcher Trends', status: 'Complete', desc: 'Latest Developments 2024-2025' },
              { name: 'Writer', status: 'Running', desc: 'Generating Draft (1200+ words)' },
              { name: 'Critic', status: 'Running', desc: 'Quality Score: 8.2/10' },
              { name: 'Editor', status: 'Pending', desc: 'Polishing Report' },
              { name: 'Supervisor', status: 'Pending', desc: 'Routing Decision' },
              { name: 'Refiner', status: 'Pending', desc: 'Applying Refinements' },
            ].map((agent, idx) => (
              <div key={idx} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">
                    {agent.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      agent.status === 'Complete'
                        ? 'bg-emerald-900 text-emerald-300'
                        : agent.status === 'Running'
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-2">{agent.desc}</p>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      agent.status === 'Complete'
                        ? 'bg-emerald-500'
                        : agent.status === 'Running'
                          ? 'bg-blue-500'
                          : 'bg-zinc-700'
                    }`}
                    initial={{ width: agent.status === 'Complete' ? '100%' : '0%' }}
                    animate={
                      agent.status === 'Running'
                        ? { width: ['0%', '100%', '0%'] }
                        : {}
                    }
                    transition={
                      agent.status === 'Running'
                        ? { duration: 2, repeat: Infinity }
                        : {}
                    }
                  />
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="relative px-6 md:px-12 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: '-100px' }}
          className="max-w-6xl mx-auto"
        >
          <h3 className="text-4xl font-light mb-16 text-white">
            Seven agents. Intelligent routing. One polished report.
          </h3>

          {/* Steps Flow */}
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Search,
                name: 'Parallel Research',
                description: 'Primary + Trends branches execute simultaneously, then merge sources',
              },
              {
                icon: CheckCircle2,
                name: 'Quality Criticism',
                description: 'Critic scores draft 0-10, decides accept or rewrite loop',
              },
              {
                icon: Zap,
                name: 'Intelligent Routing',
                description: 'Supervisor LLM decides next step: Refiner, Writer, or End',
              },
              {
                icon: PenTool,
                name: 'Real-Time Collaboration',
                description: 'Watch all 7 agents work together in live terminal stream',
              },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, margin: '-100px' }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
              >
                <step.icon className="w-6 h-6 text-emerald-600 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">
                  {step.name}
                </h4>
                <p className="text-sm text-zinc-500">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative px-6 md:px-12 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: '-100px' }}
          className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center"
        >
          {/* Left Column - Callout */}
          <div>
            <h3 className="text-5xl font-bold text-white leading-tight">
              Quality scored.
              <br />
              Source cited.
              <br />
              Ready to export.
            </h3>
          </div>

          {/* Right Column - Features */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="space-y-6"
          >
            {[
              {
                name: 'Parallel Research Execution',
                description: 'Two researchers (primary + trends) run simultaneously. Deduplicated sources merged into single dataset.',
              },
              {
                name: 'Intelligent Quality Gate',
                description: 'Critic agent scores drafts 0-10. Automatic rewrite loops (max 2 retries) ensure quality.',
              },
              {
                name: 'LLM-Powered Routing',
                description: 'Supervisor makes intelligent decisions via LLM. Routes between: Writer, Refiner, or End.',
              },
              {
                name: 'Agent Memory & History',
                description: 'Full audit trail of agent decisions. Agents reference previous outputs for context.',
              },
              {
                name: 'Real-Time Event Streaming',
                description: 'Live terminal showing agent collaboration. Watch parallel researchers work simultaneously.',
              },
              {
                name: 'Export Ready',
                description: 'Get polished reports in markdown or PDF format with citations and sources.',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 w-3 h-3 bg-emerald-600 rounded-full mt-2" />
                <div>
                  <h4 className="text-white font-semibold mb-1">
                    {feature.name}
                  </h4>
                  <p className="text-zinc-500 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 md:px-12 py-12 border-t border-zinc-800">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto text-center"
        >
          <p className="text-zinc-600 text-sm">
            Built with LangGraph · FastAPI · MongoDB · SambaNova · Tavily + DuckDuckGo · BeautifulSoup
          </p>
        </motion.div>
      </footer>
    </div>
  );
}
