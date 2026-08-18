import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/notification_service.dart';
import '../theme/ios_theme.dart';
import '../widgets/ios_glass_card.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  final User? user;

  const ProfileScreen({super.key, this.user});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late bool _soundEnabled;
  late bool _vibrationEnabled;

  @override
  void initState() {
    super.initState();
    _soundEnabled = NotificationService().isSoundEnabled;
    _vibrationEnabled = NotificationService().isVibrationEnabled;
  }

  void _handleLogout() {
    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: Text(
          'Sign Out',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        content: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(
            'Are you sure you want to log out of the Coordinator Terminal?',
            style: GoogleFonts.outfit(fontSize: 13),
          ),
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.pop(context),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('Sign Out'),
            onPressed: () async {
              final nav = Navigator.of(context);
              nav.pop();
              NotificationService().stopEmergencyRadar();
              await ApiService().logout();
              nav.pushAndRemoveUntil(
                CupertinoPageRoute(builder: (context) => const LoginScreen()),
                (route) => false,
              );
            },
          ),
        ],
      ),
    );
  }

  void _editServerUrl() {
    final controller = TextEditingController(text: ApiService().baseUrl);
    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: Text('API Server Endpoint', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Padding(
          padding: const EdgeInsets.only(top: 10),
          child: CupertinoTextField(
            controller: controller,
            placeholder: 'http://10.0.2.2:8080',
            style: GoogleFonts.outfit(fontSize: 13),
          ),
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.pop(context),
          ),
          CupertinoDialogAction(
            isDefaultAction: true,
            child: const Text('Save'),
            onPressed: () async {
              await ApiService().setBaseUrl(controller.text);
              if (mounted) setState(() {});
              if (context.mounted) Navigator.pop(context);
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.user;

    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      navigationBar: CupertinoNavigationBar(
        backgroundColor: Colors.white.withValues(alpha: 0.85),
        middle: Text(
          'Coordinator Profile',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800),
        ),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Profile Header
              IosGlassCard(
                child: Row(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        gradient: IOSTheme.brandGradient,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: IOSTheme.primaryOrange.withValues(alpha: 0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'C',
                          style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.name ?? 'Eye Bank Coordinator',
                            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: const Color(0xFF1C1C1E)),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user?.email ?? 'coordinator@sankaraeye.com',
                            style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: IOSTheme.iosGray),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: IOSTheme.primaryOrange.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              (user?.role ?? 'coordinator').toUpperCase(),
                              style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, color: IOSTheme.primaryOrange),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Preferences Section
              Text(
                'ALERT PREFERENCES',
                style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w800, color: IOSTheme.iosGray, letterSpacing: 0.8),
              ),
              const SizedBox(height: 8),
              IosGlassCard(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(CupertinoIcons.speaker_2_fill, color: IOSTheme.primaryOrange, size: 20),
                            const SizedBox(width: 12),
                            Text('Emergency Siren Chime', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600)),
                          ],
                        ),
                        CupertinoSwitch(
                          value: _soundEnabled,
                          activeTrackColor: IOSTheme.primaryOrange,
                          onChanged: (val) {
                            HapticFeedback.lightImpact();
                            setState(() => _soundEnabled = val);
                            NotificationService().setSoundEnabled(val);
                          },
                        ),
                      ],
                    ),
                    const Divider(height: 16, color: Color(0xFFE5E5EA)),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(CupertinoIcons.waveform, color: IOSTheme.iosBlue, size: 20),
                            const SizedBox(width: 12),
                            Text('Haptic Vibration Pulse', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600)),
                          ],
                        ),
                        CupertinoSwitch(
                          value: _vibrationEnabled,
                          activeTrackColor: IOSTheme.iosBlue,
                          onChanged: (val) {
                            HapticFeedback.lightImpact();
                            setState(() => _vibrationEnabled = val);
                            NotificationService().setVibrationEnabled(val);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Network / Server Settings
              Text(
                'SERVER CONNECTION',
                style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w800, color: IOSTheme.iosGray, letterSpacing: 0.8),
              ),
              const SizedBox(height: 8),
              IosGlassCard(
                onTap: _editServerUrl,
                child: Row(
                  children: [
                    const Icon(CupertinoIcons.antenna_radiowaves_left_right, color: IOSTheme.iosGreen, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Backend API Endpoint', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600)),
                          Text(ApiService().baseUrl, style: GoogleFonts.outfit(fontSize: 12, color: IOSTheme.iosGray)),
                        ],
                      ),
                    ),
                    const Icon(CupertinoIcons.chevron_right, color: IOSTheme.iosGray, size: 16),
                  ],
                ),
              ),

              const SizedBox(height: 30),

              // Sign Out Button
              CupertinoButton(
                padding: const EdgeInsets.symmetric(vertical: 14),
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                onPressed: _handleLogout,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(CupertinoIcons.square_arrow_right, color: IOSTheme.primaryRed, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'Sign Out of Coordinator Terminal',
                      style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w800, color: IOSTheme.primaryRed),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
