import { useNavigate } from "react-router-dom";
import hostelImage from "../../assets/hostel-building.jpg";

function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {/* Main Card */}
      <div className="w-full max-w-6xl min-h-[680px] bg-white rounded-3xl overflow-hidden shadow-2xl grid lg:grid-cols-[1.15fr_0.85fr]">

        {/* ========================================= */}
        {/* LEFT SIDE - HOSTEL IMAGE */}
        {/* ========================================= */}

        <div className="relative hidden lg:block overflow-hidden">

          {/* Hostel Image */}
          <img
            src={hostelImage}
            alt="Sarala Birla University Hostel"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#071936]/95 via-[#0b2a55]/40 to-[#071936]/20" />

          {/* Logo */}
          <div className="absolute top-8 left-8 flex items-center gap-3">

            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-blue-700 text-xl font-bold">
                S
              </span>
            </div>

            <div>
              <h1 className="text-white text-xl font-bold tracking-wide">
                SBHMS
              </h1>

              <p className="text-white/75 text-xs">
                Sarala Birla Hostel Management
              </p>
            </div>

          </div>

          {/* Bottom Content */}
          <div className="absolute bottom-10 left-8 right-8 text-white">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-5">

              <span className="w-2 h-2 bg-green-400 rounded-full" />

              <span className="text-xs font-medium">
                Sarala Birla Hostel Management System
              </span>

            </div>

            {/* Main Heading */}
            <h2 className="text-4xl font-bold leading-tight max-w-xl">
              Welcome to
              <br />
              <span className="text-blue-200">
                Sarala Birla Hostel
              </span>
            </h2>

            {/* Description */}
            <p className="mt-4 text-white/75 text-sm leading-relaxed max-w-lg">
              A centralized digital platform for managing
              hostel operations, student attendance, gate
              passes and daily movements.
            </p>

            {/* Features */}
            <div className="mt-6 flex items-center gap-5 text-xs text-white/70 flex-wrap">

              <span>
                Digital Attendance
              </span>

              <span className="w-1 h-1 bg-white/50 rounded-full" />

              <span>
                Gate Pass
              </span>

              <span className="w-1 h-1 bg-white/50 rounded-full" />

              <span>
                Student Management
              </span>

            </div>

          </div>

        </div>

        {/* ========================================= */}
        {/* RIGHT SIDE - LOGIN SELECTION */}
        {/* ========================================= */}

        <div className="flex items-center justify-center p-8 sm:p-12 lg:p-14">

          <div className="w-full max-w-sm">

            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">

              <div className="inline-flex w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">
                  S
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-bold text-slate-900">
                SBHMS
              </h1>

              <p className="text-xs text-slate-500 mt-1">
                Sarala Birla Hostel Management System
              </p>

            </div>

            {/* Heading */}
            <div className="mb-8">

              <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">
                Welcome Back
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Sign in to SBHMS
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Select your account type to continue.
              </p>

            </div>

            {/* ========================================= */}
            {/* STUDENT LOGIN */}
            {/* ========================================= */}

            <button
              type="button"
              onClick={() => navigate("/student-login")}
              className="w-full text-left p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">

                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition">
                  <span className="text-blue-600 group-hover:text-white text-lg font-bold">
                    S
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Student Login
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Sign in using your SBU ID
                  </p>
                </div>

                <span className="text-slate-400 group-hover:text-blue-600 text-xl">
                  →
                </span>

              </div>
            </button>

            {/* ========================================= */}
            {/* STAFF / ADMIN LOGIN */}
            {/* ========================================= */}

            <button
              type="button"
              onClick={() => navigate("/staff-login")}
              className="w-full text-left p-5 mt-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">

                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition">
                  <span className="text-indigo-600 group-hover:text-white text-lg font-bold">
                    A
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Warden / Guard Login
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                     Warden, Guard & Maintenance
                  </p>
                </div>

                <span className="text-slate-400 group-hover:text-indigo-600 text-xl">
                  →
                </span>

              </div>
            </button>

            {/* Security Notice */}
            <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-100">

              <div className="flex items-start gap-3">

                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-sm">
                    ✓
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Secure SBHMS Access
                  </p>

                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Use the login option assigned to your account.
                    Your access is based on your role.
                  </p>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">

              <p className="text-xs text-slate-400">
                Secure access to SBHMS
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Sarala Birla University
              </p>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;