/**
 * lib/seed-playbooks.js
 * Seeded playbooks that live outside app.js (added 2026-10-28): research playbooks, Skills playbooks and the
 * Workflow Builder chat / workflow agents that were added or rewritten in v9. server.js upserts them on every boot
 * next to the app.js seeds, so content edits here reach every environment on the next deploy.
 *
 * English text and metadata are here; zh-TW / zh-CN live in seed-playbooks.zh-TW.json / .zh-CN.json, keyed by
 * id, with the same steps, sections, {{VARIABLE}} keys and the same number and order of Set up prompts and hints.
 *
 * Workflow Builder conventions used below:
 *   - CHAT AGENT: title ends "Chat Agent"; the prompt is the agent's instructions with KNOWLEDGE SOURCES and
 *     GROUNDING RULES; people talk to it over time.
 *   - WORKFLOW AGENT: title ends "Workflow Agent"; "STEP n · NAME (node type)", starts from a trigger
 *     (Drive Connector folder or Email Connector mailbox), branches in condition nodes, forward-only, approval
 *     nodes have exactly Approve / Reject, and nothing is sent through a connector before a person approves.
 *     Describe your agent (natural-language creation) can't add event triggers, approvals or filters (GE docs,
 *     Workflow Builder known issues), so the prompt is LINEAR: read → check → decide (a "ROUTE: X" first line,
 *     kept in English in every language) → draft → summarise. The trigger, Condition (on the ROUTE line), Approval
 *     and send-email steps plus the knowledge files are added by hand: connectorGuide "Flow builder" lists them
 *     (plain words, no {{VARIABLES}}, because guide steps aren't substituted). A rejected Approval stops the run.
 * Skills playbooks: promptType "skills"; the prompt is a GENERIC skill definition (no course, school, office or
 *     person names and no {{VARIABLES}}). Skills can't hold attachments: the user adds details, rubrics and
 *     templates in the request when calling the skill. A "Prompt to Use the Skill ..." Set up prompt carries the
 *     {{VARIABLES}}.
 */
'use strict';

const LANGS = ['en', 'zh-TW', 'zh-CN'];
const ALL_LEVELS = ['University & College', 'High School', 'Generic'];

