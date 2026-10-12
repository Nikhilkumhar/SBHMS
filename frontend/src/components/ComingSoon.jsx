import { useNavigate } from "react-router-dom";
import { getSessionUser, roleHome } from "../utils/roleHome";

function ComingSoon({ title = "This page" }) {
  const navigate = useNavigate();
  const user = getSessionUser();

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          SBHMS
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>

        <p className="mt-3 text-sm text-slate-500">
          This feature is coming soon.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate(roleHome(user?.role))}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Dashboard
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComingSoon;