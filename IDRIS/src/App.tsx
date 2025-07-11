// App.tsx
import { UserProvider } from "./UserContext";
import { UserRoleProvider } from "./UserRoleContext";
import AppShell from "./AppShell";

import "./styles/App.scss";

function App() {
  return (
    <UserProvider>
      <UserRoleProvider>
        <AppShell />
      </UserRoleProvider>
    </UserProvider>
  );
}

export default App;
