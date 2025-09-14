import { getBase } from "./db";
import type { Vote } from "@/app/votes";
import { CONSTS } from "@/utils/constants";

export async function getVotesByUser(guestId: string, eventName: string) {
  // If proposals are disabled, return empty array
  if (!CONSTS.PROPOSALS) {
    return [];
  }

  const guestMatch = `{guestId} = "${guestId}"`;
  const eventMatch = `{event} = "${eventName}"`;
  const votes: Vote[] = [];
  await getBase()<Vote>("Votes")
    .select({
      fields: ["proposal", "guest", "choice"],
      filterByFormula: `AND(${guestMatch}, ${eventMatch})`,
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        votes.push({
          proposal: record.fields.proposal[0],
          guest: record.fields.guest[0],
          choice: record.fields.choice,
        });
      });
      fetchNextPage();
    });
  return votes;
}

export function deleteVotesFromProposal(sessionId: string) {
  // If proposals are disabled, do nothing
  if (!CONSTS.PROPOSALS) {
    return;
  }

  void getBase()("Votes")
    .select({
      filterByFormula: `{proposalId} = "${sessionId}"`,
    })
    .eachPage(function page(records, fetchNextPage) {
      const ids = records.map((rec) => rec.getId());
      if (ids.length > 0) {
        void getBase()("Votes").destroy(ids);
      }
      fetchNextPage();
    });
}
export function deleteVotesFromProposalByUsers(
  sessionId: string,
  users: string[]
) {
  // If proposals are disabled, do nothing
  if (!CONSTS.PROPOSALS) {
    return;
  }

  const isOneOfUsers = `OR(${users.map((user) => `{guestId} = "${user}"`).join(", ")})`;
  void getBase()("Votes")
    .select({
      filterByFormula: `AND(${isOneOfUsers}, {proposalId} = "${sessionId}")`,
    })
    .eachPage(function page(records, fetchNextPage) {
      const ids = records.map((rec) => rec.getId());
      if (ids.length > 0) {
        void getBase()("Votes").destroy(ids);
      }
      fetchNextPage();
    });
}

export async function deleteVote(guestId: string, proposalId: string) {
  // If proposals are disabled, do nothing
  if (!CONSTS.PROPOSALS) {
    return;
  }

  try {
    await getBase()("Votes")
      .select({
        filterByFormula: `AND({guestId} = "${guestId}", {proposalId} = "${proposalId}")`,
      })
      .eachPage(function page(records, fetchNextPage) {
        records.forEach(function (record) {
          getBase()("Votes").destroy([record.getId()], function (err: string) {
            if (err) {
              console.error(err);
              return;
            }
          });
        });
        fetchNextPage();
      });
  } catch (err) {
    console.error(err);
    throw err;
  }
}
