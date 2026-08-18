import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/eye_call.dart';
import '../models/user.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  static const String _defaultLocalHost = "http://10.59.13.170:8080";
  static const String _defaultIosHost = "http://10.59.13.170:8080";
  
  String _baseUrl = _defaultLocalHost;
  String? _authToken;

  String get baseUrl => _baseUrl;
  String? get authToken => _authToken;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _authToken = prefs.getString('auth_token');
    
    final savedBaseUrl = prefs.getString('base_url');
    if (savedBaseUrl != null && savedBaseUrl.isNotEmpty) {
      _baseUrl = savedBaseUrl;
    } else {
      if (!kIsWeb && Platform.isIOS) {
        _baseUrl = _defaultIosHost;
      } else {
        _baseUrl = _defaultLocalHost;
      }
    }
  }

  Future<void> setBaseUrl(String newUrl) async {
    String cleanUrl = newUrl.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
    }
    _baseUrl = cleanUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('base_url', _baseUrl);
  }

  Future<void> setAuthToken(String? token) async {
    _authToken = token;
    final prefs = await SharedPreferences.getInstance();
    if (token != null) {
      await prefs.setString('auth_token', token);
    } else {
      await prefs.remove('auth_token');
    }
  }

  Map<String, String> _getHeaders() {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-App': 'mobile_app',
    };
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
      headers['Cookie'] = 'token=$_authToken';
    }
    return headers;
  }

  // --- Auth APIs ---
  Future<Map<String, dynamic>> login(String email, String password) async {
    final url = Uri.parse('$_baseUrl/api/auth/login');
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-App': 'mobile_app',
      },
      body: jsonEncode({'email': email.trim(), 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final token = data['token'] as String?;
      if (token != null) {
        await setAuthToken(token);
      }
      final userMap = data['user'] is Map<String, dynamic>
          ? data['user'] as Map<String, dynamic>
          : data;
      final user = User.fromJson(userMap);
      return {'success': true, 'user': user, 'token': token};
    } else {
      final decoded = jsonDecode(response.body);
      final error = (decoded is Map ? decoded['error'] : null) ?? 'Login failed (${response.statusCode})';
      throw Exception(error);
    }
  }

  Future<User?> getMe() async {
    if (_authToken == null) return null;
    final url = Uri.parse('$_baseUrl/api/auth/me');
    try {
      final response = await http.get(url, headers: _getHeaders());
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final userMap = data['user'] is Map<String, dynamic>
            ? data['user'] as Map<String, dynamic>
            : data;
        return User.fromJson(userMap);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    try {
      final url = Uri.parse('$_baseUrl/api/auth/logout');
      await http.post(url, headers: _getHeaders());
    } catch (_) {}
    await setAuthToken(null);
  }

  // --- Eye Calls APIs ---
  Future<List<EyeCall>> fetchEyeCalls({String? status, int limit = 50, int page = 1}) async {
    final queryParams = <String, String>{
      'limit': limit.toString(),
      'page': page.toString(),
    };
    if (status != null && status.isNotEmpty && status != 'all') {
      queryParams['status'] = status;
    }

    final uri = Uri.parse('$_baseUrl/api/eye-calls').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: _getHeaders());

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final List<dynamic> list = data['data'] ?? [];
      return list.map((item) => EyeCall.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load eye calls (${response.statusCode})');
    }
  }

  Future<EyeCall> getEyeCallById(int id) async {
    final uri = Uri.parse('$_baseUrl/api/eye-calls/$id');
    final response = await http.get(uri, headers: _getHeaders());

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return EyeCall.fromJson(data);
    } else {
      throw Exception('Failed to get eye call #$id');
    }
  }

  Future<EyeCall> updateEyeCallStatus(int id, String newStatus) async {
    final uri = Uri.parse('$_baseUrl/api/eye-calls/$id');
    final response = await http.patch(
      uri,
      headers: _getHeaders(),
      body: jsonEncode({'status': newStatus}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return EyeCall.fromJson(data);
    } else {
      throw Exception('Failed to update status to $newStatus');
    }
  }

  Future<EyeCall> updateEyeCall(int id, Map<String, dynamic> body) async {
    final uri = Uri.parse('$_baseUrl/api/eye-calls/$id');
    final response = await http.patch(
      uri,
      headers: _getHeaders(),
      body: jsonEncode(body),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return EyeCall.fromJson(data);
    } else {
      throw Exception('Failed to update call details');
    }
  }

  Future<int> generateDummyCalls() async {
    final uri = Uri.parse('$_baseUrl/api/eye-calls/generate-dummy');
    final response = await http.post(uri, headers: _getHeaders());

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return (data['count'] as int?) ?? 10;
    } else {
      throw Exception('Failed to generate dummy calls');
    }
  }

  Future<List<dynamic>> getAuditLogs({int page = 1, int limit = 30}) async {
    final uri = Uri.parse('$_baseUrl/api/audit-logs?page=$page&limit=$limit');
    final response = await http.get(uri, headers: _getHeaders());

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['logs'] as List<dynamic>?) ?? [];
    } else {
      throw Exception('Failed to fetch audit logs');
    }
  }
}
