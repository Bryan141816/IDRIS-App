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
import { API } from "../../API_Handler/Axio_API_Handler.ts";
const Login = () => {
  const [email, setEmailEntry] = useState("");
  const [password, setPassword] = useState("");
  const [erroMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const API_URL = API.defaults.baseURL;
  const { setUserRoles } = useUserRoleContext();
  const {
    setUserType,
    setEmail,
    setUsername,
    setUserReady,
    setUserId,
    setUserImage,
  } = useUserContext();

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous error messages
    setShowError(false);

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
        setUserImage(userData["user_profile"]?.profile_image || null); // ADDED missing setUserImage
        setUserReady(true);
        handleRoleBasedRedirect(userData["roles"], navigate);
      } else {
        throw new Error("Invalid user data received.");
      }
    } catch (error: any) {
      console.error("Login failed: ", error);
      Swal.hideLoading();

      // Default error values
      let backendErrorTitle = "Login Failed";
      let backendErrorText = "An unexpected error occurred. Please try again.";

      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail || "";

        switch (status) {
          case 404:
            backendErrorTitle = "Account Not Found";
            backendErrorText =
              "No account exists with this email address. Please check your email or create a new account by clicking 'Signup' below.";
            break;
          case 401:
            backendErrorTitle = "Incorrect Password";
            backendErrorText =
              "The password you entered is incorrect. Please try again or click 'Forgot Password' to reset it.";
            break;
          case 403:
            backendErrorTitle = "Account Not Activated";
            backendErrorText =
              "Your account has not been activated yet. Please check your email for the activation link or contact the administrator for assistance.";
            break;
          case 400:
            backendErrorTitle = "Invalid Input";
            backendErrorText =
              detail ||
              "Please check that your email and password are in the correct format.";
            break;
          case 500:
            backendErrorTitle = "Server Error";
            backendErrorText =
              "A server error occurred. Please try again later or contact support if the problem persists.";
            break;
          default:
            backendErrorTitle = "Login Error";
            backendErrorText =
              detail || "Unable to log in at this time. Please try again.";
        }
      } else if (error.request) {
        backendErrorTitle = "Connection Error";
        backendErrorText =
          "Unable to connect to the server. Please check your internet connection and try again.";
      } else if (error.message) {
        backendErrorTitle = "Error";
        backendErrorText = error.message || "An unexpected error occurred.";
      }

      Swal.update({
        icon: "error",
        title: backendErrorTitle,
        text: backendErrorText,
      });

      setErrorMessage(backendErrorText);
      setErrorTitle(backendErrorTitle);
      setShowError(true);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = API_URL + "/auth/login";
  };

  const handleMicrosoftLogin = () => {
    window.location.href = API_URL + "/auth/microsoft/login";
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
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          {/* Error Box */}
          {showError && errorTitle && (
            <div className="login-error-container">
              <span className="login-error-message">{errorTitle}</span>
            </div>
          )}
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
          {/* Remove the old span for error message */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Link to="/register">Signup</Link>
            <Link to="/forgot_password">Forgot Password</Link>
          </div>
          <button type="submit">Login</button>
        </form>
        {/* <button onClick={handleGoogleLogin}>Login via Google</button> */}
        {/* <button onClick={handleMicrosoftLogin}>Login via Microsoft</button> */}
      </div>
    </section>
  );
};

export default Login;
