import { Octokit } from "@octokit/rest";
import "dotenv/config";

// @ts-ignore: trust me
const TOKEN: string = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  throw new Error("You need to provide a github access token in `.env`");
}

const octokit = new Octokit({
  auth: TOKEN,
});

const REPO_INFO = {
  owner: "ionic-team",
  repo: "ionic-framework",
};

async function fetchAllWorkflows() {
  const resp = await octokit.request(
    "GET /repos/{owner}/{repo}/actions/workflows",
    {
      owner: "ionic-team",
      repo: "ionic-framework",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (resp.status === 200) {
    return resp.data.workflows;
  } else {
    throw new Error("AAAAA");
  }
}

export async function getStencilNightlyWorkflow() {
  const workflows = await fetchAllWorkflows();
  const maybeWorkflow = workflows.find(
    (entry) => entry.name === "Stencil Nightly Build",
  );
  if (maybeWorkflow) {
    return maybeWorkflow;
  }
  throw new Error("Had some issue finding the right workflow, panicking!!!");
}

// A workflow represents a particular yaml file saved in `.github/workflows`
export type Workflow = Awaited<ReturnType<typeof getStencilNightlyWorkflow>>;

type UnwrapArray<Wrapped extends unknown[]> = Wrapped[number];

export async function fetchWorkflowRuns(workflow: Workflow) {
  const resp = await octokit.request(
    "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs",
    {
      ...REPO_INFO,
      workflow_id: workflow.id,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  return resp.data.workflow_runs;
}

// A workflow run represents a particular instance of executing a workflow
export type WorkflowRun = UnwrapArray<
  Awaited<ReturnType<typeof fetchWorkflowRuns>>
>;

export async function fetchJobsForWorkflowRun(workflowRun: WorkflowRun) {
  const resp = await octokit.request(
    "GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs",
    {
      ...REPO_INFO,
      run_id: workflowRun.id,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  return resp.data.jobs;
}

// A job is basically a step within a workflow run
type Job = UnwrapArray<Awaited<ReturnType<typeof fetchJobsForWorkflowRun>>>;

// get the job for the Stencil build that occurred during a given WorkflowRun
export async function getStencilBuildJob(
  workflowRun: WorkflowRun,
): Promise<Job> {
  const jobs = await fetchJobsForWorkflowRun(workflowRun);

  const maybeJob = jobs.find(
    (job) => job.name === "build-core-with-stencil-nightly",
  );
  if (maybeJob) {
    return maybeJob;
  }
  throw new Error("Oh no couldn't find a job :/");
}