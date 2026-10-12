import { useNavigate } from "react-router-dom";
import { getSessionUser, roleHome } from "../utils/roleHome";

function NotFound() {
  const navigate = useNavigate();
  const user = getSessionUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-5xl font-extrabold text-blue-600">404</p>

        <h1 className="mt-3 text-xl font-bold text-slate-900">
          Page not found
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          The page you are looking for does not exist.
        </p>

        <button
          type="button"
          onClick={() => navigate(user ? roleHome(user.role) : "/")}
          className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {user ? "Go to my dashboard" : "Go to home"}
        </button>
      </div>
    </div>
  );
}

export default NotFound;