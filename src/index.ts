// Octokit.js
// https://github.com/octokit/core.js#readme
import { Octokit } from "@octokit/rest";

async function main() {
  const octokit = new Octokit({
    auth: "YOUR-TOKEN",
  });

  const resp = await octokit.request("GET /repos/{owner}/{repo}/actions/runs", {
    owner: "OWNER",
    repo: "REPO",
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
    fetch,
  });

  console.log(resp);
}

main();
