const https = require('https');
const http = require('http');
const { URL } = require('url');

class DocumentParser {
    constructor() {
        this.supportedFormats = ['txt', 'json', 'html', 'md'];
    }
    
    async parseDocument(content, filename, contentType = null) {
        try {
            const format = this.detectFormat(filename, contentType);
            
            switch (format) {
                case 'json':
                    return this.parseJSON(content);
                case 'txt':
                case 'md':
                    return this.parseText(content);
                case 'html':
                    return this.parseHTML(content);
                case 'url':
                    return await this.parseWebsite(content);
                default:
                    return this.parseText(content); // Fallback to text
            }
        } catch (error) {
            console.error('Error parsing document:', error);
            return this.parseText(content); // Fallback to text parsing
        }
    }
    
    detectFormat(filename, contentType = null) {
        // Check if it's a URL
        if (this.isURL(filename)) {
            return 'url';
        }
        
        // Check file extension
        const extension = filename.split('.').pop().toLowerCase();
        if (this.supportedFormats.includes(extension)) {
            return extension;
        }
        
        // Check content type
        if (contentType) {
            if (contentType.includes('json')) return 'json';
            if (contentType.includes('html')) return 'html';
            if (contentType.includes('text')) return 'txt';
        }
        
        return 'txt'; // Default fallback
    }
    
    isURL(str) {
        try {
            new URL(str);
            return true;
        } catch {
            return false;
        }
    }
    
    parseJSON(content) {
        try {
            const data = typeof content === 'string' ? JSON.parse(content) : content;
            
            // Handle different JSON policy structures
            if (data.policy || data.policies) {
                return this.extractFromPolicyJSON(data);
            } else if (data.title && data.content) {
                return this.extractFromStructuredJSON(data);
            } else {
                return this.extractFromGenericJSON(data);
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return {
                title: 'Unknown Policy',
                content: JSON.stringify(content, null, 2),
                summary: 'JSON policy document',
                sections: []
            };
        }
    }
    
    extractFromPolicyJSON(data) {
        const policy = data.policy || data.policies[0] || data;
        
        return {
            title: policy.title || policy.name || 'Policy Document',
            content: this.extractContentFromJSON(policy),
            summary: policy.summary || policy.description || this.generateFallbackSummary(policy),
            sections: this.extractSections(policy),
            department: policy.department || 'General',
            effectiveDate: policy.effectiveDate || policy.lastUpdated,
            version: policy.version,
            keyPoints: policy.keyPoints || this.extractKeyPointsFromJSON(policy)
        };
    }
    
    extractFromStructuredJSON(data) {
        return {
            title: data.title,
            content: data.content,
            summary: data.summary || this.generateFallbackSummary(data),
            sections: data.sections || [],
            department: data.department || 'General',
            effectiveDate: data.effectiveDate,
            version: data.version,
            keyPoints: data.keyPoints || []
        };
    }
    
    extractFromGenericJSON(data) {
        const content = this.extractContentFromJSON(data);
        return {
            title: data.title || data.name || 'Policy Document',
            content: content,
            summary: this.generateFallbackSummary(data),
            sections: [],
            department: data.department || 'General',
            keyPoints: []
        };
    }
    
    extractContentFromJSON(obj, depth = 0) {
        if (depth > 3) return ''; // Prevent infinite recursion
        
        let content = '';
        
        for (const [key, value] of Object.entries(obj)) {
            if (key === 'content' || key === 'text' || key === 'body') {
                content += value + '\n\n';
            } else if (typeof value === 'string' && value.length > 50) {
                content += `${key}: ${value}\n\n`;
            } else if (typeof value === 'object' && value !== null) {
                const nestedContent = this.extractContentFromJSON(value, depth + 1);
                if (nestedContent) {
                    content += `${key}:\n${nestedContent}\n`;
                }
            }
        }
        
        return content;
    }
    
    extractSections(policy) {
        const sections = [];
        
        if (policy.sections) {
            return policy.sections;
        }
        
        // Extract sections from common JSON structures
        for (const [key, value] of Object.entries(policy)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                if (key !== 'metadata' && key !== 'info') {
                    sections.push({
                        title: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                        content: this.extractContentFromJSON(value)
                    });
                }
            }
        }
        
        return sections;
    }
    
    extractKeyPointsFromJSON(policy) {
        const keyPoints = [];
        
        // Look for common key point fields
        const keyPointFields = ['keyPoints', 'highlights', 'important', 'summary_points', 'bullets'];
        
        for (const field of keyPointFields) {
            if (policy[field] && Array.isArray(policy[field])) {
                return policy[field];
            }
        }
        
        // Extract from sections if available
        if (policy.sections) {
            policy.sections.forEach(section => {
                if (section.title.toLowerCase().includes('key') || 
                    section.title.toLowerCase().includes('important') ||
                    section.title.toLowerCase().includes('summary')) {
                    if (Array.isArray(section.content)) {
                        keyPoints.push(...section.content);
                    } else {
                        keyPoints.push(section.content);
                    }
                }
            });
        }
        
        return keyPoints;
    }
    
