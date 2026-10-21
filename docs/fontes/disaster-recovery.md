# Fontes: Single Point of Failure e Disaster Recovery

Registro dos links de fonte do módulo 27, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Single Point of Failure, Disaster Recovery e Continuidade Operacional, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/single-point-of-failure/), publicado em 10/03/2026 e citado nas aulas 1 a 5.

**Aulas:** 1 Single Point of Failure · 2 Identificando SPoFs · 3 Redundância e failover · 4 Disaster Recovery · 5 Métricas e KPIs de recuperação

**Código:** o repositório público do autor **não tem lab de SPoF nem de DR** em `exemplos/` (conferido com `gh api`). Em `cases/` existe `AVANCADO_PLATAFORMA_MULTIREGIAO_AWS.md` (Kubernetes multirregião e multi-cluster, criticidade por workload), citado na aula 4 como aprofundamento. O "lab" do módulo é só conta (`c27.py`, Python, 21/10/2026).

**Números calculados (não medidos):** a auditoria em série e paralelo (0,999¹² = 98,8066%; 0,999⁵ × 0,999999⁷ = 99,5003%; 0,999999¹² = 99,9988%), a linha do tempo (30 · 35 · 60 · 65 s), os RTOs (2.874 · 720 · 65 · 35 s), os R$ (792/s × RTO), o restore de 924 s (46,2 GB a 50 MB/s), o split brain (297 e 2.970), as médias do artigo (34 · 108,4 · 204,5 min) e a disponibilidade (65,4% · 99,9975% · 99,7506%). **Não foram rodados:** um failover regional de verdade, o fencing do Patroni com partição de rede (o `pg_ctl promote` e o `pg_rewind` foram vistos no módulo 17, PostgreSQL 14), o tempo de nós e pods (modelo), o ticket médio de R$ 80 (média de 13 pedidos da história, exemplo) e os custos relativos de cada estratégia (exemplo).

