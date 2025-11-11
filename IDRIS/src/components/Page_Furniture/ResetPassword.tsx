import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Login.scss";
import LoginHeader from "./LoginHeader";

import Logo1 from "../../media/logo1.png";

import { useLocation } from "react-router-dom";
import { API } from "../../API_Handler/Axio_API_Handler";
const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const API_URL = API.defaults.baseURL;
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false,
  });

  const [showValidation, setShowValidation] = useState(false);
  const [showMatchValidation, setShowMatchValidation] = useState(false);

  const validatePassword = (pwd: string) => {
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      match: pwd === password2 && pwd !== "",
    };
  };

  useEffect(() => {
    if (password) {
      const validation = validatePassword(password);
      setPasswordValidation(validation);
      setShowValidation(true);
    } else {
      setShowValidation(false);
    }
  }, [password, password2]);

  useEffect(() => {
    if (password2) {
      setShowMatchValidation(true);
      setPasswordValidation((prev) => ({
        ...prev,
        match: password === password2 && password !== "",
      }));
    } else {
      setShowMatchValidation(false);
    }
  }, [password, password2]);

  const handleSubmit = async () => {
    if (!token) {
      setError("Reset token is missing or invalid.");
      return;
    }

    if (!passwordValidation.match) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(API_URL + "/reset_password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, token }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(data.message || "Password updated successfully.");
        setTimeout(() => navigate("/login"), 2000); // redirect after success
      } else {
        const err = await res.json();
        setError(err.detail || "Failed to reset password.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate(); // make sure this is declared at the top
  return (
    <section id="login-section">
      <LoginHeader />
      <div id="logo">
        <div id="logo-head">
          <img src={Logo1} alt="logo1" />
          <p>IDRIS</p>
        </div>
        <p id="logo-app-name">
          Integrated Disaster Response Information System
        </p>
      </div>
      <div id="login-form">
        <h1>Update Password</h1>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="input-group">
            <i className="fas fa-lock input-icon"></i>
            <input
              type="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* ✅ Show password rules */}
          {showValidation && (
            <div className="password-validation">
              <div
                className={`validation-item ${passwordValidation.length ? "valid" : "invalid"}`}
              >
                <i
                  className={`fas ${passwordValidation.length ? "fa-check-circle" : "fa-times-circle"}`}
                />
                <span>At least 8 characters</span>
              </div>
              <div
                className={`validation-item ${passwordValidation.uppercase ? "valid" : "invalid"}`}
              >
                <i
                  className={`fas ${passwordValidation.uppercase ? "fa-check-circle" : "fa-times-circle"}`}
                />
                <span>One uppercase letter</span>
              </div>
              <div
                className={`validation-item ${passwordValidation.lowercase ? "valid" : "invalid"}`}
              >
                <i
                  className={`fas ${passwordValidation.lowercase ? "fa-check-circle" : "fa-times-circle"}`}
                />
                <span>One lowercase letter</span>
              </div>
              <div
                className={`validation-item ${passwordValidation.number ? "valid" : "invalid"}`}
              >
                <i
                  className={`fas ${passwordValidation.number ? "fa-check-circle" : "fa-times-circle"}`}
                />
                <span>One number</span>
              </div>
              <div
                className={`validation-item ${passwordValidation.special ? "valid" : "invalid"}`}
              >
                <i
                  className={`fas ${passwordValidation.special ? "fa-check-circle" : "fa-times-circle"}`}
                />
                <span>One special character</span>
              </div>
            </div>
          )}

          <div className="input-group">
            <i className="fas fa-lock input-icon"></i>
            <input
              type="password"
              id="password2"
              placeholder="Confirm Password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
            />
          </div>

          {showMatchValidation && (
            <div className="password-match-validation">
              <div
                className={`validation-item ${passwordValidation.match ? "valid" : "invalid"}`}
              >
                <i
                  className={`fas ${passwordValidation.match ? "fa-check-circle" : "fa-times-circle"}`}
                />
                <span>
                  {passwordValidation.match
                    ? "Passwords match"
                    : "Passwords do not match"}
                </span>
              </div>
            </div>
          )}

          {/* ✅ Button */}
          <button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
        </form>
      </div>
    </section>
  );
};
export default UpdatePassword;
