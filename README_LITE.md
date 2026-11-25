# OpenArchitecto Studio — Quick Guide

> Full cross-platform documentation is available in [README.md](README.md).

## Start Web Studio

```bash
npm install
npm run build
npm start
# Or via launcher:
./iniciar.sh
```

Open `http://127.0.0.1:5173`.

## Install MCP Server, Skill & Agent

```bash
# Linux / macOS
./install.sh

# Windows PowerShell
.\install.ps1

# Node.js cross-platform CLI
node scripts/install.mjs --dry-run
node scripts/install.mjs
```

## Available Built-in Disciplines

- **Multi-Cloud & K8s**: AWS Cloud, VPC, Public/Private Subnets, K8s Cluster, GCP, Azure
- **BPMN 2.0**: Pools, Horizontal Swimlanes, Embedded Subprocesses, Transactions, Start/Intermediate/End Events, Typed Tasks, XOR/AND/OR/Event/Complex Gateways, Data Objects & Stores
- **UML 2.5**: Packages, Classes, Interfaces, Actors, Use Cases, Lifelines, States, Components
- **C4 Model**: System Boundaries, Persons, Systems, Containers, Databases, Components
- **ERD & Flowcharts**: Relational Tables, Relationships, Process/Decision/I-O/Terminator/Document nodes
