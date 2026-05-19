{
  description = "Lightweight React Native + Expo dev shell (minimal Android SDK)";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            android_sdk.accept_license = true;
            allowUnfree = true;
          };
        };
        buildToolsVersion = "35.0.0";
        androidApiLevel = "35";
        androidComposition = pkgs.androidenv.composeAndroidPackages {
          buildToolsVersions = [ "34.0.0" buildToolsVersion "36.0.0" ];
          platformVersions = [ "34" androidApiLevel "36" ];
          abiVersions = [ "arm64-v8a" ];
          includeNDK = true;
          ndkVersions = [ "27.1.12297006" ];
          cmakeVersions = [ "3.22.1" ];
        };
        androidSdk = androidComposition.androidsdk;
      in
      {
        devShell =
          with pkgs;
          mkShell rec {
            ANDROID_HOME = "${androidSdk}/libexec/android-sdk";
            ANDROID_SDK_ROOT = ANDROID_HOME;
            ANDROID_SDK = ANDROID_HOME;
            ANDROID_NDK_HOME = "${androidSdk}/libexec/android-sdk/ndk-bundle";
            ANDROID_NDK_ROOT = "${androidSdk}/libexec/android-sdk/ndk-bundle";
            buildInputs = [
              nodejs_20
              yarn
              watchman
              androidSdk
              jdk17
              git
              supabase-cli
            ];
          };
      }
    );
}
