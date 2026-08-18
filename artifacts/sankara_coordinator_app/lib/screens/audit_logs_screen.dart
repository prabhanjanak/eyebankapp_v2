import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../theme/ios_theme.dart';
import '../widgets/ios_glass_card.dart';

class AuditLogsScreen extends StatefulWidget {
  const AuditLogsScreen({super.key});

  @override
  State<AuditLogsScreen> createState() => _AuditLogsScreenState();
}

class _AuditLogsScreenState extends State<AuditLogsScreen> {
  List<dynamic> _logs = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadLogs();
  }

  Future<void> _loadLogs() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final logs = await ApiService().getAuditLogs(limit: 50);
      if (mounted) {
        setState(() {
          _logs = logs;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  Color _getActionColor(String action) {
    switch (action) {
      case 'DISPATCH_COORDINATOR':
        return IOSTheme.primaryRed;
      case 'CALL_COMPLETED':
        return IOSTheme.iosGreen;
      case 'CALL_CREATED':
        return IOSTheme.primaryOrange;
      case 'LOGIN':
        return IOSTheme.iosBlue;
      default:
        return IOSTheme.iosGray;
    }
  }

  IconData _getActionIcon(String action) {
    switch (action) {
      case 'DISPATCH_COORDINATOR':
        return CupertinoIcons.paperplane_fill;
      case 'CALL_COMPLETED':
        return CupertinoIcons.checkmark_seal_fill;
      case 'CALL_CREATED':
        return CupertinoIcons.phone_fill;
      case 'LOGIN':
        return CupertinoIcons.person_badge_plus_fill;
      case 'GENERATE_DUMMY_CALLS':
        return CupertinoIcons.bolt_fill;
      default:
        return CupertinoIcons.doc_text_fill;
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      navigationBar: CupertinoNavigationBar(
        backgroundColor: Colors.white.withValues(alpha: 0.92),
        middle: Text(
          'Activity & Audit Trail',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.w800,
            fontSize: 17,
            color: const Color(0xFF1C1C1E),
          ),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: _loadLogs,
          child: const Icon(CupertinoIcons.arrow_clockwise, size: 20, color: IOSTheme.primaryOrange),
        ),
      ),
      child: SafeArea(
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          slivers: [
            CupertinoSliverRefreshControl(onRefresh: _loadLogs),
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'WHO DID WHAT • LIVE LOGS',
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: IOSTheme.iosGray,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],
                ),
              ),
            ),
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CupertinoActivityIndicator(radius: 14),
                ),
              )
            else if (_error != null)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(CupertinoIcons.exclamationmark_triangle_fill, size: 36, color: IOSTheme.primaryRed),
                        const SizedBox(height: 10),
                        Text(_error!, textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 14, color: IOSTheme.primaryRed)),
                        const SizedBox(height: 12),
                        CupertinoButton.filled(
                          onPressed: _loadLogs,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (_logs.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Text('No audit logs recorded yet', style: GoogleFonts.outfit(fontSize: 14, color: IOSTheme.iosGray)),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final log = _logs[index] as Map<String, dynamic>;
                      final action = (log['action'] ?? 'ACTIVITY') as String;
                      final userName = (log['userName'] ?? 'Coordinator') as String;
                      final description = (log['description'] ?? '') as String;
                      final clientApp = (log['clientApp'] ?? 'web') as String;
                      final isMobile = clientApp == 'mobile_app';
                      final createdAtStr = log['createdAt'] as String?;
                      DateTime createdAt = DateTime.now();
                      if (createdAtStr != null) {
                        try {
                          createdAt = DateTime.parse(createdAtStr);
                        } catch (_) {}
                      }

                      final actionColor = _getActionColor(action);
                      final actionIcon = _getActionIcon(action);

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: IosGlassCard(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(6),
                                        decoration: BoxDecoration(
                                          color: actionColor.withValues(alpha: 0.12),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(actionIcon, size: 14, color: actionColor),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        userName,
                                        style: GoogleFonts.outfit(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w800,
                                          color: const Color(0xFF1C1C1E),
                                        ),
                                      ),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: isMobile ? IOSTheme.iosGreen.withValues(alpha: 0.12) : IOSTheme.iosBlue.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          isMobile ? CupertinoIcons.device_phone_portrait : CupertinoIcons.desktopcomputer,
                                          size: 10,
                                          color: isMobile ? IOSTheme.iosGreen : IOSTheme.iosBlue,
                                        ),
                                        const SizedBox(width: 3),
                                        Text(
                                          isMobile ? 'Mobile' : 'Web',
                                          style: GoogleFonts.outfit(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                            color: isMobile ? IOSTheme.iosGreen : IOSTheme.iosBlue,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                description,
                                style: GoogleFonts.outfit(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF3A3A3C),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    DateFormat('MMM d • h:mm a').format(createdAt),
                                    style: GoogleFonts.outfit(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: IOSTheme.iosGray,
                                    ),
                                  ),
                                  if (log['entityId'] != null)
                                    Text(
                                      '#${log['entityId']}',
                                      style: GoogleFonts.outfit(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        color: IOSTheme.primaryOrange,
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                    childCount: _logs.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
