const express = require('express');
const router = express.Router();
const ollamaService = require('../services/ollama');
const {
  // Original prompts
  flowchartPrompt,
  mindmapPrompt,
  textMindmapPrompt,
  diagramPrompt,

  // Enhanced universal prompts
  smartChartPrompt,
  detectInputType,
  universalFlowchartPrompt,
  universalMindmapPrompt,
  universalTimelinePrompt,

  // NEW: Specific chart type prompts
  ganttPrompt,
  piePrompt,
  quadrantPrompt,
  journeyPrompt,
  gitPrompt,
  statePrompt,
  classPrompt
} = require('../prompts');

// Generate flowchart from code (EXISTING - KEEP AS IS)
router.post('/flowchart', async (req, res) => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    console.log(`📊 Generating flowchart for ${language} code...`);

    const prompt = flowchartPrompt(code, language);
    const result = await ollamaService.generateChart(prompt, 'flowchart');

    if (result.success) {
      const mermaidCode = extractMermaidCode(result.content);
      res.json({
        success: true,
        chartType: 'flowchart',
        mermaidCode,
        rawResponse: result.content
      });
    } else {
      res.json({
        success: false,
        error: result.error,
        fallback: result.fallback
      });
    }
  } catch (error) {
    console.error('❌ Flowchart generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ENHANCED: Generate mindmap from code OR text prompt with better debugging
router.post('/mindmap', async (req, res) => {
  try {
    const { code, language = 'javascript', prompt, inputType = 'code' } = req.body;

    if (!code && !prompt) {
      return res.status(400).json({ error: 'Code or text prompt is required' });
    }

    console.log(`🧠 Generating mindmap for ${inputType}...`);
    console.log('Input data:', {
      hasCode: !!code,
      hasPrompt: !!prompt,
      inputType,
      codeLength: code ? code.length : 0,
      promptLength: prompt ? prompt.length : 0
    });

    const aiPrompt = inputType === 'text'
      ? textMindmapPrompt(prompt)
      : mindmapPrompt(code, language);

    console.log('Generated AI prompt:', aiPrompt.substring(0, 200) + '...');

    const result = await ollamaService.generateChart(aiPrompt, 'mindmap');

    console.log('Ollama service result:', {
      success: result.success,
      hasContent: !!result.content,
      contentLength: result.content ? result.content.length : 0,
      contentPreview: result.content ? result.content.substring(0, 200) + '...' : null
    });

    if (result.success) {
      const mermaidCode = extractMindmapCode(result.content);

      // Additional validation
      if (!mermaidCode || mermaidCode.length < 10) {
        console.log('⚠️ Generated mindmap code is too short, using enhanced fallback');
        const fallbackCode = createEnhancedMindmapFallback(code || prompt, inputType);
        res.json({
          success: true,
          chartType: 'mindmap',
          inputType,
          mermaidCode: fallbackCode,
          rawResponse: result.content,
          fallback: true,
          warning: 'Used fallback due to insufficient generated content'
        });
      } else {
        res.json({
          success: true,
          chartType: 'mindmap',
          inputType,
          mermaidCode,
          rawResponse: result.content,
          fallback: false
        });
      }
    } else {
      console.log('❌ Ollama service failed, creating fallback');
      const fallbackCode = createEnhancedMindmapFallback(code || prompt, inputType);
      res.json({
        success: true,
        chartType: 'mindmap',
        inputType,
        mermaidCode: fallbackCode,
        error: result.error,
        fallback: true
      });
    }
  } catch (error) {
    console.error('❌ Mindmap generation error:', error);

    // Create enhanced fallback on error
    const input = req.body.code || req.body.prompt || 'Error occurred';
    const fallbackCode = createEnhancedMindmapFallback(input, req.body.inputType || 'unknown');

    res.json({
      success: true,
      chartType: 'mindmap',
      inputType: req.body.inputType || 'unknown',
      mermaidCode: fallbackCode,
      error: error.message,
      fallback: true
    });
  }
});

// MODIFIED: Universal chart generation endpoint with auto-detection REMOVED.
router.post('/universal', async (req, res) => {
  try {
    // Auto-detection is removed. The user MUST specify the chart type.
    const { input, chartType } = req.body;

    if (!input || input.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Input text is required'
      });
    }
    
    // The chartType is now mandatory.
    if (!chartType) {
      return res.status(400).json({
        success: false,
        error: 'A specific chartType is required for generation.'
      });
    }

    console.log('🌟 Universal chart request (manual type):', {
      input: input.substring(0, 100) + '...',
      requestedType: chartType
    });

    const selectedChartType = chartType;

    // Generate appropriate prompt using smart selector
    const prompt = smartChartPrompt(input, selectedChartType);

    // Generate chart using existing Ollama service
    const result = await ollamaService.generateChart(prompt, selectedChartType);

    if (result.success) {
      // Extract Mermaid code based on chart type
      let mermaidCode;
      switch (selectedChartType) {
        case 'gantt':
        case 'project':
          mermaidCode = extractGanttCode(result.content);
          break;
        case 'pie':
        case 'statistics':
        case 'distribution':
          mermaidCode = extractPieCode(result.content);
          break;
        case 'quadrant':
        case 'matrix':
        case 'analysis':
          mermaidCode = extractQuadrantCode(result.content);
          break;
        case 'journey':
        case 'user-journey':
        case 'customer-journey':
          mermaidCode = extractJourneyCode(result.content);
          break;
        case 'git':
        case 'gitgraph':
        case 'version-control':
          mermaidCode = extractGitCode(result.content);
          break;
        case 'state':
        case 'state-diagram':
        case 'status':
          mermaidCode = extractStateCode(result.content);
          break;
        case 'class':
        case 'class-diagram':
        case 'entity':
          mermaidCode = extractClassCode(result.content);
          break;
        case 'flowchart':
        case 'process':
          mermaidCode = extractMermaidCode(result.content);
          break;
        case 'mindmap':
        case 'topic':
        case 'structure':
          mermaidCode = extractMindmapCode(result.content);
          // Additional validation for mindmaps
          if (!mermaidCode || mermaidCode.length < 10) {
            mermaidCode = createEnhancedMindmapFallback(input, 'text');
          }
          break;
        case 'timeline':
          mermaidCode = extractMermaidCode(result.content); // Timeline uses flowchart format
          break;
        default:
          // Fallback to a mindmap if an unknown chart type is provided
          mermaidCode = extractMindmapCode(result.content);
          if (!mermaidCode || mermaidCode.length < 10) {
            mermaidCode = createEnhancedMindmapFallback(input, 'text');
          }
      }

      console.log('✅ Universal chart generated successfully:', selectedChartType);

      res.json({
        success: true,
        chartType: selectedChartType,
        mermaidCode,
        rawResponse: result.content,
        fallback: false
      });
    } else {
      // Use existing fallback from Ollama service
      res.json({
        success: false,
        error: result.error,
        fallback: result.fallback,
        chartType: selectedChartType
      });
    }

  } catch (error) {
    console.error('❌ Universal chart generation error:', error);

    // Create emergency fallback
    const fallbackChart = createUniversalFallback(
      req.body.input || 'Error occurred',
      req.body.chartType || 'mindmap'
    );

    res.json({
      success: true,
      mermaidCode: fallbackChart,
      chartType: req.body.chartType || 'mindmap',
      fallback: true,
      error: error.message
    });
  }
});

