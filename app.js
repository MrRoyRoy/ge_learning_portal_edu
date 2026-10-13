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
      "In NotebookLM, create a 'Read-Only Course Hub' and upload syllabus documents, lecture slides, and key readings.",
      "In Agent Designer, configure the Socratic tutor persona prompt with grounding and test interactive questions.",
      "Review guidance quality, publish the shareable Agent link, and embed it into your institutional LMS."
    ],
    prompt: `You are the '{{COURSE_CODE}} Coach,' a friendly and encouraging Socratic tutor for {{COURSE_NAME}}. Your sole objective is to guide students to find answers themselves.
Follow these rules strictly:
1. **Ground all your responses** in the provided course materials only.
2. When a student asks a question (e.g., 'What is the answer to question 3?'), do NOT give the direct answer. Instead, respond with a probing, contextual question that helps them think critically.
3. Reference specific files/pages in the course materials (e.g., 'Can you look at slide 4 of Lecture 2 and tell me what the first stage is called?').
4. If a student demonstrates correct understanding, praise them and provide a complete, rich explanation.
5. If asked about topics outside this course, politely decline, stating: 'I can only assist you with {{COURSE_NAME}} topics.'
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
      "Create a dedicated workspace in NotebookLM and upload the assignment instructions and analytical grading rubric.",
      "Upload the student essay and execute the formative rubric grading prompt in the workbench.",
      "Review tentative criterion scores, personalize pedagogical remarks, and export feedback to LMS or student portfolio."
    ],
    prompt: `Acting as an expert academic teaching assistant, analyze the attached student essay for the assignment "{{ASSIGNMENT_TITLE}}" against the uploaded grading rubric for student "{{STUDENT_ID}}". Generate a first draft of constructive, high-quality feedback.
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
      "Initiate a Deep Research query targeting emerging job market competencies and industry trends.",
      "Synthesize findings into learning outcomes and execute syllabus drafting in Canvas Mode.",
      "Refine weekly modules and project-based rubrics with departmental peers, then export to Google Docs."
    ],
    prompt: `Act as a senior instructional designer. I want to build a brand new, highly modern course syllabus for {{COURSE_TITLE}} targeting the {{TARGET_INDUSTRY}} industry.
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
      "Define experiment objectives and compile safety protocols in Canvas Mode.",
      "Generate student procedure steps and custom equipment illustrations using Image Generation.",
      "Assemble student observation tables, review safety hazard compliance, and publish the printable lab guide."
    ],
    prompt: `You are a laboratory coordinator for {{COURSE_NAME}}. Write an engaging, student-facing lab guide for the experiment "{{EXPERIMENT_NAME}}".
The document should include:
1. **Introduction**: A brief, captivating summary of the biological/chemical relevance of {{EXPERIMENT_NAME}}.
2. **Learning Objectives**: 3 clear outcomes.
3. **Safety First Box**: Explicit hazards, clothing requirements, and chemical disposal protocols.
4. **Step-by-step Procedure**: An easy-to-follow, numbered checklist of steps.
5. **Observation & Reflection Journal**: Propose a set of 3 thought-provoking prediction prompts and blank tables for students to record measurements.`,
    proTip: "Use bold text and alerts inside Canvas Mode to ensure safety steps stand out visually to prevent accidents during high-risk physical labs.",
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
      "Collect survey responses and student feedback sheets into a secured institutional Drive folder.",
      "Run multi-factor qualitative sentiment and thematic analysis via Deep Research and NotebookLM.",
      "Synthesize recurring concerns into priority advocacy items and present to university administration."
    ],
    prompt: `Acting as the Student Union Advocacy Director for {{INSTITUTION_NAME}}, analyze the uploaded collection of town hall transcripts and anonymous student survey comments for {{ACADEMIC_TERM}}.
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
      "Gather past semester club event logs, attendance counts, and itemized receipts into Drive.",
      "Generate annual budget justification proposals and activity timelines in Canvas Mode.",
      "Verify allocation compliance against union bylaws and submit to the student council funding committee."
    ],
    prompt: `Act as a professional grant and proposal writer. Help {{CLUB_NAME}} draft a detailed funding proposal for the academic year {{ACADEMIC_YEAR}}.
Inputs:
- Annual activities calendar: List of 4 major workshops, 1 public exhibition, 2 guest lectures, and 1 social event for {{CLUB_NAME}}.
- Approved funding guidelines: Max $200 per workshop, Max $500 for exhibition, strict food and beverage limits.
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
    role: "Student",
    level: ["University & College", "High School", "Generic"],
    steps: [
      "Centralize student handbook, welfare guidelines, and club constitutions into NotebookLM.",
      "Deploy a 24/7 policy Q&A Agent using Agent Designer to guide members on regulations and forms.",
      "Test common edge cases and route complex disputes to human union officers via Email Connector."
    ],
    prompt: `You are the 24/7 Policy and Welfare Agent for {{STUDENT_UNION_NAME}} at {{INSTITUTION_NAME}}. Your purpose is to provide immediate, highly accurate answers to student questions regarding union bylaws, venue booking, lockers, and society financial subsidies.
Rules:
1. Answer using ONLY verified information from the attached student handbook and constitution.
2. Maintain a friendly, supportive student-peer tone.
3. Provide step-by-step instructions for all administrative procedures (e.g. How to book a room, how to apply for event funding).
4. If an inquiry involves confidential welfare disputes, severe mental health concerns, or complex disciplinary proceedings, do NOT answer. Provide immediate instructions to contact the designated human union officer at {{OFFICER_EMAIL}}.`,
    proTip: "Pairing the Agent with Email Connector ensures seamless, automated escalation when students face nuanced emergencies requiring staff intervention.",
    connectorGuide: {
      name: "Email Connector",
      steps: [
        "In your institutional cloud portal, select Data Connectors > Email Connector.",
        "Authenticate using the Student Union official support inbox credentials.",
        "Enable OAuth2 IMAP/SMTP read and dispatch authorization.",
        "Configure automated triage triggers that route unresolved tickets to designated committee officers."
      ]
    }
  },
  {
    id: "visual_campaign",
    title: "Interactive Story Game & Visual Campaign",
    category: "student",
    summary: "Create interactive visual storytelling campaigns, orientation games, and high-impact social media assets with AI media models.",
    features: ["Agent Designer", "Image Generation", "Video Generation"],
    connectors: [],
    role: "Student",
    level: ["Generic"],
    steps: [
      "Draft the event narrative arc, key character personas, and campus orientation milestones.",
      "Generate high-resolution thematic illustrations with Image Generation and narrative clips with Video Generation.",
      "Curate campaign assets into digital social feeds and interactive onboarding screens for freshers."
    ],
    prompt: `You are a creative campaign director for {{INSTITUTION_NAME}}. Design an interactive campus storytelling campaign and multimedia visual plan for {{EVENT_NAME}} targeting {{TARGET_AUDIENCE}}.
Requirements:
1. **Interactive Storyline**: Outline a 4-chapter narrative mystery where freshers explore historical campus buildings, discover student traditions, and solve clues.
2. **Visual Generation Prompts**: Provide 3 rich, descriptive text-to-image prompts (specifying artistic lighting, vibrant student characters, and cinematic composition) suitable for Gemini Image Generation.
3. **Motion Scene Prompts**: Draft 2 prompt scripts suitable for Video Generation to create 5-second teaser animations for social media stories.`,
    proTip: "Use Image Generation to produce unified character key visual styles before prompting Video Generation to preserve aesthetic continuity across visual campaign channels.",
    connectorGuide: null
  },

  // HUB 3: OPERATIONAL & ACADEMIC SUPPORT (Leadership & IT)
  {
    id: "at_risk_cohort",
    title: "At-Risk Student Early Warning System",
    category: "operational",
    summary: "Identify students experiencing academic difficulties across disparate LMS and SIS logs to enable proactive intervention.",
    features: ["Deep Research"],
    connectors: ["LMS Connector"],
    role: "Dean",
    level: ["University & College", "High School"],
    steps: [
      "Connect LMS gradebook and SIS engagement logs to establish multi-variable risk thresholds.",
      "Run predictive engagement synthesis using Deep Research to identify students needing intervention.",
      "Review identified cohorts with academic advisors and dispatch personalized supportive outreach."
    ],
    prompt: `Analyze student learning analytics data for {{COHORT_SEMESTER}} in the {{DEPARTMENT_NAME}} department to identify learners at risk of falling behind.
Criteria to examine:
- LMS login inactivity exceeding 10 consecutive days.
- Missed or late formative assessment submissions (threshold: 2 or more).
- Midterm scores below 60%.
Output Requirements:
1. **At-Risk Cohort Segmentation**: Group students into High Risk, Moderate Risk, and Low Risk categories with evidence flags.
2. **Intervention Recommendations**: For each risk tier, suggest actionable pedagogical interventions (e.g., peer tutoring referral, advisor check-in, supplemental review modules).
3. **Draft Outreach Email**: Generate an empathetic, non-judgmental advisor check-in email encouraging the student to schedule office hours.`,
    proTip: "By leveraging multi-modal synthesis, Gemini combines attendance anomalies with assignment grades to catch students who appear present but are falling behind conceptually.",
    connectorGuide: {
      name: "LMS Connector",
      steps: [
        "In Gemini Enterprise Admin Console, navigate to Data Integrations.",
        "Add LMS Connector (Canvas/Moodle/Blackboard API credentials).",
        "Enforce strict token-level anonymization to mask student PII during processing.",
        "Set automated weekly sync schedules to maintain fresh cohort telemetry."
      ]
    }
  },
  {
    id: "accreditation_reports",
    title: "Accreditation Self-Study Report Synthesizer",
    category: "operational",
    summary: "Map faculty syllabi, student outcomes, and institutional assessments against external accreditation criteria seamlessly.",
    features: ["NotebookLM", "Deep Research"],
    connectors: ["Drive Connector"],
    role: "Program Leader",
    level: ["University & College"],
    steps: [
      "Aggregate departmental self-studies, syllabi, and outcome assessments into an institutional Drive hub.",
      "Run evidence cross-mapping across accreditation standards and criteria in NotebookLM.",
      "Review drafted narrative syntheses, verify institutional metrics, and export the official self-study report."
    ],
    prompt: `Act as a higher education quality assurance director. Synthesize institutional evidence for {{PROGRAM_NAME}} aligned with the accreditation standards of {{ACCREDITATION_BODY}}.
Tasks:
1. **Cross-Mapping**: Map provided course syllabi, student learning outcome evaluations, and faculty publication records against {{ACCREDITATION_BODY}} standards for Criterion 1 (Curriculum Rigor) and Criterion 2 (Faculty Qualifications).
2. **Gap Analysis**: Highlight any missing assessment data, outdated course references, or under-documented student learning evidence.
3. **Executive Synthesis**: Draft a 500-word formal narrative summarizing program continuous improvement initiatives and pedagogical innovations over the past review cycle.`,
    proTip: "NotebookLM's source citation capabilities are ideal for accreditation reviews, allowing evaluators to click any statement to inspect the original course syllabus or committee minutes.",
    connectorGuide: {
      name: "Drive Connector",
      steps: [
        "Authenticate your cloud storage provider in Gemini Enterprise.",
        "Authorize read-only access to the central Accreditation Evidence archive.",
        "Enable automated document indexation for fast cross-document semantic lookup."
      ]
    }
  },
  {
    id: "workforce_federation",
    title: "Workforce Identity Federation Setup Guide",
    category: "operational",
    summary: "Deploy secure SAML 2.0 / OIDC identity federation linking your campus IdP to Gemini Enterprise without duplicating directories.",
    features: ["Deep Research"],
    connectors: ["Drive Connector"],
    role: "IT Admin",
    level: ["Generic"],
    steps: [
      "Audit campus identity provider (IdP) metadata, SAML 2.0 / OIDC claims, and user directory attributes.",
      "Generate workforce federation architecture guides and role-mapping templates using Deep Research.",
      "Conduct end-to-end SSO handshakes with IT security and rollout federated access to campus units."
    ],
    prompt: `You are an enterprise identity architect for {{INSTITUTION_DOMAIN}}. Generate a step-by-step Workforce Identity Federation deployment blueprint integrating our campus Identity Provider ({{IDP_PROVIDER}}) with Google Cloud and Gemini Enterprise.
Deliverables:
1. **SAML 2.0 / OIDC Configuration Spec**: Exact claim mapping rules for NameID, primary email, role attributes (faculty, staff, student), and department codes.
2. **Conditional Access & Session Policies**: Recommended session timeout rules, multi-factor authentication (MFA) enforcement policies, and device compliance checks.
3. **Troubleshooting Checklist**: Step-by-step diagnosis procedure for common handshake errors (e.g. SAML response clock skew, missing claims, attribute mismatch).`,
    proTip: "Federated workforce identity ensures immediate automated offboarding—when a student graduates or staff member resigns, their Gemini Enterprise access terminates instantly at the IdP boundary.",
    connectorGuide: {
      name: "Drive Connector",
      steps: [
        "In Google Cloud IAM & Admin, configure Workforce Identity Federation pools.",
        "Upload IdP SAML 2.0 metadata XML descriptor.",
        "Define attribute condition mappings for student and faculty groups.",
        "Verify SSO redirect flow in an incognito browser window."
      ]
    }
  },

  // HUB 4: ADMINISTRATIVE & STUDENT AFFAIRS (SAO, Finance & Security)
  {
    id: "sao_scavenger_hunt",
    title: "Digital Cultural Fair Red Packet Game",
    category: "administrative",
    summary: "Build an interactive campus cultural scavenger hunt with AI-generated trivia, QR clues, and digital red packet rewards.",
    features: ["Agent Designer", "Image Generation"],
    connectors: [],
    role: "SAO",
    level: ["Generic"],
    steps: [
      "Plan interactive campus discovery checkpoints, cultural trivia themes, and physical QR stations.",
      "Generate bilingual riddle clues and digital red packet artwork via Agent Designer and Image Generation.",
      "Pilot test the hunt route for student safety and launch the live interactive orientation activity."
    ],
    prompt: `You are the Student Affairs Orientation Director for {{CAMPUS_NAME}}. Design an engaging, digital-physical Cultural Fair Scavenger Hunt celebrating {{FESTIVAL_NAME}}.
Include:
1. **Station Clues**: 5 clever rhyming clues that lead students to iconic campus landmarks (library, student center, amphitheater, botanical garden, sports complex).
2. **Interactive Red Packet QR Challenges**: For each station, design a quick 2-question cultural trivia mini-quiz that unlocks a digital red packet stamp.
3. **Reward Tier Structure**: Outline completion badge rewards and clear redemption instructions to manage crowd flow safely.`,
    proTip: "Use Image Generation to design digital commemorative red packet graphics and badges that students can collect in their digital portfolios upon station check-in.",
    connectorGuide: null
  },
  {
    id: "finance_compliance",
    title: "Student Expense Compliance Auditor",
    category: "administrative",
    summary: "Audit student club reimbursement receipts, invoices, and subsidy claims automatically against university financial regulations.",
    features: ["NotebookLM", "Deep Research"],
    connectors: ["Drive Connector"],
    role: "Finance",
    level: ["University & College", "High School"],
    steps: [
      "Upload student society expense receipts, invoices, and bank statements to a dedicated Drive directory.",
      "Execute automated policy compliance auditing to flag missing documentation or spending limit violations.",
      "Review flagged discrepancies with student leaders and generate approved reimbursement vouchers."
    ],
    prompt: `You are the Student Affairs Finance Auditor. Audit the reimbursement claim submitted by {{SOCIETY_NAME}} for the event "{{EVENT_NAME}}" totaling {{CLAIM_AMOUNT}}.
Audit Requirements:
1. **Line-Item Verification**: Cross-reference each receipt item against university student organization financial regulations.
2. **Policy Compliance Check**: Flag any alcohol purchases, unitemized credit card slips, tips exceeding 15%, or missing third-party quotations for items over $300.
3. **Audit Summary**: Produce an itemized audit ledger showing Allowed Amount, Disallowed Amount, and a courteous explanation of any deductions with instructions for appeal.`,
    proTip: "Grounding NotebookLM in official institutional procurement rules ensures high-precision compliance detection without manual auditing fatigue.",
    connectorGuide: {
      name: "Drive Connector",
      steps: [
        "Link Finance Department shared claims folder via Drive Connector.",
        "Authorize optical character recognition (OCR) parsing on submitted receipt scans.",
        "Verify automated audit summaries before issuing reimbursement payments."
      ]
    }
  },
  {
    id: "security_simulator",
    title: "Campus Safety Drill Simulator",
    category: "administrative",
    summary: "Simulate emergency response scenarios and evaluate campus security decision trees during emergency drill operations.",
    features: ["Agent Designer", "Video Generation"],
    connectors: ["Drive Connector"],
    role: "Security",
    level: ["Generic"],
    steps: [
      "Establish emergency protocol handbooks, campus floor plans, and evacuation routes.",
      "Build multi-branch crisis drill scenarios and tactical decision trees using Agent Designer.",
      "Facilitate simulated emergency exercises for campus security personnel and evaluate response timelines."
    ],
    prompt: `You are the Director of Campus Safety. Build a dynamic, interactive emergency drill simulation scenario for {{EMERGENCY_SCENARIO}} occurring at {{FACILITY_LOCATION}}.
Simulation Structure:
1. **Incident Genesis (Minute 0)**: Initial emergency call received. Present 3 critical first-response decisions to the safety team.
2. **Escalation Phase (Minute 15)**: Condition evolves (e.g., secondary obstacle, route blockage, crowd panic). Present tactical options with consequences.
3. **Containment & Evacuation (Minute 30)**: First responder coordination, safe perimeter establishment, and parent/press communication dispatch.
4. **Debrief Rubric**: 4-part evaluation rubric grading decision speed, communication clarity, protocol adherence, and victim care prioritization.`,
    proTip: "Use Video Generation to produce realistic tactical scenario prompts illustrating evacuation bottlenecks or weather events to evaluate team decision-making under stress.",
    connectorGuide: {
      name: "Drive Connector",
      steps: [
        "In Gemini Enterprise console, connect your Campus Security emergency operations document drive.",
        "Verify read privileges on crisis SOPs and facility floor plans.",
        "Run simulated scenario walk-throughs during pre-semester safety training."
      ]
    }
  }
];

// PREREQUISITE HELPER PROMPTS DATABASE
const useCaseHelperPrompts = {
  socratic_tutor: {
    en: [
      {
        type: "general",
        title: "Prompt to Generate Course Syllabus & Module Outline",
        prompt: `Act as an expert university professor. Generate a comprehensive course syllabus and 14-week module outline for the course '{{COURSE_NAME}}' (Code: {{COURSE_CODE}}). Include course description, 4 core learning objectives mapped to Bloom's taxonomy, weekly lecture topics, required reading titles, and grading breakdown.`
      },
      {
        type: "general",
        title: "Prompt to Generate Lecture Reading Summary & Key Concepts",
        prompt: `Synthesize the core foundational concepts and terminology for Lecture Week 1-3 of '{{COURSE_NAME}}'. Provide a 500-word executive summary, 10 must-know technical terms with student-friendly definitions, and 5 common student misconceptions with corrections.`
      }
    ],
    "zh-TW": [
      {
        type: "general",
        title: "生成課程教學大綱與每週單元大綱提示詞",
        prompt: `請扮演資深大學教授。為課程「{{COURSE_NAME}}」（課程代碼：{{COURSE_CODE}}）撰寫一份完整的教學大綱與 14 週單元規劃。包含課程簡介、對應 Bloom 分類法的 4 項核心學習目標、每週講義主題、必讀文獻清單及評分比重。`
      },
      {
        type: "general",
        title: "生成前三週講義摘要與核心概念提示詞",
        prompt: `統整「{{COURSE_NAME}}」第 1 至 3 週講義的核心概念與專有名詞。提供 500 字精要摘要、10 個關鍵術語之白話解說，以及 5 個學生常見概念誤區與正確觀念導正。`
      }
    ],
    "zh-CN": [
      {
        type: "general",
        title: "生成课程教学大纲与每周单元大纲提示词",
        prompt: `请扮演资深大学教授。为课程“{{COURSE_NAME}}”（课程代码：{{COURSE_CODE}}）撰写一份完整的教学大纲与 14 周单元规划。包含课程简介、对应 Bloom 分类法的 4 项核心学习目标、每周讲义主题、必读文献清单及评分比重。`
      },
      {
        type: "general",
        title: "生成前三周讲义摘要与核心概念提示词",
        prompt: `统整“{{COURSE_NAME}}”第 1 至 3 周讲义的核心概念与专有名词。提供 500 字精要摘要、10 个关键术语之白话解说，以及 5 个学生常见概念误区与正确观念导正。`
      }
    ]
  },
  rubric_grading: {
    en: [
      {
        type: "general",
        title: "Prompt to Generate Assignment Instructions & Guidelines",
        prompt: `Act as an academic instructor. Draft a detailed assignment instruction guide for undergraduate students titled '{{ASSIGNMENT_TITLE}}'. Include the task overview, word count requirements, required citation format, 3 specific guiding questions to address, and submission instructions.`
      },
      {
        type: "general",
        title: "Prompt to Generate Detailed Analytical Grading Rubric",
        prompt: `Create a rigorous, 4-tier analytical grading rubric for the assignment '{{ASSIGNMENT_TITLE}}'. Structure the rubric into 4 criteria: (1) Argument & Critical Analysis (35%), (2) Evidence & Source Grounding (30%), (3) Structure & Coherence (20%), (4) Academic Writing & Mechanics (15%). For each criterion, describe clear observable indicators across 4 performance levels: Exemplary, Proficient, Developing, and Unsatisfactory.`
      }
    ],
    "zh-TW": [
      {
        type: "general",
        title: "生成作業指示與撰寫規範提示詞",
        prompt: `請扮演大學課程講師。為名為「{{ASSIGNMENT_TITLE}}」的學期作業撰寫詳細指引。包含作業宗旨說明、字數規範、學術引用格式要求、3 個必須深入探討的核心引導問題，以及繳交截止規範。`
      },
      {
        type: "general",
        title: "生成詳細分析型評分規準 (Rubric) 提示詞",
        prompt: `為作業「{{ASSIGNMENT_TITLE}}」設計一份嚴謹的四級分析型評分規準 (Rubric)。劃分 4 項指標：(1) 論點深度與批判思維 (35%)、(2) 文獻證據與論證嚴謹度 (30%)、(3) 架構組織與邏輯連貫 (20%)、(4) 學術寫作規範與流暢度 (15%)。每項指標均需具體列出：優異 (Exemplary)、熟練 (Proficient)、發展中 (Developing)、待加強 (Unsatisfactory) 的具體表現描述。`
      }
    ],
    "zh-CN": [
      {
        type: "general",
        title: "生成作业指引与撰写规范提示词",
        prompt: `请扮演大学课程讲师。为名为“{{ASSIGNMENT_TITLE}}”的学期作业撰写详细指引。包含作业宗旨说明、字数规范、学术引用格式要求、3 个必须深入探讨的核心引导问题，以及提交截止规范。`
      },
      {
        type: "general",
        title: "生成详细分析型评分规准 (Rubric) 提示词",
        prompt: `为作业“{{ASSIGNMENT_TITLE}}”设计一份严谨的四级分析型评分规准 (Rubric)。划分 4 项指标：(1) 论点深度与批判思维 (35%)、(2) 文献证据与论证严谨度 (30%)、(3) 架构组织与逻辑连贯 (20%)、(4) 学术写作规范与流畅度 (15%)。每项指标均需具体列出：优异 (Exemplary)、熟练 (Proficient)、发展中 (Developing)、待加强 (Unsatisfactory) 的具体表现描述。`
      }
    ]
  },
  curriculum_design: {
    en: [
      {
        type: "deep_research",
        title: "Prompt to Generate Market Skills & Industry Benchmark Brief",
        prompt: `Conduct a comprehensive skills benchmark for '{{COURSE_TITLE}}' targeting the {{TARGET_INDUSTRY}} industry. Identify the top 5 technical competencies and 3 soft skills most demanded by employers over the past 12 months, citing key industry tools.`
      },
      {
        type: "general",
        title: "Prompt to Generate Bloom's Taxonomy Course Learning Outcomes",
        prompt: `Design 5 measurable, assessment-aligned Course Learning Outcomes (CLOs) for '{{COURSE_TITLE}}' adhering strictly to Bloom's Revised Taxonomy (spanning Apply, Analyze, Evaluate, and Create levels).`
      }
    ],
    "zh-TW": [
      {
        type: "deep_research",
        title: "生成產業技能趨勢與市場需求基準提示詞",
        prompt: `針對「{{TARGET_INDUSTRY}}」領域，為新課程「{{COURSE_TITLE}}」進行職場技能基準分析。列出過去一年就業市場需求最高的 5 項核心技術能力與 3 項跨領域軟實力，並註明主流產業工具與認證。`
      },
      {
        type: "general",
        title: "生成對應 Bloom 分類法的課程學習成效 (CLOs) 提示詞",
        prompt: `嚴格遵循 Bloom 修訂版認知歷程分類法（涵蓋應用、分析、評鑑、創造層級），為「{{COURSE_TITLE}}」設計 5 項具體可評量的課程學習成效 (CLOs)。`
      }
    ],
    "zh-CN": [
      {
        type: "deep_research",
        title: "生成产业技能趋势与市场需求基准提示词",
        prompt: `针对“{{TARGET_INDUSTRY}}”领域，为新课程“{{COURSE_TITLE}}”进行职场技能基准分析。列出过去一年就业市场需求最高的 5 项核心技术能力与 3 项跨领域软实力，并注明主流产业工具与认证。`
      },
      {
        type: "general",
        title: "生成对应 Bloom 分类法的课程学习成效 (CLOs) 提示词",
        prompt: `严格遵循 Bloom 修订版认知历程分类法（涵盖应用、分析、评鉴、创造层级），为“{{COURSE_TITLE}}”设计 5 项具体可评估的课程学习成效 (CLOs)。`
      }
    ]
  },
  lab_manual_creator: {
    en: [
      {
        type: "general",
        title: "Prompt to Generate Laboratory Experiment Concept & Reagents List",
        prompt: `Act as a STEM laboratory coordinator for '{{COURSE_NAME}}'. Create a complete experiment concept sheet for '{{EXPERIMENT_NAME}}'. Include theoretical background, required chemical reagents, glass equipment list, and preparatory setup steps.`
      },
      {
        type: "general",
        title: "Prompt to Generate Safety Hazards & Protocol Guideline",
        prompt: `Draft an institutional chemical and physical safety protocol for the experiment '{{EXPERIMENT_NAME}}'. Specify GHS hazard pictograms, mandatory PPE, waste disposal procedures, and emergency spill response steps.`
      }
    ],
    "zh-TW": [
      {
        type: "general",
        title: "生成實驗原理與試劑設備清單提示詞",
        prompt: `請扮演「{{COURSE_NAME}}」實驗室負責人。為實驗「{{EXPERIMENT_NAME}}」撰寫實驗原理與準備手冊。列出理論背景、化學試劑清單、玻璃儀器規格及課前準備步驟。`
      },
      {
        type: "general",
        title: "生成實驗室安全守則與廢棄物處置規範提示詞",
        prompt: `為實驗「{{EXPERIMENT_NAME}}」制定實驗室安全規範。明確標註 GHS 危害圖示、必備個人防護裝備 (PPE)、廢液分類處理流程與化學品潑濺應急程序。`
      }
    ],
    "zh-CN": [
      {
        type: "general",
        title: "生成实验原理与试剂设备清单提示词",
        prompt: `请扮演“{{COURSE_NAME}}”实验室负责人。为实验“{{EXPERIMENT_NAME}}”撰写实验原理与准备手册。列出理论背景、化学试剂清单、玻璃仪器规格及课前准备步骤。`
      },
      {
        type: "general",
        title: "生成实验室安全守则与废弃物处置规范提示词",
        prompt: `为实验“{{EXPERIMENT_NAME}}”制定实验室安全规范。明确标注 GHS 危害图示、必备个人防护装备 (PPE)、废液分类处理流程与化学品泼溅应急程序。`
      }
    ]
  },
  su_advocacy: {
    en: [
      {
        type: "general",
        title: "Prompt to Generate Student Town Hall Feedback Survey Form",
        prompt: `Draft a 10-question anonymous student campus experience survey for {{INSTITUTION_NAME}} covering {{ACADEMIC_TERM}}. Include questions on library hours, dining affordability, mental health support, and classroom facilities with Likert scales and open-ended feedback prompts.`
      },
      {
        type: "general",
        title: "Prompt to Generate Qualitative Feedback Transcription Template",
        prompt: `Structure a standardized student feedback transcription template to organize raw town hall notes and survey responses into thematic categories: Academic, Student Welfare, Facilities, and Financial Aid.`
      }
    ],
    "zh-TW": [
      {
        type: "general",
        title: "生成學生諮詢會回饋問卷範本提示詞",
        prompt: `為 {{INSTITUTION_NAME}} 設計一份「{{ACADEMIC_TERM}} 學生校園生活體驗與權益問卷」（共 10 題）。涵蓋圖書館自修時數、校園餐飲平價化、身心輔導資源及教室設備，結合李克特量表與開放式建議。`
      },
      {
        type: "general",
        title: "生成質化民意彙整與歸類樣板提示詞",
        prompt: `設計結構化的學生民意資料整理範本，將諮詢會筆記與匿名回饋分類至四大領域：學術教學、學生福利、校園設施及獎助學金。`
      }
    ],
    "zh-CN": [
      {
        type: "general",
        title: "生成学生咨询会反馈问卷范本提示词",
        prompt: `为 {{INSTITUTION_NAME}} 设计一份“{{ACADEMIC_TERM}} 学生校园生活体验与权益问卷”（共 10 题）。涵盖图书馆自修时数、校园餐饮平价化、身心辅导资源及教室设备，结合李克特量表与开放式建议。`
      },
      {
        type: "general",
        title: "生成质化民意汇整与归类样板提示词",
        prompt: `设计结构化的学生民意数据整理范本，将咨询会笔记与匿名反馈分类至四大领域：学术教学、学生福利、校园设施及奖助学金。`
      }
    ]
  },
  club_funding: {
    en: [
      {
        type: "general",
        title: "Prompt to Generate Student Club Event Proposal Template",
        prompt: `Act as a Student Union treasurer. Draft a comprehensive event funding proposal for '{{CLUB_NAME}}' covering the academic year {{ACADEMIC_YEAR}}. Include event purpose, target student participation count, timeline, and measurable campus impact.`
      },
      {
        type: "general",
        title: "Prompt to Generate Union Subsidy Line-Item Budget Sheet",
        prompt: `Create a compliant line-item budget table for '{{CLUB_NAME}}' detailing speaker honorariums, equipment rental, venue booking, and promotional printing adhering to Student Union grant maximums.`
      }
    ],
    "zh-TW": [
      {
        type: "general",
        title: "生成學生社團活動企劃書範本提示詞",
        prompt: `請扮演學生會財務顧問。為社團「{{CLUB_NAME}}」撰寫 {{ACADEMIC_YEAR}} 學年度活動補助申請企劃。包含活動宗旨、預估參與人數、籌備進度表及對校園凝聚力之實質效益。`
      },
      {
        type: "general",
        title: "生成社團預算明細與核銷檢核表提示詞",
        prompt: `為「{{CLUB_NAME}}」編製符合學生會補助規章之逐項預算明細表，詳列講師鐘點費、器材租賃、場地清潔及文宣印製費用，並註記報銷憑證規範。`
      }
    ],
    "zh-CN": [
      {
        type: "general",
        title: "生成学生社团活动企划书范本提示词",
        prompt: `请扮演学生会财务顾问。为社团“{{CLUB_NAME}}”撰写 {{ACADEMIC_YEAR}} 学年度活动补助申请企划。包含活动宗旨、预估参与人数、筹备进度表及对校园凝聚力之实质效益。`
      },
      {
        type: "general",
        title: "生成社团预算明细与核销检核表提示词",
        prompt: `为“{{CLUB_NAME}}”编制符合学生会补助规章之逐项预算明细表，详列讲师钟点费、器材租赁、场地清洁及文宣印制费用，并注记报销凭证规范。`
      }
    ]
  },
  su_helpdesk: {
    en: [
      {
        type: "general",
        title: "Prompt to Generate Student Union Constitution & Venue Policy Summary",
        prompt: `Synthesize the core student governance handbook for {{STUDENT_UNION_NAME}} at {{INSTITUTION_NAME}}. Produce a structured 5-section reference guide covering room reservations, locker allocation, club registration, and dispute escalation.`
      },
      {
        type: "general",
        title: "Prompt to Generate FAQ Knowledge Base for Club Subsidies",
        prompt: `Create a 12-question frequently asked questions (FAQ) knowledge base for student societies regarding annual budget applications, permissible expense receipts, and claim submission deadlines.`
      }
    ],
    "zh-TW": [
      {
        type: "general",
        title: "生成學生會會章與場地借用規範摘要提示詞",
        prompt: `為 {{INSTITUTION_NAME}} 的 {{STUDENT_UNION_NAME}} 統整核心學生自治手冊。整理五大章節摘要：學生活動中心場地預約、置物櫃申請、新社團成立認證與爭議申訴程序。`
      },
      {
        type: "general",
        title: "生成社團補助與福利常見問題集 (FAQ) 提示詞",
        prompt: `為各學生社團編製一份 12 題常見問答集 (FAQ)，詳細解答年度補助金請領資格、合格單據報銷規定及審核進度查詢。`
      }
    ],
    "zh-CN": [
      {
        type: "general",
        title: "生成学生会会章与场地借用规范摘要提示词",
        prompt: `为 {{INSTITUTION_NAME}} 的 {{STUDENT_UNION_NAME}} 统整核心学生自治手册。整理五大章节摘要：学生活动中心场地预约、储物柜申请、新社团成立认证与争议申诉程序。`
      },
      {
        type: "general",
        title: "生成社团补助与福利常见问题集 (FAQ) 提示词",
        prompt: `为各学生社团编制一份 12 题常见问答集 (FAQ)，详细解答年度补助金申领资格、合格单据报销规定及审核进度查询。`
      }
    ]
  },
  visual_campaign: {
    en: [
      {
        type: "general",
        title: "Prompt to Generate Campus Orientation Narrative Arc & Character Brief",
        prompt: `Act as an interactive narrative designer. Outline a 4-chapter campus orientation story game for {{EVENT_NAME}} at {{INSTITUTION_NAME}} targeting {{TARGET_AUDIENCE}}. Include 3 distinct student guide personas and campus riddle checkpoints.`
      },
      {
        type: "general",
        title: "Prompt to Generate Image & Video Generation Art Directives",
        prompt: `Write 3 high-detail text-to-image prompts and 2 motion video prompts for {{EVENT_NAME}}. Specify art style (modern anime/3D cinematic vector), student diversity, campus architectural lighting, and 16:9 aspect ratios.`
      }
    ],
    "zh-TW": [
      {
        type: "general",
        title: "生成迎新探索劇情架構與角色設定提示詞",
        prompt: `請扮演互動敘事設計師。為 {{INSTITUTION_NAME}} 的「{{EVENT_NAME}}」（目標對象：{{TARGET_AUDIENCE}}）規劃四章節校園解謎冒險故事。包含 3 位特色學長姐導覽角色設定與標誌性建築關卡線索。`
      },
      {
        type: "general",
        title: "生成圖像與動畫生成風格指令提示詞",
        prompt: `為「{{EVENT_NAME}}」撰寫 3 組高畫質文字生圖提示詞及 2 組 5 秒動態影片提示詞。規範繪圖風格（3D 寫實電影級向量感）、學生多元性、校園自然採光及 16:9 構圖比。`
      }
    ],
    "zh-CN": [
      {
        type: "general",
        title: "生成迎新探索剧情架构与角色设定提示词",
        prompt: `请扮演互动叙事设计师。为 {{INSTITUTION_NAME}} 的“{{EVENT_NAME}}”（目标对象：{{TARGET_AUDIENCE}}）规划四章节校园解谜冒险故事。包含 3 位特色学长姐导览角色设定与标志性建筑关卡线索。`
      },
      {
        type: "general",
        title: "生成图像与动画生成风格指令提示词",
        prompt: `为“{{EVENT_NAME}}”撰写 3 组高画质文字生图提示词及 2 组 5 秒动态视频提示词。规范绘图风格（3D 写实电影级矢量感）、学生多元性、校园自然采光及 16:9 构图比。`
      }
    ]
  },
  at_risk_cohort: {
    en: [
      {
        type: "general",
        title: "Prompt to Generate Learning Analytics Anonymized Cohort Schema",
        prompt: `Create an anonymized synthetic CSV schema for student learning analytics tracking in {{DEPARTMENT_NAME}} for {{COHORT_SEMESTER}}. Include fields for LMS login frequency, assignment submission lag, quiz averages, and midterm exam scores.`
      },
      {
        type: "general",
        title: "Prompt to Generate Academic Advisor Supportive Outreach Email",
        prompt: `Draft an empathetic, encouraging check-in email template from an academic advisor to a student flagged for declining attendance in {{DEPARTMENT_NAME}}. Maintain a non-punitive, supportive tone inviting them to office hours.`
      }
    ],
    "zh-TW": [
      {
        type: "general",
        title: "生成學習成效匿名數據欄位樣板提示詞",
        prompt: `為「{{DEPARTMENT_NAME}}」在「{{COHORT_SEMESTER}}」學期的學習預警建立去識別化資料欄位範本。涵蓋 LMS 登入頻率、作業遲交天數、小考平均值及期中考落後指標。`
      },
      {
        type: "general",
        title: "生成學業導師關懷與輔導信函範本提示詞",
        prompt: `以學業導師視角撰寫一封溫暖、不帶評判意味的關懷信函，發送給在「{{DEPARTMENT_NAME}}」出席率下降的學生，邀請其前來諮詢時間討論學習支援資源。`
      }
    ],
    "zh-CN": [
      {
        type: "general",
        title: "生成学习成效匿名数据字段样板提示词",
        prompt: `为“{{DEPARTMENT_NAME}}”在“{{COHORT_SEMESTER}}”学期的学习预警建立去标识化数据字段范本。涵盖 LMS 登录频率、作业迟交天数、小测平均值及期中考落后指标。`
      },
      {
        type: "general",
        title: "生成学业导师关怀与辅导信函范本提示词",
        prompt: `以学业导师视角撰写一封温暖、不带评判意味的关怀信函，发送给在“{{DEPARTMENT_NAME}}”出席率下降的学生，邀请其前来咨询时间讨论学习支持资源。`
      }
    ]
  },
  accreditation_reports: {
    en: [
      {
        type: "general",
        title: "Prompt to Generate Departmental Evidence Collection Template",
        prompt: `Draft a comprehensive departmental self-study evidence collection checklist for {{PROGRAM_NAME}} aligned with {{ACCREDITATION_BODY}} standards. Include curriculum matrices, syllabus archives, and assessment artifacts.`
      },
      {
        type: "general",
        title: "Prompt to Generate Faculty Qualifications & Curriculum Matrix",
        prompt: `Create an accreditation-compliant tabular matrix mapping {{PROGRAM_NAME}} courses to faculty terminal degree qualifications, research publications, and course learning outcomes.`
      }
    ],
    "zh-TW": [
      {
        type: "general",
        title: "生成系所自我評鑑佐證清單提示詞",
        prompt: `依據「{{ACCREDITATION_BODY}}」認證評鑑標準，為「{{PROGRAM_NAME}}」制定自評報告佐證資料收集清單。包含核心課程配比、教學大綱存檔及學習成效審查檔案。`
      },
      {
        type: "general",
        title: "生成師資專長與課程對照矩陣提示詞",
        prompt: `編製符合評鑑規範之表格矩陣，將「{{PROGRAM_NAME}}」各必選修課程與任課教師之最高學位、學術研究專長及課程成效指標進行嚴謹對應。`
      }
    ],
    "zh-CN": [
      {
        type: "general",
        title: "生成系所自我评估佐证清单提示词",
        prompt: `依据“{{ACCREDITATION_BODY}}”认证评估标准，为“{{PROGRAM_NAME}}”制定自评报告佐证数据收集清单。包含核心课程配比、教学大纲存档及学习成效审查档案。`
      },
      {
        type: "general",
        title: "生成师资专长与课程对照矩阵提示词",
        prompt: `编制符合评估规范之表格矩阵，将“{{PROGRAM_NAME}}”各必选修课程与任课教师之最高学位、学术研究专长及课程成效指标进行严谨对应。`
      }
    ]
  },
  workforce_federation: {
    en: [
      {
        type: "general",
        title: "Prompt to Generate SAML 2.0 / OIDC IdP Metadata Specification",
        prompt: `Draft a technical configuration specification for federating campus Identity Provider ({{IDP_PROVIDER}}) with Google Cloud Workforce Identity for domain {{INSTITUTION_DOMAIN}}. Detail attribute mappings for NameID, email, roles, and department codes.`
      },
      {
        type: "general",
        title: "Prompt to Generate Attribute Condition & RBAC Role Matrix",
        prompt: `Create a role-based access control (RBAC) assertion condition table mapping institutional student, lecturer, and administrative groups to Gemini Enterprise permission tiers.`
      }
    ],
    "zh-TW": [
      {
        type: "general",
        title: "生成 SAML 2.0 / OIDC 身份聯合技術規格提示詞",
        prompt: `為校園網域 {{INSTITUTION_DOMAIN}} 撰寫整合身分提供者 ({{IDP_PROVIDER}}) 至 Google Cloud Workforce Identity 的部署規格書。詳列 NameID、主要電子郵件、角色群組與系所代碼映射規則。`
      },
      {
        type: "general",
        title: "生成屬性條件與 RBAC 角色授權矩陣提示詞",
        prompt: `設計基於角色存取控制 (RBAC) 的屬性判定表，將全校學生、教師與行政人員 SSO 群組對應至 Gemini Enterprise 的權限層級。`
      }
    ],
    "zh-CN": [
      {
        type: "general",
        title: "生成 SAML 2.0 / OIDC 身份联合技术规格提示词",
        prompt: `为校园网域 {{INSTITUTION_DOMAIN}} 撰写整合身份提供者 ({{IDP_PROVIDER}}) 至 Google Cloud Workforce Identity 的部署规格书。详列 NameID、主要电子邮件、角色群组与系所代码映射规则。`
      },
      {
        type: "general",
        title: "生成属性条件与 RBAC 角色授权矩阵提示词",
        prompt: `设计基于角色访问控制 (RBAC) 的属性判定表，将全校学生、教师与行政人员 SSO 群组对应至 Gemini Enterprise 的权限层级。`
      }
    ]
  },
  sao_scavenger_hunt: {
    en: [
      {
        type: "general",
        title: "Prompt to Generate Campus Landmarks Trivia & Cultural Clues",
        prompt: `Create 5 clever rhyming riddle clues highlighting landmark locations across {{CAMPUS_NAME}} for the {{FESTIVAL_NAME}} celebration. Each riddle should describe architectural features of the campus without stating its name.`
      },
      {
        type: "general",
        title: "Prompt to Generate QR Checkpoint Mini-Challenge Prompts",
        prompt: `Design 5 quick two-question cultural trivia mini-challenges for QR checkpoints during {{FESTIVAL_NAME}} that students can answer on mobile devices to earn digital red packet stamps.`
      }
    ],
    "zh-TW": [
      {
        type: "general",
        title: "生成校園地標文化謎題與線索提示詞",
        prompt: `為「{{CAMPUS_NAME}}」慶祝「{{FESTIVAL_NAME}}」設計 5 則押韻的校園地標尋寶謎語。透過建築物特色引導學生探索圖書館、鐘樓、學生活動中心等地標。`
      },
      {
        type: "general",
        title: "生成 QR 關卡文化小測驗與挑戰提示詞",
        prompt: `為「{{FESTIVAL_NAME}}」設計 5 個打卡關卡的快問快答（每關 2 題），使學生可透過手機掃描即時作答並解鎖數位紅包章。`
      }
    ],
    "zh-CN": [
      {
        type: "general",
        title: "生成校园地标文化谜题与线索提示词",
        prompt: `为“{{CAMPUS_NAME}}”庆祝“{{FESTIVAL_NAME}}”设计 5 则押韵的校园地标寻宝谜语。透过建筑物特色引导学生探索图书馆、钟楼、学生活动中心等地标。`
      },
      {
        type: "general",
        title: "生成 QR 关卡文化小测验与挑战提示词",
        prompt: `为“{{FESTIVAL_NAME}}”设计 5 个打卡关卡的快问快答（每关 2 题），使学生可通过手机扫描即时作答并解锁数字红包章。`
      }
    ]
  },
  finance_compliance: {
    en: [
      {
        type: "general",
        title: "Prompt to Generate Society Expense Reimbursement Policy Guide",
        prompt: `Draft an official student organization finance compliance guideline outlining reimbursable expenses, non-allowable expenditures (e.g. alcohol, tips over 15%), and mandatory invoice attachment criteria.`
      },
      {
        type: "general",
        title: "Prompt to Generate Audit Discrepancy Notice & Appeal Letter",
        prompt: `Draft a formal yet polite financial audit deduction notice addressed to {{SOCIETY_NAME}} regarding event claim '{{EVENT_NAME}}' with itemized disallowed expenses and step-by-step appeal procedures.`
      }
    ],
    "zh-TW": [
      {
        type: "general",
        title: "生成社團經費報銷手冊與審核準則提示詞",
        prompt: `編撰一份學生社團經費核銷指引，明確條列可報銷項目、禁止報銷項目（如酒精飲料、逾 15% 小費）及發票憑證正規化要求。`
      },
      {
        type: "general",
        title: "生成單據不合規扣除通知與申訴信範本提示詞",
        prompt: `撰寫一份客氣且規範的財務審核意見書，通知「{{SOCIETY_NAME}}」於「{{EVENT_NAME}}」活動申請中的不合規扣除明細，並附上補件及申訴指引。`
      }
    ],
    "zh-CN": [
      {
        type: "general",
        title: "生成社团经费报销手册与审核准则提示词",
        prompt: `编撰一份学生社团经费核销指引，明确条列可报销项目、禁止报销项目（如酒精饮料、逾 15% 小费）及发票凭证正规化要求。`
      },
      {
        type: "general",
        title: "生成单据不合规扣除通知与申诉信范本提示词",
        prompt: `撰写一份客气且规范的财务审核意见书，通知“{{SOCIETY_NAME}}”于“{{EVENT_NAME}}”活动申请中的不合规扣除明细，并附上补件及申诉指引。`
      }
    ]
  },
  security_simulator: {
    en: [
      {
        type: "general",
        title: "Prompt to Generate Emergency Response SOP & Incident Brief",
        prompt: `Act as a Director of Campus Safety. Draft a standard operating procedure (SOP) brief for campus security personnel managing {{EMERGENCY_SCENARIO}} at {{FACILITY_LOCATION}}. Include initial containment, perimeter isolation, and communications protocol.`
      },
      {
        type: "general",
        title: "Prompt to Generate Crisis Decision Tree Scenario Table",
        prompt: `Create a 3-stage branching crisis drill scenario table for {{EMERGENCY_SCENARIO}} at {{FACILITY_LOCATION}}. At each stage (0 min, 15 min, 30 min), define 3 tactical options, the operational consequence of each, and evaluation rubric criteria.`
      }
    ],
    "zh-TW": [
      {
        type: "general",
        title: "生成校園緊急應變 SOP 與情境簡報提示詞",
        prompt: `請扮演校園安保總監。為安保團隊在「{{FACILITY_LOCATION}}」應對「{{EMERGENCY_SCENARIO}}」撰寫應變標準作業程序 (SOP)。包含首要隔離處置、警戒線封鎖與校安通報程序。`
      },
      {
        type: "general",
        title: "生成三階段危機決策樹演練腳本提示詞",
        prompt: `為「{{FACILITY_LOCATION}}」發生的「{{EMERGENCY_SCENARIO}}」建立三階段演習腳本（0分、15分、30分），每階段提供 3 項戰術選擇、後續連鎖後果及演練評分準則。`
      }
    ],
    "zh-CN": [
      {
        type: "general",
        title: "生成校园紧急应变 SOP 与情境简报提示词",
        prompt: `请扮演校园安保总监。为安保团队在“{{FACILITY_LOCATION}}”应对“{{EMERGENCY_SCENARIO}}”撰写应变标准作业程序 (SOP)。包含首要隔离处置、警戒线封锁与校安通报程序。`
      },
      {
        type: "general",
        title: "生成三阶段危机决策树演练脚本提示词",
        prompt: `为“{{FACILITY_LOCATION}}”发生的“{{EMERGENCY_SCENARIO}}”建立三阶段演习脚本（0分、15分、30分），每阶段提供 3 项战术选择、后续连锁后果及演练评分准则。`
      }
    ]
  }
};

// UI STATIC TRANSLATIONS (EN, zh-TW, zh-CN)
const uiTranslations = {
  en: {
    samplePrompt: "Sample Prompt",
    step1Title: "Setup & Grounding",
    step2Title: "Execute Sample Prompt",
    step3Title: "Human Review & Delivery",
    fillVariablesTitle: "Fill in the variables",
    fillVariablesDesc: "Click tokens or type below to customize prompt in real-time",
    helperPromptTag: "HELPER PROMPT",
    copyHelperPrompt: "Copy Prompt",

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
      "SAO": "Student Affairs Officer (SAO)",
      "Program Leader": "Program Leader / Department Head",
      "Dean": "Dean / Educational Leader"
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
    adminPortalSubtitle: "Configure users, update learning playbooks, and analyze the last 6 months of usage metrics.",
    adminTabUsersText: "Users Provisioning",
    adminTabAnalyticsText: "System Analytics",
    adminTabCasesText: "Use Cases CRUD",
    btnAdminBackToPortalText: "Learning Portal",
    btnAdminLogoutText: "Log Out",
    adminProvisionTitle: "Provision New Account",
    adminProvisionDesc: "This generates a <strong>random 10-character</strong> temporary password. You can provision multiple accounts at once by separating email addresses with commas; in that case, the default temporary password for all of them will be <strong>\"ChangeMe\"</strong>. All users are forced to reset their password on first login.",
    adminProvisionLabelEmail: "User Email Address",
    adminBtnProvision: "Provision",
    adminRegisteredUsersTitle: "Registered Portal Users",
    adminThUserEmail: "User Email",
    adminThPasswordStatus: "Password Status",
    adminThCreatedDate: "Created Date",
    adminThAdminActions: "Administrative Actions",
    adminLabelTotalUsers: "Total Registered Users",
    adminLabelTotalUseCases: "Total Use Cases",
    adminLabelTotalLikes: "User Liked Counts",
    adminChartTitle: "6-Month Portal Adoption Metrics",
    adminChartDesc: "Views, likes and Try it launches across the academic term.",
    adminLabelViewsLegend: "PAGE VIEWS",
    adminLabelLikesLegend: "USER LIKES",
    adminCrudTitle: "Playbook Content Master Management",
    adminBtnExportText: "Extract All (JSON)",
    adminBtnCreateCaseText: "Add Use Case",
    adminCrudThId: "ID",
    adminCrudThTitle: "Title",
    adminCrudThCategory: "Category Hub",
    adminCrudThRole: "Primary Role",
    adminCrudThActions: "Actions",
    adminFormLabelId: "ID (Unique, Immutable)",
    adminFormLabelCategory: "Category Hub",
    adminFormLabelTitle: "Template Title",
    adminFormLabelRole: "Primary Role Context",
    adminFormLabelSummary: "Brief Summary Description",
    adminFormLabelFeatures: "Required Gemini Features",
    adminFormLabelConnectors: "Required Connectors",
    adminFormLabelLevel: "Applicable Institution Levels",
    adminFormLabelSteps: "Procedural Guide Steps (One step per line)",
    adminFormLabelPrompt: "System Prompt sandbox instruction",
    adminFormLabelProTip: "Pro Tip",
    adminFormLabelAdvancedSteps: "Advanced Procedural Steps - Active-Integration Mode (One step per line)",
    adminFormLabelAdvancedPrompt: "Advanced System Prompt - Active-Integration Mode",
    adminFormLabelAdvancedProTip: "Advanced Pro Tip - Active-Integration Mode",
    adminFormLabelZhtwHeader: "Traditional Chinese (繁體中文) Translations",
    adminFormLabelZhtwTitle: "Translated Title",
    adminFormLabelZhtwSummary: "Translated Summary",
    adminFormLabelZhtwSteps: "Translated Steps (One per line)",
    adminFormLabelZhtwPrompt: "Translated Prompt",
    adminFormLabelZhtwProTip: "Translated Pro Tip",
    adminFormLabelZhtwAdvancedSteps: "Translated Advanced Steps (One per line)",
    adminFormLabelZhtwAdvancedPrompt: "Translated Advanced Prompt",
    adminFormLabelZhtwAdvancedProTip: "Translated Advanced Pro Tip",
    adminFormLabelZhcnHeader: "Simplified Chinese (简体中文) Translations",
    adminFormLabelZhcnTitle: "Translated Title",
    adminFormLabelZhcnSummary: "Translated Summary",
    adminFormLabelZhcnSteps: "Translated Steps (One per line)",
    adminFormLabelZhcnPrompt: "Translated Prompt",
    adminFormLabelZhcnProTip: "Translated Pro Tip",
    adminFormLabelZhcnAdvancedSteps: "Translated Advanced Steps (One per line)",
    adminFormLabelZhcnAdvancedPrompt: "Translated Advanced Prompt",
    adminFormLabelZhcnAdvancedProTip: "Translated Advanced Pro Tip",
    btnAdminFormCancel: "Cancel",
    btnAdminFormSave: "Save Changes",
    sidebarFeaturesTitle: "Filter by GE Feature",
    filterLiked: "My Liked Cases",
    adminFormLabelDualModeCheckbox: "Enable Dual-Mode Template (Supports Standalone & Advanced workflows)",
    adminFormDescDualModeCheckbox: "When enabled, this playbook supports both standard manual file workflows and advanced integration modes, automatically managing standard prompt variables."
  },
  "zh-TW": {
    samplePrompt: "範例提示詞",
    step1Title: "步驟一：準備與知識庫匯入",
    step2Title: "步驟二：執行範例提示詞",
    step3Title: "步驟三：人工覆核與成果交付",
    fillVariablesTitle: "填寫變數參數",
    fillVariablesDesc: "點擊標籤或於下方輸入以即時自訂提示詞",
    helperPromptTag: "輔助提示詞",
    copyHelperPrompt: "複製提示詞",

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
       "SAO": "學生事務官 (SAO)",
       "Program Leader": "學程負責人 / 系主任",
       "Dean": "院長 / 教育領導者"
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
    btnAdminLogoutText: "登出系統",
    adminProvisionTitle: "開通新帳戶",
    adminProvisionDesc: "系統將自動生成一組 <strong>10 位字元</strong>的臨時隨機密碼。您可以通過用逗號分隔電子郵件地址來一次性開通多個帳戶；在這種情況下，所有帳戶的預設臨時密碼將為 <strong>\"ChangeMe\"</strong>。所有使用者於首次登入時必須強制重設密碼。",
    adminProvisionLabelEmail: "使用者電子郵件地址",
    adminBtnProvision: "開通帳戶",
    adminRegisteredUsersTitle: "已註冊門戶使用者",
    adminThUserEmail: "使用者電子郵件",
    adminThPasswordStatus: "密碼重設狀態",
    adminThCreatedDate: "建立日期",
    adminThAdminActions: "帳戶管理權限",
    adminLabelTotalUsers: "已註冊使用者總數",
    adminLabelTotalUseCases: "學習案例總數",
    adminLabelTotalLikes: "使用者按讚計數",
    adminChartTitle: "近 6 個月門戶導入分析圖表",
    adminChartDesc: "詳細彙整整個學期期間的使用者瀏覽量、按讚次數與實際部署操作統計。",
    adminLabelViewsLegend: "頁面瀏覽量",
    adminLabelLikesLegend: "使用者按讚",
    adminCrudTitle: "學習案例內容主檔管理 (CRUD)",
    adminBtnExportText: "匯出案例 (JSON)",
    adminBtnCreateCaseText: "新增使用案例",
    adminCrudThId: "案例 ID",
    adminCrudThTitle: "案例標題",
    adminCrudThCategory: "所屬分類中心",
    adminCrudThRole: "主要角色定位",
    adminCrudThActions: "編輯操作",
    adminFormLabelId: "案例 ID (唯一、不可變更)",
    adminFormLabelCategory: "所屬分類中心",
    adminFormLabelTitle: "範本標題名稱",
    adminFormLabelRole: "主要套用角色定位",
    adminFormLabelSummary: "簡短摘要描述",
    adminFormLabelFeatures: "所需 Gemini 核心功能",
    adminFormLabelConnectors: "所需企業數據連接器",
    adminFormLabelLevel: "適用學校 / 機構級別",
    adminFormLabelSteps: "引導操作步驟說明 (每行一步驟)",
    adminFormLabelPrompt: "沙盒系統提示詞 (System Prompt)",
    adminFormLabelProTip: "導入心法 (Pro Tip)",
    adminFormLabelAdvancedSteps: "進階主動整合步驟 (僅適用於連接器連線模式)",
    adminFormLabelAdvancedPrompt: "進階主動整合系統提示詞 (System Prompt)",
    adminFormLabelAdvancedProTip: "進階主動整合導入心法 (Pro Tip)",
    adminFormLabelZhtwHeader: "繁體中文 (Traditional Chinese) 翻譯對應",
    adminFormLabelZhtwTitle: "翻譯標題 (繁體)",
    adminFormLabelZhtwSummary: "翻譯摘要描述 (繁體)",
    adminFormLabelZhtwSteps: "翻譯步驟 (每行一步驟)",
    adminFormLabelZhtwPrompt: "翻譯系統提示詞 (繁體)",
    adminFormLabelZhtwProTip: "翻譯導入心法 (繁體)",
    adminFormLabelZhtwAdvancedSteps: "翻譯進階整合步驟 (每行一步驟)",
    adminFormLabelZhtwAdvancedPrompt: "翻譯進階整合提示詞 (繁體)",
    adminFormLabelZhtwAdvancedProTip: "翻譯進階整合導入心法 (繁體)",
    adminFormLabelZhcnHeader: "簡體中文 (Simplified Chinese) 翻譯對應",
    adminFormLabelZhcnTitle: "翻譯標題 (简体)",
    adminFormLabelZhcnSummary: "翻譯摘要描述 (简体)",
    adminFormLabelZhcnSteps: "翻譯步驟 (每行一步骤)",
    adminFormLabelZhcnPrompt: "翻譯系統提示詞 (简体)",
    adminFormLabelZhcnProTip: "翻譯導入心法 (简体)",
    adminFormLabelZhcnAdvancedSteps: "翻譯进阶整合步骤 (每行一步骤)",
    adminFormLabelZhcnAdvancedPrompt: "翻譯进阶整合提示词 (简体)",
    adminFormLabelZhcnAdvancedProTip: "翻譯进阶整合导入心法 (简体)",
    btnAdminFormCancel: "取消",
    btnAdminFormSave: "儲存變更",
    sidebarFeaturesTitle: "按 CE 功能篩選",
    filterLiked: "我的收藏案例",
    adminFormLabelDualModeCheckbox: "啟用雙重模式範本 (支援獨立與進階連接器工作流程)",
    adminFormDescDualModeCheckbox: "啟用後，此案例同時支援手動上傳與進階連接器模式，標準提示詞與步驟將由系統自動處理。"
  },
  "zh-CN": {
    samplePrompt: "范例提示词",
    step1Title: "步骤一：准备与知识库导入",
    step2Title: "步骤二：执行范例提示词",
    step3Title: "步骤三：人工审核与成果交付",
    fillVariablesTitle: "填写变量参数",
    fillVariablesDesc: "点击标签或于下方输入以即时定制提示词",
    helperPromptTag: "辅助提示词",
    copyHelperPrompt: "复制提示词",

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
      "SAO": "学生事务官 (SAO)",
      "Program Leader": "学程负责人 / 系主任",
      "Dean": "院长 / 教育领导者"
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
    btnAdminLogoutText: "登出系统",
    adminProvisionTitle: "开通新账户",
    adminProvisionDesc: "系统将自动生成一组 <strong>10 位字符</strong>的临时随机密码。您可以通过用逗号分隔电子邮件地址来一次性开通多个账户；在这种情况下，所有账户的默认临时密码将为 <strong>\"ChangeMe\"</strong>。所有使用者于首次登录时必须强制重设密码。",
    adminProvisionLabelEmail: "使用者电子邮件地址",
    adminBtnProvision: "开通账户",
    adminRegisteredUsersTitle: "已注册门户使用者",
    adminThUserEmail: "使用者电子邮件",
    adminThPasswordStatus: "密码重设状态",
    adminThCreatedDate: "建立日期",
    adminThAdminActions: "账户管理权限",
    adminLabelTotalUsers: "已注册使用者总数",
    adminLabelTotalUseCases: "学习案例总数",
    adminLabelTotalLikes: "使用者点赞计数",
    adminChartTitle: "近 6 个月门户导入分析图表",
    adminChartDesc: "详细汇总整个学期期间的使用者浏览量、点赞次数与实际部署操作统计。",
    adminLabelViewsLegend: "页面浏览量",
    adminLabelLikesLegend: "使用者点赞",
    adminCrudTitle: "学习案例内容主档管理 (CRUD)",
    adminBtnExportText: "导出案例 (JSON)",
    adminBtnCreateCaseText: "新增使用案例",
    adminCrudThId: "案例 ID",
    adminCrudThTitle: "案例标题",
    adminCrudThCategory: "所属分类中心",
    adminCrudThRole: "主要角色定位",
    adminCrudThActions: "编辑操作",
    adminFormLabelId: "案例 ID (唯一、不可变更)",
    adminFormLabelCategory: "所属分类中心",
    adminFormLabelTitle: "范本标题名称",
    adminFormLabelRole: "主要套用角色定位",
    adminFormLabelSummary: "简短摘要描述",
    adminFormLabelFeatures: "所需 Gemini 核心功能",
    adminFormLabelConnectors: "所需企业数据连接器",
    adminFormLabelLevel: "适用学校 / 机构级别",
    adminFormLabelSteps: "引导操作步骤说明 (每行一步骤)",
    adminFormLabelPrompt: "沙盒系统提示词 (System Prompt)",
    adminFormLabelProTip: "导入心法 (Pro Tip)",
    adminFormLabelAdvancedSteps: "进阶主动整合步骤 (仅适用于连接器连线模式)",
    adminFormLabelAdvancedPrompt: "进阶主动整合系统提示词 (System Prompt)",
    adminFormLabelAdvancedProTip: "进阶主动整合导入心法 (Pro Tip)",
    adminFormLabelZhtwHeader: "繁体中文 (Traditional Chinese) 翻译对应",
    adminFormLabelZhtwTitle: "翻译标题 (繁体)",
    adminFormLabelZhtwSummary: "翻译摘要描述 (繁体)",
    adminFormLabelZhtwSteps: "翻译步骤 (每行一步骤)",
    adminFormLabelZhtwPrompt: "翻译系统提示词 (繁體)",
    adminFormLabelZhtwProTip: "翻译导入心法 (繁體)",
    adminFormLabelZhtwAdvancedSteps: "翻译进阶整合步骤 (每行一步骤)",
    adminFormLabelZhtwAdvancedPrompt: "翻译进阶整合提示词 (繁體)",
    adminFormLabelZhtwAdvancedProTip: "翻译进阶整合导入心法 (繁體)",
    adminFormLabelZhcnHeader: "简体中文 (Simplified Chinese) 翻译对应",
    adminFormLabelZhcnTitle: "翻译标题 (简体)",
    adminFormLabelZhcnSummary: "翻译摘要描述 (简体)",
    adminFormLabelZhcnSteps: "翻译步骤 (每行一步骤)",
    adminFormLabelZhcnPrompt: "翻译系统提示词 (简体)",
    adminFormLabelZhcnProTip: "翻译导入心法 (简体)",
    adminFormLabelZhcnAdvancedSteps: "翻译进阶整合步骤 (每行一步骤)",
    adminFormLabelZhcnAdvancedPrompt: "翻译进阶整合提示词 (简体)",
    adminFormLabelZhcnAdvancedProTip: "翻译进阶整合导入心法 (简体)",
    btnAdminFormCancel: "取消",
    btnAdminFormSave: "保存变更",
    sidebarFeaturesTitle: "按 CE 功能筛选",
    filterLiked: "我的点赞案例",
    adminFormLabelDualModeCheckbox: "启用双重模式范本 (支持独立与进阶连接器工作流程)",
    adminFormDescDualModeCheckbox: "启用后，此案例同时支持手动上传与进阶连接器模式，标准提示词与步骤将由系统自动处理。"
  }
};

// DYNAMIC USE CASE CONTENT TRANSLATIONS
const useCasesTranslations = {
  socratic_tutor: {
    "en": {
      title: "Socratic AI Tutor Agent Creation",
      summary: "Ground a custom course Agent in your lecture notes and syllabi to act as a 24/7 Socratic learning companion.",
      steps: [
        "In NotebookLM, create a 'Read-Only Course Hub' and upload syllabus documents, lecture slides, and key readings.",
        "In Agent Designer, configure the Socratic tutor persona prompt with grounding and test interactive questions.",
        "Review guidance quality, publish the shareable Agent link, and embed it into your institutional LMS."
      ],
      prompt: `You are the '{{COURSE_CODE}} Coach,' a friendly and encouraging Socratic tutor for {{COURSE_NAME}}. Your sole objective is to guide students to find answers themselves.
Follow these rules strictly:
1. **Ground all your responses** in the provided course materials only.
2. When a student asks a question (e.g., 'What is the answer to question 3?'), do NOT give the direct answer. Instead, respond with a probing, contextual question that helps them think critically.
3. Reference specific files/pages in the course materials (e.g., 'Can you look at slide 4 of Lecture 2 and tell me what the first stage is called?').
4. If a student demonstrates correct understanding, praise them and provide a complete, rich explanation.
5. If asked about topics outside this course, politely decline, stating: 'I can only assist you with {{COURSE_NAME}} topics.'
6. Cite your sources for every answer.`,
      proTip: "By connecting NotebookLM as the grounding layer, you ensure the Agent never hallucinates answers, restricts responses to authorized curriculum text, and provides verified inline citations."
    },
    "zh-TW": {
      title: "Socratic AI Tutor Agent 創建",
      summary: "將客製化的課程 Agent 植基於您的授課筆記與教學大綱，打造 24/7 的 Socratic 學習導師。",
      steps: [
        "在 NotebookLM 中建立「唯讀課程中心」，上傳課程大綱、簡報及核心教材。",
        "進入 Agent Designer 設定 Socratic 角色特徵提示詞並連結課程中心進行互動測試。",
        "覆核引導品質後生成公開分享連結，並嵌入發布至校園 LMS 系統。"
      ],
      prompt: `你是「{{COURSE_CODE}} 導師」，一位親切且循循善誘的 {{COURSE_NAME}} Socratic 學習教練。你的唯一目標是引導學生自主思考並找到答案。
請嚴格遵守以下準則：
1. **所有回答均須植基於**提供的課程教材中，絕不可編造。
2. 當學生問及特定答案時，不要直接告知。請回覆一個具探究性、情境式的反問，幫助他們進行批判性思考。
3. 具體指出課程材料中的文件或頁數（例如：「你可以參考 Lecture 2 的第 4 張投影片，然後告訴我第一個階段叫什麼名字嗎？」）。
4. 當學生展現正確的理解時，給予肯定並提供完整、豐富的補充說明。
5. 若問及本課程以外的主題，請禮貌地拒絕並回答：「我只能協助你解答關於 {{COURSE_NAME}} 的問題。」
6. 每次回答皆須引用出處。`,
      proTip: "連結 NotebookLM 作為知識地基，可確保 Agent 絕不胡言亂語（Hallucinate），且其所有答覆均受限於核准的教材，並提供真實可信的內文引用。"
    },
    "zh-CN": {
      title: "Socratic AI Tutor Agent 创建",
      summary: "将定制的课程 Agent 植基于您的授课笔记与教学大纲，打造 24/7 的 Socratic 学习导师。",
      steps: [
        "在 NotebookLM 中建立“只读课程中心”，上传课程大纲、课件及核心教材。",
        "进入 Agent Designer 设置 Socratic 角色特征提示词并链接课程中心进行互动测试。",
        "审核引导品质后生成公开分享链接，并嵌入发布至校园 LMS 系统。"
      ],
      prompt: `你是“{{COURSE_CODE}} 导师”，一位亲切且循循善诱的 {{COURSE_NAME}} Socratic 学习教练。你的唯一目标是引导学生自主思考并找到答案。
请严格遵守以下准则：
1. **所有回答均须植基于**提供的课程教材中，绝不可编造。
2. 当学生问及特定答案时，不要直接告知。请回复一个具探究性、情境式的反问，帮助他们进行批判性思考。
3. 具体指出课程材料中的文件或页数（例如：“你可以参考 Lecture 2 的第 4 张幻灯片，然后告诉我第一个阶段叫什么名字吗？”）。
4. 当学生展现正确的理解时，给予肯定并提供完整、丰富的补充说明。
5. 若问及本课程以外的主题，请礼貌地拒绝并回答：“我只能协助你解答关于 {{COURSE_NAME}} 的问题。”
6. 每次回答皆须引用出处。`,
      proTip: "链接 NotebookLM 作为知识地基，可确保 Agent 绝不胡言乱语（Hallucinate），且其所有答复均受限于核准的教材，并提供真实可信的内文引用。"
    }
  },
  rubric_grading: {
    "en": {
      title: "Rubric-Aligned Essay Feedback Assistant",
      summary: "Analyze student essays against a complex grading rubric in NotebookLM and generate formative constructive feedback.",
      steps: [
        "Create a dedicated workspace in NotebookLM and upload the assignment instructions and analytical grading rubric.",
        "Upload the student essay and execute the formative rubric grading prompt in the workbench.",
        "Review tentative criterion scores, personalize pedagogical remarks, and export feedback to LMS or student portfolio."
      ],
      prompt: `Acting as an expert academic teaching assistant, analyze the attached student essay for the assignment "{{ASSIGNMENT_TITLE}}" against the uploaded grading rubric for student "{{STUDENT_ID}}". Generate a first draft of constructive, high-quality feedback.
The feedback MUST adhere to the following structure:
1. **Rubric Performance Summary**: Provide a tentative level/score for each rubric criterion, directly referencing specific evidence from the student's submission.
2. **Key Strengths (1-2)**: Identify specific aspects of the paper that were executed exceptionally well, quoting 1-2 examples from the text.
3. **Areas for Growth (2-3)**: Identify specific logical, grammatical, or structural issues. Explain how they relate to the rubric requirements.
4. **Actionable Recommendations**: Provide 2-3 specific, progressive steps the student can take in their next draft to improve.
Maintain a supportive, pedagogical, and highly encouraging tone throughout.`,
      proTip: "Because NotebookLM operates in a secure cloud tenant, student intellectual property and data remain completely confidential and are never used to train public LLM models."
    },
    "zh-TW": {
      title: "Rubric 評分規準作業回饋助理",
      summary: "在 NotebookLM 中依據多元評分規準分析學生論文，生成形成性、具建設性的回饋建議。",
      steps: [
        "在 NotebookLM 建立專屬工作區，上傳作業指引及分析型評分規準 (Rubric)。",
        "匯入學生作業並在提示詞工作台執行評分規準診斷提示詞。",
        "審核各項指標初評，增修個人化評語，並匯出發送至 LMS 或學生學習歷程。"
      ],
      prompt: `請扮演大學教學助理，依據上傳的評分規準分析學生「{{STUDENT_ID}}」繳交的「{{ASSIGNMENT_TITLE}}」作業，產生具建設性的形成性回饋草稿。
回饋內容必須包含以下結構：
1. **評分規準成效摘要**：為每個評分指標給予建議評等，並引用作業具體文句佐證。
2. **主要亮點 (1-2 項)**：指出表現出色的論點或論證段落，直接引用原文肯定。
3. **待加強面向 (2-3 項)**：具體標註邏輯跳躍、論據不足或結構鬆散之處，並說明如何對齊評分規範。
4. **具體精進建議**：提供 2-3 個明確的下階段修改指引。
全文請保持溫和、富教學熱忱且積極正向的口吻。`,
      proTip: "NotebookLM 運作於受保護的企業雲端環境中，學生智財與隱私資料受到嚴格隔離，絕不用於公開模型訓練。"
    },
    "zh-CN": {
      title: "Rubric 评分规准作业反馈助理",
      summary: "在 NotebookLM 中依据多元评分规准分析学生论文，生成形成性、具建设性的反馈建议。",
      steps: [
        "在 NotebookLM 建立专属工作区，上传作业指引及分析型评分规准 (Rubric)。",
        "导入学生作业并在提示词工作台执行评分规准诊断提示词。",
        "审核各项指标初评，增修个性化评语，并导出发送至 LMS 或学生学习档案。"
      ],
      prompt: `请扮演大学教学助理，依据上传的评分规准分析学生“{{STUDENT_ID}}”提交的“{{ASSIGNMENT_TITLE}}”作业，产生具建设性的形成性反馈草稿。
反馈内容必须包含以下结构：
1. **评分规准成效摘要**：为每个评分指标给予建议评等，并引用作业具体文句佐证。
2. **主要亮点 (1-2 项)**：指出表现出色的论点或论证段落，直接引用原文肯定。
3. **待加强面向 (2-3 项)**：具体标注逻辑跳跃、论据不足或结构松散之处，并说明如何对齐评分规范。
4. **具体改进建议**：提供 2-3 个明确的下阶段修改指引。
全文请保持温和、富教学热情且积极正向的口吻。`,
      proTip: "NotebookLM 运作于受保护的企业云端环境中，学生智财与隐私数据受到严格隔离，绝不用于公开模型训练。"
    }
  },
  curriculum_design: {
    "en": {
      title: "Industry-Aligned Curriculum Architect",
      summary: "Conduct market research and analyze industry trends to design a comprehensive, modern course syllabus from scratch.",
      steps: [
        "Initiate a Deep Research query targeting emerging job market competencies and industry trends.",
        "Synthesize findings into learning outcomes and execute syllabus drafting in Canvas Mode.",
        "Refine weekly modules and project-based rubrics with departmental peers, then export to Google Docs."
      ],
      prompt: `Act as a senior instructional designer. I want to build a brand new, highly modern course syllabus for {{COURSE_TITLE}} targeting the {{TARGET_INDUSTRY}} industry.
Phase 1: Research. Search the web for the top 5 most in-demand technical and soft skills requested by employers in this field over the past 12 months.
Phase 2: Learning Outcomes. Design 5 measurable learning outcomes mapped directly to Bloom's Taxonomy based on these skills.
Phase 3: Syllabus Draft. Create a comprehensive 14-week topic outline, specifying major lecture themes, in-class active learning tasks, and project milestones.
Phase 4: Assessment. Propose a project-based grading framework that bypasses traditional exam formats in favor of authentic proof-of-work assignments.`,
      proTip: "Use Deep Research's capability to search hundreds of academic and corporate portals simultaneously, providing you with a high-fidelity summary report citing actual job-post statistics."
    },
    "zh-TW": {
      title: "產業導向課程架構設計師",
      summary: "利用 Deep Research 進行就業市場調查與技術趨勢分析，從零規劃高度現代化的課程大綱。",
      steps: [
        "發起 Deep Research 檢索鎖定目標產業的新興技術指標與就業職能。",
        "將調研成果轉化為認知學習成效，並於 Canvas Mode 展開教學大綱編寫。",
        "與系所同仁共同微調 14 週單元專案評核機制，最後匯出至文件。"
      ],
      prompt: `請扮演資深教學設計師。我希望為面向「{{TARGET_INDUSTRY}}」領域的課程「{{COURSE_TITLE}}」規劃一套全新且符合當前產業趨勢的教學大綱。
第一階段（趨勢調研）：檢索過去 12 個月內該領域雇主需求最高的 5 項核心技術技能與 3 項關鍵軟實力。
第二階段（學習成效）：依據上述技能，參照 Bloom 分類法設計 5 項具體可評量的學習成效。
第三階段（大綱草擬）：編排完整的 14 週單元大綱，註明每週授課核心、課堂實作任務及分組專案里程碑。
第四階段（評核方案）：提出以實作產出 (Proof-of-work) 為導向的多元評量設計，取代傳統死記型期末筆試。`,
      proTip: "善用 Deep Research 同步檢索數百個學術與企業資訊站點的能力，自動產出附有具體職缺統計數據的高信度綜整報告。"
    },
    "zh-CN": {
      title: "产业导向课程架构设计师",
      summary: "利用 Deep Research 进行就业市场调查与技术趋势分析，从零规划高度现代化的课程大纲。",
      steps: [
        "发起 Deep Research 检索锁定目标产业的新兴技术指标与就业职能。",
        "将调研成果转化为认知学习成效，并于 Canvas Mode 展开教学大纲编写。",
        "与系所同仁共同微调 14 周单元项目评估机制，最后导出至文档。"
      ],
      prompt: `请扮演资深教学设计师。我希望为面向“{{TARGET_INDUSTRY}}”领域的课程“{{COURSE_TITLE}}”规划一套全新且符合当前产业趋势的教学大纲。
第一阶段（趋势调研）：检索过去 12 个月内该领域雇主需求最高的 5 项核心技术技能与 3 项关键软实力。
第二阶段（学习成效）：依据上述技能，参照 Bloom 分类法设计 5 项具体可评估的学习成效。
第三阶段（大纲草拟）：编排完整的 14 周单元大纲，注明每周授课核心、课堂实操任务及分组项目里程碑。
第四阶段（评估方案）：提出以实操产出 (Proof-of-work) 为导向的多元评估设计，取代传统死记型期末笔试。`,
      proTip: "善用 Deep Research 同步检索数百个学术与企业信息站点的能力，自动产出附有具体职位统计数据的高信度综整报告。"
    }
  },
  lab_manual_creator: {
    "en": {
      title: "Interactive Lab Guide & Safety Manual",
      summary: "Create student-facing lab manuals with step-by-step procedures, safety icons, and visual layout prompts in Canvas mode.",
      steps: [
        "Define experiment objectives and compile safety protocols in Canvas Mode.",
        "Generate student procedure steps and custom equipment illustrations using Image Generation.",
        "Assemble student observation tables, review safety hazard compliance, and publish the printable lab guide."
      ],
      prompt: `You are a laboratory coordinator for {{COURSE_NAME}}. Write an engaging, student-facing lab guide for the experiment "{{EXPERIMENT_NAME}}".
The document should include:
1. **Introduction**: A brief, captivating summary of the biological/chemical relevance of {{EXPERIMENT_NAME}}.
2. **Learning Objectives**: 3 clear outcomes.
3. **Safety First Box**: Explicit hazards, clothing requirements, and chemical disposal protocols.
4. **Step-by-step Procedure**: An easy-to-follow, numbered checklist of steps.
5. **Observation & Reflection Journal**: Propose a set of 3 thought-provoking prediction prompts and blank tables for students to record measurements.`,
      proTip: "Use bold text and alerts inside Canvas Mode to ensure safety steps stand out visually to prevent accidents during high-risk physical labs."
    },
    "zh-TW": {
      title: "互動實驗指引與安全守則編排",
      summary: "在 Canvas 模式中編寫實驗手冊，搭配 Image Generation 生成實驗步驟圖示與安全規範說明。",
      steps: [
        "在 Canvas Mode 中釐清實驗核心目標，並統整化學與物理安全守則。",
        "編排條列式實驗步驟，並透過 Image Generation 繪製專屬實驗器材圖示。",
        "組合實驗數據記錄表，進行校園安全規範審核後發布為可列印實驗手冊。"
      ],
      prompt: `你是「{{COURSE_NAME}}」的實驗室負責人。請為實驗「{{EXPERIMENT_NAME}}」編寫一份生動且指引明確的學生實驗操作手冊。
文件須包含：
1. **前言**：簡述「{{EXPERIMENT_NAME}}」的學術價值與生活應用。
2. **學習成效**：3 項具體操作與認知目標。
3. **安全警示方塊**：明列危害等級、必備防護裝備及化學廢液處置規範。
4. **逐步操作程序**：清晰編號的操作流程。
5. **數據紀錄與思辨日誌**：提供數據填寫表格及 3 道引導性預測思考題。`,
      proTip: "在 Canvas Mode 中善用粗體警示與醒目色塊標記安全要點，能大幅降低高風險實體實驗中的意外發生率。"
    },
    "zh-CN": {
      title: "互动实验指引与安全守则编排",
      summary: "在 Canvas 模式中编写实验手册，搭配 Image Generation 生成实验步骤图示与安全规范说明。",
      steps: [
        "在 Canvas Mode 中厘清实验核心目标，并统整化学与物理安全守则。",
        "编排条列式实验步骤，并透过 Image Generation 绘制专属实验器材图示。",
        "组合实验数据记录表，进行校园安全规范审核后发布为可打印实验手册。"
      ],
      prompt: `你是“{{COURSE_NAME}}”的实验室负责人。请为实验“{{EXPERIMENT_NAME}}”编写一份生动且指引明确的学生实验操作手册。
文件须包含：
1. **前言**：简述“{{EXPERIMENT_NAME}}”的学术价值与生活应用。
2. **学习成效**：3 项具体操作与认知目标。
3. **安全警示方框**：明列危害等级、必备防护装备及化学废液处置规范。
4. **逐步操作程序**：清晰编号的操作流程。
5. **数据记录与思辨日志**：提供数据填写表格及 3 道引导性预测思考题。`,
      proTip: "在 Canvas Mode 中善用粗体警示与醒目色块标记安全要点，能大幅降低高风险实体实验中的意外发生率。"
    }
  },
  su_advocacy: {
    "en": {
      title: "Student Feedback Sentiment Dashboard",
      summary: "Consolidate massive volumes of unstructured student feedback from surveys and town halls to synthesize advocacy data.",
      steps: [
        "Collect survey responses and student feedback sheets into a secured institutional Drive folder.",
        "Run multi-factor qualitative sentiment and thematic analysis via Deep Research and NotebookLM.",
        "Synthesize recurring concerns into priority advocacy items and present to university administration."
      ],
      prompt: `Acting as the Student Union Advocacy Director for {{INSTITUTION_NAME}}, analyze the uploaded collection of town hall transcripts and anonymous student survey comments for {{ACADEMIC_TERM}}.
Generate a comprehensive, evidence-based report that includes:
1. **Thematic Clustering**: Identify and group the top 5 most frequently complained-about campus issues.
2. **Sentiment Assessment**: For each issue, categorize the emotional tone (highly negative, frustrated, neutral) and extract 3 powerful, representative anonymized student quotes.
3. **Data-Driven Solutions**: Based on successful practices at benchmark peer schools, suggest 2 realistic, low-cost policy changes for each issue.
4. **Negotiation Preparation**: Draft a list of 5 anticipated objections from school deans regarding budget constraints, and provide persuasive, data-backed rebuttals.`,
      proTip: "Linking your student feedback database directly via the Drive Connector keeps the data federated, secure, and up-to-the-minute without copying local files."
    },
    "zh-TW": {
      title: "學生意見情緒分析與權益倡議儀表板",
      summary: "整合校園論壇、諮詢會與問卷海量非結構化意見，產出高說服力之學生權益數據報告。",
      steps: [
        "將諮詢會筆記與匿名問卷彙整至安全的雲端硬碟 (Drive) 目錄中。",
        "透過 Deep Research 與 NotebookLM 進行主題聚類與多維度情緒分析。",
        "將高頻問題轉化為學生權益倡議白皮書，向學校管理層進行正式提案。"
      ],
      prompt: `請扮演「{{INSTITUTION_NAME}}」學生會權益部長，分析「{{ACADEMIC_TERM}}」學期收集到的校園諮詢會記錄及匿名意見問卷。
生成一份具說服力且客觀的學生權益報告：
1. **議題聚類分析**：歸納學生最關注的 5 大校園議題。
2. **情緒強度評估**：標註各議題的負面情緒比重，並摘錄 3 則最具代表性的學生去識別化發言。
3. **數據導向方案**：參考其他大學標竿做法，針對每個議題提出 2 項具可行性且低成本的政策建議。
4. **協商對策準備**：預判 5 項校方可能提出的預算或行政反對理由，並提供有數據佐證的應對答辯。`,
      proTip: "透過 Drive Connector 建立即時連線，能確保民意數據維持在雲端權限保護下，無需在本機複製檔案即可獲得最新分析。"
    },
    "zh-CN": {
      title: "学生意见情绪分析与权益倡议仪表板",
      summary: "整合校园论坛、咨询会与问卷海量非结构化意见，产出高说服力之学生权益数据报告。",
      steps: [
        "将咨询会笔记与匿名问卷汇整至安全的云端硬盘 (Drive) 目录中。",
        "透过 Deep Research 与 NotebookLM 进行主题聚类与多维度情绪分析。",
        "将高频问题转化为学生权益倡议白皮书，向学校管理层进行正式提案。"
      ],
      prompt: `请扮演“{{INSTITUTION_NAME}}”学生会权益部长，分析“{{ACADEMIC_TERM}}”学期收集到的校园咨询会记录及匿名意见问卷。
生成一份具说服力且客观的学生权益报告：
1. **议题聚类分析**：归纳学生最关注的 5 大校园议题。
2. **情绪强度评估**：标注各议题的负面情绪比重，并摘录 3 则最具代表性的学生去标识化发言。
3. **数据导向方案**：参考其他大学标杆做法，针对每个议题提出 2 项具可行性且低成本的政策建议。
4. **协商对策准备**：预判 5 项校方可能提出的预算或行政反对理由，并提供有数据佐证的应对答辩。`,
      proTip: "透过 Drive Connector 建立即时连线，能确保民意数据维持在云端权限保护下，无需在本机复制文件即可获得最新分析。"
    }
  },
  club_funding: {
    "en": {
      title: "Annual Club Calendar & Budget Justifier",
      summary: "Brainstorm an annual activities calendar and draft detailed, compliant student government funding proposals.",
      steps: [
        "Gather past semester club event logs, attendance counts, and itemized receipts into Drive.",
        "Generate annual budget justification proposals and activity timelines in Canvas Mode.",
        "Verify allocation compliance against union bylaws and submit to the student council funding committee."
      ],
      prompt: `Act as a professional grant and proposal writer. Help {{CLUB_NAME}} draft a detailed funding proposal for the academic year {{ACADEMIC_YEAR}}.
Inputs:
- Annual activities calendar: List of 4 major workshops, 1 public exhibition, 2 guest lectures, and 1 social event for {{CLUB_NAME}}.
- Approved funding guidelines: Max $200 per workshop, Max $500 for exhibition, strict food and beverage limits.
Task:
1. Create an **Executive Summary** detailing the club's mission and how these events boost student engagement.
2. Compile a detailed **Line-Item Budget Table**, calculating total costs and verifying compliance with the provided funding rules.
3. Write a compelling **Impact Statement** justifying why the Student Union should allocate resources to our club, detailing student outcomes.`,
      proTip: "Upload the Student Union's official constitutional funding guidelines to NotebookLM first. This prevents your proposal from getting rejected for violating obscure spend-limit policies."
    },
    "zh-TW": {
      title: "社團年度行事曆與經費預算企劃書",
      summary: "規劃社團年度活動時間軸，自動編排符合學生會補助章程的逐項預算企劃書。",
      steps: [
        "將過往學期社團活動紀錄、參與人次及單據明細彙整至雲端硬碟。",
        "在 Canvas Mode 中產生年度預算論證企劃與活動期程表。",
        "對齊學生自治組織法規檢驗預算合規性，最後呈交學生會評議委員會。"
      ],
      prompt: `請扮演專業提案企劃專家。協助社團「{{CLUB_NAME}}」撰寫「{{ACADEMIC_YEAR}}」學年度經費補助企劃書。
背景資料：
- 年度規劃活動：包含 4 場實務工作坊、1 場成果展覽、2 場大師講座及 1 場迎新聚會。
- 學生會補助上限標準：每場工作坊上限 $200、展覽上限 $500，餐敘飲品嚴格受限。
撰寫任務：
1. **執行摘要**：闡述社團創立宗旨在於豐富校園社群生活。
2. **逐項預算明細表**：計算活動總開銷，並嚴格落實法規上限自檢。
3. **社群影響力陳述**：論證此系列活動如何強化校園多元性與學生技能成長。`,
      proTip: "先將學生會最新的組織法與補助章程上傳至 NotebookLM，可確保產出的企劃書 100% 規避預算超標陷阱。"
    },
    "zh-CN": {
      title: "社团年度行事历与经费预算企划书",
      summary: "规划社团年度活动时间轴，自动编排符合学生会补助章程的逐项预算企划书。",
      steps: [
        "将过往学期社团活动记录、参与人次及单据明细汇整至云端硬盘。",
        "在 Canvas Mode 中产生年度预算论证企划与活动期程表。",
        "对齐学生自治组织法规检验预算合规性，最后呈交学生会评议委员会。"
      ],
      prompt: `请扮演专业提案企划专家。协助社团“{{CLUB_NAME}}”撰写“{{ACADEMIC_YEAR}}”学年度经费补助企划书。
背景数据：
- 年度规划活动：包含 4 场实务工作坊、1 场成果展览、2 场大师讲座及 1 场迎新聚会。
- 学生会补助上限标准：每场工作坊上限 $200、展览上限 $500，餐叙饮品严格受限。
撰写任务：
1. **执行摘要**：阐述社团创立宗旨在丰富校园社群生活。
2. **逐项预算明细表**：计算活动总开销，并严格落实法规上限自检。
3. **社群影响力陈述**：论证此系列活动如何强化校园多元性与学生技能成长。`,
      proTip: "先将学生会最新的组织法与补助章程上传至 NotebookLM，可确保产出的企划书 100% 规避预算超标陷阱。"
    }
  },
  su_helpdesk: {
    "en": {
      title: "24/7 Student Union Policy Agent",
      summary: "Build an AI support bot trained on club policy handbooks to answer operational and venue booking questions.",
      steps: [
        "Centralize student handbook, welfare guidelines, and club constitutions into NotebookLM.",
        "Deploy a 24/7 policy Q&A Agent using Agent Designer to guide members on regulations and forms.",
        "Test common edge cases and route complex disputes to human union officers via Email Connector."
      ],
      prompt: `You are the 24/7 Policy and Welfare Agent for {{STUDENT_UNION_NAME}} at {{INSTITUTION_NAME}}. Your purpose is to provide immediate, highly accurate answers to student questions regarding union bylaws, venue booking, lockers, and society financial subsidies.
Rules:
1. Answer using ONLY verified information from the attached student handbook and constitution.
2. Maintain a friendly, supportive student-peer tone.
3. Provide step-by-step instructions for all administrative procedures (e.g. How to book a room, how to apply for event funding).
4. If an inquiry involves confidential welfare disputes, severe mental health concerns, or complex disciplinary proceedings, do NOT answer. Provide immediate instructions to contact the designated human union officer at {{OFFICER_EMAIL}}.`,
      proTip: "Pairing the Agent with Email Connector ensures seamless, automated escalation when students face nuanced emergencies requiring staff intervention."
    },
    "zh-TW": {
      title: "24/7 學生會法規與會務諮詢 Agent",
      summary: "將社團評鑑、場地借用與會務規章交由專屬 Agent，提供全天候即時規章諮詢與行政表單指引。",
      steps: [
        "將學生手冊、福利規章與社團章程整合至 NotebookLM 知識庫。",
        "在 Agent Designer 中建立 24/7 規章諮詢 Agent，指導學生填寫申請表單。",
        "驗證極端諮詢情境，並透過 Email Connector 自動將複雜爭議轉派常務幹事處理。"
      ],
      prompt: `你是「{{INSTITUTION_NAME}}」之「{{STUDENT_UNION_NAME}}」全天候行政諮詢 Agent。你的任務是快速且精確地解答學生關於會章、活動場地借用、置物櫃申請及社團經費請領的疑問。
規範：
1. 僅能依據附加之法規手冊與章程進行回覆，絕不推測。
2. 保持熱情、親切且具同理心的同儕對話語氣。
3. 針對每項流程提供步驟化清晰指引。
4. 若涉及學生重大權益糾紛、心理輔導或懲戒評議，請停止回答並引導其寄信至專責幹事信箱：{{OFFICER_EMAIL}}。`,
      proTip: "整合 Email Connector 具備關鍵字升級機制，當學生遭遇重大急難或特殊爭議時，系統能即刻發送郵件通知真人幹事介入輔導。"
    },
    "zh-CN": {
      title: "24/7 学生会法规与会务咨询 Agent",
      summary: "将社团评估、场地借用与会务规章交由专属 Agent，提供全天候即时规章咨询与行政表单指引。",
      steps: [
        "将学生手册、福利规章与社团章程整合至 NotebookLM 知识库。",
        "在 Agent Designer 中建立 24/7 规章咨询 Agent，指导学生填写申请表单。",
        "验证极端咨询情境，并透过 Email Connector 自动将复杂争议转派常务干事处理。"
      ],
      prompt: `你是“{{INSTITUTION_NAME}}”之“{{STUDENT_UNION_NAME}}”全天候行政咨询 Agent。你的任务是快速且精确地解答学生关于会章、活动场地借用、储物柜申请及社团经费申领的疑问。
规范：
1. 仅能依据附加之法规手册与章程进行回复，绝不推测。
2. 保持热情、亲切且具同理心的同侪对话语气。
3. 针对每项流程提供步骤化清晰指引。
4. 若涉及学生重大权益纠纷、心理辅导或惩戒评议，请停止回答并引导其寄信至专责干事邮箱：{{OFFICER_EMAIL}}。`,
      proTip: "整合 Email Connector 具备关键字升级机制，当学生遭遇重大急难或特殊争议时，系统能即刻发送邮件通知真人干事介入辅导。"
    }
  },
  visual_campaign: {
    "en": {
      title: "Interactive Story Game & Visual Campaign",
      summary: "Create interactive visual storytelling campaigns, orientation games, and high-impact social media assets with AI media models.",
      steps: [
        "Draft the event narrative arc, key character personas, and campus orientation milestones.",
        "Generate high-resolution thematic illustrations with Image Generation and narrative clips with Video Generation.",
        "Curate campaign assets into digital social feeds and interactive onboarding screens for freshers."
      ],
      prompt: `You are a creative campaign director for {{INSTITUTION_NAME}}. Design an interactive campus storytelling campaign and multimedia visual plan for {{EVENT_NAME}} targeting {{TARGET_AUDIENCE}}.
Requirements:
1. **Interactive Storyline**: Outline a 4-chapter narrative mystery where freshers explore historical campus buildings, discover student traditions, and solve clues.
2. **Visual Generation Prompts**: Provide 3 rich, descriptive text-to-image prompts (specifying artistic lighting, vibrant student characters, and cinematic composition) suitable for Gemini Image Generation.
3. **Motion Scene Prompts**: Draft 2 prompt scripts suitable for Video Generation to create 5-second teaser animations for social media stories.`,
      proTip: "Use Image Generation to produce unified character key visual styles before prompting Video Generation to preserve aesthetic continuity across visual campaign channels."
    },
    "zh-TW": {
      title: "互動迎新故事冒險與多媒體視覺宣傳",
      summary: "運用生成式多模態模型，編排互動式校園探索解謎遊戲，並快速生成宣傳主視覺與短影音動畫。",
      steps: [
        "擬定迎新活動世界觀架構、核心導覽角色及校園探索關卡。",
        "透過 Image Generation 產出主視覺插畫，並使用 Video Generation 製作動態短片。",
        "將素材發布至社群平台限時動態與迎新互動網頁，引導新生參與。"
      ],
      prompt: `請扮演「{{INSTITUTION_NAME}}」的創意總監。為面向「{{TARGET_AUDIENCE}}」的「{{EVENT_NAME}}」規劃互動式校園探索故事遊戲與多媒體視覺設計。
企劃規範：
1. **互動敘事**：規劃 4 個章節的校園解謎歷程，引領新生在尋找線索中了解校園傳統與特色建築。
2. **生圖提示詞 (Image Generation)**：提供 3 組具體生動的提示詞（註明光影風格、當代大學生角色及高解析度比例），生成海報主視覺。
3. **動態場景提示詞 (Video Generation)**：設計 2 組 5 秒動態前導片腳本提示詞，供社群限時動態發布。`,
      proTip: "先利用 Image Generation 確定角色的色調與服裝風格，再以此為基準導入 Video Generation，能維繫跨社群平台宣傳風格的高度一致性。"
    },
    "zh-CN": {
      title: "互动迎新故事冒险与多媒体视觉宣传",
      summary: "运用生成式多模态模型，编排互动式校园探索解谜游戏，并快速生成宣传主视觉与短视频动画。",
      steps: [
        "拟定迎新活动世界观架构、核心导览角色及校园探索关卡。",
        "透过 Image Generation 产出主视觉插画，并使用 Video Generation 制作动态短片。",
        "将素材发布至社交平台限时动态与迎新互动网页，引导新生参与。"
      ],
      prompt: `请扮演“{{INSTITUTION_NAME}}”的创意总监。为面向“{{TARGET_AUDIENCE}}”的“{{EVENT_NAME}}”规划互动式校园探索故事游戏与多媒体视觉设计。
企划规范：
1. **互动叙事**：规划 4 个章节的校园解谜历程，引领新生在寻找线索中了解校园传统与特色建筑。
2. **生图提示词 (Image Generation)**：提供 3 组具体生动的提示词（注明光影风格、当代大学生角色及高分辨率比例），生成海报主视觉。
3. **动态场景提示词 (Video Generation)**：设计 2 组 5 秒动态前导片脚本提示词，供社交限时动态发布。`,
      proTip: "先利用 Image Generation 确定角色的色调与服装风格，再以此为基准导入 Video Generation，能维系跨社交平台宣传风格的高度一致性。"
    }
  },
  at_risk_cohort: {
    "en": {
      title: "At-Risk Student Early Warning System",
      summary: "Identify students experiencing academic difficulties across disparate LMS and SIS logs to enable proactive intervention.",
      steps: [
        "Connect LMS gradebook and SIS engagement logs to establish multi-variable risk thresholds.",
        "Run predictive engagement synthesis using Deep Research to identify students needing intervention.",
        "Review identified cohorts with academic advisors and dispatch personalized supportive outreach."
      ],
      prompt: `Analyze student learning analytics data for {{COHORT_SEMESTER}} in the {{DEPARTMENT_NAME}} department to identify learners at risk of falling behind.
Criteria to examine:
- LMS login inactivity exceeding 10 consecutive days.
- Missed or late formative assessment submissions (threshold: 2 or more).
- Midterm scores below 60%.
Output Requirements:
1. **At-Risk Cohort Segmentation**: Group students into High Risk, Moderate Risk, and Low Risk categories with evidence flags.
2. **Intervention Recommendations**: For each risk tier, suggest actionable pedagogical interventions (e.g., peer tutoring referral, advisor check-in, supplemental review modules).
3. **Draft Outreach Email**: Generate an empathetic, non-judgmental advisor check-in email encouraging the student to schedule office hours.`,
      proTip: "By leveraging multi-modal synthesis, Gemini combines attendance anomalies with assignment grades to catch students who appear present but are falling behind conceptually."
    },
    "zh-TW": {
      title: "學業預警與學習困難即時介入系統",
      summary: "整合教學平台 LMS 與學籍系統紀錄，早期識別潛在學習困難學生並提供個人化輔導策略。",
      steps: [
        "連線 LMS 成績冊與學生出席紀錄，建立跨維度的學習困難預警閥值。",
        "運用 Deep Research 進行學習歷程分析，篩選出亟需學術支援的學生名單。",
        "與學業導師共同覆核名單，發送具關懷性質的個別化輔導與諮詢邀請。"
      ],
      prompt: `請分析「{{DEPARTMENT_NAME}}」學系在「{{COHORT_SEMESTER}}」學期的學習分析數據，找出處於學業預警邊緣的學生族群。
審核指標：
- LMS 登入中斷超過 10 天以上。
- 形成性平時作業缺繳或遲交達 2 次以上。
- 期中考成績落後於 60% 以下。
輸出格式：
1. **預警分級分類**：將學生區分為高、中、低風險群組，並註記具體異常指標。
2. **輔導處方建議**：針對不同風險層級提供具體支持方案（如同儕課業輔導、導師面談、線上補救單元）。
3. **關懷信函草稿**：擬定一封具溫度、不具斥責意味的導師問候信，邀請學生前來諮詢。`,
      proTip: "藉由多模態分析能力，Gemini 能交叉比對出席率與作業邏輯完整度，提前發現看似準時出席但實質理解遇到瓶頸的學生。"
    },
    "zh-CN": {
      title: "学业预警与学习困难即时介入系统",
      summary: "整合教学平台 LMS 与学籍系统记录，早期识别潜在学习困难学生并提供个性化辅导策略。",
      steps: [
        "连线 LMS 成绩册与学生出席记录，建立跨维度的学习困难预警阈值。",
        "运用 Deep Research 进行学习历程分析，筛选出亟需学术支持的学生名单。",
        "与学业导师共同审核名单，发送具关怀性质的个性化辅导与咨询邀请。"
      ],
      prompt: `请分析“{{DEPARTMENT_NAME}}”学系在“{{COHORT_SEMESTER}}”学期的学习分析数据，找出处于学业预警边缘的学生族群。
审核指标：
- LMS 登录中断超过 10 天以上。
- 形成性平时作业缺交或迟交达 2 次以上。
- 期中考成绩落后于 60% 以下。
输出格式：
1. **预警分级分类**：将学生区分为高、中、低风险群组，并注记具体异常指标。
2. **辅导处方建议**：针对不同风险层级提供具体支持方案（如同侪课业辅导、导师面谈、线上补救单元）。
3. **关怀信函草稿**：拟定一封具温度、不具斥责意味的导师问候信，邀请学生前来咨询。`,
      proTip: "借由多模态分析能力，Gemini 能交叉比对出席率与作业逻辑完整度，提前发现看似准时出席但实质理解遇到瓶颈的学生。"
    }
  },
  accreditation_reports: {
    "en": {
      title: "Accreditation Self-Study Report Synthesizer",
      summary: "Map faculty syllabi, student outcomes, and institutional assessments against external accreditation criteria seamlessly.",
      steps: [
        "Aggregate departmental self-studies, syllabi, and outcome assessments into an institutional Drive hub.",
        "Run evidence cross-mapping across accreditation standards and criteria in NotebookLM.",
        "Review drafted narrative syntheses, verify institutional metrics, and export the official self-study report."
      ],
      prompt: `Act as a higher education quality assurance director. Synthesize institutional evidence for {{PROGRAM_NAME}} aligned with the accreditation standards of {{ACCREDITATION_BODY}}.
Tasks:
1. **Cross-Mapping**: Map provided course syllabi, student learning outcome evaluations, and faculty publication records against {{ACCREDITATION_BODY}} standards for Criterion 1 (Curriculum Rigor) and Criterion 2 (Faculty Qualifications).
2. **Gap Analysis**: Highlight any missing assessment data, outdated course references, or under-documented student learning evidence.
3. **Executive Synthesis**: Draft a 500-word formal narrative summarizing program continuous improvement initiatives and pedagogical innovations over the past review cycle.`,
      proTip: "NotebookLM's source citation capabilities are ideal for accreditation reviews, allowing evaluators to click any statement to inspect the original course syllabus or committee minutes."
    },
    "zh-TW": {
      title: "評鑑自我評量報告整合與佐證矩陣",
      summary: "將系所教學大綱、學生學習成效與院務會議紀錄對齊外部認證評鑑指標，一鍵完成自評報告編撰。",
      steps: [
        "將系所自評、歷年教學大綱及學習成效檔案集中於雲端硬碟 (Drive)。",
        "在 NotebookLM 中建立各門課程與評鑑規準的交叉對應與佐證追溯。",
        "審核自動生成的論述章節，核算指標達成率後匯出正式自評報告書。"
      ],
      prompt: `請扮演高等教育品質保證專案執行長。為「{{PROGRAM_NAME}}」彙整符合「{{ACCREDITATION_BODY}}」認證評鑑標準的自我評量報告佐證。
核心任務：
1. **標準交叉映射**：將系所課程大綱、學習成效評量結果及師資學術產出，對齊「指標一（課程嚴謹度）」與「指標二（師資結構）」。
2. **缺口分析**：明確標註尚未齊全的佐證檔案、過期文獻或缺少評鑑問卷回饋的課程。
3. **自評論述撰寫**：撰寫 500 字正式陳述，綜述系所在此評鑑週期中推動的持續品質改善機制 (Continuous Improvement)。`,
      proTip: "NotebookLM 的內文精確出處引用功能特別適合評鑑委員審查，點擊報告中任何數據即可溯源查看原始會議記錄或大綱文件。"
    },
    "zh-CN": {
      title: "评估自我评估报告整合与佐证矩阵",
      summary: "将系所教学大纲、学生学习成效与院务会议记录对齐外部认证评估指标，一键完成自评报告编撰。",
      steps: [
        "将系所自评、历年教学大纲及学习成效档案集中于云端硬盘 (Drive)。",
        "在 NotebookLM 中建立各门课程与评估规准的交叉对应与佐证追溯。",
        "审核自动生成的论述章节，核算指标达成率后导出正式自评报告书。"
      ],
      prompt: `请扮演高等教育质量保证项目执行长。为“{{PROGRAM_NAME}}”汇整符合“{{ACCREDITATION_BODY}}”认证评估标准的自我评估报告佐证。
核心任务：
1. **标准交叉映射**：将系所课程大纲、学习成效评估结果及师资学术产出，对齐“指标一（课程严谨度）”与“指标二（师资结构）”。
2. **缺口分析**：明确标注尚未齐全的佐证档案、过期文献或缺少评估问卷反馈的课程。
3. **自评论述撰写**：撰写 500 字正式陈述，综述系所在此评估周期中推动的持续质量改善机制 (Continuous Improvement)。`,
      proTip: "NotebookLM 的内文精确出处引用功能特别适合评估委员审查，点击报告中任何数据即可溯源查看原始会议记录或大纲文件。"
    }
  },
  workforce_federation: {
    "en": {
      title: "Workforce Identity Federation Setup Guide",
      summary: "Deploy secure SAML 2.0 / OIDC identity federation linking your campus IdP to Gemini Enterprise without duplicating directories.",
      steps: [
        "Audit campus identity provider (IdP) metadata, SAML 2.0 / OIDC claims, and user directory attributes.",
        "Generate workforce federation architecture guides and role-mapping templates using Deep Research.",
        "Conduct end-to-end SSO handshakes with IT security and rollout federated access to campus units."
      ],
      prompt: `You are an enterprise identity architect for {{INSTITUTION_DOMAIN}}. Generate a step-by-step Workforce Identity Federation deployment blueprint integrating our campus Identity Provider ({{IDP_PROVIDER}}) with Google Cloud and Gemini Enterprise.
Deliverables:
1. **SAML 2.0 / OIDC Configuration Spec**: Exact claim mapping rules for NameID, primary email, role attributes (faculty, staff, student), and department codes.
2. **Conditional Access & Session Policies**: Recommended session timeout rules, multi-factor authentication (MFA) enforcement policies, and device compliance checks.
3. **Troubleshooting Checklist**: Step-by-step diagnosis procedure for common handshake errors (e.g. SAML response clock skew, missing claims, attribute mismatch).`,
      proTip: "Federated workforce identity ensures immediate automated offboarding—when a student graduates or staff member resigns, their Gemini Enterprise access terminates instantly at the IdP boundary."
    },
    "zh-TW": {
      title: "校園單一登入與身分聯合 (SSO) 架構指引",
      summary: "安全整合現有校園 IdP (SAML 2.0 / OIDC) 至 Gemini Enterprise，不需重複同步帳號密碼。",
      steps: [
        "審核學校身分識別提供者 (IdP) 憑證中繼資料、SAML 屬性與使用者目錄結構。",
        "藉由 Deep Research 產出符合資安規範的聯邦身分架構圖與角色映射範本。",
        "完成校內 IT 端到端 SSO 驗證演練，正式對全體教職員工及學生啟用授權。"
      ],
      prompt: `你是「{{INSTITUTION_DOMAIN}}」的企業身分架構工程師。請為整合本校現有身分提供者 ({{IDP_PROVIDER}}) 至 Google Cloud Workforce Identity 與 Gemini Enterprise 制定逐步實施藍圖。
輸出需求：
1. **SAML 2.0 / OIDC 設定規格**：明確條列 NameID、主要 Email、身分別（教師、職員、學生）及系所代碼映射規則。
2. **條件式存取與工作階段策略**：建議連線逾時機制、多因素驗證 (MFA) 強制策略及受控裝置合規性檢驗。
3. **常見故障排除檢核表**：整理 SSO 整合常見錯誤（如時鐘偏差 Clock Skew、屬性聲明缺失、憑證過期）之排查步驟。`,
      proTip: "使用 Workforce 聯合身分能落實離校即時撤權——學生畢業或職員離職時，其 Gemini Enterprise 使用權限隨校內 IdP 即刻註銷，零資安死角。"
    },
    "zh-CN": {
      title: "校园单点登录与身份联合 (SSO) 架构指引",
      summary: "安全整合现有校园 IdP (SAML 2.0 / OIDC) 至 Gemini Enterprise，无需重复同步账号密码。",
      steps: [
        "审核学校身份识别提供者 (IdP) 凭据元数据、SAML 属性与用户目录结构。",
        "借由 Deep Research 产出符合资安规范的联邦身份架构图与角色映射范本。",
        "完成校内 IT 端到端 SSO 验证演练，正式对全体教职员工及学生启用授权。",
      ],
      prompt: `你是“{{INSTITUTION_DOMAIN}}”的企业身份架构工程师。请为整合本校现有身份提供者 ({{IDP_PROVIDER}}) 至 Google Cloud Workforce Identity 与 Gemini Enterprise 制定逐步实施蓝图。
输出需求：
1. **SAML 2.0 / OIDC 设置规格**：明确条列 NameID、主要 Email、身份别（教师、职员、学生）及系所代码映射规则。
2. **条件式访问与会话策略**：建议连线超时机制、多因素验证 (MFA) 强制策略及受控设备合规性检验。
3. **常见故障排除检核表**：整理 SSO 整合常见错误（如时钟偏差 Clock Skew、属性声明缺失、凭证过期）之排查步骤。`,
      proTip: "使用 Workforce 联合身份能落实离校即时撤权——学生毕业或职员离职时，其 Gemini Enterprise 使用权限随校内 IdP 即刻注销，零资安死角。"
    }
  },
  sao_scavenger_hunt: {
    "en": {
      title: "Digital Cultural Fair Red Packet Game",
      summary: "Build an interactive campus cultural scavenger hunt with AI-generated trivia, QR clues, and digital red packet rewards.",
      steps: [
        "Plan interactive campus discovery checkpoints, cultural trivia themes, and physical QR stations.",
        "Generate bilingual riddle clues and digital red packet artwork via Agent Designer and Image Generation.",
        "Pilot test the hunt route for student safety and launch the live interactive orientation activity."
      ],
      prompt: `You are the Student Affairs Orientation Director for {{CAMPUS_NAME}}. Design an engaging, digital-physical Cultural Fair Scavenger Hunt celebrating {{FESTIVAL_NAME}}.
Include:
1. **Station Clues**: 5 clever rhyming clues that lead students to iconic campus landmarks (library, student center, amphitheater, botanical garden, sports complex).
2. **Interactive Red Packet QR Challenges**: For each station, design a quick 2-question cultural trivia mini-quiz that unlocks a digital red packet stamp.
3. **Reward Tier Structure**: Outline completion badge rewards and clear redemption instructions to manage crowd flow safely.`,
      proTip: "Use Image Generation to design digital commemorative red packet graphics and badges that students can collect in their digital portfolios upon station check-in."
    },
    "zh-TW": {
      title: "校園文化祭互動尋寶與數位紅包解謎",
      summary: "結合在地文化節慶，設計融合校園歷史地標的互動式實體與線上打卡闖關解謎遊戲。",
      steps: [
        "規劃校園文化地標打卡動線、節慶文化典故及實體 QR 關卡佈設。",
        "運用 Agent Designer 與 Image Generation 產出尋寶謎語與紀念數位紅包圖樣。",
        "進行實地動線安全測試後，正式上線迎新文化週互動闖關活動。"
      ],
      prompt: `請扮演「{{CAMPUS_NAME}}」學務處迎新活動組長。為慶祝「{{FESTIVAL_NAME}}」策劃一場兼具文化底蘊與校園探索趣味的實體與數位互動尋寶遊戲。
企劃內容：
1. **關卡謎題**：設計 5 則具巧思的押韻線索，引導學生依序探索圖書館、學生活動中心、戶外劇場、生態花園及體育館。
2. **QR 數位紅包挑戰**：每個關卡搭配 2 題節慶文化趣味快問快答，通關即可獲取數位紅包圖章。
3. **獎勵級距與動線規劃**：制定集點兌獎規則及排隊分流安全機制。`,
      proTip: "運用 Image Generation 繪製具校園特色的數位紅包圖騰與紀念徽章，可供學生通關後下載典藏於個人學習歷程中。"
    },
    "zh-CN": {
      title: "校园文化祭互动寻宝与数字红包解谜",
      summary: "结合在地文化节庆，设计融合校园历史地标的互动式实体与线上打卡闯关解谜游戏。",
      steps: [
        "规划校园文化地标打卡动线、节庆文化典故及实体 QR 关卡布设。",
        "运用 Agent Designer 与 Image Generation 产出寻宝谜语与纪念数字红包图样。",
        "进行实地动线安全测试后，正式上线迎新文化周互动闯关活动。"
      ],
      prompt: `请扮演“{{CAMPUS_NAME}}”学务处迎新活动组长。为庆祝“{{FESTIVAL_NAME}}”策划一场兼具文化底蕴与校园探索趣味的实体与数字互动寻宝游戏。
企划内容：
1. **关卡谜题**：设计 5 则具巧思的押韵线索，引导学生依序探索图书馆、学生活动中心、户外剧场、生态花园及体育馆。
2. **QR 数字红包挑战**：每个关卡搭配 2 题节庆文化趣味快问快答，通关即可获取数字红包图章。
3. **奖励级距与动线规划**：制定集点兑奖规则及排队分流安全机制。`,
      proTip: "运用 Image Generation 绘制具校园特色的数字红包图腾与纪念徽章，可供学生通关后下载典藏于个人学习历程中。"
    }
  },
  finance_compliance: {
    "en": {
      title: "Student Expense Compliance Auditor",
      summary: "Audit student club reimbursement receipts, invoices, and subsidy claims automatically against university financial regulations.",
      steps: [
        "Upload student society expense receipts, invoices, and bank statements to a dedicated Drive directory.",
        "Execute automated policy compliance auditing to flag missing documentation or spending limit violations.",
        "Review flagged discrepancies with student leaders and generate approved reimbursement vouchers."
      ],
      prompt: `You are the Student Affairs Finance Auditor. Audit the reimbursement claim submitted by {{SOCIETY_NAME}} for the event "{{EVENT_NAME}}" totaling {{CLAIM_AMOUNT}}.
Audit Requirements:
1. **Line-Item Verification**: Cross-reference each receipt item against university student organization financial regulations.
2. **Policy Compliance Check**: Flag any alcohol purchases, unitemized credit card slips, tips exceeding 15%, or missing third-party quotations for items over $300.
3. **Audit Summary**: Produce an itemized audit ledger showing Allowed Amount, Disallowed Amount, and a courteous explanation of any deductions with instructions for appeal.`,
      proTip: "Grounding NotebookLM in official institutional procurement rules ensures high-precision compliance detection without manual auditing fatigue."
    },
    "zh-TW": {
      title: "社團活動經費報銷合規審核助理",
      summary: "依據校內主計與社團經費管理辦法，自動比對發票單據、明細清單與預算核准額度。",
      steps: [
        "將社團活動之發票掃描檔、收據清冊及預算核准表匯入至專屬 Drive 目錄。",
        "執行合規審計提示詞，自動揪出單據不齊、品名模糊或超額報銷項目。",
        "與社團幹部核對異常項目並產出合格報銷核定單，加速撥款作業。"
      ],
      prompt: `請扮演學務處財務審核專員。審查社團「{{SOCIETY_NAME}}」於活動「{{EVENT_NAME}}」提出之經費補助申請（申報總額：{{CLAIM_AMOUNT}}）。
審核要求：
1. **單據核對**：逐筆比對收據憑證是否符合校內學生團體經費請領規範。
2. **合規性篩檢**：明確標註含有含酒精飲料、未附品名明細之簽單、小費超過 15% 或逾 $300 缺乏比價單之違規項目。
3. **審核結果彙整**：編列核准金額、核減金額及委婉且條理分明的扣除理由與申復指引。`,
      proTip: "將學校最新主計法規作為 NotebookLM 的底層知識，能以極高精準度過濾違規憑證，免去人工逐張查驗的疲勞與疏漏。"
    },
    "zh-CN": {
      title: "社团活动经费报销合规审核助理",
      summary: "依据校内主计与社团经费管理办法，自动比对发票单据、明细清单与预算核准额度。",
      steps: [
        "将社团活动之发票扫描件、收据清册及预算核准表导入至专属 Drive 目录。",
        "执行合规审计提示词，自动揪出单据不齐、品名模糊或超额报销项目。",
        "与社团干部核对异常项目并产出合格报销核定单，加速拨款作业。"
      ],
      prompt: `请扮演学务处财务审核专员。审查社团“{{SOCIETY_NAME}}”于活动“{{EVENT_NAME}}”提出之经费补助申请（申报总额：{{CLAIM_AMOUNT}}）。
审核要求：
1. **单据核对**：逐笔比对收据凭证是否符合校内学生团体经费申领规范。
2. **合规性筛检**：明确标注含有含酒精饮料、未附品名明细之签单、小费超过 15% 或逾 $300 缺乏比价单之违规项目。
3. **审核结果汇总**：编列核准金额、核减金额及委婉且条理分明的扣除理由与申复指引。`,
      proTip: "将学校最新主计法规作为 NotebookLM 的底层知识，能以极高精准度过滤违规凭证，免去人工逐张查验的疲劳与疏漏。"
    }
  },
  security_simulator: {
    "en": {
      title: "Campus Safety Drill Simulator",
      summary: "Simulate emergency response scenarios and evaluate campus security decision trees during emergency drill operations.",
      steps: [
        "Establish emergency protocol handbooks, campus floor plans, and evacuation routes.",
        "Build multi-branch crisis drill scenarios and tactical decision trees using Agent Designer.",
        "Facilitate simulated emergency exercises for campus security personnel and evaluate response timelines."
      ],
      prompt: `You are the Director of Campus Safety. Build a dynamic, interactive emergency drill simulation scenario for {{EMERGENCY_SCENARIO}} occurring at {{FACILITY_LOCATION}}.
Simulation Structure:
1. **Incident Genesis (Minute 0)**: Initial emergency call received. Present 3 critical first-response decisions to the safety team.
2. **Escalation Phase (Minute 15)**: Condition evolves (e.g., secondary obstacle, route blockage, crowd panic). Present tactical options with consequences.
3. **Containment & Evacuation (Minute 30)**: First responder coordination, safe perimeter establishment, and parent/press communication dispatch.
4. **Debrief Rubric**: 4-part evaluation rubric grading decision speed, communication clarity, protocol adherence, and victim care prioritization.`,
      proTip: "Use Video Generation to produce realistic tactical scenario prompts illustrating evacuation bottlenecks or weather events to evaluate team decision-making under stress."
    },
    "zh-TW": {
      title: "校園防救災與重大危安演練模擬",
      summary: "透過動態危機決策樹模擬突發狀況，提升校園安保團隊在各類演練中的即時指揮處置效能。",
      steps: [
        "建置緊急應變手冊、校園平面圖及疏散避難動線資料庫。",
        "利用 Agent Designer 構建多分支危機情境演習腳本與即時處置決策樹。",
        "開展校安與駐衛保全無預警模擬操演，檢討處置反應時效並優化流程。"
      ],
      prompt: `你是校園安全防護中心總指揮官。請為發生於「{{FACILITY_LOCATION}}」的「{{EMERGENCY_SCENARIO}}」建立動態緊急應變模擬演練腳本。
演練結構：
1. **初始通報 (0 分鐘)**：接獲首通通報。向應變小組提供 3 項第一時間處置決策選擇。
2. **災情升級 (15 分鐘)**：情勢惡化（如周邊要道阻塞、群眾恐慌或次生災害）。提出各應對戰術及其衍生後果。
3. **封鎖與撤離 (30 分鐘)**：消防警消協調、警戒線擴大劃設及校級對外公關新聞通報。
4. **覆盤評分表**：制定 4 項指標之演練評核表（決策速度、通訊精確度、SOP 落實度與傷者救護優先級）。`,
      proTip: "可利用 Video Generation 產出逼真的事故模擬短片，在演習期間作為突發情境插入題，考驗團隊在高度壓力下的應變能力。"
    },
    "zh-CN": {
      title: "校园防救灾与重大危安演练模拟",
      summary: "透过动态危机决策树模拟突发状况，提升校园安保团队在各类演练中的即时指挥处置效能。",
      steps: [
        "建置紧急应变手册、校园平面图及疏散避难动线数据库。",
        "利用 Agent Designer 构建多分支危机情境演习脚本与即时处置决策树。",
        "开展校安与驻卫保全无预警模拟操演，检讨处置反应时效并优化流程。"
      ],
      prompt: `你是校园安全防护中心总指挥官。请为发生于“{{FACILITY_LOCATION}}”的“{{EMERGENCY_SCENARIO}}”建立动态紧急应变模拟演练脚本。
演练结构：
1. **初始通报 (0 分钟)**：接获首通通报。向应变小组提供 3 项第一时间处置决策选择。
2. **灾情升级 (15 分钟)**：情势恶化（如周边要道阻塞、群众恐慌或次生灾害）。提出各应对战术及其衍生后果。
3. **封锁与撤离 (30 分钟)**：消防警消协调、警戒线扩大划设及校级对外公关新闻通报。
4. **复盘评分表**：制定 4 项指标之演练评估表（决策速度、通讯精确度、SOP 落实度与伤者救护优先级）。`,
      proTip: "可利用 Video Generation 产出逼真的事故模拟短片，在演习期间作为突发情境插入题，考验团队在高度压力下的应变能力。"
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
  // typeof guard: server.js evaluates this file in a vm sandbox that has no sessionStorage
  sortBy: (typeof sessionStorage !== "undefined" && sessionStorage.getItem("ge_sort_by")) || "popular", // popular | newest | az
  geAppLink: null, // per-user Gemini Enterprise app URL (null for admins / unset)
  isSuper: false, // true only for the super admin account
  activeLanguage: "en" // default language
};

// UI Initialization and Render Functions
// Obsolete local-only initApp placeholder removed. Unified initialization is handled in the master initApp lifecycle controller below.

// Theme Initialization & Handling
function initTheme() {
  const cachedTheme = localStorage.getItem("ge_theme") || "dark";
  applyTheme(cachedTheme);

  const toggleBtn = document.getElementById("btnThemeToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(newTheme);
    });
  }

  const adminToggleBtn = document.getElementById("btnAdminThemeToggle");
  if (adminToggleBtn) {
    adminToggleBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(newTheme);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("ge_theme", theme);

  const themeIcon = document.getElementById("themeIcon");
  if (themeIcon) {
    themeIcon.textContent = theme === "dark" ? "dark_mode" : "light_mode";
  }

  const adminThemeIcon = document.getElementById("adminThemeIcon");
  if (adminThemeIcon) {
    adminThemeIcon.textContent = theme === "dark" ? "dark_mode" : "light_mode";
  }

  // Quest Run fallback layers and timeline colours follow the theme
  if (typeof questOnThemeChange === "function") questOnThemeChange();
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

  const safeSetText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  const safeSetHTML = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };

  // Static strings
  safeSetText("wizardTitle", t.wizardTitle);
  safeSetText("wizardSubtitle", t.wizardSubtitle);
  safeSetText("wizardDesc", t.wizardDesc);
  safeSetText("labelRole", t.labelRole);
  safeSetText("labelLevel", t.labelLevel);
  safeSetText("labelLang", t.labelLang);
  safeSetHTML("btnStart", `<span class="material-symbols-outlined">rocket_launch</span> ${t.btnStart}`);
  
  safeSetText("btnChangeContextText", t.btnChangeContextText);

  // Onboarding Dropdown roles
  const roleSelect = document.getElementById("wizardRole");
  if (roleSelect) {
    Array.from(roleSelect.options).forEach(opt => {
      if (t.roles[opt.value]) {
        opt.textContent = t.roles[opt.value];
      }
    });
  }

  // Admin Form Role Dropdown
  const adminRoleSelect = document.getElementById("formCaseRole");
  if (adminRoleSelect) {
    Array.from(adminRoleSelect.options).forEach(opt => {
      if (t.roles[opt.value]) {
        opt.textContent = t.roles[opt.value];
      }
    });
  }

  // Onboarding Dropdown levels
  const levelSelect = document.getElementById("wizardLevel");
  if (levelSelect) {
    Array.from(levelSelect.options).forEach(opt => {
      if (t.levels[opt.value]) {
        opt.textContent = t.levels[opt.value];
      }
    });
  }

  // Results headline ("{n} playbooks for {role}") is computed in renderUseCases()

  // Help support roles explanation in wizard
  handleWizardRoleChange();

  // Update sidebar profile card and navbar welcome text immediately
  updateSidebarContextUI();

  // Translate Admin Portal elements if they exist
  const adminBrand = document.getElementById("adminBrandText");
  if (adminBrand) {
    adminBrand.textContent = t.adminBrandText || "Admin Control";
    safeSetText("adminMenuNavigationTitle", t.adminMenuNavigationTitle || "Menu Navigation");
    safeSetText("adminPortalTitle", t.adminPortalTitle || "GEMINI EDUCATION MANAGEMENT");
    safeSetText("adminPortalSubtitle", t.adminPortalSubtitle || "Configure users, update learning playbooks, and analyze the last 6 months of usage metrics.");
    safeSetText("adminTabUsersText", t.adminTabUsersText || "Users Provisioning");
    safeSetText("adminTabAnalyticsText", t.adminTabAnalyticsText || "System Analytics");
    safeSetText("adminTabCasesText", t.adminTabCasesText || "Use Cases CRUD");
    safeSetText("btnAdminBackToPortalText", t.btnAdminBackToPortalText || "Learning Portal");
    safeSetText("btnAdminLogoutText", t.btnAdminLogoutText || "Log Out");

    // Dynamic Admin Sub-labels and inputs
    safeSetText("adminProvisionTitle", t.adminProvisionTitle);
    safeSetHTML("adminProvisionDesc", t.adminProvisionDesc);
    safeSetText("adminProvisionLabelEmail", t.adminProvisionLabelEmail);
    const btnProvision = document.getElementById("adminBtnProvision");
    if (btnProvision) {
      btnProvision.innerHTML = `${t.adminBtnProvision || "Provision"} <span class="material-symbols-outlined">person_add</span>`;
    }
    safeSetText("adminRegisteredUsersTitle", t.adminRegisteredUsersTitle);
    safeSetText("adminThUserEmail", t.adminThUserEmail);
    safeSetText("adminThPasswordStatus", t.adminThPasswordStatus);
    safeSetText("adminThCreatedDate", t.adminThCreatedDate);
    safeSetText("adminThAdminActions", t.adminThAdminActions);

    safeSetText("adminLabelTotalUsers", t.adminLabelTotalUsers);
    safeSetText("adminLabelTotalUseCases", t.adminLabelTotalUseCases);
    safeSetText("adminLabelTotalLikes", t.adminLabelTotalLikes);
    safeSetText("adminLabelTotalViews", t.adminLabelTotalViews);

    safeSetText("adminChartTitle", t.adminChartTitle);
    safeSetText("adminChartDesc", t.adminChartDesc);
    const legendViews = document.getElementById("adminLabelViewsLegend");
    if (legendViews) {
      legendViews.innerHTML = `<span style="display: inline-block; width: 12px; height: 3px; background: var(--color-secondary);"></span> ${t.adminLabelViewsLegend || "PAGE VIEWS"}`;
    }
    const legendLikes = document.getElementById("adminLabelLikesLegend");
    if (legendLikes) {
      legendLikes.innerHTML = `<span style="display: inline-block; width: 12px; height: 3px; background: var(--color-danger);"></span> ${t.adminLabelLikesLegend || "USER LIKES"}`;
    }
    const legendTries = document.getElementById("adminLabelTriesLegend");
    if (legendTries) {
      legendTries.innerHTML = `<span style="display: inline-block; width: 12px; height: 3px; background: var(--color-success);"></span> ${escapeHtml(t.adminLabelTriesLegend || "Try it")}`;
    }

    safeSetText("adminCrudTitle", t.adminCrudTitle);
    safeSetText("adminBtnExportText", t.adminBtnExportText || "Export JSON");
    safeSetText("adminBtnCreateCaseText", t.adminBtnCreateCaseText || "Add use case");

    safeSetText("adminCrudThId", t.adminCrudThId);
    safeSetText("adminCrudThTitle", t.adminCrudThTitle);
    safeSetText("adminCrudThCategory", t.adminCrudThCategory);
    safeSetText("adminCrudThRole", t.adminCrudThRole);
    safeSetText("adminCrudThActions", t.adminCrudThActions);

    // Form labels inside modal
    safeSetText("adminFormLabelId", t.adminFormLabelId);
    safeSetText("adminFormLabelCategory", t.adminFormLabelCategory);
    safeSetText("adminFormLabelTitle", t.adminFormLabelTitle);
    safeSetText("adminFormLabelRole", t.adminFormLabelRole);
    safeSetText("adminFormLabelSummary", t.adminFormLabelSummary);
    safeSetText("adminFormLabelDualModeCheckbox", t.adminFormLabelDualModeCheckbox);
    safeSetText("adminFormDescDualModeCheckbox", t.adminFormDescDualModeCheckbox);
    safeSetText("adminFormLabelFeatures", t.adminFormLabelFeatures);
    safeSetText("adminFormLabelConnectors", t.adminFormLabelConnectors);
    safeSetText("adminFormLabelLevel", t.adminFormLabelLevel);
    safeSetText("adminFormLabelSteps", t.adminFormLabelSteps);
    safeSetText("adminFormLabelPrompt", t.adminFormLabelPrompt);
    safeSetText("adminFormLabelProTip", t.adminFormLabelProTip);
    safeSetText("adminFormLabelAdvancedSteps", t.adminFormLabelAdvancedSteps);
    safeSetText("adminFormLabelAdvancedPrompt", t.adminFormLabelAdvancedPrompt);
    safeSetText("adminFormLabelAdvancedProTip", t.adminFormLabelAdvancedProTip);

    safeSetText("adminFormLabelZhtwHeader", t.adminFormLabelZhtwHeader);
    safeSetText("adminFormLabelZhtwTitle", t.adminFormLabelZhtwTitle);
    safeSetText("adminFormLabelZhtwSummary", t.adminFormLabelZhtwSummary);
    safeSetText("adminFormLabelZhtwSteps", t.adminFormLabelZhtwSteps);
    safeSetText("adminFormLabelZhtwPrompt", t.adminFormLabelZhtwPrompt);
    safeSetText("adminFormLabelZhtwProTip", t.adminFormLabelZhtwProTip);
    safeSetText("adminFormLabelZhtwAdvancedSteps", t.adminFormLabelZhtwAdvancedSteps);
    safeSetText("adminFormLabelZhtwAdvancedPrompt", t.adminFormLabelZhtwAdvancedPrompt);
    safeSetText("adminFormLabelZhtwAdvancedProTip", t.adminFormLabelZhtwAdvancedProTip);

    safeSetText("adminFormLabelZhcnHeader", t.adminFormLabelZhcnHeader);
    safeSetText("adminFormLabelZhcnTitle", t.adminFormLabelZhcnTitle);
    safeSetText("adminFormLabelZhcnSummary", t.adminFormLabelZhcnSummary);
    safeSetText("adminFormLabelZhcnSteps", t.adminFormLabelZhcnSteps);
    safeSetText("adminFormLabelZhcnPrompt", t.adminFormLabelZhcnPrompt);
    safeSetText("adminFormLabelZhcnProTip", t.adminFormLabelZhcnProTip);
    safeSetText("adminFormLabelZhcnAdvancedSteps", t.adminFormLabelZhcnAdvancedSteps);
    safeSetText("adminFormLabelZhcnAdvancedPrompt", t.adminFormLabelZhcnAdvancedPrompt);
    safeSetText("adminFormLabelZhcnAdvancedProTip", t.adminFormLabelZhcnAdvancedProTip);

    // Localize the AI Drafting instructions block
    safeSetText("adminFormLabelGeminiPromptTitle", t.adminFormLabelGeminiPromptTitle);
    safeSetText("adminFormLabelGeminiPromptDesc", t.adminFormLabelGeminiPromptDesc);
    const instructionInput = document.getElementById("formCaseGeminiInstruction");
    if (instructionInput) instructionInput.placeholder = t.caseFormDraftPlaceholder;

    safeSetText("btnAdminFormCancel", t.btnAdminFormCancel);
    safeSetText("btnAdminFormSave", t.btnAdminFormSave);
  }

  // V2: translate every [data-i18n] node and refresh the account menus
  applyI18nAttributes();
  updateAccountMenus();

  // Quest Run strip + admin quest widgets re-render their dynamic text
  if (typeof questOnLanguageChange === "function") questOnLanguageChange();
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

// Update the profile line inside the avatar menu (role · level)
function updateSidebarContextUI() {
  const lang = appState.activeLanguage || "en";
  const t = uiTranslations[lang];
  const roleEl = document.getElementById("profileRoleName");
  const levelEl = document.getElementById("profileInstitutionName");

  if (appState.isAdmin === true) {
    document.title = "Admin View";
    if (roleEl) roleEl.textContent = t.adminPreviewContext;
    if (levelEl) levelEl.textContent = t.allRoles;
    return;
  }

  document.title = "Gemini Enterprise - Edu Portal";
  if (roleEl) roleEl.textContent = t.roles[appState.userRole] || appState.userRole || "";

  const isSupportRole = ["Security", "Finance", "IT Admin", "SAO"].includes(appState.userRole);
  if (levelEl) {
    levelEl.textContent = isSupportRole
      ? (lang === "en" ? "All levels" : (lang === "zh-TW" ? "所有級別" : "所有级别"))
      : (t.levels[appState.institutionLevel] || appState.institutionLevel || "");
  }
}

// Search input handling
function handleSearchInput(e) {
  appState.searchQuery = e.target.value.toLowerCase();
  renderUseCases();
}

// Helper to get Material Symbol icon for feature tags and institution levels
function getTagIcon(type, name) {
  const n = (name || "").toLowerCase().trim();
  if (type === "feature") {
    if (n.includes("agent")) return "smart_toy";
    if (n.includes("notebook")) return "menu_book";
    if (n.includes("research")) return "travel_explore";
    if (n.includes("canvas")) return "draw";
    if (n.includes("image")) return "palette";
    if (n.includes("video")) return "videocam";
    if (n.includes("code")) return "terminal";
    return "extension";
  }
  if (type === "level") {
    if (n.includes("university") || n.includes("college")) return "account_balance";
    if (n.includes("high school")) return "school";
    if (n.includes("primary")) return "child_care";
    if (n.includes("generic")) return "public";
    if (n.includes("kindergarten")) return "toys";
    return "domain";
  }
  return "label";
}

/**
 * Colour family for a GE feature or prompt type (v6 colourful tags):
 *   research → NotebookLM, Deep Research (green)
 *   create   → Canvas Mode, Image / Video Generation (blue)
 *   agent    → Agent Designer (yellow)
 *   connector→ any "... Connector" (red, matches .tag-connector)
 * Returns null for neutral items (e.g. the 'general' prompt type).
 */
function featureTone(name) {
  const n = String(name || "").toLowerCase().replace(/_/g, " ");
  if (!n || n === "general") return null;
  if (n.includes("connector")) return "connector";
  if (n.includes("notebook") || n.includes("research")) return "research";
  if (n.includes("canvas") || n.includes("image") || n.includes("video")) return "create";
  if (n.includes("agent")) return "agent";
  return null;
}
const toneClass = (name) => {
  const tone = featureTone(name);
  return tone ? ` tone-${tone}` : "";
};

// Helper to extract bracketed prompt variables for dynamic 'Fill in the variables' panel
// Utility to escape HTML text for raw display
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper to extract bracketed and brace prompt variables (e.g. {{COURSE_CODE}} or [COURSE_CODE])
function extractPromptVariables(promptText) {
  if (!promptText) return [];
  const regex = /(?:\{\{([A-Za-z0-9\s/_\-']{1,50})\}\}|\[([A-Za-z0-9\s/_\-']{1,50})\](?!\())/g;
  const vars = [];
  const seen = new Set();
  let match;
  while ((match = regex.exec(promptText)) !== null) {
    const raw = (match[1] || match[2]).trim();
    if (!seen.has(raw)) {
      seen.add(raw);
      vars.push({
        token: match[0],
        key: raw,
        label: raw
      });
    }
  }
  return vars;
}

// Helper to get stylized connector metadata, icons, and localized labels
function getConnectorMeta(connectorName, lang = "en") {
  const c = (connectorName || "").toLowerCase();
  if (c.includes("drive")) {
    return {
      class: "tag-connector",
      icon: "folder_shared",
      label: lang === "en" ? "Drive Connector" : (lang === "zh-TW" ? "Drive 連接器" : "Drive 连接器")
    };
  }
  if (c.includes("email") || c.includes("outlook") || c.includes("mail")) {
    return {
      class: "tag-connector",
      icon: "mail",
      label: lang === "en" ? "Email Connector" : (lang === "zh-TW" ? "Email 連接器" : "Email 连接器")
    };
  }
  if (c.includes("lms") || c.includes("canvas") || c.includes("moodle")) {
    return {
      class: "tag-connector",
      icon: "school",
      label: lang === "en" ? "LMS Connector" : (lang === "zh-TW" ? "LMS 連接器" : "LMS 连接器")
    };
  }
  if (c.includes("calendar") || c.includes("google")) {
    return {
      class: "tag-connector",
      icon: "calendar_month",
      label: lang === "en" ? "Calendar Connector" : (lang === "zh-TW" ? "Calendar 連接器" : "Calendar 连接器")
    };
  }
  return {
    class: "tag-connector",
    icon: "api",
    label: connectorName
  };
}

// Helper to render New and Updated badges for Use Cases created/updated within 5 days
function getUsecaseBadgeHtml(uc, lang) {
  if (!uc.createdAt) return "";
  const now = new Date();
  const createdDate = new Date(uc.createdAt);
  const diffTimeCreated = Math.abs(now - createdDate);
  const diffDaysCreated = Math.ceil(diffTimeCreated / (1000 * 60 * 60 * 24));
  let isNew = diffDaysCreated <= 5;
  let isUpdated = false;
  if (!isNew && uc.updatedAt) {
    const updatedDate = new Date(uc.updatedAt);
    const diffTimeUpdated = Math.abs(now - updatedDate);
    const diffDaysUpdated = Math.ceil(diffTimeUpdated / (1000 * 60 * 60 * 24));
    isUpdated = diffDaysUpdated <= 5;
  }
  const tt = uiTranslations[lang] || uiTranslations.en;
  if (isNew) {
    return `<span class="tag tag-new tag-icon-only" title="${escapeHtml(tt.newLabel || "New")}"><span class="material-symbols-outlined">auto_awesome</span></span>`;
  }
  if (isUpdated) {
    return `<span class="tag tag-updated tag-icon-only" title="${escapeHtml(tt.updatedLabel || "Updated")}"><span class="material-symbols-outlined">update</span></span>`;
  }
  return "";
}

// Render the flat playbook grid: filter → sort → headline → cards (or empty state)
function renderUseCases() {
  const container = document.getElementById("useCasesContainer");
  if (!container) return;
  bindCardGrid(container);
  const lang = appState.activeLanguage || "en";
  const t = uiTranslations[lang];
  const list = sortUseCases(filterUseCases(useCasesDb, appState, lang), appState.sortBy, lang);

  const headline = document.getElementById("welcomeMsg");
  if (headline) headline.textContent = formatResultsHeadline(t, list.length, appState);

  container.innerHTML = list.length
    ? list.map(uc => cardHtml(uc, lang, t)).join("")
    : `<div class="empty-state">
         <span class="material-symbols-outlined" aria-hidden="true">search_off</span>
         <h3>${escapeHtml(t.noUseCasesTitle)}</h3>
         <p>${escapeHtml(t.noUseCasesDesc)}</p>
         <button type="button" class="nav-button" id="btnResetFilters">${escapeHtml(t.btnResetFilters)}</button>
       </div>`;
}

// Close Detail Modal
function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.classList.remove("active");
  document.body.classList.remove("modal-open");
}

// Toast notifications: 'success' (default) or 'warning'. Long messages stay up longer.
let toastTimer = null;
function showToast(message, type = "success") {
  const toast = document.getElementById("toastNotification");
  const toastMsg = document.getElementById("toastMsg");
  const toastIcon = document.getElementById("toastIcon");
  if (!toast || !toastMsg) return;

  const isWarning = type === "warning" || type === "error";
  toastMsg.textContent = message;
  if (toastIcon) toastIcon.textContent = isWarning ? "warning" : "check_circle";
  toast.classList.toggle("is-warning", isWarning);
  toast.style.background = "";

  // ~3.5s baseline, +1s per 40 characters beyond 60, capped at 9s
  const duration = Math.min(9000, 3500 + Math.max(0, String(message).length - 60) * 25);
  toast.classList.add("active");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("active"), duration);
}

// Enhance the useCases database with non-essential connector fallbacks and translations
function enhanceUseCasesDatabase() {
  // Use cases database initialized cleanly with 3 conceptual steps and {{VARIABLE}} syntax.
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

/**
 * Persist a like to the DB.
 * Resolves to { ok, status, data } so callers can distinguish an expired
 * session (401), an admin preview (403) and other failures, rather than
 * failing silently (the original cause of "likes don't stick").
 */
async function syncUserPreference(useCaseId, value) {
  try {
    const res = await fetch('/api/use-cases/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ useCaseId, isLiked: value })
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.success === true, status: res.status, data };
  } catch (error) {
    console.error('Like sync error:', error);
    return { ok: false, status: 0, data: {} };
  }
}

/** Reveal the "Admin portal" item in the user avatar menu (admins previewing the learning portal). */
function injectAdminBackButton() {
  const btn = document.getElementById("btnBackToAdminDash");
  if (!btn) return;
  btn.hidden = false;
  if (btn.dataset.bound) return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", () => {
    sessionStorage.setItem("ge_current_view", "admin");
    document.getElementById("userAvatarMenu")?.setAttribute("hidden", "");
    document.getElementById("appLayout").style.display = "none";
    document.getElementById("adminPortal").style.display = "block";
    initAdminPortal();
  });
}

// 3. User & Admin Lifecycle Controller (Session checking & Login gating)
async function initApp() {
  // Execute base configs
  enhanceUseCasesDatabase();
  initParticleField();
  initTheme();
  initLanguage();
  initFeedbackSystem();
  bindAvatarMenu("userAvatarBtn", "userAvatarMenu");
  bindAvatarMenu("adminAvatarBtn", "adminAvatarMenu");
  setupForgotPasswordHandlers();
  bindUserEditModal();

  // Establish base auth elements on start
  const overlay = document.getElementById("wizardOverlay");
  const loginCard = document.getElementById("loginCard");
  const resetCard = document.getElementById("resetCard");
  const profileCard = document.getElementById("profileCard");

  // Reset display status
  ["loginCard", "resetCard", "profileCard", "forgotCard", "setPasswordCard"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // Restore filter + sort values from sessionStorage before the first render
  appState.activeFilterCategory = sessionStorage.getItem("ge_active_category") || "all";
  appState.activeFilterFeature = sessionStorage.getItem("ge_active_feature") || "all";
  const savedStatus = sessionStorage.getItem("ge_active_status");
  // Only "all" and "liked" remain; legacy saved values ("deployed", "verified") fall back to "all"
  appState.activeFilterStatus = savedStatus === "liked" ? "liked" : "all";
  if (savedStatus && savedStatus !== appState.activeFilterStatus) sessionStorage.setItem("ge_active_status", "all");
  appState.sortBy = sessionStorage.getItem("ge_sort_by") || "popular";
  initFilterBar();
  document.getElementById("searchInput")?.addEventListener("input", handleSearchInput);

  // Email links (?verify= / ?reset=) take priority over any existing session
  const tok = readAuthTokenFromUrl();
  if (tok) {
    appState.activeLanguage = localStorage.getItem("ge_adoption_lang") || "en";
    updateUILanguage();
    startTokenFlow(tok.token, tok.kind);
  } else {
    try {
      // Validate session
      const res = await fetch('/api/auth/session');
      const auth = await res.json();

      if (auth.loggedIn) {
        appState.userEmail = auth.user.email;
        appState.isAdmin = auth.user.isAdmin;
        appState.isAssist = auth.user.isAssist || false;
        appState.isSuper = auth.user.isSuper ?? (auth.user.email === 'edu_portal_s_admin');
        // Per-user GE app link drives "Try it"; admins always use the generic Gemini Enterprise URL
        appState.geAppLink = auth.user.isAdmin ? null : (auth.user.geAppLink || null);
        appState.activeLanguage = localStorage.getItem("ge_adoption_lang") || appState.activeLanguage || "en";
        ["navLang", "wizardLang", "adminLang"].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = appState.activeLanguage;
        });
        updateAccountMenus();

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
            updateUILanguage();
            await loadUseCasesFromServer();
            renderUseCases();
            mountQuestRun();
          } else {
            document.getElementById("appLayout").style.display = "none";
            document.getElementById("adminPortal").style.display = "block";
            initAdminPortal();
          }
        } else if (auth.user.isTemp) {
          // Force reset temp accounts
          overlay.style.display = "flex";
          resetCard.style.display = "block";
          updateUILanguage();
          setupPasswordResetHandlers();
        } else if (auth.user.role && auth.user.institutionLevel) {
          // Profile exists in DB
          appState.userRole = auth.user.role;
          appState.institutionLevel = auth.user.institutionLevel;
          overlay.style.display = "none";
          updateUILanguage();
          updateSidebarContextUI();
          await loadUseCasesFromServer();
          renderUseCases();
          mountQuestRun();
        } else {
          // New user requires profile configuration
          overlay.style.display = "flex";
          profileCard.style.display = "block";
          updateUILanguage();
          setupProfileOnboardingHandlers();
        }
      } else {
        // Prompt Sign-in
        overlay.style.display = "flex";
        loginCard.style.display = "block";
        appState.activeLanguage = localStorage.getItem("ge_adoption_lang") || "en";
        updateUILanguage();
        setupLoginHandlers();
      }
    } catch (error) {
      console.error("Initialization error:", error);
      overlay.style.display = "flex";
      loginCard.style.display = "block";
      setupLoginHandlers();
    }
  }

  // Profile Context switch trigger
  document.getElementById("btnChangeContext").addEventListener("click", () => {
    showAuthCard("profileCard");
    if (appState.userRole) document.getElementById("wizardRole").value = appState.userRole;
    if (appState.institutionLevel) document.getElementById("wizardLevel").value = appState.institutionLevel;
    document.getElementById("wizardLang").value = appState.activeLanguage;
    handleWizardRoleChange();
    setupProfileOnboardingHandlers();
  });

  // Global Logout binding
  document.getElementById("btnLogout").addEventListener("click", triggerUserLogout);

  // Modal close bindings: close button, backdrop click, Escape
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modalOverlay")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (document.getElementById("modalOverlay")?.classList.contains("active")) closeModal();
    else if (document.getElementById("adminUserEditModal")?.classList.contains("active")) closeUserEditModal();
  });
}

// 4. Session Operations (Login, Reset, Profile, Logout)
function setupLoginHandlers() {
  const btnLogin = document.getElementById("btnLogin");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const errorMsg = document.getElementById("loginErrorMsg");

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
      errorMsg.textContent = tr().loginFieldsRequired;
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
        if (data.isAdmin) {
          sessionStorage.setItem("ge_current_view", "admin");
        }
        showToast(tr().loginSuccess);
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        errorMsg.textContent = data.message || tr().loginInvalid;
        errorMsg.style.display = "block";
      }
    } catch (err) {
      errorMsg.textContent = tr().networkError;
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

    if (!pass || pass.length < 8) {
      errorMsg.textContent = tr().pwTooShort;
      errorMsg.style.display = "block";
      return;
    }

    if (pass !== confirm) {
      errorMsg.textContent = tr().pwMismatch;
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
        showToast(tr().pwUpdated);
        document.getElementById("resetCard").style.display = "none";
        document.getElementById("profileCard").style.display = "block";
        setupProfileOnboardingHandlers();
      } else {
        errorMsg.textContent = data.message || tr().pwUpdateFailed;
        errorMsg.style.display = "block";
      }
    } catch (err) {
      errorMsg.textContent = tr().networkError;
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

        updateUILanguage();
        updateSidebarContextUI();

        // Fetch use cases and render
        await loadUseCasesFromServer();
        renderUseCases();
        mountQuestRun();
        showToast(tr().workspaceReady);
      }
    } catch (err) {
      console.error("Onboarding saving failed:", err);
    }
  };
}

async function triggerUserLogout() {
  try {
    sessionStorage.removeItem("ge_current_view");
    await fetch('/api/auth/logout', { method: 'POST' });
    showToast(tr().loggedOut);
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
  const isAssist = appState.isAssist === true;
  const isSuper = appState.isSuper === true;

  // Role-gated controls: assistants can't create/import; only super admins batch-generate infographics
  const btnCreate = document.getElementById("btnAdminCreateCase");
  if (btnCreate) btnCreate.hidden = isAssist;
  const btnImport = document.getElementById("btnAdminImportCases");
  if (btnImport) btnImport.hidden = isAssist;
  const btnGenMissing = document.getElementById("btnAdminGenerateMissing");
  if (btnGenMissing) {
    btnGenMissing.hidden = !isSuper;
    btnGenMissing.onclick = () => generateMissingInfographics(btnGenMissing);
  }

  // Bind topbar + tab row only once (initAdminPortal runs again when returning from the preview)
  if (!appState.adminBound) {
    appState.adminBound = true;
    document.querySelectorAll(".admin-tab-item").forEach(tab => {
      tab.addEventListener("click", () => showAdminTab(tab.dataset.tab));
    });
    document.getElementById("btnAdminLogout").addEventListener("click", triggerUserLogout);
    document.getElementById("btnAdminBackToPortal").addEventListener("click", () => {
      enterLearningPortalPreview();
      injectAdminBackButton();
    });
  }

  updateAccountMenus();
  updateUILanguage();
  showAdminTab(sessionStorage.getItem("ge_current_admin_tab") || "users");

  // User tab form hook. Server returns either { multiple, summary:{success,duplicates,errors}, defaultPassword }
  // or { email, tempPassword } for a single address.
  const formAddUser = document.getElementById("formAddUser");
  formAddUser.onsubmit = async (e) => {
    e.preventDefault();
    const t = tr();
    const email = document.getElementById("inputNewUserEmail").value.trim();
    const feedback = document.getElementById("userActionFeedback");
    if (!email) return;
    const btn = document.getElementById("adminBtnProvision");
    if (btn) btn.disabled = true;
    const { ok, data } = await apiJson('/api/admin/users', { method: 'POST', body: { email } });
    if (btn) btn.disabled = false;
    if (!ok) { showInline(feedback, escapeHtml(errText(data)), "error"); return; }

    formAddUser.reset();
    if (data.multiple) {
      const s = data.summary || {};
      const added = s.success || [], dups = s.duplicates || [], errs = s.errors || [];
      const lines = [
        `<p><strong>${escapeHtml(fmt(t.usersAdded, { n: added.length }))}</strong></p>`,
        dups.length ? `<p>${escapeHtml(fmt(t.usersSkipped, { list: dups.join(", ") }))}</p>` : "",
        errs.length ? `<p>${escapeHtml(fmt(t.usersFailed, { list: errs.join(", ") }))}</p>` : "",
        added.length && data.defaultPassword ? copyRowHtml(t.tempPasswordLabel, data.defaultPassword) : ""
      ];
      showInline(feedback, lines.join(""), errs.length ? "error" : "success");
    } else {
      showInline(feedback,
        `<p><strong>${escapeHtml(fmt(t.usersAdded, { n: 1 }))}</strong> · ${escapeHtml(data.email || email)}</p>` +
        (data.tempPassword ? copyRowHtml(t.tempPasswordLabel, data.tempPassword) : ""),
        "success");
    }
    loadAdminUsers();
  };

  // Case CRUD create/export hooks
  document.getElementById("btnAdminCreateCase").onclick = () => openAdminEditModal(null);
  document.getElementById("btnAdminExportCases").onclick = () => {
    const checkedBoxes = document.querySelectorAll(".admin-case-checkbox:checked");
    if (checkedBoxes.length === 0) {
      alert(tr().exportSelectFirst);
      return;
    }

    const selectedIds = Array.from(checkedBoxes).map(cb => cb.value);
    const allCases = appState.loadedAdminUseCases || [];
    const exportData = allCases.filter(uc => selectedIds.includes(uc.id)).map(uc => {
      return {
        id: uc.id,
        category: uc.category,
        title: uc.title,
        summary: uc.summary || "",
        features: typeof uc.features === 'string' ? JSON.parse(uc.features) : (uc.features || []),
        connectors: typeof uc.connectors === 'string' ? JSON.parse(uc.connectors) : (uc.connectors || []),
        role: uc.role || "Lecturer",
        level: typeof uc.level === 'string' ? JSON.parse(uc.level) : (uc.level || ["Generic"]),
        steps: typeof uc.steps === 'string' ? JSON.parse(uc.steps) : (uc.steps || []),
        prompt: uc.prompt || "",
        proTip: uc.proTip || uc.pro_tip || "",
        connectorGuide: typeof uc.connectorGuide === 'string' ? JSON.parse(uc.connectorGuide) : (uc.connectorGuide || uc.connector_guide || null),
        translations: typeof uc.translations === 'string' ? JSON.parse(uc.translations) : (uc.translations || {}),
        promptType: uc.promptType || "general"
      };
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gemini_playbooks_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  document.getElementById("btnAdminImportCases").onclick = () => {
    document.getElementById("inputAdminImportFile").click();
  };

  document.getElementById("inputAdminImportFile").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const importData = JSON.parse(evt.target.result);
        const importedArray = Array.isArray(importData) ? importData : [importData];

        if (importedArray.length === 0) {
          alert(tr().importEmpty);
          return;
        }

        // Fetch the very latest use cases list from server for lookup
        const checkRes = await fetch('/api/use-cases');
        const existingList = await checkRes.json();
        const existingIds = existingList.map(uc => uc.id);

        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const uc of importedArray) {
          if (!uc.id || !uc.title || !uc.category) {
            console.warn("Skipping imported use case with missing parameters:", uc);
            skippedCount++;
            continue;
          }

          const alreadyExists = existingIds.includes(uc.id);
          let shouldOverwrite = true;

          if (alreadyExists) {
            shouldOverwrite = confirm(fmt(tr().importConfirmOverwrite, { id: uc.id }));
          }

          if (shouldOverwrite) {
            const method = alreadyExists ? 'PUT' : 'POST';
            const url = '/api/admin/use-cases';

            // Ensure expected fields are structured
            const payload = {
              id: uc.id,
              category: uc.category,
              title: uc.title,
              summary: uc.summary || "",
              features: uc.features || [],
              connectors: uc.connectors || [],
              role: uc.role || "Lecturer",
              level: uc.level || ["Generic"],
              steps: uc.steps || [],
              prompt: uc.prompt || "",
              proTip: uc.proTip || uc.pro_tip || "",
              connectorGuide: uc.connectorGuide || uc.connector_guide || null,
              translations: uc.translations || {},
              promptType: uc.promptType || "general"
            };

            const res = await fetch(url, {
              method: method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const resData = await res.json();

            if (resData.success) {
              if (alreadyExists) updatedCount++;
              else createdCount++;
            } else {
              console.error(`Failed to import playbook ${uc.id}:`, resData.message || resData.error);
              skippedCount++;
            }
          } else {
            skippedCount++;
          }
        }

        alert(fmt(tr().importDone, { created: createdCount, updated: updatedCount, skipped: skippedCount }));
        
        // Reload all data arrays and render lists
        loadAdminUseCases();
        loadUseCasesFromServer().then(() => renderUseCases());

      } catch (err) {
        console.error("Failed to parse or import file:", err);
        alert(tr().importFailed);
      } finally {
        // Reset the file selector so the user can select the same file again if needed
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  document.getElementById("adminCaseModalClose").onclick = () => {
    document.getElementById("adminCaseEditModal").classList.remove("active");
  };
  document.getElementById("btnAdminFormCancel").onclick = () => {
    document.getElementById("adminCaseEditModal").classList.remove("active");
  };

  const btnGemini = document.getElementById("btnAdminFormGemini");
  if (btnGemini) {
    btnGemini.onclick = async () => {
      await triggerGeminiPlaybookGeneration();
    };
  }

  // Trigger form saving
  const formCase = document.getElementById("formAdminSaveCase");
  formCase.onsubmit = async (e) => {
    e.preventDefault();
    await saveAdminUseCase();
  };
}


// Admin Tab 1: Load users table (5 columns: email, GE app link, status, created, actions)
async function loadAdminUsers() {
  const tbody = document.getElementById("adminUsersTableBody");
  if (!tbody) return;
  const t = tr();
  const emptyRow = (text, cls = "") => `<tr><td colspan="5" class="table-empty ${cls}">${escapeHtml(text)}</td></tr>`;
  tbody.innerHTML = emptyRow(t.loading);

  const { ok, data } = await apiJson('/api/admin/users');
  const users = Array.isArray(data) ? data : (Array.isArray(data.users) ? data.users : []);
  if (!ok && !users.length) { tbody.innerHTML = emptyRow(errText(data), "is-error"); return; }
  if (!users.length) { tbody.innerHTML = emptyRow(t.usersEmpty); return; }

  tbody.innerHTML = "";
  users.forEach(u => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="cell-strong">${escapeHtml(u.email)}</td>
      <td>${geLinkCellHtml(u.geAppLink, t)}</td>
      <td><span class="status-dot ${u.isTemp ? "is-pending" : "is-ok"}">${escapeHtml(u.isTemp ? t.statusTemp : t.statusActive)}</span></td>
      <td class="muted">${escapeHtml(formatDate(u.createdAt))}</td>
      <td class="col-actions"><div class="row-actions">
        <button type="button" class="nav-button btn-sm btn-edit-user">${escapeHtml(t.edit)}</button>
        <button type="button" class="nav-button btn-sm btn-danger btn-revoke-user">${escapeHtml(t.revoke)}</button>
      </div></td>`;
    tbody.appendChild(row);

    row.querySelector(".btn-edit-user").onclick = () => openUserEditModal(u);
    row.querySelector(".btn-revoke-user").onclick = async () => {
      if (!confirm(fmt(t.confirmRevoke, { email: u.email }))) return;
      const res = await apiJson('/api/admin/users', { method: 'DELETE', body: { email: u.email } });
      if (res.ok) { showToast(t.userRevoked); loadAdminUsers(); }
      else showToast(errText(res.data), "warning");
    };
  });
}

// Admin Tab 2: Load metrics & SVG charts
async function loadAdminStats() {
  try {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();

    document.getElementById("statTotalUsers").textContent = data.totalUsers;
    document.getElementById("statTotalUseCases").textContent = data.totalUseCases;
    document.getElementById("statTotalLikes").textContent = data.totalLikes;
    document.getElementById("statTotalViews").textContent = data.totalViews ?? 0;

    renderAdminStatsChart(data.history);

    // Render Most Liked Playbooks Leaderboard
    const leaderboardContainer = document.getElementById("adminMostLikedList");
    if (leaderboardContainer && data.mostLiked) {
      leaderboardContainer.innerHTML = "";
      if (data.mostLiked.length === 0) {
        leaderboardContainer.innerHTML = `<p style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 24px;">No user likes recorded yet.</p>`;
      } else {
        data.mostLiked.forEach((item, index) => {
          const rank = index + 1;
          let rankBadgeBg = "var(--border-glass)";
          let rankBadgeColor = "var(--text-secondary)";
          if (rank === 1) {
            rankBadgeBg = "rgba(255, 215, 0, 0.15)";
            rankBadgeColor = "#FFD700";
          } else if (rank === 2) {
            rankBadgeBg = "rgba(192, 192, 192, 0.15)";
            rankBadgeColor = "#C0C0C0";
          } else if (rank === 3) {
            rankBadgeBg = "rgba(205, 127, 50, 0.15)";
            rankBadgeColor = "#CD7F32";
          }
          
          const categoryName = item.category === 'academic' ? 'Academic' : (item.category === 'operational' ? 'Operational' : 'Strategic Support');
          const cardHtml = `
            <div class="glass-panel" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; transition: transform 0.2s, box-shadow 0.2s; cursor: default;">
              <div style="display: flex; align-items: center; gap: 16px;">
                <!-- Rank Badge -->
                <div style="width: 32px; height: 32px; border-radius: 50%; background: ${rankBadgeBg}; color: ${rankBadgeColor}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; font-family: var(--font-heading);">
                  ${rank}
                </div>
                <!-- Playbook Info -->
                <div>
                  <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">${item.title}</div>
                  <div style="display: flex; gap: 8px; margin-top: 4px; align-items: center;">
                    <span style="font-size: 13px; background: rgba(255,255,255,0.05); color: var(--text-secondary); padding: 2px 8px; border-radius: 12px; font-weight: 500; text-transform: capitalize; border: 1px solid var(--border-hairline);">${categoryName}</span>
                    <span style="font-size: 13px; background: rgba(255,255,255,0.05); color: var(--text-muted); padding: 2px 8px; border-radius: 12px; font-weight: 500; border: 1px solid var(--border-hairline);">${item.role}</span>
                  </div>
                </div>
              </div>
              
              <!-- Likes Count -->
              <div style="display: flex; align-items: center; gap: 6px; background: rgba(235, 87, 87, 0.1); border: 1px solid rgba(235, 87, 87, 0.2); padding: 6px 12px; border-radius: 16px; color: var(--color-danger); font-weight: 700; font-size: 13px;">
                <span class="material-symbols-outlined" style="font-size: 16px; font-variation-settings: 'FILL' 1;">favorite</span>
                <span>${item.likes_count}</span>
              </div>
            </div>
          `;
          leaderboardContainer.insertAdjacentHTML('beforeend', cardHtml);
        });
      }
    }
  } catch (error) {
    console.error("Failed to load statistics:", error);
  }
}

// Render dynamic minimalist high-contrast SVG trend graph
function renderAdminStatsChart(history) {
  const container = document.getElementById("adminChartContainer");
  container.innerHTML = "";

  if (!history || history.length === 0) return;

  container.style.position = "relative";

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
    if (h.tries > maxVal) maxVal = h.tries;
  });
  maxVal = Math.ceil(maxVal / 10) * 10; // Round up to nearest 10 for gridlines

  // Calculate coordinates
  const pointsViews = [];
  const pointsLikes = [];
  const pointsTries = [];

  const stepX = chartWidth / (history.length - 1);

  history.forEach((h, i) => {
    const x = paddingLeft + (i * stepX);
    const yViews = paddingTop + chartHeight - ((h.views / maxVal) * chartHeight);
    const yLikes = paddingTop + chartHeight - ((h.likes / maxVal) * chartHeight);
    const yTries = paddingTop + chartHeight - ((h.tries / maxVal) * chartHeight);

    pointsViews.push(`${x},${yViews}`);
    pointsLikes.push(`${x},${yLikes}`);
    pointsTries.push(`${x},${yTries}`);
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

  // Create absolute glassmorphic tooltip box
  const tooltip = document.createElement("div");
  tooltip.id = "chartTooltip";
  tooltip.style.position = "absolute";
  tooltip.style.display = "none";
  tooltip.style.background = "var(--bg-sidebar)";
  tooltip.style.border = "1px solid var(--border-glass-focused)";
  tooltip.style.backdropFilter = "blur(16px)";
  tooltip.style.padding = "10px 14px";
  tooltip.style.borderRadius = "8px";
  tooltip.style.pointerEvents = "none";
  tooltip.style.zIndex = "10";
  tooltip.style.fontSize = "11px";
  tooltip.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.4)";
  tooltip.style.color = "var(--text-primary)";
  tooltip.style.minWidth = "130px";
  tooltip.style.transition = "opacity 0.15s ease, left 0.15s ease, top 0.15s ease";
  container.appendChild(tooltip);

  // Put it all together inside dynamic SVG
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", height);
  svg.style.overflow = "visible";

  svg.innerHTML = `
    <!-- Grid Layout -->
    ${gridlinesHtml}
    ${labelsHtml}

    <!-- Interactive Hover vertical guide -->
    <line id="hoverLine" x1="0" y1="${paddingTop}" x2="0" y2="${paddingTop + chartHeight}" stroke="var(--color-primary)" stroke-width="1.5" stroke-dasharray="3,3" opacity="0" pointer-events="none" />

    <!-- Trend Lines -->
    <polyline points="${pointsViews.join(' ')}" fill="none" stroke="var(--color-secondary)" stroke-width="2" />
    <polyline points="${pointsLikes.join(' ')}" fill="none" stroke="var(--color-danger)" stroke-width="2" />
    <polyline points="${pointsTries.join(' ')}" fill="none" stroke="var(--color-success)" stroke-width="2" />

    <!-- Data Markers -->
    ${history.map((h, i) => {
      const x = paddingLeft + (i * stepX);
      const yViews = paddingTop + chartHeight - ((h.views / maxVal) * chartHeight);
      const yLikes = paddingTop + chartHeight - ((h.likes / maxVal) * chartHeight);
      const yTries = paddingTop + chartHeight - ((h.tries / maxVal) * chartHeight);
      return `
        <circle cx="${x}" cy="${yViews}" r="4" fill="var(--bg-dark-base)" stroke="var(--color-secondary)" stroke-width="2" class="chart-dot" style="cursor: pointer;" />
        <circle cx="${x}" cy="${yLikes}" r="4" fill="var(--bg-dark-base)" stroke="var(--color-danger)" stroke-width="2" class="chart-dot" style="cursor: pointer;" />
        <circle cx="${x}" cy="${yTries}" r="4" fill="var(--bg-dark-base)" stroke="var(--color-success)" stroke-width="2" class="chart-dot" style="cursor: pointer;" />
      `;
    }).join('')}

    <!-- Interactive Hover Markers -->
    <circle id="hoverViewsCircle" r="5.5" fill="var(--color-secondary)" stroke="#ffffff" stroke-width="1.5" opacity="0" pointer-events="none" />
    <circle id="hoverLikesCircle" r="5.5" fill="var(--color-danger)" stroke="#ffffff" stroke-width="1.5" opacity="0" pointer-events="none" />
    <circle id="hoverTriesCircle" r="5.5" fill="var(--color-success)" stroke="#ffffff" stroke-width="1.5" opacity="0" pointer-events="none" />
  `;

  // Interaction handlers
  svg.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (mouseX < paddingLeft || mouseX > width - paddingRight) {
      hideTooltip();
      return;
    }

    const relativeX = mouseX - paddingLeft;
    const idx = Math.round(relativeX / stepX);
    if (idx < 0 || idx >= history.length) {
      hideTooltip();
      return;
    }

    const h = history[idx];
    const x = paddingLeft + (idx * stepX);

    const yViews = paddingTop + chartHeight - ((h.views / maxVal) * chartHeight);
    const yLikes = paddingTop + chartHeight - ((h.likes / maxVal) * chartHeight);
    const yTries = paddingTop + chartHeight - ((h.tries / maxVal) * chartHeight);

    const hLine = svg.getElementById("hoverLine");
    if (hLine) {
      hLine.setAttribute("x1", x);
      hLine.setAttribute("x2", x);
      hLine.setAttribute("opacity", "0.6");
    }

    const cViews = svg.getElementById("hoverViewsCircle");
    const cLikes = svg.getElementById("hoverLikesCircle");
    const cTries = svg.getElementById("hoverTriesCircle");

    if (cViews) { cViews.setAttribute("cx", x); cViews.setAttribute("cy", yViews); cViews.setAttribute("opacity", "1"); }
    if (cLikes) { cLikes.setAttribute("cx", x); cLikes.setAttribute("cy", yLikes); cLikes.setAttribute("opacity", "1"); }
    if (cTries) { cTries.setAttribute("cx", x); cTries.setAttribute("cy", yTries); cTries.setAttribute("opacity", "1"); }

    tooltip.style.display = "block";
    tooltip.style.opacity = "1";
    if (x <= width / 2) {
      tooltip.style.left = `${x + 15}px`;
    } else {
      tooltip.style.left = `${x - 145}px`;
    }
    tooltip.style.top = `${Math.min(mouseY - 10, height - 95)}px`;

    const tt = tr();
    const labelViews = escapeHtml(tt.chartTipViews || "Views");
    const labelLikes = escapeHtml(tt.chartTipLikes || "Likes");
    const labelTries = escapeHtml(tt.chartTipTries || "Try it");

    tooltip.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 6px; border-bottom: 1px solid var(--border-glass); padding-bottom: 4px; color: var(--color-primary); font-family: var(--font-heading); font-size: 13px;">${h.month}</div>
      <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
        <span style="color: var(--text-secondary); display: flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 6px; height: 6px; background: var(--color-secondary); border-radius: 50%;"></span>${labelViews}:</span>
        <strong style="color: var(--text-primary); font-family: monospace;">${h.views}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
        <span style="color: var(--text-secondary); display: flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 6px; height: 6px; background: var(--color-danger); border-radius: 50%;"></span>${labelLikes}:</span>
        <strong style="color: var(--text-primary); font-family: monospace;">${h.likes}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; gap: 16px;">
        <span style="color: var(--text-secondary); display: flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 6px; height: 6px; background: var(--color-success); border-radius: 50%;"></span>${labelTries}:</span>
        <strong style="color: var(--text-primary); font-family: monospace;">${h.tries}</strong>
      </div>
    `;
  });

  svg.addEventListener("mouseleave", () => {
    hideTooltip();
  });

  function hideTooltip() {
    tooltip.style.display = "none";
    tooltip.style.opacity = "0";
    const hLine = svg.getElementById("hoverLine");
    if (hLine) hLine.setAttribute("opacity", "0");

    const cViews = svg.getElementById("hoverViewsCircle");
    const cLikes = svg.getElementById("hoverLikesCircle");
    const cTries = svg.getElementById("hoverTriesCircle");

    if (cViews) cViews.setAttribute("opacity", "0");
    if (cLikes) cLikes.setAttribute("opacity", "0");
    if (cTries) cTries.setAttribute("opacity", "0");
  }

  container.appendChild(svg);
}

// Admin Tab 3: Load Use Cases CRUD (7 columns: check, infographic, ID, title, category, role, actions)
async function loadAdminUseCases() {
  const tbody = document.getElementById("adminCasesTableBody");
  if (!tbody) return;
  const t = tr();
  const emptyRow = (text, cls = "") => `<tr><td colspan="7" class="table-empty ${cls}">${escapeHtml(text)}</td></tr>`;
  tbody.innerHTML = emptyRow(t.loading);

  const { ok, data } = await apiJson('/api/use-cases');
  const cases = Array.isArray(data) ? data : [];
  if (!ok && !cases.length) { tbody.innerHTML = emptyRow(errText(data), "is-error"); return; }
  appState.loadedAdminUseCases = cases;

  // Reset select-all checkbox
  const selectAllCheckbox = document.getElementById("chkAdminSelectAllCases");
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.onchange = (e) => {
      document.querySelectorAll(".admin-case-checkbox").forEach(cb => { cb.checked = e.target.checked; });
    };
  }

  const activeLang = appState.activeLanguage || "en";
  const isAssist = appState.isAssist === true;
  const isSuper = appState.isSuper === true;
  const categoryLabel = { academic: t.catAcademic, student: t.catStudent, operational: t.catOperational, administrative: t.catAdmin };

  tbody.innerHTML = "";
  cases.forEach(uc => {
    const row = document.createElement("tr");
    const trans = uc.translations ? uc.translations[activeLang] : null;
    const titleText = (trans && trans.title) ? trans.title : uc.title;
    const badgeHtml = getUsecaseBadgeHtml(uc, activeLang);
    const thumb = uc.infographicUrl
      ? `<a href="${escapeHtml(uc.infographicUrl)}" target="_blank" rel="noopener" title="${escapeHtml(t.infographicOpen)}"><img class="thumb" src="${escapeHtml(uc.infographicUrl)}" alt="" loading="lazy"></a>`
      : `<span class="muted">${escapeHtml(t.none)}</span>`;

    row.innerHTML = `
      <td class="col-check"><input type="checkbox" class="admin-case-checkbox" value="${escapeHtml(uc.id)}" aria-label="${escapeHtml(titleText)}"></td>
      <td class="col-thumb">${thumb}</td>
      <td class="cell-mono">${escapeHtml(uc.id)}</td>
      <td class="cell-strong"><span>${escapeHtml(titleText)}</span>${badgeHtml ? ` ${badgeHtml}` : ""}</td>
      <td>${escapeHtml(categoryLabel[uc.category] || uc.category || "")}</td>
      <td class="muted">${escapeHtml((t.roles && t.roles[uc.role]) || uc.role || "")}</td>
      <td class="col-actions"><div class="row-actions">
        ${isSuper ? `<button type="button" class="nav-button btn-sm btn-gen-infographic">${escapeHtml(uc.infographicUrl ? t.regenerate : t.generate)}</button>` : ""}
        <button type="button" class="nav-button btn-sm btn-edit-case">${escapeHtml(isAssist ? t.view : t.edit)}</button>
        ${isAssist ? "" : `<button type="button" class="nav-button btn-sm btn-danger btn-delete-case">${escapeHtml(t.deleteLabel)}</button>`}
      </div></td>`;
    tbody.appendChild(row);

    row.querySelector(".btn-edit-case").onclick = () => openAdminEditModal(uc);
    if (!isAssist) row.querySelector(".btn-delete-case").onclick = () => deleteAdminUseCase(uc.id);
    const genBtn = row.querySelector(".btn-gen-infographic");
    if (genBtn) {
      // Single generation takes 10-27s: show a spinner on the button until the server responds
      genBtn.onclick = async () => {
        genBtn.disabled = true;
        genBtn.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${escapeHtml(t.generating)}`;
        const url = await generateInfographic(uc.id);
        if (url) loadAdminUseCases();
        else { genBtn.disabled = false; genBtn.textContent = uc.infographicUrl ? t.regenerate : t.generate; }
      };
    }
  });
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

  const isAssist = appState.isAssist === true;
  document.getElementById("btnAdminFormSave").style.display = isAssist ? "none" : "block";
  document.getElementById("btnAdminFormGemini").style.display = isAssist ? "none" : "flex";

  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach(input => {
    if (input.id === "formCaseId" && uc) {
      input.disabled = true;
    } else {
      input.disabled = isAssist;
    }
  });

  if (uc) {
    // EDIT MODE
    editingUseCaseId = uc.id;
    title.textContent = fmt(tr().caseFormEditTitle, { title: uc.title });
    idInput.value = uc.id;
    idInput.disabled = true; // Immutable

    document.getElementById("formCaseCategory").value = uc.category || "";
    document.getElementById("formCaseTitle").value = uc.title || "";
    const roleVal = uc.role || "Lecturer";
    const selectEl = document.getElementById("formCaseRole");
    let optionExists = false;
    if (selectEl) {
      for (let i = 0; i < selectEl.options.length; i++) {
        if (selectEl.options[i].value === roleVal) {
          optionExists = true;
          break;
        }
      }
      selectEl.value = optionExists ? roleVal : "Lecturer";
    }
    document.getElementById("formCaseSummary").value = uc.summary || "";
    
    const stepsArray = Array.isArray(uc.steps) ? uc.steps : [];
    document.getElementById("formCaseSteps").value = stepsArray.join("\n");
    
    document.getElementById("formCasePrompt").value = uc.prompt || "";
    document.getElementById("formCaseProTip").value = uc.proTip || "";

    // Checkbox mapping Features safely
    const featuresArray = Array.isArray(uc.features) ? uc.features : [];
    const featureBoxes = document.querySelectorAll("input[name='formFeatures']");
    featureBoxes.forEach(box => {
      box.checked = featuresArray.includes(box.value);
    });

    // Checkbox mapping Connectors safely (supporting case-insensitive legacy mappings)
    const connectorsArray = Array.isArray(uc.connectors) ? uc.connectors : [];
    const connBoxes = document.querySelectorAll("input[name='formConnectors']");
    connBoxes.forEach(box => {
      const valLower = box.value.toLowerCase();
      box.checked = connectorsArray.some(c => {
        const cLower = c.toLowerCase();
        if (valLower.includes("drive") && cLower.includes("drive")) return true;
        if (valLower.includes("email") && cLower.includes("email")) return true;
        if (valLower.includes("lms") && cLower.includes("lms")) return true;
        if (valLower.includes("calendar") && (cLower.includes("calendar") || cLower.includes("google"))) return true;
        return cLower === valLower;
      });
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

    const zhcn = trans["zh-CN"] || {};
    document.getElementById("formTransZhcnTitle").value = zhcn.title || "";
    document.getElementById("formTransZhcnSummary").value = zhcn.summary || "";
    document.getElementById("formTransZhcnSteps").value = Array.isArray(zhcn.steps) ? zhcn.steps.join("\n") : "";
    document.getElementById("formTransZhcnPrompt").value = zhcn.prompt || "";
    document.getElementById("formTransZhcnProTip").value = zhcn.proTip || "";

  } else {
    // CREATE MODE
    editingUseCaseId = null;
    title.textContent = tr().caseFormCreateTitle;
    idInput.value = "";
    idInput.disabled = false; // Mutable during creation

    // Default checked boxes
    document.querySelectorAll("input[name='formFeatures']").forEach(b => b.checked = false);
    document.querySelectorAll("input[name='formConnectors']").forEach(b => b.checked = false);
    document.querySelectorAll("input[name='formLevel']").forEach(b => b.checked = false);

    // Clear all form text inputs
    document.getElementById("formCaseCategory").value = "academic";
    document.getElementById("formCaseTitle").value = "";
    document.getElementById("formCaseRole").value = "Lecturer";
    document.getElementById("formCaseSummary").value = "";
    document.getElementById("formCaseSteps").value = "";
    document.getElementById("formCasePrompt").value = "";
    document.getElementById("formCaseProTip").value = "";

    // Clear all translation inputs
    document.getElementById("formTransZhtwTitle").value = "";
    document.getElementById("formTransZhtwSummary").value = "";
    document.getElementById("formTransZhtwSteps").value = "";
    document.getElementById("formTransZhtwPrompt").value = "";
    document.getElementById("formTransZhtwProTip").value = "";

    document.getElementById("formTransZhcnTitle").value = "";
    document.getElementById("formTransZhcnSummary").value = "";
    document.getElementById("formTransZhcnSteps").value = "";
    document.getElementById("formTransZhcnPrompt").value = "";
    document.getElementById("formTransZhcnProTip").value = "";
  }

  // V2: prompt type and infographic preview
  const promptTypeEl = document.getElementById("formCasePromptType");
  if (promptTypeEl) promptTypeEl.value = (uc && uc.promptType) || "general";
  updateCaseInfographicPreview(uc || null);

  // V6: Quest Run timing + questions (read-only for assistant admins)
  renderCaseQuestFields({ timing: uc?.timing || ["anytime"], hints: uc?.hints || [] }, isAssist);

  modal.classList.add("active");
}

async function saveAdminUseCase() {
  if (appState.isAssist) {
    alert(tr().caseAssistReadonly);
    return;
  }
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
    feedback.textContent = tr().caseFormRequired;
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
  const transZhcnSteps = document.getElementById("formTransZhcnSteps").value.split("\n").map(s => s.trim()).filter(s => s.length > 0);

  const translations = {
    "en": { 
      title, 
      summary, 
      steps, 
      prompt, 
      proTip
    },
    "zh-TW": {
      title: document.getElementById("formTransZhtwTitle").value.trim() || title,
      summary: document.getElementById("formTransZhtwSummary").value.trim() || summary,
      steps: transZhtwSteps.length > 0 ? transZhtwSteps : steps,
      prompt: document.getElementById("formTransZhtwPrompt").value.trim() || prompt,
      proTip: document.getElementById("formTransZhtwProTip").value.trim() || proTip
    },
    "zh-CN": {
      title: document.getElementById("formTransZhcnTitle").value.trim() || title,
      summary: document.getElementById("formTransZhcnSummary").value.trim() || summary,
      steps: transZhcnSteps.length > 0 ? transZhcnSteps : steps,
      prompt: document.getElementById("formTransZhcnPrompt").value.trim() || prompt,
      proTip: document.getElementById("formTransZhcnProTip").value.trim() || proTip
    }
  };

  const promptTypeEl = document.getElementById("formCasePromptType");
  const promptType = promptTypeEl ? promptTypeEl.value : "general";

  const questFields = readCaseQuestFields();
  const payload = {
    id, category, title, role, summary, features, connectors, level, steps, prompt, proTip, translations, promptType,
    timing: questFields.timing.length ? questFields.timing : ["anytime"],
    hints: questFields.hints.filter(h => h.question.en)
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
      showToast(isEdit ? tr().caseUpdated : tr().caseCreated);
      loadAdminUseCases();
      loadUseCasesFromServer().then(() => renderUseCases());
    } else {
      feedback.textContent = data.error || tr().caseSaveFailed;
      feedback.style.display = "block";
    }
  } catch (err) {
    feedback.textContent = tr().networkError;
    feedback.style.display = "block";
  }
}

async function deleteAdminUseCase(id) {
  if (confirm(fmt(tr().confirmDeleteCase, { id }))) {
    try {
      const res = await fetch('/api/admin/use-cases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showToast(tr().caseDeleted);
        loadAdminUseCases();
        loadUseCasesFromServer().then(() => renderUseCases());
      }
    } catch (err) {
      console.error(err);
    }
  }
}

// ==========================================
// AI-Assisted Playbook Drafting & Diff Review (Vertex AI Gemini Integration)
// ==========================================
async function triggerGeminiPlaybookGeneration() {
  const btn = document.getElementById("btnAdminFormGemini");
  const feedback = document.getElementById("adminFormFeedback");
  
  if (feedback) {
    feedback.style.display = "none";
    feedback.textContent = "";
  }

  const title = document.getElementById("formCaseTitle").value.trim();
  const instructionEl = document.getElementById("formCaseGeminiInstruction");
  const instruction = instructionEl ? instructionEl.value.trim() : "";

  if (!title && !instruction) {
    if (feedback) {
      feedback.style.display = "block";
      feedback.textContent = tr().draftNeedInput;
      feedback.scrollIntoView({ behavior: 'smooth' });
    }
    return;
  }

  // Gather current inputs
  const category = document.getElementById("formCaseCategory").value;
  const role = document.getElementById("formCaseRole").value.trim() || "Lecturer";

  const features = [];
  document.querySelectorAll("input[name='formFeatures']:checked").forEach(b => features.push(b.value));
  
  const connectors = [];
  document.querySelectorAll("input[name='formConnectors']:checked").forEach(b => connectors.push(b.value));

  const level = [];
  document.querySelectorAll("input[name='formLevel']:checked").forEach(b => level.push(b.value));

  // Activate dynamic Gemini generating loader overlay
  const loader = document.getElementById("geminiLoadingOverlay");
  if (loader) {
    const genLabel = document.getElementById("adminFormLabelGenerating");
    const genDesc = document.getElementById("adminFormLabelGeneratingDesc");
    if (genLabel) genLabel.textContent = tr().draftingTitle;
    if (genDesc) genDesc.textContent = tr().draftingDesc;
    loader.classList.add("active");
  }

  // Change button state
  const originalBtnHtml = btn.innerHTML;
  btn.disabled = true;
  btn.style.opacity = "0.7";
  btn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px; animation: spin 1s linear infinite;">autorenew</span> <span>${escapeHtml(tr().drafting)}</span>`;

  try {
    const res = await fetch('/api/admin/generate-gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingUseCaseId, // null if creation
        title,
        category,
        features,
        connectors,
        role,
        level,
        instruction
      })
    });

    let data = null;
    try {
      data = await res.json();
    } catch (parseErr) {
      console.error("Failed to parse error response JSON:", parseErr);
    }

    if (!res.ok || !data || !data.success) {
      const errMsg = (data && data.error) ? data.error : tr().draftFailed;
      if (feedback) {
        feedback.style.display = "block";
        feedback.textContent = errMsg;
        feedback.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const aiRes = data.result;

    // Successful generation: clear the instruction field
    if (instructionEl) {
      instructionEl.value = "";
    }

    if (!editingUseCaseId) {
      // CREATION MODE: Apply suggestions directly!
      applyGeminiSuggestions(aiRes);
      showToast(tr().draftDone);
    } else {
      // EDITING MODE: Show Side-by-Side Diff modal!
      showDiffViewer(aiRes);
    }

  } catch (err) {
    console.error("Gemini generation error:", err);
    if (feedback) {
      feedback.style.display = "block";
      feedback.textContent = fmt(tr().draftError, { msg: err.message });
      feedback.scrollIntoView({ behavior: 'smooth' });
    }
  } finally {
    if (loader) {
      loader.classList.remove("active");
    }
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.innerHTML = originalBtnHtml;
  }
}

function applyGeminiSuggestions(aiRes) {
  // V6: Quest Run timing + questions
  if (aiRes && (Array.isArray(aiRes.timing) || Array.isArray(aiRes.hints))) applyQuestSuggestions(aiRes);

  // English (en)
  const en = aiRes.en || {};
  if (en.title) {
    document.getElementById("formCaseTitle").value = en.title;
  }
  if (aiRes.category) {
    document.getElementById("formCaseCategory").value = aiRes.category;
  }
  if (aiRes.role) {
    const rVal = aiRes.role.trim();
    const select = document.getElementById("formCaseRole");
    if (select) {
      let found = false;
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value.toLowerCase() === rVal.toLowerCase()) {
          select.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found) {
        const lower = rVal.toLowerCase();
        if (lower.includes("lecturer") || lower.includes("teacher") || lower.includes("educator") || lower.includes("faculty")) {
          select.value = "Lecturer";
        } else if (lower.includes("assistant") || lower.includes("ta")) {
          select.value = "TA";
        } else if (lower.includes("student") || lower.includes("club")) {
          select.value = "Student";
        } else if (lower.includes("leader") || lower.includes("head") || lower.includes("director")) {
          select.value = "Program Leader";
        } else if (lower.includes("dean") || lower.includes("educational")) {
          select.value = "Dean";
        } else if (lower.includes("it") || lower.includes("admin") || lower.includes("sysadmin")) {
          select.value = "IT Admin";
        } else if (lower.includes("affairs") || lower.includes("sao")) {
          select.value = "SAO";
        } else if (lower.includes("security") || lower.includes("safety") || lower.includes("officer")) {
          select.value = "Security";
        } else if (lower.includes("finance") || lower.includes("audit") || lower.includes("accountant")) {
          select.value = "Finance";
        } else {
          select.value = "Lecturer";
        }
      }
    }
  }
  if (aiRes.id && !editingUseCaseId) {
    document.getElementById("formCaseId").value = aiRes.id;
  }

  // Apply Features suggestions if returned by Gemini
  if (Array.isArray(aiRes.features)) {
    const featureBoxes = document.querySelectorAll("input[name='formFeatures']");
    featureBoxes.forEach(box => {
      box.checked = aiRes.features.includes(box.value);
    });
  }

  // Apply Connectors suggestions if returned by Gemini
  if (Array.isArray(aiRes.connectors)) {
    const connBoxes = document.querySelectorAll("input[name='formConnectors']");
    connBoxes.forEach(box => {
      const valLower = box.value.toLowerCase();
      // Case-insensitive / legacy compatible check
      box.checked = aiRes.connectors.some(c => {
        const cLower = c.toLowerCase();
        if (valLower.includes("drive") && cLower.includes("drive")) return true;
        if (valLower.includes("email") && cLower.includes("email")) return true;
        if (valLower.includes("lms") && cLower.includes("lms")) return true;
        if (valLower.includes("calendar") && (cLower.includes("calendar") || cLower.includes("google"))) return true;
        return cLower === valLower;
      });
    });
  }

  document.getElementById("formCaseSummary").value = en.summary || "";
  
  // Populate standard English steps/prompt/proTip
  const steps = Array.isArray(en.steps) ? en.steps : [];
  document.getElementById("formCaseSteps").value = steps.join("\n");
  document.getElementById("formCasePrompt").value = en.prompt || "";
  document.getElementById("formCaseProTip").value = en.proTip || "";

  // Traditional Chinese (zh-TW)
  const zhtw = aiRes["zh-TW"] || {};
  document.getElementById("formTransZhtwTitle").value = zhtw.title || document.getElementById("formCaseTitle").value;
  document.getElementById("formTransZhtwSummary").value = zhtw.summary || "";
  
  const twSteps = Array.isArray(zhtw.steps) ? zhtw.steps : [];
  document.getElementById("formTransZhtwSteps").value = twSteps.join("\n");
  document.getElementById("formTransZhtwPrompt").value = zhtw.prompt || "";
  document.getElementById("formTransZhtwProTip").value = zhtw.proTip || "";

  // Simplified Chinese (zh-CN)
  const zhcn = aiRes["zh-CN"] || {};
  document.getElementById("formTransZhcnTitle").value = zhcn.title || document.getElementById("formCaseTitle").value;
  document.getElementById("formTransZhcnSummary").value = zhcn.summary || "";

  const cnSteps = Array.isArray(zhcn.steps) ? zhcn.steps : [];
  document.getElementById("formTransZhcnSteps").value = cnSteps.join("\n");
  document.getElementById("formTransZhcnPrompt").value = zhcn.prompt || "";
  document.getElementById("formTransZhcnProTip").value = zhcn.proTip || "";
}

function showDiffViewer(aiRes) {
  const modal = document.getElementById("adminDiffViewerModal");
  const scrollContainer = document.getElementById("adminDiffScrollContainer");
  if (!modal || !scrollContainer) return;
  
  scrollContainer.innerHTML = "";

  // Localized "Field · Language" labels for each comparison row
  const t = tr();
  const L = (field, langName) => `${field} · ${langName}`;

  // Compile list of comparison elements
  const diffItems = [];

  // Compile Current checked states
  const currentFeatures = [];
  document.querySelectorAll("input[name='formFeatures']:checked").forEach(b => currentFeatures.push(b.value));
  
  const currentConnectors = [];
  document.querySelectorAll("input[name='formConnectors']:checked").forEach(b => currentConnectors.push(b.value));

  // Compile Proposed checked states
  const proposedFeatures = Array.isArray(aiRes.features) ? aiRes.features : currentFeatures;
  const proposedConnectors = Array.isArray(aiRes.connectors) ? aiRes.connectors : currentConnectors;

  // 1. Required Gemini Features
  diffItems.push({
    label: t.adminFormLabelFeatures,
    current: currentFeatures.join(", ") || t.diffNone,
    proposed: proposedFeatures.join(", ") || t.diffNone
  });

  // 2. Required Connectors
  diffItems.push({
    label: t.adminFormLabelConnectors,
    current: currentConnectors.join(", ") || t.diffNone,
    proposed: proposedConnectors.join(", ") || t.diffNone
  });

  // English Summary
  diffItems.push({
    label: L(t.adminFormLabelSummary, t.langNameEn),
    current: document.getElementById("formCaseSummary").value,
    proposed: aiRes.en?.summary || ""
  });

  // English Steps
  diffItems.push({
    label: L(t.adminFormLabelSteps, t.langNameEn),
    current: document.getElementById("formCaseSteps").value,
    proposed: Array.isArray(aiRes.en?.steps) ? aiRes.en.steps.join("\n") : ""
  });
  // English Prompt
  diffItems.push({
    label: L(t.adminFormLabelPrompt, t.langNameEn),
    current: document.getElementById("formCasePrompt").value,
    proposed: aiRes.en?.prompt || ""
  });
  // English Pro Tip
  diffItems.push({
    label: L(t.adminFormLabelProTip, t.langNameEn),
    current: document.getElementById("formCaseProTip").value,
    proposed: aiRes.en?.proTip || ""
  });

  // Traditional Chinese Translations
  diffItems.push({
    label: L(t.adminFormLabelTitle, t.langNameZhTw),
    current: document.getElementById("formTransZhtwTitle").value,
    proposed: aiRes["zh-TW"]?.title || document.getElementById("formCaseTitle").value
  });
  diffItems.push({
    label: L(t.adminFormLabelSummary, t.langNameZhTw),
    current: document.getElementById("formTransZhtwSummary").value,
    proposed: aiRes["zh-TW"]?.summary || ""
  });
  diffItems.push({
    label: L(t.adminFormLabelSteps, t.langNameZhTw),
    current: document.getElementById("formTransZhtwSteps").value,
    proposed: Array.isArray(aiRes["zh-TW"]?.steps) ? aiRes["zh-TW"].steps.join("\n") : ""
  });
  diffItems.push({
    label: L(t.adminFormLabelPrompt, t.langNameZhTw),
    current: document.getElementById("formTransZhtwPrompt").value,
    proposed: aiRes["zh-TW"]?.prompt || ""
  });
  diffItems.push({
    label: L(t.adminFormLabelProTip, t.langNameZhTw),
    current: document.getElementById("formTransZhtwProTip").value,
    proposed: aiRes["zh-TW"]?.proTip || ""
  });

  // Simplified Chinese Translations
  diffItems.push({
    label: L(t.adminFormLabelTitle, t.langNameZhCn),
    current: document.getElementById("formTransZhcnTitle").value,
    proposed: aiRes["zh-CN"]?.title || document.getElementById("formCaseTitle").value
  });
  diffItems.push({
    label: L(t.adminFormLabelSummary, t.langNameZhCn),
    current: document.getElementById("formTransZhcnSummary").value,
    proposed: aiRes["zh-CN"]?.summary || ""
  });
  diffItems.push({
    label: L(t.adminFormLabelSteps, t.langNameZhCn),
    current: document.getElementById("formTransZhcnSteps").value,
    proposed: Array.isArray(aiRes["zh-CN"]?.steps) ? aiRes["zh-CN"].steps.join("\n") : ""
  });
  diffItems.push({
    label: L(t.adminFormLabelPrompt, t.langNameZhCn),
    current: document.getElementById("formTransZhcnPrompt").value,
    proposed: aiRes["zh-CN"]?.prompt || ""
  });
  diffItems.push({
    label: L(t.adminFormLabelProTip, t.langNameZhCn),
    current: document.getElementById("formTransZhcnProTip").value,
    proposed: aiRes["zh-CN"]?.proTip || ""
  });

  // Render comparative items
  diffItems.forEach(item => {
    // Only display if at least one of the sides is not empty, or they differ
    if (!item.current && !item.proposed) return;
    
    const isDifferent = item.current.trim() !== item.proposed.trim();

    const section = document.createElement("div");
    section.style.display = "flex";
    section.style.flexDirection = "column";
    section.style.gap = "6px";
    section.style.borderBottom = "1px solid var(--border-glass)";
    section.style.paddingBottom = "12px";

    section.innerHTML = `
      <div style="font-size: 13px; font-weight: 700; color: ${isDifferent ? 'var(--color-primary)' : 'var(--text-secondary)'}; display: flex; align-items: center; gap: 4px;">
        <span class="material-symbols-outlined" style="font-size: 14px;">${isDifferent ? 'pending_actions' : 'check_circle'}</span>
        <span>${escapeHtml(item.label)}</span>
        ${isDifferent ? `<span style="font-size: 13px; padding: 2px 6px; border-radius: 4px; background: rgba(79, 70, 229, 0.15); color: var(--color-primary); margin-left: auto;">${escapeHtml(t.diffChanged)}</span>` : ''}
      </div>
      <div style="display: flex; flex-direction: column; border: 1px solid ${isDifferent ? 'var(--color-primary)' : 'var(--border-glass)'}; border-radius: 8px; overflow: hidden; background: var(--bg-dark-surface);">
        ${renderLineDiff(item.current, item.proposed)}
      </div>
    `;
    scrollContainer.appendChild(section);
  });

  // Bind Accept / Reject buttons
  document.getElementById("btnDiffAccept").onclick = () => {
    applyGeminiSuggestions(aiRes);
    modal.classList.remove("active");
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
    showToast(tr().diffApplied);
  };

  document.getElementById("btnDiffReject").onclick = () => {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
    showToast(tr().diffDeclined);
  };

  document.getElementById("adminDiffViewerClose").onclick = () => {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  };

  modal.style.display = "flex";
  setTimeout(() => {
    modal.classList.add("active");
  }, 10);
}

// PREMIUM LCS SPLIT LINE-BY-LINE ALIGNMENT DIFF ENGINE
function renderLineDiff(oldStr, newStr) {
  const lines1 = (oldStr || "").split("\n");
  const lines2 = (newStr || "").split("\n");
  
  const m = lines1.length;
  const n = lines2.length;
  
  // DP table for Longest Common Subsequence
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (lines1[i - 1].trim() === lines2[j - 1].trim()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Traceback to align
  let i = m, j = n;
  const aligned = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1].trim() === lines2[j - 1].trim()) {
      aligned.unshift({ op: "equal", left: lines1[i - 1], right: lines2[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      aligned.unshift({ op: "insert", left: "", right: lines2[j - 1] });
      j--;
    } else {
      aligned.unshift({ op: "delete", left: lines1[i - 1], right: "" });
      i--;
    }
  }
  
  let html = "";
  aligned.forEach((line, idx) => {
    const isLast = idx === aligned.length - 1;
    const borderStyle = isLast ? "" : "border-bottom: 1px solid var(--border-glass);";
    
    if (line.op === "equal") {
      html += `
        <div class="diff-row" style="${borderStyle}">
          <div class="diff-cell-left" style="color: var(--text-secondary); background: transparent;">
            ${escapeHtmlDiff(line.left)}
          </div>
          <div class="diff-cell-right" style="color: var(--text-primary); background: transparent;">
            ${escapeHtmlDiff(line.right)}
          </div>
        </div>
      `;
    } else if (line.op === "insert") {
      html += `
        <div class="diff-row" style="${borderStyle} background: rgba(34, 197, 94, 0.08);">
          <div class="diff-cell-left" style="color: transparent; background: transparent; user-select: none;">
            &nbsp;
          </div>
          <div class="diff-cell-right" style="color: #22c55e; font-weight: 600;">
            + ${escapeHtmlDiff(line.right)}
          </div>
        </div>
      `;
    } else if (line.op === "delete") {
      html += `
        <div class="diff-row" style="${borderStyle} background: rgba(239, 68, 68, 0.08);">
          <div class="diff-cell-left" style="color: #ef4444; text-decoration: line-through; font-weight: 600;">
            - ${escapeHtmlDiff(line.left)}
          </div>
          <div class="diff-cell-right" style="color: transparent; background: transparent; user-select: none;">
            &nbsp;
          </div>
        </div>
      `;
    }
  });
  
  return html;
}

function escapeHtmlDiff(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}



// ==========================================
// User Feedback System Client Engine
// ==========================================
window.initFeedbackSystem = function() {
  const btn = document.getElementById("btnFloatingFeedback");
  const modal = document.getElementById("feedbackSubmissionModal");
  const closeBtn = document.getElementById("feedbackModalClose");
  const cancelBtn = document.getElementById("btnCancelFeedback");
  const txtContent = document.getElementById("txtFeedbackContent");

  if (!btn || !modal) return;

  btn.addEventListener("click", () => {
    modal.style.display = "flex";
    modal.classList.add("active");
    txtContent.value = "";
    txtContent.focus();
  });

  const hideModal = () => {
    modal.classList.remove("active");
    modal.style.display = "none";
  };

  closeBtn.addEventListener("click", hideModal);
  cancelBtn.addEventListener("click", hideModal);

  // Close modal on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) hideModal();
  });

  /*
   * Visibility: the button belongs to the signed-in user portal only. It is hidden while
   * any auth card is up (login / forgot / set-password / temp reset / profile wizard all
   * live in #wizardOverlay), in the admin portal, and for admins previewing the portal.
   * Views are switched by inline `style.display` in many places, so instead of patching
   * each call site we observe those attributes and re-derive visibility from the DOM.
   */
  const appLayout = document.getElementById("appLayout");
  const wizard = document.getElementById("wizardOverlay");
  const adminPortal = document.getElementById("adminPortal");
  const isShown = (el) => !!el && getComputedStyle(el).display !== "none";
  const sync = () => {
    btn.hidden = !(appState.userEmail && !appState.isAdmin && isShown(appLayout) && !isShown(wizard) && !isShown(adminPortal));
  };
  const observer = new MutationObserver(sync);
  [appLayout, wizard, adminPortal].filter(Boolean)
    .forEach(el => observer.observe(el, { attributes: true, attributeFilter: ["style", "class", "hidden"] }));
  window.syncFeedbackVisibility = sync;
  sync();
};

window.handleFeedbackSubmit = async function(event) {
  event.preventDefault();
  const txtContent = document.getElementById("txtFeedbackContent");
  if (!txtContent) return;

  const feedbackText = txtContent.value.trim();
  if (!feedbackText) return;

  try {
    const res = await fetch('/api/feedbacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback_text: feedbackText })
    });
    const data = await res.json();
    if (data.success) {
      showToast(tr().feedbackThanks);
      const modal = document.getElementById("feedbackSubmissionModal");
      if (modal) {
        modal.classList.remove("active");
        modal.style.display = "none";
      }
    } else {
      alert(data.error || tr().feedbackFailed);
    }
  } catch (err) {
    alert(tr().networkError);
  }
};

window.loadAdminFeedbacks = async function() {
  const tbody = document.getElementById("adminFeedbacksTableBody");
  if (!tbody) return;
  const t = tr();
  const emptyRow = (text, cls = "") => `<tr><td colspan="4" class="table-empty ${cls}">${escapeHtml(text)}</td></tr>`;
  tbody.innerHTML = emptyRow(t.loading);
  const { ok, data } = await apiJson('/api/feedbacks');
  if (!ok || !data || !data.success) {
    tbody.innerHTML = emptyRow(errText(data, t.networkError), "is-error");
    return;
  }
  if (!data.feedbacks.length) {
    tbody.innerHTML = emptyRow(t.feedbackEmpty || "No feedback yet.");
    return;
  }
  const isAssist = appState.isAssist === true;
  tbody.innerHTML = data.feedbacks.map(fb => `
    <tr>
      <td class="cell-strong">${escapeHtml(fb.user_email || "")}</td>
      <td class="cell-pre">${escapeHtml(fb.feedback_text || "")}</td>
      <td class="muted">${escapeHtml(formatDateTime(fb.created_at))}</td>
      <td class="col-actions">
        ${isAssist ? '' : `<button type="button" class="icon-btn btn-sm" onclick="deleteFeedback(${Number(fb.id)})" title="${escapeHtml(t.deleteLabel)}" aria-label="${escapeHtml(t.deleteLabel)}"><span class="material-symbols-outlined">close</span></button>`}
      </td>
    </tr>`).join("");
};

window.deleteFeedback = async function(id) {
  if (!confirm(tr().confirmDismissFeedback)) return;
  try {
    const res = await fetch('/api/feedbacks/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.success) {
      showToast(tr().feedbackDismissed);
      loadAdminFeedbacks();
    } else {
      alert(data.error || tr().dismissFailed);
    }
  } catch (err) {
    alert(tr().networkError);
  }
};


// ============================================================================
// V2 UI LAYER — topbar, filter bar, flat card grid, modal workbench, Try it,
// particle field, admin users/admins/settings, infographics and token auth.
// Everything below is declared with hoisted functions or evaluated before
// DOMContentLoaded, so initApp() can rely on it.
// ============================================================================

// ---------------------------------------------------------------------------
// i18n extension: merged into uiTranslations so existing lookups (t.key) see
// the new, shorter sentence-case copy. Product names stay English everywhere.
// ---------------------------------------------------------------------------
const uiTranslationsV2 = {
  en: {
    brandName: "GE Adoption Hub",
    adminBrandText: "Admin console",
    searchPlaceholder: "Search playbooks",
    themeToggle: "Toggle theme",
    avatarMenu: "Account menu",
    btnChangeContextText: "Switch profile",
    btnLogoutText: "Log out",
    btnAdminLogoutText: "Log out",
    goAdminPortal: "Admin portal",
    btnAdminBackToPortalText: "Learning portal",
    adminPreviewContext: "Admin preview",
    filterCategoryLabel: "Category",
    catAll: "All categories",
    catAcademic: "Academic",
    catStudent: "Student support",
    catOperational: "Operations",
    catAdmin: "Administration",
    filterFeatureLabel: "GE feature",
    featAll: "All GE features",
    filterCollectionLabel: "Collection",
    colAll: "All playbooks",
    colLiked: "Liked",
    filterSortLabel: "Sort",
    sortPopular: "Most popular",
    sortNewest: "Newest",
    sortAz: "A–Z",
    resultsHeadline: "{n} playbooks for {role}",
    resultsHeadlineOne: "1 playbook for {role}",
    allRoles: "all roles",
    rolesPlural: {
      "Lecturer": "lecturers", "TA": "teaching assistants", "Student": "students",
      "Program Leader": "program leaders", "Dean": "deans", "IT Admin": "IT admins",
      "SAO": "student affairs staff", "Security": "security officers", "Finance": "finance staff"
    },
    noUseCasesTitle: "No playbooks match",
    noUseCasesDesc: "Try a different search or filter.",
    btnResetFilters: "Clear filters",
    likeLabel: "Like",
    likedToast: "Added to liked",
    unlikedToast: "Removed from liked",
    newLabel: "New",
    updatedLabel: "Updated",
    operationalSteps: "How it works",
    step1Title: "Set up",
    step2Title: "Run the prompt",
    step3Title: "Review and share",
    helperHeading: "No materials yet? Start here",
    fillVariablesTitle: "Fill in the variables",
    samplePrompt: "Sample prompt",
    copyPrompt: "Copy prompt",
    copyHelperPrompt: "Copy prompt",
    copied: "Copied",
    tryIt: "Try it",
    promptCopiedSuccess: "Prompt copied",
    tryCopiedPaste: "Prompt copied. Paste it into Gemini Enterprise.",
    tryLongCopied: "Prompt also copied, in case the link cuts it short.",
    tryFillFirst: "Fill in the variables first, or click Try it again to continue.",
    noVariables: "This prompt runs as is.",
    infographicOpen: "Open infographic in a new tab",
    adoptionProTip: "Pro tip",
    manualTipTitle: "No connector? Upload files instead",
    manualTipText: "Attach your files, rubrics or notes in the Gemini chat to get the same result.",
    setupGuideSuffix: "setup",
    promptTypes: {
      general: "General query", notebooklm: "NotebookLM", deep_research: "Deep Research",
      agent_designer: "Agent Designer", canvas: "Canvas Mode", image: "Image Generation", video: "Video Generation"
    },
    forgotPassword: "Forgot password?",
    forgotTitle: "Reset your password",
    forgotDesc: "Enter your admin email.",
    forgotSubmit: "Send reset link",
    forgotDone: "If this is a verified admin email, a reset link is on its way. Otherwise, contact your portal admin.",
    backToSignIn: "Back to sign in",
    setPwTitleVerify: "Set your password",
    setPwTitleReset: "Choose a new password",
    setPwDesc: "At least 8 characters.",
    setPwLabel: "New password",
    setPwConfirmLabel: "Confirm password",
    setPwSubmit: "Save password",
    pwTooShort: "Use at least 8 characters.",
    feedbackEmpty: "No feedback yet.",
    smtpPasswordReenter: "Re-enter the password.",
    adminLabelTotalTries: "Tries",
    pwMismatch: "Passwords don't match.",
    tokenInvalid: "This link is invalid or has expired.",
    networkError: "Can't reach the server. Try again.",
    pwSaved: "Password saved",
    adminTabUsersText: "Users",
    adminTabAnalyticsText: "Analytics",
    adminTabCasesText: "Use cases",
    adminTabFeedbacksText: "Feedback",
    adminTabSettingsText: "Settings",
    adminProvisionTitle: "Add users",
    adminProvisionDesc: "Separate emails with commas. Users set their own password on first sign-in.",
    adminProvisionLabelEmail: "Emails",
    adminBtnProvision: "Add users",
    usersAdded: "{n} added",
    usersSkipped: "Already registered: {list}",
    usersFailed: "Failed: {list}",
    tempPasswordLabel: "Temporary password",
    adminsTitle: "Admins",
    adminsDesc: "Invite people to manage this portal.",
    inviteEmailLabel: "Email",
    inviteRoleLabel: "Role",
    roleSuper: "Super admin",
    roleAssist: "Assistant admin",
    sendInvite: "Send invite",
    invitePreview: "Email isn't set up, so share this link yourself:",
    copy: "Copy",
    statusInviteSent: "Invite sent",
    statusActive: "Active",
    resend: "Resend",
    remove: "Remove",
    invitedBy: "Invited by",
    adminsEmpty: "No invited admins yet.",
    confirmRemoveAdmin: "Remove {email} as an admin?",
    inviteSentToast: "Invite sent",
    resentToast: "Invite resent",
    removedToast: "Admin removed",
    adminRegisteredUsersTitle: "Users",
    adminThUserEmail: "Email",
    adminThGeLink: "GE app link",
    adminThPasswordStatus: "Status",
    adminThCreatedDate: "Created",
    adminThAdminActions: "Actions",
    notSet: "Not set",
    statusTemp: "Pending first sign-in",
    edit: "Edit",
    view: "View",
    revoke: "Revoke",
    deleteLabel: "Delete",
    usersEmpty: "No users yet.",
    loading: "Loading…",
    confirmRevoke: "Revoke access for {email}?",
    userRevoked: "User removed",
    editUserTitle: "Edit user",
    geLinkLabel: "GE app link",
    geLinkHint: "Opens prompts directly in this user's Gemini Enterprise app.",
    geLinkInvalid: "Use a link that starts with https://",
    emailInvalid: "Enter a valid email.",
    resetAccess: "Reset access",
    resetAccessDesc: "Creates a new temporary password.",
    confirmReset: "Create a new temporary password for {email}?",
    save: "Save",
    cancel: "Cancel",
    userSaved: "User saved",
    saveFailed: "Couldn't save. Try again.",
    adminCrudTitle: "Use cases",
    adminBtnExportText: "Export JSON",
    adminBtnImportText: "Import JSON",
    adminBtnCreateCaseText: "Add use case",
    adminCrudThId: "ID",
    adminCrudThTitle: "Title",
    adminCrudThCategory: "Category",
    adminCrudThRole: "Role",
    adminCrudThActions: "Actions",
    adminCrudThInfographic: "Infographic",
    none: "None",
    generate: "Generate",
    regenerate: "Regenerate",
    generating: "Generating…",
    generateMissing: "Generate missing",
    genMissingProgress: "Generating infographics. This can take a few minutes.",
    genMissingDone: "{ok} generated, {fail} failed",
    genMissingNone: "Every use case already has an infographic.",
    infographicDone: "Infographic ready",
    infographicFailed: "Couldn't generate the infographic",
    formPromptTypeLabel: "Prompt type",
    formInfographicLabel: "Infographic",
    adminFeedbackTitle: "Feedback",
    fbThAuthor: "From",
    fbThContent: "Feedback",
    fbThDate: "Submitted",
    adminLabelTotalUsers: "Users",
    adminLabelTotalUseCases: "Use cases",
    adminLabelTotalLikes: "Likes",
    adminChartTitle: "6-month adoption",
    adminChartDesc: "Views, likes and Try it launches.",
    adminLabelViewsLegend: "Views",
    adminLabelLikesLegend: "Likes",
    settingsEmailTitle: "Email",
    settingsEmailDesc: "Used for admin invites and password resets.",
    smtpPreset: "Provider",
    presetGmail: "Gmail",
    presetOutlook: "Outlook.com",
    presetM365: "Microsoft 365",
    presetCustom: "Custom",
    hintGmail: "Use an App Password (needs 2-Step Verification).",
    hintOutlook: "Use an app password from your Microsoft account.",
    hintM365: "Your tenant admin must enable SMTP AUTH for this mailbox.",
    smtpHost: "SMTP host",
    smtpPort: "Port",
    smtpSecurity: "Security",
    secStarttls: "STARTTLS",
    secSsl: "SSL/TLS",
    secNone: "None",
    secNoneWarn: "Without encryption, your password is sent in plain text.",
    smtpUser: "Username",
    smtpPassword: "Password",
    smtpPasswordSaved: "Saved. Leave blank to keep it.",
    smtpFromName: "From name",
    smtpFromEmail: "From email",
    smtpEnabled: "Send emails",
    statusConnected: "Connected",
    statusNotTested: "Not tested",
    statusFailed: "Failed",
    statusDemo: "Demo mode",
    lastChanged: "Last changed by {by} · {date}",
    testTo: "Send test to",
    sendTest: "Send test email",
    saveSettings: "Save",
    testSending: "Sending…",
    testOk: "Test email sent.",
    settingsSaved: "Email settings saved",
    settingsLoadFailed: "Couldn't load email settings.",
    hostRequired: "Enter the SMTP host.",
    portInvalid: "Enter a port from 1 to 65535."
  },
  "zh-TW": {
    brandName: "GE Adoption Hub",
    adminBrandText: "管理主控台",
    searchPlaceholder: "搜尋案例",
    themeToggle: "切換主題",
    avatarMenu: "帳戶選單",
    btnChangeContextText: "切換身分",
    btnLogoutText: "登出",
    btnAdminLogoutText: "登出",
    goAdminPortal: "管理入口",
    btnAdminBackToPortalText: "學習入口",
    adminPreviewContext: "管理員預覽",
    filterCategoryLabel: "類別",
    catAll: "所有類別",
    catAcademic: "教學",
    catStudent: "學生支援",
    catOperational: "營運",
    catAdmin: "行政",
    filterFeatureLabel: "GE 功能",
    featAll: "所有 GE 功能",
    filterCollectionLabel: "收藏",
    colAll: "所有案例",
    colLiked: "已按讚",
    filterSortLabel: "排序",
    sortPopular: "最受歡迎",
    sortNewest: "最新",
    sortAz: "名稱 A–Z",
    resultsHeadline: "{n} 個適合{role}的案例",
    resultsHeadlineOne: "1 個適合{role}的案例",
    allRoles: "所有角色",
    rolesPlural: {
      "Lecturer": "講師", "TA": "助教", "Student": "學生",
      "Program Leader": "課程主任", "Dean": "院長", "IT Admin": "IT 管理員",
      "SAO": "學生事務人員", "Security": "保安人員", "Finance": "財務人員"
    },
    noUseCasesTitle: "沒有符合的案例",
    noUseCasesDesc: "試試其他搜尋或篩選條件。",
    btnResetFilters: "清除篩選",
    likeLabel: "讚好",
    likedToast: "已加入讚好",
    unlikedToast: "已移除讚好",
    newLabel: "新",
    updatedLabel: "已更新",
    operationalSteps: "運作方式",
    step1Title: "準備",
    step2Title: "執行提示詞",
    step3Title: "審閱與分享",
    helperHeading: "還沒有資料？從這裡開始",
    fillVariablesTitle: "填寫變數",
    samplePrompt: "範例提示詞",
    copyPrompt: "複製提示詞",
    copyHelperPrompt: "複製提示詞",
    copied: "已複製",
    tryIt: "立即試用",
    promptCopiedSuccess: "已複製提示詞",
    tryCopiedPaste: "已複製提示詞，請貼到 Gemini Enterprise。",
    tryLongCopied: "提示詞也已複製，以防連結截斷內容。",
    tryFillFirst: "請先填寫變數，或再按一次「立即試用」繼續。",
    noVariables: "此提示詞可直接使用。",
    infographicOpen: "在新分頁開啟資訊圖表",
    adoptionProTip: "實用提示",
    manualTipTitle: "沒有連接器？改為上傳檔案",
    manualTipText: "在 Gemini 對話中附上檔案、評分準則或筆記，即可得到相同結果。",
    setupGuideSuffix: "設定",
    promptTypes: {
      general: "一般查詢", notebooklm: "NotebookLM", deep_research: "Deep Research",
      agent_designer: "Agent Designer", canvas: "Canvas Mode", image: "Image Generation", video: "Video Generation"
    },
    forgotPassword: "忘記密碼？",
    forgotTitle: "重設密碼",
    forgotDesc: "輸入你的管理員電郵。",
    forgotSubmit: "傳送重設連結",
    forgotDone: "如果這是已驗證的管理員電郵，重設連結即將寄出。否則請聯絡入口網站管理員。",
    backToSignIn: "返回登入",
    setPwTitleVerify: "設定密碼",
    setPwTitleReset: "設定新密碼",
    setPwDesc: "至少 8 個字元。",
    setPwLabel: "新密碼",
    setPwConfirmLabel: "確認密碼",
    setPwSubmit: "儲存密碼",
    pwTooShort: "請使用至少 8 個字元。",
    feedbackEmpty: "尚未有意見回饋。",
    smtpPasswordReenter: "請重新輸入密碼。",
    adminLabelTotalTries: "試用次數",
    pwMismatch: "兩次輸入的密碼不一致。",
    tokenInvalid: "此連結無效或已過期。",
    networkError: "無法連線到伺服器，請再試一次。",
    pwSaved: "已儲存密碼",
    adminTabUsersText: "使用者",
    adminTabAnalyticsText: "分析",
    adminTabCasesText: "案例",
    adminTabFeedbacksText: "意見回饋",
    adminTabSettingsText: "設定",
    adminProvisionTitle: "新增使用者",
    adminProvisionDesc: "以逗號分隔電郵。使用者首次登入時會自行設定密碼。",
    adminProvisionLabelEmail: "電郵",
    adminBtnProvision: "新增使用者",
    usersAdded: "已新增 {n} 位",
    usersSkipped: "已註冊：{list}",
    usersFailed: "失敗：{list}",
    tempPasswordLabel: "臨時密碼",
    adminsTitle: "管理員",
    adminsDesc: "邀請他人管理此入口網站。",
    inviteEmailLabel: "電郵",
    inviteRoleLabel: "角色",
    roleSuper: "超級管理員",
    roleAssist: "助理管理員",
    sendInvite: "傳送邀請",
    invitePreview: "電郵尚未設定，請自行分享此連結：",
    copy: "複製",
    statusInviteSent: "已傳送邀請",
    statusActive: "啟用中",
    resend: "重新傳送",
    remove: "移除",
    invitedBy: "邀請者",
    adminsEmpty: "尚未邀請任何管理員。",
    confirmRemoveAdmin: "要移除管理員 {email} 嗎？",
    inviteSentToast: "已傳送邀請",
    resentToast: "已重新傳送邀請",
    removedToast: "已移除管理員",
    adminRegisteredUsersTitle: "使用者",
    adminThUserEmail: "電郵",
    adminThGeLink: "GE 應用程式連結",
    adminThPasswordStatus: "狀態",
    adminThCreatedDate: "建立日期",
    adminThAdminActions: "操作",
    notSet: "未設定",
    statusTemp: "等待首次登入",
    edit: "編輯",
    view: "檢視",
    revoke: "撤銷",
    deleteLabel: "刪除",
    usersEmpty: "尚無使用者。",
    loading: "載入中…",
    confirmRevoke: "要撤銷 {email} 的存取權嗎？",
    userRevoked: "已移除使用者",
    editUserTitle: "編輯使用者",
    geLinkLabel: "GE 應用程式連結",
    geLinkHint: "直接在此使用者的 Gemini Enterprise 應用程式中開啟提示詞。",
    geLinkInvalid: "請使用以 https:// 開頭的連結",
    emailInvalid: "請輸入有效的電郵。",
    resetAccess: "重設存取權",
    resetAccessDesc: "建立新的臨時密碼。",
    confirmReset: "要為 {email} 建立新的臨時密碼嗎？",
    save: "儲存",
    cancel: "取消",
    userSaved: "已儲存使用者",
    saveFailed: "無法儲存，請再試一次。",
    adminCrudTitle: "案例",
    adminBtnExportText: "匯出 JSON",
    adminBtnImportText: "匯入 JSON",
    adminBtnCreateCaseText: "新增案例",
    adminCrudThId: "ID",
    adminCrudThTitle: "標題",
    adminCrudThCategory: "類別",
    adminCrudThRole: "角色",
    adminCrudThActions: "操作",
    adminCrudThInfographic: "資訊圖表",
    none: "無",
    generate: "產生",
    regenerate: "重新產生",
    generating: "產生中…",
    generateMissing: "產生缺少的圖表",
    genMissingProgress: "正在產生資訊圖表，可能需要幾分鐘。",
    genMissingDone: "已產生 {ok} 個，失敗 {fail} 個",
    genMissingNone: "所有案例都已有資訊圖表。",
    infographicDone: "資訊圖表已完成",
    infographicFailed: "無法產生資訊圖表",
    formPromptTypeLabel: "提示詞類型",
    formInfographicLabel: "資訊圖表",
    adminFeedbackTitle: "意見回饋",
    fbThAuthor: "提交者",
    fbThContent: "意見",
    fbThDate: "提交時間",
    adminLabelTotalUsers: "使用者",
    adminLabelTotalUseCases: "案例",
    adminLabelTotalLikes: "讚好",
    adminChartTitle: "6 個月採用情況",
    adminChartDesc: "瀏覽、讚好與部署。",
    adminLabelViewsLegend: "瀏覽",
    adminLabelLikesLegend: "讚好",
    settingsEmailTitle: "電郵",
    settingsEmailDesc: "用於管理員邀請及密碼重設。",
    smtpPreset: "服務供應商",
    presetGmail: "Gmail",
    presetOutlook: "Outlook.com",
    presetM365: "Microsoft 365",
    presetCustom: "自訂",
    hintGmail: "請使用應用程式密碼（需啟用兩步驟驗證）。",
    hintOutlook: "請使用 Microsoft 帳戶的應用程式密碼。",
    hintM365: "租用戶管理員必須為此信箱啟用 SMTP AUTH。",
    smtpHost: "SMTP 主機",
    smtpPort: "連接埠",
    smtpSecurity: "安全性",
    secStarttls: "STARTTLS",
    secSsl: "SSL/TLS",
    secNone: "無",
    secNoneWarn: "未加密時，密碼會以純文字傳送。",
    smtpUser: "使用者名稱",
    smtpPassword: "密碼",
    smtpPasswordSaved: "已儲存。留空即保留原密碼。",
    smtpFromName: "寄件者名稱",
    smtpFromEmail: "寄件者電郵",
    smtpEnabled: "傳送電郵",
    statusConnected: "已連線",
    statusNotTested: "尚未測試",
    statusFailed: "失敗",
    statusDemo: "示範模式",
    lastChanged: "最後由 {by} 於 {date} 修改",
    testTo: "測試收件者",
    sendTest: "傳送測試電郵",
    saveSettings: "儲存",
    testSending: "傳送中…",
    testOk: "已傳送測試電郵。",
    settingsSaved: "已儲存電郵設定",
    settingsLoadFailed: "無法載入電郵設定。",
    hostRequired: "請輸入 SMTP 主機。",
    portInvalid: "請輸入 1 至 65535 的連接埠。"
  },
  "zh-CN": {
    brandName: "GE Adoption Hub",
    adminBrandText: "管理控制台",
    searchPlaceholder: "搜索案例",
    themeToggle: "切换主题",
    avatarMenu: "账户菜单",
    btnChangeContextText: "切换身份",
    btnLogoutText: "退出登录",
    btnAdminLogoutText: "退出登录",
    goAdminPortal: "管理入口",
    btnAdminBackToPortalText: "学习入口",
    adminPreviewContext: "管理员预览",
    filterCategoryLabel: "类别",
    catAll: "所有类别",
    catAcademic: "教学",
    catStudent: "学生支持",
    catOperational: "运营",
    catAdmin: "行政",
    filterFeatureLabel: "GE 功能",
    featAll: "所有 GE 功能",
    filterCollectionLabel: "收藏",
    colAll: "所有案例",
    colLiked: "已点赞",
    filterSortLabel: "排序",
    sortPopular: "最受欢迎",
    sortNewest: "最新",
    sortAz: "名称 A–Z",
    resultsHeadline: "{n} 个适合{role}的案例",
    resultsHeadlineOne: "1 个适合{role}的案例",
    allRoles: "所有角色",
    rolesPlural: {
      "Lecturer": "讲师", "TA": "助教", "Student": "学生",
      "Program Leader": "课程主任", "Dean": "院长", "IT Admin": "IT 管理员",
      "SAO": "学生事务人员", "Security": "保安人员", "Finance": "财务人员"
    },
    noUseCasesTitle: "没有符合的案例",
    noUseCasesDesc: "试试其他搜索或筛选条件。",
    btnResetFilters: "清除筛选",
    likeLabel: "点赞",
    likedToast: "已加入点赞",
    unlikedToast: "已取消点赞",
    newLabel: "新",
    updatedLabel: "已更新",
    operationalSteps: "运作方式",
    step1Title: "准备",
    step2Title: "运行提示词",
    step3Title: "审阅与分享",
    helperHeading: "还没有资料？从这里开始",
    fillVariablesTitle: "填写变量",
    samplePrompt: "示例提示词",
    copyPrompt: "复制提示词",
    copyHelperPrompt: "复制提示词",
    copied: "已复制",
    tryIt: "立即试用",
    promptCopiedSuccess: "已复制提示词",
    tryCopiedPaste: "已复制提示词，请粘贴到 Gemini Enterprise。",
    tryLongCopied: "提示词也已复制，以防链接截断内容。",
    tryFillFirst: "请先填写变量，或再点一次“立即试用”继续。",
    noVariables: "此提示词可直接使用。",
    infographicOpen: "在新标签页打开信息图",
    adoptionProTip: "实用提示",
    manualTipTitle: "没有连接器？改为上传文件",
    manualTipText: "在 Gemini 对话中附上文件、评分标准或笔记，即可得到相同结果。",
    setupGuideSuffix: "设置",
    promptTypes: {
      general: "一般查询", notebooklm: "NotebookLM", deep_research: "Deep Research",
      agent_designer: "Agent Designer", canvas: "Canvas Mode", image: "Image Generation", video: "Video Generation"
    },
    forgotPassword: "忘记密码？",
    forgotTitle: "重置密码",
    forgotDesc: "输入你的管理员邮箱。",
    forgotSubmit: "发送重置链接",
    forgotDone: "如果这是已验证的管理员邮箱，重置链接即将发出。否则请联系门户管理员。",
    backToSignIn: "返回登录",
    setPwTitleVerify: "设置密码",
    setPwTitleReset: "设置新密码",
    setPwDesc: "至少 8 个字符。",
    setPwLabel: "新密码",
    setPwConfirmLabel: "确认密码",
    setPwSubmit: "保存密码",
    pwTooShort: "请使用至少 8 个字符。",
    feedbackEmpty: "暂无反馈。",
    smtpPasswordReenter: "请重新输入密码。",
    adminLabelTotalTries: "试用次数",
    pwMismatch: "两次输入的密码不一致。",
    tokenInvalid: "此链接无效或已过期。",
    networkError: "无法连接到服务器，请重试。",
    pwSaved: "已保存密码",
    adminTabUsersText: "用户",
    adminTabAnalyticsText: "分析",
    adminTabCasesText: "案例",
    adminTabFeedbacksText: "反馈",
    adminTabSettingsText: "设置",
    adminProvisionTitle: "添加用户",
    adminProvisionDesc: "用逗号分隔邮箱。用户首次登录时会自行设置密码。",
    adminProvisionLabelEmail: "邮箱",
    adminBtnProvision: "添加用户",
    usersAdded: "已添加 {n} 位",
    usersSkipped: "已注册：{list}",
    usersFailed: "失败：{list}",
    tempPasswordLabel: "临时密码",
    adminsTitle: "管理员",
    adminsDesc: "邀请他人管理此门户。",
    inviteEmailLabel: "邮箱",
    inviteRoleLabel: "角色",
    roleSuper: "超级管理员",
    roleAssist: "助理管理员",
    sendInvite: "发送邀请",
    invitePreview: "邮件尚未设置，请自行分享此链接：",
    copy: "复制",
    statusInviteSent: "已发送邀请",
    statusActive: "已启用",
    resend: "重新发送",
    remove: "移除",
    invitedBy: "邀请人",
    adminsEmpty: "尚未邀请任何管理员。",
    confirmRemoveAdmin: "要移除管理员 {email} 吗？",
    inviteSentToast: "已发送邀请",
    resentToast: "已重新发送邀请",
    removedToast: "已移除管理员",
    adminRegisteredUsersTitle: "用户",
    adminThUserEmail: "邮箱",
    adminThGeLink: "GE 应用链接",
    adminThPasswordStatus: "状态",
    adminThCreatedDate: "创建日期",
    adminThAdminActions: "操作",
    notSet: "未设置",
    statusTemp: "等待首次登录",
    edit: "编辑",
    view: "查看",
    revoke: "撤销",
    deleteLabel: "删除",
    usersEmpty: "暂无用户。",
    loading: "加载中…",
    confirmRevoke: "要撤销 {email} 的访问权限吗？",
    userRevoked: "已移除用户",
    editUserTitle: "编辑用户",
    geLinkLabel: "GE 应用链接",
    geLinkHint: "直接在此用户的 Gemini Enterprise 应用中打开提示词。",
    geLinkInvalid: "请使用以 https:// 开头的链接",
    emailInvalid: "请输入有效的邮箱。",
    resetAccess: "重置访问权限",
    resetAccessDesc: "创建新的临时密码。",
    confirmReset: "要为 {email} 创建新的临时密码吗？",
    save: "保存",
    cancel: "取消",
    userSaved: "已保存用户",
    saveFailed: "无法保存，请重试。",
    adminCrudTitle: "案例",
    adminBtnExportText: "导出 JSON",
    adminBtnImportText: "导入 JSON",
    adminBtnCreateCaseText: "添加案例",
    adminCrudThId: "ID",
    adminCrudThTitle: "标题",
    adminCrudThCategory: "类别",
    adminCrudThRole: "角色",
    adminCrudThActions: "操作",
    adminCrudThInfographic: "信息图",
    none: "无",
    generate: "生成",
    regenerate: "重新生成",
    generating: "生成中…",
    generateMissing: "生成缺少的信息图",
    genMissingProgress: "正在生成信息图，可能需要几分钟。",
    genMissingDone: "已生成 {ok} 个，失败 {fail} 个",
    genMissingNone: "所有案例都已有信息图。",
    infographicDone: "信息图已完成",
    infographicFailed: "无法生成信息图",
    formPromptTypeLabel: "提示词类型",
    formInfographicLabel: "信息图",
    adminFeedbackTitle: "反馈",
    fbThAuthor: "提交者",
    fbThContent: "反馈",
    fbThDate: "提交时间",
    adminLabelTotalUsers: "用户",
    adminLabelTotalUseCases: "案例",
    adminLabelTotalLikes: "点赞",
    adminChartTitle: "6 个月采用情况",
    adminChartDesc: "浏览、点赞与部署。",
    adminLabelViewsLegend: "浏览",
    adminLabelLikesLegend: "点赞",
    settingsEmailTitle: "邮件",
    settingsEmailDesc: "用于管理员邀请及密码重置。",
    smtpPreset: "服务提供商",
    presetGmail: "Gmail",
    presetOutlook: "Outlook.com",
    presetM365: "Microsoft 365",
    presetCustom: "自定义",
    hintGmail: "请使用应用专用密码（需启用两步验证）。",
    hintOutlook: "请使用 Microsoft 账户的应用密码。",
    hintM365: "租户管理员必须为此邮箱启用 SMTP AUTH。",
    smtpHost: "SMTP 主机",
    smtpPort: "端口",
    smtpSecurity: "安全性",
    secStarttls: "STARTTLS",
    secSsl: "SSL/TLS",
    secNone: "无",
    secNoneWarn: "未加密时，密码会以明文发送。",
    smtpUser: "用户名",
    smtpPassword: "密码",
    smtpPasswordSaved: "已保存。留空即保留原密码。",
    smtpFromName: "发件人名称",
    smtpFromEmail: "发件人邮箱",
    smtpEnabled: "发送邮件",
    statusConnected: "已连接",
    statusNotTested: "尚未测试",
    statusFailed: "失败",
    statusDemo: "演示模式",
    lastChanged: "最后由 {by} 于 {date} 修改",
    testTo: "测试收件人",
    sendTest: "发送测试邮件",
    saveSettings: "保存",
    testSending: "发送中…",
    testOk: "已发送测试邮件。",
    settingsSaved: "已保存邮件设置",
    settingsLoadFailed: "无法加载邮件设置。",
    hostRequired: "请输入 SMTP 主机。",
    portInvalid: "请输入 1 至 65535 的端口。"
  }
};
Object.keys(uiTranslationsV2).forEach(lang => {
  if (uiTranslations[lang]) Object.assign(uiTranslations[lang], uiTranslationsV2[lang]);
});

// ---------------------------------------------------------------------------
// i18n cleanup layer: copy that used to be hard-coded English in index.html /
// app.js (sign-in, temp password reset, case form, Gemini diff viewer,
// feedback widget, import/export dialogs). Also shortens the legacy case-form
// labels to sentence case. Merged last so it wins over the legacy tables.
// ---------------------------------------------------------------------------
const uiTranslationsV3 = {
  en: {
    // Sign-in
    loginSubtitle: "Education adoption & playbook portal",
    loginDesc: "Prompt templates and guides for your school role.",
    loginPasswordLabel: "Password",
    btnLoginText: "Sign in",
    loginFieldsRequired: "Enter your email and password.",
    loginSuccess: "Signed in. Loading…",
    loginInvalid: "Wrong email or password.",
    loggedOut: "Signed out",
    // Temporary password reset
    tempResetTitle: "Set a new password",
    tempResetDesc: "You signed in with a temporary password. Choose your own to continue.",
    pwPlaceholderMin: "At least 8 characters",
    pwPlaceholderRepeat: "Re-enter password",
    btnSubmitResetText: "Save and continue",
    pwUpdated: "Password updated",
    pwUpdateFailed: "Couldn't update password.",
    workspaceReady: "Workspace ready",
    // Analytics leaderboard
    leaderboardTitle: "Most popular playbooks",
    leaderboardDesc: "Ranked by likes.",
    // Import / export
    exportSelectFirst: "Select at least one use case to export.",
    importEmpty: "This file has no playbooks.",
    importConfirmOverwrite: "\"{id}\" already exists. Replace it?",
    importDone: "Import complete\n\nAdded: {created}\nReplaced: {updated}\nSkipped: {skipped}",
    importFailed: "Couldn't import. Choose a valid playbook JSON file.",
    // Case form
    caseFormEditTitle: "Edit playbook: {title}",
    caseFormCreateTitle: "New playbook",
    adminFormLabelGeminiPromptTitle: "Draft or refine with Gemini",
    adminFormLabelGeminiPromptDesc: "Describe what to create or change. Gemini drafts the steps, prompt, tip and translations.",
    caseFormDraftPlaceholder: "e.g. A Canvas Mode rubric for high school chemistry lab reports",
    caseFormDraftBtn: "Draft with Gemini",
    caseFormDraftBtnTitle: "Draft with Gemini 3.5 Flash",
    drafting: "Drafting…",
    adminFormLabelId: "ID (can't change later)",
    adminFormLabelCategory: "Category",
    adminFormLabelTitle: "Title",
    adminFormLabelRole: "Role",
    adminFormLabelSummary: "Summary",
    adminFormLabelFeatures: "GE features",
    adminFormLabelConnectors: "Connectors",
    adminFormLabelLevel: "School levels",
    adminFormLabelSteps: "Steps (one per line)",
    adminFormLabelPrompt: "Prompt",
    adminFormLabelProTip: "Pro tip",
    adminFormLabelZhtwHeader: "Traditional Chinese (繁體中文)",
    adminFormLabelZhcnHeader: "Simplified Chinese (简体中文)",
    adminFormLabelZhtwTitle: "Title", adminFormLabelZhcnTitle: "Title",
    adminFormLabelZhtwSummary: "Summary", adminFormLabelZhcnSummary: "Summary",
    adminFormLabelZhtwSteps: "Steps (one per line)", adminFormLabelZhcnSteps: "Steps (one per line)",
    adminFormLabelZhtwPrompt: "Prompt", adminFormLabelZhcnPrompt: "Prompt",
    adminFormLabelZhtwProTip: "Pro tip", adminFormLabelZhcnProTip: "Pro tip",
    btnAdminFormCancel: "Cancel",
    btnAdminFormSave: "Save",
    levelUni: "University & college",
    levelHigh: "High school",
    levelPrimary: "Primary school",
    levelGeneric: "Any level",
    caseFormTitlePh: "e.g. Chemistry lab safety agent",
    caseFormSummaryPh: "1–2 sentences on the outcome",
    caseFormStepsPh: "Upload materials to NotebookLM…",
    caseFormPromptPh: "You are the class AI assistant…",
    caseFormProTipPh: "Grounding the agent reduces hallucinations…",
    caseFormRequired: "ID, title, category and role are required.",
    caseAssistReadonly: "Assistant admins can't edit playbooks.",
    caseUpdated: "Playbook updated",
    caseCreated: "Playbook added",
    caseSaveFailed: "Couldn't save. Check the ID is unique.",
    caseDeleted: "Playbook deleted",
    confirmDeleteCase: "Delete \"{id}\"? This can't be undone.",
    draftNeedInput: "Add a title or instructions first.",
    draftFailed: "Gemini couldn't draft this playbook.",
    draftError: "Drafting failed: {msg}",
    draftDone: "Draft ready. Review and save.",
    draftingTitle: "Gemini is drafting…",
    draftingDesc: "Writing steps, prompt and translations.",
    // Gemini diff viewer
    diffTitle: "Review Gemini changes",
    diffIntro: "Gemini 3.5 Flash suggested the changes below.",
    diffCurrent: "Current",
    diffProposed: "Suggested",
    diffReject: "Keep current",
    diffAccept: "Apply suggestions",
    diffChanged: "Changed",
    diffNone: "(none)",
    diffApplied: "Suggestions applied",
    diffDeclined: "Kept current version",
    langNameEn: "English",
    langNameZhTw: "Traditional Chinese",
    langNameZhCn: "Simplified Chinese",
    // Feedback widget
    feedbackBtn: "Feedback",
    feedbackTitle: "Share feedback",
    feedbackDesc: "Tell us what would make this portal more useful. Admins read every note.",
    feedbackLabel: "Your feedback",
    feedbackPlaceholder: "What would you like to see?",
    feedbackSubmit: "Send",
    feedbackThanks: "Thanks for your feedback!",
    feedbackFailed: "Couldn't send feedback.",
    confirmDismissFeedback: "Dismiss this feedback?",
    feedbackDismissed: "Feedback dismissed",
    dismissFailed: "Couldn't dismiss feedback.",
    closeLabel: "Close"
  },
  "zh-TW": {
    loginSubtitle: "教育導入與案例入口網站",
    loginDesc: "依您的學校角色提供提示詞範本與操作指南。",
    loginPasswordLabel: "密碼",
    btnLoginText: "登入",
    loginFieldsRequired: "請輸入電郵和密碼。",
    loginSuccess: "已登入，載入中…",
    loginInvalid: "電郵或密碼錯誤。",
    loggedOut: "已登出",
    tempResetTitle: "設定新密碼",
    tempResetDesc: "您正以臨時密碼登入，請設定自己的密碼以繼續。",
    pwPlaceholderMin: "至少 8 個字元",
    pwPlaceholderRepeat: "再次輸入密碼",
    btnSubmitResetText: "儲存並繼續",
    pwUpdated: "密碼已更新",
    pwUpdateFailed: "無法更新密碼。",
    workspaceReady: "工作區已就緒",
    leaderboardTitle: "最受歡迎的案例",
    leaderboardDesc: "按讚好數排序。",
    exportSelectFirst: "請至少選擇一個案例以匯出。",
    importEmpty: "此檔案沒有任何案例。",
    importConfirmOverwrite: "「{id}」已存在，要取代嗎？",
    importDone: "匯入完成\n\n新增：{created}\n取代：{updated}\n略過：{skipped}",
    importFailed: "無法匯入，請選擇有效的案例 JSON 檔案。",
    caseFormEditTitle: "編輯案例：{title}",
    caseFormCreateTitle: "新增案例",
    adminFormLabelGeminiPromptTitle: "使用 Gemini 草擬或優化",
    adminFormLabelGeminiPromptDesc: "描述要建立或修改的內容，Gemini 會草擬步驟、提示詞、提示與翻譯。",
    caseFormDraftPlaceholder: "例如：以 Canvas Mode 為高中化學實驗報告製作評分量表",
    caseFormDraftBtn: "使用 Gemini 草擬",
    caseFormDraftBtnTitle: "使用 Gemini 3.5 Flash 草擬",
    drafting: "草擬中…",
    adminFormLabelId: "ID（建立後無法更改）",
    adminFormLabelCategory: "類別",
    adminFormLabelTitle: "標題",
    adminFormLabelRole: "角色",
    adminFormLabelSummary: "摘要",
    adminFormLabelFeatures: "GE 功能",
    adminFormLabelConnectors: "連接器",
    adminFormLabelLevel: "適用學校級別",
    adminFormLabelSteps: "步驟（每行一項）",
    adminFormLabelPrompt: "提示詞",
    adminFormLabelProTip: "實用提示",
    adminFormLabelZhtwHeader: "繁體中文翻譯",
    adminFormLabelZhcnHeader: "簡體中文翻譯",
    adminFormLabelZhtwTitle: "標題", adminFormLabelZhcnTitle: "標題",
    adminFormLabelZhtwSummary: "摘要", adminFormLabelZhcnSummary: "摘要",
    adminFormLabelZhtwSteps: "步驟（每行一項）", adminFormLabelZhcnSteps: "步驟（每行一項）",
    adminFormLabelZhtwPrompt: "提示詞", adminFormLabelZhcnPrompt: "提示詞",
    adminFormLabelZhtwProTip: "實用提示", adminFormLabelZhcnProTip: "實用提示",
    btnAdminFormCancel: "取消",
    btnAdminFormSave: "儲存",
    levelUni: "大專院校",
    levelHigh: "中學",
    levelPrimary: "小學",
    levelGeneric: "不限級別",
    caseFormTitlePh: "例如：化學實驗室安全 Agent",
    caseFormSummaryPh: "用 1–2 句說明成果",
    caseFormStepsPh: "將教材上傳到 NotebookLM…",
    caseFormPromptPh: "你是班級的 AI 助理…",
    caseFormProTipPh: "為 Agent 提供依據資料可減少幻覺…",
    caseFormRequired: "ID、標題、類別及角色為必填。",
    caseAssistReadonly: "助理管理員無法編輯案例。",
    caseUpdated: "已更新案例",
    caseCreated: "已新增案例",
    caseSaveFailed: "無法儲存，請確認 ID 沒有重複。",
    caseDeleted: "已刪除案例",
    confirmDeleteCase: "要刪除「{id}」嗎？此操作無法復原。",
    draftNeedInput: "請先輸入標題或指示。",
    draftFailed: "Gemini 無法草擬此案例。",
    draftError: "草擬失敗：{msg}",
    draftDone: "草稿已完成，請檢查後儲存。",
    draftingTitle: "Gemini 正在草擬…",
    draftingDesc: "正在撰寫步驟、提示詞與翻譯。",
    diffTitle: "檢視 Gemini 修改",
    diffIntro: "Gemini 3.5 Flash 建議了以下修改。",
    diffCurrent: "目前版本",
    diffProposed: "建議版本",
    diffReject: "保留目前版本",
    diffAccept: "套用建議",
    diffChanged: "已修改",
    diffNone: "（無）",
    diffApplied: "已套用建議",
    diffDeclined: "已保留目前版本",
    langNameEn: "英文",
    langNameZhTw: "繁體中文",
    langNameZhCn: "簡體中文",
    feedbackBtn: "意見回饋",
    feedbackTitle: "分享意見",
    feedbackDesc: "告訴我們如何讓入口網站更實用，管理員會閱讀每則意見。",
    feedbackLabel: "您的意見",
    feedbackPlaceholder: "您希望看到哪些功能？",
    feedbackSubmit: "送出",
    feedbackThanks: "感謝您的回饋！",
    feedbackFailed: "無法送出意見。",
    confirmDismissFeedback: "要移除此意見嗎？",
    feedbackDismissed: "已移除意見",
    dismissFailed: "無法移除意見。",
    closeLabel: "關閉"
  },
  "zh-CN": {
    loginSubtitle: "教育导入与案例门户",
    loginDesc: "按您的学校角色提供提示词模板与操作指南。",
    loginPasswordLabel: "密码",
    btnLoginText: "登录",
    loginFieldsRequired: "请输入邮箱和密码。",
    loginSuccess: "已登录，加载中…",
    loginInvalid: "邮箱或密码错误。",
    loggedOut: "已退出登录",
    tempResetTitle: "设置新密码",
    tempResetDesc: "您正在使用临时密码登录，请设置自己的密码以继续。",
    pwPlaceholderMin: "至少 8 个字符",
    pwPlaceholderRepeat: "再次输入密码",
    btnSubmitResetText: "保存并继续",
    pwUpdated: "密码已更新",
    pwUpdateFailed: "无法更新密码。",
    workspaceReady: "工作区已就绪",
    leaderboardTitle: "最受欢迎的案例",
    leaderboardDesc: "按点赞数排序。",
    exportSelectFirst: "请至少选择一个案例以导出。",
    importEmpty: "此文件没有任何案例。",
    importConfirmOverwrite: "“{id}”已存在，要替换吗？",
    importDone: "导入完成\n\n新增：{created}\n替换：{updated}\n跳过：{skipped}",
    importFailed: "无法导入，请选择有效的案例 JSON 文件。",
    caseFormEditTitle: "编辑案例：{title}",
    caseFormCreateTitle: "新增案例",
    adminFormLabelGeminiPromptTitle: "使用 Gemini 草拟或优化",
    adminFormLabelGeminiPromptDesc: "描述要创建或修改的内容，Gemini 会草拟步骤、提示词、提示与翻译。",
    caseFormDraftPlaceholder: "例如：用 Canvas Mode 为高中化学实验报告制作评分量表",
    caseFormDraftBtn: "使用 Gemini 草拟",
    caseFormDraftBtnTitle: "使用 Gemini 3.5 Flash 草拟",
    drafting: "草拟中…",
    adminFormLabelId: "ID（创建后无法更改）",
    adminFormLabelCategory: "类别",
    adminFormLabelTitle: "标题",
    adminFormLabelRole: "角色",
    adminFormLabelSummary: "摘要",
    adminFormLabelFeatures: "GE 功能",
    adminFormLabelConnectors: "连接器",
    adminFormLabelLevel: "适用学校级别",
    adminFormLabelSteps: "步骤（每行一项）",
    adminFormLabelPrompt: "提示词",
    adminFormLabelProTip: "实用提示",
    adminFormLabelZhtwHeader: "繁体中文翻译",
    adminFormLabelZhcnHeader: "简体中文翻译",
    adminFormLabelZhtwTitle: "标题", adminFormLabelZhcnTitle: "标题",
    adminFormLabelZhtwSummary: "摘要", adminFormLabelZhcnSummary: "摘要",
    adminFormLabelZhtwSteps: "步骤（每行一项）", adminFormLabelZhcnSteps: "步骤（每行一项）",
    adminFormLabelZhtwPrompt: "提示词", adminFormLabelZhcnPrompt: "提示词",
    adminFormLabelZhtwProTip: "实用提示", adminFormLabelZhcnProTip: "实用提示",
    btnAdminFormCancel: "取消",
    btnAdminFormSave: "保存",
    levelUni: "大专院校",
    levelHigh: "中学",
    levelPrimary: "小学",
    levelGeneric: "不限级别",
    caseFormTitlePh: "例如：化学实验室安全 Agent",
    caseFormSummaryPh: "用 1–2 句说明成果",
    caseFormStepsPh: "将教材上传到 NotebookLM…",
    caseFormPromptPh: "你是班级的 AI 助理…",
    caseFormProTipPh: "为 Agent 提供依据资料可减少幻觉…",
    caseFormRequired: "ID、标题、类别及角色为必填。",
    caseAssistReadonly: "助理管理员无法编辑案例。",
    caseUpdated: "已更新案例",
    caseCreated: "已新增案例",
    caseSaveFailed: "无法保存，请确认 ID 没有重复。",
    caseDeleted: "已删除案例",
    confirmDeleteCase: "要删除“{id}”吗？此操作无法撤销。",
    draftNeedInput: "请先输入标题或指示。",
    draftFailed: "Gemini 无法草拟此案例。",
    draftError: "草拟失败：{msg}",
    draftDone: "草稿已完成，请检查后保存。",
    draftingTitle: "Gemini 正在草拟…",
    draftingDesc: "正在撰写步骤、提示词与翻译。",
    diffTitle: "查看 Gemini 修改",
    diffIntro: "Gemini 3.5 Flash 建议了以下修改。",
    diffCurrent: "当前版本",
    diffProposed: "建议版本",
    diffReject: "保留当前版本",
    diffAccept: "应用建议",
    diffChanged: "已修改",
    diffNone: "（无）",
    diffApplied: "已应用建议",
    diffDeclined: "已保留当前版本",
    langNameEn: "英文",
    langNameZhTw: "繁体中文",
    langNameZhCn: "简体中文",
    feedbackBtn: "意见反馈",
    feedbackTitle: "分享意见",
    feedbackDesc: "告诉我们如何让门户更实用，管理员会阅读每条意见。",
    feedbackLabel: "您的意见",
    feedbackPlaceholder: "您希望看到哪些功能？",
    feedbackSubmit: "提交",
    feedbackThanks: "感谢您的反馈！",
    feedbackFailed: "无法提交意见。",
    confirmDismissFeedback: "要移除此意见吗？",
    feedbackDismissed: "已移除意见",
    dismissFailed: "无法移除意见。",
    closeLabel: "关闭"
  }
};
Object.keys(uiTranslationsV3).forEach(lang => {
  if (uiTranslations[lang]) Object.assign(uiTranslations[lang], uiTranslationsV3[lang]);
});

// V4: view counts (replace deployments), like error states, overview variables panel, admin views/tries
const uiTranslationsV4 = {
  en: {
    viewsLabel: "Views",
    viewCountTitle: "{n} views",
    likeFailed: "Couldn't save your like. Try again.",
    likeSessionExpired: "Your session has expired. Sign in again to like playbooks.",
    likeAdminPreview: "Likes are saved for user accounts. Sign in as a user to like playbooks.",
    fillVariablesHint: "Fill these once. They update every prompt below.",
    adminLabelTotalViews: "Views",
    adminLabelTriesLegend: "Try it",
    adminChartDesc: "Views, likes and Try it launches.",
    chartTipViews: "Views",
    chartTipLikes: "Likes",
    chartTipTries: "Try it"
  },
  "zh-TW": {
    viewsLabel: "瀏覽次數",
    viewCountTitle: "{n} 次瀏覽",
    likeFailed: "未能儲存讚好，請再試一次。",
    likeSessionExpired: "登入已逾時，請重新登入以讚好案例。",
    likeAdminPreview: "讚好只會儲存於使用者帳戶。請以使用者身分登入。",
    fillVariablesHint: "只需填寫一次，下方所有提示詞會同步更新。",
    adminLabelTotalViews: "瀏覽",
    adminLabelTriesLegend: "立即試用",
    adminChartDesc: "瀏覽、讚好與立即試用次數。",
    chartTipViews: "瀏覽",
    chartTipLikes: "讚好",
    chartTipTries: "立即試用"
  },
  "zh-CN": {
    viewsLabel: "浏览次数",
    viewCountTitle: "{n} 次浏览",
    likeFailed: "未能保存点赞，请重试。",
    likeSessionExpired: "登录已过期，请重新登录以点赞案例。",
    likeAdminPreview: "点赞只会保存于用户账户。请以用户身份登录。",
    fillVariablesHint: "只需填写一次，下方所有提示词会同步更新。",
    adminLabelTotalViews: "浏览",
    adminLabelTriesLegend: "立即试用",
    adminChartDesc: "浏览、点赞与立即试用次数。",
    chartTipViews: "浏览",
    chartTipLikes: "点赞",
    chartTipTries: "立即试用"
  }
};
Object.keys(uiTranslationsV4).forEach(lang => {
  if (uiTranslations[lang]) Object.assign(uiTranslations[lang], uiTranslationsV4[lang]);
});

// V6: Quest Run strip, Archie's news, admin News tab, academic calendar, case-form timing/hints
const uiTranslationsV6 = {
  en: {
    questStripTitle: "Quest Run",
    questOpenPlaybook: "Open playbook",
    questPause: "Pause tips",
    questResume: "Resume tips",
    questDismiss: "Dismiss",
    questCollapse: "Hide scene",
    questExpand: "Show scene",
    questHintKicker: "Quest · {phase}",
    questEmpty: "Pick a playbook below to start your quest.",
    questTimelineLabel: "Academic year",
    questPositionTemplate: "{term} · Week {week} · {phase}",
    questPositionBreak: "{term} · Week {week}",
    questTermFull: { semA: "Semester A", winter: "Winter break", semB: "Semester B", summer: "Summer" },
    questTermShort: { semA: "Sem A", winter: "Winter", semB: "Sem B", summer: "Summer" },
    questPhase: { sem_start: "Semester start", teaching: "Teaching", midterm: "Midterms", finals: "Finals", winter: "Winter break", summer: "Summer" },
    questAnytime: "Anytime",
    questRoleShort: { Lecturer: "Lecturer", TA: "TA", Student: "Student", "Program Leader": "Program Leader", Dean: "Dean", "IT Admin": "IT Admin", SAO: "SAO", Security: "Security", Finance: "Finance" },
    newsBellLabel: "News",
    newsDrawerTitle: "News from Archie",
    newsDrawerClose: "Close news",
    newsDrawerEmpty: "No news right now.",
    newsKicker: "News from Archie",
    newsOpenLink: "Open link",
    newsFormTitleNew: "New announcement",
    newsFormTitleEdit: "Edit announcement",
    newsFormDesc: "Archie delivers it as a scroll in the Quest Run strip.",
    newsTranslate: "Translate with Gemini",
    newsTranslated: "Chinese fields filled in. Check them before you publish.",
    newsTranslateFailed: "Couldn't translate. Try again or type the translations.",
    newsTitleLabel: "Title",
    newsBodyLabel: "Message",
    newsLinkLabel: "Link",
    newsLinkNone: "No link",
    newsLinkUrl: "Web page",
    newsLinkCase: "Playbook",
    newsAudienceLabel: "Who sees it",
    newsAudienceHint: "Leave all unticked to show it to everyone.",
    newsAudienceAll: "Everyone",
    newsStartsLabel: "Starts",
    newsEndsLabel: "Ends",
    newsNoEnd: "No end date",
    newsPinnedLabel: "Pin (show first)",
    newsActiveLabel: "Active",
    newsPreviewLabel: "Preview",
    newsPreviewEmpty: "Your title appears here.",
    newsPublish: "Publish",
    newsSaveChanges: "Save changes",
    newsPublished: "Announcement published",
    newsUpdated: "Announcement updated",
    newsDeleted: "Announcement deleted",
    newsConfirmDelete: "Delete \"{title}\"? This can't be undone.",
    newsEdit: "Edit",
    newsThTitle: "Title",
    newsThStatus: "Status",
    newsThDates: "Dates",
    newsThSeen: "Seen",
    newsThClicks: "Clicks",
    newsTableEmpty: "No announcements yet.",
    newsStatus: { live: "Live", scheduled: "Scheduled", expired: "Ended", inactive: "Off" },
    newsErrTitle: "Enter an English title.",
    newsErrLink: "Enter a link that starts with http:// or https://.",
    newsErrCase: "Choose a playbook.",
    newsErrDates: "The end date must be on or after the start date.",
    adminTabNewsText: "News",
    settingsCalendarTitle: "Academic calendar",
    settingsCalendarDesc: "Sets the terms shown on the Quest Run timeline and which tips appear when.",
    calResetDefault: "Reset to default",
    calStart: "Starts",
    calEnd: "Ends",
    calErrDate: "Enter valid dates for {term}.",
    calErrGap: "{term} must start the day after the previous term ends.",
    calPreviewToday: "Today: {position}",
    calStatusDefault: "Default",
    calStatusCustom: "Custom",
    calSaved: "Academic calendar saved",
    calConfirmReset: "Reset the academic calendar to the default dates?",
    calResetDone: "Academic calendar reset to default",
    calLoadFailed: "Couldn't load the academic calendar.",
    caseFormTimingLabel: "When it matters",
    caseFormTimingHint: "Tips for this playbook appear more often in these parts of the academic year.",
    caseFormHintsLabel: "Quest Run questions",
    caseFormHintsHint: "Short questions the hero asks. Up to 3.",
    caseFormHintAdd: "Add question",
    caseFormHintN: "Question {n}",
    caseFormHintRemove: "Remove question",
    caseFormHintAudience: "Only for these roles (optional)"
  },
  "zh-TW": {
    questStripTitle: "Quest Run",
    questOpenPlaybook: "開啟案例",
    questPause: "暫停提示",
    questResume: "繼續提示",
    questDismiss: "略過",
    questCollapse: "隱藏場景",
    questExpand: "顯示場景",
    questHintKicker: "任務 · {phase}",
    questEmpty: "在下方選一個案例，開始你的任務。",
    questTimelineLabel: "學年",
    questPositionTemplate: "{term} · 第 {week} 週 · {phase}",
    questPositionBreak: "{term} · 第 {week} 週",
    questTermFull: { semA: "上學期", winter: "寒假", semB: "下學期", summer: "暑假" },
    questTermShort: { semA: "上學期", winter: "寒假", semB: "下學期", summer: "暑假" },
    questPhase: { sem_start: "開學", teaching: "授課期", midterm: "期中", finals: "期末", winter: "寒假", summer: "暑假" },
    questAnytime: "任何時候",
    questRoleShort: { Lecturer: "講師", TA: "助教", Student: "學生", "Program Leader": "課程主任", Dean: "院長", "IT Admin": "IT 管理員", SAO: "學生事務處", Security: "保安", Finance: "財務" },
    newsBellLabel: "最新消息",
    newsDrawerTitle: "Archie 的最新消息",
    newsDrawerClose: "關閉最新消息",
    newsDrawerEmpty: "暫時沒有最新消息。",
    newsKicker: "Archie 的最新消息",
    newsOpenLink: "開啟連結",
    newsFormTitleNew: "新公告",
    newsFormTitleEdit: "編輯公告",
    newsFormDesc: "Archie 會把公告化成卷軸，送到 Quest Run 橫幅。",
    newsTranslate: "用 Gemini 翻譯",
    newsTranslated: "已填入中文欄位，發佈前請先檢查。",
    newsTranslateFailed: "無法翻譯，請再試一次或自行輸入譯文。",
    newsTitleLabel: "標題",
    newsBodyLabel: "內容",
    newsLinkLabel: "連結",
    newsLinkNone: "沒有連結",
    newsLinkUrl: "網頁",
    newsLinkCase: "案例",
    newsAudienceLabel: "顯示對象",
    newsAudienceHint: "全部不勾選即向所有人顯示。",
    newsAudienceAll: "所有人",
    newsStartsLabel: "開始日期",
    newsEndsLabel: "結束日期",
    newsNoEnd: "沒有結束日期",
    newsPinnedLabel: "置頂（優先顯示）",
    newsActiveLabel: "啟用",
    newsPreviewLabel: "預覽",
    newsPreviewEmpty: "標題會在這裡顯示。",
    newsPublish: "發佈",
    newsSaveChanges: "儲存變更",
    newsPublished: "已發佈公告",
    newsUpdated: "已更新公告",
    newsDeleted: "已刪除公告",
    newsConfirmDelete: "要刪除「{title}」嗎？此操作無法復原。",
    newsEdit: "編輯",
    newsThTitle: "標題",
    newsThStatus: "狀態",
    newsThDates: "日期",
    newsThSeen: "已看",
    newsThClicks: "點擊",
    newsTableEmpty: "尚未有公告。",
    newsStatus: { live: "顯示中", scheduled: "已排程", expired: "已結束", inactive: "已停用" },
    newsErrTitle: "請輸入英文標題。",
    newsErrLink: "請輸入以 http:// 或 https:// 開頭的連結。",
    newsErrCase: "請選擇一個案例。",
    newsErrDates: "結束日期不可早於開始日期。",
    adminTabNewsText: "最新消息",
    settingsCalendarTitle: "學年行事曆",
    settingsCalendarDesc: "設定 Quest Run 時間軸上的學期，以及各提示的出現時段。",
    calResetDefault: "還原預設",
    calStart: "開始",
    calEnd: "結束",
    calErrDate: "請為{term}輸入有效日期。",
    calErrGap: "{term}必須在上一個學期結束的翌日開始。",
    calPreviewToday: "今天：{position}",
    calStatusDefault: "預設",
    calStatusCustom: "自訂",
    calSaved: "已儲存學年行事曆",
    calConfirmReset: "要把學年行事曆還原為預設日期嗎？",
    calResetDone: "已還原預設學年行事曆",
    calLoadFailed: "無法載入學年行事曆。",
    caseFormTimingLabel: "適用時段",
    caseFormTimingHint: "此案例的提示會在這些學年時段更常出現。",
    caseFormHintsLabel: "Quest Run 問題",
    caseFormHintsHint: "勇者會問的簡短問題，最多 3 條。",
    caseFormHintAdd: "新增問題",
    caseFormHintN: "問題 {n}",
    caseFormHintRemove: "移除問題",
    caseFormHintAudience: "只向這些角色顯示（選填）"
  },
  "zh-CN": {
    questStripTitle: "Quest Run",
    questOpenPlaybook: "打开案例",
    questPause: "暂停提示",
    questResume: "继续提示",
    questDismiss: "忽略",
    questCollapse: "隐藏场景",
    questExpand: "显示场景",
    questHintKicker: "任务 · {phase}",
    questEmpty: "在下方选一个案例，开始你的任务。",
    questTimelineLabel: "学年",
    questPositionTemplate: "{term} · 第 {week} 周 · {phase}",
    questPositionBreak: "{term} · 第 {week} 周",
    questTermFull: { semA: "上学期", winter: "寒假", semB: "下学期", summer: "暑假" },
    questTermShort: { semA: "上学期", winter: "寒假", semB: "下学期", summer: "暑假" },
    questPhase: { sem_start: "开学", teaching: "授课期", midterm: "期中", finals: "期末", winter: "寒假", summer: "暑假" },
    questAnytime: "任何时候",
    questRoleShort: { Lecturer: "讲师", TA: "助教", Student: "学生", "Program Leader": "课程主任", Dean: "院长", "IT Admin": "IT 管理员", SAO: "学生事务处", Security: "保安", Finance: "财务" },
    newsBellLabel: "最新消息",
    newsDrawerTitle: "Archie 的最新消息",
    newsDrawerClose: "关闭最新消息",
    newsDrawerEmpty: "暂时没有最新消息。",
    newsKicker: "Archie 的最新消息",
    newsOpenLink: "打开链接",
    newsFormTitleNew: "新公告",
    newsFormTitleEdit: "编辑公告",
    newsFormDesc: "Archie 会把公告化成卷轴，送到 Quest Run 横幅。",
    newsTranslate: "用 Gemini 翻译",
    newsTranslated: "已填入中文字段，发布前请先检查。",
    newsTranslateFailed: "无法翻译，请重试或自行输入译文。",
    newsTitleLabel: "标题",
    newsBodyLabel: "内容",
    newsLinkLabel: "链接",
    newsLinkNone: "没有链接",
    newsLinkUrl: "网页",
    newsLinkCase: "案例",
    newsAudienceLabel: "显示对象",
    newsAudienceHint: "全部不勾选即向所有人显示。",
    newsAudienceAll: "所有人",
    newsStartsLabel: "开始日期",
    newsEndsLabel: "结束日期",
    newsNoEnd: "没有结束日期",
    newsPinnedLabel: "置顶（优先显示）",
    newsActiveLabel: "启用",
    newsPreviewLabel: "预览",
    newsPreviewEmpty: "标题会在这里显示。",
    newsPublish: "发布",
    newsSaveChanges: "保存更改",
    newsPublished: "已发布公告",
    newsUpdated: "已更新公告",
    newsDeleted: "已删除公告",
    newsConfirmDelete: "要删除“{title}”吗？此操作无法撤销。",
    newsEdit: "编辑",
    newsThTitle: "标题",
    newsThStatus: "状态",
    newsThDates: "日期",
    newsThSeen: "已看",
    newsThClicks: "点击",
    newsTableEmpty: "还没有公告。",
    newsStatus: { live: "显示中", scheduled: "已排程", expired: "已结束", inactive: "已停用" },
    newsErrTitle: "请输入英文标题。",
    newsErrLink: "请输入以 http:// 或 https:// 开头的链接。",
    newsErrCase: "请选择一个案例。",
    newsErrDates: "结束日期不能早于开始日期。",
    adminTabNewsText: "最新消息",
    settingsCalendarTitle: "学年校历",
    settingsCalendarDesc: "设置 Quest Run 时间轴上的学期，以及各提示的出现时段。",
    calResetDefault: "恢复默认",
    calStart: "开始",
    calEnd: "结束",
    calErrDate: "请为{term}输入有效日期。",
    calErrGap: "{term}必须在上一个学期结束的次日开始。",
    calPreviewToday: "今天：{position}",
    calStatusDefault: "默认",
    calStatusCustom: "自定义",
    calSaved: "已保存学年校历",
    calConfirmReset: "要把学年校历恢复为默认日期吗？",
    calResetDone: "已恢复默认学年校历",
    calLoadFailed: "无法加载学年校历。",
    caseFormTimingLabel: "适用时段",
    caseFormTimingHint: "此案例的提示会在这些学年时段更常出现。",
    caseFormHintsLabel: "Quest Run 问题",
    caseFormHintsHint: "勇者会问的简短问题，最多 3 条。",
    caseFormHintAdd: "添加问题",
    caseFormHintN: "问题 {n}",
    caseFormHintRemove: "移除问题",
    caseFormHintAudience: "只向这些角色显示（选填）"
  }
};
Object.keys(uiTranslationsV6).forEach(lang => {
  if (uiTranslations[lang]) Object.assign(uiTranslations[lang], uiTranslationsV6[lang]);
});

/** Current translation table (falls back to English). */
const tr = () => uiTranslations[appState.activeLanguage] || uiTranslations.en;

/** Replace {name} placeholders in a template string. Pure. */
const fmt = (template, vars = {}) =>
  String(template || "").replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));

/** Fill every [data-i18n], [data-i18n-placeholder] and [data-i18n-aria] element. */
function applyI18nAttributes() {
  const t = tr();
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const v = t[el.dataset.i18n];
    if (typeof v === "string") el.textContent = v;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const v = t[el.dataset.i18nPlaceholder];
    if (typeof v === "string") el.placeholder = v;
  });
  document.querySelectorAll("[data-i18n-aria]").forEach(el => {
    const v = t[el.dataset.i18nAria];
    if (typeof v === "string") el.setAttribute("aria-label", v);
  });
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const v = t[el.dataset.i18nTitle];
    if (typeof v === "string") el.title = v;
  });
  // Prompt type select in the admin case form uses the shared type labels
  const typeSelect = document.getElementById("formCasePromptType");
  if (typeSelect) Array.from(typeSelect.options).forEach(o => { if (t.promptTypes[o.value]) o.textContent = t.promptTypes[o.value]; });
  document.documentElement.lang = appState.activeLanguage || "en";
}

// ---------------------------------------------------------------------------
// Pure helpers: prompt types, Try it URL, variables, filtering and sorting
// ---------------------------------------------------------------------------

/** Prompt types that Gemini Enterprise can open straight from a ?q= link. */
const TRYABLE = new Set(["general", "canvas", "image", "video"]);

/** Which actions a prompt of this type supports. Pure. */
const promptActions = (type) => (TRYABLE.has(type || "general") ? ["copy", "try"] : ["copy"]);

/**
 * Build the deep link that opens a prompt in the user's GE app. Pure.
 * Returns null when the user has no GE app link (caller falls back to copy).
 */
const buildTryItUrl = (geAppLink, prompt) => {
  if (!geAppLink) return null;
  return `${geAppLink}${geAppLink.includes("?") ? "&" : "?"}q=${encodeURIComponent(prompt)}`;
};

const PROMPT_TYPE_ICONS = {
  general: "chat", notebooklm: "menu_book", deep_research: "travel_explore",
  agent_designer: "smart_toy", canvas: "draw", image: "palette", video: "videocam"
};

/** Acronyms kept upper-case when humanizing variable names. */
const KEEP_UPPER = new Set(["LMS", "URL", "ID", "PDF", "IT", "TA", "KPI", "HR", "AI", "FAQ", "GPA", "IB", "DSE", "STEM", "SAO", "CSV", "ESG", "SEN", "UK", "US", "HK"]);

/** "COURSE_TITLE" -> "Course title" (acronyms like LMS stay upper-case). Pure. */
const humanizeVariable = (key) => {
  const words = String(key || "").replace(/[_\-]+/g, " ").trim().split(/\s+/).filter(Boolean);
  return words.map((w, i) => {
    if (KEEP_UPPER.has(w.toUpperCase()) && w === w.toUpperCase()) return w.toUpperCase();
    const lower = w.toLowerCase();
    return i === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
  }).join(" ");
};

/** Same token grammar as extractPromptVariables: {{KEY}} or [KEY] (not markdown links). */
const PROMPT_VAR_REGEX = () => /(?:\{\{([A-Za-z0-9\s/_\-']{1,50})\}\}|\[([A-Za-z0-9\s/_\-']{1,50})\](?!\())/g;

/**
 * Replace every variable token with its value; unfilled ones become "[Human label]"
 * so the copied text never contains raw {{ }} braces. Pure.
 */
const interpolatePrompt = (text, values = {}) =>
  String(text || "").replace(PROMPT_VAR_REGEX(), (m, a, b) => {
    const key = (a || b).trim();
    const val = (values[key] || "").trim();
    return val || `[${humanizeVariable(key)}]`;
  });

/**
 * Render prompt text as HTML with clickable variable chips. Unfilled chips show the
 * human label (soft style); filled chips show the value in the accent colour. Pure.
 */
const renderPromptHtml = (text, values = {}) => {
  const regex = PROMPT_VAR_REGEX();
  let out = "", last = 0, m;
  while ((m = regex.exec(text || "")) !== null) {
    out += escapeHtml(text.substring(last, m.index));
    const key = (m[1] || m[2]).trim();
    const label = humanizeVariable(key);
    const val = (values[key] || "").trim();
    out += `<button type="button" class="var-chip${val ? " is-filled" : ""}" data-var-key="${escapeHtml(key)}" title="${escapeHtml(label)}">${escapeHtml(val || label)}</button>`;
    last = regex.lastIndex;
  }
  return out + escapeHtml((text || "").substring(last));
};

/** Unique variable keys across several prompt texts, in first-seen order. Pure. */
const collectVariableKeys = (texts) =>
  [...new Set(texts.flatMap(tx => extractPromptVariables(tx).map(v => v.key)))];

/** Localized title for a use case. */
const ucTitle = (uc, lang) => (useCasesTranslations[uc.id]?.[lang]?.title) || uc.title || "";
const ucSummary = (uc, lang) => (useCasesTranslations[uc.id]?.[lang]?.summary) || uc.summary || "";
const isOn = (v) => v === true || v === 1;

/** Role / level visibility rules (unchanged from v1, now pure). */
function matchesRoleAndLevel(uc, state) {
  if (state.isAdmin === true) return true;
  const role = state.userRole;
  const isSupportRole = ["Security", "Finance", "IT Admin", "SAO"].includes(role);
  let roleOk = true;
  if (role === "Lecturer" || role === "TA") {
    roleOk = ["Lecturer", "TA"].includes(uc.role) || ["academic", "operational", "administrative"].includes(uc.category) || !uc.role;
  } else if (role === "Student") {
    roleOk = uc.role === "Student" || uc.category === "student" || !uc.role;
  } else if (isSupportRole) {
    roleOk = [role, "IT Admin", "Program Leader", "Dean", "SAO"].includes(uc.role) || ["operational", "administrative"].includes(uc.category) || !uc.role;
  } else if (role === "Program Leader" || role === "Dean") {
    roleOk = ["Lecturer", "Program Leader", "Dean"].includes(uc.role) || ["academic", "operational", "administrative"].includes(uc.category) || !uc.role;
  }
  let levelOk = true;
  if (!isSupportRole && Array.isArray(uc.level) && uc.level.length > 0) {
    levelOk = uc.level.includes("Generic") || uc.level.includes(state.institutionLevel);
  }
  return roleOk && levelOk;
}

/** Apply search, category, feature and collection filters. Pure. */
function filterUseCases(list, state, lang) {
  const q = (state.searchQuery || "").toLowerCase();
  const cat = state.activeFilterCategory === "admin" ? "administrative" : state.activeFilterCategory;
  return list.filter(uc => {
    if (!matchesRoleAndLevel(uc, state)) return false;
    if (cat && cat !== "all" && uc.category !== cat) return false;
    if (state.activeFilterFeature && state.activeFilterFeature !== "all" &&
        !(uc.features || []).some(f => f.toLowerCase() === state.activeFilterFeature.toLowerCase())) return false;
    if (state.activeFilterStatus === "liked" && !isOn(uc.isLiked)) return false;
    if (q) {
      const hay = [ucTitle(uc, lang), ucSummary(uc, lang), uc.role || "", ...(uc.features || [])].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Sort without mutating: popular (likes desc), newest (createdAt desc) or az. Pure. */
function sortUseCases(list, sortBy, lang) {
  const byTitle = (a, b) => ucTitle(a, lang).localeCompare(ucTitle(b, lang), lang);
  const time = (uc) => new Date(uc.createdAt || 0).getTime() || 0;
  const cmp = {
    popular: (a, b) => (b.totalLikes || 0) - (a.totalLikes || 0) || byTitle(a, b),
    newest: (a, b) => time(b) - time(a) || byTitle(a, b),
    az: byTitle
  }[sortBy] || byTitle;
  return [...list].sort(cmp);
}

/** "{n} playbooks for {role}" with the plural role map; admins see "all roles". Pure. */
function formatResultsHeadline(t, n, state) {
  const role = state.isAdmin === true ? t.allRoles : (t.rolesPlural?.[state.userRole] || t.allRoles);
  return fmt(n === 1 ? t.resultsHeadlineOne : t.resultsHeadline, { n, role });
}

// ---------------------------------------------------------------------------
// Shared small UI helpers
// ---------------------------------------------------------------------------
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    // Fallback for non-secure contexts
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (_) { ok = false; }
    ta.remove();
    return ok;
  }
}

/** Fetch JSON with graceful handling of non-JSON / network errors. */
async function apiJson(url, options = {}) {
  const opts = { ...options };
  if (opts.body && typeof opts.body !== "string") {
    opts.body = JSON.stringify(opts.body);
    opts.headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  }
  try {
    const res = await fetch(url, opts);
    let data = {};
    try { data = await res.json(); } catch (_) { data = {}; }
    return { ok: res.ok && data.success !== false, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { message: tr().networkError } };
  }
}

const errText = (data) => data?.message || data?.error || tr().saveFailed;

function setFieldError(inputId, message) {
  const p = document.querySelector(`[data-error-for="${inputId}"]`);
  const input = document.getElementById(inputId);
  if (p) p.textContent = message || "";
  if (input) input.toggleAttribute("aria-invalid", Boolean(message));
}

function showInline(el, html, kind = "info") {
  if (!el) return;
  el.className = `inline-feedback is-${kind}`;
  el.innerHTML = html;
  el.hidden = false;
  el.style.display = "";
}

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
const isValidHttpsUrl = (v) => { try { return new URL(v).protocol === "https:"; } catch (_) { return false; } };
const formatDate = (v) => {
  const d = new Date(v);
  return isNaN(d) ? "" : d.toLocaleDateString(appState.activeLanguage || undefined, { year: "numeric", month: "short", day: "numeric" });
};
const formatDateTime = (v) => {
  const d = new Date(v);
  return isNaN(d) ? "" : d.toLocaleString(appState.activeLanguage || undefined, { dateStyle: "medium", timeStyle: "short" });
};

/** Copy-able value row (temp passwords, preview links). */
const copyRowHtml = (label, value) => `
  <div class="copy-row">
    <span class="copy-row-label">${escapeHtml(label)}</span>
    <code class="copy-row-value">${escapeHtml(value)}</code>
    <button type="button" class="nav-button btn-copy-value" data-copy="${escapeHtml(value)}">
      <span class="material-symbols-outlined">content_copy</span> ${escapeHtml(tr().copy)}
    </button>
  </div>`;

// One delegated listener handles every copy-row button in the document
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-copy-value");
  if (!btn) return;
  if (await copyText(btn.dataset.copy || "")) showToast(tr().copied);
});

// ---------------------------------------------------------------------------
// Avatar menus (user + admin topbars)
// ---------------------------------------------------------------------------
function bindAvatarMenu(btnId, menuId) {
  const btn = document.getElementById(btnId);
  const menu = document.getElementById(menuId);
  if (!btn || !menu || btn.dataset.bound) return;
  btn.dataset.bound = "1";
  const setOpen = (open) => {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  };
  btn.addEventListener("click", (e) => { e.stopPropagation(); setOpen(menu.hidden); });
  menu.addEventListener("click", (e) => { if (e.target.closest(".avatar-menu-item")) setOpen(false); });
  document.addEventListener("click", (e) => { if (!menu.hidden && !menu.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { setOpen(false); btn.focus(); } });
}

/** Fill avatar initials + menu header text for both portals. */
function updateAccountMenus() {
  const t = tr();
  const email = appState.userEmail || "";
  const initial = (email.trim()[0] || "U").toUpperCase();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("userAvatarInitial", initial);
  set("adminAvatarInitial", initial);
  set("userMenuEmail", email);
  set("adminMenuEmail", email);
  set("adminMenuRole", appState.isSuper ? t.roleSuper : (appState.isAssist ? t.roleAssist : t.roleSuper));
  const adminLink = document.getElementById("btnBackToAdminDash");
  if (adminLink) adminLink.hidden = appState.isAdmin !== true;
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------
function initFilterBar() {
  const bind = (id, key, storageKey) => {
    const el = document.getElementById(id);
    if (!el || el.dataset.bound) return;
    el.dataset.bound = "1";
    el.value = appState[key];
    if (el.value !== appState[key]) { el.value = "all"; appState[key] = el.value; }
    el.addEventListener("change", () => {
      appState[key] = el.value;
      sessionStorage.setItem(storageKey, el.value);
      renderUseCases();
    });
  };
  bind("filterCategory", "activeFilterCategory", "ge_active_category");
  bind("filterFeature", "activeFilterFeature", "ge_active_feature");
  bind("filterCollection", "activeFilterStatus", "ge_active_status");
  bind("filterSort", "sortBy", "ge_sort_by");
  // v6: tint the feature select with the selected feature's colour family.
  const feat = document.getElementById("filterFeature");
  if (feat) {
    const syncTone = () => { feat.dataset.tone = featureTone(feat.value) || ""; };
    syncTone();
    if (!feat.dataset.toneBound) {
      feat.dataset.toneBound = "1";
      feat.addEventListener("change", syncTone);
    }
  }
}

function resetFilters() {
  appState.searchQuery = "";
  appState.activeFilterCategory = "all";
  appState.activeFilterFeature = "all";
  appState.activeFilterStatus = "all";
  ["ge_active_category", "ge_active_feature", "ge_active_status"].forEach(k => sessionStorage.removeItem(k));
  const s = document.getElementById("searchInput"); if (s) s.value = "";
  [["filterCategory", "all"], ["filterFeature", "all"], ["filterCollection", "all"]].forEach(([id, v]) => {
    const el = document.getElementById(id); if (el) el.value = v;
  });
  const featSel = document.getElementById("filterFeature"); if (featSel) featSel.dataset.tone = "";
  renderUseCases();
}

// ---------------------------------------------------------------------------
// Likes / view counts shared by cards and the modal
// ---------------------------------------------------------------------------
/** Compact number for counters: 950 -> "950", 1234 -> "1.2k". Pure. */
const compactCount = (n) => {
  const v = Number(n) || 0;
  return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(v);
};

const prefButtonsHtml = (uc, t) => {
  const liked = isOn(uc.isLiked);
  const views = Number(uc.viewCount) || 0;
  const viewsTitle = escapeHtml(fmt(t.viewCountTitle, { n: views }));
  return `
    <button type="button" class="pref-btn btn-like${liked ? " is-active" : ""}" data-uc-id="${escapeHtml(uc.id)}" aria-pressed="${liked}" title="${escapeHtml(t.likeLabel)}" aria-label="${escapeHtml(t.likeLabel)}">
      <span class="material-symbols-outlined">favorite</span><span class="likes-count">${uc.totalLikes || 0}</span>
    </button>
    <span class="view-count" data-uc-id="${escapeHtml(uc.id)}" title="${viewsTitle}" aria-label="${viewsTitle}">
      <span class="material-symbols-outlined" aria-hidden="true">visibility</span><span class="views-count">${compactCount(views)}</span>
    </span>`;
};

/** Update every like button and view counter for a use case (card + modal) in place. */
function syncPrefButtons(uc) {
  const sel = CSS.escape(uc.id);
  const t = tr();
  document.querySelectorAll(`.btn-like[data-uc-id="${sel}"]`).forEach(b => {
    b.classList.toggle("is-active", isOn(uc.isLiked));
    b.setAttribute("aria-pressed", String(isOn(uc.isLiked)));
    const c = b.querySelector(".likes-count"); if (c) c.textContent = uc.totalLikes || 0;
  });
  document.querySelectorAll(`.view-count[data-uc-id="${sel}"]`).forEach(v => {
    const n = Number(uc.viewCount) || 0;
    const title = fmt(t.viewCountTitle, { n });
    v.title = title;
    v.setAttribute("aria-label", title);
    const c = v.querySelector(".views-count"); if (c) c.textContent = compactCount(n);
  });
}

/**
 * Toggle a like optimistically: flip the UI immediately, then reconcile with
 * the server's authoritative count, or roll back and explain why on failure.
 * Concurrent clicks on the same card are ignored while a request is pending.
 */
const pendingLikes = new Set();
async function togglePreference(ucId) {
  const uc = useCasesDb.find(u => u.id === ucId);
  if (!uc || pendingLikes.has(ucId)) return;
  const t = tr();
  const prev = { isLiked: uc.isLiked, totalLikes: uc.totalLikes || 0 };
  const next = !isOn(uc.isLiked);
  uc.isLiked = next;
  uc.totalLikes = Math.max(0, prev.totalLikes + (next ? 1 : -1));
  syncPrefButtons(uc);

  pendingLikes.add(ucId);
  const res = await syncUserPreference(uc.id, next);
  pendingLikes.delete(ucId);

  if (res.ok) {
    uc.isLiked = res.data.isLiked ?? next;
    uc.totalLikes = res.data.likeCount ?? res.data.totalLikes ?? uc.totalLikes;
    showToast(next ? t.likedToast : t.unlikedToast);
  } else {
    Object.assign(uc, prev);
    const msg = res.status === 401 ? t.likeSessionExpired : res.status === 403 ? t.likeAdminPreview : t.likeFailed;
    showToast(msg, "warning");
  }
  syncPrefButtons(uc);
  // The "liked" collection filter depends on this flag, so re-render the grid when it's active
  if (appState.activeFilterStatus !== "all") renderUseCases();
}

// ---------------------------------------------------------------------------
// Card grid
// ---------------------------------------------------------------------------
function cardHtml(uc, lang, t) {
  const badge = getUsecaseBadgeHtml(uc, lang);
  const feats = (uc.features || []).map(f =>
    `<span class="tag tag-feature tag-icon-only${toneClass(f)}" title="${escapeHtml(f)}"><span class="material-symbols-outlined">${getTagIcon("feature", f)}</span></span>`).join("");
  const conns = (uc.connectors || []).map(c => {
    const meta = getConnectorMeta(c, lang);
    return `<span class="tag tag-icon-only ${meta.class}" title="${escapeHtml(meta.label)}"><span class="material-symbols-outlined">${meta.icon}</span></span>`;
  }).join("");
  const title = ucTitle(uc, lang);
  return `
    <article class="card" data-uc-id="${escapeHtml(uc.id)}" tabindex="0" role="button" aria-label="${escapeHtml(title)}">
      <div class="card-tags">${badge}${feats}${conns}</div>
      <h3 class="card-title">${escapeHtml(title)}</h3>
      <p class="card-summary">${escapeHtml(ucSummary(uc, lang))}</p>
      <div class="card-footer">
        <span class="card-role">${escapeHtml(t.roles[uc.role] || uc.role || "")}</span>
        <div class="card-actions">${prefButtonsHtml(uc, t)}</div>
      </div>
    </article>`;
}

/** Bind grid delegation once: card click/Enter opens the modal, pref buttons toggle. */
function bindCardGrid(container) {
  if (container.dataset.bound) return;
  container.dataset.bound = "1";
  container.addEventListener("click", (e) => {
    const like = e.target.closest(".btn-like");
    if (like) {
      e.stopPropagation();
      togglePreference(like.dataset.ucId);
      return;
    }
    if (e.target.closest("#btnResetFilters")) { resetFilters(); return; }
    const card = e.target.closest(".card");
    if (card) {
      const uc = useCasesDb.find(u => u.id === card.dataset.ucId);
      if (uc) openUseCaseModal(uc);
    }
  });
  container.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("card")) {
      e.preventDefault();
      const uc = useCasesDb.find(u => u.id === e.target.dataset.ucId);
      if (uc) openUseCaseModal(uc);
    }
  });
}

// ---------------------------------------------------------------------------
// Particle field: organic droplets that drift on their own and lean away from the pointer.
// ---------------------------------------------------------------------------
/**
 * Algorithm overview
 * ------------------
 * 1. Anchors: particles sit on a jittered grid (30px desktop / 42px mobile, ±35%
 *    jitter). Density is capped at MAX_PARTICLES by widening the spacing:
 *    spacing = max(base, sqrt(area / MAX_PARTICLES)).
 * 2. Drift: each particle owns a random phase and two frequencies. Its offset from
 *    the anchor is a sum of two sines per axis (cheap pseudo-noise), so every
 *    particle wanders on a smooth, non-repeating-looking Lissajous path.
 * 3. Focus: a single "focus" point eases toward the pointer (or touch). With no
 *    pointer it idles on a slow Lissajous loop. `presence` (0..1) eases in when
 *    the pointer is active and fades out on pointer leave / touch end.
 * 4. Targets per particle, with d = distance to the focus:
 *       influence = presence · exp(-d² / 2σ²)          (Gaussian falloff)
 *       angle*    = blend(flowAngle, awayAngle, influence)   (shortest arc)
 *       length*   = 3 + 11·influence     scale* = 1 + 0.9·influence
 *       alpha*    = 0.10 + 0.70·influence + 0.05·twinkle
 *    flowAngle is a slowly evolving sine flow field, so far-away particles still
 *    sway gently instead of freezing.
 * 5. Smoothing: length and scale follow damped springs (velocity += k·error,
 *    velocity *= damping), giving a soft overshoot; angle and alpha use
 *    frame-rate independent lerps: x += (x* - x)·(1 - (1 - rate)^(dt/16.7)).
 * 6. Drawing: each particle is a teardrop (round head + tapered tail) filled in
 *    the palette colour of its sector around the focus.
 * The loop pauses while the tab is hidden; reduced-motion users get one settled,
 * static frame (redrawn on resize).
 */
function initParticleField() {
  const canvas = document.getElementById("fieldCanvas");
  if (!canvas || !canvas.getContext || canvas.dataset.ready) return;
  canvas.dataset.ready = "1";
  const ctx = canvas.getContext("2d");
  const PALETTE = ["#4285F4", "#EA4335", "#FBBC04", "#34A853", "#A142F4"];
  const SIGMA = 240;                        // falloff radius (px) of pointer influence
  const TWO_SIGMA_SQ = 2 * SIGMA * SIGMA;
  const MAX_PARTICLES = 1200;
  const FOCUS_EASE = 0.08;                  // focus point catch-up per 60fps frame
  const PRESENCE_EASE = 0.05;
  const SPRING_K = 0.12, SPRING_DAMP = 0.78;
  const ANGLE_RATE = 0.10, ALPHA_RATE = 0.08;
  const TAU = Math.PI * 2;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let w = 0, h = 0, particles = [], rafId = null, lastTs = 0, time = 0;
  const focus = { x: 0, y: 0, tx: 0, ty: 0, presence: 0.55, targetPresence: 0.55, active: false };

  /** Shortest signed angular difference b - a, in (-π, π]. Pure. */
  const angleDelta = (a, b) => {
    let d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  };
  /** Frame-rate independent lerp factor for a per-60fps-frame rate. Pure. */
  const lerpFactor = (rate, frames) => 1 - Math.pow(1 - rate, frames);

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const spacing = Math.max(w < 720 ? 42 : 30, Math.sqrt((w * h) / MAX_PARTICLES));
    particles = [];
    for (let y = spacing / 2; y < h; y += spacing) {
      for (let x = spacing / 2; x < w; x += spacing) {
        if (particles.length >= MAX_PARTICLES) break;
        particles.push({
          ax: x + (Math.random() - 0.5) * spacing * 0.7,
          ay: y + (Math.random() - 0.5) * spacing * 0.7,
          phase: Math.random() * TAU,
          f1: 0.25 + Math.random() * 0.35,   // drift frequencies (rad/s)
          f2: 0.18 + Math.random() * 0.30,
          amp: 3 + Math.random() * 5,        // drift amplitude (px)
          x: 0, y: 0,
          angle: Math.random() * TAU,
          len: 3, lenV: 0,
          scale: 1, scaleV: 0,
          alpha: 0.1
        });
      }
    }
    if (!focus.x && !focus.y) { focus.x = focus.tx = w * 0.72; focus.y = focus.ty = h * 0.28; }
  }

  /** Advance the simulation by `frames` 60fps-frames (dt-normalised). `settle` snaps to targets. */
  function step(frames, settle = false) {
    const t = time;
    // Idle: the focus wanders slowly around the upper-right so the field never looks dead
    if (!focus.active) {
      focus.tx = w * (0.72 + 0.10 * Math.sin(t * 0.13));
      focus.ty = h * (0.30 + 0.12 * Math.sin(t * 0.17 + 1.3));
    }
    const fe = settle ? 1 : lerpFactor(FOCUS_EASE, frames);
    focus.x += (focus.tx - focus.x) * fe;
    focus.y += (focus.ty - focus.y) * fe;
    focus.presence += (focus.targetPresence - focus.presence) * (settle ? 1 : lerpFactor(PRESENCE_EASE, frames));

    const aF = settle ? 1 : lerpFactor(ANGLE_RATE, frames);
    const alF = settle ? 1 : lerpFactor(ALPHA_RATE, frames);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // Layered sines approximate smooth noise without a noise table
      p.x = p.ax + p.amp * (Math.sin(t * p.f1 + p.phase) + 0.5 * Math.sin(t * p.f2 * 1.7 + p.phase * 2.1));
      p.y = p.ay + p.amp * (Math.cos(t * p.f2 + p.phase * 1.3) + 0.5 * Math.cos(t * p.f1 * 1.4 + p.phase));
      const dx = p.x - focus.x, dy = p.y - focus.y;
      const influence = focus.presence * Math.exp(-(dx * dx + dy * dy) / TWO_SIGMA_SQ);
      const flow = Math.sin(p.ax * 0.004 + t * 0.20) + Math.cos(p.ay * 0.005 - t * 0.15) + p.phase * 0.15;
      const away = Math.atan2(dy, dx);
      const targetAngle = flow + angleDelta(flow, away) * Math.min(1, influence * 1.6);
      const targetLen = 3 + 11 * influence;
      const targetScale = 1 + 0.9 * influence;
      const twinkle = 0.5 + 0.5 * Math.sin(t * 1.3 + p.phase * 3);
      const targetAlpha = 0.10 + 0.70 * influence + 0.05 * twinkle;

      p.angle += angleDelta(p.angle, targetAngle) * aF;
      p.alpha += (targetAlpha - p.alpha) * alF;
      if (settle) {
        p.len = targetLen; p.scale = targetScale; p.lenV = p.scaleV = 0;
      } else {
        // Damped springs, integrated in whole-frame sub-steps for stability
        for (let s = 0, n = Math.max(1, Math.round(frames)); s < n; s++) {
          p.lenV = (p.lenV + (targetLen - p.len) * SPRING_K) * SPRING_DAMP;
          p.len += p.lenV;
          p.scaleV = (p.scaleV + (targetScale - p.scale) * SPRING_K) * SPRING_DAMP;
          p.scale += p.scaleV;
        }
      }
    }
  }

  /** Teardrop: round head of radius r at the front, tapered tail behind it. */
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const r = 0.9 * Math.max(0.6, p.scale);
      const len = Math.max(r * 2, p.len);
      const c = Math.cos(p.angle), s = Math.sin(p.angle);
      const hx = p.x + c * (len / 2 - r), hy = p.y + s * (len / 2 - r);   // head centre
      const tx = p.x - c * (len / 2), ty = p.y - s * (len / 2);           // tail tip
      const sector = Math.floor(((Math.atan2(p.y - focus.y, p.x - focus.x) + Math.PI) / TAU) * 5) % 5;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = PALETTE[sector];
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.arc(hx, hy, r, p.angle - Math.PI / 2, p.angle + Math.PI / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function tick(ts) {
    const dt = lastTs ? Math.min(ts - lastTs, 50) : 16.7;   // clamp long gaps (tab switches)
    lastTs = ts;
    time += dt / 1000;
    step(dt / 16.7);
    draw();
    rafId = requestAnimationFrame(tick);
  }
  const start = () => {
    if (rafId || document.hidden || reduceMotion.matches) return;
    lastTs = 0;
    rafId = requestAnimationFrame(tick);
  };
  const stop = () => { if (rafId) cancelAnimationFrame(rafId); rafId = null; };
  /** Reduced motion: one fully settled frame, no animation loop. */
  const renderStatic = () => { step(1, true); draw(); };

  const pointAt = (x, y) => { focus.tx = x; focus.ty = y; focus.active = true; focus.targetPresence = 1; };
  const release = () => { focus.active = false; focus.targetPresence = 0.55; };

  layout();
  if (reduceMotion.matches) renderStatic(); else start();

  window.addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") pointAt(e.clientX, e.clientY); }, { passive: true });
  document.addEventListener("pointerleave", release);
  document.documentElement.addEventListener("mouseleave", release);
  window.addEventListener("blur", release);
  const onTouch = (e) => { const t0 = e.touches[0]; if (t0) pointAt(t0.clientX, t0.clientY); };
  window.addEventListener("touchstart", onTouch, { passive: true });
  window.addEventListener("touchmove", onTouch, { passive: true });
  window.addEventListener("touchend", release, { passive: true });
  window.addEventListener("touchcancel", release, { passive: true });

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { layout(); if (reduceMotion.matches) renderStatic(); }, 120);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else start(); });
  reduceMotion.addEventListener?.("change", () => { if (reduceMotion.matches) { stop(); renderStatic(); } else start(); });
}

// ---------------------------------------------------------------------------
// Use case modal: hero, How it works, workbench with shared variables, Try it
// ---------------------------------------------------------------------------

/**
 * Modal state. `scopes` maps a scope id ("main", "helper-0", …) to its raw prompt
 * text and type; `values` is shared by every scope so a variable filled once is
 * filled everywhere. `tryArmed` records a first Try it click with empty variables
 * so the second click proceeds anyway.
 */
const modalState = { useCase: null, scopes: {}, values: {}, tryArmed: {} };

const typeChipHtml = (type, t) => {
  const key = PROMPT_TYPE_ICONS[type] ? type : "general";
  return `<span class="type-chip${toneClass(key)}"><span class="material-symbols-outlined">${PROMPT_TYPE_ICONS[key]}</span>${escapeHtml(t.promptTypes[key])}</span>`;
};

/** Try it (green) + Copy prompt (blue) buttons; colours come from `.btn-try-it` / `.btn-copy-prompt`. */
const promptActionButtonsHtml = (scope, type, t) => {
  const acts = promptActions(type);
  const tryBtn = acts.includes("try")
    ? `<button type="button" class="nav-button btn-try-it" data-scope="${scope}"><span class="material-symbols-outlined">open_in_new</span>${escapeHtml(t.tryIt)}</button>` : "";
  const copyBtn = `<button type="button" class="nav-button btn-copy-prompt" data-scope="${scope}"><span class="material-symbols-outlined">content_copy</span>${escapeHtml(t.copyPrompt)}</button>`;
  return tryBtn + copyBtn;
};

/** Strip the redundant "Prompt to Generate " prefix from English helper titles. */
const cleanHelperTitle = (title) => {
  const s = String(title || "").replace(/^Prompt to Generate\s+/i, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function openUseCaseModal(useCase) {
  const overlay = document.getElementById("modalOverlay");
  const body = document.getElementById("modalDynamicContent");
  if (!overlay || !body) return;
  const lang = appState.activeLanguage || "en";
  const t = tr();
  const trans = useCasesTranslations[useCase.id]?.[lang] || null;
  const title = trans?.title || useCase.title;
  const summary = trans?.summary || useCase.summary;
  const steps = trans?.steps || useCase.steps || [];
  const mainPrompt = trans?.prompt || useCase.prompt || "";
  const proTip = trans?.proTip || useCase.proTip || "";
  const connectorGuide = trans?.connectorGuide || useCase.connectorGuide;
  const mainType = useCase.promptType || "general";
  const helpers = (typeof useCaseHelperPrompts !== "undefined" && useCaseHelperPrompts[useCase.id])
    ? (useCaseHelperPrompts[useCase.id][lang] || useCaseHelperPrompts[useCase.id].en || []) : [];

  // Reset modal state for this use case
  modalState.useCase = useCase;
  modalState.values = {};
  modalState.tryArmed = {};
  modalState.scopes = { main: { text: mainPrompt, type: mainType } };
  helpers.forEach((hp, i) => { modalState.scopes[`helper-${i}`] = { text: hp.prompt || "", type: hp.type || "general" }; });

  // Header: GE feature chips (neutral) + connector chips (red), then the title
  document.getElementById("modalTitle").textContent = title;
  const featureChips = (useCase.features || []).map(f =>
    `<span class="tag tag-feature tag-full${toneClass(f)}"><span class="material-symbols-outlined">${getTagIcon("feature", f)}</span><span>${escapeHtml(f)}</span></span>`).join("");
  const connectorChips = (useCase.connectors || []).map(c => {
    const meta = getConnectorMeta(c, lang);
    return `<span class="tag tag-full ${meta.class}" data-connector="${escapeHtml(c)}"><span class="material-symbols-outlined">${meta.icon}</span><span>${escapeHtml(meta.label)}</span></span>`;
  }).join("");
  document.getElementById("modalTags").innerHTML = featureChips + connectorChips;

  // Header actions: like + view counter left of the close button (delegated click bound once)
  const prefSlot = document.getElementById("modalPref");
  if (prefSlot) {
    prefSlot.innerHTML = prefButtonsHtml(useCase, t);
    if (!prefSlot.dataset.bound) {
      prefSlot.dataset.bound = "1";
      prefSlot.addEventListener("click", (e) => {
        const like = e.target.closest(".btn-like");
        if (like) togglePreference(like.dataset.ucId);
      });
    }
  }

  // Hero: infographic or a quiet placeholder tile of feature icons
  const heroHtml = useCase.infographicUrl
    ? `<a class="uc-hero" href="${escapeHtml(useCase.infographicUrl)}" target="_blank" rel="noopener" title="${escapeHtml(t.infographicOpen)}" aria-label="${escapeHtml(t.infographicOpen)}">
         <img src="${escapeHtml(useCase.infographicUrl)}" alt="${escapeHtml(title)}" decoding="async" fetchpriority="high">
       </a>`
    : `<div class="uc-hero uc-hero-placeholder" aria-hidden="true">${(useCase.features || []).map(f =>
        `<span class="material-symbols-outlined">${getTagIcon("feature", f)}</span>`).join("") || '<span class="material-symbols-outlined">auto_awesome</span>'}</div>`;

  // Step 1 helpers, rendered with chips (no raw braces) and each collapsed
  const helpersHtml = helpers.length ? `
    <details class="helpers-group">
      <summary class="helpers-group-summary"><span class="material-symbols-outlined">auto_awesome</span><span>${escapeHtml(t.helperHeading)}</span><span class="material-symbols-outlined chevron">expand_more</span></summary>
      <div class="helpers-list">
        ${helpers.map((hp, i) => `
          <details class="helper-prompt-collapsible">
            <summary class="helper-prompt-summary">
              <span class="helper-prompt-title">${escapeHtml(lang === "en" ? cleanHelperTitle(hp.title) : hp.title)}</span>
              ${typeChipHtml(hp.type || "general", t)}
              <span class="material-symbols-outlined chevron">expand_more</span>
            </summary>
            <div class="helper-prompt-body">
              <div class="prompt-raw-text helper-prompt-text" data-prompt-scope="helper-${i}">${renderPromptHtml(hp.prompt || "", {})}</div>
              <div class="prompt-actions">${promptActionButtonsHtml(`helper-${i}`, hp.type || "general", t)}</div>
            </div>
          </details>`).join("")}
      </div>
    </details>` : "";

  // Hero variables: union of keys from the main and helper prompts (one input per row)
  const varKeys = collectVariableKeys([mainPrompt, ...helpers.map(h => h.prompt || "")]);
  const varInputsHtml = varKeys.map((key, i) => {
    const label = humanizeVariable(key);
    return `<div class="variable-input-group">
          <label class="variable-label" for="promptVarInput_${i}">${escapeHtml(label)}</label>
          <input type="text" class="variable-input" id="promptVarInput_${i}" data-var-key="${escapeHtml(key)}" placeholder="${escapeHtml(label)}" autocomplete="off">
        </div>`;
  }).join("");

  // Step 3 extras
  const manualTipHtml = (useCase.connectors || []).length ? `
    <div class="manual-tip-box"><span class="material-symbols-outlined manual-tip-icon">tips_and_updates</span>
      <div class="manual-tip-content"><div class="manual-tip-title">${escapeHtml(t.manualTipTitle)}</div><p class="manual-tip-text">${escapeHtml(t.manualTipText)}</p></div></div>` : "";
  const guideHtml = connectorGuide?.steps?.length ? `
    <div class="setup-guide-box"><div class="setup-guide-header"><span class="material-symbols-outlined">settings_suggest</span>${escapeHtml(connectorGuide.name || "")} ${escapeHtml(t.setupGuideSuffix)}</div>
      <ol class="setup-steps">${connectorGuide.steps.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ol></div>` : "";
  const proTipHtml = proTip ? `
    <div class="pro-tip-box"><span class="material-symbols-outlined pro-tip-icon">lightbulb</span>
      <div class="pro-tip-content"><div class="pro-tip-title">${escapeHtml(t.adoptionProTip)}</div><p class="pro-tip-text">${escapeHtml(proTip)}</p></div></div>` : "";

  // Hero variables column: filled once, interpolated into the main and every helper prompt
  const varsPanelHtml = varKeys.length ? `
    <section class="uc-vars" id="wbVariables" aria-labelledby="ucVarsTitle">
      <div class="uc-vars-head">
        <span class="material-symbols-outlined">tune</span>
        <h4 class="uc-vars-title" id="ucVarsTitle">${escapeHtml(t.fillVariablesTitle)}</h4>
        <span class="wb-count">${varKeys.length}</span>
      </div>
      <p class="uc-vars-hint">${escapeHtml(t.fillVariablesHint)}</p>
      <div class="uc-vars-list">${varInputsHtml}</div>
    </section>` : "";

  // Hero: left = infographic with the summary directly below; right = the variables panel alone.
  // Without variables the left column spans the full width (no empty right column).
  body.innerHTML = `
    <div class="uc-hero-row${varKeys.length ? "" : " is-single"}">
      <div class="uc-hero-main">
        ${heroHtml}
        <p class="uc-summary">${escapeHtml(summary)}</p>
      </div>
      ${varsPanelHtml}
    </div>

    <section class="uc-how">
      <h4 class="section-label">${escapeHtml(t.operationalSteps)}</h4>
      <ol class="steps-list">
        <li class="step-item">
          <div class="step-header"><div class="step-num">1</div>
            <div class="step-info"><div class="step-title">${escapeHtml(t.step1Title)}</div><div class="step-desc">${escapeHtml(steps[0] || "")}</div></div></div>
          ${helpersHtml}
        </li>
        <li class="step-item">
          <div class="step-header"><div class="step-num">2</div>
            <div class="step-info"><div class="step-title">${escapeHtml(t.step2Title)}</div><div class="step-desc">${escapeHtml(steps[1] || "")}</div></div></div>
          <div class="workbench">
            <details class="wb-panel" id="wbPrompt">
              <summary class="wb-summary"><span class="material-symbols-outlined">description</span><span>${escapeHtml(t.samplePrompt)}</span>${typeChipHtml(mainType, t)}<span class="material-symbols-outlined chevron">expand_more</span></summary>
              <div class="prompt-raw-text" id="modalPromptDisplay" data-prompt-scope="main">${renderPromptHtml(mainPrompt, {})}</div>
              <div class="prompt-actions">${promptActionButtonsHtml("main", mainType, t)}</div>
            </details>
          </div>
        </li>
        <li class="step-item">
          <div class="step-header"><div class="step-num">3</div>
            <div class="step-info"><div class="step-title">${escapeHtml(t.step3Title)}</div><div class="step-desc">${escapeHtml(steps[2] || "")}</div></div></div>
          ${manualTipHtml}${guideHtml}${proTipHtml}
        </li>
      </ol>
    </section>`;

  bindModalBody(body);
  overlay.classList.add("active");
  document.body.classList.add("modal-open");
  body.scrollTop = 0;
  recordView(useCase);
}

/**
 * Count a view on every modal open: bump the counter optimistically on the card
 * and in the modal, then reconcile with the server's authoritative total.
 */
function recordView(useCase) {
  useCase.viewCount = (Number(useCase.viewCount) || 0) + 1;
  syncPrefButtons(useCase);
  fetch("/api/use-cases/view", {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
    body: JSON.stringify({ useCaseId: useCase.id })
  })
    .then(r => (r.ok ? r.json() : null))
    .then(data => {
      if (data && Number.isFinite(Number(data.viewCount))) {
        useCase.viewCount = Math.max(Number(data.viewCount), 0);
        syncPrefButtons(useCase);
      }
    })
    .catch(() => {});
}

/** Re-render every prompt display so chips reflect the shared values. */
function refreshPromptDisplays() {
  document.querySelectorAll("#modalDynamicContent [data-prompt-scope]").forEach(el => {
    const scope = modalState.scopes[el.dataset.promptScope];
    if (scope) el.innerHTML = renderPromptHtml(scope.text, modalState.values);
  });
}

/** Focus the hero variables field for `key`, scroll it into view and pulse it. */
function focusVariable(key) {
  const input = document.querySelector(`#modalDynamicContent .variable-input[data-var-key="${CSS.escape(key)}"]`);
  if (!input) return;
  input.scrollIntoView({ behavior: "smooth", block: "center" });
  input.focus({ preventScroll: true });
  input.classList.remove("pulse-focus");
  void input.offsetWidth; // restart the CSS animation
  input.classList.add("pulse-focus");
}

function bindModalBody(body) {
  if (body.dataset.bound) return;
  body.dataset.bound = "1";
  body.addEventListener("input", (e) => {
    const input = e.target.closest(".variable-input");
    if (!input) return;
    modalState.values[input.dataset.varKey] = input.value;
    modalState.tryArmed = {};
    refreshPromptDisplays();
  });
  body.addEventListener("click", (e) => {
    const chip = e.target.closest(".var-chip");
    if (chip) { e.preventDefault(); focusVariable(chip.dataset.varKey); return; }
    const tryBtn = e.target.closest(".btn-try-it");
    if (tryBtn) { onTryIt(tryBtn.dataset.scope); return; }
    const copyBtn = e.target.closest(".btn-copy-prompt");
    if (copyBtn) { onCopyPrompt(copyBtn.dataset.scope, copyBtn); return; }
  });
}

async function onCopyPrompt(scopeId, btn) {
  const scope = modalState.scopes[scopeId];
  if (!scope) return;
  const t = tr();
  if (await copyText(interpolatePrompt(scope.text, modalState.values))) {
    showToast(t.promptCopiedSuccess);
    if (btn) {
      const original = btn.innerHTML;
      btn.innerHTML = `<span class="material-symbols-outlined">check</span>${escapeHtml(t.copied)}`;
      setTimeout(() => { btn.innerHTML = original; }, 1800);
    }
  }
}

/**
 * Try it flow:
 *  1. Empty variables on the first click -> open the panel and focus the first one.
 *     A second click proceeds with placeholders left in.
 *  2. With a GE app link -> open it in a new tab and log the try (fire-and-forget).
 *     Very long links (> 7500 chars) may be truncated, so the prompt is copied too.
 *  3. Without a link (or for admins previewing) -> copy and tell the user to paste.
 */
async function onTryIt(scopeId) {
  const scope = modalState.scopes[scopeId];
  if (!scope) return;
  const t = tr();
  const empty = extractPromptVariables(scope.text).filter(v => !(modalState.values[v.key] || "").trim());
  if (empty.length && !modalState.tryArmed[scopeId]) {
    modalState.tryArmed[scopeId] = true;
    focusVariable(empty[0].key);
    showToast(t.tryFillFirst, "warning");
    return;
  }
  modalState.tryArmed[scopeId] = false;
  const prompt = interpolatePrompt(scope.text, modalState.values);
  const url = buildTryItUrl(appState.geAppLink, prompt);
  if (!url) {
    await copyText(prompt);
    showToast(t.tryCopiedPaste);
    return;
  }
  window.open(url, "_blank", "noopener");
  fetch("/api/use-cases/try", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ useCaseId: modalState.useCase?.id })
  }).catch(() => {});
  if (url.length > 7500) {
    await copyText(prompt);
    showToast(t.tryLongCopied);
  }
}

// ---------------------------------------------------------------------------
// Token auth: forgot password + ?verify= / ?reset= set-password flow
// ---------------------------------------------------------------------------
function showAuthCard(id) {
  ["loginCard", "forgotCard", "setPasswordCard", "resetCard", "profileCard"].forEach(cid => {
    const el = document.getElementById(cid);
    if (el) el.style.display = cid === id ? "block" : "none";
  });
  const overlay = document.getElementById("wizardOverlay");
  if (overlay) overlay.style.display = "flex";
}

function setupForgotPasswordHandlers() {
  const link = document.getElementById("btnForgotPassword");
  const back = document.getElementById("btnForgotBack");
  const form = document.getElementById("formForgotPassword");
  if (!form || form.dataset.bound) return;
  form.dataset.bound = "1";
  link?.addEventListener("click", () => {
    showAuthCard("forgotCard");
    const login = document.getElementById("loginEmail")?.value || "";
    const fe = document.getElementById("forgotEmail");
    if (fe && login.includes("@")) fe.value = login;
    document.getElementById("forgotMsg").hidden = true;
  });
  back?.addEventListener("click", () => showAuthCard("loginCard"));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("forgotEmail").value.trim();
    const msg = document.getElementById("forgotMsg");
    if (!isValidEmail(email)) { showInline(msg, escapeHtml(tr().emailInvalid), "error"); return; }
    const btn = document.getElementById("btnForgotSubmit");
    btn.disabled = true;
    await apiJson("/api/auth/forgot-password", { method: "POST", body: { email } });
    btn.disabled = false;
    // Always the same message, so the form never reveals which emails exist
    showInline(msg, escapeHtml(tr().forgotDone), "info");
  });
}

/** Show the set-password card for a verify/reset token. */
function startTokenFlow(token, kind) {
  const t = tr();
  showAuthCard("setPasswordCard");
  document.getElementById("setPasswordTitle").textContent = kind === "verify" ? t.setPwTitleVerify : t.setPwTitleReset;
  const form = document.getElementById("formSetPassword");
  const msg = document.getElementById("setPasswordMsg");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const p1 = document.getElementById("setPassword1").value;
    const p2 = document.getElementById("setPassword2").value;
    if (p1.length < 8) { showInline(msg, escapeHtml(tr().pwTooShort), "error"); return; }
    if (p1 !== p2) { showInline(msg, escapeHtml(tr().pwMismatch), "error"); return; }
    const btn = document.getElementById("btnSetPasswordSubmit");
    btn.disabled = true;
    const { ok, status, data } = await apiJson("/api/auth/complete-token", { method: "POST", body: { token, password: p1 } });
    btn.disabled = false;
    if (ok) {
      showToast(tr().pwSaved);
      sessionStorage.setItem("ge_current_view", "admin");
      setTimeout(() => window.location.reload(), 600);
    } else {
      showInline(msg, escapeHtml(status === 0 ? tr().networkError : (data.message || data.error || tr().tokenInvalid)), "error");
    }
  };
}

/** Read ?verify= / ?reset= once, then strip the query string from the URL. */
function readAuthTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const verify = params.get("verify");
  const reset = params.get("reset");
  if (verify || reset) {
    history.replaceState(null, "", window.location.pathname + window.location.hash);
    return { token: verify || reset, kind: verify ? "verify" : "reset" };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Admin portal: tabs
// ---------------------------------------------------------------------------
const ADMIN_TAB_SECTIONS = {
  users: "adminTabUsers", analytics: "adminTabAnalytics", cases: "adminTabCases",
  feedbacks: "adminTabFeedbacks", news: "adminTabNews", settings: "adminTabSettings"
};

/** Tabs the signed-in admin may see. Pure. */
const allowedAdminTabs = (state) => [
  ...(state.isAssist ? [] : ["users"]),
  "analytics", "cases", "feedbacks", "news",
  ...(state.isSuper ? ["settings"] : [])
];

function showAdminTab(name) {
  const allowed = allowedAdminTabs(appState);
  const tab = allowed.includes(name) ? name : allowed[0];
  currentAdminTab = tab;
  sessionStorage.setItem("ge_current_admin_tab", tab);
  document.querySelectorAll(".admin-tab-item").forEach(btn => {
    const on = btn.dataset.tab === tab;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", String(on));
    btn.hidden = !allowed.includes(btn.dataset.tab);
  });
  Object.entries(ADMIN_TAB_SECTIONS).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = k === tab ? "block" : "none";
  });
  if (tab === "users") { loadAdminUsers(); if (appState.isSuper) loadAdminAdmins(); }
  else if (tab === "analytics") loadAdminStats();
  else if (tab === "cases") loadAdminUseCases();
  else if (tab === "feedbacks") loadAdminFeedbacks();
  else if (tab === "news") loadAdminNews();
  else if (tab === "settings") { loadSmtpSettings(); loadCalendarSettings(); }
}

/** Switch from the admin portal to the learning portal preview. */
function enterLearningPortalPreview() {
  sessionStorage.setItem("ge_current_view", "user");
  document.getElementById("adminPortal").style.display = "none";
  document.getElementById("appLayout").style.display = "flex";
  appState.userRole = "Lecturer";
  appState.institutionLevel = "University & College";
  updateAccountMenus();
  updateSidebarContextUI();
  updateUILanguage();
  loadUseCasesFromServer().then(() => { renderUseCases(); mountQuestRun(); });
}

// ---------------------------------------------------------------------------
// Admin: Users table + edit modal
// ---------------------------------------------------------------------------
const geLinkCellHtml = (link, t) => {
  if (!link) return `<span class="muted">${escapeHtml(t.notSet)}</span>`;
  let host = link;
  try { host = new URL(link).host; } catch (_) { /* keep raw */ }
  return `<a class="ge-link" href="${escapeHtml(link)}" target="_blank" rel="noopener" title="${escapeHtml(link)}">${escapeHtml(host)}<span class="material-symbols-outlined">open_in_new</span></a>`;
};

let editingUser = null;

function openUserEditModal(u) {
  editingUser = u;
  const modal = document.getElementById("adminUserEditModal");
  document.getElementById("editUserEmail").value = u.email || "";
  document.getElementById("editUserGeLink").value = u.geAppLink || "";
  ["editUserEmail", "editUserGeLink"].forEach(id => setFieldError(id, ""));
  document.getElementById("editUserFeedback").hidden = true;
  document.getElementById("editUserTempPw").hidden = true;
  modal.classList.add("active");
  setTimeout(() => document.getElementById("editUserEmail").focus(), 50);
}

function closeUserEditModal() {
  document.getElementById("adminUserEditModal")?.classList.remove("active");
  editingUser = null;
}

function bindUserEditModal() {
  const form = document.getElementById("formAdminEditUser");
  if (!form || form.dataset.bound) return;
  form.dataset.bound = "1";
  document.getElementById("adminUserEditClose").onclick = closeUserEditModal;
  document.getElementById("btnEditUserCancel").onclick = closeUserEditModal;
  document.getElementById("adminUserEditModal").addEventListener("click", (e) => {
    if (e.target.id === "adminUserEditModal") closeUserEditModal();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    const t = tr();
    const email = document.getElementById("editUserEmail").value.trim();
    const geAppLink = document.getElementById("editUserGeLink").value.trim();
    const emailErr = isValidEmail(email) ? "" : t.emailInvalid;
    const linkErr = !geAppLink || isValidHttpsUrl(geAppLink) ? "" : t.geLinkInvalid;
    setFieldError("editUserEmail", emailErr);
    setFieldError("editUserGeLink", linkErr);
    if (emailErr || linkErr) return;
    const btn = document.getElementById("btnEditUserSave");
    btn.disabled = true;
    const { ok, data } = await apiJson("/api/admin/users", {
      method: "PUT", body: { originalEmail: editingUser.email, email, geAppLink }
    });
    btn.disabled = false;
    if (ok) {
      showToast(t.userSaved);
      closeUserEditModal();
      loadAdminUsers();
    } else if (data.errors && (data.errors.email || data.errors.geAppLink)) {
      setFieldError("editUserEmail", data.errors.email || "");
      setFieldError("editUserGeLink", data.errors.geAppLink || "");
    } else {
      showInline(document.getElementById("editUserFeedback"), escapeHtml(errText(data)), "error");
    }
  });

  document.getElementById("btnEditUserReset").addEventListener("click", async () => {
    if (!editingUser) return;
    const t = tr();
    if (!confirm(fmt(t.confirmReset, { email: editingUser.email }))) return;
    const { ok, data } = await apiJson("/api/admin/users/reset", { method: "PUT", body: { email: editingUser.email } });
    const box = document.getElementById("editUserTempPw");
    if (ok && data.tempPassword) {
      showInline(box, copyRowHtml(t.tempPasswordLabel, data.tempPassword), "success");
      loadAdminUsers();
    } else {
      showInline(box, escapeHtml(errText(data)), "error");
    }
  });
}

// ---------------------------------------------------------------------------
// Admin: Admins panel (super only)
// ---------------------------------------------------------------------------
async function loadAdminAdmins() {
  const panel = document.getElementById("adminAdminsPanel");
  const tbody = document.getElementById("adminAdminsTableBody");
  if (!panel || !tbody) return;
  panel.hidden = !appState.isSuper;
  if (!appState.isSuper) return;
  bindAdminsPanel();
  const t = tr();
  tbody.innerHTML = `<tr><td colspan="5" class="table-empty">${escapeHtml(t.loading)}</td></tr>`;
  const { ok, data } = await apiJson("/api/admin/admins");
  const list = Array.isArray(data) ? data : (Array.isArray(data.admins) ? data.admins : []);
  if (!ok && !list.length) { tbody.innerHTML = `<tr><td colspan="5" class="table-empty">${escapeHtml(errText(data))}</td></tr>`; return; }
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="5" class="table-empty">${escapeHtml(t.adminsEmpty)}</td></tr>`; return; }
  tbody.innerHTML = list.map(a => {
    const verified = a.status ? a.status === "active" : isOn(a.isVerified);
    return `<tr>
      <td class="cell-strong">${escapeHtml(a.email)}</td>
      <td>${escapeHtml(a.role === "super" ? t.roleSuper : t.roleAssist)}</td>
      <td><span class="status-dot ${verified ? "is-ok" : "is-pending"}">${escapeHtml(verified ? t.statusActive : t.statusInviteSent)}</span></td>
      <td class="muted">${escapeHtml(a.invitedBy || "")}${a.createdAt ? ` · ${escapeHtml(formatDate(a.createdAt))}` : ""}</td>
      <td class="col-actions"><div class="row-actions">
        ${verified ? "" : `<button type="button" class="nav-button btn-sm btn-resend-admin" data-email="${escapeHtml(a.email)}">${escapeHtml(t.resend)}</button>`}
        <button type="button" class="nav-button btn-sm btn-danger btn-remove-admin" data-email="${escapeHtml(a.email)}">${escapeHtml(t.remove)}</button>
      </div></td>
    </tr>`;
  }).join("");
}

/** Show the invite outcome; a previewLink means email isn't configured (demo mode). */
function showInviteResult(data, toastMsg) {
  const box = document.getElementById("adminInviteResult");
  const t = tr();
  if (data.previewLink) showInline(box, `<p>${escapeHtml(t.invitePreview)}</p>${copyRowHtml("", data.previewLink)}`, "info");
  else box.hidden = true;
  showToast(toastMsg);
}

function bindAdminsPanel() {
  const form = document.getElementById("formInviteAdmin");
  if (!form || form.dataset.bound) return;
  form.dataset.bound = "1";
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const t = tr();
    const email = document.getElementById("inputInviteAdminEmail").value.trim();
    const role = document.getElementById("selectInviteAdminRole").value;
    const box = document.getElementById("adminInviteResult");
    if (!isValidEmail(email)) { showInline(box, escapeHtml(t.emailInvalid), "error"); return; }
    const btn = document.getElementById("btnSendInvite");
    btn.disabled = true;
    const { ok, data } = await apiJson("/api/admin/admins", { method: "POST", body: { email, role } });
    btn.disabled = false;
    if (ok) { form.reset(); showInviteResult(data, t.inviteSentToast); loadAdminAdmins(); }
    else showInline(box, escapeHtml(errText(data)), "error");
  });
  document.getElementById("adminAdminsTableBody").addEventListener("click", async (e) => {
    const t = tr();
    const resend = e.target.closest(".btn-resend-admin");
    const remove = e.target.closest(".btn-remove-admin");
    if (resend) {
      resend.disabled = true;
      const { ok, data } = await apiJson("/api/admin/admins/resend", { method: "POST", body: { email: resend.dataset.email } });
      resend.disabled = false;
      if (ok) showInviteResult(data, t.resentToast);
      else showToast(errText(data), "warning");
    } else if (remove) {
      if (!confirm(fmt(t.confirmRemoveAdmin, { email: remove.dataset.email }))) return;
      const { ok, data } = await apiJson("/api/admin/admins", { method: "DELETE", body: { email: remove.dataset.email } });
      if (ok) { showToast(t.removedToast); loadAdminAdmins(); }
      else showToast(errText(data), "warning");
    }
  });
}

// ---------------------------------------------------------------------------
// Admin: infographics (super only)
// ---------------------------------------------------------------------------
async function generateInfographic(id) {
  const { ok, data } = await apiJson(`/api/admin/use-cases/${encodeURIComponent(id)}/infographic`, { method: "POST" });
  if (ok && data.infographicUrl) {
    [appState.loadedAdminUseCases || [], useCasesDb].forEach(list => {
      const uc = list.find(u => u.id === id);
      if (uc) uc.infographicUrl = data.infographicUrl;
    });
    showToast(tr().infographicDone);
    return data.infographicUrl;
  }
  showToast(`${tr().infographicFailed}${data.message || data.error ? `: ${data.message || data.error}` : ""}`, "warning");
  return null;
}

/**
 * Synchronous server batch (~2-3 min). The button shows a spinner and the
 * "generating" label for the whole request, then the summary toast.
 */
async function generateMissingInfographics(btn) {
  const t = tr();
  const missing = (appState.loadedAdminUseCases || []).filter(uc => !uc.infographicUrl);
  if (!missing.length) { showToast(t.genMissingNone); return; }
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.classList.add("is-busy");
  btn.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${escapeHtml(t.generating)}`;
  showToast(t.genMissingProgress);
  const { ok, data } = await apiJson("/api/admin/infographics/generate-missing", { method: "POST" });
  btn.disabled = false;
  btn.classList.remove("is-busy");
  btn.innerHTML = original;
  const results = Array.isArray(data.results) ? data.results : [];
  if (!ok && !results.length) { showToast(errText(data), "warning"); return; }
  const okCount = Number(data.generated ?? results.filter(r => r.success).length);
  const failCount = Number(data.failed ?? results.length - okCount);
  showToast(fmt(t.genMissingDone, { ok: okCount, fail: failCount }), failCount ? "warning" : "success");
  loadAdminUseCases();
  loadUseCasesFromServer();
}

function updateCaseInfographicPreview(uc) {
  const t = tr();
  const url = uc?.infographicUrl || "";
  const link = document.getElementById("formCaseInfographicLink");
  const img = document.getElementById("formCaseInfographicImg");
  const none = document.getElementById("formCaseInfographicNone");
  const btn = document.getElementById("btnFormCaseGenInfographic");
  if (!link) return;
  link.hidden = !url;
  if (url) { link.href = url; img.src = url; img.alt = uc.title || ""; }
  none.hidden = Boolean(url);
  btn.hidden = !(appState.isSuper && uc && uc.id);
  document.getElementById("btnFormCaseGenInfographicText").textContent = url ? t.regenerate : t.generate;
  btn.onclick = async () => {
    btn.disabled = true;
    document.getElementById("btnFormCaseGenInfographicText").textContent = t.generating;
    const newUrl = await generateInfographic(uc.id);
    btn.disabled = false;
    updateCaseInfographicPreview(newUrl ? { ...uc, infographicUrl: newUrl } : uc);
    if (newUrl) loadAdminUseCases();
  };
}

// ---------------------------------------------------------------------------
// Admin: Settings → Email (super only)
// ---------------------------------------------------------------------------
const SMTP_PRESETS = {
  gmail: { host: "smtp.gmail.com", port: 587, security: "starttls", hint: "hintGmail" },
  outlook: { host: "smtp-mail.outlook.com", port: 587, security: "starttls", hint: "hintOutlook" },
  m365: { host: "smtp.office365.com", port: 587, security: "starttls", hint: "hintM365" },
  custom: { hint: "" }
};

/** Which preset matches a saved host (for re-opening the form). Pure. */
const presetForHost = (host) =>
  Object.keys(SMTP_PRESETS).find(k => SMTP_PRESETS[k].host && SMTP_PRESETS[k].host === host) || "custom";

let smtpLoaded = null;

/**
 * Normalise GET/PUT /api/admin/settings/smtp:
 *   { config:{host,port,security,user,hasPassword,fromName,fromEmail,enabled},
 *     status:{mode:'demo'|'connected'|'failed'|'not_tested', lastTestAt, lastTestError},
 *     passwordDecryptFailed, updatedBy, updatedAt }
 * status.mode maps to testOk: connected → true, failed → false, otherwise null.
 */
function normaliseSmtp(data) {
  const c = data.config || {};
  const st = data.status || {};
  const mode = st.mode || "";
  return {
    host: c.host || "", port: c.port || "", security: c.security || "starttls",
    user: c.user || "", hasPassword: Boolean(c.hasPassword),
    fromName: c.fromName || "", fromEmail: c.fromEmail || "",
    enabled: c.enabled === undefined ? true : isOn(c.enabled),
    mode: mode === "demo" ? "demo" : "",
    testOk: mode === "connected" ? true : (mode === "failed" ? false : null),
    testAt: st.lastTestAt || null,
    testError: st.lastTestError || "",
    passwordDecryptFailed: Boolean(data.passwordDecryptFailed),
    updatedBy: data.updatedBy || "", updatedAt: data.updatedAt || null
  };
}

function renderSmtpStatus(s) {
  const t = tr();
  const pill = document.getElementById("smtpStatusPill");
  if (!pill) return;
  let cls = "is-muted", text = t.statusNotTested;
  if (s.mode === "demo") { cls = "is-muted"; text = t.statusDemo; }
  else if (s.testOk === true) { cls = "is-ok"; text = `${t.statusConnected}${s.testAt ? ` · ${formatDateTime(s.testAt)}` : ""}`; }
  else if (s.testOk === false) { cls = "is-error"; text = `${t.statusFailed}${s.testError ? `: ${s.testError}` : ""}`; }
  pill.className = `status-pill ${cls}`;
  pill.textContent = text;
  pill.title = text;
  const changed = document.getElementById("smtpLastChanged");
  if (changed) changed.textContent = s.updatedBy ? fmt(t.lastChanged, { by: s.updatedBy, date: formatDateTime(s.updatedAt) }) : "";
}

function applyPresetHint() {
  const key = document.getElementById("smtpPreset").value;
  const hintKey = SMTP_PRESETS[key]?.hint;
  document.getElementById("smtpPresetHint").textContent = hintKey ? tr()[hintKey] : "";
}

function updateSecurityWarning() {
  document.getElementById("smtpSecurityWarn").hidden = document.getElementById("smtpSecurity").value !== "none";
}

function readSmtpForm() {
  const v = (id) => document.getElementById(id).value.trim();
  const body = {
    host: v("smtpHost"), port: Number(v("smtpPort")) || "", security: v("smtpSecurity"),
    user: v("smtpUser"), fromName: v("smtpFromName"), fromEmail: v("smtpFromEmail"),
    enabled: document.getElementById("smtpEnabled").checked
  };
  const pw = document.getElementById("smtpPassword").value;
  if (pw) body.password = pw; // blank keeps the stored password
  return body;
}

function validateSmtpForm(body) {
  const t = tr();
  const errs = {
    smtpHost: body.host ? "" : t.hostRequired,
    smtpPort: body.port >= 1 && body.port <= 65535 ? "" : t.portInvalid,
    smtpFromEmail: !body.fromEmail || isValidEmail(body.fromEmail) ? "" : t.emailInvalid
  };
  Object.entries(errs).forEach(([id, m]) => setFieldError(id, m));
  return !Object.values(errs).some(Boolean);
}

async function loadSmtpSettings() {
  bindSmtpForm();
  const t = tr();
  const { ok, data } = await apiJson("/api/admin/settings/smtp");
  if (!ok) {
    showInline(document.getElementById("smtpTestResult"), escapeHtml(t.settingsLoadFailed), "error");
    renderSmtpStatus(normaliseSmtp({}));
    return;
  }
  document.getElementById("smtpTestResult").hidden = true;
  const s = normaliseSmtp(data);
  smtpLoaded = s;
  document.getElementById("smtpPreset").value = presetForHost(s.host);
  document.getElementById("smtpHost").value = s.host;
  document.getElementById("smtpPort").value = s.port;
  document.getElementById("smtpSecurity").value = ["starttls", "ssl", "none"].includes(s.security) ? s.security : "starttls";
  document.getElementById("smtpUser").value = s.user;
  const pw = document.getElementById("smtpPassword");
  pw.value = "";
  pw.placeholder = s.hasPassword && !s.passwordDecryptFailed ? t.smtpPasswordSaved : "";
  setFieldError("smtpPassword", s.passwordDecryptFailed ? t.smtpPasswordReenter : "");
  document.getElementById("smtpFromName").value = s.fromName;
  document.getElementById("smtpFromEmail").value = s.fromEmail;
  document.getElementById("smtpEnabled").checked = s.enabled;
  const testTo = document.getElementById("smtpTestTo");
  if (!testTo.value && isValidEmail(appState.userEmail)) testTo.value = appState.userEmail;
  ["smtpHost", "smtpPort", "smtpFromEmail"].forEach(id => setFieldError(id, ""));
  applyPresetHint();
  updateSecurityWarning();
  renderSmtpStatus(s);
}

function bindSmtpForm() {
  const form = document.getElementById("formSmtpSettings");
  if (!form || form.dataset.bound) return;
  form.dataset.bound = "1";
  document.getElementById("smtpPreset").addEventListener("change", (e) => {
    const p = SMTP_PRESETS[e.target.value];
    // Presets only pre-fill; every field stays editable afterwards
    if (p.host) {
      document.getElementById("smtpHost").value = p.host;
      document.getElementById("smtpPort").value = p.port;
      document.getElementById("smtpSecurity").value = p.security;
    }
    applyPresetHint();
    updateSecurityWarning();
  });
  document.getElementById("smtpSecurity").addEventListener("change", updateSecurityWarning);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = readSmtpForm();
    if (!validateSmtpForm(body)) return;
    const btn = document.getElementById("btnSmtpSave");
    btn.disabled = true;
    const { ok, data } = await apiJson("/api/admin/settings/smtp", { method: "PUT", body });
    btn.disabled = false;
    if (ok) { showToast(tr().settingsSaved); loadSmtpSettings(); return; }
    // 400 → { errors: { host|port|security|fromEmail } } mapped onto the field error slots
    const fieldMap = { host: "smtpHost", port: "smtpPort", security: "smtpSecurity", fromEmail: "smtpFromEmail" };
    Object.entries(data.errors || {}).forEach(([k, m]) => fieldMap[k] && setFieldError(fieldMap[k], m));
    showInline(document.getElementById("smtpTestResult"), escapeHtml(errText(data)), "error");
  });

  document.getElementById("btnSmtpTest").addEventListener("click", async () => {
    const t = tr();
    const body = readSmtpForm();
    if (!validateSmtpForm(body)) return;
    const to = document.getElementById("smtpTestTo").value.trim();
    if (to) body.to = to;
    const btn = document.getElementById("btnSmtpTest");
    const box = document.getElementById("smtpTestResult");
    btn.disabled = true;
    showInline(box, escapeHtml(t.testSending), "info");
    const { ok, data } = await apiJson("/api/admin/settings/smtp/test", { method: "POST", body });
    btn.disabled = false;
    if (ok && data.ok !== false) {
      showInline(box, escapeHtml(data.message || t.testOk), "success");
      renderSmtpStatus({ ...(smtpLoaded || {}), mode: "", testOk: true, testAt: new Date().toISOString() });
    } else {
      const err = data.error || data.message || t.statusFailed;
      showInline(box, `<strong>${escapeHtml(t.statusFailed)}:</strong> ${escapeHtml(err)}`, "error");
      renderSmtpStatus({ ...(smtpLoaded || {}), mode: "", testOk: false, testError: err });
    }
  });
}

// ===========================================================================
// v6 Quest Run — pixel hero strip, rotating quest bubble, Archie's news scrolls
// ---------------------------------------------------------------------------
// Everything below is declared only (no top-level DOM access) because app.js
// is also evaluated inside the server's vm sandbox for seed data.
// Pure helpers live in lib/quest-core.js (window.QuestCore).
// ===========================================================================
const QUEST_ROTATE_MS = 30000;
const QUEST_FOLD_MS = 180;
const QUEST_TYPE_MS = 600;
const QUEST_LS = { seen: "ge_quest_news_seen", dismissed: "ge_quest_news_dismissed", collapsed: "ge_quest_collapsed" };

/** Mutable state of the strip (one per page). */
const questState = {
  data: null, renderer: null, current: null,
  slot: 0, newsCursor: 0, lastHintId: null,
  elapsed: 0, timer: null, typeTimer: null,
  paused: false, hover: false, collapsed: false, drawerOpen: false,
  viewed: new Set(), bound: false, mountSeq: 0
};

const questLsGet = (k) => { try { return typeof localStorage !== "undefined" ? localStorage.getItem(k) : null; } catch (_) { return null; } };
const questLsSet = (k, v) => { try { if (typeof localStorage !== "undefined") localStorage.setItem(k, v); } catch (_) { /* private mode */ } };
const readQuestIds = (k) => { try { const v = JSON.parse(questLsGet(k) || "[]"); return Array.isArray(v) ? v : []; } catch (_) { return []; } };
const addQuestId = (k, id) => {
  const ids = readQuestIds(k);
  if (!ids.includes(id)) questLsSet(k, JSON.stringify([...ids, id].slice(-200)));
};
const pickLangText = (obj, lang) => (obj && (obj[lang] || obj.en)) || "";
const questReducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const questTheme = () => (typeof document !== "undefined" && document.documentElement.dataset.theme === "light" ? "light" : "dark");

/** News that is live today for this user (server already filtered by audience). */
const questLiveNews = () => (questState.data?.news || []).filter(n => QuestCore.newsStatus(n, QuestCore.localDateIso()) === "live");

/** "Semester A · Week 7 · Midterms" (breaks omit the phase). Pure given t. */
const questPositionText = (pos, t) => {
  const term = t.questTermFull?.[pos.term] || pos.term;
  const isBreak = pos.term === "winter" || pos.term === "summer";
  return isBreak
    ? fmt(t.questPositionBreak, { term, week: pos.week })
    : fmt(t.questPositionTemplate, { term, week: pos.week, phase: t.questPhase?.[pos.phase] || pos.phase });
};

const questCurrentPosition = () => QuestCore.getAcademicPosition(new Date(), questState.data?.calendar);

/** Fire-and-forget analytics; *_view events are deduplicated per page load. */
function recordQuestEvent(action, payload) {
  const key = `${action}:${payload.useCaseId || payload.newsId}`;
  if (action.endsWith("_view")) {
    if (questState.viewed.has(key)) return;
    questState.viewed.add(key);
  }
  apiJson("/api/quest/event", { method: "POST", body: { action, ...payload } });
}

/**
 * Fetches /api/quest and (re)builds the strip. Safe to call repeatedly (role
 * change, preview entry); stale responses are dropped via mountSeq.
 */
async function mountQuestRun() {
  if (typeof document === "undefined" || typeof QuestCore === "undefined") return;
  const strip = document.getElementById("questStrip");
  if (!strip) return;
  const seq = ++questState.mountSeq;
  const role = appState.userRole || "Lecturer";
  const { ok, data } = await apiJson(`/api/quest?role=${encodeURIComponent(role)}`);
  if (seq !== questState.mountSeq) return;
  if (!ok) { strip.hidden = true; return; }
  questState.data = data;
  questState.slot = 0;
  questState.newsCursor = 0;
  questState.elapsed = 0;
  bindQuestControls();
  strip.hidden = false;
  questState.collapsed = questLsGet(QUEST_LS.collapsed) === "1";
  if (questState.renderer) questState.renderer.destroy();
  questState.renderer = createQuestRenderer(document.getElementById("questCanvas"), data.heroClass || "wizard");
  applyQuestCollapsed();
  renderQuestTimeline();
  updateQuestBell();
  advanceQuestBubble(true);
  startQuestTimer();
}

// ---------------------------------------------------------------------------
// Canvas renderer
// ---------------------------------------------------------------------------
/** Code-drawn hero used when sprites are missing (10×12 px, 3 world px per cell). */
const QUEST_FALLBACK_HERO = [
  "...hhhh...", "..hhhhhh..", ".hhhhhhhh.", "...ssss...", "...sdsd...", "...ssss...",
  "..bbbbbb..", ".sbbbbbbs.", "..bbbbbb..", "..bbbbbb.."
];
const QUEST_FALLBACK_LEGS = [["..l....l..", "..l....l.."], ["...l..l...", "...l..l..."]];
const QUEST_HERO_COLOURS = {
  wizard: { h: "#3b5bdb", b: "#4c6ef5" },
  warrior: { h: "#868e96", b: "#c92a2a" },
  priest: { h: "#f1f3f5", b: "#f59f00" }
};
const QUEST_WORLD_H = 180;      // asset space height; scale = canvas css height / 180
const QUEST_GROUND_H = 48;
const QUEST_FEET_INSET = 10;    // feet sit on the grass, slightly below the ground's top edge
const QUEST_SCROLL_SPEED = 40;  // world px / s for parallax factor 1
const QUEST_LAYERS = ["bg_sky", "bg_far", "bg_mid", "bg_near"];

/**
 * Creates the Quest Run canvas renderer.
 *
 * Drawing model: everything is drawn in "world" units where the scene is 180
 * units tall (the asset height), so scale = canvas CSS height / 180 and the
 * world width = CSS width / scale. Layers tile horizontally with their
 * parallax factor; hero frames are bottom-centre aligned, Archie is centred.
 *
 * Loop: rAF capped at 30 fps; runs only while expanded, on screen
 * (IntersectionObserver) and the tab is visible. Reduced motion draws one
 * static frame instead of animating. Missing manifest / images fall back to
 * flat colour layers and pixel matrices per asset.
 */
function createQuestRenderer(canvas, heroClass) {
  const st = {
    assets: {}, manifest: null, mode: "loading", frames: 0, t: 0, scroll: 0,
    active: true, onScreen: true, rafId: 0, last: 0,
    hopAt: -1, swoopAt: -1, carrying: false,
    archie: { x: 0, y: 40, vx: 0, vy: 0, init: false },
    w: 0, h: 0, dpr: 1, scale: 1, worldW: 0, destroyed: false
  };
  const ctx = canvas ? canvas.getContext("2d") : null;
  const heroKey = `hero_${heroClass}`;

  const loadImage = (src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  async function loadAssets() {
    try {
      const res = await fetch("game/manifest.json");
      const manifest = res.ok ? await res.json() : {};
      st.manifest = manifest || {};
      const keys = [...QUEST_LAYERS, "ground", heroKey, "archie"].filter(k => st.manifest[k]?.file);
      const imgs = await Promise.all(keys.map(k => loadImage(`game/${st.manifest[k].file}`)));
      keys.forEach((k, i) => { if (imgs[i]) st.assets[k] = imgs[i]; });
    } catch (_) { st.manifest = {}; }
    const loaded = Object.keys(st.assets).length;
    st.mode = loaded === 0 ? "fallback" : (loaded >= QUEST_LAYERS.length + 3 ? "sprites" : "mixed");
    resize();
    draw();
    sync();
  }

  function resize() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    st.w = Math.max(1, rect.width);
    st.h = Math.max(1, rect.height);
    st.dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
    canvas.width = Math.round(st.w * st.dpr);
    canvas.height = Math.round(st.h * st.dpr);
    st.scale = st.h / QUEST_WORLD_H;
    st.worldW = st.w / st.scale;
    measureBubble();
  }

  /** Caches the quest bubble's left edge (CSS px, relative to the canvas) for laneRight(). */
  function measureBubble() {
    const bubble = canvas?.parentElement?.querySelector(".quest-bubble");
    if (!bubble || bubble.hidden) { st.bubbleLeft = 0; return; }
    const cr = canvas.getBoundingClientRect();
    const br = bubble.getBoundingClientRect();
    st.bubbleLeft = br.width > 0 ? br.left - cr.left : 0;
  }

  const heroX = () => Math.max(40, st.worldW * (st.w < 640 ? 0.1 : 0.07));
  /**
   * Right edge (world px) of the left-hand lane used by the hero and Archie: the quest
   * bubble's left edge minus a margin. Measured from the DOM on resize; falls back to 40%.
   */
  const laneRight = () => {
    const fallback = st.worldW * 0.4;
    const edge = st.bubbleLeft > 0 ? st.bubbleLeft / st.scale - 26 : fallback;
    return Math.max(heroX() + 40, Math.min(st.worldW - 24, edge));
  };
  const feetY = () => QUEST_WORLD_H - QUEST_GROUND_H + QUEST_FEET_INSET;

  /** Tiles an image horizontally with a parallax offset. */
  function tile(img, w, h, y, factor) {
    const off = ((st.scroll * factor) % w + w) % w;
    for (let x = -off; x < st.worldW; x += w) ctx.drawImage(img, Math.floor(x), y, w, h);
  }

  function drawFallbackLayers() {
    const light = questTheme() === "light";
    ctx.fillStyle = light ? "#bfe3ff" : "#1b2340";
    ctx.fillRect(0, 0, st.worldW, QUEST_WORLD_H);
    // Two sine-wave hill bands at different parallax speeds.
    [[0.2, light ? "#9cc9a5" : "#26324f", 92, 18, 0.018], [0.45, light ? "#6fae7c" : "#2f4a45", 112, 12, 0.03]]
      .forEach(([factor, colour, base, amp, freq]) => {
        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.moveTo(0, QUEST_WORLD_H);
        for (let x = 0; x <= st.worldW + 4; x += 4) {
          ctx.lineTo(x, base - Math.sin((x + st.scroll * factor) * freq) * amp);
        }
        ctx.lineTo(st.worldW, QUEST_WORLD_H);
        ctx.fill();
      });
  }

  function drawFallbackGround() {
    const y = QUEST_WORLD_H - QUEST_GROUND_H;
    ctx.fillStyle = "#6b4a2b";
    ctx.fillRect(0, y, st.worldW, QUEST_GROUND_H);
    ctx.fillStyle = "#3f9b3f";
    ctx.fillRect(0, y, st.worldW, 9);
    // Moving grass tufts sell the scroll direction.
    ctx.fillStyle = "#2f7d32";
    const off = st.scroll % 24;
    for (let x = -off; x < st.worldW; x += 24) ctx.fillRect(Math.floor(x), y + 9, 6, 3);
  }

  function drawHero() {
    const hopP = st.hopAt >= 0 ? (st.t - st.hopAt) / 0.45 : 2;
    const lift = hopP >= 0 && hopP <= 1 ? Math.sin(Math.PI * hopP) * 14 : 0;
    const spec = st.manifest?.[heroKey];
    const img = st.assets[heroKey];
    if (img && spec) {
      const frame = Math.floor(st.t * (spec.fps || 10)) % (spec.frames || 1);
      ctx.drawImage(img, frame * spec.frameW, 0, spec.frameW, spec.frameH,
        Math.round(heroX() - spec.frameW / 2), Math.round(feetY() - spec.frameH - lift), spec.frameW, spec.frameH);
      return;
    }
    const px = 3;
    const colours = { ...QUEST_HERO_COLOURS[heroClass] || QUEST_HERO_COLOURS.wizard, s: "#f1c27d", d: "#222", l: "#5c3d2e" };
    const rows = [...QUEST_FALLBACK_HERO, ...QUEST_FALLBACK_LEGS[Math.floor(st.t * 6) % 2]];
    const x0 = Math.round(heroX() - (rows[0].length * px) / 2);
    const y0 = Math.round(feetY() - rows.length * px - lift);
    rows.forEach((row, r) => [...row].forEach((c, col) => {
      if (c === ".") return;
      ctx.fillStyle = colours[c];
      ctx.fillRect(x0 + col * px, y0 + r * px, px, px);
    }));
  }

  /**
   * Archie's flight: a damped spring chases a target point. While wandering,
   * the target drifts on two sines around a spot above-right of the hero.
   * A swoop (1.6 s) first pulls the target to the top-right, then dives to
   * just above the hero's head (delivering the scroll), then releases back
   * to wandering. Spring: a = k·(target − pos) − c·v.
   */
  function updateArchie(dt) {
    const a = st.archie;
    const hx = heroX();
    // Archie's lane spans from just behind the hero to the left edge of the quest bubble,
    // so he never flies underneath the (right-aligned) DOM bubble.
    const lane = laneRight();
    const span = Math.max(40, lane - hx);
    // Random retarget every 4–8s gives the "drifting apart" feel on top of the sine wander.
    if (!(st.t < (a.nextPick || 0))) {
      a.rx = (Math.random() - 0.5) * 0.7 * span;
      a.ry = (Math.random() - 0.5) * 20;
      a.nextPick = st.t + 4 + Math.random() * 4;
      measureBubble();
    }
    let tx = hx + span * 0.5 + (a.rx || 0) + Math.sin(st.t * 0.7) * span * 0.15;
    let ty = 42 + (a.ry || 0) + Math.sin(st.t * 1.3) * 10;
    let k = 6;
    const p = st.swoopAt >= 0 ? (st.t - st.swoopAt) / 1.6 : 2;
    if (p >= 0 && p < 0.35) { tx = lane; ty = 16; k = 14; }
    else if (p >= 0.35 && p < 0.75) { tx = hx + 26; ty = feetY() - 62; k = 18; }
    tx = Math.min(lane, Math.max(16, tx));
    if (!a.init) { a.x = tx; a.y = ty; a.init = true; }
    a.vx += (k * (tx - a.x) - 4.5 * a.vx) * dt;
    a.vy += (k * (ty - a.y) - 4.5 * a.vy) * dt;
    a.x += a.vx * dt;
    a.y += a.vy * dt;
  }

  function drawArchie() {
    const a = st.archie;
    if (!a.init) updateArchie(0);
    const spec = st.manifest?.archie;
    const img = st.assets.archie;
    // Fast descent = glide on a level-wing frame (1); otherwise flap up/level/down/level.
    const gliding = a.vy > 60;
    if (img && spec) {
      const frame = gliding ? 1 : Math.floor(st.t * (spec.fps || 8)) % (spec.frames || 1);
      ctx.drawImage(img, frame * spec.frameW, 0, spec.frameW, spec.frameH,
        Math.round(a.x - spec.frameW / 2), Math.round(a.y - spec.frameH / 2), spec.frameW, spec.frameH);
    } else {
      const flap = gliding ? 0 : Math.sin(st.t * 16) * 4;
      ctx.fillStyle = "#8d6e63";
      ctx.fillRect(Math.round(a.x - 14), Math.round(a.y - 2 + flap), 8, 4);
      ctx.fillRect(Math.round(a.x + 6), Math.round(a.y - 2 + flap), 8, 4);
      ctx.fillStyle = "#a1887f";
      ctx.fillRect(Math.round(a.x - 7), Math.round(a.y - 8), 14, 16);
      ctx.fillStyle = "#fff";
      ctx.fillRect(Math.round(a.x - 5), Math.round(a.y - 5), 4, 4);
      ctx.fillRect(Math.round(a.x + 1), Math.round(a.y - 5), 4, 4);
      ctx.fillStyle = "#f59f00";
      ctx.fillRect(Math.round(a.x - 1), Math.round(a.y), 2, 3);
    }
    if (st.carrying) {
      const sx = Math.round(a.x - 6), sy = Math.round(a.y + 12);
      ctx.fillStyle = "#f4e2b8";
      ctx.fillRect(sx, sy, 12, 7);
      ctx.fillStyle = "#b07a3c";
      ctx.fillRect(sx - 2, sy - 1, 2, 9);
      ctx.fillRect(sx + 12, sy - 1, 2, 9);
      ctx.fillStyle = "#c0392b";
      ctx.fillRect(sx + 5, sy + 2, 2, 3);
    }
  }

  function draw() {
    if (!ctx || st.destroyed) return;
    ctx.setTransform(st.dpr * st.scale, 0, 0, st.dpr * st.scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, st.worldW, QUEST_WORLD_H);
    const haveLayers = QUEST_LAYERS.every(k => st.assets[k]);
    if (haveLayers) {
      QUEST_LAYERS.forEach(k => {
        const s = st.manifest[k];
        tile(st.assets[k], s.w || st.assets[k].naturalWidth, s.h || QUEST_WORLD_H, 0, s.parallax ?? 0.5);
      });
    } else drawFallbackLayers();
    // Dusk tint keeps the daytime art calm against the dark UI.
    if (questTheme() === "dark") {
      ctx.fillStyle = "rgba(12, 16, 40, 0.28)";
      ctx.fillRect(0, 0, st.worldW, QUEST_WORLD_H);
    }
    const g = st.manifest?.ground;
    if (st.assets.ground && g) tile(st.assets.ground, g.w, g.h, QUEST_WORLD_H - g.h, g.parallax ?? 1);
    else drawFallbackGround();
    drawHero();
    drawArchie();
    st.frames += 1;
  }

  const shouldRun = () => st.mode !== "loading" && st.active && st.onScreen && !st.destroyed &&
    !(typeof document !== "undefined" && document.hidden) && !questReducedMotion();

  function loop(now) {
    st.rafId = 0;
    if (!shouldRun()) return;
    st.rafId = requestAnimationFrame(loop);
    if (!st.last) { st.last = now; return; }
    // 30 fps cap: skip frames that arrive sooner than ~33 ms.
    if (now - st.last < 1000 / 30 - 1) return;
    const dt = Math.min(0.1, (now - st.last) / 1000);
    st.last = now;
    st.t += dt;
    st.scroll += QUEST_SCROLL_SPEED * dt;
    updateArchie(dt);
    draw();
  }

  function sync() {
    if (shouldRun()) {
      if (!st.rafId) { st.last = 0; st.rafId = requestAnimationFrame(loop); }
    } else {
      if (st.rafId) cancelAnimationFrame(st.rafId);
      st.rafId = 0;
      if (st.mode !== "loading" && st.active) draw(); // static frame (reduced motion / paused)
    }
  }

  const onVisibility = () => sync();
  const onResize = () => { resize(); draw(); };
  let io = null;
  if (canvas && typeof IntersectionObserver !== "undefined") {
    io = new IntersectionObserver((entries) => { st.onScreen = entries.some(e => e.isIntersecting); sync(); });
    io.observe(canvas);
  }
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);
  if (typeof window !== "undefined") window.addEventListener("resize", onResize);

  const api = {
    hop() { st.hopAt = st.t; if (!st.rafId) draw(); },
    swoop() { st.swoopAt = st.t; },
    setCarrying(on) { st.carrying = Boolean(on); if (!st.rafId) draw(); },
    setActive(on) { st.active = Boolean(on); if (st.active) resize(); sync(); },
    redraw() { resize(); draw(); },
    destroy() {
      st.destroyed = true;
      if (st.rafId) cancelAnimationFrame(st.rafId);
      if (io) io.disconnect();
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility);
      if (typeof window !== "undefined") window.removeEventListener("resize", onResize);
    },
    debug: () => ({ frames: st.frames, mode: st.mode, assets: Object.keys(st.assets), running: Boolean(st.rafId), reducedMotion: questReducedMotion() })
  };
  if (typeof window !== "undefined") window.__questDebug = api.debug;
  if (ctx) { resize(); loadAssets(); }
  return api;
}

// ---------------------------------------------------------------------------
// Bubble rotation
// ---------------------------------------------------------------------------
const questIsPaused = () => {
  const strip = document.getElementById("questStrip");
  return questState.paused || questState.hover || questState.collapsed || questState.drawerOpen ||
    document.hidden || !strip || strip.hidden || strip.offsetParent === null;
};

/** 1 s accumulator: paused time doesn't count towards the 30 s rotation. */
function startQuestTimer() {
  if (questState.timer) clearInterval(questState.timer);
  questState.timer = setInterval(() => {
    if (questIsPaused()) return;
    questState.elapsed += 1000;
    if (questState.elapsed >= QUEST_ROTATE_MS) {
      questState.elapsed = 0;
      advanceQuestBubble(false);
    }
  }, 1000);
}

/** Chooses the next slot (news every 4th slot, else a phase-weighted hint) and shows it. */
function advanceQuestBubble(first) {
  const d = questState.data;
  if (!d) return;
  const plan = QuestCore.planQuestSlot({
    slotIndex: questState.slot, news: questLiveNews(),
    seenIds: readQuestIds(QUEST_LS.seen), dismissedIds: readQuestIds(QUEST_LS.dismissed),
    newsCursor: questState.newsCursor
  });
  questState.newsCursor = plan.newsCursor;
  questState.slot += 1;
  let item = null;
  if (plan.kind === "news") item = { kind: "news", news: plan.item };
  else {
    const hint = QuestCore.pickWeightedHint(d.hints, questCurrentPosition().phase, questState.lastHintId);
    if (hint) { questState.lastHintId = hint.id; item = { kind: "hint", hint }; }
  }
  showQuestItem(item, !first);
}

/** Folds the bubble, hops/swoops, then types the new text in (instant under reduced motion). */
function showQuestItem(item, animate) {
  const bubble = document.getElementById("questBubble");
  if (!bubble) return;
  questState.current = item;
  clearTimeout(questState.typeTimer);
  const reduced = questReducedMotion();
  const r = questState.renderer;
  if (r) r.setCarrying(item?.kind === "news");
  if (animate && !reduced) {
    bubble.classList.add("is-folding");
    questState.typeTimer = setTimeout(() => {
      bubble.classList.remove("is-folding");
      if (r) (item?.kind === "news" ? r.swoop() : r.hop());
      renderQuestBubble(item, true);
    }, QUEST_FOLD_MS);
  } else {
    if (r && item?.kind === "news" && !reduced) r.swoop();
    renderQuestBubble(item, false);
  }
  if (item?.kind === "news") {
    addQuestId(QUEST_LS.seen, item.news.id);
    recordQuestEvent("news_view", { newsId: item.news.id });
    updateQuestBell();
  } else if (item?.kind === "hint") {
    recordQuestEvent("quest_view", { useCaseId: item.hint.useCaseId });
  }
}

const findUseCase = (id) => useCasesDb.find(u => u.id === id) || null;

function renderQuestBubble(item, typewriter) {
  const t = tr();
  const lang = appState.activeLanguage || "en";
  const $ = (id) => document.getElementById(id);
  const bubble = $("questBubble");
  if (!bubble) return;
  const kind = item?.kind || "hint";
  bubble.dataset.kind = kind;
  const phase = questCurrentPosition().phase;
  $("questBubbleKicker").textContent = kind === "news" ? t.newsKicker : fmt(t.questHintKicker, { phase: t.questPhase?.[phase] || phase });
  const text = item?.kind === "news" ? pickLangText(item.news.title, lang)
    : item?.kind === "hint" ? pickLangText(item.hint.question, lang) : t.questEmpty;
  const body = item?.kind === "news" ? pickLangText(item.news.body, lang) : "";
  $("questBubbleFull").textContent = body ? `${text} ${body}` : text;
  const bodyEl = $("questBubbleBody");
  bodyEl.textContent = body;
  bodyEl.hidden = !body;

  // Action: hints open their playbook; news opens its playbook or web link.
  const action = $("questBubbleAction");
  let label = "";
  if (item?.kind === "hint" && findUseCase(item.hint.useCaseId)) label = t.questOpenPlaybook;
  if (item?.kind === "news") {
    if (item.news.useCaseId && findUseCase(item.news.useCaseId)) label = t.questOpenPlaybook;
    else if (item.news.linkUrl) label = t.newsOpenLink;
  }
  $("questBubbleActionText").textContent = label;
  action.hidden = !label;
  $("questDismissBtn").hidden = kind !== "news";

  const typed = $("questBubbleTyped");
  clearTimeout(questState.typeTimer);
  if (!typewriter) { typed.textContent = text; return; }
  // Typewriter: reveal ~30 steps over QUEST_TYPE_MS regardless of length.
  const chars = [...text];
  const step = Math.max(1, Math.ceil(chars.length / 30));
  const delay = Math.max(10, Math.floor(QUEST_TYPE_MS / Math.ceil(chars.length / step)));
  let shown = 0;
  const tick = () => {
    shown = Math.min(chars.length, shown + step);
    typed.textContent = chars.slice(0, shown).join("");
    if (shown < chars.length) questState.typeTimer = setTimeout(tick, delay);
  };
  typed.textContent = "";
  tick();
}

function openQuestPlaybook(useCaseId) {
  const uc = findUseCase(useCaseId);
  if (uc) openUseCaseModal(uc);
}

/** Opens a news item's target (playbook first, else web link) and logs the click. */
function openQuestNews(news) {
  if (!news) return;
  recordQuestEvent("news_click", { newsId: news.id });
  if (news.useCaseId && findUseCase(news.useCaseId)) openQuestPlaybook(news.useCaseId);
  else if (news.linkUrl && typeof window !== "undefined") window.open(news.linkUrl, "_blank", "noopener");
}

// ---------------------------------------------------------------------------
// Timeline, bell + drawer, collapse
// ---------------------------------------------------------------------------
function renderQuestTimeline() {
  const d = questState.data;
  const track = document.getElementById("questTrack");
  const label = document.getElementById("questPositionLabel");
  if (!d || !track) return;
  const t = tr();
  const lang = appState.activeLanguage || "en";
  const pos = questCurrentPosition();
  const year = QuestCore.getAcademicYear(new Date(), d.calendar);
  let monthFmt;
  try { monthFmt = new Intl.DateTimeFormat(lang, { month: "short" }); } catch (_) { monthFmt = new Intl.DateTimeFormat("en", { month: "short" }); }
  const pct = (v) => `${(v * 100).toFixed(2)}%`;
  const terms = year.terms.map(s => `
    <div class="quest-term quest-term-${s.key}${s.key === pos.term ? " is-current" : ""}" style="left:${pct(s.startPct)};width:${pct(s.endPct - s.startPct)}">
      <span class="quest-term-label">${escapeHtml(t.questTermShort?.[s.key] || s.key)}</span>
    </div>`).join("");
  const months = year.months.map((m, i) =>
    `<span class="quest-month${i % 2 ? " is-odd" : ""}" style="left:${pct(m.pct)}">${escapeHtml(monthFmt.format(new Date(m.year, m.month - 1, 1)))}</span>`).join("");
  track.innerHTML = `<div class="quest-terms">${terms}</div><div class="quest-months">${months}</div>
    <span class="quest-today" style="left:${pct(year.todayPct)}"><span class="material-symbols-outlined" aria-hidden="true">flag</span></span>`;
  const text = questPositionText(pos, t);
  if (label) label.textContent = text;
  track.setAttribute("aria-label", `${t.questTimelineLabel}: ${text}`);
}

function updateQuestBell() {
  const badge = document.getElementById("questBellBadge");
  if (!badge) return;
  const seen = new Set(readQuestIds(QUEST_LS.seen));
  const unseen = questLiveNews().filter(n => !seen.has(n.id)).length;
  badge.textContent = String(unseen);
  badge.hidden = unseen === 0;
}

function renderQuestDrawer() {
  const t = tr();
  const lang = appState.activeLanguage || "en";
  const list = document.getElementById("questDrawerList");
  const empty = document.getElementById("questDrawerEmpty");
  if (!list) return;
  const news = questLiveNews();
  list.innerHTML = news.map(n => {
    const title = pickLangText(n.title, lang);
    const body = pickLangText(n.body, lang);
    const hasCase = n.useCaseId && findUseCase(n.useCaseId);
    const actionLabel = hasCase ? t.questOpenPlaybook : (n.linkUrl ? t.newsOpenLink : "");
    const date = n.startsAt ? formatDate(n.startsAt) : "";
    return `<li class="quest-drawer-item${n.pinned ? " is-pinned" : ""}">
      <div class="quest-drawer-item-head">
        <span class="material-symbols-outlined" aria-hidden="true">${n.pinned ? "push_pin" : "history_edu"}</span>
        <h3>${escapeHtml(title)}</h3>
      </div>
      ${body ? `<p>${escapeHtml(body)}</p>` : ""}
      <div class="quest-drawer-item-foot">
        <span class="quest-drawer-date">${escapeHtml(date)}</span>
        ${actionLabel ? `<button type="button" class="quest-action" data-news-id="${Number(n.id)}"><span>${escapeHtml(actionLabel)}</span><span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button>` : ""}
      </div>
    </li>`;
  }).join("");
  if (empty) empty.hidden = news.length > 0;
}

function openQuestDrawer() {
  const drawer = document.getElementById("questDrawer");
  if (!drawer) return;
  renderQuestDrawer();
  questLiveNews().forEach(n => addQuestId(QUEST_LS.seen, n.id));
  updateQuestBell();
  questState.drawerOpen = true;
  drawer.hidden = false;
  document.getElementById("questDrawerBackdrop").hidden = false;
  requestAnimationFrame(() => drawer.classList.add("is-open"));
  document.getElementById("questBellBtn").setAttribute("aria-expanded", "true");
  setTimeout(() => (document.getElementById("questDrawerClose") || drawer).focus(), 30);
}

function closeQuestDrawer() {
  const drawer = document.getElementById("questDrawer");
  if (!drawer || drawer.hidden) return;
  questState.drawerOpen = false;
  drawer.classList.remove("is-open");
  drawer.hidden = true;
  document.getElementById("questDrawerBackdrop").hidden = true;
  const bell = document.getElementById("questBellBtn");
  bell.setAttribute("aria-expanded", "false");
  bell.focus();
}

function applyQuestCollapsed() {
  const t = tr();
  const strip = document.getElementById("questStrip");
  const scene = document.getElementById("questScene");
  const btn = document.getElementById("questCollapseBtn");
  if (!strip || !scene || !btn) return;
  const c = questState.collapsed;
  strip.classList.toggle("is-collapsed", c);
  scene.hidden = c;
  btn.setAttribute("aria-expanded", String(!c));
  const label = c ? t.questExpand : t.questCollapse;
  btn.setAttribute("aria-label", label);
  btn.title = label;
  btn.dataset.i18nAria = c ? "questExpand" : "questCollapse";
  btn.dataset.i18nTitle = btn.dataset.i18nAria;
  btn.querySelector(".material-symbols-outlined").textContent = c ? "expand_more" : "expand_less";
  if (questState.renderer) questState.renderer.setActive(!c);
}

function applyQuestPaused() {
  const t = tr();
  const btn = document.getElementById("questPauseBtn");
  if (!btn) return;
  const p = questState.paused;
  btn.setAttribute("aria-pressed", String(p));
  const label = p ? t.questResume : t.questPause;
  btn.setAttribute("aria-label", label);
  btn.title = label;
  btn.dataset.i18nAria = p ? "questResume" : "questPause";
  btn.dataset.i18nTitle = btn.dataset.i18nAria;
  btn.querySelector(".material-symbols-outlined").textContent = p ? "play_arrow" : "pause";
}

/** Binds strip controls once per page. */
function bindQuestControls() {
  if (questState.bound) return;
  questState.bound = true;
  const $ = (id) => document.getElementById(id);
  const bubble = $("questBubble");
  bubble.addEventListener("mouseenter", () => { questState.hover = true; });
  bubble.addEventListener("mouseleave", () => { questState.hover = false; });
  bubble.addEventListener("focusin", () => { questState.hover = true; });
  bubble.addEventListener("focusout", (e) => { if (!bubble.contains(e.relatedTarget)) questState.hover = false; });

  $("questBubbleAction").addEventListener("click", () => {
    const item = questState.current;
    if (item?.kind === "hint") {
      recordQuestEvent("quest_click", { useCaseId: item.hint.useCaseId });
      openQuestPlaybook(item.hint.useCaseId);
    } else if (item?.kind === "news") openQuestNews(item.news);
  });
  $("questPauseBtn").addEventListener("click", () => { questState.paused = !questState.paused; applyQuestPaused(); });
  $("questDismissBtn").addEventListener("click", () => {
    const item = questState.current;
    if (item?.kind !== "news") return;
    addQuestId(QUEST_LS.dismissed, item.news.id);
    questState.elapsed = 0;
    advanceQuestBubble(false);
  });
  $("questCollapseBtn").addEventListener("click", () => {
    questState.collapsed = !questState.collapsed;
    questLsSet(QUEST_LS.collapsed, questState.collapsed ? "1" : "0");
    applyQuestCollapsed();
  });
  $("questBellBtn").addEventListener("click", openQuestDrawer);
  $("questDrawerClose").addEventListener("click", closeQuestDrawer);
  $("questDrawerBackdrop").addEventListener("click", closeQuestDrawer);
  $("questDrawer").addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); closeQuestDrawer(); } });
  $("questDrawerList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-news-id]");
    if (!btn) return;
    const news = questLiveNews().find(n => n.id === Number(btn.dataset.newsId));
    closeQuestDrawer();
    openQuestNews(news);
  });
}

/** Called by applyTheme(). */
function questOnThemeChange() {
  if (questState.renderer) questState.renderer.redraw();
}

/** Called at the end of updateUILanguage(): re-renders dynamic strip + admin text. */
function questOnLanguageChange() {
  if (typeof document === "undefined") return;
  if (questState.data) {
    renderQuestTimeline();
    renderQuestBubble(questState.current, false);
    applyQuestCollapsed();
    applyQuestPaused();
    if (questState.drawerOpen) renderQuestDrawer();
  }
  if (newsAdminState.bound) { renderNewsAudience(readNewsAudience()); renderNewsTable(); updateNewsPreview(); }
  if (calendarState.bound) { renderCalendarForm(readCalendarForm()); renderCalendarStatus(); }
  if (document.getElementById("formCaseTiming")?.dataset.rendered) {
    const state = readCaseQuestFields();
    renderCaseQuestFields(state, appState.isAssist === true);
  }
}

// ===========================================================================
// v6 Admin: News tab (announcements Archie delivers)
// ===========================================================================
const newsAdminState = { list: [], bound: false, editing: null };

/** Audience checkboxes from QuestCore.ROLES with localised role names. */
function renderNewsAudience(selected) {
  const grid = document.getElementById("newsAudienceGrid");
  if (!grid) return;
  const t = tr();
  grid.innerHTML = QuestCore.ROLES.map(r => `
    <label class="check-row"><input type="checkbox" name="newsAudience" value="${escapeHtml(r)}"${selected.includes(r) ? " checked" : ""}> <span>${escapeHtml(t.questRoleShort?.[r] || r)}</span></label>`).join("");
}
const readNewsAudience = () => [...document.querySelectorAll("input[name='newsAudience']:checked")].map(b => b.value);

function updateNewsCounters() {
  document.querySelectorAll("#formNews [data-counter]").forEach(el => {
    const p = document.querySelector(`[data-counter-for="${el.id}"]`);
    if (!p) return;
    const max = Number(el.dataset.counter);
    p.textContent = `${[...el.value].length} / ${max}`;
    p.classList.toggle("is-near", [...el.value].length > max * 0.9);
  });
}

function updateNewsPreview() {
  const lang = appState.activeLanguage || "en";
  const val = (id) => (document.getElementById(id)?.value || "").trim();
  const byLang = {
    en: [val("newsTitleEn"), val("newsBodyEn")],
    "zh-TW": [val("newsTitleZhTw"), val("newsBodyZhTw")],
    "zh-CN": [val("newsTitleZhCn"), val("newsBodyZhCn")]
  };
  const [title, body] = byLang[lang] && byLang[lang][0] ? byLang[lang] : byLang.en;
  const pt = document.getElementById("newsPreviewTitle");
  const pb = document.getElementById("newsPreviewBody");
  if (pt) pt.textContent = title || tr().newsPreviewEmpty;
  if (pb) { pb.textContent = body; pb.hidden = !body; }
}

function syncNewsLinkType() {
  const type = document.getElementById("newsLinkType").value;
  document.getElementById("newsLinkUrlGroup").hidden = type !== "url";
  document.getElementById("newsLinkCaseGroup").hidden = type !== "case";
}

function fillNewsCaseOptions(selectedId) {
  const sel = document.getElementById("newsLinkCase");
  if (!sel) return;
  const lang = appState.activeLanguage || "en";
  const cases = (appState.loadedAdminUseCases && appState.loadedAdminUseCases.length) ? appState.loadedAdminUseCases : useCasesDb;
  sel.innerHTML = cases.map(c => {
    const title = c.translations?.[lang]?.title || useCasesTranslations?.[c.id]?.[lang]?.title || c.title;
    return `<option value="${escapeHtml(c.id)}"${c.id === selectedId ? " selected" : ""}>${escapeHtml(title)}</option>`;
  }).join("");
}

const NEWS_FIELD_MAP = {
  titleEn: "newsTitleEn", titleZhTw: "newsTitleZhTw", titleZhCn: "newsTitleZhCn",
  bodyEn: "newsBodyEn", bodyZhTw: "newsBodyZhTw", bodyZhCn: "newsBodyZhCn",
  linkUrl: "newsLinkUrl", useCaseId: "newsLinkCase", endsAt: "newsEndsAt", startsAt: "newsEndsAt"
};

function resetNewsForm(n) {
  const t = tr();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ""; };
  newsAdminState.editing = n ? n.id : null;
  set("newsId", n ? n.id : "");
  set("newsTitleEn", n?.title?.en); set("newsBodyEn", n?.body?.en);
  set("newsTitleZhTw", n?.title?.["zh-TW"]); set("newsBodyZhTw", n?.body?.["zh-TW"]);
  set("newsTitleZhCn", n?.title?.["zh-CN"]); set("newsBodyZhCn", n?.body?.["zh-CN"]);
  set("newsLinkUrl", n?.linkUrl);
  set("newsStartsAt", n ? n.startsAt : QuestCore.localDateIso());
  set("newsEndsAt", n?.endsAt);
  document.getElementById("newsLinkType").value = n?.useCaseId ? "case" : (n?.linkUrl ? "url" : "none");
  fillNewsCaseOptions(n?.useCaseId);
  document.getElementById("newsPinned").checked = Boolean(n?.pinned);
  document.getElementById("newsActive").checked = n ? Boolean(n.active) : true;
  renderNewsAudience(n?.audience || []);
  Object.values(NEWS_FIELD_MAP).forEach(id => setFieldError(id, ""));
  document.getElementById("newsFormResult").hidden = true;
  const title = document.getElementById("newsFormTitle");
  title.dataset.i18n = n ? "newsFormTitleEdit" : "newsFormTitleNew";
  title.textContent = n ? t.newsFormTitleEdit : t.newsFormTitleNew;
  document.getElementById("btnNewsCancel").hidden = !n;
  const save = document.getElementById("btnNewsSave");
  save.dataset.i18n = n ? "newsSaveChanges" : "newsPublish";
  save.textContent = n ? t.newsSaveChanges : t.newsPublish;
  syncNewsLinkType();
  updateNewsCounters();
  updateNewsPreview();
}

function readNewsForm() {
  const val = (id) => document.getElementById(id).value.trim();
  const type = document.getElementById("newsLinkType").value;
  return {
    title: { en: val("newsTitleEn"), "zh-TW": val("newsTitleZhTw"), "zh-CN": val("newsTitleZhCn") },
    body: { en: val("newsBodyEn"), "zh-TW": val("newsBodyZhTw"), "zh-CN": val("newsBodyZhCn") },
    linkUrl: type === "url" ? val("newsLinkUrl") : null,
    useCaseId: type === "case" ? val("newsLinkCase") : null,
    audience: readNewsAudience(),
    startsAt: val("newsStartsAt") || null,
    endsAt: val("newsEndsAt") || null,
    pinned: document.getElementById("newsPinned").checked,
    active: document.getElementById("newsActive").checked
  };
}

/** Client-side checks mirror the server's validateAnnouncement(). Returns {field: message}. */
function validateNewsForm(b) {
  const t = tr();
  const errors = {};
  if (!b.title.en) errors.newsTitleEn = t.newsErrTitle;
  if (b.linkUrl !== null && !/^https?:\/\/\S+$/i.test(b.linkUrl)) errors.newsLinkUrl = t.newsErrLink;
  if (b.useCaseId === "") errors.newsLinkCase = t.newsErrCase;
  if (b.startsAt && b.endsAt && b.endsAt < b.startsAt) errors.newsEndsAt = t.newsErrDates;
  return errors;
}

function bindNewsForm() {
  const form = document.getElementById("formNews");
  if (!form || newsAdminState.bound) return;
  newsAdminState.bound = true;
  form.addEventListener("input", () => { updateNewsCounters(); updateNewsPreview(); });
  document.getElementById("newsLinkType").addEventListener("change", syncNewsLinkType);
  document.getElementById("btnNewsCancel").addEventListener("click", () => resetNewsForm(null));
  document.getElementById("btnNewsTranslate").addEventListener("click", translateNewsForm);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const t = tr();
    const body = readNewsForm();
    Object.values(NEWS_FIELD_MAP).forEach(id => setFieldError(id, ""));
    const errs = validateNewsForm(body);
    if (Object.keys(errs).length) {
      Object.entries(errs).forEach(([id, m]) => setFieldError(id, m));
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    const btn = document.getElementById("btnNewsSave");
    btn.disabled = true;
    const id = newsAdminState.editing;
    const { ok, data } = await apiJson(id ? `/api/admin/announcements/${id}` : "/api/admin/announcements", { method: id ? "PUT" : "POST", body });
    btn.disabled = false;
    if (ok) {
      showToast(id ? t.newsUpdated : t.newsPublished, "success");
      resetNewsForm(null);
      loadAdminNews();
      return;
    }
    Object.entries(data.errors || {}).forEach(([k, m]) => NEWS_FIELD_MAP[k] && setFieldError(NEWS_FIELD_MAP[k], m));
    showInline(document.getElementById("newsFormResult"), escapeHtml(errText(data)), "error");
  });
  document.getElementById("adminNewsTableBody").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-news-action]");
    if (!btn) return;
    const n = newsAdminState.list.find(x => x.id === Number(btn.dataset.id));
    if (!n) return;
    if (btn.dataset.newsAction === "edit") {
      resetNewsForm(n);
      document.getElementById("formNews").scrollIntoView({ behavior: questReducedMotion() ? "auto" : "smooth", block: "start" });
      document.getElementById("newsTitleEn").focus({ preventScroll: true });
      return;
    }
    const t = tr();
    if (!confirm(fmt(t.newsConfirmDelete, { title: pickLangText(n.title, appState.activeLanguage || "en") }))) return;
    const { ok, data } = await apiJson(`/api/admin/announcements/${n.id}`, { method: "DELETE" });
    if (!ok) { showToast(errText(data), "warning"); return; }
    showToast(t.newsDeleted, "success");
    if (newsAdminState.editing === n.id) resetNewsForm(null);
    loadAdminNews();
  });
}

/** Fills empty zh-TW / zh-CN fields from the English text via Gemini (existing text is kept). */
async function translateNewsForm() {
  const t = tr();
  const title = document.getElementById("newsTitleEn").value.trim();
  const body = document.getElementById("newsBodyEn").value.trim();
  if (!title && !body) { setFieldError("newsTitleEn", t.newsErrTitle); return; }
  const btn = document.getElementById("btnNewsTranslate");
  btn.disabled = true;
  btn.classList.add("is-busy");
  const { ok, data } = await apiJson("/api/admin/translate", { method: "POST", body: { title, body } });
  btn.disabled = false;
  btn.classList.remove("is-busy");
  if (!ok || !data.result) { showToast(errText(data) || t.newsTranslateFailed, "warning"); return; }
  const fill = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = String(v).slice(0, Number(el.maxLength) || 140); };
  fill("newsTitleZhTw", data.result["zh-TW"]?.title); fill("newsBodyZhTw", data.result["zh-TW"]?.body);
  fill("newsTitleZhCn", data.result["zh-CN"]?.title); fill("newsBodyZhCn", data.result["zh-CN"]?.body);
  updateNewsCounters();
  updateNewsPreview();
  showToast(t.newsTranslated, "success");
}

function renderNewsTable() {
  const tbody = document.getElementById("adminNewsTableBody");
  if (!tbody) return;
  const t = tr();
  const lang = appState.activeLanguage || "en";
  if (!newsAdminState.list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">${escapeHtml(t.newsTableEmpty)}</td></tr>`;
    return;
  }
  const today = QuestCore.localDateIso();
  tbody.innerHTML = newsAdminState.list.map(n => {
    const status = QuestCore.newsStatus(n, today);
    const dates = `${n.startsAt ? formatDate(n.startsAt) : "—"} → ${n.endsAt ? formatDate(n.endsAt) : t.newsNoEnd}`;
    const aud = n.audience?.length ? n.audience.map(r => t.questRoleShort?.[r] || r).join(", ") : t.newsAudienceAll;
    return `<tr>
      <td><div class="news-cell-title">${n.pinned ? `<span class="material-symbols-outlined" aria-label="${escapeHtml(t.newsPinnedLabel)}">push_pin</span>` : ""}<strong>${escapeHtml(pickLangText(n.title, lang))}</strong></div><div class="muted news-cell-aud">${escapeHtml(aud)}</div></td>
      <td><span class="status-pill ${status === "live" ? "is-ok" : "is-muted"}">${escapeHtml(t.newsStatus?.[status] || status)}</span></td>
      <td>${escapeHtml(dates)}</td>
      <td>${Number(n.seenCount) || 0}</td>
      <td>${Number(n.clickCount) || 0}</td>
      <td class="col-actions">
        <button type="button" class="icon-btn btn-sm" data-news-action="edit" data-id="${Number(n.id)}" title="${escapeHtml(t.newsEdit)}" aria-label="${escapeHtml(t.newsEdit)}"><span class="material-symbols-outlined">edit</span></button>
        <button type="button" class="icon-btn btn-sm" data-news-action="delete" data-id="${Number(n.id)}" title="${escapeHtml(t.deleteLabel)}" aria-label="${escapeHtml(t.deleteLabel)}"><span class="material-symbols-outlined">delete</span></button>
      </td>
    </tr>`;
  }).join("");
}

async function loadAdminNews() {
  const first = !newsAdminState.bound;
  bindNewsForm();
  if (first) resetNewsForm(null);
  const tbody = document.getElementById("adminNewsTableBody");
  const t = tr();
  if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="table-empty">${escapeHtml(t.loading)}</td></tr>`;
  // The playbook link picker needs the case list even if the Cases tab was never opened.
  if (!appState.loadedAdminUseCases?.length) {
    const res = await apiJson("/api/use-cases");
    if (Array.isArray(res.data)) appState.loadedAdminUseCases = res.data;
    if (!newsAdminState.editing) fillNewsCaseOptions(document.getElementById("newsLinkCase")?.value);
  }
  const { ok, data } = await apiJson("/api/admin/announcements");
  if (!ok) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="table-empty is-error">${escapeHtml(errText(data))}</td></tr>`;
    return;
  }
  newsAdminState.list = Array.isArray(data.announcements) ? data.announcements : [];
  renderNewsTable();
}

// ===========================================================================
// v6 Admin: Settings → Academic calendar (super admins)
// ===========================================================================
const calendarState = { bound: false, loaded: null };

/**
 * Maps an "MM-DD" onto a concrete YYYY-MM-DD inside the academic year that
 * starts at semA.start in `startYear` (months before the semA start month
 * belong to startYear + 1). Lets admins use native date pickers.
 */
const mdToIso = (md, semAStartMd, startYear) => {
  if (!md) return "";
  const y = md < semAStartMd ? startYear + 1 : startYear;
  return `${y}-${md}`;
};
const isoToMd = (iso) => (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.slice(5) : "");
/** ISO date ± n days (UTC arithmetic so DST never shifts the result). */
const shiftIso = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

const calendarStartYear = (cal) => {
  const now = new Date();
  const md = QuestCore.localDateIso(now).slice(5);
  return md < cal.semA.start ? now.getFullYear() - 1 : now.getFullYear();
};

function renderCalendarForm(cal) {
  const grid = document.getElementById("calGrid");
  if (!grid) return;
  const t = tr();
  const c = cal || QuestCore.DEFAULT_ACADEMIC_CALENDAR;
  const y = calendarStartYear(c);
  grid.innerHTML = QuestCore.TERM_ORDER.map(k => `
    <div class="cal-row" data-term="${k}">
      <span class="cal-term"><span class="cal-swatch quest-term-${k}" aria-hidden="true"></span>${escapeHtml(t.questTermFull?.[k] || k)}</span>
      <label class="cal-field"><span class="form-label">${escapeHtml(t.calStart)}</span>
        <input type="date" class="select-control" id="cal_${k}_start" data-term="${k}" data-edge="start" value="${mdToIso(c[k].start, c.semA.start, y)}"></label>
      <label class="cal-field"><span class="form-label">${escapeHtml(t.calEnd)}</span>
        <input type="date" class="select-control" id="cal_${k}_end" data-term="${k}" data-edge="end" value="${mdToIso(c[k].end, c.semA.start, y)}"></label>
    </div>`).join("");
  updateCalendarPreview();
}

const readCalendarForm = () => {
  if (!document.getElementById("cal_semA_start")) return null;
  return QuestCore.TERM_ORDER.reduce((acc, k) => ({
    ...acc,
    [k]: { start: isoToMd(document.getElementById(`cal_${k}_start`).value), end: isoToMd(document.getElementById(`cal_${k}_end`).value) }
  }), {});
};

function updateCalendarPreview() {
  const t = tr();
  const cal = readCalendarForm();
  const preview = document.getElementById("calPreview");
  const errEl = document.getElementById("calFormError");
  if (!cal || !preview) return;
  const check = QuestCore.validateCalendar(cal);
  if (!check.ok) {
    const e = check.errors[0];
    errEl.textContent = fmt(e.code === "invalid_date" ? t.calErrDate : t.calErrGap, { term: t.questTermFull?.[e.term] || e.term || "" });
    preview.textContent = "";
    return;
  }
  errEl.textContent = "";
  preview.textContent = fmt(t.calPreviewToday, { position: questPositionText(QuestCore.getAcademicPosition(new Date(), cal), t) });
}

function renderCalendarStatus() {
  const t = tr();
  const s = calendarState.loaded;
  const pill = document.getElementById("calStatusPill");
  if (pill && s) {
    pill.className = `status-pill ${s.isDefault ? "is-muted" : "is-ok"}`;
    pill.textContent = s.isDefault ? t.calStatusDefault : t.calStatusCustom;
  }
  const changed = document.getElementById("calLastChanged");
  if (changed) changed.textContent = s?.updatedBy ? fmt(t.lastChanged, { by: s.updatedBy, date: formatDateTime(s.updatedAt) }) : "";
}

/**
 * Only MM-DD is stored, so the year in each date input is cosmetic. After an
 * edit, put every input back into a single academic year anchored on the
 * semA start: the semA start keeps its own year, and any MM-DD earlier in the
 * calendar year than the semA start belongs to the following year. Without
 * this, the summer end (set from semA start − 1 day) keeps semA's year and
 * shows up as earlier than its own start.
 */
function normalizeCalendarYears() {
  const anchor = document.getElementById("cal_semA_start")?.value;
  if (!anchor) return;
  const startYear = Number(anchor.slice(0, 4));
  const anchorMd = anchor.slice(5);
  QuestCore.TERM_ORDER.forEach(k => ["start", "end"].forEach(edge => {
    const el = document.getElementById(`cal_${k}_${edge}`);
    const md = isoToMd(el?.value);
    if (md) el.value = mdToIso(md, anchorMd, startYear);
  }));
}

function bindCalendarForm() {
  const form = document.getElementById("formCalendarSettings");
  if (!form || calendarState.bound) return;
  calendarState.bound = true;
  // Keeping terms contiguous: moving a start pulls the previous term's end to the day before;
  // moving an end pushes the next term's start to the day after (wraps summer → semA).
  form.addEventListener("change", (e) => {
    const input = e.target.closest("input[data-term]");
    if (!input || !input.value) { updateCalendarPreview(); return; }
    const order = QuestCore.TERM_ORDER;
    const i = order.indexOf(input.dataset.term);
    if (input.dataset.edge === "start") {
      const prev = order[(i + order.length - 1) % order.length];
      document.getElementById(`cal_${prev}_end`).value = shiftIso(input.value, -1);
    } else {
      const next = order[(i + 1) % order.length];
      document.getElementById(`cal_${next}_start`).value = shiftIso(input.value, 1);
    }
    normalizeCalendarYears();
    updateCalendarPreview();
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const t = tr();
    const calendar = readCalendarForm();
    if (!QuestCore.validateCalendar(calendar).ok) { updateCalendarPreview(); return; }
    const btn = document.getElementById("btnCalSave");
    btn.disabled = true;
    const { ok, data } = await apiJson("/api/admin/settings/calendar", { method: "PUT", body: { calendar } });
    btn.disabled = false;
    if (!ok) { showInline(document.getElementById("calResult"), escapeHtml(errText(data)), "error"); return; }
    showToast(t.calSaved, "success");
    loadCalendarSettings();
  });
  document.getElementById("btnCalReset").addEventListener("click", async () => {
    const t = tr();
    if (!confirm(t.calConfirmReset)) return;
    const { ok, data } = await apiJson("/api/admin/settings/calendar", { method: "DELETE" });
    if (!ok) { showInline(document.getElementById("calResult"), escapeHtml(errText(data)), "error"); return; }
    showToast(t.calResetDone, "success");
    loadCalendarSettings();
  });
}

async function loadCalendarSettings() {
  if (!appState.isSuper || !document.getElementById("calendarPanel")) return;
  bindCalendarForm();
  const { ok, data } = await apiJson("/api/admin/settings/calendar");
  const result = document.getElementById("calResult");
  if (!ok) { showInline(result, escapeHtml(tr().calLoadFailed), "error"); return; }
  result.hidden = true;
  calendarState.loaded = data;
  renderCalendarForm(data.calendar);
  renderCalendarStatus();
}

// ===========================================================================
// v6 Admin: case form — "When it matters" timing chips + Quest Run questions
// ===========================================================================
const MAX_CASE_HINTS = 3;

/** Reads the timing chips + hint repeater back into plain data. */
function readCaseQuestFields() {
  const timing = [...document.querySelectorAll("input[name='formCaseTiming']:checked")].map(b => b.value);
  const hints = [...document.querySelectorAll("#formCaseHints .hint-item")].map(row => ({
    question: {
      en: row.querySelector("[data-hint-field='en']").value.trim(),
      "zh-TW": row.querySelector("[data-hint-field='zh-TW']").value.trim(),
      "zh-CN": row.querySelector("[data-hint-field='zh-CN']").value.trim()
    },
    audience: [...row.querySelectorAll("input[data-hint-aud]:checked")].map(b => b.value)
  }));
  return { timing, hints };
}

const hintRowHtml = (h, i, t, disabled) => {
  const q = h.question || h;
  const dis = disabled ? " disabled" : "";
  const aud = Array.isArray(h.audience) ? h.audience : [];
  const field = (lang, label) => `
    <label class="hint-field"><span class="hint-lang">${label}</span>
      <input type="text" class="select-control" maxlength="120" data-hint-field="${lang}" value="${escapeHtml(q[lang] || "")}"${dis}></label>`;
  return `<div class="hint-item" data-index="${i}">
    <div class="hint-item-head">
      <span class="hint-num">${escapeHtml(fmt(t.caseFormHintN, { n: i + 1 }))}</span>
      ${disabled ? "" : `<button type="button" class="icon-btn btn-sm" data-hint-remove="${i}" title="${escapeHtml(t.caseFormHintRemove)}" aria-label="${escapeHtml(t.caseFormHintRemove)}"><span class="material-symbols-outlined">delete</span></button>`}
    </div>
    ${field("en", "EN")}${field("zh-TW", "繁")}${field("zh-CN", "简")}
    <details class="hint-aud"${aud.length ? " open" : ""}><summary>${escapeHtml(t.caseFormHintAudience)}</summary>
      <div class="chip-checks">${QuestCore.ROLES.map(r => `<label class="chip-check"><input type="checkbox" data-hint-aud value="${escapeHtml(r)}"${aud.includes(r) ? " checked" : ""}${dis}><span>${escapeHtml(t.questRoleShort?.[r] || r)}</span></label>`).join("")}</div>
    </details>
  </div>`;
};

/** Renders timing chips (QuestCore.TIMINGS) and the hint repeater (max 3). */
function renderCaseQuestFields(state, disabled) {
  const t = tr();
  const timingBox = document.getElementById("formCaseTiming");
  const hintBox = document.getElementById("formCaseHints");
  const addBtn = document.getElementById("btnCaseAddHint");
  if (!timingBox || !hintBox) return;
  const timing = state.timing && state.timing.length ? state.timing : ["anytime"];
  const dis = disabled ? " disabled" : "";
  timingBox.dataset.rendered = "1";
  timingBox.innerHTML = QuestCore.TIMINGS.map(k => `
    <label class="chip-check"><input type="checkbox" name="formCaseTiming" value="${k}"${timing.includes(k) ? " checked" : ""}${dis}><span>${escapeHtml(k === "anytime" ? t.questAnytime : (t.questPhase?.[k] || k))}</span></label>`).join("");
  const hints = (state.hints || []).slice(0, MAX_CASE_HINTS);
  hintBox.innerHTML = hints.map((h, i) => hintRowHtml(h, i, t, disabled)).join("");
  if (addBtn) {
    addBtn.hidden = disabled;
    addBtn.disabled = hints.length >= MAX_CASE_HINTS;
  }
  if (!hintBox.dataset.bound) {
    hintBox.dataset.bound = "1";
    hintBox.addEventListener("click", (e) => {
      const rm = e.target.closest("[data-hint-remove]");
      if (!rm) return;
      const s = readCaseQuestFields();
      s.hints.splice(Number(rm.dataset.hintRemove), 1);
      renderCaseQuestFields(s, false);
    });
    // "Anytime" and specific phases are mutually exclusive.
    timingBox.addEventListener("change", (e) => {
      if (e.target.name !== "formCaseTiming") return;
      const boxes = [...timingBox.querySelectorAll("input[name='formCaseTiming']")];
      if (e.target.value === "anytime" && e.target.checked) boxes.forEach(b => { if (b.value !== "anytime") b.checked = false; });
      else if (e.target.checked) boxes.forEach(b => { if (b.value === "anytime") b.checked = false; });
      if (!boxes.some(b => b.checked)) boxes.find(b => b.value === "anytime").checked = true;
    });
    if (addBtn) addBtn.addEventListener("click", () => {
      const s = readCaseQuestFields();
      if (s.hints.length >= MAX_CASE_HINTS) return;
      s.hints.push({ question: { en: "", "zh-TW": "", "zh-CN": "" }, audience: [] });
      renderCaseQuestFields(s, false);
      const inputs = hintBox.querySelectorAll("[data-hint-field='en']");
      if (inputs.length) inputs[inputs.length - 1].focus();
    });
  }
}

/** Applies Gemini's suggested timing / hints (flat {en, zh-TW, zh-CN, audience} shape). */
function applyQuestSuggestions(aiRes) {
  const current = readCaseQuestFields();
  const timing = Array.isArray(aiRes.timing) ? aiRes.timing.filter(x => QuestCore.TIMINGS.includes(x)) : current.timing;
  const hints = Array.isArray(aiRes.hints)
    ? aiRes.hints.slice(0, MAX_CASE_HINTS).map(h => ({
      question: { en: String(h.en || h.question?.en || ""), "zh-TW": String(h["zh-TW"] || h.question?.["zh-TW"] || ""), "zh-CN": String(h["zh-CN"] || h.question?.["zh-CN"] || "") },
      audience: Array.isArray(h.audience) ? h.audience.filter(r => QuestCore.ROLES.includes(r)) : []
    }))
    : current.hints;
  renderCaseQuestFields({ timing: timing.length ? timing : ["anytime"], hints }, false);
}
