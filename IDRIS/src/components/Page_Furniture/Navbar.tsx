import "./styles/Navbar.scss";
import logo1 from "../../media/logo1.webp";
import { Volunteer, LGU, Response, Donations } from "./Icons";
import { useUserContext } from "../../UserContext";
import { useUserRoleContext } from "../../UserRoleContext";
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

interface NavbarProps {
  isVisible: boolean;
  onClose: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isVisible, onClose }) => {
  const { userType } = useUserContext();
  const { userRoles } = useUserRoleContext();
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const toggleNav = (id: string) =>
    setActiveNav((prev) => (prev === id ? null : id));

  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isVisible) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible, onClose]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (anchor && anchor.classList.contains("non-redirect")) e.preventDefault();
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const canSeeLGU =
    ((userType === "admin" &&
      (userRoles.includes("lgu officer") ||
       userRoles.includes("disaster response admin") ||
       userRoles.includes("superadmin"))) ||
     userRoles.includes("generic"));

  return (
    <nav
      ref={sidebarRef as React.MutableRefObject<HTMLElement>}
      className={`navbar ${isVisible ? "show-navbar" : ""}`}
    >
      <div id="sidebar-logo-container">
        <img src={logo1} alt="sidebar-logo.png" style={{ width: "3.5vw", height: "3.5vw" }} />
        <p>IDRIS</p>
      </div>

      <div id="nav-links">
        {canSeeLGU && (
          <div className="nav-items" id="lgu-profiling">
            <div
              className={`flex-control ${activeNav === "lgu" ? "active" : ""}`}
              onClick={() => toggleNav("lgu")}
            >
              <LGU width={14} height={14} className="sidebar-icons" />
              <a href="#" className="non-redirect">LGU PROFILING</a>
            </div>
            <div className={`nav-sub-items ${activeNav === "lgu" ? "active" : ""}`}>
              <Link to="/lgu_profiling/map_of_cebu" className="nav-sub-item" onClick={onClose}>
                Map of Cebu
              </Link>
              {(
                (userType === "admin" &&
                 (userRoles.includes("lgu officer") || userRoles.includes("superadmin"))) ||
                (userType === "user" && userRoles.includes("generic"))
              ) && (
                <Link to="/lgu_profiling/evacuationandshelter" className="nav-sub-item" onClick={onClose}>
                  Evacuation and Shelter Management
                </Link>
              )}
              {userType === "admin" &&
               (userRoles.includes("lgu officer") ||
                userRoles.includes("disaster response admin") ||
                userRoles.includes("superadmin")) && (
                <Link to="/lgu_profiling/LGUmanagement" className="nav-sub-item" onClick={onClose}>
                  Pin Location Management
                </Link>
              )}
            </div>
          </div>
        )}

        {(userRoles.includes("generic") ||
          userRoles.includes("volunteer") ||
          userRoles.includes("donor") ||
          userRoles.includes("operations admin") ||
          userRoles.includes("superadmin")) && (
          <div className="nav-items" id="volunteer">
            <div
              className={`flex-control ${activeNav === "volunteer" ? "active" : ""}`}
              onClick={() => toggleNav("volunteer")}
            >
              <Volunteer width={14} height={14} className="sidebar-icons" />
              {!userRoles.includes("operations admin") ? (
                <a href="#" className="non-redirect">VOLUNTEER</a>
              ) : (
                <a href="#" className="non-redirect">VOLUNTEER MANAGEMENT</a>
              )}
            </div>
            <div className={`nav-sub-items ${activeNav === "volunteer" ? "active" : ""}`}>
              <Link
                to="/volunteer_management/volunteer_dashboard"
                prefetch-link="/volunteer_management/volunteer_dashboard"
                className="nav-sub-item"
                onClick={onClose}
              >
                Volunteer Dashboard
              </Link>
            </div>
          </div>
        )}

        {(userRoles.includes("generic") ||
          userRoles.includes("volunteer") ||
          userRoles.includes("donor") ||
          userRoles.includes("operations admin") ||
          userRoles.includes("superadmin")) && (
          <div className="nav-items" id="donations">
            <div
              className={`flex-control ${activeNav === "donations" ? "active" : ""}`}
              onClick={() => toggleNav("donations")}
            >
              <Donations width={14} height={14} className="sidebar-icons" />
              {userType === "admin" ? (
                <a href="#" className="non-redirect">DONATIONS MANAGEMENT</a>
              ) : (
                <a href="#" className="non-redirect">DONATIONS</a>
              )}
            </div>
            <div className={`nav-sub-items ${activeNav === "donations" ? "active" : ""}`}>
              {(userRoles.includes("donor") || userRoles.includes("generic")) && (
                <Link to="/donations_management/donor_profile" prefetch-link="/donations_management/donor_profile" className="nav-sub-item" onClick={onClose}>
                  Donor Profile
                </Link>
              )}
              <Link
                to="/donations_management/donations_dashboard"
                prefetch-link="/donations_management/donations_dashboard"
                className="nav-sub-item"
                onClick={onClose}
              >
                Donations Dashboard
              </Link>
              <Link
                to="/donations_management/list_of_rafi_donors"
                prefetch-link="/donations_management/list_of_rafi_donors"
                className="nav-sub-item"
                onClick={onClose}
              >
                List of RAFI Donors
              </Link>
              <Link
                to="/donations_management/funding_proposals"
                prefetch-link="/donations_management/funding_proposals"
                className="nav-sub-item"
                onClick={onClose}
              >
                Funding Proposals
              </Link>
            </div>
          </div>
        )}

        <div className="nav-items" id="response">
          <div
            className={`flex-control ${activeNav === "response" ? "active" : ""}`}
            onClick={() => toggleNav("response")}
          >
            <Response width={14} height={14} className="sidebar-icons" />
            <Link to="/response_dashboard" onClick={onClose}>
              RESPONSE DASHBOARD
            </Link>
          </div>
          <div className={`nav-sub-items ${activeNav === "response" ? "active" : ""}`} />
        </div>

        {(userType === "admin" &&
          (userRoles.includes("logistics admin") || userRoles.includes("superadmin"))) && (
          <div className="nav-items" id="procurement-inventory">
            <div
              className={`flex-control ${activeNav === "procurement" ? "active" : ""}`}
              onClick={() => toggleNav("procurement")}
            >
              <Response width={14} height={14} className="sidebar-icons" />
              <a href="#" className="non-redirect">PROCUREMENT &amp; INVENTORY</a>
            </div>
            <div className={`nav-sub-items ${activeNav === "procurement" ? "active" : ""}`}>
              <Link
                to="/procurement_inventory/procurement_inventory"
                className="nav-sub-item"
                onClick={onClose}
              >
                Inventory and Warehousing
              </Link>
            </div>
            <div className={`nav-sub-items ${activeNav === "procurement" ? "active" : ""}`}>
              <Link
                to="/procurement_inventory/procurement_management"
                className="nav-sub-item"
                onClick={onClose}
              >
                Procurement Management
              </Link>
            </div>
            <div className={`nav-sub-items ${activeNav === "procurement" ? "active" : ""}`}>
              <Link
                to="/procurement_inventory/distribution_planning"
                className="nav-sub-item"
                onClick={onClose}
              >
                Distribution Planning &amp; Monitoring
              </Link>
            </div>
          </div>
        )}

        {(userRoles.includes("lgu officer")) && (
          <div className="nav-items" id="procurement_request">
            <div
              className={`flex-control ${activeNav === "procurement_request" ? "active" : ""}`}
              onClick={() => toggleNav("procurement_request")}
            >
              <Response width={14} height={14} className="sidebar-icons" />
              <Link to="/request_procurement" onClick={onClose}>
                Request Procurement
              </Link>
            </div>
            <div className={`nav-sub-items ${activeNav === "response" ? "active" : ""}`} />
          </div>
        )}

        {(userType === "admin" &&
          (userRoles.includes("finance admin") || userRoles.includes("superadmin"))) && (
          <div className="nav-items" id="finance-admin">
            <div
              className={`flex-control ${activeNav === "finance" ? "active" : ""}`}
              onClick={() => toggleNav("finance")}
            >
              <Response width={14} height={14} className="sidebar-icons" />
              <a href="#" className="non-redirect">FINANCE &amp; ADMIN</a>
            </div>
            <div className={`nav-sub-items ${activeNav === "finance" ? "active" : ""}`}>
              <Link
                to="/finance&admin/finance_management"
                className="nav-sub-item"
                onClick={onClose}
              >
                Finance Management
              </Link>
            </div>
          </div>
        )}

        {(userType === "admin" && userRoles.includes("superadmin")) && (
          <div className="nav-items" id="user_management">
            <div
              className={`flex-control ${activeNav === "user_management" ? "active" : ""}`}
              onClick={() => toggleNav("user_management")}
            >
              <Volunteer width={14} height={14} className="sidebar-icons" />
              <Link to="/manage_users" onClick={onClose}>
                Manage Users
              </Link>
            </div>
            <div className={`nav-sub-items ${activeNav === "user_management" ? "active" : ""}`} />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
