import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  final DatabaseReference historyRef = FirebaseDatabase.instance.ref().child(
    "trip_history",
  );

  final FirebaseAuth _auth = FirebaseAuth.instance;

  @override
  Widget build(BuildContext context) {
    String uid = _auth.currentUser!.uid;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Trip History"),
        backgroundColor: Colors.red.shade700,
      ),

      body: StreamBuilder(
        stream: historyRef.child(uid).onValue,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.snapshot.value == null) {
            return const Center(child: Text("No trip history available"));
          }

          final data = snapshot.data!.snapshot.value as Map;

          List tripList = data.values.toList().reversed.toList();

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: tripList.length,
            itemBuilder: (context, index) {
              final trip = tripList[index];

              return historyCard(
                pickup: trip["pickup"] ?? "",
                dropoff: trip["dropoff"] ?? "",
                date: trip["date"] ?? "",
                time: trip["time"] ?? "",
                status: trip["status"] ?? "",
              );
            },
          );
        },
      ),
    );
  }

  // ================= HISTORY CARD =================

  Widget historyCard({
    required String pickup,
    required String dropoff,
    required String date,
    required String time,
    required String status,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(date, style: const TextStyle(fontWeight: FontWeight.bold)),
                statusBadge(status),
              ],
            ),

            const Divider(height: 20),

            Row(
              children: [
                const Icon(Icons.location_on, color: Colors.green, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text(pickup)),
              ],
            ),

            const SizedBox(height: 8),

            Row(
              children: [
                const Icon(Icons.local_hospital, color: Colors.red, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text(dropoff)),
              ],
            ),

            const SizedBox(height: 10),

            Text(time, style: const TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget statusBadge(String status) {
    Color bgColor = status == "completed"
        ? Colors.green.shade100
        : Colors.red.shade100;

    Color textColor = status == "completed"
        ? Colors.green.shade700
        : Colors.red.shade700;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }
}
