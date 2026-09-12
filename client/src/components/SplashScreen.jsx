export default function SplashScreen({ isLeaving = false }) {
  return (
    <div className={`splash-screen ${isLeaving ? 'splash-screen--leaving' : ''}`} role="status" aria-live="polite">
      <div className="splash-grain" />
      <div className="splash-content">
        <div className="splash-logo-wrap" aria-hidden="true">
          <span className="splash-heat-ring splash-heat-ring--one" />
          <span className="splash-heat-ring splash-heat-ring--two" />
          <img src="/breakTimeLogo.png" alt="" className="splash-logo" />
        </div>
        <p className="splash-kicker">Fresh from the oven</p>
        <h1 className="splash-title">BREAKTIME</h1>
        <div className="splash-loader" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="sr-only">Loading BREAKTIME bakery dashboard</span>
      </div>
    </div>
  )
}
