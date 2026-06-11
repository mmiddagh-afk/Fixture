# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When retrieving structural confidence metrics, domain boundaries, or disorder assessments for a protein using a UniProt Accession ID | alphafold-database-fetch-and-analyze | C:\Users\mmidd\.gemini\config\plugins\science\skills\alphafold_database_fetch_and_analyze\SKILL.md |
| When analyzing non-coding variant effects on expression, chromatin, histone marks, or transcription factors, or resolving terms to ontologies | alphagenome-single-variant-analysis | C:\Users\mmidd\.gemini\config\plugins\science\skills\alphagenome_single_variant_analysis\SKILL.md |
| When orchestrating Android development tasks (project creation, deployment, SDK management, layout inspection) via CLI | android-cli | C:\Users\mmidd\.gemini\config\plugins\android-cli-plugin\skills\SKILL.md |
| When creating a pull request, opening a PR, or preparing changes for review | branch-pr | C:\Users\mmidd\.gemini\config\skills\branch-pr\SKILL.md |
| When querying ChEMBL for compounds, targets, IC50/Ki values, drug mechanisms, or structures | chembl-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\chembl_database\SKILL.md |
| When querying ClinicalTrials.gov for condition/drug trials, recruitment, or NCT IDs | clinical-trials-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\clinical_trials_database\SKILL.md |
| When retrieving clinical significance, pathogenicity classifications, or clinical evidence rationales for human genomic variants | clinvar-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\clinvar_database\SKILL.md |
| When looking up or mapping short genetic variants (SNPs, indels) between rsIDs, HGVS, or coordinates in dbSNP | dbsnp-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\dbsnp_database\SKILL.md |
| When querying biomedical ontology terms, definitions, and hierarchies (GO, DOID, HP) in EMBL-EBI OLS | embl-ebi-ols | C:\Users\mmidd\.gemini\config\plugins\science\skills\embl_ebi_ols\SKILL.md |
| When querying regulatory annotations or raw experimental data (cCREs, ChIP-seq peaks) across human cell types in ENCODE | encode-ccres-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\encode_ccres_database\SKILL.md |
| When resolving gene/transcript/protein IDs, fetching sequences, or running variant effect predictions (VEP) in Ensembl | ensembl-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\ensembl_database\SKILL.md |
| When performing 3D structural protein similarity searches against structure databases using a coordinate file (.cif, .pdb) | foldseek-structural-search | C:\Users\mmidd\.gemini\config\plugins\science\skills\foldseek_structural_search\SKILL.md |
| When retrieving variant allele frequencies, loss-of-function intolerance (pLI, LOEUF), or structural variants from gnomAD | gnomad-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\gnomad_database\SKILL.md |
| When writing Go unit tests, TUI teatests, table-driven tests, or golden file tests | go-testing | C:\Users\mmidd\.gemini\config\skills\go-testing\SKILL.md |
| When retrieving quantitative RNA expression data and variant eQTLs from GTEx across tissue sites | gtex-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\gtex_database\SKILL.md |
| When retrieving protein expression or spatial localization data from the Human Protein Atlas (HPA) | human-protein-atlas-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\human_protein_atlas_database\SKILL.md |
| When identifying protein domains/families, species distributions, or annotating genomes using InterPro | interpro-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\interpro_database\SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature | issue-creation | C:\Users\mmidd\.gemini\config\skills\issue-creation\SKILL.md |
| When retrieving Transcription Factor binding profiles (PFMs/PWMs) or resolving gene symbols to JASPAR IDs | jaspar-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\jaspar_database\SKILL.md |
| When user requests "judgment day" parallel blind code reviews with verdict synthesis and iterative fixing | judgment-day | C:\Users\mmidd\.gemini\config\skills\judgment-day\SKILL.md |
| When searching for scientific papers, preprints, and publications on arXiv and downloading PDFs | literature-search-arxiv | C:\Users\mmidd\.gemini\config\plugins\science\skills\literature_search_arxiv\SKILL.md |
| When browsing, filtering, and downloading preprints from bioRxiv/medRxiv by DOI or narrow date range | literature-search-biorxiv | C:\Users\mmidd\.gemini\config\plugins\science\skills\literature_search_biorxiv\SKILL.md |
| When searching Europe PMC for open-access literature, PMCIDs, full texts, or bibliographies | literature-search-europepmc | C:\Users\mmidd\.gemini\config\plugins\science\skills\literature_search_europepmc\SKILL.md |
| When querying OpenAlex for papers, authors, institutions, or h-index/citation metadata | literature-search-openalex | C:\Users\mmidd\.gemini\config\plugins\science\skills\literature_search_openalex\SKILL.md |
| When retrieving protein or nucleotide sequences from NCBI by accession, locus, gene, PubMed, or patent ID | ncbi-sequence-fetch | C:\Users\mmidd\.gemini\config\plugins\science\skills\ncbi_sequence_fetch\SKILL.md |
| When querying openFDA for drug/device adverse events, recalls, NDC lookups, or shortages | openfda-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\openfda_database\SKILL.md |
| When querying Open Targets for target-disease associations, tractability, safety, or drug targets | opentargets-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\opentargets_database\SKILL.md |
| When searching, downloading, or analyzing experimentally-determined 3D macromolecular structures | pdb-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\pdb_database\SKILL.md |
| When performing multiple sequence alignments of proteins using EBI Clustal Omega | protein-sequence-msa | C:\Users\mmidd\.gemini\config\plugins\science\skills\protein_sequence_msa\SKILL.md |
| When searching for homologous protein sequences using MMseqs2 or BLAST | protein-sequence-similarity-search | C:\Users\mmidd\.gemini\config\plugins\science\skills\protein_sequence_similarity_search\SKILL.md |
| When querying PubChem for chemicals, drugs, CIDs, or SMILES/substructure searches | pubchem-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\pubchem_database\SKILL.md |
| When searching PubMed for literature, abstracts, or linking publications to biological databases | pubmed-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\pubmed_database\SKILL.md |
| When visualizing, aligning, rendering, or measuring protein and ligand 3D structures in PyMOL | pymol | C:\Users\mmidd\.gemini\config\plugins\science\skills\pymol\SKILL.md |
| When mapping genes to GO terms or exploring the Gene Ontology hierarchy via QuickGO | quickgo-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\quickgo_database\SKILL.md |
| When performing pathway analysis, gene list enrichment, or mapping reactions in Reactome | reactome-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\reactome_database\SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI | skill-creator | C:\Users\mmidd\.gemini\config\skills\skill-creator\SKILL.md |
| When querying STRING for protein-protein interactions (PPIs), enrichment, or homology | string-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\string_database\SKILL.md |
| When fetching evolutionary conservation scores or TFBS coordinates from UCSC | ucsc-conservation-and-tfbs | C:\Users\mmidd\.gemini\config\plugins\science\skills\ucsc_conservation_and_tfbs\SKILL.md |
| When retrieving experimentally validated TF binding site coordinates from UniBind | unibind-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\unibind_database\SKILL.md |
| When searching for protein metadata, sequences, ID mapping, or SPARQL graph queries in UniProt | uniprot-database | C:\Users\mmidd\.gemini\config\plugins\science\skills\uniprot_database\SKILL.md |
| When checking, installing, or configuring the uv Python package manager on PATH | uv | C:\Users\mmidd\.gemini\config\plugins\science\skills\uv\SKILL.md |
| When distilling a completed user workflow or interaction into a reusable agent skill (not from scratch) | workflow-skill-creator | C:\Users\mmidd\.gemini\config\plugins\science\skills\workflow_skill_creator\SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Every PR must link an approved issue (`Closes #N`, `Fixes #N`, `Resolves #N`).
- Branch names must follow `(type)/(description)` (e.g. `feat/user-login`, `fix/bug-fix`).
- Use conventional commit messages (`feat: ...`, `fix: ...`, etc.).
- Never add "Co-Authored-By" or AI attribution trailers.

