import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function StaffManagement() {
  const navigate = useNavigate();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    staffId: "",
    password: "",
    role: "WARDEN",
  });

  // ==========================================
  // FETCH STAFF
  // ==========================================

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await api.get("/api/staff", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStaff(response.data.staff || []);
    } catch (err) {
      console.error("Fetch staff error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load staff members."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredStaff = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return staff;

    return staff.filter((member) =>
      [
        member.name,
        member.email,
        member.phone,
        member.staffId,
        member.role,
      ]
        .filter(Boolean)
        .some((field) =>
          String(field).toLowerCase().includes(value)
        )
    );
  }, [staff, search]);

  // ==========================================
  // SUMMARY
  // ==========================================

  const totalStaff = staff.length;

  const activeStaff = staff.filter(
    (member) => member.isActive
  ).length;

  const inactiveStaff = staff.filter(
    (member) => !member.isActive
  ).length;

  const wardens = staff.filter(
    (member) => member.role === "WARDEN"
  ).length;

  const guards = staff.filter(
    (member) => member.role === "GUARD"
  ).length;

  // ==========================================
  // FORM HANDLING
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // ADD STAFF
  // ==========================================

  const handleAddStaff = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const token = localStorage.getItem("token");

      await api.post("/api/staff", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        staffId: "",
        password: "",
        role: "WARDEN",
      });

      setShowAddStaff(false);

      await fetchStaff();
    } catch (err) {
      console.error("Add staff error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to create staff member."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // TOGGLE STAFF STATUS
  // ==========================================

  const handleToggleStatus = async (member) => {
    const action = member.isActive
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${member.name}?`
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      await api.patch(
        `/api/staff/${member._id}/status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchStaff();
    } catch (err) {
      console.error("Toggle staff status error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to change staff status."
      );
    }
  };

  // ==========================================
  // DELETE STAFF
  // ==========================================

  const handleDeleteStaff = async (member) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${member.name}?`
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      await api.delete(`/api/staff/${member._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchStaff();
    } catch (err) {
      console.error("Delete staff error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete staff member."
      );
    }
  };

  // ==========================================
  // ROLE LABEL
  // ==========================================

  const getRoleLabel = (role) => {
    switch (role) {
      case "WARDEN":
        return "Warden";

      case "GUARD":
        return "Guard";

      case "MAINTENANCE":
        return "Maintenance";

      default:
        return role;
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading staff members...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              onClick={() => navigate("/admin")}
              className="mb-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Staff Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage wardens and guards of the hostel.
            </p>
          </div>

          <button
            onClick={() => setShowAddStaff(true)}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Add Staff
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Staff
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalStaff}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {activeStaff}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Inactive
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {inactiveStaff}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Wardens
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {wardens}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Guards
            </p>

            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {guards}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            type="text"
            placeholder="Search by name, Staff ID, email, phone or role..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Staff Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Staff Members
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing {filteredStaff.length} of{" "}
              {staff.length} staff members
            </p>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                No staff members found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or add a new staff member.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Staff
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Staff ID
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Contact
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Role
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((member) => (
                    <tr
                      key={member._id}
                      className="transition hover:bg-slate-50"
                    >

                      {/* Staff */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                            {member.name
                              ?.charAt(0)
                              ?.toUpperCase() || "S"}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {member.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Staff ID */}
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          {member.staffId}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {member.phone}
                        </p>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          {getRoleLabel(member.role)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {member.isActive ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              handleToggleStatus(member)
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            {member.isActive
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteStaff(member)
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Staff Modal */}
        {showAddStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Add Staff Member
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Create a Warden or Guard account.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddStaff(false)}
                  className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ×
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleAddStaff}
                className="space-y-5 p-6"
              >

                {/* Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Email + Phone */}
                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="staff@sbu.ac.in"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Phone
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                </div>

                {/* Staff ID + Role */}
                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Staff ID
                    </label>

                    <input
                      type="text"
                      name="staffId"
                      value={formData.staffId}
                      onChange={handleChange}
                      placeholder="e.g. WARDEN002"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Role
                    </label>

                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="WARDEN">
                        Warden
                      </option>

                      <option value="GUARD">
                        Guard
                      </option>
                    </select>
                  </div>

                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                  <button
                    type="button"
                    onClick={() =>
                      setShowAddStaff(false)
                    }
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? "Creating..."
                      : "Create Staff"}
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StaffManagement;