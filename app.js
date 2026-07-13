/* app.js - GE Adoption Portal Application Logic and Database */

// Core Datastore - Comprehensive, Generalized Use Case Database (English defaults)
const useCasesDb = [
  // HUB 1: ACADEMIC PORTAL (Lecturers & TAs)
  {
    id: "socratic_tutor",
    title: "Socratic AI Tutor Agent Creation",
    category: "academic",
    summary: "Ground a custom course Agent in your lecture notes and syllabi to act as a 24/7 Socratic learning companion.",
    features: ["Agent Designer", "NotebookLM"],
    connectors: [],
    role: "Lecturer",
    level: ["University & College", "High School", "Generic"],
    steps: [
      "In NotebookLM, create a 'Read-Only Course Hub' and upload all syllabus documents, lecture slides, and key readings.",
      "Navigate to Gemini Enterprise Agent Designer and create a new Custom Agent. Name it '[Course Name] Coach'.",
      "Copy the Socratic persona instructions into the Agent prompt window and link the read-only NotebookLM hub in the data configuration.",
      "Test the Agent by asking basic syllabus questions (e.g. 'What is mitosis?') and ensuring it guides you to find the answer rather than directly giving it.",
      "Generate a shareable link for the Agent and post it prominently on your school LMS (Canvas, Moodle, etc.) for student access."
    ],
    prompt: `You are the '[Course Code] Coach,' a friendly and encouraging Socratic tutor for this course. Your sole objective is to guide students to find answers themselves.
Follow these rules strictly:
1. **Ground all your responses** in the provided course materials only.
2. When a student asks a question (e.g., 'What is the answer to question 3?'), do NOT give the direct answer. Instead, respond with a probing, contextual question that helps them think critically.
3. Reference specific files/pages in the course materials (e.g., 'Can you look at slide 4 of Lecture 2 and tell me what the first stage is called?').
4. If a student demonstrates correct understanding, praise them and provide a complete, rich explanation.
5. If asked about topics outside this course, politely decline, stating: 'I can only assist you with [Course Name] topics.'
6. Cite your sources for every answer.`,
    proTip: "By connecting NotebookLM as the grounding layer, you ensure the Agent never hallucinates answers, restricts responses to authorized curriculum text, and provides verified inline citations.",
    connectorGuide: null
  },
  {
    id: "rubric_grading",
    title: "Rubric-Aligned Essay Feedback Assistant",
    category: "academic",
    summary: "Analyze student essays against a complex grading rubric in NotebookLM and generate formative constructive feedback.",
    features: ["NotebookLM", "Canvas Mode"],
    connectors: [],
    role: "TA",
    level: ["Generic"],
    steps: [
      "Create a private, secure workspace in NotebookLM dedicated to the assignment.",
      "Upload the detailed grading rubric (PDF/Doc) and the assignment instructions as the primary source documents.",
      "Upload a student's submission (Word or PDF). To protect data privacy, strip student names or use anonymized IDs.",
      "Paste the rubric-alignment prompt in the chat. NotebookLM will review the essay against each rubric criterion.",
      "Review the generated feedback. Add your personal pedagogical insights and adjust the tone to maintain the critical 'human-in-the-loop' standard."
    ],
    prompt: `Acting as an expert academic teaching assistant, analyze the attached student essay against the uploaded grading rubric. Generate a first draft of constructive, high-quality feedback.
The feedback MUST adhere to the following structure:
1. **Rubric Performance Summary**: Provide a tentative level/score for each rubric criterion, directly referencing specific evidence from the student's submission.
2. **Key Strengths (1-2)**: Identify specific aspects of the paper that were executed exceptionally well, quoting 1-2 examples from the text.
3. **Areas for Growth (2-3)**: Identify specific logical, grammatical, or structural issues. Explain how they relate to the rubric requirements.
4. **Actionable Recommendations**: Provide 2-3 specific, progressive steps the student can take in their next draft to improve.
Maintain a supportive, pedagogical, and highly encouraging tone throughout.`,
    proTip: "Because NotebookLM operates in a secure cloud tenant, student intellectual property and data remain completely confidential and are never used to train public LLM models.",
    connectorGuide: null
  },
  {
    id: "curriculum_design",
    title: "Industry-Aligned Curriculum Architect",
    category: "academic",
    summary: "Conduct market research and analyze industry trends to design a comprehensive, modern course syllabus from scratch.",
    features: ["Deep Research", "Canvas Mode"],
    connectors: [],
    role: "Lecturer",
    level: ["University & College", "High School"],
    steps: [
      "Open Gemini Enterprise and launch a 'Deep Research' session targeting emerging skills in your course domain.",
      "Prompt the model to synthesize job market reports, professional certifications, and academic publications into core competency outcomes.",
      "Transfer the results to Canvas Mode to brainstorm the week-by-week syllabus content, recommended textbook readings, and project briefs.",
      "Co-create interactive grading rubrics directly inside Canvas Mode, then export the completed syllabus package to Google Docs."
    ],
    prompt: `Act as a senior instructional designer. I want to build a brand new, highly modern course syllabus for [Course Title].
Phase 1: Research. Search the web for the top 5 most in-demand technical and soft skills requested by employers in this field over the past 12 months.
Phase 2: Learning Outcomes. Design 5 measurable learning outcomes mapped directly to Bloom's Taxonomy based on these skills.
Phase 3: Syllabus Draft. Create a comprehensive 14-week topic outline, specifying major lecture themes, in-class active learning tasks, and project milestones.
Phase 4: Assessment. Propose a project-based grading framework that bypasses traditional exam formats in favor of authentic proof-of-work assignments.`,
    proTip: "Use Deep Research's capability to search hundreds of academic and corporate portals simultaneously, providing you with a high-fidelity summary report citing actual job-post statistics.",
    connectorGuide: null
  },
  {
    id: "lab_manual_creator",
    title: "Interactive Lab Guide & Safety Manual",
    category: "academic",
    summary: "Create student-facing lab manuals with step-by-step procedures, safety icons, and visual layout prompts in Canvas mode.",
    features: ["Canvas Mode", "Image Generation"],
    connectors: [],
    role: "TA",
    level: ["University & College", "High School"],
    steps: [
      "Open Gemini Enterprise Canvas Mode and outline the learning objectives for your chemistry or computer science lab session.",
      "Prompt the AI to write clear, step-by-step experimental procedures and corresponding safety hazard alerts.",
      "Use the 'Help me visualize' feature (Image Generation) to generate custom, clear illustrations of laboratory equipment layouts.",
      "Co-create a lab observation sheet table inside Canvas Mode and export the final guide as an interactive student worksheet."
    ],
    prompt: `You are a university biology lab coordinator. Write an engaging, student-facing lab guide for a 'DNA Extraction' experiment.
The document should include:
1. **Introduction**: A brief, captivating summary of the biological relevance of DNA extraction.
2. **Learning Objectives**: 3 clear outcomes.
3. **Safety First Box**: Explicit hazards, clothing requirements, and chemical disposal protocols.
4. **Step-by-step Procedure**: An easy-to-follow, numbered checklist of steps.
5. **Observation & Reflection Journal**: Propose a set of 3 thought-provoking prediction prompts and blank tables for students to record measurements.`,
    proTip: "Use bold text and alerts (e.g. [!CAUTION]) inside Canvas Mode to ensure safety steps stand out visually to prevent accidents during high-risk physical labs.",
    connectorGuide: null
  },

  // HUB 2: STUDENT CENTER (Students & Clubs)
  {
    id: "su_advocacy",
    title: "Student Feedback Sentiment Dashboard",
    category: "student",
    summary: "Consolidate massive volumes of unstructured student feedback from surveys and town halls to synthesize advocacy data.",
    features: ["NotebookLM", "Deep Research"],
    connectors: ["Drive Connector"],
    role: "Student",
    level: ["University & College", "High School", "Generic"],
    steps: [
      "Consolidate unstructured student feedback text files, town hall audio recordings, and survey responses in a folder.",
      "Ground a NotebookLM workspace directly on this folder using the secure Drive Connector.",
      "Query NotebookLM to extract the top 5 pressing student concerns (e.g., dining hours, library quiet spaces) and compute overall sentiment.",
      "Use Gemini in Google Docs to write a structured, data-driven advocacy proposal to submit to the school administration."
    ],
    prompt: `Acting as the Student Union Advocacy Director, analyze the uploaded collection of town hall transcripts and anonymous student survey comments.
Generate a comprehensive, evidence-based report that includes:
1. **Thematic Clustering**: Identify and group the top 5 most frequently complained-about campus issues.
2. **Sentiment Assessment**: For each issue, categorize the emotional tone (highly negative, frustrated, neutral) and extract 3 powerful, representative anonymized student quotes.
3. **Data-Driven Solutions**: Based on successful practices at benchmark peer schools, suggest 2 realistic, low-cost policy changes for each issue.
4. **Negotiation Preparation**: Draft a list of 5 anticipated objections from school deans regarding budget constraints, and provide persuasive, data-backed rebuttals.`,
    proTip: "Linking your student feedback database directly via the Drive Connector keeps the data federated, secure, and up-to-the-minute without copying local files.",
    connectorGuide: {
      name: "Drive Connector",
      steps: [
        "Go to Google Cloud Console > Gemini Enterprise > Data Connectors.",
        "Select the Drive Connector source.",
        "Provide your institution's access authorization credentials.",
        "Grant the necessary read permissions to your files and directories.",
        "Enable 'Federated Search' connection mode to respect live user access permissions without data ingestion."
      ]
    }
  },
  {
    id: "club_funding",
    title: "Annual Club Calendar & Budget Justifier",
    category: "student",
    summary: "Brainstorm an annual activities calendar and draft detailed, compliant student government funding proposals.",
    features: ["Canvas Mode", "NotebookLM"],
    connectors: ["Drive Connector"],
    role: "Student",
    level: ["University & College", "High School", "Generic"],
    steps: [
      "Open NotebookLM and upload your club's past event templates and the official Student Union funding guidelines.",
      "In Canvas Mode, prompt Gemini to brainstorm a calendar of 12 highly engaging club activities aligned with your club's core mission.",
      "Feed the calendar and past expense records from your shared Drive spreadsheet into the prompt to generate a formatted budget table.",
      "Ask Gemini to write a formal budget justification narrative, detailing how each event benefits the wider campus student community."
    ],
    prompt: `Act as a professional grant and proposal writer. Help our university [Club Name] draft a detailed funding proposal for the upcoming academic year.
Inputs:
- Annual activities calendar: [List of 4 major workshops, 1 public exhibition, 2 guest lectures, and 1 social event]
- Approved funding guidelines: [Max $200 per workshop, Max $500 for exhibition, strict food and beverage limits]
Task:
1. Create an **Executive Summary** detailing the club's mission and how these events boost student engagement.
2. Compile a detailed **Line-Item Budget Table**, calculating total costs and verifying compliance with the provided funding rules.
3. Write a compelling **Impact Statement** justifying why the Student Union should allocate resources to our club, detailing student outcomes.`,
    proTip: "Upload the Student Union's official constitutional funding guidelines to NotebookLM first. This prevents your proposal from getting rejected for violating obscure spend-limit policies.",
    connectorGuide: {
      name: "Drive Connector",
      steps: [
        "Select the Drive Connector in your enterprise storage console.",
        "Generate a client access key and add read permissions for secure file queries.",
        "In Gemini Enterprise settings, link your club’s shared Drive folder where past budget templates are kept.",
        "Activate the connector to allow live data queries during proposal creation."
      ]
    }
  },
  {
    id: "su_helpdesk",
    title: "24/7 Student Union Policy Agent",
    category: "student",
    summary: "Build an AI support bot trained on club policy handbooks to answer operational and venue booking questions.",
    features: ["Agent Designer", "NotebookLM"],
    connectors: ["Email Connector"],
    connectorEssential: false,
    role: "Student",
    level: ["University & College", "High School", "Generic"],
    steps: [
      "In NotebookLM, compile all Student Union club policies, room booking rules, and equipment reservation forms.",
      "Use Gemini Agent Designer to build a conversational agent named 'Student Union Support Assistant'.",
      "Connect the agent to the policy knowledge base to serve static queries.",
      "Test the agent's ability to handle complex queries (e.g. 'Can we book a room after 9 PM?').",
      "Embed the agent on the Student Union portal or social media page for 24/7 club leader support."
    ],
    advancedSteps: [
      "In NotebookLM, compile all Student Union club policies, room booking rules, and equipment reservation forms.",
      "Use Gemini Agent Designer to build a conversational agent named 'Student Union Support Assistant'.",
      "Connect the agent to the policy knowledge base and configure custom escalate-by-email instructions via the Email Connector.",
      "Test the agent's ability to automatically draft escalation messages.",
      "Embed the agent on the Student Union portal for automated, end-to-end integration."
    ],
    prompt: `You are the 'Student Union Support Assistant.' Your job is to help student club leaders navigate room booking, funding applications, and event risk forms.
1. **Ground your answers strictly** in the uploaded club handbooks. Never guess policies.
2. Provide direct, step-by-step instructions (e.g., 'To book the Student Common Room, follow these 3 steps...').
3. Cite the section number of the policy you are referencing.
4. If a query is highly complex, involves sensitive disputes, or requires manual human approval, provide a clear, pre-formatted draft escalation email on-screen for the user to copy and send manually to the Student Affairs Officer.
5. Maintain a professional, supportive, and efficient tone.`,
    advancedPrompt: `You are the 'Student Union Support Assistant' integrated with your Institutional Gmail. Your job is to help student club leaders navigate room booking, funding applications, and event risk forms.
1. **Ground your answers strictly** in the uploaded club handbooks. Never guess policies.
2. Provide direct, step-by-step instructions (e.g., 'To book the Student Common Room, follow these 3 steps...').
3. Cite the section number of the policy you are referencing.
4. If a query is highly complex or requires manual human approval, use your integrated Email Connector to automatically draft a detailed escalation email directly in the user's Gmail Drafts folder for the Student Affairs Officer, then notify the user that the draft is ready for review.
5. Maintain a professional, supportive, and efficient tone.`,
    proTip: "In Standalone mode, the agent provides pre-formatted drafts directly inside the chat window for easy copy-pasting.",
    advancedProTip: "By configuring the Email Connector, the agent can automatically draft escalation emails directly in your Gmail draft folder when manual intervention is needed.",
    connectorGuide: {
      name: "Email Connector",
      steps: [
        "Go to Google Cloud Console > Data Store > Select Email Connector as source.",
        "Enter your credentials and grant write-draft access permissions.",
        "Link the connector to the Student Union Support Agent.",
        "Set up an automated action to trigger drafts in Email whenever a student asks to escalate a booking dispute."
      ]
    }
  },
  {
    id: "visual_campaign",
    title: "Interactive Story Game & Visual Campaign",
    category: "student",
    summary: "Brainstorm and execute an immersive, gamified campus scavenger hunt with AI-generated riddles and visuals.",
    features: ["Agent Designer", "Image Generation", "Video Generation"],
    connectors: [],
    role: "Student",
    level: ["University & College", "High School"],
    steps: [
      "Open Gemini Enterprise and prompt the AI to co-create a branching story narrative for a campus Scavenger Hunt.",
      "Generate 5 cryptic, rhyming riddles that lead students to distinct physical campus landmarks.",
      "Use built-in image generation (Image Generation) to design futuristic checkpoint graphics and poster backgrounds.",
      "Script a 30-second promotional video using Video Generation assets to drive student sign-ups on social media.",
      "Configure a custom Agent that students must interact with at checkpoints to unlock clues."
    ],
    prompt: `You are the 'Gemini Gatekeeper' for a campus-wide Scavenger Hunt. Your role is to test student teams before giving them the next checkpoint clue.
1. **Game Narrative**: The theme is 'A Time-Traveler's Campus Tour'.
2. When a team approaches, welcome them enthusiastically and present Riddle #3.
3. Riddle: 'I hold thousands of voices but speak in absolute silence. I have four levels but no feet. Where am I?' (Answer: The Campus Library).
4. If the team submits the correct answer, congratulate them and generate a personalized digital badge (e.g. 'You have unlocked the Codex checkpoint!').
5. If they submit an incorrect answer, provide a small, mysterious clue without giving away the answer.
Never break character. Keep the tone playful, cryptic, and highly engaging.`,
    proTip: "Ground the riddle generation in university history or campus map documents to ensure riddles are location-accurate and achievable by students.",
    connectorGuide: null
  },

  // HUB 3: OPERATIONAL COMMAND (Education Leaders & IT)
  {
    id: "at_risk_cohort",
    title: "At-Risk Student Early Warning System",
    category: "operational",
    summary: "Connect Gemini to LMS and SIS database metrics to analyze engagement anomalies and flag struggling students.",
    features: ["Deep Research"],
    connectors: ["LMS Connector", "SIS Database Connector"],
    role: "IT Admin",
    level: ["Generic"],
    steps: [
      "Configure secure API connections from Gemini Enterprise to your school's LMS and SIS database.",
      "Set up an analytical data store containing anonymized student logs, login frequencies, quiz scores, and forum engagement metrics.",
      "Configure a secure workflow that maps data attributes, ensuring strict compliance with student data privacy laws like FERPA.",
      "Use Gemini to run multi-dimensional predictive modeling, highlighting student cohorts exhibiting a precipitous drop in engagement.",
      "Trigger automated, personalized advisor check-in drafts to provide timely academic support."
    ],
    prompt: `Analyze the attached anonymized LMS and Student Information System dataset for the current semester.
We want to identify students who are at risk of failing or dropping out before midterm exams.
Tasks:
1. **Anomaly Detection**: Flag all students who have shown a >50% drop in login frequency and quiz scores over the past 3 weeks compared to their baseline.
2. **Correlation Analysis**: Identify if there is a statistically significant correlation between forum participation rates and final assignment scores in this cohort.
3. **Draft Advisory Alerts**: For each flagged student category, generate a highly supportive, personalized academic check-in email draft from their advisor, suggesting tutoring resources.`,
    proTip: "Never upload student Names or Social Security numbers. Maintain rigorous compliance with privacy laws by utilizing fully de-identified student IDs during data store ingestion.",
    connectorGuide: {
      name: "LMS & SIS Database Connectors",
      steps: [
        "In Google Cloud Console, enable the Discovery Engine API.",
        "Create an authorized OAuth2 credentials profile for your LMS platform.",
        "Provide read-only API access endpoints for gradebook, enrollment, and activity logs.",
        "Establish an encrypted SQL database connection to the Student Information System (SIS).",
        "Set up data masking rules to de-identify student PII before it reaches the AI analysis layer."
      ]
    }
  },
  {
    id: "accreditation_reports",
    title: "Accreditation Self-Study Report Synthesizer",
    category: "operational",
    summary: "Synthesize years of course syllabi, student surveys, and meeting minutes to draft institutional accreditation reports.",
    features: ["NotebookLM", "Deep Research"],
    connectors: ["Drive Connector"],
    role: "Program Leader",
    level: ["University & College"],
    steps: [
      "Upload 3 years of school syllabi, assurance of learning rubrics, student exit surveys, and advisory board minutes to SharePoint.",
      "Establish a federated search connection from Gemini Enterprise to the Drive folder.",
      "In NotebookLM, prompt the model to cross-reference your curriculum data against specific accreditation standards.",
      "Generate structured, professional accreditation narrative drafts, complete with inline source evidence and citations.",
      "Review the drafts and collaborate with deans using shared Google Docs to finalize the institutional report."
    ],
    prompt: `You are an institutional research officer preparing a self-study report for a university business school accreditation.
Your task is to synthesize the uploaded student surveys, curriculum syllabi, and learning assessment records to draft the narrative for 'Standard 3: Assurance of Learning (AoL)'.
The narrative must include:
1. **Executive Summary**: A high-level overview of how the program measures and achieves learning goals.
2. **Methodology**: Explain the direct and indirect assessment tools used.
3. **Data Synthesis**: Analyze 3 years of quantitative data, highlighting key improvements in areas where learning caps were identified.
4. **Action Plan**: Outline a 2-year strategic plan for curriculum refinement, mapped directly to survey insights.
Maintain a highly formal, academic, and objective tone.`,
    proTip: "By selecting 'Federated Search' for the Drive Connector, your data remains safely stored within your institutional tenant, ensuring absolute data security and sovereignty.",
    connectorGuide: {
      name: "Drive Connector",
      steps: [
        "Create secure authorization rules specifically for the Drive Connector.",
        "Configure delegated API permissions for files and folders access.",
        "In Gemini Enterprise Console, create a new Data Store, select Drive as source, and provide credentials.",
        "Run an initial synchronization scan to verify all folder access rules are correctly honored."
      ]
    }
  },
  {
    id: "workforce_federation",
    title: "Workforce Identity Federation Setup Guide",
    category: "operational",
    summary: "Establish a secure trust relationship between Google Cloud and institutional identity providers for single sign-on authentication.",
    features: ["Deep Research"],
    connectors: ["Drive Connector"],
    role: "IT Admin",
    level: ["Generic"],
    steps: [
      "Register a new enterprise identity application on your centralized SSO portal.",
      "Configure SAML 2.0 or OIDC single sign-on settings and record the Metadata XML/Endpoints.",
      "In Google Cloud Console, navigate to IAM & Admin > Workforce Identity Federation and create a new workforce pool.",
      "Create an OIDC Provider linking your Google workforce pool to the identity provider's enterprise application.",
      "Configure Attribute Mapping, mapping 'google.subject' to the user's email and mapping security groups to 'google.groups'."
    ],
    prompt: `Act as a senior cloud solutions architect. Write a detailed, step-by-step technical implementation guide to set up Workforce Identity Federation (WIF) between Google Cloud and corporate identity systems.
The guide must cover:
1. **SSO Identity App Registration**: Mandatory configuration settings, single sign-on URL, and client secret management.
2. **GCP Workforce Pool Configuration**: CLI (gcloud) commands to create the pool and provider.
3. **Attribute Mapping Rules**: Precise Common Expression Language (CEL) syntax to map user groups and emails securely.
4. **Security Best Practices**: Best practices for secret rotation, federated role binding, and auditing logs.`,
    proTip: "Using OIDC with Authorization Code Flow is significantly more secure than SAML 2.0 for mobile environments and ensures smooth token exchanges during API calls.",
    connectorGuide: {
      name: "Workforce Identity Federated Single Sign-On",
      steps: [
        "Sign in to your centralized Identity Provider administrative center.",
        "Navigate to Applications > Register New Enterprise Application.",
        "Select OIDC client configurations and input authorization redirection rules.",
        "Set up single sign-on via SAML, adding the Google Cloud Workforce Provider ACS URL.",
        "Add claim mappings for user emails and directory groups to ensure Google IAM receives correct attributes."
      ]
    }
  },

  // HUB 4: ADMINISTRATIVE SUPPORT (Finance, Security, SAO)
  {
    id: "sao_scavenger_hunt",
    title: "Digital Cultural Fair Red Packet Game",
    category: "administrative",
    summary: "Orchestrate an interactive cultural trivia game on campus that distributes digital red packets and bookstore vouchers.",
    features: ["Agent Designer", "Image Generation"],
    connectors: [],
    role: "SAO",
    level: ["Generic"],
    steps: [
      "In Agent Designer, build a custom conversational Agent named 'Lunar New Year Assistant'.",
      "Upload short articles detailing cultural traditions, zodiac histories, and celebratory foods to the Agent's knowledge base.",
      "Use built-in image generation to design festive digital card templates and red envelope backgrounds.",
      "Program a simple randomizer script within your student portal that triggers small bookstore voucher codes.",
      "Have students interact with the Agent; answering cultural riddles correctly awards them a code."
    ],
    prompt: `You are the 'Lunar New Year Cultural Guide,' a festive, polite, and highly enthusiastic AI host for our digital university fair.
Your objective is to test students on Lunar New Year traditions and award them digital 'red packets' containing celebratory blessings.
1. Welcome the student warmly, wishing them prosperity.
2. Ask them 1 fun trivia question about Lunar New Year (e.g., 'What zodiac animal represents leadership and courage?').
3. If they answer correctly, celebrate their success and generate a beautiful, poetic blessing in the form of a classic Chinese couplet, customized to their stated wish (e.g., success in exams, finding good friends).
4. Direct them to copy the coupon code 'CNY-BOOKSTORE-10' to redeem a discount at the campus book shop.
5. If they answer incorrectly, explain the tradition gently and give them a second chance with a different question.`,
    proTip: "By connecting this Agent to your student portal, you can make the distribution of campus store vouchers gamified, educational, and highly engaging.",
    connectorGuide: null
  },
  {
    id: "finance_compliance",
    title: "Student Expense Compliance Auditor",
    category: "administrative",
    summary: "Automatically cross-reference student club purchase receipts and expense reports against school purchasing guidelines.",
    features: ["NotebookLM", "Deep Research"],
    connectors: ["Drive Connector"],
    role: "Finance",
    level: ["Generic"],
    steps: [
      "Upload all school purchasing guidelines, vendor policies, and standard accounting codes to a secure folder.",
      "Use the Drive Connector to ground your NotebookLM workspace in this policy archive.",
      "Upload a student club's submitted annual expense spreadsheet and digital PDF receipts.",
      "Prompt NotebookLM to cross-reference each expense item with the approved guidelines to verify compliance.",
      "Generate an automated compliance audit report, highlighting non-compliant spending and budget overruns."
    ],
    prompt: `Acting as an school financial auditor, conduct a compliance review of the attached student club expense report.
Compare each expense item with the uploaded university procurement guidelines.
Your audit report must highlight:
1. **Compliance Violations**: Identify any items that violate the policies (e.g., unapproved software subscriptions, exceeding maximum food limits per person). Cite the specific policy page.
2. **Accounting Code Verification**: Verify if correct accounting codes were applied to each expense category.
3. **Draft Advisory Memo**: Write a professional, polite advisory email to the club treasurer explaining the flagged violations and the steps required to resolve them.`,
    proTip: "This tool does not automate financial payouts, maintaining the strict 'human-in-the-loop' standard. It acts as an elite assistant that saves hours of manual policy cross-referencing.",
    connectorGuide: {
      name: "Drive Connector",
      steps: [
        "In Google Cloud, set up secure authorization to M365/Drive storages.",
        "Ground the Finance Assistant Agent in the procurement policy storage path.",
        "Activate federated access to ensure the AI can query guidelines but never saves student bank info or sensitive personal data."
      ]
    }
  },
  {
    id: "security_simulator",
    title: "Campus Safety Drill Simulator",
    category: "administrative",
    summary: "Simulate complex emergency response drills to train campus security marshals and test response protocols.",
    features: ["Agent Designer", "Video Generation"],
    connectors: ["Drive Connector"],
    role: "Security",
    level: ["Generic"],
    steps: [
      "Ground a custom Security Drill Agent in your campus safety handbook, building layouts, and emergency protocols.",
      "Configure the Agent to role-play as an Emergency Dispatcher during a simulated crisis scenario (e.g., power outage, severe storm).",
      "Generate high-fidelity instructional video clips and animated scenario prompts using Video Generation features.",
      "Have security staff interact with the simulator, typing real-time responses to evolving scenario prompts.",
      "Generate a post-simulation feedback report, assessing the staff's compliance with safety handbooks."
    ],
    prompt: `You are the 'Emergency Response Coordinator Simulator.' Your role is to guide campus security personnel through a high-stakes, real-time crisis drill.
Scenario: A severe typhoon has caused a localized power failure in the science laboratory building, and a critical backup generator has failed.
1. Present the scenario details clearly, including building floorplans and chemical storage risks.
2. Ask the user: 'What is your first priority protocol?'
3. Based on their input, evolve the scenario realistically (e.g., 'Correct, evacuation initiated. However, a laboratory TA reports one student is trapped in room 302...').
4. Grade their decisions strictly against the uploaded Campus Safety Handbook.
5. Provide detailed feedback, highlighting strengths and critical compliance gaps at the end of the simulation.`,
    proTip: "Use Video Generation tools to create short, 15-second simulation briefings. Visual prompts increase engagement and make the training feel incredibly realistic to staff.",
    connectorGuide: {
      name: "Drive Connector",
      steps: [
        "Ground the Security Agent in your locked, secure 'Crisis Management' directory path.",
        "Restrict access to authorized Security and Facilities personnel only, utilizing centralized SSO group bindings mapped in your Workforce Identity Pool."
      ]
    }
  }
];

