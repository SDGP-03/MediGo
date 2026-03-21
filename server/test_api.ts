import 'dotenv/config';
import axios from 'axios';

async function testApi() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    console.log(`Using API Key: ${apiKey?.substring(0, 5)}...`);
    
    // Data from diagnostic
    const origin = '6.9212717,79.87113';
    const destination = 'place_id:ChIJuRjblGBZ4joRkZJSlMrl_7A';
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}`;
    console.log(`URL: ${url}`);
    
    try {
        const response = await axios.get(url);
        console.log('Response Status:', response.data.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error('Axios Error:', error.message);
    }
}

testApi();
