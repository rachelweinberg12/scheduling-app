import { getBase } from "./db";
import { CONSTS } from "@/utils/constants";

type _RawSession = {
  ID: string;
  Title: string;
  Description: string;
  "Start time": string;
  "End time": string;
  Hosts?: string[];
  "Host name"?: string[];
  "Host email"?: string;
  Location: string[];
  "Location name": string[];
  Capacity: string;
  "Num RSVPs": string;
  "Attendee scheduled": string;
  Blocker: string;
  Closed?: string;
  proposal?: string[];
  Event?: string;
};

export type Session = {
  ID: string;
  Title: string;
  Description: string;
  "Start time": string;
  "End time": string;
  Hosts?: string[];
  "Host name"?: string[];
  "Host email"?: string;
  Location: string[];
  "Location name": string[];
  Capacity: number;
  "Num RSVPs": number;
  "Attendee scheduled": boolean;
  Blocker: boolean;
  Closed?: boolean;
  // TODO: wrong type - this might be undefined (#278) - I believe that it always has 1 element or is undefined. The next comment is wrong.
  proposal?: string[]; // always has 1 or 0 values (Airtable returns an array regardless)
  Event?: string;
};

const coreSessionFields: (keyof _RawSession)[] = [
  "ID",
  "Title",
  "Description",
  "Start time",
  "End time",
  "Hosts",
  "Host name",
  "Host email",
  "Location",
  "Location name",
  "Capacity",
  "Num RSVPs",
  "Attendee scheduled",
  "Blocker",
];

const extraSessionFields: Record<string, (keyof _RawSession)[]> = {
  closedSessions: ["Closed"],
  proposals: ["proposal"],
  multipleEvents: ["Event"],
};

const fields: (keyof _RawSession)[] = [
  ...coreSessionFields,
  ...(CONSTS.CLOSED_SESSIONS ? extraSessionFields.closedSessions : []),
  ...(CONSTS.PROPOSALS ? extraSessionFields.proposals : []),
  ...(CONSTS.MULTIPLE_EVENTS ? extraSessionFields.multipleEvents : []),
];

const isScheduledFilter = "AND({Start time}, {End time}, {Location})";

export function getSessions() {
  return getSessionsByFormula(isScheduledFilter);
}

export function getSessionsByEvent(eventName: string) {
  const filterFormula = CONSTS.MULTIPLE_EVENTS
    ? `AND({Event name} = "${eventName}", ${isScheduledFilter})`
    : isScheduledFilter;
  return getSessionsByFormula(filterFormula);
}

async function getSessionsByFormula(filterFormula: string) {
  const sessions: Session[] = [];
  await getBase()<Session>("Sessions")
    .select({
      fields: fields,
      filterByFormula: filterFormula,
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        sessions.push({
          ...record.fields,
          ID: record.id,
          "Attendee scheduled": !!record.fields["Attendee scheduled"],
          Blocker: !!record.fields["Blocker"],
          Closed: !!record.fields["Closed"],
          Event: record.fields.Event?.[0],
        });
      });
      fetchNextPage();
    });
  return sessions;
}
