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
        title: "Prompt to Generate Course Syllabus & Module Outline",
        prompt: `Act as an expert university professor. Generate a comprehensive course syllabus and 14-week module outline for the course '{{COURSE_NAME}}' (Code: {{COURSE_CODE}}). Include course description, 4 core learning objectives mapped to Bloom's taxonomy, weekly lecture topics, required reading titles, and grading breakdown.`
      },
      {
        title: "Prompt to Generate Lecture Reading Summary & Key Concepts",
        prompt: `Synthesize the core foundational concepts and terminology for Lecture Week 1-3 of '{{COURSE_NAME}}'. Provide a 500-word executive summary, 10 must-know technical terms with student-friendly definitions, and 5 common student misconceptions with corrections.`
      }
    ],
    "zh-TW": [
      {
        title: "生成課程教學大綱與每週單元大綱提示詞",
        prompt: `請扮演資深大學教授。為課程「{{COURSE_NAME}}」（課程代碼：{{COURSE_CODE}}）撰寫一份完整的教學大綱與 14 週單元規劃。包含課程簡介、對應 Bloom 分類法的 4 項核心學習目標、每週講義主題、必讀文獻清單及評分比重。`
      },
      {
        title: "生成前三週講義摘要與核心概念提示詞",
        prompt: `統整「{{COURSE_NAME}}」第 1 至 3 週講義的核心概念與專有名詞。提供 500 字精要摘要、10 個關鍵術語之白話解說，以及 5 個學生常見概念誤區與正確觀念導正。`
      }
    ],
    "zh-CN": [
      {
        title: "生成课程教学大纲与每周单元大纲提示词",
        prompt: `请扮演资深大学教授。为课程“{{COURSE_NAME}}”（课程代码：{{COURSE_CODE}}）撰写一份完整的教学大纲与 14 周单元规划。包含课程简介、对应 Bloom 分类法的 4 项核心学习目标、每周讲义主题、必读文献清单及评分比重。`
      },
      {
        title: "生成前三周讲义摘要与核心概念提示词",
        prompt: `统整“{{COURSE_NAME}}”第 1 至 3 周讲义的核心概念与专有名词。提供 500 字精要摘要、10 个关键术语之白话解说，以及 5 个学生常见概念误区与正确观念导正。`
      }
    ]
  },
  rubric_grading: {
    en: [
      {
        title: "Prompt to Generate Assignment Instructions & Guidelines",
        prompt: `Act as an academic instructor. Draft a detailed assignment instruction guide for undergraduate students titled '{{ASSIGNMENT_TITLE}}'. Include the task overview, word count requirements, required citation format, 3 specific guiding questions to address, and submission instructions.`
      },
      {
        title: "Prompt to Generate Detailed Analytical Grading Rubric",
        prompt: `Create a rigorous, 4-tier analytical grading rubric for the assignment '{{ASSIGNMENT_TITLE}}'. Structure the rubric into 4 criteria: (1) Argument & Critical Analysis (35%), (2) Evidence & Source Grounding (30%), (3) Structure & Coherence (20%), (4) Academic Writing & Mechanics (15%). For each criterion, describe clear observable indicators across 4 performance levels: Exemplary, Proficient, Developing, and Unsatisfactory.`
      }
    ],
    "zh-TW": [
      {
        title: "生成作業指示與撰寫規範提示詞",
        prompt: `請扮演大學課程講師。為名為「{{ASSIGNMENT_TITLE}}」的學期作業撰寫詳細指引。包含作業宗旨說明、字數規範、學術引用格式要求、3 個必須深入探討的核心引導問題，以及繳交截止規範。`
      },
      {
        title: "生成詳細分析型評分規準 (Rubric) 提示詞",
        prompt: `為作業「{{ASSIGNMENT_TITLE}}」設計一份嚴謹的四級分析型評分規準 (Rubric)。劃分 4 項指標：(1) 論點深度與批判思維 (35%)、(2) 文獻證據與論證嚴謹度 (30%)、(3) 架構組織與邏輯連貫 (20%)、(4) 學術寫作規範與流暢度 (15%)。每項指標均需具體列出：優異 (Exemplary)、熟練 (Proficient)、發展中 (Developing)、待加強 (Unsatisfactory) 的具體表現描述。`
      }
    ],
    "zh-CN": [
      {
        title: "生成作业指引与撰写规范提示词",
        prompt: `请扮演大学课程讲师。为名为“{{ASSIGNMENT_TITLE}}”的学期作业撰写详细指引。包含作业宗旨说明、字数规范、学术引用格式要求、3 个必须深入探讨的核心引导问题，以及提交截止规范。`
      },
      {
        title: "生成详细分析型评分规准 (Rubric) 提示词",
        prompt: `为作业“{{ASSIGNMENT_TITLE}}”设计一份严谨的四级分析型评分规准 (Rubric)。划分 4 项指标：(1) 论点深度与批判思维 (35%)、(2) 文献证据与论证严谨度 (30%)、(3) 架构组织与逻辑连贯 (20%)、(4) 学术写作规范与流畅度 (15%)。每项指标均需具体列出：优异 (Exemplary)、熟练 (Proficient)、发展中 (Developing)、待加强 (Unsatisfactory) 的具体表现描述。`
      }
    ]
  },
  curriculum_design: {
    en: [
      {
        title: "Prompt to Generate Market Skills & Industry Benchmark Brief",
        prompt: `Conduct a comprehensive skills benchmark for '{{COURSE_TITLE}}' targeting the {{TARGET_INDUSTRY}} industry. Identify the top 5 technical competencies and 3 soft skills most demanded by employers over the past 12 months, citing key industry tools.`
      },
      {
        title: "Prompt to Generate Bloom's Taxonomy Course Learning Outcomes",
        prompt: `Design 5 measurable, assessment-aligned Course Learning Outcomes (CLOs) for '{{COURSE_TITLE}}' adhering strictly to Bloom's Revised Taxonomy (spanning Apply, Analyze, Evaluate, and Create levels).`
      }
    ],
    "zh-TW": [
      {
        title: "生成產業技能趨勢與市場需求基準提示詞",
        prompt: `針對「{{TARGET_INDUSTRY}}」領域，為新課程「{{COURSE_TITLE}}」進行職場技能基準分析。列出過去一年就業市場需求最高的 5 項核心技術能力與 3 項跨領域軟實力，並註明主流產業工具與認證。`
      },
      {
        title: "生成對應 Bloom 分類法的課程學習成效 (CLOs) 提示詞",
        prompt: `嚴格遵循 Bloom 修訂版認知歷程分類法（涵蓋應用、分析、評鑑、創造層級），為「{{COURSE_TITLE}}」設計 5 項具體可評量的課程學習成效 (CLOs)。`
      }
    ],
    "zh-CN": [
      {
        title: "生成产业技能趋势与市场需求基准提示词",
        prompt: `针对“{{TARGET_INDUSTRY}}”领域，为新课程“{{COURSE_TITLE}}”进行职场技能基准分析。列出过去一年就业市场需求最高的 5 项核心技术能力与 3 项跨领域软实力，并注明主流产业工具与认证。`
      },
      {
        title: "生成对应 Bloom 分类法的课程学习成效 (CLOs) 提示词",
        prompt: `严格遵循 Bloom 修订版认知历程分类法（涵盖应用、分析、评鉴、创造层级），为“{{COURSE_TITLE}}”设计 5 项具体可评估的课程学习成效 (CLOs)。`
      }
    ]
  },
  lab_manual_creator: {
    en: [
      {
        title: "Prompt to Generate Laboratory Experiment Concept & Reagents List",
        prompt: `Act as a STEM laboratory coordinator for '{{COURSE_NAME}}'. Create a complete experiment concept sheet for '{{EXPERIMENT_NAME}}'. Include theoretical background, required chemical reagents, glass equipment list, and preparatory setup steps.`
      },
      {
        title: "Prompt to Generate Safety Hazards & Protocol Guideline",
        prompt: `Draft an institutional chemical and physical safety protocol for the experiment '{{EXPERIMENT_NAME}}'. Specify GHS hazard pictograms, mandatory PPE, waste disposal procedures, and emergency spill response steps.`
      }
    ],
    "zh-TW": [
      {
        title: "生成實驗原理與試劑設備清單提示詞",
        prompt: `請扮演「{{COURSE_NAME}}」實驗室負責人。為實驗「{{EXPERIMENT_NAME}}」撰寫實驗原理與準備手冊。列出理論背景、化學試劑清單、玻璃儀器規格及課前準備步驟。`
      },
      {
        title: "生成實驗室安全守則與廢棄物處置規範提示詞",
        prompt: `為實驗「{{EXPERIMENT_NAME}}」制定實驗室安全規範。明確標註 GHS 危害圖示、必備個人防護裝備 (PPE)、廢液分類處理流程與化學品潑濺應急程序。`
      }
    ],
    "zh-CN": [
      {
        title: "生成实验原理与试剂设备清单提示词",
        prompt: `请扮演“{{COURSE_NAME}}”实验室负责人。为实验“{{EXPERIMENT_NAME}}”撰写实验原理与准备手册。列出理论背景、化学试剂清单、玻璃仪器规格及课前准备步骤。`
      },
      {
        title: "生成实验室安全守则与废弃物处置规范提示词",
        prompt: `为实验“{{EXPERIMENT_NAME}}”制定实验室安全规范。明确标注 GHS 危害图示、必备个人防护装备 (PPE)、废液分类处理流程与化学品泼溅应急程序。`
      }
    ]
  },
  su_advocacy: {
    en: [
      {
        title: "Prompt to Generate Student Town Hall Feedback Survey Form",
        prompt: `Draft a 10-question anonymous student campus experience survey for {{INSTITUTION_NAME}} covering {{ACADEMIC_TERM}}. Include questions on library hours, dining affordability, mental health support, and classroom facilities with Likert scales and open-ended feedback prompts.`
      },
      {
        title: "Prompt to Generate Qualitative Feedback Transcription Template",
        prompt: `Structure a standardized student feedback transcription template to organize raw town hall notes and survey responses into thematic categories: Academic, Student Welfare, Facilities, and Financial Aid.`
      }
    ],
    "zh-TW": [
      {
        title: "生成學生諮詢會回饋問卷範本提示詞",
        prompt: `為 {{INSTITUTION_NAME}} 設計一份「{{ACADEMIC_TERM}} 學生校園生活體驗與權益問卷」（共 10 題）。涵蓋圖書館自修時數、校園餐飲平價化、身心輔導資源及教室設備，結合李克特量表與開放式建議。`
      },
      {
        title: "生成質化民意彙整與歸類樣板提示詞",
        prompt: `設計結構化的學生民意資料整理範本，將諮詢會筆記與匿名回饋分類至四大領域：學術教學、學生福利、校園設施及獎助學金。`
      }
    ],
    "zh-CN": [
      {
        title: "生成学生咨询会反馈问卷范本提示词",
        prompt: `为 {{INSTITUTION_NAME}} 设计一份“{{ACADEMIC_TERM}} 学生校园生活体验与权益问卷”（共 10 题）。涵盖图书馆自修时数、校园餐饮平价化、身心辅导资源及教室设备，结合李克特量表与开放式建议。`
      },
      {
        title: "生成质化民意汇整与归类样板提示词",
        prompt: `设计结构化的学生民意数据整理范本，将咨询会笔记与匿名反馈分类至四大领域：学术教学、学生福利、校园设施及奖助学金。`
      }
    ]
  },
  club_funding: {
    en: [
      {
        title: "Prompt to Generate Student Club Event Proposal Template",
        prompt: `Act as a Student Union treasurer. Draft a comprehensive event funding proposal for '{{CLUB_NAME}}' covering the academic year {{ACADEMIC_YEAR}}. Include event purpose, target student participation count, timeline, and measurable campus impact.`
      },
      {
        title: "Prompt to Generate Union Subsidy Line-Item Budget Sheet",
        prompt: `Create a compliant line-item budget table for '{{CLUB_NAME}}' detailing speaker honorariums, equipment rental, venue booking, and promotional printing adhering to Student Union grant maximums.`
      }
    ],
    "zh-TW": [
      {
        title: "生成學生社團活動企劃書範本提示詞",
        prompt: `請扮演學生會財務顧問。為社團「{{CLUB_NAME}}」撰寫 {{ACADEMIC_YEAR}} 學年度活動補助申請企劃。包含活動宗旨、預估參與人數、籌備進度表及對校園凝聚力之實質效益。`
      },
      {
        title: "生成社團預算明細與核銷檢核表提示詞",
        prompt: `為「{{CLUB_NAME}}」編製符合學生會補助規章之逐項預算明細表，詳列講師鐘點費、器材租賃、場地清潔及文宣印製費用，並註記報銷憑證規範。`
      }
    ],
    "zh-CN": [
      {
        title: "生成学生社团活动企划书范本提示词",
        prompt: `请扮演学生会财务顾问。为社团“{{CLUB_NAME}}”撰写 {{ACADEMIC_YEAR}} 学年度活动补助申请企划。包含活动宗旨、预估参与人数、筹备进度表及对校园凝聚力之实质效益。`
      },
      {
        title: "生成社团预算明细与核销检核表提示词",
        prompt: `为“{{CLUB_NAME}}”编制符合学生会补助规章之逐项预算明细表，详列讲师钟点费、器材租赁、场地清洁及文宣印制费用，并注记报销凭证规范。`
      }
    ]
  },
  su_helpdesk: {
    en: [
      {
        title: "Prompt to Generate Student Union Constitution & Venue Policy Summary",
        prompt: `Synthesize the core student governance handbook for {{STUDENT_UNION_NAME}} at {{INSTITUTION_NAME}}. Produce a structured 5-section reference guide covering room reservations, locker allocation, club registration, and dispute escalation.`
      },
      {
        title: "Prompt to Generate FAQ Knowledge Base for Club Subsidies",
        prompt: `Create a 12-question frequently asked questions (FAQ) knowledge base for student societies regarding annual budget applications, permissible expense receipts, and claim submission deadlines.`
      }
    ],
    "zh-TW": [
      {
        title: "生成學生會會章與場地借用規範摘要提示詞",
        prompt: `為 {{INSTITUTION_NAME}} 的 {{STUDENT_UNION_NAME}} 統整核心學生自治手冊。整理五大章節摘要：學生活動中心場地預約、置物櫃申請、新社團成立認證與爭議申訴程序。`
      },
      {
        title: "生成社團補助與福利常見問題集 (FAQ) 提示詞",
        prompt: `為各學生社團編製一份 12 題常見問答集 (FAQ)，詳細解答年度補助金請領資格、合格單據報銷規定及審核進度查詢。`
      }
    ],
    "zh-CN": [
      {
        title: "生成学生会会章与场地借用规范摘要提示词",
        prompt: `为 {{INSTITUTION_NAME}} 的 {{STUDENT_UNION_NAME}} 统整核心学生自治手册。整理五大章节摘要：学生活动中心场地预约、储物柜申请、新社团成立认证与争议申诉程序。`
      },
      {
        title: "生成社团补助与福利常见问题集 (FAQ) 提示词",
        prompt: `为各学生社团编制一份 12 题常见问答集 (FAQ)，详细解答年度补助金申领资格、合格单据报销规定及审核进度查询。`
      }
    ]
  },
  visual_campaign: {
    en: [
      {
        title: "Prompt to Generate Campus Orientation Narrative Arc & Character Brief",
        prompt: `Act as an interactive narrative designer. Outline a 4-chapter campus orientation story game for {{EVENT_NAME}} at {{INSTITUTION_NAME}} targeting {{TARGET_AUDIENCE}}. Include 3 distinct student guide personas and campus riddle checkpoints.`
      },
      {
        title: "Prompt to Generate Image & Video Generation Art Directives",
        prompt: `Write 3 high-detail text-to-image prompts and 2 motion video prompts for {{EVENT_NAME}}. Specify art style (modern anime/3D cinematic vector), student diversity, campus architectural lighting, and 16:9 aspect ratios.`
      }
    ],
    "zh-TW": [
      {
        title: "生成迎新探索劇情架構與角色設定提示詞",
        prompt: `請扮演互動敘事設計師。為 {{INSTITUTION_NAME}} 的「{{EVENT_NAME}}」（目標對象：{{TARGET_AUDIENCE}}）規劃四章節校園解謎冒險故事。包含 3 位特色學長姐導覽角色設定與標誌性建築關卡線索。`
      },
      {
        title: "生成圖像與動畫生成風格指令提示詞",
        prompt: `為「{{EVENT_NAME}}」撰寫 3 組高畫質文字生圖提示詞及 2 組 5 秒動態影片提示詞。規範繪圖風格（3D 寫實電影級向量感）、學生多元性、校園自然採光及 16:9 構圖比。`
      }
    ],
    "zh-CN": [
      {
        title: "生成迎新探索剧情架构与角色设定提示词",
        prompt: `请扮演互动叙事设计师。为 {{INSTITUTION_NAME}} 的“{{EVENT_NAME}}”（目标对象：{{TARGET_AUDIENCE}}）规划四章节校园解谜冒险故事。包含 3 位特色学长姐导览角色设定与标志性建筑关卡线索。`
      },
      {
        title: "生成图像与动画生成风格指令提示词",
        prompt: `为“{{EVENT_NAME}}”撰写 3 组高画质文字生图提示词及 2 组 5 秒动态视频提示词。规范绘图风格（3D 写实电影级矢量感）、学生多元性、校园自然采光及 16:9 构图比。`
      }
    ]
  },
  at_risk_cohort: {
    en: [
      {
        title: "Prompt to Generate Learning Analytics Anonymized Cohort Schema",
        prompt: `Create an anonymized synthetic CSV schema for student learning analytics tracking in {{DEPARTMENT_NAME}} for {{COHORT_SEMESTER}}. Include fields for LMS login frequency, assignment submission lag, quiz averages, and midterm exam scores.`
      },
      {
        title: "Prompt to Generate Academic Advisor Supportive Outreach Email",
        prompt: `Draft an empathetic, encouraging check-in email template from an academic advisor to a student flagged for declining attendance in {{DEPARTMENT_NAME}}. Maintain a non-punitive, supportive tone inviting them to office hours.`
      }
    ],
    "zh-TW": [
      {
        title: "生成學習成效匿名數據欄位樣板提示詞",
        prompt: `為「{{DEPARTMENT_NAME}}」在「{{COHORT_SEMESTER}}」學期的學習預警建立去識別化資料欄位範本。涵蓋 LMS 登入頻率、作業遲交天數、小考平均值及期中考落後指標。`
      },
      {
        title: "生成學業導師關懷與輔導信函範本提示詞",
        prompt: `以學業導師視角撰寫一封溫暖、不帶評判意味的關懷信函，發送給在「{{DEPARTMENT_NAME}}」出席率下降的學生，邀請其前來諮詢時間討論學習支援資源。`
      }
    ],
    "zh-CN": [
      {
        title: "生成学习成效匿名数据字段样板提示词",
        prompt: `为“{{DEPARTMENT_NAME}}”在“{{COHORT_SEMESTER}}”学期的学习预警建立去标识化数据字段范本。涵盖 LMS 登录频率、作业迟交天数、小测平均值及期中考落后指标。`
      },
      {
        title: "生成学业导师关怀与辅导信函范本提示词",
        prompt: `以学业导师视角撰写一封温暖、不带评判意味的关怀信函，发送给在“{{DEPARTMENT_NAME}}”出席率下降的学生，邀请其前来咨询时间讨论学习支持资源。`
      }
    ]
  },
  accreditation_reports: {
    en: [
      {
        title: "Prompt to Generate Departmental Evidence Collection Template",
        prompt: `Draft a comprehensive departmental self-study evidence collection checklist for {{PROGRAM_NAME}} aligned with {{ACCREDITATION_BODY}} standards. Include curriculum matrices, syllabus archives, and assessment artifacts.`
      },
      {
        title: "Prompt to Generate Faculty Qualifications & Curriculum Matrix",
        prompt: `Create an accreditation-compliant tabular matrix mapping {{PROGRAM_NAME}} courses to faculty terminal degree qualifications, research publications, and course learning outcomes.`
      }
    ],
    "zh-TW": [
      {
        title: "生成系所自我評鑑佐證清單提示詞",
        prompt: `依據「{{ACCREDITATION_BODY}}」認證評鑑標準，為「{{PROGRAM_NAME}}」制定自評報告佐證資料收集清單。包含核心課程配比、教學大綱存檔及學習成效審查檔案。`
      },
      {
        title: "生成師資專長與課程對照矩陣提示詞",
        prompt: `編製符合評鑑規範之表格矩陣，將「{{PROGRAM_NAME}}」各必選修課程與任課教師之最高學位、學術研究專長及課程成效指標進行嚴謹對應。`
      }
    ],
    "zh-CN": [
      {
        title: "生成系所自我评估佐证清单提示词",
        prompt: `依据“{{ACCREDITATION_BODY}}”认证评估标准，为“{{PROGRAM_NAME}}”制定自评报告佐证数据收集清单。包含核心课程配比、教学大纲存档及学习成效审查档案。`
      },
      {
        title: "生成师资专长与课程对照矩阵提示词",
        prompt: `编制符合评估规范之表格矩阵，将“{{PROGRAM_NAME}}”各必选修课程与任课教师之最高学位、学术研究专长及课程成效指标进行严谨对应。`
      }
    ]
  },
  workforce_federation: {
    en: [
      {
        title: "Prompt to Generate SAML 2.0 / OIDC IdP Metadata Specification",
        prompt: `Draft a technical configuration specification for federating campus Identity Provider ({{IDP_PROVIDER}}) with Google Cloud Workforce Identity for domain {{INSTITUTION_DOMAIN}}. Detail attribute mappings for NameID, email, roles, and department codes.`
      },
      {
        title: "Prompt to Generate Attribute Condition & RBAC Role Matrix",
        prompt: `Create a role-based access control (RBAC) assertion condition table mapping institutional student, lecturer, and administrative groups to Gemini Enterprise permission tiers.`
      }
    ],
    "zh-TW": [
      {
        title: "生成 SAML 2.0 / OIDC 身份聯合技術規格提示詞",
        prompt: `為校園網域 {{INSTITUTION_DOMAIN}} 撰寫整合身分提供者 ({{IDP_PROVIDER}}) 至 Google Cloud Workforce Identity 的部署規格書。詳列 NameID、主要電子郵件、角色群組與系所代碼映射規則。`
      },
      {
        title: "生成屬性條件與 RBAC 角色授權矩陣提示詞",
        prompt: `設計基於角色存取控制 (RBAC) 的屬性判定表，將全校學生、教師與行政人員 SSO 群組對應至 Gemini Enterprise 的權限層級。`
      }
    ],
    "zh-CN": [
      {
        title: "生成 SAML 2.0 / OIDC 身份联合技术规格提示词",
        prompt: `为校园网域 {{INSTITUTION_DOMAIN}} 撰写整合身份提供者 ({{IDP_PROVIDER}}) 至 Google Cloud Workforce Identity 的部署规格书。详列 NameID、主要电子邮件、角色群组与系所代码映射规则。`
      },
      {
        title: "生成属性条件与 RBAC 角色授权矩阵提示词",
        prompt: `设计基于角色访问控制 (RBAC) 的属性判定表，将全校学生、教师与行政人员 SSO 群组对应至 Gemini Enterprise 的权限层级。`
      }
    ]
  },
  sao_scavenger_hunt: {
    en: [
      {
        title: "Prompt to Generate Campus Landmarks Trivia & Cultural Clues",
        prompt: `Create 5 clever rhyming riddle clues highlighting landmark locations across {{CAMPUS_NAME}} for the {{FESTIVAL_NAME}} celebration. Each riddle should describe architectural features of the campus without stating its name.`
      },
      {
        title: "Prompt to Generate QR Checkpoint Mini-Challenge Prompts",
        prompt: `Design 5 quick two-question cultural trivia mini-challenges for QR checkpoints during {{FESTIVAL_NAME}} that students can answer on mobile devices to earn digital red packet stamps.`
      }
    ],
    "zh-TW": [
      {
        title: "生成校園地標文化謎題與線索提示詞",
        prompt: `為「{{CAMPUS_NAME}}」慶祝「{{FESTIVAL_NAME}}」設計 5 則押韻的校園地標尋寶謎語。透過建築物特色引導學生探索圖書館、鐘樓、學生活動中心等地標。`
      },
      {
        title: "生成 QR 關卡文化小測驗與挑戰提示詞",
        prompt: `為「{{FESTIVAL_NAME}}」設計 5 個打卡關卡的快問快答（每關 2 題），使學生可透過手機掃描即時作答並解鎖數位紅包章。`
      }
    ],
    "zh-CN": [
      {
        title: "生成校园地标文化谜题与线索提示词",
        prompt: `为“{{CAMPUS_NAME}}”庆祝“{{FESTIVAL_NAME}}”设计 5 则押韵的校园地标寻宝谜语。透过建筑物特色引导学生探索图书馆、钟楼、学生活动中心等地标。`
      },
      {
        title: "生成 QR 关卡文化小测验与挑战提示词",
        prompt: `为“{{FESTIVAL_NAME}}”设计 5 个打卡关卡的快问快答（每关 2 题），使学生可通过手机扫描即时作答并解锁数字红包章。`
      }
    ]
  },
  finance_compliance: {
    en: [
      {
        title: "Prompt to Generate Society Expense Reimbursement Policy Guide",
        prompt: `Draft an official student organization finance compliance guideline outlining reimbursable expenses, non-allowable expenditures (e.g. alcohol, tips over 15%), and mandatory invoice attachment criteria.`
      },
      {
        title: "Prompt to Generate Audit Discrepancy Notice & Appeal Letter",
        prompt: `Draft a formal yet polite financial audit deduction notice addressed to {{SOCIETY_NAME}} regarding event claim '{{EVENT_NAME}}' with itemized disallowed expenses and step-by-step appeal procedures.`
      }
    ],
    "zh-TW": [
      {
        title: "生成社團經費報銷手冊與審核準則提示詞",
        prompt: `編撰一份學生社團經費核銷指引，明確條列可報銷項目、禁止報銷項目（如酒精飲料、逾 15% 小費）及發票憑證正規化要求。`
      },
      {
        title: "生成單據不合規扣除通知與申訴信範本提示詞",
        prompt: `撰寫一份客氣且規範的財務審核意見書，通知「{{SOCIETY_NAME}}」於「{{EVENT_NAME}}」活動申請中的不合規扣除明細，並附上補件及申訴指引。`
      }
    ],
    "zh-CN": [
      {
        title: "生成社团经费报销手册与审核准则提示词",
        prompt: `编撰一份学生社团经费核销指引，明确条列可报销项目、禁止报销项目（如酒精饮料、逾 15% 小费）及发票凭证正规化要求。`
      },
      {
        title: "生成单据不合规扣除通知与申诉信范本提示词",
        prompt: `撰写一份客气且规范的财务审核意见书，通知“{{SOCIETY_NAME}}”于“{{EVENT_NAME}}”活动申请中的不合规扣除明细，并附上补件及申诉指引。`
      }
    ]
  },
  security_simulator: {
    en: [
      {
        title: "Prompt to Generate Emergency Response SOP & Incident Brief",
        prompt: `Act as a Director of Campus Safety. Draft a standard operating procedure (SOP) brief for campus security personnel managing {{EMERGENCY_SCENARIO}} at {{FACILITY_LOCATION}}. Include initial containment, perimeter isolation, and communications protocol.`
      },
      {
        title: "Prompt to Generate Crisis Decision Tree Scenario Table",
        prompt: `Create a 3-stage branching crisis drill scenario table for {{EMERGENCY_SCENARIO}} at {{FACILITY_LOCATION}}. At each stage (0 min, 15 min, 30 min), define 3 tactical options, the operational consequence of each, and evaluation rubric criteria.`
      }
    ],
    "zh-TW": [
      {
        title: "生成校園緊急應變 SOP 與情境簡報提示詞",
        prompt: `請扮演校園安保總監。為安保團隊在「{{FACILITY_LOCATION}}」應對「{{EMERGENCY_SCENARIO}}」撰寫應變標準作業程序 (SOP)。包含首要隔離處置、警戒線封鎖與校安通報程序。`
      },
      {
        title: "生成三階段危機決策樹演練腳本提示詞",
        prompt: `為「{{FACILITY_LOCATION}}」發生的「{{EMERGENCY_SCENARIO}}」建立三階段演習腳本（0分、15分、30分），每階段提供 3 項戰術選擇、後續連鎖後果及演練評分準則。`
      }
    ],
    "zh-CN": [
      {
        title: "生成校园紧急应变 SOP 与情境简报提示词",
        prompt: `请扮演校园安保总监。为安保团队在“{{FACILITY_LOCATION}}”应对“{{EMERGENCY_SCENARIO}}”撰写应变标准作业程序 (SOP)。包含首要隔离处置、警戒线封锁与校安通报程序。`
      },
      {
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
    adminPortalSubtitle: "Configure users, update learning playbooks, and analyze the last 6 months deployment metrics.",
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
    adminLabelTotalDeployments: "Cases Deployed Counts",
    adminChartTitle: "6-Month Portal Adoption Metrics",
    adminChartDesc: "Detailed aggregation charting Views, Likes, and Deployed actions across the academic term.",
    adminLabelViewsLegend: "PAGE VIEWS",
    adminLabelLikesLegend: "USER LIKES",
    adminLabelDeploymentsLegend: "DEPLOYMENTS",
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
    filterDeployed: "My Deployed Cases",
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
    adminLabelTotalDeployments: "部署案例計數",
    adminChartTitle: "近 6 個月門戶導入分析圖表",
    adminChartDesc: "詳細彙整整個學期期間的使用者瀏覽量、按讚次數與實際部署操作統計。",
    adminLabelViewsLegend: "頁面瀏覽量",
    adminLabelLikesLegend: "使用者按讚",
    adminLabelDeploymentsLegend: "案例部署數",
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
    filterDeployed: "我的部署案例",
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
    adminLabelTotalDeployments: "部署案例计数",
    adminChartTitle: "近 6 个月门户导入分析图表",
    adminChartDesc: "详细汇总整个学期期间的使用者浏览量、点赞次数与实际部署操作统计。",
    adminLabelViewsLegend: "页面浏览量",
    adminLabelLikesLegend: "使用者点赞",
    adminLabelDeploymentsLegend: "案例部署数",
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
    filterDeployed: "我的部署案例",
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
  
  // Sidebar titles (with robust fallback selectors to match index.html elements)
  const sidebarProfileTitle = document.getElementById("sidebarProfileTitle") || document.getElementById("titleContextProfile");
  if (sidebarProfileTitle) sidebarProfileTitle.textContent = t.sidebarProfileTitle;
  
  const sidebarConnectorsTitle = document.getElementById("sidebarConnectorsTitle");
  if (sidebarConnectorsTitle) sidebarConnectorsTitle.textContent = t.sidebarConnectorsTitle;
  
  const sidebarFeaturesTitle = document.getElementById("sidebarFeaturesTitle") || document.getElementById("titleNavigation");
  if (sidebarFeaturesTitle) sidebarFeaturesTitle.textContent = t.sidebarFeaturesTitle || "Filter by GE Feature";
  
  const sidebarStatusTitle = document.getElementById("sidebarStatusTitle") || document.getElementById("titleFilters");
  if (sidebarStatusTitle) sidebarStatusTitle.textContent = t.sidebarStatusTitle;

  safeSetText("btnChangeContextText", t.btnChangeContextText);

  // Static sidebar filter items
  const statusFilterItems = document.querySelectorAll(".status-filter-item");
  statusFilterItems.forEach(item => {
    const status = item.getAttribute("data-status");
    if (status === "all") {
      item.innerHTML = `<span class="material-symbols-outlined">check_circle</span> ${t.showAllCases || "Show All"}`;
    } else if (status === "unlocked") {
      item.innerHTML = `<span class="material-symbols-outlined">cloud_done</span> ${t.standardToolsOnly || "Ready to Deploy"}`;
    } else if (status === "integration") {
      item.innerHTML = `<span class="material-symbols-outlined">lock_open_right</span> ${t.integrationRequired || "Requires Connectors"}`;
    } else if (status === "liked") {
      item.innerHTML = `<span class="material-symbols-outlined">favorite</span> ${t.filterLiked || "My Liked Cases"}`;
    } else if (status === "deployed") {
      item.innerHTML = `<span class="material-symbols-outlined">rocket_launch</span> ${t.filterDeployed || "My Deployed Cases"}`;
    }
  });

  const featureFilterItems = document.querySelectorAll(".feature-filter-item");
  if (featureFilterItems.length > 0) {
    featureFilterItems[0].innerHTML = `<span class="material-symbols-outlined">apps</span> ${t.allCapabilities || "All Capabilities"}`;
  }

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

  // Dashboard Welcome Msg
  if (appState.isAdmin === true) {
    let adminTitle = "Admin View";
    let adminSub = "Reviewing all playbooks across all roles and levels with full management permissions.";
    if (lang === "zh-TW") {
      adminSub = "正在以完整管理權限審查所有角色與學制層級的學習案例。";
    } else if (lang === "zh-CN") {
      adminSub = "正在以完整管理权限审查所有角色与学制层级学习案例。";
    }
    safeSetText("welcomeMsg", adminTitle);
    safeSetText("welcomeSubtitle", adminSub);
  } else if (appState.userRole) {
    const category = getCategoryByRole(appState.userRole);
    const translatedHub = t.hubs[category] || t.hubs.academic;
    const translatedRole = t.roles[appState.userRole] || appState.userRole;
    safeSetText("welcomeMsg", `${translatedHub} • ${translatedRole}`);
    safeSetText("welcomeSubtitle", t.wizardDesc);
  } else {
    safeSetText("welcomeMsg", t.wizardSubtitle);
    safeSetText("welcomeSubtitle", t.wizardDesc);
  }

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
    safeSetText("adminPortalSubtitle", t.adminPortalSubtitle || "Configure users, update learning playbooks, and analyze the last 6 months deployment metrics.");
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
    safeSetText("adminLabelTotalDeployments", t.adminLabelTotalDeployments);

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
    const legendDeployments = document.getElementById("adminLabelDeploymentsLegend");
    if (legendDeployments) {
      legendDeployments.innerHTML = `<span style="display: inline-block; width: 12px; height: 3px; background: var(--color-success);"></span> ${t.adminLabelDeploymentsLegend || "DEPLOYMENTS"}`;
    }

    safeSetText("adminCrudTitle", t.adminCrudTitle);
    const btnExport = document.getElementById("btnAdminExportCases");
    if (btnExport) {
      btnExport.innerHTML = `<span class="material-symbols-outlined">download</span> <span id="adminBtnExportText">${t.adminBtnExportText || "Extract All (JSON)"}</span>`;
    }
    const btnCreate = document.getElementById("btnAdminCreateCase");
    if (btnCreate) {
      btnCreate.innerHTML = `<span class="material-symbols-outlined">add_box</span> <span id="adminBtnCreateCaseText">${t.adminBtnCreateCaseText || "Add Use Case"}</span>`;
    }

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
    const instructionInput = document.getElementById("formCaseGeminiInstruction");
    if (lang === "zh-TW") {
      safeSetText("adminFormLabelGeminiPromptTitle", "使用 Gemini 智能生成 / 優化案例");
      safeSetText("adminFormLabelGeminiPromptDesc", "輸入您想建立的案例方向，或說明您想對此案例進行的具體修改。Gemini 將會全自動為您編寫高品質的多語言對應、系統提示詞、操作步驟及導入心法。");
      if (instructionInput) instructionInput.placeholder = "例如：使用 Canvas 模式，為高中化學實驗報告建立一份評分量表指南，重點放在實驗安全上...";
    } else if (lang === "zh-CN") {
      safeSetText("adminFormLabelGeminiPromptTitle", "使用 Gemini 智能生成 / 优化案例");
      safeSetText("adminFormLabelGeminiPromptDesc", "输入您想建立的案例方向，或说明您想对此案例进行的具体修改。Gemini 将会全自动为您编写高质量的多语言对应、系统提示词、操作步骤及导入心法。");
      if (instructionInput) instructionInput.placeholder = "例如：使用 Canvas 模式，为高中化学实验报告建立一份评分量表指南，重点放在实验安全上...";
    } else {
      safeSetText("adminFormLabelGeminiPromptTitle", "Generate/Refine Playbook with Gemini");
      safeSetText("adminFormLabelGeminiPromptDesc", "Specify what you want to create, or describe the edits you'd like to apply to this playbook. Gemini will generate high-fidelity, localized playbooks, system prompts, steps, and tips.");
      if (instructionInput) instructionInput.placeholder = "e.g. Create a rubric grading guide for high school chemistry lab reports using Canvas Mode, focusing on safety...";
    }

    safeSetText("btnAdminFormCancel", t.btnAdminFormCancel);
    safeSetText("btnAdminFormSave", t.btnAdminFormSave);
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

  if (appState.isAdmin === true) {
    document.title = "Admin View";

    const navWelcomeEl = document.getElementById("navbarWelcomeText");
    if (navWelcomeEl) navWelcomeEl.textContent = "Admin View";

    const sidebarProfileTitle = document.getElementById("sidebarProfileTitle") || document.getElementById("titleContextProfile");
    if (sidebarProfileTitle) sidebarProfileTitle.textContent = "Admin View";

    const roleEl = document.getElementById("sidebarRole") || document.getElementById("profileRoleName");
    if (roleEl) roleEl.textContent = "Administrator";

    const levelEl = document.getElementById("sidebarLevel") || document.getElementById("profileInstitutionName");
    if (levelEl) levelEl.textContent = "Simulation Mode";
  } else {
    document.title = "Gemini Enterprise - Edu Portal";

    const roleText = t.roles[appState.userRole] || appState.userRole;
    const roleEl = document.getElementById("sidebarRole") || document.getElementById("profileRoleName");
    if (roleEl) roleEl.textContent = roleText;
    
    const isSupportRole = ["Security", "Finance", "IT Admin", "SAO"].includes(appState.userRole);
    const levelEl = document.getElementById("sidebarLevel") || document.getElementById("profileInstitutionName");
    if (levelEl) {
      if (isSupportRole) {
        levelEl.textContent = lang === "en" ? "Global (All Levels)" : (lang === "zh-TW" ? "全局 (所有級別)" : "全局 (所有级别)");
      } else {
        const levelText = t.levels[appState.institutionLevel] || appState.institutionLevel;
        levelEl.textContent = levelText;
      }
    }

    // Update navbar welcome text
    const navWelcomeEl = document.getElementById("navbarWelcomeText");
    if (navWelcomeEl) navWelcomeEl.textContent = roleText;
  }
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

// Helper to get Material Symbol icon for feature tags and institution levels
function getTagIcon(type, name) {
  const n = (name || "").toLowerCase().trim();
  if (type === "verified") return "verified";
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

// Utility to escape quotes for dynamic inline onClick triggers
function escapeQuotesForOnClick(str) {
  if (!str) return "";
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
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
      class: "connector-tag-drive",
      icon: "folder_shared",
      label: lang === "en" ? "Drive Connector" : (lang === "zh-TW" ? "Drive 連接器" : "Drive 连接器")
    };
  }
  if (c.includes("email") || c.includes("outlook") || c.includes("mail")) {
    return {
      class: "connector-tag-email",
      icon: "mail",
      label: lang === "en" ? "Email Connector" : (lang === "zh-TW" ? "Email 連接器" : "Email 连接器")
    };
  }
  if (c.includes("lms") || c.includes("canvas") || c.includes("moodle")) {
    return {
      class: "connector-tag-lms",
      icon: "school",
      label: lang === "en" ? "LMS Connector" : (lang === "zh-TW" ? "LMS 連接器" : "LMS 连接器")
    };
  }
  if (c.includes("calendar") || c.includes("google")) {
    return {
      class: "connector-tag-calendar",
      icon: "calendar_month",
      label: lang === "en" ? "Calendar Connector" : (lang === "zh-TW" ? "Calendar 連接器" : "Calendar 连接器")
    };
  }
  return {
    class: "",
    icon: "api",
    label: connectorName
  };
}

// Build interactive prompt HTML with clickable {{VARIABLE}} token pills
function buildInteractivePromptHtml(promptText, promptVars, valuesMap = {}) {
  if (!promptText) return "";
  const regex = /(?:\{\{([A-Za-z0-9\s/_\-']{1,50})\}\}|\[([A-Za-z0-9\s/_\-']{1,50})\](?!\())/g;
  let lastIndex = 0;
  let result = "";
  let match;
  while ((match = regex.exec(promptText)) !== null) {
    result += escapeHtml(promptText.substring(lastIndex, match.index));
    const rawLabel = (match[1] || match[2]).trim();
    const token = match[0];
    const val = valuesMap[token] ? valuesMap[token].trim() : "";
    const isFilled = Boolean(val);
    const displayVal = isFilled ? val : rawLabel;
    
    result += `<span class="prompt-var-token ${isFilled ? 'is-filled' : ''}" data-token="${escapeHtml(token)}" title="Click to edit {{${escapeHtml(rawLabel)}}}"><span class="token-braces">{{</span><span class="token-name">${escapeHtml(displayVal)}</span><span class="token-braces">}}</span></span>`;
    lastIndex = regex.lastIndex;
  }
  result += escapeHtml(promptText.substring(lastIndex));
  return result;
}

// Generate interpolated plain-text prompt for direct clipboard copy
function getInterpolatedPlainText(promptText, promptVars, valuesMap = {}) {
  if (!promptText) return "";
  let result = promptText;
  promptVars.forEach(v => {
    const val = valuesMap[v.token] ? valuesMap[v.token].trim() : "";
    if (val) {
      result = result.split(v.token).join(val);
    }
  });
  return result;
}

// Helper to copy step helper prompts to clipboard with visual confirmation
window.copyHelperPromptToClipboard = function(btn) {
  try {
    const details = btn.closest('.helper-prompt-collapsible');
    if (!details) return;
    const textEl = details.querySelector('.helper-prompt-text');
    if (!textEl) return;
    const textToCopy = textEl.textContent.trim();
    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalHtml = btn.innerHTML;
      const lang = appState.activeLanguage || "en";
      const copiedText = lang === 'zh-TW' ? '已複製！' : (lang === 'zh-CN' ? '已复制！' : 'Copied!');
      btn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 14px;">check</span> <span>${copiedText}</span>`;
      btn.style.borderColor = 'var(--color-success)';
      btn.style.color = 'var(--color-success)';
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.style.borderColor = '';
        btn.style.color = '';
      }, 2000);
      const toastMsg = lang === 'zh-TW' ? '輔助提示詞已複製至剪貼簿！' : (lang === 'zh-CN' ? '辅助提示词已复制至剪贴板！' : 'Helper prompt copied to clipboard!');
      showToast(toastMsg, "success");
    }).catch(err => {
      console.error('Clipboard copy error:', err);
    });
  } catch (err) {
    console.error('Helper copy error:', err);
  }
};

