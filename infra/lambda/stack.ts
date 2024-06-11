import {
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import {
  Cors,
  LambdaIntegration,
  RestApi,
  RequestValidator,
  Model,
  JsonSchemaType,
} from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  Rule as EventRule,
  Schedule as EventSchedule,
} from "aws-cdk-lib/aws-events";
import { LambdaFunction as TargetLambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";
import { DDBTableName } from "./constants";

function getPolicy(): PolicyStatement {
  return new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["ivs:*"],
    resources: ["*"],
  });
}

class AmazonIVSRTWebDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const initialPolicy = [getPolicy()];
    const runtime = Runtime.NODEJS_18_X;
    const bundling = {
      /**
       * By default, when using the NODEJS_18_X runtime, @aws-sdk/* is included in externalModules
       * since it is already available in the Lambda runtime. However, to ensure that the latest
       * @aws-sdk version is used, which contains the @aws-sdk/client-ivs-realtime package, we
       * remove @aws-sdk/* from externalModules so that we bundle it instead.
       */
      externalModules: [],
      minify: true,
    };
    const environment = { TABLE_NAME: DDBTableName };
    const timeout = Duration.minutes(1);

    const stagesTable = new Table(this, DDBTableName, {
      tableName: DDBTableName,
      partitionKey: {
        name: "sessionId",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const createFunction = new NodejsFunction(
      this,
      "AmazonIVSRTWebDemoCreateFunction",
      {
        entry: "lambda/createHandler.ts",
        handler: "createHandler",
        initialPolicy,
        runtime,
        bundling,
        environment,
        timeout,
      },
    );

    const cleanupFunction = new NodejsFunction(
      this,
      "AmazonIVSRTWebDemoCleanupFunction",
      {
        entry: "lambda/cleanupHandler.ts",
        handler: "cleanupHandler",
        initialPolicy,
        runtime,
        bundling,
        environment,
        timeout,
      },
    );

    const stageJoinFunction = new NodejsFunction(
      this,
      "AmazonIVSRTWebDemoJoinFunction",
      {
        entry: "lambda/stageJoinHandler.ts",
        handler: "stageJoinHandler",
        initialPolicy,
        runtime,
        bundling,
        environment,
        timeout,
      },
    );

    // Allow lambda handlers to access DynamoDB
    stagesTable.grantReadWriteData(createFunction);
    stagesTable.grantReadWriteData(cleanupFunction);
    stagesTable.grantReadData(stageJoinFunction);

    const api = new RestApi(this, "AmazonIVSRTWebDemoApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ["POST", "DELETE"],
        allowHeaders: Cors.DEFAULT_HEADERS,
      },
    });

    const createModel = new Model(this, "create-model-validator", {
      restApi: api,
      contentType: "application/json",
      description: "Model used to validate body of create requests.",
      modelName: "createModelCdk",
      schema: {
        type: JsonSchemaType.OBJECT,
        required: ["userId", "attributes"],
        properties: {
          userId: { type: JsonSchemaType.STRING },
          attributes: { type: JsonSchemaType.OBJECT },
        },
      },
    });

    const createRequestValidator = new RequestValidator(
      this,
      "create-request-validator",
      {
        restApi: api,
        requestValidatorName: "create-request-validator",
        validateRequestBody: true,
      },
    );

    const createPath = api.root.addResource("create");
    createPath.addMethod("POST", new LambdaIntegration(createFunction), {
      requestValidator: createRequestValidator,
      requestModels: {
        "application/json": createModel,
      },
    });

    const joinModel = new Model(this, "join-model-validator", {
      restApi: api,
      contentType: "application/json",
      description: "Model used to validate body of join requests.",
      modelName: "joinModelCdk",
      schema: {
        type: JsonSchemaType.OBJECT,
        required: ["sessionId", "userId", "attributes"],
        properties: {
          sessionId: { type: JsonSchemaType.STRING },
          userId: { type: JsonSchemaType.STRING },
          attributes: { type: JsonSchemaType.OBJECT },
        },
      },
    });

    const joinRequestValidator = new RequestValidator(
      this,
      "join-request-validator",
      {
        restApi: api,
        requestValidatorName: "join-request-validator",
        validateRequestBody: true,
      },
    );

    const joinPath = api.root.addResource("join");
    joinPath.addMethod("POST", new LambdaIntegration(stageJoinFunction), {
      requestValidator: joinRequestValidator,
      requestModels: {
        "application/json": joinModel,
      },
    });

    // Clean up stages with no users every minute
    const eventRule = new EventRule(this, "scheduleRule", {
      schedule: EventSchedule.rate(Duration.minutes(1)),
    });
    eventRule.addTarget(new TargetLambdaFunction(cleanupFunction));
  }
}

export default AmazonIVSRTWebDemoStack;