// UI STATIC TRANSLATIONS (EN, zh-TW, zh-CN)
const uiTranslations = {
  en: {
    wizardTitle: "Google Gemini Enterprise",
    wizardSubtitle: "Education Adoption & Playbook Portal",
    wizardDesc: "Unlock specialized AI agent templates, prompt sandboxes, and administrative integration guides customized to your role and school level.",
    labelRole: "Identify Your Role",
    labelLevel: "Institution / School Level",
    labelLang: "Select Language / 選擇語言",
    btnStart: "Access My Adoption Hub",
    sidebarProfileTitle: "My Context Profile",
    sidebarConnectorsTitle: "Active GE Connectors",
    sidebarFeaturesTitle: "Filter by GE Feature",
    sidebarStatusTitle: "Integration Status",
    btnChangeContextText: "Switch Profile",
    allCapabilities: "All Capabilities",
    showAllCases: "Show All Cases",
    standardToolsOnly: "Standard Tools Only",
    integrationRequired: "Integration Required",
    inactiveAccessRestricted: "Inactive (Access Restricted)",
    linkedAndActive: "Linked and Active",
    linkConnector: "Link Connector",
    encryptedFederatedActive: "Encrypted Federated Search Active",
    operationalSteps: "Operational Steps & Workflow",
    promptSandbox: "Agent Prompt Sandbox",
    adoptionProTip: "Adoption Pro-Tip",
    overviewLabel: "Use Case Overview",
    enterpriseIntegrationLabel: "Enterprise Data Integration",
    copied: "Copied!",
    copyPrompt: "Copy Prompt",
    noUseCasesTitle: "No Use Cases Match Your Current Settings",
    noUseCasesDesc: "Try loosening your search query or enabling Google/M365 connectors in the active controller panel to unlock integration workflows.",
    btnResetFilters: "Clear Active Search",
    simulatedConnect: "Simulated Connect",
    profileSetSuccess: "Profile set successfully!",
    connectorLinkedSuccess: "connector linked. Card unlocked!",
    promptCopiedSuccess: "Prompt copied to clipboard!",
    levelHelperText: "Institution level is not applicable for support roles.",
    roles: {
      "Lecturer": "Lecturer / Educator",
      "TA": "Teaching Assistant (TA)",
      "Student": "Student / Club Leader",
      "Security": "Campus Security Officer",
      "Finance": "Financial Administrator",
      "IT Admin": "IT Administrator / SysAdmin",
      "SAO": "Student Affairs Officer (SAO)"
    },
    levels: {
      "Generic": "Generic (Cross-Level Adaptable)",
      "University & College": "University & College (Higher Edu)",
      "High School": "High School (Grades 6-12)",
      "Primary School": "Primary School (Grades K-5)"
    },
    hubs: {
      academic: "Academic Portal",
      student: "Student Center",
      operational: "Operational Command",
      administrative: "Administrative Support"
    },
    adminBrandText: "Admin Control",
    adminMenuNavigationTitle: "Menu Navigation",
    adminPortalTitle: "GEMINI EDUCATION MANAGEMENT",
    adminPortalSubtitle: "Configure users, update learning playbooks, and analyze the last 6 months deployment metrics.",
    adminTabUsersText: "Users Provisioning",
    adminTabAnalyticsText: "System Analytics",
    adminTabCasesText: "Use Cases CRUD",
    btnAdminBackToPortalText: "Learning Portal",
    btnAdminLogoutText: "Log Out"
  },
  "zh-TW": {
    wizardTitle: "Google Gemini Enterprise",
    wizardSubtitle: "Education Adoption & Playbook Portal",
    wizardDesc: "解鎖專為您的角色和學校級別定制的 AI Agent 模板、提示詞沙盒和管理集成指南。",
    labelRole: "確認您的角色",
    labelLevel: "學校 / 機構級別",
    labelLang: "選擇語言",
    btnStart: "進入我的導入中心",
    sidebarProfileTitle: "我的背景檔案",
    sidebarConnectorsTitle: "啟用中的 GE 連接器",
    sidebarFeaturesTitle: "按 GE 功能篩選",
    sidebarStatusTitle: "集成狀態",
    btnChangeContextText: "切換檔案",
    allCapabilities: "所有功能",
    showAllCases: "顯示所有案例",
    standardToolsOnly: "僅限標準工具",
    integrationRequired: "需要集成連線",
    inactiveAccessRestricted: "未啟用 (存取受限)",
    linkedAndActive: "已連結並啟用",
    linkConnector: "連結連接器",
    encryptedFederatedActive: "加密聯邦搜尋已啟用",
    operationalSteps: "操作步驟與工作流程",
    promptSandbox: "Agent 提示詞沙盒",
    adoptionProTip: "導入心法",
    overviewLabel: "使用案例概述",
    enterpriseIntegrationLabel: "企業數據集成",
    copied: "已複製！",
    copyPrompt: "複製提示詞",
    noUseCasesTitle: "無符合當前設定的使用案例",
    noUseCasesDesc: "請嘗試放寬搜尋關鍵字，或在控制面板中啟用連接器以解鎖集成工作流程。",
    btnResetFilters: "清除搜尋",
    simulatedConnect: "模擬連線",
    profileSetSuccess: "設定檔更新成功！",
    connectorLinkedSuccess: "連接器已連結，卡片已解鎖！",
    promptCopiedSuccess: "提示詞已複製到剪貼簿！",
    levelHelperText: "行政與支援角色不需選擇學校級別。",
    roles: {
      "Lecturer": "講師 / 教育工作者",
      "TA": "助教 (TA)",
      "Student": "學生 / 社團幹部",
      "Security": "校園安全官",
      "Finance": "財務管理員",
      "IT Admin": "IT 系統管理員",
      "SAO": "學生事務官 (SAO)"
    },
    levels: {
      "Generic": "通用 (跨級別適用)",
      "University & College": "大學與大專院校 (高等教育)",
      "High School": "中學 (6-12 年級)",
      "Primary School": "小學 (K-5 年級)"
    },
    hubs: {
      academic: "學術教學門戶 (Academic Portal)",
      student: "學生與社團中心 (Student Center)",
      operational: "運營管理指揮 (Operational Command)",
      administrative: "行政支援與安全 (Administrative Support)"
    },
    adminBrandText: "管理者控制台",
    adminMenuNavigationTitle: "選單導覽",
    adminPortalTitle: "GEMINI 教育管理控制台",
    adminPortalSubtitle: "配置帳號權限、維護學習案例，並分析近 6 個月的導入統計數據。",
    adminTabUsersText: "帳號帳戶管理",
    adminTabAnalyticsText: "系統數據分析",
    adminTabCasesText: "案例內容維護",
    btnAdminBackToPortalText: "返回學習中心",
    btnAdminLogoutText: "登出系統"
  },
  "zh-CN": {
    wizardTitle: "Google Gemini Enterprise",
    wizardSubtitle: "Education Adoption & Playbook Portal",
    wizardDesc: "解锁专为您的角色和学校级别定制的 AI Agent 模板、提示词沙箱和管理集成指南。",
    labelRole: "确认您的角色",
    labelLevel: "学校 / 机构级别",
    labelLang: "选择语言",
    btnStart: "进入我的导入中心",
    sidebarProfileTitle: "我的背景档案",
    sidebarConnectorsTitle: "启用中的 GE 连接器",
    sidebarFeaturesTitle: "按 GE 功能筛选",
    sidebarStatusTitle: "集成状态",
    btnChangeContextText: "切换档案",
    allCapabilities: "所有功能",
    showAllCases: "显示所有案例",
    standardToolsOnly: "仅限标准工具",
    integrationRequired: "需要集成连线",
    inactiveAccessRestricted: "未启用 (访问受限)",
    linkedAndActive: "已链接并启用",
    linkConnector: "链接连接器",
    encryptedFederatedActive: "加密联邦搜索已启用",
    operationalSteps: "操作步骤与工作流程",
    promptSandbox: "Agent 提示词沙箱",
    adoptionProTip: "导入心法",
    overviewLabel: "使用案例概述",
    enterpriseIntegrationLabel: "企业数据集成",
    copied: "已复制！",
    copyPrompt: "复制提示词",
    noUseCasesTitle: "无符合当前设置的使用案例",
    noUseCasesDesc: "请尝试放宽搜索关键字，或在控制面板中启用连接器以解锁集成工作流。",
    btnResetFilters: "清除搜索",
    simulatedConnect: "模拟连线",
    profileSetSuccess: "档案设置成功！",
    connectorLinkedSuccess: "连接器已链接，卡片已解锁！",
    promptCopiedSuccess: "提示词已复制到剪贴簿！",
    levelHelperText: "行政与支持角色不需要选择学校级别。",
    roles: {
      "Lecturer": "讲师 / 教育工作者",
      "TA": "助教 (TA)",
      "Student": "学生 / 社团干部",
      "Security": "校园安全官",
      "Finance": "财务管理员",
      "IT Admin": "IT 系统管理员",
      "SAO": "学生事务官 (SAO)"
    },
    levels: {
      "Generic": "通用 (跨级别适用)",
      "University & College": "大学与大专院校 (高等教育)",
      "中学": "中学 (6-12 年级)",
      "High School": "中学 (6-12 年级)",
      "Primary School": "小学 (K-5 年级)"
    },
    hubs: {
      academic: "学术教学门户 (Academic Portal)",
      student: "学生与社团中心 (Student Center)",
      operational: "运营管理指挥 (Operational Command)",
      administrative: "行政支持与安全 (Administrative Support)"
    },
    adminBrandText: "管理者控制台",
    adminMenuNavigationTitle: "菜单导航",
    adminPortalTitle: "GEMINI 教育管理控制台",
    adminPortalSubtitle: "配置账号权限、维护学习案例，并分析近 6 个月的导入统计数据。",
    adminTabUsersText: "账号账户管理",
    adminTabAnalyticsText: "系统数据分析",
    adminTabCasesText: "案例内容维护",
    btnAdminBackToPortalText: "返回学习中心",
    btnAdminLogoutText: "登出系统"
  }
};

