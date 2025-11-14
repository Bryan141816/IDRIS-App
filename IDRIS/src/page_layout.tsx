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
    setUserImage,
  } = useUserContext();
  const { setUserRoles, userRoles } = useUserRoleContext();
  const navigate = useNavigate();

  const userData = useLoaderData() as {
    user_id: number;
    user_type: string;
    email: string;
    username: string;
    roles: string[];
    user_profile: {
      profile_image: string;
    } | null;
  } | null;

  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/activate" ||
    location.pathname === "/forgot_password" ||
    location.pathname === "/reset_password" ||
    location.pathname === "/oauth_callback";

  // Track previous user type to detect changes
  const [prevUserType, setPrevUserType] = useState<string | null>(null);

  useEffect(() => {
    if (!userData) {
      if(!isAuthPage){
        navigate("/login");
      }
      return;
    }

    const { user_type, email, user_id, username, roles, user_profile } =
      userData;

    // Only update if user_type has changed and is not null
    if (user_type && user_type !== prevUserType) {
      setPrevUserType(user_type);

      if (isAuthPage) {
        handleRoleBasedRedirect(roles, navigate);
        return;
      }

      setUserType(user_type);
      setEmail(email);
      setUserId(user_id);
      setUsername(username);
      setUserRoles(roles);
      setUserImage(user_profile?.profile_image ?? null);

      setUserReady(true);
    }
  }, [userData]);

  const navigation = useNavigation();

  const hideHeaderFooterRoutes = [
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

  const isPrintPage = location.pathname === "/donation_report";
  const hideNavbarRoutes = ["/finance_printable"];
  const shouldHideNavbar = false;
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
    <RealTimeDataProvider>
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