// Ambient mouse glow tracker for hardware-accelerated radial spotlight
function initMouseGlow() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  let scheduled = false;
  window.addEventListener("mousemove", (e) => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
        document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
        scheduled = false;
      });
    }
  }, { passive: true });
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
  if (isNew) {
    const newLabel = lang === 'en' ? 'NEW' : (lang === 'zh-TW' ? '新上線' : '新上线');
    return `<span class="tag tag-new tag-icon-only" title="${newLabel}"><span class="material-symbols-outlined" style="font-size: 14px;">auto_awesome</span></span>`;
  }
  if (isUpdated) {
    const updLabel = lang === 'en' ? 'UPDATED' : (lang === 'zh-TW' ? '已更新' : '已更新');
    return `<span class="tag tag-updated tag-icon-only" title="${updLabel}"><span class="material-symbols-outlined" style="font-size: 14px;">update</span></span>`;
  }
  return "";
}

// Render Use Cases Grid (All cards unlocked, colored connector tags, high contrast)
function renderUseCases() {
  const container = document.getElementById("useCasesContainer");
  if (!container) return;
  container.innerHTML = "";
  const lang = appState.activeLanguage || "en";
  const t = uiTranslations[lang];

  // Filter use cases from db based on state
  const filteredUseCases = useCasesDb.filter(useCase => {
    let matchesRole = false;
    const isSupportRole = ["Security", "Finance", "IT Admin", "SAO"].includes(appState.userRole);

    if (appState.isAdmin === true) {
      matchesRole = true;
    } else if (appState.userRole === "Lecturer" || appState.userRole === "TA") {
      matchesRole = ["Lecturer", "TA"].includes(useCase.role) || ["academic", "operational", "administrative"].includes(useCase.category) || !useCase.role;
    } else if (appState.userRole === "Student") {
      matchesRole = useCase.role === "Student" || useCase.category === "student" || !useCase.role;
    } else if (isSupportRole) {
      matchesRole = [appState.userRole, "IT Admin", "Program Leader", "Dean", "SAO"].includes(useCase.role) || 
                    ["operational", "administrative"].includes(useCase.category) || !useCase.role;
    } else if (appState.userRole === "Program Leader" || appState.userRole === "Dean") {
      matchesRole = ["Lecturer", "Program Leader", "Dean"].includes(useCase.role) || ["academic", "operational", "administrative"].includes(useCase.category) || !useCase.role;
    } else {
      matchesRole = true;
    }

    let matchesLevel = true;
    if (appState.isAdmin === true) {
      matchesLevel = true;
    } else if (!isSupportRole && useCase.level && Array.isArray(useCase.level) && useCase.level.length > 0) {
      matchesLevel = useCase.level.includes("Generic") || useCase.level.includes(appState.institutionLevel) || useCase.level.length === 0;
    }

    let matchesFeature = true;
    if (appState.activeFilterFeature !== "all") {
      matchesFeature = useCase.features.some(f => f.toLowerCase() === appState.activeFilterFeature.toLowerCase());
    }

    let matchesStatus = true;
    if (appState.activeFilterStatus === "liked") {
      matchesStatus = useCase.isLiked === true || useCase.isLiked === 1;
    } else if (appState.activeFilterStatus === "deployed") {
      matchesStatus = useCase.isDeployed === true || useCase.isDeployed === 1;
    }

    let matchesSearch = true;
    if (appState.searchQuery) {
      const trans = useCasesTranslations[useCase.id] ? useCasesTranslations[useCase.id][lang] : null;
      const cTitle = trans ? trans.title : useCase.title;
      const cSummary = trans ? trans.summary : useCase.summary;

      matchesSearch = cTitle.toLowerCase().includes(appState.searchQuery) || 
                      cSummary.toLowerCase().includes(appState.searchQuery) ||
                      (useCase.role && useCase.role.toLowerCase().includes(appState.searchQuery)) ||
                      useCase.features.some(f => f.toLowerCase().includes(appState.searchQuery));
    }

    let matchesCategory = true;
    if (appState.activeFilterCategory && appState.activeFilterCategory !== "all") {
      const filterCat = appState.activeFilterCategory === "admin" ? "administrative" : appState.activeFilterCategory;
      matchesCategory = useCase.category === filterCat;
    }

    return matchesRole && matchesLevel && matchesFeature && matchesStatus && matchesSearch && matchesCategory;
  });

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

  let renderedCount = 0;
  Object.keys(categories).forEach(key => {
    const hub = categories[key];
    if (hub.items.length === 0) return;

    renderedCount += hub.items.length;

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

    hub.items.forEach(uc => {
      const card = document.createElement("div");
      card.className = "card glass-panel";
      card.dataset.ucId = uc.id;
      card.addEventListener("click", () => openUseCaseModal(uc));

      const trans = useCasesTranslations[uc.id] ? useCasesTranslations[uc.id][lang] : null;
      const cardTitle = trans ? trans.title : uc.title;
      const cardSummary = trans ? trans.summary : uc.summary;

      let tagsHtml = "";
      const badgeHtml = getUsecaseBadgeHtml(uc, lang);
      if (badgeHtml) tagsHtml += badgeHtml;

      if (uc.isVerified) {
        const verifiedLabel = lang === 'en' ? 'Verified' : (lang === 'zh-TW' ? '已驗證' : '已验证');
        tagsHtml += `<span class="tag tag-icon-only" title="${verifiedLabel}" style="background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.25); color: #10b981;"><span class="material-symbols-outlined" style="font-size: 14px; font-weight: bold;">verified</span></span>`;
      }

      uc.features.forEach(f => {
        const icon = getTagIcon('feature', f);
        tagsHtml += `<span class="tag tag-feature tag-icon-only" title="${escapeHtml(f)}"><span class="material-symbols-outlined" style="font-size: 14px;">${icon}</span></span>`;
      });

      if (uc.level && uc.level.length > 0) {
        const displayLevels = uc.level.length > 1 ? ["Generic"] : uc.level;
        displayLevels.forEach(lvl => {
          const levelText = t.levels[lvl] || lvl;
          const icon = getTagIcon('level', lvl);
          tagsHtml += `<span class="tag tag-level tag-icon-only" title="${escapeHtml(levelText)}"><span class="material-symbols-outlined" style="font-size: 14px;">${icon}</span></span>`;
        });
      }

      // Render colored indicator tags for connectors
      if (uc.connectors && uc.connectors.length > 0) {
        uc.connectors.forEach(c => {
          const meta = getConnectorMeta(c, lang);
          tagsHtml += `<span class="tag tag-icon-only ${meta.class}" title="${escapeHtml(meta.label)}"><span class="material-symbols-outlined" style="font-size: 14px;">${meta.icon}</span></span>`;
        });
      }

      // Connector localized bottom label
      let connectorLabelHtml = "";
      if (uc.connectors && uc.connectors.length > 0) {
        connectorLabelHtml = uc.connectors.map(c => {
          const meta = getConnectorMeta(c, lang);
          return `<span class="tag tag-full ${meta.class}" style="font-size: 11px; padding: 3px 8px; border-radius: 6px;"><span class="material-symbols-outlined" style="font-size: 13px;">${meta.icon}</span><span>${escapeHtml(meta.label)}</span></span>`;
        }).join(' ');
      } else {
        connectorLabelHtml = `
          <span class="card-connector-req" style="color: var(--color-success)">
            <span class="material-symbols-outlined">check_circle</span>
            ${lang === "en" ? "Standalone Tool" : (lang === "zh-TW" ? "標準工具" : "标准工具")}
          </span>
        `;
      }

      card.innerHTML = `
        <div class="card-top">
          <div class="card-tags">${tagsHtml}</div>
          <h3 class="card-title">${escapeHtml(cardTitle)}</h3>
          <p class="card-summary">${escapeHtml(cardSummary)}</p>
        </div>
        <div class="card-bottom">
          <span class="tag" style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05); color: var(--text-secondary)">${escapeHtml(t.roles[uc.role] || uc.role)}</span>
          ${connectorLabelHtml}
        </div>
      `;

      cardsGrid.appendChild(card);
    });

    hubSection.appendChild(hubHeader);
    hubSection.appendChild(cardsGrid);
    container.appendChild(hubSection);
  });

  if (renderedCount === 0) {
    container.innerHTML = `
      <div class="glass-panel" style="padding: 60px; text-align: center; border-style: dashed;">
        <span class="material-symbols-outlined" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;">search_off</span>
        <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">${t.noUseCasesTitle}</h3>
        <p style="color: var(--text-secondary); max-width: 440px; margin: 0 auto 20px auto; font-size: 14px;">${t.noUseCasesDesc}</p>
        <button class="nav-button nav-button-primary" style="margin: 0 auto;" id="btnResetFilters">${t.btnResetFilters}</button>
      </div>
    `;
    const resetBtn = document.getElementById("btnResetFilters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.value = "";
        appState.searchQuery = "";
        renderUseCases();
      });
    }
  }
}

