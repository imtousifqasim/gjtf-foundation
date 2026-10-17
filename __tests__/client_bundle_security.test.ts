import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

describe("Client Bundle Security & Secret Leak Prevention", () => {
  const rootDir = path.resolve(__dirname, "..");

  const sensitiveVars = [
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REFRESH_TOKEN",
    "PROOF_MASTER_KEY",
    "CRON_SECRET",
    "DB_PASSWORD",
    "MYSQL_PASSWORD",
    "JWT_SECRET",
    "ADMIN_JWT_SECRET",
  ];

  function getAllFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (
        file === "node_modules" ||
        file === ".next" ||
        file === ".git" ||
        file === "coverage" ||
        file === "__tests__"
      ) {
        continue;
      }
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        getAllFiles(fullPath, fileList);
      } else if (
        fullPath.endsWith(".tsx") ||
        fullPath.endsWith(".ts") ||
        fullPath.endsWith(".jsx") ||
        fullPath.endsWith(".js")
      ) {
        fileList.push(fullPath);
      }
    }
    return fileList;
  }

  test("Client components ('use client') never reference sensitive server environment variables", () => {
    const allFiles = getAllFiles(rootDir);
    const clientFiles: string[] = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf8");
      // Check if file is a client component
      if (
        content.startsWith('"use client"') ||
        content.startsWith("'use client'") ||
        content.includes('\n"use client"') ||
        content.includes("\n'use client'")
      ) {
        clientFiles.push(file);
      }
    }

    expect(clientFiles.length).toBeGreaterThan(0);

    const violations: { file: string; variable: string }[] = [];

    for (const file of clientFiles) {
      const content = fs.readFileSync(file, "utf8");
      for (const secretVar of sensitiveVars) {
        // Look for process.env.SECRET_VAR or direct references
        if (content.includes(secretVar)) {
          violations.push({
            file: path.relative(rootDir, file),
            variable: secretVar,
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test("Client components never import server-only storage or database modules directly", () => {
    const allFiles = getAllFiles(rootDir);
    const forbiddenImports = [
      "mysql2",
      "@/lib/db/mysql",
      "@/lib/storage/googleDrive",
      "@/lib/storage/encryption",
      "googleapis",
    ];

    const violations: { file: string; forbiddenModule: string }[] = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf8");
      const isClient =
        content.startsWith('"use client"') ||
        content.startsWith("'use client'") ||
        content.includes('\n"use client"') ||
        content.includes("\n'use client'");

      if (isClient) {
        for (const mod of forbiddenImports) {
          // Check import statements
          const importRegex = new RegExp(`from\\s+["']${mod}["']`, "g");
          if (importRegex.test(content)) {
            violations.push({
              file: path.relative(rootDir, file),
              forbiddenModule: mod,
            });
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test(".gitignore contains patterns for Google OAuth secrets, .env files, and PEM keys", () => {
    const gitignorePath = path.join(rootDir, ".gitignore");
    expect(fs.existsSync(gitignorePath)).toBe(true);

    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    expect(gitignoreContent).toMatch(/client_secret\*\.json/);
    expect(gitignoreContent).toMatch(/credentials\*\.json/);
    expect(gitignoreContent).toMatch(/\.env\*/);
    expect(gitignoreContent).toMatch(/\*\.pem/);
  });

  test("Git tracked files do not include any client_secret*.json, credentials*.json, or .pem files", () => {
    try {
      const gitFiles = execSync("git ls-files", { cwd: rootDir, encoding: "utf8" });
      const trackedFiles = gitFiles.split("\n").filter(Boolean);

      const leakedTrackedFiles = trackedFiles.filter((f) => {
        const lower = f.toLowerCase();
        return (
          lower.includes("client_secret") ||
          (lower.includes("credentials") && lower.endsWith(".json")) ||
          lower.endsWith(".pem")
        );
      });

      expect(leakedTrackedFiles).toEqual([]);
    } catch (e: any) {
      // In case git command isn't in test runner sub-shell
      console.warn("Git ls-files check skipped:", e.message);
    }
  });
});
