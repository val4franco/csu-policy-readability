# HR Policy Chatbot

An intelligent chatbot web application that helps employees quickly find, understand, and get answers about company HR policies. The system connects to AWS S3 for document storage and uses OpenAI's GPT for natural language processing and policy summarization.

## Features

### 🤖 Intelligent Chatbot
- Natural language query processing
- Context-aware policy answers
- Confidence scoring for responses
- Real-time chat interface

### 📚 Policy Management
- AWS S3 integration for policy document storage
- Automatic policy processing and indexing
- AI-powered summarization
- Key point extraction

### 🔍 Advanced Search & Filtering
- Department-specific filtering (HR, IT, Finance, Legal, Operations)
- Policy type filtering (Employee Handbook, Benefits, Code of Conduct, Security, Compliance)
- Full-text search across all policies
- Relevance-based result ranking

### 🔗 Cross-Referencing
- Automatic identification of related policies
- Topic-based policy connections
- Enhanced discoverability

### 💻 User Interface
- Responsive web design
- Clean, modern interface
- Real-time policy cards display
- Mobile-friendly layout

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (HTML/CSS/JS) │◄──►│   (Node.js)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Chat UI       │    │ • API Routes    │    │ • AWS S3        │
│ • Filters       │    │ • Policy Proc.  │    │ • OpenAI API    │
│ • Policy Cards  │    │ • S3 Service    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- AWS Account with S3 access
- OpenAI API key

### Setup Steps

1. **Clone and Install Dependencies**
   ```bash
   cd hr-policy-chatbot
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```
   PORT=3000
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-policy-bucket
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **AWS S3 Setup**
   - Create an S3 bucket for policy documents
   - Upload policy documents with the following structure:
     ```
     policies/
     ├── hr/
     │   ├── employee-handbook.txt
     │   └── benefits-policy.txt
     ├── it/
     │   ├── security-policy.txt
     │   └── acceptable-use.txt
     └── finance/
         └── expense-policy.txt
     ```

4. **Start the Application**
   ```bash
   npm run dev    # Development mode with auto-reload
   npm start      # Production mode
   ```

5. **Access the Application**
   - Open your browser to `http://localhost:3000`
   - Start asking questions about your policies!

## API Endpoints

### Chat & Search
- `POST /api/chat` - Main chatbot endpoint
- `GET /api/search` - Search policies
- `GET /api/policy/:id` - Get specific policy details
- `GET /api/policy/:id/summary` - Get policy summary

### Admin & Monitoring
- `POST /api/admin/refresh-cache` - Refresh policy cache
- `GET /api/health` - Health check and stats

## Usage Examples

### Natural Language Queries
- "What's our vacation policy?"
- "How do I submit expenses?"
- "What are the remote work guidelines?"
- "Tell me about the code of conduct"

### Department-Specific Queries
- Filter by department (HR, IT, Finance, Legal, Operations)
- Filter by policy type (Handbook, Benefits, Security, etc.)

### Features in Action
1. **Policy Discovery**: Ask questions and get relevant policies automatically
2. **Summarization**: Get AI-generated summaries of complex policies
3. **Cross-References**: Discover related policies automatically
4. **Context-Aware**: Responses consider department and policy type filters

## Benefits

### Time Saving
- **Instant Policy Search**: No more digging through folders or documents
- **Quick Answers**: Get immediate responses to policy questions
- **Smart Suggestions**: Discover related policies automatically

### Improved Compliance
- **Easy Access**: All policies searchable in one place
- **Up-to-Date Information**: Centralized S3 storage ensures latest versions
- **Department-Specific Views**: Relevant policies for each team

### Reduced Research Overhead
- **Automated Summarization**: AI-generated policy summaries
- **Cross-Referencing**: Automatic identification of related policies
- **Search History**: Build knowledge base of common queries

## File Structure

```
hr-policy-chatbot/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── .env.example              # Environment template
├── public/                   # Frontend files
│   ├── index.html           # Main page
│   ├── styles.css           # Styling
│   └── script.js            # Frontend JavaScript
└── services/                 # Backend services
    ├── s3Service.js         # AWS S3 integration
    └── policyProcessor.js   # AI processing & analysis
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Use meaningful commit messages

## Security Considerations

- Store AWS credentials securely (never commit to repo)
- Use IAM roles with minimal required permissions
- Implement rate limiting for production use
- Consider adding authentication for sensitive policies

## Troubleshooting

### Common Issues

1. **AWS Connection Errors**
   - Verify AWS credentials and permissions
   - Check S3 bucket name and region
   - Ensure bucket has proper read permissions

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check API usage limits
   - Monitor rate limiting

3. **Policy Processing Issues**
   - Ensure policy documents are in text format
   - Check file encoding (UTF-8 recommended)
   - Verify S3 object permissions

### Debug Mode
Set `NODE_ENV=development` to see detailed error messages.

## License

ISC License - See LICENSE file for details.

## Support

For questions or issues, please check the troubleshooting section above or create an issue in the project repository.