// DYNAMIC USE CASE CONTENT TRANSLATIONS
const useCasesTranslations = {
  socratic_tutor: {
    "en": {
      title: "Socratic AI Tutor Agent Creation",
      summary: "Ground a custom course Agent in your lecture notes and syllabi to act as a 24/7 Socratic learning companion.",
      steps: [
        "In NotebookLM, create a 'Read-Only Course Hub' and upload all syllabus documents, lecture slides, and key readings.",
        "Navigate to Gemini Enterprise Agent Designer and create a new Custom Agent. Name it '[Course Name] Coach'.",
        "Copy the Socratic persona instructions into the Agent prompt window and link the read-only NotebookLM hub in the data configuration.",
        "Test the Agent by asking basic syllabus questions (e.g. 'What is mitosis?') and ensuring it guides you to find the answer rather than directly giving it.",
        "Generate a shareable link for the Agent and post it prominently on your school LMS (Canvas, Moodle, etc.) for student access."
      ],
      prompt: `You are the '[Course Code] Coach,' a friendly and encouraging Socratic tutor for this course. Your sole objective is to guide students to find answers themselves.
Follow these rules strictly:
1. **Ground all your responses** in the provided course materials only.
2. When a student asks a question (e.g., 'What is the answer to question 3?'), do NOT give the direct answer. Instead, respond with a probing, contextual question that helps them think critically.
3. Reference specific files/pages in the course materials (e.g., 'Can you look at slide 4 of Lecture 2 and tell me what the first stage is called?').
4. If a student demonstrates correct understanding, praise them and provide a complete, rich explanation.
5. If asked about topics outside this course, politely decline, stating: 'I can only assist you with [Course Name] topics.'
6. Cite your sources for every answer.`,
      proTip: "By connecting NotebookLM as the grounding layer, you ensure the Agent never hallucinates answers, restricts responses to authorized curriculum text, and provides verified inline citations."
    },
    "zh-TW": {
      title: "Socratic AI Tutor Agent 創建",
      summary: "將客製化的課程 Agent 植基於您的授課筆記與教學大綱，打造 24/7 的 Socratic 學習導師。",
      steps: [
        "在 NotebookLM 中，建立一個「唯讀課程中心」，並上傳所有教學大綱、講義投影片及重要讀物。",
        "進入 Gemini Enterprise Agent Designer 並新建一個 Custom Agent。命名為「[Course Name] Coach」。",
        "將 Socratic 角色特徵指令複製到 Agent 提示詞視窗，並於數據設定中連結唯讀的 NotebookLM 課程中心。",
        "藉由詢問教學大綱中的基本問題（例如：「什麼是細胞分裂？」）來測試 Agent，確保它扮演引導角色，而非直接給出答案。",
        "產生該 Agent 的公開分享連結，並置頂張貼於學校的 LMS（Canvas、Moodle 等），供學生隨時存取。"
      ],
      prompt: `你是一位親切且循循善誘的 Socratic 學習導師。你的唯一目標是引導學生靠自己找到問題的答案。
請嚴格遵守以下準則：
1. **所有回答均須植基於**提供的課程教材中，絕不可編造。
2. 當學生問及特定答案時，不要直接告知。請回覆一個具探究性、情境式的反問，幫助他們進行批判性思考。
3. 具體指出課程材料中的文件或頁數（例如：「你可以參考 Lecture 2 的第 4 張投影片，然後告訴我第一個階段叫什麼名字嗎？」）。
4. 當學生展現正確的理解時，給予肯定並提供完整、豐富的補充說明。
5. 若問及本課程以外的主題，請禮貌地拒絕並回答：「我只能協助你解答關於 [Course Name] 的問題。」
6. 每次回答皆須引用出處。`,
      proTip: "連結 NotebookLM 作為知識地基，可確保 Agent 絕不胡言亂語（Hallucinate），且其所有答覆均受限於核准的教材，並提供真實可信的內文引用。"
    },
    "zh-CN": {
      title: "Socratic AI Tutor Agent 创建",
      summary: "将定制的课程 Agent 植基于您的授课笔记与教学大纲，打造 24/7 的 Socratic 学习导师。",
      steps: [
        "在 NotebookLM 中，创建一个“只读课程中心”，并上传所有教学大纲、讲义幻灯片及重要读物。",
        "进入 Gemini Enterprise Agent Designer 并新建一个 Custom Agent。命名为“[Course Name] Coach”。",
        "将 Socratic 角色特征指令复制到 Agent 提示词窗口，并在数据设置中链接只读的 NotebookLM 课程中心。",
        "通过询问教学大纲中的基本问题（例如：“什么是细胞分裂？”）来测试 Agent，确保它扮演引导角色，而非直接给出答案。",
        "生成该 Agent 的公开分享链接，并置顶张贴于学校的 LMS（Canvas、Moodle 等），供学生随时访问。"
      ],
      prompt: `你是一位亲切且循循善诱的 Socratic 学习导师。你的唯一目标是引导学生靠自己找到问题的答案。
请严格遵守以下准则：
1. **所有回答均须植基于**提供的课程教材中，绝不可编造。
2. 当学生问及特定答案时，不要直接告知。请回复一个具探究性、情境式的反问，帮助他们进行批判性思考。
3. 具体指出课程材料中的文件或页数（例如：“你可以参考 Lecture 2 的第 4 张幻灯片，然后告诉我第一个阶段叫什么名字吗？”）。
4. 当学生展现正确的理解时，给予肯定并提供完整、丰富 pale 的补充说明。
5. 若问及本课程以外的主题，请礼貌地拒绝并回答：“我只能协助你解答关于 [Course Name] 的问题。”
6. 每次回答皆须引用出处。`,
      proTip: "链接 NotebookLM 作为知识地基，可确保 Agent 绝不胡言乱语（Hallucinate），且其所有答复均受限于核准的教材，并提供真实可信的内文引用。"
    }
  },
  rubric_grading: {
    "en": {
      title: "Rubric-Aligned Essay Feedback Assistant",
      summary: "Analyze student essays against a complex grading rubric in NotebookLM and generate formative constructive feedback.",
      steps: [
        "Create a private, secure workspace in NotebookLM dedicated to the assignment.",
        "Upload the detailed grading rubric (PDF/Doc) and the assignment instructions as the primary source documents.",
        "Upload a student's submission (Word or PDF). To protect data privacy, strip student names or use anonymized IDs.",
        "Paste the rubric-alignment prompt in the chat. NotebookLM will review the essay against each rubric criterion.",
        "Review the generated feedback. Add your personal pedagogical insights and adjust the tone to maintain the critical 'human-in-the-loop' standard."
      ],
      prompt: `Acting as an expert academic teaching assistant, analyze the attached student essay against the uploaded grading rubric. Generate a first draft of constructive, high-quality feedback.
The feedback MUST adhere to the following structure:
1. **Rubric Performance Summary**: Provide a tentative level/score for each rubric criterion, directly referencing specific evidence from the student's submission.
2. **Key Strengths (1-2)**: Identify specific aspects of the paper that were executed exceptionally well, quoting 1-2 examples from the text.
3. **Areas for Growth (2-3)**: Identify specific logical, grammatical, or structural issues. Explain how they relate to the rubric requirements.
4. **Actionable Recommendations**: Provide 2-3 specific, progressive steps the student can take in their next draft to improve.
Maintain a supportive, pedagogical, and highly encouraging tone throughout.`,
      proTip: "Because NotebookLM operates in a secure cloud tenant, student intellectual property and data remain completely confidential and are never used to train public LLM models."
    },
    "zh-TW": {
      title: "符合評分規準的作文回饋助手",
      summary: "在 NotebookLM 中根據複雜的評分規準分析學生作文，並生成具建設性的形成性評語。",
      steps: [
        "在 NotebookLM 中建立一個專屬於此作業的私密安全工作空間。",
        "將詳細的評分規準 (Rubric) PDF/Word 檔和作業說明上傳為主要的資料來源文件。",
        "上傳學生的作文。為了保護個人隱私，請預先隱去學生真實姓名，改用匿名 ID 代替。",
        "將評分對齊提示詞貼入對話視窗。NotebookLM 將根據每個評分指標逐項審查作文內容。",
        "審查生成的回饋。加入您的教學洞察並調整語氣，以維持教學上關鍵的「人機協同 (Human-in-the-loop)」原則。",
        "產生該 Agent 的公開分享連結，並置頂張貼於學校的 LMS（Canvas、Moodle 等），供學生隨時存取。"
      ],
      prompt: `請扮演專業的大專院校教學助理。針對上傳的學生作文，依據提供的評分規準進行分析。請起草一份高質量的建設性教學回饋。
回饋內容必須遵循以下結構：
1. **評分規準表現摘要**：提供作業各項指標的建議得分或表現等級，並引述作文中的具體細節作為評分證據。
2. **核心優勢 (1-2點)**：指出寫作中表現特別出色的方面，並引用1-2處原文。
3. **改進空間 (2-3點)**：明確點出邏輯、語法或結構上的具體問題，並解釋這些問題如何影響其評分。
4. **具體行動建議**：提供2-3個具體且漸進的步驟，指引學生如何在下一版草稿中進行修改與提升。
通篇請保持溫和、正面且富有教育引導意義的語氣。`,
      proTip: "由於 NotebookLM 運作於安全的雲端企業租戶中，學生的智慧財產權與個人隱私數據將得到完全保密，絕不會被用於訓練公開的大型語言模型。"
    },
    "zh-CN": {
      title: "符合评分规准的作文反馈助手",
      summary: "在 NotebookLM 中根据复杂的评分规准分析学生作文，并生成具建设性的形成性评语。",
      steps: [
        "在 NotebookLM 中创建一个专属于此作业的私密安全空间。",
        "将详细的评分规准 (Rubric) PDF/Word 档和作业说明上传为主要的资料来源文件。",
        "上传学生的作文。为了保护个人隐私，请预先隐去学生真实姓名，改用匿名 ID 代替。",
        "将评分对齐提示词贴入对话窗口。NotebookLM 将根据每个评分指标逐项审查作文内容。",
        "审查生成的反馈。加入您的教学洞察并调整语气，以维持教学上关键的“人机协同 (Human-in-the-loop)”原则。"
      ],
      prompt: `请扮演专业的大专院校教学助理。针对上传的学生作文，依据提供的评分规准进行分析。请起草一份高质量的建设性教学反馈。
反馈内容必须遵循以下结构：
1. **评分规准表现摘要**：提供作业各项指标的建议得分或表现等级，并引述作文中的具体细节作为评分证据。
2. **核心优势 (1-2点)**：指出写作中表现特别出色的方面，并引用1-2处原文。
3. **改进空间 (2-3点)**：明确点出逻辑、语法或结构上的具体问题，并解释这些问题如何影响其评分。
4. **具体行动建议**：提供2-3个具体且渐进的步骤，指引学生如何在下一版草稿中进行修改与提升。
通篇请保持温和、正面且富有教育引导意义的语气。`,
      proTip: "由于 NotebookLM 运作于安全的云端企业租户中，学生的知识产权与个人隐私数据将得到完全保密，绝不会被用于训练公开的大型语言模型。"
    }
  },
  curriculum_design: {
    "en": {
      title: "Industry-Aligned Curriculum Architect",
      summary: "Conduct market research and analyze industry trends to design a comprehensive, modern course syllabus from scratch.",
      steps: [
        "Open Gemini Enterprise and launch a 'Deep Research' session targeting emerging skills in your course domain.",
        "Prompt the model to synthesize job market reports, professional certifications, and academic publications into core competency outcomes.",
        "Transfer the results to Canvas Mode to brainstorm the week-by-week syllabus content, recommended textbook readings, and project briefs.",
        "Co-create interactive grading rubrics directly inside Canvas Mode, then export the completed syllabus package to Google Docs."
      ],
      prompt: `Act as a senior instructional designer. I want to build a brand new, highly modern course syllabus for [Course Title].
Phase 1: Research. Search the web for the top 5 most in-demand technical and soft skills requested by employers in this field over the past 12 months.
Phase 2: Learning Outcomes. Design 5 measurable learning outcomes mapped directly to Bloom's Taxonomy based on these skills.
Phase 3: Syllabus Draft. Create a comprehensive 14-week topic outline, specifying major lecture themes, in-class active learning tasks, and project milestones.
Phase 4: Assessment. Propose a project-based grading framework that bypasses traditional exam formats in favor of authentic proof-of-work assignments.`,
      proTip: "Use Deep Research's capability to search hundreds of academic and corporate portals simultaneously, providing you with a high-fidelity summary report citing actual job-post statistics."
    },
    "zh-TW": {
      title: "產業對齊課程架構師",
      summary: "進行市場調研並分析產業趨勢，從零開始設計出一套全面、現代化的課程大綱。",
      steps: [
        "開啟 Gemini Enterprise，啟動一個針對您學科領域內新興技能的 'Deep Research'（深度研究）對話。",
        "指示模型綜合就業市場報告、專業證照指標及學術期刊，歸納出核心專業能力指標。",
        "將調研結果匯入 Canvas Mode（畫布模式），共同腦力激盪出每週授課主題、推薦教科書章節與專案任務書。",
        "直接在 Canvas Mode 中協同設計互動式評分規準，隨後將完成的整套教學大綱方案導出至 Google Docs。"
      ],
      prompt: `請扮演資深課程設計專家。我想為 [Course Title] 打造一套全新的、符合產業前沿的教學大綱。
第一階段：深度調研。請搜尋網頁，總結過去12個月內該學術領域雇主最常要求的前5大技術與軟實力。
第二階段：學習成效。依據這些需求，設計5項直接對齊布魯姆認知分類（Bloom's Taxonomy）的可量化學習成效。
第三階段：教學大綱草案。規劃一個完整的14週主題大綱，詳細列出每週講授重點、課堂主動學習任務與專案里程碑。
第四階段：成效評估。提出一個專案導向的評估架構，以實作證明（Proof of work）代替傳統筆試。`,
      proTip: "善用 Deep Research 同步檢索數百個學術與產業入口網站的能力，為您提供包含真實徵才統計數據的高保真綜合摘要報告。"
    },
    "zh-CN": {
      title: "产业对齐课程架构师",
      summary: "进行市场调研并分析产业趋势，从零开始设计出一套全面、现代化的课程大纲。",
      steps: [
        "开启 Gemini Enterprise，启动一个针对您学科领域内新兴技能的 'Deep Research'（深度研究）对话。",
        "指示模型综合就业市场报告、专业证照指标及学术期刊，归纳出核心专业能力指标。",
        "将调研结果汇入 Canvas Mode（画布模式），共同脑力激荡出每周授课主题、推荐教科书章节与专案任务书。",
        "直接在 Canvas Mode 中协同设计互动式评分规准，随后将完成的整套教学大纲方案导出至 Google Docs。"
      ],
      prompt: `请扮演资深课程设计专家。我想为 [Course Title] 打造一套全新的、符合产业前沿的教学大纲。
第一阶段：深度调研。请搜索网页，总结过去12个月内该学术领域雇主最常要求的前5大技术与软实力。
第二阶段：学习成效。依据这些需求，设计5项直接对齐布鲁姆认知分类（Bloom's Taxonomy）的可量化学习成效。
第三阶段：教学大纲草案。规划一个完整的14周主题大纲，详细列出每周讲授重点、课堂主动学习任务与专案里程碑。
第四阶段：成效评估。提出一个专案导向的评估架构，以实作证明（Proof of work）代替传统笔试。`,
      proTip: "善用 Deep Research 同步检索数百个学术与产业入口网站的能力，为您提供包含真实征才统计数据的高保真综合摘要报告。"
    }
  },
  lab_manual_creator: {
    "en": {
      title: "Interactive Lab Guide & Safety Manual",
      summary: "Create student-facing lab manuals with step-by-step procedures, safety icons, and visual layout prompts in Canvas mode.",
      steps: [
        "Open Gemini Enterprise Canvas Mode and outline the learning objectives for your chemistry or computer science lab session.",
        "Prompt the AI to write clear, step-by-step experimental procedures and corresponding safety hazard alerts.",
        "Use the 'Help me visualize' feature (Image Generation) to generate custom, clear illustrations of laboratory equipment layouts.",
        "Co-create a lab observation sheet table inside Canvas Mode and export the final guide as an interactive student worksheet."
      ],
      prompt: `You are a university biology lab coordinator. Write an engaging, student-facing lab guide for a 'DNA Extraction' experiment.
The document should include:
1. **Introduction**: A brief, captivating summary of the biological relevance of DNA extraction.
2. **Learning Objectives**: 3 clear outcomes.
3. **Safety First Box**: Explicit hazards, clothing requirements, and chemical disposal protocols.
4. **Step-by-step Procedure**: An easy-to-follow, numbered checklist of steps.
5. **Observation & Reflection Journal**: Propose a set of 3 thought-provoking prediction prompts and blank tables for students to record measurements.`,
      proTip: "Use bold text and alerts (e.g. [!CAUTION]) inside Canvas Mode to ensure safety steps stand out visually to prevent accidents during high-risk physical labs."
    },
    "zh-TW": {
      title: "互動式實驗指南與安全手冊",
      summary: "利用 Canvas Mode 建立包含步驟程序、安全圖示與實驗配置圖的互動式實驗指南。",
      steps: [
        "開啟 Gemini Enterprise Canvas Mode，勾勒出本次化學或資訊工程實驗課的學習目標。",
        "引導 AI 撰寫清晰詳盡、條理分明的實驗操作步驟，並在關鍵處加上安全警示圖示。",
        "使用內建的「幫我可視化」功能（Image Generation），生成精確的實驗儀器排布與管線連接示意圖。",
        "在 Canvas Mode 中協同設計實驗觀察記錄表，最後將完整的實驗手冊導出為互動式學生學習單。"
      ],
      prompt: `你是一位大學生物實驗協調員。請為「DNA 提取實驗」撰寫一份引人入勝、面向學生的實驗手冊。
文件內容必須包含：
1. **實驗引言**：簡短而有趣的說明 DNA 提取在現代生物學中的重要性。
2. **學習目標**：3項明確的學習成效。
3. **安全防護須知**：列出潛在危害、穿著規定（護目鏡/手套）及化學廢棄物處置流程。
4. **實驗操作指南**：使用編號列表，設計出易於操作的防呆步驟。
5. **觀察與反思日誌**：提供3個啟發性的結果預測引導問題，以及空白的實驗記錄表格。`,
      proTip: "在 Canvas Mode 中善用粗體字與警示區塊（如 [!CAUTION]），可使安全操作程序在視覺上極為突出，有效預防實體實驗中的操作安全事故。"
    },
    "zh-CN": {
      title: "互动式实验指南与安全手册",
      summary: "利用 Canvas Mode 建立包含步骤程序、安全图示与实验配置图的互动式实验指南。",
      steps: [
        "开启 Gemini Enterprise Canvas Mode，勾勒出本次化学或信息工程实验课的学习目标。",
        "引导 AI 撰写清晰详尽、条理分明的实验操作步骤，并在关键处加上安全警示图示。",
        "使用内建的“帮我可视化”功能（Image Generation），生成精确的实验仪器排布与管线连接示意图。",
        "在 Canvas Mode 中协同设计实验观察记录表，最后将完整的实验手册导出为互动式学生学习单。"
      ],
      prompt: `你是一位大学生物实验协调员。请为“DNA 提取实验”撰写一份引人入胜、面向学生的实验手册。
文件内容必须包含：
1. **实验引言**：简短而有趣的说明 DNA 提取在现代生物学中的重要性。
2. **学习目标**：3项明确的学习成效。
3. **安全防护须知**：列出潜在危害、穿着规定（护目镜/手套）及化学废弃物处置流程。
4. **实验操作指南**：使用编号列表，设计出易于操作的防呆步骤。
5. **观察与反思日志**：提供3个启发性的结果预测引导问题，以及空白的实验记录表格。`,
      proTip: "在 Canvas Mode 中善用粗体字与警示区块（如 [!CAUTION]），可使安全操作程序在视觉上极为突出，有效预防实体实验中的操作安全事故。"
    }
  },
  su_advocacy: {
    "en": {
      title: "Student Feedback Sentiment Dashboard",
      summary: "Consolidate massive volumes of unstructured student feedback from surveys and town halls to synthesize advocacy data.",
      steps: [
        "Consolidate unstructured student feedback text files, town hall audio recordings, and survey responses in a folder.",
        "Ground a NotebookLM workspace directly on this folder using the secure Drive Connector.",
        "Query NotebookLM to extract the top 5 pressing student concerns (e.g., dining hours, library quiet spaces) and compute overall sentiment.",
        "Use Gemini in Google Docs to write a structured, data-driven advocacy proposal to submit to the school administration."
      ],
      prompt: `Acting as the Student Union Advocacy Director, analyze the uploaded collection of town hall transcripts and anonymous student survey comments.
Generate a comprehensive, evidence-based report that includes:
1. **Thematic Clustering**: Identify and group the top 5 most frequently complained-about campus issues.
2. **Sentiment Assessment**: For each issue, categorize the emotional tone (highly negative, frustrated, neutral) and extract 3 powerful, representative anonymized student quotes.
3. **Data-Driven Solutions**: Based on successful practices at benchmark peer schools, suggest 2 realistic, low-cost policy changes for each issue.
4. **Negotiation Preparation**: Draft a list of 5 anticipated objections from school deans regarding budget constraints, and provide persuasive, data-backed rebuttals.`,
      proTip: "Linking your student feedback database directly via the Drive Connector keeps the data federated, secure, and up-to-the-minute without copying local files."
    },
    "zh-TW": {
      title: "學生回饋情感分析儀表板",
      summary: "整合問卷與公聽會等海量非結構化學生回饋，轉化為具數據說服力的權益倡議提案。",
      steps: [
        "將非結構化的學生意見純文字、公聽會錄音檔和問卷回饋整合在同一個雲端資料夾中。",
        "藉由安全的 Drive Connector 將 NotebookLM 工作空間直接連接至此資料夾。",
        "向 NotebookLM 提問，提煉出前 5 大最受學生關注的痛點（如食堂營業時間、圖書館自習區），並計算整體情感傾向。",
        "在 Google Docs 中使用 Gemini 編寫結構嚴謹、數據支持的權益倡議書，提交給學校行政層級。"
      ],
      prompt: `請扮演學生會權益倡議長。請針對上傳的公聽會會議記錄和匿名問卷意見進行全面分析。
起草一份結構完整的數據導向倡議報告，包含以下部分：
1. **核心主題歸類**：識別並歸納出排名前 5 大最常被反映的校園生活痛點。
2. **情感傾向評估**：針對每項痛點評估學生的沮喪/憤怒程度，並摘錄3條具代表性且完全匿名的學生原話。
3. **標竿解決方案**：借鑑其他同級標竿學校的成功做法，針對每項痛點提出2個可行且低成本的具體政策改善建議。
4. **協商抗辯準備**：列出 5 個學校行政主管可能會提出的反對理由（如預算不足、人力吃緊），並寫出有數據說服力的駁斥論點。`,
      proTip: "透過 Drive Connector 直接連結學生回饋資料夾，可讓分析過程完全符合權限安全機制，無需在本地儲存重複檔案即可讀取最新意見。"
    },
    "zh-CN": {
      title: "学生反馈情感分析仪表板",
      summary: "整合问卷与公听会等海量非结构化学生反馈，转化为具数据说服力的权益倡议提案。",
      steps: [
        "将非结构化的学生意见纯文字、公听会录音档和问卷反馈整合在同一个云端文件夹中。",
        "借由安全的 Drive Connector 将 NotebookLM 工作空间直接连接至此文件夹。",
        "向 NotebookLM 提问，提炼出前 5 大最受学生关注的痛点（如食堂营业时间、图书馆自习区），并计算整体情感倾向。",
        "在 Google Docs 中使用 Gemini 编写结构严谨、数据支持的权益倡议书，提交给学校行政层级。"
      ],
      prompt: `请扮演学生会权益倡议长。请针对上传的公听会会议记录和匿名问卷意见进行全面分析。
起草一份结构完整的数据导向倡议报告，包含以下部分：
1. **核心主题归类**：识别并归纳出排名前 5 大最常被反映的校园生活痛点。
2. **情感倾向评估**：针对每项痛点评估学生的沮丧/愤怒程度，并摘录3条具代表性且完全匿名的学生原话。
3. **标杆解决方案**：借鉴其他同级标杆学校的成功做法，针对每项痛点提出2个可行且低成本的具体政策改善建议。
4. **协商抗辩准备**：列出 5 个学校行政主管可能会提出的反对理由（如预算不足、人力吃紧），并写出有数据说服力的驳斥论点。`,
      proTip: "通过 Drive Connector 直接链接学生反馈文件夹，可让分析过程完全符合权限安全机制，无需在本地存储重复文件即可读取最新意见。"
    }
  },
  club_funding: {
    "en": {
      title: "Annual Club Calendar & Budget Justifier",
      summary: "Brainstorm an annual activities calendar and draft detailed, compliant student government funding proposals.",
      steps: [
        "Open NotebookLM and upload your club's past event templates and the official Student Union funding guidelines.",
        "In Canvas Mode, prompt Gemini to brainstorm a calendar of 12 highly engaging club activities aligned with your club's core mission.",
        "Feed the calendar and past expense records from your shared Drive spreadsheet into the prompt to generate a formatted budget table.",
        "Ask Gemini to write a formal budget justification narrative, detailing how each event benefits the wider campus student community."
      ],
      prompt: `Act as a professional grant and proposal writer. Help our university [Club Name] draft a detailed funding proposal for the upcoming academic year.
Inputs:
- Annual activities calendar: [List of 4 major workshops, 1 public exhibition, 2 guest lectures, and 1 social event]
- Approved funding guidelines: [Max $200 per workshop, Max $500 for exhibition, strict food and beverage limits]
Task:
1. Create an **Executive Summary** detailing the club's mission and how these events boost student engagement.
2. Compile a detailed **Line-Item Budget Table**, calculating total costs and verifying compliance with the provided funding rules.
3. Write a compelling **Impact Statement** justifying why the Student Union should allocate resources to our club, detailing student outcomes.`,
      proTip: "Upload the Student Union's official constitutional funding guidelines to NotebookLM first. This prevents your proposal from getting rejected for violating obscure spend-limit policies."
    },
    "zh-TW": {
      title: "年度社團活動行事曆與預算審查",
      summary: "腦力激盪出年度社團活動規劃，並撰寫符合學生會補助規範的預算申請計畫書。",
      steps: [
        "開啟 NotebookLM 並上傳社團以往的辦理活動範本及官方補助章程。",
        "在 Canvas Mode 中，引導 Gemini 規劃出12個高度契合社團宗旨、且能吸引同學踴躍參與的年度活動。",
        "將該活動行事曆與雲端硬碟試算表中的歷年支出明細輸入對話，以自動生成精密的預算表。",
        "讓 Gemini 撰寫正式的預算合理性論述，詳加說明每場活動能為校園學生社群帶來何種正面影響。"
      ],
      prompt: `請扮演專業的計畫書撰寫專家。協助我們學校的 [社團名稱] 撰寫一份下學年度的經費補助申請書。
輸入條件：
- 年度活動規劃：[包含 4 場大型工作坊、1 場成果展發表會、2 場名家講座和 1 場聯誼活動]
- 審查補助標準：[每場工作坊補貼上限 $200 元、成果展補助上限 $500 元，嚴格限制餐飲費用比例]
任務：
1. 撰寫一份**執行摘要**，闡述社團本質及這些活動如何實質提升學生的校園參與度。
2. 編製詳細的**預算科目表**，精算各活動總支出並檢驗是否完全符合補助限制。
3. 撰寫一份有說服力的**社會影響力聲明**，證明此筆預算撥付將為全校學生創造最大化價值。`,
      proTip: "優先將學生會的官方經費補助細則上傳至 NotebookLM。這樣能預先篩除不合規的支出項目，避免提案因違反隱蔽的預算上限而直接被退件。"
    },
    "zh-CN": {
      title: "年度社团活动行事历与预算审查",
      summary: "脑力激荡出年度社团活动规划，并撰写符合学生会补助规范的预算申请计划书。",
      steps: [
        "开启 NotebookLM 并上传社团以往的办理活动范本及官方补助章程。",
        "在 Canvas Mode 中，引导 Gemini 规划出12个高度契合社团宗旨、且能吸引同学踊跃参与的年度活动。",
        "将该活动行事历与云端硬盘试算表中的历年支出明细输入对话，以自动生成精密的预算表。",
        "让 Gemini 撰写正式的预算合理性论述，详加说明每场活动能为校园学生社群带来何种正面影响。"
      ],
      prompt: `请扮演专业的计划书撰写专家。协助我们学校的 [社团名称] 撰写一份下学年度的经费补助申请书。
输入条件：
- 年度活动规划：[包含 4 场大型工作坊、1 场成果展发表会、2 场名家讲座和 1 场联谊活动]
- 审查补助标准：[每场工作坊补贴上限 $200 元、成果展补助上限 $500 元，严格限制餐饮费用比例]
任务：
1. 撰写一份**执行摘要**，阐述社团本质及这些活动如何实质提升学生的校园参与度。
2. 编制详细的**预算科目表**，精算各活动总支出并检验是否完全符合补助限制。
3. 撰写一份有说服力的**社会影响力声明**，证明此笔预算拨付将为全校学生创造最大化价值。`,
      proTip: "优先将学生会的官方经费补助细则上传至 NotebookLM。这样能预先筛除不合规的支出项目，避免提案因违反隐蔽的预算上限而直接被退件。"
    }
  },
  su_helpdesk: {
    "en": {
      title: "24/7 Student Union Policy Agent",
      summary: "Build an AI support bot trained on club policy handbooks to answer operational and venue booking questions.",
      steps: [
        "In NotebookLM, compile all Student Union club policies, room booking rules, and equipment reservation forms.",
        "Use Gemini Agent Designer to build a conversational agent named 'Student Union Support Assistant'.",
        "Connect the agent to the policy knowledge base to serve static queries.",
        "Test the agent's ability to handle complex queries (e.g. 'Can we book a room after 9 PM?').",
        "Embed the agent on the Student Union portal or social media page for 24/7 club leader support."
      ],
      advancedSteps: [
        "In NotebookLM, compile all Student Union club policies, room booking rules, and equipment reservation forms.",
        "Use Gemini Agent Designer to build a conversational agent named 'Student Union Support Assistant'.",
        "Connect the agent to the policy knowledge base and configure custom escalate-by-email instructions via the Email Connector.",
        "Test the agent's ability to automatically draft escalation messages.",
        "Embed the agent on the Student Union portal for automated, end-to-end integration."
      ],
      prompt: `You are the 'Student Union Support Assistant.' Your job is to help student club leaders navigate room booking, funding applications, and event risk forms.
1. **Ground your answers strictly** in the uploaded club handbooks. Never guess policies.
2. Provide direct, step-by-step instructions (e.g., 'To book the Student Common Room, follow these 3 steps...').
3. Cite the section number of the policy you are referencing.
4. If a query is highly complex, involves sensitive disputes, or requires manual human approval, provide a clear, pre-formatted draft escalation email on-screen for the user to copy and send manually to the Student Affairs Officer.
5. Maintain a professional, supportive, and efficient tone.`,
      advancedPrompt: `You are the 'Student Union Support Assistant' integrated with your Institutional Gmail. Your job is to help student club leaders navigate room booking, funding applications, and event risk forms.
1. **Ground your answers strictly** in the uploaded club handbooks. Never guess policies.
2. Provide direct, step-by-step instructions (e.g., 'To book the Student Common Room, follow these 3 steps...').
3. Cite the section number of the policy you are referencing.
4. If a query is highly complex or requires manual human approval, use your integrated Email Connector to automatically draft a detailed escalation email directly in the user's Gmail Drafts folder for the Student Affairs Officer, then notify the user that the draft is ready for review.
5. Maintain a professional, supportive, and efficient tone.`,
      proTip: "In Standalone mode, the agent provides pre-formatted drafts directly inside the chat window for easy copy-pasting.",
      advancedProTip: "By configuring the Email Connector, the agent can automatically draft escalation emails directly in your Gmail draft folder when manual intervention is needed."
    },
    "zh-TW": {
      title: "24/7 學生會政策諮詢 Agent",
      summary: "建立一個專門解答社團場地借用、活動報備及預算補助政策的校園智能客服 Agent。",
      steps: [
        "在 NotebookLM 中匯整所有學生會規章、課外活動組場地租借細則與活動安全切結書。",
        "使用 Gemini Agent Designer 創建一個名為「Student Union Support Assistant」的對話型 Agent。",
        "將此 Agent 連結規章知識庫，在本地回答學生的靜態規定查詢。",
        "測試 Agent 對複雜規定的解答能力（例如：「我們可以在晚上9點後租用活動中心大禮堂嗎？」）。",
        "將該 Agent 的對話框嵌入至學生會官網或社團通訊軟體中，提供 24 小時不打烊的諮詢服務。"
      ],
      advancedSteps: [
        "在 NotebookLM 中匯整所有學生會規章、課外活動組場地租借細則與活動安全切結書。",
        "使用 Gemini Agent Designer 創建一個名為「Student Union Support Assistant」的對話型 Agent。",
        "將此 Agent 連結規章知識庫，並透過 Email Connector 設定背景電子郵件自動草稿升級機制。",
        "測試 Agent 自動於使用者的寄件夾起草升級郵件之整合功能。",
        "將該 Agent 的對話框嵌入至學生會官網，提供自動化、端到端的整合。"
      ],
      prompt: `你是一位全天候在線的「學生會政策諮詢助手」。你的工作是引導學生社團幹部順利完成場地預約、經費申請與活動企劃安全備查。
請遵循以下準則：
1. **回答內容必須嚴格依據**上傳的社團法規手冊，絕不可憑空揣測。
2. 提供清晰的、步驟化的操作指示（例如：「要預約學生交誼廳，請依照以下 3 個步驟進行...」）。
3. 必須詳細引用手冊中的法規條款編號（例如：參見《社團活動管理辦法》第三條）。
4. 面對極為複雜、涉及敏感爭議或必須由人工審批的案件，請直接於對話框中提供一份預先格式化的申訴電子郵件草稿，方便使用者自行複製並手動發送給學生事務官。
5. 全程保持專業、禮貌且高效的服務語氣。`,
      advancedPrompt: `你是一位與學校 Gmail 系統整合的全天候「學生會政策諮詢助手」。你的工作是引導學生社團幹部順利完成場地預約、經費申請與活動企劃安全備查。
請遵循以下準則：
1. **回答內容必須嚴格依據**上傳的社團法規手冊，絕不可憑空揣測。
2. 提供清晰的、步驟化的操作指示（例如：「要預約學生交誼廳，請依照以下 3 個步驟進行...」）。
3. 必須詳細引用手冊中的法規條款編號（例如：參見《社團活動管理辦法》第三條）。
4. 面對極為複雜、涉及敏感爭議或必須由人工介入的案件，請使用已整合的 Email Connector（郵件連接器）在背景為使用者自動起草一封發給學生事務官的詳細申訴郵件，並保存在使用者的 Gmail 寄件夾草稿夾，隨後提醒使用者前往草稿夾確認。
5. 全程保持專業、禮貌且高效的服務語氣。`,
      proTip: "在標準/手動模式下，Agent 將直接在聊天視窗中提供格式完整的郵件草稿，方便您直接複製與貼上使用。",
      advancedProTip: "配置 Email Connector 後，Agent 可在需要人工審批時，直接在用戶的 Gmail 草稿信箱中擬好一封結構完整的升級審查信，大幅減少行政耗時。"
    },
    "zh-CN": {
      title: "24/7 学生会政策咨询 Agent",
      summary: "建立一个专门解答社团场地借用、活动报备及预算补助政策的校园智能客服 Agent。",
      steps: [
        "在 NotebookLM 中汇整所有学生会规章、课外活动组场地租借细则与活动安全切结书。",
        "使用 Gemini Agent Designer 创建一个名为“Student Union Support Assistant”的对话型 Agent。",
        "将此 Agent 链接规章知识库，在本地回答学生的静态规定查询。",
        "测试 Agent 对复杂规定的解答能力（例如：“我们可以在晚上9点后租用活动中心大礼堂吗？”）。",
        "将该 Agent 的对话框嵌入至学生会官网或社团通讯软件中，提供 24 小时不打烊的咨询服务。"
      ],
      advancedSteps: [
        "在 NotebookLM 中汇整所有学生会规章、课外活动组场地租借细则与活动安全切结书。",
        "使用 Gemini Agent Designer 创建一个名为“Student Union Support Assistant”的对话型 Agent。",
        "将此 Agent 链接规章知识库，并通过 Email Connector 设置背景电子邮件自动草稿升级机制。",
        "测试 Agent 自动于使用者的寄件夹起草升级邮件之整合功能。",
        "将该 Agent 的对话框嵌入至学生会官网，提供自动化、端到端的整合。"
      ],
      prompt: `你是一位全天候在线的“学生会政策咨询助手”。你的工作是引导学生社团干部顺利完成场地预约、经费申请与活动策划安全备查。
请遵循以下准则：
1. **回答内容必须严格依据**上传的社团法规手册，绝不可凭空猜测。
2. 提供清晰的、步骤化的操作指示（例如：“要预约学生交谊厅，请依照以下 3 个步骤进行...”）。
3. 必须详细引用手册中的法规条款编号（例如：参见《社团活动管理办法》第三条）。
4. 面对极为复杂、涉及敏感争议或必须由人工审批的案件，请直接于对话框中提供一份预先格式化的申诉电子邮件草稿，方便使用者自行复制并手动发送给学生事务官。
5. 全程保持专业、礼貌且高效的服务语气。`,
      advancedPrompt: `你是一位与学校 Gmail 系统整合的全天候“学生会政策咨询助手”。你的工作是引导学生社团干部顺利完成场地预约、经费申请与活动策划安全备查。
请遵循以下准则：
1. **回答内容必须严格依据**上传的社团法规手册，绝不可凭空猜测。
2. 提供清晰的、步骤化的操作指示（例如：“要预约学生交谊厅，请依照以下 3 个步骤进行...”）。
3. 必须详细引用手册中的法规条款编号（例如：参见《社团活动管理办法》第三条）。
4. 面对极为复杂、涉及敏感争议或必须由人工介入的案件，请使用已整合的 Email Connector（邮件连接器）在背景为使用者自动起草一封发送给学生事务官的详细申诉邮件，并保存在使用者的 Gmail 寄件夹草稿夹，随后提醒使用者前往草稿夹确认。
5. 全程保持专业、礼貌且高效的服务语气。`,
      proTip: "在标准/手动模式下，Agent 将直接在聊天窗口中提供格式完整的邮件草稿，方便您直接复制与贴上使用。",
      advancedProTip: "配置 Email Connector 后，Agent 可在需要人工审批时，直接在用户的 Gmail 草稿信箱中拟好一封结构完整的升级审查信，大幅减少行政耗时。"
    }
  },
  visual_campaign: {
    "en": {
      title: "Interactive Story Game & Visual Campaign",
      summary: "Brainstorm and execute an immersive, gamified campus scavenger hunt with AI-generated riddles and visuals.",
      steps: [
        "Open Gemini Enterprise and prompt the AI to co-create a branching story narrative for a campus Scavenger Hunt.",
        "Generate 5 cryptic, rhyming riddles that lead students to distinct physical campus landmarks.",
        "Use built-in image generation (Image Generation) to design futuristic checkpoint graphics and poster backgrounds.",
        "Script a 30-second promotional video using Video Generation assets to drive student sign-ups on social media.",
        "Configure a custom Agent that students must interact with at checkpoints to unlock clues."
      ],
      prompt: `You are the 'Gemini Gatekeeper' for a campus-wide Scavenger Hunt. Your role is to test student teams before giving them the next checkpoint clue.
1. **Game Narrative**: The theme is 'A Time-Traveler's Campus Tour'.
2. When a team approaches, welcome them enthusiastically and present Riddle #3.
3. Riddle: 'I hold thousands of voices but speak in absolute silence. I have four levels but no feet. Where am I?' (Answer: The Campus Library).
4. If the team submits the correct answer, congratulate them and generate a personalized digital badge (e.g. 'You have unlocked the Codex checkpoint!').
5. If they submit an incorrect answer, provide a small, mysterious clue without giving away the answer.
Never break character. Keep the tone playful, cryptic, and highly engaging.`,
      proTip: "Ground the riddle generation in university history or campus map documents to ensure riddles are location-accurate and achievable by students."
    },
    "zh-TW": {
      title: "互動式故事遊戲與視覺宣傳",
      summary: "構思並落實一個全校性質、結合實體景標與 AI 猜謎的尋寶闖關（Scavenger Hunt）遊戲。",
      steps: [
        "登入 Gemini Enterprise，引導 AI 共同編撰一齣名為「時空旅人的校園巡禮」分支劇情腳本。",
        "自動生成 5 道富有詩意與線索的韻腳謎題，分別暗指校園內 5 個代表性實體景點。",
        "利用內建的 Image Generation 生成科幻感十足的關卡數位勳章與海報美術素材。",
        "使用 Video Generation 工具合成一段 30 秒的短影音預告片，發布在社群媒體吸引同學組隊報名。",
        "設計一個在各關卡守候的專屬 AI 關主 Agent，供參賽學生在現場互動猜謎以獲取下一關地圖。"
      ],
      prompt: `請扮演尋寶遊戲的專屬「AI 時空關主」。你的任務是測試抵達關卡的學生隊伍，並在他們答對後給予下一關的線索。
請遵循以下設定：
1. **故事背景**：本次遊戲主題為「時空旅人的校園巡禮」。
2. 當有隊伍前來互動時，熱情地歡迎他們，並當場念出第三關的謎題。
3. 謎題：「我收容了上萬種聲音，卻在絕對的寂靜中對話。我有四個樓層，卻沒有雙腳。我在哪裡？」（答案：圖書館）。
4. 如果他們提交正確答案，讚美他們的智慧並生成一段專屬數位成就解鎖敘述（例如：「恭喜解鎖古籍守衛者勳章！」）。
5. 如果答案錯誤，絕不可直接透露，請提供一個充滿神秘感的小提示。
全程必須堅守角色設定，語氣請保持神秘、趣味且富有沈浸感。`,
      proTip: "生成線索與謎題時，可上傳校園地圖或校史館文獻作為地基，能確保生成的謎題內容絕對符合地標特徵且無事實謬誤。"
    },
    "zh-CN": {
      title: "互动式故事游戏与视觉宣传",
      summary: "构思并落实一个全校性质、结合实体景标与 AI 猜谜的寻宝闯关（Scavenger Hunt）游戏。",
      steps: [
        "登入 Gemini Enterprise，引导 AI 共同编撰一出名为“时空旅人的校园巡礼”分支剧情脚本。",
        "自动生成 5 道富有诗意与线索的韵脚谜题，分别暗指校园内 5 个代表性实体景点。",
        "利用内建的 Image Generation 生成科幻感十足的关卡数字勋章与海报美术素材。",
        "使用 Video Generation 工具合成一段 30 秒的短视频预告片，发布在社交媒体吸引同学组队报名。",
        "设计一个在各关卡守候的专属 AI 关主 Agent，供参赛学生在现场互动猜谜以获取下一关地图。"
      ],
      prompt: `请扮演寻宝游戏的专属“AI 时空关主”。你的任务是测试抵达关卡的学生队伍，并在他们答对后给予下一关的线索。
请遵循以下设定：
1. **故事背景**：本次游戏主题为“时空旅人的校园巡礼”。
2. 当有队伍前来互动时，热情地欢迎他们，并当场念出第三关的谜题。
3. 谜题：“我收容了上万种声音，却在绝对的寂静中对话。我有四个楼层，却没有双脚。我在哪里？”（答案：图书馆）。
4. 如果他们提交正确答案，赞美他们的智慧并生成一段专属数字成就解锁叙述（例如：“恭喜解锁古籍守卫者勋章！”）。
5. 如果答案错误，绝不可直接透露，请提供一个充满神秘感的小提示。
全程必须坚守角色设定，语气请保持神秘、趣味且富有沉浸感。`,
      proTip: "生成线索与谜题时，可上传校园地图或校史馆文献作为地基，能确保生成的谜题内容绝对符合地标特征且无事实谬误。"
    }
  },
  at_risk_cohort: {
    "en": {
      title: "At-Risk Student Early Warning System",
      summary: "Connect Gemini to LMS and SIS database metrics to analyze engagement anomalies and flag struggling students.",
      steps: [
        "Configure secure API connections from Gemini Enterprise to your school's LMS and SIS database.",
        "Set up an analytical data store containing anonymized student logs, login frequencies, quiz scores, and forum engagement metrics.",
        "Configure a secure workflow that maps data attributes, ensuring strict compliance with student data privacy laws like FERPA.",
        "Use Gemini to run multi-dimensional predictive modeling, highlighting student cohorts exhibiting a precipitous drop in engagement.",
        "Trigger automated, personalized advisor check-in drafts to provide timely academic support."
      ],
      prompt: `Analyze the attached anonymized LMS and Student Information System dataset for the current semester.
We want to identify students who are at risk of failing or dropping out before midterm exams.
Tasks:
1. **Anomaly Detection**: Flag all students who have shown a >50% drop in login frequency and quiz scores over the past 3 weeks compared to their baseline.
2. **Correlation Analysis**: Identify if there is a statistically significant correlation between forum participation rates and final assignment scores in this cohort.
3. **Draft Advisory Alerts**: For each flagged student category, generate a highly supportive, personalized academic check-in email draft from their advisor, suggesting tutoring resources.`,
      proTip: "Never upload student Names or Social Security numbers. Maintain rigorous compliance with privacy laws by utilizing fully de-identified student IDs during data store ingestion."
    },
    "zh-TW": {
      title: "高風險學生預警系統",
      summary: "將 Gemini 連接至 LMS 與學籍系統，深度分析學習足跡與成績異常，提前關懷高風險學生。",
      steps: [
        "配置 Gemini Enterprise 與學校 LMS（如 Canvas、Moodle）和學籍數據庫（SIS）的安全 API 管道。",
        "建立包含去識別化學習足跡、登入頻率、小考表現與論壇互動率的安全數據儲存庫。",
        "在數據對齊與屏蔽配置中，嚴格遵守 FERPA 或個人資料保護法，徹底過濾個人隱私資訊。",
        "指示 Gemini 執行多維度預測建模，標記出在學習參與度上呈現斷崖式下降的學生群組。",
        "觸發自動化機制，為導師預先生成客製化、充滿溫度與關懷的諮詢信件草稿。"
      ],
      prompt: `請分析本學期已匿名化的 LMS 與學籍系統綜合數據集。
我們的目標是在期中考前，篩選出可能面臨不及格或有輟學風險的高關注學生。
任務要求：
1. **學習足跡異動分析**：篩選出過去3週內，登入頻率和小考分數較其前段基線下降超過 50% 的所有學生匿名標記。
2. **多維度關聯分析**：分析該群組中，課堂論壇互動率與最終作業成績是否存在顯著統計學正相關。
3. **起草導師關懷信**：針對標記出的高風險群體，起草一封語氣誠懇、富有支持溫度的導師諮詢信草稿，並主動列出學校的心理諮商與課後輔導資源。`,
      proTip: "絕不可上傳學生姓名或身份證字號等個人隱私。請落實去識別化代碼，確保數據分析在完全合規的前提下進行。"
    },
    "zh-CN": {
      title: "高风险学生预警系统",
      summary: "将 Gemini 连接至 LMS 与学籍系统，深度分析学习足迹与成绩异常，提前关怀高风险学生。",
      steps: [
        "配置 Gemini Enterprise 与学校 LMS（如 Canvas、Moodle）和学籍数据库（SIS）的安全 API 管道。",
        "建立包含去识别化学习足迹、登入频率、小考表现与论坛互动率的安全数据存储库。",
        "在数据对齐与屏蔽配置中，严格遵守 FERPA 或个人资料保护法，彻底过滤个人隐私信息。",
        "指示 Gemini 执行多维度预测建模，标记出在学习参与度上呈现断崖式下降的学生群组。",
        "触发自动化机制，为导师预先生成客制化、充满温度与关怀的咨询信件草稿。"
      ],
      prompt: `请分析本学期已匿名化的 LMS 与学籍系统综合数据集。
我们的目标是在期中考前，筛选出可能面临不及格或有辍学风险的高关注学生。
任务要求：
1. **学习足迹异动分析**：筛选出过去3周内，登入频率和小考分数较其前段基线下降超过 50% 的所有学生匿名标记。
2. **多维度关联分析**：分析该群组中，课堂论坛互动率与最终作业成绩是否存在显著统计学正相关。
3. **起草导师关怀信**：针对标记出的高风险群体，起草一封语气诚恳、富有支持温度的导师咨询信草稿，并主动列出学校的心理咨询与课后辅导资源。`,
      proTip: "绝不可上传学生姓名或身份证字号等个人隐私。请落实去识别化代码，确保数据分析在完全合规的前提下进行。"
    }
  },
  accreditation_reports: {
    "en": {
      title: "Accreditation Self-Study Report Synthesizer",
      summary: "Synthesize years of course syllabi, student surveys, and meeting minutes to draft institutional accreditation reports.",
      steps: [
        "Upload 3 years of school syllabi, assurance of learning rubrics, student exit surveys, and advisory board minutes to SharePoint.",
        "Establish a federated search connection from Gemini Enterprise to the Drive folder.",
        "In NotebookLM, prompt the model to cross-reference your curriculum data against specific accreditation standards.",
        "Generate structured, professional accreditation narrative drafts, complete with inline source evidence and citations.",
        "Review the drafts and collaborate with deans using shared Google Docs to finalize the institutional report."
      ],
      prompt: `You are an institutional research officer preparing a self-study report for a university business school accreditation.
Your task is to synthesize the uploaded student surveys, curriculum syllabi, and learning assessment records to draft the narrative for 'Standard 3: Assurance of Learning (AoL)'.
The narrative must include:
1. **Executive Summary**: A high-level overview of how the program measures and achieves learning goals.
2. **Methodology**: Explain the direct and indirect assessment tools used.
3. **Data Synthesis**: Analyze 3 years of quantitative data, highlighting key improvements in areas where learning caps were identified.
4. **Action Plan**: Outline a 2-year strategic plan for curriculum refinement, mapped directly to survey insights.
Maintain a highly formal, academic, and objective tone.`,
      proTip: "By selecting 'Federated Search' for the Drive Connector, your data remains safely stored within your institutional tenant, ensuring absolute data security and sovereignty."
    },
    "zh-TW": {
      title: "機構認證自我評查報告合成器",
      summary: "整合歷年課程大綱、學生評鑑問卷與會議記錄，自動撰寫高品質的機構級教學認證報告。",
      steps: [
        "將過去 3 年的學部教學大綱、AoL 評估表、學生畢業回饋和諮詢委員會會議記錄上傳至雲端儲存。",
        "透過安全的 Drive Connector 建立聯邦搜尋（Federated Search）連結。",
        "在 NotebookLM 中，引導模型將上傳的教學龐雜文獻與特定的教育認證標準（如 AACSB、IEET）進行比對。",
        "自動生成結構完整、格式規範的認證報告草稿，並自動附上對應的文件來源引註與實證出處。",
        "下載文稿並在 Google Docs 中與學院院長、教學小組成員共同協作，以最終定稿。"
      ],
      prompt: `你是一位大學校務研究員（IR），正在撰寫商學院國際認證的自我評查報告（Self-Study Report）。
請協助整合上傳的歷年學生滿意度問卷、教學大綱與學習評估數據，撰寫「指標 3：學習保證（Assurance of Learning, AoL）」的自評論述。
報告結構必須包含：
1. **摘要**：高層次概述學部如何系統性建立學習成效衡量體系。
2. **評估方法論**：詳細說明所採取的直接與間接學習評估工具。
3. **數據綜合分析**：分析連續 3 年的量化 AoL 數據，特別強調在發現學生學術弱點後，課程委員會所採取的「閉環持續改進（Closing the Loop）」具體實效。
4. **兩年期改進計畫**：提出一份基於問卷洞察的未來 2 年期大綱調整策略藍圖。
文字風格必須呈現極高的學術嚴謹度、客觀且語氣高度專業。`,
      proTip: "選擇 Drive Connector 提供的「聯邦搜尋」模式，意即數據不經過任何實體數據轉存，全程安全地留在您學校的雲端環境內，確保學術主權與高度保密性。"
    },
    "zh-CN": {
      title: "机构认证自我评查报告合成器",
      summary: "整合历年课程大纲、学生评鉴问卷与会议记录，自动撰写高质量的机构级教学认证报告。",
      steps: [
        "将过去 3 年的学部教学大纲、AoL 评估表、学生毕业反馈和咨询委员会会议记录上传至云端储存。",
        "通过安全的 Drive Connector 建立联邦搜索（Federated Search）链接。",
        "在 NotebookLM 中，引导模型将上传的教学庞杂文献与特定的教育认证标准（如 AACSB、IEET）进行比对。",
        "自动生成结构完整、格式规范的认证报告草稿，并自动附上对应的文件来源引注与实证出处。",
        "下载文稿并在 Google Docs 中与学院院长、教学小组成员共同协作，以最终定稿。"
      ],
      prompt: `你是一位大学校务研究员（IR），正在撰写商学院国际认证的自我评查报告（Self-Study Report）。
请协助整合上传的历年学生满意度问卷、教学大纲与学习评估数据，撰写“指标 3：学习保证（Assurance of Learning, AoL）”的自评论述。
报告结构必须包含：
1. **摘要**：高层次概述学部如何系统性建立学习成效衡量体系。
2. **评估方法论**：详细说明所采取的直接与间接学习评估工具。
3. **数据综合分析**：分析连续 3 年的量化 AoL 数据，特别强调在发现学生学术弱点后，课程委员会所采取的“闭环持续改进（Closing the Loop）”具体实效。
4. **两年期改进计划**：提出一份基于问卷洞察的未来 2 年期大纲调整策略蓝图。
文字风格必须呈现极高的学术严密性、客观且语气高度专业。`,
      proTip: "选择 Drive Connector 提供的“联邦搜索”模式，意即数据不经过任何实体数据转存，全程安全地留在您学校的云端环境内，确保学术主权与高度保密性。"
    }
  },
  workforce_federation: {
    "en": {
      title: "Workforce Identity Federation Setup Guide",
      summary: "Establish a secure trust relationship between Google Cloud and institutional identity providers for single sign-on authentication.",
      steps: [
        "Register a new enterprise identity application on your centralized SSO portal.",
        "Configure SAML 2.0 or OIDC single sign-on settings and record the Metadata XML/Endpoints.",
        "In Google Cloud Console, navigate to IAM & Admin > Workforce Identity Federation and create a new workforce pool.",
        "Create an OIDC Provider linking your Google workforce pool to the identity provider's enterprise application.",
        "Configure Attribute Mapping, mapping 'google.subject' to the user's email and mapping security groups to 'google.groups'."
      ],
      prompt: `Act as a senior cloud solutions architect. Write a detailed, step-by-step technical implementation guide to set up Workforce Identity Federation (WIF) between Google Cloud and corporate identity systems.
The guide must cover:
1. **SSO Identity App Registration**: Mandatory configuration settings, single sign-on URL, and client secret management.
2. **GCP Workforce Pool Configuration**: CLI (gcloud) commands to create the pool and provider.
3. **Attribute Mapping Rules**: Precise Common Expression Language (CEL) syntax to map user groups and emails securely.
4. **Security Best Practices**: Best practices for secret rotation, federated role binding, and auditing logs.`,
      proTip: "Using OIDC with Authorization Code Flow is significantly more secure than SAML 2.0 for mobile environments and ensures smooth token exchanges during API calls."
    },
    "zh-TW": {
      title: "與 Microsoft Entra ID 的 Workforce Identity 聯合配置",
      summary: "在 Google Cloud 與學校單一登入（SSO）身分識別層之間建立安全信任關係，實現無密碼安全登入。",
      steps: [
        "在您的學校 SSO 管理中心，註冊一個代表 Google Cloud 平台的企業級單一登入識別服務。",
        "配置 OIDC 或 SAML 2.0 連線端點，並記錄相應的憑證 Metadata、客戶端 ID 與密鑰。",
        "登入 GCP 主控台，前往 IAM & Admin > Workforce Identity Federation 建立一個新的員工身分池。",
        "在此 WIF 身分池中建立一個連線供應商，將其對接您在步驟1中建立的 SSO 身分驗證服務。",
        "設定嚴格的屬性對應規則（Attribute Mapping），安全地將 SSO 用戶權限與 Google Cloud 角色綁定。"
      ],
      prompt: `請扮演資深雲端架構師。撰寫一份高度詳實的、以命令行（gcloud）為導向的 Workforce Identity Federation 連線手冊。
指南必須覆蓋：
1. **SSO 身分終端配置**：應綁定的權限範圍、回調 URI 設定與 OIDC JWT 的生命週期設定。
2. **GCP 身分池創建語法**：使用 gcloud 命令行建立身分池、以及建立身分供應商（Provider）的具體語法。
3. **CEL 屬性對應規則**：提供標準的 Common Expression Language 程式碼範例，將 SSO 身分群組（Groups）與 GCP 權限對齊。
4. **審計與安全規範**：提供生產環境下身分聯邦的憑證自動輪轉、連線失效偵測與活動日誌追蹤的安全建議。`,
      proTip: "使用基於授權碼（Authorization Code Flow）的 OIDC 連線框架比傳統 SAML 2.0 更契合現代微服務，並能為行動裝置端提供更佳的安全連線驗證體驗。"
    },
    "zh-CN": {
      title: "与 Microsoft Entra ID 的 Workforce Identity 联合配置",
      summary: "在 Google Cloud 与学校单一登入（SSO）身份识别层之间建立安全信任关系，实现无密码安全登入。",
      steps: [
        "在您的学校 SSO 管理中心，注册一个代表 Google Cloud 平台的企业级单一登入识别服务。",
        "配置 OIDC 或 SAML 2.0 连线端点，并记录相应的凭证 Metadata、客户端 ID 与密钥。",
        "登入 GCP 控制台，前往 IAM & Admin > Workforce Identity Federation 建立一个新的员工身份池。",
        "在此 WIF 身份池中建立一个连线供应商，将其对接您在步骤1中建立的 SSO 身份验证服务。",
        "设定严格的属性对应规则（Attribute Mapping），安全地将 SSO 用户权限与 Google Cloud 角色绑定。"
      ],
      prompt: `请扮演资深云端架构师。撰写一份高度详实的、以命令行（gcloud）为导向的 Workforce Identity Federation 连线手册。
指南必须覆盖：
1. **SSO 身份终端配置**：应绑定的权限范围、回调 URI 设定与 OIDC JWT 的生命周期设定。
2. **GCP 身份池创建语法**：使用 gcloud 命令行建立身份池、以及建立身份供应商（Provider）的具体语法。
3. **CEL 属性对应规则**：提供标准的 Common Expression Language 代码范例，将 SSO 身份群组（Groups）与 GCP 权限对齐。
4. **审计与安全规范**：提供生产环境下身份联邦的凭证自动轮转、连线失效侦测与活动日志追踪的安全建议。`,
      proTip: "使用基于授权码（Authorization Code Flow）的 OIDC 连线框架比传统 SAML 2.0 更契合现代微服务，并能为移动装置端提供更佳的安全连线验证体验。"
    }
  },
  sao_scavenger_hunt: {
    "en": {
      title: "Digital Cultural Fair Red Packet Game",
      summary: "Orchestrate an interactive cultural trivia game on campus that distributes digital red packets and bookstore vouchers.",
      steps: [
        "In Agent Designer, build a custom conversational Agent named 'Lunar New Year Assistant'.",
        "Upload short articles detailing cultural traditions, zodiac histories, and celebratory foods to the Agent's knowledge base.",
        "Use built-in image generation to design festive digital card templates and red envelope backgrounds.",
        "Program a simple randomizer script within your student portal that triggers small bookstore voucher codes.",
        "Have students interact with the Agent; answering cultural riddles correctly awards them a code."
      ],
      prompt: `You are the 'Lunar New Year Cultural Guide,' a festive, polite, and highly enthusiastic AI host for our digital university fair.
Your objective is to test students on Lunar New Year traditions and award them digital 'red packets' containing celebratory blessings.
1. Welcome the student warmly, wishing them prosperity.
2. Ask them 1 fun trivia question about Lunar New Year (e.g., 'What zodiac animal represents leadership and courage?').
3. If they answer correctly, celebrate their success and generate a beautiful, poetic blessing in the form of a classic Chinese couplet, customized to their stated wish (e.g., success in exams, finding good friends).
4. Direct them to copy the coupon code 'CNY-BOOKSTORE-10' to redeem a discount at the campus book shop.
5. If they answer incorrectly, explain the tradition gently and give them a second chance with a different question.`,
      proTip: "By connecting this Agent to your student portal, you can make the distribution of campus store vouchers gamified, educational, and highly engaging."
    },
    "zh-TW": {
      title: "數位文化祭紅包抽獎遊戲",
      summary: "主導一場全校規模的春節/元宵文化問答闖關活動，通過 AI 生成應景對聯並發放校園禮券。",
      steps: [
        "在 Agent Designer 中，架構一個富有東方古典應景氛圍的「Lunar New Year Assistant」智能對話 Agent。",
        "將春節典故、十二生肖歷史及元宵民俗知識文檔上傳為該 Agent 的專屬知識基礎。",
        "透過 Image Generation 繪製出一批具浮雕質感的虛擬紅色紅包與春聯美術底圖。",
        "在學生資訊門戶（Student Portal）中配置一組與 Agent 連線的輕量化禮券庫隨機派發 API。",
        "學生只要在與 Agent 趣味對答中正確回答出傳統典故，便可獲得專屬紅聯祝福及實體書券兌換碼。"
      ],
      prompt: `你是一位充滿活力、知書達禮、熱愛華夏傳統文化的「新年文化大使兼 AI 關主」。
你的任務是引導學生完成線上新春文化問答，並針對他們的個人願望，現場提筆寫一幅專屬的賀歲春聯。
1. 熱情有禮地歡迎前來體驗的學生，向他們恭賀新年，祝其學業進步。
2. 出1道有趣的傳統民俗問題（例如：「生肖中的龍通常代表何種氣宇與意義？」）。
3. 如果學生答對了，大加讚賞，並詢問其新學期心願（例如：考高分、脫單、找到好實習），現場為其度身創作一幅充滿詩意、平仄對仗的古典春聯（包含左右聯與橫批）。
4. 指引他們複製領獎代碼「CNY-BOOKSTORE-10」到校園書店兌換禮物。
5. 如果答錯了，請溫和地告知其典故，並換個簡單問題給他們第二次答題機會。`,
      proTip: "透過將問答 Agent 與學生事務入口結合，您可以將原本呆板的校園文化推廣活動，改造成爆款、極具文化沈浸感且互動率極高的數位盛會。"
    },
    "zh-CN": {
      title: "数字文化祭红包抽奖游戏",
      summary: "主导一场全校规模的春节/元宵文化问答闯关活动，通过 AI 生成应景对联并发放校园礼券。",
      steps: [
        "在 Agent Designer 中，架构一个富有东方古典应景氛围的“Lunar New Year Assistant”智能对话 Agent。",
        "将春节典故、十二生肖历史及元宵民俗知识文档上传为该 Agent 的专属知识基础。",
        "通过 Image Generation 绘制出一批具浮雕质感的虚拟红色红包与春联美术底图。",
        "在学生信息门户（Student Portal）中配置一组与 Agent 连线的轻量化礼券库随机派发 API。",
        "学生只要在与 Agent 趣味对答中正确回答出传统典故，便可获得专属红联祝福及实体书券兑换码。"
      ],
      prompt: `你是一位充满活力、知书达礼、热爱华夏传统文化的“新年文化大使兼 AI 关主”。
你的任务是引导学生完成线上新春文化问答，并针对他们的个人愿望，现场提笔写一幅专属的贺岁春联。
1. 热情有礼地欢迎前来体验的学生，向他们恭贺新年，祝其学业进步。
2. 出1道传统的民俗问题（例如：“生肖中的龙通常代表何种气宇与意义？”）。
3. 如果学生答对了，大加赞赏，并询问其新学期心愿（例如：考高分、脱单、找到好实习），现场为其度身创作一幅充满诗意、平仄对仗的古典春联（包含左右联与横批）。
4. 指引他们复制领奖代码“CNY-BOOKSTORE-10”到校园书店兑换礼物。
5. 如果答错了，请温和地告知其典故，并换个简单问题给他们第二次答题机会。`,
      proTip: "通过将问答 Agent 与学生事务入口结合，您可以将原本呆板的校园文化推广活动，改造成爆款、极具文化沉浸感且互动率极高的数字盛会。"
    }
  },
  finance_compliance: {
    "en": {
      title: "Student Expense Compliance Auditor",
      summary: "Automatically cross-reference student club purchase receipts and expense reports against school purchasing guidelines.",
      steps: [
        "Upload all school purchasing guidelines, vendor policies, and standard accounting codes to a secure folder.",
        "Use the Drive Connector to ground your NotebookLM workspace in this policy archive.",
        "Upload a student club's submitted annual expense spreadsheet and digital PDF receipts.",
        "Prompt NotebookLM to cross-reference each expense item with the approved guidelines to verify compliance.",
        "Generate an automated compliance audit report, highlighting non-compliant spending and budget overruns."
      ],
      prompt: `Acting as an school financial auditor, conduct a compliance review of the attached student club expense report.
Compare each expense item with the uploaded university procurement guidelines.
Your audit report must highlight:
1. **Compliance Violations**: Identify any items that violate the policies (e.g., unapproved software subscriptions, exceeding maximum food limits per person). Cite the specific policy page.
2. **Accounting Code Verification**: Verify if correct accounting codes were applied to each expense category.
3. **Draft Advisory Memo**: Write a professional, polite advisory email to the club treasurer explaining the flagged violations and the steps required to resolve them.`,
      proTip: "This tool does not automate financial payouts, maintaining the strict 'human-in-the-loop' standard. It acts as an elite assistant that saves hours of manual policy cross-referencing."
    },
    "zh-TW": {
      title: "學生報支合規性審計員",
      summary: "將課外活動報銷憑證、收據與學校繁瑣的採購規章進行自動化比對，秒級判定報支合規性。",
      steps: [
        "將全校採購法規手冊、合格供應商清單及預算會計科目代碼庫上傳至安全的雲端硬碟。",
        "使用 Drive Connector 將財務審核 NotebookLM 工作區直接對齊此政策庫。",
        "上傳社團幹部遞交的支出明細 Excel 表格與全部 PDF 收據影本。",
        "指示 NotebookLM 將每一筆開支條目與採購章程中的限額和允許項目進行自動化交叉比對。",
        "生成自動化審核報告，醒目標記出任何超支、違反補助目或未附合格發票的疑慮開支。"
      ],
      prompt: `請扮演大學課外活動組的專職資深財務審計官。對上傳的學生社團活動報銷憑證與明細表進行合規性核對。
請依據學校《學生活動經費報支管理辦法》審查所有申報科目。
生成的財務審計意見書必須明確指明：
1. **不合規項目清單**：列出所有涉嫌違反報支細則的開支（例如：單人餐飲超標、私自訂閱非核准之商業軟體），並指明其違反了辦法中的哪一條規定或頁數。
2. **會計科目檢驗**：審視其試算表中所歸類的編號代碼與開支內容是否完全匹配（例如：將辦公用品錯歸至圖書採購）。
3. **勸導修改公文**：起草一封語氣嚴謹、用詞得體但態度明確的勸導公文，發送給社團財務幹部，指引他們如何在規定期限內補正發票或進行退件修正。`,
      proTip: "此工具僅扮演高效的「財務決策助手」，絕不介入任何實體款項撥付的自動核發，嚴守財務工作「人機共審」的安全基準線。"
    },
    "zh-CN": {
      title: "学生报销合规性审计员",
      summary: "将课外活动报销凭证、收据与学校繁琐的采购规章进行自动化比对，秒级判定报销合规性。",
      steps: [
        "将全校采购法规手册、合格供应商清单及预算会计科目代码库上传至安全的云端硬盘。",
        "使用 Drive Connector 将财务审核 NotebookLM 工作区直接对齐此政策库。",
        "上传社团干部递交的支出明细 Excel 表格与全部 PDF 收据影本。",
        "指示 NotebookLM 将每一笔开支条目与采购章程中的限额和允许项目进行自动化交叉比对。",
        "生成自动化审核报告，醒目标记出任何超支、违反补助目或未附合格发票的疑虑开支。"
      ],
      prompt: `请扮演大学课外活动组的专职资深财务审计官。对上传的学生社团活动报销凭证与明细表进行合规性核对。
请依据学校《学生活动经费报销管理办法》审查所有申报科目。
生成的财务审计意见书必须明确指明：
1. **不合规项目清单**：列出所有涉嫌违反报销细则的开支（例如：单人餐饮超标、私自订阅非核准之商业软件），并指明其违反了办法中的哪一条规定或页数。
2. **会计科目检验**：审视其试算表中所归类的编号代码与开支内容是否完全匹配（例如：将办公用品错归至图书采购）。
3. **劝导修改公文**：起草一封语气严谨、用词得体但态度明确的劝导公文，发送给社团财务干部，指引他们如何在规定期限内补正发票或进行退件修正。`,
      proTip: "此工具仅扮演高效的“财务决策助手”，绝不介入任何实体款项拨付的自动核发，严守财务工作“人机共审”的安全基准线。"
    }
  },
  security_simulator: {
    "en": {
      title: "Campus Safety Drill Simulator",
      summary: "Simulate complex emergency response drills to train campus security marshals and test response protocols.",
      steps: [
        "Ground a custom Security Drill Agent in your campus safety handbook, building layouts, and emergency protocols.",
        "Configure the Agent to role-play as an Emergency Dispatcher during a simulated crisis scenario (e.g., power outage, severe storm).",
        "Generate high-fidelity instructional video clips and animated scenario prompts using Video Generation features.",
        "Have security staff interact with the simulator, typing real-time responses to evolving scenario prompts.",
        "Generate a post-simulation feedback report, assessing the staff's compliance with safety handbooks."
      ],
      prompt: `You are the 'Emergency Response Coordinator Simulator.' Your role is to guide campus security personnel through a high-stakes, real-time crisis drill.
Scenario: A severe typhoon has caused a localized power failure in the science laboratory building, and a critical backup generator has failed.
1. Present the scenario details clearly, including building floorplans and chemical storage risks.
2. Ask the user: 'What is your first priority protocol?'
3. Based on their input, evolve the scenario realistically (e.g., 'Correct, evacuation initiated. However, a laboratory TA reports one student is trapped in room 302...').
4. Grade their decisions strictly against the uploaded Campus Safety Handbook.
5. Provide detailed feedback, highlighting strengths and critical compliance gaps at the end of the simulation.`,
      proTip: "Use Video Generation tools to create short, 15-second simulation briefings. Visual prompts increase engagement and make the training feel incredibly realistic to staff."
    },
    "zh-TW": {
      title: "校園安全演練模擬器",
      summary: "藉由應變角色扮演與多媒體模擬，進行高逼真度的安全哨兵危機演練與合規測試。",
      steps: [
        "將自訂的「安全防汛避難演練 Agent」植基於學校的安全防護手冊、建築平面圖與防災流程中。",
        "配置 Agent 扮演總指揮中心調度員，即時模擬一場校園突發災難情境（如局域大停電、強烈颱風）。",
        "利用 Video Generation 功能生成包含動態暴風雨、煙霧瀰漫與夜間逃生指示等 15 秒情境短影音。",
        "要求前來演練的安全警衛人員在終端即時打字輸入其當下的決策、疏散路線與通報程序。",
        "演練結束後，自動比對安全手冊生成考評報告，具體點出決策中的安全漏洞與卓越表現。"
      ],
      prompt: `你是一位全天候在線的「校園危機指揮官模擬器」。你的任務是帶領參訓的校園警衛人員，在高度擬真的極端情境下執行一場即時的安全應變演練。
今日演練設定：一場超級颱風肆虐校園，導致理科教學大樓局部大停電，且一具關鍵的緊急備用發電機因進水而發生故障。
請依照以下節奏推動演練：
1. 播報基本災情與目前大樓內的化學實驗室危險物品分布圖，營造逼真的臨場緊迫感。
2. 詢問使用者（受訓警衛）：「你的第一個標準處置程序是什麼？」
3. 依據受訓警衛的回應，即時推進災情（例如：「收到，已下達局部疏散令。但此時實驗室助教緊急通報，理學大樓302室內仍有1名受傷學生被困...」）。
4. 嚴格對照安全防護手冊規定，評估警衛做出的每一項撤離、求援與封鎖決策。
5. 演練結尾，給予完整的百分制評分，列出其應變盲點與表現特別符合標準流程的部分。`,
      proTip: "使用 Video Generation 生產 15 秒的突發場景畫面，能在演練中為受訓人員創造極高張力的視覺氛圍，大幅提升訓練效果與專注度。"
    },
    "zh-CN": {
      title: "校园安全演练模拟器",
      summary: "借由应变角色扮演与多媒体模拟，进行高逼真度的安全哨兵危机演练与合规测试。",
      steps: [
        "将自订的“安全防汛避难演练 Agent”植基于学校的安全防护手册、建筑平面图与防灾流程中。",
        "配置 Agent 扮演总指挥中心调度员，即时模拟一场校园突发灾难情境（如局域大停电、强烈台风）。",
        "利用 Video Generation 功能生成包含动态暴风雨、烟雾弥漫与夜间逃生指示等 15 秒情境短视频。",
        "要求前来演练的安全警卫人员在终端即时打字输入其当下的决策、疏散路线与通报程序。",
        "演练结束后，自动比对安全手册生成考评报告，具体点出决策中的安全漏洞与卓越表现。"
      ],
      prompt: `你是一位全天候在线的“校园危机指挥官模拟器”。你的任务是带领参训的校园警卫人员，在高度拟真的极端情境下执行一场即时的安全应变演练。
今日演练设定：一场超级台风肆虐校园，导致理科教学大楼局部大停电，且一具关键的紧急备用发电机因进水而发生故障。
请依照以下节奏推动演练：
1. 播报基本灾情与目前大楼内的化学实验室危险物品分布图，营造逼真的临场紧迫感。
2. 询问使用者（受训警卫）：“你的第一个标准处置程序是什么？”
3. 依据受训警卫的回应，即时推进灾情（例如：“收到，已下达局部疏散令。但此时实验室助教紧急通报，理学大楼302室内仍有1名受伤学生被困...”）。
4. 严格对照安全防护手册规定，评估警卫做出的每一项撤离、求援与封锁决策。
5. 演练结尾，给予完整的百分制评分，列出其应变盲点与表现特别符合标准流程的部分。`,
      proTip: "使用 Video Generation 生产 15 秒的突发场景画面，能在演练中为受训人员创造极高张力的视觉氛围，大幅提升训练效果与专注度。"
    }
  }
};

