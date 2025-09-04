import { useState } from "react";
import { API } from "../../API_Handler/Axio_API_Handler.ts";
import { useNavigate } from "react-router-dom";
import "./styles/Login.scss";
import LoginHeader from "./LoginHeader";
import { useUserRoleContext } from "../../UserRoleContext";
import Logo1 from "../../media/Logo1.png";
import { Link } from "react-router-dom";
import { loginUser, fetchCurrentUser } from "../../API_Handler/auth.ts";
import { useUserContext } from "../../UserContext";

const ForgotPassword = () => {
  const [email, setEmailEntry] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await API.post("/forgot_password", {
        email: email,
      });

      setMessage(
        response.data.message ||
          "If this email exists, you’ll receive reset instructions.",
      );
    } catch (error: any) {
      console.error(error);
      if (error.response && error.response.data) {
        setMessage(error.response.data.detail || "Something went wrong.");
      } else {
        setMessage("Server error. Try again later.");
      }
    }
  };
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
        <h1>Forgot Password</h1>
        <form onSubmit={handleSubmit}>
          <span>Enter your account email</span>
          <div className="input-group">
            <i className="fas fa-envelope input-icon"></i>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmailEntry(e.target.value)}
              required
            />
          </div>
          <button type="submit">Reset Password</button>
        </form>
        {message && <p className="status-message">{message}</p>}
      </div>
    </section>
  );
};
export default ForgotPassword;
