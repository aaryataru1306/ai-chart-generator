
const axios = require('axios');
// Load environment variables - simplified approach
require('dotenv').config();

class GroqService {
  constructor() {
    this.baseURL = 'https://api.groq.com/openai/v1';
    
    // Debug environment loading
    console.log('Current working directory:', process.cwd());
    console.log('GROQ_API_KEY loaded:', process.env.GROQ_API_KEY ? 'YES' : 'NO');
    if (process.env.GROQ_API_KEY) {
      console.log('API Key starts with:', process.env.GROQ_API_KEY.substring(0, 10) + '...');
    }
    
    this.apiKey = process.env.GROQ_API_KEY;
    this.model = 'openai/gpt-oss-120b'; // Fast model with good performance
    // Alternative models: 'llama2-70b-4096', 'gemma-7b-it', 'llama3-8b-8192', 'llama3-70b-8192'
  }

  async generateChart(prompt, type = 'flowchart') {
    try {
      console.log(`🤖 Generating ${type} with Groq (${this.model})...`);
      
      if (!this.apiKey) {
        console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('GROQ')));
        console.log('GROQ_API_KEY value:', process.env.GROQ_API_KEY ? '[SET]' : '[NOT SET]');
        throw new Error('GROQ_API_KEY environment variable is required');
      }

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
       
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        content: response.data.choices[0].message.content,
        model: this.model,
        usage: response.data.usage
      };
    } catch (error) {
      console.error('❌ Groq error:', error.response?.data?.error?.message || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        fallback: this.getFallbackChart(type)
      };
    }
  }

  async testConnection() {
    try {
      if (!this.apiKey) {
        throw new Error('GROQ_API_KEY environment variable is required');
      }

      const response = await axios.get(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Groq connected successfully');
      return { 
        connected: true, 
        models: response.data.data.map(model => model.id),
        currentModel: this.model
      };
    } catch (error) {
      console.error('❌ Cannot connect to Groq:', error.response?.data?.error?.message || error.message);
      return { 
        connected: false, 
        error: error.response?.data?.error?.message || error.message 
      };
    }
  }

  // Method to change model if needed
  setModel(modelName) {
    const availableModels = [
      'llama-3.3-70b-versatile',
      'openai/gpt-oss-20b', 
      'openai/gpt-oss-120b',
      'llama3-8b-8192',
      'llama3-70b-8192'
    ];
    
    if (availableModels.includes(modelName)) {
      this.model = modelName;
      console.log(`📝 Model changed to: ${modelName}`);
    } else {
      console.warn(`⚠️ Model ${modelName} not available. Using default: ${this.model}`);
    }
  }

  getFallbackChart(type) {
    const fallbacks = {
      flowchart: `graph TD
        A[Start] --> B{Is code valid?}
        B -->|Yes| C[Process code]
        B -->|No| D[Show error]
        C --> E[Generate chart]
        E --> F[End]
        D --> F`,
      mindmap: {
        name: "Code Structure",
        children: [
          { name: "Functions", children: [{ name: "main()" }, { name: "helper()" }] },
          { name: "Variables", children: [{ name: "input" }, { name: "output" }] },
          { name: "Logic", children: [{ name: "conditions" }, { name: "loops" }] }
        ]
      }
    };
    return fallbacks[type] || fallbacks.flowchart;
  }
}

module.exports = new GroqService();