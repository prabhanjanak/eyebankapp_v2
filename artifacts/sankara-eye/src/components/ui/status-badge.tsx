import { Badge } from "@/components/ui/badge";
import { EyeCallStatus } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: EyeCallStatus;
  className?: string;
}

const statusConfig: Record<EyeCallStatus, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-800 border-blue-200" },
  contacted: { label: "Contacted", color: "bg-amber-100 text-amber-800 border-amber-200" },
  team_sent: { label: "Team Sent", color: "bg-orange-100 text-orange-800 border-orange-200" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  if (!config) {
    return <Badge className={className}>{status}</Badge>;
  }

  return (
    <Badge variant="outline" className={cn("font-medium", config.color, className)}>
      {config.label}
    </Badge>
  );
}