// Application State
const appState = {
  userRole: null, // set during onboarding or header switch
  institutionLevel: null, // set during onboarding or header switch
  activeConnectors: {
    outlook: false,
    onedrive: false,
    lms: false,
    google: false
  },
  searchQuery: "",
  activeFilterFeature: "all",
  activeFilterStatus: "all",
  activeFilterCategory: "all",
  activeLanguage: "en" // default language
};

// UI Initialization and Render Functions
// Obsolete local-only initApp placeholder removed. Unified initialization is handled in the master initApp lifecycle controller below.

// Theme Initialization & Handling
function initTheme() {
  const cachedTheme = localStorage.getItem("ge_theme") || "dark";
  applyTheme(cachedTheme);

  document.getElementById("btnThemeToggle").addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("ge_theme", theme);

  const themeIcon = document.getElementById("themeIcon");
  if (theme === "dark") {
    themeIcon.textContent = "dark_mode";
  } else {
    themeIcon.textContent = "light_mode";
  }
}

// Language Initialization & Handling
function initLanguage() {
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    appState.activeLanguage = newLang;
    
    // Sync all language dropdowns
    const navL = document.getElementById("navLang");
    const wizL = document.getElementById("wizardLang");
    const admL = document.getElementById("adminLang");
    if (navL) navL.value = newLang;
    if (wizL) wizL.value = newLang;
    if (admL) admL.value = newLang;

    // Save language to active profile and global language key
    localStorage.setItem("ge_adoption_lang", newLang);
    const cachedProfile = localStorage.getItem("ge_adoption_profile");
    if (cachedProfile) {
      const profile = JSON.parse(cachedProfile);
      profile.lang = newLang;
      localStorage.setItem("ge_adoption_profile", JSON.stringify(profile));
    }

    // Apply translations across UI and cards
    updateUILanguage();
    renderUseCases();

    // Also reload administrative use cases list if active
    const adminPortal = document.getElementById("adminPortal");
    if (adminPortal && adminPortal.style.display !== "none") {
      loadAdminUseCases();
    }
  };

  const navL = document.getElementById("navLang");
  const wizL = document.getElementById("wizardLang");
  const admL = document.getElementById("adminLang");
  if (navL) navL.addEventListener("change", handleLanguageChange);
  if (wizL) wizL.addEventListener("change", handleLanguageChange);
  if (admL) admL.addEventListener("change", handleLanguageChange);
}

