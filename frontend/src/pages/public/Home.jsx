import { Link } from "react-router-dom";

import hostelImage from "../../assets/hostel-building.jpg";

function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <span className="text-white text-xl font-bold">
                  S
                </span>
              </div>

              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  SBHMS
                </h1>

                <p className="text-[10px] text-slate-500 font-medium">
                  Sarala Birla Hostel
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="hidden md:flex items-center gap-8">

              <a
                href="#home"
                className="text-sm font-medium text-blue-600"
              >
                Home
              </a>

              <a
                href="#about"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
              >
                About
              </a>

              <a
                href="#memories"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
              >
                Memories
              </a>

              <a
                href="#events"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
              >
                Events
              </a>

              <a
                href="#features"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
              >
                SBHMS
              </a>

            </div>

            {/* Right Side */}
            <div className="flex items-center gap-5">

              <span className="hidden sm:block text-sm text-slate-400">
                Sarala Birla University
              </span>

              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition"
              >
                Sign In
              </Link>

            </div>

          </div>
        </div>
      </nav>


      {/* =================================================
          HERO SECTION
      ================================================= */}

      <section
        id="home"
        className="relative min-h-screen flex items-center overflow-hidden"
      >

        {/* Background Image */}
        <img
          src={hostelImage}
          alt="Sarala Birla Hostel"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-slate-950/60" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-8 pt-20">

          <div className="max-w-3xl text-white">

            {/* University Label */}
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />

              <span className="text-sm font-medium text-white/80">
                Sarala Birla University
              </span>
            </div>

            {/* Main Heading */}
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">

              Life Beyond
              <br />

              <span className="text-blue-300">
                the Classroom
              </span>

            </h2>

            {/* Short Keywords */}
            <div className="mt-7 flex items-center gap-4 flex-wrap">

              <span className="text-sm font-medium text-white/80">
                Live
              </span>

              <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />

              <span className="text-sm font-medium text-white/80">
                Learn
              </span>

              <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />

              <span className="text-sm font-medium text-white/80">
                Connect
              </span>

              <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />

              <span className="text-sm font-medium text-white/80">
                Grow
              </span>

            </div>

            {/* Button */}
            <div className="mt-9">

              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition"
              >
                Student Sign In
              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          ABOUT SECTION
      ================================================= */}

      <section
        id="about"
        className="py-24 bg-white"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Text */}
            <div>

              <p className="text-xs font-bold tracking-[0.2em] text-blue-600 uppercase">
                About Our Hostel
              </p>

              <h2 className="mt-4 text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                More than a place
                <br />
                to stay.
              </h2>

              <p className="mt-6 text-slate-600 leading-relaxed">
                Sarala Birla Hostel provides students with a
                comfortable environment where academic life
                and personal growth come together.
              </p>

              <p className="mt-4 text-slate-600 leading-relaxed">
                From everyday hostel life to celebrations,
                sports and cultural activities, the hostel
                becomes a place where friendships are built
                and unforgettable memories are created.
              </p>

              {/* Small Stats */}
              <div className="mt-8 grid grid-cols-3 gap-4">

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-2xl font-bold text-blue-600">
                    24/7
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Hostel Life
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-2xl font-bold text-blue-600">
                    365
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Days of Memories
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-2xl font-bold text-blue-600">
                    1
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Community
                  </p>
                </div>

              </div>

            </div>

            {/* Image */}
            <div className="relative">

              <div className="rounded-3xl overflow-hidden shadow-2xl">

                <img
                  src={hostelImage}
                  alt="Sarala Birla Hostel"
                  className="w-full h-[450px] object-cover"
                />

              </div>

              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl border border-slate-100 p-5">

                <p className="text-xs text-slate-400">
                  Our Community
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  Live • Learn • Connect
                </p>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =================================================
          MEMORIES / GALLERY
      ================================================= */}

      <section
        id="memories"
        className="py-24 bg-slate-50"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          {/* Heading */}
          <div className="text-center max-w-2xl mx-auto">

            <p className="text-xs font-bold tracking-[0.2em] text-blue-600 uppercase">
              Hostel Memories
            </p>

            <h2 className="mt-4 text-4xl md:text-5xl font-bold text-slate-900">
              Moments that stay with us
            </h2>

            <p className="mt-5 text-slate-500 leading-relaxed">
              Every day at the hostel brings new experiences,
              friendships and memories worth remembering.
            </p>

          </div>


          {/* Gallery */}
          <div className="mt-14 grid md:grid-cols-3 gap-6">

            {/* Image 1 */}
            <div className="group relative h-[420px] rounded-3xl overflow-hidden">

              <img
                src={hostelImage}
                alt="Hostel Memories"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              <div className="absolute bottom-6 left-6 text-white">

                <p className="text-xs uppercase tracking-widest text-white/60">
                  Memories
                </p>

                <h3 className="mt-1 text-xl font-bold">
                  Hostel Life
                </h3>

              </div>

            </div>


            {/* Image 2 */}
            <div className="group relative h-[420px] rounded-3xl overflow-hidden bg-slate-200 flex items-center justify-center">

              <div className="text-center px-8">

                <div className="w-16 h-16 mx-auto rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <span className="text-2xl">
                    📸
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-700">
                  Your Memory
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Your next hostel photo will appear here.
                </p>

              </div>

            </div>


            {/* Image 3 */}
            <div className="group relative h-[420px] rounded-3xl overflow-hidden bg-slate-200 flex items-center justify-center">

              <div className="text-center px-8">

                <div className="w-16 h-16 mx-auto rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <span className="text-2xl">
                    🎉
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-700">
                  Special Moments
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Events and celebrations will appear here.
                </p>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =================================================
          EVENTS
      ================================================= */}

      <section
        id="events"
        className="py-24 bg-white"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Heading */}
            <div>

              <p className="text-xs font-bold tracking-[0.2em] text-blue-600 uppercase">
                Hostel Events
              </p>

              <h2 className="mt-4 text-4xl md:text-5xl font-bold leading-tight">
                Celebrate.
                <br />
                Participate.
                <br />
                Remember.
              </h2>

              <p className="mt-6 text-slate-500 leading-relaxed max-w-lg">
                Hostel life is not only about academics.
                Sports, cultural programs, festivals and
                community activities bring everyone together.
              </p>

            </div>


            {/* Event Cards */}
            <div className="space-y-4">

              <div className="p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition">

                <div className="flex items-start gap-5">

                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
                    🏏
                  </div>

                  <div>

                    <h3 className="font-bold text-lg">
                      Sports Activities
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Cricket, football and other hostel
                      sporting activities.
                    </p>

                  </div>

                </div>

              </div>


              <div className="p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition">

                <div className="flex items-start gap-5">

                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
                    🎭
                  </div>

                  <div>

                    <h3 className="font-bold text-lg">
                      Cultural Events
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Cultural programs and activities that
                      bring students together.
                    </p>

                  </div>

                </div>

              </div>


              <div className="p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition">

                <div className="flex items-start gap-5">

                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
                    🎊
                  </div>

                  <div>

                    <h3 className="font-bold text-lg">
                      Celebrations
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Festivals, special occasions and
                      memorable hostel moments.
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =================================================
          SBHMS FEATURES
      ================================================= */}

      <section
        id="features"
        className="py-24 bg-slate-950 text-white"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto">

            <p className="text-xs font-bold tracking-[0.2em] text-blue-300 uppercase">
              Introducing SBHMS
            </p>

            <h2 className="mt-4 text-4xl md:text-5xl font-bold">
              Hostel management,
              <br />
              made digital.
            </h2>

            <p className="mt-5 text-white/60 leading-relaxed">
              SBHMS brings important hostel operations
              together in one centralized platform.
            </p>

          </div>


          {/* Features */}
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl">
                📋
              </div>

              <h3 className="mt-5 font-bold">
                Digital Attendance
              </h3>

              <p className="mt-2 text-sm text-white/50 leading-relaxed">
                Manage daily hostel attendance digitally.
              </p>
            </div>


            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl">
                🎫
              </div>

              <h3 className="mt-5 font-bold">
                Gate Pass
              </h3>

              <p className="mt-2 text-sm text-white/50 leading-relaxed">
                Apply, approve and track student gate passes.
              </p>
            </div>


            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl">
                📱
              </div>

              <h3 className="mt-5 font-bold">
                College Movement
              </h3>

              <p className="mt-2 text-sm text-white/50 leading-relaxed">
                Securely track student college movement.
              </p>
            </div>


            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl">
                👨‍🎓
              </div>

              <h3 className="mt-5 font-bold">
                Student Management
              </h3>

              <p className="mt-2 text-sm text-white/50 leading-relaxed">
                Centralized student and hostel information.
              </p>
            </div>

          </div>


          {/* CTA */}
          <div className="mt-16 text-center">

            <Link
              to="/login"
              className="inline-flex px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
            >
              Sign In to SBHMS
            </Link>

          </div>

        </div>
      </section>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="bg-slate-950 border-t border-white/10">

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">

                <span className="text-white font-bold">
                  S
                </span>

              </div>

              <div>

                <p className="text-white text-sm font-bold">
                  SBHMS
                </p>

                <p className="text-white/40 text-xs">
                  Sarala Birla Hostel Management System
                </p>

              </div>

            </div>

            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} Sarala Birla University
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}

export default Home;