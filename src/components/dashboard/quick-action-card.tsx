import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  iconBgColor: string;
  iconColor: string;
  borderColor: string;
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  iconBgColor,
  iconColor,
  borderColor,
}: QuickActionCardProps) {
  return (
    <Card className={`hover:shadow-lg transition-all bg-white border-l-4 ${borderColor}`}>
      <CardHeader>
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 ${iconBgColor} rounded-lg`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
        <CardTitle className="text-lg mb-2">{title}</CardTitle>
        <CardDescription className="mb-4">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
