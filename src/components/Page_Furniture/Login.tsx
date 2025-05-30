import { useState } from "react";
import { useNavigate  } from 'react-router-dom';
import './styles/Login.scss';
import LoginHeader from "./LoginHeader";
import { useUserContext } from '../../UserContext';
import { useUserRoleContext } from "../../UserRoleContext";
import Logo1 from "../../media/Logo1.png";
import { Modal } from "./Modals"


const Login = () => {
  const [activeModal, setActiveModal] = useState<String>("");

  const { setUserType } = useUserContext();
  const { setUserRole } = useUserRoleContext();
  const navigate = useNavigate();

  const fnSetUserType= (newUserType: string, newModal: string) => {
    setUserType(newUserType);
    setActiveModal(newModal);
  }

  const loginAs = (newUserRole: string) => {
    setUserRole(newUserRole);
    navigate('/donations_management/donations_dashboard');
  }

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
        <form>
          <div className="input-group">
            <i className="fas fa-envelope input-icon"></i>
            <input
              type="email"
              id="username"
              name="username"
              placeholder="Email"
              // required
            />
          </div>
          <div className="input-group">
            <i className="fas fa-lock input-icon"></i>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              // required
            />
          </div>
          <button type="button" onClick={() => setActiveModal("user-type")}>Login</button>
        </form>
      </div>

      <Modal isOpen = {activeModal == "user-type" ? true : false} onClose={() => setActiveModal("")}>
        <h3 id="login-modal-title">Login as</h3>
        <hr />
        <div id="select-userType">
          <button id="admin" onClick={() => fnSetUserType("admin", "admin-role")}>Admin</button>
          <button id="user" onClick={() => fnSetUserType("user", "user-role")}>User</button>
        </div>
      </Modal>

      <Modal isOpen = {activeModal == "user-role" ? true : false } onClose={() => setActiveModal("")}>
        <h3 id="login-user-role">Select User Role</h3>
        <hr />
        <div id="select-userRole">
          <button id="staff" onClick={() => loginAs("staff")}>Staff</button>
          <button id="donor" onClick={() => loginAs("donor")}>Donor</button>
          <button id="volunteer" onClick={() => loginAs("volunteer")}>Volunteer</button>
          <button id="ngo-rep" onClick={() => loginAs("ngo representative")}>NGO Representative</button>
          <button id="lgu-rep" onClick={() => loginAs("lgu representative")}>LGU Representative</button>
          <button id="barangay-rep" onClick={() => loginAs("barangay representative")}>Barangay Representative</button>
          <button id="field-rep" onClick={() => loginAs("field representative")}>Field Representative</button>
        </div>
      </Modal>

      <Modal isOpen = {activeModal == "admin-role" ? true : false } onClose={() => setActiveModal("")}>
        <h3 id="admin-user-role">Select User Role</h3>
        <hr />
        <div id="select-adminRole">
          <button id="staff" onClick={() => loginAs("disaster response admin")}>Disaster Response Admin</button>
          <button id="volunteer" onClick={() => loginAs("logistics admin")}>Logistics Admin</button>
          <button id="ngo-rep" onClick={() => loginAs("operations admin")}>Operations Admin</button>
        </div>
      </Modal>

    </section>
  );
}
export default Login;