# Bao cao Full Flow - 3 IELTS Skills (Listening, Writing, Speaking)

> Ngay: 2026-03-12 | Trang thai: Da hoan thanh | 0 TypeScript errors

---

## Muc luc

1. [Tong quan kien truc](#1-tong-quan-kien-truc)
2. [Flow chung - So sanh 4 Skills](#2-flow-chung---so-sanh-4-skills)
3. [LISTENING - Full Flow](#3-listening---full-flow)
4. [WRITING - Full Flow](#4-writing---full-flow)
5. [SPEAKING - Full Flow](#5-speaking---full-flow)
6. [Backend Endpoints](#6-backend-endpoints)
7. [Danh sach file theo skill](#7-danh-sach-file-theo-skill)

---

## 1. Tong quan kien truc

```
                    ┌─────────────────────────────────────────┐
                    │            ADMIN FLOW                    │
                    │                                         │
                    │  Import ──► Detail ──► Edit             │
                    │  (Tao de)  (Xem de)  (Sua de)          │
                    └──────────────┬──────────────────────────┘
                                   │
                                   │ publishTest()
                                   ▼
                    ┌─────────────────────────────────────────┐
                    │          DATABASE (PostgreSQL)           │
                    │                                         │
                    │  Test → Stimulus → QuestionGroup →      │
                    │         Question → QuestionOption        │
                    └──────────────┬──────────────────────────┘
                                   │
                                   │ getPublicTestDetail()
                                   ▼
                    ┌─────────────────────────────────────────┐
                    │           STUDENT FLOW                   │
                    │                                         │
                    │  Practice ──► Submit ──► Result ──► Review│
                    │  (Lam bai)  (Nop bai)  (Ket qua) (Giai) │
                    └─────────────────────────────────────────┘
```

### Data Model chung

```
Test
 ├── id, title, description, skill, testType, testMode, section, status
 ├── duration, thumbnailUrl
 └── stimuli[]
      ├── id, title, content (passage/prompt), mediaUrl (audio/image)
      └── questionGroups[]
           ├── id, instruction, questionTypeCode
           └── questions[]
                ├── id, content, position, explanation {text, evidence}
                └── options[] {id, label, content, isCorrect}
```

---

## 2. Flow chung - So sanh 4 Skills

### Admin Import Steps

| Step | READING | LISTENING | WRITING | SPEAKING |
|------|---------|-----------|---------|----------|
| **1. Basic Info** | Title, skill, type, mode, section | = Reading | Title, skill, mode, section | Title, skill, mode, section |
| **2. Content** | Rich text passage | Rich text + **Audio upload** | **Prompt textarea + Image upload + Sample answer** | **Topic + Question list + Sample answers** |
| **3. Questions** | MCQ/TFNG/Gap Fill editor | = Reading | **SKIP** | **SKIP** |
| **4. Review** | Passage + Questions | Audio player + Questions | Prompt + Image preview | Topic + Question list |
| **So buoc** | **4 buoc** | **4 buoc** | **3 buoc** | **3 buoc** |

### Practice + Cham diem

| Feature | READING | LISTENING | WRITING | SPEAKING |
|---------|---------|-----------|---------|----------|
| **Layout** | Split (passage + questions) | Audio player + questions | 3-col (prompt, editor, toolbar) | 3-col (sidebar, question, notes) |
| **Input** | Chon dap an MCQ | Chon dap an MCQ | Viet bai luan | Ghi am giong noi |
| **Cham diem** | Auto-check (server) | Auto-check (server) | **AI scoring API** | **AI scoring API** |
| **API cham** | `submitAttempt()` | `submitAttempt()` | `scoreWriting()` | `scoreSpeaking()` |
| **Ket qua** | Score donut + Review | Score donut + Review | Band scores (TR/CC/LR/GRA) | Band scores (Fluency/Pronunciation/Vocab/Grammar) |

---

## 3. LISTENING - Full Flow

### 3.1 Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ADMIN: NHAP DE LISTENING                      │
│                                                                      │
│  Step 1                Step 2                Step 3        Step 4    │
│  ┌──────────┐    ┌───────────────┐    ┌──────────────┐  ┌─────────┐ │
│  │Basic Info │───►│Audio Upload + │───►│Question Edit │─►│ Review  │ │
│  │Title,Skill│    │Rich Text      │    │MCQ/Gap Fill  │  │& Submit │ │
│  │Type,Mode  │    │Transcript     │    │Matching etc  │  │         │ │
│  │Section 1-4│    │               │    │              │  │         │ │
│  └──────────┘    └───────────────┘    └──────────────┘  └────┬────┘ │
│                                                              │      │
│                                                    importTest() API  │
└──────────────────────────────────────────────────────────────┼──────┘
                                                               │
                              ┌─────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     ADMIN: XEM & SUA DE LISTENING                    │
│                                                                      │
│  ┌─────────────────────────┐    ┌──────────────────────────────────┐ │
│  │   Detail View           │    │   Edit View                      │ │
│  │                         │    │                                  │ │
│  │  Audio player           │───►│  Split pane:                     │ │
│  │  Passage content        │    │  Left: Questions + Add/Delete    │ │
│  │  Question groups        │    │  Right: Passage + Audio player   │ │
│  │  Correct answers        │    │  + Evidence highlight tool       │ │
│  └─────────────────────────┘    └──────────────────────────────────┘ │
│                                                                      │
│  API: getTestDetail()            API: updateQuestion(),              │
│                                       deleteQuestion(),              │
│                                       createQuestion(),              │
│                                       createQuestionGroup()          │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     STUDENT: LAM BAI LISTENING                       │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Header: Title | Timer (elapsed) | Submit button               │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │                                                                │  │
│  │  ┌─ Audio Player ──────────────────────────────────────────┐   │  │
│  │  │  ◄◄ 5s  ▶ Play  ►► 5s  ──●────── 02:30/05:00         │   │  │
│  │  │  Speed: [0.75x] [1x] [1.25x] [1.5x]    Volume: ████  │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  │                                                                │  │
│  │  ┌─ Question Nav ─────────────────────────────────────────┐   │  │
│  │  │  [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]            │   │  │
│  │  │  (violet = answered, gray = unanswered)                │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  │                                                                │  │
│  │  ┌─ Questions Panel (reuse ReadingQuestionsPanel) ─────────┐  │  │
│  │  │  Group 1: MCQ                                           │  │  │
│  │  │    Q1: ○ A  ○ B  ● C  ○ D                              │  │  │
│  │  │  Group 2: Gap Filling                                   │  │  │
│  │  │    Q5: [___________]                                    │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                          │                                           │
│                    Submit │ submitAttempt() API                      │
│                          ▼                                           │
│  ┌───────────────────────────────────┐   ┌────────────────────────┐ │
│  │  Result Page                      │──►│  Review Page           │ │
│  │  Score: 7/10 (donut chart)        │   │  Audio player          │ │
│  │  Dung: 7 | Sai: 2 | Bo qua: 1   │   │  Question-by-question  │ │
│  │  Time: 05:30                      │   │  Correct vs Selected   │ │
│  │  [Xem giai thich chi tiet]        │   │  Evidence highlight    │ │
│  └───────────────────────────────────┘   └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Key Files

| File | Muc dich |
|------|----------|
| `components/admin/test-import-step2-listening.tsx` | Step 2: Audio upload + rich text |
| `components/listening/listening-audio-player.tsx` | Custom audio player (speed, volume, skip) |
| `components/listening/listening-practice-header.tsx` | Header voi timer va submit |
| `components/listening/listening-question-nav.tsx` | Nav bar cau hoi |
| `app/(protected)/practice/listening/[id]/page.tsx` | Trang lam bai chinh |
| `app/(protected)/practice/listening/[id]/result/page.tsx` | Trang ket qua |
| `app/(protected)/practice/listening/[id]/review/page.tsx` | Trang xem giai thich |
| `store/listening-store.ts` | Zustand: audio state (time, rate, volume) |

### 3.3 Cham diem

- **Phuong phap**: Auto-check server-side (giong Reading)
- **API**: `POST /api/v1/practice/submit` voi `{ testId, answers: {questionId: optionId} }`
- **Backend**: So sanh `optionId` voi `isCorrect=true` → tinh so cau dung
- **Khong can AI** vi la cau hoi trac nghiem

---

## 4. WRITING - Full Flow

### 4.1 Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ADMIN: NHAP DE WRITING                        │
│                                                                      │
│  Step 1                Step 2                         Step 3         │
│  ┌──────────┐    ┌──────────────────────────┐    ┌──────────────┐   │
│  │Basic Info │───►│ Writing Content           │───►│   Review     │   │
│  │Title,Skill│    │                          │    │   & Submit   │   │
│  │Mode       │    │  ┌─ Prompt textarea ───┐ │    │              │   │
│  │Task 1/2   │    │  │ "Describe the chart │ │    │  Prompt text │   │
│  └──────────┘    │  │  showing..."         │ │    │  Chart image │   │
│                   │  └─────────────────────┘ │    │  Sample ans  │   │
│  (SKIP Step 3     │  ┌─ Chart image ───────┐ │    └──────┬───────┘   │
│   Questions)      │  │  [Upload zone]      │ │           │          │
│                   │  └─────────────────────┘ │     importTest()     │
│                   │  ┌─ Sample answer ─────┐ │                      │
│                   │  │  "The bar chart..." │ │                      │
│                   │  └─────────────────────┘ │                      │
│                   └──────────────────────────┘                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     ADMIN: XEM & SUA DE WRITING                      │
│                                                                      │
│  ┌─────────────────────────┐    ┌──────────────────────────────────┐ │
│  │   Detail View           │    │   Edit View                      │ │
│  │                         │    │                                  │ │
│  │  Prompt text            │───►│  Prompt textarea                 │ │
│  │  Chart image (zoom)     │    │  Chart image (upload/delete)     │ │
│  │  Sample answer (toggle) │    │  Sample answer textarea          │ │
│  └─────────────────────────┘    │  [Luu] button                   │ │
│                                  │                                  │ │
│  API: getTestDetail()            │  API: updateStimulus() ← NEW    │ │
│                                  │       updateQuestion()           │ │
│                                  └──────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     STUDENT: LAM BAI WRITING                         │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Header: Task badge | Word count: 267 | [Cham diem] | Timer   │  │
│  ├────────────┬───────────────────────────┬───────────────────────┤  │
│  │  1/4 width │      1/2 width            │     1/4 width         │  │
│  │            │                           │                       │  │
│  │  PROMPT    │     EDITOR                │    TOOLBAR            │  │
│  │  PANEL     │                           │                       │  │
│  │            │  ┌─ Introduction ───────┐ │  Word count progress  │  │
│  │  De bai:   │  │ The chart shows...   │ │  ████████░░ 267/250   │  │
│  │  "Describe │  └─────────────────────┘ │                       │  │
│  │   the bar  │  ┌─ Overview ──────────┐ │  Paragraph guide:     │  │
│  │   chart..."│  │ Overall, it is...   │ │  - Introduction       │  │
│  │            │  └─────────────────────┘ │  - Overview            │  │
│  │  ┌──────┐  │  ┌─ Body 1 ───────────┐ │  - Body 1             │  │
│  │  │Chart │  │  │ In terms of...     │ │  - Body 2             │  │
│  │  │Image │  │  └─────────────────────┘ │                       │  │
│  │  │(zoom)│  │  ┌─ Body 2 ───────────┐ │  ┌─ Sample Answer ──┐ │  │
│  │  └──────┘  │  │ Furthermore...     │ │  │  [Hien bai mau]  │ │  │
│  │            │  └─────────────────────┘ │  └──────────────────┘ │  │
│  │  Min: 150  │                           │                       │  │
│  └────────────┴───────────────────────────┴───────────────────────┘  │
│                          │                                           │
│              [Cham diem] │ scoreWriting() AI API                    │
│                          ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    Grading Modal                               │  │
│  │                                                                │  │
│  │    ┌──────────────────────────────────────┐                    │  │
│  │    │  Overall Band Score:  6.5            │                    │  │
│  │    ├──────────────────────────────────────┤                    │  │
│  │    │  Task Response (TR):     6.0         │                    │  │
│  │    │  Coherence (CC):         7.0         │                    │  │
│  │    │  Lexical Resource (LR):  6.5         │                    │  │
│  │    │  Grammar (GRA):          6.0         │                    │  │
│  │    ├──────────────────────────────────────┤                    │  │
│  │    │  Feedback: "Your essay demonstrates  │                    │  │
│  │    │  good paragraph structure but..."    │                    │  │
│  │    └──────────────────────────────────────┘                    │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Key Files

| File | Muc dich |
|------|----------|
| `components/admin/test-import-step2-writing.tsx` | Step 2: Prompt + image + sample |
| `components/admin/test-edit-writing-content.tsx` | Edit: prompt + image + sample (real API save) |
| `components/admin/test-detail-writing-view.tsx` | Detail: read-only view |
| `components/writing/writing-prompt-panel.tsx` | Left panel: prompt + chart image zoom |
| `components/writing/writing-editor.tsx` | Center: TipTap rich text editor |
| `components/writing/writing-toolbar-panel.tsx` | Right: word count, paragraph guide, sample toggle |
| `components/writing/writing-practice-header.tsx` | Header voi task badge, word count, grade button |
| `components/writing/grading-modal.tsx` | Modal hien thi ket qua cham diem AI |
| `app/(protected)/practice/writing/[id]/page.tsx` | Trang lam bai chinh |
| `store/writing-store.ts` | Zustand: content, wordCount, grading state |
| `lib/ai-api.ts` → `scoreWriting()` | API cham diem AI |

### 4.3 Cham diem

- **Phuong phap**: AI scoring qua backend
- **API**: `POST /api/v1/ai/writing/score` (multipart FormData)
- **Request**: `{ taskType: 1|2, question: string, answer: string, chartImage?: File }`
- **Response**: `{ overallBand, taskResponse, coherenceCohesion, lexicalResource, grammaticalRange, feedback }`
- **Frontend mapping**: `writing-store.ts` → `mapApiResponse()` xu ly ca camelCase va snake_case

### 4.4 Du lieu luu tru

```
Stimulus
 ├── content     ← Prompt/de bai
 ├── mediaUrl    ← URL chart image (Cloudinary)
 └── questionGroups[0]
      ├── instruction  ← Sample answer text
      └── questions[0]
           └── explanation.text  ← Sample answer (backup)
```

---

## 5. SPEAKING - Full Flow

### 5.1 Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ADMIN: NHAP DE SPEAKING                       │
│                                                                      │
│  Step 1                Step 2                         Step 3         │
│  ┌──────────┐    ┌──────────────────────────┐    ┌──────────────┐   │
│  │Basic Info │───►│ Speaking Content          │───►│   Review     │   │
│  │Title,Skill│    │                          │    │   & Submit   │   │
│  │Mode       │    │  ┌─ Topic textarea ────┐ │    │              │   │
│  │Part 1/2/3 │    │  │ "Food and Cooking"  │ │    │  Topic text  │   │
│  └──────────┘    │  └─────────────────────┘ │    │  Question    │   │
│                   │                          │    │  list +      │   │
│  (SKIP Step 3     │  ┌─ Questions ─────────┐ │    │  samples     │   │
│   Questions)      │  │ Q1: [What food...] │ │    └──────┬───────┘   │
│                   │  │   Sample: [........]│ │           │          │
│                   │  │ Q2: [Do you cook..]│ │     importTest()     │
│                   │  │   Sample: [........]│ │                      │
│                   │  │ [+ Them cau hoi]   │ │                      │
│                   │  └─────────────────────┘ │                      │
│                   └──────────────────────────┘                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     ADMIN: XEM & SUA DE SPEAKING                     │
│                                                                      │
│  ┌─────────────────────────┐    ┌──────────────────────────────────┐ │
│  │   Detail View           │    │   Edit View                      │ │
│  │                         │    │                                  │ │
│  │  Topic: Food & Cooking  │───►│  Topic (read-only)               │ │
│  │                         │    │                                  │ │
│  │  Cau 1: What food...   │    │  Cau 1: [editable input]        │ │
│  │    ▼ Goi y: I enjoy... │    │    Sample: [editable textarea]  │ │
│  │  Cau 2: Do you cook... │    │    [Xoa]                        │ │
│  │    ▼ Goi y: Yes, I...  │    │  Cau 2: [editable input]        │ │
│  └─────────────────────────┘    │    [Xoa]                        │ │
│                                  │  [+ Them cau hoi] ← NEW        │ │
│  API: getTestDetail()            │  [Luu tat ca]                   │ │
│                                  │                                  │ │
│                                  │  API: updateQuestion() (batch)  │ │
│                                  │       deleteQuestion()           │ │
│                                  │       createQuestion() ← NEW    │ │
│                                  └──────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     STUDENT: LAM BAI SPEAKING                        │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Header: Title | Part 2 | Cau 3/8 | [Thoat]                  │  │
│  ├──────────┬──────────────────────────────────────┬─────────────┤  │
│  │ 1/5 width│           3/5 width                  │  1/5 width  │  │
│  │          │                                      │             │  │
│  │ SIDEBAR  │  QUESTION CENTER                     │  NOTES      │  │
│  │          │                                      │             │  │
│  │ Cau hoi: │  ┌──────────────────────────────┐    │  Ghi chu:   │  │
│  │          │  │                              │    │  ┌────────┐ │  │
│  │ ● Cau 1  │  │  "What kind of food do you  │    │  │        │ │  │
│  │ ○ Cau 2  │  │   enjoy eating the most?"    │    │  │ (free  │ │  │
│  │ ○ Cau 3  │  │                              │    │  │  text) │ │  │
│  │ ○ Cau 4  │  └──────────────────────────────┘    │  │        │ │  │
│  │          │                                      │  └────────┘ │  │
│  │ ● = done │  [Hien goi y] toggle                 │  0/1000     │  │
│  │ ○ = todo │  ┌─ Sample Answer ──────────────┐    │             │  │
│  │          │  │ "I really enjoy Vietnamese   │    │             │  │
│  │          │  │  cuisine because..."         │    │             │  │
│  │          │  └──────────────────────────────┘    │             │  │
│  │          │                                      │             │  │
│  │          │  ◄ Prev    [Navigation]    Next ►    │             │  │
│  │          │                                      │             │  │
│  │          │  ┌─ Recorder ───────────────────┐    │             │  │
│  │          │  │                              │    │             │  │
│  │          │  │      ┌──────────────┐        │    │             │  │
│  │          │  │      │     🎤       │        │    │             │  │
│  │          │  │      │  (big red    │        │    │             │  │
│  │          │  │      │   button)    │        │    │             │  │
│  │          │  │      └──────────────┘        │    │             │  │
│  │          │  │    "Bat dau ghi am"          │    │             │  │
│  │          │  │                              │    │             │  │
│  │          │  │  After recording:            │    │             │  │
│  │          │  │  [▶ Play] Da ghi: 1:24       │    │             │  │
│  │          │  │  [Ghi lai]                   │    │             │  │
│  │          │  └──────────────────────────────┘    │             │  │
│  │          │                                      │             │  │
│  │          │  [Nhan danh gia] button              │             │  │
│  │          │                                      │             │  │
│  │          │  ┌─ Feedback Panel ─────────────┐    │             │  │
│  │          │  │  Overall: 6.5                │    │             │  │
│  │          │  │  Do luu loat:    6.5         │    │             │  │
│  │          │  │  Phat am:       6.0         │    │             │  │
│  │          │  │  Tu vung:       7.0         │    │             │  │
│  │          │  │  Ngu phap:      6.0         │    │             │  │
│  │          │  │  Nhan xet: "Good fluency..."│    │             │  │
│  │          │  └──────────────────────────────┘    │             │  │
│  └──────────┴──────────────────────────────────────┴─────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 Key Files

| File | Muc dich |
|------|----------|
| `components/admin/test-import-step2-speaking.tsx` | Step 2: Topic + question list editor |
| `components/admin/test-edit-speaking-content.tsx` | Edit: question CRUD + batch save |
| `components/admin/test-detail-speaking-view.tsx` | Detail: read-only question list |
| `components/speaking/speaking-practice-header.tsx` | Header voi part badge + progress |
| `components/speaking/speaking-topic-sidebar.tsx` | Left: question list voi completion tracking |
| `components/speaking/speaking-question-center.tsx` | Center: question + sample toggle + nav |
| `components/speaking/speaking-recorder.tsx` | Mic recording (Safari + Chrome compatible) |
| `components/speaking/speaking-feedback-panel.tsx` | AI feedback display (Vietnamese labels) |
| `components/speaking/speaking-notes-panel.tsx` | Right: notes textarea |
| `app/(protected)/practice/speaking/[id]/page.tsx` | Trang lam bai chinh |
| `store/speaking-store.ts` | Zustand: recording, scoring state |
| `lib/ai-api.ts` → `scoreSpeaking()` | API cham diem AI |

### 5.3 Cham diem

- **Phuong phap**: AI scoring qua backend
- **API**: `POST /api/v1/ai/speaking/score` (multipart FormData)
- **Request**: `{ audio: File, question: string }`
- **Response**: `{ overallScore, fluency, pronunciation, vocabulary, grammar, comments }`
- **Fallback**: Neu backend chua san sang → hien thong bao "Tinh nang dang phat trien"

### 5.4 Du lieu luu tru

```
Stimulus
 ├── content        ← Topic text (e.g. "Food and Cooking")
 └── questionGroups[0]
      └── questions[]
           ├── content          ← Question text
           ├── explanation.text ← Sample answer
           └── options[0]       ← Dummy: {label:'A', content:'SPEAKING_ANSWER', isCorrect:true}
```

---

## 6. Backend Endpoints

### 6.1 Admin APIs

| Method | Endpoint | Muc dich | Skill |
|--------|----------|----------|-------|
| POST | `/api/v1/admin/tests/import` | Nhap de moi | All |
| PUT | `/api/v1/admin/tests/{id}` | Cap nhat test info | All |
| DELETE | `/api/v1/admin/tests/{id}` | Xoa test | All |
| **PUT** | **`/api/v1/admin/stimuli/{id}`** | **Cap nhat stimulus** | **Writing (NEW)** |
| PUT | `/api/v1/admin/questions/{id}` | Cap nhat cau hoi | All |
| PUT | `/api/v1/admin/questions/batch` | Cap nhat nhieu cau | Speaking |
| POST | `/api/v1/admin/stimuli/{id}/question-groups` | Them nhom cau hoi | Reading/Listening |
| POST | `/api/v1/admin/question-groups/{id}/questions` | Them cau hoi | Speaking |
| DELETE | `/api/v1/admin/questions/{id}` | Xoa cau hoi | All |
| DELETE | `/api/v1/admin/question-groups/{id}` | Xoa nhom cau hoi | Reading/Listening |
| POST | `/api/v1/admin/media/upload` | Upload file (Cloudinary) | All |

### 6.2 Student APIs

| Method | Endpoint | Muc dich | Skill |
|--------|----------|----------|-------|
| GET | `/api/v1/tests/{id}` | Lay de thi public | All |
| POST | `/api/v1/practice/submit` | Nop bai MCQ | Reading/Listening |
| POST | `/api/v1/ai/writing/score` | Cham diem Writing (AI) | Writing |
| POST | `/api/v1/ai/speaking/score` | Cham diem Speaking (AI) | Speaking |

### 6.3 Backend thay doi moi

```java
// StimulusController.java - NEW PUT endpoint
@PutMapping("/{id}")
public ResponseEntity<ApiResponse<Void>> updateStimulus(
    @PathVariable Integer id,
    @RequestBody Map<String, String> body) {
    stimulusService.updateStimulus(id, body.get("content"), body.get("mediaUrl"));
    ...
}

// StimulusServiceImpl.java - NEW method
public void updateStimulus(Integer id, String content, String mediaUrl) {
    Stimulus stimulus = stimulusRepository.findById(id).orElseThrow(...);
    if (content != null) stimulus.setContent(content);
    if (mediaUrl != null) stimulus.setMediaUrl(mediaUrl);
    stimulusRepository.save(stimulus);
}
```

---

## 7. Danh sach file theo skill

### 7.1 Shared (Admin Router)

| File | Lines | Muc dich |
|------|-------|----------|
| `app/(admin)/admin/tests/import/page.tsx` | ~191 | Import wizard router (skill-based step count) |
| `components/admin/test-import-step1-basic-info.tsx` | ~170 | Step 1: title, skill, mode, section |
| `components/admin/test-import-step4-review.tsx` | ~200 | Step 4/3: review + submit |
| `components/admin/test-edit-content-tab.tsx` | ~220 | Edit content router (skill-based) |
| `app/(admin)/admin/tests/[id]/page.tsx` | ~130 | Detail view router |
| `app/(admin)/admin/tests/[id]/edit/page.tsx` | ~70 | Edit page (tabs) |
| `lib/admin-api.ts` | ~167 | Admin API functions |
| `lib/ai-api.ts` | ~59 | AI scoring APIs |

### 7.2 Listening (11 files)

| File | Lines | Muc dich |
|------|-------|----------|
| `components/admin/test-import-step2-listening.tsx` | ~80 | Audio upload + rich text |
| `components/listening/listening-audio-player.tsx` | ~178 | Custom audio player |
| `components/listening/listening-practice-header.tsx` | ~74 | Practice header |
| `components/listening/listening-question-nav.tsx` | ~51 | Question nav bar |
| `app/(protected)/practice/listening/[id]/page.tsx` | ~180 | Practice page |
| `app/(protected)/practice/listening/[id]/result/page.tsx` | ~170 | Result page |
| `app/(protected)/practice/listening/[id]/review/page.tsx` | ~96 | Review page |
| `store/listening-store.ts` | ~60 | Zustand store |
| `types/listening.types.ts` | ~20 | Types |

### 7.3 Writing (13 files)

| File | Lines | Muc dich |
|------|-------|----------|
| `components/admin/test-import-step2-writing.tsx` | ~90 | Prompt + image + sample |
| `components/admin/test-edit-writing-content.tsx` | ~107 | Edit voi real API save |
| `components/admin/test-detail-writing-view.tsx` | ~70 | Detail read-only |
| `components/writing/writing-prompt-panel.tsx` | ~72 | Practice: prompt panel |
| `components/writing/writing-editor.tsx` | ~68 | Practice: TipTap editor |
| `components/writing/writing-toolbar-panel.tsx` | ~85 | Practice: toolbar panel |
| `components/writing/writing-practice-header.tsx` | ~71 | Practice: header |
| `components/writing/grading-modal.tsx` | ~73 | Grading result modal |
| `app/(protected)/practice/writing/[id]/page.tsx` | ~165 | Practice page |
| `app/(protected)/writing/page.tsx` | ~74 | Old standalone page |
| `store/writing-store.ts` | ~84 | Zustand store |
| `types/writing.types.ts` | ~30 | Types |

### 7.4 Speaking (12 files)

| File | Lines | Muc dich |
|------|-------|----------|
| `components/admin/test-import-step2-speaking.tsx` | ~100 | Topic + question list |
| `components/admin/test-edit-speaking-content.tsx` | ~155 | Edit + add question |
| `components/admin/test-detail-speaking-view.tsx` | ~60 | Detail read-only |
| `components/speaking/speaking-practice-header.tsx` | ~55 | Practice: header |
| `components/speaking/speaking-topic-sidebar.tsx` | ~62 | Practice: question sidebar |
| `components/speaking/speaking-question-center.tsx` | ~73 | Practice: question + nav |
| `components/speaking/speaking-recorder.tsx` | ~185 | Practice: mic recorder |
| `components/speaking/speaking-feedback-panel.tsx` | ~73 | Practice: AI feedback |
| `components/speaking/speaking-notes-panel.tsx` | ~34 | Practice: notes |
| `app/(protected)/practice/speaking/[id]/page.tsx` | ~218 | Practice page |
| `store/speaking-store.ts` | ~112 | Zustand store |
| `types/speaking.types.ts` | ~25 | Types |

---

## Tong ket

| Metric | Gia tri |
|--------|---------|
| **Tong so file moi/sua** | ~40 files |
| **TypeScript errors** | 0 |
| **Backend endpoints moi** | 1 (PUT /stimuli/{id}) |
| **Skills hoan thanh** | 3/3 (Listening, Writing, Speaking) |
| **Flows hoan thanh** | Import → Detail → Edit → Practice → Submit → Result → Review |
| **AI integration** | Writing (scoreWriting) + Speaking (scoreSpeaking) |
| **Browser support** | Chrome + Safari (MediaRecorder MIME auto-detect) |
| **Bugs da fix** | 7 (3 CRITICAL + 3 MEDIUM + 1 LOW) |
