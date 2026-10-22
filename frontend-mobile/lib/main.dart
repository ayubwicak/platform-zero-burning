import 'package:flutter/material.dart';
import 'package:zero_burning_mobile/screens/login_screen.dart';

void main() {
  runApp(const ZeroBurningApp());
}

class ZeroBurningApp extends StatelessWidget {
  const ZeroBurningApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Zero Burning',
      theme: ThemeData(
        primarySwatch: Colors.green,
        useMaterial3: true,
      ),
      home: const LoginScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}