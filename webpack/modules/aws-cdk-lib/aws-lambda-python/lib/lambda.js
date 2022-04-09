const path = require("path");
const fs = require("fs");
const { Stack } = require("aws-cdk-lib");
const { Function, RuntimeFamily } = require("aws-cdk-lib/aws-lambda");
const { Bundling } = require("./bundling");
// const { LockFile } = require("./package-manager");
// const { callsites, findUpMultiple } = require("./util");

class PythonFunction extends Function {
  constructor(scope, id, props) {
    // cdk-web python function
    const { index = "index.py", handler = "handler", runtime } = props;
    if (props.index && !/\.py$/.test(props.index)) {
      throw new Error("Only Python (.py) index files are supported.");
    }

    // Entry
    const entry = path.resolve(props.entry);
    const resolvedIndex = path.resolve(entry, index);
    if (!fs.existsSync(resolvedIndex)) {
      throw new Error(`Cannot find index file at ${resolvedIndex}`);
    }

    const resolvedHandler = `${index.slice(0, -3)}.${handler}`.replace("/", ".");

    if (props.runtime && props.runtime.family !== RuntimeFamily.PYTHON) {
      throw new Error("Only `PYTHON` runtimes are supported.");
    }

    const { bundling, code } = Bundling.bundle({
      entry,
      runtime,
      skip: !Stack.of(scope).bundlingRequired,
      ...(props.bundling || {}),
    });

    super(scope, id, {
      ...props,
      runtime,
      code,
      handler: resolvedHandler,
    });
  }
}

module.exports = {
  PythonFunction,
};
