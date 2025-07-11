import { useState, lazy } from "react";
import { useUserContext, UserProvider } from "./UserContext";
import { useUserRoleContext, UserRoleProvider } from "./UserRoleContext";
import { Outlet, useLocation, useNavigation } from "react-router-dom";
import { Import } from "lucide-react";
import PageLoader from "./components/Page_Furniture/Loader";
const Navbar = lazy(() => import("./components/Page_Furniture/Navbar"));
const Header = lazy(() => import("./components/Page_Furniture/Header"));
const Footer = lazy(() => import("./components/Page_Furniture/Footer"));
const ProtectedRoute = lazy(() => import("./ProtectedRoute"));
function PageLayout() {
  const location = useLocation();
  const { userType } = useUserContext();
  const { userRole } = useUserRoleContext();
  const navigation = useNavigation();

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";
  // List of pages where you want to hide both Header and Footer
  const hideHeaderFooterRoutes = ["/lgu_profiling/map_of_cebu"];

  // Check if the current path is one of the pages where you want to hide Header/Footer
  const shouldHideHeaderFooter = hideHeaderFooterRoutes.includes(
    location.pathname,
  );

  const [isNavbarVisible, setIsNavbarVisible] = useState(false);
  const toggleNavbar = () => {
    setIsNavbarVisible((prev) => !prev);
  };

  let content;
  if (navigation.state === "loading") {
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
  const shouldHideUI = !userRole || userRole === ""; // (!userType || userType === "") &&

  const closeSidebar = () => setIsNavbarVisible(false);
  return (
    <>
      {!shouldHideUI && (
        <Navbar isVisible={isNavbarVisible} onClose={closeSidebar} />
      )}
      {/* Only show the Header and Footer if the current route isn't '/lgu_profiling/map_of_cebu' */}
      <div id="right-body-section">
        {!shouldHideUI && <Header onIconClick={toggleNavbar} />}
        {/* {!shouldHideHeaderFooter && <Header onIconClick={toggleNavbar}/>} */}
        <main>{content}</main>
        {!shouldHideUI && !shouldHideHeaderFooter && <Footer />}
      </div>
    </>
  );
}
export default PageLayout;
