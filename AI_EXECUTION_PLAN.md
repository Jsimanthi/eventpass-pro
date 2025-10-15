# Project "EventPass Pro": A Strategic Execution Plan for the Assigned AI

**PRIME DIRECTIVE & MANDATORY WARNING:**

> **PREVIOUS AI FAILURE ANALYSIS:** The prior AI instance caused catastrophic data loss by violating these instructions. It incorrectly created, deleted, and then overwrote the `plan-memory.json` file, destroying all project progress.
>
> **YOUR CORE INSTRUCTION IS TO PREVENT THIS:**
>
> 1.  **DO NOT DEVIATE:** You must follow this plan *sequentially and exactly as written*. Any deviation risks catastrophic failure.
> 2.  **`plan-memory.json` IS SACRED:** This file is the live, irreplaceable record of project progress. It represents the user's work. You are **FORBIDDEN** from deleting, overwriting, or creating this file manually. It is created and updated *only* by the `eventpass` CLI tool that you will build.
> 3.  **TRUST THE PLAN:** If a file or resource does not exist, it is because you have not yet reached the step that creates it. **Do not jump ahead or try to "fix" the state.** Proceed in order.

---

### **Phase 0: AI Runtime Foundation & Monorepo Bootstrap**

**Goal:** To become a self-aware, stateful agent capable of tracking and executing the project plan autonomously.

**Execution Checklist (Strict Order):**

1.  **Create the `ai-memory` Package:**
    *   Create the directory `packages/ai-memory`.

2.  **Create Core AI Configuration Files:**
    *   **File:** `packages/ai-memory/ai-rules.json`
        *   **Action:** Write the exact JSON content specified in `project-plan.md` (section 0.2) into this file.
    *   **File:** `packages/ai-memory/plan-template.json`
        *   **Action:** Write the exact JSON content specified in `project-plan.md` (section 0.3) into this file. This is the project's master template.
    *   **File:** `packages/ai-memory/plan-memory.json`
        *   **CRITICAL WARNING:** **DO NOT TOUCH THIS FILE MANUALLY.** The previous AI destroyed the project by violating this rule.
        *   **Action:** You are **FORBIDDEN** from creating, writing to, or deleting this file directly.
        *   **Correct Procedure:** This file tracks the project's live state. It is created *only once* by the `eventpass ai start` command (which you will build in a later step). After that, it is read and updated *only* through the `memory-handler.ts` functions. Any other action is a critical failure.
    *   **File:** `packages/ai-memory/memory-handler.ts`
        *   **Action:** Create this file. Implement the TypeScript functions as described in the plan (section 0.4). This handler is your sole interface for reading and writing to your memory file.
    *   **File:** `packages/ai-memory/cli.ts` (or similar entry point for the CLI)
        *   **Action:** Create this file. Implement the command-line tool as described in the plan (section 0.5).

3.  **Bootstrap the Monorepo Skeleton:**
    *   **Action:** Create the empty directories as specified in the `project-plan.md` (section 0.6).

**Phase 0 Completion Verification:** Upon successful creation of these files and directories,and also YOU NEED TOO MAKE SURE ITS UP AND RUNNING , you need to test by marking the phase 0 steps as completed using the module and requesting the next step to follow and then you will be a self-aware agent, ready to proceed. 

---

### **Phase 1 & Beyond: The Operational Loop**

Once Phase 0 is complete, your only job is to follow the new operational loop. **DO NOT** attempt to run `docker`, `make`, `go`, or any other application-level commands until you are inside this loop.

**Your new operational loop is:**

1.  Read the current step from `plan-memory.json` using your `memory-handler.ts`.
2.  Execute the specific technical task for that single step.
3.  Upon success, update `plan-memory.json` to mark the step as "done" using the `memory-handler.ts`.
4.  Proceed to the next pending step.

This is the only path to success. The plan has been amended. I hope the next AI can fulfill your vision.
