import fs from "fs";
import path from "path";
import { Job, Workflow, WorkflowRun } from "./github-api.js";

function createJSONTable<JSONType>(name: string) {
  const filePath = path.join(path.resolve("."), "data", `${name}.json`);

  const data: Record<string, JSONType> = fs.existsSync(filePath)
    ? JSON.parse(String(fs.readFileSync(filePath)))
    : {};

  async function sync() {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  return {
    get(key: string): JSONType | undefined {
      return data?.[key];
    },
    find(cb: (w: JSONType) => boolean): JSONType | undefined {
      for (const entry of Object.values(data)) {
        if (cb(entry)) {
          return entry;
        }
      }
      return undefined;
    },
    async insert(key: string, record: JSONType) {
      data[key] = record;
      await sync();
    },
    *[Symbol.iterator]() {
      yield* Object.values(data);
    },
  };
}

export const Workflows = createJSONTable<Workflow>("workflows");

export const WorkflowRuns = createJSONTable<WorkflowRun>("workflow_runs");

export const Jobs = createJSONTable<Job>("jobs");

/**
 * The idea here is that each key is a job ID and the value is the logs for
 * that job.
 */
export const JobLogs = createJSONTable<string>("jobLogs");
