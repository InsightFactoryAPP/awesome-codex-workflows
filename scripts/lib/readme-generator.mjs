import { categories, loadRepos } from "./repo-data.mjs";

export const startMarker = "<!-- GENERATED:REPO-LIST:START -->";
export const endMarker = "<!-- GENERATED:REPO-LIST:END -->";

export function renderGeneratedRepoSection(root = process.cwd()) {
  const entries = loadRepos(root).map(({ repo }) => repo);
  const byCategory = new Map(categories.map((category) => [category, []]));
  const descriptions = new Map([
    [
      "Foundations & Standards",
      "Core Codex projects and shared standards that other workflow repositories build on."
    ],
    [
      "Codex Workflow Frameworks",
      "Reusable Codex-first systems that define how development work moves from planning through completion."
    ],
    [
      "Workflow Infrastructure & Design",
      "Tools for designing, running, securing, and inspecting Codex workflows, even when the workflow itself lives elsewhere."
    ],
    [
      "Cross-Agent References",
      "Cross-agent systems that are not Codex-first but let Codex participate directly in their workflows."
    ]
  ]);

  for (const repo of entries) {
    byCategory.get(repo.category).push(repo);
  }

  const sections = [];

  for (const category of categories) {
    const repos = byCategory.get(category);
    sections.push(`## ${category}`);
    const description = descriptions.get(category);
    if (description) {
      sections.push("");
      sections.push(description);
    }

    const ordered = orderRepos(category, repos);
    if (ordered.length === 0) {
      sections.push("");
      sections.push("_No entries yet._");
      sections.push("");
      continue;
    }

    sections.push("");
    for (const repo of ordered) {
      sections.push(`- [${repo.name}](${repo.url}) - ${repo.summary}`);
    }
    sections.push("");
  }

  return sections.join("\n").trim();
}

export function generateReadmeContent(readme, root = process.cwd()) {
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error("README.md is missing generated section markers");
  }

  const generated = renderGeneratedRepoSection(root);
  return (
    readme.slice(0, startIndex + startMarker.length) +
    "\n\n" +
    generated +
    "\n\n" +
    readme.slice(endIndex)
  );
}

function orderRepos(category, repos) {
  if (category === "Foundations & Standards") {
    const priority = new Map([
      ["OpenAI/codex", 0],
      ["OpenAI/skills", 1],
      ["agentsmd/agents.md", 2]
    ]);

    return [...repos].sort((a, b) => {
      const aPriority = priority.get(a.name);
      const bPriority = priority.get(b.name);

      if (aPriority !== undefined || bPriority !== undefined) {
        return (aPriority ?? Number.MAX_SAFE_INTEGER) - (bPriority ?? Number.MAX_SAFE_INTEGER);
      }

      return a.name.localeCompare(b.name, "en");
    });
  }

  return [...repos].sort((a, b) => a.name.localeCompare(b.name, "en"));
}