    parseText(content) {
        const lines = content.split('\n').filter(line => line.trim());
        let title = 'Policy Document';
        let sections = [];
        
        // Extract title (first non-empty line or line with specific markers)
        if (lines.length > 0) {
            title = lines[0].replace(/^#+\s*/, '').replace(/^\*+\s*/, '').trim();
        }
        
        // Parse sections based on headers
        let currentSection = null;
        let sectionContent = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            
            // Detect headers (lines starting with #, *, or all caps)
            if (this.isHeader(line)) {
                if (currentSection) {
                    sections.push({
                        title: currentSection,
                        content: sectionContent.join('\n')
                    });
                }
                currentSection = line.replace(/^#+\s*/, '').replace(/^\*+\s*/, '').trim();
                sectionContent = [];
            } else {
                sectionContent.push(line);
            }
        }
        
        // Add last section
        if (currentSection) {
            sections.push({
                title: currentSection,
                content: sectionContent.join('\n')
            });
        }
        
        return {
            title: title,
            content: content,
            summary: this.generateTextSummary(content),
            sections: sections,
            department: 'General',
            keyPoints: this.extractKeyPointsFromText(content)
        };
    }
    
    isHeader(line) {
        const trimmed = line.trim();
        return trimmed.startsWith('#') || 
               trimmed.startsWith('*') || 
               (trimmed === trimmed.toUpperCase() && trimmed.length > 0 && trimmed.length < 100);
    }
    
    parseHTML(content) {
        // Simple HTML parsing without external dependencies
        const text = content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
        
        // Extract title from HTML
        const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : 'Web Policy Document';
        
        return {
            title: title,
            content: text,
            summary: this.generateTextSummary(text),
            sections: [],
            department: 'General',
            keyPoints: this.extractKeyPointsFromText(text)
        };
    }
    
    async parseWebsite(url) {
        try {
            const content = await this.fetchWebContent(url);
            const parsed = this.parseHTML(content);
            
            return {
                ...parsed,
                title: parsed.title || this.extractTitleFromURL(url),
                sourceURL: url
            };
        } catch (error) {
            console.error('Error parsing website:', error);
            return {
                title: this.extractTitleFromURL(url),
                content: `Unable to fetch content from: ${url}`,
                summary: 'Website content unavailable',
                sections: [],
                department: 'General',
                keyPoints: [],
                sourceURL: url
            };
        }
    }
    
    fetchWebContent(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'HR-Policy-Bot/1.0'
                }
            };
            
            const req = client.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve(data);
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.setTimeout(10000, () => {
                req.abort();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }
    
    extractTitleFromURL(url) {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(part => part);
        const lastPart = pathParts[pathParts.length - 1] || urlObj.hostname;
        
        return lastPart
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    
    generateFallbackSummary(data) {
        if (typeof data === 'string') {
            return this.generateTextSummary(data);
        }
        
        if (data.summary || data.description) {
            return data.summary || data.description;
        }
        
        const content = this.extractContentFromJSON(data);
        return this.generateTextSummary(content);
    }
    
    generateTextSummary(text, maxLength = 200) {
        if (!text || text.length <= maxLength) return text;
        
        // Try to break at sentence boundary
        const sentences = text.split(/[.!?]+/);
        let summary = '';
        
        for (const sentence of sentences) {
            if ((summary + sentence).length <= maxLength) {
                summary += sentence + '.';
            } else {
                break;
            }
        }
        
        if (summary.length === 0) {
            summary = text.substring(0, maxLength) + '...';
        }
        
        return summary.trim();
    }
    
    extractKeyPointsFromText(text) {
        const keyPoints = [];
        const lines = text.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Look for bullet points, numbered lists, or key phrases
            if (trimmed.match(/^[-•*]\s/) || 
                trimmed.match(/^\d+\.\s/) ||
                trimmed.toLowerCase().includes('important:') ||
                trimmed.toLowerCase().includes('note:') ||
                trimmed.toLowerCase().includes('key:')) {
                
                const cleanPoint = trimmed
                    .replace(/^[-•*]\s*/, '')
                    .replace(/^\d+\.\s*/, '')
                    .replace(/^(important|note|key):\s*/i, '');
                
                if (cleanPoint.length > 10 && cleanPoint.length < 200) {
                    keyPoints.push(cleanPoint);
                }
            }
        }
        
        return keyPoints.slice(0, 10); // Limit to 10 key points
    }
}

module.exports = DocumentParser;