module.exports = function () {
    var instanceRoot = "C:\\inetpub\\wwwroot\\OHG\\Sitecore Sandbox\\sitecore_personal.sitecore\\sitecore_personal.sitecore";
    var config = {
        websiteRoot: instanceRoot,
        sitecoreLibraries: instanceRoot + "\\bin",
        solutionName: "Helix",
        buildConfiguration: "Debug",
        buildPlatform: "Any CPU",
        publishPlatform: "AnyCpu",
        runCleanBuilds: false,
        toolsVersion: "16.0"
    };
    return config;
}
