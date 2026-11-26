import { useParams } from 'react-router-dom';

export default function ProblemPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <main className="min-h-screen bg-background p-6 text-text-main">
      <h1 className="text-2xl font-semibold">Problem: {slug}</h1>
    </main>
  );
}
