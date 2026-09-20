import { MIN_PEOPLE } from "./types";

export const ERRORS: Record<string, string> = {
  title: "Give it a name.",
  venue: "Pick a place from the suggestions so we can pin it.",
  when: "Pick a time at least 10 minutes from now.",
  max: `Group size is ${MIN_PEOPLE}–6.`,
  who: "Pick who can join.",
  age: "Min age can't be more than max age.",
  save: "Couldn't save. Try again.",
};

/** IST wall-clock string for the form. No arg: next round hour, at least 90 min out. */
export function toFormWhen(iso?: string) {
  const d = iso ? new Date(iso) : new Date(Date.now() + 90 * 60000);
  if (!iso) {
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
  }
  const ist = new Date(d.getTime() + 5.5 * 3600000);
  return ist.toISOString().slice(0, 16);
}
