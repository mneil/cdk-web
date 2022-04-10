const original = require("../../../../../node_modules/@aws-cdk/aws-lambda-python-alpha/lib/types");
const { PythonFunction } = require("./function");
const { Bundling } = require("./bundling");
module.exports = { ...original, PythonFunction, Bundling };
