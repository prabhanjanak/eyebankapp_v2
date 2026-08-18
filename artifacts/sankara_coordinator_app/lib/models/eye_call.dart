class EyeCall {
  final int id;
  final String callId;
  final String donorName;
  final int donorAge;
  final String donorGender;
  final String? timeOfDeath;
  final String? causeOfDeath;
  final String referrerName;
  final String referrerMobile;
  final String? referrerRelationship;
  final String? state;
  final String? district;
  final String? pincode;
  final String? address;
  final String status;
  final int? hospitalUnitId;
  final String? hospitalUnitName;
  final int? assignedCoordinatorId;
  final String? assignedCoordinatorName;
  final String? thirdPartyHospitalDetails;
  final String? thirdPartyHelperContact;
  final String? rejectionReason;
  final DateTime createdAt;
  final DateTime updatedAt;

  EyeCall({
    required this.id,
    required this.callId,
    required this.donorName,
    required this.donorAge,
    required this.donorGender,
    this.timeOfDeath,
    this.causeOfDeath,
    required this.referrerName,
    required this.referrerMobile,
    this.referrerRelationship,
    this.state,
    this.district,
    this.pincode,
    this.address,
    required this.status,
    this.hospitalUnitId,
    this.hospitalUnitName,
    this.assignedCoordinatorId,
    this.assignedCoordinatorName,
    this.thirdPartyHospitalDetails,
    this.thirdPartyHelperContact,
    this.rejectionReason,
    required this.createdAt,
    required this.updatedAt,
  });

  factory EyeCall.fromJson(Map<String, dynamic> json) {
    return EyeCall(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      callId: json['callId'] ?? 'EC-UNKNOWN',
      donorName: json['donorName'] ?? 'Unknown Donor',
      donorAge: json['donorAge'] is int ? json['donorAge'] : int.tryParse(json['donorAge']?.toString() ?? '0') ?? 0,
      donorGender: json['donorGender'] ?? 'unknown',
      timeOfDeath: json['timeOfDeath'],
      causeOfDeath: json['causeOfDeath'],
      referrerName: json['referrerName'] ?? 'Anonymous',
      referrerMobile: json['referrerMobile'] ?? '',
      referrerRelationship: json['referrerRelationship'],
      state: json['state'],
      district: json['district'],
      pincode: json['pincode'],
      address: json['address'],
      status: json['status'] ?? 'new',
      hospitalUnitId: json['hospitalUnitId'],
      hospitalUnitName: json['hospitalUnitName'] ?? json['hospitalUnit']?['name'],
      assignedCoordinatorId: json['assignedCoordinatorId'],
      assignedCoordinatorName: json['assignedCoordinator']?['name'],
      thirdPartyHospitalDetails: json['thirdPartyHospitalDetails'],
      thirdPartyHelperContact: json['thirdPartyHelperContact'],
      rejectionReason: json['rejectionReason'],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now() : DateTime.now(),
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'].toString()) ?? DateTime.now() : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'callId': callId,
      'donorName': donorName,
      'donorAge': donorAge,
      'donorGender': donorGender,
      'timeOfDeath': timeOfDeath,
      'causeOfDeath': causeOfDeath,
      'referrerName': referrerName,
      'referrerMobile': referrerMobile,
      'referrerRelationship': referrerRelationship,
      'state': state,
      'district': district,
      'pincode': pincode,
      'address': address,
      'status': status,
      'hospitalUnitId': hospitalUnitId,
      'thirdPartyHospitalDetails': thirdPartyHospitalDetails,
      'thirdPartyHelperContact': thirdPartyHelperContact,
    };
  }

  EyeCall copyWith({
    String? status,
    String? thirdPartyHospitalDetails,
    String? thirdPartyHelperContact,
  }) {
    return EyeCall(
      id: id,
      callId: callId,
      donorName: donorName,
      donorAge: donorAge,
      donorGender: donorGender,
      timeOfDeath: timeOfDeath,
      causeOfDeath: causeOfDeath,
      referrerName: referrerName,
      referrerMobile: referrerMobile,
      referrerRelationship: referrerRelationship,
      state: state,
      district: district,
      pincode: pincode,
      address: address,
      status: status ?? this.status,
      hospitalUnitId: hospitalUnitId,
      hospitalUnitName: hospitalUnitName,
      assignedCoordinatorId: assignedCoordinatorId,
      assignedCoordinatorName: assignedCoordinatorName,
      thirdPartyHospitalDetails: thirdPartyHospitalDetails ?? this.thirdPartyHospitalDetails,
      thirdPartyHelperContact: thirdPartyHelperContact ?? this.thirdPartyHelperContact,
      rejectionReason: rejectionReason,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}
