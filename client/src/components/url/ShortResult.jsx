import React from "react";

const ShortResult = ({ shortUrl }) => {
  if (!shortUrl) return null;

  const fullUrl = `${process.env.REACT_APP_REDIRECT_BASE || "http://localhost:3001"}/${shortUrl}`;

  return (
    <div className="alert alert-success mt-4">
      <strong>Short URL:</strong>{" "}
      <a href={fullUrl} target="_blank" rel="noreferrer">
        {fullUrl}
      </a>

      <button
        className="btn btn-sm btn-outline-secondary ms-3"
        onClick={() => navigator.clipboard.writeText(fullUrl)}
      >
        Copy
      </button>
    </div>
  );
};

export default ShortResult;
