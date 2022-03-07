const path = require("path");
const { __ROOT } = require("./webpack/common");
const CDK_WEB_URL = `file://${path.resolve(__ROOT, "dist/index.html")}`;

const CDK = { require };

describe("cdk-web tests", () => {
  beforeEach(async () => {
    await page.goto(CDK_WEB_URL);
    await page.reload();
  });

  it("should pass a basic truthy sanity test (node)", () => {
    expect(true).toEqual(true);
  });

  it("should pass a basic sanity test in browser (puppeteer)", async () => {
    await expect(page.title()).resolves.toMatch("cdk-web");
  });

  it("should be able to synthesize a basic stack", async () => {
    const factory = () => {
      const cdk = CDK.require("aws-cdk-lib"),
        ec2 = CDK.require("aws-cdk-lib/aws-ec2"),
        sqs = CDK.require("aws-cdk-lib/aws-sqs"),
        sns = CDK.require("aws-cdk-lib/aws-sns"),
        s3 = CDK.require("aws-cdk-lib/aws-s3");
      const app = new cdk.App(),
        stack = new cdk.Stack(app, "BrowserStack"),
        vpc = new ec2.Vpc(stack, "VPC"),
        queue = new sqs.Queue(stack, "Queue"),
        topic = new sns.Topic(stack, "Topic"),
        bucket = new s3.Bucket(stack, "Bucket"),
        assembly = app.synth();
      return assembly.getStackArtifact(stack.stackName).template;
    };
    const [pageTemplate, nodeTemplate] = await Promise.all([Promise.resolve(factory()), page.evaluate(factory)]);
    expect(pageTemplate).toMatchObject(nodeTemplate);
  });

  it("should be able to synthesize a stack with CfnInclude", async () => {
    const factory = () => {
      const fs = CDK.require("fs");
      fs.writeFileSync(
        "/tmp/input.yaml",
        JSON.stringify({
          Resources: {
            Bucket: {
              Type: "AWS::S3::Bucket",
              Properties: {
                BucketName: "some-bucket-name",
              },
            },
          },
        })
      );
      const cdk = CDK.require("aws-cdk-lib");
      const cfnInc = CDK.require("aws-cdk-lib/cloudformation-include");
      const app = new cdk.App();
      const stack = new cdk.Stack(app, "Stack");
      new cfnInc.CfnInclude(stack, "Template", {
        templateFile: "/tmp/input.yaml",
      });
      const assembly = app.synth();
      return assembly.getStackArtifact(stack.stackName).template;
    };
    const [pageTemplate, nodeTemplate] = await Promise.all([Promise.resolve(factory()), page.evaluate(factory)]);
    expect(pageTemplate).toMatchObject(nodeTemplate);
  });

  it("should be able to synthesize a basic stack with PseudoCli", async () => {
    const nodeFactory = () => {
      const cdk = require("aws-cdk-lib");
      const cfn = require("aws-cdk-lib/aws-cloudformation");
      const app = new cdk.App();
      const stack = new cdk.Stack(app, `CdkWebTestStack${Date.now()}`);
      new cfn.CfnWaitConditionHandle(stack, "NullResource");
      const assembly = app.synth();
      return assembly.getStackArtifact(stack.stackName).template;
    };
    const pageFactory = () => {
      const cdk = CDK.require("aws-cdk-lib");
      const cfn = CDK.require("aws-cdk-lib/aws-cloudformation");
      const app = new cdk.App();
      const stack = new cdk.Stack(app, `CdkWebTestStack${Date.now()}`);
      new cfn.CfnWaitConditionHandle(stack, "NullResource");
      const cli = new CDK.PseudoCli({ stack });
      return cli.synth();
    };
    const [pageTemplate, nodeTemplate] = await Promise.all([
      Promise.resolve(nodeFactory()),
      page.evaluate(pageFactory),
    ]);
    expect(pageTemplate).toMatchObject(nodeTemplate);
  });

  it("should be able to deploy and destroy a basic stack with PseudoCli", async () => {
    const factory = async (accessKeyId, secretAccessKey, sessionToken) => {
      const tic = Date.now();
      const cdk = CDK.require("aws-cdk-lib");
      const cfn = CDK.require("aws-cdk-lib/aws-cloudformation");
      const app = new cdk.App();
      const stack = new cdk.Stack(app, `CdkWebTestStack${Date.now()}`);
      new cfn.CfnWaitConditionHandle(stack, "NullResource");
      const cli = new CDK.PseudoCli({ stack, credentials: { accessKeyId, secretAccessKey, sessionToken } });
      console.log(" >> DEPLOYING...");
      await cli.deploy();
      console.log(" >> WAITING...");
      await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
      console.log(" >> DESTROYING...");
      await cli.destroy();
      const toc = Date.now();
      const took = toc - tic;
      console.log(` >> TOOK: ${took}ms`);
      return took;
    };
    await expect(
      page.evaluate(
        factory,
        process.env.AWS_ACCESS_KEY_ID,
        process.env.AWS_SECRET_ACCESS_KEY,
        process.env.AWS_SESSION_TOKEN
      )
    ).resolves.toBeGreaterThanOrEqual(1000);
  });
});