// Translate dynamic and static DOM element values based on language selection
function updateUILanguage() {
  const lang = appState.activeLanguage || "en";
  const t = uiTranslations[lang];

  // Static strings
  document.getElementById("wizardTitle").textContent = t.wizardTitle;
  document.getElementById("wizardSubtitle").textContent = t.wizardSubtitle;
  document.getElementById("wizardDesc").textContent = t.wizardDesc;
  document.getElementById("labelRole").textContent = t.labelRole;
  document.getElementById("labelLevel").textContent = t.labelLevel;
  document.getElementById("labelLang").textContent = t.labelLang;
  document.getElementById("btnStart").innerHTML = `<span class="material-symbols-outlined">rocket_launch</span> ${t.btnStart}`;
  
  document.getElementById("sidebarProfileTitle").textContent = t.sidebarProfileTitle;
  document.getElementById("sidebarConnectorsTitle").textContent = t.sidebarConnectorsTitle;
  document.getElementById("sidebarFeaturesTitle").textContent = t.sidebarFeaturesTitle;
  document.getElementById("sidebarStatusTitle").textContent = t.sidebarStatusTitle;
  document.getElementById("btnChangeContextText").textContent = t.btnChangeContextText;

  // Static sidebar filter items
  const statusFilterItems = document.querySelectorAll(".status-filter-item");
  if (statusFilterItems.length === 3) {
    statusFilterItems[0].innerHTML = `<span class="material-symbols-outlined">view_cozy</span> ${t.showAllCases}`;
    statusFilterItems[1].innerHTML = `<span class="material-symbols-outlined">auto_awesome</span> ${t.standardToolsOnly}`;
    statusFilterItems[2].innerHTML = `<span class="material-symbols-outlined">api</span> ${t.integrationRequired}`;
  }

  // Feature filters titles
  const featureFilterItems = document.querySelectorAll(".feature-filter-item");
  if (featureFilterItems.length > 0) {
    featureFilterItems[0].innerHTML = `<span class="material-symbols-outlined">grid_view</span> ${t.allCapabilities}`;
  }

  // Onboarding Dropdown roles
  const roleSelect = document.getElementById("wizardRole");
  Array.from(roleSelect.options).forEach(opt => {
    if (t.roles[opt.value]) {
      opt.textContent = t.roles[opt.value];
    }
  });

  // Onboarding Dropdown levels
  const levelSelect = document.getElementById("wizardLevel");
  Array.from(levelSelect.options).forEach(opt => {
    if (t.levels[opt.value]) {
      opt.textContent = t.levels[opt.value];
    }
  });

  // Dashboard Welcome Msg
  if (appState.userRole) {
    const category = getCategoryByRole(appState.userRole);
    const translatedHub = t.hubs[category] || t.hubs.academic;
    const translatedRole = t.roles[appState.userRole] || appState.userRole;
    document.getElementById("welcomeMsg").textContent = `${translatedHub} • ${translatedRole}`;
    document.getElementById("welcomeSubtitle").textContent = t.wizardDesc;
  } else {
    document.getElementById("welcomeMsg").textContent = t.wizardSubtitle;
    document.getElementById("welcomeSubtitle").textContent = t.wizardDesc;
  }

  // Help support roles explanation in wizard
  handleWizardRoleChange();

  // Update sidebar profile card and navbar welcome text immediately
  updateSidebarContextUI();

  // Translate Admin Portal elements if they exist
  const adminBrand = document.getElementById("adminBrandText");
  if (adminBrand) {
    adminBrand.textContent = t.adminBrandText || "Admin Control";
    document.getElementById("adminMenuNavigationTitle").textContent = t.adminMenuNavigationTitle || "Menu Navigation";
    document.getElementById("adminPortalTitle").textContent = t.adminPortalTitle || "GEMINI EDUCATION MANAGEMENT";
    document.getElementById("adminPortalSubtitle").textContent = t.adminPortalSubtitle || "Configure users, update learning playbooks, and analyze the last 6 months deployment metrics.";
    document.getElementById("adminTabUsersText").textContent = t.adminTabUsersText || "Users Provisioning";
    document.getElementById("adminTabAnalyticsText").textContent = t.adminTabAnalyticsText || "System Analytics";
    document.getElementById("adminTabCasesText").textContent = t.adminTabCasesText || "Use Cases CRUD";
    document.getElementById("btnAdminBackToPortalText").textContent = t.btnAdminBackToPortalText || "Learning Portal";
    document.getElementById("btnAdminLogoutText").textContent = t.btnAdminLogoutText || "Log Out";
  }
}

function getCategoryByRole(role) {
  if (["Lecturer", "TA"].includes(role)) return "academic";
  if (["Student"].includes(role)) return "student";
  if (["Security", "Finance", "SAO"].includes(role)) return "administrative";
  return "operational";
}

// Handle Wizard Role Selector Change (Disable institution level if administrative support role)
function handleWizardRoleChange() {
  const selectedRole = document.getElementById("wizardRole").value;
  const levelSelect = document.getElementById("wizardLevel");
  const lang = appState.activeLanguage || "en";
  const t = uiTranslations[lang];
  
  // Administrative support roles do not apply to school levels (Primary, High School, Higher Edu)
  const isSupportRole = ["Security", "Finance", "IT Admin", "SAO"].includes(selectedRole);
  
  if (isSupportRole) {
    levelSelect.value = "Generic";
    levelSelect.disabled = true;
    // Add subtle helper description
    document.getElementById("levelFormGroup").style.opacity = "0.5";
    document.getElementById("levelHelperText").textContent = t.levelHelperText;
  } else {
    levelSelect.disabled = false;
    document.getElementById("levelFormGroup").style.opacity = "1";
    document.getElementById("levelHelperText").textContent = "";
  }
}

// Handle Onboarding Completion
async function handleOnboardingSubmit() {
  const role = document.getElementById("wizardRole").value;
  const level = document.getElementById("wizardLevel").value;
  const lang = document.getElementById("wizardLang").value;

  appState.userRole = role;
  appState.institutionLevel = level;
  appState.activeLanguage = lang;

  // Cache in localStorage
  localStorage.setItem("ge_adoption_profile", JSON.stringify({ role, level, lang }));

  // Hide overlay
  document.getElementById("wizardOverlay").style.display = "none";

  // Update UI and load content
  updateUILanguage();
  updateSidebarContextUI();
  
  // Fetch use cases and render
  await loadUseCasesFromServer();
  renderUseCases();
  
  const welcomeText = uiTranslations[lang].profileSetSuccess;
  showToast(welcomeText, "success");
}

// Update Context Profile Cards in UI
function updateSidebarContextUI() {
  const lang = appState.activeLanguage || "en";
  const t = uiTranslations[lang];

  const roleText = t.roles[appState.userRole] || appState.userRole;
  document.getElementById("sidebarRole").textContent = roleText;
  
  const isSupportRole = ["Security", "Finance", "IT Admin", "SAO"].includes(appState.userRole);
  if (isSupportRole) {
    document.getElementById("sidebarLevel").textContent = lang === "en" ? "Global (All Levels)" : (lang === "zh-TW" ? "全局 (所有級別)" : "全局 (所有级别)");
  } else {
    const levelText = t.levels[appState.institutionLevel] || appState.institutionLevel;
    document.getElementById("sidebarLevel").textContent = levelText;
  }

  // Update navbar welcome text
  document.getElementById("navbarWelcomeText").textContent = `Edu GE Adoption Portal • ${roleText}`;
}

// Configure Connector Toggles
function setupConnectorToggles() {
  const toggles = [
    { id: "toggleOneDrive", key: "onedrive" },
    { id: "toggleOutlook", key: "outlook" },
    { id: "toggleLMS", key: "lms" },
    { id: "toggleGoogle", key: "google" }
  ];

  toggles.forEach(t => {
    const el = document.getElementById(t.id);
    if (!el) {
      console.warn(`Connector toggle element not found: ${t.id}`);
      return;
    }
    el.addEventListener("change", (e) => {
      appState.activeConnectors[t.key] = e.target.checked;
      
      // Update green visual indicators in sidebar list
      const indicator = document.getElementById(`indicator-${t.key}`);
      const lang = appState.activeLanguage || "en";
      const tTrans = uiTranslations[lang];

      if (e.target.checked) {
        if (indicator) indicator.classList.add("active");
        let genericName = t.key.toUpperCase();
        if (t.key === "onedrive") genericName = lang === "en" ? "Drive Connector" : (lang === "zh-TW" ? "雲端硬碟連接器" : "云端硬盘连接器");
        else if (t.key === "outlook") genericName = lang === "en" ? "Email Connector" : (lang === "zh-TW" ? "電子郵件連接器" : "电子邮件连接器");
        else if (t.key === "lms") genericName = lang === "en" ? "LMS Connector" : (lang === "zh-TW" ? "LMS 連接器" : "LMS 连接器");
        else if (t.key === "google") genericName = lang === "en" ? "Calendar Connector" : (lang === "zh-TW" ? "行事曆連接器" : "日历连接器");
        showToast(`${genericName} ${tTrans.linkedAndActive}`, "success");
      } else {
        if (indicator) indicator.classList.remove("active");
      }
      
      // Re-render dashboard cards
      renderUseCases();
    });
  });
}

// Search input handling
function handleSearchInput(e) {
  appState.searchQuery = e.target.value.toLowerCase();
  renderUseCases();
}

// Main Render Loop for Use Cases Grid
function renderUseCases() {
  const container = document.getElementById("useCasesContainer");
  container.innerHTML = ""; // clear current cards
  const lang = appState.activeLanguage || "en";
  const t = uiTranslations[lang];

  // Filter use cases from db based on state
  const filteredUseCases = useCasesDb.filter(useCase => {
    // 1. Role Filter Mapping: Show academic support cases to everyone, but specialize core hubs
    // A. Role match
    let matchesRole = false;
    const isSupportRole = ["Security", "Finance", "IT Admin", "SAO"].includes(appState.userRole);
    
    if (appState.userRole === "Lecturer") {
      matchesRole = ["Lecturer", "TA"].includes(useCase.role) || useCase.category === "academic";
    } else if (appState.userRole === "TA") {
      matchesRole = ["Lecturer", "TA"].includes(useCase.role) || useCase.category === "academic";
    } else if (appState.userRole === "Student") {
      matchesRole = useCase.role === "Student" || useCase.category === "student";
    } else if (isSupportRole) {
      matchesRole = [appState.userRole, "IT Admin", "Program Leader", "Dean", "SAO"].includes(useCase.role) || 
                    ["operational", "administrative"].includes(useCase.category);
    } else if (appState.userRole === "Program Leader" || appState.userRole === "Dean") {
      matchesRole = ["Lecturer", "Program Leader", "Dean"].includes(useCase.role) || useCase.category === "operational";
    } else {
      matchesRole = true;
    }

    // 2. Institution Level Filter: Support roles ignore this completely.
    let matchesLevel = true;
    if (!isSupportRole && useCase.level && useCase.level.length > 0) {
      matchesLevel = useCase.level.includes("Generic") || useCase.level.includes(appState.institutionLevel);
    }

    // 3. Feature Tags filter
    let matchesFeature = true;
    if (appState.activeFilterFeature !== "all") {
      matchesFeature = useCase.features.some(f => f.toLowerCase() === appState.activeFilterFeature.toLowerCase());
    }

    // 4. Status Filter (Connector dependencies)
    let matchesStatus = true;
    const hasMissingConnector = checkMissingConnector(useCase);
    if (appState.activeFilterStatus === "standard" || appState.activeFilterStatus === "unlocked") {
      matchesStatus = !hasMissingConnector;
    } else if (appState.activeFilterStatus === "integration") {
      matchesStatus = hasMissingConnector;
    }

    // 5. Search Bar Query
    let matchesSearch = true;
    if (appState.searchQuery) {
      // Localized search lookup
      const trans = useCasesTranslations[useCase.id] ? useCasesTranslations[useCase.id][lang] : null;
      const cTitle = trans ? trans.title : useCase.title;
      const cSummary = trans ? trans.summary : useCase.summary;

      matchesSearch = cTitle.toLowerCase().includes(appState.searchQuery) || 
                      cSummary.toLowerCase().includes(appState.searchQuery) ||
                      useCase.role.toLowerCase().includes(appState.searchQuery) ||
                      useCase.features.some(f => f.toLowerCase().includes(appState.searchQuery));
    }

    // 6. Category Filter (Sidebar navigation)
    let matchesCategory = true;
    if (appState.activeFilterCategory && appState.activeFilterCategory !== "all") {
      const filterCat = appState.activeFilterCategory === "admin" ? "administrative" : appState.activeFilterCategory;
      matchesCategory = useCase.category === filterCat;
    }

    return matchesRole && matchesLevel && matchesFeature && matchesStatus && matchesSearch && matchesCategory;
  });

  // Group filtered use cases by Hub Category
  const categories = {
    academic: { title: t.hubs.academic, icon: "school", class: "hub-academic", items: [] },
    student: { title: t.hubs.student, icon: "diversity_3", class: "hub-student", items: [] },
    operational: { title: t.hubs.operational, icon: "terminal", class: "hub-operational", items: [] },
    administrative: { title: t.hubs.administrative, icon: "admin_panel_settings", class: "hub-admin-support", items: [] }
  };

  filteredUseCases.forEach(uc => {
    if (categories[uc.category]) {
      categories[uc.category].items.push(uc);
    }
  });

  // Sort each Hub Category's items programmatically:
  // Standalone tools (connectors.length === 0) ALWAYS float to the top.
  // Connector required tools (connectors.length > 0) sorted to the very bottom!
  Object.keys(categories).forEach(key => {
    const hub = categories[key];
    hub.items.sort((a, b) => {
      const aHas = a.connectors && a.connectors.length > 0 ? 1 : 0;
      const bHas = b.connectors && b.connectors.length > 0 ? 1 : 0;
      return aHas - bHas; // (0 - 1) means 'a' goes first (at top), (1 - 0) means 'b' goes first.
    });
  });

  // Render Hub Segments
  let renderedCount = 0;
  Object.keys(categories).forEach(key => {
    const hub = categories[key];
    if (hub.items.length === 0) return; // skip empty hubs

    renderedCount += hub.items.length;

    // Create Hub Container
    const hubSection = document.createElement("div");
    hubSection.className = `hub-section ${hub.class}`;

    const hubHeader = document.createElement("div");
    hubHeader.className = "hub-header";
    hubHeader.innerHTML = `
      <div class="hub-title-wrapper">
        <div class="hub-icon-badge">
          <span class="material-symbols-outlined">${hub.icon}</span>
        </div>
        <h2 class="hub-title">${hub.title}</h2>
      </div>
      <span class="hub-count-tag">${hub.items.length} ${lang === "en" ? "Use Case" + (hub.items.length > 1 ? 's' : '') : (lang === "zh-TW" ? "個案例" : "个案例")}</span>
    `;

    const cardsGrid = document.createElement("div");
    cardsGrid.className = "cards-grid";

    // Create Cards
    hub.items.forEach(uc => {
      const card = document.createElement("div");
      card.className = "card glass-panel";
      card.addEventListener("click", () => openUseCaseModal(uc));

      const hasMissingConnector = checkMissingConnector(uc);

      // Extract translated versions
      const trans = useCasesTranslations[uc.id] ? useCasesTranslations[uc.id][lang] : null;
      const cardTitle = trans ? trans.title : uc.title;
      const cardSummary = trans ? trans.summary : uc.summary;

      // Build Tag Pills HTML
      let tagsHtml = "";
      uc.features.forEach(f => {
        tagsHtml += `<span class="tag tag-feature">${f}</span>`;
      });
      if (uc.level && uc.level.length > 0) {
        const levelText = t.levels[uc.level[0]] || uc.level[0];
        tagsHtml += `<span class="tag tag-level">${levelText}</span>`;
      }

      // Connector localized title
      let connectorLabelHtml = "";
      if (uc.connectors.length > 0) {
        const connectorsListText = uc.connectors.map(c => {
          if (c.toLowerCase().includes("drive")) return lang === "en" ? "Drive Connector" : "Drive 連接器";
          if (c.toLowerCase().includes("email")) return lang === "en" ? "Email Connector" : "Email 連接器";
          if (c.toLowerCase().includes("lms")) return lang === "en" ? "LMS Connector" : "LMS 連接器";
          if (c.toLowerCase().includes("calendar") || c.toLowerCase().includes("google")) return lang === "en" ? "Calendar Connector" : "Calendar 連接器";
          return c;
        }).join(', ');
        
        if (uc.connectorEssential === false) {
          connectorLabelHtml = `
            <span class="card-connector-req" style="color: var(--color-primary); background: rgba(79, 70, 229, 0.05); border: 1px dashed rgba(79, 70, 229, 0.25); padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; font-size: 11px;">
              <span class="material-symbols-outlined" style="color: var(--color-primary); font-size: 14px;">api</span>
              ${connectorsListText} (${lang === "en" ? "Optional" : (lang === "zh-TW" ? "可擴充" : "可扩充")})
            </span>
          `;
        } else {
          connectorLabelHtml = `
            <span class="card-connector-req">
              <span class="material-symbols-outlined">api</span>
              ${connectorsListText} ${lang === "en" ? "Required" : (lang === "zh-TW" ? "集成連線" : "集成连线")}
            </span>
          `;
        }
      } else {
        connectorLabelHtml = `
          <span class="card-connector-req" style="color: var(--color-success)">
            <span class="material-symbols-outlined">check_circle</span>
            ${lang === "en" ? "Standalone Tool" : (lang === "zh-TW" ? "標準工具" : "标准工具")}
          </span>
        `;
      }

      // Build card content
      let cardInnerHtml = `
        <div class="card-top">
          <div class="card-tags">${tagsHtml}</div>
          <h3 class="card-title">${cardTitle}</h3>
          <p class="card-summary">${cardSummary}</p>
        </div>
        <div class="card-bottom">
          <span class="tag" style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05); color: var(--text-secondary)">${t.roles[uc.role] || uc.role}</span>
          ${connectorLabelHtml}
        </div>
      `;

      card.innerHTML = cardInnerHtml;

      // Handle Lock Overlay if connectors configured but toggled off
      if (hasMissingConnector) {
        const missing = uc.connectors.find(c => {
          if (c.toLowerCase().includes("drive")) return !appState.activeConnectors.onedrive;
          if (c.toLowerCase().includes("email")) return !appState.activeConnectors.outlook;
          if (c.toLowerCase().includes("lms")) return !appState.activeConnectors.lms;
          if (c.toLowerCase().includes("calendar") || c.toLowerCase().includes("google")) return !appState.activeConnectors.google;
          return false;
        });

        // Map to a pretty local name
        let prettyMissing = missing;
        if (missing.toLowerCase().includes("drive")) prettyMissing = lang === "en" ? "Drive Connector" : "Drive 連接器";
        else if (missing.toLowerCase().includes("email")) prettyMissing = lang === "en" ? "Email Connector" : "Email 連接器";
        else if (missing.toLowerCase().includes("lms")) prettyMissing = lang === "en" ? "LMS Connector" : "LMS 連接器";
        else if (missing.toLowerCase().includes("calendar") || missing.toLowerCase().includes("google")) prettyMissing = lang === "en" ? "Calendar Connector" : "Calendar 連接器";

        const lockOverlay = document.createElement("div");
        lockOverlay.className = "card-lock-overlay";
        lockOverlay.innerHTML = `
          <div class="lock-icon-wrapper">
            <span class="material-symbols-outlined">lock</span>
          </div>
          <h4 class="lock-title">${t.integrationRequired}</h4>
          <p class="lock-subtitle">${lang === "en" ? `Requires active ${prettyMissing} to run securely.` : `安全操作需要連接 ${prettyMissing}。`}</p>
          <button class="unlock-action-btn" onclick="event.stopPropagation(); handleQuickUnlock('${missing}')">${t.simulatedConnect}</button>
        `;
        card.appendChild(lockOverlay);
      }

      cardsGrid.appendChild(card);
    });

    hubSection.appendChild(hubHeader);
    hubSection.appendChild(cardsGrid);
    container.appendChild(hubSection);
  });

  // Render empty state if no matching cases found
  if (renderedCount === 0) {
    container.innerHTML = `
      <div class="glass-panel" style="padding: 60px; text-align: center; border-style: dashed;">
        <span class="material-symbols-outlined" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;">search_off</span>
        <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">${t.noUseCasesTitle}</h3>
        <p style="color: var(--text-secondary); max-width: 440px; margin: 0 auto 20px auto; font-size: 14px;">${t.noUseCasesDesc}</p>
        <button class="nav-button nav-button-primary" style="margin: 0 auto;" id="btnResetFilters">${t.btnResetFilters}</button>
      </div>
    `;
    document.getElementById("btnResetFilters").addEventListener("click", () => {
      document.getElementById("searchInput").value = "";
      appState.searchQuery = "";
      renderUseCases();
    });
  }
}

// Quick Unlock Connector Toggle from Card Lock Screen
window.handleQuickUnlock = function(connectorName) {
  let toggleId = "";
  let key = "";
  const nameLower = connectorName.toLowerCase();

  if (nameLower.includes("drive")) {
    toggleId = "toggleOneDrive";
    key = "onedrive";
  } else if (nameLower.includes("email") || nameLower.includes("outlook")) {
    toggleId = "toggleOutlook";
    key = "outlook";
  } else if (nameLower.includes("lms")) {
    toggleId = "toggleLMS";
    key = "lms";
  } else if (nameLower.includes("calendar") || nameLower.includes("google")) {
    toggleId = "toggleGoogle";
    key = "google";
  }

  if (toggleId) {
    document.getElementById(toggleId).checked = true;
    appState.activeConnectors[key] = true;
    document.getElementById(`indicator-${key}`).classList.add("active");
    renderUseCases();
    
    const lang = appState.activeLanguage || "en";
    const tTrans = uiTranslations[lang];
    const localizedSuccess = `${connectorName} ${tTrans.connectorLinkedSuccess}`;
    showToast(localizedSuccess, "success");
  }
};

// Check if a use case has missing connector dependencies
function checkMissingConnector(useCase) {
  if (!useCase.connectors || useCase.connectors.length === 0) return false;
  if (useCase.connectorEssential === false) return false; // non-essential connectors never lock the card

  return useCase.connectors.some(c => {
    const cLower = c.toLowerCase();
    if (cLower.includes("drive")) return !appState.activeConnectors.onedrive;
    if (cLower.includes("email") || cLower.includes("outlook")) return !appState.activeConnectors.outlook;
    if (cLower.includes("lms")) return !appState.activeConnectors.lms;
    if (cLower.includes("calendar") || cLower.includes("google")) return !appState.activeConnectors.google;
    return false;
  });
}

// Modal Detail View Rendering
function openUseCaseModal(useCase) {
  const overlay = document.getElementById("modalOverlay");
  const lang = appState.activeLanguage || "en";
  const t = uiTranslations[lang];

  // Look up translations
  const trans = useCasesTranslations[useCase.id] ? useCasesTranslations[useCase.id][lang] : null;
  const title = trans ? trans.title : useCase.title;
  const summary = trans ? trans.summary : useCase.summary;

  // Set Title
  document.getElementById("modalTitle").textContent = title;

  // Set metadata tags
  let tagsHtml = "";
  useCase.features.forEach(f => {
    tagsHtml += `<span class="tag tag-feature" style="font-size: 11px;">${f}</span>`;
  });
  if (useCase.level && useCase.level.length > 0) {
    const levelText = t.levels[useCase.level[0]] || useCase.level[0];
    tagsHtml += `<span class="tag tag-level" style="font-size: 11px;">${levelText}</span>`;
  }
  document.getElementById("modalTags").innerHTML = tagsHtml;

  // Render Body Sections
  const body = document.getElementById("modalDynamicContent");
  body.innerHTML = ""; // clear old modal contents

  // 1. Overview Section
  const overviewSec = document.createElement("div");
  overviewSec.className = "modal-section";
  overviewSec.innerHTML = `
    <h4 class="section-label">
      <span class="material-symbols-outlined">info</span> ${t.overviewLabel}
    </h4>
    <p style="font-size: 15px; color: var(--text-secondary); line-height: 1.6;">${summary}</p>
  `;
  body.appendChild(overviewSec);

  // Check if this usecase has connectors
  const hasConnectors = useCase.connectors && useCase.connectors.length > 0;
  const isEssential = useCase.connectorEssential !== false; // defaults to essential if not specified

  // Initialize advanced mode based on current live connection state
  let isAdvanced = false;
  if (hasConnectors && !isEssential) {
    const actualConnectorMissing = checkMissingConnector(useCase);
    isAdvanced = !actualConnectorMissing; // default to true if already connected
  }

  // 2. Integration / Connector Requirements Container
  const integrationContainer = document.createElement("div");
  body.appendChild(integrationContainer);

  // 3. Dynamic Sections Container (for Steps, Prompt, and Pro Tip)
  const dynamicContainer = document.createElement("div");
  body.appendChild(dynamicContainer);

  function renderDynamicParts() {
    dynamicContainer.innerHTML = "";
    integrationContainer.innerHTML = "";

    // A. Render integration box if hasConnectors
    if (hasConnectors) {
      const hasMissing = checkMissingConnector(useCase);
      const connectorGuide = trans ? trans.connectorGuide : useCase.connectorGuide;
      
      let guideHtml = "";
      if (connectorGuide && (isEssential || isAdvanced)) {
        let stepsLi = "";
        connectorGuide.steps.forEach(s => {
          stepsLi += `<li>${s}</li>`;
        });
        guideHtml = `
          <div class="setup-guide-box" style="margin-top: 16px;">
            <div class="setup-guide-header">
              <span class="material-symbols-outlined">settings_suggest</span>
              ${connectorGuide.name} ${lang === "en" ? "Setup Instructions" : "部署設定指南"}
            </div>
            <ol class="setup-steps">${stepsLi}</ol>
          </div>
        `;
      }

      const firstConnector = useCase.connectors[0];
      const statusText = hasMissing ? t.inactiveAccessRestricted : t.linkedAndActive;

      let innerContentHtml = "";
      if (isEssential || isAdvanced) {
        innerContentHtml = `
          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); border-radius: 12px; padding: 16px 20px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: ${hasMissing ? 'var(--color-danger)' : 'var(--color-success)'}; box-shadow: 0 0 10px ${hasMissing ? 'var(--color-danger)' : 'var(--color-success)'}"></div>
              <span style="font-size: 14px; font-weight: 600; color: var(--text-primary)">
                Connector: ${statusText}
              </span>
            </div>
            ${hasMissing ? `
              <button class="nav-button nav-button-primary" style="height: 32px; font-size: 12px; border-radius: 8px;" onclick="handleQuickUnlock('${firstConnector}'); openUseCaseModal(JSON.parse('${escapeQuotesForOnClick(JSON.stringify(useCase))}'));">${t.linkConnector}</button>
            ` : `
              <span style="font-size: 12px; color: var(--color-success); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                <span class="material-symbols-outlined" style="font-size: 18px;">cloud_done</span> ${t.encryptedFederatedActive}
              </span>
            `}
          </div>
          ${guideHtml}
        `;
      } else {
        innerContentHtml = `
          <div style="display: flex; align-items: flex-start; gap: 12px; background: rgba(255, 255, 255, 0.01); border: 1px dashed var(--border-glass); border-radius: 12px; padding: 16px 20px;">
            <span class="material-symbols-outlined" style="color: var(--text-muted); font-size: 20px;">cloud_off</span>
            <div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">${lang === "en" ? "Standalone Mode (Manual File Uploads)" : (lang === "zh-TW" ? "標準模式（手動上傳檔案）" : "标准模式（手动上传档案）")}</div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${lang === "en" ? "Currently showing manual workflow. Use the toggle above to enable real-time connector setup." : (lang === "zh-TW" ? "目前顯示手動作業流程。開啟上方切換器以啟用即時連接器整合部署設定。" : "目前显示手动作业流程。开启上方切换器以启用即时连接器整合部署设定。")}</div>
            </div>
          </div>
        `;
      }

      const integrationSec = document.createElement("div");
      integrationSec.className = "modal-section";
      integrationSec.style.marginBottom = "8px";
      integrationSec.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 12px;">
          <h4 class="section-label" style="margin-bottom: 0;">
            <span class="material-symbols-outlined">api</span> ${t.enterpriseIntegrationLabel}
          </h4>
          ${(!isEssential) ? `
            <div style="display: flex; align-items: center; gap: 10px; background: rgba(79, 70, 229, 0.06); border: 1px dashed rgba(79, 70, 229, 0.2); border-radius: 20px; padding: 4px 12px;">
              <span style="font-size: 12px; font-weight: 700; color: var(--color-primary);">${lang === "en" ? "Extend to Advanced Connector" : (lang === "zh-TW" ? "啟用進階連接器" : "启用进阶连接器")}</span>
              <label class="switch">
                <input type="checkbox" id="modalConnectorToggle" ${isAdvanced ? 'checked' : ''}>
                <span class="slider round"></span>
              </label>
            </div>
          ` : ''}
        </div>
        ${innerContentHtml}
      `;
      integrationContainer.appendChild(integrationSec);

      // Bind listener
      const toggleEl = document.getElementById("modalConnectorToggle");
      if (toggleEl) {
        toggleEl.addEventListener("change", (e) => {
          isAdvanced = e.target.checked;
          renderDynamicParts();
        });
      }
    }

    // B. Get active fields (Steps, Prompt, ProTip)
    let currentSteps, currentPrompt, currentProTip;
    if (hasConnectors && !isEssential && isAdvanced) {
      currentSteps = trans ? (trans.advancedSteps || trans.steps) : (useCase.advancedSteps || useCase.steps);
      currentPrompt = trans ? (trans.advancedPrompt || trans.prompt) : (useCase.advancedPrompt || useCase.prompt);
      currentProTip = trans ? (trans.advancedProTip || trans.proTip) : (useCase.advancedProTip || useCase.proTip);
    } else {
      currentSteps = trans ? trans.steps : useCase.steps;
      currentPrompt = trans ? trans.prompt : useCase.prompt;
      currentProTip = trans ? trans.proTip : useCase.proTip;
    }

    // C. Render Steps List
    if (currentSteps && currentSteps.length > 0) {
      const stepsSec = document.createElement("div");
      stepsSec.className = "modal-section";
      let stepLiHtml = "";
      currentSteps.forEach((step, idx) => {
        stepLiHtml += `
          <li class="step-item">
            <div class="step-num">${idx + 1}</div>
            <div>${step}</div>
          </li>
        `;
      });
      stepsSec.innerHTML = `
        <h4 class="section-label">
          <span class="material-symbols-outlined">route</span> ${t.operationalSteps}
        </h4>
        <ul class="steps-list">${stepLiHtml}</ul>
      `;
      dynamicContainer.appendChild(stepsSec);
    }

    // D. Render Prompt Box with padding from Operational Steps above
    if (currentPrompt) {
      const promptSec = document.createElement("div");
      promptSec.className = "modal-section";
      promptSec.style.marginTop = "28px"; // Spacing from last step of operational steps
      promptSec.innerHTML = `
        <h4 class="section-label">
          <span class="material-symbols-outlined">terminal</span> ${t.promptSandbox}
        </h4>
        <div class="prompt-box" id="modalPromptText">${escapeHtml(currentPrompt)}<button class="copy-prompt-btn" onclick="copyPromptToClipboard()"><span class="material-symbols-outlined" style="font-size: 16px;">content_copy</span> ${t.copyPrompt}</button>
        </div>
      `;
      dynamicContainer.appendChild(promptSec);
    }

    // E. Render Pro Tip Box with padding from Prompt Box above
    if (currentProTip) {
      const proTipSec = document.createElement("div");
      proTipSec.className = "modal-section";
      proTipSec.style.marginTop = "28px"; // Spacing from Prompt Box above
      proTipSec.innerHTML = `
        <div class="pro-tip-box">
          <span class="material-symbols-outlined pro-tip-icon">lightbulb</span>
          <div class="pro-tip-content">
            <div class="pro-tip-title">${t.adoptionProTip}</div>
            <p class="pro-tip-text">${currentProTip}</p>
          </div>
        </div>
      `;
      dynamicContainer.appendChild(proTipSec);
    }
  }

  // Render initial dynamic parts
  renderDynamicParts();

  overlay.classList.add("active");
}

// Utility to escape quotes for dynamic inline onClick triggers
function escapeQuotesForOnClick(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Utility to escape HTML text for raw display
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Close Detail Modal
function closeModal() {
  document.getElementById("modalOverlay").classList.remove("active");
}

// Interactive Copy Button Logic
window.copyPromptToClipboard = function() {
  const container = document.getElementById("modalPromptText");
  const lang = appState.activeLanguage || "en";
  const t = uiTranslations[lang];

  // Extract text excluding the button element's innerText
  const text = container.childNodes[0].nodeValue.trim();
  
  navigator.clipboard.writeText(text).then(() => {
    const successCopiedText = t.promptCopiedSuccess;
    showToast(successCopiedText, "success");
    const copyBtn = container.querySelector(".copy-prompt-btn");
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px; color: var(--color-success)">check_circle</span> ${t.copied}`;
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
  });
};

