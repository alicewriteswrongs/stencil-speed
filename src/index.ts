import {
  fetchLogsForJob,
  fetchWorkflowRuns,
  fetchStencilBuildJob,
  fetchStencilNightlyWorkflow,
  Workflow,
} from "./github-api.js";
import "dotenv/config";
import { JobLogs, Jobs, WorkflowRuns, Workflows } from "./json.js";
import { log } from "./log.js";

async function getStencilNightlyWorkflow(): Promise<Workflow> {
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

/**
 * This fetches recent workflow runs and, for any which are new, then fetches
 * the associated jobs and logs.
 */
async function fetchNewData() {
  const stencilNightlyWorkflow = await getStencilNightlyWorkflow();

  // fetch the most recent 50 workflow runs for the Stencil nightly build
  const newWorkflowRuns = await fetchWorkflowRuns(stencilNightlyWorkflow);

  // for each new workflow run, try to fetch the corresponding job and logs
  for (let run of newWorkflowRuns) {
    if (!WorkflowRuns.get(run.id)) {
      // we only want to insert and then fetch jobs for workflow runs which we
      // didn't have previously
      log("found new workflow run with id", run.id);
      await WorkflowRuns.insert(run.id, run);

      try {
        const job = await fetchStencilBuildJob(run);
        if (!Jobs.get(job.id)) {
          log(`found new job for workflow run ${run.id} with job ID ${job.id}`);
          await Jobs.insert(job.id, job);
          const logs = await fetchLogsForJob(job);
          if (logs) {
            await JobLogs.insert(job.id, logs);
          }
        }
      } catch (e) {
        console.error(
          `had some issue finding a job for workflow run ${run.id}`,
          e,
        );
      }
    }
  }
}

/**
 * This function fetches the whole world, attempting to get all the workflow
 * runs, all the associated jobs, and all the associated logs.
 */
async function fetchAllData() {
  const stencilNightlyWorkflow = await getStencilNightlyWorkflow();

  // fetch all the workflow runs
  const workflowRuns = await fetchWorkflowRuns(stencilNightlyWorkflow, true);

  for (let run of workflowRuns) {
    if (!WorkflowRuns.get(run.id)) {
      // we only want to insert workflow runs which we
      // didn't have previously
      log("found new workflow run with id", run.id);
      await WorkflowRuns.insert(run.id, run);
    }
  }

  // now loop through all workflow runs and attempt to fetch the corresponding
  // job and logs
  for (let run of WorkflowRuns) {
    try {
      const job = await fetchStencilBuildJob(run);
      if (!Jobs.get(job.id)) {
        log(`found new job for workflow run ${run.id} with job ID ${job.id}`);
        await Jobs.insert(job.id, job);
      }
    } catch (e) {
      console.error(
        `had some issue finding a job for workflow run ${run.id}`,
        e,
      );
    }
  }

  for (let job of Jobs) {
    if (!JobLogs.get(job.id)) {
      const logs = await fetchLogsForJob(job);
      if (logs) {
        await JobLogs.insert(String(job.id), logs);
      }
    }
  }
}

async function main() {
  await fetchNewData();
}

main();
