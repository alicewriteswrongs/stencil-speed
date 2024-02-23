import {
  Job,
  Workflow,
  WorkflowRun,
  fetchStencilBuildJob,
  fetchStencilNightlyWorkflow,
} from "./github-api.js";
import { Jobs, WorkflowRuns, Workflows } from "./json.js";
import { log } from "./log.js";

export async function getStencilNightlyWorkflow(): Promise<Workflow> {
  let stencilNightlyWorkflow = Workflows.find(
    (workflow) => workflow.name === "Stencil Nightly Build",
  );
  if (!stencilNightlyWorkflow) {
    // we haven't fetched and saved that workflow yet, so do so
    stencilNightlyWorkflow = await fetchStencilNightlyWorkflow();

    await Workflows.insert(stencilNightlyWorkflow.id, stencilNightlyWorkflow);
  }
  return stencilNightlyWorkflow;
}

export async function fetchAndSaveJobForRun(
  run: WorkflowRun,
): Promise<Job | null> {
  try {
    const job = await fetchStencilBuildJob(run);
    if (!Jobs.get(job.id)) {
      log(`found new job for workflow run ${run.id} with job ID ${job.id}`);
      await Jobs.insert(job.id, job);
      return job;
    }
  } catch (e) {
    console.error(`had some issue finding a job for workflow run ${run.id}`, e);
  }
  return null;
}
