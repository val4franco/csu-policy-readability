class PolicyChatbot {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.connectionIndicator = document.getElementById('connectionIndicator');
        this.connectionText = document.getElementById('connectionText');
        this.policyCount = document.getElementById('policyCount');
        this.campusSelect = document.getElementById('campusSelect');
        
        this.currentCategory = 'all';
        this.currentCampus = 'system';
        this.isTyping = false;
        this.messageHistory = [];
        this.policyData = null;
        this.campusNames = this.getCampusNames();
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadPolicyData();
        this.simulateInitialLoad();
        this.focusInput();
    }
    
    async loadPolicyData() {
        try {
            const response = await fetch('./sample-policy.json');
            this.policyData = await response.json();
            console.log('Policy data loaded:', this.policyData);
        } catch (error) {
            console.error('Failed to load policy data:', error);
            // Fallback to embedded policy data
            this.policyData = this.getFallbackPolicyData();
        }
    }
    
    getFallbackPolicyData() {
        return {
            "title": "California State University Information Security Policy",
            "policy_id": "CSU-IT-001",
            "category": "IT & Security",
            "sections": {
                "password_requirements": {
                    "title": "Password and Authentication Requirements",
                    "content": {
                        "minimum_length": "Passwords must be at least 12 characters long",
                        "complexity": "Passwords must contain a combination of uppercase letters, lowercase letters, numbers, and special characters",
                        "expiration": "Passwords must be changed every 90 days for privileged accounts and every 180 days for standard user accounts",
                        "multi_factor": "Multi-factor authentication (MFA) is required for all administrative accounts"
                    }
                },
                "data_classification": {
                    "title": "Data Classification and Handling",
                    "content": {
                        "handling_requirements": "All data must be classified according to its sensitivity level and handled according to established procedures. Confidential and restricted data must be encrypted both in transit and at rest."
                    }
                }
            }
        };
    }
    
    getCampusNames() {
        return {
            'system': 'CSU System-wide',
            'bakersfield': 'CSU Bakersfield',
            'channel-islands': 'CSU Channel Islands',
            'chico': 'CSU Chico',
            'dominguez-hills': 'CSU Dominguez Hills',
            'east-bay': 'CSU East Bay',
            'fresno': 'CSU Fresno',
            'fullerton': 'CSU Fullerton',
            'humboldt': 'Cal Poly Humboldt',
            'long-beach': 'CSU Long Beach',
            'los-angeles': 'CSU Los Angeles',
            'maritime': 'Cal Maritime',
            'monterey-bay': 'CSU Monterey Bay',
            'northridge': 'CSU Northridge',
            'pomona': 'Cal Poly Pomona',
            'sacramento': 'CSU Sacramento',
            'san-bernardino': 'CSU San Bernardino',
            'san-diego': 'San Diego State University',
            'san-francisco': 'San Francisco State University',
            'san-jose': 'San José State University',
            'san-luis-obispo': 'Cal Poly San Luis Obispo',
            'san-marcos': 'CSU San Marcos',
            'sonoma': 'Sonoma State University',
            'stanislaus': 'CSU Stanislaus'
        };
    }
    
    setupEventListeners() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Campus selection
        this.campusSelect.addEventListener('change', (e) => {
            this.setActiveCampus(e.target.value);
        });
        
        // Quick action buttons
        document.querySelectorAll('.quick-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const query = e.currentTarget.dataset.query;
                this.messageInput.value = query;
                this.sendMessage();
            });
        });
        
        // Category filter buttons
        document.querySelectorAll('.category-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                this.setActiveCategory(e.currentTarget.dataset.category);
            });
        });
        
        // Auto-resize input and focus management
        this.messageInput.addEventListener('input', () => {
            this.updateSendButtonState();
        });
        
        this.updateSendButtonState();
    }
    
    setActiveCampus(campus) {
        this.currentCampus = campus;
        const campusName = this.campusNames[campus] || campus;
        
        // Show campus change message
        this.addBotMessage(`Now showing policies for **${campusName}**. How can I help you with campus-specific policy information?`);
    }
    
    setActiveCategory(category) {
        this.currentCategory = category;
        
        // Update active state
        document.querySelectorAll('.category-tag').forEach(tag => {
            tag.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // Show category change message
        this.addBotMessage(`Now filtering for ${this.getCategoryDisplayName(category)} policies. How can I help you?`);
    }
    
    getCategoryDisplayName(category) {
        const categoryNames = {
            'all': 'all',
            'hr': 'Human Resources',
            'finance': 'Finance',
            'it': 'IT & Security',
            'operations': 'Operations'
        };
        return categoryNames[category] || category;
    }
    
    updateSendButtonState() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || this.isTyping;
    }
    
    focusInput() {
        this.messageInput.focus();
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Add user message to chat
        this.addUserMessage(message);
        
        // Clear input
        this.messageInput.value = '';
        this.updateSendButtonState();
        
        // Show typing indicator
        this.showTyping();
        
        // Simulate processing delay
        await this.delay(1000 + Math.random() * 2000);
        
        // Generate bot response
        const response = await this.generateResponse(message);
        
        // Hide typing indicator and show response
        this.hideTyping();
        this.addBotMessage(response.text, response.sources);
        
        // Focus back to input
        this.focusInput();
    }
    
    addUserMessage(message) {
        const messageElement = this.createMessageElement('user', message);
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
        
        // Add to history
        this.messageHistory.push({ type: 'user', content: message, timestamp: new Date() });
    }
    
    addBotMessage(message, sources = []) {
        const messageElement = this.createMessageElement('bot', message, sources);
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
        
        // Add to history
        this.messageHistory.push({ type: 'bot', content: message, sources, timestamp: new Date() });
    }
    
    createMessageElement(type, content, sources = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const avatar = document.createElement('div');
        avatar.className = `${type}-avatar`;
        avatar.innerHTML = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = content;
        
        // Add policy sources if provided
        if (sources && sources.length > 0) {
            const sourcesContainer = document.createElement('div');
            sources.forEach(source => {
                const sourceTag = document.createElement('div');
                sourceTag.className = 'policy-source';
                sourceTag.innerHTML = `<i class="fas fa-file-alt"></i> ${source}`;
                sourcesContainer.appendChild(sourceTag);
            });
            messageContent.appendChild(sourcesContainer);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        return messageDiv;
    }
    
    showTyping() {
        this.isTyping = true;
        this.typingIndicator.style.display = 'flex';
        this.updateSendButtonState();
        this.scrollToBottom();
    }
    
    hideTyping() {
        this.isTyping = false;
        this.typingIndicator.style.display = 'none';
        this.updateSendButtonState();
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
    
    async generateResponse(userMessage) {
        if (!this.policyData) {
            return {
                text: "I'm still loading the policy documents. Please try again in a moment.",
                sources: []
            };
        }
        
        const message = userMessage.toLowerCase();
        const campusName = this.campusNames[this.currentCampus];
        const campusContext = this.currentCampus === 'system' ? 'CSU System-wide' : `${campusName}`;
        let response = { text: '', sources: [] };
        
        // Search through the policy data for relevant information
        if (message.includes('password') || message.includes('authentication') || message.includes('login')) {
            const passwordSection = this.policyData.sections.password_requirements;
            if (passwordSection) {
                response = {
                    text: `Based on the **${this.policyData.title}** for **${campusContext}**, here are the password and authentication requirements:

**Password Requirements:**
• ${passwordSection.content.minimum_length}
• ${passwordSection.content.complexity}
• ${passwordSection.content.expiration}
• Users cannot reuse their last 12 passwords
• ${passwordSection.content.multi_factor}
• Passwords must not be stored in plain text or shared with others

**Campus-Specific Notes:**
${this.getCampusSpecificNote('password')}

**Important:** These requirements help protect ${campusName} information systems and data from unauthorized access.

Do you need more specific information about any of these requirements?`,
                    sources: [this.policyData.policy_id + '.pdf']
                };
            }
        } else if (message.includes('data') || message.includes('classification') || message.includes('sensitive') || message.includes('confidential')) {
            const dataSection = this.policyData.sections.data_classification;
            if (dataSection) {
                response = {
                    text: `According to the **${this.policyData.title}** for **${campusContext}**, data classification and handling requirements include:

**Data Classification Levels:**
• **Public:** Information that can be freely shared without risk to the CSU
• **Internal:** Information intended for use within the CSU community
• **Confidential:** Sensitive information that could cause harm if disclosed inappropriately
• **Restricted:** Highly sensitive information requiring the highest level of protection

**Handling Requirements:**
${dataSection.content.handling_requirements}

**Campus-Specific Implementation:**
${this.getCampusSpecificNote('data')}

**Key Points:**
• All data must be classified according to its sensitivity level
• Confidential and restricted data must be encrypted both in transit and at rest
• Proper handling procedures must be followed based on classification level

Would you like more details about handling procedures for a specific classification level?`,
                    sources: [this.policyData.policy_id + '.pdf']
                };
            }
        } else if (message.includes('incident') || message.includes('security breach') || message.includes('report')) {
            const incidentSection = this.policyData.sections.incident_response;
            if (incidentSection) {
                response = {
                    text: `Here's what you need to know about **Security Incident Response** for **${campusContext}**:

**Immediate Actions:**
• ${incidentSection.content.reporting}
• ${incidentSection.content.response_time}

**Documentation Requirements:**
• ${incidentSection.content.documentation}

**Notification Process:**
• ${incidentSection.content.notification}

**Campus-Specific Contacts:**
${this.getCampusSpecificNote('incident')}

**Remember:** Time is critical in security incidents. Report immediately and don't attempt to handle it alone.

**Contact Information:**
• Campus IT Security Office
• CSU Information Security Office
• Email: ${this.policyData.contact_information.email}
• Phone: ${this.policyData.contact_information.phone}

Do you need help with reporting a specific type of incident?`,
                    sources: [this.policyData.policy_id + '.pdf', 'CSU-Incident-Response-Procedures.pdf']
                };
            }
        } else if (message.includes('access') || message.includes('permission') || message.includes('user account')) {
            const accessSection = this.policyData.sections.access_control;
            if (accessSection) {
                response = {
                    text: `Based on the **Access Control and User Management** section for **${campusContext}**:

**Core Principles:**
• ${accessSection.content.principle}
• ${accessSection.content.authorization}

**Access Management:**
• ${accessSection.content.review}
• ${accessSection.content.guest_access}

**Campus-Specific Procedures:**
${this.getCampusSpecificNote('access')}

**Key Requirements:**
• All access must be properly authorized
• Regular review of user permissions
• Immediate access revocation upon role changes or termination
• Limited scope and duration for temporary access

**Best Practices:**
• Request only the minimum access needed for your role
• Report any unnecessary access permissions
• Notify IT immediately when changing roles or leaving

Need help with requesting access or reporting access issues?`,
                    sources: [this.policyData.policy_id + '.pdf']
                };
            }
        } else if (message.includes('compliance') || message.includes('training') || message.includes('violation')) {
            const complianceSection = this.policyData.sections.compliance;
            if (complianceSection) {
                response = {
                    text: `Here's important information about **Compliance and Enforcement** for **${campusContext}**:

**Compliance Requirements:**
• ${complianceSection.content.requirements}
• ${complianceSection.content.training}

**Enforcement:**
• ${complianceSection.content.violations}
• ${complianceSection.content.monitoring}

**Campus-Specific Training:**
${this.getCampusSpecificNote('training')}

**Training Information:**
• Security awareness training is mandatory
• Must be completed annually
• Covers current threats and best practices
• Failure to complete may result in access restrictions

**Important:** Compliance with information security policies is not optional - it's a requirement for all CSU community members.

Do you need help accessing security training resources?`,
                    sources: [this.policyData.policy_id + '.pdf']
                };
            }
        } else if (message.includes('policy') && (message.includes('what') || message.includes('about') || message.includes('summary'))) {
            const purposeSection = this.policyData.sections.purpose;
            response = {
                text: `Here's an overview of the **${this.policyData.title}** for **${campusContext}**:

**Policy ID:** ${this.policyData.policy_id}
**Category:** ${this.policyData.category}
**Last Updated:** ${this.policyData.last_updated}
**Applicable to:** ${campusName}

**Purpose:**
${purposeSection.content}

**Key Areas Covered:**
• Password and Authentication Requirements
• Data Classification and Handling
• Security Incident Response
• Access Control and User Management
• Compliance and Enforcement

**Campus-Specific Information:**
${this.getCampusSpecificNote('general')}

**Related Policies:**
${this.policyData.related_policies.map(policy => `• ${policy}`).join('\n')}

**Contact Information:**
• Policy Owner: ${this.policyData.contact_information.policy_owner}
• Email: ${this.policyData.contact_information.email}
• Phone: ${this.policyData.contact_information.phone}

What specific aspect of the policy would you like to know more about?`,
                sources: [this.policyData.policy_id + '.pdf']
            };
        } else {
            // Generic response for unrecognized queries
            response = {
                text: `I can help you find information about the **${this.policyData.title}** for **${campusContext}**. Here are some topics I can assist with:

**Available Information:**
• **Password Requirements** - Length, complexity, expiration rules
• **Data Classification** - How to classify and handle different types of data
• **Security Incidents** - How to report and respond to security issues
• **Access Control** - User permissions and account management
• **Compliance** - Training requirements and policy enforcement

**Campus-Specific Help:**
${this.getCampusSpecificNote('help')}

**Quick Examples:**
• "What are the password requirements?"
• "How do I classify sensitive data?"
• "How do I report a security incident?"
• "What access do I need for my role?"

You can also try the quick action buttons below for common topics. What would you like to know about?`,
                sources: [this.policyData.policy_id + '.pdf']
            };
        }
        
        return response;
    }
    
    getCampusSpecificNote(type) {
        const campusName = this.campusNames[this.currentCampus];
        
        if (this.currentCampus === 'system') {
            return "This policy applies to all CSU campuses. Individual campuses may have additional specific requirements.";
        }
        
        const campusSpecificNotes = {
            'password': `For ${campusName} users, contact your local IT Help Desk for campus-specific password reset procedures and MFA setup assistance.`,
            'data': `${campusName} may have additional data handling requirements based on specific research, student services, or administrative needs. Contact your campus Data Protection Officer for details.`,
            'incident': `For ${campusName}, report security incidents to:\n• Campus IT Security: Contact your local IT department\n• Campus Emergency Line: Check your campus directory\n• After-hours incidents: Follow campus emergency procedures`,
            'access': `${campusName} users should submit access requests through the campus-specific IT service portal or contact your department's IT liaison.`,
            'training': `${campusName} provides campus-specific security training through the local Learning Management System. Check with HR or IT for training schedules and requirements.`,
            'general': `This policy is implemented at ${campusName} with campus-specific procedures and contacts. For local support, contact your campus IT department.`,
            'help': `For ${campusName}-specific assistance, contact:\n• Campus IT Help Desk\n• Campus Security Office\n• Local HR Department\n• Student Services (for student-related policies)`
        };
        
        return campusSpecificNotes[type] || `For ${campusName}-specific information, please contact your local campus IT department.`;
    }
    
    simulateInitialLoad() {
        // Simulate loading policy documents
        this.setConnectionStatus('connecting', 'Loading policies...');
        
        setTimeout(() => {
            this.setConnectionStatus('connected', 'Ready');
            const policyCount = this.policyData ? '1 policy loaded' : 'Policy loading failed';
            this.policyCount.innerHTML = `<i class="fas fa-file-alt"></i> ${policyCount}`;
        }, 2000);
    }
    
    setConnectionStatus(status, text) {
        this.connectionIndicator.className = `fas fa-circle ${status}`;
        this.connectionText.textContent = text;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PolicyChatbot();
});

// Add some utility functions for future S3 integration
class S3PolicyManager {
    constructor() {
        this.bucketName = '';
        this.region = '';
        this.policies = new Map();
    }
    
    // Future method to connect to S3
    async connectToS3(bucketName, region) {
        this.bucketName = bucketName;
        this.region = region;
        // Implementation will go here when connecting to actual S3
    }
    
    // Future method to load policies from S3
    async loadPolicies() {
        // This will fetch and parse policy documents from S3
        // and organize them by category
    }
    
    // Future method to search policies
    async searchPolicies(query, category = 'all') {
        // This will implement semantic search across policy documents
        // using the query and optional category filter
    }
}

// Export for future use
window.S3PolicyManager = S3PolicyManager;
