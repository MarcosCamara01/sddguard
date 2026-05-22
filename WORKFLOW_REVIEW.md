# Review del workflow sddx — perspectiva agente

*Tras una sesión extendida ejecutando todos los slash commands como Claude
Code sobre un proyecto ficticio (un API de tareas con feature de
asignación + notificaciones), aquí va mi opinión honesta. No es un audit
— para eso está [QA_REPORT.md](QA_REPORT.md). Es la voz de un agente que
ha vivido dentro del protocolo.*

> Historical review: bug references below describe the workflow state from the
> original review session. Current fix status is tracked in
> [BUGFIX_PROMPTS.md](BUGFIX_PROMPTS.md).

---

## 1. Cosas buenas

Las decisiones que me robaría para cualquier proyecto de agente-protocolo.

### 1.1 Gates regex-detectables

El checkbox `[ ] ⛔ BLOCKING` en Clarifications es la mejor invención del
protocolo. Un solo regex (`^- \[ \] ⛔ BLOCKING`) convierte "¿debería
preguntar?" en una check trivial. Imposible de saltar por accidente,
imposible de discutir cuando dispara, observable tanto por el agente como
por el CLI.

El `[ ] **Approved**` en `2-plan.md` hace lo mismo para la aprobación del
plan. Casi cada otro gate del protocolo se apoya en estos dos patrones.

