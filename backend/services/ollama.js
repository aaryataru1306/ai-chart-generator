const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseURL = 'http://localhost:11434';
    this.model = 'mistral:latest'; // Using your existing model
  }

  async generateChart(prompt, type = 'flowchart') {
    try {
      console.log(`🤖 Generating ${type} with Mistral...`);
      
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more consistent output
          top_p: 0.9
        }
      });

      return {
        success: true,
        content: response.data.response,
        model: this.model
      };
    } catch (error) {
      console.error('❌ Ollama error:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackChart(type)
      };
    }
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      console.log('✅ Ollama connected successfully');
      return { connected: true, models: response.data.models };
    } catch (error) {
      console.error('❌ Cannot connect to Ollama:', error.message);
      return { connected: false, error: error.message };
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

module.exports = new OllamaService();