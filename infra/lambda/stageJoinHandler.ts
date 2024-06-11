import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { joinStage } from "../src/joinStage";
import { createApiGwResponse } from "./util";
import { ErrorWithCode } from "types";

async function stageJoinHandler(
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> {
  let body;
  let result;

  try {
    body = JSON.parse(event.body as string);
  } catch (err) {
    return createApiGwResponse(400, {
      error: `Failed to parse request body: ${(err as Error).toString()}`,
    });
  }

  try {
    result = await joinStage(
      body.sessionId,
      body.userId,
      body.attributes || {},
    );
  } catch (err) {
    const { message, statusCode } = err as ErrorWithCode;

    return createApiGwResponse(statusCode, {
      error: message,
    });
  }

  return createApiGwResponse(200, result);
}

export { stageJoinHandler };
