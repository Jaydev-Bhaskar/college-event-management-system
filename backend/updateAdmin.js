const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const admin = await User.findOneAndUpdate(
        { email: 'admin@college.edu' },
        { $unset: { department: 1 } },
        { new: true }
    );
    console.log('Updated Admin:', admin);
    process.exit(0);
}).catch(console.error);
