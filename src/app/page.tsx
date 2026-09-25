import { GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <GraduationCap className="size-9" />
      </div>
      <h1 className="text-3xl font-bold">TuitionDesk</h1>
      <p className="max-w-sm text-muted-foreground">
        Attendance, fees and parent reminders for your coaching centre.
      </p>
    </main>
  );
}
