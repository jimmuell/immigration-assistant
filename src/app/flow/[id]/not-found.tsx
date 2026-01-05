import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Flow Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The immigration flow you're looking for doesn't exist or is no longer available.
        </p>
        <Link href="/">
          <Button className="w-full">
            Return to Home
          </Button>
        </Link>
      </Card>
    </div>
  );
}
