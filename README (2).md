# Policy Assistant Chatbot

A modern, responsive web application for querying company policies with a CSU-inspired design. The chatbot interface is designed to eventually connect to AWS S3 for document storage and retrieval.

## Features

- **Modern UI/UX**: Clean, responsive design with CSU color scheme (green and gold)
- **Category Filtering**: Organize policies by department (HR, Finance, IT, Operations)
- **Real-time Chat Interface**: Smooth messaging experience with typing indicators
- **Quick Actions**: Pre-defined buttons for common policy queries
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices
- **Extensible Architecture**: Ready for S3 integration and advanced search capabilities

## File Structure

```
policy-chatbot/
├── index.html          # Main HTML structure
├── styles.css          # CSS with CSU-inspired styling
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## Getting Started

1. **Clone or download** the files to your local directory
2. **Open `index.html`** in a web browser
3. **Start chatting** with the policy assistant

## Current Functionality

The chatbot currently includes simulated responses for common policy queries:

- Remote work policies
- Expense reporting procedures
- Vacation and PTO policies
- IT security requirements
- Employee benefits information

## CSU Color Scheme

The interface uses colors inspired by the California State University system:

- **Primary Green**: `#1e4d2b` (CSU Forest Green)
- **Secondary Green**: `#2d5a3d` (Lighter shade)
- **Accent Gold**: `#c8b900` (CSU Gold)
- **Background**: `#f5f5dc` (Cream/Off-white)

## Future S3 Integration

The application is structured to easily integrate with AWS S3 for policy document storage:

### Planned Architecture

1. **Document Storage**: Policy documents (PDF, TXT, JSON) stored in S3 buckets
2. **Organization**: Documents organized by department/category
3. **Search Integration**: Semantic search across document contents
4. **Real-time Updates**: Automatic policy updates from S3

### S3 Integration Steps

1. **Set up AWS S3 bucket** for policy documents
2. **Configure AWS SDK** in the frontend or create a backend API
3. **Implement document parsing** for different file types
4. **Add semantic search** capabilities
5. **Connect the `S3PolicyManager` class** (already scaffolded in script.js)

### Example S3 Bucket Structure

```
policy-bucket/
├── hr/
│   ├── remote-work-policy-2024.pdf
│   ├── pto-policy-2024.pdf
│   └── employee-handbook.pdf
├── finance/
│   ├── expense-policy-2024.pdf
│   └── travel-guidelines.pdf
├── it/
│   ├── security-policy-2024.pdf
│   └── data-protection-guidelines.pdf
└── operations/
    ├── safety-procedures.pdf
    └── workflow-guidelines.pdf
```

## Customization

### Adding New Policy Categories

1. **Update HTML**: Add new category tags in the header
2. **Update CSS**: Add any category-specific styling
3. **Update JavaScript**: Add category handling in `setActiveCategory()` method

### Modifying the Color Scheme

Update the CSS custom properties in `:root`:

```css
:root {
    --csu-green: #1e4d2b;
    --csu-gold: #c8b900;
    /* Add your custom colors here */
}
```

### Adding New Quick Actions

Add buttons to the `.quick-actions` section in HTML:

```html
<button class="quick-action" data-query="Your query here">
    <i class="fas fa-icon-name"></i>
    Button Text
</button>
```

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Dependencies

- **Font Awesome 6.0**: For icons
- **Google Fonts (Inter)**: For typography
- **Modern CSS Features**: CSS Grid, Flexbox, Custom Properties

## Performance Considerations

- Lazy loading for large policy documents
- Efficient search indexing
- Caching strategies for frequently accessed policies
- Progressive loading of chat history

## Security Considerations

When integrating with S3:

- Use IAM roles with minimal required permissions
- Implement proper authentication for sensitive policies
- Consider encryption for confidential documents
- Audit access logs regularly

## Contributing

1. Follow the existing code style and structure
2. Test on multiple browsers and devices
3. Update documentation for any new features
4. Consider accessibility in all UI changes

## License

This project is designed for internal company use. Modify as needed for your organization's requirements.
