import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Navigate } from "react-router-dom";
import { loginUser, registerUser } from "../services/authService";
import { loginSuccess } from "../store/authSlice";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = isRegister
        ? await registerUser(email, password)
        : await loginUser(email, password);

      dispatch(loginSuccess(response.data));
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (isRegister ? "Registration failed. Try again." : "Invalid credentials.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "440px" }}>
      <div className="card shadow-sm border-0 p-4">
        <h3 className="text-center mb-1 fw-bold">
          {isRegister ? "Create Account" : "Sign In"}
        </h3>
        <p className="text-center text-muted small mb-4">
          {isRegister
            ? "Sign up to track and manage your shortened URLs"
            : "Enter your credentials to access your analytics dashboard"}
        </p>

        {error && (
          <div className="alert alert-danger py-2 small" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold"
            disabled={loading}
          >
            {loading
              ? isRegister
                ? "Creating account..."
                : "Signing in..."
              : isRegister
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        <hr className="my-4 text-muted" />

        <div className="text-center">
          <button
            type="button"
            className="btn btn-link text-decoration-none small"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister
              ? "Already have an account? Sign In"
              : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
