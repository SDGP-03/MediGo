import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';

class FeedbackPage extends StatefulWidget {
  const FeedbackPage({super.key});

  @override
  State<FeedbackPage> createState() => _FeedbackPageState();
}

class _FeedbackPageState extends State<FeedbackPage> {
  final TextEditingController subjectController = TextEditingController();
  final TextEditingController messageController = TextEditingController();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DatabaseReference feedbackRef = FirebaseDatabase.instance.ref().child(
    "feedback",
  );

  bool isSending = false;

  Future<void> sendFeedback() async {
    if (subjectController.text.isEmpty || messageController.text.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Please fill all fields")));
      return;
    }

    setState(() {
      isSending = true;
    });

    try {
      String uid = _auth.currentUser!.uid;

      await feedbackRef.push().set({
        "driverId": uid,
        "subject": subjectController.text.trim(),
        "message": messageController.text.trim(),
        "timestamp": DateTime.now().toString(),
        "status": "pending",
      });

      if (!mounted) return;

      subjectController.clear();
      messageController.clear();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Feedback sent successfully")),
      );
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Failed to send feedback")));
    } finally {
      setState(() {
        isSending = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Feedback / Complaints"),
        backgroundColor: Colors.red.shade700,
      ),

      body: Padding(
        padding: const EdgeInsets.all(16),

        child: Column(
          children: [
            TextField(
              controller: subjectController,
              decoration: const InputDecoration(
                labelText: "Subject",
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 16),

            TextField(
              controller: messageController,
              maxLines: 5,
              decoration: const InputDecoration(
                labelText: "Describe your issue",
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade700,
                  foregroundColor: Colors.white,
                ),
                onPressed: isSending ? null : sendFeedback,
                child: isSending
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text("Submit"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
