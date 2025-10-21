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
import { AlignCenter } from "lucide-react";

const Login = () => {
  const [email, setEmailEntry] = useState("");
  const [password, setPassword] = useState("");
  const [erroMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");


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
        setUserReady(true);
        handleRoleBasedRedirect(userData["roles"], navigate);
      } else {
        throw new Error("Invalid user data received.");
      }
    } catch (error: any) {
      console.error("Login failed: ", error);
      Swal.hideLoading();

      // Default error values
      let errorTitle = "Login Failed";
      let errorText = "An unexpected error occurred. Please try again.";

      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail || "";

        switch (status) {
          case 404:
            errorTitle = "Account Not Found";
            errorText =
              "No account exists with this email address. Please check your email or create a new account by clicking 'Signup' below.";
            break;
          case 401:
            errorTitle = "Incorrect Password";
            errorText =
              "The password you entered is incorrect. Please try again or click 'Forgot Password' to reset it.";
            break;
          case 403:
            errorTitle = "Account Not Activated";
            errorText =
              "Your account has not been activated yet. Please check your email for the activation link or contact the administrator for assistance.";
            break;
          case 400:
            errorTitle = "Invalid Input";
            errorText =
              detail ||
              "Please check that your email and password are in the correct format.";
            break;
          case 500:
            errorTitle = "Server Error";
            errorText =
              "A server error occurred. Please try again later or contact support if the problem persists.";
            break;
          default:
            errorTitle = "Login Error";
            errorText = detail || "Unable to log in at this time. Please try again.";
        }
      } else if (error.request) {
        errorTitle = "Connection Error";
        errorText =
          "Unable to connect to the server. Please check your internet connection and try again.";
      } else if (error.message) {
        errorTitle = "Error";
        errorText = error.message || "An unexpected error occurred.";
      }

      Swal.update({
        icon: "error",
        title: errorTitle,
        text: errorText,
      });

      setErrorMessage(errorText);
      setErrorTitle(errorTitle);
      setShowError(true);
    }
  };
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
      setUserImage(userData["user_profile"]?.profile_image || null);
      setUserReady(true);
      handleRoleBasedRedirect(userData["roles"], navigate);
    } else {
      throw new Error("Invalid user data received.");
    }
  } catch (error: any) {
    console.error("Login failed: ", error);
    Swal.hideLoading();
    
    // Default error values
    let errorTitle = "Login Failed";
    let errorText = "An unexpected error occurred. Please try again.";
    
    // Check if error has response from backend
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || "";
      
      // Handle different HTTP status codes from backend database check
      switch (status) {
        case 404:
          // Backend checked database - account doesn't exist
          errorTitle = "Account Not Found";
          errorText = "No account exists with this email address. Please check your email or create a new account by clicking 'Signup' below.";
          break;
          
        case 401:
          // Backend checked database - account exists but password is wrong
          errorTitle = "Incorrect Password";
          errorText = "The password you entered is incorrect. Please try again or click 'Forgot Password' to reset it.";
          break;
          
        case 403:
          // Backend checked database - account exists but not activated
          errorTitle = "Account Not Activated";
          errorText = "Your account has not been activated yet. Please check your email for the activation link or contact the administrator for assistance.";
          break;
          
        case 400:
          // Bad request - validation error
          errorTitle = "Invalid Input";
          errorText = detail || "Please check that your email and password are in the correct format.";
          break;
          
        case 500:
          // Internal server error
          errorTitle = "Server Error";
          errorText = "A server error occurred. Please try again later or contact support if the problem persists.";
          break;
          
        default:
          // Other backend errors
          errorTitle = "Login Error";
          errorText = detail || "Unable to log in at this time. Please try again.";
      }
    } else if (error.request) {
      // Request was made but no response received - network/connection issue
      errorTitle = "Connection Error";
      errorText = "Unable to connect to the server. Please check your internet connection and try again.";
    } else if (error.message) {
      // Other types of errors
      errorTitle = "Error";
      errorText = error.message || "An unexpected error occurred.";
    }
    
    // Display the error to user
    Swal.update({
      icon: "error",
      title: errorTitle,
      text: errorText,
    });
    
    setErrorMessage(errorText);
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
        <button onClick={handleGoogleLogin}>Login via Google</button>
        <button onClick={handleMicrosoftLogin}>Login via Microsoft</button>
      </div>
    </section>
  );
};
export default Login;
