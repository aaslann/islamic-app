// AdMob (react-native-google-mobile-ads) pulls in play-services-ads 25.x, whose
// Kotlin metadata binary version (2.3.0) is newer than the project's Kotlin
// compiler (2.1.0). Consuming it then fails with:
//   "Module was compiled with an incompatible version of Kotlin.
//    The binary version of its metadata is 2.3.0, expected version is 2.1.0."
//
// We don't want to bump the whole Kotlin/KSP toolchain (risky for other modules),
// so we surgically relax the metadata-version check on the Kotlin compile tasks
// with `-Xskip-metadata-version-check`. This only affects reading newer metadata
// from dependency JARs; it does not change how our own sources are compiled.
const { withProjectBuildGradle } = require('@expo/config-plugins');

const MARKER = '-Xskip-metadata-version-check';

// NOTE: use `subprojects` (not `allprojects`). The root project is already
// evaluated by the time this block at the bottom of build.gradle runs, so
// registering afterEvaluate on it throws "Cannot run Project.afterEvaluate(...)
// when the project is already evaluated". Subprojects are evaluated AFTER the
// root, so afterEvaluate registers safely — and Kotlin compile tasks only ever
// live in subprojects anyway.
const SNIPPET = `

// Added by withKotlinMetadataSkip: allow consuming AdMob's newer Kotlin metadata.
subprojects { proj ->
  proj.afterEvaluate {
    try {
      proj.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions {
          freeCompilerArgs += ["${MARKER}"]
        }
      }
    } catch (Throwable ignored) {
      // Kotlin plugin not applied to this project — nothing to do.
    }
  }
}
`;

module.exports = function withKotlinMetadataSkip(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('withKotlinMetadataSkip: yalnızca Groovy build.gradle desteklenir.');
    }
    if (!cfg.modResults.contents.includes(MARKER)) {
      cfg.modResults.contents += SNIPPET;
    }
    return cfg;
  });
};
