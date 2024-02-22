import {
  fetchWorkflowRuns,
  getStencilBuildJob,
  getStencilNightlyWorkflow,
} from "./github-api.js";
import "dotenv/config";
import { WorkflowRuns, Workflows } from "./json.js";

async function main() {

  let stencilNightlyWorkflow = Workflows.find(workflow => workflow.name === "Stencil Nightly Build");
  if (!stencilNightlyWorkflow) {
    stencilNightlyWorkflow = await getStencilNightlyWorkflow();

    await Workflows.insert(
      String(stencilNightlyWorkflow.id),
      stencilNightlyWorkflow
    );
  }

  const workflows = await fetchWorkflowRuns(stencilNightlyWorkflow);

  for (let run of workflows) {
    if (!WorkflowRuns.get(String(run.id))) {
      await WorkflowRuns.insert(String(run.id), run);
    }
  }

  const job = await getStencilBuildJob(workflows[0]);

  console.log(workflows);
  console.log(job);
}

main();
