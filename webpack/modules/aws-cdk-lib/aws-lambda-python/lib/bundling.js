// const fs = require("fs");
const path = require("path");
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const { AssetStaging, DockerImage } = require("aws-cdk-lib");
// import { Packaging, DependenciesFile } from "./packaging";

/**
 * Dependency files to exclude from the asset hash.
 */
export const DEPENDENCY_EXCLUDES = ["*.pyc"];

/**
 * The location in the image that the bundler image caches dependencies.
 */
export const BUNDLER_DEPENDENCIES_CACHE = "/var/dependencies";

/**
 * Produce bundled Lambda asset code
 */
export class Bundling {
  static bundle(options) {
    const bundling = new Bundling(options);
    return {
      bundling,
      code: new lambda.AssetCode(options.projectRoot, {
        assetHash: options.assetHash,
        assetHashType: options.assetHash ? cdk.AssetHashType.CUSTOM : cdk.AssetHashType.OUTPUT,
        bundling,
      }),
    };

    // return Code.fromAsset(options.entry, {
    //   assetHash: options.assetHash,
    //   assetHashType: options.assetHashType,
    //   exclude: DEPENDENCY_EXCLUDES,
    //   bundling: options.skip ? undefined : new Bundling(options),
    // });
  }

  // public readonly image;
  // public readonly command;
  // public readonly environment;

  constructor(props) {
    const { entry, runtime, architecture = Architecture.X86_64, outputPathSuffix = "", image } = props;

    const outputPath = path.posix.join(AssetStaging.BUNDLING_OUTPUT_DIR, outputPathSuffix);

    const bundlingCommands = this.createBundlingCommand({
      entry,
      inputDir: AssetStaging.BUNDLING_INPUT_DIR,
      outputDir: outputPath,
    });

    this.image = new cdk.DockerImage("noop");
    this.command = ["bash", "-c", chain(bundlingCommands)];
    this.environment = props.environment;
  }

  createBundlingCommand(options) {
    // const packaging = Packaging.fromEntry(options.entry);
    let bundlingCommands = [];
    // bundlingCommands.push(packaging.exportCommand || "");
    // if (packaging.dependenciesFile) {
    //   bundlingCommands.push(`python -m pip install -r ${DependenciesFile.PIP} -t ${options.outputDir}`);
    // }
    // bundlingCommands.push(`cp -rT ${options.inputDir}/ ${options.outputDir}`);
    return bundlingCommands;
  }
}

/**
 * Chain commands
 */
function chain(commands) {
  return commands.filter((c) => !!c).join(" && ");
}
