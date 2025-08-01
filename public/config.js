// Configuration file for CSU Policy Assistant
// Update the API_ENDPOINT with your actual Lambda function URL

const CONFIG = {
    // Your actual API Gateway endpoint URL
    API_ENDPOINT: 'https://up9wt70xn5.execute-api.us-west-2.amazonaws.com/dev/getRespond',
    
    // CSU Areas - these should match exactly what's in your Lambda function
    AREAS: [
        'Academic and Student Affairs',
        'Audit and Advisory Services',
        'Board of Trustees',
        'Business and Finance',
        'Chancellor',
        'External Relations and Communication',
        'Human Resources'
    ],
    
    // University configurations
    UNIVERSITIES: {
        csu: {
            name: 'CSU Policy Assistant',
            subtitle: 'Ask questions about CSU policies and get instant answers',
            logoUrl: 'logo-202-CSU.png',
            theme: 'csu'
        },
        sdsu: {
            name: 'SDSU Policy Assistant',
            subtitle: 'Ask questions about San Diego State University policies and get instant answers',
            logoUrl: 'san_diego_state_aztecs_2013-pres-a.webp',
            theme: 'sdsu'
        }
    },
    
    // Logo URLs - now using actual images
    LOGOS: {
        yak: 'Yak.png',
        csu: 'logo-202-CSU.png',
        sdsu: 'san_diego_state_aztecs_2013-pres-a.webp'
    },
    
    // UI Configuration
    UI: {
        WELCOME_MESSAGES: {
            csu: 'Hello! I\'m your CSU Policy Assistant. I can help you find information about CSU policies across all areas. You can filter by a specific area using the dropdown above, or search across all policies. What would you like to know?',
            sdsu: 'Hello! I\'m your SDSU Policy Assistant. I can help you find information about San Diego State University policies across all areas. You can filter by a specific area using the dropdown above, or search across all policies. What would you like to know?'
        },
        ERROR_MESSAGES: {
            NETWORK_ERROR: 'Sorry, I couldn\'t connect to the policy service. Please check your internet connection and try again.',
            GENERAL_ERROR: 'Sorry, I encountered an error while processing your request. Please try again.',
            NO_RESPONSE: 'Sorry, I didn\'t receive a proper response. Please try again.'
        }
    }
};

// Make CONFIG available globally
window.CONFIG = CONFIG;
