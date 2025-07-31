// Configuration file for Policy Assistant Chatbot
// This file will be used when integrating with AWS S3

const CONFIG = {
    // AWS Configuration (to be filled when integrating with S3)
    aws: {
        region: 'us-west-2', // Change to your preferred region
        bucketName: 'your-policy-bucket-name',
        accessKeyId: '', // Use IAM roles in production
        secretAccessKey: '', // Use IAM roles in production
        
        // S3 folder structure
        folders: {
            hr: 'hr/',
            finance: 'finance/',
            it: 'it/',
            operations: 'operations/',
            general: 'general/'
        }
    },
    
    // Chatbot Configuration
    chatbot: {
        maxMessageHistory: 100,
        typingDelayMin: 1000, // milliseconds
        typingDelayMax: 3000, // milliseconds
        maxResponseLength: 2000, // characters
        
        // Default responses
        fallbackResponse: "I'm sorry, I couldn't find specific information about that topic. Could you please rephrase your question or try one of the suggested topics?",
        
        // Category mappings
        categoryKeywords: {
            hr: ['human resources', 'hr', 'employee', 'vacation', 'pto', 'benefits', 'leave', 'remote work', 'performance'],
            finance: ['finance', 'expense', 'budget', 'reimbursement', 'procurement', 'invoice', 'payment', 'cost'],
            it: ['it', 'security', 'password', 'data', 'system', 'network', 'software', 'hardware', 'cyber'],
            operations: ['operations', 'procedure', 'workflow', 'safety', 'compliance', 'quality', 'process']
        }
    },
    
    // UI Configuration
    ui: {
        theme: 'csu', // CSU color scheme
        animationDuration: 300, // milliseconds
        maxMessagesDisplayed: 50,
        
        // Quick action buttons
        quickActions: [
            {
                text: 'Remote Work',
                icon: 'fas fa-home',
                query: 'What is the remote work policy?',
                category: 'hr'
            },
            {
                text: 'Expense Reports',
                icon: 'fas fa-receipt',
                query: 'How do I submit an expense report?',
                category: 'finance'
            },
            {
                text: 'Security',
                icon: 'fas fa-shield-alt',
                query: 'What are the IT security requirements?',
                category: 'it'
            },
            {
                text: 'Vacation Policy',
                icon: 'fas fa-calendar-alt',
                query: 'What is the vacation policy?',
                category: 'hr'
            }
        ],
        
        // Policy categories
        categories: [
            { id: 'all', name: 'All Policies', icon: 'fas fa-list' },
            { id: 'hr', name: 'Human Resources', icon: 'fas fa-users' },
            { id: 'finance', name: 'Finance', icon: 'fas fa-dollar-sign' },
            { id: 'it', name: 'IT & Security', icon: 'fas fa-laptop' },
            { id: 'operations', name: 'Operations', icon: 'fas fa-cogs' }
        ]
    },
    
    // Search Configuration
    search: {
        minQueryLength: 3,
        maxResults: 10,
        highlightMatches: true,
        fuzzySearchThreshold: 0.6,
        
        // File type priorities (higher number = higher priority)
        fileTypePriority: {
            'pdf': 3,
            'docx': 2,
            'txt': 1,
            'json': 1
        }
    },
    
    // Performance Configuration
    performance: {
        cacheTimeout: 300000, // 5 minutes in milliseconds
        maxCacheSize: 50, // number of cached responses
        lazyLoadThreshold: 20, // messages before lazy loading kicks in
        debounceDelay: 300 // milliseconds for search input debouncing
    },
    
    // Development/Debug Configuration
    debug: {
        enabled: false, // Set to true for development
        logLevel: 'info', // 'debug', 'info', 'warn', 'error'
        mockResponses: true, // Use mock responses instead of S3
        simulateNetworkDelay: true
    }
};

// Export configuration for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}

// Example usage in main application:
// const config = window.CONFIG || require('./config.js');
// const bucketName = config.aws.bucketName;
