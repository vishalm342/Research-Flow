export default function Logo({ size = 32, showText = true, subtitle = false }) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ width: size, height: size }} className="text-emerald-500 flex-shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
          <path d="M6 9l2 2 3-3m-5 6l2 2 3-3" />
        </svg>
      </div>
      {showText && (
        <div>
          <span className="text-white font-semibold text-base tracking-tight leading-none">
            ResearchFlow
          </span>
          {subtitle && (
            <p className="text-zinc-500 text-xs mt-0.5">AI Research Assistant</p>
          )}
        </div>
      )}
    </div>
  );
}