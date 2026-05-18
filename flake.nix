{
  description = "Lightweight Flutter dev shell (minimal Android SDK)";
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
        buildToolsVersion = "34.0.0";
        androidApiLevel = "34";
        androidComposition = pkgs.androidenv.composeAndroidPackages {
          # Keep the SDK lean for physical-device Flutter development.
          buildToolsVersions = [ buildToolsVersion ];
          platformVersions = [ androidApiLevel ];
          abiVersions = [ "arm64-v8a" ];
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
            buildInputs = [
              flutter
              androidSdk
              jdk17
            ];
            # Optional size-heavy additions (add only when needed):
            # - emulator + system images
            # - NDK/CMake for native Android builds
          };
      }
    );
}
