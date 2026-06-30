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

// NOTE: Expo SDK 55's root project plugin eagerly EVALUATES the Expo module
// subprojects while the root build.gradle is still running. So by the time this
// appended block executes, some subprojects are already evaluated — calling
// afterEvaluate on them throws "Cannot run Project.afterEvaluate(...) when the
// project is already evaluated".
//
// We therefore branch on `proj.state.executed`: configure already-evaluated
// projects immediately, and defer the rest with afterEvaluate. In both cases we
// use `tasks.withType(...).configureEach`, which is lazy and stays valid even
// after evaluation (it configures each Kotlin compile task before it runs).
// We scope to `subprojects` because the root project has no Kotlin compile tasks.
const SNIPPET = `

// Added by withKotlinMetadataSkip: allow consuming AdMob's newer Kotlin metadata.
subprojects { proj ->
  def applyMetadataSkip = {
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
  if (proj.state.executed) {
    applyMetadataSkip()
  } else {
    proj.afterEvaluate { applyMetadataSkip() }
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
