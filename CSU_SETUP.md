# CSU Policy Assistant Setup Guide

## Overview
The frontend has been updated to work with your AWS Lambda function for CSU policy queries. The system now includes area filtering and CSU branding.

## Key Changes Made

### 1. Updated Branding
- Changed from "HR Policy Assistant" to "CSU Policy Assistant"
- Applied CSU color scheme (Green: #1e4d2b, Gold: #f1b82d)
- Updated all text references to reflect CSU context

### 2. Area Filtering
- Replaced department/policy type filters with a single CSU area dropdown
- Added all 7 CSU areas:
  - Academic and Student Affairs
  - Audit and Advisory Services
  - Board of Trustees
  - Business and Finance
  - Chancellor
  - External Relations and Communication
  - Human Resources

### 3. Lambda Integration
- Updated API calls to use GET requests with query parameters
- Properly URL-encodes the area parameter
- Handles the Lambda function response format

## Setup Instructions

### 1. Update API Endpoint
Edit `public/config.js` and replace the placeholder with your actual API Gateway endpoint:

```javascript
const CONFIG = {
    API_ENDPOINT: 'https://your-actual-api-gateway-endpoint.amazonaws.com/prod/chat',
    // ... rest of config
};
```

### 2. Test the Integration
1. Open `public/index.html` in a web browser
2. Try asking questions like:
   - "What are the academic policies?"
   - "Tell me about HR policies"
   - "What policies apply to business and finance?"

### 3. Verify Area Filtering
1. Select an area from the dropdown (e.g., "Human Resources")
2. Ask a question
3. Check the browser's Network tab to confirm the API call includes `&area=Human+Resources`

## API Call Format

The frontend now makes GET requests to your Lambda function with this format:
```
https://your-endpoint.com/prod/chat?query=your+question&area=Academic+and+Student+Affairs
```

- `query`: The user's question (URL-encoded)
- `area`: The selected area (URL-encoded, optional)

## File Structure

```
public/
├── index.html          # Main page with CSU branding
├── styles.css          # CSU-themed styling
├── script.js           # Updated JavaScript with Lambda integration
└── config.js           # Configuration file for easy endpoint management
```

## Features

### Area Filtering
- Users can select a specific CSU area or choose "All Areas"
- The area parameter is only sent if a specific area is selected
- Filter changes provide user feedback

### Responsive Design
- Mobile-friendly layout
- CSU color scheme throughout
- Smooth animations and hover effects

### Error Handling
- Network connectivity issues
- API errors
- Malformed responses
- User-friendly error messages

## Customization

### Colors
The CSU color scheme is defined in `styles.css`:
- Primary Green: `#1e4d2b`
- Gold Accent: `#f1b82d`
- Darker Green: `#0f2415`

### Messages
All user-facing messages are configurable in `config.js`:
- Welcome message
- Error messages
- Area list

### Areas
To add or modify areas, update the `AREAS` array in `config.js`.

## Testing Checklist

- [ ] API endpoint is correctly configured
- [ ] Area dropdown shows all 7 areas
- [ ] Questions without area selection work
- [ ] Questions with area selection include the area parameter
- [ ] Error handling works for network issues
- [ ] Mobile layout is responsive
- [ ] CSU branding is consistent

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your API Gateway has CORS enabled
   - Add the frontend domain to allowed origins

2. **API Endpoint Not Found**
   - Verify the endpoint URL in `config.js`
   - Check that the Lambda function is deployed

3. **Area Parameter Not Working**
   - Check browser Network tab to see if parameter is included
   - Verify Lambda function handles the `area` query parameter

4. **Styling Issues**
   - Clear browser cache
   - Check for CSS conflicts

## Next Steps

1. Deploy the frontend to your web server
2. Test with real CSU policy data
3. Consider adding authentication if needed
4. Monitor usage and performance
5. Add analytics if desired

## Support

For issues with the frontend integration, check:
1. Browser console for JavaScript errors
2. Network tab for API call details
3. Lambda function logs for backend issues
