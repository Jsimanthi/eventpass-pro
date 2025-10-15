
import { Command } from 'commander';
import { promises as fs } from 'fs';
import { loadMemory, saveStepComplete, getNextPendingStep, resume, backup } from './memory-handler';

const program = new Command();

// Utility to read and parse a JSON file
async function readJsonFile<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
}

// Utility to write a JSON file
async function writeJsonFile(filePath: string, data: any): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf-8');
}

program
    .name('eventpass')
    .description('CLI for managing the EventPass Pro project');

const ai = program.command('ai').description('AI agent commands');

ai.command('start')
    .description('Initialize plan-memory.json from the template')
    .action(async () => {
        try {
            const rules = await readJsonFile<any>('packages/ai-memory/ai-rules.json');
            const template = await readJsonFile<any>(rules.template_file);
            await writeJsonFile(rules.memory_file, template);
            console.log(`Initialized memory file at ${rules.memory_file}`);
            console.log('AI is ready to proceed. Use "eventpass ai progress" to see the current step.');

        } catch (error) {
            console.error('Failed to initialize AI memory:', error);
        }
    });

ai.command('progress')
    .description('Show the current phase and step')
    .action(async () => {
        try {
            const memory = await loadMemory();
            const phase = memory.phases[memory.current_phase];
            const step = phase.steps[memory.current_step];
            console.log(`Project: ${memory.project} (Status: ${memory.status})`);
            console.log(`Current Phase: ${memory.current_phase} - ${phase.title}`);
            console.log(`Current Step: ${memory.current_step} - ${step.title} (Status: ${step.status})`);
        } catch (error) {
            console.error('Could not get progress. Is the memory initialized?', error);
        }
    });

ai.command('next')
    .description('Suggest the next actionable item')
    .action(async () => {
        try {
            const nextStep = await getNextPendingStep();
            if (nextStep) {
                console.log('Next pending step:');
                console.log(`  ID: ${nextStep.stepId}`);
                console.log(`  Title: ${nextStep.step.title}`);
            } else {
                console.log('The project is complete! All steps are done.');
            }
        } catch (error) {
            console.error('Could not determine the next step:', error);
        }
    });

ai.command('confirm <id>')
    .description('Mark a manual step as complete')
    .action(async (id) => {
        try {
            await saveStepComplete(id, { confirmed_by: 'user' });
            console.log(`Step ${id} marked as complete.`);
            await backup(); // Back up after a manual confirmation
        } catch (error) {
            console.error(`Failed to confirm step ${id}:`, error);
        }
    });

ai.command('run-step <id>')
    .description('Run a scripted step (placeholder)')
    .action(async (id) => {
        console.log(`Pretending to run scripted step ${id}...`);
        // In a real scenario, this would execute a script associated with the step
        try {
            await saveStepComplete(id, { execution_mode: 'scripted' });
            console.log(`Step ${id} completed and marked as done.`);
        } catch (error) {
            console.error(`Failed to run or mark step ${id} as complete:`, error);
        }
    });
    
async function main() {
    // Relative paths assume the CLI is run from the project root
    process.chdir(process.env.PROJECT_ROOT || '.');
    await program.parseAsync(process.argv);
}

main().catch(error => {
    console.error("An unexpected error occurred:", error);
    process.exit(1);
});
