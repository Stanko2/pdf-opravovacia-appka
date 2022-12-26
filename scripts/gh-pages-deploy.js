/* eslint-disable no-console */
const execa = require("execa");
const fs = require("fs");
(async () => {
    try {
        const branch = process.env.TRIGGER === "push" ? process.env.GITHUB_REF.split("/").pop() :
            (process.env.TRIGGER === "pull_request" ? process.env.GITHUB_HEAD_REF : (await execa("git", ["rev-parse", "--abbrev-ref", "HEAD"])).stdout);
        console.log("Current branch:", branch);

        await execa("git", ["checkout", "--orphan", "gh-pages"]);
        console.log("Building started...")

        const npmBuildProcess = execa("npm", ["run", "build"]);

        // pipe the output of the npm build process to the console
        npmBuildProcess.stdout.pipe(process.stdout);
        await npmBuildProcess;

        // Understand if it's dist or build folder
        const folderName = fs.existsSync("dist") ? "dist" : "build";
        if(process.env.TRIGGER === "push") {
            // only deploy if the workflow was triggered by a push
            console.log("Deploying...");
            await execa("git", ["--work-tree", folderName, "add", "--all"]);
            await execa("git", ["--work-tree", folderName, "commit", "-m", "gh-pages"]);
            console.log("Pushing to gh-pages...");
            //await execa("git", ["push", "origin", "HEAD:gh-pages", "--force"]);
        } else {
            console.log("Skipping deploy because workflow was not triggered by a push");
        }
        console.log("Cleaning up...");
        await execa("rm", ["-r", folderName]);
        await execa("git", ["checkout", "-f", branch]);
        await execa("git", ["branch", "-D", "gh-pages"]);
        console.log("Successfully deployed, check your settings");
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e.message);
        process.exit(1);
    }
})();