// ENHANCED: Chart type suggestion endpoint with ALL chart types
router.post('/suggest-type', async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || input.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Input text is required'
      });
    }

    const detectedType = detectInputType(input);
    const suggestions = getChartTypeSuggestions(input, detectedType);

    res.json({
      success: true,
      detectedType,
      suggestions
    });

  } catch (error) {
    console.error('❌ Chart type suggestion error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// NEW: Specific chart type endpoints for direct access
router.post('/gantt', async (req, res) => {
  await generateSpecificChart(req, res, 'gantt', ganttPrompt, extractGanttCode);
});

router.post('/pie', async (req, res) => {
  await generateSpecificChart(req, res, 'pie', piePrompt, extractPieCode);
});

router.post('/quadrant', async (req, res) => {
  await generateSpecificChart(req, res, 'quadrant', quadrantPrompt, extractQuadrantCode);
});

router.post('/journey', async (req, res) => {
  await generateSpecificChart(req, res, 'journey', journeyPrompt, extractJourneyCode);
});

router.post('/git', async (req, res) => {
  await generateSpecificChart(req, res, 'git', gitPrompt, extractGitCode);
});

router.post('/state', async (req, res) => {
  await generateSpecificChart(req, res, 'state', statePrompt, extractStateCode);
});

router.post('/class', async (req, res) => {
  await generateSpecificChart(req, res, 'class', classPrompt, extractClassCode);
});

// Test Ollama connection (EXISTING - KEEP AS IS)
router.get('/test', async (req, res) => {
  const result = await ollamaService.testConnection();
  res.json(result);
});

// HELPER FUNCTIONS

/**
 * **CRITICAL FIX v2: Aggressive Sanitization**
 * Replaces a wide range of non-standard Unicode characters and symbols with their
 * basic ASCII equivalents to ensure Mermaid.js compatibility.
 */
function sanitizeAIOutput(text) {
  if (!text || typeof text !== 'string') return text;

  // Normalize to a standard Unicode form
  let sanitized = text.normalize('NFD');

  // Replace common problematic characters
  sanitized = sanitized
    .replace(/[\u2010-\u2015]/g, '-')   // Hyphens and dashes
    .replace(/[\u2018\u2019]/g, "'")    // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"')    // Smart double quotes
    .replace(/[“”]/g, '"')              // Alternative smart quotes
    .replace(/[‘’]/g, "'")              // Alternative smart quotes
    .replace(/\u00A0/g, ' ')            // Non-breaking spaces
    .replace(/\u202F/g, ' ');           // Narrow non-breaking spaces
    
  // Remove any remaining characters that are not basic ASCII
  // Allows letters, numbers, and essential Mermaid syntax characters.
  sanitized = sanitized.replace(/[^\x00-\x7F]/g, '');

  return sanitized;
}

// Generic function for specific chart generation
async function generateSpecificChart(req, res, chartType, promptFunction, extractFunction) {
  try {
    const { input } = req.body;

    if (!input || input.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Input text is required'
      });
    }

    console.log(`🎯 Generating ${chartType} chart...`);

    const prompt = promptFunction(input);
    const result = await ollamaService.generateChart(prompt, chartType);

    if (result.success) {
      const mermaidCode = extractFunction(result.content);
      res.json({
        success: true,
        chartType,
        mermaidCode,
        rawResponse: result.content
      });
    } else {
      res.json({
        success: false,
        error: result.error,
        fallback: createUniversalFallback(input, chartType)
      });
    }
  } catch (error) {
    console.error(`❌ ${chartType} generation error:`, error);
    res.status(500).json({
      error: 'Internal server error',
      fallback: createUniversalFallback(req.body.input || 'Error', chartType)
    });
  }
}

