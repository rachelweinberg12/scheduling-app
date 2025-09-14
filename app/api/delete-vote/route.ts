import { deleteVote } from "@/db/votes";
import { CONSTS } from "@/utils/constants";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // If proposals are disabled, return success without doing anything
  if (!CONSTS.PROPOSALS) {
    return Response.json({ success: true });
  }

  const { guestId, proposalId } = (await req.json()) as {
    guestId: string;
    proposalId: string;
  };

  try {
    await deleteVote(guestId, proposalId);
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.error();
  }
}
