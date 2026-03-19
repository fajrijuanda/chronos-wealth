import {
  getCollaborationWorkspace,
} from "@/actions/collaboration";
import { getActiveUserEmail } from "@/lib/active-user";

import { AddAssetButton } from "./AddAssetButton";
import { AssetsPortfolioTable, mapAssetRows } from "./AssetsPortfolioTable";

export const dynamic = "force-dynamic";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const activeEmail = await getActiveUserEmail(
    typeof sp.user === "string" ? sp.user : undefined,
  );

  const workspace = await getCollaborationWorkspace(activeEmail);
  const rows = mapAssetRows({
    portfolio: workspace.portfolio,
    nonBoothAssets: workspace.nonBoothAssets,
  });

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Portfolio Aset</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Kelola aset booth dan non-booth Anda dalam satu dashboard portofolio.
          </p>
        </div>
        <AddAssetButton 
          email={workspace.currentUser.email} 
          basePrice={workspace.currentUser.boothBasePrice} 
        />
      </div>

      <AssetsPortfolioTable rows={rows} />
    </div>
  );
}
