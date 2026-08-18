import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/eye_call.dart';
import 'api_service.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  final AudioPlayer _audioPlayer = AudioPlayer();
  
  Timer? _pollingTimer;
  final Set<int> _knownCallIds = {};
  bool _isSoundEnabled = true;
  bool _isVibrationEnabled = true;

  bool get isSoundEnabled => _isSoundEnabled;
  bool get isVibrationEnabled => _isVibrationEnabled;

  // Stream controller to notify UI of new incoming calls
  final StreamController<EyeCall> _newCallStream = StreamController<EyeCall>.broadcast();
  Stream<EyeCall> get onNewCall => _newCallStream.stream;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _isSoundEnabled = prefs.getBool('pref_sound') ?? true;
    _isVibrationEnabled = prefs.getBool('pref_vibrate') ?? true;

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        debugPrint('Notification clicked: ${response.payload}');
      },
    );

    // Request permissions
    await requestPermissions();
  }

  Future<void> requestPermissions() async {
    if (!kIsWeb) {
      final androidPlatform = _localNotifications.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      if (androidPlatform != null) {
        await androidPlatform.requestNotificationsPermission();
      }

      final iOSPlatform = _localNotifications.resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin>();
      if (iOSPlatform != null) {
        await iOSPlatform.requestPermissions(
          alert: true,
          badge: true,
          sound: true,
        );
      }
    }
  }

  Future<void> setSoundEnabled(bool enabled) async {
    _isSoundEnabled = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('pref_sound', enabled);
  }

  Future<void> setVibrationEnabled(bool enabled) async {
    _isVibrationEnabled = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('pref_vibrate', enabled);
  }

  Future<void> playEmergencySiren() async {
    if (!_isSoundEnabled) return;
    try {
      if (_isVibrationEnabled) {
        HapticFeedback.heavyImpact();
      }
      // Play high pitch alert tone sequence via audio player or system sound
      SystemSound.play(SystemSoundType.alert);
      await Future.delayed(const Duration(milliseconds: 250));
      SystemSound.play(SystemSoundType.alert);
    } catch (e) {
      debugPrint('Error playing emergency sound: $e');
    }
  }

  Future<void> showLocalNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'emergency_radar_channel',
      '🚨 Sankara Eye Emergency Radar',
      channelDescription: 'High priority urgent donor notifications for eye bank coordinators',
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker',
      enableVibration: true,
      playSound: true,
      color: Color(0xFFFF3B30),
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      id: id,
      title: title,
      body: body,
      notificationDetails: notificationDetails,
      payload: payload,
    );

    if (_isSoundEnabled) {
      await playEmergencySiren();
    }
  }

  // --- Real-time Polling Engine ---
  void startEmergencyRadar() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      await _checkNewEmergencyCalls();
    });
  }

  void stopEmergencyRadar() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  Future<void> _checkNewEmergencyCalls() async {
    try {
      if (ApiService().authToken == null) return;
      final calls = await ApiService().fetchEyeCalls(status: 'new', limit: 10);
      
      for (final call in calls) {
        if (!_knownCallIds.contains(call.id)) {
          _knownCallIds.add(call.id);
          
          // Trigger instant notification and sound
          await showLocalNotification(
            id: call.id,
            title: '🚨 CRITICAL EMERGENCY CALL: ${call.callId}',
            body: 'Donor: ${call.donorName} (${call.donorAge} yrs, ${call.donorGender}). Location: ${call.district ?? 'Local'}, ${call.state ?? ''}. Contact: ${call.referrerMobile}',
            payload: call.id.toString(),
          );

          _newCallStream.add(call);
        }
      }
    } catch (e) {
      debugPrint('Polling radar error: $e');
    }
  }

  void dispose() {
    _pollingTimer?.cancel();
    _newCallStream.close();
    _audioPlayer.dispose();
  }
}
