import React from "react";

type SpinnerProps = { size?: "sm" | "md" | "lg"; className?: string };

const SIZES = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-4", lg: "w-12 h-12 border-4" };

export const Spinner = ({ size = "md", className = "" }: SpinnerProps) => (
  <span
    aria-hidden="true"
    className={`inline-block rounded-full border-blue-200 border-t-yellow-400 animate-spin ${SIZES[size]} ${className}`}
  />
);

type LoaderProps = { label?: string; className?: string };

// Inline loading indicator for sections of a page that are still fetching data.
export const Loader = ({ label = "Loading...", className = "" }: LoaderProps) => (
  <div
    role="status"
    aria-live="polite"
    className={`flex items-center justify-center gap-3 py-6 text-blue-950 ${className}`}
  >
    <Spinner />
    <span>{label}</span>
  </div>
);

// Full-screen loading page used while the app or a route is being prepared.
export const PageLoader = ({ label = "Loading..." }: { label?: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-cyan-400">
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-4">
      <Spinner size="lg" />
      <p className="text-lg font-semibold text-blue-100">{label}</p>
    </div>
  </div>
);

type ButtonLabelProps = { loading: boolean; loadingText: string; children: React.ReactNode };

// Swaps a button's label for a spinner and message while its action is running.
export const ButtonLabel = ({ loading, loadingText, children }: ButtonLabelProps) =>
  loading ? (
    <span className="inline-flex items-center justify-center gap-2">
      <Spinner size="sm" />
      {loadingText}
    </span>
  ) : (
    <>{children}</>
  );
