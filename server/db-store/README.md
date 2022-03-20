table: frame
columns:
    - frame: character varying
    - timestamp: bigint

convert to hypertable, each chunk have 1 day interval:
    select create_hypertable('public."frame"', 'timestamp', chunk_time_interval => 86400000);