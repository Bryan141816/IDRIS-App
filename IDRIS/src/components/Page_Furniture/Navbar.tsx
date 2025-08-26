import "./styles/Navbar.scss";
import logo1 from "../../media/logo1.webp";
import { Volunteer, LGU, Response, Donations } from "./Icons";
import { useUserContext } from "../../UserContext";
import { useUserRoleContext } from "../../UserRoleContext";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import React from "react";

interface NavbarProps {
  isVisible: boolean;
  onClose: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isVisible, onClose }) => {
  const { userType } = useUserContext();
  const { userRoles } = useUserRoleContext();

  // FOR NAVIGATION BAR ACTIVE PAGE
  const [activeNav, setActiveNav] = useState<string | null>(null);

  const toggleNav = (navId: string) => {
    setActiveNav((prev) => (prev === navId ? null : navId));
  };

  // FOR MOBILE NAVIGATION BAR SHOW/HIDE STATUS
  const sidebarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, onClose]);
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const anchor = target.closest("a");

      if (anchor) {
        if (anchor.classList.contains("non-redirect")) {
          event.preventDefault();
          return;
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <nav
      ref={sidebarRef}
      className={`navbar ${isVisible ? "show-navbar" : ""}`}
    >
      <div id="sidebar-logo-container">
        <img
          src={logo1}
          alt="sidebar-logo.png"
          style={{
            width: "3.5vw",
            height: "3.5vw",
          }}
        />
        <p>IDRIS</p>
      </div>

      <div id="nav-links">
        { userRoles.includes("") && <div className="nav-items" id="lgu-profiling">
          <div
            className={`flex-control ${activeNav === "lgu" ? "active" : ""}`}
            onClick={() => {
              toggleNav("lgu");
            }}
          >
            <LGU width={14} height={14} className="sidebar-icons" />
            {userType == "admin" && (
              <a href="" className="non-redirect">
                LGU PROFILING
              </a>
            )}
            {userType == "user" && (
              <a href="#" className="non-redirect">
                LOCAL GOVERNMENT UNIT
              </a>
            )}
          </div>
          <div
            className={`nav-sub-items ${activeNav === "lgu" ? "active" : ""}`}
          >
            {/* Sub items here */}
            <Link
              to="/lgu_profiling/map_of_cebu"
              prefetch-link="/lgu_profiling/map_of_cebu"
              className="nav-sub-item"
              onClick={() => {
                onClose();
              }}
            >
              Map of Cebu
            </Link>
          </div>
          { userType == "lgu" && <div
            className={`nav-sub-items ${activeNav === "lgu" ? "active" : ""}`}
          >
            {/* Sub items here */}
            <Link
              to="/lgu_profiling/evacuationandshelter"
              prefetch-link="/lgu_profiling/evacuationandshelter"
              className="nav-sub-item"
              onClick={() => {
                onClose();
              }}
            >
              Evacuation and Shelter Management
            </Link>
          </div>}
          { userType == "lgu" && <div
            className={`nav-sub-items ${activeNav === "lgu" ? "active" : ""}`}
          >
            {/* Sub items here */}
            <Link
              to="/lgu_profiling/LGUmanagement"
              prefetch-link="/lgu_profiling/LGUmanagement"
              className="nav-sub-item"
              onClick={() => {
                onClose();
              }}
            >
              Pin Location Management
            </Link>
          </div>}
        </div>}


        { (
            userRoles.includes("generic") || 
            userRoles.includes("volunteer") || 
            userRoles.includes("donor") || 
            userRoles.includes("operations admin") || 
            userRoles.includes("operations admin") || 
            userRoles.includes("finance admin")
          ) && <div className="nav-items" id="volunteer">
          <div
            className={`flex-control ${activeNav === "volunteer" ? "active" : ""}`}
            onClick={() => {
              toggleNav("volunteer");
            }}
          >
            <Volunteer width={14} height={14} className="sidebar-icons" />
            {/* { userRole != "logistics admin" && <a href="#">VOLUNTEER</a> } */}
            {userType != "" && !userRoles.includes("operations admin") && (
              <a href="#" className="non-redirect">
                VOLUNTEER
              </a>
            )}
            {userType != "" && userRoles.includes("operations admin") && (
              <a href="#" className="non-redirect">
                VOLUNTEER MANAGEMENT
              </a>
            )}
          </div>
          <div
            className={`nav-sub-items ${activeNav === "volunteer" ? "active" : ""}`}
          >
            {/* Sub items here */}
            <Link
              to="/volunteer_management/volunteer_dashboard"
              prefetch-link="/volunteer_management/volunteer_dashboard"
              className="nav-sub-item"
              onClick={() => {
                onClose();
              }}
            >
              Volunteer Dashboard
            </Link>
            {userRoles.includes("operations admin") ||
              (userRoles.includes("volunteer") && (
                <Link
                  to="/volunteer_management/track_volunteer_application"
                  prefetch-link="/volunteer_management/track_volunteer_application"
                  className="nav-sub-item"
                  onClick={() => {
                    onClose();
                  }}
                >
                  Track Volunteer Application
                </Link>
              ))}
            {userRoles.includes("operations admin") && (
              <Link
                to="/volunteer_management/volunteer_profiles"
                prefetch-link="/volunteer_management/volunteer_profiles"
                className="nav-sub-item"
                onClick={() => {
                  onClose();
                }}
              >
                Volunteer Profiles
              </Link>
            )}
            {userRoles.includes("volunteer") && (
              <Link
                to="/volunteer_management/volunteer_assignment"
                prefetch-link="/volunteer_management/volunteer_assignment"
                className="nav-sub-item"
                onClick={() => {
                  onClose();
                }}
              >
                Volunteer Assignment
              </Link>
            )}
          </div>
        </div>}

        { ( userRoles.includes("generic") ||
            userRoles.includes("volunteer") || 
            userRoles.includes("donor") || 
            userRoles.includes("operations admin") || 
            userRoles.includes("finance admin")
          ) && <div className="nav-items" id="donations">
          <div
            className={`flex-control ${activeNav === "donations" ? "active" : ""}`}
            onClick={() => {
              toggleNav("donations");
            }}
          >
            <Donations width={14} height={14} className="sidebar-icons" />
            { userType == "admin" && (
              <a href="#" className="non-redirect">
                DONATIONS MANAGEMENT
              </a>
            )}
            { userType != "admin" && (
              <a href="#" className="non-redirect">
                DONATIONS
              </a>
            )}
          </div>
          <div
            className={`nav-sub-items ${activeNav === "donations" ? "active" : ""}`}
          >
            {/* Sub items here */}
            { userRoles.includes("donor") || userRoles.includes("generic") &&
              <Link
                to="/donor_profile"
                prefetch-link="/donor_profile"
                className="nav-sub-item"
                onClick={() => {
                  onClose();
                }}
              >
                Donor Profile
              </Link>
            }
            <Link
              to="/donations_management/donations_dashboard"
              prefetch-link="/donations_management/donations_dashboard"
              className="nav-sub-item"
              onClick={() => {
                onClose();
              }}
            >
              Donations Dashboard
            </Link>
            <Link
              to="/donations_management/list_of_rafi_donors"
              prefetch-link="/donations_management/list_of_rafi_donors"
              className="nav-sub-item"
              onClick={() => {
                onClose();
              }}
            >
              List of RAFI Donors
            </Link>
            <Link
              to="/donations_management/funding_proposals"
              prefetch-link="/donations_management/funding_proposals"
              className="nav-sub-item"
              onClick={() => {
                onClose();
              }}
            >
              Funding Proposals
            </Link>
          </div>
        </div>}

        <div className="nav-items" id="response">
          <div
            className={`flex-control ${activeNav === "response" ? "active" : ""}`}
            onClick={() => {
              toggleNav("response");
            }}
          >
            <Response width={14} height={14} className="sidebar-icons" />
            <Link
              to="/response_dashboard"
              prefetch-link="/response_dashboard"
              onClick={() => {
                onClose();
              }}
            >
              RESPONSE DASHBOARD
            </Link>
          </div>
          <div
            className={`nav-sub-items ${activeNav === "response" ? "active" : ""}`}
          >
            {/* Sub items here */}
          </div>
        </div>

        {userRoles.includes("logistics admin") && userType == "admin" && (
          <div className="nav-items" id="reports-generation">
            <div
              className={`flex-control ${activeNav === "reports" ? "active" : ""}`}
              onClick={() => {
                toggleNav("reports");
              }}
            >
              <Response width={14} height={14} className="sidebar-icons" />
              <Link
                to="/reports_generation"
                prefetch-link="/reports_generation"
                onClick={() => {
                  onClose();
                }}
              >
                REPORTS GENERATION
              </Link>
            </div>
            <div
              className={`nav-sub-items ${activeNav === "reports" ? "active" : ""}`}
            >
              {/* Sub items here */}
            </div>
          </div>
        )}

        {userRoles.includes("disaster response admin") &&
          userType == "admin" && (
            <div className="nav-items" id="damage-assessment">
              <div
                className={`flex-control ${activeNav === "damage" ? "active" : ""}`}
                onClick={() => {
                  toggleNav("damage");
                }}
              >
                <Response width={14} height={14} className="sidebar-icons" />
                <Link
                  to="/damage_assessment"
                  prefetch-link="/damage_assessment"
                  onClick={() => {
                    onClose();
                  }}
                >
                  DAMAGE ASSESSMENT
                </Link>
              </div>
              <div
                className={`nav-sub-items ${activeNav === "damage" ? "active" : ""}`}
              >
                {/* Sub items here */}
              </div>
            </div>
          )}

        {userRoles.includes("logistics admin") && userType == "admin" && (
          <div className="nav-items" id="procurement-inventory">
            <div
              className={`flex-control ${activeNav === "procurement" ? "active" : ""}`}
              onClick={() => {
                toggleNav("procurement");
              }}
            >
              <Response width={14} height={14} className="sidebar-icons" />
              <a href="#" className="non-redirect">
                PROCUREMENT & INVENTORY
              </a>
            </div>
            <div
              className={`nav-sub-items ${activeNav === "procurement" ? "active" : ""}`}
            >
              <Link
                to="/procurement_inventory/procurement_inventory"
                prefetch-link="/procurement_inventory/procurement_inventory"
                className="nav-sub-item"
                onClick={() => {
                  onClose();
                }}
              >
                Inventory and Warehousing
              </Link>
            </div>
            <div
              className={`nav-sub-items ${activeNav === "procurement" ? "active" : ""}`}
            >
              <Link
                to="/procurement_inventory/procurement_management"
                prefetch-link="/procurement_inventory/procurement_management"
                className="nav-sub-item"
                onClick={() => {
                  onClose();
                }}
              >
                Procurement Management
              </Link>
            </div>
            <div
              className={`nav-sub-items ${activeNav === "procurement" ? "active" : ""}`}
            >
              <Link
                to="/procurement_inventory/distribution_planning"
                prefetch-link="/procurement_inventory/distribution_planning"
                className="nav-sub-item"
                onClick={() => {
                  onClose();
                }}
              >
                Distribution Planning & Monitoring
              </Link>
            </div>
          </div>
        )}

        {userRoles.includes("finance admin") && userType == "admin" && (
          <div className="nav-items" id="finance-admin">
            <div
              className={`flex-control ${activeNav === "finance" ? "active" : ""}`}
              onClick={() => {
                toggleNav("finance");
              }}
            >
              <Response width={14} height={14} className="sidebar-icons" />
              <a href="#" className="non-redirect">
                FINANCE & ADMIN
              </a>
            </div>
            <div
              className={`nav-sub-items ${activeNav === "finance" ? "active" : ""}`}
            >
              <Link
                to="/finance&admin/finance_management"
                prefetch-link="/finance&admin/finance_management"
                className="nav-sub-item"
                onClick={() => {
                  onClose();
                }}
              >
                Finance Management
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default React.memo(Navbar);
