import { ParticipantToken } from "@aws-sdk/client-ivs-realtime";
import { getSession } from "./sdk/ddb";
import { createStageToken } from "sdk/realtime";
import { StageResponse, UserAttributes } from "./types";
import { ErrorWithCode } from "../lambda/util";

/**
 * A function that creates creates a stage token and chat token for the
 * stage and room associated with the provided `sessionId`
 */

async function joinStage(
  sessionId: string,
  userId: string,
  attributes: UserAttributes,
) {
  let stageResponse: StageResponse;
  let sessionExpiration: string;

  // Find resources
  try {
    const { stageId, expiresAt } = await getSession(sessionId);
    stageResponse = {
      id: stageId as string,
      token: "" as ParticipantToken,
    };
    sessionExpiration = expiresAt;
  } catch (err) {
    throw new ErrorWithCode(
      `Failed to find associated resources: ${(err as Error).toString()}`,
      400,
    );
  }

  // Create stage token
  try {
    const stageTokenData = await createStageToken(
      stageResponse.id as string,
      { userId, attributes } as { userId: string; attributes: UserAttributes },
    );
    stageResponse.token = stageTokenData;
  } catch (err) {
    throw new ErrorWithCode(
      `Failed to create stage participant token:: ${(err as Error).toString()}`,
      500,
    );
  }

  return {
    stage: stageResponse,
    expiration: sessionExpiration,
  };
}

// eslint-disable-next-line import/prefer-default-export
export { joinStage };