const PLAYBOOKS = [
  // ---------------------------------------------------------------------------------------------
  // RESEARCH (category: research)
  // ---------------------------------------------------------------------------------------------
  {
    id: 'research_literature_review',
    category: 'academic', role: 'Researcher', level: ['University & College', 'Generic'],
    categories: ['research'],
    features: ['Deep Research', 'Gemini Notebook', 'Canvas Mode'], connectors: [],
    promptType: 'notebooklm',
    timing: ['anytime', 'summer', 'winter'],
    hints: [
      { en: 'Starting a literature review from scratch?', audience: ['Researcher'] },
      { en: 'Need an evidence table you can cite?', audience: ['Researcher', 'Lecturer'], timing: ['anytime'] }
    ],
    en: {
      title: 'Literature Review Evidence Map',
      summary: 'Scan the field with Deep Research, then build a cited evidence matrix from the papers you trust in Gemini Notebook and draft the review section in Canvas Mode.',
      steps: [
        'Run the Deep Research Set up prompt in Gemini to map the field, then add the report and the full-text papers you have chosen to a new Gemini Notebook as sources.',
        'Run the evidence map prompt in Gemini Notebook. Every row must cite the paper and page, and gaps are listed instead of guessed.',
        'Check each row against the paper, then open the matrix in Canvas Mode to draft the review section. You confirm every citation before it goes into the manuscript.'
      ],
      prompt: `You are a research methods assistant helping a researcher review the literature on {{RESEARCH_QUESTION}} in {{FIELD}}.

KNOWLEDGE SOURCES (the sources in this notebook)
The full-text papers the researcher added, plus the Deep Research landscape report (use the report only to spot themes, never as evidence).

GROUNDING RULES
1. Use only the full-text papers as evidence. Cite every claim as (first author, year, page).
2. If a paper doesn't report something, write "Not reported". Never infer a sample size, effect size or method.
3. Never invent papers, authors, quotes or numbers.

TASK
1. **Evidence matrix**: one row per paper with: citation, country / setting, design, sample, key measures, main finding, limitations, and relevance to {{RESEARCH_QUESTION}} (High | Medium | Low).
2. **Themes**: 3-5 themes across the papers. For each, list the supporting papers and where they agree or disagree.
3. **Gaps**: what the papers don't answer, and which designs or populations are missing.
4. **Quality flags**: papers with small samples, no comparison group or unclear methods.
5. **Next searches**: 5 search strings (keywords and Boolean operators) to fill the gaps.

Present the matrix as a table, then the other sections under headings.`,
      proTip: 'Keep Deep Research for finding papers and themes, and Gemini Notebook for evidence: only papers you have read in full go into the notebook, so every citation in the matrix can be checked.'
    },
    helpers: [
      { type: 'deep_research', title: 'Prompt to Map the Research Landscape',
        prompt: `Map the published research on {{RESEARCH_QUESTION}} in {{FIELD}} from the last 10 years. Report: the main schools of thought, the most cited and the most recent key studies (with full references and links), common methods and samples, open debates, and 5 review articles to read first. Flag preprints and non-peer-reviewed sources.` },
      { type: 'canvas', title: 'Prompt to Draft a Review Protocol',
        prompt: `Act as a research librarian. Draft a short literature review protocol for {{RESEARCH_QUESTION}} in {{FIELD}}: the question in PICO or SPIDER form, inclusion and exclusion criteria, databases to search, a draft search string, the screening steps and the data to extract from each paper. Use Canvas to create this as an editable document.` }
    ]
  },
  {
    id: 'research_grant_proposal',
    category: 'academic', role: 'Researcher', level: ['University & College', 'Generic'],
    categories: ['research'],
    features: ['Deep Research', 'Canvas Mode'], connectors: [],
    promptType: 'canvas',
    timing: ['anytime', 'summer'],
    hints: [
      { en: 'Grant deadline coming up?', audience: ['Researcher'] },
      { en: 'Does your proposal match what the funder scores?', audience: ['Researcher', 'Dean'], timing: ['anytime'] }
    ],
    en: {
      title: 'Grant Proposal Builder',
      summary: 'Research the funder\'s priorities and recently funded projects with Deep Research, then draft a proposal in Canvas Mode that answers every scoring criterion in the call.',
      steps: [
        'Run the Deep Research Set up prompt on the funder and the scheme, and save the call document with its scoring criteria.',
        'In Gemini, attach the call document and the Deep Research report, then run the proposal prompt to draft the case for support in Canvas Mode.',
        'Check every claim and figure, ask a colleague to score the draft with the funder\'s criteria, and submit through your research office.'
      ],
      prompt: `Act as an experienced grant writer and reviewer. Help me draft a proposal for the {{FUNDING_SCHEME}} call. My project: {{PROJECT_IDEA}}. Budget limit: {{BUDGET_LIMIT}}. Duration: {{DURATION}}.

SOURCES (attached in this chat)
The call document with its scoring criteria, and the Deep Research report on the funder's priorities and recently funded projects.

RULES
1. Follow the call's section headings and word limits exactly. If the call doesn't give a limit, say so.
2. Map every section to the scoring criterion it answers and quote the criterion.
3. Use only facts from my project idea and the sources. Mark anything I must supply as [TO CONFIRM: ...]; never invent results, partners or numbers.

DRAFT
1. **Title and 150-word summary** for a non-specialist panel.
2. **Case for support**: the problem, why now, aims and objectives, methods, work plan with milestones, risks and mitigations, impact and who benefits.
3. **Fit with the funder**: how the project matches 2-3 stated priorities, citing the report.
4. **Budget justification outline** within {{BUDGET_LIMIT}}.
5. **Reviewer check**: score the draft 1-5 against each criterion, with the weakest point to fix first.

Use Canvas to create this as an editable document.`,
      proTip: 'Ask Deep Research for projects the scheme funded in the last 3 years: matching their scale and language is often the quickest way to raise your score.'
    },
    helpers: [
      { type: 'deep_research', title: 'Prompt to Research the Funder',
        prompt: `Research the {{FUNDING_SCHEME}} scheme and its funder. Report: stated priorities and strategy, eligibility rules, typical award size and duration, success rates if published, 10 recently funded projects (title, institution, amount, link), common reviewer feedback, and deadlines. Cite every source.` },
      { type: 'general', title: 'Prompt to Turn the Call into a Checklist',
        prompt: `From the {{FUNDING_SCHEME}} call text I paste below, make a submission checklist: each required section with its word or page limit, the scoring criteria with weightings, required attachments, budget rules, eligibility conditions and the internal and external deadlines. Flag anything unclear to ask the research office.` }
    ]
  },
  {
    id: 'research_ethics_precheck',
    category: 'academic', role: 'Researcher', level: ['University & College', 'Generic'],
    categories: ['research'],
    features: ['Gemini Notebook', 'Canvas Mode'], connectors: [],
    promptType: 'notebooklm',
    timing: ['anytime'],
    hints: [
      { en: 'Ethics application sent back again?', audience: ['Researcher'] },
      { en: 'Need a consent form participants understand?', audience: ['Researcher', 'Student'] }
    ],
    en: {
      title: 'Research Ethics Application Pre-Check',
      summary: 'Check your ethics application against your institution\'s policy in Gemini Notebook before you submit, then rewrite the participant information sheet in plain language with Canvas Mode.',
      steps: [
        'Create a Gemini Notebook and add your institution\'s research ethics policy, the application form guidance, your draft protocol, consent form and participant information sheet.',
        'Run the pre-check prompt. It lists every gap with the policy clause and the part of your draft it refers to.',
        'Fix the gaps, use the Set up prompt in Canvas Mode to rewrite the information sheet in plain language, and have your supervisor or ethics officer review before you submit.'
      ],
      prompt: `You are a research ethics adviser at {{INSTITUTION_NAME}}. Pre-check this ethics application for the study "{{STUDY_TITLE}}" with {{PARTICIPANT_GROUP}} before it goes to the ethics committee.

KNOWLEDGE SOURCES (the sources in this notebook)
The research ethics policy, the application form guidance, and the researcher's protocol, consent form and participant information sheet.

GROUNDING RULES
1. Judge the application only against the policy and the form guidance. Cite the clause (document, section) for every issue.
2. Quote the exact sentence in the researcher's draft that the issue refers to, or write "Missing" if it isn't there.
3. If the policy doesn't cover a question, say so and recommend asking the ethics office. Never invent rules.

OUTPUT
1. **Risk level**: Minimal | Low | Higher risk, with the policy criteria that decide it.
2. **Gap table**: Requirement | Policy clause | What the draft says | Status (Met | Partly met | Missing) | Fix.
3. **Consent and information sheet check**: voluntary participation, right to withdraw, data storage and retention, anonymity, risks, contacts, and the reading level.
4. **Special checks**: minors or vulnerable groups, deception, sensitive data, data leaving the institution, use of AI tools on participant data.
5. **Top 5 fixes**, most important first.`,
      proTip: 'Keep participant data out of the notebook: the pre-check only needs your protocol and forms, not real responses or names.'
    },
    helpers: [
      { type: 'canvas', title: 'Prompt to Rewrite the Participant Information Sheet',
        prompt: `Rewrite my participant information sheet for "{{STUDY_TITLE}}" so {{PARTICIPANT_GROUP}} can understand it at about a 12-year-old reading level. Keep every fact. Use short headings: What is the study? Why me? What will I do? Risks and benefits; Your data; Can I stop?; Who to contact. Paste my current sheet below. Use Canvas to create this as an editable document.` }
    ]
  },

  // ---------------------------------------------------------------------------------------------
  // SKILLS (reusable procedures saved once in Gemini Enterprise)
  // ---------------------------------------------------------------------------------------------
  {
    id: 'skill_revision_quiz',
    category: 'student', role: 'Student', level: ALL_LEVELS,
    categories: ['students'],
    features: ['Skills'], connectors: [],
    promptType: 'skills',
    timing: ['midterm', 'finals'],
    hints: [
      { en: 'Exams soon and notes everywhere?', audience: ['Student'] },
      { en: 'Want a quiz from any lecture in seconds?', audience: ['Student'], timing: ['anytime'] }
    ],
    en: {
      title: 'Revision Quiz Skill',
      summary: 'Save one generic Skill and turn any notes or slides, for any course, into a practice quiz with answers, explanations and a review plan. You add the course, level and focus each time you use it.',
      steps: [
        'In Gemini Enterprise, open Skills, create a new skill and paste the skill definition. It has no course details, so one skill works for every subject.',
        'When you revise, attach or paste your notes in Gemini and use the Set up prompt to call the skill, adding your course, level and the topics to focus on.',
        'Answer the questions before you open the answer key, check any answer you doubt against your notes, and repeat the quiz on the days in the review plan.'
      ],
      prompt: `SKILL NAME: Revision quiz

DESCRIPTION
Use this skill when I share notes, slides or readings (attached or pasted) and ask for a quiz, revision questions or practice questions.

INPUTS
- The material I attach or paste in my request.
- Details I may add in my request: the course, my level, how many questions and the topics to focus on. If I don't say, assume an introductory university level and 10 questions on every main topic.

INSTRUCTIONS
1. Use only the material I share. If it is too short for the number of questions asked, say so and make fewer.
2. Mix question types: about 40% multiple choice (4 options, one correct), 30% short answer, 20% "explain why" and at least one applied scenario.
3. Mix easy, medium and hard questions, and cover every main topic (or the topics I asked for).
4. Put the questions first with no answers. Then an answer key that explains each answer in 1-2 sentences and names the slide, page or heading it comes from.
5. End with a review plan: repeat the quiz after 1 day, 3 days and 7 days, and list the 3 topics to revisit first.

OUTPUT FORMAT
Headings: Questions, Answer key, Review plan. Numbered questions.

QUALITY CHECKS
No trick questions. No facts that aren't in the material. Wrong options must be believable.

EXAMPLE
Q3 (short answer): What are the two stages of photosynthesis? Answer: the light-dependent reactions and the Calvin cycle (Slide 6).`,
      proTip: 'Keep the skill generic and put the details in your request: "Use my Revision quiz skill, Biology 101, first year, 15 questions on enzymes" gives a different quiz from the same skill.'
    },
    helpers: [
      { type: 'general', title: 'Prompt to Use the Skill with Your Course Details',
        prompt: `Use my Revision quiz skill on the notes I've attached. Course: {{COURSE_NAME}}. Level: {{STUDY_LEVEL}}. Make {{QUESTION_COUNT}} questions and focus on {{FOCUS_TOPICS}}.` },
      { type: 'general', title: 'Prompt to Test the Skill on Sample Notes',
        prompt: `Write one page of sample lecture notes on a core topic in {{COURSE_NAME}} at {{STUDY_LEVEL}} level, with 4 headings and key terms in bold. I will use it to test my "Revision quiz" skill before using it on my real notes.` }
    ]
  },
  {
    id: 'skill_feedback_comments',
    category: 'academic', role: 'Lecturer', level: ALL_LEVELS,
    categories: ['teaching'],
    features: ['Skills'], connectors: [],
    promptType: 'skills',
    timing: ['midterm', 'finals'],
    hints: [
      { en: 'Writing the same feedback 100 times?', audience: ['Lecturer', 'TA'] },
      { en: 'Want feedback that sounds like you?', audience: ['Lecturer', 'TA'], timing: ['anytime'] }
    ],
    en: {
      title: 'Feedback Comments in My Marking Voice Skill',
      summary: 'Save one generic Skill that drafts rubric-based feedback in your own voice for any course or assignment. Each time you use it, paste the rubric, a few of your past comments and the student\'s work.',
      steps: [
        'In Gemini Enterprise, open Skills, create a new skill and paste the skill definition. It names no course or rubric, so the same skill works for every assignment.',
        'When marking, use the Set up prompt: paste the rubric, 2-3 of your past comments and one student\'s work or your notes on it, then ask for feedback.',
        'Read every comment, change anything that isn\'t right for that student, and release the marks and feedback through your LMS yourself.'
      ],
      prompt: `SKILL NAME: Feedback in my marking voice

DESCRIPTION
Use this skill when I ask for feedback, marking comments or feed-forward on a piece of student work.

INPUTS (all given in my request, pasted or attached)
- One student's work, or my marking notes on it.
- The rubric or marking criteria. If I don't give one, ask for it before writing feedback.
- Optional: 2-3 of my past feedback comments (to copy my voice), the course, the assignment type and a word limit (default 150 words).

INSTRUCTIONS
1. For each rubric criterion, decide the level the evidence supports and quote one short piece of evidence from the work or my notes.
2. If I shared past comments, write in the same voice: same warmth, sentence length and way of addressing the student (use "you"). Otherwise use a warm, direct, encouraging tone.
3. Structure: 2 strengths, 2 priorities to improve (each tied to a criterion) and 1 concrete next step for the next assignment.
4. Keep within the word limit.
5. If there isn't enough evidence for a criterion, write "Check: not enough evidence" instead of guessing.

OUTPUT FORMAT
A short table: Criterion | Suggested level | Evidence. Then the feedback comment as one paragraph ready to paste.

QUALITY CHECKS
No marks or grades unless I ask. No comments on the student's personality. Never invent quotes from the work.

EXAMPLE
"You build a clear argument in your introduction. To move into the top band, link each paragraph back to the question, as you did well on page 2."`,
      proTip: 'Skills can\'t hold files, so keep your rubric and 3 best past comments (names removed) in one doc and paste them into each request: the skill stays generic and the request makes it yours.'
    },
    helpers: [
      { type: 'general', title: 'Prompt to Use the Skill for One Student',
        prompt: `Use my Feedback in my marking voice skill. Course: {{COURSE_NAME}}. Assignment: {{ASSIGNMENT_TYPE}}. Word limit: {{WORD_LIMIT}} words.
Rubric: (paste below)
My past comments: (paste 2-3 below)
Student work or my marking notes: (paste or attach below)` },
      { type: 'canvas', title: 'Prompt to Write Sample Comments for Your Voice',
        prompt: `Help me write 4 model feedback comments for {{ASSIGNMENT_TYPE}} in {{COURSE_NAME}}, one for each rubric band (excellent, good, pass, not yet). I will edit them into my own voice and paste them into my feedback skill requests. Each comment: 80-120 words, 2 strengths, 2 priorities, 1 next step. Use Canvas to create this as an editable document.` }
    ]
  },
  {
    id: 'skill_lesson_plan',
    category: 'academic', role: 'Lecturer', level: ALL_LEVELS,
    categories: ['teaching'],
    features: ['Skills', 'Canvas Mode'], connectors: [],
    promptType: 'skills',
    timing: ['sem_start', 'teaching'],
    hints: [
      { en: 'Lesson plans due in the department format?', audience: ['Lecturer', 'TA'] },
      { en: 'Planning next week\'s class tonight?', audience: ['Lecturer'], timing: ['teaching'] }
    ],
    en: {
      title: 'Lesson Plan Skill',
      summary: 'Save one generic Skill that drafts structured lesson plans with timings, differentiation and checks for understanding, for any subject. Add the subject, topic, class and your school\'s template when you use it, and open the plan in Canvas Mode.',
      steps: [
        'In Gemini Enterprise, open Skills, create a new skill and paste the skill definition. It has a default plan structure and no school or subject details.',
        'Use the Set up prompt to call the skill with your subject, topic, class and lesson length, and paste your department\'s template if you have one. Canvas Mode opens the plan as an editable document.',
        'Adjust the activities for your class, check timings and materials, and share the plan with your department or teaching assistant.'
      ],
      prompt: `SKILL NAME: Lesson plan

DESCRIPTION
Use this skill when I ask for a lesson plan, class plan or session outline.

INPUTS (given in my request)
- Subject, topic, class or year group, and lesson length. If I don't give a length, assume 50 minutes.
- Optional: notes on the class (prior knowledge, needs) and my school's lesson plan template, pasted in the request.

INSTRUCTIONS
1. If I paste a template, follow its sections and order exactly. Otherwise use: lesson details, learning objectives, prior knowledge, timed phases, differentiation, assessment for learning, materials, safety and wellbeing.
2. Write 2-3 measurable learning objectives using action verbs.
3. Plan timed phases (starter, teaching, guided practice, independent practice, plenary) that add up to the lesson length.
4. Add differentiation: support for students who need it, stretch for those ready for more, and notes for students with special educational needs.
5. Include a quick check for understanding in each phase and an exit ticket question.
6. List the materials, and any safety or wellbeing notes.

OUTPUT FORMAT
The sections as headings, with the timed phases in a table: Time | Activity | Teacher does | Students do | Check.

QUALITY CHECKS
Timings add up. Every objective is checked at least once. Activities match the year group.

EXAMPLE
"10 min · Think-pair-share: Why do leaves change colour? · Check: 3 pairs share; listen for 'chlorophyll'."`,
      proTip: 'Keep your department template in a doc and paste it into the request: the skill then follows your format, and colleagues in other departments can use the same skill with theirs.'
    },
    helpers: [
      { type: 'canvas', title: 'Prompt to Use the Skill for Your Next Lesson',
        prompt: `Use my Lesson plan skill. Subject: {{SUBJECT}}. Topic: {{TOPIC}}. Class: {{YEAR_GROUP}}. Length: {{LESSON_LENGTH}} minutes. Notes on the class: {{CLASS_NOTES}}. If I paste a template below, follow it. Use Canvas to create this as an editable document.` },
      { type: 'canvas', title: 'Prompt to Create a Department Lesson Plan Template',
        prompt: `Create a one-page lesson plan template for the {{SUBJECT}} department with these sections: lesson details, learning objectives, prior knowledge, timed lesson phases table, differentiation, assessment for learning, materials, safety and wellbeing, reflection. Add one-line guidance under each heading. Use Canvas to create this as an editable document.` }
    ]
  },
  {
    id: 'skill_meeting_minutes',
    category: 'administrative', role: 'SAO', level: ALL_LEVELS,
    categories: ['leadership', 'student_affairs', 'finance', 'it_admin'],
    features: ['Skills'], connectors: [],
    promptType: 'skills',
    timing: ['anytime'],
    hints: [
      { en: 'Minutes still not out a week later?', audience: ['SAO', 'Finance', 'IT Admin', 'Dean'] },
      { en: 'Who promised to do what at that meeting?', audience: ['Program Leader', 'Dean', 'SAO'] }
    ],
    en: {
      title: 'Meeting Minutes & Action Log Skill',
      summary: 'Save one generic Skill that turns any meeting transcript or notes into formal minutes with decisions, owners and deadlines. Add the meeting details and your office\'s template in the request when you use it.',
      steps: [
        'In Gemini Enterprise, open Skills, create a new skill and paste the skill definition. It names no office or meeting, so every team can use the same skill.',
        'After a meeting, attach the transcript or notes in Gemini and use the Set up prompt to call the skill with the meeting name, date and chair, pasting your minutes template if you have one.',
        'The chair or secretary checks decisions and owners before the minutes are circulated, and the action log is copied into your tracker.'
      ],
      prompt: `SKILL NAME: Meeting minutes and action log

DESCRIPTION
Use this skill when I share a meeting transcript, recording summary or notes and ask for minutes, a summary or the actions.

INPUTS (given in my request)
- The transcript or notes, attached or pasted.
- Optional: the meeting name, date, chair, agenda, and my office's minutes template pasted in the request.

INSTRUCTIONS
1. If I paste a template, follow its headings. Otherwise use: header (meeting, date, time, chair, attendees, apologies), previous minutes, agenda items, any other business, action log, next meeting.
2. For each agenda item write: a 2-4 sentence neutral summary, the decision (or "No decision"), and the actions.
3. Record decisions exactly as agreed. If the transcript is unclear, write "[To confirm with chair]" instead of guessing.
4. Use names only for owners of actions. Don't attribute opinions to named people unless my template asks for it.
5. Mark anything confidential (staff, student or financial matters) as "Confidential item" and keep the detail short.
6. End with the action log and the date of the next meeting if mentioned.

OUTPUT FORMAT
Minutes under the headings, then a table: No. | Action | Owner | Due date | Status (New | Carried forward).

QUALITY CHECKS
Every action has an owner and a due date, or is flagged "[Owner / date needed]". No decisions that weren't made.

EXAMPLE
"Item 3 · Orientation budget. Decision: approved at 40,000. Action: Finance to release funds · Owner: K. Lee · Due: 15 Aug."`,
      proTip: 'Paste a past set of approved minutes into the request the first few times: Gemini matches its tone and level of detail far better from a real example than from a description.'
    },
    helpers: [
      { type: 'general', title: 'Prompt to Use the Skill After a Meeting',
        prompt: `Use my Meeting minutes skill on the transcript I've attached. Meeting: {{MEETING_NAME}}. Date: {{MEETING_DATE}}. Chair: {{CHAIR_NAME}}. Follow the minutes template I paste below, if there is one.` },
      { type: 'canvas', title: 'Prompt to Create a Minutes Template',
        prompt: `Create a formal meeting minutes template for the {{OFFICE_NAME}}: header block (meeting, date, time, venue, chair, secretary, attendees, apologies), confirmation of previous minutes, matters arising, agenda items with summary / decision / actions, any other business, action log table and next meeting. Use Canvas to create this as an editable document.` }
    ]
  },

  // ---------------------------------------------------------------------------------------------
  // AGENT DESIGNER · CHAT AGENT (new; the other three chat agents are in app.js)
  // ---------------------------------------------------------------------------------------------
  {
    id: 'it_service_desk_agent',
    category: 'operational', role: 'IT Admin', level: ALL_LEVELS,
    categories: ['it_admin'],
    features: ['Workflow Builder', 'Gemini Notebook'], connectors: ['Drive Connector'],
    promptType: 'agent_designer',
    timing: ['sem_start', 'anytime'],
    hints: [
      { en: 'Same Wi-Fi and password tickets every term?', audience: ['IT Admin'] },
      { en: 'Want staff to get IT answers at 2am?', audience: ['IT Admin', 'Dean'], timing: ['anytime'] }
    ],
    en: {
      title: 'IT Service Desk Chat Agent',
      summary: 'Create a chat agent in Workflow Builder that answers staff and student IT questions from your knowledge base articles, walks people through fixes step by step and hands over a ready-to-file ticket when it can\'t help.',
      steps: [
        'Put your IT knowledge base articles in one Google Drive folder and connect it through the Drive Connector. Add the same articles to a Gemini Notebook and use the Set up prompt to build a test set of real questions with cited answers.',
        'In Workflow Builder, create a chat agent, paste the instructions and add the knowledge base folder as its knowledge source. Ask it the test questions and compare its answers and citations with the notebook.',
        'Fix gaps in the articles, then publish the agent link on the IT help page. Review the handover tickets weekly to find articles to write next.'
      ],
      prompt: `You are the IT Service Desk Agent for {{INSTITUTION_NAME}}. You help staff and students fix common IT problems: accounts and passwords, multi-factor sign-in, Wi-Fi, email, printing, the LMS and classroom AV.

KNOWLEDGE SOURCES (Workflow Builder: the IT knowledge base folder in Google Drive, connected through the Drive Connector)
The IT knowledge base articles, service catalogue and IT policies.

GROUNDING RULES
1. Answer only from the knowledge sources and cite the article title. Don't use general web knowledge for our systems.
2. If no article covers the problem, say so and go to HANDOVER. Never guess settings, server names or policies.
3. Never ask for or accept passwords, MFA codes or full ID numbers. If someone shares one, tell them to change it now.

HOW TO HELP
1. Ask one question at a time to identify the system, device and error message.
2. Give numbered steps, one action per step, and ask the person to confirm before the next step.
3. Keep replies short and plain. Offer the article link at the end.

HANDOVER (when the fix fails, the problem isn't covered, it's a security issue, or the person asks for a human)
Write a ticket summary they can paste into {{TICKET_PORTAL}}: name and role (ask), system, device, error message, steps already tried, urgency (Low | Medium | High: High if teaching or exams are affected). For a suspected phishing email or hacked account, tell them to contact {{SECURITY_CONTACT}} immediately.

Don't perform account changes yourself and don't promise response times that aren't in the service catalogue.`,
      proTip: 'Connecting the knowledge base folder through the Drive Connector means the agent uses the latest version of each article, so fixing an article fixes the answers.',
      connectorGuide: {
        name: 'Drive Connector',
        steps: [
          'Ask your Gemini Enterprise admin to turn on the Drive Connector.',
          'Create a Google Drive folder for IT knowledge base articles and share it with the IT team as editors.',
          'In Workflow Builder, add the folder as the chat agent\'s knowledge source through the Drive Connector.',
          'Update an article and ask the agent about it to check it uses the new version.'
        ]
      }
    },
    helpers: [
      { type: 'notebooklm', title: 'Prompt to Build a Test Set from Your Articles',
        prompt: `Using only the IT knowledge base articles in this notebook, write 12 questions staff and students at {{INSTITUTION_NAME}} really ask: 4 about accounts and passwords, 3 about Wi-Fi and devices, 3 about email and the LMS, and 2 the articles don't cover. For each, give the correct answer in 2-3 steps and cite the article title. For the uncovered ones write "Not in the knowledge base". Present a table: Question | Expected answer | Article.` },
      { type: 'canvas', title: 'Prompt to Draft Missing Knowledge Base Articles',
        prompt: `Write 3 short IT knowledge base articles for {{INSTITUTION_NAME}}: "Reset your password", "Set up multi-factor sign-in on a new phone" and "Connect to campus Wi-Fi". Each with: who it's for, before you start, numbered steps, if it doesn't work, and when to contact the service desk. Mark system-specific details as [CHECK]. Use Canvas to create this as an editable document.` }
    ]
  },

  // ---------------------------------------------------------------------------------------------
  // AGENT DESIGNER · WORKFLOW AGENTS (Drive / Email Connector triggers, conditions, human approvals)
  // ---------------------------------------------------------------------------------------------
  {
    id: 'special_consideration_workflow',
    category: 'administrative', role: 'SAO', level: ALL_LEVELS,
    categories: ['student_affairs'],
    features: ['Workflow Builder'], connectors: ['Drive Connector', 'Email Connector'],
    promptType: 'agent_designer',
    timing: ['midterm', 'finals'],
    hints: [
      { en: 'Extension requests piling up before exams?', audience: ['SAO'] },
      { en: 'Want every special case checked by a person?', audience: ['SAO', 'Dean'], timing: ['anytime'] }
    ],
    en: {
      title: 'Special Consideration Workflow Agent',
      summary: 'A workflow agent that picks up each special consideration application saved to the intake folder, checks the evidence against policy, decides the route and drafts the reply. Officers approve every reply, escalated cases also need the head of office, and only approved emails are sent.',
      steps: [
        'Use the Set up prompts to draft the evidence rules, the email templates and sample applications, and save each as a file. Check that the intake folder (Drive Connector) and the office mailbox (Email Connector) are connected.',
        'In Workflow Builder (Agents → Create agent), paste the prompt into Describe your agent to build the agent steps. Then follow the Flow builder setup below to add the trigger, the condition, the approvals and the send email step by hand, because Describe your agent can\'t create those.',
        'Test with the sample applications in the Test tab, then turn it on. Officers approve each reply in Runs (Needs Review); a rejected run stops and nothing is sent.'
      ],
      prompt: `Create a workflow agent for the {{OFFICE_NAME}} at {{INSTITUTION_NAME}} that processes one special consideration application at a time (assignment extension, deferred exam or leave of absence). Use these steps in order:

1. READ: read the application form in the new file and extract: reference, student name, student ID, student email, programme, course code, assessment, request type, reason (medical | compassionate | personal | other), affected dates, days requested, the student's statement, the evidence listed (type, date, issuer) and earlier requests this term.
2. CHECK: compare the application with the special consideration policy and the evidence rules table. List missing evidence or blank required fields, risk flags, and the policy clause for each point.
3. DECIDE: write the route as the first line of your output, exactly one of:
   ROUTE: EVIDENCE (evidence or required fields are missing)
   ROUTE: ESCALATE (more than {{AUTO_LIMIT_DAYS}} days requested, dates overlap a final exam, the statement mentions safety, mental health or welfare, third or later request this term, or no standard rule fits)
   ROUTE: STANDARD (everything else)
4. DRAFT: draft the email to the student from the matching template and cite the policy clause. For EVIDENCE, list exactly what is missing. For ESCALATE, also write a one-page brief (summary, timeline, evidence, clauses, options with pros and cons, flags); if a welfare flag is present, add "Contact Student Wellbeing today at {{WELFARE_EMAIL}}."
5. SUMMARISE: end with a reviewer summary (student ID, request, route, key reasons, file name) and one log row: date, reference, student ID, route.

Base every point on the policy and evidence rules and cite the clause. Don't judge medical evidence beyond the policy rules. Keep student details confidential. Never send anything yourself.`,
      proTip: 'Keep the ROUTE line exactly as written: the Condition steps you add in the flow builder read it, so a rephrased route would send the case down the wrong branch.',
      connectorGuide: {
        name: 'Flow builder',
        steps: [
          'Trigger: click the trigger, choose App event → Google Drive, pick the new-file event for the intake folder, and add a filter so only application forms start a run.',
          'Knowledge: open each agent step and add the special consideration policy, the evidence rules table and the email templates as knowledge files.',
          'Condition: after the agent step, add Flow control → Condition on the agent output with two branches: output contains "ROUTE: ESCALATE", and everything else.',
          'Approvals: in the ESCALATE branch add Human in the loop → Approval for a case officer, then a second Approval for the head of office. In the other branch add one Approval for a case officer. Show the reviewer the draft email and the summary.',
          'Send: at the end of each branch add the Gmail or Outlook send email action from the office mailbox to the student\'s email, using the drafted email. If a reviewer rejects, the run stops and nothing is sent.',
          'Test the three sample applications in the Test tab, then click Turn on.'
        ]
      }
    },
    helpers: [
      { type: 'canvas', title: 'Prompt to Draft the Evidence Rules Table',
        prompt: `Act as a student affairs policy officer at {{INSTITUTION_NAME}}. Draft an evidence rules table for special consideration requests. Rows: extension, deferred exam, leave of absence. For each row, list the accepted reasons (medical, compassionate, personal), the evidence required for each reason, the most days the office can approve without escalation (default: {{AUTO_LIMIT_DAYS}}), and who approves. End with the cases that must always go to the head of office. Use Canvas to create this as an editable document.` },
      { type: 'canvas', title: 'Prompt to Draft the Email Templates',
        prompt: `Write 4 short, warm email templates for the {{OFFICE_NAME}} to send students about special consideration requests: (1) approved, (2) partly approved with new dates, (3) not approved, with the reason and how to appeal, (4) more evidence needed. Use placeholders for student name, course code, dates and policy clause. Keep each under 150 words, in plain English. Use Canvas to create this as an editable document.` },
      { type: 'canvas', title: 'Prompt to Generate Sample Applications for Testing',
        prompt: `Create 3 realistic sample special consideration application forms from students at {{INSTITUTION_NAME}} to the {{OFFICE_NAME}}, so staff can test the workflow. Use fictional details only and mark each "SAMPLE: fictional data for testing". Each form has: reference and date, student details with email, request type, course code, assessment, dates and days requested, reason, a 100-word statement, evidence list and earlier requests this term. Sample 1 is complete; sample 2 is missing its evidence; sample 3 mentions a welfare concern and asks for more than {{AUTO_LIMIT_DAYS}} days. Use Canvas to create this as an editable document.` }
    ]
  },
  {
    id: 'scholarship_application_workflow',
    category: 'administrative', role: 'SAO', level: ['University & College', 'High School', 'Generic'],
    categories: ['student_affairs', 'finance'],
    features: ['Workflow Builder'], connectors: ['Drive Connector', 'Email Connector'],
    promptType: 'agent_designer',
    timing: ['sem_start', 'summer'],
    hints: [
      { en: 'Hundreds of scholarship applications to screen?', audience: ['SAO', 'Finance'] },
      { en: 'Need a fair, documented shortlist for the panel?', audience: ['SAO', 'Dean'], timing: ['anytime'] }
    ],
    en: {
      title: 'Scholarship Screening Workflow Agent',
      summary: 'A workflow agent that screens each scholarship application saved to a Drive folder: it checks eligibility and documents, scores eligible applications against the rubric and drafts the right email or panel summary. A scholarship officer approves every outcome before anything is sent.',
      steps: [
        'Use the Set up prompts to turn the scholarship rules into an eligibility checklist and a scoring rubric, and draft the email templates. Save each as a file, and check that the applications folder (Drive Connector) and the scholarship mailbox (Email Connector) are connected.',
        'In Workflow Builder (Agents → Create agent), paste the prompt into Describe your agent to build the agent steps. Then follow the Flow builder setup below to add the trigger, the condition, the approval and the send email steps by hand.',
        'Test with the sample applications, then turn it on. The officer approves each outcome in Runs (Needs Review); the panel only receives approved shortlist summaries.'
      ],
      prompt: `Create a workflow agent for the {{OFFICE_NAME}} at {{INSTITUTION_NAME}} that screens one application for {{SCHOLARSHIP_NAME}} (closing date {{CLOSING_DATE}}) at a time. Use these steps in order:

1. READ: extract applicant name, student ID, email, programme, year, GPA, residency, financial need statement (if required), personal statement, referee details, and the documents attached or listed.
2. CHECK: compare the application with every hard requirement in the eligibility checklist. Give each requirement Met, Not met or Unclear with its clause, and list missing documents.
3. SCORE: if the applicant is eligible, score each rubric criterion 1-5 with one line of evidence quoted from the application, give the total and write a 120-word panel summary. Flag possible conflicts of interest. Judge nothing the rubric doesn't list.
4. DECIDE: write the route as the first line of your output, exactly one of:
   ROUTE: DOCUMENTS (documents are missing and the closing date has not passed)
   ROUTE: DECLINE (a hard requirement is not met)
   ROUTE: QUERY (eligibility is unclear; list what the officer must check)
   ROUTE: PANEL (eligible and scored)
5. DRAFT: for DOCUMENTS and DECLINE draft the email to the applicant from the templates (name the missing documents or the unmet requirement and its clause). For PANEL draft the email to the panel with the summary and score table. For QUERY draft no email.
6. SUMMARISE: end with one log row: date, applicant ID, route, score (if any).

Treat every applicant by the same rubric. Never use name, gender, ethnicity, religion or photos in scoring. Keep financial details confidential. Never send anything yourself.`,
      proTip: 'Ask two officers to score the same 5 sample applications by hand first and compare with the agent\'s scores: if they differ a lot, tighten the rubric wording before launch.',
      connectorGuide: {
        name: 'Flow builder',
        steps: [
          'Trigger: click the trigger, choose App event → Google Drive, pick the new-file event for the applications folder, and add a filter for application files.',
          'Knowledge: open each agent step and add the scholarship rules, the eligibility checklist, the scoring rubric and the email templates as knowledge files.',
          'Condition: after the agent step, add Flow control → Condition on the agent output with three branches: contains "ROUTE: PANEL", contains "ROUTE: QUERY", and everything else (DOCUMENTS or DECLINE).',
          'Approvals: add Human in the loop → Approval for the scholarship officer at the start of the PANEL and the DOCUMENTS / DECLINE branches, showing the draft and the summary. In the QUERY branch add Request info so the officer records what they checked.',
          'Send: after the approval in the PANEL branch, add a send email action to the panel address; in the DOCUMENTS / DECLINE branch, send the drafted email to the applicant from the scholarship mailbox. A rejected run stops with nothing sent.',
          'Test with the sample applications in the Test tab, then click Turn on.'
        ]
      }
    },
    helpers: [
      { type: 'canvas', title: 'Prompt to Build the Eligibility Checklist and Scoring Rubric',
        prompt: `From the {{SCHOLARSHIP_NAME}} rules I paste below, create (1) an eligibility checklist of hard requirements with the clause for each, and (2) a scoring rubric with 4-5 criteria, weightings and a 1-5 description for each level. Flag rules that are open to interpretation. Use Canvas to create this as an editable document.` },
      { type: 'canvas', title: 'Prompt to Draft the Applicant Email Templates',
        prompt: `Write 3 short email templates for the {{OFFICE_NAME}} about {{SCHOLARSHIP_NAME}}: (1) missing documents, with the closing date {{CLOSING_DATE}}, (2) not eligible, naming the requirement and where to find other funding, (3) shortlisted for the panel. Warm, plain English, under 130 words each, with placeholders. Use Canvas to create this as an editable document.` },
      { type: 'general', title: 'Prompt to Create Sample Applications',
        prompt: `Write 4 short fictional scholarship applications for {{SCHOLARSHIP_NAME}} to test a screening workflow, each marked "SAMPLE: fictional". One strong and complete, one missing a transcript, one that fails the GPA requirement, and one with unclear residency. Include all fields: name, ID, email, programme, year, GPA, residency, statement (80 words), referee and documents.` }
    ]
  },
  {
    id: 'expense_claim_approval_workflow',
    category: 'administrative', role: 'Finance', level: ALL_LEVELS,
    categories: ['finance'],
    features: ['Workflow Builder'], connectors: ['Email Connector'],
    promptType: 'agent_designer',
    timing: ['finals', 'summer', 'anytime'],
    hints: [
      { en: 'Claims inbox overflowing at year end?', audience: ['Finance'] },
      { en: 'Big claims need the budget holder\'s OK first?', audience: ['Finance', 'Dean'], timing: ['anytime'] }
    ],
    en: {
      title: 'Expense Claim Workflow Agent',
      summary: 'A workflow agent that picks up each expense claim emailed to the claims mailbox, checks the receipts against policy, decides the route and drafts the reply. Claims over the limit need the budget holder\'s approval before finance, and replies are only sent after a person approves.',
      steps: [
        'Use the Set up prompts to turn your expense policy into a rules table and draft the reply templates, and save each as a file. Check that the claims mailbox is connected through the Email Connector.',
        'In Workflow Builder (Agents → Create agent), paste the prompt into Describe your agent to build the agent steps. Then follow the Flow builder setup below to add the email trigger, the condition, the approvals and the send email step by hand, because Describe your agent can\'t create those.',
        'Test with sample claims in the Test tab, then turn it on. Reviewers approve in Runs (Needs Review); a rejected run stops and nothing is sent.'
      ],
      prompt: `Create a workflow agent for the Finance Office at {{INSTITUTION_NAME}} that processes one expense claim email at a time. Use these steps in order:

1. READ: read the claim email and its attachments. Extract the claimant, staff or student ID, cost centre, budget holder email, purpose, and for each item: date, merchant, category, amount, currency and whether a receipt is attached.
2. CHECK: check every item against the expense policy and the expense rules table: receipt present, within the category limit, claimable, submitted within {{SUBMISSION_DAYS}} days, no duplicates in the claim. List each issue with the policy clause, and give the claim total in {{CURRENCY}}.
3. DECIDE: write the route as the first line of your output, exactly one of:
   ROUTE: RETURN (there is at least one issue)
   ROUTE: BUDGET_HOLDER (no issues and the total is over {{APPROVAL_LIMIT}})
   ROUTE: FINANCE (no issues and the total is within the limit)
4. DRAFT: draft the reply to the claimant. For RETURN, list each issue, its clause and what to resubmit. Otherwise, write a short "claim approved for payment" email with the items and total.
5. SUMMARISE: end with a reviewer summary (claimant, cost centre, budget holder, total, route, issues) and one log row: date, claimant ID, cost centre, total, route.

Never change amounts or invent receipts. Flag possible duplicates or split claims for finance without accusing anyone. Never send anything yourself.`,
      proTip: 'Keep the limits in the rules table, not in the prompt, and keep the ROUTE line exactly as written: the Condition step reads it, so finance can change a limit without touching the flow.',
      connectorGuide: {
        name: 'Flow builder',
        steps: [
          'Trigger: click the trigger, choose App event → Gmail (or Outlook) → When an email is received for the claims mailbox, and add a filter such as subject contains "Expense claim" with an attachment.',
          'Knowledge: open each agent step and add the expense policy, the rules table and the reply templates as knowledge files.',
          'Condition: after the agent step, add Flow control → Condition on the agent output with two branches: output contains "ROUTE: BUDGET_HOLDER", and everything else (RETURN or FINANCE).',
          'Approvals: in the BUDGET_HOLDER branch add Human in the loop → Approval for the budget holder, then an Approval for a finance officer. In the other branch add one Approval for a finance officer. Show the reviewer the summary and the draft reply.',
          'Send: at the end of each branch add the Gmail or Outlook send email action that replies to the claimant from the claims mailbox with the drafted reply. If a reviewer rejects, the run stops and nothing is sent.',
          'Test with three sample claims (compliant, over the limit, missing a receipt) in the Test tab, then click Turn on.'
        ]
      }
    },
    helpers: [
      { type: 'canvas', title: 'Prompt to Turn the Expense Policy into a Rules Table',
        prompt: `From the expense policy I paste below, create a rules table for {{INSTITUTION_NAME}}: expense category, limit per item or per day in {{CURRENCY}}, receipt required (yes / no / over a threshold), non-claimable items, approval needed, and the policy clause. Add the general rules (submission within {{SUBMISSION_DAYS}} days, approval above {{APPROVAL_LIMIT}}). Use Canvas to create this as an editable document.` },
      { type: 'canvas', title: 'Prompt to Draft the Claim Reply Templates',
        prompt: `Write 2 short email templates for the Finance Office at {{INSTITUTION_NAME}}: (1) claim returned, listing issues and what to resubmit, (2) claim approved for payment, with the expected payment date. Friendly, plain English, under 120 words each, with placeholders for name, claim reference, items and clause. Use Canvas to create this as an editable document.` }
    ]
  },
  {
    id: 'exam_paper_moderation_workflow',
    category: 'academic', role: 'Program Leader', level: ['University & College', 'High School'],
    categories: ['teaching', 'leadership'],
    features: ['Workflow Builder'], connectors: ['Drive Connector', 'Email Connector'],
    promptType: 'agent_designer',
    timing: ['midterm', 'finals'],
    hints: [
      { en: 'Exam papers waiting for moderation?', audience: ['Program Leader', 'Lecturer'] },
      { en: 'Does every paper cover the learning outcomes?', audience: ['Program Leader', 'Dean'], timing: ['anytime'] }
    ],
    en: {
      title: 'Exam Paper Moderation Workflow Agent',
      summary: 'A workflow agent that checks each draft exam paper saved to the moderation folder against the course outcomes and your moderation checklist, then drafts either feedback for the setter or a sign-off note. The moderator approves every outcome, clean papers also need the programme leader, and emails go out only after approval.',
      steps: [
        'Use the Set up prompt to draft a moderation checklist and save it as a file. Check that the moderation folder (Drive Connector) and the department mailbox (Email Connector) are connected.',
        'In Workflow Builder (Agents → Create agent), paste the prompt into Describe your agent to build the agent steps. Then follow the Flow builder setup below to add the trigger, the condition, the approvals and the send email steps by hand.',
        'Test with a past paper, then turn it on. The moderator and programme leader approve in Runs (Needs Review); a rejected run stops and nothing is sent.'
      ],
      prompt: `Create a workflow agent for the {{DEPARTMENT_NAME}} at {{INSTITUTION_NAME}} that pre-checks one draft exam paper for {{EXAM_SESSION}} at a time, so moderators can focus on judgement. Use these steps in order:

1. READ: extract the course code (from the file name), setter, duration, total marks, each question with its marks and topic, and the marking scheme.
2. CHECK: check the paper against the course outcomes, the moderation checklist, the assessment policy and the style guide: outcome coverage (each outcome → the questions that assess it, or "Not assessed"), marks adding up, marking scheme matching each question, level and timing, clarity, fairness and accessibility, and policy issues with the clause. Rate each issue Major or Minor.
3. DECIDE: write the route as the first line of your output, exactly one of:
   ROUTE: REVISE (at least one Major issue)
   ROUTE: SIGN_OFF (only Minor issues or none)
4. DRAFT: for REVISE, draft an email to the setter listing each Major issue with a suggested fix (never rewrite questions). For SIGN_OFF, draft a short note to {{EXAMS_OFFICE_EMAIL}} with the course code and file name, saying the paper is ready for printing once approved, plus the Minor issues for the setter.
5. SUMMARISE: end with the moderation report as a table and one log row: date, course code, setter, route.

Keep papers confidential: don't quote them outside the report and the draft. Never send anything yourself.`,
      proTip: 'Run a past paper that you know had problems through the workflow first: if the agent misses an issue the moderators caught, add it to the checklist.',
      connectorGuide: {
        name: 'Flow builder',
        steps: [
          'Trigger: click the trigger, choose App event → Google Drive, pick the new-file event for the moderation folder, and add a filter for draft papers.',
          'Knowledge: open each agent step and add the course outlines, the moderation checklist, the assessment policy and the style guide as knowledge files.',
          'Condition: after the agent step, add Flow control → Condition on the agent output with two branches: output contains "ROUTE: SIGN_OFF", and everything else (REVISE).',
          'Approvals: in the SIGN_OFF branch add Human in the loop → Approval for the moderator, then an Approval for the programme leader. In the REVISE branch add one Approval for the moderator. Show the report and the draft.',
          'Send: at the end of the SIGN_OFF branch add a send email action to the exams office; at the end of the REVISE branch, email the setter with the drafted feedback, copying the moderator. A rejected run stops with nothing sent.',
          'Test with a past paper in the Test tab, then click Turn on. A revised paper uploaded to the folder starts a new run.'
        ]
      }
    },
    helpers: [
      { type: 'canvas', title: 'Prompt to Draft a Moderation Checklist',
        prompt: `Draft an exam paper moderation checklist for the {{DEPARTMENT_NAME}} at {{INSTITUTION_NAME}} covering: alignment with learning outcomes, mark allocation and totals, marking scheme accuracy, level of demand and timing, clarity of wording, accessibility and fairness, academic integrity (including questions easily answered with AI tools), and presentation. Mark each item Major or Minor. Use Canvas to create this as an editable document.` }
    ]
  }
];

