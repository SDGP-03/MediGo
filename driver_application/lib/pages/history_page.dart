import 'package:driver_application/core/utils/date_utils.dart';
import 'package:driver_application/models/trip_model.dart';
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
  final TextEditingController _searchController = TextEditingController();

  String _searchQuery = '';
  String _statusFilter = 'all'; // all, completed, cancelled

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _refreshData() async {
    // Force rebuild to refresh data
    setState(() {});
    // Add small delay for better UX
    await Future.delayed(const Duration(milliseconds: 500));
  }

  List<Trip> _filterTrips(List<Trip> trips) {
    final normalizedQuery = _searchQuery.trim().toLowerCase();
    return trips.where((trip) {
      // Filter by search query
      final matchesSearch = normalizedQuery.isEmpty ||
          trip.pickup.toLowerCase().contains(normalizedQuery) ||
          trip.dropoff.toLowerCase().contains(normalizedQuery) ||
          (trip.patientName?.toLowerCase().contains(normalizedQuery) ?? false);

      // Filter by status
      final matchesStatus = _statusFilter == 'all' ||
          trip.status.toLowerCase() == _statusFilter;

      return matchesSearch && matchesStatus;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final uid = _auth.currentUser?.uid;

    if (uid == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text("Trip History", style: TextStyle(color: Colors.white)),
          backgroundColor: Colors.red.shade700,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: const Center(
          child: Text("Please log in to view trip history"),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("Trip History", style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.red.shade700,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: StreamBuilder<DatabaseEvent>(
        stream: historyRef.child(uid).onValue,
        builder: (context, snapshot) {
          // Loading state
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Colors.red.shade700),
                  const SizedBox(height: 12),
                  const Text("Loading trip history..."),
                ],
              ),
            );
          }

          // Error state
          if (snapshot.hasError) {
            return _buildErrorView(snapshot.error.toString());
          }

          // Empty state
          if (!snapshot.hasData || snapshot.data!.snapshot.value == null) {
            return _buildEmptyState();
          }

          // Parse trips
          final rawData = snapshot.data!.snapshot.value;
          if (rawData is! Map) {
            return _buildEmptyState();
          }

          final data = rawData;
          final List<Trip> allTrips = [];

          data.forEach((key, value) {
            if (value is Map) {
              allTrips.add(Trip.fromJson(key.toString(), value));
            }
          });

          // Sort by timestamp (newest first)
          allTrips.sort((a, b) => b.timestamp.compareTo(a.timestamp));

          // Filter trips
          final filteredTrips = _filterTrips(allTrips);

          return RefreshIndicator(
            onRefresh: _refreshData,
            color: Colors.red.shade700,
            child: Column(
              children: [
                // Statistics Card
                _buildStatisticsCard(allTrips),

                // Search and Filter
                _buildSearchAndFilter(),

                // Trip List
                Expanded(
                  child: filteredTrips.isEmpty
                      ? _buildNoResultsView()
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filteredTrips.length,
                          itemBuilder: (context, index) {
                            final trip = filteredTrips[index];
                            return _buildTripCard(trip);
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ================= STATISTICS CARD =================

  Widget _buildStatisticsCard(List<Trip> trips) {
    final totalTrips = trips.length;
    final completedTrips = trips.where((t) => t.isCompleted).length;
    final thisMonthTrips = trips.where((t) {
      final now = DateTime.now();
      return t.timestamp.year == now.year && t.timestamp.month == now.month;
    }).length;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.red.shade700, Colors.red.shade500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 8,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem('Total', totalTrips.toString(), Icons.local_shipping),
          _buildStatDivider(),
          _buildStatItem('Completed', completedTrips.toString(), Icons.check_circle),
          _buildStatDivider(),
          _buildStatItem('This Month', thisMonthTrips.toString(), Icons.calendar_today),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildStatDivider() {
    return Container(
      height: 50,
      width: 1,
      color: Colors.white30,
    );
  }

  // ================= SEARCH AND FILTER =================

  Widget _buildSearchAndFilter() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // Search Bar
          TextField(
            controller: _searchController,
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
              });
            },
            decoration: InputDecoration(
              hintText: 'Search trips...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _searchQuery = '';
                        });
                      },
                    )
                  : null,
              filled: true,
              fillColor: Colors.grey.shade100,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Filter Chips
          Row(
            children: [
              const Text('Filter: ', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(width: 8),
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('All', 'all'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Completed', 'completed'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Cancelled', 'cancelled'),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _statusFilter == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _statusFilter = value;
        });
      },
      selectedColor: Colors.red.shade100,
      checkmarkColor: Colors.red.shade700,
      labelStyle: TextStyle(
        color: isSelected ? Colors.red.shade700 : Colors.grey.shade700,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }

  // ================= TRIP CARD =================

  Widget _buildTripCard(Trip trip) {
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 2,
      child: InkWell(
        onTap: () => _showTripDetails(trip),
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Date and Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.calendar_today, size: 16, color: Colors.grey.shade600),
                      const SizedBox(width: 6),
                      Text(
                        AppDateUtils.getDayLabel(trip.timestamp),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                  _buildStatusBadge(trip.status),
                ],
              ),

              const SizedBox(height: 4),

              // Time
              Text(
                AppDateUtils.formatTime(trip.timestamp),
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 13,
                ),
              ),

              const Divider(height: 20),

              // Patient Name (if available)
              if (trip.patientName != null) ...[
                Row(
                  children: [
                    Icon(Icons.person, color: Colors.blue.shade700, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        trip.patientName!,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
              ],

              // Pickup Location
              Row(
                children: [
                  const Icon(Icons.circle, color: Colors.green, size: 12),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      trip.pickup,
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // Dropoff Location
              Row(
                children: [
                  const Icon(Icons.location_on, color: Colors.red, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      trip.dropoff,
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
                ],
              ),

              // Additional Info (Distance, Duration, Earnings)
              if (trip.distance != null || trip.duration != null || trip.earnings != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      if (trip.distance != null)
                        _buildInfoItem(Icons.route, trip.formattedDistance),
                      if (trip.duration != null)
                        _buildInfoItem(Icons.timer, trip.formattedDuration),
                      if (trip.earnings != null)
                        _buildInfoItem(Icons.payments, trip.formattedEarnings),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey.shade600),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey.shade700,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(String status) {
    final normalizedStatus = status.trim().toLowerCase();
    Color bgColor;
    Color textColor;
    IconData icon;

    switch (normalizedStatus) {
      case 'completed':
        bgColor = Colors.green.shade100;
        textColor = Colors.green.shade700;
        icon = Icons.check_circle;
        break;
      case 'cancelled':
      case 'canceled':
        bgColor = Colors.red.shade100;
        textColor = Colors.red.shade700;
        icon = Icons.cancel;
        break;
      default:
        bgColor = Colors.orange.shade100;
        textColor = Colors.orange.shade700;
        icon = Icons.info_outline;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 4),
          Text(
            status.trim().toUpperCase(),
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.bold,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  // ================= EMPTY STATE =================

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.history,
              size: 100,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 24),
            Text(
              'No Trips Yet',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Your completed trips will appear here',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoResultsView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 80,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              'No trips found',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try adjusting your search or filters',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ================= ERROR VIEW =================

  Widget _buildErrorView(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 80,
              color: Colors.red.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              'Oops! Something went wrong',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Failed to load trip history',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade500,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => setState(() {}),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade700,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ================= TRIP DETAILS DIALOG =================

  void _showTripDetails(Trip trip) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle bar
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // Title
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Trip Details',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    _buildStatusBadge(trip.status),
                  ],
                ),

                const SizedBox(height: 20),

                // Date and Time
                _buildDetailRow(
                  Icons.calendar_today,
                  'Date',
                  AppDateUtils.formatDate(trip.timestamp),
                ),
                _buildDetailRow(
                  Icons.access_time,
                  'Time',
                  AppDateUtils.formatTime(trip.timestamp),
                ),

                const Divider(height: 32),

                // Patient Info
                if (trip.patientName != null)
                  _buildDetailRow(
                    Icons.person,
                    'Patient',
                    trip.patientName!,
                  ),

                // Locations
                _buildDetailRow(
                  Icons.circle,
                  'Pickup',
                  trip.pickup,
                  iconColor: Colors.green,
                ),
                _buildDetailRow(
                  Icons.location_on,
                  'Dropoff',
                  trip.dropoff,
                  iconColor: Colors.red,
                ),

                const Divider(height: 32),

                // Trip Metrics
                if (trip.distance != null)
                  _buildDetailRow(
                    Icons.route,
                    'Distance',
                    trip.formattedDistance,
                  ),
                if (trip.duration != null)
                  _buildDetailRow(
                    Icons.timer,
                    'Duration',
                    trip.formattedDuration,
                  ),
                if (trip.earnings != null)
                  _buildDetailRow(
                    Icons.payments,
                    'Earnings',
                    trip.formattedEarnings,
                  ),
                if (trip.priority != null)
                  _buildDetailRow(
                    Icons.priority_high,
                    'Priority',
                    trip.priority!.toUpperCase(),
                  ),

                // Notes
                if (trip.notes != null) ...[
                  const Divider(height: 32),
                  _buildDetailRow(
                    Icons.note,
                    'Notes',
                    trip.notes!,
                  ),
                ],

                const SizedBox(height: 24),

                // Close Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red.shade700,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Close',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(
    IconData icon,
    String label,
    String value, {
    Color? iconColor,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            size: 20,
            color: iconColor ?? Colors.grey.shade600,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
