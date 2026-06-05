# Trackify — Brand & App Icon Assets

Brand green: **#06B58F**  ·  Dark background: **#0A0C0B**
Extracted from Trackify.pdf. Master icon is transparent PNG (6364×6364).

## brand/
- icon-master-transparent.png — full-res transparent green mark (use as source)
- icon-white.png / icon-black.png — monochrome flats (transparent bg)
- lockup-on-dark.png — icon + "Trackify" wordmark on dark

## ios/
- AppIcon-1024.png — App Store icon (opaque, required)
- AppIcon.appiconset/ — all @1x/@2x/@3x sizes. Drop the folder into Xcode Assets.xcassets.

## android/
- mipmap-*/ — ic_launcher (legacy), ic_launcher_round, ic_launcher_foreground (adaptive)
- mipmap-anydpi-v26/ic_launcher.xml — adaptive icon definition
- values/ic_launcher_background.xml — adaptive background color
- playstore-icon-512.png — Play Store listing icon

## web/favicon/
- favicon.ico + favicon-*.png (16–512)
- maskable-192/512, apple-touch-icon.png
- site.webmanifest (PWA) + head-snippet.html (paste into <head>)

## desktop/
- windows/Trackify.ico (multi-res 16–256)
- macos/Trackify.iconset/ — run: `iconutil -c icns Trackify.iconset` to build Trackify.icns
- linux/{size}/Trackify.png — hicolor theme sizes

Notes: iOS/Android launcher icons are opaque on dark bg (platforms add their own masking/rounding).
Web favicons keep transparency. For a light-background app, swap to brand/icon-black.png.
