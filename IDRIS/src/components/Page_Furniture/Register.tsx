import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import './styles/Login.scss';
import LoginHeader from "./LoginHeader";
import { useUserContext } from '../../UserContext';
import { useUserRoleContext } from "../../UserRoleContext";
import Logo1 from "../../media/Logo1.png";
import { Modal } from "./Modals"
import { Link } from "react-router-dom";


const Register = () => {
    const [activeModal, setActiveModal] = useState<String>("");

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [usertype, setUsertype] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");


    const fnSetUserType = (newUserType: string, newModal: string) => {
        setUsertype(newUserType);
        setActiveModal(newModal);
    }

    const navigate = useNavigate(); // make sure this is declared at the top

    const RegisterAs = async (newUserRole: string) => {
        if (password !== password2) {
            alert("Passwords do not match");
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    username: username,
                    user_type: usertype, 
                    password: password,
                    roles: [newUserRole]
                })
            });

            if (!response.ok) {
                const err = await response.json();
                alert(`Registration failed: ${err.detail || "Unknown error"}`);
                return;
            }

            const data = await response.json();
            console.log("User registered:", data);
            alert("Registration successful");
            navigate("/login"); // navigate to login page after success (optional)

        } catch (error) {
            console.error("Registration error:", error);
            alert("Failed to register. Check your network or server.");
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
                <h1>Signup</h1>
                <form>
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
                    <Link to="/login">Login</Link>
                    <button type="button" onClick={() => setActiveModal("user-type")}>Signup</button>
                </form>
            </div>
            <Modal isOpen={activeModal == "user-type" ? true : false} onClose={() => setActiveModal("")}>
                <h3 id="login-modal-title">Register As</h3>
                <hr />
                <div id="select-userType">
                    <button id="admin" onClick={() => fnSetUserType("admin", "admin-role")}>Admin</button>
                    <button id="user" onClick={() => fnSetUserType("user", "user-role")}>User</button>
                </div>
            </Modal>

            <Modal isOpen={activeModal == "user-role" ? true : false} onClose={() => setActiveModal("")}>
                <h3 id="login-user-role">Select User Role</h3>
                <hr />
                <div id="select-userRole">
                    <button id="staff" onClick={() => RegisterAs("staff")}>Staff</button>
                    <button id="donor" onClick={() => RegisterAs("donor")}>Donor</button>
                    <button id="volunteer" onClick={() => RegisterAs("volunteer")}>Volunteer</button>
                    <button id="ngo-rep" onClick={() => RegisterAs("ngo representative")}>NGO Representative</button>
                    <button id="lgu-rep" onClick={() => RegisterAs("lgu representative")}>LGU Representative</button>
                    <button id="barangay-rep" onClick={() => RegisterAs("barangay representative")}>Barangay Representative</button>
                    <button id="field-rep" onClick={() => RegisterAs("field representative")}>Field Representative</button>
                </div>
            </Modal>

            <Modal isOpen={activeModal == "admin-role" ? true : false} onClose={() => setActiveModal("")}>
                <h3 id="admin-user-role">Select User Role</h3>
                <hr />
                <div id="select-adminRole">
                    <button id="staff" onClick={() => RegisterAs("disaster response admin")}>Disaster Response Admin</button>
                    <button id="volunteer" onClick={() => RegisterAs("logistics admin")}>Logistics Admin</button>
                    <button id="ngo-rep" onClick={() => RegisterAs("operations admin")}>Operations Admin</button>
                </div>
            </Modal>
        </section>
    );
}
export default Register;
