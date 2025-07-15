import mongoose from 'mongoose';

/**
 * Get day name from date
 */
const getDayName = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
};

/**
 * Generate class instances for a given date range based on recurring schedule
 */
const generateClassInstances = (classData, startDate, endDate) => {
    const instances = [];
    
    if (!classData.schedules || classData.schedules.length === 0) {
        // If no recurring schedule, use the single schedule field
        if (classData.schedule) {
            const scheduleDate = new Date(classData.schedule);
            if (scheduleDate >= startDate && scheduleDate <= endDate) {
                instances.push({
                    ...classData.toObject(),
                    actualDate: scheduleDate,
                    actualStartTime: classData.startTime,
                    actualEndTime: classData.endTime,
                    isRecurring: false
                });
            }
        }
        return instances;
    }

    // Handle recurring schedules
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dayName = getDayName(currentDate);
        
        // Check if this day matches any of the scheduled days
        for (const schedule of classData.schedules) {
            if (schedule.days.includes(dayName)) {
                // Create an instance for this day
                const instance = {
                    ...classData.toObject(),
                    actualDate: new Date(currentDate),
                    actualStartTime: schedule.startTime,
                    actualEndTime: schedule.endTime,
                    isRecurring: true,
                    recurringDay: dayName
                };
                
                instances.push(instance);
            }
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return instances;
};

/**
 * Get today's classes for a user
 */
const getTodaysClasses = async (userId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get all classes the user is enrolled in
    const enrolledClasses = await mongoose.model('Class').find({
        students: userId,
        status: true
    }).populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images');
    
    const todaysInstances = [];
    
    for (const classData of enrolledClasses) {
        const instances = generateClassInstances(classData, today, tomorrow);
        todaysInstances.push(...instances);
    }
    
    // Sort by start time
    return todaysInstances.sort((a, b) => {
        const timeA = a.actualStartTime || '00:00';
        const timeB = b.actualStartTime || '00:00';
        return timeA.localeCompare(timeB);
    });
};

/**
 * Get tomorrow's classes for a user
 */
const getTomorrowsClasses = async (userId) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    const enrolledClasses = await mongoose.model('Class').find({
        students: userId,
        status: true
    }).populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images');
    
    const tomorrowsInstances = [];
    
    for (const classData of enrolledClasses) {
        const instances = generateClassInstances(classData, tomorrow, dayAfterTomorrow);
        tomorrowsInstances.push(...instances);
    }
    
    return tomorrowsInstances.sort((a, b) => {
        const timeA = a.actualStartTime || '00:00';
        const timeB = b.actualStartTime || '00:00';
        return timeA.localeCompare(timeB);
    });
};

/**
 * Get classes for a specific date range
 */
const getClassesByDateRange = async (userId, startDate, endDate) => {
    const enrolledClasses = await mongoose.model('Class').find({
        students: userId,
        status: true
    }).populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images');
    
    const allInstances = [];
    
    for (const classData of enrolledClasses) {
        const instances = generateClassInstances(classData, startDate, endDate);
        allInstances.push(...instances);
    }
    
    // Sort by date and time
    return allInstances.sort((a, b) => {
        const dateA = new Date(a.actualDate);
        const dateB = new Date(b.actualDate);
        
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
        }
        
        const timeA = a.actualStartTime || '00:00';
        const timeB = b.actualStartTime || '00:00';
        return timeA.localeCompare(timeB);
    });
};

/**
 * Get upcoming classes (from now onwards)
 */
const getUpcomingClasses = async (userId) => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get classes for next 30 days
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);
    
    const enrolledClasses = await mongoose.model('Class').find({
        students: userId,
        status: true
    }).populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images');
    
    const upcomingInstances = [];
    
    for (const classData of enrolledClasses) {
        const instances = generateClassInstances(classData, startDate, endDate);
        upcomingInstances.push(...instances);
    }
    
    // Filter out past instances and sort
    const nowTime = now.getTime();
    return upcomingInstances
        .filter(instance => {
            const instanceDateTime = new Date(instance.actualDate);
            const [hours, minutes] = (instance.actualStartTime || '00:00').split(':');
            instanceDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return instanceDateTime.getTime() > nowTime;
        })
        .sort((a, b) => {
            const dateA = new Date(a.actualDate);
            const dateB = new Date(b.actualDate);
            
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
            
            const timeA = a.actualStartTime || '00:00';
            const timeB = b.actualStartTime || '00:00';
            return timeA.localeCompare(timeB);
        });
};

/**
 * Get past classes
 */
const getPastClasses = async (userId) => {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get classes from last 30 days
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);
    
    const enrolledClasses = await mongoose.model('Class').find({
        students: userId,
        status: true
    }).populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images');
    
    const pastInstances = [];
    
    for (const classData of enrolledClasses) {
        const instances = generateClassInstances(classData, startDate, endDate);
        pastInstances.push(...instances);
    }
    
    // Filter out future instances and sort (most recent first)
    const nowTime = now.getTime();
    return pastInstances
        .filter(instance => {
            const instanceDateTime = new Date(instance.actualDate);
            const [hours, minutes] = (instance.actualStartTime || '00:00').split(':');
            instanceDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return instanceDateTime.getTime() <= nowTime;
        })
        .sort((a, b) => {
            const dateA = new Date(a.actualDate);
            const dateB = new Date(b.actualDate);
            
            if (dateA.getTime() !== dateB.getTime()) {
                return dateB - dateA; // Reverse order for past classes
            }
            
            const timeA = a.actualStartTime || '00:00';
            const timeB = b.actualStartTime || '00:00';
            return timeB.localeCompare(timeA); // Reverse order for past classes
        });
};

export {
    generateClassInstances,
    getTodaysClasses,
    getTomorrowsClasses,
    getClassesByDateRange,
    getUpcomingClasses,
    getPastClasses
}; 