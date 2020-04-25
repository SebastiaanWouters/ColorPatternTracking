"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var http = __importStar(require("http"));
var socket_io_1 = __importDefault(require("socket.io"));
var path = __importStar(require("path"));
console.log("Starting server...");
var staticFolder = path.resolve(__dirname);
var htmlFolder = path.resolve(staticFolder);
exports.app = express_1["default"]();
var server = http.createServer(exports.app);
exports.io = socket_io_1["default"].listen(server, { pingTimeout: 60000 * 15 });
exports.app.use(express_1["default"].static(staticFolder));
var port = process.env.PORT || "3000";
exports.app.get("/", function (req, res) {
    res.sendFile(path.resolve(htmlFolder + "/index.html"));
});
exports.app.get("/slave", function (req, res) {
    res.sendFile(path.resolve(htmlFolder + "/slave.html"));
});
server.listen(port, function () {
    console.log("Server listening on port: " + port);
});
exports.io.on("connect", function (socket) {
    console.log("New connection!");
    socket.on("request-blanco", function () {
        exports.io.emit("display-blanco");
    });
    socket.on("request-top-left", function () {
        exports.io.emit("display-top-left");
    });
    socket.on("request-top-right", function () {
        console.log("ok");
        exports.io.emit("display-top-right");
    });
    socket.on("request-bottom-right", function () {
        exports.io.emit("display-bottom-right");
    });
    socket.on("request-bottom-left", function () {
        exports.io.emit("display-bottom-left");
    });
    socket.on("request-animation", function () {
        exports.io.emit("display-animation");
    });
    socket.on("notify-animation-end", function () {
        console.log("ANIMATION ENDED");
        exports.io.emit("slave-ended-animation");
    });
    socket.on("request-black", function () {
        exports.io.emit("display-black");
    });
    socket.on("notify-black", function () {
        exports.io.emit("slave-displayed-black");
    });
    socket.on("send-corner-size", function (msg) {
        console.log(JSON.stringify(msg));
        exports.io.emit("receive-corner-size", {
            cornerBoxSize: msg.cornerBoxSize,
            innerWidth: msg.innerWidth,
            innerHeight: msg.innerHeight
        });
    });
});
