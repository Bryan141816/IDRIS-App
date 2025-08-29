import { useEffect, useState, lazy } from "react";
import { useUserContext } from "./UserContext";
import { useUserRoleContext } from "./UserRoleContext";
import {
  Outlet,
  useLocation,
  useNavigation,
  useLoaderData,
} from "react-router-dom";
import PageLoader from "./components/Page_Furniture/Loader";
import { usePrefectLink } from "./PrefetchLink";

import Navbar from "./components/Page_Furniture/Navbar";
import Header from "./components/Page_Furniture/Header";
import Footer from "./components/Page_Furniture/Footer";
const ProtectedRoute = lazy(() => import("./ProtectedRoute"));

function PageLayout() {
  usePrefectLink();
  const { setUserType, setEmail, setUsername, setUserReady, isUserReady } =
    useUserContext();
  const { setUserRoles, userRoles } = useUserRoleContext();

  const userData = useLoaderData() as {
    user_type: string;
    email: string;
    username: string;
    roles: string[];
  } | null;

  const [isInit, setIsInit] = useState(false); // local flag to ensure init only runs once

  useEffect(() => {
    if (!isInit) {
      if (userData) {
        setUserType(userData.user_type);
        setEmail(userData.email);
        setUsername(userData.username);
        setUserRoles(userData.roles);
      } else {
        setUserType("");
        setEmail("");
        setUsername("");
        setUserRoles([]);
      }
      const timeout = setTimeout(() => setUserReady(true), 0);
      return () => clearTimeout(timeout);
      setIsInit(true);
    }
  }, [userData, isInit]);

  const location = useLocation();
  const navigation = useNavigation();
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/activate" ||
    location.pathname === "/forgot_password" ||
    location.pathname === "/reset_password";
  const hideHeaderFooterRoutes = ["/lgu_profiling/map_of_cebu"];
  const shouldHideHeaderFooter = hideHeaderFooterRoutes.includes(
    location.pathname,
  );

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
    <>
      {!shouldHideUI && (
        <Navbar isVisible={isNavbarVisible} onClose={closeSidebar} />
      )}
      <div id="right-body-section">
        {!shouldHideUI && <Header onIconClick={toggleNavbar} />}
        <main>{content}</main>
        {!shouldHideUI && !shouldHideHeaderFooter && <Footer />}
      </div>
    </>
  );
}

export default PageLayout;
