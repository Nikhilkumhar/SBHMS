// Where each role should land after login
export const roleHome = (role) => {
  switch (role) {
    case "STUDENT":
      return "/student";
    case "GUARD":
      return "/guard";
    case "WARDEN":
      return "/warden";
    case "ADMIN":
      return "/admin";
    case "MAINTENANCE":
      return "/maintenance";
    default:
      return "/login";
  }
};

// Read the logged-in user from this tab's session
export const getSessionUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

// Check if the JWT token has expired (no library needed)
export const isTokenExpired = (token) => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    return payload.exp ? payload.exp * 1000 < Date.now() : false;
  } catch {
    return true;
  }
};


// "/warden" for a warden, "/admin" for everyone else
export const portalBase = () =>
  getSessionUser()?.role === "WARDEN" ? "/warden" : "/admin";