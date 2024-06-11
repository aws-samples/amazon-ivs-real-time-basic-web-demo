import { getSession } from "./sdk/ddb";
import { disconnectParticipant } from "./sdk/realtime";
/**
 * A function that disconnects a user from a group's stage and chat room
 */

async function disconnect(
  sessionId: string,
  participantId: string,
  reason: string,
) {
  let stageId;

  // Find resources
  try {
    ({ stageId } = await getSession(sessionId));
  } catch (err) {
    throw new Error(
      `Failed to find associated resources: ${(err as Error).toString()}`,
    );
  }

  // Disconnect from stage
  try {
    await disconnectParticipant(stageId as string, participantId, reason);
  } catch (err) {
    throw new Error(
      `Failed to disconnect from stage: ${(err as Error).toString()}`,
    );
  }

  return {
    status: "success",
  };
}

// eslint-disable-next-line import/prefer-default-export
export { disconnect };
