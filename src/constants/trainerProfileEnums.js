/** Audience options for new registrations and profile edits */
export const TRAINER_SPECIALIST_IN_CURRENT = [
  'GenZ',
  'Team Lead',
  'Manager',
  'Senior Manager',
  'Leadership',
];

/** Legacy audience labels stored on older trainer records */
export const TRAINER_SPECIALIST_IN_LEGACY = ['Employees', 'Mid Level Managers'];

/** All audience values accepted when reading or updating existing trainers */
export const TRAINER_SPECIALIST_IN_ALL = [
  ...new Set([...TRAINER_SPECIALIST_IN_CURRENT, ...TRAINER_SPECIALIST_IN_LEGACY]),
];

/** Wellness discipline options for new registrations */
export const TRAINER_TYPE_OF_TRAINING_CURRENT = [
  'Yoga',
  'Desktop Yoga',
  'Laughter Yoga',
  'Meditation',
  'Breath Work',
  'Sound Healing',
  'Yoga Nidra',
  'EAP Training',
  'Psychologist',
];

/** Legacy workshop labels stored on older trainer records */
export const TRAINER_TYPE_OF_TRAINING_LEGACY = [
  'Masterclass for Employee Wellbeing',
  'Emotional Intelligence Skill Workshop',
  'The Mental Health Toolkit: Daily Self-Care for Working Professionals',
];

/** All training types accepted when reading or updating existing trainers */
export const TRAINER_TYPE_OF_TRAINING_ALL = [
  ...new Set([...TRAINER_TYPE_OF_TRAINING_CURRENT, ...TRAINER_TYPE_OF_TRAINING_LEGACY]),
];

export const TRAINER_CATEGORY_ENUM = [
  'Yoga Trainer',
  'Sound Healer',
  'Psychologist',
  'Women Health Trainer',
  'EAP Trainer',
];

export const TRAINER_EXPERIENCE_ENUM = [
  '3 to 5 years',
  '5 to 8 years',
  '8 to 12 years',
  '12 to 15 years',
  'Above 15 years',
];

/** Cities where trainers operate (order matches company portal filters). */
export const TRAINER_CITY_ENUM = [
  'Bangalore',
  'Chennai',
  'Delhi',
  'Gurgaon',
  'Hyderabad',
  'Mumbai',
  'Navi Mumbai',
  'Noida',
  'Pune',
];
