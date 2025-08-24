const express = require('express');
const router = express.Router();
const ollamaService = require('../services/ollama');
const { 
  // Original prompts
  flowchartPrompt, 
  mindmapPrompt, 
  textMindmapPrompt, 
  diagramPrompt,
  sequencePrompt,
  
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

// Generate mindmap from code OR text prompt (EXISTING - KEEP AS IS)
router.post('/mindmap', async (req, res) => {
  try {
    const { code, language = 'javascript', prompt, inputType = 'code' } = req.body;
    
    if (!code && !prompt) {
      return res.status(400).json({ error: 'Code or text prompt is required' });
    }

    console.log(`🧠 Generating mindmap for ${inputType}...`);
    
    const aiPrompt = inputType === 'text' 
      ? textMindmapPrompt(prompt)
      : mindmapPrompt(code, language);
    
    const result = await ollamaService.generateChart(aiPrompt, 'mindmap');
    
    if (result.success) {
      const mermaidCode = extractMindmapCode(result.content);
      res.json({
        success: true,
        chartType: 'mindmap',
        inputType,
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
    console.error('❌ Mindmap generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate sequence diagram from code (EXISTING - KEEP AS IS)
router.post('/sequence', async (req, res) => {
  try {
    const { code, language = 'javascript' } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    console.log(`📈 Generating sequence diagram for ${language} code...`);
    
    const prompt = diagramPrompt(code, language, 'sequence');
    const result = await ollamaService.generateChart(prompt, 'sequence');
    
    if (result.success) {
      const mermaidCode = extractSequenceCode(result.content);
      res.json({
        success: true,
        chartType: 'sequence',
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
    console.error(`❌ Sequence diagram generation error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ENHANCED: Universal chart generation endpoint with ALL chart types
router.post('/universal', async (req, res) => {
  try {
    const { input, chartType, autoDetect = true } = req.body;
    
    if (!input || input.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Input text is required' 
      });
    }

    console.log('🌟 Universal chart request:', {
      input: input.substring(0, 100) + '...',
      requestedType: chartType,
      autoDetect
    });

    let selectedChartType = chartType;
    let detectedType = null;

    // Auto-detect chart type if not specified or if autoDetect is enabled
    if (!chartType || autoDetect) {
      detectedType = detectInputType(input);
      if (!chartType) {
        selectedChartType = detectedType;
      }
    }

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
          break;
        case 'timeline':
          mermaidCode = extractMermaidCode(result.content); // Timeline uses flowchart format
          break;
        case 'sequence':
        case 'interaction':
          mermaidCode = extractSequenceCode(result.content);
          break;
        default:
          mermaidCode = extractMindmapCode(result.content);
      }
      
      console.log('✅ Universal chart generated successfully:', selectedChartType);
      
      res.json({
        success: true,
        chartType: selectedChartType,
        detectedType,
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
        chartType: selectedChartType,
        detectedType
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

// EXISTING Helper functions (KEEP AS IS)
function extractMermaidCode(response) {
  console.log('Raw AI response:', response);
  
  // Extract content between ```mermaid and ``` or find flowchart directly
  let mermaidCode = '';
  
  const mermaidMatch = response.match(/```mermaid\s*([\s\S]*?)\s*```/);
  if (mermaidMatch) {
    mermaidCode = mermaidMatch[1];
  } else {
    const flowchartMatch = response.match(/flowchart\s+TD[\s\S]*/i);
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
    result.push(`    ${nodeId}${nodeContent}`);
  }
  
  // Add connections
  for (let conn of connections) {
    if (conn.label) {
      result.push(`    ${conn.from} -->|${conn.label}| ${conn.to}`);
    } else {
      result.push(`    ${conn.from} --> ${conn.to}`);
    }
  }
  
  return result.join('\n');
}

function extractMindmapCode(response) {
  console.log('Raw mindmap response:', response);
  
  // Extract content between ```mermaid and ``` or find mindmap directly
  let mermaidCode = '';
  
  const mermaidMatch = response.match(/```mermaid\s*([\s\S]*?)\s*```/);
  if (mermaidMatch) {
    mermaidCode = mermaidMatch[1];
  } else {
    const mindmapMatch = response.match(/mindmap[\s\S]*/i);
    if (mindmapMatch) {
      mermaidCode = mindmapMatch[0];
    }
  }
  
  if (mermaidCode) {
    console.log('Extracted mindmap code:', mermaidCode);
    return mermaidCode.trim();
  }
  
  // Fallback mindmap
  return `mindmap
  root((Code Structure))
    Functions
      Main Function
      Helper Functions
    Variables
      Global Variables
      Local Variables
    Logic
      Conditions
      Loops`;
}

function extractSequenceCode(response) {
  console.log('Raw sequence response:', response);
  
  // Extract content between ```mermaid and ``` or find sequenceDiagram directly
  let mermaidCode = '';
  
  const mermaidMatch = response.match(/```mermaid\s*([\s\S]*?)\s*```/);
  if (mermaidMatch) {
    mermaidCode = mermaidMatch[1];
  } else {
    const sequenceMatch = response.match(/sequenceDiagram[\s\S]*/i);
    if (sequenceMatch) {
      mermaidCode = sequenceMatch[0];
    }
  }
  
  if (mermaidCode) {
    console.log('Extracted sequence code:', mermaidCode);
    return mermaidCode.trim();
  }
  
  // Fallback sequence diagram
  return `sequenceDiagram
    participant A as Main
    participant B as Function
    A->>B: call function()
    B-->>A: return result`;
}

// NEW: Extract functions for new chart types
function extractGanttCode(response) {
  console.log('Raw gantt response:', response);
  
  let mermaidCode = '';
  const mermaidMatch = response.match(/```mermaid\s*([\s\S]*?)\s*```/);
  if (mermaidMatch) {
    mermaidCode = mermaidMatch[1];
  } else {
    const ganttMatch = response.match(/gantt[\s\S]*/i);
    if (ganttMatch) {
      mermaidCode = ganttMatch[0];
    }
  }
  
  if (mermaidCode && mermaidCode.includes('gantt')) {
    return mermaidCode.trim();
  }
  
  // Fallback gantt chart
  return `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements    :done, req, 2024-01-01, 7d
    Design         :done, design, after req, 14d
    section Development  
    Implementation :active, impl, 2024-01-22, 21d
    Testing        :test, after impl, 7d`;
}

function extractPieCode(response) {
  console.log('Raw pie response:', response);
  
  let mermaidCode = '';
  const mermaidMatch = response.match(/```mermaid\s*([\s\S]*?)\s*```/);
  if (mermaidMatch) {
    mermaidCode = mermaidMatch[1];
  } else {
    const pieMatch = response.match(/pie\s+title[\s\S]*/i);
    if (pieMatch) {
      mermaidCode = pieMatch[0];
    }
  }
  
  if (mermaidCode && mermaidCode.includes('pie')) {
    return mermaidCode.trim();
  }
  
  // Fallback pie chart
  return `pie title Data Distribution
    "Category A" : 45
    "Category B" : 30
    "Category C" : 25`;
}

function extractQuadrantCode(response) {
  console.log('Raw quadrant response:', response);
  
  let mermaidCode = '';
  const mermaidMatch = response.match(/```mermaid\s*([\s\S]*?)\s*```/);
  if (mermaidMatch) {
    mermaidCode = mermaidMatch[1];
  } else {
    const quadrantMatch = response.match(/quadrantChart[\s\S]*/i);
    if (quadrantMatch) {
      mermaidCode = quadrantMatch[0];
    }
  }
  
  if (mermaidCode && mermaidCode.includes('quadrant')) {
    return mermaidCode.trim();
  }
  
  // Fallback quadrant chart
  return `quadrantChart
    title Priority Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 High Impact, Low Effort
    quadrant-2 High Impact, High Effort
    quadrant-3 Low Impact, Low Effort
    quadrant-4 Low Impact, High Effort
    Item A: [0.3, 0.8]
    Item B: [0.7, 0.6]`;
}

function extractJourneyCode(response) {
  console.log('Raw journey response:', response);
  
  let mermaidCode = '';
  const mermaidMatch = response.match(/```mermaid\s*([\s\S]*?)\s*```/);
  if (mermaidMatch) {
    mermaidCode = mermaidMatch[1];
  } else {
    const journeyMatch = response.match(/journey[\s\S]*/i);
    if (journeyMatch) {
      mermaidCode = journeyMatch[0];
    }
  }
  
  if (mermaidCode && mermaidCode.includes('journey')) {
    return mermaidCode.trim();
  }
  
  // Fallback journey map
  return `journey
    title User Experience
    section Discovery
      Find website     : 5: User
      Browse content   : 3: User
    section Engagement
      Interact         : 4: User
      Complete action  : 2: User`;
}

function extractGitCode(response) {
  console.log('Raw git response:', response);
  
  let mermaidCode = '';
  const mermaidMatch = response.match(/```mermaid\s*([\s\S]*?)\s*```/);
  if (mermaidMatch) {
    mermaidCode = mermaidMatch[1];
  } else {
    const gitMatch = response.match(/gitgraph[\s\S]*/i);
    if (gitMatch) {
      mermaidCode = gitMatch[0];
    }
  }
  
  if (mermaidCode && mermaidCode.includes('git')) {
    return mermaidCode.trim();
  }
  
  // Fallback git graph
  return `gitgraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Feature work"
    checkout main
    merge develop
    commit id: "Release"`;
}

function extractStateCode(response) {
  console.log('Raw state response:', response);
  
  let mermaidCode = '';
  const mermaidMatch = response.match(/```mermaid\s*([\s\S]*?)\s*```/);
  if (mermaidMatch) {
    mermaidCode = mermaidMatch[1];
  } else {
    const stateMatch = response.match(/stateDiagram-v2[\s\S]*/i);
    if (stateMatch) {
      mermaidCode = stateMatch[0];
    }
  }
  
  if (mermaidCode && (mermaidCode.includes('stateDiagram') || mermaidCode.includes('state'))) {
    return mermaidCode.trim();
  }
  
  // Fallback state diagram
  return `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: start
    Processing --> Complete: finish
    Complete --> [*]`;
}

function extractClassCode(response) {
  console.log('Raw class response:', response);
  
  let mermaidCode = '';
  const mermaidMatch = response.match(/```mermaid\s*([\s\S]*?)\s*```/);
  if (mermaidMatch) {
    mermaidCode = mermaidMatch[1];
  } else {
    const classMatch = response.match(/classDiagram[\s\S]*/i);
    if (classMatch) {
      mermaidCode = classMatch[0];
    }
  }
  
  if (mermaidCode && mermaidCode.includes('class')) {
    return mermaidCode.trim();
  }
  
  // Fallback class diagram
  return `classDiagram
    class Entity {
        +id: string
        +name: string
        +method(): void
    }`;
}

// ENHANCED: Helper functions for universal charts
function createUniversalFallback(input, chartType) {
  const shortInput = input.length > 50 ? input.substring(0, 47) + '...' : input;
  
  switch (chartType) {
    case 'gantt':
    case 'project':
      return `gantt
    title ${shortInput}
    dateFormat  YYYY-MM-DD
    section Phase 1
    Planning    :done, plan, 2024-01-01, 7d
    section Phase 2
    Execution   :active, exec, after plan, 14d
    section Phase 3
    Completion  :comp, after exec, 7d`;

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
    quadrant-2 Consider
    quadrant-3 Low Priority  
    quadrant-4 Avoid
    Item A: [0.3, 0.8]
    Item B: [0.7, 0.4]`;

    case 'journey':
    case 'user-journey':
    case 'customer-journey':
      return `journey
    title ${shortInput}
    section Start
      Begin process    : 3: User
      Take action      : 2: User
    section End
      Complete task    : 4: User`;

    case 'git':
    case 'gitgraph':
    case 'version-control':
      return `gitgraph
    commit id: "Initial: ${shortInput}"
    branch feature
    checkout feature
    commit id: "Work in progress"
    checkout main
    merge feature
    commit id: "Complete"`;

    case 'state':
    case 'state-diagram':
    case 'status':
      return `stateDiagram-v2
    [*] --> Start
    Start --> Processing: ${shortInput}
    Processing --> Complete
    Complete --> [*]`;

    case 'class':
    case 'class-diagram':
    case 'entity':
      return `classDiagram
    class Main {
        +attribute: string
        +process(): void
    }
    class Related {
        +data: string
    }
    Main --> Related`;

    case 'flowchart':
    case 'process':
      return `flowchart TD
    A([Start: ${shortInput}])
    A --> B[Analyze Input]
    B --> C{Understanding?}
    C -->|Yes| D[Process Successfully]
    C -->|No| E[Need More Info]
    D --> F([Complete])
    E --> F`;

    case 'timeline':
      return `flowchart TD
    A([Beginning])
    A -->|Phase 1| B[Early Stage: ${shortInput}]
    B -->|Phase 2| C[Development]
    C -->|Phase 3| D[Current State]
    D --> E([Future])`;

    case 'sequence':
      return `sequenceDiagram
    participant User as User
    participant System as System
    User->>System: ${shortInput}
    System->>System: Process request
    System-->>User: Provide response`;

    case 'mindmap':
    default:
      return `mindmap
  root((${shortInput}))
    Key Aspects
      Important Points
      Related Concepts
    Analysis Needed
      Further Research
      Clarification Required
    Next Steps
      Action Items
      Follow-up`;
  }
}

function getChartTypeSuggestions(input, detectedType) {
  const suggestions = [
    {
      type: 'mindmap',
      name: 'Mind Map',
      description: 'Break down topics into categories and subtopics',
      icon: '🧠',
      recommended: detectedType === 'topic' || detectedType === 'structure'
    },
    {
      type: 'flowchart', 
      name: 'Flowchart',
      description: 'Show processes, workflows, and decision paths',
      icon: '📊',
      recommended: detectedType === 'process' || detectedType === 'code'
    },
    {
      type: 'gantt',
      name: 'Gantt Chart',
      description: 'Project timelines and task scheduling',
      icon: '📅',
      recommended: detectedType === 'gantt'
    },
    {
      type: 'pie',
      name: 'Pie Chart',
      description: 'Statistical distributions and percentages',
      icon: '🥧',
      recommended: detectedType === 'pie'
    },
    {
      type: 'quadrant',
      name: 'Quadrant Chart',
      description: 'Priority matrix and analysis frameworks',
      icon: '📍',
      recommended: detectedType === 'quadrant'
    },
    {
      type: 'journey',
      name: 'User Journey',
      description: 'Customer experience and user flows',
      icon: '🛤️',
      recommended: detectedType === 'journey'
    },
    {
      type: 'sequence',
      name: 'Sequence Diagram', 
      description: 'Visualize interactions and communications',
      icon: '🔄',
      recommended: detectedType === 'interaction'
    },
    {
      type: 'timeline',
      name: 'Timeline',
      description: 'Display chronological events and progressions',
      icon: '⏰',
      recommended: detectedType === 'timeline'
    },
    {
      type: 'state',
      name: 'State Diagram',
      description: 'Show status transitions and workflows',
      icon: '🔀',
      recommended: detectedType === 'state'
    },
    {
      type: 'class',
      name: 'Class Diagram',
      description: 'Entity relationships and data models',
      icon: '🏗️',
      recommended: detectedType === 'class'
    },
    {
      type: 'git',
      name: 'Git Graph',
      description: 'Version control and development workflows',
      icon: '🌿',
      recommended: detectedType === 'git'
    }
  ];

  return suggestions.sort((a, b) => b.recommended - a.recommended);
}

module.exports = router;