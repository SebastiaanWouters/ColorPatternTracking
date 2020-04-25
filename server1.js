"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
  };
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var http = __importStar(require("http"));
var path = __importStar(require("path"));
console.log("Starting server...");
var staticFolder = path.resolve(__dirname);
var htmlFolder = path.resolve(staticFolder);
exports.app = express_1["default"]();
var server = http.createServer(exports.app);
exports.app.use(express_1["default"].static(staticFolder));
var port = process.env.PORT || "3000";
exports.app.get("/", function (req, res) {
  res.sendFile(path.resolve(htmlFolder + "/index.html"));
});
exports.app.get("/slave", function (req, res) {
  res.sendFile(path.resolve(htmlFolder + "/slave.html"));
});
exports.app.get("/slave2", function (req, res) {
  res.sendFile(path.resolve(htmlFolder + "/grayscale.html"));
});
exports.app.get("/slave3", function (req, res) {
  res.sendFile(path.resolve(htmlFolder + "/slave3.html"));
});
exports.app.get("/gray", function (req, res) {
  res.sendFile(path.resolve(htmlFolder + "/slave3.html"));
});
exports.app.get("/slave4", function (req, res) {
  res.sendFile(path.resolve(htmlFolder + "/slave4.html"));
});
exports.app.get("/3.jpg", function (req, res) {
  res.sendFile(path.resolve(staticFolder + "3.jpg"));
});
exports.app.get("/gray.png", function (req, res) {
  res.sendFile(path.resolve(staticFolder + "gray_test.png"));
});
server.listen(port, function () {
  console.log("Server listening on port: " + port);
});
