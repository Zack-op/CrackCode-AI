import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  // ── Safe defaults ─────────────────────────────────────────────────────────
  const interviewRole    = interview.role       || "Software Engineer";
  const interviewLevel   = interview.level      || "mid";
  const interviewType    = interview.type       || "technical";
  const techStack        = Array.isArray(interview.techstack) && interview.techstack.length > 0
                             ? interview.techstack
                             : ["General"];
  const difficulty       = interview.difficulty || "medium";
  const initialQuestions = Array.isArray(interview.questions) && interview.questions.length > 0
                             ? interview.questions
                             : ["Tell me about yourself and your background."];

  return (
    <div className="space-y-6">

      {/* ── Interview Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-white capitalize">
            {interviewRole} Interview
          </h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400 capitalize">
              {interviewLevel}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 capitalize">
              {interviewType}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
              difficulty === "hard"
                ? "bg-red-500/20 text-red-400"
                : difficulty === "easy"
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}>
              {difficulty}
            </span>
          </div>
        </div>

        {/* Tech stack pills */}
        <div className="flex flex-wrap gap-2">
          {techStack.slice(0, 5).map((tech: string) => (
            <span
              key={tech}
              className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono"
            >
              {tech}
            </span>
          ))}
          {techStack.length > 5 && (
            <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-500">
              +{techStack.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* ── Agent ───────────────────────────────────────────────────────── */}
      <Agent
        userName={user.name || "Candidate"}
        userId={user.id}
        interviewId={id}
        feedbackId={feedback?.id}
        interviewRole={interviewRole}
        interviewLevel={interviewLevel}
        interviewType={interviewType}
        techStack={techStack}
        difficulty={difficulty}
        initialQuestions={initialQuestions}
      />
    </div>
  );
};

export default InterviewDetails;