// EXISTING Helper functions (MODIFIED TO USE SANITIZER)
function extractMermaidCode(response) {
  const sanitizedResponse = sanitizeAIOutput(response);
  console.log('Raw AI response:', sanitizedResponse);

  // Extract content between ```mermaid and ``` or find flowchart directly
  let mermaidCode = '';

  const mermaidMatch = sanitizedResponse.match(/```mermaid\s*([\s\S]*?)\s*```/);
  if (mermaidMatch) {
    mermaidCode = mermaidMatch[1];
  } else {
    const flowchartMatch = sanitizedResponse.match(/flowchart\s+TD[\s\S]*/i);
    if (flowchartMatch) {
      mermaidCode = flowchartMatch[0];
    }
  }

  if (mermaidCode) {
    // Use robust parsing to completely reconstruct the flowchart
    let cleanedCode = reconstructMermaidFlowchart(mermaidCode);
    console.log('Reconstructed Mermaid code:', cleanedCode);
    return cleanedCode;
  }

  // Fallback with proper formatting
  return `flowchart TD
    A([Start])
    A --> B[Process]
    B --> C{Decision?}
    C -->|Yes| D[Action]
    C -->|No| E([End])
    D --> E`;
}

function reconstructMermaidFlowchart(rawCode) {
  // Extract all nodes and connections using regex patterns
  let nodes = new Map();
  let connections = [];

  // Find node definitions: A([Start]), B[Process], C{Decision?}, etc.
  const nodeRegex = /([A-Z]\d*)\s*(\([^)]*\)|\[[^\]]*\]|\{[^}]*\})/g;
  let match;

  while ((match = nodeRegex.exec(rawCode)) !== null) {
    const nodeId = match[1];
    const nodeContent = match[2];
    nodes.set(nodeId, nodeContent);
  }

  // If no nodes found, extract from connection patterns
  if (nodes.size === 0) {
    // Look for patterns like "A([Start]) --> B[Process]"
    const connectionRegex = /([A-Z]\d*)\s*(\([^)]*\)|\[[^\]]*\]|\{[^}]*\})\s*-->\s*(?:\|[^|]*\|\s*)?([A-Z]\d*)\s*(\([^)]*\)|\[[^\]]*\]|\{[^}]*\})?/g;

    while ((match = connectionRegex.exec(rawCode)) !== null) {
      const fromId = match[1];
      const fromContent = match[2];
      const toId = match[3];
      const toContent = match[4];

      nodes.set(fromId, fromContent);
      if (toContent) {
        nodes.set(toId, toContent);
      }
    }
  }

  // Find connections: A --> B, C -->|Yes| D, etc.
  const connectionRegex = /([A-Z]\d*)\s*-->\s*(?:\|([^|]*)\|\s*)?([A-Z]\d*)/g;

  while ((match = connectionRegex.exec(rawCode)) !== null) {
    const from = match[1];
    const label = match[2];
    const to = match[3];

    connections.push({
      from,
      to,
      label: label || null
    });
  }

  // If we still don't have enough info, create a simple structure
  if (nodes.size === 0 || connections.length === 0) {
    return `flowchart TD
    A([Start])
    A --> B[Process]
    B --> C{Decision?}
    C -->|Yes| D[Action]
    C -->|No| E([End])
    D --> E`;
  }

  // Reconstruct the flowchart
  let result = ['flowchart TD'];

  // Add node definitions (optional but helps with clarity)
  for (let [nodeId, nodeContent] of nodes) {
    result.push(`    ${nodeId}${nodeContent}`);
  }

  // Add connections
  for (let conn of connections) {
    if (conn.label) {
      result.push(`    ${conn.from} -->|${conn.label}| ${conn.to}`);
    } else {
      result.push(`    ${conn.from} --> ${conn.to}`);
    }
  }

  return result.join('\n');
}

