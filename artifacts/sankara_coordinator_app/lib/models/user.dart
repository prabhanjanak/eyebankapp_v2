class User {
  final int id;
  final String name;
  final String email;
  final String role;
  final int? hospitalUnitId;
  final String? hospitalUnitName;
  final String? phone;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.hospitalUnitId,
    this.hospitalUnitName,
    this.phone,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      name: json['name'] ?? 'Coordinator',
      email: json['email'] ?? '',
      role: json['role'] ?? 'coordinator',
      hospitalUnitId: json['unitId'] ?? json['hospitalUnitId'],
      hospitalUnitName: json['unitName'] ?? json['hospitalUnitName'] ?? (json['hospitalUnit'] is Map ? json['hospitalUnit']['name'] : null),
      phone: json['phone'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'hospitalUnitId': hospitalUnitId,
      'hospitalUnitName': hospitalUnitName,
      'phone': phone,
    };
  }
}
