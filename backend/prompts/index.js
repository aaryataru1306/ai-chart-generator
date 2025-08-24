// Enhanced AI Prompts for Universal Chart Generation - Supporting ALL Mermaid Chart Types

// Your existing code-focused prompts (keep for backward compatibility)
const flowchartPrompt = (code, language = 'javascript') => {
  return `Analyze this ${language} code and create a Mermaid flowchart using STANDARD FLOWCHART SYMBOLS:

STANDARD FLOWCHART SYMBOLS (use these exactly):
- Rectangle Shape (Process): B[Process step]
- Oval/Pill Shape (Start/End): A([Start]) F([End]) 
- Diamond Shape (Decision): C{Question?}
- Parallelogram (Input/Output): D[/Input data/] E[/Output result/]

CODE TO ANALYZE:
${code}

MERMAID SYNTAX REQUIREMENTS:
1. Start with: flowchart TD
2. Each arrow connection on separate line
3. Use simple node IDs: A, B, C, D, E, F
4. Label decision arrows: C -->|Yes| D and C -->|No| E
5. Follow the logical flow of the code

EXAMPLE:
flowchart TD
    A([Start])
    A --> B[/Read input/]
    B --> C[Validate data]
    C --> D{Is valid?}
    D -->|Yes| E[Process]
    D -->|No| F[/Show error/]
    E --> G([End])
    F --> G

Create a flowchart for the provided code. Return ONLY the Mermaid syntax, no explanations.`;
};

const mindmapPrompt = (code, language = 'javascript') => {
  return `Analyze this ${language} code and create a Mermaid mindmap showing the code structure.

CODE TO ANALYZE:
${code}

Create a mindmap showing:
- Main functions/classes as primary branches
- Sub-functions/methods as secondary branches  
- Key variables/properties as tertiary branches
- Dependencies and relationships

Use this format:
mindmap
  root((Code Structure))
    Main Function
      Variables
      Logic Steps
    Helper Functions
      Parameters
      Return Values

Return ONLY the Mermaid mindmap code, no explanations.`;
};

const textMindmapPrompt = (textPrompt) => {
  return `Create a comprehensive Mermaid mindmap for this topic: "${textPrompt}"

Break down the topic into:
- Main categories as primary branches
- Subtopics as secondary branches
- Specific details as tertiary branches
- Keep it organized and logical

Use this format:
mindmap
  root((${textPrompt}))
    Category 1
      Subtopic 1
        Detail A
        Detail B
      Subtopic 2
        Detail C
    Category 2
      Subtopic 3
        Detail D

Return ONLY the Mermaid mindmap code, no explanations.`;
};

// ENHANCED: Detect input type with better accuracy and more types
const detectInputType = (input) => {
  const lowerInput = input.toLowerCase();
  
  // Check if it's code
  if (input.includes('function') || input.includes('class') || input.includes('def ') || 
      input.includes('public ') || input.includes('private ') || input.includes('import ') ||
      input.includes('const ') || input.includes('let ') || input.includes('var ') ||
      input.includes('</') || input.includes('<?') || input.includes('print(')) {
    return 'code';
  }
  
  // Check for project/timeline/scheduling keywords
  if (lowerInput.match(/\b(project|schedule|gantt|deadline|milestones|tasks|phases|planning|development timeline|roadmap)\b/)) {
    return 'gantt';
  }
  
  // Check for pie chart/statistics keywords
  if (lowerInput.match(/\b(percentage|statistics|breakdown|distribution|share|proportion|pie|portion|survey results|demographics)\b/)) {
    return 'pie';
  }
  
  // Check for quadrant/analysis keywords
  if (lowerInput.match(/\b(quadrant|matrix|analysis|comparison|priority|importance|urgency|swot|categorize)\b/)) {
    return 'quadrant';
  }
  
  // Check for user journey keywords
  if (lowerInput.match(/\b(user journey|customer experience|journey map|user flow|touchpoints|experience|path)\b/)) {
    return 'journey';
  }
  
  // Check for git/development workflow
  if (lowerInput.match(/\b(git|branch|merge|commit|repository|version control|development workflow|feature branch)\b/)) {
    return 'git';
  }
  
  // Check for state machine/status keywords
  if (lowerInput.match(/\b(state|status|condition|mode|phase|stage|transition|workflow states)\b/)) {
    return 'state';
  }
  
  // Check for class diagram/OOP keywords
  if (lowerInput.match(/\b(class|object|inheritance|relationship|entity|model|database|structure|schema)\b/)) {
    return 'class';
  }
  
  // Check for process/workflow keywords
  if (lowerInput.match(/\b(step|process|workflow|procedure|how to|tutorial|guide|algorithm|method)\b/)) {
    return 'process';
  }
  
  // Check for timeline/chronological keywords  
  if (lowerInput.match(/\b(timeline|history|chronology|sequence|order|events|evolution|development)\b/)) {
    return 'timeline';
  }
  
  // Check for organizational/structural keywords
  if (lowerInput.match(/\b(organize|structure|breakdown|categories|topics|outline|plan|concept|overview)\b/)) {
    return 'structure';
  }
  
  // Check for relationship/interaction keywords
  if (lowerInput.match(/\b(interaction|communication|dialogue|conversation|relationship|between|protocol|flow)\b/)) {
    return 'interaction';
  }
  
  // Default to general topic
  return 'topic';
};

