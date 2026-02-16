export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">Welcome to JustPlan</h1>
        <p className="text-lg text-gray-600">
          Your smart task management system is ready to be built!
        </p>
        <div className="mt-8 space-y-2">
          <p>✅ Next.js configured</p>
          <p>✅ TypeScript ready</p>
          <p>✅ Tailwind CSS installed</p>
          <p>⏳ Next: Set up Supabase and authentication</p>
        </div>
      </div>
    </main>
  );
}
