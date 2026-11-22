import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { getUserUrls, shortenUrl } from "../services/urlService";
import ShortenForm from "../components/url/ShortenForm";
import Loader from "../components/common/Loader";

const Dashboard = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [error, setError] = useState(null);

  const redirectBase =
    process.env.REACT_APP_REDIRECT_BASE || "http://localhost:3001/api/v1";

  const fetchUrls = useCallback(async () => {
    try {
      const res = await getUserUrls();
      setUrls(res.data);
    } catch (err) {
      console.error("Failed to load URLs:", err);
      setError("Failed to load your shortened URLs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUrls();
    }
  }, [token, fetchUrls]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleShorten = async (long, ttl) => {
    setSubmitting(true);
    setError(null);
    try {
      await shortenUrl(long, ttl);
      await fetchUrls();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to shorten URL.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (fullShortUrl, code) => {
    navigator.clipboard.writeText(fullShortUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalClicks = urls.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

  return (
    <div className="container mt-4 mb-5" style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-0">Analytics Dashboard</h2>
          <p className="text-muted small mb-0">
            Logged in as: <strong>{user?.email}</strong>
          </p>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={fetchUrls}
          disabled={loading}
        >
          ↻ Refresh Analytics
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm border-0 p-3">
            <span className="text-muted small text-uppercase fw-semibold">
              Total Links Created
            </span>
            <h2 className="fw-bold text-primary mt-1 mb-0">{urls.length}</h2>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm border-0 p-3">
            <span className="text-muted small text-uppercase fw-semibold">
              Total Redirect Clicks (Async Pipeline)
            </span>
            <h2 className="fw-bold text-success mt-1 mb-0">{totalClicks}</h2>
          </div>
        </div>
      </div>

      {/* Create New Short URL */}
      <div className="mb-4">
        <ShortenForm onSubmit={handleShorten} loading={submitting} />
        {error && <div className="alert alert-danger mt-3 py-2 small">{error}</div>}
      </div>

      {/* URLs Table */}
      <div className="card shadow-sm border-0 p-3">
        <h5 className="fw-bold mb-3">Your Shortened URLs</h5>

        {loading ? (
          <Loader text="Loading your URLs..." />
        ) : urls.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <p className="mb-0">No links generated yet. Shorten your first URL above!</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">Short Link</th>
                  <th scope="col">Original Destination</th>
                  <th scope="col" className="text-center">Clicks</th>
                  <th scope="col">Expires</th>
                  <th scope="col" className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((item) => {
                  const fullShortUrl = `${redirectBase}/${item.short}`;
                  const isExpired =
                    item.expiresAt && new Date(item.expiresAt) < new Date();

                  return (
                    <tr key={item._id}>
                      <td>
                        <a
                          href={fullShortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="fw-bold text-decoration-none"
                        >
                          /{item.short}
                        </a>
                      </td>
                      <td
                        className="text-truncate text-muted"
                        style={{ maxWidth: "240px" }}
                        title={item.long}
                      >
                        {item.long}
                      </td>
                      <td className="text-center">
                        <span className="badge bg-success-subtle text-success px-2 py-1">
                          {item.clicks || 0} clicks
                        </span>
                      </td>
                      <td>
                        {item.expiresAt ? (
                          isExpired ? (
                            <span className="badge bg-danger">Expired</span>
                          ) : (
                            <small className="text-muted">
                              {new Date(item.expiresAt).toLocaleDateString()}
                            </small>
                          )
                        ) : (
                          <small className="text-muted">Never</small>
                        )}
                      </td>
                      <td className="text-end">
                        <button
                          className={`btn btn-sm ${
                            copiedCode === item.short
                              ? "btn-success"
                              : "btn-outline-primary"
                          }`}
                          onClick={() => handleCopy(fullShortUrl, item.short)}
                        >
                          {copiedCode === item.short ? "Copied!" : "Copy Link"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