// NEW: Gantt chart for project timelines
const ganttPrompt = (input) => {
  return `Create a Mermaid Gantt chart for this project or timeline: "${input}"

GANTT SYNTAX:
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task 1    :a1, 2024-01-01, 30d
    Task 2    :after a1, 20d
    section Phase 2
    Task 3    :2024-02-15, 25d

GUIDELINES:
- Break down into logical sections/phases
- Estimate realistic durations (days/weeks)
- Show dependencies where relevant
- Use clear task names
- Include milestones with :milestone keyword

EXAMPLE:
gantt
    title Web Development Project
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements    :done, req, 2024-01-01, 7d
    Design         :done, design, after req, 14d
    section Development
    Frontend       :active, frontend, 2024-01-22, 21d
    Backend        :backend, after frontend, 14d
    section Testing
    Testing        :test, after backend, 7d
    Deployment     :milestone, deploy, after test, 1d

Return ONLY the Mermaid syntax, no explanations.`;
};

// NEW: Pie chart for statistics/distributions
const piePrompt = (input) => {
  return `Create a Mermaid pie chart for the data or topic: "${input}"

PIE CHART SYNTAX:
pie title Chart Title
    "Label 1" : 45.5
    "Label 2" : 32.1
    "Label 3" : 22.4

GUIDELINES:
- Extract or estimate meaningful percentages
- Use clear, descriptive labels
- Ensure values add up to approximately 100
- Focus on the most important categories
- Maximum 6-8 slices for clarity

EXAMPLES:
For survey data:
pie title Customer Satisfaction
    "Very Satisfied" : 42
    "Satisfied" : 35
    "Neutral" : 15
    "Dissatisfied" : 8

For market share:
pie title Browser Usage 2024
    "Chrome" : 65
    "Safari" : 18
    "Edge" : 10
    "Firefox" : 7

Return ONLY the Mermaid syntax, no explanations.`;
};

// NEW: Quadrant chart for analysis/prioritization
const quadrantPrompt = (input) => {
  return `Create a Mermaid quadrant chart for analysis: "${input}"

QUADRANT SYNTAX:
quadrantChart
    title Analysis Matrix
    x-axis Low --> High
    y-axis Low --> High
    quadrant-1 High Impact, Low Effort
    quadrant-2 High Impact, High Effort
    quadrant-3 Low Impact, Low Effort
    quadrant-4 Low Impact, High Effort
    Item A: [0.3, 0.6]
    Item B: [0.45, 0.80]

GUIDELINES:
- Define meaningful X and Y axes
- Place items in appropriate quadrants [0-1 scale]
- Use descriptive quadrant labels
- Include 5-12 items for clarity
- Focus on actionable insights

COMMON FRAMEWORKS:
- Priority Matrix: Urgency vs Importance
- SWOT: Internal vs External, Positive vs Negative
- Product Features: Impact vs Effort
- Risk Assessment: Probability vs Impact

Return ONLY the Mermaid syntax, no explanations.`;
};

// NEW: User journey map
const journeyPrompt = (input) => {
  return `Create a Mermaid user journey map for: "${input}"

USER JOURNEY SYNTAX:
journey
    title User Experience Journey
    section Discovery
      Find website     : 5: User
      Browse products  : 3: User
      Read reviews     : 4: User
    section Purchase
      Add to cart      : 2: User
      Checkout         : 1: User
      Payment          : 3: User

GUIDELINES:
- Break journey into logical sections/phases
- Rate each step from 1-5 (1=frustrated, 5=delighted)
- Include key touchpoints and interactions
- Show emotional ups and downs
- Focus on user perspective

RATING SCALE:
1 - Very frustrated/difficult
2 - Frustrated/problematic  
3 - Neutral/acceptable
4 - Satisfied/smooth
5 - Delighted/exceptional

Return ONLY the Mermaid syntax, no explanations.`;
};

