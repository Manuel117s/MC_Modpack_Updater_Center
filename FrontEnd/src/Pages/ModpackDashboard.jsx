import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const STATUS_BADGE = {
  published: 'badge-green',
  draft: 'badge-gray',
  yanked: 'badge-red',
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

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ModpackDashboard() {
  const { modpackId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const [modpack, setModpack] = useState(null);
  const [releases, setReleases] = useState([]);
  const [news, setNews] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState(null);

  const [releaseForm, setReleaseForm] = useState({
    version: '',
    changelog: '',
    download_url: '',
    status: 'published',
  });
  const [newsForm, setNewsForm] = useState({
    title: '',
    body: '',
  });
  const [collabForm, setCollabForm] = useState({
    user_id: '',
    role: 'editor',
  });

  const [modalError, setModalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [modpackData, releasesData, newsData, collaboratorsData] = await Promise.all([
        api.get(`/modpacks/${modpackId}`),
        api.get(`/modpacks/${modpackId}/releases`),
        api.get(`/modpacks/${modpackId}/news`),
        api.get(`/modpacks/${modpackId}/collaborators`),
      ]);

      setModpack(modpackData);
      setReleases(releasesData);
      setNews(newsData);
      setCollaborators(collaboratorsData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch modpack details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [modpackId]);

  const handleReleaseSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    try {
      await api.post(`/modpacks/${modpackId}/releases`, releaseForm);
      setShowReleaseModal(false);
      setReleaseForm({ version: '', changelog: '', download_url: '', status: 'published' });
      fetchData();
    } catch (err) {
      setModalError(err.message || 'Failed to create release');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    try {
      if (editingNewsId) {
        await api.patch(`/modpacks/${modpackId}/news/${editingNewsId}`, newsForm);
      } else {
        await api.post(`/modpacks/${modpackId}/news`, newsForm);
      }
      setShowNewsModal(false);
      setEditingNewsId(null);
      setNewsForm({ title: '', body: '' });
      fetchData();
    } catch (err) {
      setModalError(err.message || (editingNewsId ? 'Failed to update news post' : 'Failed to create news post'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openNewsModal = (newsItem = null) => {
    setModalError(null);
    if (newsItem) {
      setEditingNewsId(newsItem.id);
      setNewsForm({
        title: newsItem.title,
        body: newsItem.body,
      });
    } else {
      setEditingNewsId(null);
      setNewsForm({ title: '', body: '' });
    }
    setShowNewsModal(true);
  };

  const closeNewsModal = () => {
    setShowNewsModal(false);
    setEditingNewsId(null);
    setModalError(null);
    setNewsForm({ title: '', body: '' });
  };

  const handleCollabSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    try {
      await api.post(`/modpacks/${modpackId}/collaborators`, collabForm);
      setShowCollabModal(false);
      setCollabForm({ user_id: '', role: 'editor' });
      fetchData();
    } catch (err) {
      setModalError(err.message || 'Failed to add collaborator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (!window.confirm('Are you sure you want to delete this news post?')) return;
    try {
      await api.delete(`/modpacks/${modpackId}/news/${newsId}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete news post');
    }
  };

  const handleRemoveCollaborator = async (collabUserId) => {
    if (!window.confirm('Are you sure you want to remove this collaborator?')) return;
    try {
      await api.delete(`/modpacks/${modpackId}/collaborators/${collabUserId}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to remove collaborator');
    }
  };

  const handleDeleteModpack = async () => {
    if (!window.confirm('WARNING: Deleting this modpack will permanently remove all of its releases, news posts, and collaborator associations. This cannot be undone. Proceed?')) return;
    try {
      await api.delete(`/modpacks/${modpackId}`);
      navigate('/dashboard');
    } catch (err) {
      alert(err.message || 'Failed to delete modpack');
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <div style={{ color: 'var(--text-secondary)' }}>Loading modpack data…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="icon">⚠️</div>
        <h3>Error loading modpack</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchData}>
          Retry
        </button>
      </div>
    );
  }

  const publishedCount = releases.filter((r) => r.status === 'published').length;
  const draftCount = releases.filter((r) => r.status === 'draft').length;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'releases', label: `Releases (${releases.length})` },
    { key: 'news', label: `News (${news.length})` },
    { key: 'team', label: `Team (${collaborators.length + 1})` }, // Includes owner
  ];

  return (
    <div className="modpack-detail animate-in">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="modpack-detail-header">
        <div className="modpack-detail-header-inner">
          <div className="modpack-detail-title-row">
            <h1>
              {modpack.name}
              <span className={`badge ${modpack.visibility === 'public' ? 'badge-green' : 'badge-yellow'}`}>
                {modpack.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
              </span>
            </h1>
            <div className="modpack-detail-actions">
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDeleteModpack}
              >
                Delete Modpack
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowReleaseModal(true)}
              >
                + New Release
              </button>
            </div>
          </div>
          <p className="modpack-detail-subtitle">
            {modpack.game} · {modpack.game_version} · {modpack.loader}
            {modpack.description && <> — {modpack.description}</>}
          </p>

          {/* ── Tabs ───────────────────────────────────────────── */}
          <div className="tabs">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
                id={`tab-${t.key}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────── */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <OverviewTab
            publishedCount={publishedCount}
            draftCount={draftCount}
            teamCount={collaborators.length + 1}
            newsCount={news.length}
            latestRelease={releases.find((r) => r.status === 'published')}
            latestNews={news[0]}
          />
        )}
        {activeTab === 'releases' && (
          <ReleasesTab
            releases={releases}
            onOpenModal={() => setShowReleaseModal(true)}
          />
        )}
        {activeTab === 'news' && (
          <NewsTab
            news={news}
            onOpenModal={() => openNewsModal()}
            onEdit={openNewsModal}
            onDelete={handleDeleteNews}
          />
        )}
        {activeTab === 'team' && (
          <TeamTab
            ownerId={modpack.owner_id}
            collaborators={collaborators}
            onOpenModal={() => setShowCollabModal(true)}
            onRemove={handleRemoveCollaborator}
          />
        )}
      </div>

      {/* ── New Release Modal ──────────────────────────────────── */}
      {showReleaseModal && (
        <div className="modal-overlay" onClick={() => setShowReleaseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Publish New Release</h2>
              <button className="modal-close" onClick={() => setShowReleaseModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleReleaseSubmit}>
              <div className="modal-body">
                {modalError && (
                  <div className="badge badge-red" style={{ display: 'block', width: '100%', padding: '0.65rem', marginBottom: '1.2rem', textAlign: 'center', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                    ⚠️ {modalError}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="rel-version">Version</label>
                  <input
                    type="text"
                    id="rel-version"
                    value={releaseForm.version}
                    onChange={(e) => setReleaseForm({ ...releaseForm, version: e.target.value })}
                    required
                    placeholder="e.g. 1.0.0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="rel-url">Download URL</label>
                  <input
                    type="url"
                    id="rel-url"
                    value={releaseForm.download_url}
                    onChange={(e) => setReleaseForm({ ...releaseForm, download_url: e.target.value })}
                    placeholder="e.g. https://example.com/modpack.zip"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="rel-status">Status</label>
                  <select
                    id="rel-status"
                    className="select-input"
                    value={releaseForm.status}
                    onChange={(e) => setReleaseForm({ ...releaseForm, status: e.target.value })}
                    required
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="yanked">Yanked</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="rel-changelog">Changelog</label>
                  <textarea
                    id="rel-changelog"
                    className="select-input"
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    value={releaseForm.changelog}
                    onChange={(e) => setReleaseForm({ ...releaseForm, changelog: e.target.value })}
                    required
                    placeholder="Describe what changed in this version..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowReleaseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting…' : 'Create Release'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── New News Modal ─────────────────────────────────────── */}
      {showNewsModal && (
        <div className="modal-overlay" onClick={closeNewsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingNewsId ? 'Update News Post' : 'Publish News Post'}</h2>
              <button className="modal-close" onClick={closeNewsModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleNewsSubmit}>
              <div className="modal-body">
                {modalError && (
                  <div className="badge badge-red" style={{ display: 'block', width: '100%', padding: '0.65rem', marginBottom: '1.2rem', textAlign: 'center', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                    ⚠️ {modalError}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="news-title">Title</label>
                  <input
                    type="text"
                    id="news-title"
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                    required
                    placeholder="e.g. Server Migration Details"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="news-body">Body</label>
                  <textarea
                    id="news-body"
                    className="select-input"
                    style={{ minHeight: '150px', resize: 'vertical' }}
                    value={newsForm.body}
                    onChange={(e) => setNewsForm({ ...newsForm, body: e.target.value })}
                    required
                    placeholder="Write your announcement body here..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeNewsModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (editingNewsId ? 'Updating…' : 'Posting…') : (editingNewsId ? 'Update Post' : 'Publish Post')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Collaborator Modal ─────────────────────────────── */}
      {showCollabModal && (
        <div className="modal-overlay" onClick={() => setShowCollabModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invite Collaborator</h2>
              <button className="modal-close" onClick={() => setShowCollabModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCollabSubmit}>
              <div className="modal-body">
                {modalError && (
                  <div className="badge badge-red" style={{ display: 'block', width: '100%', padding: '0.65rem', marginBottom: '1.2rem', textAlign: 'center', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                    ⚠️ {modalError}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="collab-uid">User ID</label>
                  <input
                    type="text"
                    id="collab-uid"
                    value={collabForm.user_id}
                    onChange={(e) => setCollabForm({ ...collabForm, user_id: e.target.value })}
                    required
                    placeholder="Paste collaborator's MongoDB ObjectId"
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    Collaborators must share their account User ID to be added.
                  </p>
                </div>
                <div className="form-group">
                  <label htmlFor="collab-role">Role</label>
                  <select
                    id="collab-role"
                    className="select-input"
                    value={collabForm.role}
                    onChange={(e) => setCollabForm({ ...collabForm, role: e.target.value })}
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCollabModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Inviting…' : 'Add Collaborator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function OverviewTab({ publishedCount, draftCount, teamCount, newsCount, latestRelease, latestNews }) {
  return (
    <>
      <div className="stats-row animate-in">
        <div className="stat-card">
          <div className="stat-label">Published Releases</div>
          <div className="stat-value">{publishedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Drafts</div>
          <div className="stat-value">{draftCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Team Members</div>
          <div className="stat-value">{teamCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">News Posts</div>
          <div className="stat-value">{newsCount}</div>
        </div>
      </div>

      {latestRelease && (
        <div className="animate-in" style={{ animationDelay: '0.1s' }}>
          <div className="section-header">
            <h2>Latest Release</h2>
          </div>
          <div className="news-item" style={{ marginBottom: '2rem' }}>
            <h3>
              v{latestRelease.version}{' '}
              <span className={`badge ${STATUS_BADGE[latestRelease.status]}`}>{latestRelease.status}</span>
            </h3>
            <div className="news-meta">
              {formatDateTime(latestRelease.released_at)}
            </div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{latestRelease.changelog}</p>
            {latestRelease.download_url && (
              <a
                href={latestRelease.download_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm"
                style={{ marginTop: '1rem' }}
              >
                📥 Download Package
              </a>
            )}
          </div>
        </div>
      )}

      {latestNews && (
        <div className="animate-in" style={{ animationDelay: '0.2s' }}>
          <div className="section-header">
            <h2>Latest News</h2>
          </div>
          <div className="news-item">
            <h3>{latestNews.title}</h3>
            <div className="news-meta">
              {formatDateTime(latestNews.updated_at || latestNews.created_at)}
            </div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{latestNews.body}</p>
          </div>
        </div>
      )}
    </>
  );
}

function ReleasesTab({ releases, onOpenModal }) {
  return (
    <div className="animate-in">
      <div className="section-header">
        <h2>All Releases</h2>
        <button className="btn btn-primary btn-sm" onClick={onOpenModal}>
          + New Release
        </button>
      </div>

      {releases.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Version</th>
              <th>Status</th>
              <th>Released</th>
              <th>Download URL</th>
              <th>Changelog</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((r) => (
              <tr key={r.id}>
                <td><strong>v{r.version}</strong></td>
                <td>
                  <span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span>
                </td>
                <td>{formatDate(r.released_at)}</td>
                <td>
                  {r.download_url ? (
                    <a href={r.download_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem' }}>
                      Download Link
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td style={{ maxWidth: '340px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.changelog}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">
          <div className="icon">🚀</div>
          <h3>No releases yet</h3>
          <p>Publish your first version of this modpack.</p>
          <button className="btn btn-primary btn-sm" onClick={onOpenModal}>
            + New Release
          </button>
        </div>
      )}
    </div>
  );
}

function NewsTab({ news, onOpenModal, onEdit, onDelete }) {
  return (
    <div className="animate-in">
      <div className="section-header">
        <h2>News & Announcements</h2>
        <button className="btn btn-primary btn-sm" onClick={onOpenModal}>
          + New Post
        </button>
      </div>

      {news.length > 0 ? (
        <div className="news-list">
          {news.map((n) => (
            <div className="news-item" key={n.id} style={{ position: 'relative' }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ position: 'absolute', top: '1rem', right: '5.5rem', padding: '0.3rem 0.5rem' }}
                onClick={() => onEdit(n)}
              >
                Edit
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.3rem 0.5rem', color: 'var(--danger)' }}
                onClick={() => onDelete(n.id)}
              >
                Delete
              </button>
              <h3>{n.title}</h3>
              <div className="news-meta">
                {formatDateTime(n.updated_at || n.created_at)}
                {n.updated_at && n.updated_at !== n.created_at && (
                  <span style={{ marginLeft: '0.5rem' }}>Edited</span>
                )}
              </div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{n.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon">📢</div>
          <h3>No news posts</h3>
          <p>Share updates and announcements with your community.</p>
          <button className="btn btn-primary btn-sm" onClick={onOpenModal}>
            + New Post
          </button>
        </div>
      )}
    </div>
  );
}

function TeamTab({ ownerId, collaborators, onOpenModal, onRemove }) {
  return (
    <div className="animate-in">
      <div className="section-header">
        <h2>Team Members</h2>
        <button className="btn btn-primary btn-sm" onClick={onOpenModal}>
          + Invite
        </button>
      </div>

      <div className="collab-grid">
        {/* Owner Card */}
        <div className="collab-card">
          <div className="collab-avatar" style={{ background: 'var(--gradient-brand)' }}>
            ★
          </div>
          <div className="collab-info">
            <div className="name">Owner</div>
            <div className="role">
              <span className="badge badge-green">Owner (User ID: {ownerId})</span>
            </div>
          </div>
        </div>

        {/* Collaborators */}
        {collaborators.map((c) => (
          <div className="collab-card" key={c.id} style={{ position: 'relative' }}>
            <div className="collab-avatar">
              👤
            </div>
            <div className="collab-info">
              <div className="name">User ID: {c.user_id}</div>
              <div className="role">
                <span className={`badge ${ROLE_BADGE[c.role] || 'badge-gray'}`}>{c.role}</span>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              style={{ color: 'var(--danger)', fontSize: '0.9rem', position: 'absolute', top: '0.5rem', right: '0.5rem' }}
              title="Remove Collaborator"
              onClick={() => onRemove(c.user_id)}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ModpackDashboard;
