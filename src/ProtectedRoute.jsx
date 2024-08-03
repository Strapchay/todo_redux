import { useNavigate } from "react-router-dom";
import { createContext, useEffect, useState } from "react";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import Todo from "./pages/Todo";
import { useSyncLocalStorageToAPI } from "./hooks/useSyncLocalStorageToAPI";

export const AppContext = createContext();

function AppContextProvider({ children }) {
  const { token, setToken, getLocalStates } = useLocalStorageState(
    null,
    "token",
  );
  const [sync, setSync] = useState(true);
  // const localState = getLocalStates();
  const { startSync, syncLoading, setSyncLoading, removeToken } =
    useSyncLocalStorageToAPI(token, getLocalStates, setSync);
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

  function removeTokenAndLogout() {
    removeToken();
    navigate("/login");
  }

  if (token?.token) {
    return (
      <AppContext.Provider
        value={{
          token,
          getLocalStates,
          startSync,
          syncLoading,
          sync,
          setSync,
          setSyncLoading,
          removeToken: removeTokenAndLogout,
        }}
      >
        {children}
      </AppContext.Provider>
    );
  }
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
