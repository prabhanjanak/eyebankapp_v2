import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../models/user.dart';
import '../theme/ios_theme.dart';
import 'radar_screen.dart';
import 'eye_calls_screen.dart';
import 'audit_logs_screen.dart';
import 'sandbox_screen.dart';
import 'profile_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  final User? user;

  const MainNavigationScreen({super.key, this.user});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  @override
  Widget build(BuildContext context) {
    return CupertinoTabScaffold(
      tabBar: CupertinoTabBar(
        backgroundColor: Colors.white.withValues(alpha: 0.94),
        activeColor: IOSTheme.primaryOrange,
        inactiveColor: IOSTheme.iosGray,
        iconSize: 22,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.antenna_radiowaves_left_right),
            activeIcon: Icon(CupertinoIcons.antenna_radiowaves_left_right, color: IOSTheme.primaryRed),
            label: 'Radar',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.doc_text_search),
            activeIcon: Icon(CupertinoIcons.doc_text_fill, color: IOSTheme.primaryOrange),
            label: 'Eye Calls',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.shield_lefthalf_fill),
            activeIcon: Icon(CupertinoIcons.shield_fill, color: IOSTheme.primaryOrange),
            label: 'Logs',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.lab_flask),
            activeIcon: Icon(CupertinoIcons.lab_flask_solid, color: IOSTheme.primaryOrange),
            label: 'Sandbox',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.person_crop_circle),
            activeIcon: Icon(CupertinoIcons.person_crop_circle_fill, color: IOSTheme.primaryOrange),
            label: 'Profile',
          ),
        ],
      ),
      tabBuilder: (context, index) {
        switch (index) {
          case 0:
            return CupertinoTabView(
              builder: (context) => const RadarScreen(),
            );
          case 1:
            return CupertinoTabView(
              builder: (context) => const EyeCallsScreen(),
            );
          case 2:
            return CupertinoTabView(
              builder: (context) => const AuditLogsScreen(),
            );
          case 3:
            return CupertinoTabView(
              builder: (context) => const SandboxScreen(),
            );
          case 4:
            return CupertinoTabView(
              builder: (context) => ProfileScreen(user: widget.user),
            );
          default:
            return CupertinoTabView(
              builder: (context) => const RadarScreen(),
            );
        }
      },
    );
  }
}
