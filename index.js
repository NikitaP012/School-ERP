import express from 'express';
import mysql2 from 'mysql2';
import bodyParser from 'body-parser';

const app = express();
const PORT = 8080;

// Middleware
app.use(bodyParser.json());

// MySQL Connection
const db = mysql2.createConnection({

    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: 'root', // Replace with your MySQL password
    database: 'school_management',
});

db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err.message);
        process.exit(1);
    }
    console.log('Connected to the database.');
});

// Utility function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRadians = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // Earth's radius in km

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// Add School API
app.post('/', (req, res) => {
    const { name, address, latitude, longitude } = req.body;
    console.log("req.body",req.body);
    

    // Validate input
    if (!name || !address || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ message: 'Invalid input data.' });
    }

    const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    db.query(query, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error adding school.' });
        }
        res.status(201).json({ message: 'School added successfully.' , data:result});
    });
});

// List Schools API
app.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLon)) {
        return res.status(400).json({ message: 'Invalid latitude or longitude values.' });
    }

    const query = 'SELECT * FROM schools';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error fetching schools.' });
        }

        // Calculate distances and sort by proximity
        const sortedSchools = results
            .map((school) => ({
                ...school,
                distance: calculateDistance(userLat, userLon, school.latitude, school.longitude),
            }))
            .sort((a, b) => a.distance - b.distance);

        res.json(sortedSchools);
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