### issue-creation
- Blank issues are disabled; use bug report or feature request templates.
- Newly created issues get `status:needs-review` automatically.
- Do not open a PR until a maintainer adds `status:approved` to the issue.

### judgment-day
- Launches two blind judge sub-agents in parallel using `delegate`.
- Verdict synthesis combines findings: Confirmed (both), Suspect (one), Contradiction (disagreement).
- Warnings must be classified into `WARNING (real)` (blocks merge) or `WARNING (theoretical)` (reported as INFO, does not block).
- Approved criteria: 0 confirmed CRITICALs + 0 confirmed real WARNINGs.

### skill-creator
- Follow the SKILL.md structure with frontmatter (`name`, `description` with trigger, `license: Apache-2.0`, `metadata`).
- Keep rules actionable, minimize lengthy explanations, and use local references.
- Register the new skill in `AGENTS.md`.

### go-testing
- Use Table-Driven tests for function inputs/outputs.
- Test Bubbletea models using state transition checks or Charmbracelet's `teatest`.
- Use Golden File testing for visual outputs and check updates via `-update` flag.
- Mock system commands and use `t.TempDir()` for file-system isolated tests.

### uv
- Run CLI scripts using `uv run`, never bare `python`.
- Install using `curl -LsSf https://astral.sh/uv/install.sh | sh` if missing and add to PATH.

### workflow-skill-creator
- Brainstorming (Phase 1) is mandatory; pick 2-3 questions per round.
- If code is needed, default to CLI scripts using argparse with subcommands.
- All subcommands must output to files (JSON or custom) rather than stdout.

### android-cli
- Manage SDK components via `android sdk install/update`.
- Create projects from templates using `android create`.
- Inspect UI hierarchy using JSON tree from `android layout`.

### science-databases-common
- Always verify `uv` is installed and on PATH before running.
- Use provided Python wrappers/scripts rather than raw curl/HTTP requests.
- Limit search results (e.g. `--limit 5`) to check hits before downloading bulk data.
- Always check the number of entries via `count` before running a broad search or stream.
- Never hallucinate functions, sequences, or metadata; rely strictly on tool output.
- Present attribution/licensing notices to the user on first usage of a science database.

## Project Conventions

| File | Path | Notes |
|------|------|-------|

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
