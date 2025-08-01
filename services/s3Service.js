const AWS = require('aws-sdk');

class S3Service {
    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
        });
        
        this.bucketName = process.env.S3_BUCKET_NAME;
    }
    
    async listPolicyDocuments(department = null, policyType = null) {
        try {
            let prefix = 'policies/';
            if (department) {
                prefix += `${department}/`;
            }
            
            const params = {
                Bucket: this.bucketName,
                Prefix: prefix
            };
            
            const data = await this.s3.listObjectsV2(params).promise();
            
            let objects = data.Contents || [];
            
            // Filter by policy type if specified
            if (policyType) {
                objects = objects.filter(obj => obj.Key.includes(policyType));
            }
            
            return objects.map(obj => ({
                key: obj.Key,
                lastModified: obj.LastModified,
                size: obj.Size,
                title: this.extractTitleFromKey(obj.Key),
                department: this.extractDepartmentFromKey(obj.Key),
                policyType: this.extractPolicyTypeFromKey(obj.Key)
            }));
            
        } catch (error) {
            console.error('Error listing policy documents:', error);
            throw error;
        }
    }
    
    async getPolicyDocument(key) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: key
            };
            
            const data = await this.s3.getObject(params).promise();
            
            return {
                content: data.Body.toString('utf-8'),
                contentType: data.ContentType,
                lastModified: data.LastModified,
                metadata: data.Metadata
            };
            
        } catch (error) {
            console.error('Error getting policy document:', error);
            throw error;
        }
    }
    
    async searchPolicyDocuments(searchTerm, department = null, policyType = null) {
        try {
            const documents = await this.listPolicyDocuments(department, policyType);
            const searchResults = [];
            
            for (const doc of documents) {
                const content = await this.getPolicyDocument(doc.key);
                
                // Simple text search - in production, you'd want to use a more sophisticated search
                if (this.matchesSearchTerm(content.content, doc.title, searchTerm)) {
                    searchResults.push({
                        ...doc,
                        relevanceScore: this.calculateRelevance(content.content, searchTerm),
                        snippet: this.extractSnippet(content.content, searchTerm)
                    });
                }
            }
            
            // Sort by relevance score
            return searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
            
        } catch (error) {
            console.error('Error searching policy documents:', error);
            throw error;
        }
    }
    
    async uploadPolicyDocument(key, content, metadata = {}) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: key,
                Body: content,
                ContentType: 'text/plain',
                Metadata: metadata
            };
            
            const data = await this.s3.upload(params).promise();
            return data;
            
        } catch (error) {
            console.error('Error uploading policy document:', error);
            throw error;
        }
    }
    
    extractTitleFromKey(key) {
        const parts = key.split('/');
        const filename = parts[parts.length - 1];
        return filename.replace(/\.[^/.]+$/, "").replace(/-/g, ' ').replace(/_/g, ' ');
    }
    
    extractDepartmentFromKey(key) {
        const parts = key.split('/');
        return parts.length > 1 ? parts[1] : 'General';
    }
    
    extractPolicyTypeFromKey(key) {
        const filename = key.split('/').pop();
        if (filename.includes('handbook')) return 'employee-handbook';
        if (filename.includes('benefits')) return 'benefits';
        if (filename.includes('conduct')) return 'code-of-conduct';
        if (filename.includes('security')) return 'security';
        if (filename.includes('compliance')) return 'compliance';
        return 'general';
    }
    
    matchesSearchTerm(content, title, searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const contentLower = content.toLowerCase();
        const titleLower = title.toLowerCase();
        
        return titleLower.includes(searchLower) || contentLower.includes(searchLower);
    }
    
    calculateRelevance(content, searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const contentLower = content.toLowerCase();
        
        // Simple relevance calculation based on term frequency
        const matches = (contentLower.match(new RegExp(searchLower, 'g')) || []).length;
        const contentLength = content.length;
        
        return (matches / contentLength) * 1000; // Normalize the score
    }
    
    extractSnippet(content, searchTerm, snippetLength = 200) {
        const searchLower = searchTerm.toLowerCase();
        const contentLower = content.toLowerCase();
        const index = contentLower.indexOf(searchLower);
        
        if (index === -1) {
            return content.substring(0, snippetLength) + '...';
        }
        
        const start = Math.max(0, index - snippetLength / 2);
        const end = Math.min(content.length, start + snippetLength);
        
        let snippet = content.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < content.length) snippet = snippet + '...';
        
        return snippet;
    }
}

module.exports = S3Service;