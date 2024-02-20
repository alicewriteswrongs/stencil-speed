# use the gh API to fetch a list of all the 'Stencil Nightly Build'
# workflow runs which have happened on the repo
fetch_workflows:
    gh run list \
        --repo "ionic-team/ionic-framework" \
        --workflow "Stencil Nightly Build" \
        --limit 1000 \
        --json databaseId,event,status,startedAt > data/workflows.json

# use jq to slice up the workflow data we already fetched in order to
# fetch info about each particular job
fetch_jobs:
    #!/bin/bash
    cat data/workflows.json | jq '.[].databaseId' | while read workflowid ; do
        job_json=$(gh run view \
            --repo "ionic-team/ionic-framework" \
            $workflowid \
            --json jobs |\
            jq '.jobs | .[] | select(.name == "build-core-with-stencil-nightly")'
        )
        job_id=$(echo $job_json | jq '.databaseId')
        raw_completion_time=$(gh run view \
            --repo "ionic-team/ionic-framework" \
            --job $job_id \
            --log | grep 'build finished'
        )
        completion_time=$(echo "$raw_completion_time" | rev | cut -d" " -f2 | rev)

        updated_json=$(echo $job_json |\
            jq --arg c "$completion_time" '.completionTime = $c' |\
            jq --arg r "$raw_completion_time" '.rawCompletionTime = $r'
        )

        echo "$updated_json" | jq > data/jobs/$job_id.json
    done

# merge job records into a single JSON blob
merge_job_json:
    #!/usr/bin/env node
    const fs = require("fs");
    const path = require("path");

    const files = fs.readdirSync("./data/jobs");

    const jobs = {};

    for (const file of files) {
        const filePath = path.join(
            path.resolve("."),
            "data/jobs",
            file
        );
        const contents = JSON.parse(String(fs.readFileSync(filePath)));
        if (contents.conclusion === "success") {
            jobs[contents.databaseId] = contents;
        }
    }
    fs.writeFileSync("./data/jobs.json", JSON.stringify(jobs));
