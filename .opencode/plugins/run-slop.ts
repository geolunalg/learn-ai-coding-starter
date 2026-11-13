import { spawn } from "node:child_process";
import { Plugin } from "@opencode/plugin";

interface SlopResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

function runSloperator(file: string, cwd: string): Promise<SlopResult> {
  return new Promise((resolve) => {
    const child = spawn("uv", ["run", "--no-active", "sloperator.py", file], { cwd });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      resolve({
        stdout,
        stderr: stderr ? `${stderr}\n${error.message}` : error.message,
        exitCode: 1,
      });
    });

    child.on("close", (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });
  });
}

export default Plugin.define({
  id: "sloperator.run-slop",
  setup: async (ctx) => {
    await ctx.tool.transform((tools) => {
      tools.add({
        name: "run_slop",
        description:
          "Run a SlopLang program with Sloperator. The path may be absolute or relative to the project root. " +
          "Returns the process stdout, stderr, and exit code.",
        input: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the .slop file to run",
            },
          },
          required: ["path"],
          additionalProperties: false,
        },
        output: {
          type: "object",
          properties: {
            stdout: { type: "string" },
            stderr: { type: "string" },
            exitCode: { type: "number" },
          },
          required: ["stdout", "stderr", "exitCode"],
          additionalProperties: false,
        },
        options: { codemode: false },
        execute: async (input) => {
          const { path } = input as { path: string };
          const result = await runSloperator(path, ctx.location.directory);
          return {
            output: result,
            content: JSON.stringify(result),
          };
        },
      });
    });
  },
});
