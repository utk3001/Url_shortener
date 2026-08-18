import React from "react";

const Loader = ({ text = "Loading..." }) => {
  return (
    <div className="d-flex justify-content-center align-items-center my-4">
      <div className="spinner-border text-primary me-2" role="status" />
      <span className="fw-semibold">{text}</span>
    </div>
  );
};

export default Loader;
