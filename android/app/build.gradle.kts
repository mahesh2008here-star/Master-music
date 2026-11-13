plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.masterwave.music"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.masterwave.music"
        minSdk = 26
        targetSdk = 35
        versionCode = 520
        versionName = "5.2.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    // Core library desugaring required by NewPipeExtractor for minSdk < 33
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs_nio:2.1.4")

    // NewPipeExtractor (TeamNewPipe)
    implementation("com.github.teamnewpipe:NewPipeExtractor:v0.24.8")

    // AndroidX Media3 ExoPlayer + MediaSession
    implementation("androidx.media3:media3-exoplayer:1.5.0")
    implementation("androidx.media3:media3-session:1.5.0")
    implementation("androidx.media3:media3-common:1.5.0")

    // Networking & Async
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
}
