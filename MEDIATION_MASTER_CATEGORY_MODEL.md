# MasterCategory Model

The `MasterCategory` model is used to manage meditation and sound categories in the application. Each category can have a name, description, image, sound, and additional metadata. This model is designed to be flexible for future extensions.

## Fields

| Field         | Type     | Required | Description                                                      |
|--------------|----------|----------|------------------------------------------------------------------|
| name         | String   | Yes      | Unique name of the category                                      |
| description  | String   | No       | Description of the category                                      |
| imageUrl     | String   | No       | URL to the category's image                                      |
| soundUrl     | String   | No       | URL to the category's sound/meditation audio                     |
| tags         | [String] | No       | List of tags for filtering/search                                |
| order        | Number   | No       | Display order for sorting categories                             |
| isActive     | Boolean  | No       | Whether the category is active (default: true)                   |
| createdAt    | Date     | No       | Timestamp (auto-managed)                                         |
| updatedAt    | Date     | No       | Timestamp (auto-managed)                                         |

## Example

```json
{
  "name": "Pranayama Classes",
  "description": "Breathing techniques for relaxation and focus.",
  "imageUrl": "https://example.com/images/pranayama.jpg",
  "soundUrl": "https://example.com/sounds/pranayama.mp3",
  "tags": ["breath", "relaxation", "focus"],
  "order": 1,
  "isActive": true
}
```

## Notes
- This model is intended for use in meditation/sound category management.
- You can extend this model with more fields as needed (e.g., color, icon, etc).
- Use the `isActive` field to soft-delete or hide categories without removing them from the database. 