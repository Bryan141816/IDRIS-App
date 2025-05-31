import './styles/LoginHeader.scss';
import RAFIShield from '../../media/RAFI_Shield.png';

const LoginHeader = () => {
  return (
      <div id="login-header">
        <img src={RAFIShield} alt="Rafi_shield" />
        <div id="login-title-container">
          <p id="login-app-name">Integrated Disaster Response Information System</p>
          <p id="login-org-name">RAFI - RAMON ABOITIZ FOUNDATION INC.</p>
        </div>
      </div>
  );
}

export default LoginHeader;