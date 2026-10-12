import CollegeMovement from "../models/CollegeMovement.js";
import { startOfDayIST, collegeEndIST } from "../utils/time.js";

// Closes college OUT records from PREVIOUS days that never got an IN.
// They are marked IN at 5:00 PM of their own day and flagged
// "autoClosed" so the warden can see what happened.

export const closeStaleCollegeMovements = async () => {
  const todayStart = startOfDayIST();

  const stale = await CollegeMovement.find({
    status: "OUT",
    outTime: { $lt: todayStart },
  });

  if (stale.length === 0) return 0;

  const operations = stale.map((movement) => {
    const collegeEnd = collegeEndIST(movement.outTime);

    // Never let IN time be earlier than OUT time
    const inTime = collegeEnd > movement.outTime ? collegeEnd : movement.outTime;

    const note = "Auto-closed: no IN scan";

    return {
      updateOne: {
        filter: { _id: movement._id, status: "OUT" },
        update: {
          $set: {
            status: "IN",
            inTime,
            autoClosed: true,
            remarks: movement.remarks ? `${movement.remarks} | ${note}` : note,
          },
        },
      },
    };
  });

  await CollegeMovement.bulkWrite(operations);

  return stale.length;
};