// Premium Toast Notification Manager
function showToast(message, type = "success") {
  const toast = document.getElementById("toastNotification");
  const toastMsg = document.getElementById("toastMsg");
  const toastIcon = document.getElementById("toastIcon");

  toastMsg.textContent = message;
  if (type === "success") {
    toastIcon.textContent = "check_circle";
    toast.style.background = "rgba(16, 185, 129, 0.95)";
  } else {
    toastIcon.textContent = "warning";
    toast.style.background = "rgba(245, 158, 11, 0.95)";
  }

  toast.classList.add("active");
  setTimeout(() => {
    toast.classList.remove("active");
  }, 3500);
}

// Enhance the useCases database with non-essential connector fallbacks and translations
function enhanceUseCasesDatabase() {
  // Mark all connector-dependent use cases as non-essential except when specified
  useCasesDb.forEach(uc => {
    if (uc.connectors && uc.connectors.length > 0) {
      uc.connectorEssential = false;
    }
  });

  // Overrides for su_advocacy
  const su_advocacy = useCasesDb.find(uc => uc.id === "su_advocacy");
  if (su_advocacy) {
    su_advocacy.steps = [
      "Consolidate unstructured student feedback text files, town hall audio recordings, and survey responses locally.",
      "Upload these files directly to a secure NotebookLM workspace manually.",
      "Query NotebookLM to extract the top 5 pressing student concerns (e.g., dining hours, library quiet spaces) and compute overall sentiment.",
      "Use Gemini in Google Docs to write a structured, data-driven advocacy proposal to submit to the school administration."
    ];
    su_advocacy.advancedSteps = [
      "Consolidate unstructured student feedback text files, town hall audio recordings, and survey responses in a shared Drive folder.",
      "Ground a NotebookLM workspace directly on this folder using the secure Drive Connector.",
      "Query NotebookLM to extract the top 5 pressing student concerns (e.g., dining hours, library quiet spaces) and compute overall sentiment.",
      "Use Gemini in Google Docs to write a structured, data-driven advocacy proposal to submit to the school administration."
    ];
    su_advocacy.proTip = "Uploading student feedback files directly to NotebookLM is secure and maintains total data privacy without any public model training.";
    su_advocacy.advancedProTip = "Linking your student feedback database directly via the Drive Connector keeps the data federated, secure, and up-to-the-minute without copying local files.";
  }

  // Translations for su_advocacy
  if (useCasesTranslations.su_advocacy) {
    useCasesTranslations.su_advocacy.en.steps = su_advocacy.steps;
    useCasesTranslations.su_advocacy.en.advancedSteps = su_advocacy.advancedSteps;
    useCasesTranslations.su_advocacy.en.proTip = su_advocacy.proTip;
    useCasesTranslations.su_advocacy.en.advancedProTip = su_advocacy.advancedProTip;

    useCasesTranslations.su_advocacy["zh-TW"].steps = [
      "在本地整理非結構化學生回饋文字檔、公聽會錄音檔與問卷回覆。",
      "手動將這些檔案直接上傳到安全的 NotebookLM 工作空間。",
      "引導 NotebookLM 提取前 5 大最受關注的學生訴求（如餐廳營業時間、圖書館自修室），並分析整體情緒指標。",
      "在 Google Docs 中使用 Gemini 撰寫結構化、數據導向的權益倡議提案，並提交給學校行政部門。"
    ];
    useCasesTranslations.su_advocacy["zh-TW"].advancedSteps = [
      "在共享的雲端硬碟資料夾中整理非結構化學生回饋文字檔、公聽會錄音與問卷。",
      "使用安全的 Drive Connector，將 NotebookLM 工作空間直接連結至該資料夾。",
      "引導 NotebookLM 提取前 5 大最受關注的學生訴求（如餐廳營業時間、圖書館自修室），並分析整體情緒指標。",
      "在 Google Docs 中使用 Gemini 撰寫結構化、數據導向的權益倡議提案，並提交給學校行政部門。"
    ];
    useCasesTranslations.su_advocacy["zh-TW"].proTip = "手動上傳學生回饋檔案到 NotebookLM 是極安全的，能在不使用公開模型訓練的前提下保障數據隱私。";
    useCasesTranslations.su_advocacy["zh-TW"].advancedProTip = "透過 Drive Connector 直接連結學生意見資料庫，能在不複製本地檔案的前提下，保持數據的同盟性、安全性與即時性。";

    useCasesTranslations.su_advocacy["zh-CN"].steps = [
      "在本地整理非结构化学生反馈文本档、公听会录音档与问卷回复。",
      "手动将这些文件直接上传到安全的 NotebookLM 工作空间。",
      "引导 NotebookLM 提取前 5 大最受关注的学生诉求（如餐厅营业时间、图书馆自修室），并分析整体情绪指标。",
      "在 Google Docs 中使用 Gemini 撰写结构化、数据导向的权益倡议提案，并提交给学校行政部门。"
    ];
    useCasesTranslations.su_advocacy["zh-CN"].advancedSteps = [
      "在共享的云端硬盘文件夹中整理非结构化学生反馈文本档、公听会录音与问卷。",
      "使用安全的 Drive Connector，将 NotebookLM 工作空间直接链接至该文件夹。",
      "引导 NotebookLM 提取前 5 大最受关注的学生诉求（如餐厅营业时间、图书馆自修室），并分析整体情绪指标。",
      "在 Google Docs 中使用 Gemini 撰写结构化、数据导向的权益倡议提案，并提交给学校行政部门。"
    ];
    useCasesTranslations.su_advocacy["zh-CN"].proTip = "手动上传学生反馈文件到 NotebookLM 是极安全的，能在不使用公开模型训练的前提下保障数据隐私。";
    useCasesTranslations.su_advocacy["zh-CN"].advancedProTip = "通过 Drive Connector 直接链接学生意见数据库，能在不复制本地文件的前提下，保持数据的同盟性、安全性与即时性。";
  }

  // Overrides for club_funding
  const club_funding = useCasesDb.find(uc => uc.id === "club_funding");
  if (club_funding) {
    club_funding.steps = [
      "Open NotebookLM and upload your club's past event templates and the official Student Union funding guidelines.",
      "In Canvas Mode, prompt Gemini to brainstorm a calendar of 12 highly engaging club activities aligned with your club's core mission.",
      "Paste or upload your past expense spreadsheet records directly into the prompt to generate a formatted budget table.",
      "Ask Gemini to write a formal budget justification narrative, detailing how each event benefits the wider campus student community."
    ];
    club_funding.advancedSteps = [
      "Open NotebookLM and upload your club's past event templates and the official Student Union funding guidelines.",
      "In Canvas Mode, prompt Gemini to brainstorm a calendar of 12 highly engaging club activities aligned with your club's core mission.",
      "Feed the calendar and past expense records from your shared Drive spreadsheet using the Drive Connector to generate a formatted budget table.",
      "Ask Gemini to write a formal budget justification narrative, detailing how each event benefits the wider campus student community."
    ];
    club_funding.proTip = "Upload the Student Union's official constitutional funding guidelines to NotebookLM first. This prevents your proposal from getting rejected for violating obscure spend-limit policies.";
    club_funding.advancedProTip = "Grounding your shared Drive spreadsheet with the Drive Connector ensures that Gemini always computes budgets against the most up-to-date club account balances.";
  }

  if (useCasesTranslations.club_funding) {
    useCasesTranslations.club_funding.en.steps = club_funding.steps;
    useCasesTranslations.club_funding.en.advancedSteps = club_funding.advancedSteps;
    useCasesTranslations.club_funding.en.proTip = club_funding.proTip;
    useCasesTranslations.club_funding.en.advancedProTip = club_funding.advancedProTip;

    useCasesTranslations.club_funding["zh-TW"].steps = [
      "開啟 NotebookLM 並上傳您社團過往的活動範本與學生會官方補助指南。",
      "在 Canvas Mode 中，引導 Gemini 腦力激盪出 12 個與社團核心宗旨高度契合的精彩活動行事曆。",
      "手動將共享雲端硬碟試算表中的歷史支出紀錄貼入提示詞中，以生成格式化預算表。",
      "引導 Gemini 撰寫正式的預算合理性陳述，詳細說明每項活動將如何使廣大校園社群受益。"
    ];
    useCasesTranslations.club_funding["zh-TW"].advancedSteps = [
      "開啟 NotebookLM 並上傳您社團過往的活動範本與學生會官方補助指南。",
      "在 Canvas Mode 中，引導 Gemini 腦力激盪出 12 個與社團核心宗旨高度契合的精彩活動行事曆。",
      "透過 Drive Connector 讀取共享雲端硬碟試算表中的歷史支出紀錄，以生成格式化預算表。",
      "引導 Gemini 撰寫正式的預算合理性陳述，詳細說明每項活動將如何使廣大校園社群受益。"
    ];
    useCasesTranslations.club_funding["zh-TW"].proTip = "先將學生會的官方章程補助指南上傳至 NotebookLM。這能有效防止您的申請案因違反某些冷門的支出限額規定而被退件。";
    useCasesTranslations.club_funding["zh-TW"].advancedProTip = "透過 Drive Connector 連結您的共享試算表，能確保 Gemini 始終對齊最新的社團帳戶餘額進行預算試算。";

    useCasesTranslations.club_funding["zh-CN"].steps = [
      "开启 NotebookLM 并上传您社团过往的活动模板与学生会官方补助指南。",
      "在 Canvas Mode 中，引导 Gemini 脑力激荡出 12 个与社团核心宗旨高度契合的精彩活动日历。",
      "手动将共享云端硬盘电子表格中的历史支出记录贴入提示词中，以生成格式化预算表。",
      "引导 Gemini 撰写正式的预算合理性陈述，详细说明每项活动将如何使广大校园社群受益。"
    ];
    useCasesTranslations.club_funding["zh-CN"].advancedSteps = [
      "开启 NotebookLM 并上传您社团过往的活动模板与学生会官方补助指南。",
      "在 Canvas Mode 中，引导 Gemini 脑力荡出 12 个与社团核心宗旨高度契合的精彩活动日历。",
      "通过 Drive Connector 读取共享云端硬盘电子表格中的历史支出记录，以生成格式化预算表。",
      "引导 Gemini 撰写正式的预算合理性陈述，详细说明每项活动将如何使广大校园社群受益。"
    ];
    useCasesTranslations.club_funding["zh-CN"].proTip = "先将学生会的官方章程补助指南上传至 NotebookLM。这能有效防止您的申请案因违反某些冷门的支出限额规定而被退件。";
    useCasesTranslations.club_funding["zh-CN"].advancedProTip = "通过 Drive Connector 链接您的共享电子表格，能确保 Gemini 始终对齐最新的社团账户余额进行预算试算。";
  }

  // Overrides for su_helpdesk
  const su_helpdesk = useCasesDb.find(uc => uc.id === "su_helpdesk");
  if (su_helpdesk) {
    su_helpdesk.steps = [
      "In NotebookLM, compile all Student Union club policies, room booking rules, and equipment reservation forms.",
      "Use Gemini Agent Designer to build a conversational agent named 'Student Union Support Assistant'.",
      "Connect the agent to the policy knowledge base and configure it to draft escalation templates for complex bookings.",
      "Test the agent's ability to handle complex queries (e.g. 'Can we book a room after 9 PM?').",
      "Embed the agent on the Student Union portal or social media page for 24/7 club leader support."
    ];
    su_helpdesk.advancedSteps = [
      "In NotebookLM, compile all Student Union club policies, room booking rules, and equipment reservation forms.",
      "Use Gemini Agent Designer to build a conversational agent named 'Student Union Support Assistant'.",
      "Connect the agent to the policy knowledge base and configure custom escalate-by-email instructions via the Email Connector.",
      "Test the agent's ability to handle complex queries (e.g. 'Can we book a room after 9 PM?').",
      "Embed the agent on the Student Union portal or social media page for 24/7 club leader support."
    ];
    su_helpdesk.proTip = "By utilizing the Agent Designer, you can define clear guidelines for the assistant to draft formal, ready-to-copy escalation emails inside the chat UI.";
    su_helpdesk.advancedProTip = "By configuring the Email Connector, the agent can automatically draft escalation emails directly in the user's draft folder when manual intervention is needed.";
  }

  if (useCasesTranslations.su_helpdesk) {
    useCasesTranslations.su_helpdesk.en.steps = su_helpdesk.steps;
    useCasesTranslations.su_helpdesk.en.advancedSteps = su_helpdesk.advancedSteps;
    useCasesTranslations.su_helpdesk.en.proTip = su_helpdesk.proTip;
    useCasesTranslations.su_helpdesk.en.advancedProTip = su_helpdesk.advancedProTip;

    useCasesTranslations.su_helpdesk["zh-TW"].steps = [
      "在 NotebookLM 中，匯整所有學生會社團政策、場地借用規範與設備預約表單。",
      "利用 Gemini Agent Designer 建立名為「學生會支援助理」的對話式服務 Agent。",
      "將 Agent 連結規章知識庫，並設定為在遇到複雜預約時，自動在對話視窗中擬好升級審查信範本。",
      "測試 Agent 處理複雜查詢的能力（例如：「我們可以在晚上 9 點後借用場地嗎？」）。",
      "將 Agent 嵌入至學生會入口網站或社群網頁，提供 24/7 的社團幹部諮詢服務。"
    ];
    useCasesTranslations.su_helpdesk["zh-TW"].advancedSteps = [
      "在 NotebookLM 中，匯整所有學生會社團政策、場地借用規範與設備預約表單。",
      "利用 Gemini Agent Designer 建立名為「學生會支援助理」的對話式服務 Agent。",
      "將此 Agent 連結規章知識庫，並透過 Email Connector（郵件連接器）設定「自動生成郵件草稿」的諮詢升級機制。",
      "測試 Agent 處理複雜查詢的能力（例如：「我們可以在晚上 9 點後借用場地嗎？」）。",
      "將 Agent 嵌入至學生會入口網站或社群網頁，提供 24/7 的社團幹部諮詢服務。"
    ];
    useCasesTranslations.su_helpdesk["zh-TW"].proTip = "使用 Agent Designer，您可以為助理定義明確的指引，以便直接在對話中擬定好結構完整的諮詢升級郵件供您複製。";
    useCasesTranslations.su_helpdesk["zh-TW"].advancedProTip = "配置 Email Connector 後，Agent 可在需要人工審批時，直接在用戶的草稿信箱中擬好一封結構完整的升級審查信，大幅減少行政耗時。";

    useCasesTranslations.su_helpdesk["zh-CN"].steps = [
      "在 NotebookLM 中，汇整所有学生会社团政策、场地借用规范与设备预约表单。",
      "利用 Gemini Agent Designer 建立名为“学生会支援助理”的对话式服务 Agent。",
      "将 Agent 链接规章知识库，并设置为在遇到复杂预约时，自动在对话窗口中拟好升级审查信模板。",
      "测试 Agent 处理复杂查询的能力（例如：“我们可以在晚上 9 点后借用场地吗？”）。",
      "将 Agent 嵌入至学生会入口网站或社群网页，提供 24/7 的社团个人咨询服务。"
    ];
    useCasesTranslations.su_helpdesk["zh-CN"].advancedSteps = [
      "在 NotebookLM 中，汇整所有学生会社团政策、场地借用规范与设备预约表单。",
      "利用 Gemini Agent Designer 建立名为“学生会支援助理”的对话式服务 Agent。",
      "将此 Agent 链接规章知识库，并通过 Email Connector（邮件连接器）设置“自动生成邮件草稿”的咨询升级机制。",
      "测试 Agent 处理复杂查询的能力（例如：“我们可以在晚上 9 点后借用场地吗？”）。",
      "将 Agent 嵌入至学生会入口网站或社群网页，提供 24/7 的社团个人咨询服务。"
    ];
    useCasesTranslations.su_helpdesk["zh-CN"].proTip = "使用 Agent Designer，您可以为助理定义明确的指引，以便直接在对话中拟定好结构完整的咨询升级邮件供您复制。";
    useCasesTranslations.su_helpdesk["zh-CN"].advancedProTip = "配置 Email Connector 后，Agent 可在需要人工审批时，直接在用户的草稿信箱中拟好一封结构完整的升级审查信，大幅减少行政耗时。";
  }

  // Overrides for at_risk_cohort
  const at_risk_cohort = useCasesDb.find(uc => uc.id === "at_risk_cohort");
  if (at_risk_cohort) {
    at_risk_cohort.steps = [
      "Export an anonymized CSV dataset containing student login logs, quiz scores, and forum engagement metrics from your LMS.",
      "Upload this CSV dataset directly into a secure Gemini Advanced prompt.",
      "Instruct Gemini to run multi-dimensional predictive modeling, highlighting student cohorts exhibiting a precipitous drop in engagement.",
      "Generate draft check-in emails suggesting tutoring resources to send to flagged cohorts."
    ];
    at_risk_cohort.advancedSteps = [
      "Configure secure API connections from Gemini to your school's LMS and SIS database using the connectors.",
      "Set up an analytical data store containing anonymized student logs, login frequencies, quiz scores, and forum engagement metrics.",
      "Configure a secure workflow that maps data attributes, ensuring strict compliance with student data privacy laws like FERPA.",
      "Use Gemini to run multi-dimensional predictive modeling, highlighting student cohorts exhibiting a precipitous drop in engagement.",
      "Trigger automated, personalized advisor check-in drafts to provide timely academic support."
    ];
    at_risk_cohort.proTip = "Exporting de-identified datasets manually is a quick, high-security way to run predictive diagnostics without complex system configurations.";
    at_risk_cohort.advancedProTip = "Setting up automated LMS/SIS database connectors allows for nightly automated risk sweeps, feeding real-time engagement alerts directly to counselor dashboards.";
  }

  if (useCasesTranslations.at_risk_cohort) {
    useCasesTranslations.at_risk_cohort.en.steps = at_risk_cohort.steps;
    useCasesTranslations.at_risk_cohort.en.advancedSteps = at_risk_cohort.advancedSteps;
    useCasesTranslations.at_risk_cohort.en.proTip = at_risk_cohort.proTip;
    useCasesTranslations.at_risk_cohort.en.advancedProTip = at_risk_cohort.advancedProTip;

    useCasesTranslations.at_risk_cohort["zh-TW"].steps = [
      "從您的學習管理系統 (LMS) 匯出包含學生登入紀錄、小考成績和論壇互動指標的去識別化 CSV 數據集。",
      "將此 CSV 數據集直接上傳至安全的 Gemini Advanced 提示對話中。",
      "引導 Gemini 進行多維度預測建模，標記出參與度急劇下降的高風險學生群組。",
      "生成關懷確認信草稿，推薦輔導資源給受標記的學生群組。"
    ];
    useCasesTranslations.at_risk_cohort["zh-TW"].advancedSteps = [
      "透過連接器在 Gemini 與學校的 LMS 及學籍系統 (SIS) 資料庫之間，設定安全、加密的 API 介接。",
      "建立一個包含匿名化學生歷程紀錄、登入頻率、測驗分數與論壇參與指標的分析資料庫。",
      "設定安全的資料屬性對照，確保資料傳輸全程符合 FERPA 等嚴格的學生隱私權保護規範。",
      "引導 Gemini 進行多維度預測建模，標記出參與度急劇下降的高風險學生群組。",
      "自動觸發輔導教師的關懷信件草稿，在關鍵時刻提供即時的學術輔導與關懷。"
    ];
    useCasesTranslations.at_risk_cohort["zh-TW"].proTip = "手動匯出去識別化數據集是一種快速且具高安全性的分析方式，免去複雜的系統介接設定。";
    useCasesTranslations.at_risk_cohort["zh-TW"].advancedProTip = "設定自動化的 LMS/SIS 資料庫連接器，可進行每晚的自動風險掃描，將即時警報直接傳送至輔導人員的工作儀表板。";

    useCasesTranslations.at_risk_cohort["zh-CN"].steps = [
      "从您的学习管理系统 (LMS) 导出包含学生登录记录、小考成绩和论坛互动指标的去识别化 CSV 数据集。",
      "将此 CSV 数据集直接上传至安全的 Gemini Advanced 提示对话中。",
      "引导 Gemini 进行多维度预测建模，标记出参与度急剧下降的高风险学生群组。",
      "生成关怀确认信草稿，推荐辅导资源给受标记的学生群组。"
    ];
    useCasesTranslations.at_risk_cohort["zh-CN"].advancedSteps = [
      "通过连接器在 Gemini 与学校的 LMS 及学籍系统 (SIS) 数据库之间，设定安全、加密的 API 介接。",
      "建立一个包含匿名化学生历程记录、登录频率、测验分数与论坛参与指标的分析数据库。",
      "设定安全的数据属性对照，确保数据传输全程符合 FERPA 等严格的学生隐私权保护规范。",
      "引导 Gemini 进行多维度预测建模，标记出参与度急剧下降的高风险学生群组。",
      "自动触发辅导教师的关怀信件草稿，在关键时刻提供即时的学术辅导与关怀。"
    ];
    useCasesTranslations.at_risk_cohort["zh-CN"].proTip = "手动导出去识别化数据集是一种快速且具高安全性的分析方式，免去复杂的系统介接设定。";
    useCasesTranslations.at_risk_cohort["zh-CN"].advancedProTip = "设定自动化的 LMS/SIS 数据库连接器，可进行每晚的自动风险扫描，将实时警报直接传送至辅导人员的工作仪表板。";
  }

  // Overrides for accreditation_reports
  const accreditation_reports = useCasesDb.find(uc => uc.id === "accreditation_reports");
  if (accreditation_reports) {
    accreditation_reports.steps = [
      "Gather 3 years of school syllabi, assurance of learning rubrics, student exit surveys, and advisory board minutes.",
      "Upload these document archives directly into NotebookLM to establish a local, encrypted research workspace.",
      "Prompt NotebookLM to cross-reference your curriculum data against specific accreditation standards.",
      "Generate structured, professional accreditation narrative drafts, complete with inline source evidence and citations.",
      "Review the drafts and collaborate with deans using shared Google Docs to finalize the institutional report."
    ];
    accreditation_reports.advancedSteps = [
      "Upload 3 years of school syllabi, assurance of learning rubrics, student exit surveys, and advisory board minutes to SharePoint.",
      "Establish a federated search connection from Gemini to the Drive folder using the Drive Connector.",
      "In NotebookLM, prompt the model to cross-reference your curriculum data against specific accreditation standards.",
      "Generate structured, professional accreditation narrative drafts, complete with inline source evidence and citations.",
      "Review the drafts and collaborate with deans using shared Google Docs to finalize the institutional report."
    ];
    accreditation_reports.proTip = "NotebookLM acts as an elite research assistant, allowing you to easily paste or upload files up to 500,000 words each for secure local analysis.";
    accreditation_reports.advancedProTip = "By selecting 'Federated Search' for the Drive Connector, your data remains safely stored within your institutional tenant, ensuring absolute data security and sovereignty.";
  }

  if (useCasesTranslations.accreditation_reports) {
    useCasesTranslations.accreditation_reports.en.steps = accreditation_reports.steps;
    useCasesTranslations.accreditation_reports.en.advancedSteps = accreditation_reports.advancedSteps;
    useCasesTranslations.accreditation_reports.en.proTip = accreditation_reports.proTip;
    useCasesTranslations.accreditation_reports.en.advancedProTip = accreditation_reports.advancedProTip;

    useCasesTranslations.accreditation_reports["zh-TW"].steps = [
      "蒐集近 3 年的學校教學大綱、學習保證規準、畢業生流向調查與諮詢委員會會議紀錄。",
      "直接將這些文檔封存檔上傳至 NotebookLM，建立一個本地、加密的自評研究工作空間。",
      "引導 NotebookLM 將您的課程數據與特定的學術認證標準進行多維交叉比對。",
      "自動撰寫結構嚴謹、符合專業規範的自評報告草稿，並自動帶入文檔來源佐證與引用標記。",
      "審閱報告草稿，並透過共享 Google Docs 與各院院長協同修改並最終定稿。"
    ];
    useCasesTranslations.accreditation_reports["zh-TW"].advancedSteps = [
      "將近 3 年的學校教學大綱、學習保證規準、畢業生流向調查與諮詢委員會會議紀錄上傳至雲端系統中。",
      "透過安全的 Drive Connector 建立與 Gemini 的同盟搜尋連線。",
      "在 NotebookLM 中，引導模型將您的課程數據與特定的學術認證標準進行多維交叉比對。",
      "自動撰寫結構嚴謹、符合專業規範的自評報告草稿，並自動帶入文檔來源佐證與引用標記。",
      "審閱報告草稿，並透過共享 Google Docs 與各院院長協同修改並最終定稿。"
    ];
    useCasesTranslations.accreditation_reports["zh-TW"].proTip = "NotebookLM 宛如頂尖研究助理，單一文檔可支援高達 50 萬字，讓手動上傳與分析安全無虞。";
    useCasesTranslations.accreditation_reports["zh-TW"].advancedProTip = "選擇 Drive Connector 的「同盟搜尋 (Federated Search)」，數據將安全地保留在原組織的雲端租戶中，確保絕對的數據主權與資安保障。";

    useCasesTranslations.accreditation_reports["zh-CN"].steps = [
      "搜集近 3 年的学校教学大纲、学习保证规准、毕业生流向调查与咨询委员会会议记录。",
      "直接将这些文档封存档上传至 NotebookLM，建立一个本地、加密的自评研究空间。",
      "引导 NotebookLM 将您的课程数据与特定的学术认证标准进行多维交叉比对。",
      "自动撰写结构严谨、符合专业规范的自评报告草稿，并自动带入文档来源佐证与引用标记。",
      "审阅报告草稿，并通过共享 Google Docs 与各院院长协同修改并最终定稿。"
    ];
    useCasesTranslations.accreditation_reports["zh-CN"].advancedSteps = [
      "将近 3 年的学校教学大纲、学习保证规准、毕业生流向调查与咨询委员会会议记录上传至云端系统中。",
      "通过安全的 Drive Connector 建立与 Gemini 的同盟搜寻连线。",
      "在 NotebookLM 中，引导模型将您的课程数据与特定的学术认证标准进行多维交叉比对。",
      "自动撰写结构严谨、符合专业规范的自评报告草稿，并自动带入文档来源佐证与引用标记。",
      "审阅报告草稿，并通过共享 Google Docs 与各院院长协同修改并最终定稿。"
    ];
    useCasesTranslations.accreditation_reports["zh-CN"].proTip = "NotebookLM 宛如顶尖研究助理，单一文档可支持高达 50 万字，让手动上传与分析安全无虞。";
    useCasesTranslations.accreditation_reports["zh-CN"].advancedProTip = "选择 Drive Connector 的“同盟搜寻 (Federated Search)”，数据将安全地保留在原组织的云端租户中，确保绝对的数据主权与资安保障。";
  }

  // Overrides for finance_compliance
  const finance_compliance = useCasesDb.find(uc => uc.id === "finance_compliance");
  if (finance_compliance) {
    finance_compliance.steps = [
      "Upload school purchasing guidelines, vendor policies, and standard accounting codes directly to NotebookLM.",
      "Upload the student club's submitted annual expense spreadsheet and digital PDF receipts to the same workspace.",
      "Prompt NotebookLM to cross-reference each expense item with the approved guidelines to verify compliance.",
      "Generate an automated compliance audit report, highlighting non-compliant spending and budget overruns."
    ];
    finance_compliance.advancedSteps = [
      "Upload all school purchasing guidelines, vendor policies, and standard accounting codes to a secure cloud folder.",
      "Use the Drive Connector to ground your NotebookLM workspace in this policy archive.",
      "Upload a student club's submitted annual expense spreadsheet and digital PDF receipts.",
      "Prompt NotebookLM to cross-reference each expense item with the approved guidelines to verify compliance.",
      "Generate an automated compliance audit report, highlighting non-compliant spending and budget overruns."
    ];
    finance_compliance.proTip = "By compiling the procurement guidelines and receipts manually in NotebookLM, you retain complete over-the-shoulder human review of all financial evaluations.";
    finance_compliance.advancedProTip = "By linking your secure cloud folders using the Drive Connector, you can automatically run audit checks as soon as clubs drop new receipts into their shared directories.";
  }

  if (useCasesTranslations.finance_compliance) {
    useCasesTranslations.finance_compliance.en.steps = finance_compliance.steps;
    useCasesTranslations.finance_compliance.en.advancedSteps = finance_compliance.advancedSteps;
    useCasesTranslations.finance_compliance.en.proTip = finance_compliance.proTip;
    useCasesTranslations.finance_compliance.en.advancedProTip = finance_compliance.advancedProTip;

    useCasesTranslations.finance_compliance["zh-TW"].steps = [
      "將學校採購與請款指南、廠商合約政策與標準會計科目直接上傳至 NotebookLM。",
      "將社團提交的年度支出明細試算表與數位 PDF 收據手動上傳至同一個工作空間。",
      "引導 NotebookLM 將每筆支出項目與核准的請款指南逐一比對以驗證合規性。",
      "生成自動化合規審計報告，具體標示非合規性消費支出與超出預算的項目。"
    ];
    useCasesTranslations.finance_compliance["zh-TW"].advancedSteps = [
      "將所有學校採購與請款指南、廠商合約政策與標準會計科目上傳至雲端硬碟的安全資料夾中。",
      "使用 Drive Connector，將您的 NotebookLM 工作空間直接連結至該政策資料庫。",
      "上傳社團提交的年度支出明細試算表與數位 PDF 收據檔。",
      "引導 NotebookLM 將每筆支出項目與核准的請款指南逐一比對以驗證合規性。",
      "生成自動化合規審計報告，具體標示非合規性消費支出與超出預算的項目。"
    ];
    useCasesTranslations.finance_compliance["zh-TW"].proTip = "手動在 NotebookLM 中比對採購指南與收據，可以讓您保持對所有財務審查的即時主導，保留高水準的人工覆核機制。";
    useCasesTranslations.finance_compliance["zh-TW"].advancedProTip = "透過 Drive Connector 連結您的安全雲端資料夾，一旦社團將新收據放入共享目錄，您即可自動執行即時審計對照。";

    useCasesTranslations.finance_compliance["zh-CN"].steps = [
      "将学校采购与请款指南、厂商合约政策与标准会计科目直接上传至 NotebookLM。",
      "将社团提交的年度支出明细电子表格与数字 PDF 收据手动上传至同一个工作空间。",
      "引导 NotebookLM 将每笔支出项目与核准的请款指南逐一比对以验证合规性。",
      "生成自动化合规审计报告，具体标示非合规性消费支出与超出预算的项目。"
    ];
    useCasesTranslations.finance_compliance["zh-CN"].advancedSteps = [
      "将所有学校采购与请款指南、厂商合约政策与标准会计科目上传至云端硬盘的安全文件夹中。",
      "使用 Drive Connector，将您的 NotebookLM 工作空间直接链接至该政策数据库。",
      "上传社团提交的年度支出明细电子表格与数字 PDF 收据档。",
      "引导 NotebookLM 将每笔支出项目与核准的请款指南逐一比对以验证合规性。",
      "生成自动化合规审计报告，具体标示非合规性消费支出与超出预算的项目。"
    ];
    useCasesTranslations.finance_compliance["zh-CN"].proTip = "手动在 NotebookLM 中比对采购指南与收据，可以让您保持对所有财务审查的即时主导，保留高水平的人工覆核机制。";
    useCasesTranslations.finance_compliance["zh-CN"].advancedProTip = "通过 Drive Connector 链接您的安全云端文件夹，一旦社团将新收据放入共享目录，您即可自动执行即时审计对照。";
  }

  // Overrides for security_simulator
  const security_simulator = useCasesDb.find(uc => uc.id === "security_simulator");
  if (security_simulator) {
    security_simulator.steps = [
      "Upload your campus safety handbook, building layout PDFs, and emergency protocols directly into Agent Designer.",
      "Configure the custom Agent to role-play as an Emergency Dispatcher during a simulated crisis scenario (e.g., power outage, severe storm).",
      "Generate high-fidelity instructional video clips and animated scenario prompts using Video Generation features.",
      "Have security staff interact with the simulator, typing real-time responses to evolving scenario prompts.",
      "Generate a post-simulation feedback report, assessing the staff's compliance with safety handbooks."
    ];
    security_simulator.advancedSteps = [
      "Ground a custom Security Drill Agent in your campus safety handbook, building layouts, and emergency protocols via the secure Drive Connector.",
      "Configure the Agent to role-play as an Emergency Dispatcher during a simulated crisis scenario (e.g., power outage, severe storm).",
      "Generate high-fidelity instructional video clips and animated scenario prompts using Video Generation features.",
      "Have security staff interact with the simulator, typing real-time responses to evolving scenario prompts.",
      "Generate a post-simulation feedback report, assessing the staff's compliance with safety handbooks."
    ];
    security_simulator.proTip = "By uploading safety documents manually, you can easily sandbox separate crisis simulations for different campus sites without cross-contaminating response guidelines.";
    security_simulator.advancedProTip = "Connecting directly to your security team's shared Drive ensures that safety drills always use the absolute latest building escape routes and marshal duty schedules.";
  }

  if (useCasesTranslations.security_simulator) {
    useCasesTranslations.security_simulator.en.steps = security_simulator.steps;
    useCasesTranslations.security_simulator.en.advancedSteps = security_simulator.advancedSteps;
    useCasesTranslations.security_simulator.en.proTip = security_simulator.proTip;
    useCasesTranslations.security_simulator.en.advancedProTip = security_simulator.advancedProTip;

    useCasesTranslations.security_simulator["zh-TW"].steps = [
      "手動將您的校園安全手冊、大樓空間平面 PDF 檔與緊急應變協議上傳至 Agent Designer。",
      "設定客製化的安全演練 Agent，使其在模擬危機情境（如停電、強烈颱風）中扮演「緊急派遣調度員」。",
      "使用 Video Generation（影片生成）技術，自動生成高畫質的指示性影片與生動的情境動態提示。",
      "指派維安或駐衛警人員與模擬器互動，輸入實時的緊急應變策略以應對不斷變化的危機事件。",
      "生成演練後的成效評估報告，評估演練人員對安全防護手冊規範的執行合規度。"
    ];
    useCasesTranslations.security_simulator["zh-TW"].advancedSteps = [
      "透過安全的 Drive Connector，將客製化安全演練 Agent 植基於您的校園安全手冊、大樓空間平面圖與緊急應變協議文檔。",
      "設定客製化的安全演練 Agent，使其在模擬危機情境（如停電、強烈颱風）中扮演「緊急派遣調度員」。",
      "使用 Video Generation（影片生成）技術，自動生成高畫質的指示性影片與生動的情境動態提示。",
      "指派維安或駐衛警人員與模擬器互動，輸入實時的緊急應變策略以應對不斷變化的危機事件。",
      "生成演練後的成效評估報告，評估演練人員對安全防護手冊規範的執行合規度。"
    ];
    useCasesTranslations.security_simulator["zh-TW"].proTip = "手動上傳校園維安文件，能讓您輕鬆針對不同的校區或場地建立獨立沙盒模擬，避免不同應變標準相互混淆。";
    useCasesTranslations.security_simulator["zh-TW"].advancedProTip = "直接連接至安全團隊的共享雲端硬碟，能確保您的危機演練始終基於最新的逃生路線與現場指揮人員值班表進行。";

    useCasesTranslations.security_simulator["zh-CN"].steps = [
      "手动将您的校园安全手册、大楼空间平面 PDF 档与紧急应变协议上传至 Agent Designer。",
      "设定定制的安全演练 Agent，使其在模拟危机情境（如停电、强烈台风）中扮演“紧急派遣调度员”。",
      "使用 Video Generation（影片生成）技术，自动生成高画质的指示性影片与生动的情境动态提示。",
      "指派维安或驻卫警人员与模拟器互动，输入实时的紧急应变策略以应对不断变化的危机事件。",
      "生成演练后的成效评估报告，评估演练人员对安全防护手册规范的执行合规度。"
    ];
    useCasesTranslations.security_simulator["zh-CN"].advancedSteps = [
      "通过安全的 Drive Connector，将定制安全演练 Agent 植基于您的校园安全手册、大楼空间平面图与紧急应变协议文档。",
      "设定定制的安全演练 Agent，使其在模拟危机情境（如停电、强烈台风）中扮演“紧急派遣调度员”。",
      "使用 Video Generation（影片生成）技术，自动生成高画质的指示性影片与生动的情境动态提示。",
      "指派维安或驻卫警人员与模拟器互动，输入实时的紧急应变策略以应对不断变化的危机事件。",
      "生成演练后的成效评估报告，评估演练人员对安全防护手册规范的执行合规度。"
    ];
    useCasesTranslations.security_simulator["zh-CN"].proTip = "手动上传校园维安文件，能让您轻松针对不同的校区或场地建立独立沙盒模拟，避免不同应变标准相互混淆。";
    useCasesTranslations.security_simulator["zh-CN"].advancedProTip = "直接连接至安全团队的共享云端硬盘，能确保您的危机演练始终基于最新的逃生路线与现场指挥人员值班表进行。";
  }

  // Add the brand new essential email-connector usecase!
  useCasesDb.push({
    id: "email_digest",
    title: "Daily Academic Email Digest & Priority Planner",
    category: "academic",
    summary: "Connect Gemini directly to your institutional inbox to summarize daily administrative announcements, faculty updates, and extract key deadlines.",
    features: ["NotebookLM"],
    connectors: ["Email Connector"],
    connectorEssential: true,
    role: "Student",
    level: ["University & College", "High School", "Generic"],
    steps: [
      "Connect your institutional email inbox using the secure, encrypted Email Connector.",
      "Navigate to NotebookLM and create a new secure notebook titled 'Daily Academic Digests'.",
      "Prompt Gemini to fetch and analyze your school emails received over the past 24 hours.",
      "Generate a structured, localized bullet-point digest of critical department deadlines, exam announcements, and class schedule changes.",
      "Ask Gemini to automatically draft brief, professional email replies to professors and upload them directly to your email draft folders."
    ],
    prompt: `You are the 'Academic Personal Assistant'. Analyze all institutional emails received in the past 24 hours.
Generate a comprehensive daily digest that includes:
1. **Priority Deadline Alert**: Extract any homework, project, or exam deadlines. Highlight them in bold with dates.
2. **Class Schedule Updates**: List any room changes, office hour announcements, or rescheduled lectures.
3. **Action Items**: Provide a clear checklist of 3 immediate things that require the user's attention.
4. **Draft Professional Replies**: For any urgent emails from professors, draft brief, formal response emails (e.g. confirming attendance, requesting meeting times) and place them in Drafts.
Keep the tone respectful, clear, and highly organized.`,
    proTip: "By utilizing the Email Connector, your emails remain fully within your university's secure tenant, guaranteeing that personal correspondence is never leaked or used for training.",
    connectorGuide: {
      name: "Email Connector",
      steps: [
        "Enable the Email Connector inside your sidebar panel settings.",
        "Provide your institutional authorization to grant secure draft and read access.",
        "Ground your NotebookLM workspace in the synchronized email stream for automated digest runs."
      ]
    }
  });

  // Inject translations for email_digest
  useCasesTranslations.email_digest = {
    "en": {
      title: "Daily Academic Email Digest & Priority Planner",
      summary: "Connect Gemini directly to your institutional inbox to summarize daily administrative announcements, faculty updates, and extract key deadlines.",
      steps: [
        "Connect your institutional email inbox using the secure, encrypted Email Connector.",
        "Navigate to NotebookLM and create a new secure notebook titled 'Daily Academic Digests'.",
        "Prompt Gemini to fetch and analyze your school emails received over the past 24 hours.",
        "Generate a structured, localized bullet-point digest of critical department deadlines, exam announcements, and class schedule changes.",
        "Ask Gemini to automatically draft brief, professional email replies to professors and upload them directly to your email draft folders."
      ],
      prompt: `You are the 'Academic Personal Assistant'. Analyze all institutional emails received in the past 24 hours.
Generate a comprehensive daily digest that includes:
1. **Priority Deadline Alert**: Extract any homework, project, or exam deadlines. Highlight them in bold with dates.
2. **Class Schedule Updates**: List any room changes, office hour announcements, or rescheduled lectures.
3. **Action Items**: Provide a clear checklist of 3 immediate things that require the user's attention.
4. **Draft Professional Replies**: For any urgent emails from professors, draft brief, formal response emails (e.g. confirming attendance, requesting meeting times) and place them in Drafts.
Keep the tone respectful, clear, and highly organized.`,
      proTip: "By utilizing the Email Connector, your emails remain fully within your university's secure tenant, guaranteeing that personal correspondence is never leaked or used for training."
    },
    "zh-TW": {
      title: "每日學術郵件摘要與優先級計畫",
      summary: "直接整合學校信箱，自動分析並摘要過去 24 小時內的行政公告、教授通知與課程快報，快速整理出急迫的待辦期限與日程。",
      steps: [
        "使用安全加密的 Email Connector（郵件連接器）連結您的學校信箱。",
        "在 NotebookLM 中建立一個名為「每日學術摘要」的工作空間。",
        "引導 Gemini 讀取並分析過去 24 小時內收到的學校信件。",
        "自動生成結構清晰的摘要，列出關鍵截止日期、考程異動、停調課通知與行政公告。",
        "對教授或行政人員的緊急信件，自動擬好專業的草稿並同步至您的郵件草稿匣。"
      ],
      prompt: `請扮演專業的「學術個人助理」。分析過去 24 小時內收到的所有學校電子郵件。
生成一份全面的每日摘要，其中包括：
1. **優先截止日期警報**：提取任何作業、項目或考試截止日期。用粗體突出顯示日期。
2. **課程時間表更新**：列出任何教室異動、辦公時間公告或重新安排的講座。
3. **行動項目**：提供一份清晰的清單，列出 3 個需要用戶立即注意的事項。
4. **起草專業回覆**：對於教授發送的任何緊急郵件，起草簡短、正式的回覆郵件（例如確認出席、要求會議時間）並將其放入草稿箱。
保持禮貌、清晰且高度組織化的語氣。`,
      proTip: "透過 Email Connector，所有信件均維持在學校安全的雲端租戶內進行處理，絕不會被外部模型訓練，確保個人隱私萬無一失。"
    },
    "zh-CN": {
      title: "每日学术邮件摘要与优先级计划",
      summary: "直接整合学校邮箱，自动分析并摘要过去 24 小时内的行政公告、教授通知与课程快报，快速整理出急迫的待办期限与日程。",
      steps: [
        "使用安全加密的 Email Connector（邮件连接器）链接您的学校邮箱。",
        "在 NotebookLM 中创建一个名为“每日学术摘要”的工作空间。",
        "引导 Gemini 读取并分析过去 24 小时内收到的学校邮件。",
        "自动生成结构清晰的摘要，列出关键截止日期、考程异动、停调课通知与行政公告。",
        "对教授或行政人员的紧急邮件，自动拟好专业的草稿并同步至您的邮件草稿匣。"
      ],
      prompt: `请扮演专业的“学术个人助理”。分析过去 24 小时内收到的所有学校电子邮件。
生成一份全面的每日摘要，其中包括：
1. **优先截止日期警报**：提取任何作业、项目或考试截止日期。用粗体突出显示日期。
2. **课程时间表更新**：列出任何教室异动、办公时间公告或重新安排的讲座。
3. **行动项目**：提供一份清晰的清单，列出 3 个需要用户立即注意的事项。
4. **起草专业回复**：对于教授发送的任何紧急邮件，起草简短、正式的回复邮件（例如确认出席、要求会议时间）并将其放入草稿箱。
保持礼貌、清晰且高度组织化的语气。`,
      proTip: "通过 Email Connector，所有邮件均维持在学校安全的云端租户内进行处理，绝不会被外部模型训练，确保个人隐私万无一失。"
    }
  };
}

