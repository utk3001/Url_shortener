import React from "react";

const ErrorBanner = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="alert alert-danger alert-dismissible fade show mt-3">
      <strong>Error:</strong> {message}
      {onClose && (
        <button
          type="button"
          className="btn-close"
          onClick={onClose}
        />
      )}
    </div>
  );
};

export default ErrorBanner;
