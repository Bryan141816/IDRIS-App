import "./styles/footer.scss";
import React from "react";
const Footer = () => {
  return (
    <footer>
      <span>© 2025 | </span>
      <span className="bold">IDRIS</span>
    </footer>
  );
};

export default React.memo(Footer);

