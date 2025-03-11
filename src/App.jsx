import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Landing from "./Pages/Landing";
import SignUp from "./Pages/SignUp";
import SignIn from "./Pages/SignIn";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Landing />,
    },
    {
      path: "/signup",
      element: <SignUp />,
    },
    {
      path: "/signin",
      element: <SignIn />,
    },
    {
      path: "*",
      element: <Landing />,
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