// Quick Unlock Connector fallback (all cards are permanently unlocked)
window.handleQuickUnlock = function(connectorName) {
  let toggleId = "";
  let key = "";
  const nameLower = (connectorName || "").toLowerCase();

  if (nameLower.includes("drive")) { toggleId = "toggleOneDrive"; key = "onedrive"; }
  else if (nameLower.includes("email") || nameLower.includes("outlook")) { toggleId = "toggleOutlook"; key = "outlook"; }
  else if (nameLower.includes("lms")) { toggleId = "toggleLMS"; key = "lms"; }
  else if (nameLower.includes("calendar") || nameLower.includes("google")) { toggleId = "toggleGoogle"; key = "google"; }

  if (key) {
    appState.activeConnectors[key] = true;
    const toggleEl = document.getElementById(toggleId);
    if (toggleEl) toggleEl.checked = true;
    const indEl = document.getElementById(`indicator-${key}`);
    if (indEl) indEl.classList.add("active");
    renderUseCases();
    const lang = appState.activeLanguage || "en";
    const tTrans = uiTranslations[lang];
    showToast(`${connectorName} ${tTrans.connectorLinkedSuccess || "connector active"}`, "success");
  }
};

// Check if a use case has missing connector dependencies (always returns false to unlock all cards)
function checkMissingConnector(useCase) {
  return false;
}

