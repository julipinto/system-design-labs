/* Question bank for the Concurrency and Parallelism quiz (English).
   Types: choice (answer = index into options), order (options already in the right order; the quiz shuffles them),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-processos-threads-e-multithreading", name: "Introduction: processes, threads and multithreading" },
    t2: { topic: "aula-2-concorrencia", name: "Concurrency" },
    t3: { topic: "aula-3-paralelismo", name: "Parallelism" },
    t4: { topic: "aula-4-paralelismo-interno-e-externo", name: "Internal and external parallelism" },
    t5: { topic: "aula-5-concorrencia-vs-paralelismo", name: "Concurrency vs parallelism" },
    t6: { topic: "aula-6-problemas-classicos-deadlocks-starvation-e-race-conditions", name: "Classic problems: deadlock, starvation and race conditions" },
    t7: { topic: "aula-7-mutex", name: "Mutex" },
    t8: { topic: "aula-8-mutex-distribuido-locks-distribuidos", name: "Distributed mutex: distributed locks" },
    t9: { topic: "aula-9-spinlocks", name: "Spinlocks" },
    t10: { topic: "aula-10-semaforos-e-thread-pools", name: "Semaphores and thread pools" }
  };

  var out = [];
  function add(k, n, type, level, prompt, options, answer, explain) {
    var t = T[k];
    out.push({
      id: k + "-" + (n < 10 ? "0" : "") + n,
      topic: t.topic,
      group: t.group || t.topic,
      topicName: t.name,
      type: type,
      level: level,
      prompt: prompt,
      options: options,
      answer: answer,
      explain: explain
    });
  }
  function choice(k, n, level, prompt, options, answer, explain) { add(k, n, "choice", level, prompt, options, answer, explain); }
  function order(k, n, level, prompt, items, explain) { add(k, n, "order", level, prompt, items, null, explain); }
  function tf(k, n, level, prompt, answer, explain) { add(k, n, "truefalse", level, prompt, null, answer, explain); }


  /* ---------- 1. Introduction: processes, threads and multithreading ---------- */
  choice("t1", 1, 1, "What is the difference between a process and a thread?", [
    "The process runs in the kernel and the thread runs on the disk.",
    "Process and thread are the same name in different languages.",
    "The process is a running program with its own memory; threads live inside it and share that memory.",
    "The thread has its own memory and the process shares memory with the others."
  ], 2, "estoque-1 is a process, isolated from estoque-2. The threads (or goroutines) inside estoque-1 see the same memory.");
  choice("t1", 2, 1, "How much stack does a system thread reserve by default, and how much does a goroutine start with?", [
    "8 MB virtual (ulimit -s) against about 2 KB.",
    "2 KB against 8 MB.",
    "1 GB against 1 MB.",
    "Both start with 4 KB."
  ], 0, "That is why Go can have one goroutine per order without a second thought. The thread's 8 MB is virtual address space, not memory spent.");
  choice("t1", 3, 2, "The estoque service receives 200 orders at the same time. How much initial stack does each model reserve?", [
    "200 threads: 400 KB; 200 goroutines: 1.6 GB.",
    "Both options reserve 1.6 GB.",
    "Both options reserve 400 KB.",
    "200 threads: 1.6 GB (200 × 8 MB); 200 goroutines: 400 KB (200 × 2 KB)."
  ], 3, "The difference between 1.6 GB and 400 KB is what makes goroutines cheap. What fits the goroutines onto a few threads is the Go runtime.");
  tf("t1", 4, 2, "A panic without recover in a goroutine takes down only that goroutine, and the other 199 keep serving.", false,
    "Go terminates the entire program, with exit code 2. All goroutines and the orders in flight die: the failure boundary is the process.");
  choice("t1", 5, 3, "Which recover can actually help against the panic of a child goroutine?", [
    "A recover in main, which catches the panic of any goroutine.",
    "A recover in a defer inside the very goroutine that panicked.",
    "A recover in the neighboring pod.",
    "There is none: a panic cannot be handled in Go."
  ], 1, "recover only works in a defer of the same goroutine. That is why every goroutine the code starts needs its own.");

  /* ---------- 2. Concurrency ---------- */
  choice("t2", 1, 1, "A reservar order costs 2 ms of CPU and 18 ms waiting for the database. How many orders per second does estoque-1 serve one at a time?", [
    "500.",
    "100.",
    "50.",
    "20."
  ], 2, "20 ms per order: 1 s ÷ 20 ms = 50 per second. The CPU sits idle 18 of the 20 ms.");
  choice("t2", 2, 2, "With N orders in flight on estoque-1 (1 vCPU), what is the throughput?", [
    "N × 500 orders per second, no limit.",
    "min(N × 50, 500) orders per second.",
    "Always 50 orders per second.",
    "N ÷ 20 orders per second."
  ], 1, "Each order adds 50/s until the CPU fills up. The 500/s ceiling is 1 s ÷ 2 ms of CPU.");
  choice("t2", 3, 2, "With how many orders in flight is the estoque-1 CPU full?", [
    "2.",
    "5.",
    "10.",
    "100."
  ], 2, "10 × 50 = 500: each order uses the CPU 10% of the time (2 ms out of 20), and ten add up to 100%.");
  choice("t2", 4, 3, "The order starts spending 20 ms of CPU (instead of 2). What happens to the throughput ceiling?", [
    "It goes up to 5,000 per second.",
    "It stays at 500 per second.",
    "It drops to 50 per second, and more concurrency does not help.",
    "It drops to 5 per second."
  ], 2, "1 s ÷ 20 ms = 50/s. Concurrency only pays off for work that waits; when the bottleneck is the CPU, what's missing is a core.");
  tf("t2", 5, 2, "On a single core, concurrency runs two orders at the same instant.", false,
    "The core runs one at a time. Concurrency interleaves: while one order waits for the database, another uses the CPU.");

  /* ---------- 3. Parallelism ---------- */
  choice("t3", 1, 1, "The relatorios 23:00 close spends 40 s of CPU on one core and 2 s to sum and save. How long does it take sequentially?", [
    "40 s.",
    "42 s.",
    "20 s.",
    "12 s."
  ], 1, "40 s + 2 s = 42 s. In 4 slices of 100 thousand rows, 10 s + 2 s = 12 s.");
  choice("t3", 2, 2, "In 4 slices of 100 thousand rows, on 4 cores, the close takes 12 s. What is the speedup?", [
    "4×.",
    "3.5×.",
    "2×.",
    "10×."
  ], 1, "42 ÷ 12 = 3.5×. The 2 s of summing and saving do not split.");
  choice("t3", 3, 3, "Why is the speedup 3.5× and not 4×?", [
    "Because one core is kept in reserve.",
    "Because the network is slow.",
    "Because Go loses 12% on each slice.",
    "Because the serial part (2 s out of 42, or 4.8%) does not shrink with more cores: that is Amdahl's law."
  ], 3, "The formula is 1 ÷ (0.048 + 0.952 ÷ N). With 4 cores it gives 3.5; with 8, 6.0; the ceiling is 21×.");
  choice("t3", 4, 2, "By the same math, how much does the report speed up with 8 cores?", [
    "8×.",
    "7×.",
    "6.0×.",
    "3.5×."
  ], 2, "40 ÷ 8 = 5 s, plus 2 s serial = 7 s. 42 ÷ 7 = 6.0×, not 8×.");
  tf("t3", 5, 2, "The lab's parallel barbecue demonstrates CPU parallelism.", false,
    "The tasks use time.Sleep, which does not spend CPU. The same program would take the same 12 s on a single core: it is overlapping waits.");
  choice("t3", 6, 3, "On a 1 vCPU pod, on a 16-core node, what does runtime.NumCPU() return?", [
    "1, the pod's limit.",
    "16, the machine's CPUs.",
    "0.",
    "The number of active goroutines."
  ], 1, "NumCPU reads the machine's CPUs, not the container's limit. The default GOMAXPROCS started respecting the cgroup in Go 1.25, but NumCPU still returns 16.");

  /* ---------- 4. Internal and external parallelism ---------- */
  choice("t4", 1, 1, "Which of these is internal parallelism?", [
    "estoque-1 and estoque-2 behind the load balancer.",
    "Two consumers of a queue on different machines.",
    "The 4 slices of relatorios running on 4 threads of the same pod.",
    "A CronJob that triggers a Job."
  ], 2, "Internal is parallelism inside a process, created by the code, with threads that share memory.");
  choice("t4", 2, 1, "What characterizes external parallelism?", [
    "Threads that share the same memory.",
    "Processes, pods or machines, each with its own memory, created by the infrastructure.",
    "One goroutine per order.",
    "A single thread and many cores."
  ], 1, "estoque-1 and estoque-2 are two processes in two pods, with two memories.");
  choice("t4", 3, 3, "relatorios gets a second replica and the scheduler runs on both at 23:00. What happens?", [
    "The close runs twice and the day's summary is saved twice.",
    "Kubernetes cancels one of the runs on its own.",
    "The close becomes 2× faster and correct.",
    "The database refuses the second write by default."
  ], 0, "Coordination between processes was missing. Each replica does the right thing; together, they duplicate the day's revenue.");
  tf("t4", 4, 2, "An in-memory sync.Mutex, on each replica, prevents the duplicated close between the two replicas.", false,
    "Each replica has its own mutex, in its own memory. Between processes you need a lock that both can see, like the one in Redis.");

  /* ---------- 5. Concurrency vs parallelism ---------- */
  choice("t5", 1, 1, "What is the difference between concurrency and parallelism, according to Rob Pike?", [
    "Concurrency is execution and parallelism is structure.",
    "Concurrency is structure (splitting the problem into independent parts) and parallelism is execution (running parts at the same time).",
    "They are the same thing with different names.",
    "Parallelism only exists in Go."
  ], 1, "You can have one without the other: a well-structured program runs interleaved on 1 core and in parallel on 4.");
  choice("t5", 2, 2, "What does estoque-1, with 1 vCPU and many orders, have?", [
    "Parallelism, without concurrency.",
    "Concurrency and parallelism.",
    "Neither.",
    "Concurrency, without parallelism."
  ], 3, "There are several independent parts (the orders), but only one core. relatorios, with 4 slices on 4 vCPU, has both.");
  tf("t5", 3, 3, "All parallelism involves concurrency.", false,
    "A SIMD instruction does the same calculation on several pieces of data at the same time, in a single flow: there is parallelism, without independent parts interleaved.");
  choice("t5", 4, 3, "Someone starts 4 calculation threads (10 s of CPU each) on a 1 vCPU pod. How long does it take?", [
    "10 s.",
    "20 s.",
    "About 40 s, or more, because of the context switches.",
    "2.5 s."
  ], 2, "There are not 4 cores, only 1: 4 × 10 s = 40 s of CPU. More threads than cores do not speed up calculation.");
  choice("t5", 5, 2, "How do you know whether the problem calls for concurrency or parallelism?", [
    "If the order waits more than it calculates, concurrency; if it calculates all the time, parallelism.",
    "Always both together.",
    "It depends only on the chosen language.",
    "If the order is fast, parallelism; if it is slow, concurrency."
  ], 0, "estoque spends 18 of 20 ms waiting; relatorios spends almost everything on CPU.");

  /* ---------- 6. Classic problems ---------- */
  order("t6", 1, 2, "Put Bia and Caio's race for the last cat in order.", [
    "Bia reads quantidade = 1 (SELECT, t = 0)",
    "Caio reads quantidade = 1, because Bia's UPDATE has not committed yet (t = 2)",
    "Bia's UPDATE commits: quantidade = 0 (t = 4)",
    "Caio's UPDATE commits: quantidade = −1 (t = 6)"
  ], "Both read 1 before any decrement. The window is the one between checking and decrementing: 2 ms.");
  choice("t6", 2, 1, "What is the name of the defect in which the decision rests on a read that may have gone stale?", [
    "Deadlock.",
    "Check-then-act (a race condition).",
    "Starvation.",
    "Fencing."
  ], 1, "Checking and decrementing are two steps, and the world changes between them.");
  choice("t6", 3, 2, "Of the 6 possible orders of 2 steps (check and decrement) each, how many leave the stock at −1?", [
    "6.",
    "2.",
    "3.",
    "4."
  ], 3, "Only the 2 in which one whole order finishes before the other starts (B1 B2 C1 C2 and C1 C2 B1 B2) work out.");
  choice("t6", 4, 1, "What are the 4 Coffman conditions for a deadlock?", [
    "Mutual exclusion, hold and wait, no preemption and circular wait.",
    "Read, write, commit and rollback.",
    "Atomicity, consistency, isolation and durability.",
    "Starvation, timeout, retry and fallback."
  ], 0, "All four must hold together. Removing any one undoes the deadlock.");
  choice("t6", 5, 3, "reservar locks estoque and then pedido; cancelar locks pedido and then estoque. After the client's 2 s timeout, what keeps happening?", [
    "The two goroutines stay stuck holding the locks, and every future reservation of the cat hangs.",
    "Go releases the locks on its own.",
    "Only Bia's reservation fails, and the rest goes on as normal.",
    "The client retries and the deadlock goes away."
  ], 0, "The timeout answers the client, but does not release the locks. The fix is a global lock order, a TryLock with a time limit or a single lock.");
  choice("t6", 6, 2, "How does PostgreSQL treat two processes in a deadlock?", [
    "Lets both wait forever.",
    "Restarts the server.",
    "After deadlock_timeout (1 s by default), it aborts one transaction with 'deadlock detected' (40P01) and the other goes on.",
    "Runs both at the same time."
  ], 2, "The detector looks for the cycle, aborts one of the transactions and lets the other continue.");
  choice("t6", 7, 2, "marketplace-xyz calls reservar in a loop, with no pause. Caio tries to grab the lock every 50 ms, always finds it taken and gives up at 10 s. What is this called?", [
    "Deadlock.",
    "Race condition.",
    "Starvation.",
    "Fencing."
  ], 2, "Nobody is locked: he just is never served, because the lock has no queue. sync.Mutex avoids this with starvation mode, from 1 ms of waiting.");
  choice("t6", 8, 3, "PedidoPago (version 2) arrived before PagamentoPendente (version 1) for order 1049. What does UPDATE ... SET status = 'aguardando_pagamento', event_version = 1 WHERE id = 1049 AND event_version < 1 do?", [
    "Updates 1 row and the order goes back to awaiting.",
    "Updates 0 rows: the stored version (2) is not less than 1, and the old event is ignored.",
    "Deletes the order.",
    "Deadlocks with the version 2 event."
  ], 1, "The version guard keeps the order from regressing from paid to awaiting.");
  tf("t6", 9, 3, "The article's example with event_version < N is a real last-write-wins.", false,
    "It is a monotonic version guard. Real LWW decides by the clock timestamp and loses writes when clocks diverge.");

  /* ---------- 7. Mutex ---------- */
  choice("t7", 1, 1, "What does a mutex guarantee?", [
    "That several goroutines enter the critical section together.",
    "That only one goroutine at a time enters the critical section.",
    "That the goroutine runs faster.",
    "That the database accepts more connections."
  ], 1, "Lock before reading and decrementing, Unlock after. The others wait.");
  choice("t7", 2, 2, "With the mutex, Caio arrives at t = 2 and Bia leaves at t = 4. What happens to him?", [
    "Buys the cat and the stock goes to −1.",
    "Waits 2 ms, reads 0 at t = 6 and gets 409 out of stock.",
    "Gets 409 immediately, at t = 2.",
    "Waits forever."
  ], 1, "The 409 comes out 4 ms after he arrives. The 2 ms window was closed.");
  choice("t7", 3, 2, "With a 4 ms critical section (SELECT and UPDATE), what is the maximum number of reservations per second of the same SKU on one replica?", [
    "500.",
    "166.",
    "250.",
    "50."
  ], 2, "1 s ÷ 4 ms = 250. Shrinking the section raises the ceiling.");
  choice("t7", 4, 3, "The Unlock was written only at the end of the function, and the if q < 1 { return ErrSemEstoque } comes before it. What happens when Caio gets the 409?", [
    "The lock is released on its own when leaving the function.",
    "The lock stays stuck, and every future reservation of the cat waits forever.",
    "Go warns with a compile error.",
    "Only Caio is left without an answer."
  ], 1, "That is why defer mu.Unlock() comes right after the Lock.");
  choice("t7", 5, 3, "The lab's mutex/main.go sleeps 100 ms with the mutex locked. How long do 100 items take?", [
    "About 100 ms.",
    "10 s, because they run in series.",
    "1 s.",
    "100 s."
  ], 1, "100 × 100 ms = 10 s. With the Sleep outside the lock, it would drop to about 100 ms. Lock only what you need.");
  choice("t7", 6, 2, "UPDATE estoque SET quantidade = quantidade - 1 WHERE sku = 'GATO-042' AND quantidade > 0 solves the race in which way?", [
    "Pessimistic lock, locking the row before reading.",
    "Optimistic lock: it acts and checks at the end. Bia affects 1 row, Caio 0 rows and gets 409.",
    "With an in-memory mutex.",
    "With a fencing token."
  ], 1, "With no in-memory lock and no Redis, it works with any number of replicas.");
  tf("t7", 7, 3, "In Go, sync.Mutex prevents one goroutine from unlocking another's lock.", false,
    "The documentation says it is allowed. The rule that whoever locks unlocks is code discipline, not something the language enforces.");

  /* ---------- 8. Distributed mutex ---------- */
  choice("t8", 1, 2, "With 2 replicas, why is sync.Mutex not enough for the last cat?", [
    "Because sync.Mutex only works with one goroutine.",
    "Because each replica has its own mutex, in different memories: both read 1 and the stock goes to −1.",
    "Because Redis is faster.",
    "Because PostgreSQL ignores the mutex."
  ], 1, "The local mutex only protects inside the process.");
  choice("t8", 2, 1, "What does SET lock:estoque:GATO-042 <token> NX PX 5000 do?", [
    "Creates the key only if it does not exist and already with a 5 s TTL, in one atomic command.",
    "Deletes the key after 5 s, always.",
    "Reads the key and recreates it.",
    "Creates the key 5 times."
  ], 0, "NX creates only if it does not exist; PX 5000 gives the TTL. Since it is a single command, two requests do not get through together.");
  choice("t8", 3, 2, "The lock cycle in Redis is 6 ms (1 for SET + 4 of work + 1 for DEL). What is the maximum per SKU?", [
    "250 reservations per second.",
    "500 reservations per second.",
    "166 reservations per second.",
    "60 reservations per second."
  ], 2, "1 s ÷ 6 ms ≈ 166, less than the 250 of the local mutex: the round trip to Redis has a cost.");
  order("t8", 4, 3, "Put the Redis lock between Bia and Caio in order, with Caio trying every 50 ms.", [
    "Bia: SET NX → OK (t = 1 ms)",
    "Caio: SET NX → nil, the key exists (t = 3 ms)",
    "Bia releases the lock (t = 6 ms)",
    "Caio tries again and takes the lock (t = 53 ms)",
    "Caio reads 0 and gets 409 (t ≈ 56 ms)"
  ], "Caio is not served right away: he waits for the next attempt, 50 ms after the previous one.");
  choice("t8", 5, 3, "Bia takes the lock (TTL 5 s) and pauses for 6 s before the UPDATE. Caio takes the lock after the expiry and buys. What happens when Bia wakes up?", [
    "The database finds out the lock had expired and cancels the UPDATE.",
    "She notices she lost the lock and stops.",
    "Her UPDATE takes the stock to −1: she still thinks she has the lock.",
    "Redis gives the lock back to her."
  ], 2, "The lock expired at 5.001 s and Caio took it at 5.003 s. Without fencing or a check in the database, the −1 goes through.");
  choice("t8", 6, 2, "How does the fencing token stop Bia's late UPDATE?", [
    "The lock service returns an increasing number (33 for Bia, 34 for Caio), and the database refuses a write with a number lower than the highest already seen.",
    "Redis deletes Bia's UPDATE.",
    "The TTL is raised to 10 s.",
    "Bia gets a new token with the same number."
  ], 0, "Bia's UPDATE arrives with 33 and the database has already seen 34.");
  choice("t8", 7, 3, "Which of the remedies for the expired TTL does not depend on any clock?", [
    "Raising the TTL.",
    "The token per owner with compare-and-delete.",
    "The UPDATE ... AND quantidade > 0, in which the database decides.",
    "Restarting the replica."
  ], 2, "The database decides, at the moment of the write. For the last cat, it solves it without a distributed lock.");
  choice("t8", 8, 2, "According to Kleppmann, what is the difference between an efficiency lock and a correctness lock?", [
    "Efficiency is ZooKeeper's and correctness is Redis's.",
    "Efficiency avoids repeated work (failing costs little); correctness protects the data (failing sells the cat twice and demands fencing or a check in the database).",
    "There is no difference.",
    "Efficiency uses a TTL and correctness does not."
  ], 1, "A simple Redis serves the first. The second needs more than the lock.");
  tf("t8", 9, 3, "Redis's SET NX delivers a fencing token, like ZooKeeper.", false,
    "ZooKeeper gives an increasing number (sequence or zxid). Redis's SET NX only says whether it created the key or not: it generates no number.");
  choice("t8", 10, 2, "In ZooKeeper's official recipe, how is the lock kept?", [
    "With a fixed, permanent node.",
    "With ephemeral and sequential nodes: the lowest number holds the lock and the others watch only the previous one.",
    "With a Lua script.",
    "With a file on disk."
  ], 1, "It is a fair queue, without the herd of everyone waking up when the lock is released.");

  /* ---------- 9. Spinlocks ---------- */
  choice("t9", 1, 1, "What does the spinlock do instead of sleeping?", [
    "Creates a new goroutine.",
    "Spins in a loop, repeating a compare-and-swap until it gets the lock.",
    "Asks Redis for the lock.",
    "Raises the TTL."
  ], 1, "The atomic operation compares and swaps in a single step: nobody gets in between the two.");
  choice("t9", 2, 2, "When does a spinlock pay off?", [
    "When the critical section is longer than one second.",
    "When there is a database call inside the lock.",
    "When the critical section is smaller than the cost of sleeping and waking up, like incrementing a counter (about 20 ns).",
    "Always."
  ], 2, "Spinning for a moment is cheaper than sleeping. For milliseconds, it burns CPU for nothing.");
  choice("t9", 3, 3, "A spinlock covers 5 ms of database on an 8-core node: 1 goroutine holds it and 7 spin. How much of the node's CPU burns waiting?", [
    "12.5%.",
    "50%.",
    "100%.",
    "87.5%."
  ], 3, "7 of 8 cores: 87.5%. On a 1 vCPU pod it is worse: whoever spins occupies the only core.");
  tf("t9", 4, 2, "The lab's spinlock is a pure spinlock.", false,
    "The loop calls runtime.Gosched() on every turn, yielding. It is more of a yielding lock, and the Gosched is not in Unlock, as the comment says.");

  /* ---------- 10. Semaphores and thread pools ---------- */
  choice("t10", 1, 1, "What is a counting semaphore?", [
    "A lock with N slots: whoever arrives when all are taken waits for one to be released.",
    "A mutex with an owner.",
    "A counter of requests per minute.",
    "A message queue."
  ], 0, "estoque's pool of 10 connections is a 10-slot semaphore in front of PostgreSQL.");
  choice("t10", 2, 2, "By Little's law, how many connections does the load ask for with 500 orders per second and 20 ms per query?", [
    "100.",
    "1.",
    "50.",
    "10."
  ], 3, "Connections = throughput × time = 500/s × 0.020 s = 10.");
  choice("t10", 3, 3, "200 simultaneous orders, a pool of 10 and 20 ms per query. When does the last one finish?", [
    "20 ms.",
    "400 ms, in the 20th batch (20 × 20 ms).",
    "200 ms.",
    "4 s."
  ], 1, "The average is 210 ms and the throughput is 500/s. Without a pool, 200 connections would go past the limit of 100.");
  choice("t10", 4, 3, "Autoscaling takes estoque to 12 replicas, each with a pool of 10. What is the problem?", [
    "Each replica gets too slow.",
    "12 × 10 = 120 connections go past the max_connections of 100: the database refuses with 'too many clients already'.",
    "The pool stops working.",
    "None: the database accepts unlimited connections."
  ], 1, "Scaling replicas has a ceiling at the database. Remedies: PgBouncer, 12 × 8 = 96 per replica or raising max_connections.");
  choice("t10", 5, 2, "What is the difference between a semaphore and a worker pool?", [
    "They are the same mechanism.",
    "The semaphore limits how many executions run at the same time (one goroutine per task); the worker pool has a fixed number of workers reading from a queue.",
    "The worker pool only exists in Java.",
    "The semaphore only applies to the database."
  ], 1, "The lab creates one goroutine per task and only limits how many run: it is a semaphore, not a worker pool.");
  choice("t10", 6, 2, "What is the difference between a mutex and a binary semaphore?", [
    "The mutex has 2 slots.",
    "The mutex has an owner (whoever locked unlocks); the binary semaphore has no owner.",
    "The binary semaphore is faster.",
    "None."
  ], 1, "The difference is not the count, it is ownership.");
  choice("t10", 7, 3, "In the semaphore lab (capacity 3, 10 foods, 2 s each), how long does it all take?", [
    "2 s.",
    "20 s.",
    "6 s.",
    "8 s: ⌈10 ÷ 3⌉ = 4 waves of 2 s."
  ], 3, "They go out 3, 3, 3 and 1: four waves of 2 s, and the article's log matches that.");

  window.QUIZ = out;
})();
