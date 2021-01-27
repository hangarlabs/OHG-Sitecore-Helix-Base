var gulp = require("gulp");
var _msbuild = require("msbuild");
var debug = require("gulp-debug");
var foreach = require("gulp-foreach");
var rename = require("gulp-rename");
var newer = require("gulp-newer");
var util = require("gulp-util");
var runSequence = require("run-sequence");
var config = require("./gulp-config.js")();
var unicorn = require("./script/unicorn.js");
var website = require("./script/website.js");
var yargs = require("yargs").argv;

module.exports.config = config;

gulp.task("default", function (callback) {
    config.runCleanBuilds = true;
    return runSequence(
        "01-Publish-All-Projects",
        "02-Apply-Xml-Transform",
        "03-Sync-Unicorn",
        callback);
});

gulp.task("buildonly", function (callback) {
    config.runCleanBuilds = true;
    return runSequence(
        "01-Publish-All-Projects",
        "02-Apply-Xml-Transform",
        callback);
});

gulp.task("deployLocal", function (callback) {
    config.runCleanBuilds = true;
    return runSequence(
        "01-Publish-All-Projects",
        "02-Apply-Xml-Transform",
        "03-Sync-Unicorn",
        "04-Deploy-Transforms",
        callback);
});

gulp.task("deploy", function (callback) {
    config.runCleanBuilds = true;
    return runSequence(
        "01-Publish-All-Projects",
        "02-Apply-Xml-Transform",
        "04-Deploy-Transforms",
        callback);
});

/*****************************
  Initial setup
*****************************/
gulp.task("01-Publish-All-Projects", function (callback) {
    return runSequence(
        "Build-Solution",
        "Publish-Foundation-Projects",
        "Publish-Feature-Projects",
        "Publish-Project-Projects", callback);
});

gulp.task("02-Apply-Xml-Transform", function () {
    //Currently don't have any transforms.
    var layerPathFilters = ["./src/Foundation/**/*.transform", "./src/Feature/**/*.transform", "./src/Project/**/*.transform", "!./src/**/obj/**/*.transform", "!./src/**/bin/**/*.transform"];
    return gulp.src(layerPathFilters)
        .pipe(foreach(function (stream, file) {
            var fileToTransform = file.path.replace(/.+code\\(.+)\.transform/, "$1");
            util.log("Applying configuration transform: " + file.path);
            return gulp.src("./script/applytransform.targets")
                .pipe(msbuild({
                    targets: ["ApplyTransform"],
                    configuration: config.buildConfiguration,
                    logCommand: false,
                    verbosity: "minimal",
                    stdout: true,
                    errorOnFail: true,
                    maxcpucount: 0,
                    toolsVersion: config.buildToolsVersion,
                    properties: {
                        Platform: config.buildPlatform,
                        WebConfigToTransform: config.websiteRoot,
                        TransformFile: file.path,
                        FileToTransform: fileToTransform
                    }
                }));
        }));
});

gulp.task("03-Sync-Unicorn", function (callback) {
    var options = {};
    options.siteHostName = website.getSiteUrl();
    console.log('Syncing Unicorn to ' + options.siteHostName);
    options.authenticationConfigFile = config.websiteRoot + "/App_config/Include/Unicorn/Unicorn.UI.config";

    unicorn(function () { return callback() }, options);
});

gulp.task("04-Deploy-Transforms", function () {
    return gulp.src("./src/**/code/**/*.transform")
        .pipe(gulp.dest(config.websiteRoot + "/temp/transforms"));
});

/*****************************
  Copy assemblies to all local projects
*****************************/
gulp.task("Copy-Local-Assemblies", function () {
    console.log("Copying site assemblies to all local projects");
    var files = config.sitecoreLibraries + "/**/*";

    var root = "./src";
    var projects = root + "/**/code/bin";
    return gulp.src(projects, { base: root })
        .pipe(foreach(function (stream, file) {
            console.log("copying to " + file.path);
            gulp.src(files)
                .pipe(gulp.dest(file.path));
            return stream;
        }));
});

/*****************************
  Publish
*****************************/
var publishStream = function (stream, dest) {
    var targets = ["Build"];

    console.log("Building project:");

    var msbuild = new _msbuild(stream);
    msbuild.solutionName = config.solutionName;
    var overrideParams = [];
    overrideParams.push('/p:Configuration=' + config.buildConfiguration);
    overrideParams.push('/p:DeployOnBuild=true');
    overrideParams.push('/p:DeployDefaultTarget=WebPublish');
    overrideParams.push('/p:WebPublishMethod=FileSystem');
    overrideParams.push('/p:DeleteExistingFiles=false');
    overrideParams.push('/p:publishUrl=' + dest);
    msbuild.config('overrideParams', overrideParams);
    msbuild.config('version', config.toolsVersion);
    msbuild.targets = targets;
    msbuild.build();
}

