import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Honest placeholder for functionality that is intentionally not built yet.
 * It never fakes data or success states.
 */
export function NotImplementedPanel({
  feature,
  description,
  planned = [],
}: {
  feature: string;
  description?: string;
  planned?: string[];
}) {
  return (
    <Card className="border-dashed shadow-none">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
            <Construction className="size-4" />
          </span>
          <Badge variant="outline" className="rounded-full bg-warning/20 text-warning-foreground">
            Not implemented yet
          </Badge>
        </div>
        <CardTitle className="text-lg">{feature}</CardTitle>
        <CardDescription>
          {description ??
            "This screen is part of the current UI stage. The interactive behaviour arrives once the backend is connected."}
        </CardDescription>
      </CardHeader>
      {planned.length > 0 ? (
        <CardContent>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Planned in this screen
          </p>
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {planned.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  );
}
