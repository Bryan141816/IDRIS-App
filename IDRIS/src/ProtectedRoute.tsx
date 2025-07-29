import React from "react";
import { Navigate, useMatches } from "react-router-dom";
import { UserContext } from "./UserContext";
import { UserRoleContext } from "./UserRoleContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}
type RouteHandle = {
  allowedRoles?: string[];
};
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { userType, isUserReady } = React.useContext(UserContext);
  const { userRoles } = React.useContext(UserRoleContext);
  if (!isUserReady) {
    // Still loading, avoid rendering or redirecting
    return null; // or a spinner if you want
  }

  if (!userType) {
    //if (!userType || userType === '') {
    // User not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }
  const matches = useMatches();
  const current = matches[matches.length - 1];
  const handle = current.handle as RouteHandle | undefined;
  const allowedRoles = handle?.allowedRoles;

  if (allowedRoles) {
    const userRoleAllowed = userRoles.some((value) =>
      allowedRoles.includes(value),
    );
    if (userRoleAllowed) {
      return children;
    } else {
      return <Navigate to="/user_not_allowed" replace />;
    }
  } else {
    return children;
  }
};

export default ProtectedRoute;