var publishProjects = function (location, dest) {
    dest = dest || config.websiteRoot;

    console.log("publish to " + dest + " folder");
    return gulp.src([location + "/**/code/*.csproj"])
        .pipe(foreach(function (stream) {
            return publishStream(stream, dest);
        }));
};

gulp.task("Build-Solution", function (callback) {
    var msbuild = new _msbuild(callback);
    msbuild.solutionName = config.solutionName;
    var overrideParams = [];
    overrideParams.push('/p:Configuration=' + config.buildConfiguration);
    overrideParams.push('/p:DeployOnBuild=true');
    overrideParams.push('/p:DeployDefaultTarget=WebPublish');
    overrideParams.push('/p:WebPublishMethod=FileSystem');
    overrideParams.push('/p:DeleteExistingFiles=false');
    overrideParams.push('/p:publishUrl=' + config.websiteRoot);
    msbuild.config('overrideParams', overrideParams);
    msbuild.config('version', config.toolsVersion);
    // msbuild.targets = ["Build"];
    msbuild.build(); // calls (callback) when done
});

gulp.task("Publish-Foundation-Projects", function () {
    return publishProjects("./src/Foundation");
});

gulp.task("Publish-Feature-Projects", function () {
    return publishProjects("./src/Feature");
});

gulp.task("Publish-Project-Projects", function () {
    return publishProjects("./src/Project");
});

gulp.task("Publish-Project", function () {
    if (yargs && yargs.m && typeof (yargs.m) == 'string') {
        return publishProject(yargs.m);
    } else {
        throw "\n\n------\n USAGE: -m Layer/Module \n------\n\n";
    }
});

gulp.task("Publish-Assemblies", function () {
    var root = "./src";
    var binFiles = root + "/**/code/**/bin/Sitecore.{Feature,Foundation}.*.{dll,pdb}";
    var destination = config.websiteRoot + "/bin/";
    return gulp.src(binFiles, { base: root })
        .pipe(rename({ dirname: "" }))
        .pipe(newer(destination))
        .pipe(debug({ title: "Copying " }))
        .pipe(gulp.dest(destination));
});

gulp.task("Publish-All-Views", function () {
    var root = "./src";
    var roots = [root + "/**/Views", "!" + root + "/**/obj/**/Views"];
    var files = "/**/*.cshtml";
    var destination = config.websiteRoot + "\\Views";
    return gulp.src(roots, { base: root }).pipe(
        foreach(function (stream, file) {
            console.log("Publishing from " + file.path);
            gulp.src(file.path + files, { base: file.path })
                .pipe(newer(destination))
                .pipe(debug({ title: "Copying " }))
                .pipe(gulp.dest(destination));
            return stream;
        })
    );
});

gulp.task("Publish-All-Configs", function () {
    var root = "./src";
    var roots = [root + "/**/App_Config", "!" + root + "/**/obj/**/App_Config"];
    var files = "/**/*.config";
    var destination = config.websiteRoot + "\\App_Config";
    return gulp.src(roots, { base: root }).pipe(
        foreach(function (stream, file) {
            console.log("Publishing from " + file.path);
            gulp.src(file.path + files, { base: file.path })
                .pipe(newer(destination))
                .pipe(debug({ title: "Copying " }))
                .pipe(gulp.dest(destination));
            return stream;
        })
    );
});

/*****************************
 Watchers
*****************************/
gulp.task("Auto-Publish-Assemblies", function () {
    var root = "./src";
    var roots = [root + "/**/code/**/bin"];
    var files = "/**/Sitecore.{Feature,Foundation}.*.{dll,pdb}";;
    var destination = config.websiteRoot + "/bin/";
    gulp.src(roots, { base: root }).pipe(
        foreach(function (stream, rootFolder) {
            gulp.watch(rootFolder.path + files, function (event) {
                if (event.type === "changed") {
                    console.log("publish this file " + event.path);
                    gulp.src(event.path, { base: rootFolder.path }).pipe(gulp.dest(destination));
                }
                console.log("published " + event.path);
            });
            return stream;
        })
    );
});
