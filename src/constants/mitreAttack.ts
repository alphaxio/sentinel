// MITRE ATT&CK Framework - Common Techniques
// Reference: https://attack.mitre.org/

export interface MitreAttackTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
}

export const MITRE_ATTACK_TECHNIQUES: MitreAttackTechnique[] = [
  // Initial Access
  {
    id: "T1190",
    name: "Exploit Public-Facing Application",
    tactic: "Initial Access",
    description: "Adversaries exploit vulnerabilities in internet-facing systems to gain initial access"
  },
  {
    id: "T1078",
    name: "Valid Accounts",
    tactic: "Initial Access",
    description: "Adversaries obtain and use legitimate credentials to access systems"
  },
  {
    id: "T1133",
    name: "External Remote Services",
    tactic: "Initial Access",
    description: "Adversaries leverage external-facing remote services to gain access"
  },
  {
    id: "T1566",
    name: "Phishing",
    tactic: "Initial Access",
    description: "Adversaries send fraudulent messages to trick users into revealing credentials"
  },
  
  // Execution
  {
    id: "T1059",
    name: "Command and Scripting Interpreter",
    tactic: "Execution",
    description: "Adversaries abuse command and script interpreters to execute commands"
  },
  {
    id: "T1106",
    name: "Native API",
    tactic: "Execution",
    description: "Adversaries may interact with the native OS API to execute behaviors"
  },
  
  // Persistence
  {
    id: "T1543",
    name: "Create or Modify System Process",
    tactic: "Persistence",
    description: "Adversaries create or modify system processes to maintain persistence"
  },
  {
    id: "T1134",
    name: "Access Token Manipulation",
    tactic: "Persistence",
    description: "Adversaries manipulate access tokens to operate under a different user"
  },
  
  // Privilege Escalation
  {
    id: "T1548",
    name: "Abuse Elevation Control Mechanism",
    tactic: "Privilege Escalation",
    description: "Adversaries abuse elevation control mechanisms to gain higher-level permissions"
  },
  {
    id: "T1078.003",
    name: "Local Accounts",
    tactic: "Privilege Escalation",
    description: "Adversaries obtain and abuse credentials of local accounts"
  },
  
  // Defense Evasion
  {
    id: "T1070",
    name: "Indicator Removal on Host",
    tactic: "Defense Evasion",
    description: "Adversaries delete or modify artifacts generated on a system"
  },
  {
    id: "T1027",
    name: "Obfuscated Files or Information",
    tactic: "Defense Evasion",
    description: "Adversaries may attempt to make payloads or commands difficult to discover"
  },
  
  // Credential Access
  {
    id: "T1110",
    name: "Brute Force",
    tactic: "Credential Access",
    description: "Adversaries may use brute force techniques to gain access to accounts"
  },
  {
    id: "T1555",
    name: "Credentials from Password Stores",
    tactic: "Credential Access",
    description: "Adversaries search for common password storage locations"
  },
  
  // Discovery
  {
    id: "T1083",
    name: "File and Directory Discovery",
    tactic: "Discovery",
    description: "Adversaries may enumerate files and directories to understand the environment"
  },
  {
    id: "T1018",
    name: "Remote System Discovery",
    tactic: "Discovery",
    description: "Adversaries may attempt to get a listing of other systems on the network"
  },
  
  // Lateral Movement
  {
    id: "T1021",
    name: "Remote Services",
    tactic: "Lateral Movement",
    description: "Adversaries use remote services to move between systems"
  },
  {
    id: "T1077",
    name: "Windows Admin Shares",
    tactic: "Lateral Movement",
    description: "Adversaries may use Windows admin shares to move between systems"
  },
  
  // Collection
  {
    id: "T1005",
    name: "Data from Local System",
    tactic: "Collection",
    description: "Adversaries may search local system sources to find files of interest"
  },
  {
    id: "T1041",
    name: "Exfiltration Over C2 Channel",
    tactic: "Collection",
    description: "Adversaries may steal data by exfiltrating it over a command and control channel"
  },
  
  // Exfiltration
  {
    id: "T1048",
    name: "Exfiltration Over Alternative Protocol",
    tactic: "Exfiltration",
    description: "Adversaries may steal data by exfiltrating it over a different protocol"
  },
  {
    id: "T1567",
    name: "Exfiltration to Web Service",
    tactic: "Exfiltration",
    description: "Adversaries may exfiltrate data to a web service they control"
  },
  
  // Impact
  {
    id: "T1486",
    name: "Data Encrypted for Impact",
    tactic: "Impact",
    description: "Adversaries may encrypt data on target systems to interrupt availability"
  },
  {
    id: "T1499",
    name: "Endpoint Denial of Service",
    tactic: "Impact",
    description: "Adversaries may perform DoS attacks to disrupt availability"
  },
];

// Helper function to get technique by ID
export function getMitreTechnique(id: string): MitreAttackTechnique | undefined {
  return MITRE_ATTACK_TECHNIQUES.find(tech => tech.id === id);
}

// Helper function to search techniques
export function searchMitreTechniques(query: string): MitreAttackTechnique[] {
  const lowerQuery = query.toLowerCase();
  return MITRE_ATTACK_TECHNIQUES.filter(tech =>
    tech.id.toLowerCase().includes(lowerQuery) ||
    tech.name.toLowerCase().includes(lowerQuery) ||
    tech.tactic.toLowerCase().includes(lowerQuery)
  );
}


