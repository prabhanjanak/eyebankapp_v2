import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class IOSTheme {
  // Brand & Emergency Colors
  static const Color primaryOrange = Color(0xFFFF7A18);
  static const Color primaryRed = Color(0xFFFF3B30);
  static const Color emergencyDarkRed = Color(0xFFD32F2F);
  static const Color emergencyRose = Color(0xFFFF453A);
  static const Color iosBlue = Color(0xFF007AFF);
  static const Color iosGreen = Color(0xFF34C759);
  static const Color iosAmber = Color(0xFFFF9500);
  static const Color iosGray = Color(0xFF8E8E93);
  static const Color iosLightGray = Color(0xFFF2F2F7);
  static const Color iosBackground = Color(0xFFF8F9FA);
  static const Color iosCardBg = Colors.white;

  // Gradients
  static const LinearGradient emergencyGradient = LinearGradient(
    colors: [Color(0xFFFF3B30), Color(0xFFFF453A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient brandGradient = LinearGradient(
    colors: [Color(0xFFFF7A18), Color(0xFFFF5722)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient doneGradient = LinearGradient(
    colors: [Color(0xFF34C759), Color(0xFF28A745)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Status Colors
  static Color getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'new':
        return primaryRed;
      case 'team_sent':
        return iosAmber;
      case 'contacted':
        return iosBlue;
      case 'completed':
        return iosGreen;
      case 'cancelled':
      default:
        return iosGray;
    }
  }

  static String getStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'new':
        return 'NEW EMERGENCY';
      case 'team_sent':
        return 'TEAM DISPATCHED';
      case 'contacted':
        return 'CONTACTED';
      case 'completed':
        return 'COMPLETED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return status.toUpperCase();
    }
  }

  // Cupertino Theme
  static CupertinoThemeData get cupertinoTheme {
    return CupertinoThemeData(
      brightness: Brightness.light,
      primaryColor: primaryOrange,
      primaryContrastingColor: Colors.white,
      barBackgroundColor: const Color(0xCCFFFFFF),
      scaffoldBackgroundColor: iosBackground,
      textTheme: CupertinoTextThemeData(
        primaryColor: const Color(0xFF1C1C1E),
        textStyle: GoogleFonts.outfit(
          color: const Color(0xFF1C1C1E),
          fontSize: 16,
        ),
        navTitleTextStyle: GoogleFonts.outfit(
          color: const Color(0xFF1C1C1E),
          fontSize: 17,
          fontWeight: FontWeight.w700,
        ),
        navLargeTitleTextStyle: GoogleFonts.outfit(
          color: const Color(0xFF1C1C1E),
          fontSize: 32,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
        actionTextStyle: GoogleFonts.outfit(
          color: primaryOrange,
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
        tabLabelTextStyle: GoogleFonts.outfit(
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  // Material Fallback Theme for Material Components
  static ThemeData get materialTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: iosBackground,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryOrange,
        primary: primaryOrange,
        secondary: primaryRed,
        surface: Colors.white,
      ),
      textTheme: GoogleFonts.outfitTextTheme(),
    );
  }
}
