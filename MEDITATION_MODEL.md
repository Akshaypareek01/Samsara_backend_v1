# Meditation Model

The `Meditation` model is used to manage individual meditation and sound sessions in the application. Each meditation belongs to a category (MasterCategory) and contains its own content, audio, and metadata.

## Fields

| Field         | Type     | Required | Description                                                      |
|--------------|----------|----------|------------------------------------------------------------------|
| title        | String   | Yes      | Name of the meditation session                                   |
| description  | String   | No       | Description or summary of the meditation                         |
| duration     | Number   | Yes      | Duration in minutes                                              |
| level        | String   | No       | Difficulty level (Beginner, Intermediate, Advanced, All Levels)  |
| imageUrl     | String   | No       | URL to the meditation's image                                    |
| audioUrl     | String   | No       | URL to the meditation's audio/sound file                         |
| category     | ObjectId | Yes      | Reference to MasterCategory                                      |
| tags         | [String] | No       | List of tags for filtering/search                                |
| benefits     | String   | No       | Description of the benefits of this meditation                   |
| howToPractice| [String] | No       | Array of practice steps/instructions                             |
| focus        | Number   | No       | Focus percentage (0-100)                                         |
| mood         | String   | No       | User mood after session (Ecstatic, Calm, etc.)                   |
| recommended  | [ObjectId]| No      | Array of related/recommended Meditation references               |
| isActive     | Boolean  | No       | Whether the meditation is active (default: true)                 |
| createdAt    | Date     | No       | Timestamp (auto-managed)                                         |
| updatedAt    | Date     | No       | Timestamp (auto-managed)                                         |

## Example

```json
{
  "title": "Body Scan Meditation",
  "description": "Gradually focus on different parts of your body to release tension and promote relaxation.",
  "duration": 15,
  "level": "Intermediate",
  "imageUrl": "https://example.com/images/body-scan.jpg",
  "audioUrl": "https://example.com/audio/body-scan.mp3",
  "category": "60f7c2b8e1d2c8a1b2c3d4e5",
  "tags": ["relaxation", "body", "awareness"],
  "benefits": "Reduces stress, improves body awareness, enhances mind-body connection.",
  "howToPractice": [
    "Find a comfortable position, either sitting or lying down.",
    "Close your eyes and take a few deep breaths to center yourself.",
    "Starting from your toes, gradually move your attention up through your body.",
    "Notice any sensations without judgment, allowing tension to release.",
    "If your mind wanders, gently bring your focus back to your body."
  ],
  "focus": 92,
  "mood": "Calm",
  "recommended": ["60f7c2b8e1d2c8a1b2c3d4e6", "60f7c2b8e1d2c8a1b2c3d4e7"],
  "isActive": true
}
```

## Notes
- This model is intended for use in individual meditation/sound session management.
- Each meditation is linked to a MasterCategory for grouping and navigation.
- You can extend this model with more fields as needed (e.g., language, teacher, etc).
- Use the `isActive` field to soft-delete or hide meditations without removing them from the database. 