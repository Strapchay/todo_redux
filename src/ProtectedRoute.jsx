import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
// import PageLoader from "../components/PageLoader";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import Todo from "./pages/Todo";

function ProtectedRoute() {
  const [token, setToken] = useLocalStorageState(null, "token");
  const navigate = useNavigate();

  //if not authenticated redirect to login page
  useEffect(
    function () {
      if (!token?.token) {
        //error ||
        navigate("/login");
      }
    },
    [token, navigate],
  );

  //render spinner while app is loading
  //TODO: find value to render app loading spinner
  // if (isLoading) return <PageLoader />;
  //|| isAuthenticated == undefined
  if (token.token) return <Todo />;
}

export default ProtectedRoute;
