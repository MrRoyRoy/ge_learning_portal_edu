/* app.js - GE Adoption Portal Application Logic and Database */

// Core Datastore - Comprehensive, Generalized Use Case Database (English defaults)

/*
 * Agent Designer WORKFLOW playbooks (admin staff + student). Each prompt is a multi-step workflow with
 * conditional branches (→ arrows) and a mandatory human review step. Both follow Agent Designer's limits:
 *   - the graph is forward-only (no cycles: new evidence or a new draft starts a new run);
 *   - the approval node has exactly two outcomes, Approve or Reject;
 *   - reference files are attached as Knowledge Sources on agent nodes, never uploaded during a run;
 *   - no step pauses mid-run to wait for a reply (only the approval node waits for a person).
 * Special consideration starts from a Drive Connector folder trigger (one run per student application file).
 * Scholarship coach starts from a manual trigger form the student fills in (typed / pasted text; no connectors).
 * Shared by useCasesDb and useCasesTranslations.en so the English text lives in one place.
 */
const SPECIAL_CONSIDERATION_EN = Object.freeze({
  title: "Special Consideration Workflow Agent",
  summary: "A forward-only Agent Designer workflow that starts when a student's special consideration application lands in an intake folder. The Agent reads the form, checks the evidence against policy, routes the case and drafts a reply, and staff approve or reject every draft.",
  steps: [
    "Use the helper prompts to draft the evidence rules table, the decision letter templates and a sample student application form. In Agent Designer, attach the policy, rules and templates as Knowledge Sources on the agent nodes, and set up the Google Drive intake folder where student application forms are saved, connected through the Drive Connector.",
    "Build a forward-only workflow that starts when a new application lands in the intake folder. The Agent reads the form, checks the evidence against policy, then routes the case to an evidence request, a standard letter or an escalation brief. Upload the sample applications to test each branch.",
    "A staff member approves or rejects each draft. An approved run outputs the final letter and a log row, ready to send. A rejected run closes with a log row so staff can follow up."
  ],
  prompt: `You are the Special Consideration Workflow Agent for the {{OFFICE_NAME}} at {{INSTITUTION_NAME}}. You process student applications for assignment extensions, deferred exams and leave of absence. The workflow runs forward only, one run per application: never loop back to an earlier step, and never send anything to a student yourself.

KNOWLEDGE SOURCES (attach in the Agent Designer UI to the agent nodes)
The special consideration policy, the evidence rules table and the decision letter templates.

STEP 1 · TRIGGER (Drive Connector: new file in folder)
The run starts automatically when a new application form is uploaded to the {{INTAKE_FOLDER}} Google Drive folder, watched through the Drive Connector. Each new file starts one run. Ignore files that are not application forms.

STEP 2 · READ APPLICATION (agent node)
Read the application form in the new file and extract: application reference, student name, student ID, programme, course code, assessment affected, request type (extension | deferred exam | leave of absence), reason category (medical | compassionate | personal | other), affected dates, days requested, the student's statement, the evidence listed or attached (type, date and issuer), and the number of earlier requests this term.

STEP 3 · EVIDENCE & POLICY CHECK (agent node)
Compare the application with the evidence rules and the policy. Output: evidence status (Complete | Missing), missing items or blank required fields, risk flags and the policy clauses that apply.

STEP 4 · ROUTING (condition node)
- IF evidence status is Missing → go to Step 5A.
- ELSE IF any of these is true → go to Step 5C: more than {{AUTO_LIMIT_DAYS}} days requested; dates overlap a final exam; the statement mentions safety, mental health or welfare concerns; this is the student's third or later request this term; no standard rule in the policy fits.
- ELSE → go to Step 5B.

STEP 5A · EVIDENCE REQUEST (agent node)
Draft a short, polite email from the "more evidence needed" template that lists exactly what is missing. Status: "Awaiting evidence".

STEP 5B · STANDARD DECISION (agent node)
Draft a decision letter from the matching template and cite the policy clause that applies. Status: "Ready for review".

STEP 5C · ESCALATION BRIEF (agent node)
Write a one-page case brief: summary, timeline, evidence list, policy clauses, recommended options with pros and cons, and the flags that triggered escalation. Then draft the letter for the recommended option. Status: "Needs staff decision". If a welfare flag is present, add: "Contact Student Wellbeing today at {{WELFARE_EMAIL}}."

Steps 5A, 5B and 5C each continue forward to Step 6.

STEP 6 · HUMAN REVIEW (approval node: Approve or Reject)
Show the reviewer the draft, the extracted application details, the Step 3 check and the name of the application file. Nothing is final until they choose.
- IF Approve → go to Step 7A.
- IF Reject → go to Step 7B.

STEP 7A · FINALIZE (agent node)
Output the approved letter or email in full, ready for staff to send to the student. Then output one log row: date, application reference, student ID, route (evidence request | standard | escalated), reviewer, outcome "Approved".

STEP 7B · CLOSE AS RETURNED (agent node)
Do not output a letter. Output one log row with outcome "Rejected, returned to staff" and a one-line note on what the staff member should check. If the student later uploads new evidence or a corrected form to the folder, that file starts a new run.

Rules: base every decision on the knowledge sources and cite the clause. Do not diagnose or judge medical evidence beyond the policy rules. Keep all student details confidential.`,
  proTip: "Test every branch before go-live: use the sample application helper to create a complete form, one with missing evidence and one with a welfare flag. Upload each to the intake folder and check where it lands."
});

const SCHOLARSHIP_COACH_EN = Object.freeze({
  title: "Scholarship Application Coach Workflow Agent",
  summary: "A forward-only Agent Designer workflow for one scholarship application. You fill in a start form, the Agent checks your eligibility and either plans your story or scores your draft, and your mentor approves or rejects the result before you act on it.",
  steps: [
    "Use the helper prompts to summarise the scholarship call and build your experience bank. In Agent Designer, attach the scholarship call and selection criteria as Knowledge Sources on the agent nodes, and add a start form with text fields for your profile, experience bank and draft statement.",
    "Build a forward-only workflow: the Agent checks eligibility, then routes you to a not-eligible note, questions for the scholarship office, a story plan (no draft yet) or a scorecard for your draft. Write the statement yourself in Canvas Mode and paste it into the form.",
    "Your mentor approves or rejects each plan or scorecard. An approved run gives you next steps or the final submission checklist; a rejected run returns the mentor's notes. Each new draft starts a new run, and you submit the application yourself."
  ],
  prompt: `You are the Scholarship Coach Agent for students at {{INSTITUTION_NAME}}, helping one student apply for {{SCHOLARSHIP_NAME}} (deadline: {{DEADLINE}}). You are a coach: the student writes and owns every word they submit. The workflow runs forward only, one run per form: never loop back to an earlier step and never pause to wait for a reply. Each new draft starts a new run.

KNOWLEDGE SOURCES (attach in the Agent Designer UI to the agent nodes)
The scholarship call, the selection criteria and any official writing guidance for {{SCHOLARSHIP_NAME}}.

STEP 1 · TRIGGER (manual trigger: start form)
The student starts a run by filling in a form with typed or pasted text only: name, programme, year of study, GPA, residency status, activities and awards (or their experience bank), financial need statement (if the scholarship asks for one), draft personal statement (leave blank for the first run) and the mentor's name.

STEP 2 · PROFILE SHEET (agent node)
Turn the form into a one-page profile sheet. List any required field that is blank.

STEP 3 · ELIGIBILITY CHECK (agent node)
Compare the profile with every hard requirement in the scholarship call (year, GPA, residency, programme, required documents). Output: eligibility (Eligible | Not eligible | Unclear), each requirement with Met, Not met or Unclear, and the clause it comes from.

STEP 4 · ROUTING (condition node)
- IF eligibility is Not eligible → go to Step 5A.
- ELSE IF eligibility is Unclear → go to Step 5B.
- ELSE IF the draft personal statement field is blank → go to Step 5C.
- ELSE → go to Step 5D.

STEP 5A · NOT ELIGIBLE NOTE (agent node)
Explain in plain words which requirement is not met and suggest up to 3 kinds of similar scholarships to look for. The run ends here.

STEP 5B · QUESTIONS FOR THE SCHOLARSHIP OFFICE (agent node)
List the exact questions the student should ask the scholarship office, and say which requirement each one settles. The run ends here. When the office replies, the student starts a new run with the answers added to the form.

STEP 5C · STORY PLAN (agent node)
Map the student's experiences to each selection criterion. Propose 2 story angles, each with a 5-part outline and 3 guiding questions, for a statement of at most {{WORD_LIMIT}} words. Do not write the statement.

STEP 5D · DRAFT SCORECARD (agent node)
Score the pasted draft 1–5 on each selection criterion, with one line of evidence per score. For every criterion below 4, give up to 3 specific revision tips. Check the word count against {{WORD_LIMIT}} and flag anything that may break the scholarship's rules on AI use. Do not rewrite the statement.

Steps 5C and 5D each continue forward to Step 6.

STEP 6 · MENTOR REVIEW (approval node: Approve or Reject)
Reviewer: the student's mentor or advisor ({{MENTOR_EMAIL}}). Show the profile sheet, the Step 3 eligibility check and the Step 5C story plan or Step 5D scorecard. Nothing goes back to the student as final until the mentor chooses.
- IF Approve → go to Step 7A.
- IF Reject → go to Step 7B.

STEP 7A · NEXT STEPS (agent node)
- IF the run came from Step 5D and every criterion scored 4 or more → output a submission checklist: documents, word count, referee details, file names and a reminder of the {{DEADLINE}} deadline. Remind the student to submit the application themselves.
- ELSE → output the approved story plan or revision tips as a short to-do list, ending with: "When your next draft is ready, start a new run with it pasted into the form."

STEP 7B · RETURNED BY MENTOR (agent node)
Do not output a checklist. Output a short note that the mentor asked for changes, with the mentor's comments if given, and remind the student to revise and start a new run.

Rules: never invent achievements or grades. Never write the whole statement for the student. Base eligibility only on the knowledge sources and cite the clause.`,
  proTip: "Run the workflow once before you write anything to get a story plan, then again with each new draft. Keep your mentor as the approver so every plan and scorecard gets a human check before you act on it."
});

const useCasesDb = [
  // HUB 1: ACADEMIC PORTAL (Lecturers & TAs)
  {
    id: "socratic_tutor",
    title: "Socratic AI Tutor Agent Creation",
    category: "academic",
    summary: "Ground a custom course Agent in your lecture notes and syllabi to act as a 24/7 Socratic learning companion.",
    features: ["Agent Designer", "Gemini Notebook"],
    connectors: [],
    role: "Lecturer",
    level: ["University & College", "High School", "Generic"],
    steps: [
      "In Gemini Notebook, add your syllabus, lecture slides and key readings as sources, then use the Set up prompt to build a verification set: 10 typical student questions with cited answers.",
      "In Agent Designer, paste the tutor prompt and add the same files under Knowledge › Add files. Keep the same file names so the citations match.",
      "Ask the Agent the 10 verification questions and compare its hints and citations with the notebook's answers. Fix any gaps, then publish the Agent link in your LMS."
    ],
    prompt: `You are the '{{COURSE_CODE}} Coach', a friendly and encouraging Socratic tutor for {{COURSE_NAME}}. Your sole objective is to guide students to find answers themselves.

KNOWLEDGE SOURCES (Agent Designer › Knowledge › Add files: the same files as your Gemini Notebook course hub)
The syllabus, lecture slides and key readings for {{COURSE_NAME}}.

GROUNDING RULES
1. Use only the Knowledge Sources. Do not use general web knowledge, even if you know the answer.
2. Before every hint, find the passage that supports it and cite it as (file name, page or slide).
3. If the answer isn't in the sources, say: "That isn't covered in the {{COURSE_NAME}} materials. Please ask {{INSTRUCTOR_NAME}}." Do not guess.
4. Never invent quotes, page numbers, formulas or facts.
5. If two sources disagree, follow the latest syllabus and tell the student about the conflict.

TUTORING RULES
1. When a student asks for an answer (e.g. 'What is the answer to question 3?'), do NOT give it. Reply with a probing question that points to the right place in the materials (e.g. 'Look at slide 4 of Lecture 2: what is the first stage called?').
2. When the student shows correct understanding, praise them and give a complete explanation with citations.
3. If asked about topics outside this course, politely decline: 'I can only help with {{COURSE_NAME}} topics.'`,
    proTip: "Agent Designer can't read a Gemini Notebook directly, so the Agent answers only from the files you add under Knowledge. Use the notebook as your answer key: if the Agent's citation doesn't match the notebook's, fix the files or the prompt before students use it.",
    connectorGuide: null
  },
  {
    id: "rubric_grading",
    title: "Rubric-Aligned Essay Feedback Assistant",
    category: "academic",
    summary: "Analyze student essays against a complex grading rubric in Gemini Notebook and generate formative constructive feedback.",
    features: ["Gemini Notebook", "Canvas Mode"],
    connectors: [],
    role: "TA",
    level: ["Generic"],
    steps: [
      "Create a notebook for the assignment and add the assignment instructions and the grading rubric as sources.",
      "Add one student essay as a source and run the feedback prompt in Gemini Notebook. Every score must quote the essay and name the rubric criterion.",
      "Check each score against the quoted evidence, then paste the feedback into Canvas Mode to personalise it before sending it through your LMS."
    ],
    prompt: `Acting as an expert academic teaching assistant, analyse the student essay in this notebook for the assignment "{{ASSIGNMENT_TITLE}}" against the grading rubric, for student "{{STUDENT_ID}}". Write a first draft of constructive, high-quality feedback.

Sources in this notebook: the assignment instructions, the grading rubric and this student's essay.

The feedback MUST follow this structure:
1. **Rubric Performance Summary**: a tentative level for each rubric criterion, quoting evidence from the essay.
2. **Key Strengths (1-2)**: what was done exceptionally well, quoting 1-2 examples from the text.
3. **Areas for Growth (2-3)**: specific logical, grammatical or structural issues, and how they relate to the rubric.
4. **Actionable Recommendations**: 2-3 specific, progressive steps for the next draft.

Rules: use only the rubric and the essay. If there is no evidence for a criterion, say so and mark it "Not enough evidence" instead of guessing. Never invent rubric levels or quotes.
Keep a supportive, encouraging teaching tone throughout.`,
    proTip: "Add one essay at a time and remove it before adding the next, so feedback never mixes students. Gemini Notebook keeps student work inside your institution's Gemini Enterprise environment and doesn't use it to train models.",
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
    features: [
      "Gemini Notebook",
      "Deep Research"
    ],
    connectors: [],
    role: "Student",
    level: ["University & College", "High School", "Generic"],
    steps: [
      "Add the anonymised survey comments and town hall transcripts from your Drive folder to a Gemini Notebook as sources. Use the Set up prompt to run Deep Research on peer-school solutions, and add that report too.",
      "Run the analysis prompt in Gemini Notebook. Every theme count and quote comes from the sources, and peer-school ideas come from the Deep Research report.",
      "Check the quotes against the original comments, remove anything that could identify a student, then present the priority list to the administration."
    ],
    prompt: `Acting as the Student Union Advocacy Director for {{INSTITUTION_NAME}}, analyse the town hall transcripts and anonymous student survey comments for {{ACADEMIC_TERM}} in this notebook.

Sources in this notebook: the survey comments, the town hall transcripts and a Deep Research report on how peer institutions handled similar issues.

Produce an evidence-based report:
1. **Thematic Clustering**: the top 5 campus issues, with the number of comments for each.
2. **Sentiment Assessment**: for each issue, the tone (highly negative, frustrated, neutral) and 3 representative quotes copied word for word, with their source.
3. **Peer Solutions**: 2 realistic, low-cost policy changes per issue, taken from the Deep Research report and cited. If the report has nothing on an issue, say so.
4. **Negotiation Preparation**: 5 objections the deans may raise about budget, each with a rebuttal backed by the counts and quotes above.

Rules: never paraphrase inside quotation marks, never invent numbers, and remove names, student IDs or any detail that could identify a student.`,
    proTip: "Gemini Notebook adds Google Docs, Slides and PDFs from Drive directly as sources, so you don't need a connector. Sync the sources again after each new survey round.",
    connectorGuide: null
  },
  {
    id: "club_funding",
    title: "Annual Club Calendar & Budget Justifier",
    category: "student",
    summary: "Brainstorm an annual activities calendar and draft detailed, compliant student government funding proposals.",
    features: [
      "Gemini Notebook",
      "Canvas Mode"
    ],
    connectors: [],
    role: "Student",
    level: ["University & College", "High School", "Generic"],
    steps: [
      "Add the Student Union funding guidelines and bylaws to Gemini Notebook, then use the Set up prompt to pull out a funding rules checklist with the clause for each rule.",
      "In Canvas Mode, run the proposal prompt with the rules checklist and your planned events filled in.",
      "Check every budget line against the checklist and its clause, attach your receipts or quotes, then submit to the funding committee."
    ],
    prompt: `Act as a professional grant and proposal writer. Help {{CLUB_NAME}} draft a funding proposal for the academic year {{ACADEMIC_YEAR}}.

Inputs:
- Planned activities: {{EVENT_PLAN}}
- Funding rules checklist (from Gemini Notebook, with clause numbers): {{FUNDING_RULES}}

Task:
1. **Executive Summary**: the club's mission and how these events boost student engagement.
2. **Line-Item Budget Table**: columns Item | Event | Cost | Rule applied (clause) | Within limit? Calculate the totals. Use only the limits in the funding rules checklist; never invent a limit.
3. **Compliance Notes**: list any item that breaks the checklist or isn't covered by it, and suggest a fix.
4. **Impact Statement**: why the Student Union should fund the club, with the expected student outcomes.
Use Canvas to create this as an editable document.`,
    proTip: "Ask Gemini Notebook for the clause number with every rule. When the committee queries a budget line, you can point straight to the bylaw that allows it.",
    connectorGuide: null
  },
  {
    id: "su_helpdesk",
    title: "24/7 Student Union Policy Agent",
    category: "student",
    summary: "Build a student-facing policy Agent grounded in your union handbook and constitutions to answer venue booking, locker and funding questions.",
    features: ["Agent Designer", "Gemini Notebook"],
    connectors: [],
    role: "Student",
    level: ["University & College", "High School", "Generic"],
    steps: [
      "Add the student handbook, welfare guidelines and club constitutions to Gemini Notebook as sources, then use the Set up prompt to build a verification set of 10 member questions with cited answers.",
      "In Agent Designer, paste the policy Agent prompt and add the same files under Knowledge › Add files. Fill in the officer's email for sensitive cases.",
      "Ask the Agent the 10 verification questions plus 2 sensitive ones. Check that answers and citations match the notebook and that sensitive questions go to the officer, then share the Agent link with members."
    ],
    prompt: `You are the 24/7 Policy and Welfare Agent for {{STUDENT_UNION_NAME}} at {{INSTITUTION_NAME}}. You give quick, accurate answers to student questions about union bylaws, venue booking, lockers and society funding.

KNOWLEDGE SOURCES (Agent Designer › Knowledge › Add files: the same files as your Gemini Notebook policy hub)
The student handbook, welfare guidelines and club constitutions of {{STUDENT_UNION_NAME}}.

GROUNDING RULES
1. Answer only from the Knowledge Sources and cite each answer as (document name, section or page).
2. If the sources don't cover a question, say so and give {{OFFICER_EMAIL}} as the contact. Never guess a rule, fee, deadline or form name.
3. If two documents disagree, quote both, say which is newer and suggest checking with the union office.

ANSWER RULES
1. Use a friendly, supportive student-peer tone.
2. For any procedure (e.g. booking a room, applying for event funding), give numbered steps and name the form or deadline from the sources.
3. If a question involves a confidential welfare dispute, a mental health concern or a disciplinary case, do NOT answer it. Reply kindly that a union officer will help in confidence and give {{OFFICER_EMAIL}}. If someone may be in danger, also tell them to contact campus security or emergency services now.`,
    proTip: "Re-upload the Knowledge files whenever the constitution or handbook is amended, then re-run your verification set. The Agent only knows the version you uploaded.",
    connectorGuide: null
  },
  {
    id: "visual_campaign",
    title: "Interactive Story Game & Visual Campaign",
    category: "student",
    summary: "Create interactive visual storytelling campaigns, orientation games, and high-impact social media assets with AI media models.",
    features: [
      "Canvas Mode",
      "Image Generation",
      "Video Generation"
    ],
    connectors: [],
    role: "Student",
    level: ["Generic"],
    steps: [
      "Draft the event narrative arc, key character personas and campus orientation milestones in Canvas Mode.",
      "Generate high-resolution thematic illustrations with Image Generation and narrative clips with Video Generation.",
      "Curate campaign assets into digital social feeds and interactive onboarding screens for freshers."
    ],
    prompt: `You are a creative campaign director for {{INSTITUTION_NAME}}. Design an interactive campus storytelling campaign and multimedia visual plan for {{EVENT_NAME}} targeting {{TARGET_AUDIENCE}}.
Requirements:
1. **Interactive Storyline**: Outline a 4-chapter narrative mystery where freshers explore historical campus buildings, discover student traditions, and solve clues.
2. **Visual Generation Prompts**: Provide 3 rich, descriptive text-to-image prompts (specifying artistic lighting, vibrant student characters, and cinematic composition) suitable for Gemini Image Generation.
3. **Motion Scene Prompts**: Draft 2 prompt scripts suitable for Video Generation to create 5-second teaser animations for social media stories.
Use Canvas to create this as an editable document.`,
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
      "Run the prompt in Deep Research with the LMS Connector selected as a source, so the analysis uses your gradebook and activity logs.",
      "Review identified cohorts with academic advisors and dispatch personalized supportive outreach."
    ],
    prompt: `Data source: the {{DEPARTMENT_NAME}} gradebook and activity logs for {{COHORT_SEMESTER}}, read through the LMS Connector. Use only this data for student information and never search the web for students.
Analyze student learning analytics data for {{COHORT_SEMESTER}} in the {{DEPARTMENT_NAME}} department to identify learners at risk of falling behind.
Criteria to examine:
- LMS login inactivity exceeding 10 consecutive days.
- Missed or late formative assessment submissions (threshold: 2 or more).
- Midterm scores below 60%.
Output Requirements:
1. **At-Risk Cohort Segmentation**: Group students into High Risk, Moderate Risk, and Low Risk categories with evidence flags.
2. **Intervention Recommendations**: For each risk tier, suggest actionable pedagogical interventions (e.g., peer tutoring referral, advisor check-in, supplemental review modules).
3. **Draft Outreach Email**: Generate an empathetic, non-judgmental advisor check-in email encouraging the student to schedule office hours.
Rules:
- Identify students by LMS ID only, and list the exact data points behind every flag (e.g. "last login 14 days ago; 2 late submissions; midterm 52%").
- If a data field is missing for a student, mark it "No data" and don't count it as a risk.
- This list is a starting point, not a decision: an advisor reviews every flag before any outreach is sent.`,
    proTip: "Ask for the data behind every flag. Advisors trust a list they can check, and it catches students who log in often but are falling behind on grades.",
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
    features: [
      "Gemini Notebook",
      "Deep Research"
    ],
    connectors: [],
    role: "Program Leader",
    level: ["University & College"],
    steps: [
      "Run Deep Research on the accreditation body's current standards and recent changes. Add that report, the official standards document, syllabi, outcome assessments and committee minutes to a Gemini Notebook as sources.",
      "Run the synthesis prompt in Gemini Notebook to map the evidence to each criterion, list the gaps and draft the narrative with a citation for every claim.",
      "Click through the citations to check each claim against the original document, fill the evidence gaps, then export the self-study report."
    ],
    prompt: `Act as a higher education quality assurance director. Synthesise the evidence for {{PROGRAM_NAME}} against the accreditation standards of {{ACCREDITATION_BODY}}.

Sources in this notebook: the official {{ACCREDITATION_BODY}} standards, a Deep Research brief on recent changes to them, course syllabi, student learning outcome evaluations, faculty records and committee minutes.

Tasks:
1. **Cross-Mapping**: map the evidence to Criterion 1 (Curriculum Rigor) and Criterion 2 (Faculty Qualifications) as a table: Standard | Evidence | Source (document, page) | Strength (Strong, Partial, None).
2. **Gap Analysis**: list missing assessment data, outdated course references and under-documented learning evidence. Mark each one "Evidence gap" and name the document that would close it.
3. **Executive Synthesis**: draft a 500-word formal narrative on continuous improvement over the review cycle.

Rules: cite a source for every factual claim. If the official standards and the Deep Research brief differ, follow the official standards. Never invent figures, dates or meeting outcomes.`,
    proTip: "Gemini Notebook links every claim to its source, so reviewers can click a statement and see the original syllabus or minutes. Keep the official standards document in the notebook so the mapping never relies on a summary alone.",
    connectorGuide: null
  },
  {
    id: "workforce_federation",
    title: "Workforce Identity Federation Setup Guide",
    category: "operational",
    summary: "Deploy secure SAML 2.0 / OIDC identity federation linking your campus IdP to Gemini Enterprise without duplicating directories.",
    features: ["Deep Research"],
    connectors: [],
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
    connectorGuide: null
  },

  // HUB 4: ADMINISTRATIVE & STUDENT AFFAIRS (SAO, Finance & Security)
  {
    id: "sao_scavenger_hunt",
    title: "Digital Cultural Fair Red Packet Game",
    category: "administrative",
    summary: "Build an interactive campus cultural scavenger hunt with AI-generated trivia, QR clues, and digital red packet rewards.",
    features: [
      "Canvas Mode",
      "Image Generation"
    ],
    connectors: [],
    role: "SAO",
    level: ["Generic"],
    steps: [
      "Plan interactive campus discovery checkpoints, cultural trivia themes, and physical QR stations.",
      "Generate bilingual riddle clues and quiz cards in Canvas Mode, and digital red packet artwork with Image Generation.",
      "Pilot test the hunt route for student safety and launch the live interactive orientation activity."
    ],
    prompt: `You are the Student Affairs Orientation Director for {{CAMPUS_NAME}}. Design an engaging, digital-physical Cultural Fair Scavenger Hunt celebrating {{FESTIVAL_NAME}}.
Include:
1. **Station Clues**: 5 clever rhyming clues that lead students to iconic campus landmarks (library, student center, amphitheater, botanical garden, sports complex).
2. **Interactive Red Packet QR Challenges**: For each station, design a quick 2-question cultural trivia mini-quiz that unlocks a digital red packet stamp.
3. **Reward Tier Structure**: Outline completion badge rewards and clear redemption instructions to manage crowd flow safely.
Use Canvas to create this as an editable document.`,
    proTip: "Use Image Generation to design digital commemorative red packet graphics and badges that students can collect in their digital portfolios upon station check-in.",
    connectorGuide: null
  },
  {
    id: "finance_compliance",
    title: "Student Expense Compliance Auditor",
    category: "administrative",
    summary: "Audit student club reimbursement receipts, invoices, and subsidy claims automatically against university financial regulations.",
    features: [
      "Gemini Notebook"
    ],
    connectors: [],
    role: "Finance",
    level: ["University & College", "High School"],
    steps: [
      "Create one notebook per claim. Add the university's student organisation financial regulations, then the claim form, receipts and quotations as PDFs.",
      "Run the audit prompt in Gemini Notebook. It checks each receipt line against the regulations and cites the clause for every deduction.",
      "Open each cited clause and receipt to confirm the flags, then send the audit ledger to the society and issue the approved voucher."
    ],
    prompt: `You are the Student Affairs Finance Auditor. Audit the reimbursement claim from {{SOCIETY_NAME}} for the event "{{EVENT_NAME}}", totalling {{CLAIM_AMOUNT}}.

Sources in this notebook: the student organisation financial regulations, plus the claim form, receipts and quotations for this claim.

Audit requirements:
1. **Line-Item Verification**: check each receipt line against the regulations. Cite the clause (document, section) for every rule you apply.
2. **Policy Compliance Check**: flag alcohol, unitemised card slips, tips above the allowed limit, missing quotations above the quotation threshold and any receipt that doesn't match the claim form. Take every limit from the regulations, not from memory.
3. **Missing Evidence**: if a receipt is unreadable or missing, mark the line "Evidence needed" instead of guessing the amount.
4. **Audit Ledger**: a table with Item | Receipt | Claimed | Allowed | Disallowed | Reason and clause, then the totals and a courteous note explaining any deductions and how to appeal.`,
    proTip: "Keep one notebook per claim so receipts from different societies never mix, and use the same regulations file in every notebook so each audit cites the same clauses.",
    connectorGuide: null
  },
  {
    id: "security_simulator",
    title: "Campus Safety Drill Simulator",
    category: "administrative",
    summary: "Simulate emergency response scenarios and evaluate campus security decision trees during emergency drill operations.",
    features: ["Agent Designer", "Video Generation"],
    connectors: [],
    role: "Security",
    level: ["Generic"],
    steps: [
      "In Agent Designer, add the emergency protocol handbook, floor plans and evacuation routes under Knowledge › Add files, then paste the drill prompt.",
      "Run a drill with the security team. The Agent presents each phase, checks every decision against the protocol and cites the section.",
      "Use Video Generation for short clips that open each phase, then review the debrief scores and update the handbook where the drill exposed gaps."
    ],
    prompt: `You are the Director of Campus Safety. Run an interactive emergency drill for {{EMERGENCY_SCENARIO}} at {{FACILITY_LOCATION}}.

KNOWLEDGE SOURCES (Agent Designer › Knowledge › Add files)
The campus emergency protocol handbook, floor plans and evacuation routes.

GROUNDING RULES
1. Base every "correct" action on the protocol handbook and cite it as (section, page). Use the floor plans for routes, exits and assembly points.
2. If the handbook doesn't cover a situation, say "Not covered by protocol: flag for review" instead of making up a procedure.
3. This is a training drill. Never present it as a real emergency.

Simulation structure:
1. **Incident Genesis (Minute 0)**: the first emergency call. Offer 3 first-response decisions and wait for the team's choice.
2. **Escalation Phase (Minute 15)**: the situation changes (e.g. a blocked route or crowd panic). Offer tactical options and explain the consequence of the team's choice, citing the protocol.
3. **Containment & Evacuation (Minute 30)**: responder coordination, a safe perimeter and parent/press communication.
4. **Debrief Rubric**: score decision speed, communication clarity, protocol adherence and care for casualties, and list each decision that departed from the protocol with the section it should have followed.`,
    proTip: "Open each phase with a 5-second Video Generation clip (e.g. smoke in a stairwell) to raise the pressure, but keep the protocol handbook as the only source for the right action.",
    connectorGuide: null
  },

  // HUB 5: AGENT DESIGNER WORKFLOWS (multi-step, conditional routing, human review; special consideration uses the Drive Connector trigger)
  {
    id: "special_consideration_workflow",
    ...SPECIAL_CONSIDERATION_EN,
    steps: [...SPECIAL_CONSIDERATION_EN.steps],
    category: "administrative",
    features: ["Agent Designer"],
    connectors: ["Drive Connector"],
    role: "SAO",
    level: ["University & College", "High School", "Generic"],
    connectorGuide: {
      name: "Drive Connector",
      steps: [
        "Ask your Gemini Enterprise admin to turn on the Drive Connector for your institution's Google Drive.",
        "Create a shared intake folder in Google Drive for student application forms, and share it only with the staff who run this workflow.",
        "In Agent Designer, set the workflow trigger to 'new file in folder' and pick the intake folder through the Drive Connector.",
        "Upload the sample application forms to the folder and check that each one starts a run and lands on the right branch."
      ]
    }
  },
  {
    id: "scholarship_application_workflow",
    ...SCHOLARSHIP_COACH_EN,
    steps: [...SCHOLARSHIP_COACH_EN.steps],
    category: "student",
    features: ["Agent Designer", "Canvas Mode"],
    connectors: [],
    role: "Student",
    level: ["University & College", "High School", "Generic"],
    connectorGuide: null
  }
];