// NEW: Git graph for development workflows
const gitPrompt = (input) => {
  return `Create a Mermaid git graph for the development workflow: "${input}"

GIT GRAPH SYNTAX:
gitgraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Feature work"
    checkout main
    merge develop
    commit id: "Release"

GUIDELINES:
- Show main branch workflow
- Include feature/develop branches
- Show merge points
- Use descriptive commit messages
- Include common git operations

EXAMPLE:
gitgraph
    commit id: "Initial commit"
    branch feature-login
    checkout feature-login
    commit id: "Add login form"
    commit id: "Add validation"
    checkout main
    merge feature-login
    commit id: "Release v1.1"

Return ONLY the Mermaid syntax, no explanations.`;
};

// NEW: State diagram for workflows/status
const statePrompt = (input) => {
  return `Create a Mermaid state diagram for: "${input}"

STATE DIAGRAM SYNTAX:
stateDiagram-v2
    [*] --> State1
    State1 --> State2: event/condition
    State2 --> [*]: completion
    
GUIDELINES:
- Identify all possible states
- Show transitions between states
- Label transitions with triggers/conditions
- Include start [*] and end states
- Keep states clear and concise

EXAMPLE:
stateDiagram-v2
    [*] --> Draft
    Draft --> InReview: submit
    InReview --> Approved: approve
    InReview --> Draft: request changes
    Approved --> Published: publish
    Published --> [*]

Return ONLY the Mermaid syntax, no explanations.`;
};

// NEW: Class diagram for structure/relationships
const classPrompt = (input) => {
  return `Create a Mermaid class diagram for: "${input}"

CLASS DIAGRAM SYNTAX:
classDiagram
    class ClassName {
        +attribute: type
        +method(): returnType
    }
    ClassA --> ClassB: relationship

GUIDELINES:
- Show main classes/entities
- Include key attributes and methods
- Show relationships between classes
- Use + for public, - for private
- Focus on important structural elements

EXAMPLE:
classDiagram
    class User {
        +id: string
        +name: string
        +email: string
        +login(): boolean
        +logout(): void
    }
    class Order {
        +orderId: string
        +total: number
        +items: Item[]
        +calculate(): number
    }
    User ||--o{ Order: places

Return ONLY the Mermaid syntax, no explanations.`;
};

// NEW: Enhanced universal flowchart
const universalFlowchartPrompt = (input) => {
  return `Create a Mermaid flowchart for this process, workflow, or procedure: "${input}"

STANDARD FLOWCHART SYMBOLS (use these exactly):
- Rectangle Shape (Process): B[Process step]
- Oval/Pill Shape (Start/End): A([Start]) F([End])
- Diamond Shape (Decision): C{Question?}
- Parallelogram (Input/Output): D[/Input data/] E[/Output result/]

MERMAID SYNTAX REQUIREMENTS:
1. Start with: flowchart TD
2. Each arrow connection on separate line
3. Use simple node IDs: A, B, C, D, E, F
4. Label decision arrows: C -->|Yes| D and C -->|No| E
5. Show logical flow from start to finish

CONTENT GUIDELINES:
- Break down into clear, actionable steps
- Identify decision points and branches
- Include inputs and outputs where relevant
- Keep steps concise but descriptive
- Show alternative paths when applicable

EXAMPLE FORMAT:
flowchart TD
    A([Start])
    A --> B[/Gather requirements/]
    B --> C[Analyze needs]
    C --> D{Requirements clear?}
    D -->|Yes| E[Proceed with solution]
    D -->|No| F[Clarify requirements]
    F --> C
    E --> G([End])

Return ONLY the Mermaid syntax, no explanations.`;
};

// Enhanced universal mindmap
const universalMindmapPrompt = (input) => {
  return `Create a comprehensive Mermaid mindmap for: "${input}"

Break down this topic into:
- 3-6 main categories as primary branches
- Relevant subtopics as secondary branches
- Specific details, examples, or components as tertiary branches
- Keep it logical and well-organized

GUIDELINES:
- Use clear, concise labels
- Organize from general to specific
- Include practical aspects where relevant
- Balance breadth and depth
- Maximum 4 levels for clarity

FORMAT:
mindmap
  root((Main Topic))
    Category 1
      Subtopic A
        Detail 1
        Detail 2
      Subtopic B
        Detail 3
    Category 2
      Subtopic C
      Subtopic D
    Category 3
      Subtopic E

Return ONLY the Mermaid mindmap code, no explanations.`;
};

