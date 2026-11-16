import PlaceGrid from "@/components/student/place-grid";
import { createAdminClient } from "@/lib/supabase-admin";
import DashboardHome from "./DashboardHome";
import StudentPerks from "./student-perks";
import { getCareerReadinessData, getStudentDashboardData, getMatchedJobsCount } from "./actions";
import { getVerificationStatus } from "../actions/verify-school";
const CHECKLIST = [
  { key: "profile", title: "Finish your profile", why: "School, trimester, city, and techniques are what doctors see.", link: "/student/profile" },
  { key: "doctors", title: "Meet doctors who opted in", why: "Message them, ask about mentorship, or request a shadow day.", link: "/student/doctors" },
  { key: "match", title: "Answer the ChiroMatch questions", why: "You see a match percent and the reason it lines up.", link: "/student/match" },
  { key: "call", title: "Watch for the monthly call", why: "Dr. Ray and a guest doctor. You will get an email when the date is set.", link: "/student/mentorship" },
];

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const counted = await createAdminClient().from("profiles").select("id", { count: "exact", head: true }).eq("role", "student");
  const [readiness, profileData, verification, jobCount] = await Promise.all([
    getCareerReadinessData(),
    getStudentDashboardData(),
    getVerificationStatus(),
    getMatchedJobsCount(),
  ]);

  return (
    <>
      <PlaceGrid />
      <StudentPerks />
      <DashboardHome
        readiness={readiness}
        profileData={profileData}
        verification={verification}
        jobCount={jobCount}
        studentCount={typeof counted.count === "number" ? counted.count : null}
        steps={CHECKLIST}
      />
    </>
  );
}
