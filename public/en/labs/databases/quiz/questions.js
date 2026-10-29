/* Question bank for the Databases, Data Models and Indexing quiz (English).
   Types: choice (answer = index into options), order (options already in the right order; the quiz shuffles them),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-o-que-sao-bancos", name: "What a database is" },
    t2: { topic: "aula-2-tipos-de-bancos", name: "Types of databases" },
    t3: { topic: "aula-3-niveis-de-consistencia", name: "Consistency levels" },
    t4: { topic: "aula-4-modelo-de-tuplas", name: "Tuple model (row-based)" },
    t5: { topic: "aula-5-modelo-de-documentos", name: "Document model" },
    t6: { topic: "aula-6-modelo-colunar", name: "Columnar model" },
    t7: { topic: "aula-7-coluna-larga", name: "Wide-column model" },
    t8: { topic: "aula-8-chave-valor", name: "Key-value model" },
    t9: { topic: "aula-9-grafos", name: "Graph model" },
    t10: { topic: "aula-10-page-size-e-indexacao-colunar", name: "Page size and columnar indexing" },
    t11: { topic: "aula-11-lsm-trees", name: "LSM-Trees" },
    t12: { topic: "aula-12-b-tree", name: "B-Tree" },
    t13: { topic: "aula-13-hashing", name: "Hash indexing" },
    t14: { topic: "aula-14-indices-invertidos", name: "Inverted indexes" },
    t15: { topic: "aula-15-write-e-read-intensive", name: "Write-intensive and read-intensive" }
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

  /* ---------- 1. What a database is ---------- */
  choice("t1", 1, 1, "What is a database, in one sentence?", [
    "A text file with an index at the start.",
    "The layer between the program and the disk: you say what you want and it decides where to store it, how to find it and how to protect it.",
    "A server that only keeps data in memory.",
    "A program that draws tables on the screen."
  ], 1, "The program says what it wants. Disk allocation, search and failure recovery are the database's job.");
  tf("t1", 2, 1, "In SELECT * FROM pedidos WHERE id = 1042, the program has to tell the database whether to scan the table or use an index.", false,
    "The program only says what it wants. How to find the row, scanning everything or following an index, is the database's decision.");
  choice("t1", 3, 2, "With 6 rows in the pedidos table, scanning everything is acceptable. What changes with 6 million rows?", [
    "Nothing: the database always reads only the requested row.",
    "The scan becomes the difference between a quick click and a frozen screen, and the index starts to pay off.",
    "The database stops accepting new orders.",
    "The SELECT starts returning only half of the rows."
  ], 1, "An index is the shortcut the database keeps to jump straight to the row, without reading the whole table.");
  order("t1", 4, 2, "Put in order the path of order 1042 when Lena buys the plush cat.", [
    "The program sends INSERT INTO pedidos ...",
    "The database allocates the space and writes to disk",
    "The database confirms, now with the row safe",
    "Later, SELECT ... WHERE id = 1042 finds the row by scan or by index"
  ], "The program only asks. Allocating, writing and confirming only after the row is safe is the database's work.");

  /* ---------- 2. Types of databases ---------- */
  choice("t2", 1, 1, "Which trade defines NewSQL?", [
    "SQL and transactions as in the relational model, with the horizontal scale of NoSQL, paying network latency on every commit.",
    "Keeping everything in RAM and accepting losing the data.",
    "Giving up SQL to gain scale.",
    "Storing only data with a timestamp."
  ], 0, "To do that it splits the data across servers and uses consensus (Raft or Paxos) to confirm each write.");
  choice("t2", 2, 2, "The store needs to keep the site's response time every second, with automatic cleanup of what grows old. Which type of database?", [
    "Relational SQL.",
    "Graph.",
    "Time series.",
    "NewSQL."
  ], 2, "Each record carries a timestamp, writes only append to the end and old data is deleted on its own.");
  tf("t2", 3, 2, "The source article says NoSQL has no direct relationships. That holds for every NoSQL database, graph databases included.", false,
    "It holds for key-value and document. The graph database is NoSQL and exists precisely to store relationships.");
  choice("t2", 4, 3, "Lena opens the site and her session (sessao:lena) lives only in RAM. The server restarts. What happens, and why is that acceptable?", [
    "Order 1042 vanishes, and that is unacceptable.",
    "The session may vanish and Lena logs in again: in-memory only fits data you can rebuild.",
    "The session comes back on its own, because RAM is durable.",
    "The relational database deletes the old orders."
  ], 1, "Some in-memory databases write a log to disk and regain durability, at the cost of some speed. The confirmed order goes to the durable database.");

  choice("t2", 5, 1, "The four letters of ACID, which SQL databases usually provide, are:", [
    "Atomicity, Consistency, Integrity and Durability.",
    "Atomicity, Consistency, Isolation and Durability.",
    "Availability, Consistency, Isolation and Durability.",
    "Atomicity, Concurrency, Isolation and Availability."
  ], 1, "The source article writes \"Integrity\" in place of the I. The I is Isolation: concurrent transactions do not see each other's intermediate state.");

  /* ---------- 3. Consistency levels ---------- */
  choice("t3", 1, 1, "What does strong consistency (linearizability) guarantee?", [
    "That the copies converge after a while.",
    "That, once the write is confirmed, every read on any server sees that value.",
    "That no replica is ever behind internally.",
    "That all writes go to a single server."
  ], 1, "A replica may be behind internally, as long as the database does not answer the read with it.");
  tf("t3", 2, 1, "The source article treats linearizability and sequential consistency as synonyms. That is correct.", false,
    "Sequential consistency only requires everyone to see the writes in the same order, without tying that order to real time. It is a weaker model. Strong is linearizability.");
  choice("t3", 3, 2, "Lena writes order 1042 in Recife at 10:00:00 and SP only receives the copy at 10:00:02. Bia queries SP at 10:00:01. What does she see?", [
    "With strong consistency, either 1042 or a wait; with eventual, the list without 1042.",
    "In both cases, the list without 1042.",
    "In both cases, 1042 right away.",
    "With strong, the list without 1042; with eventual, 1042."
  ], 0, "Eventual answers fast because it waits for nobody, and converges at 10:00:02. Strong never shows the list without the confirmed write.");
  choice("t3", 4, 3, "A database with 3 replicas always writes and reads with a majority (R + W > N). Someone says: \"one replica is stale, so it is eventual\". Is that right?", [
    "Yes: any lagging replica makes the database eventual.",
    "No: the quorum read finds the new write, so it stays strong for whoever reads with a quorum.",
    "Yes, because the quorum only applies to writes.",
    "No: with a quorum the database becomes CA."
  ], 1, "That is one of the corrections to the article. Also, \"strong is CA\" does not exist: a strong distributed database, during a partition, is CP.");

  /* ---------- 4. Tuple model ---------- */
  choice("t4", 1, 1, "How does the tuple model write an order?", [
    "Each column in its own file.",
    "The whole row, with the fields side by side, inside a fixed-size page.",
    "As a nested JSON document.",
    "As an edge between two nodes."
  ], 1, "That is why reading or writing a whole order is cheap.");
  choice("t4", 2, 2, "In the figure, each row of pedidos takes ~2 KB and the page is 8 KB. Which pages hold orders 1042 and 1046?", [
    "Both on page 1.",
    "1042 on page 1 and 1046 on page 2.",
    "1042 on page 2 and 1046 on page 1.",
    "Both on page 2."
  ], 1, "There are 4 rows per page: 1041 to 1044 on page 1, 1045 and 1046 on page 2.");
  choice("t4", 3, 2, "How many pages does SELECT SUM(valor) FROM pedidos read in the tuple model, and what is the sum?", [
    "1 page and R$ 406.40.",
    "2 pages (16 KB) and R$ 406.40.",
    "6 pages and R$ 406.40.",
    "2 pages and R$ 109.80."
  ], 1, "The database only wants the valor field, but it sits inside each row. It has to read the 2 pages to add up 6 numbers.");
  tf("t4", 4, 3, "A \"My orders\" screen that opens one order at a time (create, look up 1042, fix the address) is a use where the tuple model does well.", true,
    "Transactional operations on one record at a time are its strong point: the whole row in a single page.");

  /* ---------- 5. Document model ---------- */
  choice("t5", 1, 1, "What does the nesting of the document model eliminate?", [
    "The index.",
    "The JOIN: the orders are inside the customer's document.",
    "The need for a schema in the program.",
    "Replication."
  ], 1, "Lena ends up with orders 1042 and 1044 inside the document and one read brings everything.");
  choice("t5", 2, 2, "In Lena's document, what is the total of orders 1042 and 1044?", [
    "R$ 89.90.",
    "R$ 109.80.",
    "R$ 129.70.",
    "R$ 406.40."
  ], 1, "R$ 89.90 + R$ 19.90 = R$ 109.80, coming out of the same object.");
  choice("t5", 3, 3, "Each plush cat buyer's document carries the price R$ 89.90 embedded. The price changes. What happens?", [
    "It changes in one place only.",
    "You have to rewrite all the documents that carry the price.",
    "The database updates on its own because of the schema.",
    "Nothing, the historical price vanishes."
  ], 1, "Embedding reads faster and lets the data go stale. In the order, storing the price paid at purchase time makes sense for exactly that reason.");
  tf("t5", 4, 3, "According to the lesson, document databases like MongoDB index fields with a B-Tree. A real inverted index, with search by terms and relevance, belongs to search engines.", true,
    "It is one of the corrections to the source article. They only have a basic text index; Elasticsearch and Solr are the search engines.");

  /* ---------- 6. Columnar model ---------- */
  choice("t6", 1, 1, "How does the columnar model store the pedidos table?", [
    "One file per column, with all its values together; position ties the files together.",
    "One file per customer.",
    "One page per order.",
    "A single file, with the columns mixed."
  ], 0, "Order 1042 is the second value in each file.");
  choice("t6", 2, 2, "How many files does SUM(valor) open in the columnar model, and how many does the whole order 1042?", [
    "1 and 6.",
    "6 and 1.",
    "1 and 1.",
    "2 and 6."
  ], 0, "The sum opens only the valor file (R$ 406.40). Assembling the whole row opens all 6 files.");
  choice("t6", 3, 2, "The cidade column has the values Rio, Recife and SP. How does the dictionary compress it?", [
    "It stores 0, 1, 2, 1, 2, 2 and a dictionary (Rio=0, Recife=1, SP=2).",
    "It removes the repeated cities and loses rows.",
    "It swaps each city for the order id.",
    "It writes only the first city."
  ], 0, "With the rows sorted by city, it still becomes Rio×1, Recife×2, SP×3 through run-length.");
  tf("t6", 4, 3, "The columnar model fits the store's checkout well, which writes a new order on every purchase.", false,
    "Writing an order appends a value in 6 files. Columnar fits analytics over many rows, and rarely the checkout.");

  /* ---------- 7. Wide-column ---------- */
  choice("t7", 1, 1, "What is the role of the partition key in wide-column?", [
    "Sorting the columns alphabetically.",
    "Grouping the data and deciding which server the partition lives on.",
    "Compressing each column.",
    "Linking one node to another."
  ], 1, "In the store's example the key is cliente: everything of Lena's stays together.");
  choice("t7", 2, 2, "How does Lena store her orders in the cliente=Lena partition?", [
    "In dynamic columns pedido:1042 and pedido:1044.",
    "In six files, one per column of the table.",
    "In a pair carrinho:lena → {1042}.",
    "In a node linked to the plush cat."
  ], 0, "Bia has her own columns (1043 and 1046), which do not exist in Lena's row.");
  tf("t7", 3, 2, "Columnar and wide-column are the same model with different names.", false,
    "Columnar cuts the table vertically to sum fast. In wide-column the row still exists, has a key, and it is its set of columns that varies.");
  choice("t7", 4, 3, "With the partition key cliente, which query is cheap and which is expensive?", [
    "Cheap: today's orders. Expensive: Lena's orders.",
    "Cheap: Lena's orders. Expensive: which customers bought a plush cat.",
    "Both are cheap.",
    "Both are expensive."
  ], 1, "Without the key, the database would have to look at every partition. In wide-column, you design the table starting from the most frequent query.");

  /* ---------- 8. Key-value ---------- */
  choice("t8", 1, 1, "What does it mean to say the value is \"opaque\" in a key-value database?", [
    "It is encrypted.",
    "The database does not look at what is inside the value.",
    "It cannot be changed.",
    "It only accepts numbers."
  ], 1, "Filtering by content is the program's job.");
  choice("t8", 2, 2, "Which pairs does the store keep for Lena in this model?", [
    "carrinho:lena → {1042} and sessao:lena → login token.",
    "pedido:1042 and pedido:1044 in a partition.",
    "A Lena node and a COMPROU edge.",
    "An inverted index with pelúcia → [1042, 1043]."
  ], 0, "The session may have an expiry, and the database deletes the pair on its own.");
  choice("t8", 3, 3, "The store asks \"which carts have the plush cat?\". What does the key-value database do?", [
    "Answers directly by the key.",
    "It cannot do it alone: the program would have to read all the carts.",
    "Consults an internal inverted index.",
    "Does a JOIN with the pedidos table."
  ], 1, "Only the question \"give me the value of this key\" is fast. The database does not help search, filter or join.");
  tf("t8", 4, 2, "To spread keys across servers, the key's hash picks the server, and with consistent hashing only part of the keys change place when it grows.", true,
    "Each pair is independent, which is why it is easy to split across servers.");

  /* ---------- 9. Graphs ---------- */
  choice("t9", 1, 1, "In the graph model, what are nodes and edges?", [
    "Nodes are relationships and edges are entities.",
    "Nodes are entities (Lena, plush cat) and edges are relationships with a direction and a name (COMPROU).",
    "Nodes are columns and edges are rows.",
    "Nodes are keys and edges are values."
  ], 1, "Both are first-class data, and following a node to its neighbor is an operation of the database.");
  choice("t9", 2, 2, "What does Bia's order 1043 look like in the graph?", [
    "(Bia)-[COMPROU]->(gato de pelúcia)",
    "(Bia)-[COMPROU]->(caneca azul)",
    "(gato de pelúcia)-[COMPROU]->(Lena)",
    "(Lena)-[COMPROU]->(Bia)"
  ], 0, "1042 is (Lena)-[COMPROU]->(gato de pelúcia). The blue mug gets the edges from orders 1044 and 1046.");
  choice("t9", 3, 3, "Someone is looking at the plush cat. Which recommendation does the traversal return?", [
    "Black t-shirt.",
    "Blue mug: Lena and Bia, who bought the cat, also bought the mug.",
    "The plush cat again.",
    "None, because the graph only answers by id."
  ], 1, "From the cat, follow COMPROU backwards to Lena and Bia, and from each forwards to the other products. The t-shirt is Davi's.");
  tf("t9", 4, 3, "A product that millions of people bought makes the traversal cheaper, because it has more ready-made links.", false,
    "The cost depends on the degree of the nodes. A very popular node is heavy and costs a lot on every traversal that passes through it.");

  /* ---------- 10. Page size and columnar indexing ---------- */
  choice("t10", 1, 1, "What is the page size of PostgreSQL and InnoDB (MySQL)?", [
    "8 KB and 16 KB.",
    "16 KB and 8 KB.",
    "4 KB for both.",
    "8 KB for both."
  ], 0, "SQL Server also uses 8 KB. The value is usually fixed at compile time or at instance creation.");
  choice("t10", 2, 2, "With rows of ~2 KB, how many pages do the 6 rows of pedidos take?", [
    "2 pages of 8 KB or 1 of 16 KB.",
    "6 pages of 8 KB or 3 of 16 KB.",
    "1 page of 8 KB or 1 of 16 KB.",
    "3 pages of 8 KB or 2 of 16 KB."
  ], 0, "4 rows fit per 8 KB page and 8 per 16 KB page.");
  choice("t10", 3, 2, "Reading order 1042 (~2 KB) in a 16 KB page. What does the database read?", [
    "Only the ~2 KB of the row.",
    "The whole page, 16 KB.",
    "The whole table.",
    "Two 8 KB pages."
  ], 1, "Every read brings a whole page. A big page helps reads in sequence and brings more junk on a point lookup.");
  tf("t10", 4, 3, "The cost of a query is counted in pages read, not in rows.", true,
    "That number reappears in every index in the following lessons. In the columnar format, the minimum and maximum of each segment also let you skip whole segments.");

  /* ---------- 11. LSM-Trees ---------- */
  order("t11", 1, 2, "Put in order the path of a write in an LSM-Tree.", [
    "Note it at the end of the WAL",
    "Put it in the memtable, and the database already answers \"written\"",
    "Memtable full: flush it as an immutable SSTable",
    "Compaction merges SSTables and discards old versions and tombstones"
  ], "Everything is append and sequence. No page in the middle of the disk is touched on the write.");
  choice("t11", 2, 2, "A 4-entry memtable and orders 1041 to 1046 arriving. What is the state after 1046?", [
    "SSTable 1 with 1041 to 1044; memtable and WAL with 1045 and 1046.",
    "SSTable 1 with 1041 to 1046.",
    "Everything in the memtable.",
    "SSTable 1 with 1045 and 1046; memtable with 1041 to 1044."
  ], 0, "The memtable fills at 4 entries and becomes SSTable 1. The next two stay in the memtable (and in the WAL).");
  choice("t11", 3, 3, "The store deletes order 1044 and updates 1042. What does the LSM do, and who cleans up afterwards?", [
    "Rewrites the old SSTable in place.",
    "Writes a tombstone for 1044 and a new version of 1042; compaction cleans up later.",
    "Deletes 1044 from the file right away.",
    "Refuses the update until compaction."
  ], 1, "The old files are immutable. The read searches the memtable and the SSTables, from newest to oldest.");
  tf("t11", 4, 3, "Since the LSM keeps all versions of the data, it works as an audit trail.", false,
    "Compaction discards old versions and tombstones. For auditing, you model an insert-only table (a ledger). Also, DynamoDB is not on the LSM list: its paper describes a B-tree and a write-ahead log.");

  /* ---------- 12. B-Tree ---------- */
  choice("t12", 1, 1, "How does the store's B-Tree (root [1043], leaves [1041, 1042] and [1043 to 1046]) find order 1042?", [
    "Reads the root, sees that 1042 < 1043 and goes down to the left leaf: 2 page reads.",
    "Reads both leaves: 2 reads.",
    "Reads only the right leaf: 1 read.",
    "Applies a hash function."
  ], 0, "The scan also reads 2 pages. With 6 rows, the two tie.");
  choice("t12", 2, 2, "With 1 million orders of 2 KB in 8 KB pages, how many pages do the scan and the B-Tree read?", [
    "250,000 and 4.",
    "4 and 250,000.",
    "1,000,000 and 4.",
    "250,000 and 250,000."
  ], 0, "Each internal-node page holds hundreds of keys. The tree grows wider, not taller.");
  tf("t12", 3, 2, "Since the keys are sorted and the leaves are linked in sequence, the B-Tree also answers ranges, like orders 1042 to 1045.", true,
    "The search finds 1042 and follows the neighboring leaves. What databases really use is the B+Tree.");
  choice("t12", 4, 3, "A leaf fills up when a new order comes in. What does the B-Tree do?", [
    "The leaf splits in two and the middle key goes up to the node above.",
    "Deletes the oldest leaf.",
    "Starts scanning the table.",
    "Creates a tombstone."
  ], 0, "The tree stays balanced and every search costs the same number of levels. The price is on the write: finding the leaf and, sometimes, splitting pages.");

  /* ---------- 13. Hashing ---------- */
  choice("t13", 1, 1, "In the store's example (4 buckets, 1042 % 4), which bucket does order 1042 land in?", [
    "Bucket 0.",
    "Bucket 1.",
    "Bucket 2.",
    "Bucket 3."
  ], 2, "1042 % 4 = 2. To read, it repeats the calculation and goes straight to bucket 2.");
  choice("t13", 2, 2, "Order 1046 also lands in bucket 2. What is that called, and how does the database find the right order?", [
    "Collision: the bucket holds a list (1042 → 1046) and the search compares the keys.",
    "Error: the database refuses the write.",
    "Tombstone: 1046 deletes 1042.",
    "Split: the bucket splits in two."
  ], 0, "Bucket 1 also has a list: 1041 and 1045.");
  choice("t13", 3, 3, "WHERE id BETWEEN 1042 AND 1045 on a hash index. What happens?", [
    "Goes straight to bucket 2.",
    "No shortcut: 1042, 1043, 1044 and 1045 land in buckets 2, 3, 0 and 1, so every bucket has to be checked.",
    "Uses the root and the leaves.",
    "Consults the inverted index."
  ], 1, "The hash spreads the keys and loses the order. For a range, the choice is the B-Tree.");
  tf("t13", 4, 3, "Hash lookup is instant: the cost is always the same, no matter how many collisions exist.", false,
    "It is constant cost on average. Collisions make the bucket's list grow, and a table that gets too full has to be rebuilt with more buckets.");

  /* ---------- 14. Inverted indexes ---------- */
  choice("t14", 1, 1, "What does the inverted index map?", [
    "Each order to the words it has.",
    "Each term to the documents where it appears.",
    "Each key to a bucket.",
    "Each column to a file."
  ], 1, "Instead of going from the order to the words, it goes from the word to the orders.");
  choice("t14", 2, 2, "In the store, what are the entries for pelúcia and caneca in the index?", [
    "pelúcia → [1042, 1043]; caneca → [1041, 1044, 1046].",
    "pelúcia → [1042]; caneca → [1041, 1044].",
    "pelúcia → [1042, 1043, 1044]; caneca → [1041, 1046].",
    "pelúcia → [1041]; caneca → [1042, 1043]."
  ], 0, "Both entries answer without opening any of the 6 orders.");
  order("t14", 3, 2, "Put in order the steps to build the index for order 1042 (gato de pelúcia).", [
    "Normalization: everything lowercase",
    "Tokenization: gato, de, pelúcia",
    "Drop words with no value, like de",
    "Write 1042 into the list of each term"
  ], "The cost goes to the write and the read stays short.");
  tf("t14", 4, 3, "The inverted index is characteristic of document databases like MongoDB.", false,
    "It is the heart of search engines (Elasticsearch, Solr, Lucene). MongoDB indexes fields with a B-Tree. In PostgreSQL, GIN is an inverted index.");

  /* ---------- 15. Write-intensive and read-intensive ---------- */
  choice("t15", 1, 1, "Which combination does the lesson suggest for a transactional scenario, like Lena paying for the plush cat?", [
    "LSM, asynchronous replication and eventual consistency.",
    "Relational database with a B-Tree and strong consistency.",
    "In-memory key-value with no durability.",
    "Columnar with eventual consistency."
  ], 1, "It calls for atomicity, ACID and an immediate read of the last write. The price is commit latency.");
  choice("t15", 2, 2, "Millions of click events per second, and none can be lost. What is the choice?", [
    "Relational with a B-Tree on every field.",
    "NoSQL with LSM (Cassandra, ScyllaDB) and asynchronous replication.",
    "In-memory hash index.",
    "Graph."
  ], 1, "You accept eventual consistency. But it is a tendency, not an obligation: Cassandra and ScyllaDB let you tune the quorum per query.");
  choice("t15", 3, 3, "The catalog is read a thousand times more than it is written, and the screens need another format. What does the lesson suggest?", [
    "A consistent primary with read replicas, a key-value cache and, if needed, CQRS with a derived read model.",
    "Swap everything for LSM.",
    "Remove the indexes.",
    "Start writing to the read replicas too."
  ], 0, "CQRS protects the source of truth from read spikes. The price is possibly stale data.");
  tf("t15", 4, 3, "DynamoDB serves write-intensive workloads well because it uses LSM.", false,
    "The DynamoDB paper describes a B-tree and a write-ahead log. It does well thanks to partitions, replication and managed scale.");

  window.QUIZ = out;
})();
