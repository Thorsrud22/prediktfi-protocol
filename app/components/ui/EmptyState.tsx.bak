"use client";

import Button from "./Button";
import Card from "./Card";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
  className?: string;
}

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <Card className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--surface-2)]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[color:var(--text)] mb-2">
        {title}
      </h3>
      <p className="text-[color:var(--muted)] mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <Button
          variant={action.variant || "primary"}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </Card>
  );
}