**Por qué importa:** todos los otros productos de "AI workflow tooling"
que he visto enforcean disciplina con prompts ("recuerda pedir
permiso antes de…"). Eso falla porque depende de que el agente recuerde.
Aquí la disciplina es una **estructura textual** que el agente puede
*observar*, no recordar.

### 1.2 "Non-binding" por defecto

Las recomendaciones de `/research`, los proposed resolutions de
`/impl-gap`, los drafts de CR en `/spec-amend` — todo marcado
explícitamente como sugerencia del agente, *nunca decisión*. Esta sola
disciplina me frenó varias veces de inclinarme hacia mi propia respuesta.

**Ejemplo concreto que viví:** en GAP-001 escribí dos interpretaciones
para `null → null` no-op antes de proponer la (a). Sin el rule
"non-binding", habría escrito mi favorita y rubber-stamped la
"discusión". Con la regla, ambas opciones quedaron sobre la mesa y el
usuario eligió de verdad.

### 1.3 La columna Evidence en `/verify`

"All checks PASS" es fácil. `PASS, evidence at src/store.js:37-46 + test
'searchTasks: substring match' at test/search.test.js:28` es duro de
inventar. Esa columna es la diferencia entre auditoría y thumbs-up.

Conviértela en feature destacada del README — actualmente está
sepultada en el template y la mayoría de usuarios no la verán hasta
ejecutar `/verify` por primera vez.

### 1.4 El formato de commit en `/finish`

> "Explicit exclusions belong in the bullets — 'X is intentionally
> excluded because Y'"

No he visto otra convención de commits que pida esto. Y es **exactamente
lo que quiero leer en el git log seis meses después** cuando me pregunte
"¿por qué no se hizo Z aquí?".

El formato completo (type/scope/summary/sentence/bullets/footer) es
opinionado, pero cada pieza paga. Especialmente el "explain the *why*
behind each decision, not just the *what*" en las bullets.

### 1.5 Markers `<!-- manual -->` / `<!-- auto -->` en `conventions.md`

Permiten a `/conventions-sync` regenerar las secciones auto sin pisar la
prosa del usuario. Pequeño, bien colocado, sin ceremonia.

**Detalle que aprecié:** durante mi sync, el `Domain Glossary` estaba
marcado `<!-- manual -->` pero su contenido del shape `Task` ya estaba
desactualizado (le faltaba `assignee`). El protocolo me hizo flagear al
usuario en lugar de tocarlo. Correcto.

### 1.6 La regla "no adjacent cleanup" en `/bugfix` y `/refactor`

El mismo comentario muerto `// (intentionally never reachable …)` en
`src/server.js`: tres comandos diferentes me llevaron cerca de él, tres
veces el protocolo me frenó de limpiarlo.

Las otras herramientas animan a "tidy while you're here". Esta lo
**prohíbe**. Duele en el momento, paga en PRs reviewables. La regla
también es la única que mecánicamente previene el modo-fallo más común
de un agente: scope creep silencioso.

### 1.7 Las 6 preguntas del `/bootstrap`

No son genéricas. Apuntan a lo que los agentes *de hecho* no preguntan:

- Non-goals explícitos
- Decisiones de arquitectura ya cerradas
- Qué significa "production ready"

Estas son las preguntas que un humano experimentado hace al heredar un
proyecto. Codificarlas en el `/bootstrap` cierra un gap real.

### 1.8 El modo `--scan` para brownfield

> "Ask only about what the code cannot answer."

Esa sola frase es el modelo correcto para poner al día a un agente sin
re-litigar la historia. El agente lee el código, infiere lo que puede, y
solo pregunta intent (no implementation).

### 1.9 La separación `/verify` vs `/review`

Mecánica vs cualitativa. Dos pases con propósitos distintos. Easy to
collapse into one — pero la separación evita que el `/verify` mecánico se
contamine con notas subjetivas ("naming X is unclear"), y evita que el
`/review` qualitativo se distraiga revisando checkboxes.

### 1.10 El acoplamiento CLI ↔ agente vía `status`

`sddx-workflow status` lee directamente los artefactos del protocolo
(checkboxes, secciones de amendments, GAP entries). Ambos (CLI y agente)
miran la misma superficie. Eso significa que un humano puede gateear
sobre el mismo signal que el agente *sin* tener que arrancar al agente.

Es elegante. Solo hace falta arreglar B-03 (el regex FAIL) para que la
historia sea coherente entera.

### 1.11 IDs de goal referenciables (G1, G2…) en cadena

Los goals tienen ID explícito en `1-requirements.md`. Cada task referencia
un Goal ID en su campo `Goal:`. `/verify` cross-checkea Goal IDs contra
tasks. `/spec-analyze` lo refuerza con su tabla Goal-to-Task.

**Resultado:** la cobertura es una claim *verificable* — "G2 → T2 → test
'reassignment emits with previous'". Sin IDs, "cobertura de goals" es
vibes y nadie sabe si lo discute lo mismo.

Robado: lo usaré en cualquier proyecto donde haya que correlacionar
requisitos con tests.

### 1.12 Per-Phase Permissions table

`templates/workflow.md` incluye una tabla formal de qué puede leer/editar
/crear cada comando. `/spec-tasks` puede tocar código pero solo
`3-tasks.md` en specs. `/verify` no puede tocar nada salvo el report. Etc.

**Por qué es bueno:** la mayoría de "AI protocols" describen
comportamiento en prosa. Aquí está como matriz. Es directamente
verificable contra el diff de un PR: "este commit toca `2-plan.md` →
¿venía de `/spec-amend` aprobado o de `/spec-plan` inicial?". Sin la
matriz, la respuesta es interpretación.

### 1.13 Anti-Patterns + Stop Points como listas standalone

Al final de `workflow.md` hay dos listas separadas:
- **Anti-Patterns** (9 items) — cosas que el agente *no* debe hacer
  aunque las reglas por-comando lo permitan implícitamente
- **Stop Points (Non-Negotiable)** (9 items) — situaciones donde el
  agente DEBE parar

**Lo que aportan:** son **policía retrospectiva**. Las reglas por-comando
describen el comportamiento *durante* el comando. Estas dos listas
codifican comportamiento *transversal* — "no improvises", "no edites
spec aprobada en silencio", "stop on abort criterion triggered". Cuando
el agente tiene dudas y ningún comando aplica claramente, esas listas son
la red.

### 1.14 Verification criteria definidos en el plan, no después

`2-plan.md §Verification` lista cómo confirmar que cada task está hecho
*antes* de empezar a ejecutarlo. No se decide post-hoc qué cuenta como
"done".

**Por qué importa:** la regla del workflow §Execution Principles dice
"define what 'done' looks like before you start". El plan template
fuerza la operacionalización antes del primer commit. Es la regla
"verify before moving on" hecha estructura.

### 1.15 `/spec-analyze` cruza plan-prose contra código

Es el único comando que compara lo que **el plan dice que harás** (la
prosa de `§Approach`, `§Components Affected`) contra lo que **realmente
implementaste**. `/verify` cross-checkea contra `3-tasks.md` (tareas
marcadas), pero no lee la prosa del plan. Un agente puede marcar todas
las tareas, pasar el test suite, satisfacer goal-to-task coverage… y aun
así haber implementado solo *parte* de lo que la prosa del plan
describía.

**Lo que viví:** en `task-assignment`, T2 implementó la mitad
in-process del event pipeline (EventEmitter). La otra mitad (webhook
bridge descrito en `§Approach #2` del plan) no estaba ni wired ni
testeado. Tests verdes, casillas marcadas, `/verify` PASS — todo
mecánicamente correcto, todo a medias. `/spec-analyze` me obligó a
articular esa brecha y a registrar la decisión como CR-002 candidato.

**Por qué importa:** es el único comando que atrapa el modo-fallo más
sutil del protocolo: *understatement de scope en la descripción de
tareas*. La tarea dice "wire the webhook bridge"; el agente extiende el
helper y se olvida del wiring. Sin `/spec-analyze`, la feature se
shippa convencida de que está completa.

Está infravalorado porque no aparece en la "Default Flow" del README
— si no lo conoces, no lo ejecutas. Subirlo a la flow estándar (entre
`/spec-tasks` y `/verify`) sería el cambio de doc con mayor leverage
del protocolo.

---

## 2. Cosas que noté al usar (ni buenas ni malas, solo reales)

Observaciones desde dentro del protocolo. No son críticas — son la
experiencia.

### 2.1 Me pillé haciendo trampa, y *eso* es la evidencia

En `/spec-tasks` batché T2 + T3 en un solo paso (eran extensiones
triviales del mismo helper) en lugar de hacer red→green por separado. La
regla "one task at a time, never batch" lo prohíbe.

Lo importante: **noté que estaba haciendo trampa mientras lo hacía**. Sin
la regla, no habría sentido la diferencia. Esa es la evidencia más
fuerte de que el protocolo cambia el modo de pensar del agente — incluso
cuando lo desobedece, el agente *sabe* que lo está desobedeciendo.

### 2.2 El protocolo cambia *qué pregunto*, no solo *cuándo*

`/spec-plan` me hizo escribir Abort Criteria. Sin esa sección, jamás
habría volunteered "¿bajo qué condición tengo que parar y re-planear?".
La pregunta nunca se me ocurre orgánicamente — siempre estoy en modo
"cómo seguir adelante".

Lo mismo con `/assume`. Sin el comando, las assumptions se quedan
implícitas en mi cabeza. Con el comando, se vuelven falsifiables.

### 2.3 El cost ratio es desigual y eso es correcto

Para una feature de 3 tareas + ~80 LoC produje **11 artefactos** en
`specs/task-assignment/`. Eso es mucho.

Pero cada artefacto pagó:
- El research no existiría sin `/research`
- El GAP-001 no existiría sin `/impl-gap`
- El CR-001 con audit trail no existiría sin `/spec-amend`
- La cobertura parcial del webhook no se habría detectado sin `/spec-analyze`
- Las decisiones non-goals + abort criteria no se habrían articulado sin el plan template

Para un `/bugfix` directo el ratio sería 1 test + 1 diff. **El protocolo
es smart sobre escalar por tamaño** — la "Default Flow" del README ya lo
codifica. Solo conviene decirlo más fuerte en el pitch: para código
throwaway el protocolo es overkill, *y eso está bien*.

### 2.4 `/spec-analyze` me salvó

Pensaba que T2 satisfacía G2 entero. `/spec-analyze` cruzó plan-prose
contra código y me hizo articular que había implementado solo la mitad
in-process del event pipeline — el webhook descrito en `§Approach #2`
del plan no estaba ni wired ni testeado.

**El test suite no lo habría visto** (los tests pasan porque solo
testean lo implementado). El `/verify` mecánico tampoco (todas las casillas
estaban marcadas). Solo la cross-comparación plan↔código surfaceó la
brecha.

### 2.5 Los dos GAPs reales aparecieron mid-implementación, no al planear

GAP-001 (`null → null` no-op) lo noté *mientras escribía el test*
para "same person = no-op", no mientras escribía el plan. Si hubiera
escrito código antes que test, habría shipped la interpretación más
agresiva sin pestañear.

Test-first + "stop and log on ambiguity" → los dos juntos atrapan
ambigüedades que el plan no anticipa. Por separado, ninguno lo hace.

### 2.6 La opinionación es el valor — no la suavices

Las 12 secciones obligatorias del plan se sintieron ceremoniales para
una feature de 3 tareas. **Hasta que noté que cada una me forzó algo
concreto:**
- "What This Plan Does NOT Do" → atrapé scope creep antes de empezar
- "Tradeoffs" → tuve que articular qué sacrificaba el fire-and-forget
- "Abort Criteria" → ya mencionada
- "Risks & Open Questions" → me hizo escribir ReDoS / network-stall

Si quitas alguna, *parecen* iguales. Si quitas alguna, *no* lo son.

### 2.7 La protección del "no improviso" es **mental**, no mecánica

Nada en el código del CLI te impide que un agente improvise una
interpretación en lugar de loguear un `/impl-gap`. La protección está
en que el agente leyó workflow.md y obedece.

Esto es una decisión consciente del diseño ("descriptive, not
enforcing"), y es coherente con "the human decides". Pero **conviene
decirlo en el marketing**: el valor del protocolo está en los artefactos
que produce, no en enforcement mecánico. Una vez dicho, todo el resto
del pitch se vuelve coherente.

### 2.8 `/finish` formal es ruidoso para cambios pequeños y eso está bien

Para una feature multi-commit (mi sandbox tenía 4 commits propuestos
naturales), el split-into-multiple-commits + formato estricto fue exact-
amente lo que quería leer. Para un typo o un comment fix, sería
overkill.

El protocolo no se queja. Si tu cambio es pequeño, el `/finish` produce
1 commit con bullets cortos. Si es grande, produce N commits cada uno
con bullets ricos. El formato escala con el tamaño automáticamente.

### 2.9 El `(default if unanswered: X)` en non-blocking questions es elegante

`/spec-clarify` permite preguntas blocking *y* non-blocking. Las
blocking paran el flow. Las non-blocking traen su propio default
documentado: si nadie las responde, `/spec-plan` procede con la decisión
explícita.

**Por qué es elegante:** atrapa una asimetría real. Algunas preguntas
*deben* tener input humano; otras solo *deberían*. Bloquear todo es
fricción innecesaria; no bloquear nada es lo que rompe los proyectos
hoy. El protocolo distingue ambas y deja el default escrito en el
spec mismo — no se pierde nunca.

Yo lo usé para "¿debería `domain` matching ser case-insensitive?" con
default "case-sensitive". Si nadie hubiera respondido, el plan habría
escogido el default *con cita al spec*, no a una vibe del agente.

### 2.10 Escribir el plan *surface unknowns* que no existían antes

Antes de `/spec-plan`, sabía "necesito un EventEmitter". Mientras escribía
§Risks & Open Questions, salió de la nada "¿qué pasa si la URL del
webhook apunta al propio servidor → loop?". Yo no había pensado eso. La
sección me lo extrajo.

Es el mismo efecto que rubber-ducking. Pero estructurado y persistente —
el rubber duck normal se olvida. El plan se queda en el repo.

---

## 3. Cosas malas

Problemas reales. Para los detalles full con repros, ver [QA_REPORT.md
§3](QA_REPORT.md). Aquí los resumo con la perspectiva de impacto.

### 3.1 B-02 — `doctor` nunca devuelve exit != 0 (CRÍTICO)

`src/commands/doctor.ts:43` declara `const issues: string[] = []` pero
nada le hace push nunca. Solo `warnings` se llena. Resultado: una
instalación rota (sin `conventions.md`, sin `workflow.md`) → `doctor`
imprime `warn` y sale con 0.

**Por qué es la peor:** el producto se posiciona alrededor de "gates
verificables en CI". `doctor` es el comando designado para ser ese gate
en CI. Y nunca falla. Cualquier equipo que lo añada a CI tendrá un
no-op silencioso.

### 3.2 B-03 — `status` mis-reporta verifies como failed

Regex `/\bFAIL\b/i` matchea cualquier `fail` en `verify-report.md`,
incluido `fail 0` del resumen de `npm test`. Resultado: un verify
report con conclusión `PASS` se reporta como `verify failed`.

**Por qué duele:** rompe el storyline CLI↔agente. El acoplamiento por
`status` es uno de los puntos más elegantes del diseño, y este bug lo
hace mentir.

Fix sencillo: anclar el match a la sección `## Conclusion`.

### 3.3 B-04 — `commands` description engaña

`src/cli.ts:53`: *"List agent commands installed by provider
integrations"*. La implementación lista 20 nombres hardcoded — no
inspecciona `cwd`, no mira `.sdd/`, no sabe qué está instalado.

Pequeño pero notable porque es discrepancia de propósito, no bug.

### 3.4 B-01 — `npm run build` falla en Windows

`chmod +x dist/cli.js` no existe en Windows. tsup compila bien, el
script devuelve 1. Solo afecta contributors en Windows (los usuarios
finales tiran de `npx`), pero CI en Windows fallaría.

### 3.5 B-05 — `add domain` con lista cerrada de 4

`add domain notifications`, `add domain tasks`, `add domain users` →
todos rechazados. Solo `auth/payments/storage/email` son válidos. La
README *implica* extensibilidad sin decirla explícitamente cerrada.

### 3.6 P-01 — `/spec-conflicts` incluye specs done-pero-no-movidos

`tasks-search` con verify PASS apareció en la tabla de overlap porque
no estaba todavía en `_done/`. Ruido. Filtrar por "spec con tasks
incompletas" lo arreglaría.

### 3.7 P-02 — `/assume` no dice dónde aterrizan las assumptions confirmadas

Lo natural es `2-plan.md §Assumptions`. Lo hice así por default
razonable, pero el protocolo no lo prescribe. Una línea de fix.

### 3.8 `/spec-analyze` ausente de la Default Flow del README

Me salvó la cobertura del webhook. Si no lo hubiera ejecutado por mi
cuenta (no estaba en la secuencia de la "Default Flow" del README), la
feature se habría shipped con un G2 a medias y nadie lo habría notado
hasta que un embedder pidiera el webhook.

### 3.9 No hay trigger automático para `/impl-gap`

Depende 100% de que el agente note la ambigüedad. Un agente menos
careful (o bajo presión de "just ship it") improvisa una
interpretación. No hay forma mecánica de pillarlo después.

Este es el principal ataque vector del protocolo: la disciplina depende
de la atención. Worth pairing con `/review` notas que flagueen "¿hay
puntos donde `/impl-gap` debería haber disparado y no lo hizo?".

### 3.10 El protocolo es descriptivo, no enforcing — y nunca lo dice

Nada en la CLI ni en los templates dice "este protocolo no enforcea,
solo describe". Es coherente con el resto del diseño, pero un usuario
nuevo asume que si le pide al agente `/impl-gap`, el CLI lo verifica.
No es así. Solo el agente verifica.

Decirlo explícito en el pitch convierte una posible confusión en una
elección de diseño consciente.

### 3.11 `/research` no tiene STOP gate después del artifact

`/research` produce `research-<topic>.md` con recomendación no-binding.
Y luego… nada. El template dice "the artifact is exploratory;
/spec-plan decides what gets adopted". Pero el agente puede leer eso
como "research listo → procedo a plan" sin pausa para discusión humana.

**Lo que viví:** escribí `research-notification-delivery.md`, marqué
recomendación A+B, y procedí a `/spec-clarify` sin parar. Funcionó
porque también yo era el "usuario". En sesión real, el humano puede no
haber leído el research artifact antes de que el plan ya lo asuma.

**Fix corto:** añadir a `/research` un ⛔ STOP explícito tras escribir
el artifact: *"present the recommendation to the user before any
/spec-plan invocation references it"*.

### 3.12 `/refactor` sin tests = sin gate

`/refactor` regla #1: "establish a green baseline". Pero si no hay tests
(common en proyectos jóvenes, prototipos, scripts), no hay baseline. El
template no dice qué hacer. Un agente puede leer "no tests → no
baseline → no gate → procedo libremente". Eso es exactamente el
escenario que `/refactor` quiere prevenir.

**Fix corto:** añadir: *"if no tests exist for the target code, STOP
and either (a) write characterisation tests first as a separate task,
or (b) escalate to /spec-new with regression tests as goal"*.

### 3.13 No hay versionado del protocolo

Si `workflow.md` evoluciona entre `init` v0.10 y `update` v0.11 (cambia
una regla de `/spec-tasks`, p.ej.), los specs ya escritos referencian
una versión que ya no es la actual. `/verify` sigue corriendo. Ningún
warning.

**Por qué importa:** los specs son artefactos persistentes. Su validez
depende del protocolo en el que se redactaron. Sin versionado, "el
protocolo cambió y mi spec ya no es coherente" es invisible.

**Fix:** stamp de versión en cada spec al `/spec-new` (`Protocol
version: 0.10.0` en `1-requirements.md` header). `doctor` flaguea
specs de versiones anteriores cuando hay un update activo.

### 3.14 `/conventions-sync` no flagea drift manual-vs-código

El template tiene secciones `<!-- manual -->` que `/conventions-sync` no
toca. Eso está bien — preserva la prosa humana. Pero si la sección
manual *contradice* el código (mi caso: `Task` shape en Domain
Glossary marcado manual sin `assignee`, mientras el código sí lo
tenía), el sync no lo nota.

**Por qué importa:** la convención queda mintiendo silenciosamente.
Un agente que lea `conventions.md` para entender el shape obtiene info
falsa.

**Fix corto:** `/conventions-sync` añade una sección "Manual sections
that may be stale" al final de la presentación pre-aprobación, con
heurística simple ("Domain Glossary menciona `Task` pero el shape en
`store.js` no coincide").

### 3.15 `/finish` hardcoded a git

`templates/claude-commands/finish.md` y `workflow.md §/finish` asumen
`git status`, `git diff`, `git add`. Para proyectos en Mercurial,
Fossil, Pijul, jj — fallaría. El conventional-commit format es
VCS-agnóstico, pero los pasos no.

**Fix corto:** dos opciones — (a) re-frasear los pasos como "VCS
status / diff / stage" abstractamente y dejar al agente mapear al VCS
concreto, o (b) declarar git-only explícitamente en el README. La (a)
es más limpia.

### 3.16 No hay mecanismo para abandonar un spec

Un spec puede empezarse y *no* terminarse — el equipo cambia de
prioridad. ¿Qué hacer? Las opciones reales:
- Borrar el dir (pierde historia)
- Mover a `_done/` (miente — no se completó)
- Dejar como "active" para siempre (`/spec-status` lo seguirá listando)

El protocolo solo prescribe `_done/` para shipped specs. No hay
`_abandoned/` o equivalente, ni una entrada en `verify-report.md`
diciendo "spec descartado el YYYY-MM-DD por razón Z". El concepto de
"spec abandonado con audit trail" no existe.

---

## 4. Mejoras (en orden de prioridad)

### 4.1 Antes de la próxima release

1. **Fix B-02 (`doctor` exit code).** Promote core-files-missing y
   provider-totally-missing a `issues`. Es un 3-line fix en
   `src/commands/doctor.ts`. Sin esto, una de las dos promesas centrales
   del producto (CI gates) está rota.

2. **Fix B-03 (`status` FAIL regex).** Anclar a `## Conclusion`. Sin
   esto, el acoplamiento CLI↔agente miente. 5 líneas en
   `src/commands/status.ts:80`.

3. **Fix B-01 (`build` chmod en Windows).** Quitar el `chmod` o usar
   un node script cross-platform. Una línea en `package.json:30`.

### 4.2 Documentación (afecta más de lo que parece)

4. **Surface `/spec-analyze` en la Default Flow table del README.**
   Hoy no aparece. Es el comando que pilla coverage gaps que `/verify`
   no ve. Una fila más en la tabla.

5. **Añadir un párrafo: "el protocolo cambia comportamiento, no lo
   enforcea".** En la sección "Why this exists" del README. Una vez
   dicho, todo lo demás encaja.

6. **Documentar el cost-vs-value scaling explícito.** "Para
   código throwaway, `/bugfix` directo. Para código que otros tocarán,
   el flow completo paga." Hoy se infiere de la tabla "Default Flow"
   pero conviene decirlo.

7. **Resolver B-04: o renombrar `commands` description, o hacer que
   inspeccione cwd.** Decidir cuál es el comportamiento intended.

8. **Document el comportamiento sin TTY de `init`.** Hoy instala los 7
   providers silenciosamente si stdin no es TTY. Es razonable como
   default, pero invisible.

### 4.3 Refinamientos al protocolo (templates/workflow.md)

9. **P-01 fix:** `/spec-conflicts` excluye specs con todas las tasks
   `[x]` (proxy para "done but not moved").

10. **P-02 fix:** `/assume` añade una línea: *"confirmed assumptions
    land in `2-plan.md §Assumptions`; mid-execution use `/spec-amend` to
    update"*.

11. **`/scan` scope hint.** Mencionar el `$ARGUMENTS` sub-path que ya
    soporta el template. Hoy `workflow.md` no lo menciona.

12. **`/ask` → `/research` escalation hint.** Una línea: *"if /ask
    reveals decisions that need an artifact, escalate to /research"*.

13. **`/spec-analyze` puede añadir un 4º bucket:**
    *"implementation alignment with the plan's Approach prose, not
    just Components Affected"*. Es donde encontré mi gap.

14. **STOP gate explícito en `/research`** después de escribir el
    artifact. Una línea: *"present the recommendation to the user
    before any /spec-plan references it"*.

15. **`/refactor` sin tests existentes:** *"if no tests exist for the
    target code, STOP and either write characterisation tests as a
    separate task, or escalate to /spec-new"*.

16. **`/conventions-sync` añade sección "Manual sections that may be
    stale"** en la presentación pre-aprobación, con heurística simple
    de drift contra el código.

17. **Mecanismo de "abandonar spec":** convención de
    `specs/_abandoned/<name>/` (o nota en el verify-report final) con
    fecha + razón. Hoy no hay forma documentada de cerrar un spec
    que el equipo decide no terminar.

### 4.4 Features que evaluar (mediano plazo)

> Nota: la numeración salta a 18 — los items 14-17 acaban de añadirse
> en 4.3 arriba.

18. **`sddx-workflow diff <feature>`.** Compara los archivos cambiados
    (git) contra `Components Affected` del plan. Hoy el check
    `/verify` "no files modified outside Components Affected" depende
    de que el agente lo verifique a mano. Es la única tooling
    opportunity grande que vi.

19. **`sddx-workflow conventions-diff`.** Análogo: muestra qué
    cambiaría `/conventions-sync` antes de que el agente lo escriba.
    Hace el ⛔ STOP gate más concreto.

20. **`doctor --strict` o `--ci` mode.** Sale 1 con cualquier warning,
    además del fix de B-02. Para teams que quieren un gate más
    agresivo.

21. **`/review` template propone: "places where `/impl-gap` *should*
    have triggered".** Una sección con "¿hay decisiones que parecen
    arbitrarias en el código que merecerían un GAP retrospectivo?". No
    es bloqueante, pero da una segunda oportunidad de cazar el modo-
    fallo más sutil del protocolo.

22. **Versionado del protocolo.** Stamp de versión en specs al
    `/spec-new` (`Protocol version: 0.10.0` en header). `doctor`
    flaguea specs con versión diferente al protocolo instalado.
    Resuelve 3.13.

23. **VCS-abstraction en `/finish`.** Reformular los pasos como
    "VCS status / diff / stage" abstractos y mapear al VCS concreto en
    el agente, o declarar git-only explícito en el README. Resuelve 3.15.

24. **Linter de spec.** Un comando que verifica que los specs están
    bien formados: goal IDs presentes, scenarios con Given/When/Then,
    plan con todas las secciones obligatorias, etc. Sin esto, un spec
    mal-formado pasa silenciosamente todos los gates hasta que
    `/spec-analyze` falla con un mensaje cryptic.

### 4.5 Marketing / posicionamiento

25. **El feature destacado del protocolo es la columna Evidence de
    `/verify`.** Hoy está oculta en el template. Ponla en la primera
    pantalla del README, con un ejemplo concreto.

26. **El gate `[ ] ⛔ BLOCKING` merece un nombre.** "Blocking
    clarification gate" o algo. Es la mejor invención del protocolo y
    no tiene branding. Hace falta una etiqueta para citarlo.

27. **Un screencast o GIF de un `/spec-plan` parando por una blocking
    pregunta sin responder.** Vale más que cualquier paragraph.

---

## Net verdict

**Conceptualmente sólido. Bien pensado. Bien escrito. Bien acoplado al
agente y al CLI.** Los gaps de ejecución son pequeños (un par de bugs de
regex, un script con `chmod`) y se arreglan en una tarde.

La tesis ("agents fail because they don't know when to stop") **se sostiene
en práctica.** No es marketing — la sentí funcionando. Dos veces me pillé
"iba a improvisar y el protocolo me frenó", una vez tomé batched-tasks
cuando no debía y *me di cuenta por el protocolo*. Eso es comportamiento
medible cambiando.

Si tuviera que ordenar las palancas de mayor a menor impacto:

1. **Arreglar B-02 y B-03** → el storyline "CI-gatable" se vuelve verdad.
2. **Surface `/spec-analyze`** → un comando undervalued sube a la
   default flow.
3. **Decir "descriptive not enforcing"** → cierra el único agujero
   conceptual del pitch.

Con esos tres, el producto está completo.
