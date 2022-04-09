const code = require("../../../../../node_modules/aws-cdk-lib/core/lib/asset-staging.js");
const fs = require("fs");
const debug = require("debug")("CdkWeb:AssetStaging");

class WebAssetStaging extends code.AssetStaging {
  bundle(options, bundleDir) {
    if (fs.existsSync(bundleDir)) {
      return;
    }
    fs.mkdirSync(bundleDir, { recursive: true });
    let localBundling;
    try {
      debug("Bundling asset %s... in %s", this.node.path, bundleDir);

      localBundling = options.local && options.local.tryBundle(bundleDir, options);
      if (!localBundling) {
        throw new Error(`Only local bundling is supported. Pass a local bundler to ${this.node.path}`);
      }
    } catch (err) {
      // When bundling fails, keep the bundle output for diagnosability, but
      // rename it out of the way so that the next run doesn't assume it has a
      // valid bundleDir.
      const bundleErrorDir = bundleDir + "-error";
      if (fs.existsSync(bundleErrorDir)) {
        // Remove the last bundleErrorDir.
        fs.removeSync(bundleErrorDir);
      }

      fs.renameSync(bundleDir, bundleErrorDir);
      throw new Error(
        `Failed to bundle asset ${this.node.path}, bundle output is located at ${bundleErrorDir}: ${err}`
      );
    }

    if (fs.readdirSync(bundleDir) === []) {
      const outputDir = localBundling ? bundleDir : AssetStaging.BUNDLING_OUTPUT_DIR;
      throw new Error(`Bundling did not produce any output. Check that content is written to ${outputDir}.`);
    }
  }
}

module.exports = { ...code, AssetStaging: WebAssetStaging };