// Enhanced universal timeline using flowchart format
const universalTimelinePrompt = (input) => {
  return `Create a Mermaid timeline flowchart for: "${input}"

Show the chronological progression of events, phases, or development stages.

USE FLOWCHART FORMAT FOR TIMELINE:
flowchart TD
    A([Start Period])
    A --> B[First Event/Phase]
    B --> C[Second Event/Phase] 
    C --> D[Third Event/Phase]
    D --> E([Current/End])

GUIDELINES:
- Arrange events in chronological order
- Use time periods or dates as arrow labels when relevant
- Include major milestones and transitions
- Show cause-and-effect relationships
- Keep timeline focused on key events

EXAMPLE WITH TIME LABELS:
flowchart TD
    A([Ancient Times])
    A -->|3000 BC| B[Early Development]
    B -->|1000 AD| C[Major Advancement]
    C -->|Modern Era| D[Current State]

Return ONLY the Mermaid syntax, no explanations.`;
};

// Enhanced sequence diagram
const sequencePrompt = (code, language = 'javascript') => {
  if (language === 'text') {
    return `Create a Mermaid sequence diagram showing the interactions or communications in: "${code}"

Use this format:
sequenceDiagram
    participant A as First Party
    participant B as Second Party
    participant C as Third Party
    A->>B: Initial action/message
    B->>C: Response/forward
    C-->>B: Feedback
    B-->>A: Final response

GUIDELINES:
- Identify main actors/participants
- Show the flow of communication or actions
- Use ->> for requests/actions
- Use -->> for responses/returns
- Include notes if needed: Note over A,B: Explanation

Return ONLY the Mermaid syntax, no explanations.`;
  } else {
    return `Create a Mermaid.js sequence diagram showing the flow of function calls and interactions in this ${language} code:

CODE:
${code}

Use this format:
sequenceDiagram
    participant A as Actor
    participant B as System
    A->>B: function call
    B->>B: internal process
    B-->>A: return value

Show the sequence of function calls and data flow. Return ONLY the Mermaid syntax.`;
  }
};

// ENHANCED: Smart chart selector with all chart types
const smartChartPrompt = (input, chartType = null) => {
  // If chart type is specified, use it
  if (chartType) {
    switch (chartType.toLowerCase()) {
      case 'gantt':
      case 'project':
      case 'timeline-project':
        return ganttPrompt(input);
      case 'pie':
      case 'statistics':
      case 'distribution':
        return piePrompt(input);
      case 'quadrant':
      case 'matrix':
      case 'analysis':
        return quadrantPrompt(input);
      case 'journey':
      case 'user-journey':
      case 'customer-journey':
        return journeyPrompt(input);
      case 'git':
      case 'gitgraph':
      case 'version-control':
        return gitPrompt(input);
      case 'state':
      case 'state-diagram':
      case 'status':
        return statePrompt(input);
      case 'class':
      case 'class-diagram':
      case 'entity':
        return classPrompt(input);
      case 'flowchart':
      case 'flow':
      case 'process':
        return universalFlowchartPrompt(input);
      case 'mindmap':
      case 'mind':
      case 'structure':
      case 'topic':
        return universalMindmapPrompt(input);
      case 'timeline':
      case 'time':
        return universalTimelinePrompt(input);
      case 'sequence':
      case 'interaction':
        return sequencePrompt(input, 'text');
      default:
        return universalMindmapPrompt(input);
    }
  }
  
  // Auto-detect best chart type
  const inputType = detectInputType(input);
  
  switch (inputType) {
    case 'code':
      return flowchartPrompt(input, 'javascript');
    case 'gantt':
      return ganttPrompt(input);
    case 'pie':
      return piePrompt(input);
    case 'quadrant':
      return quadrantPrompt(input);
    case 'journey':
      return journeyPrompt(input);
    case 'git':
      return gitPrompt(input);
    case 'state':
      return statePrompt(input);
    case 'class':
      return classPrompt(input);
    case 'process':
      return universalFlowchartPrompt(input);
    case 'timeline':
      return universalTimelinePrompt(input);
    case 'interaction':
      return sequencePrompt(input, 'text');
    case 'structure':
    case 'topic':
    default:
      return universalMindmapPrompt(input);
  }
};

// Original diagram prompt (keep for compatibility)
const diagramPrompt = (code, language = 'javascript', diagramType = 'sequence') => {
  switch (diagramType) {
    case 'sequence':
      return sequencePrompt(code, language);
    case 'class':
      return classPrompt(code, language);
    case 'state':
      return statePrompt(code, language);
    default:
      return sequencePrompt(code, language);
  }
};

module.exports = {
  // Original prompts (backward compatibility)
  flowchartPrompt,
  mindmapPrompt,
  textMindmapPrompt,
  diagramPrompt,
  sequencePrompt,
  
  // Enhanced universal prompts
  smartChartPrompt,
  universalFlowchartPrompt,
  universalMindmapPrompt,
  universalTimelinePrompt,
  detectInputType,
  
  // NEW: Specific chart type prompts
  ganttPrompt,
  piePrompt,
  quadrantPrompt,
  journeyPrompt,
  gitPrompt,
  statePrompt,
  classPrompt
};