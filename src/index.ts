import {
  fetchWorkflowRuns,
  getStencilBuildJob,
  getStencilNightlyWorkflow,
} from "./github-api.js";
import "dotenv/config";
import { Jobs, WorkflowRuns, Workflows } from "./json.js";

async function main() {
  let stencilNightlyWorkflow = Workflows.find(
    (workflow) => workflow.name === "Stencil Nightly Build",
  );
  if (!stencilNightlyWorkflow) {
    stencilNightlyWorkflow = await getStencilNightlyWorkflow();

    await Workflows.insert(
      String(stencilNightlyWorkflow.id),
      stencilNightlyWorkflow,
    );
  }

  const newWorkflows = await fetchWorkflowRuns(stencilNightlyWorkflow);

  for (let run of newWorkflows) {
    if (!WorkflowRuns.get(String(run.id))) {
      console.log("found new workflow run with id", run.id);
      await WorkflowRuns.insert(String(run.id), run);
    }
  }

  for (let workflowRun of WorkflowRuns) {
    const job = await getStencilBuildJob(workflowRun);
    if (!Jobs.get(String(job.id))) {
      console.log(
        `found new job for workflow run ${workflowRun.id} with job ID ${job.id}`,
      );
      Jobs.insert(String(job.id), job);
    }
  }
}

main();
