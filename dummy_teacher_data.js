// Dummy Teacher Data for Testing
export const dummyTeacherData = {
  name: "Dr. Priya Sharma",
  email: "priya.sharma@yogawellness.com",
  gender: "Female",
  role: "teacher",
  teacherCategory: "Yoga Trainer",
  teachingExperience: "8 years",
  expertise: [
    "Hatha Yoga",
    "Vinyasa Flow",
    "Prenatal Yoga",
    "Meditation",
    "Breathing Techniques"
  ],
  qualification: [
    {
      degree: "Master's in Yoga Science",
      institution: "Yoga Institute, Mumbai",
      year: "2018"
    },
    {
      degree: "RYT-500 Certification",
      institution: "Yoga Alliance International",
      year: "2019"
    },
    {
      degree: "Bachelor's in Physical Education",
      institution: "Delhi University",
      year: "2015"
    }
  ],
  additional_courses: [
    {
      courseName: "Advanced Pranayama",
      institution: "Kaivalyadhama",
      duration: "6 months",
      year: "2020"
    },
    {
      courseName: "Therapeutic Yoga",
      institution: "Sivananda Ashram",
      duration: "3 months",
      year: "2021"
    }
  ],
  mobile: "+91-9876543210",
  dob: "1990-05-15",
  age: "33",
  Address: "Flat 302, Sunshine Apartments, Bandra West",
  city: "Mumbai",
  pincode: "400050",
  country: "India",
  height: "165 cm",
  weight: "58 kg",
  bodyshape: "Athletic",
  focusarea: [
    "Stress Management",
    "Weight Loss",
    "Flexibility",
    "Mental Wellness"
  ],
  goal: [
    "Help students achieve mental peace",
    "Promote healthy lifestyle",
    "Teach authentic yoga practices"
  ],
  health_issues: [],
  howyouknowus: "Professional referral",
  PriorExperience: "Taught at multiple yoga studios and wellness centers",
  description: "Experienced yoga instructor with expertise in traditional and modern yoga practices. Specializes in stress relief and mental wellness through yoga and meditation.",
  status: true,
  active: true,
  images: [
    {
      filename: "teacher_profile_priya.jpg",
      path: "/uploads/teachers/priya_sharma_profile.jpg",
      key: "teachers/priya_sharma_profile.jpg"
    }
  ],
  notificationToken: "fcm_token_example_12345",
  favoriteClasses: [],
  favoriteEvents: [],
  favoriteTeachers: []
};

