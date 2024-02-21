import {
  fetchWorkflowRuns,
  getStencilBuildJob,
  getStencilNightlyWorkflow,
} from "./github-api.js";
import "dotenv/config";

async function main() {
  const stencilNightly = await getStencilNightlyWorkflow();

  const workflows = await fetchWorkflowRuns(stencilNightly);

  const job = await getStencilBuildJob(workflows[0]);

  console.log(workflows);
  console.log(job);
}

main();
