import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { Session, UserAttributes } from "../types";

const region = process.env.AWS_REGION;
const { TABLE_NAME } = process.env;

const ddbClient = DynamoDBDocument.from(
  new DynamoDBClient({ region, maxAttempts: 12 }),
);

async function scanSessions() {
  let tableData;

  try {
    tableData = await ddbClient.scan({
      TableName: TABLE_NAME as string,
      Select: "ALL_ATTRIBUTES",
    });
  } catch (err) {
    throw new Error(`Failed to get stage data: ${(err as Error).toString()}`);
  }

  return tableData.Items as Session[];
}

async function getSession(sessionId: string) {
  let tableData;

  try {
    tableData = await ddbClient.get({
      TableName: TABLE_NAME as string,
      Key: { sessionId },
    });
  } catch (err) {
    throw new Error(`Failed to get stage data: ${(err as Error).toString()}`);
  }

  return tableData.Item as Session;
}

async function putSession(
  sessionId: string,
  stageId: string,
  hostAttributes: UserAttributes,
  createdAt: string,
  expiresAt: string,
) {
  // Write info to DynamoDB
  try {
    await ddbClient.put({
      TableName: TABLE_NAME as string,
      Item: {
        sessionId,
        stageId,
        stageAttributes: hostAttributes,
        createdAt,
        expiresAt,
      },
    });
  } catch (err) {
    throw new Error(
      `Failed to update table ${TABLE_NAME}: ${(err as Error).toString()}`,
    );
  }
}

function deleteSession(sessionId: string) {
  return ddbClient.delete({
    TableName: TABLE_NAME as string,
    Key: { sessionId },
  });
}

export { ddbClient, deleteSession, getSession, putSession, scanSessions };
