import { useState } from "react";
import { useNavigate  } from 'react-router-dom';
import './styles/Login.scss';
import LoginHeader from "./LoginHeader";
import { useUserRoleContext } from "../../UserRoleContext";
import Logo1 from "../../media/Logo1.png";
import { Link } from "react-router-dom";
import {loginUser, fetchCurrentUser } from "../../API_Handler/auth.ts";
import { useUserContext } from '../../UserContext';



const Login = () => {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { setUserRole } = useUserRoleContext();
  const { setUserType } = useUserContext();

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) =>{
    e.preventDefault();
    try{
      await loginUser(username,password);
      const userData = await fetchCurrentUser();

      setUserType("user");
      console.log(userData["roles"][0])
      setUserRole(userData["roles"][0]);
      navigate('/donations_management/donations_dashboard');
    }
    catch(error){
      console.error('Login failed: ', error);
      alert('Invalid credentials');
    }
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
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <i className="fas fa-envelope input-icon"></i>
            <input
              type="email"
              id="username"
              name="username"
              placeholder="Email"
              value={username}
              onChange={e => setUsername(e.target.value)}
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
              value={password}
              onChange={e=>setPassword(e.target.value)}
              // required
            />
          </div>
          <Link to="/register">Signup</Link>
          <button type="submit">Login</button>
        </form>
      </div>
    </section>
  );
}
export default Login;
