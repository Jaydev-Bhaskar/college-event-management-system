const mongoose = require('mongoose');
const User = require('./models/User');
const POBank = require('./models/POBank');
const Event = require('./models/Event');
require('dotenv').config();

const migrateDepartments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to Database. Starting migration...');

        // 1. Update Users
        const userUpdate = await User.updateMany(
            { department: 'Computer Science' },
            { $set: { department: 'Computer Engineering' } }
        );
        console.log(`Updated ${userUpdate.modifiedCount} users from "Computer Science" to "Computer Engineering"`);

        // 2. Update PO Banks if any exist under the old name
        const poUpdate = await POBank.updateMany(
            { department: 'Computer Science' },
            { $set: { department: 'Computer Engineering' } }
        );
        console.log(`Updated ${poUpdate.modifiedCount} POBanks from "Computer Science" to "Computer Engineering"`);

        // 3. Update Events if they store department
        const eventUpdate = await Event.updateMany(
            { department: 'Computer Science' },
            { $set: { department: 'Computer Engineering' } }
        );
        console.log(`Updated ${eventUpdate.modifiedCount} events from "Computer Science" to "Computer Engineering"`);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrateDepartments();
