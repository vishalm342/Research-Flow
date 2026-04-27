import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, PenTool, CheckCircle2, Zap } from 'lucide-react';
import Logo from '../components/Logo';

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
          <Logo size={32} showText={true} subtitle={false} />
          <button className="px-6 py-2 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors rounded-lg text-sm font-medium" onClick={() => navigate('/login')}>
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
              Powered by LangGraph + SambaNova
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
            Four AI agents — Researcher, Writer, Editor, Refiner — working in
            sequence to deliver polished, sourced research reports.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <button className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2" onClick={() => navigate('/login')}>
              Start Researching
              <ArrowRight size={18} />
            </button>
            <button className="px-8 py-3 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors rounded-lg font-semibold" onClick={() => window.open('https://github.com/vishalm342/Research-Flow', '_blank')}>
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
              { name: 'Researcher', status: 'Complete' },
              { name: 'Writer', status: 'Complete' },
              { name: 'Editor', status: 'Running' },
              { name: 'Refiner', status: 'Pending' },
            ].map((agent, idx) => (
              <div key={idx} className="mb-5 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {agent.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${agent.status === 'Complete'
                        ? 'bg-emerald-900 text-emerald-300'
                        : agent.status === 'Running'
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                  >
                    {agent.status}
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${agent.status === 'Complete'
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
          transition={{ duration: 1.0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="max-w-6xl mx-auto"
        >
          <h3 className="text-4xl font-light mb-16 text-white">
            Four agents. One report.
          </h3>

          {/* Steps Flow */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                name: 'Researcher',
                description: 'Searches web, gathers sources',
              },
              {
                icon: PenTool,
                name: 'Writer',
                description: 'Drafts structured report',
              },
              {
                icon: CheckCircle2,
                name: 'Editor & Refiner',
                description: 'Polishes and scores quality',
              },
              {
                icon: Zap,
                name: 'All Agents',
                description: 'Collaborate in real-time',
              } 
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
          transition={{ duration: 1.0 }}
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
                name: 'Real-time Synthesis',
                description: 'Watch agents collaborate as they research and refine',
              },
              {
                name: 'Verified Sources',
                description: 'Every claim is backed by cited web sources',
              },
              {
                name: 'Export Ready',
                description: 'Get polished reports in markdown or PDF format',
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
          transition={{ duration: 1.0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto text-center"
        >
          <p className="text-zinc-600 text-sm">
            Built with LangGraph · FastAPI · MongoDB · SambaNova
          </p>
        </motion.div>
      </footer>
    </div>
  );
}
