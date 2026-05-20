// Disables lint vital release builds, which crashes in Expo SDK 55 due to
// "Unexpected failure during lint analysis of ReactStylesDiffMapBackingFieldAccessor.java"
// caused by AGP/lint trying to analyze generated source files before they exist.
const { withAppBuildGradle, withProjectBuildGradle, withMainActivity, withMainApplication } = require('@expo/config-plugins');

const APP_BUILD_LINT_BLOCK = `  lint {
    checkReleaseBuilds false
    abortOnError false
    disable 'Instantiatable', 'MissingTranslation'
  }

  buildFeatures {
    buildConfig true
    resValues true
  }
`;

// Use taskGraph.whenReady to disable lint tasks at execution time —
// safe across all subprojects regardless of when they're evaluated.
const ROOT_BUILD_LINT_DISABLE = `
gradle.taskGraph.whenReady { graph ->
  graph.allTasks.findAll { t ->
    def n = t.name
    n.contains('lintVital') || n.contains('lintAnalyze') || n.startsWith('lintReport') || n == 'lintRelease'
  }.each { t -> t.enabled = false }
}
`;

function withAppBuildGradleDisableLint(config) {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes('checkReleaseBuilds false')) {
      contents = contents.replace(
        /android\s*\{/,
        `android {\n${APP_BUILD_LINT_BLOCK}`
      );
      cfg.modResults.contents = contents;
    }
    return cfg;
  });
}

function withProjectBuildGradleDisableLint(config) {
  return withProjectBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes('gradle.taskGraph.whenReady')) {
      contents = contents + ROOT_BUILD_LINT_DISABLE;
      cfg.modResults.contents = contents;
    }
    return cfg;
  });
}

function withFixMainActivityPackage(config) {
  return withMainActivity(config, (cfg) => {
    const pkg = cfg.android && cfg.android.package;
    if (pkg) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /^package\s+[\w.]+/m,
        `package ${pkg}`
      );
    }
    return cfg;
  });
}

function withFixMainApplicationPackage(config) {
  return withMainApplication(config, (cfg) => {
    const pkg = cfg.android && cfg.android.package;
    if (pkg) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /^package\s+[\w.]+/m,
        `package ${pkg}`
      );
    }
    return cfg;
  });
}

module.exports = function withDisableLint(config) {
  config = withAppBuildGradleDisableLint(config);
  config = withProjectBuildGradleDisableLint(config);
  config = withFixMainActivityPackage(config);
  config = withFixMainApplicationPackage(config);
  return config;
};