// Additional Teacher Examples
export const additionalTeachers = [
  {
    name: "Rajesh Kumar",
    email: "rajesh.kumar@fitnesspro.com",
    gender: "Male",
    role: "teacher",
    teacherCategory: "Fitness Coach",
    teachingExperience: "12 years",
    expertise: [
      "Strength Training",
      "Cardio Fitness",
      "Weight Loss Programs",
      "Sports Nutrition"
    ],
    qualification: [
      {
        degree: "Master's in Sports Science",
        institution: "National Institute of Sports",
        year: "2016"
      },
      {
        degree: "ACE Personal Trainer Certification",
        institution: "American Council on Exercise",
        year: "2017"
      }
    ],
    additional_courses: [
      {
        courseName: "Advanced Nutrition",
        institution: "International Sports Nutrition Institute",
        duration: "4 months",
        year: "2020"
      }
    ],
    mobile: "+91-8765432109",
    dob: "1985-08-22",
    age: "38",
    Address: "House 45, Green Park Colony, Delhi",
    city: "Delhi",
    pincode: "110016",
    country: "India",
    height: "178 cm",
    weight: "75 kg",
    bodyshape: "Muscular",
    focusarea: [
      "Muscle Building",
      "Weight Loss",
      "Endurance Training",
      "Sports Performance"
    ],
    goal: [
      "Transform lives through fitness",
      "Build sustainable healthy habits",
      "Improve athletic performance"
    ],
    health_issues: [],
    howyouknowus: "Social media",
    PriorExperience: "Worked with professional athletes and fitness enthusiasts",
    description: "Certified fitness coach with extensive experience in strength training and sports nutrition. Passionate about helping clients achieve their fitness goals.",
    status: true,
    active: true,
    images: [
      {
        filename: "teacher_profile_rajesh.jpg",
        path: "/uploads/teachers/rajesh_kumar_profile.jpg",
        key: "teachers/rajesh_kumar_profile.jpg"
      }
    ],
    notificationToken: "fcm_token_example_67890",
    favoriteClasses: [],
    favoriteEvents: [],
    favoriteTeachers: []
  },
  {
    name: "Dr. Anjali Patel",
    email: "anjali.patel@ayurveda.com",
    gender: "Female",
    role: "teacher",
    teacherCategory: "Ayurveda Specialist",
    teachingExperience: "15 years",
    expertise: [
      "Ayurvedic Medicine",
      "Herbal Remedies",
      "Dietary Counseling",
      "Lifestyle Medicine"
    ],
    qualification: [
      {
        degree: "Bachelor of Ayurvedic Medicine and Surgery (BAMS)",
        institution: "Gujarat Ayurved University",
        year: "2012"
      },
      {
        degree: "Master's in Ayurveda",
        institution: "Banaras Hindu University",
        year: "2015"
      }
    ],
    additional_courses: [
      {
        courseName: "Panchakarma Therapy",
        institution: "Kerala Ayurveda Academy",
        duration: "1 year",
        year: "2016"
      }
    ],
    mobile: "+91-7654321098",
    dob: "1982-03-10",
    age: "41",
    Address: "Villa 12, Ayurveda Gardens, Pune",
    city: "Pune",
    pincode: "411001",
    country: "India",
    height: "160 cm",
    weight: "55 kg",
    bodyshape: "Slim",
    focusarea: [
      "Digestive Health",
      "Stress Management",
      "Skin Care",
      "Immunity Building"
    ],
    goal: [
      "Promote holistic wellness",
      "Educate about Ayurvedic principles",
      "Provide natural healing solutions"
    ],
    health_issues: [],
    howyouknowus: "Professional network",
    PriorExperience: "Practiced Ayurveda at renowned wellness centers",
    description: "Experienced Ayurvedic specialist with deep knowledge of traditional healing practices. Committed to promoting natural wellness and balanced living.",
    status: true,
    active: true,
    images: [
      {
        filename: "teacher_profile_anjali.jpg",
        path: "/uploads/teachers/anjali_patel_profile.jpg",
        key: "teachers/anjali_patel_profile.jpg"
      }
    ],
    notificationToken: "fcm_token_example_11111",
    favoriteClasses: [],
    favoriteEvents: [],
    favoriteTeachers: []
  }
];

// Function to generate random teacher data
export const generateRandomTeacher = () => {
  const names = ["Amit Singh", "Sneha Reddy", "Vikram Malhotra", "Kavya Iyer", "Arjun Sharma"];
  const categories = ["Fitness Coach", "Ayurveda Specialist", "Mental Health Specialist", "Yoga Trainer", "General Trainer"];
  const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata"];
  
  return {
    name: names[Math.floor(Math.random() * names.length)],
    email: `teacher${Math.floor(Math.random() * 1000)}@example.com`,
    gender: Math.random() > 0.5 ? "Male" : "Female",
    role: "teacher",
    teacherCategory: categories[Math.floor(Math.random() * categories.length)],
    teachingExperience: `${Math.floor(Math.random() * 20) + 1} years`,
    expertise: ["Yoga", "Meditation", "Fitness"],
    qualification: [
      {
        degree: "Bachelor's in Physical Education",
        institution: "University of Health Sciences",
        year: "2020"
      }
    ],
    additional_courses: [],
    mobile: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    dob: "1990-01-01",
    age: "33",
    Address: "Sample Address",
    city: cities[Math.floor(Math.random() * cities.length)],
    pincode: "400001",
    country: "India",
    height: "170 cm",
    weight: "65 kg",
    bodyshape: "Athletic",
    focusarea: ["General Wellness", "Fitness"],
    goal: ["Help students achieve their goals"],
    health_issues: [],
    howyouknowus: "Online search",
    PriorExperience: "Teaching experience",
    description: "Experienced teacher committed to student wellness",
    status: true,
    active: true,
    images: [],
    notificationToken: "",
    favoriteClasses: [],
    favoriteEvents: [],
    favoriteTeachers: []
  };
}; 