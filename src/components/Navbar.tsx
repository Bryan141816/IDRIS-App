
import './Navbar.css'; 

const Navbar = () => {
  return (
    <nav className="navbar">
      {/* <h3 className="navbar-brand">MyApp</h3> */}
      <ul className="nav-links">
        <li><a href="#">Home</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;
