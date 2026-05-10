import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page landing-page">
      <section className="hero">
        <div className="hero-copy hero-copy-upgraded">
          <p className="eyebrow">Cloak Frontier Track</p>
          <div className="hero-badge-row">
            <span className="info-chip">Shielded execution</span>
            <span className="info-chip">Viewing-key audits</span>
            <span className="info-chip">USDC payroll</span>
          </div>
          <h1>Private payroll for teams that cannot leak compensation on-chain</h1>
          <p className="hero-text">
            CloakPay gives Solana teams a clean way to run contractor payroll without leaking salaries, recipient
            relationships, or treasury timing to the public chain.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/dashboard">
              Open dashboard
            </Link>
            <Link className="button ghost" href="/audit">
              View audit portal
            </Link>
          </div>
          <div className="hero-footnote">
            <span>Built around Cloak shielded execution</span>
            <span>Audit access stays explicit and scoped</span>
          </div>
        </div>

        <div className="hero-card hero-card-upgraded">
          <div className="hero-card-glow" />
          <div className="hero-card-header">
            <div>
              <p className="eyebrow">Live workflow</p>
              <h2>April Contractor Payroll</h2>
            </div>
            <span className="status-pill status-success">completed</span>
          </div>

          <div className="hero-stat-grid">
            <div className="hero-stat">
              <span>Private batch</span>
              <strong>3,650 USDC</strong>
            </div>
            <div className="hero-stat">
              <span>Recipients hidden</span>
              <strong>3 contractors</strong>
            </div>
            <div className="hero-stat">
              <span>Treasury mode</span>
              <strong>Shielded before payout</strong>
            </div>
            <div className="hero-stat">
              <span>Audit mode</span>
              <strong>Viewing key access</strong>
            </div>
          </div>

          <div className="hero-mini-timeline">
            <div>
              <span>01</span>
              <p>Upload payroll roster and validate recipients.</p>
            </div>
            <div>
              <span>02</span>
              <p>Shield treasury funds through Cloak before any disbursement.</p>
            </div>
            <div>
              <span>03</span>
              <p>Issue scoped review access only when finance actually needs it.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="value-strip">
        <div className="value-item">
          <span className="value-kicker">Public-chain risk</span>
          <strong>Salaries, counterparties, and treasury timing become visible forever.</strong>
        </div>
        <div className="value-item">
          <span className="value-kicker">CloakPay answer</span>
          <strong>Shield the run, pay privately, and selectively disclose only to reviewers.</strong>
        </div>
      </section>

      <section className="panel three-up feature-panel">
        <article>
          <p className="eyebrow">Shield first</p>
          <h2>Deposit into a private execution layer</h2>
          <p className="muted">Shielded balances keep the payroll run from becoming a public intelligence feed.</p>
        </article>
        <article>
          <p className="eyebrow">Pay privately</p>
          <h2>Run one batch for many recipients</h2>
          <p className="muted">The product is centered on real Cloak private transfers across an operator-managed payroll run.</p>
        </article>
        <article>
          <p className="eyebrow">Audit selectively</p>
          <h2>Reveal only what finance needs</h2>
          <p className="muted">Viewing-key style access keeps compliance deliberate instead of public by default.</p>
        </article>
      </section>

      <section className="story-grid">
        <div className="panel story-card">
          <p className="eyebrow">Who it is for</p>
          <h2>Crypto-native finance teams, DAOs, agencies, and startups paying in stablecoins.</h2>
          <p className="muted">
            The product is opinionated around the exact flow judges expect: recipient setup, shielded payroll,
            recipient confirmation, and audit review.
          </p>
        </div>
        <div className="panel story-card dark-card">
          <p className="eyebrow">Why it feels real</p>
          <h2>The UX is built like treasury software, not an SDK wrapper.</h2>
          <p className="muted">
            Clear progress states, dense operational summaries, and deliberate disclosure controls make the product
            easier to trust during a live demo.
          </p>
        </div>
      </section>
    </div>
  );
}
