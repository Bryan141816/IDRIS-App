import { UserProvider } from "./UserContext";
import { UserRoleProvider } from "./UserRoleContext";

import "./styles/App.scss";

import { RouterProvider } from "react-router-dom";
import { router } from "./routes.tsx";
function App() {
  return (
    <UserProvider>
      <UserRoleProvider>
        <RouterProvider router={router} />
      </UserRoleProvider>
    </UserProvider>
  );
}
export default App;
