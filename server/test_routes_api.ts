import 'dotenv/config';
import axios from 'axios';

async function testRoutesApi() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    console.log(`Using API Key: ${apiKey?.substring(0, 5)}...`);
    
    // Data from diagnostic
    const origin = { lat: 6.9212717, lng: 79.87113 };
    const destinationPlaceId = 'ChIJuRjblGBZ4joRkZJSlMrl_7A';
    
    const url = 'https://routes.googleapis.com/v2:computeRoutes';
    
    const body = {
        origin: {
            location: {
                latLng: {
                    latitude: origin.lat,
                    longitude: origin.lng
                }
            }
        },
        destination: {
            placeId: destinationPlaceId
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE'
    };
    
    try {
        const response = await axios.post(url, body, {
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
            }
        });
        
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
        
        if (response.data.routes && response.data.routes[0]) {
            const route = response.data.routes[0];
            const durationSec = parseInt(route.duration.replace('s', ''));
            const distanceM = route.distanceMeters;
            
            const durationMin = Math.round(durationSec / 60);
            const distanceKm = (distanceM / 1000).toFixed(1);
            
            console.log(`Parsed: ${durationMin} mins, ${distanceKm} km`);
        }
    } catch (error: any) {
        console.error('Axios Error:', error.message);
        if (error.response) {
            console.error('Error Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testRoutesApi();