// Modal Detail View Rendering with Enlarged Workbench, 3 Conceptual Steps, and Embedded Helper Prompts
function openUseCaseModal(useCase) {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;
  const lang = appState.activeLanguage || "en";
  const t = uiTranslations[lang];

  const trans = useCasesTranslations[useCase.id] ? useCasesTranslations[useCase.id][lang] : null;
  const title = trans ? trans.title : useCase.title;
  const summary = trans ? trans.summary : useCase.summary;

  const modalTitleEl = document.getElementById("modalTitle");
  if (modalTitleEl) modalTitleEl.textContent = title;

  // Set metadata tags - Icon with labels for enlarged cards
  let tagsHtml = "";
  if (useCase.isVerified) {
    const verifiedLabel = lang === 'en' ? 'Verified' : (lang === 'zh-TW' ? '已驗證' : '已验证');
    tagsHtml += `<span class="tag tag-full" style="background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.25); color: #10b981; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;"><span class="material-symbols-outlined" style="font-size: 14px; font-weight: bold;">verified</span><span>${verifiedLabel}</span></span>`;
  }

  useCase.features.forEach(f => {
    const icon = getTagIcon('feature', f);
    tagsHtml += `<span class="tag tag-feature tag-full" style="font-size: 11px;"><span class="material-symbols-outlined" style="font-size: 14px;">${icon}</span><span>${escapeHtml(f)}</span></span>`;
  });

  if (useCase.level && useCase.level.length > 0) {
    const displayLevels = useCase.level.length > 1 ? ["Generic"] : useCase.level;
    displayLevels.forEach(lvl => {
      const levelText = t.levels[lvl] || lvl;
      const icon = getTagIcon('level', lvl);
      tagsHtml += `<span class="tag tag-level tag-full" style="font-size: 11px;"><span class="material-symbols-outlined" style="font-size: 14px;">${icon}</span><span>${escapeHtml(levelText)}</span></span>`;
    });
  }

  // Colored tags for connectors in modal header
  if (useCase.connectors && useCase.connectors.length > 0) {
    useCase.connectors.forEach(c => {
      const meta = getConnectorMeta(c, lang);
      tagsHtml += `<span class="tag tag-full ${meta.class}" style="font-size: 11px;"><span class="material-symbols-outlined" style="font-size: 14px;">${meta.icon}</span><span>${escapeHtml(meta.label)}</span></span>`;
    });
  }

  const modalTagsEl = document.getElementById("modalTags");
  if (modalTagsEl) modalTagsEl.innerHTML = tagsHtml;

  const body = document.getElementById("modalDynamicContent");
  if (!body) return;
  body.innerHTML = "";

  // 1. Overview Section
  const overviewSec = document.createElement("div");
  overviewSec.className = "modal-section";
  overviewSec.style.marginBottom = "24px";
  overviewSec.innerHTML = `
    <h4 class="section-label">
      <span class="material-symbols-outlined">info</span> ${t.overviewLabel}
    </h4>
    <p style="font-size: 15px; color: var(--text-secondary); line-height: 1.6;">${escapeHtml(summary)}</p>
  `;
  body.appendChild(overviewSec);

  // 2. Operational Steps (3 Conceptual Stages with Step 1 Helpers and Step 2 Workbench)
  const currentSteps = trans?.steps || useCase.steps || [];
  const currentPrompt = trans?.prompt || useCase.prompt || "";
  const currentProTip = trans?.proTip || useCase.proTip || "";
  const connectorGuide = trans ? trans.connectorGuide : useCase.connectorGuide;

  const stepsSec = document.createElement("div");
  stepsSec.className = "modal-section";

  // Step 1: Setup & Grounding with Embedded Helper Prompts
  const helperPromptsList = (typeof useCaseHelperPrompts !== 'undefined' && useCaseHelperPrompts[useCase.id]) ? (useCaseHelperPrompts[useCase.id][lang] || useCaseHelperPrompts[useCase.id].en || []) : [];
  let helperPromptsHtml = "";
  if (helperPromptsList.length > 0) {
    const helperHeadingText = lang === 'zh-TW' ? '事前準備輔助提示詞（若尚未備妥教材或規準，可直接複製使用）：' : (lang === 'zh-CN' ? '事前准备辅助提示词（若尚未备妥教材或规准，可直接复制使用）：' : 'Prerequisite Helper Prompts (Use if you do not have documents or rubrics handy):');
    const helperItems = helperPromptsList.map(hp => `
      <details class="helper-prompt-collapsible">
        <summary class="helper-prompt-summary">
          <div class="helper-prompt-title">
            <span class="material-symbols-outlined" style="font-size: 15px; color: var(--color-primary);">smart_toy</span>
            <span>${escapeHtml(hp.title)}</span>
            <span class="helper-prompt-badge">${t.helperPromptTag || "HELPER PROMPT"}</span>
          </div>
          <span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-muted);">expand_more</span>
        </summary>
        <div class="helper-prompt-body">
          <div class="helper-prompt-text">${escapeHtml(hp.prompt)}</div>
          <button class="helper-copy-btn" onclick="copyHelperPromptToClipboard(this)">
            <span class="material-symbols-outlined" style="font-size: 14px;">content_copy</span>
            <span>${t.copyHelperPrompt || "Copy Prompt"}</span>
          </button>
        </div>
      </details>
    `).join('');

    helperPromptsHtml = `
      <div class="helper-prompts-container">
        <div class="helper-prompts-heading">
          <span class="material-symbols-outlined" style="font-size: 15px; color: var(--color-primary);">auto_awesome</span>
          <span>${helperHeadingText}</span>
        </div>
        ${helperItems}
      </div>
    `;
  }

  // Step 2: Workbench with "Fill in the variables" and "Sample Prompt"
  const promptVars = extractPromptVariables(currentPrompt);
  const valuesMap = {};
  promptVars.forEach(v => { valuesMap[v.token] = ""; });

  let varInputsHtml = "";
  if (promptVars.length > 0) {
    promptVars.forEach((v, vIdx) => {
      varInputsHtml += `
        <div class="variable-input-group">
          <label class="variable-label" for="promptVarInput_${vIdx}">{{${escapeHtml(v.label)}}}</label>
          <input type="text" class="variable-input" id="promptVarInput_${vIdx}" data-token="${escapeHtml(v.token)}" placeholder="${escapeHtml(v.label)}..." />
        </div>
      `;
    });
  } else {
    varInputsHtml = `
      <div style="font-size: 12px; color: var(--text-muted); font-style: italic; padding: 12px 0;">
        ${lang === "zh-TW" ? "此提示詞無需額外填寫變數即可直接運行。" : (lang === "zh-CN" ? "此提示词无需额外填写变量即可直接运行。" : "This prompt is ready to run without extra variables.")}
      </div>
    `;
  }

  const initialTokensHtml = buildInteractivePromptHtml(currentPrompt, promptVars, valuesMap);

  // Step 3: Human Review, Delivery, Manual Tip Box & Pro-Tip
  let manualTipHtml = "";
  if (useCase.connectors && useCase.connectors.length > 0) {
    manualTipHtml = `
      <div class="manual-tip-box" style="margin-top: 14px;">
        <span class="material-symbols-outlined manual-tip-icon">tips_and_updates</span>
        <div class="manual-tip-content">
          <div class="manual-tip-title">${lang === "en" ? "No Connector Active? Manual Upload Tip" : (lang === "zh-TW" ? "未啟用連接器？手動上傳提示" : "未启用连接器？手动上传提示")}</div>
          <p class="manual-tip-text">${lang === "en" ? "If enterprise connectors are not configured or offline, you can directly upload and attach your reference files, rubrics, or lecture notes into the Gemini chat to achieve identical results." : (lang === "zh-TW" ? "若尚未配置企業連接器或處於離線狀態，您可以直接在 Gemini 對話框中手動上傳參考文件、評分規準或教材檔案，即可達到完全相同的分析成效。" : "若尚未配置企业连接器或处于离线状态，您可以直接在 Gemini 对话框中手动上传参考文档、评分规准或教材档案，即可达到完全相同的分析成效。")}</p>
        </div>
      </div>
    `;
  }

  let guideHtml = "";
  if (connectorGuide && connectorGuide.steps && connectorGuide.steps.length > 0) {
    const stepsLi = connectorGuide.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('');
    guideHtml = `
      <div class="setup-guide-box" style="margin-top: 14px;">
        <div class="setup-guide-header">
          <span class="material-symbols-outlined">settings_suggest</span>
          ${escapeHtml(connectorGuide.name)} ${lang === "en" ? "Setup Instructions" : (lang === "zh-TW" ? "部署設定指南" : "部署设定指南")}
        </div>
        <ol class="setup-steps">${stepsLi}</ol>
      </div>
    `;
  }

  let proTipHtml = "";
  if (currentProTip) {
    proTipHtml = `
      <div class="pro-tip-box" style="margin-top: 14px;">
        <span class="material-symbols-outlined pro-tip-icon">lightbulb</span>
        <div class="pro-tip-content">
          <div class="pro-tip-title">${t.adoptionProTip}</div>
          <p class="pro-tip-text">${escapeHtml(currentProTip)}</p>
        </div>
      </div>
    `;
  }

  stepsSec.innerHTML = `
    <h4 class="section-label">
      <span class="material-symbols-outlined">route</span> ${t.operationalSteps}
    </h4>
    <ul class="steps-list">
      <!-- Step 1: Setup & Grounding -->
      <li class="step-item">
        <div class="step-header">
          <div class="step-num">1</div>
          <div class="step-info">
            <div class="step-title">${t.step1Title || "Setup & Grounding"}</div>
            <div class="step-desc">${escapeHtml(currentSteps[0] || "Upload course materials and establish knowledge grounding.")}</div>
          </div>
        </div>
        ${helperPromptsHtml}
      </li>

      <!-- Step 2: Execute Sample Prompt -->
      <li class="step-item">
        <div class="step-header">
          <div class="step-num">2</div>
          <div class="step-info">
            <div class="step-title">${t.step2Title || "Execute Sample Prompt"}</div>
            <div class="step-desc">${escapeHtml(currentSteps[1] || "Configure variables and execute the agent prompt.")}</div>
          </div>
        </div>
        <div class="step-workbench-container" style="margin-top: 14px;">
          <div class="prompt-workbench-grid">
            <div class="prompt-variables-panel">
              <div class="prompt-variables-header">
                <div class="prompt-variables-title">
                  <span class="material-symbols-outlined" style="font-size: 16px;">tune</span>
                  <span>${t.fillVariablesTitle || "Fill in the variables"}</span>
                </div>
                <span class="prompt-variables-subtitle">${t.fillVariablesDesc || "Click tokens or type below"}</span>
              </div>
              <div class="prompt-variables-grid">
                ${varInputsHtml}
              </div>
            </div>
            <div class="prompt-box" id="modalPromptText">
              <div class="prompt-raw-text" id="modalPromptDisplay">${initialTokensHtml}</div>
              <button class="copy-prompt-btn" onclick="copyPromptToClipboard()">
                <span class="material-symbols-outlined" style="font-size: 16px;">content_copy</span>
                ${t.copyPrompt || "Copy Prompt"}
              </button>
            </div>
          </div>
        </div>
      </li>

      <!-- Step 3: Human Review & Delivery -->
      <li class="step-item">
        <div class="step-header">
          <div class="step-num">3</div>
          <div class="step-info">
            <div class="step-title">${t.step3Title || "Human Review & Delivery"}</div>
            <div class="step-desc">${escapeHtml(currentSteps[2] || "Review output quality, personalize feedback, and deliver to students or LMS.")}</div>
          </div>
        </div>
        ${manualTipHtml}
        ${guideHtml}
        ${proTipHtml}
      </li>
    </ul>
  `;

  body.appendChild(stepsSec);

  // Initialize interactive variable listeners & click-to-focus on {{VARIABLE}} tokens
  const promptBox = stepsSec.querySelector("#modalPromptText");
  const promptDisplayEl = stepsSec.querySelector("#modalPromptDisplay");

  if (promptBox) {
    promptBox.dataset.currentPrompt = currentPrompt;
  }

  if (promptVars.length > 0 && promptDisplayEl) {
    // 1. Click token in prompt -> focus matching input field with smooth scroll and pulse animation
    promptDisplayEl.addEventListener("click", (e) => {
      const tokenSpan = e.target.closest(".prompt-var-token");
      if (!tokenSpan) return;
      const token = tokenSpan.dataset.token;
      if (!token) return;
      const input = stepsSec.querySelector(`input[data-token="${CSS.escape(token)}"]`);
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "nearest" });
        input.classList.remove("pulse-focus");
        void input.offsetWidth; // force reflow
        input.classList.add("pulse-focus");
      }
    });

    // 2. Input typing -> live interpolate into display and clipboard dataset
    const varInputs = stepsSec.querySelectorAll(".variable-input");
    const updateInterpolation = () => {
      const newHtml = buildInteractivePromptHtml(currentPrompt, promptVars, valuesMap);
      promptDisplayEl.innerHTML = newHtml;
      const plainText = getInterpolatedPlainText(currentPrompt, promptVars, valuesMap);
      if (promptBox) {
        promptBox.dataset.currentPrompt = plainText;
      }
    };

    varInputs.forEach(inp => {
      inp.addEventListener("input", (e) => {
        const token = e.target.dataset.token;
        valuesMap[token] = e.target.value;
        updateInterpolation();
      });
    });
  }

  overlay.classList.add("active");
}

