import axios from 'axios';

// Backend Service URLs (Localhost)
const DOC_PROCESSOR_URL = 'http://localhost:8081';
const RULE_EXTRACTOR_URL = 'http://localhost:8082';
const SCANNER_URL = 'http://localhost:8083';

// 1. Document Processor API
export const docApi = {
    // Upload a PDF
    upload: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post(`${DOC_PROCESSOR_URL}/process`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // List all documents
    list: async () => {
        const response = await axios.get(`${DOC_PROCESSOR_URL}/documents`);
        return response.data; // { documents: [...], count: N }
    },

    // Get document details
    get: async (id: string) => {
        const response = await axios.get(`${DOC_PROCESSOR_URL}/documents/${id}`);
        return response.data;
    },

    // Scan directory (for manual drops)
    scanDir: async () => {
        const response = await axios.post(`${DOC_PROCESSOR_URL}/scan`);
        return response.data;
    }
};

// 2. Rule Extractor API
export const ruleApi = {
    // Extract rules from a document
    extract: async (documentId: string) => {
        const response = await axios.post(`${RULE_EXTRACTOR_URL}/extract/${documentId}`);
        return response.data;
    },

    // List all rules (feature to be added to backend)
    // list: ...
};

// 3. Scanner API
export const scannerApi = {
    // Trigger manual scan
    scan: async () => {
        const response = await axios.post(`${SCANNER_URL}/scan`);
        return response.data;
    }
};
