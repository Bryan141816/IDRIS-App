import { NavigateFunction } from "react-router-dom";

export const handleRoleBasedRedirect = (
  roles: string[],
  navigate: NavigateFunction,
) => {
  if (roles.includes("super admin")) {
    navigate("/volunteer_management/volunteer_dashboard");
  } else if (roles.includes("volunteer")) {
    navigate("/volunteer_management/volunteer_dashboard");
  } else if (roles.includes("operations admin")) {
    navigate("/donations_management/donations_dashboard");
  } else if (roles.includes("finance admin")) {
    navigate("/finance&admin/finance_management");
  } else {
    navigate("/donations_management/donations_dashboard");
  }
};