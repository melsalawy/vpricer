// server.js - Node.js Backend for vPricer
// This handles API calls to Anthropic and keeps your API key secure

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve your HTML file from 'public' folder

// Anthropic API configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Helper function to call Anthropic API
async function callAnthropicAPI(prompt, tools = []) {
    const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [{
                role: 'user',
                content: prompt
            }],
            tools: tools.length > 0 ? tools : undefined
        })
    });

    if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract text from response
    let responseText = '';
    if (data.content) {
        for (const item of data.content) {
            if (item.type === 'text') {
                responseText += item.text;
            }
        }
    }
    
    return responseText;
}

// Extract JSON from text response
function extractJSON(text) {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('JSON parse error:', e);
    }
    return null;
}

// Endpoint 1: Extract vehicle information from URL
app.post('/api/extract-vehicle', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const prompt = `Extract EXACT vehicle information from this URL: ${url}

CRITICAL:
- Get EXACT trim level (Premium, Limited, Sport, LE, SE, XLE, etc.)
- Get EXACT city and state where dealer is located
- Get ALL prices (list/MSRP, online price, special price, discount)

Return ONLY JSON:
{
  "year": "YYYY",
  "make": "Make",
  "model": "Model",
  "trim": "EXACT_TRIM",
  "price": "$XX,XXX",
  "originalPrice": "$XX,XXX",
  "discount": "$X,XXX",
  "mileage": "XX,XXX",
  "dealerName": "Name",
  "city": "EXACT_CITY",
  "state": "ST",
  "location": "City, ST"
}

Use BEST price. Don't use "Base" if trim visible.`;

        const response = await callAnthropicAPI(prompt, [{
            type: 'web_search_20250305',
            name: 'web_search'
        }]);

        const vehicleInfo = extractJSON(response);

        if (!vehicleInfo || !vehicleInfo.year || !vehicleInfo.make || !vehicleInfo.model) {
            return res.status(400).json({ error: 'Could not extract vehicle information' });
        }

        res.json(vehicleInfo);

    } catch (error) {
        console.error('Extract vehicle error:', error);
        res.status(500).json({ error: 'Failed to extract vehicle information' });
    }
});

// Endpoint 2: Discover dealers in area
app.post('/api/discover-dealers', async (req, res) => {
    try {
        const { state, city, make } = req.body;

        if (!state || !city || !make) {
            return res.status(400).json({ error: 'State, city, and make are required' });
        }

        const prompt = `Search Google for official ${make} dealerships near ${city}, ${state} within 100 miles.

CRITICAL: Find ONLY real, verified ${make} dealerships (authorized OEM dealers).

For EACH dealer:
1. EXACT official name
2. REAL street address
3. Verify actual ${make} dealer
4. Phone number
5. Official website

Return JSON array:
[
  {
    "name": "Official Dealer Name",
    "address": "1234 Real St, City, ${state} 12345",
    "city": "City",
    "state": "${state}",
    "distance": "X miles",
    "phone": "(555) 123-4567",
    "website": "https://official-site.com"
  }
]

Find 6-10 real dealers. Verify addresses accurate.`;

        const response = await callAnthropicAPI(prompt, [{
            type: 'web_search_20250305',
            name: 'web_search'
        }]);

        let dealers = extractJSON(response);

        if (!dealers || !Array.isArray(dealers)) {
            dealers = [];
        }

        // Filter out invalid dealers
        dealers = dealers.filter(d => 
            d.address && 
            d.address.length > 10 && 
            !d.address.includes('N/A') &&
            d.name &&
            d.city &&
            d.state === state
        );

        res.json(dealers);

    } catch (error) {
        console.error('Discover dealers error:', error);
        res.status(500).json({ error: 'Failed to discover dealers' });
    }
});

// Endpoint 3: Search dealers for vehicle
app.post('/api/search-dealers', async (req, res) => {
    try {
        const { year, make, model, trim, dealers } = req.body;

        if (!year || !make || !model || !trim || !dealers || !Array.isArray(dealers)) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        const dealerList = dealers.map(d => `${d.name} (${d.city}, ${d.state})`).join('; ');

        const prompt = `Search these SPECIFIC dealerships for ${year} ${make} ${model} ${trim}:

Dealerships: ${dealerList}

REQUIREMENTS:
1. Search EACH dealer's inventory
2. EXACT match: ${trim} trim (reject other trims)
3. Get REAL listing URL
4. Get actual price (use lowest)
5. Get MSRP and discount
6. Get mileage

Return JSON array:
[
  {
    "dealerName": "Exact name from list",
    "found": true,
    "url": "listing URL",
    "trim": "${trim}",
    "price": "$XX,XXX",
    "originalPrice": "$XX,XXX",
    "discount": "$X,XXX",
    "mileage": "XX"
  }
]

Only return dealers with exact match.`;

        const response = await callAnthropicAPI(prompt, [{
            type: 'web_search_20250305',
            name: 'web_search'
        }]);

        let foundVehicles = extractJSON(response);

        if (!foundVehicles || !Array.isArray(foundVehicles)) {
            foundVehicles = [];
        }

        // Match back to dealer info
        const results = foundVehicles
            .filter(v => v.found === true)
            .map(vehicle => {
                const dealer = dealers.find(d => 
                    vehicle.dealerName.toLowerCase().includes(d.name.toLowerCase().split(' ')[0]) ||
                    d.name.toLowerCase().includes(vehicle.dealerName.toLowerCase().split(' ')[0])
                );

                if (dealer) {
                    return {
                        year,
                        make,
                        model,
                        trim: vehicle.trim || trim,
                        price: vehicle.price,
                        originalPrice: vehicle.originalPrice,
                        discount: vehicle.discount,
                        mileage: vehicle.mileage,
                        dealerName: dealer.name,
                        dealerAddress: dealer.address,
                        dealerPhone: dealer.phone,
                        location: `${dealer.city}, ${dealer.state}`,
                        distance: dealer.distance,
                        url: vehicle.url || dealer.website
                    };
                }
                return null;
            })
            .filter(r => r !== null);

        res.json(results);

    } catch (error) {
        console.error('Search dealers error:', error);
        res.status(500).json({ error: 'Failed to search dealers' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'vPricer API is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`vPricer backend running on port ${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
    
    if (!ANTHROPIC_API_KEY) {
        console.error('WARNING: ANTHROPIC_API_KEY not set in environment variables!');
    }
});
