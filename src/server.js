const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else if(process.env.NODE_ENV === 'test'){
  dotenv.config({ path: '.env.test' });
} else{
  dotenv.config({ path: '.env.development' });
}

const app = express();

// Connect to MongoDB database
connectDB();

// Parse the request body as JSON
app.use(express.json());

// Define the routes for user APIs
app.use('/api/user', userRoutes);
app.use('/api/event', eventRoutes );
app.use('/api/booking', bookingRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = app;
