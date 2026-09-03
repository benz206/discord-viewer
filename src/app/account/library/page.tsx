import { notFound } from "next/navigation";

import { getUser } from "@/lib/data/meta";
import { CollectionPage } from "@/components/account/empty-collection";

export default function LibraryPage() {
  const user = getUser();
  if (!user) notFound();

  return (
    <CollectionPage
      title="Library"
      description="Games and applications in this account's Discord library."
      field="library_applications"
      value={user.library_applications}
    />
  );
}
