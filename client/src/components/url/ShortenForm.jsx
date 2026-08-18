import React, { useState } from "react";

const ShortenForm = ({ onSubmit, loading }) => {
  const [long, setLong] = useState("");
  const [ttl, setTtl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!long) return;
    onSubmit(long, ttl);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
      <h5 className="mb-3">Shorten a URL</h5>

      <input
        type="url"
        className="form-control mb-3"
        placeholder="Enter long URL"
        value={long}
        onChange={(e) => setLong(e.target.value)}
        required
      />

      <input
        type="number"
        className="form-control mb-3"
        placeholder="TTL in seconds (optional)"
        value={ttl}
        onChange={(e) => setTtl(e.target.value)}
      />

      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Shortening..." : "Shorten"}
      </button>
    </form>
  );
};

export default ShortenForm;
