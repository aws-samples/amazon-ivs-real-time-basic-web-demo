import { v4 as uuidv4 } from "uuid";

import { putSession } from "./sdk/ddb";
import { createStage } from "./sdk/realtime";
import { StageResponse, UserAttributes } from "./types";
import { ParticipantToken } from "@aws-sdk/client-ivs-realtime";
import { STAGE_LIFETIME_IN_MINUTES, STAGE_LIFETIME_IN_MS } from "./constants";

/**
 * A function that creates a group with a random `sessionId` and the following
 * associated resources: Amazon IVS Stage.
 * Returns a stage token, session Id, and
 */

async function create(userId: string, attributes: UserAttributes) {
  let sessionId: string = uuidv4();
  let stageResponse: StageResponse;
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + STAGE_LIFETIME_IN_MS);

  // Create stage
  try {
    const { stage, participantTokens } = await createStage({
      userId,
      attributes,
      duration: STAGE_LIFETIME_IN_MINUTES,
    });
    stageResponse = {
      id: stage.arn as string,
      token: participantTokens[0] as ParticipantToken,
    };
  } catch (err) {
    throw new Error(`Failed to create stage: ${(err as Error).toString()}`);
  }

  // Write to db
  try {
    await putSession(
      sessionId,
      stageResponse.id,
      attributes,
      createdAt.toISOString(),
      expiresAt.toISOString(),
    );
  } catch (err) {
    throw new Error(`Failed to write details: ${(err as Error).toString()}`);
  }

  return {
    sessionId,
    stage: stageResponse,
    expiration: expiresAt.toISOString(),
  };
}

// eslint-disable-next-line import/prefer-default-export
export { create };
