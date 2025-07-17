# Bulk Question Creation - Postman Guide

This guide explains how to create multiple questions at once using the bulk create endpoint in Postman.

## API Endpoint

```
POST /v1/question-master/questions/bulk
```

## Authentication

This endpoint requires authentication. Make sure to include your authentication token in the request headers:

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

## Request Body Structure

The request body should be an array of question objects. Each question object must follow this structure:

```json
[
  {
    "assessmentType": "Prakriti|Vikriti",
    "questionText": "Your question text here",
    "options": [
      {
        "text": "Option 1 text",
        "dosha": "Vata|Pitta|Kapha",
        "description": "Optional description for this option"
      },
      {
        "text": "Option 2 text", 
        "dosha": "Vata|Pitta|Kapha",
        "description": "Optional description for this option"
      }
    ],
    "order": 1,
    "isActive": true
  }
]
```

## Field Descriptions

### Required Fields

- **assessmentType**: Must be either "Prakriti" or "Vikriti"
- **questionText**: The actual question text (string)
- **options**: Array of answer options (minimum 2, maximum 5)

### Option Object Fields

- **text**: The option text (required)
- **dosha**: Must be "Vata", "Pitta", or "Kapha" (required)
- **description**: Optional description for the option

### Optional Fields

- **order**: Integer indicating the question order (minimum 1)
- **isActive**: Boolean to set if the question is active (default: true)

## Postman Setup Instructions

### Step 1: Create New Request

1. Open Postman
2. Click "New" → "Request"
3. Set method to `POST`
4. Enter URL: `{{base_url}}/v1/question-master/questions/bulk`

### Step 2: Set Headers

Add these headers:
```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

### Step 3: Set Request Body

1. Select "Body" tab
2. Choose "raw" and "JSON" format
3. Paste your questions array

## Example Request Bodies

### Example 1: Prakriti Assessment Questions

```json
[
  {
    "assessmentType": "Prakriti",
    "questionText": "How would you describe your body frame?",
    "options": [
      {
        "text": "Thin and lean",
        "dosha": "Vata",
        "description": "Difficulty gaining weight, prominent bones"
      },
      {
        "text": "Medium build",
        "dosha": "Pitta", 
        "description": "Well-proportioned, moderate weight gain"
      },
      {
        "text": "Large and heavy",
        "dosha": "Kapha",
        "description": "Easy to gain weight, solid build"
      }
    ],
    "order": 1,
    "isActive": true
  },
  {
    "assessmentType": "Prakriti",
    "questionText": "How is your skin typically?",
    "options": [
      {
        "text": "Dry and rough",
        "dosha": "Vata",
        "description": "Prone to cracking, cold to touch"
      },
      {
        "text": "Warm and reddish",
        "dosha": "Pitta",
        "description": "Prone to rashes, warm to touch"
      },
      {
        "text": "Thick and oily",
        "dosha": "Kapha",
        "description": "Smooth, cool, and moist"
      }
    ],
    "order": 2,
    "isActive": true
  }
]
```

### Example 2: Vikriti Assessment Questions

```json
[
  {
    "assessmentType": "Vikriti",
    "questionText": "How has your appetite been recently?",
    "options": [
      {
        "text": "Irregular and variable",
        "dosha": "Vata",
        "description": "Sometimes hungry, sometimes not"
      },
      {
        "text": "Strong and intense",
        "dosha": "Pitta",
        "description": "Always hungry, gets irritable when hungry"
      },
      {
        "text": "Slow and steady",
        "dosha": "Kapha",
        "description": "Can skip meals easily, slow digestion"
      }
    ],
    "order": 1,
    "isActive": true
  },
  {
    "assessmentType": "Vikriti", 
    "questionText": "How is your sleep quality?",
    "options": [
      {
        "text": "Light and interrupted",
        "dosha": "Vata",
        "description": "Difficulty falling asleep, wakes easily"
      },
      {
        "text": "Moderate but may wake hot",
        "dosha": "Pitta",
        "description": "Sleeps well but may feel hot"
      },
      {
        "text": "Deep and heavy",
        "dosha": "Kapha",
        "description": "Sleeps deeply, hard to wake up"
      }
    ],
    "order": 2,
    "isActive": true
  }
]
```

## Expected Response

### Success Response (201 Created)

```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "assessmentType": "Prakriti",
    "questionText": "How would you describe your body frame?",
    "options": [
      {
        "text": "Thin and lean",
        "dosha": "Vata",
        "description": "Difficulty gaining weight, prominent bones"
      },
      {
        "text": "Medium build",
        "dosha": "Pitta",
        "description": "Well-proportioned, moderate weight gain"
      },
      {
        "text": "Large and heavy",
        "dosha": "Kapha",
        "description": "Easy to gain weight, solid build"
      }
    ],
    "order": 1,
    "isActive": true,
    "createdAt": "2023-09-06T10:30:00.000Z",
    "updatedAt": "2023-09-06T10:30:00.000Z"
  }
]
```

### Error Response (400 Bad Request)

```json
{
  "code": 400,
  "message": "Validation Error",
  "details": [
    {
      "field": "body[0].assessmentType",
      "message": "\"assessmentType\" must be one of [Prakriti, Vikriti]"
    }
  ]
}
```

## Validation Rules

1. **assessmentType**: Must be "Prakriti" or "Vikriti"
2. **questionText**: Required string
3. **options**: Array with 2-5 items
4. **options[].text**: Required string
5. **options[].dosha**: Must be "Vata", "Pitta", or "Kapha"
6. **options[].description**: Optional string
7. **order**: Optional integer ≥ 1
8. **isActive**: Optional boolean

## Tips for Bulk Creation

1. **Use a template**: Create a template question and copy it for multiple questions
2. **Validate JSON**: Use a JSON validator before sending
3. **Test with small batches**: Start with 2-3 questions to test the format
4. **Check for duplicates**: Ensure question texts are unique
5. **Maintain order**: Use sequential order numbers for proper sorting

## Common Issues and Solutions

### Issue: "Request body must be a non-empty array"
**Solution**: Ensure your request body is an array `[]`, not an object `{}`

### Issue: "options must contain at least 2 items"
**Solution**: Each question must have at least 2 options

### Issue: "dosha must be one of [Vata, Pitta, Kapha]"
**Solution**: Check spelling and case - must be exactly "Vata", "Pitta", or "Kapha"

### Issue: "assessmentType must be one of [Prakriti, Vikriti]"
**Solution**: Check spelling and case - must be exactly "Prakriti" or "Vikriti"

## Postman Environment Variables

Set up these environment variables in Postman:

```
base_url: http://localhost:3000 (or your API base URL)
auth_token: Your JWT authentication token
```

This allows you to use `{{base_url}}` and `{{auth_token}}` in your requests for easier management. 