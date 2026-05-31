import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "1", score: 60 },
  { name: "2", score: 70 },
  { name: "3", score: 75 },
  { name: "4", score: 85 },
];

export default function AnalyticsPage() {
  return (
    <div className="container py-10 space-y-8">
      <h1 className="text-4xl font-bold gradient-title">
        Analytics Dashboard
      </h1>

      <div className="glass-card p-6 rounded-2xl h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="score" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}