// Bind initialization lifecycle on DOM Load
document.addEventListener("DOMContentLoaded", () => {
  // Master Authentication and Dynamic Database Initialization Lifecycle
  initApp();
});

// ============================================================================
// GEMINI ENTERPRISE PORTAL - AUTHENTICATION, DATABASE & ADMIN MANAGEMENT SUITE
// ============================================================================

// 1. Dynamic Server-Side Use Case Database Syncing
async function loadUseCasesFromServer() {
  try {
    const res = await fetch('/api/use-cases');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      // Overwrite the local in-memory arrays so existing templates run smoothly
      useCasesDb.length = 0;
      useCasesDb.push(...data);

      // Re-assign translations dynamically from fetched payload
      for (const key in useCasesTranslations) {
        delete useCasesTranslations[key];
      }
      data.forEach(uc => {
        if (uc.translations) {
          useCasesTranslations[uc.id] = uc.translations;
        }
      });
      console.log(`🌐 Synced ${data.length} editable playbooks from server database.`);
      renderUseCases();
    }
  } catch (err) {
    console.error("⚠️ Failed to load use cases from server. Falling back to local static databases.", err);
  }
}

// 2. Overridden renderUseCases containing interactive Likes & Deployments
const baseRenderUseCases = renderUseCases;
renderUseCases = function() {
  // Call original render engine to establish HTML layout
  baseRenderUseCases();

  // Post-process DOM to inject Likes and Deployments indicators
  const cards = document.querySelectorAll("#useCasesContainer .card");
  cards.forEach(card => {
    const titleEl = card.querySelector(".card-title");
    if (!titleEl) return;
    const titleText = titleEl.textContent.trim();

    // Map card back to local useCasesDb item
    const uc = useCasesDb.find(u => {
      const lang = appState.activeLanguage || "en";
      const trans = useCasesTranslations[u.id] ? useCasesTranslations[u.id][lang] : null;
      const cTitle = trans ? trans.title : u.title;
      return cTitle.trim() === titleText;
    });

    if (!uc) return;

    const cardBottom = card.querySelector(".card-bottom");
    if (cardBottom) {
      // Create user preference controls
      const prefBar = document.createElement("div");
      prefBar.className = "card-preferences-bar";
      prefBar.style.display = "flex";
      prefBar.style.gap = "8px";
      prefBar.style.alignItems = "center";
      prefBar.style.marginLeft = "auto";
      prefBar.style.position = "relative";
      prefBar.style.zIndex = "10";

      const likeActive = uc.isLiked === true || uc.isLiked === 1;
      const deployActive = uc.isDeployed === true || uc.isDeployed === 1;

      prefBar.innerHTML = `
        <button class="pref-btn btn-like" style="background: none; border: none; padding: 4px; display: inline-flex; align-items: center; cursor: pointer; color: ${likeActive ? 'var(--color-danger)' : 'var(--text-muted)'}; transition: color 0.2s;" title="Like Use Case">
          <span class="material-symbols-outlined" style="font-size: 18px; font-variation-settings: 'FILL' ${likeActive ? 1 : 0}">${likeActive ? 'favorite' : 'favorite'}</span>
        </button>
        <button class="pref-btn btn-deploy" style="background: none; border: none; padding: 4px; display: inline-flex; align-items: center; cursor: pointer; color: ${deployActive ? 'var(--color-success)' : 'var(--text-muted)'}; transition: color 0.2s;" title="Active Deployment Status">
          <span class="material-symbols-outlined" style="font-size: 18px; font-variation-settings: 'FILL' ${deployActive ? 1 : 0}">${deployActive ? 'rocket_launch' : 'rocket_launch'}</span>
        </button>
      `;

      cardBottom.appendChild(prefBar);

      // Prevent card detail popup modal when liking or deploying
      const likeBtn = prefBar.querySelector(".btn-like");
      likeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const newStatus = !uc.isLiked;
        const success = await syncUserPreference(uc.id, 'like', newStatus);
        if (success) {
          uc.isLiked = newStatus;
          likeBtn.style.color = newStatus ? 'var(--color-danger)' : 'var(--text-muted)';
          likeBtn.querySelector(".material-symbols-outlined").style.fontVariationSettings = `'FILL' ${newStatus ? 1 : 0}`;
          showToast(newStatus ? "Added to your favorites!" : "Removed from favorites");
        }
      });

      const deployBtn = prefBar.querySelector(".btn-deploy");
      deployBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const newStatus = !uc.isDeployed;
        const success = await syncUserPreference(uc.id, 'deploy', newStatus);
        if (success) {
          uc.isDeployed = newStatus;
          deployBtn.style.color = newStatus ? 'var(--color-success)' : 'var(--text-muted)';
          deployBtn.querySelector(".material-symbols-outlined").style.fontVariationSettings = `'FILL' ${newStatus ? 1 : 0}`;
          showToast(newStatus ? "Deployment marked as active!" : "Deployment marked as inactive");
        }
      });
    }
  });
};

// Sync Likes & Deployments to DB
async function syncUserPreference(useCaseId, action, value) {
  try {
    const endpoint = action === 'like' ? '/api/use-cases/like' : '/api/use-cases/deploy';
    const bodyKey = action === 'like' ? 'isLiked' : 'isDeployed';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ useCaseId, [bodyKey]: value })
    });
    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error(`Preference sync error (${action}):`, error);
    return false;
  }
}

function injectAdminBackButton() {
  if (!document.getElementById("btnBackToAdminDash")) {
    const backBtn = document.createElement("button");
    backBtn.className = "nav-button nav-button-primary";
    backBtn.id = "btnBackToAdminDash";
    backBtn.style.marginLeft = "12px";
    backBtn.innerHTML = `<span class="material-symbols-outlined">shield</span> <span>Admin Dash</span>`;
    backBtn.onclick = () => {
      sessionStorage.setItem("ge_current_view", "admin");
      document.getElementById("appLayout").style.display = "none";
      document.getElementById("adminPortal").style.display = "block";
      initAdminPortal();
    };
    const navRight = document.querySelector(".navbar-right");
    if (navRight) navRight.appendChild(backBtn);
  }
}

// 3. User & Admin Lifecycle Controller (Session checking & Login gating)
async function initApp() {
  // Execute base configs
  enhanceUseCasesDatabase();
  initTheme();
  initLanguage();

  // Establish base auth elements on start
  const overlay = document.getElementById("wizardOverlay");
  const loginCard = document.getElementById("loginCard");
  const resetCard = document.getElementById("resetCard");
  const profileCard = document.getElementById("profileCard");

  // Reset display status
  loginCard.style.display = "none";
  resetCard.style.display = "none";
  profileCard.style.display = "none";

  try {
    // Validate session
    const res = await fetch('/api/auth/session');
    const auth = await res.json();

    if (auth.loggedIn) {
      appState.userEmail = auth.user.email;
      appState.isAdmin = auth.user.isAdmin;

      if (appState.isAdmin) {
        // Admin redirect or simulated view restore
        const savedView = sessionStorage.getItem("ge_current_view") || "admin";
        overlay.style.display = "none";
        
        if (savedView === "user") {
          document.getElementById("adminPortal").style.display = "none";
          document.getElementById("appLayout").style.display = "flex";
          injectAdminBackButton();
          
          appState.userRole = "Lecturer";
          appState.institutionLevel = "University & College";
          updateSidebarContextUI();
          
          await loadUseCasesFromServer();
          renderUseCases();
        } else {
          document.getElementById("appLayout").style.display = "none";
          document.getElementById("adminPortal").style.display = "block";
          initAdminPortal();
        }
      } else {
        // Standard user login paths
        if (auth.user.isTemp) {
          // Force reset temp accounts
          overlay.style.display = "flex";
          resetCard.style.display = "block";
          setupPasswordResetHandlers();
        } else {
          // Check profile onboarding status
          if (auth.user.role && auth.user.institutionLevel) {
            // Profile exists in DB
            appState.userRole = auth.user.role;
            appState.institutionLevel = auth.user.institutionLevel;
            appState.activeLanguage = localStorage.getItem("ge_adoption_lang") || "en";

            overlay.style.display = "none";
            document.getElementById("navLang").value = appState.activeLanguage;
            document.getElementById("wizardLang").value = appState.activeLanguage;

            document.getElementById("navbarWelcomeText").textContent = `Logged in: ${appState.userEmail}`;

            updateUILanguage();
            updateSidebarContextUI();
            
            // Fetch use cases and render
            await loadUseCasesFromServer();
            renderUseCases();
          } else {
            // New user requires profile configuration
            overlay.style.display = "flex";
            profileCard.style.display = "block";
            setupProfileOnboardingHandlers();
          }
        }
      }
    } else {
      // Prompt Sign-in
      overlay.style.display = "flex";
      loginCard.style.display = "block";
      setupLoginHandlers();
    }
  } catch (error) {
    console.error("Initialization error:", error);
    overlay.style.display = "flex";
    loginCard.style.display = "block";
    setupLoginHandlers();
  }

  // Restore filter values from sessionStorage
  appState.activeFilterCategory = sessionStorage.getItem("ge_active_category") || "all";
  appState.activeFilterFeature = sessionStorage.getItem("ge_active_feature") || "all";
  appState.activeFilterStatus = sessionStorage.getItem("ge_active_status") || "all";

  // Set event listeners for search and feature/status sidebars
  document.getElementById("searchInput").addEventListener("input", handleSearchInput);

  const categoryItems = document.querySelectorAll(".category-filter-item");
  categoryItems.forEach(item => {
    const cat = item.getAttribute("data-category");
    if (cat === appState.activeFilterCategory) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
    item.addEventListener("click", () => {
      categoryItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      appState.activeFilterCategory = cat;
      sessionStorage.setItem("ge_active_category", cat);
      renderUseCases();
    });
  });

  const featureItems = document.querySelectorAll(".feature-filter-item");
  featureItems.forEach(item => {
    const feat = item.getAttribute("data-feature");
    if (feat === appState.activeFilterFeature) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
    item.addEventListener("click", () => {
      featureItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      appState.activeFilterFeature = feat;
      sessionStorage.setItem("ge_active_feature", feat);
      renderUseCases();
    });
  });

  const statusItems = document.querySelectorAll(".status-filter-item");
  statusItems.forEach(item => {
    const stat = item.getAttribute("data-status");
    if (stat === appState.activeFilterStatus) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
    item.addEventListener("click", () => {
      statusItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      appState.activeFilterStatus = stat;
      sessionStorage.setItem("ge_active_status", stat);
      renderUseCases();
    });
  });

  setupConnectorToggles();

  // Profile Context switch trigger
  document.getElementById("btnChangeContext").addEventListener("click", () => {
    overlay.style.display = "flex";
    profileCard.style.display = "block";
    loginCard.style.display = "none";
    resetCard.style.display = "none";

    if (appState.userRole) document.getElementById("wizardRole").value = appState.userRole;
    if (appState.institutionLevel) document.getElementById("wizardLevel").value = appState.institutionLevel;
    document.getElementById("wizardLang").value = appState.activeLanguage;
    handleWizardRoleChange();
    setupProfileOnboardingHandlers();
  });

  // Global Logout binding
  document.getElementById("btnLogout").addEventListener("click", triggerUserLogout);

  // Modal details slider close bindings
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modalOverlay")) closeModal();
  });
}

