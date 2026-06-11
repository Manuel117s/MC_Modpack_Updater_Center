import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="animate-in">
      {/* ── Hero Section ──────────────────────────────────────────── */}
      <section className="hero">
        <span className="hero-badge">🚀 Now in Early Access</span>
        <h1>
          Manage Your <span className="gradient-text">Modpacks</span> Like a Pro
        </h1>
        <p>
          The central hub for creating, versioning, and distributing modpacks
          across Forge, Fabric, NeoForge, and Quilt — with your whole team.
        </p>
        <div className="hero-actions">
          <Link to="/signin">
            <button className="btn btn-primary btn-lg">Create Free Account</button>
          </Link>
          <Link to="/login">
            <button className="btn btn-outline btn-lg">Log In</button>
          </Link>
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────────────── */}
      <section className="features-grid">
        <div className="feature-card">
          <div className="icon">📦</div>
          <h3>Release Management</h3>
          <p>
            Publish new versions with changelogs, mark drafts, and yank bad
            releases — all versioned and timestamped automatically.
          </p>
        </div>

        <div className="feature-card">
          <div className="icon">👥</div>
          <h3>Team Collaboration</h3>
          <p>
            Invite contributors as admins, editors, or viewers. Fine-grained
            roles ensure the right people have the right access.
          </p>
        </div>

        <div className="feature-card">
          <div className="icon">📢</div>
          <h3>News & Announcements</h3>
          <p>
            Keep your community updated with news posts tied to each modpack.
            Communicate new features, patches, and important changes.
          </p>
        </div>

        <div className="feature-card">
          <div className="icon">🎮</div>
          <h3>Multi-Loader Support</h3>
          <p>
            Forge, Fabric, NeoForge, Quilt — manage packs for any mod loader
            and game version from a single dashboard.
          </p>
        </div>

        <div className="feature-card">
          <div className="icon">🔒</div>
          <h3>Public & Private Packs</h3>
          <p>
            Choose visibility per modpack. Share publicly with the world or
            keep things private for your server community.
          </p>
        </div>

        <div className="feature-card">
          <div className="icon">📊</div>
          <h3>Dashboard Overview</h3>
          <p>
            See all your modpacks at a glance — latest versions, update
            timestamps, and your role across every project.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Home;