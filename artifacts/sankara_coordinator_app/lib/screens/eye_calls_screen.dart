import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../models/eye_call.dart';
import '../services/api_service.dart';
import '../theme/ios_theme.dart';
import '../widgets/ios_glass_card.dart';
import '../widgets/status_chip.dart';
import 'call_detail_screen.dart';

class EyeCallsScreen extends StatefulWidget {
  const EyeCallsScreen({super.key});

  @override
  State<EyeCallsScreen> createState() => _EyeCallsScreenState();
}

class _EyeCallsScreenState extends State<EyeCallsScreen> {
  List<EyeCall> _allCalls = [];
  bool _isLoading = true;
  int _selectedSegment = 0;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  final Map<int, String> _segmentMap = {
    0: 'all',
    1: 'new',
    2: 'team_sent',
    3: 'completed',
  };

  @override
  void initState() {
    super.initState();
    _loadCalls();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCalls() async {
    setState(() => _isLoading = true);
    try {
      final filterStatus = _segmentMap[_selectedSegment];
      final calls = await ApiService().fetchEyeCalls(
        status: filterStatus == 'all' ? null : filterStatus,
        limit: 50,
      );
      if (mounted) {
        setState(() {
          _allCalls = calls;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleQuickDone(EyeCall call) async {
    HapticFeedback.mediumImpact();
    try {
      await ApiService().updateEyeCallStatus(call.id, 'completed');
      _loadCalls();
    } catch (e) {
      debugPrint('Quick done error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _allCalls.where((call) {
      if (_searchQuery.isEmpty) return true;
      final query = _searchQuery.toLowerCase();
      return call.donorName.toLowerCase().contains(query) ||
          call.callId.toLowerCase().contains(query) ||
          (call.district?.toLowerCase().contains(query) ?? false) ||
          call.referrerName.toLowerCase().contains(query);
    }).toList();

    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          CupertinoSliverNavigationBar(
            largeTitle: Text(
              'Eye Calls',
              style: GoogleFonts.outfit(fontWeight: FontWeight.w900),
            ),
            backgroundColor: Colors.white.withValues(alpha: 0.85),
          ),

          CupertinoSliverRefreshControl(
            onRefresh: _loadCalls,
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Column(
                children: [
                  // iOS Search Bar
                  CupertinoSearchTextField(
                    controller: _searchController,
                    placeholder: 'Search donor, ID, district...',
                    style: GoogleFonts.outfit(fontSize: 14),
                    onChanged: (val) {
                      setState(() => _searchQuery = val.trim());
                    },
                  ),
                  const SizedBox(height: 12),

                  // Cupertino Segmented Control
                  SizedBox(
                    width: double.infinity,
                    child: CupertinoSlidingSegmentedControl<int>(
                      groupValue: _selectedSegment,
                      children: {
                        0: _buildSegmentItem('All'),
                        1: _buildSegmentItem('New'),
                        2: _buildSegmentItem('Team Sent'),
                        3: _buildSegmentItem('Done'),
                      },
                      onValueChanged: (int? val) {
                        if (val != null) {
                          HapticFeedback.selectionClick();
                          setState(() => _selectedSegment = val);
                          _loadCalls();
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),

          if (_isLoading) ...[
            const SliverFillRemaining(
              child: Center(child: CupertinoActivityIndicator(radius: 14)),
            ),
          ] else if (filtered.isEmpty) ...[
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(CupertinoIcons.doc_text_search, size: 48, color: IOSTheme.iosGray),
                    const SizedBox(height: 12),
                    Text(
                      'No matching records',
                      style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF1C1C1E)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Try switching filter tabs or clearing search.',
                      style: GoogleFonts.outfit(fontSize: 12, color: IOSTheme.iosGray),
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final call = filtered[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: IosGlassCard(
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
                                    Text(
                                      call.callId,
                                      style: GoogleFonts.outfit(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w800,
                                        color: IOSTheme.primaryOrange,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    StatusChip(status: call.status, isSmall: true),
                                  ],
                                ),
                                Text(
                                  DateFormat('MMM d, h:mm a').format(call.createdAt),
                                  style: GoogleFonts.outfit(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: IOSTheme.iosGray,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              call.donorName,
                              style: GoogleFonts.outfit(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF1C1C1E),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${call.donorAge} yrs • ${call.donorGender.toUpperCase()} • ${call.district ?? 'Local'}, ${call.state ?? ''}',
                              style: GoogleFonts.outfit(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF3A3A3C),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Referrer: ${call.referrerName}',
                                  style: GoogleFonts.outfit(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: IOSTheme.iosGray,
                                  ),
                                ),
                                if (call.status == 'team_sent')
                                  CupertinoButton(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                    color: IOSTheme.iosGreen,
                                    borderRadius: BorderRadius.circular(8),
                                    onPressed: () => _handleQuickDone(call),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(CupertinoIcons.checkmark_seal_fill, size: 12, color: Colors.white),
                                        const SizedBox(width: 4),
                                        Text('Done', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white)),
                                      ],
                                    ),
                                  )
                                else
                                  const Icon(CupertinoIcons.chevron_right, size: 16, color: IOSTheme.iosGray),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                  childCount: filtered.length,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSegmentItem(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
      child: Text(
        text,
        style: GoogleFonts.outfit(
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
