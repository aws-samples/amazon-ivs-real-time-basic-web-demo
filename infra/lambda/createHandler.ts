import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { createApiGwResponse } from "./util";
import { create } from "../src/create";

async function createHandler(
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
    result = await create(body.userId, body.attributes || {});
  } catch (err) {
    const message = (err as Error).toString();
    const statusCode = 500;

    return createApiGwResponse(statusCode, {
      error: message,
    });
  }

  return createApiGwResponse(200, result);
}

export { createHandler };
