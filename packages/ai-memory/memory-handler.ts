
import { promises as fs } from 'fs';
import { dirname, join } from 'path';

// Define interfaces for better type safety
interface Step {
    title: string;
    status: 'pending' | 'done' | 'in-progress' | 'skipped';
}

interface Phase {
    title: string;
    status: 'pending' | 'done' | 'in-progress';
    steps: Record<string, Step>;
}

interface Plan {
    project: string;
    version: string;
    current_phase: number;
    current_step: string;
    status: 'in-progress' | 'done' | 'paused';
    history: any[];
    phases: Record<string, Phase>;
}

interface AiRules {
    memory_file: string;
    template_file: string;
    memory_sync: {
        backup_path: string;
    };
}

const RULES_PATH = 'packages/ai-memory/ai-rules.json';

// Utility to read and parse a JSON file
async function readJsonFile<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
}

// Utility to write a JSON file
async function writeJsonFile(filePath: string, data: any): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
}


export async function loadMemory(): Promise<Plan> {
    const rules = await readJsonFile<AiRules>(RULES_PATH);
    try {
        return await readJsonFile<Plan>(rules.memory_file);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Memory file not found. You may need to run "eventpass ai start"');
            // Or should we initialize from template here? The plan says the CLI does it.
            // For now, let's re-throw so the caller knows it doesn't exist.
        }
        throw error;
    }
}

export async function saveStepComplete(stepId: string, meta: Record<string, any> = {}): Promise<Plan> {
    const rules = await readJsonFile<AiRules>(RULES_PATH);
    const memory = await loadMemory();

    const [phaseId, stepInPhaseId] = stepId.split('.');
    if (!memory.phases[phaseId] || !memory.phases[phaseId].steps[stepId]) {
        throw new Error(`Step ${stepId} not found in memory.`);
    }

    memory.phases[phaseId].steps[stepId].status = 'done';
    memory.history.push({
        step: stepId,
        status: 'done',
        timestamp: new Date().toISOString(),
        ...meta,
    });
    
    // Naive next step logic. A more robust implementation would check status.
    const phaseSteps = Object.keys(memory.phases[phaseId].steps);
    const currentStepIndex = phaseSteps.indexOf(stepId);
    if (currentStepIndex < phaseSteps.length - 1) {
        memory.current_step = phaseSteps[currentStepIndex + 1];
    } else {
        memory.phases[phaseId].status = 'done';
        const nextPhaseId = parseInt(phaseId, 10) + 1;
        if (memory.phases[nextPhaseId]) {
            memory.current_phase = nextPhaseId;
            memory.current_step = Object.keys(memory.phases[nextPhaseId].steps)[0];
            memory.phases[nextPhaseId].status = 'in-progress';
        } else {
            memory.status = 'done'; // Project complete
        }
    }


    await writeJsonFile(rules.memory_file, memory);
    return memory;
}


export async function getNextPendingStep(): Promise<{ stepId: string; step: Step } | null> {
    const memory = await loadMemory();
    if (memory.status === 'done') {
        return null;
    }
    const currentPhase = memory.phases[memory.current_phase];
    if (!currentPhase) return null;

    for (const stepId in currentPhase.steps) {
        if (currentPhase.steps[stepId].status === 'pending') {
            return { stepId, step: currentPhase.steps[stepId] };
        }
    }
    
    // If no pending steps in current phase, check for next phase
    for (const phaseId in memory.phases) {
        if (parseInt(phaseId) > memory.current_phase && memory.phases[phaseId].status === 'pending') {
             const firstStepId = Object.keys(memory.phases[phaseId].steps)[0];
             return { stepId: firstStepId, step: memory.phases[phaseId].steps[firstStepId]};
        }
    }


    return null;
}

export async function backup(): Promise<void> {
    const rules = await readJsonFile<AiRules>(RULES_PATH);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(rules.memory_sync.backup_path, `plan-memory-${timestamp}.json`);
    
    console.log(`Backing up memory to ${backupFile}...`);
    await fs.copyFile(rules.memory_file, backupFile);
    console.log('Backup complete.');
}

// resume() isn't clearly defined, but let's assume it just loads the memory and tells you where you are.
export async function resume(): Promise<Plan> {
    console.log('Resuming from last known state...');
    return await loadMemory();
}
