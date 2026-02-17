import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Calendar, CheckSquare, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Smart Task Management
            <span className="block text-primary">With Auto-Scheduling</span>
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl">
            JustPlan intelligently manages your tasks with automatic calendar
            scheduling and customizable workflows. Focus on what matters,
            let us handle the planning.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                Open Dashboard
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-8 sm:grid-cols-3 max-w-4xl">
          <div className="rounded-lg border bg-card p-6 text-left">
            <Calendar className="mb-4 h-10 w-10 text-primary" />
            <h3 className="mb-2 font-semibold">Auto-Scheduling</h3>
            <p className="text-sm text-muted-foreground">
              Tasks automatically placed on your calendar based on priorities
              and deadlines
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-left">
            <CheckSquare className="mb-4 h-10 w-10 text-primary" />
            <h3 className="mb-2 font-semibold">Custom Workflows</h3>
            <p className="text-sm text-muted-foreground">
              Define your own task states and automatic transitions like Jira
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-left">
            <Zap className="mb-4 h-10 w-10 text-primary" />
            <h3 className="mb-2 font-semibold">Google Integration</h3>
            <p className="text-sm text-muted-foreground">
              Two-way sync with Google Calendar and Tasks
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
