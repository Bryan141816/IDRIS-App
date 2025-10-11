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

    const [activeNav, setActiveNav] = useState<string | null>(null);
    const toggleNav = (navId: string) =>
        setActiveNav((prev) => (prev === navId ? null : navId));

    // Use HTMLElement because ref is applied to <nav>
    const sidebarRef = useRef<HTMLElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };
        if (isVisible) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isVisible, onClose]);

    // Prevent redirects on .non-redirect anchors
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const anchor = target.closest("a");
            if (anchor && anchor.classList.contains("non-redirect")) {
                event.preventDefault();
            }
        };
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    return (
        <nav
            ref={sidebarRef as React.MutableRefObject<HTMLElement>}
            className={`navbar ${isVisible ? "show-navbar" : ""}`}
        >
            <div id="sidebar-logo-container">
                <img
                    src={logo1}
                    alt="sidebar-logo.png"
                    style={{ width: "3.5vw", height: "3.5vw" }}
                />
                <p>IDRIS</p>
            </div>

            {/* Keep ALL nav-items inside this container */}
            <div id="nav-links">
                {/* LGU PROFILING */}
                {((userType === "admin" &&
                    (userRoles.includes("lgu officer") ||
                        userRoles.includes("disaster response admin"))) ||
                    userRoles.includes("superadmin") ||
                    userRoles.includes("generic")) && (
                        <div className="nav-items" id="lgu-profiling">
                            <div
                                className={`flex-control ${activeNav === "lgu" ? "active" : ""}`}
                                onClick={() => toggleNav("lgu")}
                            >
                                <LGU width={14} height={14} className="sidebar-icons" />
                                <a href="#" className="non-redirect">
                                    LGU PROFILING
                                </a>
                            </div>

                            {/* Keep ALL nav-items inside this container */}
                            <div id="nav-links">
                                {/* LGU PROFILING */}
                                {((userType === "admin" &&
                                    (userRoles.includes("lgu officer") ||
                                        userRoles.includes("disaster response admin")) ||
                                    userRoles.includes("superadmin")) ||
                                    userRoles.includes("generic")) && (
                                        <div className="nav-items" id="lgu-profiling">
                                            <div
                                                className={`flex-control ${activeNav === "lgu" ? "active" : ""}`}
                                                onClick={() => toggleNav("lgu")}
                                            >
                                                <LGU width={14} height={14} className="sidebar-icons" />
                                                <a href="#" className="non-redirect">
                                                    LGU PROFILING
                                                </a>
                                            </div>

                                            <div
                                                className={`nav-sub-items ${activeNav === "lgu" ? "active" : ""}`}
                                            >
                                                {/* Visible to ALL who can see LGU PROFILING (generic + allowed admins) */}
                                                <Link
                                                    to="/lgu_profiling/map_of_cebu"
                                                    className="nav-sub-item"
                                                    onClick={onClose}
                                                >
                                                    Map of Cebu
                                                </Link>
                                                {/* Admin + LGU officer ONLY */}
                                                {(
                                                    // For Admins with LGU Officer or superadmin roles
                                                    (userType === "admin" && (userRoles.includes("lgu officer") || userRoles.includes("superadmin"))) ||
                                                    // For Regular Users with Generic role
                                                    (userType === "user" && userRoles.includes("generic"))
                                                ) && (
                                                        <Link
                                                            to="/lgu_profiling/evacuationandshelter"
                                                            className="nav-sub-item"
                                                            onClick={onClose}
                                                        >
                                                            Evacuation and Shelter Management
                                                        </Link>
                                                    )}

                                                {/* Admin + (LGU officer OR Disaster Response Admin) */}
                                                {userType === "admin" &&
                                                    (userRoles.includes("lgu officer") ||
                                                        userRoles.includes("disaster response admin") ||
                                                        userRoles.includes("superadmin")) && (
                                                        <Link
                                                            to="/lgu_profiling/LGUmanagement"
                                                            className="nav-sub-item"
                                                            onClick={onClose}
                                                        >
                                                            Pin Location Management
                                                        </Link>
                                                    )}
                                            </div>
                                        </div>
                                    )}

                                {/* VOLUNTEER (single, de-duplicated) */}
                                {(userRoles.includes("generic") ||
                                    userRoles.includes("volunteer") ||
                                    userRoles.includes("donor") ||
                                    userRoles.includes("operations admin") ||
                                    userRoles.includes("operations admin") ||
                                    userRoles.includes("superadmin")
                                ) && (
                                        <div className="nav-items" id="volunteer">
                                            <div
                                                className={`flex-control ${activeNav === "volunteer" ? "active" : ""
                                                    }`}
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
                                                className={`nav-sub-items ${activeNav === "volunteer" ? "active" : ""
                                                    }`}
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
                                                className={`flex-control ${activeNav === "donations" ? "active" : ""
                                                    }`}
                                                onClick={() => toggleNav("donations")}
                                            >
                                                <Donations width={14} height={14} className="sidebar-icons" />
                                                {userType === "admin" ? (
                                                    <a href="#" className="non-redirect">
                                                        DONATIONS MANAGEMENT
                                                    </a>
                                                ) : (
                                                    <a href="#" className="non-redirect">
                                                        DONATIONS
                                                    </a>
                                                )}
                                            </div>

                                            <div
                                                className={`nav-sub-items ${activeNav === "donations" ? "active" : ""
                                                    }`}
                                            >
                                                {(userRoles.includes("donor") ||
                                                    userRoles.includes("generic")) && (
                                                        <Link
                                                            to="/donor_profile"
                                                            prefetch-link="/donor_profile"
                                                            className="nav-sub-item"
                                                            onClick={onClose}
                                                        >
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

                                {/* RESPONSE */}
                                <div className="nav-items" id="response">
                                    <div
                                        className={`flex-control ${activeNav === "response" ? "active" : ""
                                            }`}
                                        onClick={() => toggleNav("response")}
                                    >
                                        <Response width={14} height={14} className="sidebar-icons" />
                                        <Link to="/response_dashboard" onClick={onClose}>
                                            RESPONSE DASHBOARD
                                        </Link>
                                    </div>
                                    <div
                                        className={`nav-sub-items ${activeNav === "response" ? "active" : ""
                                            }`}
                                    />
                                </div>


                                {/* DAMAGE ASSESSMENT */}
                                {userRoles.includes("disaster response admin") ||
                                    userRoles.includes("superadmin") &&
                                    userType === "admin" && (
                                        <div className="nav-items" id="damage-assessment">
                                            <div
                                                className={`flex-control ${activeNav === "damage" ? "active" : ""
                                                    }`}
                                                onClick={() => toggleNav("damage")}
                                            >
                                                <Response width={14} height={14} className="sidebar-icons" />
                                                <Link to="/damage_assessment" onClick={onClose}>
                                                    DAMAGE ASSESSMENT
                                                </Link>
                                            </div>
                                            <div
                                                className={`nav-sub-items ${activeNav === "damage" ? "active" : ""
                                                    }`}
                                            />
                                        </div>
                                    )}

                                {/* PROCUREMENT & INVENTORY */}
                                {userRoles.includes("logistics admin") ||
                                    userRoles.includes("superadmin") && userType === "admin" && (
                                        <div className="nav-items" id="procurement-inventory">
                                            <div
                                                className={`flex-control ${activeNav === "procurement" ? "active" : ""
                                                    }`}
                                                onClick={() => toggleNav("procurement")}
                                            >
                                                <Response width={14} height={14} className="sidebar-icons" />
                                                <a href="#" className="non-redirect">
                                                    PROCUREMENT &amp; INVENTORY
                                                </a>
                                            </div>

                                            <div
                                                className={`nav-sub-items ${activeNav === "procurement" ? "active" : ""
                                                    }`}
                                            >
                                                <Link
                                                    to="/procurement_inventory/procurement_inventory"
                                                    className="nav-sub-item"
                                                    onClick={onClose}
                                                >
                                                    Inventory and Warehousing
                                                </Link>
                                            </div>

                                            <div
                                                className={`nav-sub-items ${activeNav === "procurement" ? "active" : ""
                                                    }`}
                                            >
                                                <Link
                                                    to="/procurement_inventory/procurement_management"
                                                    className="nav-sub-item"
                                                    onClick={onClose}
                                                >
                                                    Procurement Management
                                                </Link>
                                            </div>

                                            <div
                                                className={`nav-sub-items ${activeNav === "procurement" ? "active" : ""
                                                    }`}
                                            >
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

                                {/* LGU officer request procurement */}
                                {userRoles.includes("lgu officer") ||
                                    userRoles.includes("superadmin") && (
                                        <div className="nav-items" id="procurement_request">
                                            <div
                                                className={`flex-control ${activeNav === "procurement_request" ? "active" : ""
                                                    }`}
                                                onClick={() => toggleNav("procurement_request")}
                                            >
                                                <Response width={14} height={14} className="sidebar-icons" />
                                                <Link to="/request_procurement" onClick={onClose}>
                                                    Request Procurement
                                                </Link>
                                            </div>
                                            <div
                                                className={`nav-sub-items ${activeNav === "response" ? "active" : ""
                                                    }`}
                                            />
                                        </div>
                                    )}

                                {/* FINANCE & ADMIN */}
                                {userRoles.includes("finance admin") ||
                                    userRoles.includes("superadmin") && userType === "admin" && (
                                        <div className="nav-items" id="finance-admin">
                                            <div
                                                className={`flex-control ${activeNav === "finance" ? "active" : ""
                                                    }`}
                                                onClick={() => toggleNav("finance")}
                                            >
                                                <Response width={14} height={14} className="sidebar-icons" />
                                                <a href="#" className="non-redirect">
                                                    FINANCE &amp; ADMIN
                                                </a>
                                            </div>
                                            <div
                                                className={`nav-sub-items ${activeNav === "finance" ? "active" : ""
                                                    }`}
                                            >
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
                                {
                                    userRoles.includes("superadmin") && userType === "admin" && (
                                        <div className="nav-items" id="user_management">
                                            <div
                                                className={`flex-control ${activeNav === "user_management" ? "active" : ""
                                                    }`}
                                                onClick={() => toggleNav("user_management")}
                                            >
                                                <Volunteer width={14} height={14} className="sidebar-icons" />
                                                <Link to="/manage_users" onClick={onClose}>
                                                    Manage Users
                                                </Link>
                                            </div>
                                            <div
                                                className={`nav-sub-items ${activeNav === "user_management" ? "active" : ""
                                                    }`}
                                            />
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}

                {/* VOLUNTEER (single, de-duplicated) */}
                {(userRoles.includes("generic") ||
                    userRoles.includes("volunteer") ||
                    userRoles.includes("donor") ||
                    userRoles.includes("operations admin") ||
                    userRoles.includes("operations admin") ||
                    userRoles.includes("superadmin")) && (
                        <div className="nav-items" id="volunteer">
                            <div
                                className={`flex-control ${activeNav === "volunteer" ? "active" : ""
                                    }`}
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
                                className={`nav-sub-items ${activeNav === "volunteer" ? "active" : ""
                                    }`}
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
                                className={`flex-control ${activeNav === "donations" ? "active" : ""
                                    }`}
                                onClick={() => toggleNav("donations")}
                            >
                                <Donations width={14} height={14} className="sidebar-icons" />
                                {userType === "admin" ? (
                                    <a href="#" className="non-redirect">
                                        DONATIONS MANAGEMENT
                                    </a>
                                ) : (
                                    <a href="#" className="non-redirect">
                                        DONATIONS
                                    </a>
                                )}
                            </div>

                            <div
                                className={`nav-sub-items ${activeNav === "donations" ? "active" : ""
                                    }`}
                            >
                                {(userRoles.includes("donor") ||
                                    userRoles.includes("generic")) && (
                                        <Link
                                            to="/donor_profile"
                                            prefetch-link="/donor_profile"
                                            className="nav-sub-item"
                                            onClick={onClose}
                                        >
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

                {/* RESPONSE */}
                <div className="nav-items" id="response">
                    <div
                        className={`flex-control ${activeNav === "response" ? "active" : ""
                            }`}
                        onClick={() => toggleNav("response")}
                    >
                        <Response width={14} height={14} className="sidebar-icons" />
                        <Link to="/response_dashboard" onClick={onClose}>
                            RESPONSE DASHBOARD
                        </Link>
                    </div>
                    <div
                        className={`nav-sub-items ${activeNav === "response" ? "active" : ""
                            }`}
                    />
                </div>

                {/* DAMAGE ASSESSMENT */}
                {userRoles.includes("disaster response admin") ||
                    (userRoles.includes("superadmin") && userType === "admin" && (
                        <div className="nav-items" id="damage-assessment">
                            <div
                                className={`flex-control ${activeNav === "damage" ? "active" : ""
                                    }`}
                                onClick={() => toggleNav("damage")}
                            >
                                <Response width={14} height={14} className="sidebar-icons" />
                                <Link to="/damage_assessment" onClick={onClose}>
                                    DAMAGE ASSESSMENT
                                </Link>
                            </div>
                            <div
                                className={`nav-sub-items ${activeNav === "damage" ? "active" : ""
                                    }`}
                            />
                        </div>
                    ))}
                {(userRoles.includes("logistics admin") ||
                    userRoles.includes("superadmin")) && (
                        <div className="nav-items" id="procurement-inventory">
                            <div
                                className={`flex-control ${activeNav === "procurement" ? "active" : ""
                                    }`}
                                onClick={() => toggleNav("procurement")}
                            >
                                <Response width={14} height={14} className="sidebar-icons" />
                                <a href="#" className="non-redirect">
                                    PROCUREMENT &amp; INVENTORY
                                </a>
                            </div>

                            <div
                                className={`nav-sub-items ${activeNav === "procurement" ? "active" : ""
                                    }`}
                            >
                                <Link
                                    to="/procurement_inventory/procurement_inventory"
                                    className="nav-sub-item"
                                    onClick={onClose}
                                >
                                    Inventory and Warehousing
                                </Link>
                            </div>

                            <div
                                className={`nav-sub-items ${activeNav === "procurement" ? "active" : ""
                                    }`}
                            >
                                <Link
                                    to="/procurement_inventory/procurement_management"
                                    className="nav-sub-item"
                                    onClick={onClose}
                                >
                                    Procurement Management
                                </Link>
                            </div>

                            <div
                                className={`nav-sub-items ${activeNav === "procurement" ? "active" : ""
                                    }`}
                            >
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
                {/* LGU officer request procurement */}
                {userRoles.includes("lgu officer") ||
                    (userRoles.includes("superadmin") && (
                        <div className="nav-items" id="procurement_request">
                            <div
                                className={`flex-control ${activeNav === "procurement_request" ? "active" : ""
                                    }`}
                                onClick={() => toggleNav("procurement_request")}
                            >
                                <Response width={14} height={14} className="sidebar-icons" />
                                <Link to="/request_procurement" onClick={onClose}>
                                    Request Procurement
                                </Link>
                            </div>
                            <div
                                className={`nav-sub-items ${activeNav === "response" ? "active" : ""
                                    }`}
                            />
                        </div>
                    ))}

                {/* FINANCE & ADMIN */}
                {userRoles.includes("finance admin") ||
                    (userRoles.includes("superadmin") && userType === "admin" && (
                        <div className="nav-items" id="finance-admin">
                            <div
                                className={`flex-control ${activeNav === "finance" ? "active" : ""
                                    }`}
                                onClick={() => toggleNav("finance")}
                            >
                                <Response width={14} height={14} className="sidebar-icons" />
                                <a href="#" className="non-redirect">
                                    FINANCE &amp; ADMIN
                                </a>
                            </div>
                            <div
                                className={`nav-sub-items ${activeNav === "finance" ? "active" : ""
                                    }`}
                            >
                                <Link
                                    to="/finance&admin/finance_management"
                                    className="nav-sub-item"
                                    onClick={onClose}
                                >
                                    Finance Management
                                </Link>
                            </div>
                        </div>
                    ))}
                {userRoles.includes("superadmin") && userType === "admin" && (
                    <div className="nav-items" id="user_management">
                        <div
                            className={`flex-control ${activeNav === "user_management" ? "active" : ""
                                }`}
                            onClick={() => toggleNav("user_management")}
                        >
                            <Volunteer width={14} height={14} className="sidebar-icons" />
                            <Link to="/manage_users" onClick={onClose}>
                                Manage Users
                            </Link>
                        </div>
                        <div
                            className={`nav-sub-items ${activeNav === "user_management" ? "active" : ""
                                }`}
                        />
                    </div>
                )}
            </div>
        </nav>
    );
};

export default React.memo(Navbar);
