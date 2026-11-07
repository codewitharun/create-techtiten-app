/**
 * Release + debug signing for the generated android/ project (CNG).
 * Release key, first match wins:
 *   1. CI env: ANDROID_KEYSTORE_PATH / ANDROID_KEYSTORE_PASSWORD / ANDROID_KEY_ALIAS / ANDROID_KEY_PASSWORD
 *   2. credentials/signing.properties (MYAPP_UPLOAD_* keys, git-ignored) for local release builds
 *   3. neither: release falls back to debug signing (Play rejects it, so nothing ships by accident)
 * Debug: credentials/debug.keystore if present (keeps the same SHA-1 for Google Sign-In), else Expo's key.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARK = '// @techtiten-signing';
const HEADER = `${MARK}
def ttCredDir = new File(rootDir, "../credentials")
def ttSigning = new Properties()
def ttSigningFile = new File(ttCredDir, "signing.properties")
if (ttSigningFile.exists()) { ttSigningFile.withInputStream { ttSigning.load(it) } }
def ttDebugKeystore = new File(ttCredDir, "debug.keystore")
def ttHasRelease = System.getenv("ANDROID_KEYSTORE_PATH") || ttSigning['MYAPP_UPLOAD_STORE_FILE']

`;
const RELEASE_CONFIG = `
        release {
            if (System.getenv("ANDROID_KEYSTORE_PATH")) {
                storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            } else if (ttSigning['MYAPP_UPLOAD_STORE_FILE']) {
                storeFile new File(ttCredDir, ttSigning['MYAPP_UPLOAD_STORE_FILE'])
                storePassword ttSigning['MYAPP_UPLOAD_STORE_PASSWORD']
                keyAlias ttSigning['MYAPP_UPLOAD_KEY_ALIAS']
                keyPassword ttSigning['MYAPP_UPLOAD_KEY_PASSWORD']
            }
        }`;

function patch(gradle) {
  if (gradle.includes(MARK)) return gradle;
  const fail = (what) => { throw new Error(`[withSigning] Could not find ${what} in android/app/build.gradle. The Expo template changed: update plugins/withSigning.js.`); };
  if (!/\nandroid\s*\{/.test(gradle)) fail('"android {"');
  gradle = gradle.replace(/\nandroid\s*\{/, `\n${HEADER}android {`);
  const debugStore = /storeFile file\('debug\.keystore'\)/;
  if (!debugStore.test(gradle)) fail("storeFile file('debug.keystore')");
  gradle = gradle.replace(debugStore, "storeFile(ttDebugKeystore.exists() ? ttDebugKeystore : file('debug.keystore'))");
  const sc = /signingConfigs\s*\{/;
  if (!sc.test(gradle)) fail('"signingConfigs {"');
  gradle = gradle.replace(sc, (m) => m + RELEASE_CONFIG);
  const bt = gradle.indexOf('buildTypes');
  if (bt < 0) fail('"buildTypes"');
  const rel = gradle.indexOf('release', bt);
  const target = 'signingConfig signingConfigs.debug';
  const at = rel < 0 ? -1 : gradle.indexOf(target, rel);
  if (at < 0) fail('release signingConfig');
  return gradle.slice(0, at) + 'signingConfig ttHasRelease ? signingConfigs.release : signingConfigs.debug' + gradle.slice(at + target.length);
}

module.exports = function withSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') throw new Error('[withSigning] expected a Groovy build.gradle');
    cfg.modResults.contents = patch(cfg.modResults.contents);
    return cfg;
  });
};
module.exports.patch = patch;
