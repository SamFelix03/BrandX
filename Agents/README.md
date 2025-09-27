# Agent Workflow Introduction

<figure><img src="../.gitbook/assets/darkAIflow.png" alt=""><figcaption></figcaption></figure>

## Input: Brand Details

You start by providing brand details (e.g., brand name, identifiers).

These details are passed to the Orchestrator.

***

## Orchestrator Dispatch

The Orchestrator sends tasks to specialized agents.

Each agent queries the appropriate MCP server (data source) to fetch relevant information.

***

## Data Collection via Agents & MCP Servers

### a) Web Search Agent

Searches the web for brand-related data.

Passes results into the pipeline for storage in the Knowledge Graph.

### b) Reviews Agents

Positive Reviews Agent and Negative Reviews Agent interact with the Reviews MCP Server.

They fetch and filter positive vs negative brand reviews.

Results stored in the Knowledge Graph.

### c) Reddit Agents

Positive Reddit Threads Agent and Negative Reddit Threads Agent interact with the Reddit MCP Server.

They pull brand-related Reddit discussions (positive/negative).

Results stored in the Knowledge Graph.

### d) Social Media Agents

Positive Socials Agent and Negative Socials Agent interact with the Social Media Comments MCP Server.

They fetch brand mentions/comments from social platforms, classifying them as positive or negative.

Results stored in the Knowledge Graph.

***

## Centralized Knowledge Graph

All the collected and processed results (reviews, Reddit threads, social comments, search results) are stored in the Brand Data Knowledge Graph.

This forms a structured and unified data hub about the brand.

***

## Metrics Generation

Metrics Generator Agent consumes the data from the Knowledge Graph.

It computes KPIs/metrics such as:

* Sentiment scores
* Volume of mentions
* Ratio of positive to negative signals
* Engagement trends

Results are passed forward.

***

## Bounty Generation

Bounty Generation Agent takes the metrics (via A2A communication).

It generates actionable bounties (tasks for improving the brand).

***

## Final Output: Generate Bounties

The system outputs a set of generated bounties for the brand, based on all the insights collected and analyzed.

## Verification

Upon completion of bounties, loyalty program members submit an image as a proof depicting that they completed a specific bounty which an agent verifies and submits the verdict on-chain.