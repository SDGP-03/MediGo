Readme FIle
# Project Structure Overview
src/: Contains all the source code.
src/pages/: Represents the main high-level views (screens) of the application.
src/components/: Contains reusable UI elements and sub-sections of the pages.
src/hooks/: Custom React hooks for sharing logic (e.g., fetching driver locations).

# FireBase/Auth - importing tools from Firebase

onAuthStateChanged - Watches if someone logs in or out
signOut - Logs the user out
User - Describes what a user looks like
auth - Our connection to Firebase

#   Current Progress & Recent Updates

### 1. Visual & Theme Refresh
*   **New Look:** We moved away from the old colors to a polished **Blue & Purple gradient theme**. This gives the "MediGo" admin dashboard a cleaner, more professional medical feel.
*   **Login Page:** Updated the buttons and background to match this new blue theme.

### 2. Authentication (The Logic)
*   **Real Login Tracking:** We hooked up Firebase's `onAuthStateChanged`. This means the app now "listens" to see if a user is logged in or out.
*   **State Management:** The app now remembers your login status, so you don't just see a blank screen—it directs you to the Dashboard or Login page automatically.

### 3. Navigation Improvements
*   **Better Flow:** We improved how pages talk to each other. For example, the `PatientRecords` section can now tell the main App to switch views (like going back to the dashboard).

### 4. Housekeeping & Fixes
*   **Startup Fix:** We fixed a small but critical path issue in [index.html](cci:7://file:///d:/IIT/2ND%20YEAR/MediGo/admin-dash/index.html:0:0-0:0) to make sure the app loads the main script correctly every time.


#  MediGo Admin Dashboard
**What is this?** This is the "Control Center" for hospital administrators. While the drivers use the mobile app to accept rides, this dashboard allows the hospital staff to oversee the entire operation from a computer.

### Main Features:

Live Tracking: See exactly where every ambulance and driver is on a map.
Request Management: Approve or decline patient transfer requests.
Fleet Management: Add new ambulances or update driver details.
Analytics: View charts and graphs to understand hospital performance (e.g., how many rides per day).
How it Works (The "Under the Hood" Stuff):

### The "Look and Feel" (Frontend):
* We use React to build the website (it makes the page interact like a mobile app).
* We use Tailwind CSS to style everything (colors, spacing, layouts).
* We use Vite to run the project (it makes the site load extremely fast during development).
### The "Brain" (Backend & Data):
* We use Firebase for almost everything related to data.
* **Firebase Auth**: Handles the login system (so we know who is an admin).
* **Firestore Database**: Stores all the info about drivers, patients, and ambulance availability in the cloud.
### Key Folders Explained:
* **src/components/:** These are the "building blocks" of the site. For example, a "Button" or a "Login Form" is kept here so we can reuse it on different pages.
* **src/pages/:** These are the actual full screens you see, like the "Dashboard" or "Settings" page.
* **src/hooks/:** These are special helper functions that handle logic, like "Listen to where the driver is right now" or "Check if the user is logged in."