import { deleteSession, getSession } from "./sdk/ddb";
import { deleteStage } from "./sdk/realtime";

/**
 * A function that destroys a group and it's related resources.
 */

async function deleteSessionAndResources(sessionId: string) {
  let stageId;

  // Find resources
  try {
    ({ stageId } = await getSession(sessionId));
  } catch (err) {
    throw new Error(
      `Failed to find associated resources: ${(err as Error).toString()}`,
    );
  }

  // Delete stage
  try {
    await deleteStage(stageId as string);
  } catch (err) {
    throw new Error(`Failed to delete stage: ${(err as Error).toString()}`);
  }

  // Delete db entry
  try {
    await deleteSession(sessionId);
  } catch (err) {
    throw new Error(
      `Failed to delete session table entry: ${(err as Error).toString()}`,
    );
  }
}

// eslint-disable-next-line import/prefer-default-export
export { deleteSessionAndResources };
