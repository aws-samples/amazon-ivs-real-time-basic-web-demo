#!/usr/bin/env node
import "source-map-support/register";

import { App } from "aws-cdk-lib";

import AmazonIVSRTWebDemoStack from "../lambda/stack";

const app = new App();
// eslint-disable-next-line no-new
new AmazonIVSRTWebDemoStack(app, "AmazonIVSRTWebDemoStack", {
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
