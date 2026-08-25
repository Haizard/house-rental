import { Skeleton } from "@/components/ui/skeleton";

export default function SignInLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="mx-auto h-4 w-36" />
        <div className="glass-surface space-y-4 p-8">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-11 w-full" />
          </div>
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </div>
    </main>
  );
}
