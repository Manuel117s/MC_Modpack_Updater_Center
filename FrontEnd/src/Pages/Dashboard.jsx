import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const LOADER_BADGE = {
  Forge: 'badge-yellow',
  Fabric: 'badge-blue',
  NeoForge: 'badge-red',
  Quilt: 'badge-purple',
};

const ROLE_BADGE = {
  owner: 'badge-green',
  admin: 'badge-purple',
  editor: 'badge-blue',
  viewer: 'badge-gray',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function Dashboard() {
  const [modpacks, setModpacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    game: 'Minecraft',
    game_version: '',
    loader: 'Fabric',
    visibility: 'private',
  });

  const fetchModpacks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/modpacks/dashboard');
      setModpacks(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load modpacks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModpacks();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await api.post('/modpacks', formData);
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        game: 'Minecraft',
        game_version: '',
        loader: 'Fabric',
        visibility: 'private',
      });
      // Refresh list
      fetchModpacks();
    } catch (err) {
      setFormError(err.message || 'Failed to create modpack');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = modpacks.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard animate-in">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>All modpacks you own or collaborate on</p>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="dashboard-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            id="dashboard-search"
            placeholder="Search modpacks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="btn btn-primary"
          id="create-modpack-btn"
          onClick={() => setShowModal(true)}
        >
          + New Modpack
        </button>
      </div>

      {/* ── Main content / Grid ────────────────────────────────── */}
      {loading ? (
        <div className="empty-state">
          <div style={{ color: 'var(--text-secondary)' }}>Loading dashboard…</div>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="icon">⚠️</div>
          <h3>Error loading dashboard</h3>
          <p>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={fetchModpacks}>
            Retry
          </button>
        </div>
      ) : filtered.length > 0 ? (
        <div className="modpack-grid">
          {filtered.map((m) => (
            <Link
              to={`/modpacks/${m.id}`}
              key={m.id}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="modpack-card">
                <div className="modpack-card-header">
                  <h3>{m.name}</h3>
                  <span className={`badge ${ROLE_BADGE[m.role] || 'badge-gray'}`}>
                    {m.role}
                  </span>
                </div>

                <div className="modpack-card-meta">
                  <span className="badge badge-gray">{m.game}</span>
                  <span className="badge badge-gray">{m.game_version}</span>
                  <span className={`badge ${LOADER_BADGE[m.loader] || 'badge-gray'}`}>
                    {m.loader}
                  </span>
                  <span className={`badge ${m.visibility === 'public' ? 'badge-green' : 'badge-yellow'}`}>
                    {m.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                  </span>
                </div>

                <div className="modpack-card-footer">
                  <span className="version">
                    {m.latest_version
                      ? <>Latest: <strong>v{m.latest_version}</strong></>
                      : 'No releases yet'}
                  </span>
                  <span className="date">{formatDate(m.updated_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon">📦</div>
          <h3>No modpacks found</h3>
          <p>
            {search
              ? 'Try a different search term.'
              : "You don't have any modpacks yet. Create your first one!"}
          </p>
          {!search && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + New Modpack
            </button>
          )}
        </div>
      )}

      {/* ── Create Modpack Modal ───────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Modpack</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="badge badge-red" style={{ display: 'block', width: '100%', padding: '0.65rem', marginBottom: '1.2rem', textAlign: 'center', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                    ⚠️ {formError}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="modal-name">Modpack Name</label>
                  <input
                    type="text"
                    id="modal-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    minLength={1}
                    maxLength={100}
                    placeholder="e.g. Arcane Horizons"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-desc">Description</label>
                  <input
                    type="text"
                    id="modal-desc"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="e.g. A magic-focused pack..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-game">Game</label>
                  <input
                    type="text"
                    id="modal-game"
                    name="game"
                    value={formData.game}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Minecraft"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-version">Game Version</label>
                  <input
                    type="text"
                    id="modal-version"
                    name="game_version"
                    value={formData.game_version}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. 1.20.4"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-loader">Loader</label>
                  <select
                    id="modal-loader"
                    name="loader"
                    className="select-input"
                    value={formData.loader}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Forge">Forge</option>
                    <option value="Fabric">Fabric</option>
                    <option value="NeoForge">NeoForge</option>
                    <option value="Quilt">Quilt</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="modal-visibility">Visibility</label>
                  <select
                    id="modal-visibility"
                    name="visibility"
                    className="select-input"
                    value={formData.visibility}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="private">Private (Team only)</option>
                    <option value="public">Public (Everyone can view)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating…' : 'Create Modpack'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
