const mongoose = require('mongoose');
const User = require('./models/User');
const OrganizerRequest = require('./models/OrganizerRequest');
const Event = require('./models/Event');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    // Find all requests that were approved but failed to generate an event previously
    const approvedRequests = await OrganizerRequest.find({ status: 'approved' });
    
    let createdCount = 0;
    for (const req of approvedRequests) {
        // Check if an event exactly like this request was already made to avoid duplicate
        const existingEvent = await Event.findOne({ title: req.eventTitle, organizerId: req.userId });
        
        if (!existingEvent) {
             const newEvent = new Event({
                title: req.eventTitle,
                description: req.eventDescription,
                date: req.proposedDate,
                maxParticipants: req.expectedParticipants || null,
                organizerId: req.userId,
                status: 'published' 
             });
             await newEvent.save();
             
             await User.findByIdAndUpdate(req.userId, {
                $push: { 'privileges.managedEvents': newEvent._id }
             });
             createdCount++;
        }
    }
    
    console.log('Restored previously lost approved events:', createdCount);
    process.exit(0);
}).catch(console.error);
