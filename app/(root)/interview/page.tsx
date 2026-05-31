import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const questions = [
  "Tell me about yourself and your experience.",
  "Explain a difficult technical problem you solved recently.",
  "How do you approach debugging performance issues?",
  "Describe a conflict in a team and how you handled it.",
  "What would you improve in your current skillset?"
];

const Page = async () => {
  const user = await getCurrentUser();

  return (
    <div className="container mx-auto px-5 py-10">
      <Agent
        questions={questions}
        userName={user?.name || "Candidate"}
      />
    </div>
  );
};

export default Page;