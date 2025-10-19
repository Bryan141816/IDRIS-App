import { NavigateFunction } from "react-router-dom";

export const handleRoleBasedRedirect = (
  roles: string[],
  navigate: NavigateFunction,
) => {
  if (roles.includes("operations admin")) {
    navigate("/volunteer_management/volunteer_dashboard");
  } else if (roles.includes("finance admin")) {
    navigate("/finance&admin/finance_management");
  } else if(roles.includes("lgu officer")) {
    navigate("/lgu_profiling/map_of_cebu");
  }
  else if(roles.includes("logistics admin")) {
    navigate("/procurement_inventory/procurement_inventory");
  }
  else {
    navigate("/lgu_profiling/map_of_cebu");
  }
};