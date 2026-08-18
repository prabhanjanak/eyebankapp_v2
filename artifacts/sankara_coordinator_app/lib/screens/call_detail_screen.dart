import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/eye_call.dart';
import '../services/api_service.dart';
import '../theme/ios_theme.dart';
import '../widgets/ios_glass_card.dart';
import '../widgets/status_chip.dart';

class CallDetailScreen extends StatefulWidget {
  final EyeCall call;

  const CallDetailScreen({super.key, required this.call});

  @override
  State<CallDetailScreen> createState() => _CallDetailScreenState();
}

class _CallDetailScreenState extends State<CallDetailScreen> {
  late EyeCall _call;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _call = widget.call;
  }

  Future<void> _updateStatus(String newStatus) async {
    setState(() => _isLoading = true);
    HapticFeedback.mediumImpact();
    try {
      final updated = await ApiService().updateEyeCallStatus(_call.id, newStatus);
      if (!mounted) return;
      setState(() {
        _call = updated;
      });
      _showCupertinoToast(
        newStatus == 'completed'
            ? '✅ Eye Donation Marked as Done!'
            : newStatus == 'team_sent'
                ? '🚑 Coordinator Team Dispatched!'
                : 'Status Updated to ${IOSTheme.getStatusLabel(newStatus)}',
      );
      if (newStatus == 'completed') {
        Future.delayed(const Duration(milliseconds: 600), () {
          if (mounted) Navigator.pop(context, true);
        });
      }
    } catch (e) {
      if (!mounted) return;
      _showCupertinoToast('Update Failed: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _makePhoneCall(String phone) async {
    final cleaned = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri.parse('tel:$cleaned');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      _showCupertinoToast('Could not launch dialer for $phone', isError: true);
    }
  }

  Future<void> _openWhatsApp(String phone) async {
    final cleaned = phone.replaceAll(RegExp(r'[^0-9]'), '');
    final uri = Uri.parse('https://wa.me/$cleaned?text=Hello%20from%20Sankara%20Eye%20Bank%20Coordinator.');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      _showCupertinoToast('WhatsApp not installed or could not open', isError: true);
    }
  }

  Future<void> _openMaps(String address) async {
    final query = Uri.encodeComponent(address);
    final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$query');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      _showCupertinoToast('Could not open Maps', isError: true);
    }
  }

  void _showCupertinoToast(String message, {bool isError = false}) {
    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: Text(
          isError ? 'Notice' : 'Success',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        content: Padding(
          padding: const EdgeInsets.only(top: 8),
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

  void _showStatusActionSheet() {
    showCupertinoModalPopup(
      context: context,
      builder: (BuildContext context) => CupertinoActionSheet(
        title: Text(
          'Change Call Status',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        message: Text(
          'Select updated medical coordinate triage status:',
          style: GoogleFonts.outfit(fontSize: 12),
        ),
        actions: <CupertinoActionSheetAction>[
          CupertinoActionSheetAction(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(CupertinoIcons.checkmark_circle_fill, color: IOSTheme.iosGreen, size: 20),
                const SizedBox(width: 8),
                Text('Mark as Done / Completed', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: IOSTheme.iosGreen)),
              ],
            ),
            onPressed: () {
              Navigator.pop(context);
              _updateStatus('completed');
            },
          ),
          CupertinoActionSheetAction(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(CupertinoIcons.location_fill, color: IOSTheme.iosAmber, size: 20),
                const SizedBox(width: 8),
                Text('Dispatch Team (Team Sent)', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: IOSTheme.iosAmber)),
              ],
            ),
            onPressed: () {
              Navigator.pop(context);
              _updateStatus('team_sent');
            },
          ),
          CupertinoActionSheetAction(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(CupertinoIcons.phone_fill, color: IOSTheme.iosBlue, size: 20),
                const SizedBox(width: 8),
                Text('Contacted / Call Back', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: IOSTheme.iosBlue)),
              ],
            ),
            onPressed: () {
              Navigator.pop(context);
              _updateStatus('contacted');
            },
          ),
          CupertinoActionSheetAction(
            isDestructiveAction: true,
            child: Text('Cancel Call', style: GoogleFonts.outfit()),
            onPressed: () {
              Navigator.pop(context);
              _updateStatus('cancelled');
            },
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          child: const Text('Dismiss'),
          onPressed: () => Navigator.pop(context),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final fullAddress = '${_call.address ?? ''}, ${_call.district ?? ''}, ${_call.state ?? ''} ${_call.pincode ?? ''}';

    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      navigationBar: CupertinoNavigationBar(
        backgroundColor: Colors.white.withValues(alpha: 0.85),
        middle: Text(
          _call.callId,
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: _showStatusActionSheet,
          child: const Icon(CupertinoIcons.ellipsis_circle, color: IOSTheme.primaryOrange, size: 24),
        ),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Emergency Header Card
                    IosGlassCard(
                      padding: const EdgeInsets.all(18),
                      borderColor: IOSTheme.getStatusColor(_call.status).withValues(alpha: 0.4),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              StatusChip(status: _call.status),
                              Text(
                                DateFormat('MMM d, h:mm a').format(_call.createdAt),
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: IOSTheme.iosGray,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Text(
                            _call.donorName,
                            style: GoogleFonts.outfit(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF1C1C1E),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF2F2F7),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '${_call.donorAge} YRS',
                                  style: GoogleFonts.outfit(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF3A3A3C),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF2F2F7),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  _call.donorGender.toUpperCase(),
                                  style: GoogleFonts.outfit(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF3A3A3C),
                                  ),
                                ),
                              ),
                              if (_call.hospitalUnitName != null) ...[
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    '🏥 ${_call.hospitalUnitName!}',
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.outfit(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: IOSTheme.iosBlue,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Quick Action Communication Bar
                    Row(
                      children: [
                        Expanded(
                          child: CupertinoButton(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            color: IOSTheme.iosGreen,
                            borderRadius: BorderRadius.circular(14),
                            onPressed: () => _makePhoneCall(_call.referrerMobile),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(CupertinoIcons.phone_fill, size: 16, color: Colors.white),
                                const SizedBox(width: 6),
                                Text(
                                  'Call Referrer',
                                  style: GoogleFonts.outfit(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: CupertinoButton(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            color: const Color(0xFF25D366),
                            borderRadius: BorderRadius.circular(14),
                            onPressed: () => _openWhatsApp(_call.referrerMobile),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(CupertinoIcons.chat_bubble_2_fill, size: 16, color: Colors.white),
                                const SizedBox(width: 6),
                                Text(
                                  'WhatsApp',
                                  style: GoogleFonts.outfit(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Referrer & Location Card
                    IosGlassCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'REFERRER & LOCATION DETAILS',
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: IOSTheme.iosGray,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 12),
                          _buildDetailRow('Referrer Name', _call.referrerName),
                          _buildDetailRow('Relationship', _call.referrerRelationship ?? 'Family Contact'),
                          _buildDetailRow('Mobile', _call.referrerMobile),
                          _buildDetailRow('Time of Death', _call.timeOfDeath ?? 'Not specified'),
                          _buildDetailRow('Cause of Death', _call.causeOfDeath ?? 'Not specified'),
                          const Divider(height: 20, color: Color(0xFFE5E5EA)),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(CupertinoIcons.location_solid, size: 18, color: IOSTheme.primaryOrange),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      fullAddress.trim().isNotEmpty ? fullAddress : 'Location coordinates on file',
                                      style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600),
                                    ),
                                    const SizedBox(height: 8),
                                    GestureDetector(
                                      onTap: () => _openMaps(fullAddress),
                                      child: Text(
                                        'Open in Maps ➔',
                                        style: GoogleFonts.outfit(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: IOSTheme.iosBlue,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Primary Coordinator Workflow Buttons
                    if (_call.status != 'completed') ...[
                      // Done Button
                      Container(
                        height: 52,
                        decoration: BoxDecoration(
                          gradient: IOSTheme.doneGradient,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: IOSTheme.iosGreen.withValues(alpha: 0.35),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: CupertinoButton(
                          padding: EdgeInsets.zero,
                          borderRadius: BorderRadius.circular(16),
                          onPressed: () => _updateStatus('completed'),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(CupertinoIcons.checkmark_seal_fill, color: Colors.white, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                'Mark as Done (Completed)',
                                style: GoogleFonts.outfit(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],

                    if (_call.status == 'new') ...[
                      // Dispatch Team Button
                      Container(
                        height: 50,
                        decoration: BoxDecoration(
                          gradient: IOSTheme.emergencyGradient,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: IOSTheme.primaryRed.withValues(alpha: 0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: CupertinoButton(
                          padding: EdgeInsets.zero,
                          borderRadius: BorderRadius.circular(16),
                          onPressed: () => _updateStatus('team_sent'),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(CupertinoIcons.paperplane_fill, color: Colors.white, size: 18),
                              const SizedBox(width: 8),
                              Text(
                                'Dispatch Coordinator Team',
                                style: GoogleFonts.outfit(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 30),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.outfit(fontSize: 13, color: IOSTheme.iosGray, fontWeight: FontWeight.w600),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF1C1C1E)),
            ),
          ),
        ],
      ),
    );
  }
}
