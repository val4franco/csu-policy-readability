const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const S3Service = require('./services/s3Service');
const PolicyProcessor = require('./services/policyProcessor');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const s3Service = new S3Service();
const policyProcessor = new PolicyProcessor();

// Cache for processed policies
let processedPolicies = [];
let lastCacheUpdate = null;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, department, policyType } = req.body;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        // Ensure policies are loaded and processed
        await ensurePoliciesLoaded();
        
        // Filter policies based on department and type
        let filteredPolicies = processedPolicies;
        if (department) {
            filteredPolicies = filteredPolicies.filter(p => p.department.toLowerCase() === department.toLowerCase());
        }
        if (policyType) {
            filteredPolicies = filteredPolicies.filter(p => p.policyType === policyType);
        }
        
        // Get answer from policy processor
        const result = await policyProcessor.answerPolicyQuestion(
            message, 
            filteredPolicies, 
            { department, policyType }
        );
        
        // Add cross-references for relevant policies
        const policiesWithCrossRefs = await Promise.all(
            result.relevantPolicies.map(async policy => {
                const crossRefs = await policyProcessor.findCrossReferences(policy, processedPolicies);
                return {
                    ...policy,
                    relatedPolicies: crossRefs.slice(0, 3).map(ref => ({
                        title: ref.policy.title,
                        department: ref.policy.department
                    }))
                };
            })
        );
        
        res.json({
            response: result.answer,
            policies: policiesWithCrossRefs,
            confidence: result.confidence,
            totalPolicies: processedPolicies.length,
            filteredCount: filteredPolicies.length
        });
        
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ 
            error: 'I encountered an error processing your request. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get specific policy details
app.get('/api/policy/:id', async (req, res) => {
    try {
        const policyId = decodeURIComponent(req.params.id);
        const policy = processedPolicies.find(p => p.title === policyId || p.key === policyId);
        
        if (!policy) {
            return res.status(404).json({ error: 'Policy not found' });
        }
        
        // Get full content from S3 if not cached
        if (!policy.fullContent && policy.key) {
            const s3Data = await s3Service.getPolicyDocument(policy.key);
            policy.fullContent = s3Data.content;
        }
        
        res.json(policy);
        
    } catch (error) {
        console.error('Error getting policy:', error);
        res.status(500).json({ error: 'Error loading policy' });
    }
});

// Get policy summary
app.get('/api/policy/:id/summary', async (req, res) => {
    try {
        const policyId = decodeURIComponent(req.params.id);
        const policy = processedPolicies.find(p => p.title === policyId || p.key === policyId);
        
        if (!policy) {
            return res.status(404).json({ error: 'Policy not found' });
        }
        
        res.json({
            title: policy.title,
            summary: policy.summary,
            keyPoints: policy.keyPoints,
            relatedTopics: policy.relatedTopics
        });
        
    } catch (error) {
        console.error('Error getting policy summary:', error);
        res.status(500).json({ error: 'Error generating summary' });
    }
});

// Search policies endpoint
app.get('/api/search', async (req, res) => {
    try {
        const { q: query, department, policyType } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        await ensurePoliciesLoaded();
        
        const searchResults = await s3Service.searchPolicyDocuments(query, department, policyType);
        
        // Process search results through policy processor
        const processedResults = [];
        for (const result of searchResults.slice(0, 10)) { // Limit to top 10 results
            const processed = await policyProcessor.processPolicy(
                result.snippet, 
                result.title, 
                result.department
            );
            processedResults.push({
                ...processed,
                key: result.key,
                relevanceScore: result.relevanceScore,
                snippet: result.snippet
            });
        }
        
        res.json({
            results: processedResults,
            total: searchResults.length,
            query: query
        });
        
    } catch (error) {
        console.error('Error in search endpoint:', error);
        res.status(500).json({ error: 'Search error occurred' });
    }
});

// Admin endpoint to refresh policy cache
app.post('/api/admin/refresh-cache', async (req, res) => {
    try {
        await loadAndProcessPolicies(true);
        res.json({ 
            message: 'Cache refreshed successfully',
            policyCount: processedPolicies.length,
            lastUpdate: lastCacheUpdate
        });
    } catch (error) {
        console.error('Error refreshing cache:', error);
        res.status(500).json({ error: 'Failed to refresh cache' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        policyCount: processedPolicies.length,
        lastCacheUpdate: lastCacheUpdate,
        cacheStats: policyProcessor.getCacheStats()
    });
});

// Function to ensure policies are loaded - disabled for external API
async function ensurePoliciesLoaded() {
    // Skip - using external API
    return;
}

// Function to load and process all policies
async function loadAndProcessPolicies(forceRefresh = false) {
    try {
        console.log('Loading policies from S3...');
        
        if (forceRefresh) {
            policyProcessor.clearCache();
        }
        
        const policyDocuments = await s3Service.listPolicyDocuments();
        console.log(`Found ${policyDocuments.length} policy documents`);
        
        processedPolicies = [];
        
        // Process policies in batches to avoid overwhelming the API
        const batchSize = 5;
        for (let i = 0; i < policyDocuments.length; i += batchSize) {
            const batch = policyDocuments.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (doc) => {
                try {
                    const content = await s3Service.getPolicyDocument(doc.key);
                    const processed = await policyProcessor.processPolicy(
                        content.content, 
                        doc.title, 
                        doc.department
                    );
                    
                    return {
                        ...processed,
                        key: doc.key,
                        lastModified: doc.lastModified,
                        policyType: doc.policyType,
                        id: doc.key
                    };
                } catch (error) {
                    console.error(`Error processing policy ${doc.key}:`, error);
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            processedPolicies.push(...batchResults.filter(p => p !== null));
            
            // Small delay between batches to be respectful to APIs
            if (i + batchSize < policyDocuments.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        lastCacheUpdate = Date.now();
        console.log(`Successfully processed ${processedPolicies.length} policies`);
        
    } catch (error) {
        console.error('Error loading and processing policies:', error);
        throw error;
    }
}

// Skip S3 policy loading - using external API
console.log('Using external API - skipping S3 policy loading');

app.listen(PORT, '0.0.0.0', () => {
    console.log(`HR Policy Chatbot server running on port ${PORT}`);
    console.log(`Access the application at http://0.0.0.0:${PORT}`);
});