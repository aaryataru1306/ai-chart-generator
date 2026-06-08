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

// Generate flowchart from code (EXISTING - FIXED EXTRACTION)
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

// ENHANCED: Generate mindmap from code OR text prompt with better debugging (NO CHANGES)
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
      console.log('❌ Groq service failed, creating fallback');
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

// FIXED: Universal chart generation endpoint with correct type mapping and validation
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

    // If no chartType provided or autoDetect is enabled, detect the input type
    if (!chartType || autoDetect) {
      detectedType = detectInputTypeFixed(input); // Use fixed detection function
      console.log('🔍 Detected input type:', detectedType);
      
      // If user didn't specify a chart type, map detected type to a valid chart type
      if (!chartType) {
        selectedChartType = mapInputTypeToChartType(detectedType);
        console.log('🎯 Mapped to chart type:', selectedChartType);
      }
    }
    
    // Validate that we have a valid chart type
    const validChartTypes = [
      'flowchart', 'mindmap', 'gantt', 'pie', 'quadrant', 
      'journey', 'git', 'state', 'class', 'timeline'
    ];
    
    if (!selectedChartType || !validChartTypes.includes(selectedChartType)) {
      console.error('❌ Invalid chart type:', selectedChartType);
      // Default to mindmap if we can't determine a valid type
      selectedChartType = 'mindmap';
      console.log('🔄 Defaulting to mindmap');
    }
    
    console.log('✅ Final chart type selected:', selectedChartType);
    
    // Generate appropriate prompt using smart selector
    const prompt = smartChartPrompt(input, selectedChartType);
    
    // Generate chart using existing Ollama service
    const result = await ollamaService.generateChart(prompt, selectedChartType);
    
    if (result.success) {
      // Extract Mermaid code based on chart type
      let mermaidCode = extractMermaidByType(result.content, selectedChartType);
      
      // Additional validation for mindmaps (they often need special handling)
      if (selectedChartType === 'mindmap' && (!mermaidCode || mermaidCode.length < 10)) {
        console.log('⚠️ Mindmap code insufficient, using enhanced fallback');
        mermaidCode = createEnhancedMindmapFallback(input, 'text');
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
      console.log('❌ Chart generation failed, using fallback');
      // Use fallback chart
      const fallbackChart = createUniversalFallback(input, selectedChartType);
      
      res.json({
        success: true, // Changed to true since we're providing a fallback
        chartType: selectedChartType,
        detectedType,
        mermaidCode: fallbackChart,
        error: result.error,
        fallback: true
      });
    }

  } catch (error) {
    console.error('❌ Universal chart generation error:', error);
    
    // Create emergency fallback
    const fallbackType = req.body.chartType || 'mindmap';
    const fallbackChart = createUniversalFallback(
      req.body.input || 'Error occurred', 
      fallbackType
    );
    
    res.json({
      success: true,
      mermaidCode: fallbackChart,
      chartType: fallbackType,
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

    const detectedType = detectInputTypeFixed(input);
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

// NEW: Helper function to map input types to valid chart types
function mapInputTypeToChartType(detectedType) {
  const typeMapping = {
    'code': 'flowchart',
    'process': 'flowchart',
    'workflow': 'flowchart',
    'structure': 'mindmap',
    'topic': 'mindmap',
    'concept': 'mindmap',
    'interaction': 'mindmap',
    'gantt': 'gantt',
    'project': 'gantt',
    'timeline': 'timeline',
    'schedule': 'gantt',
    'pie': 'pie',
    'statistics': 'pie',
    'distribution': 'pie',
    'data': 'pie',
    'quadrant': 'quadrant',
    'matrix': 'quadrant',
    'analysis': 'quadrant',
    'priority': 'quadrant',
    'journey': 'journey',
    'user-journey': 'journey',
    'customer-journey': 'journey',
    'experience': 'journey',
    'git': 'git',
    'gitgraph': 'git',
    'version-control': 'git',
    'state': 'state',
    'state-diagram': 'state',
    'status': 'state',
    'transition': 'state',
    'class': 'class',
    'class-diagram': 'class',
    'entity': 'class',
    'relationship': 'class'
  };
  
  // Return mapped type or default to mindmap
  return typeMapping[detectedType] || 'mindmap';
}

// NEW: Centralized mermaid extraction function
function extractMermaidByType(content, chartType) {
  console.log(`🔧 Extracting ${chartType} code from response...`);
  
  switch (chartType) {
    case 'gantt':
    case 'project':
      return extractGanttCode(content);
    case 'pie':
    case 'statistics':
    case 'distribution':
      return extractPieCode(content);
    case 'quadrant':
    case 'matrix':
    case 'analysis':
      return extractQuadrantCode(content);
    case 'journey':
    case 'user-journey':
    case 'customer-journey':
      return extractJourneyCode(content);
    case 'git':
    case 'gitgraph':
    case 'version-control':
      return extractGitCode(content);
    case 'state':
    case 'state-diagram':
    case 'status':
      return extractStateCode(content);
    case 'class':
    case 'class-diagram':
    case 'entity':
      return extractClassCode(content);
    case 'flowchart':
    case 'process':
      return extractMermaidCode(content);
    case 'mindmap':
    case 'topic':
    case 'structure':
      return extractMindmapCode(content);
    case 'timeline':
      return extractMermaidCode(content); // Timeline uses flowchart format
    default:
      console.log(`⚠️ Unknown chart type ${chartType}, defaulting to mindmap extraction`);
      return extractMindmapCode(content);
  }
}

// IMPROVED: Better input type detection with more comprehensive patterns
function detectInputTypeFixed(input) {
  if (!input || typeof input !== 'string') {
    return 'topic';
  }
  
  const text = input.toLowerCase().trim();
  
  // Check for specific chart type keywords first
  if (text.includes('gantt') || text.includes('project timeline') || text.includes('schedule')) {
    return 'gantt';
  }
  if (text.includes('pie chart') || text.includes('percentage') || text.includes('distribution')) {
    return 'pie';
  }
  if (text.includes('quadrant') || text.includes('matrix') || text.includes('priority')) {
    return 'quadrant';
  }
  if (text.includes('user journey') || text.includes('customer journey') || text.includes('experience map')) {
    return 'journey';
  }
  if (text.includes('git') || text.includes('branch') || text.includes('commit')) {
    return 'git';
  }
  if (text.includes('state') || text.includes('status') || text.includes('transition')) {
    return 'state';
  }
  if (text.includes('class') || text.includes('entity') || text.includes('relationship')) {
    return 'class';
  }
  if (text.includes('timeline') || text.includes('chronological') || text.includes('history')) {
    return 'timeline';
  }
  
  // Check for code patterns
  const codePatterns = [
    /function\s*\(/i,
    /class\s+\w+/i,
    /if\s*\(/i,
    /for\s*\(/i,
    /while\s*\(/i,
    /def\s+\w+/i,
    /import\s+/i,
    /return\s+/i,
    /{[\s\S]*}/,
    /\w+\s*=\s*\w+/,
    /console\.log/i,
    /print\(/i
  ];
  
  if (codePatterns.some(pattern => pattern.test(input))) {
    return 'code';
  }
  
  // Check for process/workflow patterns
  const processPatterns = [
    /step\s+\d+/i,
    /first.*then.*finally/i,
    /start.*process.*end/i,
    /workflow/i,
    /procedure/i,
    /algorithm/i,
    /method/i,
    /process/i
  ];
  
  if (processPatterns.some(pattern => pattern.test(text))) {
    return 'process';
  }
  
  // Check for structural/topic patterns
  const structurePatterns = [
    /category/i,
    /topic/i,
    /concept/i,
    /idea/i,
    /theme/i,
    /subject/i,
    /overview/i,
    /breakdown/i
  ];
  
  if (structurePatterns.some(pattern => pattern.test(text))) {
    return 'topic';
  }
  
  // Default fallback based on content characteristics
  if (text.length > 200) {
    return 'structure';
  } else if (text.includes('?') || text.includes('how') || text.includes('what')) {
    return 'topic';
  } else {
    return 'concept';
  }
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

// FIXED: Main flowchart extraction function - this was the source of the error
function extractMermaidCode(response) {
  console.log('🔧 Extracting flowchart from response...');
  
  if (!response || typeof response !== 'string') {
    console.log('❌ Invalid response, using fallback');
    return createFlowchartFallback();
  }
  
  let mermaidCode = '';
  
  // Strategy 1: Extract content between ```mermaid and ```
  const mermaidMatch = response.match(/```mermaid\s*([\s\S]*?)\s*```/i);
  if (mermaidMatch && mermaidMatch[1]) {
    mermaidCode = mermaidMatch[1].trim();
    console.log('✅ Found mermaid code block');
  } else {
    // Strategy 2: Look for flowchart directly
    const flowchartMatch = response.match(/flowchart\s+[A-Z]{2}[\s\S]*?(?=```|$)/i);
    if (flowchartMatch && flowchartMatch[0]) {
      mermaidCode = flowchartMatch[0].trim();
      console.log('✅ Found direct flowchart pattern');
    }
  }
  
  // Validate and clean the extracted code
  if (mermaidCode && mermaidCode.includes('flowchart')) {
    const cleanedCode = cleanFlowchartCode(mermaidCode);
    console.log('✅ Flowchart code extracted and cleaned');
    return cleanedCode;
  }
  
  console.log('❌ No valid flowchart found, using fallback');
  return createFlowchartFallback();
}

// NEW: Simple flowchart cleaning function (replaces the complex reconstruction)
function cleanFlowchartCode(code) {
  if (!code || typeof code !== 'string') {
    return createFlowchartFallback();
  }
  
  // Remove extra whitespace and normalize
  let cleaned = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  
  // Split into lines and clean each line
  let lines = cleaned.split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');
  
  // Ensure it starts with flowchart directive
  if (!lines[0] || !lines[0].toLowerCase().includes('flowchart')) {
    lines.unshift('flowchart TD');
  }
  
  // Basic validation - ensure we have at least some connections
  const hasConnections = lines.some(line => line.includes('-->'));
  
  if (!hasConnections) {
    console.log('⚠️ No connections found, using fallback');
    return createFlowchartFallback();
  }
  
  return lines.join('\n');
}

// NEW: Simple flowchart fallback
function createFlowchartFallback() {
  return `flowchart TD
    A([Start])
    B[Process Input]
    C{Valid Input?}
    D[Execute Logic]
    E[Handle Error]
    F([End])
    
    A --> B
    B --> C
    C -->|Yes| D
    C -->|No| E
    D --> F
    E --> F`;
}

// ENHANCED: Improved mindmap extraction with extensive debugging
function extractMindmapCode(response) {
  console.log('=== MINDMAP EXTRACTION DEBUG START ===');
  console.log('Raw response type:', typeof response);
  console.log('Raw response length:', response ? response.length : 'null/undefined');
  console.log('Raw response preview:', response ? response.substring(0, 300) + '...' : 'no content');
  
  if (!response || typeof response !== 'string' || response.trim() === '') {
    console.log('❌ Invalid response, using fallback');
    console.log('=== MINDMAP EXTRACTION DEBUG END ===');
    return createBasicMindmapFallback();
  }
  
  let mermaidCode = '';
  
  // Strategy 1: Extract content between ```mermaid and ```
  console.log('Trying Strategy 1: mermaid code blocks...');
  const mermaidMatch = response.match(/```mermaid\s*([\s\S]*?)\s*```/i);
  if (mermaidMatch && mermaidMatch[1]) {
    mermaidCode = mermaidMatch[1].trim();
    console.log('✅ Found mermaid code block:', mermaidCode.substring(0, 100));
  } else {
    console.log('❌ No mermaid code block found');
    
    // Strategy 2: Look for mindmap keyword directly
    console.log('Trying Strategy 2: direct mindmap pattern...');
    const mindmapMatch = response.match(/mindmap\s*\n[\s\S]*?(?=```|$)/i);
    if (mindmapMatch && mindmapMatch[0]) {
      mermaidCode = mindmapMatch[0].trim();
      console.log('✅ Found direct mindmap pattern:', mermaidCode.substring(0, 100));
    } else {
      console.log('❌ No direct mindmap pattern found');
      
      // Strategy 3: Look for root pattern
      console.log('Trying Strategy 3: root pattern...');
      const rootMatch = response.match(/root\s*\(\([^)]*\)\)[\s\S]*?(?=```|$)/i);
      if (rootMatch && rootMatch[0]) {
        mermaidCode = 'mindmap\n  ' + rootMatch[0].trim();
        console.log('✅ Found root pattern, constructed mindmap:', mermaidCode.substring(0, 100));
      } else {
        console.log('❌ No root pattern found');
        
        // Strategy 4: Look for any mindmap-like structure
        console.log('Trying Strategy 4: mindmap-like structure...');
        if (response.includes('root') || response.includes('mindmap')) {
          // Try to extract any structured content
          const lines = response.split('\n').filter(line => line.trim() !== '');
          let mindmapLines = [];
          let foundMindmapContent = false;
          
          for (let line of lines) {
            if (line.toLowerCase().includes('mindmap') || 
                line.includes('root') || 
                foundMindmapContent) {
              foundMindmapContent = true;
              mindmapLines.push(line.trim());
            }
          }
          
          if (mindmapLines.length > 0) {
            if (!mindmapLines[0].toLowerCase().includes('mindmap')) {
              mindmapLines.unshift('mindmap');
            }
            mermaidCode = mindmapLines.join('\n');
            console.log('✅ Constructed from structure:', mermaidCode.substring(0, 100));
          }
        }
      }
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
  
  console.log('Cleaning mindmap code...');
  
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
  
  // Validate mindmap structure
  let hasRoot = false;
  for (let line of lines) {
    if (line.includes('root')) {
      hasRoot = true;
      break;
    }
  }
  
  if (!hasRoot) {
    // Try to find a suitable root or create one
    let rootLine = '  root((Main Topic))';
    
    // Look for content that could be a root
    for (let i = 1; i < Math.min(lines.length, 5); i++) {
      if (lines[i] && !lines[i].startsWith('  ')) {
        rootLine = `  root((${lines[i].replace(/[(){}[\]]/g, '').trim()}))`;
        break;
      }
    }
    
    lines.splice(1, 0, rootLine);
  }
  
  // Ensure proper indentation (mindmap uses 2-space indentation typically)
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] && !lines[i].startsWith('  ')) {
      lines[i] = '    ' + lines[i];
    }
  }
  
  const result = lines.join('\n');
  console.log('Cleaned mindmap result:', result);
  return result;
}

function createBasicMindmapFallback() {
  return `mindmap
  root((Topic))
    Branch 1
      Sub-topic 1
      Sub-topic 2
    Branch 2
      Sub-topic 3
      Sub-topic 4
    Branch 3
      Sub-topic 5`;
}

function createEnhancedMindmapFallback(input, inputType) {
  const shortInput = input && input.length > 30 ? input.substring(0, 27) + '...' : (input || 'Content');
  const cleanInput = shortInput.replace(/[(){}[\]]/g, '').trim();
  
  if (inputType === 'code') {
    return `mindmap
  root((${cleanInput}))
    Functions
      Main Functions
      Helper Functions
      Utility Methods
    Variables
      Global Variables
      Local Variables
      Constants
    Structure
      Classes/Objects
      Data Types
      Dependencies
    Logic
      Conditional Logic
      Loops & Iteration
      Error Handling`;
  } else {
    // For text input, try to create more relevant structure
    const words = input ? input.toLowerCase().split(/\s+/).slice(0, 20) : [];
    const categories = categorizeWords(words);
    
    let mindmap = [`mindmap`, `  root((${cleanInput}))`];
    
    if (categories.actions.length > 0) {
      mindmap.push('    Actions');
      categories.actions.forEach(action => {
        mindmap.push(`      ${action}`);
      });
    }
    
    if (categories.concepts.length > 0) {
      mindmap.push('    Key Concepts');
      categories.concepts.forEach(concept => {
        mindmap.push(`      ${concept}`);
      });
    }
    
    if (categories.objects.length > 0) {
      mindmap.push('    Elements');
      categories.objects.forEach(obj => {
        mindmap.push(`      ${obj}`);
      });
    }
    
    // Always add some generic branches if we don't have enough content
    if (mindmap.length < 6) {
      mindmap.push('    Analysis');
      mindmap.push('      Key Points');
      mindmap.push('      Important Aspects');
      mindmap.push('    Next Steps');
      mindmap.push('      Action Items');
      mindmap.push('      Follow-up');
    }
    
    return mindmap.join('\n');
  }
}

function categorizeWords(words) {
  const actions = words.filter(word => 
    /^(get|set|create|update|delete|add|remove|process|handle|manage|execute|run|start|stop|send|receive|parse|validate|check|verify|analyze|generate|build|deploy|test|debug)/.test(word)
  ).slice(0, 3);
  
  const concepts = words.filter(word => 
    word.length > 4 && 
    !actions.includes(word) && 
    !/^(the|and|for|with|from|that|this|will|can|should|would|could|may|might)$/.test(word)
  ).slice(0, 4);
  
  const objects = words.filter(word => 
    word.length > 3 && 
    !actions.includes(word) && 
    !concepts.includes(word) &&
    !/^(is|are|was|were|has|have|had|do|does|did|will|can|should|would|could|may|might|the|and|but|or|so|if|when|where|why|how|what|who)$/.test(word)
  ).slice(0, 3);
  
  return { actions, concepts, objects };
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
    Design          :done, design, after req, 14d
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
      return createEnhancedMindmapFallback(input, 'text');
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

// NEW: Additional debugging endpoint for mindmap specifically
router.get('/debug/mindmap/:testType', async (req, res) => {
  try {
    const { testType } = req.params;
    
    let testResponse = '';
    switch (testType) {
      case 'simple':
        testResponse = `mindmap
  root((Test Topic))
    Branch A
      Sub A1
      Sub A2
    Branch B
      Sub B1
      Sub B2`;
        break;
      case 'withcode':
        testResponse = `\`\`\`mermaid
mindmap
  root((JavaScript Function))
    Parameters
      Input validation
      Type checking
    Logic
      Main algorithm
      Error handling
    Return
      Success response
      Error response
\`\`\``;
        break;
      case 'malformed':
        testResponse = `Some text before
mindmap stuff here
  root((Malformed))
    Branch 1
      Item 1
And some text after`;
        break;
      default:
        testResponse = 'Invalid test type';
    }
    
    const extractedCode = extractMindmapCode(testResponse);
    
    res.json({
      success: true,
      testType,
      originalResponse: testResponse,
      extractedCode,
      debugInfo: {
        hasRoot: extractedCode.includes('root'),
        hasMindmapKeyword: extractedCode.includes('mindmap'),
        lineCount: extractedCode.split('\n').length,
        isValidStructure: extractedCode.includes('mindmap') && extractedCode.includes('root')
      }
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;