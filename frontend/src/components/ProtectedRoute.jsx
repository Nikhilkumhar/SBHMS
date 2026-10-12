import { Navigate } from "react-router-dom";
import { roleHome, isTokenExpired } from "../utils/roleHome";

function ProtectedRoute({ children, allowedRoles = [] }) {
  // Each browser tab has its own login session
  const token = sessionStorage.getItem("token");
  const storedUser = sessionStorage.getItem("user");

  const clearSession = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  };

  // Not logged in
  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  // Token expired
  if (isTokenExpired(token)) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  // Broken saved user
  let user;

  try {
    user = JSON.parse(storedUser);
  } catch {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  // Wrong role -> send them to their own dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const home = roleHome(user.role);

    if (home === "/login") {
      clearSession();
    }

    return <Navigate to={home} replace />;
  }

  return children;
}

export default ProtectedRoute;