/** Ids whose English text moved here from app.js; server.js drops any stale app.js copy of these. */
const IDS = Object.freeze(PLAYBOOKS.map(p => p.id));

const loadLang = (lang) => {
  try { return require(`./seed-playbooks.${lang}.json`); } catch (_) { return {}; }
};

/**
 * Build the shapes server.js already understands for app.js seeds:
 *   uc           - useCasesDb row (English columns + metadata)
 *   translations - { en, zh-TW, zh-CN } profiles (title, summary, steps, prompt, proTip, connectorGuide)
 *   helpers      - { en, zh-TW, zh-CN } Set up prompts, aligned by index
 *   quest        - { timing, hints: [[en, zhTw, zhCn, audience, timing?]] }
 * A missing Chinese field falls back to English so a half-translated entry never breaks seeding.
 */
function buildSeedPlaybooks() {
  const zh = { 'zh-TW': loadLang('zh-TW'), 'zh-CN': loadLang('zh-CN') };
  return PLAYBOOKS.map(p => {
    const profile = (lang) => {
      if (lang === 'en') return { ...p.en };
      const t = zh[lang][p.id] || {};
      const guide = p.en.connectorGuide
        ? { name: p.en.connectorGuide.name, steps: Array.isArray(t.connectorGuideSteps) ? t.connectorGuideSteps : p.en.connectorGuide.steps }
        : undefined;
      return {
        title: t.title || p.en.title,
        summary: t.summary || p.en.summary,
        steps: Array.isArray(t.steps) && t.steps.length === p.en.steps.length ? t.steps : p.en.steps,
        prompt: t.prompt || p.en.prompt,
        proTip: t.proTip || p.en.proTip,
        ...(guide ? { connectorGuide: guide } : {})
      };
    };
    const translations = Object.fromEntries(LANGS.map(l => [l, profile(l)]));
    const helpers = Object.fromEntries(LANGS.map(l => [l, p.helpers.map((h, i) => {
      const t = l === 'en' ? null : ((zh[l][p.id] || {}).helpers || [])[i];
      return { type: h.type, title: (t && t.title) || h.title, prompt: (t && t.prompt) || h.prompt };
    })]));
    const hintText = (l, i) => (l === 'en' ? null : ((zh[l][p.id] || {}).hints || [])[i]) || p.hints[i].en;
    const quest = {
      timing: p.timing,
      hints: p.hints.map((h, i) => [h.en, hintText('zh-TW', i), hintText('zh-CN', i), h.audience].concat(h.timing ? [h.timing] : []))
    };
    const uc = {
      id: p.id, category: p.category, role: p.role, level: p.level,
      features: p.features, connectors: p.connectors,
      title: p.en.title, summary: p.en.summary, steps: p.en.steps, prompt: p.en.prompt, proTip: p.en.proTip,
      connectorGuide: p.en.connectorGuide || null
    };
    return { id: p.id, uc, translations, helpers, quest, categories: p.categories, promptType: p.promptType };
  });
}

module.exports = { PLAYBOOKS, IDS, buildSeedPlaybooks };
