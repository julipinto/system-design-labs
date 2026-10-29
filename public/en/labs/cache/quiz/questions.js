/* Question bank for the Caching Strategies quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-ao-cache", name: "Introduction to caching" },
    t2: { topic: "aula-2-consistencia-e-ttl", name: "Consistency and TTL" },
    t3: { topic: "aula-3-eviccao-e-invalidacao", name: "Eviction and invalidation" },
    t4: { topic: "aula-4-hit-miss-e-hit-rate", name: "Hit, miss and hit rate" },
    t5: { topic: "aula-5-memoria-e-distribuido", name: "Memory and distributed" },
    t6: { topic: "aula-6-cache-aside-write-through-write-behind-e-cdn", name: "Cache-aside, write-through, write-behind and CDN" },
    t7: { topic: "aula-7-criando-uma-cdn", name: "Building a CDN" }
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

  /* ---------- 1. Introduction to caching ---------- */
  choice("t1", 1, 1, "What is a cache, in one sentence?", [
    "A database that doesn't need a disk.",
    "A copy of the data kept somewhere faster or closer to whoever asks.",
    "A program that deletes old data from the database.",
    "A type of index that only exists in Redis."
  ], 1, "Cache is the idea of keeping a copy nearby. Redis, CDN and hashmap only implement it.");
  tf("t1", 2, 1, "Cache and Redis are the same thing.", false,
    "Redis is one way to have a cache. An in-memory map inside the program, or a CDN, are also caches.");
  choice("t1", 3, 2, "In the store example, the database reads produto:42 in 40 ms and Redis in 1 ms. How many times faster is Redis?", [
    "4 times.",
    "10 times.",
    "40 times.",
    "400 times."
  ], 2, "40 ms ÷ 1 ms = 40. The hashmap in the app's memory, at 0.05 ms, is 800 times faster than the database.");
  choice("t1", 4, 2, "Why does a cache work if it only holds part of the data?", [
    "Because a few items are requested many times, and what was read just now tends to be read again (locality).",
    "Because the cache is always bigger than the database.",
    "Because the database deletes what the cache doesn't have.",
    "Because every request writes the whole store into memory."
  ], 0, "That's locality: product 42 is requested thousands of times and most other products almost never.");
  order("t1", 5, 2, "Put in order the path of the first request for produto:42 in a cache-aside, and of the second.", [
    "The app asks the cache and gets a miss",
    "The app reads the database (40 ms)",
    "The app stores the copy in the cache with a 60 s TTL and answers",
    "On the next request, the cache answers in 1 ms (hit)"
  ], "First the cache, then the database only on a miss, and the copy is stored before answering, so the next request is a hit.");
  choice("t1", 6, 3, "Which of these benefits least from a cache?", [
    "The plush cat page, read thousands of times per hour and changed once a week.",
    "The cat photo, which only changes when the store swaps the product.",
    "A value that changes every instant and is almost never read twice in a row.",
    "The store's category list."
  ], 2, "Without repeated reads there are no hits, and without hits the cache only adds an extra trip. In lesson 4 this becomes arithmetic.");

  /* ---------- 2. Consistency and TTL ---------- */
  choice("t2", 1, 1, "What is the TTL of a key in the cache?", [
    "The maximum size of the key.",
    "The expiration deadline: after it the copy disappears and the next request is a miss.",
    "The number of replicas that hold the key.",
    "The time the database takes to answer."
  ], 1, "TTL is time to live. In the store, 60 s for produto:42.");
  tf("t2", 2, 1, "With a 60 s TTL, the cache never shows an old price.", false,
    "The TTL only limits how long the stale data lasts. During the 60 s, the cache can be behind the database.");
  choice("t2", 3, 2, "The cache was written at t = 0 with 89.90 and a 60 s TTL. The price changes in the database to 79.90 at t = 20 s, without deleting the key. For how long does the cache show the old price?", [
    "20 s.",
    "40 s.",
    "60 s.",
    "Until someone restarts the cache."
  ], 1, "From t = 20 s until the TTL expires at t = 60 s: 40 s.");
  choice("t2", 4, 2, "What is the worst case of stale data with a 60 s TTL?", [
    "Almost the full 60 s: the price changes right after the cache is written.",
    "Zero: the TTL always deletes the key right away.",
    "30 s, half the TTL.",
    "Infinite, as long as the product keeps being requested."
  ], 0, "The earlier the change comes after the write, the longer the old copy lasts, up to the whole TTL.");
  choice("t2", 5, 2, "How does the store guarantee zero seconds of stale data on a price?", [
    "By using a 1-hour TTL.",
    "By asking Lena to reload the page.",
    "Whoever writes 79.90 to the database also deletes the key produto:42 from the cache.",
    "By swapping the database for a faster one."
  ], 2, "With the key deleted, the next request is a miss and brings the new price from the database.");
  choice("t2", 6, 3, "A user was blocked for suspicious activity. Their record is in the cache with a 60 s TTL. What to do?", [
    "Nothing: 60 s is short.",
    "Reduce the TTL of the whole cache to 1 s.",
    "Wait for the TTL, but warn the team.",
    "Delete the record's key in the same operation that blocks the user."
  ], 3, "Data that can't wait for the deadline calls for invalidation at write time, as the source article says.");
  choice("t2", 7, 3, "A thousand products were written to the cache in the same second, with a 60 s TTL. What happens at t = 60 s, and what helps?", [
    "All thousand expire together and the database gets a thousand misses at once (stampede); varying each key's TTL a little helps.",
    "Nothing: Redis deletes one key at a time.",
    "The cache doubles in size.",
    "The database ignores requests until the cache is back."
  ], 0, "Keys that expire together become a wave of misses. Spreading the expirations (TTL with some variation) relieves the database.");

  /* ---------- 3. Eviction and invalidation ---------- */
  choice("t3", 1, 1, "What is eviction?", [
    "Deleting a key on the user's command.",
    "Removing a copy from the cache because it filled up and a new key arrived.",
    "Copying the cache to another server.",
    "Resetting a key's TTL back to 60 s."
  ], 1, "Eviction is for lack of space. The policy (LRU, LFU, FIFO) picks who leaves.");
  choice("t3", 2, 2, "A cache with 3 slots. The accesses were produto:42, 7, 42 and 13, and the cache ended up with [42, 7, 13]. Then produto:99 arrives. Who leaves under LRU?", [
    "produto:42.",
    "produto:13.",
    "Nobody: LRU grows the cache.",
    "produto:7."
  ], 3, "Under LRU the one that went longest without being requested leaves. 7 was last requested 3 accesses ago; 42 was 2 ago and 13 was 1 ago.");
  choice("t3", 3, 2, "In the same sequence (42, 7, 42, 13, 99), who leaves under FIFO?", [
    "produto:42, the first to enter.",
    "produto:7.",
    "produto:13.",
    "produto:99."
  ], 0, "FIFO only looks at the order of entry. It removes product 42, which is exactly the most requested.");
  choice("t3", 4, 2, "In the same sequence, who leaves under LFU, and how is the tie broken?", [
    "produto:42, which has the most requests.",
    "produto:13, which is the newest.",
    "produto:7: it has 1 request, like 13, and wins the tie by being the oldest.",
    "A randomly drawn one."
  ], 2, "42 has 2 requests; 7 and 13 have 1. The tie is broken by the oldest, 7. The tie-break rule varies between implementations.");
  choice("t3", 5, 3, "After the eviction, a new request for produto:42 arrives. Under which policy is it a miss?", [
    "Under LRU.",
    "Under LFU.",
    "Under FIFO: 42 was removed.",
    "Under none: 42 always stays."
  ], 2, "LRU and LFU kept 42 and get a hit. FIFO removed 42 and gets a miss.");
  tf("t3", 6, 1, "Eviction, TTL and invalidation are three names for the same thing.", false,
    "Eviction leaves for space, TTL by time and invalidation by event (a command, like DEL, or a rule).");
  choice("t3", 7, 3, "What does Redis's noeviction policy do when memory runs out?", [
    "Deletes the oldest keys.",
    "Removes nothing and returns an error on writes.",
    "Increases memory on its own.",
    "Shuts the server down."
  ], 1, "With noeviction no key is removed, and Redis refuses new writes until there is space.");

  /* ---------- 4. Hit, miss and hit rate ---------- */
  choice("t4", 1, 1, "How do you calculate the hit rate?", [
    "Misses divided by hits.",
    "Hits divided by hits plus misses.",
    "Hits minus misses.",
    "Cache time divided by database time."
  ], 1, "Hit rate = hits ÷ (hits + misses), usually as a percentage.");
  choice("t4", 2, 2, "Out of 10 requests for the cat page, the cache answered 8 and sent 2 to the database. What is the hit rate?", [
    "20%.",
    "40%.",
    "80%.",
    "8%."
  ], 2, "8 ÷ 10 = 80%.");
  choice("t4", 3, 2, "A 1 ms hit, a 40 ms database. What is the average time at an 80% hit rate?", [
    "9 ms.",
    "8 ms.",
    "16 ms.",
    "32 ms."
  ], 0, "0.8 × 1 + 0.2 × (1 + 40) = 0.8 + 8.2 = 9 ms. Without a cache it would be 40 ms.");
  choice("t4", 4, 2, "Why does a miss cost 41 ms in the store, and not 40?", [
    "Because the database is slower when the cache is full.",
    "Because the miss also pays 1 ms to ask the cache before going to the database.",
    "Because Redis charges for the write.",
    "Because the TTL adds 1 ms."
  ], 1, "The app asks the cache (1 ms), doesn't find it and then reads the database (40 ms).");
  choice("t4", 5, 3, "With a 0% hit rate, 1 ms for the cache and 40 ms for the database, what happens to the page?", [
    "It's the same as having no cache.",
    "It gets 4 times faster.",
    "It gets a little slower: 41 ms against 40 ms.",
    "The cache empties and the database goes down."
  ], 2, "Every request pays the trip to the cache and the trip to the database. The cache only pays off above 1 ÷ 40 = 2.5% hit rate, in this math.");
  choice("t4", 6, 3, "The hit rate rises from 80% to 90%. What changes for the database?", [
    "It receives half the reads: from 20% to 10%.",
    "Nothing: the database keeps receiving everything.",
    "It receives 10% more reads.",
    "It starts receiving only writes."
  ], 0, "Misses drop from 20% to 10% of the requests. The average time drops from 9 to 5 ms.");
  tf("t4", 7, 2, "800 hits and 200 misses give the same hit rate as 8 hits and 2 misses.", true,
    "Both give 80%. The hit rate is a proportion, and doesn't depend on the total.");

  /* ---------- 5. Memory and distributed ---------- */
  choice("t5", 1, 1, "In the store example, how much does it cost to read from the hashmap in the app's memory?", [
    "40 ms.",
    "1 ms.",
    "0.05 ms.",
    "5 ms."
  ], 2, "0.05 ms: it doesn't go through the network. Redis costs 1 ms and the database 40 ms.");
  choice("t5", 2, 2, "The price changes to 79.90 at t = 20 s. Replica A stored its cache at t = 0, B at t = 10 and C at t = 30. What does each one show?", [
    "All three show 79.90.",
    "A and B show 89.90; C shows 79.90.",
    "A shows 89.90; B and C show 79.90.",
    "All three show 89.90."
  ], 1, "A and B stored before the change. C stored after and already got the new price. Lena reloads the page and the price flickers.");
  choice("t5", 3, 2, "Ten round-robin requests across 3 replicas, each with its own hashmap. What is the hit rate, compared with a single Redis?", [
    "70% (3 misses) against 90% (1 miss).",
    "90% against 70%.",
    "Both give 80%.",
    "Both give 100%."
  ], 0, "Each replica takes its own first miss: 3 misses and 7 hits. With a shared cache, only the first request is a miss.");
  tf("t5", 4, 2, "The threads of the same process share the hashmap, and that's why the code uses a mutex.", true,
    "The hashmap's scope is the process, not the thread. Another replica is another process and can't see the map.");
  choice("t5", 5, 3, "Which data fits better in a local hashmap in each replica, and which calls for the shared Redis?", [
    "Price and stock in the hashmap, category list in Redis.",
    "Both call for the hashmap.",
    "Category list in the hashmap; price and stock in the shared Redis.",
    "Both call for Redis."
  ], 2, "The category list tolerates a few seconds of difference between replicas. Price and stock call for a single copy.");
  tf("t5", 6, 3, "Redis Cluster guarantees strong consistency between nodes.", false,
    "Replication is asynchronous: a write acknowledged to the client can be lost in a primary failover. In a cache, the lost data comes back with a miss.");

  /* ---------- 6. Cache-aside, write-through, write-behind and CDN ---------- */
  choice("t6", 1, 1, "How does cache-aside work?", [
    "The app writes only to the cache and a queue writes to the database later.",
    "The app asks the cache; on a miss, it reads the database, stores the copy and answers.",
    "The cache reads the database on its own and the app never sees it.",
    "The database pushes every new piece of data to the cache."
  ], 1, "In cache-aside the app runs things, and the cache only receives what was already requested.");
  choice("t6", 2, 2, "In write-through, the database takes 40 ms and the cache 1 ms. How long does the write take, in the example?", [
    "1 ms.",
    "40 ms.",
    "41 ms.",
    "0.05 ms."
  ], 2, "The write goes to both, and takes the sum: 40 + 1 = 41 ms. In return, the read never sees 89.90.");
  choice("t6", 3, 2, "In write-through, what is the safe order?", [
    "Write the cache first and the database after.",
    "Write the database first and the cache after.",
    "Write both in no particular order.",
    "Write only the cache."
  ], 1, "If the cache fails after the database, the worst case is stale data for a while. In the opposite order, the cache would hold a price the database never received.");
  choice("t6", 4, 3, "In write-behind, Redis goes down before the queue empties. What does the database say about the price?", [
    "79.90, because the queue was already fully sent.",
    "89.90: the 79.90 was only in the cache and the queue, and was lost.",
    "No price: the table is deleted.",
    "Both prices at once."
  ], 1, "Write-behind acknowledges the write in 1 ms, but the data only reaches the database later. It's the only one of the three strategies where acknowledged data is lost.");
  order("t6", 5, 2, "Put the write-behind of the price change in order.", [
    "The app writes 79.90 only to the cache (1 ms)",
    "The app answers that the price was saved",
    "The 79.90 goes into a queue",
    "A separate process writes 79.90 to the database"
  ], "The answer goes out before the database knows about the change. That's why, if the cache goes down before the last step, the write is lost.");
  choice("t6", 6, 2, "What does Cache-Control: public, max-age=3600 mean in the photo's response?", [
    "Only the browser can store it, for 3600 ms.",
    "Any cache, including the CDN, can store it for 3600 s.",
    "The photo is valid for 3600 accesses.",
    "The photo was generated at hour 3600."
  ], 1, "public lets shared caches, like the CDN, store it. max-age=3600 is the deadline, in seconds: 1 hour.");
  tf("t6", 7, 3, "X-Cache: HIT and X-Cache: MISS are standardized headers on every CDN.", false,
    "It's a convention. Each CDN picks its own name: Cloudflare uses cf-cache-status, for example.");

  /* ---------- 7. Building a CDN ---------- */
  choice("t7", 1, 1, "How does the lab proxy choose the cache file's name?", [
    "By the photo's name.",
    "By the time of the request.",
    "By a number that grows with each miss.",
    "By the SHA-1 of the text method + path + query."
  ], 3, "The hash gives a fixed name for the same request, with no slashes in the middle.");
  choice("t7", 2, 2, "For GET /gato.jpg, the key text is GET/gato.jpg. What does the file in cache/ look like?", [
    "cache/gato.jpg.",
    "cache/GET.",
    "A 40-character name, starting with f34b9897…",
    "cache/1."
  ], 2, "The SHA-1 of GET/gato.jpg is f34b98978ea8b0b6b5e489a03cd1f067ec7a3ffa.");
  choice("t7", 3, 3, "The store owner swaps gato.jpg at the origin, but Lena keeps seeing the old photo in the lab proxy. Why?", [
    "The lab proxy has no TTL: the file exists, so every request is a hit.",
    "The origin forgot to save the new photo.",
    "The new photo got too heavy.",
    "The SHA-1 changed on every request."
  ], 0, "With no expiration deadline, the copy lasts until someone deletes the file by hand.");
  choice("t7", 4, 3, "The origin answers 404 to the lab proxy. What does the proxy do?", [
    "Answers 404 to Lena and stores nothing.",
    "Retries every second.",
    "Warns the store owner.",
    "Stores the error page as if it were the photo and starts serving it as a hit, with status 200."
  ], 3, "http.Get doesn't return an error for 404 or 500, and the code doesn't look at the status. The error page stays stored as if it were the photo.");
  choice("t7", 5, 2, "In a real CDN, the max-age expired. How does the edge check whether the photo changed, without downloading it again?", [
    "Downloads the whole photo again.",
    "Deletes the copy and waits for the next request.",
    "Asks with If-None-Match and the ETag; if it didn't change, the origin answers 304 Not Modified, with no body.",
    "Uses the Age to guess."
  ], 2, "The trip costs the ~50 ms, but the 120 KB don't travel again. If it changed, the origin answers 200 with the new photo.");
  tf("t7", 6, 3, "In the lab, GET /gato.jpg?v=2 makes the proxy request a different photo from the origin.", false,
    "The query goes into the key (creating another file), but the origin URL uses only the Path. Both files store the same response.");

  window.QUIZ = out;
})();