// ENHANCED: Improved mindmap extraction with extensive debugging
function extractMindmapCode(response) {
  const sanitizedResponse = sanitizeAIOutput(response);
  console.log('=== MINDMAP EXTRACTION DEBUG START ===');
  console.log('Raw response preview:', sanitizedResponse ? sanitizedResponse.substring(0, 300) + '...' : 'no content');

  if (!sanitizedResponse || typeof sanitizedResponse !== 'string' || sanitizedResponse.trim() === '') {
    console.log('❌ Invalid response, using fallback');
    console.log('=== MINDMAP EXTRACTION DEBUG END ===');
    return createBasicMindmapFallback();
  }

  let mermaidCode = '';

  // Strategy 1: Extract content between ```mermaid and ```
  const mermaidMatch = sanitizedResponse.match(/```mermaid\s*([\s\S]*?)\s*```/i);
  if (mermaidMatch && mermaidMatch[1]) {
    mermaidCode = mermaidMatch[1].trim();
  } else {
    // Strategy 2: Look for mindmap keyword directly
    const mindmapMatch = sanitizedResponse.match(/mindmap\s*\n[\s\S]*?(?=```|$)/i);
    if (mindmapMatch && mindmapMatch[0]) {
      mermaidCode = mindmapMatch[0].trim();
    }
  }

  if (mermaidCode && mermaidCode.trim() !== '') {
    // Clean and validate the mindmap code
    const cleanedCode = cleanMindmapCode(mermaidCode);
    console.log('✅ Final cleaned mindmap code:', cleanedCode.substring(0, 200));
    console.log('=== MINDMAP EXTRACTION DEBUG END ===');
    return cleanedCode;
  }

  console.log('❌ No valid mindmap found, using fallback');
  console.log('=== MINDMAP EXTRACTION DEBUG END ===');

  return createBasicMindmapFallback();
}

function cleanMindmapCode(code) {
  if (!code || typeof code !== 'string') {
    return createBasicMindmapFallback();
  }

  // Remove extra whitespace and normalize line endings
  let cleaned = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into lines and process
  let lines = cleaned.split('\n').map(line => line.trim()).filter(line => line !== '');

  if (lines.length === 0) {
    return createBasicMindmapFallback();
  }

  // Ensure it starts with 'mindmap'
  if (!lines[0].toLowerCase().includes('mindmap')) {
    lines.unshift('mindmap');
  }

  return lines.join('\n');
}

// MODIFIED: Greatly expanded basic fallback mindmap
function createBasicMindmapFallback() {
  return `mindmap
  root((Central Topic))
    Main Branch A
      Sub-topic A.1
        Detail A.1.1
        Detail A.1.2
      Sub-topic A.2
    Main Branch B
      Sub-topic B.1
      Sub-topic B.2
        Detail B.2.1
    Main Branch C
      Sub-topic C.1`;
}

// MODIFIED: Greatly expanded enhanced fallback mindmaps
function createEnhancedMindmapFallback(input, inputType) {
  const shortInput = input && input.length > 40 ? input.substring(0, 37) + '...' : (input || 'Content');
  const cleanInput = shortInput.replace(/[(){}[\]]/g, '').trim();

  if (inputType === 'code') {
    return `mindmap
  root((${cleanInput}))
    Code Structure
      Entry Point
        (main function)
      Core Modules
        Module A
        Module B
      Helper Utilities
        (utility functions)
    Key Logic
      Primary Algorithm
      Business Rules
      State Management
        (variables & state)
    Data Flow
      Input Sources
      Data Processing
      Output / Results
    Dependencies
      External Libraries
      Internal Components`;
  } else {
    return `mindmap
  root((${cleanInput}))
    Core Idea
      Main Thesis
      Key Concepts
        Concept X
        Concept Y
    Supporting Points
      Argument 1
        Evidence 1a
        Evidence 1b
      Argument 2
        Evidence 2a
    Potential Questions
      (Areas for clarification)
      (Possible objections)
    Action Items
      Follow-up Research
      Next Steps
        Task 1
        Task 2`;
  }
}


function categorizeWords(words) {
  const actions = words.filter(word =>
    /^(get|set|create|update|delete|add|remove|process|handle)/.test(word)
  ).slice(0, 3);

  const concepts = words.filter(word =>
    word.length > 4 &&
    !actions.includes(word) &&
    !/^(the|and|for|with|from|that|this)/.test(word)
  ).slice(0, 4);

  const objects = words.filter(word =>
    word.length > 3 &&
    !actions.includes(word) &&
    !concepts.includes(word) &&
    !/^(is|are|was|were|has|have|had)/.test(word)
  ).slice(0, 3);

  return { actions, concepts, objects };
}

// NEW: Extract functions for new chart types (all use sanitizer)
function extractGanttCode(response) {
  const sanitizedResponse = sanitizeAIOutput(response);
  const mermaidMatch = sanitizedResponse.match(/```mermaid\s*([\s\S]*?)\s*```/);
  return mermaidMatch ? mermaidMatch[1].trim() : createUniversalFallback('Could not extract Gantt', 'gantt');
}

function extractPieCode(response) {
  const sanitizedResponse = sanitizeAIOutput(response);
  const mermaidMatch = sanitizedResponse.match(/```mermaid\s*([\s\S]*?)\s*```/);
  return mermaidMatch ? mermaidMatch[1].trim() : createUniversalFallback('Could not extract Pie', 'pie');
}

function extractQuadrantCode(response) {
  const sanitizedResponse = sanitizeAIOutput(response);
  const mermaidMatch = sanitizedResponse.match(/```mermaid\s*([\s\S]*?)\s*```/);
  return mermaidMatch ? mermaidMatch[1].trim() : createUniversalFallback('Could not extract Quadrant', 'quadrant');
}

function extractJourneyCode(response) {
  const sanitizedResponse = sanitizeAIOutput(response);
  const mermaidMatch = sanitizedResponse.match(/```mermaid\s*([\s\S]*?)\s*```/);
  return mermaidMatch ? mermaidMatch[1].trim() : createUniversalFallback('Could not extract Journey', 'journey');
}

function extractGitCode(response) {
  const sanitizedResponse = sanitizeAIOutput(response);
  const mermaidMatch = sanitizedResponse.match(/```mermaid\s*([\s\S]*?)\s*```/);
  return mermaidMatch ? mermaidMatch[1].trim() : createUniversalFallback('Could not extract Git', 'git');
}

function extractStateCode(response) {
  const sanitizedResponse = sanitizeAIOutput(response);
  const mermaidMatch = sanitizedResponse.match(/```mermaid\s*([\s\S]*?)\s*```/);
  return mermaidMatch ? mermaidMatch[1].trim() : createUniversalFallback('Could not extract State', 'state');
}

function extractClassCode(response) {
  const sanitizedResponse = sanitizeAIOutput(response);
  const mermaidMatch = sanitizedResponse.match(/```mermaid\s*([\s\S]*?)\s*```/);
  return mermaidMatch ? mermaidMatch[1].trim() : createUniversalFallback('Could not extract Class', 'class');
}

// ENHANCED: Helper functions for universal charts
function createUniversalFallback(input, chartType) {
  const shortInput = input.length > 50 ? input.substring(0, 47) + '...' : input;

  switch (chartType) {
    case 'gantt':
    case 'project':
      return `gantt
    title ${shortInput}
    dateFormat  YYYY-MM-DD
    section Phase 1
    Planning    :done, plan, 2024-01-01, 7d
    section Phase 2
    Execution   :active, exec, after plan, 14d`;

    case 'pie':
    case 'statistics':
    case 'distribution':
      return `pie title ${shortInput}
    "Main Component" : 45
    "Secondary" : 30  
    "Other" : 25`;

    case 'quadrant':
    case 'matrix':
    case 'analysis':
      return `quadrantChart
    title ${shortInput}
    x-axis Low --> High
    y-axis Low --> High
    quadrant-1 High Priority
    Item A: [0.3, 0.8]`;

    case 'journey':
    case 'user-journey':
    case 'customer-journey':
      return `journey
    title ${shortInput}
    section Start
      Begin process    : 3: User
      Take action      : 2: User`;

    case 'git':
    case 'gitgraph':
    case 'version-control':
      return `gitgraph
    commit id: "Initial: ${shortInput}"
    branch feature
    checkout feature
    commit id: "Work in progress"`;

    case 'state':
    case 'state-diagram':
    case 'status':
      return `stateDiagram-v2
    [*] --> Start
    Start --> Processing: ${shortInput}
    Processing --> Complete`;

    case 'class':
    case 'class-diagram':
    case 'entity':
      return `classDiagram
    class Main {
        +attribute: string
        +process(): void
    }`;

    case 'flowchart':
    case 'process':
      return `flowchart TD
    A([Start: ${shortInput}])
    A --> B[Analyze Input]
    B --> C([Complete])`;

    case 'timeline':
      return `flowchart TD
    A([Beginning])
    A -->|Phase 1| B[Early Stage: ${shortInput}]
    B -->|Phase 2| C([Future])`;

    case 'sequence':
      return `sequenceDiagram
    User->>System: ${shortInput}
    System-->>User: Response`;

    case 'mindmap':
    default:
      return createEnhancedMindmapFallback(input, 'text');
  }
}

function getChartTypeSuggestions(input, detectedType) {
  const suggestions = [
    { type: 'mindmap', name: 'Mind Map', description: 'Break down topics', icon: '🧠', recommended: detectedType === 'topic' },
    { type: 'flowchart', name: 'Flowchart', description: 'Show processes', icon: '📊', recommended: detectedType === 'process' },
    { type: 'gantt', name: 'Gantt Chart', description: 'Project timelines', icon: '📅', recommended: detectedType === 'gantt' },
    { type: 'pie', name: 'Pie Chart', description: 'Statistical distributions', icon: '🥧', recommended: detectedType === 'pie' },
    { type: 'quadrant', name: 'Quadrant Chart', description: 'Priority matrix', icon: '📍', recommended: detectedType === 'quadrant' },
    { type: 'journey', name: 'User Journey', description: 'Customer experience', icon: '🛤️', recommended: detectedType === 'journey' },
    { type: 'timeline', name: 'Timeline', description: 'Chronological events', icon: '⏰', recommended: detectedType === 'timeline' },
    { type: 'state', name: 'State Diagram', description: 'Status transitions', icon: '🔀', recommended: detectedType === 'state' },
    { type: 'class', name: 'Class Diagram', description: 'Entity relationships', icon: '🏗️', recommended: detectedType === 'class' },
    { type: 'git', name: 'Git Graph', description: 'Version control', icon: '🌿', recommended: detectedType === 'git' }
  ];

  return suggestions.sort((a, b) => b.recommended - a.recommended);
}

// Debugging endpoint for mindmap
router.get('/debug/mindmap/:testType', async (req, res) => {
  try {
    const { testType } = req.params;
    let testResponse = '';
    switch (testType) {
      case 'simple': testResponse = `mindmap\n  root((Test))\n    Branch A\n    Branch B`; break;
      case 'withcode': testResponse = `\`\`\`mermaid\nmindmap\n  root((JS))\n    Parameters\n    Logic\n\`\`\``; break;
      case 'malformed': testResponse = `Some text\nmindmap\n  root((Malformed))\n    Branch 1`; break;
      default: testResponse = 'Invalid test type';
    }
    const extractedCode = extractMindmapCode(testResponse);
    res.json({ success: true, testType, originalResponse: testResponse, extractedCode });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;