// Close Detail Modal
function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.classList.remove("active");
}

// Interactive Copy Button Logic
window.copyPromptToClipboard = function() {
  const container = document.getElementById("modalPromptText");
  if (!container) return;
  const lang = appState.activeLanguage || "en";
  const t = uiTranslations[lang];

  // Extract text from dataset or child text element (clean without copy button text)
  const text = container.dataset.currentPrompt || container.querySelector(".prompt-raw-text")?.textContent?.trim() || "";

  navigator.clipboard.writeText(text).then(() => {
    const successCopiedText = t.promptCopiedSuccess;
    showToast(successCopiedText, "success");
    const copyBtn = container.querySelector(".copy-prompt-btn");
    if (copyBtn) {
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px; color: var(--color-success)">check_circle</span> ${t.copied}`;
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    }
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
      const totalLikes = uc.totalLikes || 0;

      prefBar.innerHTML = `
        <button class="pref-btn btn-like" style="background: none; border: none; padding: 4px; display: inline-flex; align-items: center; cursor: pointer; color: ${likeActive ? 'var(--color-danger)' : 'var(--text-muted)'}; transition: color 0.2s; gap: 4px;" title="Like Use Case">
          <span class="material-symbols-outlined" style="font-size: 18px; font-variation-settings: 'FILL' ${likeActive ? 1 : 0}">${likeActive ? 'favorite' : 'favorite'}</span>
          <span class="likes-count" style="font-size: 12px; font-family: inherit; font-weight: 500;">${totalLikes}</span>
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
        const resObj = await syncUserPreference(uc.id, 'like', newStatus);
        if (resObj && resObj.success) {
          uc.isLiked = newStatus;
          uc.totalLikes = resObj.totalLikes;
          likeBtn.style.color = newStatus ? 'var(--color-danger)' : 'var(--text-muted)';
          likeBtn.querySelector(".material-symbols-outlined").style.fontVariationSettings = `'FILL' ${newStatus ? 1 : 0}`;
          likeBtn.querySelector(".likes-count").textContent = resObj.totalLikes;
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
    return action === 'like' ? { success: data.success, totalLikes: data.totalLikes } : data.success;
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
  initMouseGlow();
  initTheme();
  initLanguage();
  initFeedbackSystem();

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
      appState.isAssist = auth.user.isAssist || false;

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
          
          updateUILanguage(); // Make sure admin headers are drawn!
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



  // Mobile responsive sidebar drawer hooks
  const btnMobileMenu = document.getElementById("btnMobileMenu");
  const btnMobileSidebarClose = document.getElementById("btnMobileSidebarClose");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const appSidebar = document.getElementById("appSidebar");

  const openMobileSidebar = () => {
    if (appSidebar) appSidebar.classList.add("active");
    if (sidebarOverlay) sidebarOverlay.classList.add("active");
  };

  const closeMobileSidebar = () => {
    if (appSidebar) appSidebar.classList.remove("active");
    if (sidebarOverlay) sidebarOverlay.classList.remove("active");
  };

  if (btnMobileMenu) {
    btnMobileMenu.addEventListener("click", openMobileSidebar);
  }

  if (btnMobileSidebarClose) {
    btnMobileSidebarClose.addEventListener("click", closeMobileSidebar);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeMobileSidebar);
  }

  // Auto-close sidebar drawer when navigating filters on mobile
  document.querySelectorAll(".category-filter-item, .feature-filter-item, .status-filter-item").forEach(item => {
    item.addEventListener("click", closeMobileSidebar);
  });

  // Mobile responsive admin sidebar drawer hooks
  const btnAdminMobileMenu = document.getElementById("btnAdminMobileMenu");
  const btnAdminMobileSidebarClose = document.getElementById("btnAdminMobileSidebarClose");
  const adminSidebar = document.getElementById("adminSidebar");

  const openAdminMobileSidebar = () => {
    if (adminSidebar) adminSidebar.classList.add("active");
    if (sidebarOverlay) sidebarOverlay.classList.add("active");
  };

  const closeAdminMobileSidebar = () => {
    if (adminSidebar) adminSidebar.classList.remove("active");
    if (sidebarOverlay) sidebarOverlay.classList.remove("active");
  };

  if (btnAdminMobileMenu) {
    btnAdminMobileMenu.addEventListener("click", openAdminMobileSidebar);
  }

  if (btnAdminMobileSidebarClose) {
    btnAdminMobileSidebarClose.addEventListener("click", closeAdminMobileSidebar);
  }

  // Close admin sidebar on tab selections or clicking the overlay
  document.querySelectorAll(".admin-tab-item").forEach(item => {
    item.addEventListener("click", closeAdminMobileSidebar);
  });
  
  // Make sidebarOverlay close the active admin sidebar too
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeAdminMobileSidebar);
  }
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
        if (data.isAdmin) {
          sessionStorage.setItem("ge_current_view", "admin");
        }
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
    sessionStorage.removeItem("ge_current_view");
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
  const isAssist = appState.isAssist === true;
  const isSuperAdmin = (appState.userEmail === 'edu_portal_s_admin');

  let savedTab = sessionStorage.getItem("ge_current_admin_tab") || "users";
  if (isAssist && savedTab === "users") {
    savedTab = "cases";
  }
  currentAdminTab = savedTab;

  const btnCreate = document.getElementById("btnAdminCreateCase");
  if (btnCreate) {
    btnCreate.style.display = isAssist ? "none" : "block";
  }

  // Hide Users Provisioning sidebar navigation tab for Assist Admin completely
  const usersNav = document.getElementById("adminTabUsersNav");
  if (usersNav) {
    usersNav.style.display = isAssist ? "none" : "flex";
  }

  // Hide Use Cases Import button for Assist Admin completely
  const btnImport = document.getElementById("btnAdminImportCases");
  if (btnImport) {
    btnImport.style.display = isAssist ? "none" : "block";
  }

  // Allow both Super Admin and Assist Admin to view Feedbacks list tab
  const feedbacksNav = document.getElementById("adminTabFeedbacksNav");
  if (feedbacksNav) {
    feedbacksNav.style.display = (isSuperAdmin || isAssist) ? "flex" : "none";
  }

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
  
  const tabFeedbacks = document.getElementById("adminTabFeedbacks");
  if (tabFeedbacks) {
    tabFeedbacks.style.display = savedTab === 'feedbacks' ? 'block' : 'none';
  }

  if (savedTab === 'users') loadAdminUsers();
  else if (savedTab === 'analytics') loadAdminStats();
  else if (savedTab === 'cases') loadAdminUseCases();
  else if (savedTab === 'feedbacks' && (isSuperAdmin || isAssist)) loadAdminFeedbacks();

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
      if (tabFeedbacks) {
        tabFeedbacks.style.display = target === 'feedbacks' ? 'block' : 'none';
      }

      if (target === 'users') loadAdminUsers();
      else if (target === 'analytics') loadAdminStats();
      else if (target === 'cases') loadAdminUseCases();
      else if (target === 'feedbacks' && (isSuperAdmin || isAssist)) loadAdminFeedbacks();
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
    updateUILanguage(); // Make sure admin headers are drawn!
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
        if (data.multiple) {
          const succList = data.summary.success.map(e => `<li><code>${e}</code></li>`).join('');
          const dupList = data.summary.duplicates.length > 0 
            ? `<div style="margin-top: 8px; font-size: 11px; color: var(--text-secondary);"><strong>Skipped Duplicates:</strong><br>${data.summary.duplicates.join(', ')}</div>` 
            : '';
          const errList = data.summary.errors.length > 0 
            ? `<div style="margin-top: 8px; font-size: 11px; color: var(--color-danger);"><strong>Failed Accounts:</strong><br>${data.summary.errors.join(', ')}</div>` 
            : '';

          feedback.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 4px; padding: 12px; font-size: 13px; color: var(--color-success);">
              <strong>✅ Multiple User Accounts Provisioned!</strong><br>
              <div style="margin-top: 6px; font-size: 12px;">
                Successfully created accounts:
                <ul style="margin: 4px 0; padding-left: 20px; text-align: left;">${succList || '<li>None</li>'}</ul>
              </div>
              Default Temporary Password for all: <strong style="font-family: monospace; background: var(--bg-prompt-box); padding: 2px 6px; border-radius: 4px; color: var(--text-prompt-box); border: 1px solid var(--border-glass);">${data.defaultPassword}</strong>
              <p style="font-size: 11px; margin-top: 6px; color: var(--text-secondary);">The provisioned users will be prompted to reset their password immediately on their first login.</p>
              ${dupList}
              ${errList}
            </div>
          `;
        } else {
          feedback.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 4px; padding: 12px; font-size: 13px; color: var(--color-success);">
              <strong>✅ User Account Provisioned!</strong><br>
              Email: <code>${data.email}</code><br>
              Temporary Password: <strong style="font-family: monospace; background: var(--bg-prompt-box); padding: 2px 6px; border-radius: 4px; color: var(--text-prompt-box); border: 1px solid var(--border-glass);">${data.tempPassword}</strong>
              <p style="font-size: 11px; margin-top: 4px; color: var(--text-secondary);">Share this credentials with the user. They will be prompted to reset it immediately on sign-in.</p>
            </div>
          `;
        }
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
    const checkedBoxes = document.querySelectorAll(".admin-case-checkbox:checked");
    if (checkedBoxes.length === 0) {
      alert("Please select at least one use case to export by checking the boxes in the table rows.");
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
        isVerified: uc.isVerified !== undefined ? uc.isVerified : false
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
          alert("Selected JSON file does not contain any valid playbooks.");
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
            shouldOverwrite = confirm(`Use case ID "${uc.id}" ("${uc.title}") already exists in the system.\n\nDo you want to overwrite and replace it?`);
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
              isVerified: uc.isVerified !== undefined ? uc.isVerified : false
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

        alert(`Playbook import completed!\n\nSuccessfully Imported: ${createdCount}\nSuccessfully Overwritten: ${updatedCount}\nSkipped/Failed: ${skippedCount}`);
        
        // Reload all data arrays and render lists
        loadAdminUseCases();
        loadUseCasesFromServer().then(() => renderUseCases());

      } catch (err) {
        console.error("Failed to parse or import file:", err);
        alert("An error occurred. Make sure you selected a valid playbook JSON backup file.");
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
          <button class="nav-button btn-revoke-user" style="height: 28px; padding: 0 10px; font-size: 11px; background: var(--color-danger); border-color: var(--color-danger); color: #ffffff !important;">Revoke</button>
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
                  New Temporary Password: <strong style="font-family: monospace; background: var(--bg-prompt-box); padding: 2px 6px; border-radius: 4px; color: var(--text-prompt-box); border: 1px solid var(--border-glass);">${data.tempPassword}</strong>
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
                    <span style="font-size: 10px; background: rgba(255,255,255,0.05); color: var(--text-secondary); padding: 2px 8px; border-radius: 12px; font-weight: 500; text-transform: capitalize; border: 1px solid var(--border-hairline);">${categoryName}</span>
                    <span style="font-size: 10px; background: rgba(255,255,255,0.05); color: var(--text-muted); padding: 2px 8px; border-radius: 12px; font-weight: 500; border: 1px solid var(--border-hairline);">${item.role}</span>
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
    <polyline points="${pointsDeploy.join(' ')}" fill="none" stroke="var(--color-success)" stroke-width="2" />

    <!-- Data Markers -->
    ${history.map((h, i) => {
      const x = paddingLeft + (i * stepX);
      const yViews = paddingTop + chartHeight - ((h.views / maxVal) * chartHeight);
      const yLikes = paddingTop + chartHeight - ((h.likes / maxVal) * chartHeight);
      const yDeploy = paddingTop + chartHeight - ((h.deployments / maxVal) * chartHeight);
      return `
        <circle cx="${x}" cy="${yViews}" r="4" fill="var(--bg-dark-base)" stroke="var(--color-secondary)" stroke-width="2" class="chart-dot" style="cursor: pointer;" />
        <circle cx="${x}" cy="${yLikes}" r="4" fill="var(--bg-dark-base)" stroke="var(--color-danger)" stroke-width="2" class="chart-dot" style="cursor: pointer;" />
        <circle cx="${x}" cy="${yDeploy}" r="4" fill="var(--bg-dark-base)" stroke="var(--color-success)" stroke-width="2" class="chart-dot" style="cursor: pointer;" />
      `;
    }).join('')}

    <!-- Interactive Hover Markers -->
    <circle id="hoverViewsCircle" r="5.5" fill="var(--color-secondary)" stroke="#ffffff" stroke-width="1.5" opacity="0" pointer-events="none" />
    <circle id="hoverLikesCircle" r="5.5" fill="var(--color-danger)" stroke="#ffffff" stroke-width="1.5" opacity="0" pointer-events="none" />
    <circle id="hoverDeploysCircle" r="5.5" fill="var(--color-success)" stroke="#ffffff" stroke-width="1.5" opacity="0" pointer-events="none" />
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
    const yDeploy = paddingTop + chartHeight - ((h.deployments / maxVal) * chartHeight);

    const hLine = svg.getElementById("hoverLine");
    if (hLine) {
      hLine.setAttribute("x1", x);
      hLine.setAttribute("x2", x);
      hLine.setAttribute("opacity", "0.6");
    }

    const cViews = svg.getElementById("hoverViewsCircle");
    const cLikes = svg.getElementById("hoverLikesCircle");
    const cDeploys = svg.getElementById("hoverDeploysCircle");

    if (cViews) { cViews.setAttribute("cx", x); cViews.setAttribute("cy", yViews); cViews.setAttribute("opacity", "1"); }
    if (cLikes) { cLikes.setAttribute("cx", x); cLikes.setAttribute("cy", yLikes); cLikes.setAttribute("opacity", "1"); }
    if (cDeploys) { cDeploys.setAttribute("cx", x); cDeploys.setAttribute("cy", yDeploy); cDeploys.setAttribute("opacity", "1"); }

    tooltip.style.display = "block";
    tooltip.style.opacity = "1";
    if (x <= width / 2) {
      tooltip.style.left = `${x + 15}px`;
    } else {
      tooltip.style.left = `${x - 145}px`;
    }
    tooltip.style.top = `${Math.min(mouseY - 10, height - 95)}px`;

    const lang = appState.activeLanguage || "en";
    let labelViews = "Views";
    let labelLikes = "Likes";
    let labelDeploys = "Deploys";

    if (lang === "zh-TW") {
      labelViews = "查看次數";
      labelLikes = "按讚數";
      labelDeploys = "部署次數";
    } else if (lang === "zh-CN") {
      labelViews = "查看次数";
      labelLikes = "点赞数";
      labelDeploys = "部署次数";
    }

    tooltip.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 6px; border-bottom: 1px solid var(--border-glass); padding-bottom: 4px; color: var(--color-primary); font-family: var(--font-heading); font-size: 11px;">${h.month}</div>
      <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
        <span style="color: var(--text-secondary); display: flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 6px; height: 6px; background: var(--color-secondary); border-radius: 50%;"></span>${labelViews}:</span>
        <strong style="color: var(--text-primary); font-family: monospace;">${h.views}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
        <span style="color: var(--text-secondary); display: flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 6px; height: 6px; background: var(--color-danger); border-radius: 50%;"></span>${labelLikes}:</span>
        <strong style="color: var(--text-primary); font-family: monospace;">${h.likes}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; gap: 16px;">
        <span style="color: var(--text-secondary); display: flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 6px; height: 6px; background: var(--color-success); border-radius: 50%;"></span>${labelDeploys}:</span>
        <strong style="color: var(--text-primary); font-family: monospace;">${h.deployments}</strong>
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
    const cDeploys = svg.getElementById("hoverDeploysCircle");

    if (cViews) cViews.setAttribute("opacity", "0");
    if (cLikes) cLikes.setAttribute("opacity", "0");
    if (cDeploys) cDeploys.setAttribute("opacity", "0");
  }

  container.appendChild(svg);
}

// Admin Tab 3: Load Use Cases CRUD
async function loadAdminUseCases() {
  const tbody = document.getElementById("adminCasesTableBody");
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: var(--text-muted);">Loading use cases...</td></tr>`;

  try {
    const res = await fetch('/api/use-cases');
    const cases = await res.json();
    appState.loadedAdminUseCases = cases;

    // Reset select all checkbox
    const selectAllCheckbox = document.getElementById("chkAdminSelectAllCases");
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.onchange = (e) => {
        const isChecked = e.target.checked;
        document.querySelectorAll(".admin-case-checkbox").forEach(cb => {
          cb.checked = isChecked;
        });
      };
    }

    tbody.innerHTML = "";
    const activeLang = appState.activeLanguage || "en";
    cases.forEach(uc => {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid var(--border-glass)";

      const trans = uc.translations ? uc.translations[activeLang] : null;
      const titleText = (trans && trans.title) ? trans.title : uc.title;

      let badgeMarkup = "";
      const badgeHtml = getUsecaseBadgeHtml(uc, activeLang);
      if (badgeHtml) {
        badgeMarkup = `<span style="margin-left: 6px;">${badgeHtml}</span>`;
      }

      const verifiedLabel = uc.isVerified 
        ? `<span class="tag" style="background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.25); color: #10b981; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; border-radius: 4px;"><span class="material-symbols-outlined" style="font-size: 12px; font-weight: bold;">verified</span>${activeLang === 'en' ? 'Yes' : (activeLang === 'zh-TW' ? '是' : '是')}</span>`
        : `<span class="tag" style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05); color: var(--text-muted); font-size: 10px; padding: 2px 6px; border-radius: 4px;">${activeLang === 'en' ? 'No' : (activeLang === 'zh-TW' ? '否' : '否')}</span>`;

      const isAssist = appState.isAssist === true;
      tr.innerHTML = `
        <td style="padding: 12px 8px; text-align: center;">
          <input type="checkbox" class="admin-case-checkbox" value="${uc.id}" style="cursor: pointer; width: 15px; height: 15px; accent-color: var(--color-primary);">
        </td>
        <td style="padding: 12px 8px; font-family: monospace; font-size: 11px; color: var(--color-primary); font-weight: 700;">${uc.id}</td>
        <td style="padding: 12px 8px; font-weight: 500;">
          <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
            <span>${titleText}</span>
            ${badgeMarkup}
          </div>
        </td>
        <td style="padding: 12px 8px; text-transform: capitalize; color: var(--text-secondary);">${uc.category}</td>
        <td style="padding: 12px 8px; color: var(--text-muted);">${uc.role}</td>
        <td style="padding: 12px 8px;">${verifiedLabel}</td>
        <td style="padding: 12px 8px; text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
          <button class="nav-button btn-edit-case" style="height: 28px; padding: 0 10px; font-size: 11px;">${isAssist ? 'View' : 'Edit'}</button>
          ${isAssist ? '' : '<button class="nav-button btn-delete-case" style="height: 28px; padding: 0 10px; font-size: 11px; background: var(--color-danger); border-color: var(--color-danger); color: #ffffff !important;">Delete</button>'}
        </td>
      `;

      tbody.appendChild(tr);

      tr.querySelector(".btn-edit-case").onclick = () => openAdminEditModal(uc);
      if (!isAssist) {
        tr.querySelector(".btn-delete-case").onclick = () => deleteAdminUseCase(uc.id);
      }
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
    title.textContent = `Edit Playbook: ${uc.title}`;
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

    // Set verified state
    const verifiedBox = document.getElementById("formCaseVerified");
    if (verifiedBox) {
      verifiedBox.checked = !!uc.isVerified;
    }

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
    title.textContent = "Create New Playbook Template";
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
    
    const verifiedBox = document.getElementById("formCaseVerified");
    if (verifiedBox) {
      verifiedBox.checked = false;
    }

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

  modal.classList.add("active");
}

async function saveAdminUseCase() {
  if (appState.isAssist) {
    alert("Administrative assistants are not permitted to save or modify templates.");
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

  const isVerified = document.getElementById("formCaseVerified").checked;

  const payload = {
    id, category, title, role, summary, features, connectors, level, steps, prompt, proTip, translations, isVerified
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
      loadUseCasesFromServer().then(() => renderUseCases());
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
      feedback.textContent = "Please specify either a playbook title or custom instructions so Gemini can draft relevant content.";
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
    const lang = appState.activeLanguage || "en";
    const genLabel = document.getElementById("adminFormLabelGenerating");
    const genDesc = document.getElementById("adminFormLabelGeneratingDesc");
    if (genLabel && genDesc) {
      if (lang === "zh-TW") {
        genLabel.textContent = "Gemini 正在生成學習案例中...";
        genDesc.textContent = "正在即時優化導引、提示詞與繁體中文本地化資料。";
      } else if (lang === "zh-CN") {
        genLabel.textContent = "Gemini 正在生成学习案例中...";
        genDesc.textContent = "正在即时优化指引、提示词与简体中文本地化数据。";
      } else {
        genLabel.textContent = "Gemini is drafting playbook...";
        genDesc.textContent = "Optimizing guidelines, prompts, and localizations in real-time.";
      }
    }
    loader.classList.add("active");
  }

  // Change button state
  const originalBtnHtml = btn.innerHTML;
  btn.disabled = true;
  btn.style.opacity = "0.7";
  btn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px; animation: spin 1s linear infinite;">autorenew</span> <span>Generating...</span>`;

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
      const errMsg = (data && data.error) ? data.error : "Failed to generate content from Gemini.";
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
      showToast("Gemini has successfully drafted your new playbook!");
    } else {
      // EDITING MODE: Show Side-by-Side Diff modal!
      showDiffViewer(aiRes);
    }

  } catch (err) {
    console.error("Gemini generation error:", err);
    if (feedback) {
      feedback.style.display = "block";
      feedback.textContent = "An error occurred during Gemini AI drafting: " + err.message;
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
    label: "Required Gemini Features",
    current: currentFeatures.join(", ") || "(None)",
    proposed: proposedFeatures.join(", ") || "(None)"
  });

  // 2. Required Connectors
  diffItems.push({
    label: "Required Connectors",
    current: currentConnectors.join(", ") || "(None)",
    proposed: proposedConnectors.join(", ") || "(None)"
  });

  // English Summary
  diffItems.push({
    label: "English Summary Description",
    current: document.getElementById("formCaseSummary").value,
    proposed: aiRes.en?.summary || ""
  });

  // English Steps
  diffItems.push({
    label: "English Guide Steps",
    current: document.getElementById("formCaseSteps").value,
    proposed: Array.isArray(aiRes.en?.steps) ? aiRes.en.steps.join("\n") : ""
  });
  // English Prompt
  diffItems.push({
    label: "English Prompt Instruction",
    current: document.getElementById("formCasePrompt").value,
    proposed: aiRes.en?.prompt || ""
  });
  // English Pro Tip
  diffItems.push({
    label: "English Pro Tip",
    current: document.getElementById("formCaseProTip").value,
    proposed: aiRes.en?.proTip || ""
  });

  // Traditional Chinese Translations
  diffItems.push({
    label: "Traditional Chinese Translated Title",
    current: document.getElementById("formTransZhtwTitle").value,
    proposed: aiRes["zh-TW"]?.title || document.getElementById("formCaseTitle").value
  });
  diffItems.push({
    label: "Traditional Chinese Translated Summary",
    current: document.getElementById("formTransZhtwSummary").value,
    proposed: aiRes["zh-TW"]?.summary || ""
  });
  diffItems.push({
    label: "Traditional Chinese Steps",
    current: document.getElementById("formTransZhtwSteps").value,
    proposed: Array.isArray(aiRes["zh-TW"]?.steps) ? aiRes["zh-TW"].steps.join("\n") : ""
  });
  diffItems.push({
    label: "Traditional Chinese Prompt",
    current: document.getElementById("formTransZhtwPrompt").value,
    proposed: aiRes["zh-TW"]?.prompt || ""
  });
  diffItems.push({
    label: "Traditional Chinese Pro Tip",
    current: document.getElementById("formTransZhtwProTip").value,
    proposed: aiRes["zh-TW"]?.proTip || ""
  });

  // Simplified Chinese Translations
  diffItems.push({
    label: "Simplified Chinese Translated Title",
    current: document.getElementById("formTransZhcnTitle").value,
    proposed: aiRes["zh-CN"]?.title || document.getElementById("formCaseTitle").value
  });
  diffItems.push({
    label: "Simplified Chinese Translated Summary",
    current: document.getElementById("formTransZhcnSummary").value,
    proposed: aiRes["zh-CN"]?.summary || ""
  });
  diffItems.push({
    label: "Simplified Chinese Steps",
    current: document.getElementById("formTransZhcnSteps").value,
    proposed: Array.isArray(aiRes["zh-CN"]?.steps) ? aiRes["zh-CN"].steps.join("\n") : ""
  });
  diffItems.push({
    label: "Simplified Chinese Prompt",
    current: document.getElementById("formTransZhcnPrompt").value,
    proposed: aiRes["zh-CN"]?.prompt || ""
  });
  diffItems.push({
    label: "Simplified Chinese Pro Tip",
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
      <div style="font-size: 11px; font-weight: 700; color: ${isDifferent ? 'var(--color-primary)' : 'var(--text-secondary)'}; display: flex; align-items: center; gap: 4px;">
        <span class="material-symbols-outlined" style="font-size: 14px;">${isDifferent ? 'pending_actions' : 'check_circle'}</span>
        <span>${item.label}</span>
        ${isDifferent ? '<span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(79, 70, 229, 0.15); color: var(--color-primary); margin-left: auto;">OPTIMIZED SUGGESTION AVAILABLE</span>' : ''}
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
    showToast("Gemini suggestions applied successfully to form!");
  };

  document.getElementById("btnDiffReject").onclick = () => {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
    showToast("Gemini suggestions declined. Kept current version.");
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
      showToast(appState.activeLanguage === 'zh-TW' ? "感謝您的回饋！" : (appState.activeLanguage === 'zh-CN' ? "感谢您的反馈！" : "Feedback submitted successfully!"));
      const modal = document.getElementById("feedbackSubmissionModal");
      if (modal) {
        modal.classList.remove("active");
        modal.style.display = "none";
      }
    } else {
      alert(data.error || "Failed to submit feedback.");
    }
  } catch (err) {
    alert("Server connection failure. Please try again.");
  }
};

window.loadAdminFeedbacks = async function() {
  const tbody = document.getElementById("adminFeedbacksTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">Loading feedbacks...</td></tr>`;
  try {
    const res = await fetch('/api/feedbacks');
    const data = await res.json();
    if (!data.success) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--color-danger);">${data.error || 'Failed to load feedbacks'}</td></tr>`;
      return;
    }
    if (data.feedbacks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">No feedback suggestions submitted yet.</td></tr>`;
      return;
    }
    
    const isAssist = appState.isAssist === true;
    let html = '';
    data.feedbacks.forEach(fb => {
      const d = new Date(fb.created_at);
      const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      html += `
        <tr style="border-bottom: 1px solid var(--border-glass); transition: background 0.2s ease;">
          <td style="padding: 12px 8px; font-weight: 700; color: var(--text-primary); font-family: var(--font-heading);">${fb.user_email}</td>
          <td style="padding: 12px 8px; color: var(--text-secondary); line-height: 1.5; white-space: pre-wrap;">${fb.feedback_text}</td>
          <td style="padding: 12px 8px; color: var(--text-muted); font-size: 11px;">${dateStr}</td>
          <td style="padding: 12px 8px; text-align: right;">
            ${isAssist ? '' : `
            <button class="nav-button" onclick="deleteFeedback(${fb.id})" style="padding: 4px; min-width: auto; border: none; background: transparent; color: var(--text-muted); transition: color 0.2s ease;" onmouseover="this.style.color='var(--color-danger)'" onmouseout="this.style.color='var(--text-muted)'">
              <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
            </button>
            `}
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--color-danger);">Server connection error.</td></tr>`;
  }
};

window.deleteFeedback = async function(id) {
  if (!confirm("Are you sure you want to dismiss this feedback?")) return;
  try {
    const res = await fetch('/api/feedbacks/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.success) {
      showToast("Feedback dismissed successfully.");
      loadAdminFeedbacks();
    } else {
      alert(data.error || "Failed to dismiss feedback.");
    }
  } catch (err) {
    alert("Server connection failure.");
  }
};
