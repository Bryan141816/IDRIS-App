import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./styles/Login.scss";
import LoginHeader from "./LoginHeader";
import { useUserRoleContext } from "../../UserRoleContext";
import Logo1 from "../../media/logo1.png";
import { Link } from "react-router-dom";
import { loginUser, fetchCurrentUser } from "../../API_Handler/auth.ts";
import { useUserContext } from "../../UserContext";
import { handleRoleBasedRedirect } from "../../utils/handleRoleBasedRedirect.ts";

const Login = () => {
  const [email, setEmailEntry] = useState("");
  const [password, setPassword] = useState("");
  const [erroMessage, setErrorMessage] = useState("");

  const { setUserRoles } = useUserRoleContext();
  const { setUserType, setEmail, setUsername, setUserReady, setUserId } =
    useUserContext();

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    Swal.fire({
      title: "Logging in...",
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
    try {
      await loginUser(email, password);
      const userData = await fetchCurrentUser();

      if (userData) {
//         if (!userData["is_activated"]) {
//           Swal.hideLoading();
//           Swal.update({
//             icon: "warning",
//             title: "Account Not Activated",
//             text: "Your account is not yet activated. Please contact the administrator or check your email for the activation link.",
//           });
//           setErrorMessage("Account is not yet activated.");
//           return;
//         }
        Swal.hideLoading();
        Swal.update({
          icon: "success",
          title: "Logged in successfully!",
        });
        setUserType(userData["user_type"]);
        setUserRoles(userData["roles"]);
        setEmail(userData["email"]);
        setUserId(userData["user_id"]);
        setUsername(userData["username"]);
        setUserReady(true);
        handleRoleBasedRedirect(userData["roles"], navigate);
      } else {
        throw new Error("Invalid user data received.");
      }
    } catch (error) {
      console.error("Login failed: ", error);
      Swal.hideLoading();
      Swal.update({
        icon: "error",
        title: "Login Failed",
        text: "Incorrect email or password. Please try again.",
      });
      setErrorMessage("Incorrect email or password. Please try again.");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/login";
  };
  const handleMicrosoftLogin = () => {
    window.location.href = "http://localhost:8000/auth/microsoft/login";
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
        <h1>login</h1>
        <form onSubmit={handleLogin}>
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
          <div className="input-group">
            <i className="fas fa-lock input-icon"></i>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <span id="log-in-error-message">{erroMessage}</span>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Link to="/register">Signup</Link>
            <Link to="/forgot_password">Forgot Password</Link>
          </div>
          <button type="submit">Login</button>
        </form>
        <button onClick={handleGoogleLogin}>Login via Google</button>
        <button onClick={handleMicrosoftLogin}>Login via Microsoft</button>
      </div>
    </section>
  );
};
export default Login;
