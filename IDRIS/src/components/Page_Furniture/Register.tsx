import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./styles/Login.scss";
import LoginHeader from "./LoginHeader";
import Logo1 from "../../media/logo1.png";
import { Modal } from "./Modals";
import Swal from 'sweetalert2';

type ModalId = "" | "user-type" | "user-role" | "admin-role";

const Register: React.FC = () => {
    const [activeModal, setActiveModal] = useState<ModalId>("");

    const [email, setEmail] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [userType, setUserType] = useState<"" | "admin" | "user">("");
    const [selectedRole, setSelectedRole] = useState<string>("");

    const [password, setPassword] = useState<string>("");
    const [password2, setPassword2] = useState<string>("");

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

    const navigate = useNavigate();

    const validatePassword = (pwd: string) => ({
        length: pwd.length >= 8,
        uppercase: /[A-Z]/.test(pwd),
        lowercase: /[a-z]/.test(pwd),
        number: /\d/.test(pwd),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
        match: pwd === password2 && pwd !== "",
    });

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

    // Step 1: Validate form, then open the "Register As" (user-type) modal.
    const handleOpenRoleModal = (e?: React.FormEvent<HTMLFormElement>) => {
        if (e) e.preventDefault();

        const validation = validatePassword(password);
        const isValid = Object.values(validation).every(Boolean);

        if (!isValid) {
            Swal.fire({
                icon: "error",
                title: "Password Invalid",
                text: "Please ensure your password meets all requirements and that the passwords match.",
            }); return;
        }
        setActiveModal("user-type");
    };

    // Step 2: Admin/User fork
    const selectUserType = async (type: "admin" | "user") => {
        setUserType(type);
        if (type === "user") {
            setActiveModal("");
            await doRegister("generic", type);
        } else {
            setActiveModal("admin-role");
        }
    };

    // Step 3: Pick role -> call registration API
    const handleRoleSelect = async (role: string) => {
        setSelectedRole(role);
        setActiveModal("");
        await doRegister(role);
    };

    // Actual registration call (unchanged, safe)
    const doRegister = async (roleParam?: string, userTypeParam?: "admin" | "user") => {
        const roleToSend = roleParam || selectedRole; // ✅ use immediate value
        const userTypeToSend = userTypeParam || userType;
        Swal.fire({
            title: "Registering...",
            didOpen: () => {
                Swal.showLoading();
            },
            allowOutsideClick: false,
            allowEscapeKey: false,
        });
        try {
            const response = await fetch("http://localhost:8000/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    username,
                    password,
                    user_type: userTypeToSend,
                    user_role: roleToSend, // ✅ ensures "generic" or admin roles are included
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                Swal.hideLoading();
                Swal.update({
                    icon: "error",
                    title: "Failed to register",
                    text: `Registration failed: ${err.detail || "Unknown error"}`,
                });
            }

            await response.json();
            Swal.hideLoading();
            Swal.update({
                icon: "success",
                title: "Registration successful",
            });
            navigate("/login");
        } catch (error) {
            console.error("Registration error:", error);
            Swal.hideLoading();
            Swal.update({
                icon: "error",
                title: "Network Error",
                text: "Check your network or server",
            });
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8000/auth/register";
    };

    const handleMicrosoftLogin = () => {
        window.location.href = "http://localhost:8000/auth/microsoft/register";
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

                {/* Submit now ONLY opens the modal flow */}
                <form onSubmit={handleOpenRoleModal}>
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
                        <i className="fas fa-user input-icon"></i>
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
                            <div className={`validation-item ${passwordValidation.length ? "valid" : "invalid"}`}>
                                <i className={`fas ${passwordValidation.length ? "fa-check-circle" : "fa-times-circle"}`}></i>
                                <span>At least 8 characters</span>
                            </div>
                            <div className={`validation-item ${passwordValidation.uppercase ? "valid" : "invalid"}`}>
                                <i className={`fas ${passwordValidation.uppercase ? "fa-check-circle" : "fa-times-circle"}`}></i>
                                <span>One uppercase letter</span>
                            </div>
                            <div className={`validation-item ${passwordValidation.lowercase ? "valid" : "invalid"}`}>
                                <i className={`fas ${passwordValidation.lowercase ? "fa-check-circle" : "fa-times-circle"}`}></i>
                                <span>One lowercase letter</span>
                            </div>
                            <div className={`validation-item ${passwordValidation.number ? "valid" : "invalid"}`}>
                                <i className={`fas ${passwordValidation.number ? "fa-check-circle" : "fa-times-circle"}`}></i>
                                <span>One number</span>
                            </div>
                            <div className={`validation-item ${passwordValidation.special ? "valid" : "invalid"}`}>
                                <i className={`fas ${passwordValidation.special ? "fa-check-circle" : "fa-times-circle"}`}></i>
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
                            <div className={`validation-item ${passwordValidation.match ? "valid" : "invalid"}`}>
                                <i className={`fas ${passwordValidation.match ? "fa-check-circle" : "fa-times-circle"}`}></i>
                                <span>
                                    {passwordValidation.match ? "Passwords match" : "Passwords do not match"}
                                </span>
                            </div>
                        </div>
                    )}

                    <Link to="/login">Login</Link>
                    <button type="submit">Signup</button>
                </form>

                <button onClick={handleGoogleLogin}>Register via Google</button>
                <button onClick={handleMicrosoftLogin}>Register via Microsoft</button>
            </div>

            {/* Modal 1: Pick Admin/User */}
            <Modal
                isOpen={activeModal === "user-type"}
                onClose={() => setActiveModal("")}
            >
                <h3 id="login-modal-title">Register As</h3>
                <hr />
                <div id="select-userType" style={{ display: "flex", gap: 12 }}>
                    <button id="admin" onClick={() => selectUserType("admin")}>
                        Admin
                    </button>
                    <button id="user" onClick={() => selectUserType("user")}>
                        User
                    </button>
                </div>
            </Modal>

            {/* Modal 3: Roles for admins */}
            <Modal
                isOpen={activeModal === "admin-role"}
                onClose={() => setActiveModal("")}
            >
                <h3 id="admin-user-role">Select Admin Role</h3>
                <hr />
                <div id="select-adminRole" style={{ display: "grid", gap: 8 }}>
                    <button onClick={() => handleRoleSelect("logistics admin")}>
                        Logistics Admin
                    </button>
                    <button onClick={() => handleRoleSelect("operations admin")}>
                        Operations Admin
                    </button>
                    <button onClick={() => handleRoleSelect("finance admin")}>
                        Finance Admin
                    </button>
                    <button onClick={() => handleRoleSelect("lgu officer")}>
                        LGU Officer
                    </button>
                </div>

            </Modal>
        </section>
    );
};

export default Register;
