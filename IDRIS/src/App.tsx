// App.tsx
import { UserProvider } from "./providers/UserContextProvider";
import { UserRoleProvider } from "./UserRoleContext";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes.tsx";
import "./styles/App.scss";

function App() {
  return (
    <UserProvider>
      <UserRoleProvider>
        <RouterProvider router={router} />;
      </UserRoleProvider>
    </UserProvider>
  );
}

export default App;
