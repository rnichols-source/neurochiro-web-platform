import DashboardHome from "./DashboardHome";
import StudentPerks from "./student-perks";
import { getCareerReadinessData, getStudentDashboardData, getMatchedJobsCount } from "./actions";
import { getVerificationStatus } from "../actions/verify-school";
import { nextRoadmapSteps } from "@/config/student-roadmap";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const [readiness, profileData, verification, jobCount] = await Promise.all([
    getCareerReadinessData(),
    getStudentDashboardData(),
    getVerificationStatus(),
    getMatchedJobsCount(),
  ]);

  return (
    <>
      <StudentPerks />
      <DashboardHome
        readiness={readiness}
        profileData={profileData}
        verification={verification}
        jobCount={jobCount}
        steps={nextRoadmapSteps([])}
      />
    </>
  );
}
