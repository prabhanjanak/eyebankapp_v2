import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'models/user.dart';
import 'screens/login_screen.dart';
import 'screens/main_navigation_screen.dart';
import 'services/api_service.dart';
import 'services/notification_service.dart';
import 'theme/ios_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Status bar styling
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
    ),
  );

  // Initialize services
  await ApiService().init();
  await NotificationService().init();

  // Check existing session
  User? existingUser;
  if (ApiService().authToken != null) {
    existingUser = await ApiService().getMe();
    if (existingUser != null) {
      NotificationService().startEmergencyRadar();
    }
  }

  runApp(SankaraCoordinatorApp(initialUser: existingUser));
}

class SankaraCoordinatorApp extends StatelessWidget {
  final User? initialUser;

  const SankaraCoordinatorApp({super.key, this.initialUser});

  @override
  Widget build(BuildContext context) {
    return CupertinoApp(
      title: 'Sankara Eye Coordinator',
      debugShowCheckedModeBanner: false,
      theme: IOSTheme.cupertinoTheme,
      home: initialUser != null
          ? MainNavigationScreen(user: initialUser)
          : const LoginScreen(),
    );
  }
}
