export interface BlogSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  code?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: "Concepts" | "Guides" | "Security";
  readTime: string;
  publishedAt: string;
  sections: BlogSection[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-is-an-ai-agent",
    title: "What is an AI agent?",
    excerpt: "A practical explanation of agents, tools, memory, and the loop that turns a model into a system that can act.",
    category: "Concepts",
    readTime: "6 min read",
    publishedAt: "July 28, 2026",
    sections: [
      { heading: "A model that can act", paragraphs: ["An AI agent is a software system that uses a model to decide what to do next. Unlike a chatbot that only returns text, an agent can call tools, inspect results, update its plan, and continue until it reaches a goal.", "The useful mental model is a loop: observe, reason, act, and evaluate. The model provides judgment, while your application provides tools, state, limits, and a clear stopping condition."] },
      { heading: "The building blocks", paragraphs: ["Reliable agents are assembled from a small set of explicit parts."], bullets: ["Instructions that define the job and boundaries.", "Tools that expose narrow, typed actions.", "State or memory for facts needed across steps.", "A control loop with time, cost, and iteration limits.", "Observability and policy checks around every external action."] },
      { heading: "Start smaller than you think", paragraphs: ["Begin with one workflow and two or three tools. Measure whether the agent chooses the right tool, supplies correct arguments, and stops at the right time before adding autonomy."] },
    ],
  },
  {
    slug: "what-is-mcp",
    title: "What is MCP?",
    excerpt: "How the Model Context Protocol gives agents a standard way to discover and call tools from external systems.",
    category: "Concepts",
    readTime: "5 min read",
    publishedAt: "July 24, 2026",
    sections: [
      { heading: "A common interface for agent tools", paragraphs: ["The Model Context Protocol (MCP) is an open protocol for connecting AI applications to tools and context providers. An MCP server publishes capabilities; an MCP client discovers them and makes them available to a model.", "Instead of writing a custom integration contract for every agent framework, teams can expose a tool once and connect compatible clients to it."] },
      { heading: "How a call works", paragraphs: ["A client connects to a server, requests its tool catalog, and receives names plus JSON schemas for their arguments. When the model selects a tool, the client validates and sends the call to the server."], bullets: ["Discovery describes what is available.", "Schemas constrain the arguments a model can send.", "Transport carries requests over stdio or a network connection.", "The host remains responsible for consent, credentials, and policy."] },
      { heading: "MCP is not authorization", paragraphs: ["MCP standardizes connectivity; it does not decide whether a particular agent should be allowed to issue a refund or read a customer record. Apply least-privilege permissions and runtime policies around MCP tool calls."] },
    ],
  },
  {
    slug: "build-agent-with-langchain",
    title: "How to build an agent with LangChain",
    excerpt: "Create a focused tool-calling agent, give it a safe tool, and run it with clear operational limits.",
    category: "Guides",
    readTime: "8 min read",
    publishedAt: "July 20, 2026",
    sections: [
      { heading: "Define one typed tool", paragraphs: ["A good first agent has a narrow job. Make tool inputs explicit and keep credentials inside the tool implementation rather than putting them in prompts."], code: `from langchain.tools import tool\n\n@tool\ndef lookup_invoice(invoice_id: str) -> str:\n    \"\"\"Return the status and balance for an invoice.\"\"\"\n    return billing_api.get_invoice(invoice_id)` },
      { heading: "Create and invoke the agent", paragraphs: ["Bind the tool to a supported chat model and give the agent a short system instruction that describes success and important boundaries."], code: `from langchain.agents import create_agent\n\nagent = create_agent(\n    model=\"openai:gpt-5\",\n    tools=[lookup_invoice],\n    system_prompt=\"Help finance staff inspect invoices. Never modify billing data.\",\n)\n\nresult = agent.invoke({\n    \"messages\": [{\"role\": \"user\", \"content\": \"Check invoice inv_1042\"}]\n})` },
      { heading: "Make it production-ready", paragraphs: ["Add tracing, retries around transient failures, a maximum step count, and authorization outside the model. Test normal requests as well as prompt injection and malformed tool arguments."] },
    ],
  },
  {
    slug: "build-agent-with-crewai",
    title: "How to build an agent with CrewAI",
    excerpt: "Model a small collaborative workflow with specialized roles, explicit tasks, and constrained tools.",
    category: "Guides",
    readTime: "8 min read",
    publishedAt: "July 16, 2026",
    sections: [
      { heading: "Use roles to separate responsibilities", paragraphs: ["CrewAI organizes work around agents, tasks, and a crew. Give each agent one responsibility and only the tools needed for that responsibility."], code: `from crewai import Agent, Task, Crew\n\nresearcher = Agent(\n    role=\"Release researcher\",\n    goal=\"Find verified changes in the selected repositories\",\n    backstory=\"You cite sources and never invent release details.\",\n    tools=[repository_search],\n)` },
      { heading: "Turn the outcome into a task", paragraphs: ["Tasks should state the expected output and the evidence required. This makes delegation easier to inspect and test."], code: `research = Task(\n    description=\"Review releases from the last seven days.\",\n    expected_output=\"A sourced list of notable changes.\",\n    agent=researcher,\n)\n\ncrew = Crew(agents=[researcher], tasks=[research])\nresult = crew.kickoff()` },
      { heading: "Control the crew", paragraphs: ["More agents do not automatically produce better work. Limit delegation depth, set budgets, isolate credentials by role, and require approval before any write operation."] },
    ],
  },
  {
    slug: "build-agent-with-google-adk",
    title: "How to build an agent with Google ADK",
    excerpt: "Build a minimal agent with Google’s Agent Development Kit and expose a typed function as a tool.",
    category: "Guides",
    readTime: "7 min read",
    publishedAt: "July 12, 2026",
    sections: [
      { heading: "Create a function tool", paragraphs: ["Google ADK can infer a tool schema from a typed Python function and its documentation. Keep the function deterministic and return structured results."], code: `def get_order_status(order_id: str) -> dict:\n    \"\"\"Return the current status for an order.\"\"\"\n    return orders.get_status(order_id)` },
      { heading: "Configure the agent", paragraphs: ["Create an agent with a focused instruction and explicitly pass the tools it may use."], code: `from google.adk.agents import Agent\n\nroot_agent = Agent(\n    name=\"order_support\",\n    model=\"gemini-2.5-flash\",\n    instruction=\"Answer order questions using verified tool results.\",\n    tools=[get_order_status],\n)` },
      { heading: "Add governance before writes", paragraphs: ["Treat tool schemas as an interface, not a security boundary. Validate identity and permission at execution time, log each call, and place cancellation or refund tools behind human approval."] },
    ],
  },
  {
    slug: "secure-agent-tool-calls",
    title: "Securing agent tool calls",
    excerpt: "A practical checklist for least privilege, runtime policy, approvals, and auditability around autonomous actions.",
    category: "Security",
    readTime: "7 min read",
    publishedAt: "July 8, 2026",
    sections: [
      { heading: "Assume model output is untrusted", paragraphs: ["Tool arguments originate from probabilistic output influenced by user input and retrieved content. Validate them as strictly as parameters arriving at a public API."], bullets: ["Use narrow tools instead of generic HTTP or shell access.", "Validate every argument against a schema.", "Inject credentials only after authorization succeeds.", "Reject unknown fields and unsafe defaults."] },
      { heading: "Separate permission from policy", paragraphs: ["Permission answers whether an agent may use a tool. Policy adds contextual rules: an amount limit, an allowed region, a time window, or a requirement for human approval."] },
      { heading: "Keep evidence", paragraphs: ["Record the agent, tool, arguments, decision, policy result, and external response identifier. Redact secrets while preserving enough context to explain every consequential action."] },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
