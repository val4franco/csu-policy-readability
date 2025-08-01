class PolicyChatbot {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.policyCards = document.getElementById('policyCards');
        this.areaFilter = document.getElementById('areaFilter');
        this.universitySelector = document.getElementById('universitySelector');
        this.mainTitle = document.getElementById('mainTitle');
        this.mainSubtitle = document.getElementById('mainSubtitle');
        this.yakLogo = document.getElementById('yakLogo');
        this.universityLogo = document.getElementById('universityLogo');
        
        // Use configuration from config.js
        this.apiEndpoint = window.CONFIG.API_ENDPOINT;
        this.currentUniversity = 'csu'; // Default to CSU
        
        this.initializeEventListeners();
        this.initializeTheme();
        this.addWelcomeMessage();
    }
    
    initializeEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        this.areaFilter.addEventListener('change', () => this.onAreaFilterChange());
        this.universitySelector.addEventListener('change', () => this.onUniversityChange());
    }
    
    initializeTheme() {
        // Set initial logos
        this.yakLogo.src = window.CONFIG.LOGOS.yak;
        this.universityLogo.src = window.CONFIG.LOGOS.csu;
        
        // Set initial theme
        this.applyTheme('csu');
    }
    
    onUniversityChange() {
        const selectedUniversity = this.universitySelector.value;
        this.currentUniversity = selectedUniversity;
        
        console.log('University changed to:', selectedUniversity);
        
        // Apply theme
        this.applyTheme(selectedUniversity);
        
        // Update logos
        this.updateLogos(selectedUniversity);
        
        // Update title and subtitle
        this.updateTitleAndSubtitle(selectedUniversity);
        
        // Show a small grey notification message
        const universityName = window.CONFIG.UNIVERSITIES[selectedUniversity]?.name || selectedUniversity.toUpperCase();
        this.addNotificationMessage(`Switched to ${universityName}`);
    }
    
    applyTheme(university) {
        const body = document.body;
        
        // Remove existing theme classes
        body.classList.remove('csu-theme', 'sdsu-theme');
        
        // Apply new theme
        if (university === 'sdsu') {
            body.classList.add('sdsu-theme');
        } else {
            body.classList.add('csu-theme');
        }
        
        console.log(`Applied ${university} theme`);
    }
    
    updateLogos(university) {
        // Yak logo stays the same
        this.yakLogo.src = window.CONFIG.LOGOS.yak;
        
        // Update university logo
        if (university === 'sdsu') {
            this.universityLogo.src = window.CONFIG.LOGOS.sdsu;
            this.universityLogo.alt = 'SDSU Logo';
        } else {
            this.universityLogo.src = window.CONFIG.LOGOS.csu;
            this.universityLogo.alt = 'CSU Logo';
        }
        
        console.log(`Updated logos for ${university}`);
    }
    
    updateTitleAndSubtitle(university) {
        const config = window.CONFIG.UNIVERSITIES[university];
        
        if (config) {
            this.mainTitle.textContent = config.name;
            this.mainSubtitle.textContent = config.subtitle;
            
            // Update page title
            document.title = config.name;
        }
        
        console.log(`Updated title and subtitle for ${university}`);
    }
    
    onAreaFilterChange() {
        const selectedArea = this.areaFilter.value;
        console.log('Area filter changed to:', selectedArea || 'All Areas');
        
        // Show a small grey notification message
        if (selectedArea) {
            this.addNotificationMessage(`Filtering policies for: ${selectedArea}`);
        } else {
            this.addNotificationMessage('Showing all policy areas');
        }
    }
    
    addWelcomeMessage() {
        const welcomeMessage = window.CONFIG.UI.WELCOME_MESSAGES[this.currentUniversity] || 
                              window.CONFIG.UI.WELCOME_MESSAGES.csu;
        this.addBotMessage(welcomeMessage);
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        this.addUserMessage(message);
        this.messageInput.value = '';
        this.sendButton.disabled = true;
        
        this.addBotMessage('<div class="loading"></div>', true);
        
        try {
            // Prepare POST request body
            const requestBody = {
                query: message,
                area: this.areaFilter.value || null
            };
            
            console.log('Making API call to:', this.apiEndpoint);
            console.log('Request body:', requestBody);
            
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            this.removeLastMessage();
            
            // Handle Lambda API Gateway response format
            let responseData = data;
            if (data.body) {
                responseData = JSON.parse(data.body);
            }
            
            if (responseData.answer) {
                this.addBotMessage(responseData.answer);
            } else if (responseData.response) {
                this.addBotMessage(responseData.response);
            } else if (responseData.error) {
                this.addBotMessage(`Sorry, I encountered an error: ${responseData.error}`);
            } else {
                this.addBotMessage(window.CONFIG.UI.ERROR_MESSAGES.NO_RESPONSE);
            }
            
        } catch (error) {
            this.removeLastMessage();
            console.error('Error:', error);
            
            if (error.message.includes('Failed to fetch')) {
                this.addBotMessage(window.CONFIG.UI.ERROR_MESSAGES.NETWORK_ERROR);
            } else {
                this.addBotMessage(window.CONFIG.UI.ERROR_MESSAGES.GENERAL_ERROR);
            }
        }
        
        this.sendButton.disabled = false;
    }
    
    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.textContent = message;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addBotMessage(message, isLoading = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        if (isLoading) {
            messageDiv.innerHTML = message;
        } else {
            // Handle both plain text and HTML content
            if (message.includes('<') && message.includes('>')) {
                messageDiv.innerHTML = message;
            } else {
                messageDiv.textContent = message;
            }
        }
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addNotificationMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'notification-message';
        messageDiv.textContent = message;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    removeLastMessage() {
        const lastMessage = this.chatMessages.lastElementChild;
        if (lastMessage) {
            lastMessage.remove();
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    displayPolicies(policies) {
        this.policyCards.innerHTML = '';
        
        policies.forEach(policy => {
            const card = this.createPolicyCard(policy);
            this.policyCards.appendChild(card);
        });
    }
    
    createPolicyCard(policy) {
        const card = document.createElement('div');
        card.className = 'policy-card';
        
        card.innerHTML = `
            <h3>${policy.title}</h3>
            <div class="department">${policy.area || policy.department || 'General'}</div>
            <div class="summary">${policy.summary}</div>
            <div class="actions">
                <button class="view-btn" onclick="viewPolicy('${policy.id}')">View Full Policy</button>
                <button class="summarize-btn" onclick="summarizePolicy('${policy.id}')">Get Summary</button>
            </div>
            ${policy.relatedPolicies ? this.createRelatedPoliciesSection(policy.relatedPolicies) : ''}
        `;
        
        return card;
    }
    
    createRelatedPoliciesSection(relatedPolicies) {
        if (!relatedPolicies || relatedPolicies.length === 0) return '';
        
        const tags = relatedPolicies.map(policy => 
            `<span class="related-policy-tag" onclick="searchPolicy('${policy.title}')">${policy.title}</span>`
        ).join('');
        
        return `
            <div class="related-policies">
                <h4>Related Policies:</h4>
                ${tags}
            </div>
        `;
    }
    
    // Method to programmatically set area filter (useful for related policy clicks)
    setAreaFilter(area) {
        this.areaFilter.value = area;
        this.onAreaFilterChange();
    }
    
    // Method to clear area filter
    clearAreaFilter() {
        this.areaFilter.value = '';
        this.onAreaFilterChange();
    }
    
    // Method to programmatically set university
    setUniversity(university) {
        this.universitySelector.value = university;
        this.onUniversityChange();
    }
    

    // Typing indicator
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-message';
        typingDiv.id = 'typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        
        content.appendChild(indicator);
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(content);
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Format timestamp
    formatTimestamp(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

async function viewPolicy(policyId) {
    try {
        // This would need to be implemented based on your backend API
        // For now, show a placeholder message
        chatbot.addBotMessage(`Full policy view for ID: ${policyId} would be displayed here. This feature needs to be implemented based on your specific policy storage system.`);
        
    } catch (error) {
        console.error('Error viewing policy:', error);
        chatbot.addBotMessage('Error loading policy content');
    }
}

async function summarizePolicy(policyId) {
    try {
        // This would need to be implemented based on your backend API
        // For now, show a placeholder message
        chatbot.addBotMessage(`Policy summary for ID: ${policyId} would be generated here. This feature needs to be implemented based on your specific policy storage system.`);
        
    } catch (error) {
        console.error('Error summarizing policy:', error);
        chatbot.addBotMessage('Error generating policy summary');
    }
}

function searchPolicy(policyTitle) {
    chatbot.messageInput.value = `Tell me about ${policyTitle}`;
    chatbot.sendMessage();
}

// Utility function to get current area filter
function getCurrentArea() {
    return chatbot.areaFilter.value;
}

// Utility function to get current university
function getCurrentUniversity() {
    return chatbot.currentUniversity;
}

// Utility function to encode area name for URL
function encodeAreaForUrl(area) {
    return encodeURIComponent(area);
}

// Initialize the chatbot when the page loads
let chatbot;
document.addEventListener('DOMContentLoaded', () => {
    chatbot = new PolicyChatbot();
    
    // Load saved font size
    const savedFontSize = localStorage.getItem('fontSize') || 'normal';
    changeFontSize(savedFontSize);
    
    // Load saved color mode
    const savedColorMode = localStorage.getItem('colorMode') || 'normal';
    changeColorMode(savedColorMode);
    
    // Add some example interactions for testing
    console.log('Policy Assistant loaded successfully!');
    console.log('Available areas:', window.CONFIG.AREAS);
    console.log('API Endpoint:', window.CONFIG.API_ENDPOINT);
    console.log('Available universities:', Object.keys(window.CONFIG.UNIVERSITIES));
});