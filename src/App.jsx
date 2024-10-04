import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Landing from "./pages/Landing";
import Error from "./Error";
import Todo from "./pages/Todo";
import PageNotFound from "./PageNotFound";
import ProtectedRoute from "./ProtectedRoute";

const multiplePathToComponent = ["/", "/login"].map((p) => ({
  path: p,
  element: <Landing />,
  errorElement: <Error />,
}));

const router = createBrowserRouter([
  ...multiplePathToComponent,
  {
    element: <ProtectedRoute />,
    errorElement: <Error />,
    children: [{ path: "/dashboard", element: <Todo />, index: true }],
  },
  {
    path: "*",
    element: <PageNotFound />,
    errorElement: <Error />,
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        gutter={12}
        containerStyle={{ margin: "8px" }}
        toastOptions={{
          success: {
            duration: 3000,
          },
          error: {
            duration: 5000,
          },
          style: {
            fontSize: "16px",
            maxWidth: "500px",
            paddings: "16px 24px",
            backgroundColor: "whitesmoke",
            color: "black",
          },
        }}
      />
    </>
  );
}

export default App;
