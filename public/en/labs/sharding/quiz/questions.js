/* Question bank for the Sharding and Partitioning quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles them),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-e-topologia-de-sharding", name: "Introduction and sharding topology" },
    t2: { topic: "aula-2-escalabilidade-e-performance", name: "Scalability and performance" },
    t3: { topic: "aula-3-sharding-keys-e-hot-partitions", name: "Sharding keys and hot partitions" },
    t4: { topic: "aula-4-sharding-de-tabelas", name: "Sharding tables" },
    t5: { topic: "aula-5-ranges-comuns-datas-e-tiers", name: "Common ranges, dates and tiers" },
    t6: { topic: "aula-6-hashing", name: "Hashing" },
    t7: { topic: "aula-7-hashing-consistente", name: "Consistent hashing" },
    t8: { topic: "aula-8-gestao-de-chaves", name: "Key management" },
    t9: { topic: "aula-9-shuffle-sharding", name: "Shuffle sharding" },
    t10: { topic: "aula-10-exemplo", name: "Example" }
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


  /* ---------- 1. Introduction and sharding topology ---------- */
  choice("t1", 1, 2, "The pedidos table grows 5 orders/s × 86,400 s, with 2 KB per row and 40% extra for indexes. About how long do the 60 GB of free space last?", [
    "5 days.",
    "50 days.",
    "500 days.",
    "1 day."
  ], 1, "432,000 orders/day × 2 KB × 1.4 = 1.21 GB per day. 60 ÷ 1.21 gives about 50 days.");
  choice("t1", 2, 1, "Which sentence describes partitioning a table, and not sharding?", [
    "Each piece lives on a different server.",
    "The table is divided into pieces inside the same instance.",
    "The service code is copied into more replicas.",
    "Reads are spread across read replicas."
  ], 1, "Partitioning divides inside one instance (pruning and retention, no new capacity). A shard is each piece on a different server.");
  choice("t1", 3, 2, "How long does the full 140 GB backup take at 50 MB/s on the single server?", [
    "About 47 minutes.",
    "About 5 minutes.",
    "About 4 hours.",
    "About 15 minutes."
  ], 0, "140,000 MB ÷ 50 MB/s = 2,800 s, or 47 minutes.");
  tf("t1", 4, 2, "50 million rows do not fit in a PostgreSQL, and that is why the store needs sharding.", false, "They still fit. The store's triggers are disk (140 GB on 200 GB), backup and the write ceiling of 150 orders/s.");
  order("t1", 5, 2, "Put the ladder of remedies in order, from cheapest to most expensive.", [
    "Index",
    "Cache",
    "Read replicas",
    "Partitioning on the same instance",
    "Sharding"
  ], "Each step fixes one symptom and costs more than the one before. Sharding is the only one that also multiplies writes and space.");

  /* ---------- 2. Scalability and performance ---------- */
  choice("t2", 1, 2, "Each shard handles 150 orders/s. How much do 3 shards offer, on paper?", [
    "150 orders/s.",
    "300 orders/s.",
    "450 orders/s.",
    "600 orders/s."
  ], 2, "3 × 150 = 450, if the load spreads evenly. Lesson 3 shows when it does not.");
  choice("t2", 2, 2, "How long does the backup of the 140 GB take with 3 shards, in parallel at 50 MB/s?", [
    "47 minutes.",
    "15 min 33 s.",
    "2 min.",
    "93 min."
  ], 1, "140 GB ÷ 3 = 46.7 GB per shard; 46,667 MB ÷ 50 = 933 s, or 15 min 33 s.");
  choice("t2", 3, 2, "A query without the key waits on 50 shards. What is the chance that at least one answers above its p99?", [
    "1%.",
    "9.56%.",
    "39.5%.",
    "63.4%."
  ], 2, "1 − 0.99^50 = 39.5%. With 3 shards it is 2.97%, with 10 it is 9.56% and with 100 it is 63.4%.");
  choice("t2", 4, 2, "With each shard at 99.9%, what is the chance that some of the 3 shards is down?", [
    "0.10%.",
    "0.2997%.",
    "0.9955%.",
    "4.88%."
  ], 1, "1 − 0.999^3 = 0.2997%. For one customer, the chance stays at 0.1%; it is the team that sees more incidents.");
  tf("t2", 5, 2, "A query with the sharding key reads only 1 shard; without the key, the router asks all of them.", true, "With the key, the router computes the shard. Without it, it does scatter-gather and waits for the slowest.");

  /* ---------- 3. Sharding keys and hot partitions ---------- */
  choice("t3", 1, 2, "mkt-01 has 40% of the rows and lands on shard-2 (3 shards, cliente_id key). What is the cluster efficiency?", [
    "33.3%.",
    "55.6%.",
    "60.6%.",
    "100%."
  ], 1, "shard-2 ends up with 60% of the rows: 1 ÷ (3 × 0.60) = 55.6%.");
  choice("t3", 2, 2, "With mkt-01 on shard-2, at how many orders/s does that shard saturate (ceiling of 150/s)?", [
    "450 orders/s.",
    "250 orders/s.",
    "150 orders/s.",
    "750 orders/s."
  ], 1, "0.60 × T = 150, so T = 250. The store pays for 3 servers and uses 1.67.");
  choice("t3", 3, 2, "Why is cidade a bad key for the pedidos table?", [
    "Because cidade is text.",
    "Because it has only 3 values: the ceiling is 3 shards and SP takes 55%.",
    "Because the hash does not work with text.",
    "Because cidade changes with every order."
  ], 1, "Low cardinality limits the cluster. With 3 shards, the efficiency is 1 ÷ (3 × 0.55) = 60.6%.");
  tf("t3", 4, 2, "Using a hash of the key avoids hot partitions, because the hash spreads the load.", false, "The hash spreads different keys, not load. A hot key, like mkt-01, lands whole on one shard.");
  choice("t3", 5, 3, "The store gives mkt-01 a dedicated shard on a 2× machine (300/s) and keeps 3 normal shards. How much does it now handle?", [
    "250 orders/s.",
    "450 orders/s.",
    "600 orders/s.",
    "750 orders/s."
  ], 3, "The 4 shards saturate together at T = 750: 0.4 × 750 = 300 and 0.2 × 750 = 150.");
  choice("t3", 6, 2, "What is the cost of splitting mkt-01 into 8 sub-keys (mkt-01#0 to #7)?", [
    "The efficiency drops to 55.6%.",
    "The partner's orders can no longer be written.",
    "Querying all the partner's orders becomes scatter-gather.",
    "The hash stops working."
  ], 2, "The salt spreads the partner over the 3 shards (efficiency close to 100%), but its rows no longer live together.");

  /* ---------- 4. Sharding tables ---------- */
  choice("t4", 1, 2, "What error does PRIMARY KEY (id) on a PARTITION BY RANGE (sale_date) table give?", [
    "no partition of relation found for row.",
    "The sale_date column does not exist.",
    "The unique constraint must include all the partitioning columns.",
    "The table already exists."
  ], 2, "unique constraint on partitioned table must include all partitioning columns. The fix is PRIMARY KEY (id, sale_date).");
  choice("t4", 2, 2, "How does the plan handle WHERE id = 1042 on a pedidos table split by year (3 partitions)?", [
    "It reads only the 2026 partition.",
    "Append with an Index Scan on each of the 3 partitions.",
    "It fails with a partition error.",
    "It uses a global index."
  ], 1, "Without the partition key the planner does not know the year. With id and criado_em, it is back to a single partition.");
  choice("t4", 3, 2, "What error shows up when inserting an order with a 2027 criado_em without the 2027 partition?", [
    "unique violation.",
    "no partition of relation \"pedidos\" found for row.",
    "relation \"pedidos_2027\" is locked.",
    "syntax error."
  ], 1, "The DETAIL shows the row's key. A job that creates the next period's partition avoids the error.");
  choice("t4", 4, 2, "On the 14-row sample, PARTITION BY HASH (cliente_id) with MODULUS 3 leaves how many rows in each partition?", [
    "5 / 5 / 4.",
    "11 / 3 / 0.",
    "3 / 9 / 2.",
    "14 / 0 / 0."
  ], 1, "pedidos_h0 gets lena-77, bia-31 and caio-58 (11), pedidos_h1 gets davi-12 (3) and pedidos_h2 is empty. PostgreSQL uses its own hash function.");
  tf("t4", 5, 2, "Partitioning the pedidos table by year on the same instance raises the 150 orders/s ceiling.", false, "All the partitions live on the same server. Partitioning gives pruning and retention, not capacity.");
  choice("t4", 6, 2, "Which retention command leaves dead rows for VACUUM?", [
    "DETACH PARTITION.",
    "DROP TABLE pedidos_2024.",
    "DELETE FROM pedidos WHERE criado_em < '2025-01-01'.",
    "None."
  ], 2, "DELETE (62.9 ms on the 105,407 rows) scans rows and leaves dead tuples; DROP (7.5 ms) and DETACH (1.1 ms) do not.");

  /* ---------- 5. Common ranges, dates and tiers ---------- */
  choice("t5", 1, 2, "With 6 initial ranges (A–E · F–J · K–N · O–R · S–V · W–Z) and the store's sample, how many ranges receive rows?", [
    "1.",
    "2.",
    "4.",
    "6."
  ], 1, "A–E (Bia, Caio and Davi: 8 rows) and K–N (Lena: 6 rows). The other four stay empty.");
  choice("t5", 2, 2, "What happens to new writes when the 50 million ids are divided into 3 ranges and the id is sequential?", [
    "They go evenly to the 3 ranges.",
    "100% go to the last range.",
    "They go only to the first range.",
    "They fail until the database is partitioned."
  ], 1, "Every new id is bigger than the old ones: it lands in the last range, and the first two stay full and idle (33.3% efficiency).");
  choice("t5", 3, 2, "Which partition is the store's cold tier?", [
    "pedidos_2026 (25 million, 50 GB).",
    "pedidos_2025 (17 million, 34 GB).",
    "pedidos_2024 (8 million, 16 GB).",
    "All of them."
  ], 2, "2024 is rarely read and goes to cheap, slow storage. 2026 is hot (SSD) and 2025 is warm.");
  choice("t5", 4, 3, "It is 1/1/2027 and the first order of the year fails. What should the store have done beforehand?", [
    "Switched the key to cliente_id.",
    "A job that creates the next period's partition before it is needed.",
    "Dropped the 2024 partition.",
    "Changed the PK to (id)."
  ], 1, "The error was predictable. A DEFAULT partition holds the rows, but hides the problem and grows with nobody looking.");
  tf("t5", 5, 2, "Retiring the 2024 partition with DROP scans the 8 million rows and leaves dead rows.", false, "DROP and DETACH do not scan rows or leave work for VACUUM. That is why retention by partition is cheap.");

  /* ---------- 6. Hashing ---------- */
  choice("t6", 1, 2, "Where does Lena's order 1054 go, with murmur3(\"lena-77\") = 0x8fd9d9d8 and mod 3?", [
    "shard-0.",
    "shard-1.",
    "shard-2.",
    "shard-3."
  ], 1, "0x8fd9d9d8 = 2,413,418,968, and the remainder of dividing by 3 is 1.");
  choice("t6", 2, 2, "Going from 3 to 4 shards with hash mod N, what fraction of the keys changes shard?", [
    "25%.",
    "50%.",
    "75.2%.",
    "100%."
  ], 2, "N ÷ (N + 1) = 3 ÷ 4: 75.2% measured on the 100,000 keys. About 37.5 million rows, 75 GB, 25 minutes.");
  choice("t6", 3, 2, "And when doubling from 3 to 6 shards with mod?", [
    "49.9%.",
    "75.2%.",
    "66.7%.",
    "100%."
  ], 0, "Doubling is mod's favorable case: about 50% of the keys move (25 million rows, 50 GB).");
  choice("t6", 4, 3, "In the lab with 41 inputs and 5 shards, FNV-1a gave 14 on one shard (the ideal is 8.2). What do you conclude?", [
    "That FNV-1a is worse than SHA-256.",
    "That murmur3 is better.",
    "Nothing: the expected deviation is 2.56, and with 25 counts a 14 is expected by luck.",
    "That the lab has a bug."
  ], 2, "With 100,000 keys all the functions stay within 2% of the ideal. Balance does not decide the function.");
  tf("t6", 5, 2, "The \"sum of characters\" is a good hash function because it gives the best number in the test, 1.000.", false, "Anagrams collide (lena-77 and 77-anel land on the same shard) and neighboring ids land on neighboring shards.");
  choice("t6", 6, 3, "In the deploy, router v1 uses mod 3 and v2 uses mod 4. Lena writes 1054 through v2. What happens in \"my orders\" through v1?", [
    "It shows the order normally.",
    "It gives a 500 error.",
    "It does not show it: v2 wrote to shard-0 (mod 4 = 0) and v1 looks on shard-1.",
    "It shows the order twice."
  ], 2, "Two routers with a different N see different databases. There is no error, just an order that vanished from the screen.");

  /* ---------- 7. Consistent hashing ---------- */
  choice("t7", 1, 1, "On the ring, who owns a key?", [
    "The shard with the highest hash.",
    "The first shard found going clockwise from the key.",
    "The shard with the lowest number.",
    "All the shards."
  ], 1, "Shards and keys live on the same circle. Past the end, the search goes back to the first point.");
  choice("t7", 2, 2, "On the ring with 200 points per shard, going from 3 to 4 shards, what changes?", [
    "75.2% of the keys, among all the shards.",
    "25.7% of the keys, all to the new shard.",
    "Nothing changes.",
    "50% of the keys."
  ], 1, "The ideal is 25%. That is 12.5 million rows, 25 GB, 8 min 20 s at 50 MB/s, against 25 min for mod.");
  choice("t7", 3, 2, "Which of the 5 customers move on the ring when shard-3 joins?", [
    "lena-77 and bia-31.",
    "caio-58 and davi-12, both to shard-3.",
    "All, except davi-12.",
    "Only mkt-01."
  ], 1, "With mod 4, 4 of the 5 move and several go between old shards. On the ring only these two move, and to the new shard.");
  choice("t7", 4, 2, "With 1 point per shard, what are the slices of 3 shards, and what is the max ÷ mean ratio?", [
    "33 / 33 / 33 and ratio 1.00.",
    "70.2 / 8.8 / 21.0 and ratio 2.11.",
    "59.0 / 17.7 / 23.3 and ratio 1.77.",
    "50 / 30 / 20 and ratio 1.50."
  ], 1, "With 3 points (the lab) it is 59.0 / 17.7 / 23.3 and 1.77; with 200 points, 35.5 / 32.2 / 32.3 and 1.07.");
  choice("t7", 5, 3, "The biggest shard (70.2%) leaves a ring with 1 point per shard. What happens?", [
    "The keys split between the two neighbors.",
    "All go to one neighbor, which now has 91.2%: the domino effect.",
    "The ring stops working.",
    "Nothing, because the ring keeps a copy."
  ], 1, "With 200 points, shard-1 gets 53.1% and shard-2 gets 46.9%: virtual nodes spread the impact of a departure.");
  tf("t7", 6, 2, "The ring's consistent hashing uses the remainder (mod) of the hash divided by the number of shards.", false, "The ring uses sorted positions on a circle and a search for the first point, with no modulo.");

  /* ---------- 8. Key management ---------- */
  choice("t8", 1, 2, "How many slots does shard-3 receive going from 3 to 4 shards (1,024 slots)?", [
    "128 (12.5%).",
    "256 (25%).",
    "341 (33%).",
    "512 (50%)."
  ], 1, "86 + 85 + 85 = 256 slots: the last ones of shards 0, 1 and 2 (slots 768, 769 and 770 onward), exactly 25%.");
  choice("t8", 2, 2, "When the 256 slots move to shard-3, which of the 5 customers changes shard?", [
    "lena-77.",
    "bia-31 (slot 827, from shard-2 to shard-3).",
    "caio-58.",
    "None."
  ], 1, "The others' slots (472, 749, 432 and 597) fall below the cut. The customer's hash does not change; only the map does.");
  choice("t8", 3, 2, "How long does it take to move mkt-01 (20 million rows of 2 KB) to a dedicated shard, at 50 MB/s?", [
    "About 80 s.",
    "13 min 20 s (40 GB).",
    "47 min.",
    "About 4 h."
  ], 1, "40,000 MB ÷ 50 = 800 s. And you need to apply the changes that arrive during the copy (CDC) before switching the directory.");
  choice("t8", 4, 3, "A router cached mkt-01's old route after the cutover. What is the defense?", [
    "The old shard accepts and writes, and the data is moved later.",
    "The shard refuses keys that are no longer its own (like Redis's -MOVED) and the map has an epoch.",
    "Restart the database.",
    "Turn off the cache and lose performance."
  ], 1, "Without the refusal, the data goes to the wrong place and nobody notices. The epoch tells the router its map is stale.");
  choice("t8", 5, 2, "On how many of the 5 customers do murmur2 mod 3 (Kafka) and murmur3 mod 3 (the database router) give the same number?", [
    "All of them.",
    "2 of 5 (lena-77 and caio-58).",
    "None.",
    "4 of 5."
  ], 1, "For the consumer of partition p to write only to shard p, the function and the key have to be the same.");
  tf("t8", 6, 1, "Redis Cluster uses 16,384 slots and CRC16(key) mod 16384.", true, "It is the fixed-slot model: moving shards is moving slots, and -MOVED tells the client where to go.");

  /* ---------- 9. Shuffle sharding ---------- */
  choice("t9", 1, 2, "With 10 replicas in 5 fixed groups of 2, mkt-01 and bia-31 land in the same group. What fraction of the customers is left without service when the group hangs?", [
    "2.2%.",
    "10%.",
    "20%.",
    "50%."
  ], 2, "1 group of 5 = 20%, Bia included. With shuffle sharding of 2 in 10, only whoever has the same pair goes down (1 in 45).");
  choice("t9", 2, 2, "How many different pairs exist in subsets of 2 out of 10 replicas?", [
    "20.",
    "45.",
    "90.",
    "100."
  ], 1, "C(10, 2) = 45. With 4 in 10 there are 210 sets.");
  choice("t9", 3, 2, "mkt-01 gets replicas 8 and 9 and both hang. Who notices nothing?", [
    "lena-77 and davi-12.",
    "bia-31 and caio-58.",
    "All the customers.",
    "Nobody."
  ], 1, "Bia (replicas 4 and 6) and Caio (1 and 4) share no replica with the partner. Lena (6 and 8) and Davi (1 and 9) lose one replica each.");
  choice("t9", 4, 3, "lena-77 has replicas 6 and 8, and 8 is hung. Her app does not repeat the call if the first one fails. What does she see?", [
    "Nothing: 6 serves everything.",
    "About half the calls fail.",
    "All the calls fail.",
    "The order is duplicated."
  ], 1, "Shuffle sharding requires the client to try all the replicas in its subset. Without the retry, the isolation exists only on paper.");
  tf("t9", 5, 2, "Shuffle sharding is a way to replicate the shard's data onto other servers.", false, "It is request and compute isolation: each customer uses a subset of replicas. Replicating data is a separate decision (module 17).");
  choice("t9", 6, 2, "Route 53 uses 2,048 virtual servers and gives 4 to each domain. How many combinations exist?", [
    "About 8 thousand.",
    "About 730 billion.",
    "About 2 million.",
    "Exactly 2,048."
  ], 1, "C(2048, 4) = 730,862,190,080. Two domains with the same set are extremely rare.");

  /* ---------- 10. Example ---------- */
  choice("t10", 1, 2, "What is the count of the author's hashing/ (10 tenants, SHA-256, 3 shards)?", [
    "3 / 3 / 4.",
    "2 / 4 / 4.",
    "5 / 3 / 2.",
    "10 / 0 / 0."
  ], 1, "With 4 shards, 7 of the 10 tenants move. A distribution of 10 inputs is just noise.");
  choice("t10", 2, 2, "In the ring lab (3 points, 4 shards, 10 tenants), how many tenants move when Shard-02 is removed?", [
    "1 of 10.",
    "3 of 10, all to Shard-00.",
    "7 of 10.",
    "All."
  ], 1, "Adding Shard-04 moves 1 of 10 (Hortifruti-Oba, from Shard-01 to Shard-04).");
  choice("t10", 3, 3, "Why is the lab's Shard-00 born with 0 tenants?", [
    "Because the hash failed.",
    "Because 3 points per shard are too few: its slice may contain no tenant.",
    "Because it was removed.",
    "Because the name is invalid."
  ], 1, "In practice it is tens to hundreds of points: with 200, the slices come out around 25% each.");
  tf("t10", 4, 2, "The author's partitioning/table.sql runs as is and already creates the partitions.", false, "PRIMARY KEY (id) does not create the table, and, once fixed, the file creates no partition. The \\c ecommerce; only runs with psql -f.");
  choice("t10", 5, 2, "What happens to GetTenantNode on an empty ring?", [
    "It returns an empty string.",
    "Panic: index 0 on a slice with no elements.",
    "It returns the first shard.",
    "It creates a new shard."
  ], 1, "The code goes back to index 0 if it runs past the end, but an empty slice has no index 0.");
  choice("t10", 6, 1, "After sharding, which problem of the store is still open and leads to module 17?", [
    "The table started growing again.",
    "Each shard is a single server: if shard-1 goes down, Lena and Bia are left without orders.",
    "The hash is slow.",
    "mkt-01 left the store."
  ], 1, "Sharding copies nothing. What is left is copying each shard: primary in SP, replicas in Rio and Recife.");

  window.QUIZ = out;
})();
