# primário "SP"
initdb -D primary -A trust -U postgres
# em primary/postgresql.conf: port = 55432, listen_addresses = '127.0.0.1',
#   wal_level = logical, max_wal_senders = 10, max_replication_slots = 10
echo "host replication all 127.0.0.1/32 trust" >> primary/pg_hba.conf
pg_ctl -D primary -l primary.log start

# réplica "rio" (a "recife" é igual, porta 55434)
pg_basebackup -h 127.0.0.1 -p 55432 -U postgres -D rio -R -X stream -C -S slot_rio -c fast
# em rio/postgresql.conf: port = 55433, hot_standby = on
# em rio/postgresql.auto.conf: primary_conninfo = 'application_name=rio host=127.0.0.1 port=55432 user=postgres'
pg_ctl -D rio -l rio.log start

# no primário
psql -h 127.0.0.1 -p 55432 -U postgres -x -c "select application_name, state, sync_state, sent_lsn, replay_lsn, write_lag, replay_lag from pg_stat_replication"
