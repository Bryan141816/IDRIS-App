import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Login.scss";
import LoginHeader from "./LoginHeader";
import { useUserContext } from "../../UserContext";
import { useUserRoleContext } from "../../UserRoleContext";
import Logo1 from "../../media/Logo1.png";
import { Modal } from "./Modals";
import { Link } from "react-router-dom";

const Register = () => {
  const [activeModal, setActiveModal] = useState<String>("");

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [usertype, setUsertype] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

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

  const fnSetUserType = (newUserType: string, newModal: string) => {
    setUsertype(newUserType);
    setActiveModal(newModal);
  };

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

  const navigate = useNavigate(); // make sure this is declared at the top

  const RegisterAs = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validatePassword(password);
    const isValid = Object.values(validation).every(Boolean);

    if (!isValid) {
      alert(
        "Please ensure your password meets all requirements and passwords match",
      );
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(`Registration failed: ${err.detail || "Unknown error"}`);
        return;
      }

      const data = await response.json();
      alert("Registration successful");
      navigate("/login"); // navigate to login page after success (optional)
    } catch (error) {
      console.error("Registration error:", error);
      alert("Failed to register. Check your network or server.");
    }
  };
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/register";
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
        <h1>Signup</h1>
        <form onSubmit={RegisterAs}>
          <div className="input-group">
            <i className="fas fa-envelope input-icon"></i>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <i className="fas fa-user fa-user input-icon"></i>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
          {showValidation && (
            <div className="password-validation">
              <div
                className={`validation-item ${passwordValidation.length ? "valid" : "invalid"}`}
              >
                <i
                  className={`fas ${passwordValidation.length ? "fa-check-circle" : "fa-times-circle"}`}
                ></i>
                <span>At least 8 characters</span>
              </div>
              <div
                className={`validation-item ${passwordValidation.uppercase ? "valid" : "invalid"}`}
              >
                <i
                  className={`fas ${passwordValidation.uppercase ? "fa-check-circle" : "fa-times-circle"}`}
                ></i>
                <span>One uppercase letter</span>
              </div>
              <div
                className={`validation-item ${passwordValidation.lowercase ? "valid" : "invalid"}`}
              >
                <i
                  className={`fas ${passwordValidation.lowercase ? "fa-check-circle" : "fa-times-circle"}`}
                ></i>
                <span>One lowercase letter</span>
              </div>
              <div
                className={`validation-item ${passwordValidation.number ? "valid" : "invalid"}`}
              >
                <i
                  className={`fas ${passwordValidation.number ? "fa-check-circle" : "fa-times-circle"}`}
                ></i>
                <span>One number</span>
              </div>
              <div
                className={`validation-item ${passwordValidation.special ? "valid" : "invalid"}`}
              >
                <i
                  className={`fas ${passwordValidation.special ? "fa-check-circle" : "fa-times-circle"}`}
                ></i>
                <span>One special character</span>
              </div>
            </div>
          )}
          <div className="input-group">
            <i className="fas fa-lock input-icon"></i>
            <input
              type="password"
              id="password2"
              name="password2"
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
                ></i>
                <span>
                  {passwordValidation.match
                    ? "Passwords match"
                    : "Passwords do not match"}
                </span>
              </div>
            </div>
          )}
          <Link to="/login">Login</Link>
          <button type="submit">Signup</button>
        </form>
        <button onClick={handleGoogleLogin}>Register via Google</button>
      </div>
      {/* <Modal */}
      {/*   isOpen={activeModal == "user-type" ? true : false} */}
      {/*   onClose={() => setActiveModal("")} */}
      {/* > */}
      {/*   <h3 id="login-modal-title">Register As</h3> */}
      {/*   <hr /> */}
      {/*   <div id="select-userType"> */}
      {/*     <button */}
      {/*       id="admin" */}
      {/*       onClick={() => fnSetUserType("admin", "admin-role")} */}
      {/*     > */}
      {/*       Admin */}
      {/*     </button> */}
      {/*     <button id="user" onClick={() => fnSetUserType("user", "user-role")}> */}
      {/*       User */}
      {/*     </button> */}
      {/*   </div> */}
      {/* </Modal> */}
      {/**/}
      {/* <Modal */}
      {/*   isOpen={activeModal == "user-role" ? true : false} */}
      {/*   onClose={() => setActiveModal("")} */}
      {/* > */}
      {/*   <h3 id="login-user-role">Select User Role</h3> */}
      {/*   <hr /> */}
      {/*   <div id="select-userRole"> */}
      {/*     <button id="generic" onClick={() => RegisterAs("generic")}> */}
      {/*       Generic User */}
      {/*     </button> */}
      {/*   </div> */}
      {/* </Modal> */}
      {/**/}
      {/* <Modal */}
      {/*   isOpen={activeModal == "admin-role" ? true : false} */}
      {/*   onClose={() => setActiveModal("")} */}
      {/* > */}
      {/*   <h3 id="admin-user-role">Select User Role</h3> */}
      {/*   <hr /> */}
      {/*   <div id="select-adminRole"> */}
      {/*     <button */}
      {/*       id="staff" */}
      {/*       onClick={() => RegisterAs("disaster response admin")} */}
      {/*     > */}
      {/*       Disaster Response Admin */}
      {/*     </button> */}
      {/*     <button */}
      {/*       id="logistics-admin" */}
      {/*       onClick={() => RegisterAs("logistics admin")} */}
      {/*     > */}
      {/*       Logistics Admin */}
      {/*     </button> */}
      {/*     <button */}
      {/*       id="operations-admin" */}
      {/*       onClick={() => RegisterAs("operations admin")} */}
      {/*     > */}
      {/*       Operations Admin */}
      {/*     </button> */}
      {/*     <button */}
      {/*       id="finance-admin" */}
      {/*       onClick={() => RegisterAs("finance admin")} */}
      {/*     > */}
      {/*       Finance Admin */}
      {/*     </button> */}
      {/*     <button id="lgu" onClick={() => RegisterAs("lgu")}> */}
      {/*       LGU Officer */}
      {/*     </button> */}
      {/*   </div> */}
      {/* </Modal> */}
    </section>
  );
};
export default Register;
