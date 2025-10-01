import { useEffect, useState, lazy } from "react";
import { useUserContext } from "./UserContext";
import { useUserRoleContext } from "./UserRoleContext";
import {
  Outlet,
  useLocation,
  useNavigation,
  useLoaderData,
  useNavigate,
} from "react-router-dom";
import PageLoader from "./components/Page_Furniture/Loader";
import { usePrefectLink } from "./PrefetchLink";

import Navbar from "./components/Page_Furniture/Navbar";
import Header from "./components/Page_Furniture/Header";
import Footer from "./components/Page_Furniture/Footer";
import { RealTimeDataProvider } from "./RealTimeDataContext";
import { NotificationProvider } from "./NotificationContext";
import { handleRoleBasedRedirect } from "./utils/handleRoleBasedRedirect";
const ProtectedRoute = lazy(() => import("./ProtectedRoute"));

function PageLayout() {
  usePrefectLink();
  const {
    setUserType,
    setEmail,
    setUsername,
    setUserReady,
    isUserReady,
    setUserId,
    userId,
  } = useUserContext();
  const { setUserRoles, userRoles } = useUserRoleContext();
  const navigate = useNavigate();

  const userData = useLoaderData() as {
    user_id: number;
    user_type: string;
    email: string;
    username: string;
    roles: string[];
  } | null;

  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/activate" ||
    location.pathname === "/forgot_password" ||
    location.pathname === "/reset_password" ||
    location.pathname === "/oauth_callback";

  useEffect(() => {
    if (userData) {
      if (isAuthPage) {
        handleRoleBasedRedirect(userData.roles, navigate);
        return;
      }
      setUserType(userData.user_type);
      setEmail(userData.email);
      setUserId(userData.user_id);
      setUsername(userData.username);
      setUserRoles(userData.roles);
    } else {
      setUserType("");
      setEmail("");
      setUserId(null);
      setUsername("");
      setUserRoles([]);
    }
    const timeout = setTimeout(() => setUserReady(true), 0);
    return () => clearTimeout(timeout);
  }, [
    userData,
    isAuthPage,
    navigate,
    setUserType,
    setEmail,
    setUserId,
    setUsername,
    setUserRoles,
    setUserReady,
  ]);

  const navigation = useNavigation();

  const hideHeaderFooterRoutes = [
    "/lgu_profiling/map_of_cebu",
    "/donation_report",
    "/volunteer_management/VolunteerReports",
    "/volunteer_management/ProgramsReports",
    "/lgu_profiling/shelter_report_dashboard",
    "/finance&admin/finance_management/budget_summary",
    "/response_dashboard/emergency_report",
  ];

  const shouldHideHeaderFooter = hideHeaderFooterRoutes.includes(
    location.pathname,
  );

  const isPrintPage =
    location.pathname === "/donation_report";


  const hideNavbarRoutes = [
    "/finance_printable",
  ]

  const shouldHideNavbar =
    isPrintPage || hideNavbarRoutes.includes(location.pathname);

  const shouldHideLayout =
    isAuthPage ||
    hideHeaderFooterRoutes.includes(location.pathname) ||
    hideNavbarRoutes.includes(location.pathname); // DISPLAY ONLY PRINTABLE LAYOUT

  const [isNavbarVisible, setIsNavbarVisible] = useState(false);
  const toggleNavbar = () => setIsNavbarVisible((prev) => !prev);
  const closeSidebar = () => setIsNavbarVisible(false);
  const shouldHideUI = !userRoles || userRoles.length === 0;
  let content;
  if ((!isUserReady && !isAuthPage) || navigation.state === "loading") {
    content = <PageLoader />;
  } else if (isAuthPage) {
    content = <Outlet />;
  } else {
    content = (
      <ProtectedRoute>
        <Outlet />
      </ProtectedRoute>
    );
  }

  return (
    <RealTimeDataProvider url={`http://localhost:8000/real_time/${userId}`}>
      <NotificationProvider>
        {!shouldHideUI && !shouldHideNavbar && (
          <Navbar isVisible={isNavbarVisible} onClose={closeSidebar} />
        )}
        <div id="right-body-section">
          {!shouldHideUI && !shouldHideLayout && (
            <Header onIconClick={toggleNavbar} />
          )}
          <main>{content}</main>
          {!shouldHideUI && !shouldHideLayout && !shouldHideHeaderFooter && (
            <Footer />
          )}
        </div>
      </NotificationProvider>
    </RealTimeDataProvider>
  );
}

export default PageLayout;
