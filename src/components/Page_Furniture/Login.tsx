import { useState } from "react";
import { useNavigate  } from 'react-router-dom';
import './styles/Login.scss';
import LoginHeader from "./LoginHeader";
import { useUserContext } from '../../UserContext';
import Logo1 from "../../media/Logo1.png";
import { Modal } from "./Modals"


const Login = () => {
  const [isModalOpen, setModalStatus] = useState<boolean>(false);

    const { setUserType } = useUserContext();
  const navigate = useNavigate();

  const loginAs = (newUserType: string) => {
    setUserType(newUserType);
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
          <button type="button" onClick={() => setModalStatus(true)}>Login</button>
        </form>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalStatus(false)}>
        <h3 id="login-modal-title">Login as</h3>
        <hr />
        <div id="select-userType">
          <button id="volunteer" onClick={() => loginAs("volunteer")}>Volunteer</button>
          <button id="admin" onClick={() => loginAs("admin")}>Admin</button>
          <button id="user" onClick={() => loginAs("user")}>User</button>
        </div>
      </Modal>
    </section>
  );
}
export default Login;