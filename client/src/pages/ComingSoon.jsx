export default function ComingSoon() {
  return (
    <div className="splash-screen">
      <div className="splash-grain" />
      <div className="splash-content" style={{ width: 'min(88vw, 560px)' }}>
        <div className="splash-logo-wrap" aria-hidden="true">
          <span className="splash-heat-ring splash-heat-ring--one" />
          <span className="splash-heat-ring splash-heat-ring--two" />
          <img src="/breakTimeLogo.png" alt="" className="splash-logo" />
        </div>
        <h1 className="splash-title" style={{ whiteSpace: 'nowrap', fontSize: 'clamp(2rem, 8vw, 3.4rem)' }}>
          Coming soon
        </h1>
      </div>
    </div>
  )
}
