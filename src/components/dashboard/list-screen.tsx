import type { ComponentType, ReactNode } from "react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/states";
import { NotImplementedPanel } from "@/components/common/not-implemented-panel";

/**
 * Standard layout for every list-style workspace screen: header, an honest
 * empty state (no fabricated rows) and a note about what is planned.
 */
export function ListScreen({
  title,
  description,
  actions,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  feature,
  planned,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon?: ComponentType<{ className?: string }>;
  emptyAction?: ReactNode;
  feature: string;
  planned?: string[];
  children?: ReactNode;
}) {
  return (
    <>
      <PageHeader {...(description ? { description } : {})} title={title} actions={actions} />
      {children}
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        {...(emptyIcon ? { icon: emptyIcon } : {})}
        {...(emptyAction ? { action: emptyAction } : {})}
      />
      <NotImplementedPanel feature={feature} planned={planned ?? []} />
    </>
  );
}
