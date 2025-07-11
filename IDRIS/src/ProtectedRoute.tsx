import React from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "./UserContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { userType, isUserReady } = React.useContext(UserContext);
  if (!isUserReady) {
    // Still loading, avoid rendering or redirecting
    return null; // or a spinner if you want
  }

  if (!userType) {
    //if (!userType || userType === '') {
    // User not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