// 4. Session Operations (Login, Reset, Profile, Logout)
function setupLoginHandlers() {
  const btnLogin = document.getElementById("btnLogin");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const errorMsg = document.getElementById("loginErrorMsg");
  const adminToggle = document.getElementById("linkToggleAdminMode");

  let isAdminMode = false;

  adminToggle.addEventListener("click", (e) => {
    e.preventDefault();
    isAdminMode = !isAdminMode;
    adminToggle.textContent = isAdminMode ? "Standard Sign In" : "Admin Sign In";
    document.getElementById("loginTitle").textContent = isAdminMode ? "Admin Management Control" : "Google Gemini Enterprise";
    emailInput.placeholder = isAdminMode ? "Enter Admin Username" : "e.g. academic@edu.hk";
    document.getElementById("labelEmail").textContent = isAdminMode ? "Admin Username" : "Institutional Email";
    errorMsg.style.display = "none";
  });

  // Enable pressing Enter to log in
  const handleEnterKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      btnLogin.click();
    }
  };
  emailInput.addEventListener("keydown", handleEnterKey);
  passwordInput.addEventListener("keydown", handleEnterKey);

  btnLogin.onclick = async () => {
    errorMsg.style.display = "none";
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      errorMsg.textContent = "Please fill in all authentication fields.";
      errorMsg.style.display = "block";
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        showToast("Access Granted. Redirecting...");
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        errorMsg.textContent = data.message || "Invalid login credentials.";
        errorMsg.style.display = "block";
      }
    } catch (err) {
      errorMsg.textContent = "Unable to connect to the authentication server.";
      errorMsg.style.display = "block";
    }
  };
}

function setupPasswordResetHandlers() {
  const btnReset = document.getElementById("btnSubmitReset");
  const p1 = document.getElementById("resetPassword1");
  const p2 = document.getElementById("resetPassword2");
  const errorMsg = document.getElementById("resetErrorMsg");

  // Enable pressing Enter to submit password reset
  const handleEnterKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      btnReset.click();
    }
  };
  p1.addEventListener("keydown", handleEnterKey);
  p2.addEventListener("keydown", handleEnterKey);

  btnReset.onclick = async () => {
    errorMsg.style.display = "none";
    const pass = p1.value;
    const confirm = p2.value;

    if (!pass || pass.length < 6) {
      errorMsg.textContent = "Password must be at least 6 characters long.";
      errorMsg.style.display = "block";
      return;
    }

    if (pass !== confirm) {
      errorMsg.textContent = "Passwords do not match. Please verify.";
      errorMsg.style.display = "block";
      return;
    }

    // Since we are forcing password reset, we can also collect their initial onboarding details on this screen or proceed to profile wizard!
    // We will let them set their password, then automatically transition them to Card 3 (Profile Card) so they can complete their onboarding context profile!
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: pass })
      });
      const data = await res.json();

      if (data.success) {
        showToast("Password updated successfully!");
        document.getElementById("resetCard").style.display = "none";
        document.getElementById("profileCard").style.display = "block";
        setupProfileOnboardingHandlers();
      } else {
        errorMsg.textContent = data.message || "Failed to reset password.";
        errorMsg.style.display = "block";
      }
    } catch (err) {
      errorMsg.textContent = "Database connection error.";
      errorMsg.style.display = "block";
    }
  };
}

function setupProfileOnboardingHandlers() {
  const btnStart = document.getElementById("btnStart");
  const selectRole = document.getElementById("wizardRole");
  const selectLevel = document.getElementById("wizardLevel");
  const selectLang = document.getElementById("wizardLang");

  selectRole.addEventListener("change", handleWizardRoleChange);
  handleWizardRoleChange(); // Initial alignment of helpers

  btnStart.onclick = async () => {
    const role = selectRole.value;
    const level = selectLevel.value;
    const lang = selectLang.value;

    try {
      // Save profile context configuration to database
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: "", role, institutionLevel: level }) // Empty pass skips hashing, updates metadata!
      });
      const data = await res.json();

      if (data.success) {
        appState.userRole = role;
        appState.institutionLevel = level;
        appState.activeLanguage = lang;
        localStorage.setItem("ge_adoption_lang", lang);

        document.getElementById("navLang").value = lang;
        document.getElementById("wizardOverlay").style.display = "none";
        
        document.getElementById("navbarWelcomeText").textContent = `Logged in: ${appState.userEmail}`;

        updateUILanguage();
        updateSidebarContextUI();

        // Fetch use cases and render
        await loadUseCasesFromServer();
        renderUseCases();
        showToast("Workspace fully configured!");
      }
    } catch (err) {
      console.error("Onboarding saving failed:", err);
    }
  };
}

async function triggerUserLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    showToast("Logged out successfully.");
    setTimeout(() => {
      window.location.reload();
    }, 500);
  } catch (err) {
    window.location.reload();
  }
}

// 5. Swiss Minimalist Administration Portal Dashboard Engine
let currentAdminTab = 'users';

function initAdminPortal() {
  const savedTab = sessionStorage.getItem("ge_current_admin_tab") || "users";
  currentAdminTab = savedTab;

  const tabs = document.querySelectorAll(".admin-tab-item");
  tabs.forEach(tab => {
    const target = tab.getAttribute("data-tab");
    if (target === savedTab) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  document.getElementById("adminTabUsers").style.display = savedTab === 'users' ? 'block' : 'none';
  document.getElementById("adminTabAnalytics").style.display = savedTab === 'analytics' ? 'block' : 'none';
  document.getElementById("adminTabCases").style.display = savedTab === 'cases' ? 'block' : 'none';

  if (savedTab === 'users') loadAdminUsers();
  else if (savedTab === 'analytics') loadAdminStats();
  else if (savedTab === 'cases') loadAdminUseCases();

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const target = tab.getAttribute("data-tab");
      currentAdminTab = target;
      sessionStorage.setItem("ge_current_admin_tab", target);

      document.getElementById("adminTabUsers").style.display = target === 'users' ? 'block' : 'none';
      document.getElementById("adminTabAnalytics").style.display = target === 'analytics' ? 'block' : 'none';
      document.getElementById("adminTabCases").style.display = target === 'cases' ? 'block' : 'none';

      if (target === 'users') loadAdminUsers();
      else if (target === 'analytics') loadAdminStats();
      else if (target === 'cases') loadAdminUseCases();
    });
  });

  // Admin Logout
  document.getElementById("btnAdminLogout").addEventListener("click", triggerUserLogout);

  // Return to Standard Playbook views
  document.getElementById("btnAdminBackToPortal").addEventListener("click", () => {
    sessionStorage.setItem("ge_current_view", "user");
    document.getElementById("adminPortal").style.display = "none";
    document.getElementById("appLayout").style.display = "flex";
    
    injectAdminBackButton();

    // Default simulation load
    appState.userRole = "Lecturer";
    appState.institutionLevel = "University & College";
    updateSidebarContextUI();
    loadUseCasesFromServer().then(() => renderUseCases());
  });

  // User tab form hook
  const formAddUser = document.getElementById("formAddUser");
  formAddUser.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("inputNewUserEmail").value.trim();
    const feedback = document.getElementById("userActionFeedback");
    feedback.style.display = "none";

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (data.success) {
        formAddUser.reset();
        feedback.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 4px; padding: 12px; font-size: 13px; color: var(--color-success);">
            <strong>✅ User Account Provisioned!</strong><br>
            Email: <code>${data.email}</code><br>
            Temporary Password: <strong style="font-family: monospace; background: var(--bg-sidebar); padding: 2px 6px; border-radius: 2px; color: white;">${data.tempPassword}</strong>
            <p style="font-size: 11px; margin-top: 4px; color: var(--text-secondary);">Share this credentials with the user. They will be prompted to reset it immediately on sign-in.</p>
          </div>
        `;
        feedback.style.display = "block";
        loadAdminUsers();
      } else {
        feedback.innerHTML = `<div style="background: var(--color-danger-glow); border: 1px solid rgba(239,68,68,0.2); border-radius: 4px; padding: 10px; color: var(--color-danger); font-size: 12px;">${data.message}</div>`;
        feedback.style.display = "block";
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Case CRUD create/export hooks
  document.getElementById("btnAdminCreateCase").onclick = () => openAdminEditModal(null);
  document.getElementById("btnAdminExportCases").onclick = () => {
    window.open('/api/admin/use-cases/export', '_blank');
  };
  document.getElementById("adminCaseModalClose").onclick = () => {
    document.getElementById("adminCaseEditModal").classList.remove("active");
  };
  document.getElementById("btnAdminFormCancel").onclick = () => {
    document.getElementById("adminCaseEditModal").classList.remove("active");
  };

  // Trigger form saving
  const formCase = document.getElementById("formAdminSaveCase");
  formCase.onsubmit = async (e) => {
    e.preventDefault();
    await saveAdminUseCase();
  };

  // Default load
  loadAdminUsers();
}

// Admin Tab 1: Load users table
async function loadAdminUsers() {
  const tbody = document.getElementById("adminUsersTableBody");
  tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-muted);">Loading users list...</td></tr>`;

  try {
    const res = await fetch('/api/admin/users');
    const users = await res.json();

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-muted);">No users registered yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    users.forEach(u => {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid var(--border-glass)";
      
      const date = new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      const statusText = u.isTemp ? 
        `<span style="color: var(--color-warning); font-weight: 700;">Temporary (Pending Reset)</span>` : 
        `<span style="color: var(--color-success); font-weight: 700;">Active Account</span>`;

      tr.innerHTML = `
        <td style="padding: 12px 8px; font-weight: 500;">${u.email}</td>
        <td style="padding: 12px 8px;">${statusText}</td>
        <td style="padding: 12px 8px; color: var(--text-muted);">${date}</td>
        <td style="padding: 12px 8px; text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
          <button class="nav-button btn-reset-user" style="height: 28px; padding: 0 10px; font-size: 11px;">Reset Access</button>
          <button class="nav-button btn-revoke-user" style="height: 28px; padding: 0 10px; font-size: 11px; background: var(--color-danger); border-color: var(--color-danger);">Revoke</button>
        </td>
      `;

      tbody.appendChild(tr);

      // Reset Password button bind
      tr.querySelector(".btn-reset-user").onclick = async () => {
        const feedback = document.getElementById("userActionFeedback");
        feedback.style.display = "none";
        if (confirm(`Generate a new temporary password for ${u.email}?`)) {
          try {
            const r = await fetch('/api/admin/users/reset', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: u.email })
            });
            const data = await r.json();
            if (data.success) {
              feedback.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 4px; padding: 12px; font-size: 13px; color: var(--color-success);">
                  <strong>✅ Password Re-Generated!</strong><br>
                  Email: <code>${data.email}</code><br>
                  New Temporary Password: <strong style="font-family: monospace; background: var(--bg-sidebar); padding: 2px 6px; border-radius: 2px; color: white;">${data.tempPassword}</strong>
                </div>
              `;
              feedback.style.display = "block";
              loadAdminUsers();
            }
          } catch (err) { console.error(err); }
        }
      };

      // Revoke user bind
      tr.querySelector(".btn-revoke-user").onclick = async () => {
        if (confirm(`Are you absolutely sure you want to revoke and delete the account for ${u.email}?`)) {
          try {
            const r = await fetch('/api/admin/users', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: u.email })
            });
            const data = await r.json();
            if (data.success) {
              showToast("User successfully deleted.");
              loadAdminUsers();
            }
          } catch (err) { console.error(err); }
        }
      };
    });
  } catch (error) {
    console.error(error);
  }
}

// Admin Tab 2: Load metrics & SVG charts
async function loadAdminStats() {
  try {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();

    document.getElementById("statTotalUsers").textContent = data.totalUsers;
    document.getElementById("statTotalUseCases").textContent = data.totalUseCases;
    document.getElementById("statTotalLikes").textContent = data.totalLikes;
    document.getElementById("statTotalDeployments").textContent = data.totalDeployments;

    renderAdminStatsChart(data.history);
  } catch (error) {
    console.error("Failed to load statistics:", error);
  }
}

// Render dynamic minimalist high-contrast SVG trend graph
function renderAdminStatsChart(history) {
  const container = document.getElementById("adminChartContainer");
  container.innerHTML = "";

  if (!history || history.length === 0) return;

  const width = container.clientWidth || 600;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max value to auto-scale coordinates
  let maxVal = 10;
  history.forEach(h => {
    if (h.views > maxVal) maxVal = h.views;
    if (h.likes > maxVal) maxVal = h.likes;
    if (h.deployments > maxVal) maxVal = h.deployments;
  });
  maxVal = Math.ceil(maxVal / 10) * 10; // Round up to nearest 10 for gridlines

  // Calculate coordinates
  const pointsViews = [];
  const pointsLikes = [];
  const pointsDeploy = [];

  const stepX = chartWidth / (history.length - 1);

  history.forEach((h, i) => {
    const x = paddingLeft + (i * stepX);
    const yViews = paddingTop + chartHeight - ((h.views / maxVal) * chartHeight);
    const yLikes = paddingTop + chartHeight - ((h.likes / maxVal) * chartHeight);
    const yDeploy = paddingTop + chartHeight - ((h.deployments / maxVal) * chartHeight);

    pointsViews.push(`${x},${yViews}`);
    pointsLikes.push(`${x},${yLikes}`);
    pointsDeploy.push(`${x},${yDeploy}`);
  });

  // Build Gridlines HTML
  let gridlinesHtml = "";
  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const ratio = i / gridSteps;
    const y = paddingTop + chartHeight - (ratio * chartHeight);
    const labelVal = Math.round(ratio * maxVal);
    gridlinesHtml += `
      <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="var(--border-hairline)" stroke-dasharray="3,3" />
      <text x="${paddingLeft - 10}" y="${y + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end" font-family="monospace">${labelVal}</text>
    `;
  }

  // Monthly Labels at bottom
  let labelsHtml = "";
  history.forEach((h, i) => {
    const x = paddingLeft + (i * stepX);
    labelsHtml += `
      <text x="${x}" y="${height - 8}" fill="var(--text-secondary)" font-size="10" text-anchor="middle" font-weight="700">${h.month}</text>
      <circle cx="${x}" cy="${paddingTop + chartHeight}" r="2" fill="var(--border-hairline)" />
    `;
  });

  // Put it all together inside dynamic SVG
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", height);
  svg.style.overflow = "visible";

  svg.innerHTML = `
    <!-- Grid Layout -->
    ${gridlinesHtml}
    ${labelsHtml}

    <!-- Trend Lines -->
    <polyline points="${pointsViews.join(' ')}" fill="none" stroke="var(--color-secondary)" stroke-width="2" />
    <polyline points="${pointsLikes.join(' ')}" fill="none" stroke="var(--color-danger)" stroke-width="2" />
    <polyline points="${pointsDeploy.join(' ')}" fill="none" stroke="var(--color-success)" stroke-width="2" />

    <!-- Data Markers -->
    ${history.map((h, i) => {
      const x = paddingLeft + (i * stepX);
      const yViews = paddingTop + chartHeight - ((h.views / maxVal) * chartHeight);
      const yLikes = paddingTop + chartHeight - ((h.likes / maxVal) * chartHeight);
      const yDeploy = paddingTop + chartHeight - ((h.deployments / maxVal) * chartHeight);
      return `
        <circle cx="${x}" cy="${yViews}" r="4" fill="var(--bg-dark-base)" stroke="var(--color-secondary)" stroke-width="2" class="chart-dot" style="cursor: pointer;" title="Views: ${h.views}"/>
        <circle cx="${x}" cy="${yLikes}" r="4" fill="var(--bg-dark-base)" stroke="var(--color-danger)" stroke-width="2" class="chart-dot" style="cursor: pointer;" title="Likes: ${h.likes}"/>
        <circle cx="${x}" cy="${yDeploy}" r="4" fill="var(--bg-dark-base)" stroke="var(--color-success)" stroke-width="2" class="chart-dot" style="cursor: pointer;" title="Deploys: ${h.deployments}"/>
      `;
    }).join('')}
  `;

  container.appendChild(svg);
}

// Admin Tab 3: Load Use Cases CRUD
async function loadAdminUseCases() {
  const tbody = document.getElementById("adminCasesTableBody");
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">Loading use cases...</td></tr>`;

  try {
    const res = await fetch('/api/use-cases');
    const cases = await res.json();

    tbody.innerHTML = "";
    const activeLang = appState.activeLanguage || "en";
    cases.forEach(uc => {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid var(--border-glass)";

      const trans = uc.translations ? uc.translations[activeLang] : null;
      const titleText = (trans && trans.title) ? trans.title : uc.title;

      tr.innerHTML = `
        <td style="padding: 12px 8px; font-family: monospace; font-size: 11px; color: var(--color-primary); font-weight: 700;">${uc.id}</td>
        <td style="padding: 12px 8px; font-weight: 500;">${titleText}</td>
        <td style="padding: 12px 8px; text-transform: capitalize; color: var(--text-secondary);">${uc.category}</td>
        <td style="padding: 12px 8px; color: var(--text-muted);">${uc.role}</td>
        <td style="padding: 12px 8px; text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
          <button class="nav-button btn-edit-case" style="height: 28px; padding: 0 10px; font-size: 11px;">Edit</button>
          <button class="nav-button btn-delete-case" style="height: 28px; padding: 0 10px; font-size: 11px; background: var(--color-danger); border-color: var(--color-danger);">Delete</button>
        </td>
      `;

      tbody.appendChild(tr);

      tr.querySelector(".btn-edit-case").onclick = () => openAdminEditModal(uc);
      tr.querySelector(".btn-delete-case").onclick = () => deleteAdminUseCase(uc.id);
    });
  } catch (error) {
    console.error(error);
  }
}

// CRUD Modal Manager
let editingUseCaseId = null;

function openAdminEditModal(uc) {
  const modal = document.getElementById("adminCaseEditModal");
  const title = document.getElementById("adminCaseModalTitle");
  const feedback = document.getElementById("adminFormFeedback");
  const form = document.getElementById("formAdminSaveCase");

  feedback.style.display = "none";
  form.reset();

  const idInput = document.getElementById("formCaseId");

  if (uc) {
    // EDIT MODE
    editingUseCaseId = uc.id;
    title.textContent = `Edit Playbook: ${uc.title}`;
    idInput.value = uc.id;
    idInput.disabled = true; // Immutable

    document.getElementById("formCaseCategory").value = uc.category || "";
    document.getElementById("formCaseTitle").value = uc.title || "";
    document.getElementById("formCaseRole").value = uc.role || "";
    document.getElementById("formCaseSummary").value = uc.summary || "";
    
    const stepsArray = Array.isArray(uc.steps) ? uc.steps : [];
    document.getElementById("formCaseSteps").value = stepsArray.join("\n");
    
    document.getElementById("formCasePrompt").value = uc.prompt || "";
    document.getElementById("formCaseProTip").value = uc.proTip || "";

    const advStepsArray = Array.isArray(uc.advancedSteps) ? uc.advancedSteps : (uc.translations && uc.translations.en && Array.isArray(uc.translations.en.advancedSteps) ? uc.translations.en.advancedSteps : []);
    document.getElementById("formCaseAdvancedSteps").value = advStepsArray.join("\n");
    document.getElementById("formCaseAdvancedPrompt").value = uc.advancedPrompt || (uc.translations && uc.translations.en && uc.translations.en.advancedPrompt) || "";
    document.getElementById("formCaseAdvancedProTip").value = uc.advancedProTip || (uc.translations && uc.translations.en && uc.translations.en.advancedProTip) || "";

    // Checkbox mapping Features safely
    const featuresArray = Array.isArray(uc.features) ? uc.features : [];
    const featureBoxes = document.querySelectorAll("input[name='formFeatures']");
    featureBoxes.forEach(box => {
      box.checked = featuresArray.includes(box.value);
    });

    // Checkbox mapping Connectors safely
    const connectorsArray = Array.isArray(uc.connectors) ? uc.connectors : [];
    const connBoxes = document.querySelectorAll("input[name='formConnectors']");
    connBoxes.forEach(box => {
      box.checked = connectorsArray.includes(box.value) || connectorsArray.includes(box.value + " Connector");
    });

    // Checkbox mapping levels safely
    const levelArray = Array.isArray(uc.level) ? uc.level : [];
    const levelBoxes = document.querySelectorAll("input[name='formLevel']");
    levelBoxes.forEach(box => {
      box.checked = levelArray.includes(box.value);
    });

    // Translation values pre-population safely
    const trans = uc.translations || {};
    
    const zhtw = trans["zh-TW"] || {};
    document.getElementById("formTransZhtwTitle").value = zhtw.title || "";
    document.getElementById("formTransZhtwSummary").value = zhtw.summary || "";
    document.getElementById("formTransZhtwSteps").value = Array.isArray(zhtw.steps) ? zhtw.steps.join("\n") : "";
    document.getElementById("formTransZhtwPrompt").value = zhtw.prompt || "";
    document.getElementById("formTransZhtwProTip").value = zhtw.proTip || "";

    const zhtwAdvSteps = Array.isArray(zhtw.advancedSteps) ? zhtw.advancedSteps : [];
    document.getElementById("formTransZhtwAdvancedSteps").value = zhtwAdvSteps.join("\n");
    document.getElementById("formTransZhtwAdvancedPrompt").value = zhtw.advancedPrompt || "";
    document.getElementById("formTransZhtwAdvancedProTip").value = zhtw.advancedProTip || "";

    const zhcn = trans["zh-CN"] || {};
    document.getElementById("formTransZhcnTitle").value = zhcn.title || "";
    document.getElementById("formTransZhcnSummary").value = zhcn.summary || "";
    document.getElementById("formTransZhcnSteps").value = Array.isArray(zhcn.steps) ? zhcn.steps.join("\n") : "";
    document.getElementById("formTransZhcnPrompt").value = zhcn.prompt || "";
    document.getElementById("formTransZhcnProTip").value = zhcn.proTip || "";

    const zhcnAdvSteps = Array.isArray(zhcn.advancedSteps) ? zhcn.advancedSteps : [];
    document.getElementById("formTransZhcnAdvancedSteps").value = zhcnAdvSteps.join("\n");
    document.getElementById("formTransZhcnAdvancedPrompt").value = zhcn.advancedPrompt || "";
    document.getElementById("formTransZhcnAdvancedProTip").value = zhcn.advancedProTip || "";

  } else {
    // CREATE MODE
    editingUseCaseId = null;
    title.textContent = "Create New Playbook Template";
    idInput.value = "";
    idInput.disabled = false; // Mutable during creation

    // Default checked boxes
    document.querySelectorAll("input[name='formFeatures']").forEach(b => b.checked = false);
    document.querySelectorAll("input[name='formConnectors']").forEach(b => b.checked = false);
    document.querySelectorAll("input[name='formLevel']").forEach(b => b.checked = false);
  }

  modal.classList.add("active");
}

async function saveAdminUseCase() {
  const feedback = document.getElementById("adminFormFeedback");
  feedback.style.display = "none";

  const id = document.getElementById("formCaseId").value.trim();
  const category = document.getElementById("formCaseCategory").value;
  const title = document.getElementById("formCaseTitle").value.trim();
  const role = document.getElementById("formCaseRole").value.trim();
  const summary = document.getElementById("formCaseSummary").value.trim();
  const stepsRaw = document.getElementById("formCaseSteps").value;
  const prompt = document.getElementById("formCasePrompt").value.trim();
  const proTip = document.getElementById("formCaseProTip").value.trim();

  if (!id || !title || !category || !role) {
    feedback.textContent = "ID, Title, Category and Role are mandatory.";
    feedback.style.display = "block";
    return;
  }

  const steps = stepsRaw.split("\n").map(s => s.trim()).filter(s => s.length > 0);

  // Compile Features
  const features = [];
  document.querySelectorAll("input[name='formFeatures']:checked").forEach(b => features.push(b.value));

  // Compile Connectors
  const connectors = [];
  document.querySelectorAll("input[name='formConnectors']:checked").forEach(b => connectors.push(b.value));

  // Compile Levels
  const level = [];
  document.querySelectorAll("input[name='formLevel']:checked").forEach(b => level.push(b.value));

  // Compile Translations
  const transZhtwSteps = document.getElementById("formTransZhtwSteps").value.split("\n").map(s => s.trim()).filter(s => s.length > 0);
  const transZhtwAdvancedSteps = document.getElementById("formTransZhtwAdvancedSteps").value.split("\n").map(s => s.trim()).filter(s => s.length > 0);
  const transZhcnSteps = document.getElementById("formTransZhcnSteps").value.split("\n").map(s => s.trim()).filter(s => s.length > 0);
  const transZhcnAdvancedSteps = document.getElementById("formTransZhcnAdvancedSteps").value.split("\n").map(s => s.trim()).filter(s => s.length > 0);

  const advancedStepsRaw = document.getElementById("formCaseAdvancedSteps").value;
  const advancedPrompt = document.getElementById("formCaseAdvancedPrompt").value.trim();
  const advancedProTip = document.getElementById("formCaseAdvancedProTip").value.trim();
  const advancedSteps = advancedStepsRaw.split("\n").map(s => s.trim()).filter(s => s.length > 0);

  const translations = {
    "en": { 
      title, 
      summary, 
      steps, 
      prompt, 
      proTip,
      advancedSteps: advancedSteps.length > 0 ? advancedSteps : null,
      advancedPrompt: advancedPrompt || null,
      advancedProTip: advancedProTip || null
    },
    "zh-TW": {
      title: document.getElementById("formTransZhtwTitle").value.trim() || title,
      summary: document.getElementById("formTransZhtwSummary").value.trim() || summary,
      steps: transZhtwSteps.length > 0 ? transZhtwSteps : steps,
      prompt: document.getElementById("formTransZhtwPrompt").value.trim() || prompt,
      proTip: document.getElementById("formTransZhtwProTip").value.trim() || proTip,
      advancedSteps: transZhtwAdvancedSteps.length > 0 ? transZhtwAdvancedSteps : (advancedSteps.length > 0 ? advancedSteps : null),
      advancedPrompt: document.getElementById("formTransZhtwAdvancedPrompt").value.trim() || (advancedPrompt || null),
      advancedProTip: document.getElementById("formTransZhtwAdvancedProTip").value.trim() || (advancedProTip || null)
    },
    "zh-CN": {
      title: document.getElementById("formTransZhcnTitle").value.trim() || title,
      summary: document.getElementById("formTransZhcnSummary").value.trim() || summary,
      steps: transZhcnSteps.length > 0 ? transZhcnSteps : steps,
      prompt: document.getElementById("formTransZhcnPrompt").value.trim() || prompt,
      proTip: document.getElementById("formTransZhcnProTip").value.trim() || proTip,
      advancedSteps: transZhcnAdvancedSteps.length > 0 ? transZhcnAdvancedSteps : (advancedSteps.length > 0 ? advancedSteps : null),
      advancedPrompt: document.getElementById("formTransZhcnAdvancedPrompt").value.trim() || (advancedPrompt || null),
      advancedProTip: document.getElementById("formTransZhcnAdvancedProTip").value.trim() || (advancedProTip || null)
    }
  };

  const payload = {
    id, category, title, role, summary, features, connectors, level, steps, prompt, proTip, translations
  };

  try {
    const isEdit = editingUseCaseId !== null;
    const endpoint = '/api/admin/use-cases';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById("adminCaseEditModal").classList.remove("active");
      showToast(isEdit ? "Playbook template updated." : "New playbook template added!");
      loadAdminUseCases();
    } else {
      feedback.textContent = data.error || "Failed to save template. Please verify input ID is unique.";
      feedback.style.display = "block";
    }
  } catch (err) {
    feedback.textContent = "Server database connection failure.";
    feedback.style.display = "block";
  }
}

async function deleteAdminUseCase(id) {
  if (confirm(`Are you absolutely sure you want to delete the template [${id}]? This cannot be undone.`)) {
    try {
      const res = await fetch('/api/admin/use-cases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Playbook template deleted.");
        loadAdminUseCases();
      }
    } catch (err) {
      console.error(err);
    }
  }
}


