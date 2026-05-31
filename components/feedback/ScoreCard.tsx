interface Props {
  title: string;
  score: number;
}

export default function ScoreCard({ title, score }: Props) {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>

      <div className="w-full bg-gray-800 rounded-full h-3">
        <div
          className="bg-cyan-400 h-3 rounded-full"
          style={{ width: `${score * 10}%` }}
        />
      </div>

      <p className="text-2xl font-bold">{score}/10</p>
    </div>
  );
}