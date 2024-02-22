import {
  fetchLogsForJob,
  fetchWorkflowRuns,
  getStencilBuildJob,
  getStencilNightlyWorkflow,
} from "./github-api.js";
import "dotenv/config";
import { JobLogs, Jobs, WorkflowRuns, Workflows } from "./json.js";

async function main() {
  let stencilNightlyWorkflow = Workflows.find(
    (workflow) => workflow.name === "Stencil Nightly Build",
  );
  if (!stencilNightlyWorkflow) {
    // we haven't fetched and saved that workflow yet, so do so
    stencilNightlyWorkflow = await getStencilNightlyWorkflow();

    await Workflows.insert(stencilNightlyWorkflow.id, stencilNightlyWorkflow);
  }

  // fetch the most recent 50 workflow runs for the Stencil nightly build
  const newWorkflowRuns = await fetchWorkflowRuns(stencilNightlyWorkflow);

  for (let run of newWorkflowRuns) {
    if (!WorkflowRuns.get(run.id)) {
      // we only want to insert and then fetch jobs for workflow runs which we
      // didn't have previously
      console.log("found new workflow run with id", run.id);
      await WorkflowRuns.insert(run.id, run);

      try {
        const job = await getStencilBuildJob(run);
        if (!Jobs.get(job.id)) {
          console.log(
            `found new job for workflow run ${run.id} with job ID ${job.id}`,
          );
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

  for (let job of Jobs) {
    if (!JobLogs.get(job.id)) {
      const logs = await fetchLogsForJob(job);
      if (logs) {
        await JobLogs.insert(String(job.id), logs);
      }
    }
  }
}

main();