**Conferência feita em 2026-10-21** (curl com `-L` e `User-Agent` de navegador): os 28 links distintos desta lista deram 200.

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo de Matheus Fidelis](https://fidelissauro.dev/single-point-of-failure/) | artigo base | SPoF e a ponte, identificar, lidar, stateless, ativa e passiva, failover, DR, ativo-ativo, ativo-passivo, pilot light, MTTD, MTTR, MTBF, RTO e RPO. | 1–5 | 200 |
| [Repositório do autor: plataforma multirregião na AWS](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/blob/main/cases/AVANCADO_PLATAFORMA_MULTIREGIAO_AWS.md) | repositório | Caso avançado de multirregião, multi-cluster e continuidade. | 4 | 200 |
| [Wikipédia: Single point of failure](https://en.wikipedia.org/wiki/Single_point_of_failure) | enciclopédia | Definição e exemplos. | 1 | 200 |
| [Google SRE book: Embracing Risk](https://sre.google/sre-book/embracing-risk/) | livro (web) | Disponibilidade como custo × risco aceito. | 1 | 200 |
| [AWS Builders' Library: Static stability using Availability Zones](https://aws.amazon.com/builders-library/static-stability-using-availability-zones/) | artigo AWS | Estabilidade estática: o que está no caminho não depende do plano de controle. | 1, 2 | 200 |
| [AWS Reliability Pillar: planejar a recuperação de desastres](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_for_recovery_disaster_recovery.html) | documentação | Boas práticas de DR e teste. | 2 | 200 |
| [Anomali: Why a Single Point of Failure (SPOF) is Scary](https://www.anomali.com/blog/why-single-point-of-failure-is-scary) | artigo (aprofundar) | Referência do artigo; SPoF no contexto de segurança. | 2 | 200 |
| [Bryghtpath: Understanding Single Point Failures](https://bryghtpath.com/single-point-failures/) | artigo (aprofundar) | Referência do artigo; SPoFs organizacionais e de pessoas. | 2 | 200 |
| [Martin Fowler: Leader and Followers](https://martinfowler.com/articles/patterns-of-distributed-systems/leader-follower.html) | padrão | Eleição e substituição do líder. | 3 | 200 |
| [Patroni: configuração dinâmica](https://patroni.readthedocs.io/en/latest/dynamic_configuration.html) | documentação | `ttl`, `loop_wait` e `retry_timeout` (o 30 + 5 = 35 s). | 3 | 200 |
| [PostgreSQL: warm standby](https://www.postgresql.org/docs/current/warm-standby.html) | documentação | Servidores standby e promoção. | 3 | 200 |
| [PostgreSQL: pg_rewind](https://www.postgresql.org/docs/current/app-pgrewind.html) | documentação | Religar o primário antigo, descartando o que divergiu. | 3 | 200 |
| [Wikipédia: Split-brain (computing)](https://en.wikipedia.org/wiki/Split-brain_(computing)) | enciclopédia | Dois nós ativos; fencing e quórum. | 3 | 200 |
| [AWS: Disaster Recovery Options in the Cloud](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html) | whitepaper | As quatro estratégias: backup e restauração, pilot light, warm standby e multi-site ativo/ativo. | 4 | 200 |
| [AWS Architecture Blog: DR Architecture on AWS, Part I](https://aws.amazon.com/blogs/architecture/disaster-recovery-dr-architecture-on-aws-part-i-strategies-for-recovery-in-the-cloud/) | blog | As estratégias lado a lado, com RPO e RTO. | 4 | 200 |
| [Google SRE book: Postmortem Culture](https://sre.google/sre-book/postmortem-culture/) | livro (web) | Aprender com a falha; base do game day. | 4 | 200 |
| [AWS: Business continuity plan (BCP)](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/business-continuity-plan-bcp.html) | whitepaper | RTO = atraso entre a interrupção e a restauração; RPO; a estratégia que custa mais que a falha não se adota. | 4, 5 | 200 |
| [NIST SP 800-34 rev. 1](https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final) | norma | Planejamento de contingência, RTO e RPO na análise de impacto. | 5 | 200 |
| [Atlassian: Common incident management metrics](https://www.atlassian.com/incident-management/kpis/common-metrics) | documentação | Os quatro significados do "R" de MTTR (repair, recovery, respond, resolve); MTBF. | 5 | 200 |
| [PostgreSQL: arquivamento contínuo](https://www.postgresql.org/docs/current/continuous-archiving.html) | documentação | WAL arquivado e `archive_timeout` (RPO de 5 min). | 5 | 200 |
| [Splunk: What is MTTD](https://www.splunk.com/en_us/blog/learn/mean-time-to-detect-mttd.html) | artigo (aprofundar) | Referência do artigo; MTTD. | 5 | 200 |

## Conferidos e não citados nas aulas

| Fonte | Observação | Status |
|---|---|---|
| [AWS: Disaster Recovery of Workloads on AWS (índice)](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-workloads-on-aws.html) | Página-mãe do whitepaper. | 200 |
| [AWS Reliability Pillar: RPO e RTO (REL13)](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_for_recovery_dr_objective_rpo_rto.html) | Definir os objetivos de recuperação. | 200 |
| [PostgreSQL: runtime-config-wal](https://www.postgresql.org/docs/current/runtime-config-wal.html) | `archive_timeout`. | 200 |
| [Patroni: documentação](https://patroni.readthedocs.io/en/latest/) | Visão geral. | 200 |
| [Wikipédia: Disaster recovery](https://en.wikipedia.org/wiki/Disaster_recovery) | Visão geral. | 200 |
| [Wikipédia: Mean time between failures](https://en.wikipedia.org/wiki/Mean_time_between_failures) | MTBF. | 200 |
| [SentinelOne: MTTD](https://www.sentinelone.com/blog/mttd-mean-time-to-detect-detailed-explanation/) | Referência do artigo; fica fora das aulas pelo limite de 6 links por aula. | 200 |

**Não usados:** o levelup/gitconnected, a página da IBM e o LogicMonitor (via tradutor), referências do artigo que respondem 403 a robôs; o Usenix *Millions of Tiny Databases* (403).

## Correções ao artigo (avisadas nas aulas)

1. **RTO "após a detecção".** O artigo define o RTO como o tempo máximo "após a detecção". A AWS define como o atraso **entre a interrupção** e a restauração: o RTO inclui o MTTD. Na loja, 30 + 35 = **65 s**, não 35 s. (Aulas 4 e 5.)
2. **Quatro significados do "R" de MTTR.** O artigo usa reparo; a Atlassian lista repair, recovery, respond e resolve. A aula 5 escolhe "da detecção à recuperação" e diz.
3. **Tabelas de exemplo que não são os mesmos incidentes** (12:00 PM × 12:00 AM; 10:02 × 11:02). As médias (34 · 108,4 · 204,5) estão certas para cada tabela; a disponibilidade dá 65,4%: didática. O MTTR de 108,4 min aparece como 108. (Aula 5 e widget.)
4. **RPO "12 h".** É o pior caso; a perda esperada com a falha em instante aleatório é de 6 h. O RPO se converte em pedidos (taxa × tempo). RPO zero custa a rede (12 ms com o Rio, 82 ms com Recife). (Aula 5.)
5. **Ativo-passivo sem dizer quanto fica ligado.** A AWS separa o warm standby do pilot light e inclui o backup e restauração, que o artigo não lista. RTO de 65 s, 12 min e ~48 min. (Aula 4.)
6. **"Duplicar" supõe falhas independentes.** O edge-loja com o mesmo código e o mesmo mapa soma a falha em vez de multiplicar (modo comum). (Aulas 1 e 2.)
7. **Circuit breaker e feature flag como "failover automático".** O breaker decide por chamada; o failover regional decide por sonda, quórum e roteador. (Aula 3.)
8. **O que falta no artigo:** testar o DR (game day), metas por serviço, custo da falha × custo da estratégia, dependências cruzadas (o hub), split brain e failback, estabilidade estática e reutilização de identificadores depois de uma promoção. (Aulas 2 a 5.)
9. **Referências.** Três respondem 403 a robôs (levelup/gitconnected, IBM, LogicMonitor): não citadas. Anomali, Bryghtpath, Splunk e SentinelOne abrem e entram só como aprofundamento.

## Pendência do brief

O brief cita "~4,97% do orçamento de erro do mês" para as 643,5 tentativas falhas; a conta não pôde ser reproduzida a partir dos dados do módulo (65 s são ~2,5% de 43,2 min), então a aula 4 traz só as 643,5 tentativas e deixa o orçamento de erro para o módulo 28.
