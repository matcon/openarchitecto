# OpenArchitecto Catalogs, Templates & Schemas Reference

## 1. Zone / Boundary Types (`groups[].type`)

| Domain | `type` | Recommended Role | Default Stroke |
| :--- | :--- | :--- | :--- |
| Cloud | `aws_cloud` | Outer cloud account / boundary | `#232F3E` |
| Cloud | `vpc` | Virtual Private Cloud (`10.0.0.0/16`) | `#8C4FFF` |
| Cloud | `public_subnet` | DMZ / Public Subnet | `#7AA116` |
| Cloud | `private_subnet` | App / Data Private Subnet | `#00A4A6` |
| Cloud | `k8s_cluster` | Kubernetes Cluster / Namespace | `#326CE5` |
| Cloud | `region` | Region / Multi-AZ | `#00A4A6` |
| Cloud | `datacenter` | On-Premises Data Center | `#5A6C86` |
| BPMN 2.0 | `bpmn_pool` | Organization / Process Pool | `#334155` |
| BPMN 2.0 | `bpmn_lane` | Actor / Role Swimlane | `#64748B` |
| BPMN 2.0 | `bpmn_subproc` | Embedded Subprocess `[+]` | `#334155` |
| BPMN 2.0 | `bpmn_trans` | ACID / Cancelable Transaction | `#0284C7` |
| C4 | `c4_boundary` | C4 System Boundary | `#1E40AF` |
| UML | `uml_package` | UML Package / Namespace | `#0369A1` |

## 2. Node Stencil IDs (`nodes[].tpl`)

### Cloud (`cloud`)
- **AWS**: `users`, `ec2`, `lambda`, `ecs`, `fargate`, `eks`, `alb`, `cloudfront`, `route53`, `apigw`, `rds`, `dynamodb`, `redis`, `s3`, `waf`, `kms`, `sqs`, `bedrock`
- **GCP**: `gcp_cloudrun`, `gcp_gke`, `gcp_storage`, `gcp_bigquery`, `gcp_pubsub`
- **Azure**: `az_appservice`, `az_functions`, `az_cosmos`, `az_aks`
- **Kubernetes & App Stack**: `k8s_ingress`, `k8s_pod`, `docker`, `kafka`, `fastapi`, `react`

### BPMN 2.0 (`bpmn`)
- **Start Events**: `bpmn_start`, `bpmn_start_msg`, `bpmn_start_timer`
- **Intermediate Events**: `bpmn_timer`, `bpmn_msg`, `bpmn_error`, `bpmn_link`
- **End Events**: `bpmn_end`, `bpmn_end_msg`, `bpmn_end_term`, `bpmn_end_error`
- **Tasks**: `bpmn_user_task`, `bpmn_service_task`, `bpmn_send_task`, `bpmn_recv_task`, `bpmn_script_task`, `bpmn_rule_task`, `bpmn_manual_task`
- **Gateways**: `bpmn_gw_xor`, `bpmn_gw_and`, `bpmn_gw_or`, `bpmn_gw_event`, `bpmn_gw_complex`
- **Artifacts**: `bpmn_data_object`, `bpmn_data_store`, `bpmn_annotation`

### UML 2.5 (`uml`)
- `uml_class`, `uml_interface`, `uml_actor`, `uml_usecase`, `uml_lifeline`, `uml_state`, `uml_component`

### C4 Model (`c4`)
- `c4_person`, `c4_system`, `c4_container`, `c4_db`, `c4_comp`

### ERD (`erd`)
- `erd_table`, `erd_rel`

### Flowchart (`flowchart`)
- `fc_process`, `fc_decision`, `fc_io`, `fc_term`, `fc_doc`

## 3. Built-in Templates (`templateId`)

| `templateId` | Discipline | Focus |
| :--- | :--- | :--- |
| `medicapp-cloud` | `cloud` | Zero Trust multi-zone cloud architecture (WAF, DMZ, App, Data VLAN, S3 WORM) |
| `uml-class-medicapp` | `uml` | Clinical domain class model with attributes, methods, and interfaces |
| `uml-sequence-auth` | `uml` | OAuth2 / JWT + MFA authentication sequence lifelines |
| `bpmn-telemedicina` | `bpmn` | Multi-lane clinical workflow with XOR/AND gateways, timers, errors, and data objects |
| `c4-medicapp-containers` | `c4` | C4 Level 2 Container diagram with system boundary |
| `erd-hospital` | `erd` | Relational schema with PK/FK attributes and relationships |
| `flowchart-triage` | `flowchart` | Algorithmic triage decision flow |

## 4. `create_diagram` JSON Payload Contract

```json
{
  "title": "Order Fulfillment Architecture",
  "diagramType": "cloud",
  "groups": [
    {
      "id": "g_vpc",
      "type": "vpc",
      "name": "Production VPC",
      "sub": "10.0.0.0/16",
      "x": 60,
      "y": 40,
      "w": 840,
      "h": 420
    }
  ],
  "nodes": [
    {
      "id": "n_gw",
      "tpl": "apigw",
      "name": "API Gateway",
      "sub1": "HTTPS / JWT",
      "x": 140,
      "y": 180
    },
    {
      "id": "n_fn",
      "tpl": "lambda",
      "name": "Order Handler",
      "sub1": "Node.js 22",
      "x": 420,
      "y": 180
    }
  ],
  "edges": [
    {
      "id": "e_1",
      "source": "n_gw",
      "target": "n_fn",
      "label": "POST /orders",
      "style": "primary",
      "step": "1"
    }
  ]
}
```

### Layout & Validation Rules
- `groups`, `nodes`, and `edges` IDs must be unique across the diagram (`create_diagram` rejects duplicate IDs or edges referencing missing `source`/`target` IDs).
- `diagramType` must be one of: `"cloud" | "bpmn" | "uml" | "c4" | "erd" | "flowchart"`.
- `edges[].style` must be one of: `"primary" | "sec" | "async" | "error"`.
- For BPMN Swimlanes: create one outer `bpmn_pool` (e.g., `x: 40, y: 40, w: 1200, h: 480`) and stack `bpmn_lane` zones inside starting at `x + 40` with equal heights (`~160px` per lane).
- For Presentation Mode: always set `step` (`"1"`, `"2"`, `"3"`, ...) on every edge so presenters can walk through flows sequentially using `ArrowRight` / `Space`.
