import 'dotenv/config';
import axios from 'axios';

async function testDirectionsApi() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    console.log(`Using API Key: ${apiKey?.substring(0, 5)}...`);
    
    // Data from diagnostic
    const origin = '6.9212717,79.87113';
    const destination = 'place_id:ChIJuRjblGBZ4joRkZJSlMrl_7A';
    
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`;
    
    try {
        const response = await axios.get(url);
        console.log('Response Status:', response.data.status);
        
        if (response.data.status === 'OK' && response.data.routes[0].legs[0]) {
            const leg = response.data.routes[0].legs[0];
            console.log(`Duration: ${leg.duration.text}`);
            console.log(`Distance: ${leg.distance.text}`);
        } else {
            console.log('Error Message:', response.data.error_message);
        }
    } catch (error: any) {
        console.error('Axios Error:', error.message);
    }
}

testDirectionsApi();
