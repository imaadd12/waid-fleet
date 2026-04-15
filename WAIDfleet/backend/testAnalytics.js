const testAnalytics = async () => {
  const baseURL = 'http://localhost:5000/api/analytics';
  // For testing purposes, we'll skip authentication and test the endpoints directly
  // In production, you'd need a valid JWT token

  const endpoints = [
    '/dashboard',
    '/revenue-trends?period=weekly',
    '/trip-distribution',
    '/top-earners',
    '/vehicle-utilization',
    '/driver-status'
  ];

  console.log('Testing Analytics API Endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json'
          // Note: Skipping Authorization header for testing
        }
      });

      const data = await response.json();
      console.log(`✅ ${endpoint}:`, response.status === 200 ? 'SUCCESS' : 'FAILED');
      if (response.status === 200 && data) {
        console.log(`   Response:`, data);
      } else {
        console.log(`   Error:`, data.message || 'Unknown error');
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ERROR - ${error.message}`);
    }
    console.log(''); // Empty line for readability
  }
};

// Run the test
testAnalytics();