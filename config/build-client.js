var gulp = require("gulp");
var browserify = require("browserify");
var babelify = require("babelify");
var source = require("vinyl-source-stream");
var ts = require("gulp-typescript");
var config = {
  src: "./index.ts",
  filename: "bundle.js",
  dest: "./build",
};
var extensions = [".ts", ".json"];
var b = browserify({ extensions: extensions });
b.plugin("tsify", { target: "es6" })
  .transform(
    babelify.configure({
      extensions: extensions,
    })
  )
  .add(config.src)
  .bundle()
  .on("error", function (e) {
    console.log(e.message);
    throw e;
  })
  .pipe(source(config.filename))
  .pipe(gulp.dest(config.dest));

gulp.src(["./index.html"]).pipe(gulp.dest(config.dest));
gulp.src(["./slave.html"]).pipe(gulp.dest(config.dest));
gulp.src(["./manifest.json"]).pipe(gulp.dest(config.dest));

gulp
  .src("./server.ts")
  .pipe(
    ts({
      esModuleInterop: true,
    })
  )
  .pipe(gulp.dest(config.dest));

config = {
  src: "./client.ts",
  filename: "client.js",
  dest: "./build",
};
extensions = [".ts", ".json"];
b = browserify({ extensions: extensions });
b.plugin("tsify", { target: "es6" })
  .transform(
    babelify.configure({
      extensions: extensions,
    })
  )
  .add(config.src)
  .bundle()
  .on("error", function (e) {
    console.log(e.message);
    throw e;
  })
  .pipe(source(config.filename))
  .pipe(gulp.dest(config.dest));
