plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// The test APK wraps the clickable preview in ../preview. It is copied into the assets at build time.
val copyPreview by tasks.registering(Sync::class) {
    from("../../preview") {
        include("*.html", "*.js", "*.json")
        exclude("test_logic.js")
    }
    into(layout.buildDirectory.dir("generated/www/www"))
}

android {
    namespace = "com.colvinj.healthfitness"
    compileSdk = 34

    defaultConfig {
        // Never change applicationId: updates must install over the old APK.
        applicationId = "com.colvinj.healthfitness"
        minSdk = 26
        targetSdk = 34
        versionCode = (System.getenv("BUILD_NUMBER") ?: "1").toInt()
        versionName = "0.3." + (System.getenv("BUILD_NUMBER") ?: "1") + "-test"
    }

    signingConfigs {
        // Same committed key for every build so test APKs update in place.
        getByName("debug") {
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        getByName("debug") { signingConfig = signingConfigs.getByName("debug") }
        getByName("release") {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    sourceSets["main"].assets.srcDir(layout.buildDirectory.dir("generated/www"))

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { buildConfig = true }
}

tasks.named("preBuild") { dependsOn(copyPreview) }

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.1")
    implementation("androidx.webkit:webkit:1.11.0")
}
