import 'package:driver_application/models/assignment.dart';
import 'package:driver_application/pages/navigation_page.dart';
import 'package:driver_application/services/trip_history_service.dart';
import 'package:driver_application/core/utils/date_utils.dart';
import 'package:driver_application/models/trip_model.dart';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:driver_application/widgets/side_menu.dart';

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
  String _language = 'English';
  bool get _isSinhala => _language == 'Sinhala';
  bool get _isTamil => _language == 'Tamil';

  String t(String en, String si, [String? ta]) {
    if (_isSinhala) return si;
    if (_isTamil) return ta ?? en;
    return en;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _language = prefs.getString('language') ?? 'English';
    });
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
      final matchesSearch =
          normalizedQuery.isEmpty ||
          trip.pickup.toLowerCase().contains(normalizedQuery) ||
          trip.dropoff.toLowerCase().contains(normalizedQuery) ||
          (trip.patientName?.toLowerCase().contains(normalizedQuery) ?? false);

      // Filter by status
      final matchesStatus =
          _statusFilter == 'all' || trip.status.toLowerCase() == _statusFilter;

      return matchesSearch && matchesStatus;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final uid = _auth.currentUser?.uid;

    if (uid == null) {
      return Scaffold(
        drawer: const SideMenu(currentRoute: '/history'),
        appBar: AppBar(
          leading: Builder(
            builder: (context) => IconButton(
              icon: const Icon(Icons.menu),
              onPressed: () {
                final scaffoldState = Scaffold.maybeOf(context);
                if (scaffoldState?.hasDrawer ?? false) {
                  scaffoldState!.openDrawer();
                } else {
                  Navigator.maybePop(context);
                }
              },
            ),
          ),
          title: Text(
            t("Trip History", "ගමන් ඉතිහාසය", "பயண வரலாறு"),
            style: const TextStyle(color: Colors.white),
          ),
          backgroundColor: Colors.red.shade700,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: Center(
          child: Text(
            t(
              "Please log in to view trip history",
              "ගමන් ඉතිහාසය බලන්න පිවිසෙන්න",
              "பயண வரலாற்றைப் பார்க்க உள்நுழையவும்",
            ),
          ),
        ),
      );
    }

    return Scaffold(
      drawer: const SideMenu(currentRoute: '/history'),
      appBar: AppBar(
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () {
              final scaffoldState = Scaffold.maybeOf(context);
              if (scaffoldState?.hasDrawer ?? false) {
                scaffoldState!.openDrawer();
              } else {
                Navigator.maybePop(context);
              }
            },
          ),
        ),
        title: Text(
          t("Trip History", "ගමන් ඉතිහාසය", "பயண வரலாறு"),
          style: const TextStyle(color: Colors.white),
        ),
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
                  Text(
                    t(
                      "Loading trip history...",
                      "ගමන් ඉතිහාසය පූරණය වෙයි...",
                      "பயண வரலாறு ஏற்றப்படுகிறது...",
                    ),
                  ),
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
          BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4)),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem(
            t('Total', 'මුළු ගමන්', 'மொத்தம்'),
            totalTrips.toString(),
            Icons.local_shipping,
          ),
          _buildStatDivider(),
          _buildStatItem(
            t('Completed', 'අවසන්', 'முடிந்தது'),
            completedTrips.toString(),
            Icons.check_circle,
          ),
          _buildStatDivider(),
          _buildStatItem(
            t('This Month', 'මේ මාසය', 'இந்த மாதம்'),
            thisMonthTrips.toString(),
            Icons.calendar_today,
          ),
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
          style: const TextStyle(color: Colors.white70, fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildStatDivider() {
    return Container(height: 50, width: 1, color: Colors.white30);
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
              hintText: t(
                'Search trips...',
                'ගමන් සොයන්න...',
                'பயணங்களை தேடுங்கள்...',
              ),
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
              Text(
                t('Filter: ', 'පෙරහන්: ', 'வடிகட்டி: '),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip(t('All', 'සියලු', 'அனைத்து'), 'all'),
                      const SizedBox(width: 8),
                      _buildFilterChip(
                        t('Completed', 'අවසන්', 'முடிந்தது'),
                        'completed',
                      ),
                      const SizedBox(width: 8),
                      _buildFilterChip(
                        t('Cancelled', 'අවලංගු', 'ரத்து'),
                        'cancelled',
                      ),
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
                      Icon(
                        Icons.calendar_today,
                        size: 16,
                        color: Colors.grey.shade600,
                      ),
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
                style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
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
              if (trip.distance != null ||
                  trip.duration != null ||
                  trip.earnings != null) ...[
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
    String label = status.trim().toUpperCase();

    switch (normalizedStatus) {
      case 'completed':
        bgColor = Colors.green.shade100;
        textColor = Colors.green.shade700;
        icon = Icons.check_circle;
        label = t('COMPLETED', 'අවසන්', 'முடிந்தது');
        break;
      case 'paused':
        bgColor = Colors.blue.shade100;
        textColor = Colors.blue.shade700;
        icon = Icons.pause_circle_filled;
        label = t('PAUSED', 'නවතා ඇත', 'இடைநிறுத்தப்பட்டது');
        break;
      case 'in_progress':
      case 'accepted':
        bgColor = Colors.orange.shade100;
        textColor = Colors.orange.shade700;
        icon = Icons.directions_car;
        label = normalizedStatus == 'accepted'
            ? t('ACCEPTED', 'පිළිගත්', 'ஏற்றுக்கொண்டது')
            : t('IN PROGRESS', 'ගමන් කරමින්', 'சென்று கொண்டிருக்கிறது');
        break;
      case 'cancelled':
      case 'canceled':
        bgColor = Colors.red.shade100;
        textColor = Colors.red.shade700;
        icon = Icons.cancel;
        label = t('CANCELLED', 'අවලංගු', 'ரத்து செய்யப்பட்டது');
        break;
      default:
        bgColor = Colors.orange.shade100;
        textColor = Colors.orange.shade700;
        icon = Icons.info_outline;
        label = t(status.trim().toUpperCase(), 'වෙනත්', 'மற்றவை');
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
            label,
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
            Icon(Icons.history, size: 100, color: Colors.grey.shade300),
            const SizedBox(height: 24),
            Text(
              t('No Trips Yet', 'තවම ගමන් නැහැ', 'இன்னும் பயணம் இல்லை'),
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              t(
                'Your completed trips will appear here',
                'ඔබ අවසන් කළ ගමන් මෙතැන දිස්වේ',
                'நீங்கள் முடித்த பயணங்கள் இங்கே வரும்',
              ),
              style: TextStyle(fontSize: 16, color: Colors.grey.shade500),
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
            Icon(Icons.search_off, size: 80, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(
              t('No trips found', 'ගමන් හමු වුණේ නැහැ', 'பயணம் எதுவும் இல்லை'),
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              t(
                'Try adjusting your search or filters',
                'සෙවුම හෝ පෙරහන් වෙනස් කර බලන්න',
                'தேடல் அல்லது வடிகட்டியை மாற்றி முயற்சிக்கவும்',
              ),
              style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
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
            Icon(Icons.error_outline, size: 80, color: Colors.red.shade300),
            const SizedBox(height: 16),
            Text(
              t(
                'Something went wrong!',
                'ගැටලුවක් ඇති වුණා!',
                'ஏதோ தவறு நடந்தது!',
              ),
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              t(
                'Failed to load trip history',
                'ගමන් ඉතිහාසය පූරණයට බැරි වුණා',
                'பயண வரலாறு ஏற்ற முடியவில்லை',
              ),
              style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => setState(() {}),
              icon: const Icon(Icons.refresh),
              label: Text(
                t('Retry', 'නැවත උත්සාහ කරන්න', 'மீண்டும் முயற்சி செய்'),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade700,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
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
                    Text(
                      t('Trip Details', 'ගමන් විස්තර', 'பயண விவரம்'),
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
                  t('Date', 'දිනය', 'தேதி'),
                  AppDateUtils.formatDate(trip.timestamp),
                ),
                _buildDetailRow(
                  Icons.access_time,
                  t('Time', 'වේලාව', 'நேரம்'),
                  AppDateUtils.formatTime(trip.timestamp),
                ),

                const Divider(height: 32),

                // Patient Info
                if (trip.patientName != null)
                  _buildDetailRow(
                    Icons.person,
                    t('Patient', 'රෝගියා', 'நோயாளர்'),
                    trip.patientName!,
                  ),

                // Locations
                _buildDetailRow(
                  Icons.circle,
                  t('Pickup', 'ගන්න තැන', 'எடுக்கும் இடம்'),
                  trip.pickup,
                  iconColor: Colors.green,
                ),
                _buildDetailRow(
                  Icons.location_on,
                  t('Dropoff', 'දමන තැන', 'இறக்கும் இடம்'),
                  trip.dropoff,
                  iconColor: Colors.red,
                ),

                const Divider(height: 32),

                // Trip Metrics
                if (trip.distance != null)
                  _buildDetailRow(
                    Icons.route,
                    t('Distance', 'දුර', 'தூரம்'),
                    trip.formattedDistance,
                  ),
                if (trip.duration != null)
                  _buildDetailRow(
                    Icons.timer,
                    t('Duration', 'කාලය', 'நேரம்'),
                    trip.formattedDuration,
                  ),
                if (trip.priority != null)
                  _buildDetailRow(
                    Icons.priority_high,
                    t('Priority', 'ප්‍රමුඛතාව', 'முன்னுரிமை'),
                    trip.priority!.toUpperCase(),
                  ),

                // Notes
                if (trip.notes != null) ...[
                  const Divider(height: 32),
                  _buildDetailRow(
                    Icons.note,
                    t('Notes', 'සටහන්', 'குறிப்புகள்'),
                    trip.notes!,
                  ),
                ],

                const SizedBox(height: 24),

                if (_canResumeTrip(trip)) ...[
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _resumeTripFromHistory(
                        trip: trip,
                        sheetContext: context,
                      ),
                      icon: const Icon(Icons.navigation),
                      label: Text(
                        t(
                          'Start Navigation',
                          'නාවිකරණය ආරම්භ කරන්න',
                          'வழிகாட்டலை தொடங்கு',
                        ),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red.shade600,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

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
                    child: Text(
                      t('Close', 'වසන්න', 'மூடு'),
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

  bool _canResumeTrip(Trip trip) {
    final s = trip.status.trim().toLowerCase();
    return s == 'in_progress' || s == 'accepted' || s == 'cancelled';
  }

  Future<void> _resumeTripFromHistory({
    required Trip trip,
    required BuildContext sheetContext,
  }) async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return;

    final messenger = ScaffoldMessenger.of(context);
    final parentNavigator = Navigator.of(context);
    final sheetNavigator = Navigator.of(sheetContext);

    try {
      final reqRef = FirebaseDatabase.instance
          .ref()
          .child('transfer_requests')
          .child(trip.id);
      final snapshot = await reqRef.get();
      if (!snapshot.exists || snapshot.value is! Map) {
        messenger.showSnackBar(
          SnackBar(
            content: Text(
              t('Trip not found', 'ගමන හමු වුණේ නැහැ', 'பயணம் கிடைக்கவில்லை'),
            ),
          ),
        );
        return;
      }

      final data = Map<dynamic, dynamic>.from(snapshot.value as Map);
      final driverId = data['driverId']?.toString();
      final status = data['status']?.toString().trim().toLowerCase();

      if (status == 'completed') {
        messenger.showSnackBar(
          SnackBar(
            content: Text(
              t(
                'This trip cannot be resumed',
                'මෙම ගමන නැවත ආරම්භ කළ නොහැක',
                'இந்த பயணத்தை மீண்டும் தொடங்க முடியாது',
              ),
            ),
          ),
        );
        return;
      }

      final assignment = Assignment.fromJson(trip.id, data);

      await reqRef.update({
        'status': 'in_progress',
        'resumedAt': ServerValue.timestamp,
      });

      await TripHistoryService().upsertTrip(
        driverId: uid,
        assignment: assignment,
        status: 'in_progress',
        extra: {'resumedAt': ServerValue.timestamp},
      );

      if (!mounted) return;
      sheetNavigator.pop();
      await parentNavigator.push(
        MaterialPageRoute(
          builder: (_) => NavigationPage(assignment: assignment),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(content: Text('Failed to start navigation: $e')),
      );
    }
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
          Icon(icon, size: 20, color: iconColor ?? Colors.grey.shade600),
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
