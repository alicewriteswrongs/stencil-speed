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
import {
  fetchAndSaveJobForRun,
  getStencilNightlyWorkflow,
} from "./api-helpers.js";

/**
 * This fetches recent workflow runs and, for any which are new, then fetches
 * the associated jobs and logs.
 */
async function fetchRecentData() {
  log("fetching recent data...");
  const stencilNightlyWorkflow = await getStencilNightlyWorkflow();

  // fetch the most recent 50 workflow runs for the Stencil nightly build
  const newWorkflowRuns = await fetchWorkflowRuns(stencilNightlyWorkflow);

  for (let run of newWorkflowRuns) {
    if (!WorkflowRuns.get(run.id)) {
      // we only want to insert and then fetch jobs for workflow runs which we
      // didn't have previously
      await WorkflowRuns.insert(run.id, run);
      log("found new workflow run with id", run.id);

      const job = await fetchAndSaveJobForRun(run);
      if (job) {
        const logs = await fetchLogsForJob(job);
        if (logs) {
          await JobLogs.insert(String(job.id), logs);
          log(`found logs for workflow run ${run.id} with job ID ${job.id}`);
        }
      }
    }
  }
}

/**
 * This function fetches the whole world, attempting to get all the workflow
 * runs, all the associated jobs, and all the associated logs.
 */
async function fetchAllData() {
  log("fetching all data...");
  const stencilNightlyWorkflow = await getStencilNightlyWorkflow();

  // fetch all the workflow runs
  const workflowRuns = await fetchWorkflowRuns(stencilNightlyWorkflow, true);

  for (const run of workflowRuns) {
    if (!WorkflowRuns.get(run.id)) {
      // we only want to insert workflow runs which we
      // didn't have previously
      await WorkflowRuns.insert(run.id, run);
      log("found new workflow run with id", run.id);
    }
  }

  for (const run of WorkflowRuns) {
    await fetchAndSaveJobForRun(run);
  }

  for (const job of Jobs) {
    if (!JobLogs.get(job.id)) {
      const logs = await fetchLogsForJob(job);
      if (logs) {
        log(
          `found new job for workflow run ${job.run_id} with job ID ${job.id}`,
        );
        await JobLogs.insert(String(job.id), logs);
      }
    }
  }
}

async function main() {
  const fetchAll = process.argv.includes("--fetchAll");

  if (fetchAll) {
    await fetchAllData();
  } else {
    await fetchRecentData();
  }
}

main();
