import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We encountered an error loading this data. Please try again or check back shortly.",
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-rose-200 bg-rose-50/50 p-6 text-center flex flex-col items-center justify-center my-4",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-base font-semibold text-rose-900">{title}</h4>
      <p className="text-sm text-rose-700 max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="border-rose-300 text-rose-800 hover:bg-rose-100"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
