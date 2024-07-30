import { useNavigate } from "react-router-dom";
import { createContext, useEffect } from "react";
// import PageLoader from "../components/PageLoader";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import Todo from "./pages/Todo";

export const AppContext = createContext();

function AppContextProvider({ children }) {
  const { token, setToken, getLocalStates } = useLocalStorageState(
    null,
    "token",
  );
  const navigate = useNavigate();

  //if not authenticated redirect to login page
  useEffect(
    function () {
      if (!token || !token?.token) {
        //error ||
        navigate("/login");
      }
    },
    [token, navigate],
  );

  if (token?.token)
    return (
      <AppContext.Provider
        value={{ token, getLocalStates, localState: getLocalStates() }}
      >
        {children}
      </AppContext.Provider>
    );
  return "";
}

function ProtectedRoute() {
  //render spinner while app is loading
  //TODO: find value to render app loading spinner
  // if (isLoading) return <PageLoader />;
  //|| isAuthenticated == undefined
  return (
    <AppContextProvider>
      <Todo />;
    </AppContextProvider>
  );
}

export default ProtectedRoute;
