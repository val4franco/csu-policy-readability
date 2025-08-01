const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

class PolicyProcessor {
    constructor() {
        // Initialize AWS Bedrock client
        this.bedrockClient = new BedrockRuntimeClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
        
        this.modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';
        
        // In-memory cache for processed policies (in production, use Redis or database)
        this.policyCache = new Map();
        this.indexCache = new Map();
    }
    
    async invokeBedrockModel(prompt, maxTokens = 500) {
        try {
            const payload = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: maxTokens,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            };

            const command = new InvokeModelCommand({
                modelId: this.modelId,
                body: JSON.stringify(payload),
                contentType: 'application/json',
                accept: 'application/json'
            });

            const response = await this.bedrockClient.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            
            return responseBody.content[0].text;
        } catch (error) {
            console.error('Error invoking Bedrock model:', error);
            throw error;
        }
    }
    
    async processPolicy(policyContent, policyTitle, department) {
        try {
            const cacheKey = `${department}-${policyTitle}`;
            
            if (this.policyCache.has(cacheKey)) {
                return this.policyCache.get(cacheKey);
            }
            
            const processedPolicy = {
                title: policyTitle,
                department: department,
                content: policyContent,
                summary: await this.generateSummary(policyContent),
                keyPoints: await this.extractKeyPoints(policyContent),
                relatedTopics: await this.extractRelatedTopics(policyContent),
                lastProcessed: new Date().toISOString()
            };
            
            this.policyCache.set(cacheKey, processedPolicy);
            return processedPolicy;
            
        } catch (error) {
            console.error('Error processing policy:', error);
            throw error;
        }
    }
    
    async generateSummary(content, maxLength = 200) {
        try {
            const prompt = `You are an HR policy expert. Provide a clear, concise summary of this HR policy document that highlights the most important information for employees. Keep it under ${maxLength} words.

Policy Document:
${content}

Summary:`;

            const response = await this.invokeBedrockModel(prompt, 300);
            return response.trim();
            
        } catch (error) {
            console.error('Error generating AI summary:', error);
            return this.generateFallbackSummary(content, maxLength);
        }
    }
    
    generateFallbackSummary(content, maxLength = 200) {
        if (!content || content.length <= maxLength) return content;
        
        // Extract first paragraph or sentence that contains policy info
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
        let summary = '';
        
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if ((summary + trimmed).length <= maxLength * 4) {
                summary += trimmed + '. ';
            } else {
                break;
            }
        }
        
        if (summary.length === 0) {
            // Fallback to first N characters at word boundary
            const truncated = content.substring(0, maxLength * 4);
            const wordBoundary = truncated.lastIndexOf(' ');
            summary = (wordBoundary > 0 ? truncated.substring(0, wordBoundary) : truncated) + '...';
        }
        
        return summary.trim();
    }
    
    async extractKeyPoints(content) {
        try {
            const prompt = `Extract the most important key points from this HR policy document. Return them as a JSON array of strings (5-7 key points maximum).

Policy Document:
${content}

Key Points (JSON format):`;

            const response = await this.invokeBedrockModel(prompt, 400);
            
            try {
                // Try to parse as JSON first
                const parsed = JSON.parse(response.trim());
                if (Array.isArray(parsed)) {
                    return parsed.slice(0, 7);
                }
            } catch {
                // Fallback parsing if JSON is malformed
                const lines = response.split('\n').filter(line => line.trim());
                const keyPoints = lines.map(line => 
                    line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim()
                ).filter(point => point.length > 10);
                return keyPoints.slice(0, 7);
            }
            
            return this.extractFallbackKeyPoints(content);
            
        } catch (error) {
            console.error('Error extracting AI key points:', error);
            return this.extractFallbackKeyPoints(content);
        }
    }
    
    extractFallbackKeyPoints(content) {
        const keyPoints = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Look for bullet points, numbered lists, or key phrases
            if (trimmed.match(/^[-•*]\s/) || 
                trimmed.match(/^\d+\.\s/) ||
                trimmed.toLowerCase().includes('important:') ||
                trimmed.toLowerCase().includes('note:') ||
                trimmed.toLowerCase().includes('key:') ||
                trimmed.toLowerCase().includes('must:') ||
                trimmed.toLowerCase().includes('required:') ||
                trimmed.toLowerCase().includes('policy:')) {
                
                let cleanPoint = trimmed
                    .replace(/^[-•*]\s*/, '')
                    .replace(/^\d+\.\s*/, '')
                    .replace(/^(important|note|key|must|required|policy):\s*/i, '');
                
                if (cleanPoint.length > 15 && cleanPoint.length < 200) {
                    keyPoints.push(cleanPoint);
                }
            }
        }
        
        // If no bullet points found, extract sentences with policy keywords
        if (keyPoints.length === 0) {
            const sentences = content.split(/[.!?]+/);
            const policyKeywords = ['must', 'shall', 'required', 'policy', 'procedure', 'guideline', 'important', 'mandatory'];
            
            for (const sentence of sentences) {
                const trimmed = sentence.trim();
                if (trimmed.length > 20 && trimmed.length < 200) {
                    const lowerSentence = trimmed.toLowerCase();
                    if (policyKeywords.some(keyword => lowerSentence.includes(keyword))) {
                        keyPoints.push(trimmed);
                        if (keyPoints.length >= 7) break;
                    }
                }
            }
        }
        
        return keyPoints.slice(0, 7); // Limit to 7 key points
    }
    
    async extractRelatedTopics(content) {
        try {
            const prompt = `Identify related HR topics and policies that might be connected to this policy document. Return them as a JSON array of topic names (5-8 topics maximum).

Policy Document:
${content.substring(0, 1000)}

Related Topics (JSON format):`;

            const response = await this.invokeBedrockModel(prompt, 250);
            
            try {
                const parsed = JSON.parse(response.trim());
                if (Array.isArray(parsed)) {
                    return parsed.slice(0, 8);
                }
            } catch {
                const lines = response.split('\n').filter(line => line.trim());
                return lines.map(line => 
                    line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim()
                ).filter(topic => topic.length > 3).slice(0, 8);
            }
            
            return [];
            
        } catch (error) {
            console.error('Error extracting related topics:', error);
            return [];
        }
    }
    
    async answerPolicyQuestion(question, policies, context = {}) {
        try {
            const relevantPolicies = this.findRelevantPolicies(question, policies);
            const policyContext = relevantPolicies.slice(0, 3).map(policy => 
                `Policy: ${policy.title}\nDepartment: ${policy.department}\nSummary: ${policy.summary}\nKey Points: ${policy.keyPoints.join(', ')}`
            ).join('\n\n');
            
            const contextInfo = [];
            if (context.department) contextInfo.push(`The user is asking from the ${context.department} department perspective.`);
            if (context.policyType) contextInfo.push(`Focus on ${context.policyType} related policies.`);
            
            const prompt = `You are an HR policy assistant. Answer questions about company policies based on the provided policy information. Be helpful, accurate, and cite specific policies when relevant. If you cannot find the answer in the provided policies, say so clearly.

${contextInfo.join(' ')}

Question: ${question}

Relevant Policies:
${policyContext}

Answer:`;

            const response = await this.invokeBedrockModel(prompt, 600);
            
            return {
                answer: response.trim(),
                relevantPolicies: relevantPolicies.slice(0, 3),
                confidence: this.calculateConfidence(question, relevantPolicies)
            };
            
        } catch (error) {
            console.error('Error answering policy question:', error);
            return {
                answer: "I'm sorry, I encountered an error while processing your question. Please try again or rephrase your question.",
                relevantPolicies: [],
                confidence: 0
            };
        }
    }
    
    findRelevantPolicies(question, policies) {
        const questionLower = question.toLowerCase();
        const questionWords = questionLower.split(/\s+/).filter(word => word.length > 2);
        
        return policies.map(policy => {
            let score = 0;
            const policyText = `${policy.title} ${policy.summary} ${policy.keyPoints.join(' ')}`.toLowerCase();
            
            // Score based on word matches
            questionWords.forEach(word => {
                if (policyText.includes(word)) {
                    score += 1;
                }
            });
            
            // Bonus for title matches
            if (policy.title.toLowerCase().includes(questionLower.substring(0, 20))) {
                score += 5;
            }
            
            // Bonus for related topics
            policy.relatedTopics.forEach(topic => {
                if (questionLower.includes(topic.toLowerCase())) {
                    score += 2;
                }
            });
            
            return { ...policy, relevanceScore: score };
        }).filter(policy => policy.relevanceScore > 0)
          .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    
    calculateConfidence(question, relevantPolicies) {
        if (relevantPolicies.length === 0) return 0;
        
        const maxScore = relevantPolicies[0].relevanceScore;
        const avgScore = relevantPolicies.reduce((sum, policy) => sum + policy.relevanceScore, 0) / relevantPolicies.length;
        
        // Normalize confidence between 0 and 1
        return Math.min(1, (maxScore + avgScore) / 20);
    }
    
    async findCrossReferences(policy, allPolicies) {
        try {
            const crossRefs = [];
            
            // Find policies with overlapping topics
            for (const otherPolicy of allPolicies) {
                if (otherPolicy.title === policy.title) continue;
                
                const commonTopics = policy.relatedTopics.filter(topic => 
                    otherPolicy.relatedTopics.some(otherTopic => 
                        otherTopic.toLowerCase().includes(topic.toLowerCase()) || 
                        topic.toLowerCase().includes(otherTopic.toLowerCase())
                    )
                );
                
                if (commonTopics.length > 0) {
                    crossRefs.push({
                        policy: otherPolicy,
                        commonTopics: commonTopics,
                        relevanceScore: commonTopics.length
                    });
                }
            }
            
            return crossRefs.sort((a, b) => b.relevanceScore - a.relevanceScore);
            
        } catch (error) {
            console.error('Error finding cross-references:', error);
            return [];
        }
    }
    
    clearCache() {
        this.policyCache.clear();
        this.indexCache.clear();
    }
    
    getCacheStats() {
        return {
            policyCacheSize: this.policyCache.size,
            indexCacheSize: this.indexCache.size
        };
    }
}

module.exports = PolicyProcessor;
