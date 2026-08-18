import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/notification_service.dart';
import '../theme/ios_theme.dart';
import '../widgets/ios_glass_card.dart';
import 'main_navigation_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController(text: 'prabhanjan@sankaraeye.com');
  final TextEditingController _passwordController = TextEditingController(text: 'Prabhanjan@2026');
  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _autofill(String email, String password) {
    setState(() {
      _emailController.text = email;
      _passwordController.text = password;
      _errorMessage = null;
    });
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter both email and password';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService().login(email, password);
      if (!mounted) return;

      // Start emergency radar polling
      NotificationService().startEmergencyRadar();

      Navigator.of(context).pushReplacement(
        CupertinoPageRoute(
          builder: (context) => MainNavigationScreen(user: res['user']),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showServerSettings() {
    final controller = TextEditingController(text: ApiService().baseUrl);
    showCupertinoDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => CupertinoAlertDialog(
          title: Text(
            'API Server URL',
            style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
          ),
          content: Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Column(
              children: [
                Text(
                  'Select or enter backend server URL:',
                  style: GoogleFonts.outfit(fontSize: 12),
                ),
                const SizedBox(height: 10),
                CupertinoTextField(
                  controller: controller,
                  placeholder: 'http://127.0.0.1:8080',
                  style: GoogleFonts.outfit(fontSize: 13),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    _buildPresetChip('USB (127.0.0.1)', 'http://127.0.0.1:8080', controller, setDialogState),
                    _buildPresetChip('Hotspot (10.59.13.170)', 'http://10.59.13.170:8080', controller, setDialogState),
                    _buildPresetChip('Wi-Fi (192.168.3.1)', 'http://192.168.3.1:8080', controller, setDialogState),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            CupertinoDialogAction(
              isDestructiveAction: true,
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            CupertinoDialogAction(
              isDefaultAction: true,
              onPressed: () async {
                await ApiService().setBaseUrl(controller.text);
                if (context.mounted) Navigator.pop(context);
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPresetChip(String label, String url, TextEditingController controller, StateSetter setDialogState) {
    final isSelected = controller.text == url;
    return GestureDetector(
      onTap: () {
        setDialogState(() {
          controller.text = url;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? IOSTheme.primaryOrange : const Color(0xFFF2F2F7),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: isSelected ? Colors.white : const Color(0xFF1C1C1E),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      navigationBar: CupertinoNavigationBar(
        backgroundColor: Colors.white.withValues(alpha: 0.8),
        middle: Text(
          'Coordinator Portal',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: _showServerSettings,
          child: const Icon(
            CupertinoIcons.gear_alt_fill,
            color: IOSTheme.iosGray,
            size: 22,
          ),
        ),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 10),
              // Hospital Brand Header
              Center(
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        gradient: IOSTheme.brandGradient,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: IOSTheme.primaryOrange.withValues(alpha: 0.35),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: const Icon(
                        CupertinoIcons.eye_fill,
                        size: 42,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'SANKARA EYE BANK',
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.2,
                        color: const Color(0xFF1C1C1E),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Emergency Coordinator Terminal',
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: IOSTheme.primaryOrange,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Quick Fill Coordinator Profiles
              Text(
                'QUICK COORDINATOR SELECTION',
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: IOSTheme.iosGray,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildQuickUserChip('Saravanan', 'saravanan@sankaraeye.com', 'Saravanan@2026'),
                  _buildQuickUserChip('Prabhanjan', 'prabhanjan@sankaraeye.com', 'Prabhanjan@2026'),
                  _buildQuickUserChip('Sivaprakash', 'sivaprakash@sankaraeye.com', 'Sivaprakash@2026'),
                ],
              ),

              const SizedBox(height: 24),

              // Glassmorphism Login Card
              IosGlassCard(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Sign In',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF1C1C1E),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Email Field
                    Text(
                      'EMAIL ADDRESS',
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: IOSTheme.iosGray,
                      ),
                    ),
                    const SizedBox(height: 6),
                    CupertinoTextField(
                      controller: _emailController,
                      prefix: const Padding(
                        padding: EdgeInsets.only(left: 12),
                        child: Icon(CupertinoIcons.mail, size: 18, color: IOSTheme.iosGray),
                      ),
                      placeholder: 'coordinator@sankaraeye.com',
                      keyboardType: TextInputType.emailAddress,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF2F2F7),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      style: GoogleFonts.outfit(fontSize: 14),
                    ),

                    const SizedBox(height: 16),

                    // Password Field
                    Text(
                      'PASSWORD',
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: IOSTheme.iosGray,
                      ),
                    ),
                    const SizedBox(height: 6),
                    CupertinoTextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      prefix: const Padding(
                        padding: EdgeInsets.only(left: 12),
                        child: Icon(CupertinoIcons.lock, size: 18, color: IOSTheme.iosGray),
                      ),
                      suffix: CupertinoButton(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                        child: Icon(
                          _obscurePassword ? CupertinoIcons.eye_slash : CupertinoIcons.eye,
                          size: 18,
                          color: IOSTheme.iosGray,
                        ),
                      ),
                      placeholder: '••••••••',
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF2F2F7),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      style: GoogleFonts.outfit(fontSize: 14),
                    ),

                    if (_errorMessage != null) ...[
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: IOSTheme.primaryRed.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            const Icon(CupertinoIcons.exclamationmark_triangle_fill, size: 16, color: IOSTheme.primaryRed),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: IOSTheme.primaryRed,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 16),

                    // Active Server Selector
                    GestureDetector(
                      onTap: _showServerSettings,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF2F2F7),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFE5E5EA)),
                        ),
                        child: Row(
                          children: [
                            const Icon(CupertinoIcons.antenna_radiowaves_left_right, size: 14, color: IOSTheme.iosGreen),
                            const SizedBox(width: 6),
                            Text(
                              'SERVER:',
                              style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, color: IOSTheme.iosGray),
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                ApiService().baseUrl,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF1C1C1E)),
                              ),
                            ),
                            Text(
                              'Change ➔',
                              style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w700, color: IOSTheme.iosBlue),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 18),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: IOSTheme.brandGradient,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: IOSTheme.primaryOrange.withValues(alpha: 0.35),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: CupertinoButton(
                          padding: EdgeInsets.zero,
                          borderRadius: BorderRadius.circular(14),
                          onPressed: _isLoading ? null : _handleLogin,
                          child: _isLoading
                              ? const CupertinoActivityIndicator(color: Colors.white)
                              : Text(
                                  'Sign In to Terminal',
                                  style: GoogleFonts.outfit(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 30),
              Center(
                child: Text(
                  'Connected to Sri Kanchi Kamakoti Medical Trust',
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: IOSTheme.iosGray,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickUserChip(String name, String email, String password) {
    final isSelected = _emailController.text == email;
    return GestureDetector(
      onTap: () => _autofill(email, password),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? IOSTheme.primaryOrange : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? IOSTheme.primaryOrange : const Color(0xFFE5E5EA),
            width: 1.2,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: IOSTheme.primaryOrange.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              CupertinoIcons.person_crop_circle_fill,
              size: 14,
              color: isSelected ? Colors.white : IOSTheme.primaryOrange,
            ),
            const SizedBox(width: 6),
            Text(
              name,
              style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isSelected ? Colors.white : const Color(0xFF1C1C1E),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
