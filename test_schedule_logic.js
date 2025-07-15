// Test script to verify recurring schedule logic
import { generateClassInstances } from './src/services/scheduleService.js';

// Mock class data with recurring schedule
const mockClass = {
    _id: 'class123',
    title: 'Yoga Class',
    teacher: 'teacher123',
    schedules: [
        {
            days: ['Mon', 'Wed', 'Fri'],
            startTime: '09:00',
            endTime: '10:00'
        },
        {
            days: ['Tue', 'Thu'],
            startTime: '18:00',
            endTime: '19:00'
        }
    ],
    toObject: function() {
        return {
            _id: this._id,
            title: this.title,
            teacher: this.teacher,
            schedules: this.schedules
        };
    }
};

// Test date range (one week)
const startDate = new Date('2024-01-15'); // Monday
const endDate = new Date('2024-01-21');   // Sunday

console.log('Testing recurring schedule logic...');
console.log('Class:', mockClass.title);
console.log('Schedule:', mockClass.schedules);
console.log('Date range:', startDate.toDateString(), 'to', endDate.toDateString());

const instances = generateClassInstances(mockClass, startDate, endDate);

console.log('\nGenerated instances:');
instances.forEach((instance, index) => {
    console.log(`${index + 1}. ${instance.title} - ${instance.actualDate.toDateString()} ${instance.actualStartTime}-${instance.actualEndTime} (${instance.recurringDay})`);
});

console.log(`\nTotal instances generated: ${instances.length}`);

// Expected: 5 instances (Mon, Tue, Wed, Thu, Fri)
console.log('Expected: 5 instances (Mon, Tue, Wed, Thu, Fri)'); 