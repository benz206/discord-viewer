import { FileX2 } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";

export function MissingFile({ file, what }: { file: string; what: string }) {
  return (
    <EmptyState
      icon={<FileX2 />}
      title={`No ${file}`}
      description={`This Discord export did not include ${file} for this server, so there is no ${what} data to show. Discord only exports these files for servers you owned or administered.`}
    />
  );
}
