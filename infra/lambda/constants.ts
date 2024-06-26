/* 
  The DynamoDB Table Name. Must conform to the DynamoDB naming rules.
  For details, visit the following: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html#HowItWorks.NamingRules
*/
const DDBTableName = "AmazonIVSRTWebDemoTable";
const ResourceTags = { AmazonIVSDemoResource: "AmazonIVSRTWebDemoResource" };

export { DDBTableName, ResourceTags };
