import 'package:flutter_test/flutter_test.dart';
import 'package:sankara_coordinator_app/main.dart';

void main() {
  testWidgets('App renders login screen correctly', (WidgetTester tester) async {
    await tester.pumpWidget(const SankaraCoordinatorApp());
    await tester.pumpAndSettle();

    expect(find.text('Coordinator Portal'), findsOneWidget);
    expect(find.text('SANKARA EYE BANK'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);
  });
}
