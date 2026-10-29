/* Question bank for the Storage, RAID and I/O quiz (English).
   Types: choice (answer = index into options), order (options already in the right order; the quiz shuffles),
   layer (answer = RAID level: 0, 1, 5, 6 or 10), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-storage-em-system-design", name: "Storage in System Design" },
    t2: { topic: "aula-2-throughput-bandwidth-iops", name: "Throughput, bandwidth and IOPS" },
    t3: { topic: "aula-3-das", name: "DAS" },
    t4: { topic: "aula-4-nas", name: "NAS" },
    t5: { topic: "aula-5-block-storage", name: "Block Storage" },
    t6: { topic: "aula-6-file-storage", name: "File Storage" },
    t7: { topic: "aula-7-object-storage", name: "Object Storage" },
    t8: { topic: "aula-8-raid-0", name: "RAID 0" },
    t9: { topic: "aula-9-raid-1", name: "RAID 1" },
    t10: { topic: "aula-10-raid-5", name: "RAID 5" },
    t11: { topic: "aula-11-raid-6", name: "RAID 6" },
    t12: { topic: "aula-12-raid-10", name: "RAID 10" },
    t13: { topic: "aula-13-resumo-raid", name: "RAID summary and comparisons" }
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
  function layer(k, n, level, prompt, answer, explain) { add(k, n, "layer", level, prompt, null, answer, explain); }
  function tf(k, n, level, prompt, answer, explain) { add(k, n, "truefalse", level, prompt, null, answer, explain); }


  /* ---------- 1. Storage in System Design ---------- */
  choice("t1", 1, 1, "In the store, what is storage?", [
    "The place where the system keeps data so it survives a restart.",
    "RAM, which is erased when powered off.",
    "The cable that connects the server to the internet.",
    "The program that draws the site's pages."
  ], 0, "Storage is persistence: the data is still there after the program closes or the machine shuts down.");
  choice("t1", 2, 2, "Which of the store's data most needs low latency?", [
    "The orders in the database.",
    "The nightly backups.",
    "The old product photos.",
    "Logs from months ago."
  ], 0, "The database is read and written all the time, at random spots: every millisecond counts at checkout.");
  choice("t1", 3, 1, "What is the typical latency order, from fastest to slowest?", [
    "NVMe (~0.1 ms), SATA SSD (~0.2 ms), HDD (5 to 10 ms).",
    "HDD, SATA SSD, NVMe.",
    "SATA SSD, NVMe, HDD.",
    "They all have the same latency; only capacity changes."
  ], 0, "NVMe talks straight to the flash over PCIe; the HDD has to move its head mechanically.");
  tf("t1", 4, 1, "Keeping everything in the store on a single disk is a single point of failure.", true,
    "If that disk dies, orders, photos and everything else go with it. That is why replicas, RAID and backups exist.");
  choice("t1", 5, 3, "Product photos (~1.2 TB, like gato.jpg, written once, read many times) and the orders database (200 GB, small and random). What is the right reasoning?", [
    "Each one asks for a different storage: photos, cheap and scalable space; database, low latency.",
    "Both should go on the same NVMe disk, to keep it simple.",
    "The database goes on the cheapest disk, because it is the smallest.",
    "The photos go on the fastest disk, because they are bigger."
  ], 0, "Size and access pattern differ. Paying for NVMe per photo is a waste and a database on a slow disk stalls checkout.");

  /* ---------- 2. Throughput, bandwidth and IOPS ---------- */
  choice("t2", 1, 1, "What does IOPS measure?", [
    "How many read or write operations the disk does per second.",
    "How many MB per second the cable can take.",
    "How much free space is left on the disk.",
    "The round-trip time on the network."
  ], 0, "IOPS counts requests per second, regardless of the size of each one.");
  choice("t2", 2, 2, "A volume does 3,000 IOPS with 8 KB blocks. What is the throughput?", [
    "24 MB/s (3,000 x 8 KB).",
    "375 MB/s.",
    "3,000 MB/s.",
    "125 MB/s."
  ], 0, "3,000 x 8 KB = 24,000 KB/s, or about 24 MB/s. The bottleneck is IOPS, because the 125 MB/s bandwidth is more than enough.");
  choice("t2", 3, 2, "A default gp3 (3,000 IOPS and 125 MB/s) reads 64 KB blocks. What is the real throughput and the bottleneck?", [
    "125 MB/s, limited by bandwidth (3,000 x 64 KB would give 192 MB/s).",
    "192 MB/s, limited by IOPS.",
    "125 MB/s, limited by IOPS.",
    "3,000 MB/s, no bottleneck."
  ], 0, "3,000 x 64 KB = 192 MB/s, but the link only carries 125. The lower of the two wins, and here it is the bandwidth.");
  tf("t2", 4, 2, "If the bottleneck is the link's bandwidth, buying more IOPS increases the throughput.", false,
    "More IOPS doesn't help when the pipe is already full. You need more bandwidth or less data.");
  choice("t2", 5, 3, "The 7200 rpm HDD does ~150 IOPS. The store writes large sequential videos and, on another disk, the database with 8 KB blocks. Which disk suffers more with the database?", [
    "The HDD: 150 x 8 KB is only ~1.2 MB/s on random access.",
    "The NVMe, because its blocks are too small.",
    "Neither, because IOPS don't depend on the access pattern.",
    "The HDD only suffers with videos, never with the database."
  ], 0, "The HDD has to move its head for each random access: 150 operations of 8 KB give about 1.2 MB/s.");

  /* ---------- 3. DAS ---------- */
  choice("t3", 1, 1, "What is DAS?", [
    "A disk attached directly to the server, with no network in between.",
    "A file server accessed over the network.",
    "An object service in the cloud.",
    "A RAID level with parity."
  ], 0, "DAS is Direct-Attached Storage: SATA, USB or NVMe plugged straight into the machine.");
  choice("t3", 2, 1, "What is the main advantage of DAS?", [
    "Low latency and high performance, because there are fewer hops.",
    "Several servers use the same disk at the same time.",
    "It scales horizontally by itself.",
    "It has automatic redundancy."
  ], 0, "With no network in the path, access is as short as it gets. Sharing and scaling are the weak points.");
  tf("t3", 3, 2, "Two of the store's servers can read the same DAS disk with no extra setup.", false,
    "DAS is tied to the machine it sits in. To share, you need a NAS or another network storage.");
  choice("t3", 4, 2, "What is the main limit of growing a DAS?", [
    "You have to add more disks to the machine and migrate data by hand.",
    "The network gets saturated.",
    "DAS doesn't accept SSDs.",
    "DAS doesn't hold large files."
  ], 0, "Few disks fit in a server, so growth is upward, not sideways.");
  choice("t3", 5, 3, "The store's server with an internal NVMe dies. What happens to the disk?", [
    "It becomes inaccessible with it, unless there is a replica or RAID.",
    "Another server takes over the disk automatically.",
    "The disk stays accessible over the network.",
    "The data migrates to the cloud by itself."
  ], 0, "DAS is a single point of failure: without a replica, the machine and the disk go down together.");

  /* ---------- 4. NAS ---------- */
  choice("t4", 1, 1, "What is NAS?", [
    "A file server on the network, used by many clients at the same time.",
    "A disk attached directly to the server.",
    "A raw block volume, with no filesystem.",
    "A RAID level."
  ], 0, "NAS is Network Attached Storage: folders shared over the network.");
  choice("t4", 2, 1, "Which NAS protocol is the most common between Linux and Unix?", [
    "NFS.", "SMB.", "SMTP.", "DNS."
  ], 0, "NFS is the Linux and Unix one. SMB is the Windows one.");
  choice("t4", 3, 2, "What limits a NAS's performance?", [
    "The network's latency and bandwidth, plus the NAS's own disk.",
    "Only the color of the cable.",
    "The number of folders.",
    "Nothing, it is always faster than a local disk."
  ], 0, "Each operation crosses the network: it adds latency and uses the link's bandwidth.");
  choice("t4", 4, 2, "A 1 Gbps link carries at most how many MB/s?", [
    "About 125 MB/s.", "About 1,000 MB/s.", "About 12.5 MB/s.", "About 1.25 GB/s."
  ], 0, "1 Gbps = 1,000 Mbit/s; divided by 8 bits per byte gives 125 MB/s.");
  tf("t4", 5, 3, "Three of the store's web servers need the same photo folder: a NAS meets that need better than a DAS on each server.", true,
    "The NAS is a single place that everyone mounts. With DAS, each server would have a different copy.");

  /* ---------- 5. Block Storage ---------- */
  choice("t5", 1, 1, "What is block storage?", [
    "A raw disk split into fixed-size blocks, each with an address.",
    "A shared folder tree.",
    "Objects with a key inside buckets.",
    "A mirrored copy of two disks."
  ], 0, "In block storage, whoever uses the volume decides what to keep: a filesystem or a database directly.");
  choice("t5", 2, 1, "What is an LBA?", [
    "The block's number on the disk (Logical Block Address).",
    "The name of the file on the disk.",
    "The disk's speed in MB/s.",
    "The type of RAID used."
  ], 0, "LBA is the block's address: block 0, block 1, block 2048.");
  choice("t5", 3, 2, "gato.jpg is 2.4 MB (2,457,600 bytes). In 4 KB blocks, how many blocks does it take?", [
    "600.", "1,024.", "2,400.", "150."
  ], 0, "2,457,600 bytes / 4,096 = 600 blocks (on the store's volume, LBA 2048 to 2647).");
  choice("t5", 4, 2, "Which AWS service is block storage?", [
    "EBS.", "S3.", "EFS.", "CloudFront."
  ], 0, "EBS delivers block volumes that attach to an instance. S3 is object and EFS is file.");
  tf("t5", 5, 3, "EBS is normally used by one instance at a time and doesn't share files by itself.", true,
    "To share folders between servers you use file storage (like EFS). EBS is a machine's disk.");

  /* ---------- 6. File Storage ---------- */
  choice("t6", 1, 1, "How is a file identified in file storage?", [
    "By the path plus the name, and there can't be two equal names in the same folder.",
    "By a unique key inside a bucket.",
    "By the block number (LBA).",
    "By the server's IP."
  ], 0, "The identity is the folder tree: path + name.");
  choice("t6", 2, 1, "What is an inode?", [
    "The file's record on Linux, with size, owner, dates and where the blocks are.",
    "A type of SSD.",
    "The name of the bucket.",
    "A network protocol."
  ], 0, "The name lives in the folder; the inode holds the metadata and points to the blocks.");
  choice("t6", 3, 2, "What does the filesystem do?", [
    "It turns the disk's blocks into named files and folders.",
    "It replicates the data to another region.",
    "It calculates the RAID parity.",
    "It bills for disk usage."
  ], 0, "It is the layer that gives blocks a name and a folder. ext4, XFS and NTFS are examples.");
  choice("t6", 4, 2, "What is file storage's weak point at large scale?", [
    "The hierarchy: folders with millions of files get slow.",
    "It has no metadata.",
    "It only works with one client.",
    "It doesn't accept large files."
  ], 0, "The tree structure complicates scale. That is why object storage uses a flat key.");
  tf("t6", 5, 2, "File storage shared by several clients is usually accessed over NFS or SMB.", true,
    "NFS and SMB mount the remote folder as if it were local. That is the case for NAS and EFS.");

  /* ---------- 7. Object Storage ---------- */
  choice("t7", 1, 1, "What makes up an object in object storage?", [
    "Content, metadata and a unique key.",
    "Only the content.",
    "A folder path and an inode.",
    "A block number and a parity."
  ], 0, "The object carries everything together: the bytes, the data about them and the key that identifies it.");
  tf("t7", 2, 2, "In S3, produtos/gatos/ is a real folder inside the loja-fotos bucket.", false,
    "The \"folders\" are just part of the key's name. The bucket is flat, with no real tree.");
  choice("t7", 3, 1, "How do you access object storage?", [
    "Through an HTTP API (PUT, GET, DELETE).",
    "By mounting a disk with mount.",
    "Through a SATA cable.",
    "Through an ext4 filesystem."
  ], 0, "It is a network call per object, with nothing to mount.");
  choice("t7", 4, 2, "Which use does NOT fit object storage?", [
    "Transactional database.",
    "Product photos.",
    "Backups.",
    "Large videos."
  ], 0, "The object is replaced whole and each access is a network call. A database needs blocks and low latency.");
  choice("t7", 5, 3, "The store wants to keep nightly backups with very high durability and low cost. What is the best choice?", [
    "Object storage, in another region, with lifecycle rules.",
    "A RAID 0 on the store's server.",
    "A DAS on the same server as the database.",
    "RAM."
  ], 0, "Object storage replicates by itself and is cheap. A backup on the same server dies with it.");

  /* ---------- 8. RAID 0 ---------- */
  choice("t8", 1, 1, "What does RAID 0 do?", [
    "It slices the data and spreads it across the disks, adding up the speed.",
    "It writes each piece of data to two disks.",
    "It keeps one distributed parity.",
    "It keeps two parities."
  ], 0, "It is striping: performance only, no redundancy.");
  choice("t8", 2, 2, "What is the capacity of a RAID 0 with 4 disks of 1 TB?", [
    "4 TB.", "3 TB.", "2 TB.", "1 TB."
  ], 0, "RAID 0 adds it all up: 4 x 1 = 4 TB, 100% used.");
  choice("t8", 3, 2, "How many disks can fail in a RAID 0 without data loss?", [
    "None.", "One.", "Two.", "Half."
  ], 0, "Every file has pieces on all the disks. Lose one, lose everything.");
  tf("t8", 4, 2, "The more disks in a RAID 0, the higher the chance of losing all the data.", true,
    "Any disk that fails brings down the set. With 4 disks there are 4 chances of failure.");
  layer("t8", 5, 2, "The store wants a temporary image-rendering area, fast, where losing the files doesn't matter. Which RAID level?", 0,
    "Rebuildable data asks for speed, not protection: RAID 0.");

  /* ---------- 9. RAID 1 ---------- */
  choice("t9", 1, 1, "What does RAID 1 do?", [
    "It writes everything to two identical disks (mirror).",
    "It stripes the data with no copy.",
    "It calculates parity with XOR.",
    "It joins pairs into stripes."
  ], 0, "Mirroring: each write goes to both disks.");
  choice("t9", 2, 2, "What is the usable capacity of 2 disks of 1 TB in RAID 1?", [
    "1 TB.", "2 TB.", "0.5 TB.", "1.5 TB."
  ], 0, "Both disks hold the same thing, so only one is used: 50%.");
  choice("t9", 3, 2, "What is RAID 1's write penalty?", [
    "2.", "1.", "4.", "6."
  ], 0, "Each logical write becomes two physical ones, one per disk.");
  tf("t9", 4, 2, "If someone runs a wrong DELETE on the database, RAID 1 lets you recover the table.", false,
    "The mirror copies everything instantly, including the mistake. RAID is not a backup.");
  layer("t9", 5, 2, "A small server needs protection against a single disk failure, and the store wants it as simple as possible, with 2 disks. Which level?", 1,
    "Two mirrored disks: RAID 1.");

  /* ---------- 10. RAID 5 ---------- */
  choice("t10", 1, 1, "What is the capacity of RAID 5 with 4 disks of 1 TB?", [
    "3 TB.", "4 TB.", "2 TB.", "1 TB."
  ], 0, "(N - 1) x size = 3 x 1 = 3 TB (75%). The equivalent of one disk goes to parity.");
  choice("t10", 2, 1, "How many disks can fail in RAID 5?", [
    "One.", "None.", "Two.", "Half."
  ], 0, "The parity lets you rebuild a lost disk, but only one at a time.");
  choice("t10", 3, 2, "Blocks A1 = 1011, A2 = 0110, A3 = 0101. What is the parity P1 (XOR of the three)?", [
    "1000.", "1111.", "0000.", "1010."
  ], 0, "1011 xor 0110 = 1101; 1101 xor 0101 = 1000.");
  choice("t10", 4, 2, "How many disk operations does a small write generate in RAID 5?", [
    "4: reads old data and parity, writes new data and parity.",
    "2: writes the data to two disks.",
    "1: just writes the data.",
    "6: writes two parities."
  ], 0, "It is RAID 5's write penalty: 2 reads + 2 writes.");
  choice("t10", 5, 3, "Why is a RAID 5 rebuild risky, especially if the disks were 10 TB?", [
    "It reads all the other disks for hours or days, and a read error (URE) at that moment can cause a loss.",
    "It deletes the new data to save space.",
    "The new disk is always defective.",
    "The parity is recalculated with the store shut down."
  ], 0, "Rebuilding a 10 TB disk at 150 MB/s takes more than 18 hours (with 1 TB, about 2 hours). With no spare parity, a URE along the way is a loss.");
  tf("t10", 6, 2, "In RAID 5, the parity always sits on a dedicated disk.", false,
    "It is distributed: it rotates from disk to disk on each row, so no single disk is overloaded.");

  /* ---------- 11. RAID 6 ---------- */
  choice("t11", 1, 1, "What does RAID 6 have that RAID 5 doesn't?", [
    "A second parity, which lets you lose two disks.",
    "A full mirror.",
    "No parity.",
    "Faster disks."
  ], 0, "P and Q: two equations, two unknown blocks recoverable.");
  choice("t11", 2, 2, "What is the capacity of RAID 6 with 5 disks of 1 TB?", [
    "3 TB.", "4 TB.", "2 TB.", "5 TB."
  ], 0, "(N - 2) x size = 3 x 1 = 3 TB (60%).");
  choice("t11", 3, 2, "What is RAID 6's write penalty?", [
    "6.", "4.", "2.", "1."
  ], 0, "It reads data, old P and Q and writes data, new P and Q: 3 reads + 3 writes.");
  choice("t11", 4, 1, "What is the minimum number of disks for RAID 6?", [
    "4.", "2.", "3.", "6."
  ], 0, "That is two data disks and two parity disks, at minimum.");
  layer("t11", 5, 3, "The store keeps a photo archive on 12 large disks, data for years, and can't lose anything if a second disk fails during the rebuild. Which level?", 6,
    "Many large disks and a long rebuild: RAID 6's double parity covers the second failure.");

  /* ---------- 12. RAID 10 ---------- */
  choice("t12", 1, 1, "How is RAID 10 built?", [
    "Mirrored pairs (RAID 1) with the data striped across them (RAID 0).",
    "Stripes with one distributed parity.",
    "Two disks with an exact copy.",
    "Four disks with no copy at all."
  ], 0, "RAID 1+0: mirror first, then stripe across the pairs.");
  choice("t12", 2, 2, "What is the capacity of RAID 10 with 4 disks of 1 TB?", [
    "2 TB.", "4 TB.", "3 TB.", "1 TB."
  ], 0, "Half the total: 4 x 1 / 2 = 2 TB.");
  choice("t12", 3, 3, "RAID 10 with 4 disks (pairs D1-D2 and D3-D4). D1 and D3 fail. What happens?", [
    "The data survives: one disk from each pair is left.",
    "Everything is lost.",
    "Only the D1-D2 pair's data is lost.",
    "The RAID turns into RAID 0 and stops."
  ], 0, "Each pair still has a disk with the full copy.");
  choice("t12", 4, 3, "RAID 10 with 4 disks (pairs D1-D2 and D3-D4). D1 and D2 fail. What happens?", [
    "Everything is lost: the whole D1-D2 pair is gone.",
    "The data survives, because D3 and D4 are there.",
    "Only half the files are lost.",
    "The RAID rebuilds D1 and D2 from D3 and D4."
  ], 0, "The data is striped across the pairs. Without the D1-D2 pair, pieces of every file are missing.");
  layer("t12", 5, 3, "The orders database is write-heavy, can't stop, and has the budget to lose half the space. Which level?", 10,
    "Write penalty 2 and a simple rebuild: RAID 10 is the classic choice for transactions.");

  /* ---------- 13. Summary and comparisons ---------- */
  choice("t13", 1, 2, "With 4 disks of 1 TB each, what is the usable capacity order, largest to smallest, among RAID 0, 5 and 10?", [
    "RAID 0 (4 TB), RAID 5 (3 TB), RAID 10 (2 TB).",
    "RAID 5 (4 TB), RAID 0 (3 TB), RAID 10 (2 TB).",
    "RAID 10 (4 TB), RAID 5 (3 TB), RAID 0 (2 TB).",
    "All three give 4 TB."
  ], 0, "0: N x S = 4. 5: (N - 1) x S = 3. 10: N x S / 2 = 2.");
  order("t13", 2, 2, "Put the write penalties in order, from lowest to highest.", [
    "RAID 0 (1)",
    "RAID 1 and RAID 10 (2)",
    "RAID 5 (4)",
    "RAID 6 (6)"
  ], "RAID 0 duplicates nothing; a mirror writes 2; RAID 5 does 4 I/Os; RAID 6 does 6.");
  choice("t13", 3, 2, "With 150 IOPS per disk, what is the theoretical random write of a RAID 5 with 4 disks?", [
    "150 IOPS (4 x 150 / 4).",
    "600 IOPS.",
    "300 IOPS.",
    "75 IOPS."
  ], 0, "The raw total is 4 x 150 = 600; the penalty of 4 divides it by four: 150. RAID 10 with the same 4 disks does 4 x 150 / 2 = 300.");
  choice("t13", 4, 2, "Which combination of tolerated failures is CORRECT?", [
    "RAID 0: 0; RAID 5: 1; RAID 6: 2.",
    "RAID 0: 1; RAID 5: 1; RAID 6: 2.",
    "RAID 0: 0; RAID 5: 2; RAID 6: 3.",
    "RAID 0: 1; RAID 5: 2; RAID 6: 2."
  ], 0, "RAID 0 tolerates nothing. RAID 5 tolerates 1 and RAID 6 tolerates 2.");
  tf("t13", 5, 1, "RAID replaces backup.", false,
    "RAID protects against disk failure, not against human error, ransomware, fire or bugs. Backups live outside the set.");

  window.QUIZ = out;
})();
