import { scanSessions } from "../src/sdk/ddb";
import { deleteSessionAndResources } from "../src/delete";
import { Session } from "types";

async function cleanupHandler(event: any = {}): Promise<any> {
  const nowDate = new Date();

  var groups: Session[] = [];

  try {
    groups = await scanSessions();

    const deletePromises = [];
    for (const group of groups) {
      const elementExpiry = new Date(group.expiresAt);
      const timeUntilExpiry = elementExpiry.valueOf() - nowDate.valueOf();

      if (timeUntilExpiry <= 0) {
        deletePromises.push(deleteSessionAndResources(group.sessionId));
      }
    }

    await Promise.allSettled(deletePromises);
  } catch (err) {
    console.error(err);
  }
}

export { cleanupHandler };