// PREREQUISITE HELPER PROMPTS DATABASE
const useCaseHelperPrompts = {
  socratic_tutor: {
    en: [
      {
        type: "canvas",
        title: "Prompt to Generate Course Syllabus & Module Outline",
        prompt: `Act as an expert university professor. Generate a comprehensive course syllabus and 14-week module outline for the course '{{COURSE_NAME}}' (Code: {{COURSE_CODE}}). Include course description, 4 core learning objectives mapped to Bloom's taxonomy, weekly lecture topics, required reading titles, and grading breakdown. Use Canvas to create this as an editable document.`
      },
      {
        type: "canvas",
        title: "Prompt to Generate Lecture Reading Summary & Key Concepts",
        prompt: `Synthesize the core foundational concepts and terminology for Lecture Week 1-3 of '{{COURSE_NAME}}'. Provide a 500-word executive summary, 10 must-know technical terms with student-friendly definitions, and 5 common student misconceptions with corrections. Use Canvas to create this as an editable document.`
      },
      {
        type: "notebooklm",
        title: "Prompt to Build a Verification Set in Gemini Notebook",
        prompt: `Using only the sources in this notebook, write 10 questions that students in {{COURSE_NAME}} ({{COURSE_CODE}}) are likely to ask: 4 about key concepts, 3 about assessment and deadlines, 2 that need several sources together, and 1 that the sources don't cover. For each question, give the correct answer in 2–3 sentences and cite the file name and page or slide. For the uncovered question, write "Not in the course materials". Present the result as a table: Question | Expected answer | Source (file, page or slide).`
      }
    ],
    "zh-TW": [
      {
        type: "canvas",
        title: "生成課程教學大綱與每週單元大綱提示詞",
        prompt: `請扮演資深大學教授。為課程「{{COURSE_NAME}}」（課程代碼：{{COURSE_CODE}}）撰寫一份完整的教學大綱與 14 週單元規劃。包含課程簡介、對應 Bloom 分類法的 4 項核心學習目標、每週講義主題、必讀文獻清單及評分比重。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "canvas",
        title: "生成前三週講義摘要與核心概念提示詞",
        prompt: `統整「{{COURSE_NAME}}」第 1 至 3 週講義的核心概念與專有名詞。提供 500 字精要摘要、10 個關鍵術語之白話解說，以及 5 個學生常見概念誤區與正確觀念導正。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "notebooklm",
        title: "在 Gemini Notebook 建立驗證題組提示詞",
        prompt: `只根據此 Notebook 的來源，為 {{COURSE_NAME}}（{{COURSE_CODE}}）寫出 10 條學生最可能問的問題：4 條關於核心概念、3 條關於評核及限期、2 條需要綜合多份來源，以及 1 條來源未有涵蓋的問題。每條問題以 2 至 3 句寫出正確答案，並註明檔案名稱及頁數或投影片編號。來源未有涵蓋的問題，答案寫「教材未有涵蓋」。以表格呈現：問題｜預期答案｜出處（檔案、頁數或投影片）。`
      }
    ],
    "zh-CN": [
      {
        type: "canvas",
        title: "生成课程教学大纲与每周单元大纲提示词",
        prompt: `请扮演资深大学教授。为课程“{{COURSE_NAME}}”（课程代码：{{COURSE_CODE}}）撰写一份完整的教学大纲与 14 周单元规划。包含课程简介、对应 Bloom 分类法的 4 项核心学习目标、每周讲义主题、必读文献清单及评分比重。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "canvas",
        title: "生成前三周讲义摘要与核心概念提示词",
        prompt: `统整“{{COURSE_NAME}}”第 1 至 3 周讲义的核心概念与专有名词。提供 500 字精要摘要、10 个关键术语之白话解说，以及 5 个学生常见概念误区与正确观念导正。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "notebooklm",
        title: "在 Gemini Notebook 建立验证题组提示词",
        prompt: `只根据此 Notebook 的来源，为 {{COURSE_NAME}}（{{COURSE_CODE}}）写出 10 条学生最可能问的问题：4 条关于核心概念、3 条关于考核及截止日期、2 条需要综合多份来源，以及 1 条来源未有涵盖的问题。每条问题以 2 至 3 句写出正确答案，并注明文件名及页数或幻灯片编号。来源未有涵盖的问题，答案写「教材未有涵盖」。以表格呈现：问题｜预期答案｜出处（文件、页数或幻灯片）。`
      }
    ]
  },
  rubric_grading: {
    en: [
      {
        type: "canvas",
        title: "Prompt to Generate Assignment Instructions & Guidelines",
        prompt: `Act as an academic instructor. Draft a detailed assignment instruction guide for undergraduate students titled '{{ASSIGNMENT_TITLE}}'. Include the task overview, word count requirements, required citation format, 3 specific guiding questions to address, and submission instructions. Use Canvas to create this as an editable document.`
      },
      {
        type: "canvas",
        title: "Prompt to Generate Detailed Analytical Grading Rubric",
        prompt: `Create a rigorous, 4-tier analytical grading rubric for the assignment '{{ASSIGNMENT_TITLE}}'. Structure the rubric into 4 criteria: (1) Argument & Critical Analysis (35%), (2) Evidence & Source Grounding (30%), (3) Structure & Coherence (20%), (4) Academic Writing & Mechanics (15%). For each criterion, describe clear observable indicators across 4 performance levels: Exemplary, Proficient, Developing, and Unsatisfactory. Use Canvas to create this as an editable document.`
      }
    ],
    "zh-TW": [
      {
        type: "canvas",
        title: "生成作業指示與撰寫規範提示詞",
        prompt: `請扮演大學課程講師。為名為「{{ASSIGNMENT_TITLE}}」的學期作業撰寫詳細指引。包含作業宗旨說明、字數規範、學術引用格式要求、3 個必須深入探討的核心引導問題，以及繳交截止規範。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "canvas",
        title: "生成詳細分析型評分規準 (Rubric) 提示詞",
        prompt: `為作業「{{ASSIGNMENT_TITLE}}」設計一份嚴謹的四級分析型評分規準 (Rubric)。劃分 4 項指標：(1) 論點深度與批判思維 (35%)、(2) 文獻證據與論證嚴謹度 (30%)、(3) 架構組織與邏輯連貫 (20%)、(4) 學術寫作規範與流暢度 (15%)。每項指標均需具體列出：優異 (Exemplary)、熟練 (Proficient)、發展中 (Developing)、待加強 (Unsatisfactory) 的具體表現描述。請使用 Canvas 將此內容建立為可編輯文件。`
      }
    ],
    "zh-CN": [
      {
        type: "canvas",
        title: "生成作业指引与撰写规范提示词",
        prompt: `请扮演大学课程讲师。为名为“{{ASSIGNMENT_TITLE}}”的学期作业撰写详细指引。包含作业宗旨说明、字数规范、学术引用格式要求、3 个必须深入探讨的核心引导问题，以及提交截止规范。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "canvas",
        title: "生成详细分析型评分规准 (Rubric) 提示词",
        prompt: `为作业“{{ASSIGNMENT_TITLE}}”设计一份严谨的四级分析型评分规准 (Rubric)。划分 4 项指标：(1) 论点深度与批判思维 (35%)、(2) 文献证据与论证严谨度 (30%)、(3) 架构组织与逻辑连贯 (20%)、(4) 学术写作规范与流畅度 (15%)。每项指标均需具体列出：优异 (Exemplary)、熟练 (Proficient)、发展中 (Developing)、待加强 (Unsatisfactory) 的具体表现描述。请使用 Canvas 将此内容创建为可编辑文档。`
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
        type: "canvas",
        title: "Prompt to Generate Bloom's Taxonomy Course Learning Outcomes",
        prompt: `Design 5 measurable, assessment-aligned Course Learning Outcomes (CLOs) for '{{COURSE_TITLE}}' adhering strictly to Bloom's Revised Taxonomy (spanning Apply, Analyze, Evaluate, and Create levels). Use Canvas to create this as an editable document.`
      }
    ],
    "zh-TW": [
      {
        type: "deep_research",
        title: "生成產業技能趨勢與市場需求基準提示詞",
        prompt: `針對「{{TARGET_INDUSTRY}}」領域，為新課程「{{COURSE_TITLE}}」進行職場技能基準分析。列出過去一年就業市場需求最高的 5 項核心技術能力與 3 項跨領域軟實力，並註明主流產業工具與認證。`
      },
      {
        type: "canvas",
        title: "生成對應 Bloom 分類法的課程學習成效 (CLOs) 提示詞",
        prompt: `嚴格遵循 Bloom 修訂版認知歷程分類法（涵蓋應用、分析、評鑑、創造層級），為「{{COURSE_TITLE}}」設計 5 項具體可評量的課程學習成效 (CLOs)。請使用 Canvas 將此內容建立為可編輯文件。`
      }
    ],
    "zh-CN": [
      {
        type: "deep_research",
        title: "生成产业技能趋势与市场需求基准提示词",
        prompt: `针对“{{TARGET_INDUSTRY}}”领域，为新课程“{{COURSE_TITLE}}”进行职场技能基准分析。列出过去一年就业市场需求最高的 5 项核心技术能力与 3 项跨领域软实力，并注明主流产业工具与认证。`
      },
      {
        type: "canvas",
        title: "生成对应 Bloom 分类法的课程学习成效 (CLOs) 提示词",
        prompt: `严格遵循 Bloom 修订版认知历程分类法（涵盖应用、分析、评鉴、创造层级），为“{{COURSE_TITLE}}”设计 5 项具体可评估的课程学习成效 (CLOs)。请使用 Canvas 将此内容创建为可编辑文档。`
      }
    ]
  },
  lab_manual_creator: {
    en: [
      {
        type: "canvas",
        title: "Prompt to Generate Laboratory Experiment Concept & Reagents List",
        prompt: `Act as a STEM laboratory coordinator for '{{COURSE_NAME}}'. Create a complete experiment concept sheet for '{{EXPERIMENT_NAME}}'. Include theoretical background, required chemical reagents, glass equipment list, and preparatory setup steps. Use Canvas to create this as an editable document.`
      },
      {
        type: "canvas",
        title: "Prompt to Generate Safety Hazards & Protocol Guideline",
        prompt: `Draft an institutional chemical and physical safety protocol for the experiment '{{EXPERIMENT_NAME}}'. Specify GHS hazard pictograms, mandatory PPE, waste disposal procedures, and emergency spill response steps. Use Canvas to create this as an editable document.`
      }
    ],
    "zh-TW": [
      {
        type: "canvas",
        title: "生成實驗原理與試劑設備清單提示詞",
        prompt: `請扮演「{{COURSE_NAME}}」實驗室負責人。為實驗「{{EXPERIMENT_NAME}}」撰寫實驗原理與準備手冊。列出理論背景、化學試劑清單、玻璃儀器規格及課前準備步驟。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "canvas",
        title: "生成實驗室安全守則與廢棄物處置規範提示詞",
        prompt: `為實驗「{{EXPERIMENT_NAME}}」制定實驗室安全規範。明確標註 GHS 危害圖示、必備個人防護裝備 (PPE)、廢液分類處理流程與化學品潑濺應急程序。請使用 Canvas 將此內容建立為可編輯文件。`
      }
    ],
    "zh-CN": [
      {
        type: "canvas",
        title: "生成实验原理与试剂设备清单提示词",
        prompt: `请扮演“{{COURSE_NAME}}”实验室负责人。为实验“{{EXPERIMENT_NAME}}”撰写实验原理与准备手册。列出理论背景、化学试剂清单、玻璃仪器规格及课前准备步骤。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "canvas",
        title: "生成实验室安全守则与废弃物处置规范提示词",
        prompt: `为实验“{{EXPERIMENT_NAME}}”制定实验室安全规范。明确标注 GHS 危害图示、必备个人防护装备 (PPE)、废液分类处理流程与化学品泼溅应急程序。请使用 Canvas 将此内容创建为可编辑文档。`
      }
    ]
  },
  su_advocacy: {
    en: [
      {
        type: "canvas",
        title: "Prompt to Generate Student Town Hall Feedback Survey Form",
        prompt: `Draft a 10-question anonymous student campus experience survey for {{INSTITUTION_NAME}} covering {{ACADEMIC_TERM}}. Include questions on library hours, dining affordability, mental health support, and classroom facilities with Likert scales and open-ended feedback prompts. Use Canvas to create this as an editable document.`
      },
      {
        type: "canvas",
        title: "Prompt to Generate Qualitative Feedback Transcription Template",
        prompt: `Structure a standardized student feedback transcription template to organize raw town hall notes and survey responses into thematic categories: Academic, Student Welfare, Facilities, and Financial Aid. Use Canvas to create this as an editable document.`
      },
      {
        type: "deep_research",
        title: "Prompt to Research Peer-School Solutions with Deep Research",
        prompt: `Research how universities and colleges similar to {{INSTITUTION_NAME}} have handled these student concerns in the last 3 years: {{TOP_ISSUES}}. For each concern, find 2–3 low-cost policy changes, and say where they were tried, what they cost and what changed. Cite every source.`
      }
    ],
    "zh-TW": [
      {
        type: "canvas",
        title: "生成學生諮詢會回饋問卷範本提示詞",
        prompt: `為 {{INSTITUTION_NAME}} 設計一份「{{ACADEMIC_TERM}} 學生校園生活體驗與權益問卷」（共 10 題）。涵蓋圖書館自修時數、校園餐飲平價化、身心輔導資源及教室設備，結合李克特量表與開放式建議。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "canvas",
        title: "生成質化民意彙整與歸類樣板提示詞",
        prompt: `設計結構化的學生民意資料整理範本，將諮詢會筆記與匿名回饋分類至四大領域：學術教學、學生福利、校園設施及獎助學金。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "deep_research",
        title: "以 Deep Research 搜尋同類院校方案提示詞",
        prompt: `研究與 {{INSTITUTION_NAME}} 相近的大學及大專院校在過去 3 年如何處理以下學生關注事項：{{TOP_ISSUES}}。每項關注事項找出 2 至 3 個低成本的政策改變，說明在哪裏推行、成本多少、帶來甚麼改變，並註明每項出處。`
      }
    ],
    "zh-CN": [
      {
        type: "canvas",
        title: "生成学生咨询会反馈问卷范本提示词",
        prompt: `为 {{INSTITUTION_NAME}} 设计一份“{{ACADEMIC_TERM}} 学生校园生活体验与权益问卷”（共 10 题）。涵盖图书馆自修时数、校园餐饮平价化、身心辅导资源及教室设备，结合李克特量表与开放式建议。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "canvas",
        title: "生成质化民意汇整与归类样板提示词",
        prompt: `设计结构化的学生民意数据整理范本，将咨询会笔记与匿名反馈分类至四大领域：学术教学、学生福利、校园设施及奖助学金。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "deep_research",
        title: "以 Deep Research 搜寻同类院校方案提示词",
        prompt: `研究与 {{INSTITUTION_NAME}} 相近的大学及高校在过去 3 年如何处理以下学生关注事项：{{TOP_ISSUES}}。每项关注事项找出 2 至 3 个低成本的政策改变，说明在哪里推行、成本多少、带来什么改变，并注明每项出处。`
      }
    ]
  },
  club_funding: {
    en: [
      {
        type: "canvas",
        title: "Prompt to Generate Student Club Event Proposal Template",
        prompt: `Act as a Student Union treasurer. Draft a comprehensive event funding proposal for '{{CLUB_NAME}}' covering the academic year {{ACADEMIC_YEAR}}. Include event purpose, target student participation count, timeline, and measurable campus impact. Use Canvas to create this as an editable document.`
      },
      {
        type: "canvas",
        title: "Prompt to Generate Union Subsidy Line-Item Budget Sheet",
        prompt: `Create a compliant line-item budget table for '{{CLUB_NAME}}' detailing speaker honorariums, equipment rental, venue booking, and promotional printing adhering to Student Union grant maximums. Use Canvas to create this as an editable document.`
      },
      {
        type: "notebooklm",
        title: "Prompt to Pull a Funding Rules Checklist in Gemini Notebook",
        prompt: `Using only the funding guidelines and bylaws in this notebook, list every rule that affects a club funding proposal for {{CLUB_NAME}} in {{ACADEMIC_YEAR}}: spending limits per event type, items that can't be funded, food and drink limits, quotation rules, deadlines and required documents. Present a table: Rule | Limit or requirement | Clause (document, section). Mark anything the sources leave unclear as "Check with the union office".`
      }
    ],
    "zh-TW": [
      {
        type: "canvas",
        title: "生成學生社團活動企劃書範本提示詞",
        prompt: `請扮演學生會財務顧問。為社團「{{CLUB_NAME}}」撰寫 {{ACADEMIC_YEAR}} 學年度活動補助申請企劃。包含活動宗旨、預估參與人數、籌備進度表及對校園凝聚力之實質效益。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "canvas",
        title: "生成社團預算明細與核銷檢核表提示詞",
        prompt: `為「{{CLUB_NAME}}」編製符合學生會補助規章之逐項預算明細表，詳列講師鐘點費、器材租賃、場地清潔及文宣印製費用，並註記報銷憑證規範。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "notebooklm",
        title: "在 Gemini Notebook 整理資助規則清單提示詞",
        prompt: `只根據此 Notebook 中的資助指引及會章，列出所有影響 {{CLUB_NAME}} {{ACADEMIC_YEAR}} 學年資助企劃書的規則：各類活動的開支上限、不獲資助的項目、餐飲限制、報價要求、限期及所需文件。以表格呈現：規則｜上限或要求｜條文（文件、章節）。來源未有清楚說明的，標示為「請向學生會辦事處查詢」。`
      }
    ],
    "zh-CN": [
      {
        type: "canvas",
        title: "生成学生社团活动企划书范本提示词",
        prompt: `请扮演学生会财务顾问。为社团“{{CLUB_NAME}}”撰写 {{ACADEMIC_YEAR}} 学年度活动补助申请企划。包含活动宗旨、预估参与人数、筹备进度表及对校园凝聚力之实质效益。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "canvas",
        title: "生成社团预算明细与核销检核表提示词",
        prompt: `为“{{CLUB_NAME}}”编制符合学生会补助规章之逐项预算明细表，详列讲师钟点费、器材租赁、场地清洁及文宣印制费用，并注记报销凭证规范。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "notebooklm",
        title: "在 Gemini Notebook 整理资助规则清单提示词",
        prompt: `只根据此 Notebook 中的资助指引及章程，列出所有影响 {{CLUB_NAME}} {{ACADEMIC_YEAR}} 学年资助企划书的规则：各类活动的开支上限、不获资助的项目、餐饮限制、报价要求、截止日期及所需文件。以表格呈现：规则｜上限或要求｜条文（文件、章节）。来源未有清楚说明的，标示为「请向学生会办事处查询」。`
      }
    ]
  },
  su_helpdesk: {
    en: [
      {
        type: "canvas",
        title: "Prompt to Generate Student Union Constitution & Venue Policy Summary",
        prompt: `Synthesize the core student governance handbook for {{STUDENT_UNION_NAME}} at {{INSTITUTION_NAME}}. Produce a structured 5-section reference guide covering room reservations, locker allocation, club registration, and dispute escalation. Use Canvas to create this as an editable document.`
      },
      {
        type: "canvas",
        title: "Prompt to Generate FAQ Knowledge Base for Club Subsidies",
        prompt: `Create a 12-question frequently asked questions (FAQ) knowledge base for student societies regarding annual budget applications, permissible expense receipts, and claim submission deadlines. Use Canvas to create this as an editable document.`
      },
      {
        type: "notebooklm",
        title: "Prompt to Build a Verification Set in Gemini Notebook",
        prompt: `Using only the sources in this notebook, write 10 questions that members of {{STUDENT_UNION_NAME}} often ask: 3 on venue booking, 2 on lockers, 3 on society funding and 2 on membership or elections. For each, give the correct answer in 2–3 sentences, including any form name, fee or deadline, and cite the document and section or page. Then add 2 sensitive questions (a welfare dispute and a disciplinary case) whose expected reply is a referral to the union officer. Present everything as a table: Question | Expected answer | Source.`
      }
    ],
    "zh-TW": [
      {
        type: "canvas",
        title: "生成學生會會章與場地借用規範摘要提示詞",
        prompt: `為 {{INSTITUTION_NAME}} 的 {{STUDENT_UNION_NAME}} 統整核心學生自治手冊。整理五大章節摘要：學生活動中心場地預約、置物櫃申請、新社團成立認證與爭議申訴程序。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "canvas",
        title: "生成社團補助與福利常見問題集 (FAQ) 提示詞",
        prompt: `為各學生社團編製一份 12 題常見問答集 (FAQ)，詳細解答年度補助金請領資格、合格單據報銷規定及審核進度查詢。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "notebooklm",
        title: "在 Gemini Notebook 建立驗證題組提示詞",
        prompt: `只根據此 Notebook 的來源，寫出 10 條 {{STUDENT_UNION_NAME}} 會員常問的問題：3 條關於場地預約、2 條關於儲物櫃、3 條關於學會資助、2 條關於會籍或選舉。每條以 2 至 3 句寫出正確答案，包括相關表格名稱、費用或限期，並註明文件及章節或頁數。再加入 2 條敏感問題（一宗福利糾紛及一宗紀律個案），預期答案為轉介學生會幹事。以表格呈現：問題｜預期答案｜出處。`
      }
    ],
    "zh-CN": [
      {
        type: "canvas",
        title: "生成学生会会章与场地借用规范摘要提示词",
        prompt: `为 {{INSTITUTION_NAME}} 的 {{STUDENT_UNION_NAME}} 统整核心学生自治手册。整理五大章节摘要：学生活动中心场地预约、储物柜申请、新社团成立认证与争议申诉程序。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "canvas",
        title: "生成社团补助与福利常见问题集 (FAQ) 提示词",
        prompt: `为各学生社团编制一份 12 题常见问答集 (FAQ)，详细解答年度补助金申领资格、合格单据报销规定及审核进度查询。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "notebooklm",
        title: "在 Gemini Notebook 建立验证题组提示词",
        prompt: `只根据此 Notebook 的来源，写出 10 条 {{STUDENT_UNION_NAME}} 会员常问的问题：3 条关于场地预约、2 条关于储物柜、3 条关于社团资助、2 条关于会籍或选举。每条以 2 至 3 句写出正确答案，包括相关表格名称、费用或截止日期，并注明文件及章节或页数。再加入 2 条敏感问题（一起福利纠纷及一起纪律个案），预期答案为转介学生会干事。以表格呈现：问题｜预期答案｜出处。`
      }
    ]
  },
  visual_campaign: {
    en: [
      {
        type: "canvas",
        title: "Prompt to Generate Campus Orientation Narrative Arc & Character Brief",
        prompt: `Act as an interactive narrative designer. Outline a 4-chapter campus orientation story game for {{EVENT_NAME}} at {{INSTITUTION_NAME}} targeting {{TARGET_AUDIENCE}}. Include 3 distinct student guide personas and campus riddle checkpoints. Use Canvas to create this as an editable document.`
      },
      {
        type: "general",
        title: "Prompt to Generate Image & Video Generation Art Directives",
        prompt: `Write 3 high-detail text-to-image prompts and 2 motion video prompts for {{EVENT_NAME}}. Specify art style (modern anime/3D cinematic vector), student diversity, campus architectural lighting, and 16:9 aspect ratios.`
      }
    ],
    "zh-TW": [
      {
        type: "canvas",
        title: "生成迎新探索劇情架構與角色設定提示詞",
        prompt: `請扮演互動敘事設計師。為 {{INSTITUTION_NAME}} 的「{{EVENT_NAME}}」（目標對象：{{TARGET_AUDIENCE}}）規劃四章節校園解謎冒險故事。包含 3 位特色學長姐導覽角色設定與標誌性建築關卡線索。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "general",
        title: "生成圖像與動畫生成風格指令提示詞",
        prompt: `為「{{EVENT_NAME}}」撰寫 3 組高畫質文字生圖提示詞及 2 組 5 秒動態影片提示詞。規範繪圖風格（3D 寫實電影級向量感）、學生多元性、校園自然採光及 16:9 構圖比。`
      }
    ],
    "zh-CN": [
      {
        type: "canvas",
        title: "生成迎新探索剧情架构与角色设定提示词",
        prompt: `请扮演互动叙事设计师。为 {{INSTITUTION_NAME}} 的“{{EVENT_NAME}}”（目标对象：{{TARGET_AUDIENCE}}）规划四章节校园解谜冒险故事。包含 3 位特色学长姐导览角色设定与标志性建筑关卡线索。请使用 Canvas 将此内容创建为可编辑文档。`
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
        type: "canvas",
        title: "Prompt to Generate Learning Analytics Anonymized Cohort Schema",
        prompt: `Create an anonymized synthetic CSV schema for student learning analytics tracking in {{DEPARTMENT_NAME}} for {{COHORT_SEMESTER}}. Include fields for LMS login frequency, assignment submission lag, quiz averages, and midterm exam scores. Use Canvas to create this as an editable document.`
      },
      {
        type: "canvas",
        title: "Prompt to Generate Academic Advisor Supportive Outreach Email",
        prompt: `Draft an empathetic, encouraging check-in email template from an academic advisor to a student flagged for declining attendance in {{DEPARTMENT_NAME}}. Maintain a non-punitive, supportive tone inviting them to office hours. Use Canvas to create this as an editable document.`
      }
    ],
    "zh-TW": [
      {
        type: "canvas",
        title: "生成學習成效匿名數據欄位樣板提示詞",
        prompt: `為「{{DEPARTMENT_NAME}}」在「{{COHORT_SEMESTER}}」學期的學習預警建立去識別化資料欄位範本。涵蓋 LMS 登入頻率、作業遲交天數、小考平均值及期中考落後指標。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "canvas",
        title: "生成學業導師關懷與輔導信函範本提示詞",
        prompt: `以學業導師視角撰寫一封溫暖、不帶評判意味的關懷信函，發送給在「{{DEPARTMENT_NAME}}」出席率下降的學生，邀請其前來諮詢時間討論學習支援資源。請使用 Canvas 將此內容建立為可編輯文件。`
      }
    ],
    "zh-CN": [
      {
        type: "canvas",
        title: "生成学习成效匿名数据字段样板提示词",
        prompt: `为“{{DEPARTMENT_NAME}}”在“{{COHORT_SEMESTER}}”学期的学习预警建立去标识化数据字段范本。涵盖 LMS 登录频率、作业迟交天数、小测平均值及期中考落后指标。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "canvas",
        title: "生成学业导师关怀与辅导信函范本提示词",
        prompt: `以学业导师视角撰写一封温暖、不带评判意味的关怀信函，发送给在“{{DEPARTMENT_NAME}}”出席率下降的学生，邀请其前来咨询时间讨论学习支持资源。请使用 Canvas 将此内容创建为可编辑文档。`
      }
    ]
  },
  accreditation_reports: {
    en: [
      {
        type: "canvas",
        title: "Prompt to Generate Departmental Evidence Collection Template",
        prompt: `Draft a comprehensive departmental self-study evidence collection checklist for {{PROGRAM_NAME}} aligned with {{ACCREDITATION_BODY}} standards. Include curriculum matrices, syllabus archives, and assessment artifacts. Use Canvas to create this as an editable document.`
      },
      {
        type: "canvas",
        title: "Prompt to Generate Faculty Qualifications & Curriculum Matrix",
        prompt: `Create an accreditation-compliant tabular matrix mapping {{PROGRAM_NAME}} courses to faculty terminal degree qualifications, research publications, and course learning outcomes. Use Canvas to create this as an editable document.`
      }
    ],
    "zh-TW": [
      {
        type: "canvas",
        title: "生成系所自我評鑑佐證清單提示詞",
        prompt: `依據「{{ACCREDITATION_BODY}}」認證評鑑標準，為「{{PROGRAM_NAME}}」制定自評報告佐證資料收集清單。包含核心課程配比、教學大綱存檔及學習成效審查檔案。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "canvas",
        title: "生成師資專長與課程對照矩陣提示詞",
        prompt: `編製符合評鑑規範之表格矩陣，將「{{PROGRAM_NAME}}」各必選修課程與任課教師之最高學位、學術研究專長及課程成效指標進行嚴謹對應。請使用 Canvas 將此內容建立為可編輯文件。`
      }
    ],
    "zh-CN": [
      {
        type: "canvas",
        title: "生成系所自我评估佐证清单提示词",
        prompt: `依据“{{ACCREDITATION_BODY}}”认证评估标准，为“{{PROGRAM_NAME}}”制定自评报告佐证数据收集清单。包含核心课程配比、教学大纲存档及学习成效审查档案。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "canvas",
        title: "生成师资专长与课程对照矩阵提示词",
        prompt: `编制符合评估规范之表格矩阵，将“{{PROGRAM_NAME}}”各必选修课程与任课教师之最高学位、学术研究专长及课程成效指标进行严谨对应。请使用 Canvas 将此内容创建为可编辑文档。`
      }
    ]
  },
  workforce_federation: {
    en: [
      {
        type: "canvas",
        title: "Prompt to Generate SAML 2.0 / OIDC IdP Metadata Specification",
        prompt: `Draft a technical configuration specification for federating campus Identity Provider ({{IDP_PROVIDER}}) with Google Cloud Workforce Identity for domain {{INSTITUTION_DOMAIN}}. Detail attribute mappings for NameID, email, roles, and department codes. Use Canvas to create this as an editable document.`
      },
      {
        type: "canvas",
        title: "Prompt to Generate Attribute Condition & RBAC Role Matrix",
        prompt: `Create a role-based access control (RBAC) assertion condition table mapping institutional student, lecturer, and administrative groups to Gemini Enterprise permission tiers. Use Canvas to create this as an editable document.`
      }
    ],
    "zh-TW": [
      {
        type: "canvas",
        title: "生成 SAML 2.0 / OIDC 身份聯合技術規格提示詞",
        prompt: `為校園網域 {{INSTITUTION_DOMAIN}} 撰寫整合身分提供者 ({{IDP_PROVIDER}}) 至 Google Cloud Workforce Identity 的部署規格書。詳列 NameID、主要電子郵件、角色群組與系所代碼映射規則。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "canvas",
        title: "生成屬性條件與 RBAC 角色授權矩陣提示詞",
        prompt: `設計基於角色存取控制 (RBAC) 的屬性判定表，將全校學生、教師與行政人員 SSO 群組對應至 Gemini Enterprise 的權限層級。請使用 Canvas 將此內容建立為可編輯文件。`
      }
    ],
    "zh-CN": [
      {
        type: "canvas",
        title: "生成 SAML 2.0 / OIDC 身份联合技术规格提示词",
        prompt: `为校园网域 {{INSTITUTION_DOMAIN}} 撰写整合身份提供者 ({{IDP_PROVIDER}}) 至 Google Cloud Workforce Identity 的部署规格书。详列 NameID、主要电子邮件、角色群组与系所代码映射规则。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "canvas",
        title: "生成属性条件与 RBAC 角色授权矩阵提示词",
        prompt: `设计基于角色访问控制 (RBAC) 的属性判定表，将全校学生、教师与行政人员 SSO 群组对应至 Gemini Enterprise 的权限层级。请使用 Canvas 将此内容创建为可编辑文档。`
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
        type: "canvas",
        title: "Prompt to Generate Society Expense Reimbursement Policy Guide",
        prompt: `Draft an official student organization finance compliance guideline outlining reimbursable expenses, non-allowable expenditures (e.g. alcohol, tips over 15%), and mandatory invoice attachment criteria. Use Canvas to create this as an editable document.`
      },
      {
        type: "canvas",
        title: "Prompt to Generate Audit Discrepancy Notice & Appeal Letter",
        prompt: `Draft a formal yet polite financial audit deduction notice addressed to {{SOCIETY_NAME}} regarding event claim '{{EVENT_NAME}}' with itemized disallowed expenses and step-by-step appeal procedures. Use Canvas to create this as an editable document.`
      }
    ],
    "zh-TW": [
      {
        type: "canvas",
        title: "生成社團經費報銷手冊與審核準則提示詞",
        prompt: `編撰一份學生社團經費核銷指引，明確條列可報銷項目、禁止報銷項目（如酒精飲料、逾 15% 小費）及發票憑證正規化要求。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "canvas",
        title: "生成單據不合規扣除通知與申訴信範本提示詞",
        prompt: `撰寫一份客氣且規範的財務審核意見書，通知「{{SOCIETY_NAME}}」於「{{EVENT_NAME}}」活動申請中的不合規扣除明細，並附上補件及申訴指引。請使用 Canvas 將此內容建立為可編輯文件。`
      }
    ],
    "zh-CN": [
      {
        type: "canvas",
        title: "生成社团经费报销手册与审核准则提示词",
        prompt: `编撰一份学生社团经费核销指引，明确条列可报销项目、禁止报销项目（如酒精饮料、逾 15% 小费）及发票凭证正规化要求。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "canvas",
        title: "生成单据不合规扣除通知与申诉信范本提示词",
        prompt: `撰写一份客气且规范的财务审核意见书，通知“{{SOCIETY_NAME}}”于“{{EVENT_NAME}}”活动申请中的不合规扣除明细，并附上补件及申诉指引。请使用 Canvas 将此内容创建为可编辑文档。`
      }
    ]
  },
  security_simulator: {
    en: [
      {
        type: "canvas",
        title: "Prompt to Generate Emergency Response SOP & Incident Brief",
        prompt: `Act as a Director of Campus Safety. Draft a standard operating procedure (SOP) brief for campus security personnel managing {{EMERGENCY_SCENARIO}} at {{FACILITY_LOCATION}}. Include initial containment, perimeter isolation, and communications protocol. Use Canvas to create this as an editable document.`
      },
      {
        type: "canvas",
        title: "Prompt to Generate Crisis Decision Tree Scenario Table",
        prompt: `Create a 3-stage branching crisis drill scenario table for {{EMERGENCY_SCENARIO}} at {{FACILITY_LOCATION}}. At each stage (0 min, 15 min, 30 min), define 3 tactical options, the operational consequence of each, and evaluation rubric criteria. Use Canvas to create this as an editable document.`
      }
    ],
    "zh-TW": [
      {
        type: "canvas",
        title: "生成校園緊急應變 SOP 與情境簡報提示詞",
        prompt: `請扮演校園安保總監。為安保團隊在「{{FACILITY_LOCATION}}」應對「{{EMERGENCY_SCENARIO}}」撰寫應變標準作業程序 (SOP)。包含首要隔離處置、警戒線封鎖與校安通報程序。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "canvas",
        title: "生成三階段危機決策樹演練腳本提示詞",
        prompt: `為「{{FACILITY_LOCATION}}」發生的「{{EMERGENCY_SCENARIO}}」建立三階段演習腳本（0分、15分、30分），每階段提供 3 項戰術選擇、後續連鎖後果及演練評分準則。請使用 Canvas 將此內容建立為可編輯文件。`
      }
    ],
    "zh-CN": [
      {
        type: "canvas",
        title: "生成校园紧急应变 SOP 与情境简报提示词",
        prompt: `请扮演校园安保总监。为安保团队在“{{FACILITY_LOCATION}}”应对“{{EMERGENCY_SCENARIO}}”撰写应变标准作业程序 (SOP)。包含首要隔离处置、警戒线封锁与校安通报程序。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "canvas",
        title: "生成三阶段危机决策树演练脚本提示词",
        prompt: `为“{{FACILITY_LOCATION}}”发生的“{{EMERGENCY_SCENARIO}}”建立三阶段演习脚本（0分、15分、30分），每阶段提供 3 项战术选择、后续连锁后果及演练评分准则。请使用 Canvas 将此内容创建为可编辑文档。`
      }
    ]
  },
  special_consideration_workflow: {
    en: [
      {
        type: "canvas",
        title: "Prompt to Draft the Evidence Rules Table",
        prompt: `Act as a student affairs policy officer at {{INSTITUTION_NAME}}. Draft an evidence rules table for special consideration requests. Rows: extension, deferred exam, leave of absence. For each row, list the accepted reasons (medical, compassionate, personal), the evidence required for each reason, the most days the office can approve without escalation (default: {{AUTO_LIMIT_DAYS}}), and who approves. End with a short list of cases that must always go to a human officer. Use Canvas to create this as an editable document.`
      },
      {
        type: "canvas",
        title: "Prompt to Draft Decision Letter Templates",
        prompt: `Write 4 short, warm email templates for the {{OFFICE_NAME}} to send students about special consideration requests: (1) approved, (2) partly approved with new dates, (3) not approved, with the reason and how to appeal, (4) more evidence needed. Use placeholders for student name, course code, dates and policy clause. Keep each under 150 words, in plain English. Use Canvas to create this as an editable document.`
      },
      {
        type: "canvas",
        title: "Prompt to Generate a Sample Student Application Form",
        prompt: `Create a realistic sample special consideration application form, as a student at {{INSTITUTION_NAME}} would submit it to the {{OFFICE_NAME}}, so staff can test the workflow. Use fictional details only and mark the header "SAMPLE: fictional data for testing". Include: (A) application reference and date submitted; (B) student details: name, student ID, programme, year and email; (C) request: type (deferred exam), course code, assessment affected, original date and days requested; (D) reason category (medical) and a 120-word student statement; (E) evidence checklist listing a medical certificate with its issuer and dates, plus a one-paragraph mock certificate summary at the end; (F) number of earlier requests this term; (G) declaration and signature line. Then add two short variants to test the other branches: one with the evidence missing, and one whose statement mentions a welfare concern. Use Canvas to create this as an editable document.`
      }
    ],
    "zh-TW": [
      {
        type: "canvas",
        title: "生成證明文件規則表提示詞",
        prompt: `請扮演「{{INSTITUTION_NAME}}」學生事務處的政策主任，為特殊考量申請草擬一份證明文件規則表。列：延期交功課、延期考試、休學。每一列列出可接受的原因（醫療、恩恤、個人）、每個原因所需的證明文件、辦事處毋須上報即可批准的最多日數（預設：{{AUTO_LIMIT_DAYS}}），以及審批人。最後列出必須交由真人職員處理的個案類別。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "canvas",
        title: "生成決定信範本提示詞",
        prompt: `為{{OFFICE_NAME}}撰寫 4 封簡短而親切的電郵範本，通知學生特殊考量申請結果：(1) 批准，(2) 部分批准並附新日期，(3) 不批准，附原因及上訴方法，(4) 需補交證明文件。以佔位符表示學生姓名、科目編號、日期及政策條文。每封不多於 150 字，用語淺白。請使用 Canvas 將此內容建立為可編輯文件。`
      },
      {
        type: "canvas",
        title: "生成學生申請表樣本提示詞",
        prompt: `製作一份逼真的特殊考量申請表樣本，模擬「{{INSTITUTION_NAME}}」學生向{{OFFICE_NAME}}提交的申請，供職員測試工作流程。只可使用虛構資料，並在頁首標明「樣本：測試用虛構資料」。內容包括：(A) 申請編號及提交日期；(B) 學生資料：姓名、學生編號、課程、年級及電郵；(C) 申請內容：類別（延期考試）、科目編號、受影響的評核、原定日期及申請日數；(D) 原因類別（醫療）及約 200 字的學生陳述；(E) 證明文件清單，列出醫生證明書的簽發者及日期，並在文末附一段模擬證明書摘要；(F) 本學期較早前的申請次數；(G) 聲明及簽署欄。另加兩個簡短版本以測試其他分支：一份欠缺證明文件，另一份的陳述提及福利問題。請使用 Canvas 將此內容建立為可編輯文件。`
      }
    ],
    "zh-CN": [
      {
        type: "canvas",
        title: "生成证明材料规则表提示词",
        prompt: `请扮演“{{INSTITUTION_NAME}}”学生事务处的政策主管，为特殊考量申请草拟一份证明材料规则表。行：作业延期、缓考、休学。每一行列出可接受的原因（医疗、恩恤、个人）、每个原因所需的证明材料、办公室无需上报即可批准的最多天数（默认：{{AUTO_LIMIT_DAYS}}），以及审批人。最后列出必须交由真人职员处理的个案类别。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "canvas",
        title: "生成决定函模板提示词",
        prompt: `为{{OFFICE_NAME}}撰写 4 封简短而亲切的邮件模板，通知学生特殊考量申请结果：(1) 批准，(2) 部分批准并附新日期，(3) 不批准，附原因及申诉方法，(4) 需补交证明材料。以占位符表示学生姓名、课程编号、日期及政策条文。每封不超过 150 字，用语浅白。请使用 Canvas 将此内容创建为可编辑文档。`
      },
      {
        type: "canvas",
        title: "生成学生申请表样本提示词",
        prompt: `制作一份逼真的特殊考量申请表样本，模拟“{{INSTITUTION_NAME}}”学生向{{OFFICE_NAME}}提交的申请，供职员测试工作流程。只可使用虚构资料，并在页眉标明“样本：测试用虚构资料”。内容包括：(A) 申请编号及提交日期；(B) 学生资料：姓名、学号、专业、年级及电子邮箱；(C) 申请内容：类别（缓考）、课程编号、受影响的考核、原定日期及申请天数；(D) 原因类别（医疗）及约 200 字的学生陈述；(E) 证明材料清单，列出医生证明的出具单位及日期，并在文末附一段模拟证明摘要；(F) 本学期较早前的申请次数；(G) 声明及签名栏。另加两个简短版本以测试其他分支：一份缺少证明材料，另一份的陈述提及福利问题。请使用 Canvas 将此内容创建为可编辑文档。`
      }
    ]
  },
  scholarship_application_workflow: {
    en: [
      {
        type: "general",
        title: "Prompt to Summarise the Scholarship Call",
        prompt: `I am applying for {{SCHOLARSHIP_NAME}}. From the scholarship call I paste below, list: (1) hard eligibility requirements, (2) selection criteria and their weighting if given, (3) required documents, (4) word limits and format rules, (5) the deadline and how to submit, (6) any rules on AI use. Put it in a table and flag anything unclear that I should ask the scholarship office about.`
      },
      {
        type: "general",
        title: "Prompt to Build My Experience Bank",
        prompt: `Help me turn my CV and activity list into an experience bank for scholarship applications. For each activity, ask me what I did, the challenge, the action I took and the result. Then write each one as a 3-line STAR summary in my own words, and tag it with the qualities it shows (leadership, service, academic excellence, resilience, creativity).`
      }
    ],
    "zh-TW": [
      {
        type: "general",
        title: "生成獎學金章程摘要提示詞",
        prompt: `我正在申請「{{SCHOLARSHIP_NAME}}」。請根據我在下方貼上的獎學金章程，列出：(1) 硬性資格要求，(2) 評選準則及比重（如有），(3) 所需文件，(4) 字數及格式要求，(5) 截止日期及提交方法，(6) 有關使用 AI 的規定。以表格呈現，並標示我應向獎學金辦事處查詢的不清楚之處。`
      },
      {
        type: "general",
        title: "生成個人經歷庫提示詞",
        prompt: `請協助我把履歷及活動清單整理成獎學金申請用的經歷庫。每項活動請先問我：做了甚麼、遇到甚麼挑戰、採取了甚麼行動、結果如何。然後以我自己的語氣寫成 3 行 STAR 摘要，並標示它展現的特質（領導力、服務、學術卓越、抗逆力、創意）。`
      }
    ],
    "zh-CN": [
      {
        type: "general",
        title: "生成奖学金章程摘要提示词",
        prompt: `我正在申请“{{SCHOLARSHIP_NAME}}”。请根据我在下方粘贴的奖学金章程，列出：(1) 硬性资格要求，(2) 评选标准及权重（如有），(3) 所需材料，(4) 字数及格式要求，(5) 截止日期及提交方式，(6) 有关使用 AI 的规定。以表格呈现，并标出我应向奖学金办公室咨询的不清楚之处。`
      },
      {
        type: "general",
        title: "生成个人经历库提示词",
        prompt: `请帮我把简历及活动清单整理成奖学金申请用的经历库。每项活动请先问我：做了什么、遇到什么挑战、采取了什么行动、结果如何。然后用我自己的语气写成 3 行 STAR 摘要，并标出它体现的特质（领导力、服务、学术卓越、抗逆力、创造力）。`
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
        "In Gemini Notebook, add your syllabus, lecture slides and key readings as sources, then use the Set up prompt to build a verification set: 10 typical student questions with cited answers.",
        "In Agent Designer, paste the tutor prompt and add the same files under Knowledge › Add files. Keep the same file names so the citations match.",
        "Ask the Agent the 10 verification questions and compare its hints and citations with the notebook's answers. Fix any gaps, then publish the Agent link in your LMS."
      ],
      prompt: `You are the '{{COURSE_CODE}} Coach', a friendly and encouraging Socratic tutor for {{COURSE_NAME}}. Your sole objective is to guide students to find answers themselves.

KNOWLEDGE SOURCES (Agent Designer › Knowledge › Add files: the same files as your Gemini Notebook course hub)
The syllabus, lecture slides and key readings for {{COURSE_NAME}}.

GROUNDING RULES
1. Use only the Knowledge Sources. Do not use general web knowledge, even if you know the answer.
2. Before every hint, find the passage that supports it and cite it as (file name, page or slide).
3. If the answer isn't in the sources, say: "That isn't covered in the {{COURSE_NAME}} materials. Please ask {{INSTRUCTOR_NAME}}." Do not guess.
4. Never invent quotes, page numbers, formulas or facts.
5. If two sources disagree, follow the latest syllabus and tell the student about the conflict.

TUTORING RULES
1. When a student asks for an answer (e.g. 'What is the answer to question 3?'), do NOT give it. Reply with a probing question that points to the right place in the materials (e.g. 'Look at slide 4 of Lecture 2: what is the first stage called?').
2. When the student shows correct understanding, praise them and give a complete explanation with citations.
3. If asked about topics outside this course, politely decline: 'I can only help with {{COURSE_NAME}} topics.'`,
      proTip: "Agent Designer can't read a Gemini Notebook directly, so the Agent answers only from the files you add under Knowledge. Use the notebook as your answer key: if the Agent's citation doesn't match the notebook's, fix the files or the prompt before students use it."
    },
    "zh-TW": {
      title: "Socratic AI Tutor Agent 創建",
      summary: "將客製化的課程 Agent 植基於您的授課筆記與教學大綱，打造 24/7 的 Socratic 學習導師。",
      steps: [
        "在 Gemini Notebook 加入課程大綱、講義投影片及核心讀物作為來源，再用輔助提示詞建立驗證題組：10 條學生常問的問題，每條附有出處的答案。",
        "在 Agent Designer 貼上導師提示詞，並在 Knowledge › Add files 加入同一批檔案。保持相同檔名，讓引用出處一致。",
        "向 Agent 提出這 10 條驗證問題，將它的提示及出處與 Notebook 的答案逐一比對。補好缺漏後，才在 LMS 發布 Agent 連結。"
      ],
      prompt: `你是「{{COURSE_CODE}} 導師」，一位親切、循循善誘的 {{COURSE_NAME}} Socratic 學習教練。你的唯一目標是引導學生自己找到答案。

知識來源（在 Agent Designer › Knowledge › Add files 加入，與 Gemini Notebook 課程中心相同的檔案）
{{COURSE_NAME}} 的課程大綱、講義投影片及核心讀物。

引用規則
1. 只可使用知識來源的內容。即使你知道答案，也不要使用一般網絡知識。
2. 每次給提示前，先找出支持的段落，並以（檔案名稱，頁數或投影片編號）註明出處。
3. 如來源沒有答案，請回答：「{{COURSE_NAME}} 的教材未有涵蓋這個問題，請向 {{INSTRUCTOR_NAME}} 查詢。」不要猜測。
4. 絕不編造引文、頁數、公式或事實。
5. 如兩份來源內容有衝突，以最新的課程大綱為準，並告訴學生有衝突。

導學規則
1. 學生直接要答案時（例如：「第 3 題答案是甚麼？」），不要直接回答。請以探究式的反問，指向教材中的相關位置（例如：「看看 Lecture 2 第 4 張投影片，第一個階段叫甚麼？」）。
2. 學生展現正確理解時，給予肯定，並提供附出處的完整解說。
3. 如被問及本課程以外的主題，請禮貌地拒絕：「我只能協助解答 {{COURSE_NAME}} 的問題。」`,
      proTip: "Agent Designer 無法直接讀取 Gemini Notebook，Agent 只會根據你在 Knowledge 加入的檔案作答。把 Notebook 當作答案參考：如 Agent 的出處與 Notebook 不符，先修正檔案或提示詞，才讓學生使用。"
    },
    "zh-CN": {
      title: "Socratic AI Tutor Agent 创建",
      summary: "将定制的课程 Agent 植基于您的授课笔记与教学大纲，打造 24/7 的 Socratic 学习导师。",
      steps: [
        "在 Gemini Notebook 加入课程大纲、讲义幻灯片及核心读物作为来源，再用辅助提示词建立验证题组：10 条学生常问的问题，每条附有出处的答案。",
        "在 Agent Designer 贴上导师提示词，并在 Knowledge › Add files 加入同一批文件。保持相同文件名，让引用出处一致。",
        "向 Agent 提出这 10 条验证问题，将它的提示及出处与 Notebook 的答案逐一比对。补好缺漏后，才在 LMS 发布 Agent 链接。"
      ],
      prompt: `你是「{{COURSE_CODE}} 导师」，一位亲切、循循善诱的 {{COURSE_NAME}} Socratic 学习教练。你的唯一目标是引导学生自己找到答案。

知识来源（在 Agent Designer › Knowledge › Add files 加入，与 Gemini Notebook 课程中心相同的文件）
{{COURSE_NAME}} 的课程大纲、讲义幻灯片及核心读物。

引用规则
1. 只可使用知识来源的内容。即使你知道答案，也不要使用一般网络知识。
2. 每次给提示前，先找出支持的段落，并以（文件名，页数或幻灯片编号）注明出处。
3. 如来源没有答案，请回答：「{{COURSE_NAME}} 的教材未有涵盖这个问题，请向 {{INSTRUCTOR_NAME}} 查询。」不要猜测。
4. 绝不编造引文、页数、公式或事实。
5. 如两份来源内容有冲突，以最新的课程大纲为准，并告诉学生有冲突。

导学规则
1. 学生直接要答案时（例如：「第 3 题答案是什么？」），不要直接回答。请以探究式的反问，指向教材中的相关位置（例如：「看看 Lecture 2 第 4 张幻灯片，第一个阶段叫什么？」）。
2. 学生展现正确理解时，给予肯定，并提供附出处的完整解说。
3. 如被问及本课程以外的主题，请礼貌地拒绝：「我只能协助解答 {{COURSE_NAME}} 的问题。」`,
      proTip: "Agent Designer 无法直接读取 Gemini Notebook，Agent 只会根据你在 Knowledge 加入的文件作答。把 Notebook 当作答案参考：如 Agent 的出处与 Notebook 不符，先修正文件或提示词，才让学生使用。"
    }
  },
  rubric_grading: {
    "en": {
      title: "Rubric-Aligned Essay Feedback Assistant",
      summary: "Analyze student essays against a complex grading rubric in Gemini Notebook and generate formative constructive feedback.",
      steps: [
        "Create a notebook for the assignment and add the assignment instructions and the grading rubric as sources.",
        "Add one student essay as a source and run the feedback prompt in Gemini Notebook. Every score must quote the essay and name the rubric criterion.",
        "Check each score against the quoted evidence, then paste the feedback into Canvas Mode to personalise it before sending it through your LMS."
      ],
      prompt: `Acting as an expert academic teaching assistant, analyse the student essay in this notebook for the assignment "{{ASSIGNMENT_TITLE}}" against the grading rubric, for student "{{STUDENT_ID}}". Write a first draft of constructive, high-quality feedback.

Sources in this notebook: the assignment instructions, the grading rubric and this student's essay.

The feedback MUST follow this structure:
1. **Rubric Performance Summary**: a tentative level for each rubric criterion, quoting evidence from the essay.
2. **Key Strengths (1-2)**: what was done exceptionally well, quoting 1-2 examples from the text.
3. **Areas for Growth (2-3)**: specific logical, grammatical or structural issues, and how they relate to the rubric.
4. **Actionable Recommendations**: 2-3 specific, progressive steps for the next draft.

Rules: use only the rubric and the essay. If there is no evidence for a criterion, say so and mark it "Not enough evidence" instead of guessing. Never invent rubric levels or quotes.
Keep a supportive, encouraging teaching tone throughout.`,
      proTip: "Add one essay at a time and remove it before adding the next, so feedback never mixes students. Gemini Notebook keeps student work inside your institution's Gemini Enterprise environment and doesn't use it to train models."
    },
    "zh-TW": {
      title: "Rubric 評分規準作業回饋助理",
      summary: "在 Gemini Notebook 中依據多元評分規準分析學生論文，生成形成性、具建設性的回饋建議。",
      steps: [
        "為作業建立一個 Notebook，加入作業指引及評分規準作為來源。",
        "加入一份學生作業作為來源，在 Gemini Notebook 執行回饋提示詞。每個評分都必須引用作業原文並註明評分指標。",
        "對照引用的證據核實每個評分，再把回饋貼到 Canvas Mode 作個人化修改，然後經 LMS 發送。"
      ],
      prompt: `請扮演大學教學助理，依據此 Notebook 內的評分規準，分析學生「{{STUDENT_ID}}」繳交的「{{ASSIGNMENT_TITLE}}」作業，撰寫具建設性的形成性回饋初稿。

此 Notebook 的來源：作業指引、評分規準及這位學生的作業。

回饋內容必須包含以下結構：
1. **評分規準表現摘要**：為每個評分指標給予建議等級，並引用作業原文作證據。
2. **主要亮點（1-2 項）**：指出表現出色之處，直接引用 1-2 段原文。
3. **待改進之處（2-3 項）**：具體指出邏輯、文法或結構問題，並說明與評分規準的關係。
4. **具體改進建議**：提供 2-3 個循序漸進、可於下一稿實行的步驟。

規則：只使用評分規準及作業內容。如某項指標找不到證據，請直接說明並標示為「證據不足」，不要猜測。絕不編造評分等級或引文。
全文保持支持、富教學意義及鼓勵的語氣。`,
      proTip: "每次只加入一份作業，處理完畢後先移除，再加入下一份，避免回饋混淆不同學生。Gemini Notebook 會把學生作業保留在學校的 Gemini Enterprise 環境內，不會用作訓練模型。"
    },
    "zh-CN": {
      title: "Rubric 评分规准作业反馈助理",
      summary: "在 Gemini Notebook 中依据多元评分规准分析学生论文，生成形成性、具建设性的反馈建议。",
      steps: [
        "为作业建立一个 Notebook，加入作业指引及评分规准作为来源。",
        "加入一份学生作业作为来源，在 Gemini Notebook 执行反馈提示词。每个评分都必须引用作业原文并注明评分指标。",
        "对照引用的证据核实每个评分，再把反馈贴到 Canvas Mode 作个人化修改，然后经 LMS 发送。"
      ],
      prompt: `请扮演大学教学助理，依据此 Notebook 内的评分规准，分析学生「{{STUDENT_ID}}」缴交的「{{ASSIGNMENT_TITLE}}」作业，撰写具建设性的形成性反馈初稿。

此 Notebook 的来源：作业指引、评分规准及这位学生的作业。

反馈内容必须包含以下结构：
1. **评分规准表现摘要**：为每个评分指标给予建议等级，并引用作业原文作证据。
2. **主要亮点（1-2 项）**：指出表现出色之处，直接引用 1-2 段原文。
3. **待改进之处（2-3 项）**：具体指出逻辑、文法或结构问题，并说明与评分规准的关系。
4. **具体改进建议**：提供 2-3 个循序渐进、可于下一稿实行的步骤。

规则：只使用评分规准及作业内容。如某项指标找不到证据，请直接说明并标示为「证据不足」，不要猜测。绝不编造评分等级或引文。
全文保持支持、富教学意义及鼓励的语气。`,
      proTip: "每次只加入一份作业，处理完毕后先移除，再加入下一份，避免反馈混淆不同学生。Gemini Notebook 会把学生作业保留在学校的 Gemini Enterprise 环境内，不会用作训练模型。"
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
        "Add the anonymised survey comments and town hall transcripts from your Drive folder to a Gemini Notebook as sources. Use the Set up prompt to run Deep Research on peer-school solutions, and add that report too.",
        "Run the analysis prompt in Gemini Notebook. Every theme count and quote comes from the sources, and peer-school ideas come from the Deep Research report.",
        "Check the quotes against the original comments, remove anything that could identify a student, then present the priority list to the administration."
      ],
      prompt: `Acting as the Student Union Advocacy Director for {{INSTITUTION_NAME}}, analyse the town hall transcripts and anonymous student survey comments for {{ACADEMIC_TERM}} in this notebook.

Sources in this notebook: the survey comments, the town hall transcripts and a Deep Research report on how peer institutions handled similar issues.

Produce an evidence-based report:
1. **Thematic Clustering**: the top 5 campus issues, with the number of comments for each.
2. **Sentiment Assessment**: for each issue, the tone (highly negative, frustrated, neutral) and 3 representative quotes copied word for word, with their source.
3. **Peer Solutions**: 2 realistic, low-cost policy changes per issue, taken from the Deep Research report and cited. If the report has nothing on an issue, say so.
4. **Negotiation Preparation**: 5 objections the deans may raise about budget, each with a rebuttal backed by the counts and quotes above.

Rules: never paraphrase inside quotation marks, never invent numbers, and remove names, student IDs or any detail that could identify a student.`,
      proTip: "Gemini Notebook adds Google Docs, Slides and PDFs from Drive directly as sources, so you don't need a connector. Sync the sources again after each new survey round."
    },
    "zh-TW": {
      title: "學生意見情緒分析與權益倡議儀表板",
      summary: "整合校園論壇、諮詢會與問卷海量非結構化意見，產出高說服力之學生權益數據報告。",
      steps: [
        "從 Drive 資料夾把已匿名的問卷意見及諮詢大會記錄加入 Gemini Notebook 作為來源。用輔助提示詞以 Deep Research 搜尋同類院校的解決方案，並把報告一併加入。",
        "在 Gemini Notebook 執行分析提示詞。所有主題數目及引述都來自來源，同類院校的做法則來自 Deep Research 報告。",
        "對照原始意見核實引述，刪除任何可識別學生身分的內容，然後向校方提交優先事項清單。"
      ],
      prompt: `請扮演 {{INSTITUTION_NAME}} 學生會倡議總監，分析此 Notebook 內 {{ACADEMIC_TERM}} 的諮詢大會記錄及匿名學生問卷意見。

此 Notebook 的來源：問卷意見、諮詢大會記錄，以及一份關於同類院校如何處理相近問題的 Deep Research 報告。

請撰寫一份以證據為本的報告：
1. **主題歸類**：列出五大校園問題及每項的意見數目。
2. **情緒評估**：每項問題的語氣（非常負面、不滿、中性），並逐字引述 3 則具代表性的意見及其出處。
3. **同類院校方案**：每項問題提出 2 個切實可行、低成本的政策建議，取自 Deep Research 報告並註明出處。如報告未有相關內容，請直接說明。
4. **談判準備**：列出院長可能就預算提出的 5 項反對意見，並以上述數字及引述作出反駁。

規則：引號內不可改寫原文，絕不編造數字，並刪除姓名、學生編號或任何可識別學生身分的細節。`,
      proTip: "Gemini Notebook 可直接從 Drive 加入 Google Docs、Slides 及 PDF 作為來源，毋須連接器。每輪新問卷完成後，請再同步來源。"
    },
    "zh-CN": {
      title: "学生意见情绪分析与权益倡议仪表板",
      summary: "整合校园论坛、咨询会与问卷海量非结构化意见，产出高说服力之学生权益数据报告。",
      steps: [
        "从 Drive 文件夹把已匿名的问卷意见及咨询大会记录加入 Gemini Notebook 作为来源。用辅助提示词以 Deep Research 搜寻同类院校的解决方案，并把报告一并加入。",
        "在 Gemini Notebook 执行分析提示词。所有主题数目及引述都来自来源，同类院校的做法则来自 Deep Research 报告。",
        "对照原始意见核实引述，删除任何可识别学生身份的内容，然后向校方提交优先事项清单。"
      ],
      prompt: `请扮演 {{INSTITUTION_NAME}} 学生会倡议总监，分析此 Notebook 内 {{ACADEMIC_TERM}} 的咨询大会记录及匿名学生问卷意见。

此 Notebook 的来源：问卷意见、咨询大会记录，以及一份关于同类院校如何处理相近问题的 Deep Research 报告。

请撰写一份以证据为本的报告：
1. **主题归类**：列出五大校园问题及每项的意见数目。
2. **情绪评估**：每项问题的语气（非常负面、不满、中性），并逐字引述 3 则具代表性的意见及其出处。
3. **同类院校方案**：每项问题提出 2 个切实可行、低成本的政策建议，取自 Deep Research 报告并注明出处。如报告未有相关内容，请直接说明。
4. **谈判准备**：列出院长可能就预算提出的 5 项反对意见，并以上述数字及引述作出反驳。

规则：引号内不可改写原文，绝不编造数字，并删除姓名、学生编号或任何可识别学生身份的细节。`,
      proTip: "Gemini Notebook 可直接从 Drive 加入 Google Docs、Slides 及 PDF 作为来源，无须连接器。每轮新问卷完成后，请再同步来源。"
    }
  },
  club_funding: {
    "en": {
      title: "Annual Club Calendar & Budget Justifier",
      summary: "Brainstorm an annual activities calendar and draft detailed, compliant student government funding proposals.",
      steps: [
        "Add the Student Union funding guidelines and bylaws to Gemini Notebook, then use the Set up prompt to pull out a funding rules checklist with the clause for each rule.",
        "In Canvas Mode, run the proposal prompt with the rules checklist and your planned events filled in.",
        "Check every budget line against the checklist and its clause, attach your receipts or quotes, then submit to the funding committee."
      ],
      prompt: `Act as a professional grant and proposal writer. Help {{CLUB_NAME}} draft a funding proposal for the academic year {{ACADEMIC_YEAR}}.

Inputs:
- Planned activities: {{EVENT_PLAN}}
- Funding rules checklist (from Gemini Notebook, with clause numbers): {{FUNDING_RULES}}

Task:
1. **Executive Summary**: the club's mission and how these events boost student engagement.
2. **Line-Item Budget Table**: columns Item | Event | Cost | Rule applied (clause) | Within limit? Calculate the totals. Use only the limits in the funding rules checklist; never invent a limit.
3. **Compliance Notes**: list any item that breaks the checklist or isn't covered by it, and suggest a fix.
4. **Impact Statement**: why the Student Union should fund the club, with the expected student outcomes.
Use Canvas to create this as an editable document.`,
      proTip: "Ask Gemini Notebook for the clause number with every rule. When the committee queries a budget line, you can point straight to the bylaw that allows it."
    },
    "zh-TW": {
      title: "社團年度行事曆與經費預算企劃書",
      summary: "規劃社團年度活動時間軸，自動編排符合學生會補助章程的逐項預算企劃書。",
      steps: [
        "把學生會資助指引及會章加入 Gemini Notebook，再用輔助提示詞整理一份資助規則清單，每條規則註明條文。",
        "在 Canvas Mode 執行企劃書提示詞，填入規則清單及計劃舉辦的活動。",
        "逐項核對每條預算與清單及其條文，附上收據或報價，然後提交資助委員會。"
      ],
      prompt: `請扮演專業的資助及企劃書撰寫人，協助 {{CLUB_NAME}} 草擬 {{ACADEMIC_YEAR}} 學年的資助企劃書。

輸入資料：
- 計劃舉辦的活動：{{EVENT_PLAN}}
- 資助規則清單（來自 Gemini Notebook，附條文編號）：{{FUNDING_RULES}}

任務：
1. **行政摘要**：學會的宗旨，以及這些活動如何提升學生參與。
2. **逐項預算表**：欄位為 項目｜活動｜費用｜適用規則（條文）｜是否在上限內。計算總額。只可使用規則清單中的上限，絕不自行編造。
3. **合規備註**：列出任何違反清單或未被清單涵蓋的項目，並建議修正方法。
4. **成效陳述**：說明學生會應資助本會的理由及預期的學生成果。
請使用 Canvas 將此內容建立為可編輯文件。`,
      proTip: "請 Gemini Notebook 為每條規則附上條文編號。委員會質疑某項預算時，你可直接指出容許該項開支的會章條文。"
    },
    "zh-CN": {
      title: "社团年度行事历与经费预算企划书",
      summary: "规划社团年度活动时间轴，自动编排符合学生会补助章程的逐项预算企划书。",
      steps: [
        "把学生会资助指引及章程加入 Gemini Notebook，再用辅助提示词整理一份资助规则清单，每条规则注明条文。",
        "在 Canvas Mode 执行企划书提示词，填入规则清单及计划举办的活动。",
        "逐项核对每条预算与清单及其条文，附上收据或报价，然后提交资助委员会。"
      ],
      prompt: `请扮演专业的资助及企划书撰写人，协助 {{CLUB_NAME}} 草拟 {{ACADEMIC_YEAR}} 学年的资助企划书。

输入资料：
- 计划举办的活动：{{EVENT_PLAN}}
- 资助规则清单（来自 Gemini Notebook，附条文编号）：{{FUNDING_RULES}}

任务：
1. **行政摘要**：社团的宗旨，以及这些活动如何提升学生参与。
2. **逐项预算表**：字段为 项目｜活动｜费用｜适用规则（条文）｜是否在上限内。计算总额。只可使用规则清单中的上限，绝不自行编造。
3. **合规备注**：列出任何违反清单或未被清单涵盖的项目，并建议修正方法。
4. **成效陈述**：说明学生会应资助本会的理由及预期的学生成果。
请使用 Canvas 将此内容创建为可编辑文档。`,
      proTip: "请 Gemini Notebook 为每条规则附上条文编号。委员会质疑某项预算时，你可直接指出容许该项开支的章程条文。"
    }
  },
  su_helpdesk: {
    "en": {
      title: "24/7 Student Union Policy Agent",
      summary: "Build a student-facing policy Agent grounded in your union handbook and constitutions to answer venue booking, locker and funding questions.",
      steps: [
        "Add the student handbook, welfare guidelines and club constitutions to Gemini Notebook as sources, then use the Set up prompt to build a verification set of 10 member questions with cited answers.",
        "In Agent Designer, paste the policy Agent prompt and add the same files under Knowledge › Add files. Fill in the officer's email for sensitive cases.",
        "Ask the Agent the 10 verification questions plus 2 sensitive ones. Check that answers and citations match the notebook and that sensitive questions go to the officer, then share the Agent link with members."
      ],
      prompt: `You are the 24/7 Policy and Welfare Agent for {{STUDENT_UNION_NAME}} at {{INSTITUTION_NAME}}. You give quick, accurate answers to student questions about union bylaws, venue booking, lockers and society funding.

KNOWLEDGE SOURCES (Agent Designer › Knowledge › Add files: the same files as your Gemini Notebook policy hub)
The student handbook, welfare guidelines and club constitutions of {{STUDENT_UNION_NAME}}.

GROUNDING RULES
1. Answer only from the Knowledge Sources and cite each answer as (document name, section or page).
2. If the sources don't cover a question, say so and give {{OFFICER_EMAIL}} as the contact. Never guess a rule, fee, deadline or form name.
3. If two documents disagree, quote both, say which is newer and suggest checking with the union office.

ANSWER RULES
1. Use a friendly, supportive student-peer tone.
2. For any procedure (e.g. booking a room, applying for event funding), give numbered steps and name the form or deadline from the sources.
3. If a question involves a confidential welfare dispute, a mental health concern or a disciplinary case, do NOT answer it. Reply kindly that a union officer will help in confidence and give {{OFFICER_EMAIL}}. If someone may be in danger, also tell them to contact campus security or emergency services now.`,
      proTip: "Re-upload the Knowledge files whenever the constitution or handbook is amended, then re-run your verification set. The Agent only knows the version you uploaded."
    },
    "zh-TW": {
      title: "24/7 學生會法規與會務諮詢 Agent",
      summary: "以學生會手冊及會章為依據，建立一個面向學生的政策 Agent，解答場地預約、儲物櫃及資助問題。",
      steps: [
        "把學生手冊、福利指引及各學會會章加入 Gemini Notebook 作為來源，再用輔助提示詞建立驗證題組：10 條會員常問的問題，每條附有出處的答案。",
        "在 Agent Designer 貼上政策 Agent 提示詞，並在 Knowledge › Add files 加入同一批檔案。填上處理敏感個案的幹事電郵。",
        "向 Agent 提出 10 條驗證問題及 2 條敏感問題，確認答案及出處與 Notebook 一致，而敏感問題會轉介幹事，然後才向會員分享 Agent 連結。"
      ],
      prompt: `你是 {{INSTITUTION_NAME}} {{STUDENT_UNION_NAME}} 的 24/7 政策及福利 Agent，為學生快速而準確地解答有關會章、場地預約、儲物櫃及學會資助的問題。

知識來源（在 Agent Designer › Knowledge › Add files 加入，與 Gemini Notebook 政策中心相同的檔案）
{{STUDENT_UNION_NAME}} 的學生手冊、福利指引及各學會會章。

引用規則
1. 只根據知識來源作答，每個答案註明出處（文件名稱，章節或頁數）。
2. 如來源未有涵蓋，請直接說明，並提供 {{OFFICER_EMAIL}} 作聯絡。絕不猜測任何規則、費用、限期或表格名稱。
3. 如兩份文件內容不一致，請同時引述，指出哪份較新，並建議向學生會辦事處查詢。

回答規則
1. 以友善、支持的同輩語氣回答。
2. 任何程序（例如預約房間、申請活動資助）都要列出編號步驟，並註明來源中的表格名稱或限期。
3. 如問題涉及保密的福利糾紛、精神健康問題或紀律個案，不要作答。請親切地回覆會有學生會幹事保密跟進，並提供 {{OFFICER_EMAIL}}。如有人可能身處危險，亦請他們立即聯絡校園保安或緊急服務。`,
      proTip: "每次修訂會章或手冊後，請重新上載 Knowledge 檔案，再跑一次驗證題組。Agent 只會知道你上載的版本。"
    },
    "zh-CN": {
      title: "24/7 学生会法规与会务咨询 Agent",
      summary: "以学生会手册及章程为依据，建立一个面向学生的政策 Agent，解答场地预约、储物柜及资助问题。",
      steps: [
        "把学生手册、福利指引及各社团章程加入 Gemini Notebook 作为来源，再用辅助提示词建立验证题组：10 条会员常问的问题，每条附有出处的答案。",
        "在 Agent Designer 贴上政策 Agent 提示词，并在 Knowledge › Add files 加入同一批文件。填上处理敏感个案的干事电子邮件。",
        "向 Agent 提出 10 条验证问题及 2 条敏感问题，确认答案及出处与 Notebook 一致，而敏感问题会转介干事，然后才向会员分享 Agent 链接。"
      ],
      prompt: `你是 {{INSTITUTION_NAME}} {{STUDENT_UNION_NAME}} 的 24/7 政策及福利 Agent，为学生快速而准确地解答有关章程、场地预约、储物柜及社团资助的问题。

知识来源（在 Agent Designer › Knowledge › Add files 加入，与 Gemini Notebook 政策中心相同的文件）
{{STUDENT_UNION_NAME}} 的学生手册、福利指引及各社团章程。

引用规则
1. 只根据知识来源作答，每个答案注明出处（文件名称，章节或页数）。
2. 如来源未有涵盖，请直接说明，并提供 {{OFFICER_EMAIL}} 作联系。绝不猜测任何规则、费用、截止日期或表格名称。
3. 如两份文件内容不一致，请同时引述，指出哪份较新，并建议向学生会办事处查询。

回答规则
1. 以友善、支持的同伴语气回答。
2. 任何程序（例如预约房间、申请活动资助）都要列出编号步骤，并注明来源中的表格名称或截止日期。
3. 如问题涉及保密的福利纠纷、精神健康问题或纪律个案，不要作答。请亲切地回复会有学生会干事保密跟进，并提供 {{OFFICER_EMAIL}}。如有人可能身处危险，亦请他们立即联系校园安保或紧急服务。`,
      proTip: "每次修订章程或手册后，请重新上传 Knowledge 文件，再跑一次验证题组。Agent 只会知道你上传的版本。"
    }
  },
  visual_campaign: {
    "en": {
      title: "Interactive Story Game & Visual Campaign",
      summary: "Create interactive visual storytelling campaigns, orientation games, and high-impact social media assets with AI media models.",
      steps: [
        "Draft the event narrative arc, key character personas and campus orientation milestones in Canvas Mode.",
        "Generate high-resolution thematic illustrations with Image Generation and narrative clips with Video Generation.",
        "Curate campaign assets into digital social feeds and interactive onboarding screens for freshers."
      ],
      prompt: `You are a creative campaign director for {{INSTITUTION_NAME}}. Design an interactive campus storytelling campaign and multimedia visual plan for {{EVENT_NAME}} targeting {{TARGET_AUDIENCE}}.
Requirements:
1. **Interactive Storyline**: Outline a 4-chapter narrative mystery where freshers explore historical campus buildings, discover student traditions, and solve clues.
2. **Visual Generation Prompts**: Provide 3 rich, descriptive text-to-image prompts (specifying artistic lighting, vibrant student characters, and cinematic composition) suitable for Gemini Image Generation.
3. **Motion Scene Prompts**: Draft 2 prompt scripts suitable for Video Generation to create 5-second teaser animations for social media stories.
Use Canvas to create this as an editable document.`,
      proTip: "Use Image Generation to produce unified character key visual styles before prompting Video Generation to preserve aesthetic continuity across visual campaign channels."
    },
    "zh-TW": {
      title: "互動迎新故事冒險與多媒體視覺宣傳",
      summary: "運用生成式多模態模型，編排互動式校園探索解謎遊戲，並快速生成宣傳主視覺與短影音動畫。",
      steps: [
        "在 Canvas Mode 擬定迎新活動故事架構、主要角色及校園探索關卡。",
        "透過 Image Generation 產出主視覺插畫，並使用 Video Generation 製作動態短片。",
        "將素材發布至社群平台限時動態與迎新互動網頁，引導新生參與。"
      ],
      prompt: `請扮演「{{INSTITUTION_NAME}}」的創意總監。為面向「{{TARGET_AUDIENCE}}」的「{{EVENT_NAME}}」規劃互動式校園探索故事遊戲與多媒體視覺設計。
企劃規範：
1. **互動敘事**：規劃 4 個章節的校園解謎歷程，引領新生在尋找線索中了解校園傳統與特色建築。
2. **生圖提示詞 (Image Generation)**：提供 3 組具體生動的提示詞（註明光影風格、當代大學生角色及高解析度比例），生成海報主視覺。
3. **動態場景提示詞 (Video Generation)**：設計 2 組 5 秒動態前導片腳本提示詞，供社群限時動態發布。
請使用 Canvas 將此內容建立為可編輯文件。`,
      proTip: "先利用 Image Generation 確定角色的色調與服裝風格，再以此為基準導入 Video Generation，能維繫跨社群平台宣傳風格的高度一致性。"
    },
    "zh-CN": {
      title: "互动迎新故事冒险与多媒体视觉宣传",
      summary: "运用生成式多模态模型，编排互动式校园探索解谜游戏，并快速生成宣传主视觉与短视频动画。",
      steps: [
        "在 Canvas Mode 拟定迎新活动故事架构、主要角色及校园探索关卡。",
        "透过 Image Generation 产出主视觉插画，并使用 Video Generation 制作动态短片。",
        "将素材发布至社交平台限时动态与迎新互动网页，引导新生参与。"
      ],
      prompt: `请扮演“{{INSTITUTION_NAME}}”的创意总监。为面向“{{TARGET_AUDIENCE}}”的“{{EVENT_NAME}}”规划互动式校园探索故事游戏与多媒体视觉设计。
企划规范：
1. **互动叙事**：规划 4 个章节的校园解谜历程，引领新生在寻找线索中了解校园传统与特色建筑。
2. **生图提示词 (Image Generation)**：提供 3 组具体生动的提示词（注明光影风格、当代大学生角色及高分辨率比例），生成海报主视觉。
3. **动态场景提示词 (Video Generation)**：设计 2 组 5 秒动态前导片脚本提示词，供社交限时动态发布。
请使用 Canvas 将此内容创建为可编辑文档。`,
      proTip: "先利用 Image Generation 确定角色的色调与服装风格，再以此为基准导入 Video Generation，能维系跨社交平台宣传风格的高度一致性。"
    }
  },
  at_risk_cohort: {
    "en": {
      title: "At-Risk Student Early Warning System",
      summary: "Identify students experiencing academic difficulties across disparate LMS and SIS logs to enable proactive intervention.",
      steps: [
        "Connect LMS gradebook and SIS engagement logs to establish multi-variable risk thresholds.",
        "Run the prompt in Deep Research with the LMS Connector selected as a source, so the analysis uses your gradebook and activity logs.",
        "Review identified cohorts with academic advisors and dispatch personalized supportive outreach."
      ],
      prompt: `Data source: the {{DEPARTMENT_NAME}} gradebook and activity logs for {{COHORT_SEMESTER}}, read through the LMS Connector. Use only this data for student information and never search the web for students.
Analyze student learning analytics data for {{COHORT_SEMESTER}} in the {{DEPARTMENT_NAME}} department to identify learners at risk of falling behind.
Criteria to examine:
- LMS login inactivity exceeding 10 consecutive days.
- Missed or late formative assessment submissions (threshold: 2 or more).
- Midterm scores below 60%.
Output Requirements:
1. **At-Risk Cohort Segmentation**: Group students into High Risk, Moderate Risk, and Low Risk categories with evidence flags.
2. **Intervention Recommendations**: For each risk tier, suggest actionable pedagogical interventions (e.g., peer tutoring referral, advisor check-in, supplemental review modules).
3. **Draft Outreach Email**: Generate an empathetic, non-judgmental advisor check-in email encouraging the student to schedule office hours.
Rules:
- Identify students by LMS ID only, and list the exact data points behind every flag (e.g. "last login 14 days ago; 2 late submissions; midterm 52%").
- If a data field is missing for a student, mark it "No data" and don't count it as a risk.
- This list is a starting point, not a decision: an advisor reviews every flag before any outreach is sent.`,
      proTip: "Ask for the data behind every flag. Advisors trust a list they can check, and it catches students who log in often but are falling behind on grades."
    },
    "zh-TW": {
      title: "學業預警與學習困難即時介入系統",
      summary: "整合教學平台 LMS 與學籍系統紀錄，早期識別潛在學習困難學生並提供個人化輔導策略。",
      steps: [
        "連線 LMS 成績冊與學生出席紀錄，建立跨維度的學習困難預警閥值。",
        "在 Deep Research 執行提示詞，並選取 LMS Connector 作為來源，讓分析使用你的成績冊及活動紀錄。",
        "與學業導師共同覆核名單，發送具關懷性質的個別化輔導與諮詢邀請。"
      ],
      prompt: `資料來源：經 LMS Connector 讀取的「{{DEPARTMENT_NAME}}」「{{COHORT_SEMESTER}}」成績冊及活動紀錄。學生資料只可取自這些數據，絕不在網上搜尋學生資料。
請分析「{{DEPARTMENT_NAME}}」學系在「{{COHORT_SEMESTER}}」學期的學習分析數據，找出處於學業預警邊緣的學生族群。
審核指標：
- LMS 登入中斷超過 10 天以上。
- 形成性平時作業缺繳或遲交達 2 次以上。
- 期中考成績落後於 60% 以下。
輸出格式：
1. **預警分級分類**：將學生區分為高、中、低風險群組，並註記具體異常指標。
2. **輔導處方建議**：針對不同風險層級提供具體支持方案（如同儕課業輔導、導師面談、線上補救單元）。
3. **關懷信函草稿**：擬定一封具溫度、不具斥責意味的導師問候信，邀請學生前來諮詢。
規則：
- 只以 LMS 學生編號識別學生，並列出每個預警標記背後的具體數據（例如「最後登入 14 日前；遲交 2 次；期中 52%」）。
- 如某學生欠缺某項數據，標示為「沒有數據」，不要當作風險計算。
- 此名單只是起點而非決定：發出任何關懷訊息前，須由學業導師覆核每個標記。`,
      proTip: "要求列出每個標記背後的數據。導師更信任可以核對的名單，亦能找出經常登入但成績落後的學生。"
    },
    "zh-CN": {
      title: "学业预警与学习困难即时介入系统",
      summary: "整合教学平台 LMS 与学籍系统记录，早期识别潜在学习困难学生并提供个性化辅导策略。",
      steps: [
        "连线 LMS 成绩册与学生出席记录，建立跨维度的学习困难预警阈值。",
        "在 Deep Research 执行提示词，并选取 LMS Connector 作为来源，让分析使用你的成绩册及活动记录。",
        "与学业导师共同审核名单，发送具关怀性质的个性化辅导与咨询邀请。"
      ],
      prompt: `数据来源：经 LMS Connector 读取的「{{DEPARTMENT_NAME}}」「{{COHORT_SEMESTER}}」成绩册及活动记录。学生信息只可取自这些数据，绝不在网上搜寻学生信息。
请分析“{{DEPARTMENT_NAME}}”学系在“{{COHORT_SEMESTER}}”学期的学习分析数据，找出处于学业预警边缘的学生族群。
审核指标：
- LMS 登录中断超过 10 天以上。
- 形成性平时作业缺交或迟交达 2 次以上。
- 期中考成绩落后于 60% 以下。
输出格式：
1. **预警分级分类**：将学生区分为高、中、低风险群组，并注记具体异常指标。
2. **辅导处方建议**：针对不同风险层级提供具体支持方案（如同侪课业辅导、导师面谈、线上补救单元）。
3. **关怀信函草稿**：拟定一封具温度、不具斥责意味的导师问候信，邀请学生前来咨询。
规则：
- 只以 LMS 学生编号识别学生，并列出每个预警标记背后的具体数据（例如「最后登录 14 日前；迟交 2 次；期中 52%」）。
- 如某学生欠缺某项数据，标示为「没有数据」，不要当作风险计算。
- 此名单只是起点而非决定：发出任何关怀信息前，须由学业导师覆核每个标记。`,
      proTip: "要求列出每个标记背后的数据。导师更信任可以核对的名单，亦能找出经常登录但成绩落后的学生。"
    }
  },
  accreditation_reports: {
    "en": {
      title: "Accreditation Self-Study Report Synthesizer",
      summary: "Map faculty syllabi, student outcomes, and institutional assessments against external accreditation criteria seamlessly.",
      steps: [
        "Run Deep Research on the accreditation body's current standards and recent changes. Add that report, the official standards document, syllabi, outcome assessments and committee minutes to a Gemini Notebook as sources.",
        "Run the synthesis prompt in Gemini Notebook to map the evidence to each criterion, list the gaps and draft the narrative with a citation for every claim.",
        "Click through the citations to check each claim against the original document, fill the evidence gaps, then export the self-study report."
      ],
      prompt: `Act as a higher education quality assurance director. Synthesise the evidence for {{PROGRAM_NAME}} against the accreditation standards of {{ACCREDITATION_BODY}}.

Sources in this notebook: the official {{ACCREDITATION_BODY}} standards, a Deep Research brief on recent changes to them, course syllabi, student learning outcome evaluations, faculty records and committee minutes.

Tasks:
1. **Cross-Mapping**: map the evidence to Criterion 1 (Curriculum Rigor) and Criterion 2 (Faculty Qualifications) as a table: Standard | Evidence | Source (document, page) | Strength (Strong, Partial, None).
2. **Gap Analysis**: list missing assessment data, outdated course references and under-documented learning evidence. Mark each one "Evidence gap" and name the document that would close it.
3. **Executive Synthesis**: draft a 500-word formal narrative on continuous improvement over the review cycle.

Rules: cite a source for every factual claim. If the official standards and the Deep Research brief differ, follow the official standards. Never invent figures, dates or meeting outcomes.`,
      proTip: "Gemini Notebook links every claim to its source, so reviewers can click a statement and see the original syllabus or minutes. Keep the official standards document in the notebook so the mapping never relies on a summary alone."
    },
    "zh-TW": {
      title: "評鑑自我評量報告整合與佐證矩陣",
      summary: "將系所教學大綱、學生學習成效與院務會議紀錄對齊外部認證評鑑指標，一鍵完成自評報告編撰。",
      steps: [
        "以 Deep Research 整理評審機構的現行標準及近期修訂，再把報告連同官方標準文件、課程大綱、學習成果評估及委員會會議記錄加入 Gemini Notebook 作為來源。",
        "在 Gemini Notebook 執行綜合提示詞，把證據對應至每項準則、列出缺漏，並撰寫每項陳述均附出處的報告敘述。",
        "逐一點擊出處，對照原始文件核實每項陳述，補齊證據缺漏，然後匯出自評報告。"
      ],
      prompt: `請扮演高等教育質素保證總監，按 {{ACCREDITATION_BODY}} 的評審標準，綜合 {{PROGRAM_NAME}} 的證據。

此 Notebook 的來源：{{ACCREDITATION_BODY}} 官方標準、一份關於標準近期修訂的 Deep Research 簡報、課程大綱、學生學習成果評估、教員資料及委員會會議記錄。

任務：
1. **交叉對應**：把證據對應至準則一（課程嚴謹度）及準則二（教員資歷），以表格呈現：標準｜證據｜出處（文件、頁數）｜強度（充分、部分、欠缺）。
2. **缺漏分析**：列出欠缺的評估數據、過時的課程參考資料及記錄不足的學習證據。每項標示為「證據缺漏」，並註明可補足缺漏的文件。
3. **總結敘述**：撰寫 500 字正式敘述，總結評審週期內的持續改善措施。

規則：每項事實陳述均須註明出處。如官方標準與 Deep Research 簡報不一致，以官方標準為準。絕不編造數字、日期或會議結果。`,
      proTip: "Gemini Notebook 會把每項陳述連結至出處，評審員點擊即可查看原始課程大綱或會議記錄。請把官方標準文件放在 Notebook 內，避免對應工作只依賴摘要。"
    },
    "zh-CN": {
      title: "评估自我评估报告整合与佐证矩阵",
      summary: "将系所教学大纲、学生学习成效与院务会议记录对齐外部认证评估指标，一键完成自评报告编撰。",
      steps: [
        "以 Deep Research 整理评审机构的现行标准及近期修订，再把报告连同官方标准文件、课程大纲、学习成果评估及委员会会议记录加入 Gemini Notebook 作为来源。",
        "在 Gemini Notebook 执行综合提示词，把证据对应至每项准则、列出缺漏，并撰写每项陈述均附出处的报告叙述。",
        "逐一点击出处，对照原始文件核实每项陈述，补齐证据缺漏，然后导出自评报告。"
      ],
      prompt: `请扮演高等教育质量保证总监，按 {{ACCREDITATION_BODY}} 的评审标准，综合 {{PROGRAM_NAME}} 的证据。

此 Notebook 的来源：{{ACCREDITATION_BODY}} 官方标准、一份关于标准近期修订的 Deep Research 简报、课程大纲、学生学习成果评估、教师资料及委员会会议记录。

任务：
1. **交叉对应**：把证据对应至准则一（课程严谨度）及准则二（教师资历），以表格呈现：标准｜证据｜出处（文件、页数）｜强度（充分、部分、欠缺）。
2. **缺漏分析**：列出欠缺的评估数据、过时的课程参考资料及记录不足的学习证据。每项标示为「证据缺漏」，并注明可补足缺漏的文件。
3. **总结叙述**：撰写 500 字正式叙述，总结评审周期内的持续改善措施。

规则：每项事实陈述均须注明出处。如官方标准与 Deep Research 简报不一致，以官方标准为准。绝不编造数字、日期或会议结果。`,
      proTip: "Gemini Notebook 会把每项陈述链接至出处，评审员点击即可查看原始课程大纲或会议记录。请把官方标准文件放在 Notebook 内，避免对应工作只依赖摘要。"
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
        "Generate bilingual riddle clues and quiz cards in Canvas Mode, and digital red packet artwork with Image Generation.",
        "Pilot test the hunt route for student safety and launch the live interactive orientation activity."
      ],
      prompt: `You are the Student Affairs Orientation Director for {{CAMPUS_NAME}}. Design an engaging, digital-physical Cultural Fair Scavenger Hunt celebrating {{FESTIVAL_NAME}}.
Include:
1. **Station Clues**: 5 clever rhyming clues that lead students to iconic campus landmarks (library, student center, amphitheater, botanical garden, sports complex).
2. **Interactive Red Packet QR Challenges**: For each station, design a quick 2-question cultural trivia mini-quiz that unlocks a digital red packet stamp.
3. **Reward Tier Structure**: Outline completion badge rewards and clear redemption instructions to manage crowd flow safely.
Use Canvas to create this as an editable document.`,
      proTip: "Use Image Generation to design digital commemorative red packet graphics and badges that students can collect in their digital portfolios upon station check-in."
    },
    "zh-TW": {
      title: "校園文化祭互動尋寶與數位紅包解謎",
      summary: "結合在地文化節慶，設計融合校園歷史地標的互動式實體與線上打卡闖關解謎遊戲。",
      steps: [
        "規劃校園文化地標打卡動線、節慶文化典故及實體 QR 關卡佈設。",
        "在 Canvas Mode 產出雙語謎語線索及問答卡，並以 Image Generation 製作數位紅包圖樣。",
        "進行實地動線安全測試後，正式上線迎新文化週互動闖關活動。"
      ],
      prompt: `請扮演「{{CAMPUS_NAME}}」學務處迎新活動組長。為慶祝「{{FESTIVAL_NAME}}」策劃一場兼具文化底蘊與校園探索趣味的實體與數位互動尋寶遊戲。
企劃內容：
1. **關卡謎題**：設計 5 則具巧思的押韻線索，引導學生依序探索圖書館、學生活動中心、戶外劇場、生態花園及體育館。
2. **QR 數位紅包挑戰**：每個關卡搭配 2 題節慶文化趣味快問快答，通關即可獲取數位紅包圖章。
3. **獎勵級距與動線規劃**：制定集點兌獎規則及排隊分流安全機制。
請使用 Canvas 將此內容建立為可編輯文件。`,
      proTip: "運用 Image Generation 繪製具校園特色的數位紅包圖騰與紀念徽章，可供學生通關後下載典藏於個人學習歷程中。"
    },
    "zh-CN": {
      title: "校园文化祭互动寻宝与数字红包解谜",
      summary: "结合在地文化节庆，设计融合校园历史地标的互动式实体与线上打卡闯关解谜游戏。",
      steps: [
        "规划校园文化地标打卡动线、节庆文化典故及实体 QR 关卡布设。",
        "在 Canvas Mode 产出双语谜语线索及问答卡，并以 Image Generation 制作数字红包图样。",
        "进行实地动线安全测试后，正式上线迎新文化周互动闯关活动。"
      ],
      prompt: `请扮演“{{CAMPUS_NAME}}”学务处迎新活动组长。为庆祝“{{FESTIVAL_NAME}}”策划一场兼具文化底蕴与校园探索趣味的实体与数字互动寻宝游戏。
企划内容：
1. **关卡谜题**：设计 5 则具巧思的押韵线索，引导学生依序探索图书馆、学生活动中心、户外剧场、生态花园及体育馆。
2. **QR 数字红包挑战**：每个关卡搭配 2 题节庆文化趣味快问快答，通关即可获取数字红包图章。
3. **奖励级距与动线规划**：制定集点兑奖规则及排队分流安全机制。
请使用 Canvas 将此内容创建为可编辑文档。`,
      proTip: "运用 Image Generation 绘制具校园特色的数字红包图腾与纪念徽章，可供学生通关后下载典藏于个人学习历程中。"
    }
  },
  finance_compliance: {
    "en": {
      title: "Student Expense Compliance Auditor",
      summary: "Audit student club reimbursement receipts, invoices, and subsidy claims automatically against university financial regulations.",
      steps: [
        "Create one notebook per claim. Add the university's student organisation financial regulations, then the claim form, receipts and quotations as PDFs.",
        "Run the audit prompt in Gemini Notebook. It checks each receipt line against the regulations and cites the clause for every deduction.",
        "Open each cited clause and receipt to confirm the flags, then send the audit ledger to the society and issue the approved voucher."
      ],
      prompt: `You are the Student Affairs Finance Auditor. Audit the reimbursement claim from {{SOCIETY_NAME}} for the event "{{EVENT_NAME}}", totalling {{CLAIM_AMOUNT}}.

Sources in this notebook: the student organisation financial regulations, plus the claim form, receipts and quotations for this claim.

Audit requirements:
1. **Line-Item Verification**: check each receipt line against the regulations. Cite the clause (document, section) for every rule you apply.
2. **Policy Compliance Check**: flag alcohol, unitemised card slips, tips above the allowed limit, missing quotations above the quotation threshold and any receipt that doesn't match the claim form. Take every limit from the regulations, not from memory.
3. **Missing Evidence**: if a receipt is unreadable or missing, mark the line "Evidence needed" instead of guessing the amount.
4. **Audit Ledger**: a table with Item | Receipt | Claimed | Allowed | Disallowed | Reason and clause, then the totals and a courteous note explaining any deductions and how to appeal.`,
      proTip: "Keep one notebook per claim so receipts from different societies never mix, and use the same regulations file in every notebook so each audit cites the same clauses."
    },
    "zh-TW": {
      title: "社團活動經費報銷合規審核助理",
      summary: "依據校內主計與社團經費管理辦法，自動比對發票單據、明細清單與預算核准額度。",
      steps: [
        "每宗申請建立一個 Notebook，先加入大學的學生組織財務規例，再以 PDF 加入申請表、收據及報價單。",
        "在 Gemini Notebook 執行審核提示詞，逐項核對收據與規例，每項扣減均註明條文。",
        "打開每項引用的條文及收據核實標記，然後把審核明細發給學會，並簽發已批核的報銷憑單。"
      ],
      prompt: `你是學生事務處財務審核員。請審核 {{SOCIETY_NAME}} 就活動「{{EVENT_NAME}}」提交、總額 {{CLAIM_AMOUNT}} 的報銷申請。

此 Notebook 的來源：學生組織財務規例，以及本宗申請的申請表、收據及報價單。

審核要求：
1. **逐項核對**：按規例核對每張收據的每個項目。每條應用的規則均須註明條文（文件、章節）。
2. **合規檢查**：標示酒精飲品、無明細的信用卡簽賬單、超出容許上限的小費、超過報價門檻卻欠缺報價的項目，以及與申請表不符的收據。所有上限必須取自規例，不可憑記憶。
3. **欠缺證明**：如收據無法閱讀或欠缺，將該項標示為「需補交證明」，不要猜測金額。
4. **審核明細**：以表格列出 項目｜收據｜申報金額｜核准金額｜不獲批金額｜原因及條文，再列出總額，並附上禮貌說明，解釋扣減原因及上訴方法。`,
      proTip: "每宗申請使用獨立的 Notebook，不同學會的收據就不會混在一起；每個 Notebook 都使用同一份規例檔案，每次審核便會引用相同條文。"
    },
    "zh-CN": {
      title: "社团活动经费报销合规审核助理",
      summary: "依据校内主计与社团经费管理办法，自动比对发票单据、明细清单与预算核准额度。",
      steps: [
        "每笔申请建立一个 Notebook，先加入大学的学生组织财务规例，再以 PDF 加入申请表、收据及报价单。",
        "在 Gemini Notebook 执行审核提示词，逐项核对收据与规例，每项扣减均注明条文。",
        "打开每项引用的条文及收据核实标记，然后把审核明细发给社团，并签发已批核的报销单。"
      ],
      prompt: `你是学生事务处财务审核员。请审核 {{SOCIETY_NAME}} 就活动「{{EVENT_NAME}}」提交、总额 {{CLAIM_AMOUNT}} 的报销申请。

此 Notebook 的来源：学生组织财务规例，以及本笔申请的申请表、收据及报价单。

审核要求：
1. **逐项核对**：按规例核对每张收据的每个项目。每条应用的规则均须注明条文（文件、章节）。
2. **合规检查**：标示酒精饮品、无明细的信用卡签购单、超出容许上限的小费、超过报价门槛却欠缺报价的项目，以及与申请表不符的收据。所有上限必须取自规例，不可凭记忆。
3. **欠缺证明**：如收据无法阅读或欠缺，将该项标示为「需补交证明」，不要猜测金额。
4. **审核明细**：以表格列出 项目｜收据｜申报金额｜核准金额｜不获批金额｜原因及条文，再列出总额，并附上礼貌说明，解释扣减原因及上诉方法。`,
      proTip: "每笔申请使用独立的 Notebook，不同社团的收据就不会混在一起；每个 Notebook 都使用同一份规例文件，每次审核便会引用相同条文。"
    }
  },
  security_simulator: {
    "en": {
      title: "Campus Safety Drill Simulator",
      summary: "Simulate emergency response scenarios and evaluate campus security decision trees during emergency drill operations.",
      steps: [
        "In Agent Designer, add the emergency protocol handbook, floor plans and evacuation routes under Knowledge › Add files, then paste the drill prompt.",
        "Run a drill with the security team. The Agent presents each phase, checks every decision against the protocol and cites the section.",
        "Use Video Generation for short clips that open each phase, then review the debrief scores and update the handbook where the drill exposed gaps."
      ],
      prompt: `You are the Director of Campus Safety. Run an interactive emergency drill for {{EMERGENCY_SCENARIO}} at {{FACILITY_LOCATION}}.

KNOWLEDGE SOURCES (Agent Designer › Knowledge › Add files)
The campus emergency protocol handbook, floor plans and evacuation routes.

GROUNDING RULES
1. Base every "correct" action on the protocol handbook and cite it as (section, page). Use the floor plans for routes, exits and assembly points.
2. If the handbook doesn't cover a situation, say "Not covered by protocol: flag for review" instead of making up a procedure.
3. This is a training drill. Never present it as a real emergency.

Simulation structure:
1. **Incident Genesis (Minute 0)**: the first emergency call. Offer 3 first-response decisions and wait for the team's choice.
2. **Escalation Phase (Minute 15)**: the situation changes (e.g. a blocked route or crowd panic). Offer tactical options and explain the consequence of the team's choice, citing the protocol.
3. **Containment & Evacuation (Minute 30)**: responder coordination, a safe perimeter and parent/press communication.
4. **Debrief Rubric**: score decision speed, communication clarity, protocol adherence and care for casualties, and list each decision that departed from the protocol with the section it should have followed.`,
      proTip: "Open each phase with a 5-second Video Generation clip (e.g. smoke in a stairwell) to raise the pressure, but keep the protocol handbook as the only source for the right action."
    },
    "zh-TW": {
      title: "校園防救災與重大危安演練模擬",
      summary: "透過動態危機決策樹模擬突發狀況，提升校園安保團隊在各類演練中的即時指揮處置效能。",
      steps: [
        "在 Agent Designer 的 Knowledge › Add files 加入緊急應變手冊、樓層平面圖及疏散路線，然後貼上演習提示詞。",
        "與保安團隊進行演習。Agent 逐一展示每個階段，按應變程序核對每個決定並註明章節。",
        "用 Video Generation 製作每個階段開場的短片段，然後檢視檢討評分，並按演習暴露的不足更新手冊。"
      ],
      prompt: `你是校園安全總監。請為 {{FACILITY_LOCATION}} 發生的 {{EMERGENCY_SCENARIO}} 主持一場互動緊急演習。

知識來源（在 Agent Designer › Knowledge › Add files 加入）
校園緊急應變手冊、樓層平面圖及疏散路線。

引用規則
1. 每個「正確」行動都必須以應變手冊為依據，並註明出處（章節，頁數）。路線、出口及集合點以樓層平面圖為準。
2. 如手冊未有涵蓋某個情況，請說明「應變程序未有涵蓋：需標記檢討」，不要自行編造程序。
3. 這是訓練演習，絕不可當作真實緊急事故。

演習結構：
1. **事故發生（第 0 分鐘）**：接獲第一個緊急來電。提供 3 個首要應變決定，並等待團隊選擇。
2. **情況升級（第 15 分鐘）**：情況變化（例如路線受阻或人群恐慌）。提供戰術選項，並引用應變程序解釋團隊選擇的後果。
3. **控制及疏散（第 30 分鐘）**：協調救援人員、設立安全範圍，以及與家長及傳媒溝通。
4. **檢討評分準則**：就決策速度、溝通清晰度、遵從程序及照顧傷者評分，並列出每個偏離程序的決定及應遵從的章節。`,
      proTip: "每個階段開始時播放一段 5 秒的 Video Generation 短片（例如樓梯間冒煙）以增加壓力，但正確行動只以應變手冊為準。"
    },
    "zh-CN": {
      title: "校园防救灾与重大危安演练模拟",
      summary: "透过动态危机决策树模拟突发状况，提升校园安保团队在各类演练中的即时指挥处置效能。",
      steps: [
        "在 Agent Designer 的 Knowledge › Add files 加入紧急应变手册、楼层平面图及疏散路线，然后贴上演习提示词。",
        "与安保团队进行演习。Agent 逐一展示每个阶段，按应变程序核对每个决定并注明章节。",
        "用 Video Generation 制作每个阶段开场的短视频片段，然后检视检讨评分，并按演习暴露的不足更新手册。"
      ],
      prompt: `你是校园安全总监。请为 {{FACILITY_LOCATION}} 发生的 {{EMERGENCY_SCENARIO}} 主持一场互动紧急演习。

知识来源（在 Agent Designer › Knowledge › Add files 加入）
校园紧急应变手册、楼层平面图及疏散路线。

引用规则
1. 每个「正确」行动都必须以应变手册为依据，并注明出处（章节，页数）。路线、出口及集合点以楼层平面图为准。
2. 如手册未有涵盖某个情况，请说明「应变程序未有涵盖：需标记检讨」，不要自行编造程序。
3. 这是训练演习，绝不可当作真实紧急事故。

演习结构：
1. **事故发生（第 0 分钟）**：接获第一个紧急来电。提供 3 个首要应变决定，并等待团队选择。
2. **情况升级（第 15 分钟）**：情况变化（例如路线受阻或人群恐慌）。提供战术选项，并引用应变程序解释团队选择的后果。
3. **控制及疏散（第 30 分钟）**：协调救援人员、设立安全范围，以及与家长及媒体沟通。
4. **检讨评分准则**：就决策速度、沟通清晰度、遵从程序及照顾伤者评分，并列出每个偏离程序的决定及应遵从的章节。`,
      proTip: "每个阶段开始时播放一段 5 秒的 Video Generation 短视频（例如楼梯间冒烟）以增加压力，但正确行动只以应变手册为准。"
    }
  },
  special_consideration_workflow: {
    "en": SPECIAL_CONSIDERATION_EN,
    "zh-TW": {
      title: "特殊考量申請工作流程 Agent",
      summary: "只向前執行的 Agent Designer 工作流程：學生的特殊考量申請表存入收件資料夾後即自動啟動。Agent 閱讀申請表、按政策核對證明文件、分流個案並草擬回覆，每份草稿均由職員批准或拒絕。",
      steps: [
        "以輔助提示詞草擬證明文件規則表、決定信範本及一份學生申請表樣本。在 Agent Designer 把政策、規則表及範本附加為 Agent 節點的知識來源 (Knowledge Sources)，並設定存放學生申請表的 Google Drive 收件資料夾，以 Drive Connector 連接。",
        "建立只向前執行的工作流程，當收件資料夾有新申請表時自動啟動：Agent 閱讀申請表、按政策核對證明文件，再把個案分流至要求補交文件、標準決定信或上報摘要。上載申請表樣本以測試每條分支。",
        "職員批准或拒絕每份草稿。批准後輸出最終信件及記錄行，可直接發出；拒絕則以記錄行結案，方便職員跟進。"
      ],
      prompt: `你是「{{INSTITUTION_NAME}}」{{OFFICE_NAME}}的特殊考量工作流程 Agent，負責處理學生的延期交功課、延期考試及休學申請。流程只會向前執行，每份申請執行一次：不可返回較早的步驟，亦絕不可自行向學生發出任何內容。

知識來源（在 Agent Designer 介面附加至各 Agent 節點）
特殊考量政策、證明文件規則表及決定信範本。

步驟 1 · 觸發（Drive Connector：資料夾新增檔案）
當有新申請表上載至「{{INTAKE_FOLDER}}」Google Drive 資料夾（由 Drive Connector 監察）時，流程會自動啟動，每個新檔案啟動一次。如檔案並非申請表，則不予處理。

步驟 2 · 閱讀申請表（Agent 節點）
閱讀新檔案中的申請表，擷取：申請編號、學生姓名、學生編號、課程、科目編號、受影響的評核、申請類別（延期交功課 | 延期考試 | 休學）、原因類別（醫療 | 恩恤 | 個人 | 其他）、受影響日期、申請日數、學生陳述、列出或附上的證明文件（類別、日期及簽發者），以及本學期較早前的申請次數。

步驟 3 · 核對證明文件及政策（Agent 節點）
按證明文件規則及政策核對申請表。輸出：證明文件狀態（齊全 | 欠缺）、欠缺項目或未填的必填欄位、風險標記及適用的政策條文。

步驟 4 · 分流（條件節點）
- 如證明文件狀態為「欠缺」 → 轉至步驟 5A。
- 否則，如符合以下任何一項 → 轉至步驟 5C：申請日數超過 {{AUTO_LIMIT_DAYS}} 日；日期與期末考試重疊；陳述提及人身安全、精神健康或福利問題；學生本學期已是第三次或以上申請；政策中沒有適用的標準規則。
- 其他情況 → 轉至步驟 5B。

步驟 5A · 要求補交文件（Agent 節點）
以「需補交證明文件」範本草擬一封簡短有禮的電郵，列明欠缺的文件。狀態：「等待文件」。

步驟 5B · 標準決定（Agent 節點）
以相應範本草擬決定信，並引用適用的政策條文。狀態：「待審核」。

步驟 5C · 上報摘要（Agent 節點）
撰寫一頁個案摘要：概要、時序、證明文件清單、適用政策條文、建議方案及其利弊，以及觸發上報的標記；再按建議方案草擬決定信。狀態：「需職員決定」。如有福利標記，加上：「請於今天聯絡學生福利組 {{WELFARE_EMAIL}}。」

步驟 5A、5B 及 5C 均向前進入步驟 6。

步驟 6 · 人工審核（審批節點：批准或拒絕）
向審核職員展示草稿、擷取的申請資料、步驟 3 的核對結果及申請表檔案名稱。職員作出選擇前，一切內容均未定案。
- 如批准 → 轉至步驟 7A。
- 如拒絕 → 轉至步驟 7B。

步驟 7A · 定案（Agent 節點）
輸出已批准的信件或電郵全文，供職員直接發給學生；另輸出一行記錄：日期、申請編號、學生編號、分流路徑（要求補交文件 | 標準 | 上報）、審核職員、結果「已批准」。

步驟 7B · 退回結案（Agent 節點）
不輸出信件。輸出一行記錄，結果為「已拒絕，退回職員」，並附一句說明職員需跟進的事項。如學生其後把補交文件或更正後的申請表上載至資料夾，該檔案會啟動新一輪流程。

規則：每項決定都必須以知識來源為依據並引用條文。不可診斷病情，亦不可在政策規則以外評價證明文件。學生資料必須保密。`,
      proTip: "正式啟用前請測試每條分支：用申請表樣本輔助提示詞製作一份齊全的申請表、一份欠缺證明文件的申請表及一份帶福利標記的申請表，逐一上載至收件資料夾，確認分流正確。",
      connectorGuide: {
        name: "Drive Connector",
        steps: [
          "請 Gemini Enterprise 管理員為院校的 Google Drive 啟用 Drive Connector。",
          "在 Google Drive 建立共用收件資料夾存放學生申請表，只與負責此工作流程的職員共用。",
          "在 Agent Designer 把工作流程觸發設定為「資料夾新增檔案」，並透過 Drive Connector 選擇收件資料夾。",
          "把申請表樣本上載至資料夾，確認每份都會啟動流程並進入正確分支。"
        ]
      }
    },
    "zh-CN": {
      title: "特殊考量申请工作流程 Agent",
      summary: "只向前执行的 Agent Designer 工作流程：学生的特殊考量申请表存入收件文件夹后即自动启动。Agent 阅读申请表、按政策核对证明材料、分流个案并草拟回复，每份草稿均由职员批准或拒绝。",
      steps: [
        "以辅助提示词草拟证明材料规则表、决定函模板及一份学生申请表样本。在 Agent Designer 把政策、规则表及模板附加为 Agent 节点的知识来源 (Knowledge Sources)，并设置存放学生申请表的 Google Drive 收件文件夹，以 Drive Connector 连接。",
        "建立只向前执行的工作流程，当收件文件夹有新申请表时自动启动：Agent 阅读申请表、按政策核对证明材料，再把个案分流至要求补交材料、标准决定函或上报摘要。上传申请表样本以测试每条分支。",
        "职员批准或拒绝每份草稿。批准后输出最终信函及记录行，可直接发出；拒绝则以记录行结案，方便职员跟进。"
      ],
      prompt: `你是“{{INSTITUTION_NAME}}”{{OFFICE_NAME}}的特殊考量工作流程 Agent，负责处理学生的作业延期、缓考及休学申请。流程只会向前执行，每份申请执行一次：不可返回较早的步骤，也绝不可自行向学生发出任何内容。

知识来源（在 Agent Designer 界面附加至各 Agent 节点）
特殊考量政策、证明材料规则表及决定函模板。

步骤 1 · 触发（Drive Connector：文件夹新增文件）
当有新申请表上传至“{{INTAKE_FOLDER}}”Google Drive 文件夹（由 Drive Connector 监控）时，流程会自动启动，每个新文件启动一次。如文件并非申请表，则不予处理。

步骤 2 · 阅读申请表（Agent 节点）
阅读新文件中的申请表，提取：申请编号、学生姓名、学号、专业、课程编号、受影响的考核、申请类别（作业延期 | 缓考 | 休学）、原因类别（医疗 | 恩恤 | 个人 | 其他）、受影响日期、申请天数、学生陈述、列出或附上的证明材料（类别、日期及出具单位），以及本学期较早前的申请次数。

步骤 3 · 核对证明材料及政策（Agent 节点）
按证明材料规则及政策核对申请表。输出：证明材料状态（齐全 | 缺失）、缺失项目或未填的必填字段、风险标记及适用的政策条文。

步骤 4 · 分流（条件节点）
- 如证明材料状态为“缺失” → 转至步骤 5A。
- 否则，如符合以下任何一项 → 转至步骤 5C：申请天数超过 {{AUTO_LIMIT_DAYS}} 天；日期与期末考试重叠；陈述提及人身安全、心理健康或福利问题；学生本学期已是第三次或以上申请；政策中没有适用的标准规则。
- 其他情况 → 转至步骤 5B。

步骤 5A · 要求补交材料（Agent 节点）
以“需补交证明材料”模板草拟一封简短有礼的邮件，列明缺少的材料。状态：“等待材料”。

步骤 5B · 标准决定（Agent 节点）
以相应模板草拟决定函，并引用适用的政策条文。状态：“待审核”。

步骤 5C · 上报摘要（Agent 节点）
撰写一页个案摘要：概要、时间线、证明材料清单、适用政策条文、建议方案及其利弊，以及触发上报的标记；再按建议方案草拟决定函。状态：“需职员决定”。如有福利标记，加上：“请于今天联系学生福利组 {{WELFARE_EMAIL}}。”

步骤 5A、5B 及 5C 均向前进入步骤 6。

步骤 6 · 人工审核（审批节点：批准或拒绝）
向审核职员展示草稿、提取的申请资料、步骤 3 的核对结果及申请表文件名称。职员作出选择前，一切内容均未定案。
- 如批准 → 转至步骤 7A。
- 如拒绝 → 转至步骤 7B。

步骤 7A · 定案（Agent 节点）
输出已批准的信函或邮件全文，供职员直接发给学生；另输出一行记录：日期、申请编号、学号、分流路径（要求补交材料 | 标准 | 上报）、审核职员、结果“已批准”。

步骤 7B · 退回结案（Agent 节点）
不输出信函。输出一行记录，结果为“已拒绝，退回职员”，并附一句说明职员需跟进的事项。如学生其后把补交材料或更正后的申请表上传至文件夹，该文件会启动新一轮流程。

规则：每项决定都必须以知识来源为依据并引用条文。不可诊断病情，也不可在政策规则以外评价证明材料。学生信息必须保密。`,
      proTip: "正式启用前请测试每条分支：用申请表样本辅助提示词制作一份齐全的申请表、一份缺少证明材料的申请表及一份带福利标记的申请表，逐一上传至收件文件夹，确认分流正确。",
      connectorGuide: {
        name: "Drive Connector",
        steps: [
          "请 Gemini Enterprise 管理员为院校的 Google Drive 启用 Drive Connector。",
          "在 Google Drive 创建共享收件文件夹存放学生申请表，只与负责此工作流程的职员共享。",
          "在 Agent Designer 把工作流程触发设置为“文件夹新增文件”，并通过 Drive Connector 选择收件文件夹。",
          "把申请表样本上传至文件夹，确认每份都会启动流程并进入正确分支。"
        ]
      }
    }
  },
  scholarship_application_workflow: {
    "en": SCHOLARSHIP_COACH_EN,
    "zh-TW": {
      title: "獎學金申請教練工作流程 Agent",
      summary: "為一份獎學金申請而設、只向前執行的 Agent Designer 工作流程。你填寫啟動表格後，Agent 會檢查你的資格，再為你規劃故事或為草稿評分；結果經導師批准或拒絕後，你才按此行動。",
      steps: [
        "以輔助提示詞整理獎學金章程摘要及個人經歷庫。在 Agent Designer 把獎學金章程及評選準則附加為 Agent 節點的知識來源 (Knowledge Sources)，並加入一份啟動表格，設有個人資料、經歷庫及陳述草稿的文字欄位。",
        "建立只向前執行的工作流程：Agent 檢查資格後，把你分流至不符資格說明、向獎學金辦事處查詢的問題、故事規劃（尚未有草稿）或草稿評分表。個人陳述由你自己在 Canvas Mode 撰寫，再貼上表格。",
        "導師批准或拒絕每份故事規劃或評分表。批准後你會得到下一步清單或最終提交清單；拒絕則退回導師意見。每份新草稿都會啟動新一輪流程，申請由你自己提交。"
      ],
      prompt: `你是「{{INSTITUTION_NAME}}」學生的獎學金教練 Agent，協助一名學生申請「{{SCHOLARSHIP_NAME}}」（截止日期：{{DEADLINE}}）。你的角色是教練：提交的每一個字都由學生親自撰寫並負責。流程只會向前執行，每份表格執行一次：不可返回較早的步驟，亦不可暫停等待回覆。每份新草稿都會啟動新一輪流程。

知識來源（在 Agent Designer 介面附加至各 Agent 節點）
「{{SCHOLARSHIP_NAME}}」的獎學金章程、評選準則及任何官方寫作指引。

步驟 1 · 觸發（手動觸發：啟動表格）
學生填寫表格以啟動流程，只可輸入或貼上文字：姓名、課程、年級、GPA、居民身份、課外活動及獎項（或個人經歷庫）、經濟需要陳述（如獎學金要求）、個人陳述草稿（第一次執行可留空）及導師姓名。

步驟 2 · 個人資料表（Agent 節點）
把表格內容整理成一頁個人資料表，並列出任何留空的必填欄位。

步驟 3 · 資格檢查（Agent 節點）
將個人資料與獎學金章程中每項硬性要求比對（年級、GPA、居民身份、課程、所需文件）。輸出：資格（符合 | 不符合 | 不清楚）、每項要求的結果（達到、未達到或不清楚）及出處條文。

步驟 4 · 分流（條件節點）
- 如資格為「不符合」 → 轉至步驟 5A。
- 否則，如資格為「不清楚」 → 轉至步驟 5B。
- 否則，如個人陳述草稿欄位留空 → 轉至步驟 5C。
- 其他情況 → 轉至步驟 5D。

步驟 5A · 不符資格說明（Agent 節點）
以淺白語言說明未達到哪一項要求，並建議最多 3 類可留意的類近獎學金。流程於此結束。

步驟 5B · 向獎學金辦事處查詢的問題（Agent 節點）
列出學生應向獎學金辦事處查詢的具體問題，並註明每條問題釐清哪一項要求。流程於此結束。辦事處回覆後，學生把答案加進表格，再啟動新一輪流程。

步驟 5C · 故事規劃（Agent 節點）
把學生的經歷對應到每項評選準則，提出 2 個故事角度，每個附 5 部分大綱及 3 條引導問題，供撰寫不多於 {{WORD_LIMIT}} 字的陳述之用。不可代寫陳述。

步驟 5D · 草稿評分表（Agent 節點）
按每項評選準則為貼上的草稿評 1 至 5 分，每個分數附一句證據。凡低於 4 分的準則，提供最多 3 個具體修改建議。核對字數是否符合 {{WORD_LIMIT}} 字的上限，並標示任何可能違反獎學金對使用 AI 規定的內容。不可改寫陳述。

步驟 5C 及 5D 均向前進入步驟 6。

步驟 6 · 導師審閱（審批節點：批准或拒絕）
審閱人：學生的導師或學業顧問（{{MENTOR_EMAIL}}）。展示個人資料表、步驟 3 的資格檢查，以及步驟 5C 的故事規劃或步驟 5D 的評分表。導師作出選擇前，任何內容都不會作為定案交給學生。
- 如批准 → 轉至步驟 7A。
- 如拒絕 → 轉至步驟 7B。

步驟 7A · 下一步（Agent 節點）
- 如流程來自步驟 5D，而且每項準則均達 4 分或以上 → 輸出提交清單：文件、字數、推薦人資料、檔案名稱及 {{DEADLINE}} 截止日期提示，並提醒學生親自提交申請。
- 其他情況 → 把已批准的故事規劃或修改建議整理成簡短待辦清單，最後加上：「下一份草稿完成後，請把它貼上表格，啟動新一輪流程。」

步驟 7B · 導師退回（Agent 節點）
不輸出提交清單。輸出一段簡短說明，表示導師要求修改，並附上導師意見（如有），提醒學生修改後啟動新一輪流程。

規則：絕不可虛構成就或成績。絕不可代學生撰寫整篇陳述。資格判斷只可以知識來源為依據並引用條文。`,
      proTip: "動筆前先執行一次流程取得故事規劃，之後每份新草稿再執行一次。讓導師擔任審批人，確保每份規劃及評分表在你行動前都經過真人把關。"
    },
    "zh-CN": {
      title: "奖学金申请教练工作流程 Agent",
      summary: "为一份奖学金申请而设、只向前执行的 Agent Designer 工作流程。你填写启动表单后，Agent 会检查你的资格，再为你规划故事或为草稿评分；结果经导师批准或拒绝后，你才按此行动。",
      steps: [
        "以辅助提示词整理奖学金章程摘要及个人经历库。在 Agent Designer 把奖学金章程及评选标准附加为 Agent 节点的知识来源 (Knowledge Sources)，并加入一份启动表单，设有个人资料、经历库及陈述草稿的文本字段。",
        "建立只向前执行的工作流程：Agent 检查资格后，把你分流至不符资格说明、向奖学金办公室咨询的问题、故事规划（尚未有草稿）或草稿评分表。个人陈述由你自己在 Canvas Mode 撰写，再粘贴到表单。",
        "导师批准或拒绝每份故事规划或评分表。批准后你会得到下一步清单或最终提交清单；拒绝则退回导师意见。每份新草稿都会启动新一轮流程，申请由你自己提交。"
      ],
      prompt: `你是“{{INSTITUTION_NAME}}”学生的奖学金教练 Agent，协助一名学生申请“{{SCHOLARSHIP_NAME}}”（截止日期：{{DEADLINE}}）。你的角色是教练：提交的每一个字都由学生亲自撰写并负责。流程只会向前执行，每份表单执行一次：不可返回较早的步骤，也不可暂停等待回复。每份新草稿都会启动新一轮流程。

知识来源（在 Agent Designer 界面附加至各 Agent 节点）
“{{SCHOLARSHIP_NAME}}”的奖学金章程、评选标准及任何官方写作指引。

步骤 1 · 触发（手动触发：启动表单）
学生填写表单以启动流程，只可输入或粘贴文本：姓名、专业、年级、GPA、户籍或居民身份、课外活动及奖项（或个人经历库）、经济需要陈述（如奖学金要求）、个人陈述草稿（第一次执行可留空）及导师姓名。

步骤 2 · 个人资料表（Agent 节点）
把表单内容整理成一页个人资料表，并列出任何留空的必填字段。

步骤 3 · 资格检查（Agent 节点）
将个人资料与奖学金章程中每项硬性要求比对（年级、GPA、户籍或居民身份、专业、所需材料）。输出：资格（符合 | 不符合 | 不清楚）、每项要求的结果（达到、未达到或不清楚）及出处条文。

步骤 4 · 分流（条件节点）
- 如资格为“不符合” → 转至步骤 5A。
- 否则，如资格为“不清楚” → 转至步骤 5B。
- 否则，如个人陈述草稿字段留空 → 转至步骤 5C。
- 其他情况 → 转至步骤 5D。

步骤 5A · 不符资格说明（Agent 节点）
用浅白语言说明未达到哪一项要求，并推荐最多 3 类可留意的类似奖学金。流程于此结束。

步骤 5B · 向奖学金办公室咨询的问题（Agent 节点）
列出学生应向奖学金办公室咨询的具体问题，并注明每个问题澄清哪一项要求。流程于此结束。办公室回复后，学生把答案加进表单，再启动新一轮流程。

步骤 5C · 故事规划（Agent 节点）
把学生的经历对应到每项评选标准，提出 2 个故事角度，每个附 5 部分大纲及 3 个引导问题，供撰写不超过 {{WORD_LIMIT}} 字的陈述之用。不可代写陈述。

步骤 5D · 草稿评分表（Agent 节点）
按每项评选标准为粘贴的草稿打 1 至 5 分，每个分数附一句证据。凡低于 4 分的标准，提供最多 3 条具体修改建议。核对字数是否符合 {{WORD_LIMIT}} 字的上限，并标出任何可能违反奖学金对使用 AI 规定的内容。不可改写陈述。

步骤 5C 及 5D 均向前进入步骤 6。

步骤 6 · 导师审阅（审批节点：批准或拒绝）
审阅人：学生的导师或学业顾问（{{MENTOR_EMAIL}}）。展示个人资料表、步骤 3 的资格检查，以及步骤 5C 的故事规划或步骤 5D 的评分表。导师作出选择前，任何内容都不会作为定稿交给学生。
- 如批准 → 转至步骤 7A。
- 如拒绝 → 转至步骤 7B。

步骤 7A · 下一步（Agent 节点）
- 如流程来自步骤 5D，而且每项标准均达 4 分或以上 → 输出提交清单：材料、字数、推荐人信息、文件名称及 {{DEADLINE}} 截止日期提醒，并提醒学生亲自提交申请。
- 其他情况 → 把已批准的故事规划或修改建议整理成简短待办清单，最后加上：“下一份草稿完成后，请把它粘贴到表单，启动新一轮流程。”

步骤 7B · 导师退回（Agent 节点）
不输出提交清单。输出一段简短说明，表示导师要求修改，并附上导师意见（如有），提醒学生修改后启动新一轮流程。

规则：绝不可虚构成就或成绩。绝不可代学生撰写整篇陈述。资格判断只可以知识来源为依据并引用条文。`,
      proTip: "动笔前先执行一次流程获取故事规划，之后每份新草稿再执行一次。让导师担任审批人，确保每份规划及评分表在你行动前都经过真人把关。"
    }
  }
};

// Application State
const appState = {
  userRole: null, // legacy: only used for the admin Quest Run preview (?role=)
  userCategories: [], // audience categories assigned by an admin (lib/categories.js ids); [] = sees no playbooks
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
    const admL = document.getElementById("adminLang");
    if (navL) navL.value = newLang;
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
  const admL = document.getElementById("adminLang");
  if (navL) navL.addEventListener("change", handleLanguageChange);
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
  safeSetText("wizardSubtitle", t.wizardSubtitle);

  // Results headline ("{n} playbooks for you") is computed in renderUseCases()

  // Category filter options + category checklists carry localised labels
  renderCategoryFilterOptions();
  refreshCategoryChecklistLabels();

  // Update the avatar-menu context line and document title immediately
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
    safeSetText("adminCrudThCategory", t.adminCrudThCategories);
    safeSetText("adminCrudThRole", t.adminCrudThCreator);
    safeSetText("adminCrudThActions", t.adminCrudThActions);

    // Form labels inside modal
    safeSetText("adminFormLabelId", t.adminFormLabelId);
    safeSetText("adminFormLabelTitle", t.adminFormLabelTitle);
    safeSetText("adminFormLabelSummary", t.adminFormLabelSummary);
    safeSetText("adminFormLabelDualModeCheckbox", t.adminFormLabelDualModeCheckbox);
    safeSetText("adminFormDescDualModeCheckbox", t.adminFormDescDualModeCheckbox);
    safeSetText("adminFormLabelFeatures", t.adminFormLabelFeatures);
    safeSetText("adminFormLabelConnectors", t.adminFormLabelConnectors);
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

// Avatar-menu context line: the user's category labels (admins previewing see "Admin preview").
function updateSidebarContextUI() {
  const t = tr();
  const el = document.getElementById("profileCategoryNames");

  if (appState.isAdmin === true) {
    document.title = "Admin View";
    if (el) el.textContent = t.adminPreviewContext;
    return;
  }

  document.title = "Gemini Enterprise - Edu Portal";
  if (el) {
    el.textContent = appState.userCategories.length
      ? appState.userCategories.map(id => categoryLabel(id)).join(" · ")
      : t.noCategoriesShort;
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
 *   research → Gemini Notebook, Deep Research (green)
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

  // No categories assigned yet: nothing to filter, so explain who can fix it instead of offering "Reset filters"
  const noCategories = appState.isAdmin !== true && !(appState.userCategories || []).length;
  container.innerHTML = noCategories
    ? `<div class="empty-state" id="noCategoriesState">
         <span class="material-symbols-outlined" aria-hidden="true">lock_person</span>
         <h3>${escapeHtml(t.noCategoriesTitle)}</h3>
         <p>${escapeHtml(t.noCategoriesDesc)}</p>
       </div>`
    : list.length
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
    // An empty list is a real answer (a user with no matching categories), so it replaces the local seeds too
    if (Array.isArray(data)) {
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
        // Set up prompts live in the DB (admin-editable); {} means "none", null means "never set"
        if (uc.helperPrompts && typeof uc.helperPrompts === "object") {
          useCaseHelperPrompts[uc.id] = uc.helperPrompts;
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

  // Reset display status
  ["loginCard", "resetCard", "forgotCard", "setPasswordCard"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // Restore filter + sort values from sessionStorage before the first render
  appState.activeFilterCategory = sessionStorage.getItem("ge_active_category") || "all";
  // "NotebookLM" was renamed "Gemini Notebook"; map a filter value saved by an older session
  const savedFeature = sessionStorage.getItem("ge_active_feature");
  appState.activeFilterFeature = savedFeature === "NotebookLM" ? "Gemini Notebook" : (savedFeature || "all");
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
        ["navLang", "adminLang"].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = appState.activeLanguage;
        });
        // Standard users see playbooks for their admin-assigned categories; admin previews see every category
        appState.userCategories = auth.user.isAdmin ? CategoryCore.CATEGORY_IDS.slice() : normalizeUserCategories(auth.user.categories);
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
        } else {
          // No profile step any more: categories come from the admin, so go straight to the portal
          await enterUserPortal();
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

    // After the forced reset the user goes straight into the portal (no profile step: admins assign categories)
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
        await enterUserPortal();
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

/** Pure: session categories -> valid, ordered ids (CategoryCore.normalizeCategories). */
const normalizeUserCategories = (cats) => CategoryCore.normalizeCategories(cats || []);

/**
 * Shows the learning portal for a signed-in standard user. Re-reads the session so categories assigned by an
 * admin (or changed since sign-in) apply, then loads only the playbooks visible to those categories.
 */
async function enterUserPortal() {
  try {
    const auth = await (await fetch("/api/auth/session")).json();
    if (auth.loggedIn && !auth.user.isAdmin) appState.userCategories = normalizeUserCategories(auth.user.categories);
  } catch (_) { /* keep whatever the caller already set */ }
  document.getElementById("wizardOverlay").style.display = "none";
  updateUILanguage();
  updateSidebarContextUI();
  await loadUseCasesFromServer();
  renderUseCases();
  mountQuestRun();
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
  mountCategoryChecklist("addUserCategories", "addUserCat", []);
  formAddUser.onsubmit = async (e) => {
    e.preventDefault();
    const t = tr();
    const email = document.getElementById("inputNewUserEmail").value.trim();
    const categories = readCategoryChecklist("addUserCat");
    const feedback = document.getElementById("userActionFeedback");
    if (!email) return;
    const btn = document.getElementById("adminBtnProvision");
    if (btn) btn.disabled = true;
    const { ok, data } = await apiJson('/api/admin/users', { method: 'POST', body: { email, categories } });
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
        categories: uc.categories || [],
        creator: uc.creator || null,
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
          // Older exports carry a legacy `category` / `role` instead of `categories`; both normalise.
          const importCats = CategoryCore.normalizeCategories(
            (uc.categories && uc.categories.length) ? uc.categories : [uc.category, uc.role].filter(Boolean));
          if (!uc.id || !uc.title || !importCats.length) {
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
              categories: importCats,
              creator: uc.creator || null,
              title: uc.title,
              summary: uc.summary || "",
              features: uc.features || [],
              connectors: uc.connectors || [],
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


// Admin Tab 1: Load users table (6 columns: email, GE app link, categories, status, created, actions)
async function loadAdminUsers() {
  const tbody = document.getElementById("adminUsersTableBody");
  if (!tbody) return;
  const t = tr();
  const emptyRow = (text, cls = "") => `<tr><td colspan="6" class="table-empty ${cls}">${escapeHtml(text)}</td></tr>`;
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
      <td><div class="cat-chips">${(u.categories || []).length ? categoryChipsHtml(u.categories) : `<span class="muted">${escapeHtml(t.noCategoriesShort)}</span>`}</div></td>
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

    // Most liked playbooks: rank, title, category chips, idea provider, like count
    const t = tr();
    const leaderboardContainer = document.getElementById("adminMostLikedList");
    if (leaderboardContainer && data.mostLiked) {
      leaderboardContainer.innerHTML = data.mostLiked.length
        ? data.mostLiked.map((item, index) => `
          <div class="liked-row">
            <span class="lb-rank" data-rank="${index + 1}">${index + 1}</span>
            <div class="liked-info">
              <div class="liked-title">${escapeHtml(item.title)}</div>
              <div class="liked-meta">
                ${categoryChipsHtml(item.categories)}
                <span class="card-creator${item.creator ? "" : " is-default"}">${escapeHtml(creatorLabel(item, t))}</span>
              </div>
            </div>
            <span class="liked-count"><span class="material-symbols-outlined" aria-hidden="true">favorite</span>${Number(item.likes_count) || 0}</span>
          </div>`).join("")
        : `<p class="lb-empty">${escapeHtml(t.noLikesYet)}</p>`;
    }

    // Idea provider dashboard (has its own timeframe select)
    const rangeEl = document.getElementById("creatorRange");
    if (rangeEl && !rangeEl.dataset.bound) {
      rangeEl.dataset.bound = "1";
      rangeEl.onchange = () => loadCreatorStats(rangeEl.value);
    }
    loadCreatorStats(rangeEl ? rangeEl.value : "all");
  } catch (error) {
    console.error("Failed to load statistics:", error);
  }
}

/** Ordered leaderboard items -> <li> markup. `unit` formats the count (e.g. "{n} views"). Pure. */
const leaderboardHtml = (items, unit, emptyText) => (items && items.length)
  ? items.map((it, i) => `
      <li class="lb-item">
        <span class="lb-rank" data-rank="${i + 1}">${i + 1}</span>
        <span class="lb-name" title="${escapeHtml(it.creator)}">${escapeHtml(it.creator)}</span>
        <span class="lb-count">${escapeHtml(fmt(unit, { n: Number(it.count) || 0 }))}</span>
      </li>`).join("")
  : `<li class="lb-empty">${escapeHtml(emptyText)}</li>`;

/**
 * Idea provider dashboard. `range` is all | 1m | 3m | 6m; the server windows playbook creation
 * dates (providers) and view / like events (views, likes). Default playbooks (no creator) are excluded.
 */
async function loadCreatorStats(range = "all") {
  const t = tr();
  const { ok, data } = await apiJson(`/api/admin/stats/creators?range=${encodeURIComponent(range)}`);
  const setNum = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = Number(v) || 0; };
  const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  if (!ok) { setHtml("lbProviders", `<li class="lb-empty is-error">${escapeHtml(errText(data))}</li>`); return; }
  const sum = data.summary || {};
  setNum("creatorSumCommunity", sum.communityPlaybooks);
  setNum("creatorSumCreators", sum.creators);
  setNum("creatorSumConverted", sum.convertedFeedbacks);
  setNum("creatorSumDefault", sum.defaultPlaybooks);
  setHtml("lbProviders", leaderboardHtml(data.providers, t.lbUnitPlaybooks, t.lbEmpty));
  setHtml("lbViews", leaderboardHtml(data.views, t.lbUnitViews, t.lbEmpty));
  setHtml("lbLikes", leaderboardHtml(data.likes, t.lbUnitLikes, t.lbEmpty));
  const top = data.topCases || [];
  setHtml("lbTopCases", top.length
    ? top.map(c => `<tr>
        <td class="cell-strong">${escapeHtml(c.title)}</td>
        <td>${escapeHtml(c.creator || "")}</td>
        <td>${Number(c.views) || 0}</td>
        <td>${Number(c.likes) || 0}</td>
      </tr>`).join("")
    : `<tr><td colspan="4" class="table-empty">${escapeHtml(t.lbEmpty)}</td></tr>`);
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

// Admin Tab 3: Load Use Cases CRUD (7 columns: check, infographic, ID, title, categories, idea provider, actions)
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
      <td><div class="cat-chips">${categoryChipsHtml(uc.categories)}</div></td>
      <td class="${uc.creator ? "" : "muted"}">${escapeHtml(uc.creator || t.defaultPlaybook)}</td>
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

/**
 * Opens the playbook form. `opts` is used by the feedback conversion flow:
 *   sourceFeedback {id, text, userEmail} - links the saved playbook back to that feedback
 *   instruction    - prefilled Gemini instruction
 *   creator        - initial idea provider (create mode)
 *   autoDraft      - run the Gemini draft immediately after opening
 */
function openAdminEditModal(uc, opts = {}) {
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

  // Categories checklist + idea provider (mounted before the disable pass below)
  mountCategoryChecklist("formCaseCategories", "formCaseCat", uc ? (uc.categories || []) : []);
  const creatorInput = document.getElementById("formCaseCreator");
  creatorInput.value = uc ? (uc.creator || "") : (opts.creator || "");
  const source = opts.sourceFeedback || null;
  appState.caseFormSourceFeedback = source;
  const authorBtn = document.getElementById("btnUseFeedbackAuthor");
  authorBtn.hidden = !(source && source.userEmail) || isAssist;
  authorBtn.onclick = () => { creatorInput.value = source.userEmail; };

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

    document.getElementById("formCaseTitle").value = uc.title || "";
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

    // Clear all form text inputs
    document.getElementById("formCaseTitle").value = opts.suggestedTitle || "";
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

  // V7: Set up helper prompts (DB value, else the static seed list for this id)
  const storedHelpers = uc ? (uc.helperPrompts || useCaseHelperPrompts[uc.id] || {}) : {};
  renderCaseHelperFields(helpersToRows(storedHelpers), isAssist);

  const instructionEl = document.getElementById("formCaseGeminiInstruction");
  if (instructionEl) instructionEl.value = opts.instruction || "";

  modal.classList.add("active");
  if (opts.autoDraft && !isAssist) triggerGeminiPlaybookGeneration();
}

async function saveAdminUseCase() {
  if (appState.isAssist) {
    alert(tr().caseAssistReadonly);
    return;
  }
  const feedback = document.getElementById("adminFormFeedback");
  feedback.style.display = "none";

  const id = document.getElementById("formCaseId").value.trim();
  const categories = readCategoryChecklist("formCaseCat");
  const title = document.getElementById("formCaseTitle").value.trim();
  const creator = document.getElementById("formCaseCreator").value.trim();
  const summary = document.getElementById("formCaseSummary").value.trim();
  const stepsRaw = document.getElementById("formCaseSteps").value;
  const prompt = document.getElementById("formCasePrompt").value.trim();
  const proTip = document.getElementById("formCaseProTip").value.trim();

  if (!id || !title) {
    feedback.textContent = tr().caseFormRequired;
    feedback.style.display = "block";
    return;
  }
  if (!categories.length) {
    feedback.textContent = tr().caseFormNeedCategory;
    feedback.style.display = "block";
    feedback.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const steps = stepsRaw.split("\n").map(s => s.trim()).filter(s => s.length > 0);

  // Compile Features
  const features = [];
  document.querySelectorAll("input[name='formFeatures']:checked").forEach(b => features.push(b.value));

  // Compile Connectors
  const connectors = [];
  document.querySelectorAll("input[name='formConnectors']:checked").forEach(b => connectors.push(b.value));

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
  const source = appState.caseFormSourceFeedback || null;
  const payload = {
    id, categories, creator: creator || null, title, summary, features, connectors, steps, prompt, proTip, translations, promptType,
    ...(source ? { sourceFeedbackId: source.id } : {}),
    timing: questFields.timing.length ? questFields.timing : ["anytime"],
    hints: questFields.hints.filter(h => h.question.en),
    helperPrompts: rowsToHelpers(readCaseHelperRows())
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
      showToast(source ? tr().feedbackConverted : (isEdit ? tr().caseUpdated : tr().caseCreated));
      appState.caseFormSourceFeedback = null;
      if (source) loadAdminFeedbacks();
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
  const categories = readCategoryChecklist("formCaseCat");

  const features = [];
  document.querySelectorAll("input[name='formFeatures']:checked").forEach(b => features.push(b.value));
  
  const connectors = [];
  document.querySelectorAll("input[name='formConnectors']:checked").forEach(b => connectors.push(b.value));

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
        categories,
        features,
        connectors,
        promptType: document.getElementById("formCasePromptType")?.value || "general",
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
  // V7: Set up helper prompts
  if (aiRes && aiRes.helperPrompts && typeof aiRes.helperPrompts === "object") {
    renderCaseHelperFields(helpersToRows(aiRes.helperPrompts), false);
  }

  // English (en)
  const en = aiRes.en || {};
  if (en.title) {
    document.getElementById("formCaseTitle").value = en.title;
  }
  // Gemini suggests categories; keep the admin's existing ticks when it returns none
  const aiCats = CategoryCore.normalizeCategories(aiRes.categories || []);
  if (aiCats.length) mountCategoryChecklist("formCaseCategories", "formCaseCat", aiCats);
  const promptTypeSelect = document.getElementById("formCasePromptType");
  if (promptTypeSelect && aiRes.promptType && Array.from(promptTypeSelect.options).some(o => o.value === aiRes.promptType)) {
    promptTypeSelect.value = aiRes.promptType;
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

  // 0. Prompt type (shown with the localised type label)
  const promptTypeSel = document.getElementById("formCasePromptType");
  const currentType = promptTypeSel ? promptTypeSel.value : "general";
  const typeLabel = (v) => (t.promptTypes && t.promptTypes[v]) || v;
  diffItems.push({
    label: t.formPromptTypeLabel || "Prompt type",
    current: typeLabel(currentType),
    proposed: typeLabel(aiRes.promptType || currentType)
  });

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

  // Set up helper prompts, one comparison row per language
  const currentHelpers = rowsToHelpers(readCaseHelperRows());
  const proposedHelpers = (aiRes.helperPrompts && typeof aiRes.helperPrompts === "object") ? aiRes.helperPrompts : currentHelpers;
  [["en", t.langNameEn], ["zh-TW", t.langNameZhTw], ["zh-CN", t.langNameZhCn]].forEach(([lang, langName]) => {
    diffItems.push({
      label: L(t.caseFormHelpersLabel, langName),
      current: helpersAsText(currentHelpers[lang], typeLabel),
      proposed: helpersAsText(proposedHelpers[lang], typeLabel)
    });
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
  const emptyRow = (text, cls = "") => `<tr><td colspan="5" class="table-empty ${cls}">${escapeHtml(text)}</td></tr>`;
  tbody.innerHTML = emptyRow(t.loading);
  const { ok, data } = await apiJson('/api/feedbacks');
  if (!ok || !data || !data.success) {
    tbody.innerHTML = emptyRow(errText(data, t.networkError), "is-error");
    return;
  }
  appState.adminFeedbacks = data.feedbacks;
  if (!data.feedbacks.length) {
    tbody.innerHTML = emptyRow(t.feedbackEmpty || "No feedback yet.");
    return;
  }
  const isAssist = appState.isAssist === true;
  const statusHtml = (fb) => fb.converted_use_case_id
    ? `<span class="fb-status is-converted" title="${escapeHtml(fb.converted_use_case_id)}"><span class="material-symbols-outlined" aria-hidden="true">check_circle</span>${escapeHtml(fmt(t.fbConvertedTo, { title: fb.converted_use_case_title || fb.converted_use_case_id }))}</span>`
    : `<span class="fb-status">${escapeHtml(t.fbStatusNew)}</span>`;
  tbody.innerHTML = data.feedbacks.map(fb => `
    <tr>
      <td class="cell-strong">${escapeHtml(fb.user_email || "")}</td>
      <td class="cell-pre">${escapeHtml(fb.feedback_text || "")}</td>
      <td class="muted">${escapeHtml(formatDateTime(fb.created_at))}</td>
      <td>${statusHtml(fb)}</td>
      <td class="col-actions"><div class="row-actions">
        ${isAssist ? '' : `<button type="button" class="nav-button btn-sm btn-convert-feedback" onclick="openFeedbackConvert(${Number(fb.id)})"><span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>${escapeHtml(t.convertBtn)}</button>`}
        ${isAssist ? '' : `<button type="button" class="icon-btn btn-sm" onclick="deleteFeedback(${Number(fb.id)})" title="${escapeHtml(t.deleteLabel)}" aria-label="${escapeHtml(t.deleteLabel)}"><span class="material-symbols-outlined">close</span></button>`}
      </div></td>
    </tr>`).join("");
};

/**
 * Feedback -> playbook conversion.
 * 1. Ask the server for similar playbooks (Gemini ranking, keyword fallback).
 * 2. Show matches with scores; the server recommends "enhance" when the best score >= its threshold.
 * 3. Enhance: open the existing playbook with the feedback as the Gemini instruction (diff review).
 *    Create new: open a blank form, creator = feedback author, and auto-draft from the feedback.
 * Saving the form sends sourceFeedbackId, which marks the feedback as converted.
 */
window.openFeedbackConvert = async function(id) {
  const t = tr();
  const modal = document.getElementById("feedbackConvertModal");
  const fb = (appState.adminFeedbacks || []).find(f => Number(f.id) === Number(id)) || { id, feedback_text: "" };
  const statusEl = document.getElementById("convertStatus");
  const listEl = document.getElementById("convertMatches");
  const btnEnhance = document.getElementById("btnConvertEnhance");
  const btnNew = document.getElementById("btnConvertNew");
  const close = () => modal.classList.remove("active");

  document.getElementById("convertFeedbackText").textContent = fb.feedback_text || "";
  document.getElementById("convertFeedbackAuthor").textContent = fb.user_email
    ? fmt(t.convertFrom, { email: fb.user_email }) : t.convertAnonymous;
  statusEl.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${escapeHtml(t.convertChecking)}`;
  listEl.innerHTML = "";
  btnEnhance.disabled = true;
  btnNew.disabled = true;
  document.getElementById("feedbackConvertClose").onclick = close;
  document.getElementById("btnConvertCancel").onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };
  modal.classList.add("active");

  const { ok, data } = await apiJson(`/api/admin/feedbacks/${Number(id)}/similar`, { method: "POST" });
  if (!ok) { statusEl.innerHTML = `<span class="is-error">${escapeHtml(errText(data))}</span>`; return; }

  const source = { id: Number(id), text: data.feedback?.text || fb.feedback_text || "", userEmail: data.feedback?.userEmail || null };
  const matches = data.matches || [];
  const recommendEnhance = data.recommendation === "enhance" && data.recommendedId;
  statusEl.innerHTML = `
    ${data.feedback?.convertedUseCaseId ? `<p class="convert-note">${escapeHtml(fmt(t.convertAlready, { id: data.feedback.convertedUseCaseId }))}</p>` : ""}
    <p class="convert-reco ${recommendEnhance ? "is-enhance" : "is-new"}">
      <span class="material-symbols-outlined" aria-hidden="true">${recommendEnhance ? "upgrade" : "add_circle"}</span>
      ${escapeHtml(recommendEnhance ? t.convertRecoEnhance : t.convertRecoNew)}
    </p>
    <p class="field-hint">${escapeHtml(data.source === "gemini" ? t.convertSourceGemini : t.convertSourceKeyword)}</p>`;
  listEl.innerHTML = matches.length
    ? matches.map(m => `
      <label class="convert-match${m.id === data.recommendedId && recommendEnhance ? " is-recommended" : ""}">
        <input type="radio" name="convertTarget" value="${escapeHtml(m.id)}" ${m.id === data.recommendedId && recommendEnhance ? "checked" : ""}>
        <div class="convert-match-body">
          <div class="convert-match-head">
            <span class="convert-match-title">${escapeHtml(m.title || m.id)}</span>
            ${m.id === data.recommendedId && recommendEnhance ? `<span class="convert-badge">${escapeHtml(t.convertRecommended)}</span>` : ""}
            <span class="convert-score" title="${escapeHtml(t.convertScore)}">${Number(m.score) || 0}%</span>
          </div>
          ${m.reason ? `<div class="convert-reason">${escapeHtml(m.reason)}</div>` : ""}
          <div class="liked-meta">${categoryChipsHtml(m.categories)}<span class="card-creator${m.creator ? "" : " is-default"}">${escapeHtml(creatorLabel(m, t))}</span></div>
        </div>
      </label>`).join("")
    : `<p class="lb-empty">${escapeHtml(t.convertNoMatches)}</p>`;

  const selected = () => listEl.querySelector('input[name="convertTarget"]:checked')?.value || null;
  listEl.onchange = () => { btnEnhance.disabled = !selected(); };
  btnEnhance.disabled = !selected();
  btnNew.disabled = false;

  btnEnhance.onclick = async () => {
    const targetId = selected();
    if (!targetId) return;
    let uc = (appState.loadedAdminUseCases || []).find(c => c.id === targetId);
    if (!uc) {
      const res = await apiJson('/api/use-cases');
      uc = (Array.isArray(res.data) ? res.data : []).find(c => c.id === targetId);
    }
    if (!uc) { showToast(t.caseSaveFailed, "warning"); return; }
    close();
    openAdminEditModal(uc, { sourceFeedback: source, instruction: fmt(t.convertEnhanceInstruction, { text: source.text }), autoDraft: true });
  };
  btnNew.onclick = () => {
    close();
    openAdminEditModal(null, {
      sourceFeedback: source, instruction: source.text, creator: source.userEmail || "",
      suggestedTitle: data.suggestedTitle || "", autoDraft: true
    });
  };
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
      general: "General query", notebooklm: "Gemini Notebook", deep_research: "Deep Research",
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
      general: "一般查詢", notebooklm: "Gemini Notebook", deep_research: "Deep Research",
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
      general: "一般查询", notebooklm: "Gemini Notebook", deep_research: "Deep Research",
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
    caseFormDraftBtnTitle: "Draft with Gemini 3.8 Flash",
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
    caseFormStepsPh: "Upload materials to Gemini Notebook…",
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
    diffIntro: "Gemini 3.8 Flash suggested the changes below.",
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
    caseFormDraftBtnTitle: "使用 Gemini 3.8 Flash 草擬",
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
    caseFormStepsPh: "將教材上傳到 Gemini Notebook…",
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
    diffIntro: "Gemini 3.8 Flash 建議了以下修改。",
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
    caseFormDraftBtnTitle: "使用 Gemini 3.8 Flash 草拟",
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
    caseFormStepsPh: "将教材上传到 Gemini Notebook…",
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
    diffIntro: "Gemini 3.8 Flash 建议了以下修改。",
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
    caseFormHelpersLabel: "Set up prompts",
    caseFormHelpersHint: "Ready-to-copy prompts shown in step 1 to prepare files or sample data. Up to 5. Blank Chinese fields use the English text.",
    caseFormHelperAdd: "Add set up prompt",
    caseFormHelperN: "Set up prompt {n}",
    caseFormHelperRemove: "Remove set up prompt",
    caseFormHelperType: "Type",
    caseFormHelperTitlePh: "Title, e.g. Prompt to Generate a Sample Application Form",
    caseFormHelperPromptPh: "Prompt text. Use {{VARIABLE}} for values people fill in.",
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
    caseFormHelpersLabel: "準備資料提示詞",
    caseFormHelpersHint: "在步驟 1 顯示、可直接複製的提示詞，用來準備檔案或樣本資料。最多 5 個。中文欄位留空時會使用英文內容。",
    caseFormHelperAdd: "新增準備資料提示詞",
    caseFormHelperN: "準備資料提示詞 {n}",
    caseFormHelperRemove: "移除準備資料提示詞",
    caseFormHelperType: "類型",
    caseFormHelperTitlePh: "標題，例如：生成申請表樣本提示詞",
    caseFormHelperPromptPh: "提示詞內容。以 {{VARIABLE}} 表示需要填寫的值。",
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
    caseFormHelpersLabel: "准备资料提示词",
    caseFormHelpersHint: "在步骤 1 显示、可直接复制的提示词，用来准备文件或样本数据。最多 5 个。中文字段留空时会使用英文内容。",
    caseFormHelperAdd: "添加准备资料提示词",
    caseFormHelperN: "准备资料提示词 {n}",
    caseFormHelperRemove: "移除准备资料提示词",
    caseFormHelperType: "类型",
    caseFormHelperTitlePh: "标题，例如：生成申请表样本提示词",
    caseFormHelperPromptPh: "提示词内容。以 {{VARIABLE}} 表示需要填写的值。",
    caseFormHintAudience: "只向这些角色显示（选填）"
  }
};
Object.keys(uiTranslationsV6).forEach(lang => {
  if (uiTranslations[lang]) Object.assign(uiTranslations[lang], uiTranslationsV6[lang]);
});

/**
 * V7: categories on accounts and playbooks, idea providers, feedback -> playbook conversion
 * and the idea provider dashboard. Product names stay in English in every language.
 */
const uiTranslationsV7 = {
  en: {
    catAll: "All my categories",
    catAllAdmin: "All categories",
    resultsHeadlineMine: "{n} playbooks for you",
    resultsHeadlineMineOne: "1 playbook for you",
    resultsHeadlineCat: "{n} playbooks · {category}",
    resultsHeadlineCatOne: "1 playbook · {category}",
    resultsHeadlineAll: "{n} playbooks across all categories",
    resultsHeadlineAllOne: "1 playbook across all categories",
    noCategoriesTitle: "No playbooks assigned yet",
    noCategoriesDesc: "Your account has no categories yet. Ask your admin to add the categories that match your work.",
    noCategoriesShort: "No categories",
    ideaBy: "Idea by {name}",
    defaultPlaybook: "Default playbook",
    adminCrudThCategories: "Categories",
    adminCrudThCreator: "Idea provider",
    adminFormLabelCreator: "Idea provider",
    adminFormCreatorPh: "Leave empty for a default playbook",
    adminFormLabelCategories: "Categories",
    adminFormCategoriesHint: "Users see this playbook if they have at least one of these categories.",
    useFeedbackAuthor: "Use feedback author",
    caseFormNeedCategory: "Pick at least one category.",
    userCategoriesLabel: "Categories",
    userCategoriesHint: "Users only see playbooks in the categories you tick.",
    adminThCategories: "Categories",
    creatorDashTitle: "Idea providers",
    creatorDashDesc: "Who contributes playbooks, and whose ideas get used. Default playbooks are excluded.",
    creatorRangeLabel: "Timeframe",
    rangeAll: "Overall",
    range1m: "Last month",
    range3m: "Last 3 months",
    range6m: "Last 6 months",
    creatorSumCommunity: "Community playbooks",
    creatorSumCreators: "Idea providers",
    creatorSumConverted: "Feedback converted",
    creatorSumDefault: "Default playbooks",
    lbProviders: "Most playbooks provided",
    lbViews: "Most viewed ideas",
    lbLikes: "Most liked ideas",
    lbTopCases: "Top community playbooks",
    lbColPlaybook: "Playbook",
    lbColViews: "Views",
    lbColLikes: "Likes",
    lbUnitPlaybooks: "{n} playbooks",
    lbUnitViews: "{n} views",
    lbUnitLikes: "{n} likes",
    lbEmpty: "Nothing in this timeframe yet.",
    noLikesYet: "No likes recorded yet.",
    fbThStatus: "Status",
    fbStatusNew: "New",
    fbConvertedTo: "Converted: {title}",
    convertBtn: "Convert to playbook",
    convertTitle: "Convert to playbook",
    convertFrom: "From {email}. They'll be credited as the idea provider.",
    convertAnonymous: "Anonymous feedback. The playbook will have no idea provider unless you add one.",
    convertChecking: "Checking for similar playbooks…",
    convertAlready: "Already converted to {id}. Converting again re-links it.",
    convertRecoEnhance: "A similar playbook exists. We suggest improving it.",
    convertRecoNew: "No close match. We suggest creating a new playbook.",
    convertSourceGemini: "Matched by Gemini.",
    convertSourceKeyword: "Matched by keywords (Gemini unavailable).",
    convertRecommended: "Recommended",
    convertScore: "Similarity",
    convertNoMatches: "No similar playbooks found.",
    convertEnhance: "Improve selected",
    convertNew: "Create new playbook",
    convertEnhanceInstruction: "Improve this playbook using this user suggestion. Keep what works and add what's missing:\n\n{text}",
    feedbackConverted: "Saved. Feedback marked as converted.",
    feedbackTitle: "Share feedback or a use case idea",
    feedbackDesc: "Tell us what would make this portal more useful, or suggest a new use case. Good ideas become playbooks, credited to you.",
    feedbackLabel: "Your feedback or idea",
    feedbackPlaceholder: "e.g. A playbook that drafts parent emails from my class notes"
  },
  "zh-TW": {
    catAll: "我的所有類別",
    catAllAdmin: "所有類別",
    resultsHeadlineMine: "為您準備的 {n} 個 Playbook",
    resultsHeadlineMineOne: "為您準備的 1 個 Playbook",
    resultsHeadlineCat: "{n} 個 Playbook · {category}",
    resultsHeadlineCatOne: "1 個 Playbook · {category}",
    resultsHeadlineAll: "所有類別共 {n} 個 Playbook",
    resultsHeadlineAllOne: "所有類別共 1 個 Playbook",
    noCategoriesTitle: "尚未指派 Playbook",
    noCategoriesDesc: "您的帳戶尚未設定類別。請聯絡管理員加入符合您工作的類別。",
    noCategoriesShort: "未設定類別",
    ideaBy: "構想提供：{name}",
    defaultPlaybook: "預設 Playbook",
    adminCrudThCategories: "類別",
    adminCrudThCreator: "構想提供者",
    adminFormLabelCreator: "構想提供者",
    adminFormCreatorPh: "留空即為預設 Playbook",
    adminFormLabelCategories: "類別",
    adminFormCategoriesHint: "擁有其中任一類別的使用者都會看到此 Playbook。",
    useFeedbackAuthor: "使用意見提交者",
    caseFormNeedCategory: "請至少選擇一個類別。",
    userCategoriesLabel: "類別",
    userCategoriesHint: "使用者只會看到您勾選類別中的 Playbook。",
    adminThCategories: "類別",
    creatorDashTitle: "構想提供者",
    creatorDashDesc: "誰貢獻了 Playbook，以及誰的構想最常被使用。不包括預設 Playbook。",
    creatorRangeLabel: "時間範圍",
    rangeAll: "全部",
    range1m: "過去 1 個月",
    range3m: "過去 3 個月",
    range6m: "過去 6 個月",
    creatorSumCommunity: "社群 Playbook",
    creatorSumCreators: "構想提供者",
    creatorSumConverted: "已轉換的意見",
    creatorSumDefault: "預設 Playbook",
    lbProviders: "提供最多 Playbook",
    lbViews: "瀏覽次數最多的構想",
    lbLikes: "最多讚好的構想",
    lbTopCases: "熱門社群 Playbook",
    lbColPlaybook: "Playbook",
    lbColViews: "瀏覽",
    lbColLikes: "讚好",
    lbUnitPlaybooks: "{n} 個 Playbook",
    lbUnitViews: "{n} 次瀏覽",
    lbUnitLikes: "{n} 個讚好",
    lbEmpty: "此時間範圍內暫無資料。",
    noLikesYet: "暫未有讚好紀錄。",
    fbThStatus: "狀態",
    fbStatusNew: "新",
    fbConvertedTo: "已轉換：{title}",
    convertBtn: "轉換為 Playbook",
    convertTitle: "轉換為 Playbook",
    convertFrom: "來自 {email}，對方將列為構想提供者。",
    convertAnonymous: "匿名意見。除非您手動加入，否則 Playbook 不會有構想提供者。",
    convertChecking: "正在檢查相似的 Playbook…",
    convertAlready: "已轉換為 {id}。再次轉換會重新連結。",
    convertRecoEnhance: "已有相似的 Playbook，建議改進該 Playbook。",
    convertRecoNew: "沒有相近的 Playbook，建議建立新的 Playbook。",
    convertSourceGemini: "由 Gemini 配對。",
    convertSourceKeyword: "按關鍵字配對（Gemini 暫時無法使用）。",
    convertRecommended: "建議",
    convertScore: "相似度",
    convertNoMatches: "找不到相似的 Playbook。",
    convertEnhance: "改進所選項目",
    convertNew: "建立新 Playbook",
    convertEnhanceInstruction: "請根據以下使用者建議改進此 Playbook，保留有效內容並補充缺少的部分：\n\n{text}",
    feedbackConverted: "已儲存，意見已標示為已轉換。",
    feedbackTitle: "分享意見或使用案例構想",
    feedbackDesc: "告訴我們如何讓入口網站更實用，或建議新的使用案例。好的構想會成為 Playbook，並註明由您提供。",
    feedbackLabel: "您的意見或構想",
    feedbackPlaceholder: "例如：根據我的課堂筆記草擬家長電郵的 Playbook"
  },
  "zh-CN": {
    catAll: "我的所有类别",
    catAllAdmin: "所有类别",
    resultsHeadlineMine: "为您准备的 {n} 个 Playbook",
    resultsHeadlineMineOne: "为您准备的 1 个 Playbook",
    resultsHeadlineCat: "{n} 个 Playbook · {category}",
    resultsHeadlineCatOne: "1 个 Playbook · {category}",
    resultsHeadlineAll: "所有类别共 {n} 个 Playbook",
    resultsHeadlineAllOne: "所有类别共 1 个 Playbook",
    noCategoriesTitle: "尚未分配 Playbook",
    noCategoriesDesc: "您的账户尚未设置类别。请联系管理员添加符合您工作的类别。",
    noCategoriesShort: "未设置类别",
    ideaBy: "创意提供：{name}",
    defaultPlaybook: "默认 Playbook",
    adminCrudThCategories: "类别",
    adminCrudThCreator: "创意提供者",
    adminFormLabelCreator: "创意提供者",
    adminFormCreatorPh: "留空即为默认 Playbook",
    adminFormLabelCategories: "类别",
    adminFormCategoriesHint: "拥有其中任一类别的用户都会看到此 Playbook。",
    useFeedbackAuthor: "使用意见提交者",
    caseFormNeedCategory: "请至少选择一个类别。",
    userCategoriesLabel: "类别",
    userCategoriesHint: "用户只会看到您勾选类别中的 Playbook。",
    adminThCategories: "类别",
    creatorDashTitle: "创意提供者",
    creatorDashDesc: "谁贡献了 Playbook，以及谁的创意最常被使用。不包括默认 Playbook。",
    creatorRangeLabel: "时间范围",
    rangeAll: "全部",
    range1m: "过去 1 个月",
    range3m: "过去 3 个月",
    range6m: "过去 6 个月",
    creatorSumCommunity: "社区 Playbook",
    creatorSumCreators: "创意提供者",
    creatorSumConverted: "已转换的意见",
    creatorSumDefault: "默认 Playbook",
    lbProviders: "提供最多 Playbook",
    lbViews: "浏览次数最多的创意",
    lbLikes: "点赞最多的创意",
    lbTopCases: "热门社区 Playbook",
    lbColPlaybook: "Playbook",
    lbColViews: "浏览",
    lbColLikes: "点赞",
    lbUnitPlaybooks: "{n} 个 Playbook",
    lbUnitViews: "{n} 次浏览",
    lbUnitLikes: "{n} 个赞",
    lbEmpty: "此时间范围内暂无数据。",
    noLikesYet: "暂无点赞记录。",
    fbThStatus: "状态",
    fbStatusNew: "新",
    fbConvertedTo: "已转换：{title}",
    convertBtn: "转换为 Playbook",
    convertTitle: "转换为 Playbook",
    convertFrom: "来自 {email}，对方将列为创意提供者。",
    convertAnonymous: "匿名意见。除非您手动添加，否则 Playbook 不会有创意提供者。",
    convertChecking: "正在检查相似的 Playbook…",
    convertAlready: "已转换为 {id}。再次转换会重新关联。",
    convertRecoEnhance: "已有相似的 Playbook，建议改进该 Playbook。",
    convertRecoNew: "没有相近的 Playbook，建议创建新的 Playbook。",
    convertSourceGemini: "由 Gemini 匹配。",
    convertSourceKeyword: "按关键词匹配（Gemini 暂时不可用）。",
    convertRecommended: "建议",
    convertScore: "相似度",
    convertNoMatches: "找不到相似的 Playbook。",
    convertEnhance: "改进所选项",
    convertNew: "创建新 Playbook",
    convertEnhanceInstruction: "请根据以下用户建议改进此 Playbook，保留有效内容并补充缺少的部分：\n\n{text}",
    feedbackConverted: "已保存，意见已标记为已转换。",
    feedbackTitle: "分享意见或用例创意",
    feedbackDesc: "告诉我们如何让门户更实用，或建议新的用例。好的创意会成为 Playbook，并注明由您提供。",
    feedbackLabel: "您的意见或创意",
    feedbackPlaceholder: "例如：根据我的课堂笔记起草家长邮件的 Playbook"
  }
};
Object.keys(uiTranslationsV7).forEach(lang => {
  if (uiTranslations[lang]) Object.assign(uiTranslations[lang], uiTranslationsV7[lang]);
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

/**
 * Category visibility (pure). A playbook is visible when its categories intersect the user's.
 * Admin previews see everything. The server already filters standard users; this keeps the client
 * consistent when categories change mid-session.
 */
function matchesUserCategories(uc, state) {
  if (state.isAdmin === true) return true;
  return CategoryCore.isVisibleTo(uc.categories || [], state.userCategories || []);
}

/** Apply search, category, feature and collection filters. Pure. */
function filterUseCases(list, state, lang) {
  const q = (state.searchQuery || "").toLowerCase();
  const cat = state.activeFilterCategory;
  return list.filter(uc => {
    if (!matchesUserCategories(uc, state)) return false;
    if (cat && cat !== "all" && !(uc.categories || []).includes(cat)) return false;
    if (state.activeFilterFeature && state.activeFilterFeature !== "all" &&
        !(uc.features || []).some(f => f.toLowerCase() === state.activeFilterFeature.toLowerCase())) return false;
    if (state.activeFilterStatus === "liked" && !isOn(uc.isLiked)) return false;
    if (q) {
      const hay = [ucTitle(uc, lang), ucSummary(uc, lang), uc.creator || "",
        ...(uc.categories || []).map(id => categoryLabel(id, lang)), ...(uc.features || [])].join(" ").toLowerCase();
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

/**
 * Results headline. Pure.
 *   category selected -> "{n} playbooks · Teaching"
 *   otherwise         -> "{n} playbooks for you" (admins: "… across all categories")
 */
function formatResultsHeadline(t, n, state) {
  const one = n === 1;
  const cat = state.activeFilterCategory;
  if (cat && cat !== "all") {
    return fmt(one ? t.resultsHeadlineCatOne : t.resultsHeadlineCat, { n, category: categoryLabel(cat, state.activeLanguage) });
  }
  if (state.isAdmin === true) return fmt(one ? t.resultsHeadlineAllOne : t.resultsHeadlineAll, { n });
  return fmt(one ? t.resultsHeadlineMineOne : t.resultsHeadlineMine, { n });
}

/** Localised category label (CategoryCore), defaulting to the active language. */
const categoryLabel = (id, lang) => CategoryCore.categoryLabel(id, lang || appState.activeLanguage || "en");

/** "Idea by alice@x.edu" / "Default playbook". Pure apart from tr(). */
const creatorLabel = (uc, t = tr()) => (uc && uc.creator ? fmt(t.ideaBy, { name: uc.creator }) : t.defaultPlaybook);

/** Small inline chip list for category ids. */
const categoryChipsHtml = (ids, lang) => (ids || [])
  .map(id => `<span class="cat-chip" data-cat="${escapeHtml(id)}">${escapeHtml(categoryLabel(id, lang))}</span>`).join("");

/**
 * Rebuilds the category filter: "All my categories" plus only the categories this user has
 * (admin previews get all 7). An unknown saved value (e.g. a legacy "academic") falls back to "all".
 */
function renderCategoryFilterOptions() {
  const el = document.getElementById("filterCategory");
  if (!el) return;
  const t = tr();
  const cats = appState.isAdmin === true ? CategoryCore.CATEGORY_IDS : (appState.userCategories || []);
  el.innerHTML = [`<option value="all">${escapeHtml(appState.isAdmin === true ? t.catAllAdmin : t.catAll)}</option>`]
    .concat(cats.map(id => `<option value="${escapeHtml(id)}">${escapeHtml(categoryLabel(id))}</option>`)).join("");
  if (!cats.includes(appState.activeFilterCategory)) appState.activeFilterCategory = "all";
  el.value = appState.activeFilterCategory;
  // One category only: the filter has nothing to choose, so hide it
  el.hidden = appState.isAdmin !== true && cats.length <= 1;
}

/**
 * Checklist markup for picking categories (users + case form). `name` groups the checkboxes;
 * `selected` is an array of ids.
 */
const categoryChecklistHtml = (name, selected) => `
  <div class="cat-checklist" role="group">
    ${CategoryCore.CATEGORIES.map(c => `
      <label class="cat-check">
        <input type="checkbox" name="${escapeHtml(name)}" value="${c.id}" ${(selected || []).includes(c.id) ? "checked" : ""}>
        <span class="material-symbols-outlined" aria-hidden="true">${c.icon}</span>
        <span class="cat-check-label" data-cat-label="${c.id}">${escapeHtml(categoryLabel(c.id))}</span>
        <span class="cat-check-roles">${escapeHtml(c.roles.map(r => (tr().roles || {})[r] || r).join(" · "))}</span>
      </label>`).join("")}
  </div>`;

/** Mounts a checklist into a container element id. */
function mountCategoryChecklist(containerId, name, selected) {
  const box = document.getElementById(containerId);
  if (box) box.innerHTML = categoryChecklistHtml(name, selected);
}

/** Checked ids of a checklist group. */
const readCategoryChecklist = (name) =>
  Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(b => b.value);

/** Re-labels mounted checklists after a language switch (keeps the checked state). */
function refreshCategoryChecklistLabels() {
  document.querySelectorAll("[data-cat-label]").forEach(el => { el.textContent = categoryLabel(el.dataset.catLabel); });
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
    // Category options are built later from the session (renderCategoryFilterOptions validates that value)
    if (el.value !== appState[key] && id !== "filterCategory") { el.value = "all"; appState[key] = el.value; }
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
        <span class="card-creator${uc.creator ? "" : " is-default"}" title="${escapeHtml(creatorLabel(uc, t))}">
          <span class="material-symbols-outlined" aria-hidden="true">${uc.creator ? "emoji_objects" : "verified"}</span>
          <span class="card-creator-text">${escapeHtml(creatorLabel(uc, t))}</span>
        </span>
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
        <div class="uc-meta">
          <span class="uc-creator${useCase.creator ? "" : " is-default"}" id="modalCreator">
            <span class="material-symbols-outlined" aria-hidden="true">${useCase.creator ? "emoji_objects" : "verified"}</span>${escapeHtml(creatorLabel(useCase, t))}
          </span>
          <span class="uc-cats">${categoryChipsHtml(useCase.categories, lang)}</span>
        </div>
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
  ["loginCard", "forgotCard", "setPasswordCard", "resetCard"].forEach(cid => {
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
  appState.userCategories = CategoryCore.CATEGORY_IDS.slice(); // admin preview: every category
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
  mountCategoryChecklist("editUserCategories", "editUserCat", u.categories || []);
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
      method: "PUT", body: { originalEmail: editingUser.email, email, geAppLink, categories: readCategoryChecklist("editUserCat") }
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
  // Restart the CSS unroll animation for each news scroll (reflow between remove/add).
  bubble.classList.remove("is-unrolling");
  if (kind === "news") { void bubble.offsetWidth; bubble.classList.add("is-unrolling"); }
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

// ===========================================================================
// v7 Admin: case form — Set up helper prompts (stored in use_cases.helper_prompts)
// ===========================================================================
const MAX_CASE_HELPERS = 5;
const HELPER_FORM_LANGS = [["en", "EN"], ["zh-TW", "繁"], ["zh-CN", "简"]];
const HELPER_TYPE_VALUES = ["general", "notebooklm", "deep_research", "agent_designer", "canvas", "image", "video"];

/**
 * Stored shape { en: [{type,title,prompt}], "zh-TW": [...], "zh-CN": [...] } -> editor rows
 * [{ type, en: {title,prompt}, "zh-TW": {...}, "zh-CN": {...} }]. Entries line up by index; the
 * row's type comes from the first language that has the entry. Pure.
 */
const helpersToRows = (hp) => {
  const lists = HELPER_FORM_LANGS.map(([l]) => (hp && Array.isArray(hp[l]) ? hp[l] : []));
  const n = Math.min(MAX_CASE_HELPERS, Math.max(0, ...lists.map(x => x.length)));
  return Array.from({ length: n }, (_, i) => {
    const first = lists.map(x => x[i]).find(Boolean) || {};
    const row = { type: HELPER_TYPE_VALUES.includes(first.type) ? first.type : "general" };
    HELPER_FORM_LANGS.forEach(([l], k) => { row[l] = { title: lists[k][i]?.title || "", prompt: lists[k][i]?.prompt || "" }; });
    return row;
  });
};

/**
 * Editor rows -> stored shape. Blank Chinese fields fall back to the English text (same rule as the
 * other translation fields); rows without any prompt text are dropped. Pure.
 */
const rowsToHelpers = (rows) => {
  const kept = rows.filter(r => HELPER_FORM_LANGS.some(([l]) => (r[l]?.prompt || "").trim()));
  return Object.fromEntries(HELPER_FORM_LANGS.map(([l]) => [l, kept.map(r => ({
    type: r.type || "general",
    title: (r[l]?.title || "").trim() || (r.en?.title || "").trim(),
    prompt: (r[l]?.prompt || "").trim() || (r.en?.prompt || "").trim()
  })).filter(h => h.prompt)]));
};

/** Plain-text view of one language's helper list for the diff viewer. Pure. */
const helpersAsText = (list, typeLabel) => (Array.isArray(list) ? list : [])
  .map((h, i) => `${i + 1}. ${h.title || ""} [${typeLabel(h.type || "general")}]\n${h.prompt || ""}`).join("\n\n");

/** Reads the helper repeater back into editor rows. */
function readCaseHelperRows() {
  return [...document.querySelectorAll("#formCaseHelpers .helper-item")].map(item => {
    const row = { type: item.querySelector("[data-helper-type]")?.value || "general" };
    HELPER_FORM_LANGS.forEach(([l]) => {
      row[l] = {
        title: item.querySelector(`[data-helper-title="${l}"]`)?.value || "",
        prompt: item.querySelector(`[data-helper-prompt="${l}"]`)?.value || ""
      };
    });
    return row;
  });
}

const helperRowHtml = (row, i, t, disabled) => {
  const dis = disabled ? " disabled" : "";
  const typeOptions = HELPER_TYPE_VALUES.map(v =>
    `<option value="${v}"${row.type === v ? " selected" : ""}>${escapeHtml(t.promptTypes?.[v] || v)}</option>`).join("");
  const langBlock = ([l, label]) => `
    <div class="helper-lang-block">
      <span class="hint-lang">${label}</span>
      <div class="helper-lang-fields">
        <input type="text" class="select-control" maxlength="200" data-helper-title="${l}" value="${escapeHtml(row[l]?.title || "")}" placeholder="${escapeHtml(t.caseFormHelperTitlePh)}" aria-label="${escapeHtml(t.caseFormHelperTitlePh)} (${label})"${dis}>
        <textarea class="select-control" maxlength="8000" data-helper-prompt="${l}" placeholder="${escapeHtml(t.caseFormHelperPromptPh)}" aria-label="${escapeHtml(t.caseFormHelperPromptPh)} (${label})"${dis}>${escapeHtml(row[l]?.prompt || "")}</textarea>
      </div>
    </div>`;
  return `<div class="hint-item helper-item" data-index="${i}">
    <div class="hint-item-head">
      <span class="hint-num">${escapeHtml(fmt(t.caseFormHelperN, { n: i + 1 }))}</span>
      ${disabled ? "" : `<button type="button" class="icon-btn btn-sm" data-helper-remove="${i}" title="${escapeHtml(t.caseFormHelperRemove)}" aria-label="${escapeHtml(t.caseFormHelperRemove)}"><span class="material-symbols-outlined">delete</span></button>`}
    </div>
    <label class="hint-field"><span class="hint-lang">${escapeHtml(t.caseFormHelperType)}</span>
      <select class="select-control helper-type" data-helper-type${dis}>${typeOptions}</select></label>
    ${HELPER_FORM_LANGS.map(langBlock).join("")}
  </div>`;
};

/** Renders the helper repeater (max 5); add / remove handlers are bound once. */
function renderCaseHelperFields(rows, disabled) {
  const t = tr();
  const box = document.getElementById("formCaseHelpers");
  const addBtn = document.getElementById("btnCaseAddHelper");
  if (!box) return;
  const list = (rows || []).slice(0, MAX_CASE_HELPERS);
  box.innerHTML = list.map((r, i) => helperRowHtml(r, i, t, disabled)).join("");
  if (addBtn) {
    addBtn.hidden = disabled;
    addBtn.disabled = list.length >= MAX_CASE_HELPERS;
  }
  if (!box.dataset.bound) {
    box.dataset.bound = "1";
    box.addEventListener("click", (e) => {
      const rm = e.target.closest("[data-helper-remove]");
      if (!rm) return;
      const current = readCaseHelperRows();
      current.splice(Number(rm.dataset.helperRemove), 1);
      renderCaseHelperFields(current, false);
    });
    if (addBtn) addBtn.addEventListener("click", () => {
      const current = readCaseHelperRows();
      if (current.length >= MAX_CASE_HELPERS) return;
      const blank = { type: "canvas" };
      HELPER_FORM_LANGS.forEach(([l]) => { blank[l] = { title: "", prompt: "" }; });
      renderCaseHelperFields([...current, blank], false);
      const titles = box.querySelectorAll("[data-helper-title='en']");
      if (titles.length) titles[titles.length - 1].focus();
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
