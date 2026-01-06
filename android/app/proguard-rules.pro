# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ==================== REACT NATIVE CORE ====================

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# Hermes engine (required for RN 0.70+)
-keep class com.facebook.hermes.unicode.** { *; }

# React Native bridge
-keep public class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class com.facebook.react.bridge.** { *; }
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
}
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}

# TurboModules
-keep class com.facebook.react.turbomodule.** { *; }

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }

# react-native-gesture-handler
-keep class com.swmansion.gesturehandler.** { *; }
-dontwarn com.swmansion.gesturehandler.**

# react-native-screens
-keep class com.swmansion.rnscreens.** { *; }
-dontwarn com.swmansion.rnscreens.**

# react-native-svg
-keep public class com.horcrux.svg.** { *; }

# react-native-safe-area-context
-keep class com.th3rdwave.safeareacontext.** { *; }

# ==================== STRIPE SDK ====================

# Stripe core
-keep class com.stripe.** { *; }
-dontwarn com.stripe.**

# Stripe React Native SDK
-keep class com.reactnativestripesdk.** { *; }
-dontwarn com.reactnativestripesdk.**

# Stripe Push Provisioning (required for R8 with AGP 8+)
-dontwarn com.stripe.android.pushProvisioning.PushProvisioningActivity$g
-dontwarn com.stripe.android.pushProvisioning.PushProvisioningActivityStarter$Args
-dontwarn com.stripe.android.pushProvisioning.PushProvisioningActivityStarter$Error
-dontwarn com.stripe.android.pushProvisioning.PushProvisioningActivityStarter
-dontwarn com.stripe.android.pushProvisioning.PushProvisioningEphemeralKeyProvider

# ==================== GOOGLE SIGN-IN ====================

-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }

# ==================== EXPO MODULES ====================

-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# Expo modules core annotations
-keep @expo.modules.core.interfaces.DoNotStrip class *
-keepclassmembers class * {
    @expo.modules.core.interfaces.DoNotStrip *;
}

# Expo Kotlin records and shared objects
-keep class * implements expo.modules.kotlin.records.Record { *; }
-keep class * extends expo.modules.kotlin.sharedobjects.SharedObject
-keep enum * implements expo.modules.kotlin.types.Enumerable { *; }

# Expo modules
-keep,allowoptimization,allowobfuscation class * extends expo.modules.kotlin.modules.Module {
    public <init>();
    public expo.modules.kotlin.modules.ModuleDefinitionData definition();
}

# Expo views
-keepclassmembers class * implements expo.modules.kotlin.views.ExpoView {
    public <init>(android.content.Context);
    public <init>(android.content.Context, expo.modules.kotlin.AppContext);
}

# Expo view events
-keepclassmembers class * {
    expo.modules.kotlin.viewevent.ViewEventCallback *;
}
-keepclassmembers class * {
    expo.modules.kotlin.viewevent.ViewEventDelegate *;
}

# ==================== NETWORKING ====================

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# Retrofit (if used)
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }

# ==================== SERIALIZATION ====================

# Gson
-keep class com.google.gson.** { *; }
-dontwarn com.google.gson.**
-keepattributes Signature
-keepattributes *Annotation*

# Keep Kotlin Pair class names
-keepnames class kotlin.Pair

# ==================== GENERAL RULES ====================

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve line numbers for debugging stack traces
-keepattributes SourceFile,LineNumberTable

# Hide original source file names in stack traces
-renamesourcefileattribute SourceFile

# Keep annotations
-keepattributes *Annotation*
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes Signature
-keepattributes EnclosingMethod

# Suppress warnings for missing classes that are optional
-dontwarn javax.annotation.**
-dontwarn org.codehaus.mojo.animal_sniffer.**
-dontwarn sun.misc.Unsafe
