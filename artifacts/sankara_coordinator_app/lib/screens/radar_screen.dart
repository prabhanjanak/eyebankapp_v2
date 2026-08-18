import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../models/eye_call.dart';
import '../services/api_service.dart';
import '../services/notification_service.dart';
import '../theme/ios_theme.dart';
import '../widgets/ios_glass_card.dart';
import 'call_detail_screen.dart';

class RadarScreen extends StatefulWidget {
  const RadarScreen({super.key});

  @override
  State<RadarScreen> createState() => _RadarScreenState();
}

class _RadarScreenState extends State<RadarScreen> {
  List<EyeCall> _newCalls = [];
  bool _isLoading = true;
  bool _isGenerating = false;
  final Set<int> _dissolvedIds = {};

  @override
  void initState() {
    super.initState();
    _loadCalls();

    // Listen for live new incoming calls
    NotificationService().onNewCall.listen((call) {
      if (mounted) {
        setState(() {
          if (!_newCalls.any((c) => c.id == call.id)) {
            _newCalls.insert(0, call);
          }
        });
      }
    });
  }

  Future<void> _loadCalls() async {
    try {
      final calls = await ApiService().fetchEyeCalls(status: 'new', limit: 20);
      if (mounted) {
        setState(() {
          _newCalls = calls;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleMarkDone(EyeCall call) async {
    HapticFeedback.mediumImpact();
    setState(() {
      _dissolvedIds.add(call.id);
    });

    try {
      await ApiService().updateEyeCallStatus(call.id, 'completed');
      if (mounted) {
        setState(() {
          _newCalls.removeWhere((c) => c.id == call.id);
          _dissolvedIds.remove(call.id);
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _dissolvedIds.remove(call.id);
        });
      }
    }
  }

  Future<void> _handleDispatch(EyeCall call) async {
    HapticFeedback.mediumImpact();
    try {
      final updated = await ApiService().updateEyeCallStatus(call.id, 'team_sent');
      if (mounted) {
        setState(() {
          _newCalls.removeWhere((c) => c.id == call.id);
        });
        _showCupertinoAlert('🚑 Coordinator Dispatched', 'Transit notifications triggered for ${updated.donorName}.');
      }
    } catch (e) {
      _showCupertinoAlert('Dispatch Failed', e.toString());
    }
  }

  Future<void> _handleGenerate10() async {
    setState(() => _isGenerating = true);
    HapticFeedback.lightImpact();
    try {
      final count = await ApiService().generateDummyCalls();
      await _loadCalls();
      if (mounted) {
        _showCupertinoAlert('🚨 Alerts Dispatched', 'Successfully dispatched $count emergency test calls!');
      }
    } catch (e) {
      if (mounted) {
        _showCupertinoAlert('Failed', e.toString());
      }
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }

  void _showCupertinoAlert(String title, String message) {
    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text(message, style: GoogleFonts.outfit(fontSize: 13)),
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('OK'),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeCalls = _newCalls.where((c) => !_dissolvedIds.contains(c.id)).toList();

    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          CupertinoSliverNavigationBar(
            largeTitle: Row(
              children: [
                Text(
                  'Emergency Radar',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w900),
                ),
                const SizedBox(width: 8),
                Container(
                  width: 10,
                  height: 10,
                  decoration: const BoxDecoration(
                    color: IOSTheme.iosGreen,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.white.withValues(alpha: 0.85),
          ),

          CupertinoSliverRefreshControl(
            onRefresh: _loadCalls,
          ),

          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Quick Sandbox Actions
                IosGlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(CupertinoIcons.antenna_radiowaves_left_right, size: 16, color: IOSTheme.primaryOrange),
                          const SizedBox(width: 6),
                          Text(
                            'RADAR TEST CONTROLS',
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: IOSTheme.iosGray,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: CupertinoButton(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              color: const Color(0xFFF2F2F7),
                              borderRadius: BorderRadius.circular(10),
                              onPressed: () {
                                NotificationService().playEmergencySiren();
                              },
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(CupertinoIcons.speaker_2_fill, size: 14, color: IOSTheme.primaryOrange),
                                  const SizedBox(width: 4),
                                  Text('Sound', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF1C1C1E))),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: CupertinoButton(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              color: const Color(0xFFF2F2F7),
                              borderRadius: BorderRadius.circular(10),
                              onPressed: () {
                                NotificationService().showLocalNotification(
                                  id: 9999,
                                  title: '🚨 TEST EMERGENCY ALERT',
                                  body: 'Testing system popup chime on mobile terminal!',
                                );
                              },
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(CupertinoIcons.bell_fill, size: 14, color: IOSTheme.primaryOrange),
                                  const SizedBox(width: 4),
                                  Text('Popup', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF1C1C1E))),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: CupertinoButton(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              color: IOSTheme.primaryRed,
                              borderRadius: BorderRadius.circular(10),
                              onPressed: _isGenerating ? null : _handleGenerate10,
                              child: _isGenerating
                                  ? const CupertinoActivityIndicator(color: Colors.white)
                                  : Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(CupertinoIcons.bolt_fill, size: 14, color: Colors.white),
                                        const SizedBox(width: 4),
                                        Text('10 Dummy', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white)),
                                      ],
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Radar Feed Title
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'ACTIVE EMERGENCY CALLS',
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: IOSTheme.iosGray,
                        letterSpacing: 0.8,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: activeCalls.isNotEmpty ? IOSTheme.primaryRed : IOSTheme.iosGreen,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${activeCalls.length} PENDING',
                        style: GoogleFonts.outfit(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Call Cards List
                if (_isLoading) ...[
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(child: CupertinoActivityIndicator(radius: 14)),
                  ),
                ] else if (activeCalls.isEmpty) ...[
                  IosGlassCard(
                    padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: IOSTheme.iosGreen.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(CupertinoIcons.checkmark_seal_fill, size: 36, color: IOSTheme.iosGreen),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'Radar Frequency Clear',
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF1C1C1E),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'No pending emergency dispatches. Tap "10 Dummy" above to simulate live emergencies.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(fontSize: 12, color: IOSTheme.iosGray),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  for (final call in activeCalls)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Dismissible(
                        key: ValueKey('radar_${call.id}'),
                        direction: DismissDirection.horizontal,
                        // Swipe Right = Mark as Done
                        background: Container(
                          alignment: Alignment.centerLeft,
                          padding: const EdgeInsets.only(left: 24),
                          decoration: BoxDecoration(
                            gradient: IOSTheme.doneGradient,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              const Icon(CupertinoIcons.checkmark_seal_fill, color: Colors.white, size: 28),
                              const SizedBox(width: 8),
                              Text(
                                'Mark as Done',
                                style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14),
                              ),
                            ],
                          ),
                        ),
                        // Swipe Left = Dispatch
                        secondaryBackground: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 24),
                          decoration: BoxDecoration(
                            gradient: IOSTheme.emergencyGradient,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Text(
                                'Dispatch Team',
                                style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14),
                              ),
                              const SizedBox(width: 8),
                              const Icon(CupertinoIcons.paperplane_fill, color: Colors.white, size: 28),
                            ],
                          ),
                        ),
                        onDismissed: (direction) {
                          if (direction == DismissDirection.startToEnd) {
                            _handleMarkDone(call);
                          } else {
                            _handleDispatch(call);
                          }
                        },
                        child: IosGlassCard(
                          borderColor: IOSTheme.primaryRed.withValues(alpha: 0.35),
                          onTap: () async {
                            final res = await Navigator.push(
                              context,
                              CupertinoPageRoute(builder: (context) => CallDetailScreen(call: call)),
                            );
                            if (res == true) _loadCalls();
                          },
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(CupertinoIcons.flame_fill, size: 14, color: IOSTheme.primaryRed),
                                      const SizedBox(width: 4),
                                      Text(
                                        call.callId,
                                        style: GoogleFonts.outfit(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w900,
                                          color: IOSTheme.primaryRed,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    DateFormat('h:mm a').format(call.createdAt),
                                    style: GoogleFonts.outfit(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: IOSTheme.iosGray,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                call.donorName,
                                style: GoogleFonts.outfit(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w900,
                                  color: const Color(0xFF1C1C1E),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${call.donorAge} yrs • ${call.donorGender.toUpperCase()} • Cause: ${call.causeOfDeath ?? 'Not stated'}',
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF3A3A3C),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '📍 ${call.district ?? 'Unknown Location'}, ${call.state ?? ''}',
                                style: GoogleFonts.outfit(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: IOSTheme.primaryOrange,
                                ),
                              ),
                              const SizedBox(height: 12),

                              // Card Action Buttons
                              Row(
                                children: [
                                  Expanded(
                                    child: CupertinoButton(
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                      color: IOSTheme.primaryRed,
                                      borderRadius: BorderRadius.circular(10),
                                      onPressed: () => _handleDispatch(call),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          const Icon(CupertinoIcons.paperplane_fill, size: 12, color: Colors.white),
                                          const SizedBox(width: 4),
                                          Text('Dispatch', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white)),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: CupertinoButton(
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                      color: IOSTheme.iosGreen,
                                      borderRadius: BorderRadius.circular(10),
                                      onPressed: () => _handleMarkDone(call),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          const Icon(CupertinoIcons.checkmark_seal_fill, size: 12, color: Colors.white),
                                          const SizedBox(width: 4),
                                          Text('Done', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ]),
            ),
          ),
        ],
      ),
    );
  }
}
