const original = require("../../../../../node_modules/@aws-cdk/aws-lambda-python-alpha/lib/bundling");

const fs = require("fs");
const os = require("os");
const path = require("path");
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
// const { EsBuild } = require("./esbuild");

class WebAssetCode extends lambda.AssetCode {
  bind(scope) {
    scope.code = this;
    return super.bind(scope);
  }
}

class WebBundling {
  static bundle(options) {
    const bundling = options.skip ? undefined : new WebBundling(options);
    const code = new WebAssetCode(options.entry, {
      assetHash: options.assetHash,
      assetHashType: options.assetHash ? cdk.AssetHashType.CUSTOM : cdk.AssetHashType.OUTPUT,
      exclude: [],
      bundling,
    });
    code.bundling = bundling;
    return code;
  }

  constructor(props) {
    // const { entry, runtime, architecture = lambda.Architecture.X86_64, outputPathSuffix = "", image } = props;
    // const outputPath = path.join(cdk.AssetStaging.BUNDLING_OUTPUT_DIR, outputPathSuffix);
    this.image = new cdk.DockerImage("noop");
    this.command = [];
    this.environment = props.environment;
    this.local = this.getLocalBundlingProvider();
  }

  async init() {
    fs.mkdirSync(`${os.tmpdir()}/web-bundle/source`, { recursive: true });
    fs.mkdirSync(`${os.tmpdir()}/web-bundle/dist`, { recursive: true });
    const bundleOut = fs.mkdtempSync(`${os.tmpdir()}/web-bundle/source/`);
    const archiveDir = fs.mkdtempSync(`${os.tmpdir()}/web-bundle/dist/`);
    // const esbuild = new EsBuild();
    // await esbuild.build({
    //   entryPoints: [this.entrypoint],
    //   outdir: bundleOut,
    //   bundle: true,
    // });
    this._archive = await archivePackage(bundleOut, archiveDir);
    return this._archive;
  }

  getLocalBundlingProvider() {
    return {
      tryBundle: (outputDir, _) => {
        fs.writeFileSync(`${outputDir}/bundle.zip`, "");
        this._outputDir = outputDir;
        return true;
      },
    };
  }

  replaceArchive(filename) {
    const baseDir = path.dirname(this._outputDir);
    fs.renameSync(this._archive, `${baseDir}/${filename}`);
  }
}

/**
 *
 * @param {string} source - Absolute path to the source files to archive
 * @param {string} outDir - Absolute path to a directory to build the archive into
 */
async function archivePackage(source, outDir) {
  const outFile = `${outDir}/out.zip`;
  const JSZip = require("jszip");
  var zip = new JSZip();

  const sources = fs.readdirSync(source);
  for (let name of sources) {
    const contents = fs.readFileSync(`${source}/${name}`, { encoding: "utf8" });
    zip.file(name, contents);
  }
  const content = await zip.generateAsync({ type: "blob" });
  fs.writeFileSync(outFile, content);
  return outFile;
}

module.exports = {
  ...original,
  Bundling: WebBundling,
};
