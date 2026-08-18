import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/notification_service.dart';
import '../theme/ios_theme.dart';
import '../widgets/ios_glass_card.dart';

class SandboxScreen extends StatefulWidget {
  const SandboxScreen({super.key});

  @override
  State<SandboxScreen> createState() => _SandboxScreenState();
}

class _SandboxScreenState extends State<SandboxScreen> {
  bool _isGenerating = false;
  String? _statusLog;

  Future<void> _handleTestSound() async {
    HapticFeedback.heavyImpact();
    await NotificationService().playEmergencySiren();
    setState(() {
      _statusLog = '🔊 Dual-sequence emergency chime triggered successfully.';
    });
  }

  Future<void> _handleTestNotification() async {
    HapticFeedback.lightImpact();
    await NotificationService().showLocalNotification(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: '🚨 TEST SYSTEM POPUP: Urgent Donor Alert',
      body: 'Coordinator alert test: Donor Sunita Sharma (59 yrs) in Kanpur, UP. Tap to open triage.',
    );
    setState(() {
      _statusLog = '🔔 System notification pushed to OS tray and active banners.';
    });
  }

  Future<void> _handleGenerate10() async {
    setState(() {
      _isGenerating = true;
      _statusLog = '⏳ Dispatching 10 realistic eye donation calls to database...';
    });
    HapticFeedback.mediumImpact();

    try {
      final count = await ApiService().generateDummyCalls();
      setState(() {
        _statusLog = '✅ Successfully dispatched $count live emergency test calls across India!';
      });
    } catch (e) {
      setState(() {
        _statusLog = '❌ Dispatch failed: $e';
      });
    } finally {
      setState(() => _isGenerating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      navigationBar: CupertinoNavigationBar(
        backgroundColor: Colors.white.withValues(alpha: 0.85),
        middle: Text(
          'Testing Sandbox',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800),
        ),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Card
              IosGlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            gradient: IOSTheme.brandGradient,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(CupertinoIcons.lab_flask_solid, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Coordinator Alert Sandbox',
                                style: GoogleFonts.outfit(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF1C1C1E),
                                ),
                              ),
                              Text(
                                'Test emergency audio alarms & generate test intake data',
                                style: GoogleFonts.outfit(fontSize: 12, color: IOSTheme.iosGray),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Sound Test
              IosGlassCard(
                onTap: _handleTestSound,
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: IOSTheme.primaryOrange.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(CupertinoIcons.speaker_2_fill, color: IOSTheme.primaryOrange, size: 24),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Play Emergency Siren Chime',
                            style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700),
                          ),
                          Text(
                            'Tests dual-sequence high priority chime & haptic pulse',
                            style: GoogleFonts.outfit(fontSize: 12, color: IOSTheme.iosGray),
                          ),
                        ],
                      ),
                    ),
                    const Icon(CupertinoIcons.chevron_right, color: IOSTheme.iosGray, size: 18),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // System Notification Test
              IosGlassCard(
                onTap: _handleTestNotification,
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: IOSTheme.iosBlue.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(CupertinoIcons.bell_fill, color: IOSTheme.iosBlue, size: 24),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Trigger System Push Notification',
                            style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700),
                          ),
                          Text(
                            'Dispatches native OS banner with donor details',
                            style: GoogleFonts.outfit(fontSize: 12, color: IOSTheme.iosGray),
                          ),
                        ],
                      ),
                    ),
                    const Icon(CupertinoIcons.chevron_right, color: IOSTheme.iosGray, size: 18),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // 10 Dummy Generator
              IosGlassCard(
                borderColor: IOSTheme.primaryRed.withValues(alpha: 0.3),
                onTap: _isGenerating ? null : _handleGenerate10,
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        gradient: IOSTheme.emergencyGradient,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: _isGenerating
                          ? const CupertinoActivityIndicator(color: Colors.white)
                          : const Icon(CupertinoIcons.bolt_fill, color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Generate 10 Emergency Calls',
                            style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w800, color: IOSTheme.primaryRed),
                          ),
                          Text(
                            'Inserts 10 realistic donation coordinates into database',
                            style: GoogleFonts.outfit(fontSize: 12, color: IOSTheme.iosGray),
                          ),
                        ],
                      ),
                    ),
                    const Icon(CupertinoIcons.chevron_right, color: IOSTheme.iosGray, size: 18),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Live Status Console
              if (_statusLog != null) ...[
                IosGlassCard(
                  backgroundColor: const Color(0xFF1C1C1E),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'TERMINAL LOG',
                        style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, color: IOSTheme.iosGray, letterSpacing: 0.8),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _statusLog!,
                        style: GoogleFonts.sourceCodePro(
                          fontSize: 12,
                          color: const Color(0xFF34C759),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
